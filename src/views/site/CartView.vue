<script setup>
import { ref, onMounted, computed, reactive, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

// ============================================================================
// 1. STATE QUẢN LÝ DỮ LIỆU
// ============================================================================
const cartItems = ref([]);
const selectedProductIds = ref([]); // Mảng chứa ID các sản phẩm được tích chọn để mua
const addressError = ref(null);

// [QUẢN LÝ ĐỊA CHỈ]: Lưu trữ danh sách Sổ địa chỉ của người dùng
const savedAddresses = ref([]);
const selectedAddressId = ref(null); // ID của địa chỉ được chọn để giao hàng

// Quản lý Modal (Popup) Bootstrap
let checkoutModalInstance = null;
let qrModalInstance = null;

// [THANH TOÁN ONLINE]: Quản lý đơn hàng vừa tạo và vòng lặp quét (Polling)
const createdOrder = ref(null); 
let pollingInterval = null;     

// Thông tin ngân hàng của Shop (Sẽ lấy từ API)
const shopBank = ref({
    bankId: '',
    accountNo: '',
    accountName: ''
});

// Dữ liệu đơn hàng chuẩn bị gửi đi
const orderData = reactive({
    notes: '', // Khách hàng chỉ được phép nhập ghi chú, không được nhập địa chỉ
    paymentMethod: 'COD',
    voucherCode: '' // THÊM: Mã voucher áp dụng
});

// ========== THÊM CÁC STATE CHO VOUCHER ==========
const applyingVoucher = ref(false);
const voucherMessage = ref('');
const voucherMessageType = ref(''); // 'text-success', 'text-danger', 'text-warning'
const voucherDiscount = ref(0);
const appliedVoucher = ref(null);

// ========== THÊM: HÀM ĐÁNH DẤU VOUCHER ĐÃ DÙNG ==========
const markVoucherAsUsed = (voucherCode) => {
    // Lấy danh sách voucher đã dùng
    let usedVouchers = JSON.parse(localStorage.getItem('usedVouchers') || '[]');
    
    // Nếu chưa có thì thêm vào
    if (!usedVouchers.includes(voucherCode)) {
        usedVouchers.push(voucherCode);
        localStorage.setItem('usedVouchers', JSON.stringify(usedVouchers));
    }
    
    // Cập nhật trạng thái used trong danh sách voucher đã lưu
    let savedVouchers = JSON.parse(localStorage.getItem('savedVouchers') || '[]');
    const index = savedVouchers.findIndex(v => v.code === voucherCode);
    if (index !== -1) {
        savedVouchers[index].used = true;
        localStorage.setItem('savedVouchers', JSON.stringify(savedVouchers));
    }
};
// ========== KẾT THÚC THÊM ==========

// ============================================================================
// 2. COMPUTED (Tính toán dữ liệu tự động)
// ============================================================================
const isAuthenticated = computed(() => authStore.isAuthenticated);

// Lọc ra danh sách các mặt hàng đang được đánh dấu (Tick) trong giỏ
const selectedItems = computed(() => {
    return cartItems.value.filter(item => selectedProductIds.value.includes(item.product.id));
});

// Tính tổng tiền của các mặt hàng ĐANG ĐƯỢC CHỌN
const totalSelectedAmount = computed(() => {
    return selectedItems.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
});

// THÊM: Tính tổng tiền sau khi áp dụng voucher
const finalTotalAmount = computed(() => {
    let total = totalSelectedAmount.value;
    if (voucherDiscount.value > 0 && voucherDiscount.value <= total) {
        return total - voucherDiscount.value;
    }
    return total;
});

// THÊM: Lấy icon cho thông báo voucher
const voucherMessageIcon = computed(() => {
    if (voucherMessageType.value === 'text-success') return 'bi-check-circle-fill';
    if (voucherMessageType.value === 'text-danger') return 'bi-exclamation-triangle-fill';
    return 'bi-info-circle-fill';
});

// CHECKBOX CHỌN TẤT CẢ (Writable Computed)
// Ý nghĩa: Tự động đồng bộ trạng thái giữa nút "Chọn tất cả" và các nút con
const selectAll = computed({
    // Get: Xác định xem nút "Chọn tất cả" có đang được tick hay không
    // Trả về true nếu giỏ hàng có đồ VÀ số lượng nút con được tick BẰNG với tổng số hàng trong giỏ
    get: () => {
        return cartItems.value.length > 0 && selectedProductIds.value.length === cartItems.value.length;
    },
    // Set: Xử lý khi người dùng bấm vào nút "Chọn tất cả"
    set: (value) => {
        if (value) {
            // Nếu đánh dấu chọn tất cả -> Lấy toàn bộ ID sản phẩm đẩy vào mảng selectedProductIds
            selectedProductIds.value = cartItems.value.map(item => item.product.id);
        } else {
            // Nếu bỏ chọn tất cả -> Làm rỗng mảng
            selectedProductIds.value = [];
        }
    }
});

// [TÍNH NĂNG MÃ QR]: Tự động render link ảnh mã VietQR kèm theo số tiền và mã đơn hàng
const qrCodeUrlCreated = computed(() => {
    if (!createdOrder.value || !shopBank.value.bankId) return '';
    const amount = Math.round(createdOrder.value.totalAmount);
    const content = `DH${createdOrder.value.id}`;
    return `https://img.vietqr.io/image/${shopBank.value.bankId}-${shopBank.value.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
});

// ============================================================================
// 3. HELPERS (Các hàm tiện ích)
// ============================================================================
const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://placehold.co/100x100?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;

    const baseUrl = 'http://localhost:8080';
    if (imagePath.startsWith('imgs/')) {
        return `${baseUrl}/${imagePath}`;
    }
    return `${baseUrl}/imgs/${imagePath}`;
};

const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
};

// THÊM: Format ngày cho voucher
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
};

// ============================================================================
// 4. LOGIC XỬ LÝ GIỎ HÀNG (Lấy, Thêm, Xóa, Sửa số lượng)
// ============================================================================
const fetchCartItems = async () => {
    if (!isAuthenticated.value) return;
    try {
        const response = await apiClient.get('/cart');
        cartItems.value = response.data;
        
        // Mặc định: Auto-tick (chọn tất cả) khi vừa vào trang giỏ hàng
        if(cartItems.value.length > 0 && selectedProductIds.value.length === 0) {
            selectedProductIds.value = cartItems.value.map(item => item.product.id);
        }
    } catch (error) { console.error('Lỗi tải giỏ hàng:', error); }
};

const fetchBankInfo = async () => {
    try {
        shopBank.value = { bankId: 'TPB', accountNo: '0901111222', accountName: 'TRAI CAY BAY SHOP' };
    } catch (error) { console.error('Lỗi bank info:', error); }
};

// ========== THÊM: HÀM ÁP DỤNG VOUCHER ==========
const applyVoucher = async () => {
    if (!orderData.voucherCode || orderData.voucherCode.trim() === '') {
        voucherMessage.value = 'Vui lòng nhập mã voucher!';
        voucherMessageType.value = 'text-warning';
        return;
    }
    
    applyingVoucher.value = true;
    voucherMessage.value = '';
    voucherDiscount.value = 0;
    
    try {
        const code = orderData.voucherCode.toUpperCase().trim();
        const response = await apiClient.get(`/vouchers/${code}`);
        const voucher = response.data;
        
        // Kiểm tra voucher có công khai không
        if (voucher.visibility !== 'public') {
            voucherMessage.value = 'Mã voucher không hợp lệ!';
            voucherMessageType.value = 'text-danger';
            appliedVoucher.value = null;
            return;
        }
        
        // Kiểm tra trạng thái
        if (voucher.status !== 'published') {
            voucherMessage.value = 'Mã voucher chưa được kích hoạt!';
            voucherMessageType.value = 'text-danger';
            appliedVoucher.value = null;
            return;
        }
        
        // Kiểm tra ngày hiệu lực
        const today = new Date();
        const startDate = new Date(voucher.startDate);
        const endDate = new Date(voucher.expiryDate);
        
        if (today < startDate) {
            voucherMessage.value = `Voucher có hiệu lực từ ${formatDate(voucher.startDate)}!`;
            voucherMessageType.value = 'text-warning';
            appliedVoucher.value = null;
            return;
        }
        
        if (today > endDate) {
            voucherMessage.value = 'Voucher đã hết hạn!';
            voucherMessageType.value = 'text-danger';
            appliedVoucher.value = null;
            return;
        }
        
        // Kiểm tra số lượng còn
        if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
            voucherMessage.value = 'Voucher đã hết số lượng sử dụng!';
            voucherMessageType.value = 'text-danger';
            appliedVoucher.value = null;
            return;
        }
        
        // ========== THÊM: KIỂM TRA SỐ LẦN USER ĐÃ DÙNG VOUCHER ==========
        try {
            const usageResponse = await apiClient.get(`/orders/check-voucher-usage/${code}`);
            const userUsageCount = usageResponse.data;
            if (userUsageCount >= voucher.perUserLimit) {
                voucherMessage.value = `Bạn đã sử dụng voucher này ${userUsageCount} lần. Giới hạn mỗi người chỉ ${voucher.perUserLimit} lần!`;
                voucherMessageType.value = 'text-danger';
                appliedVoucher.value = null;
                voucherDiscount.value = 0;
                return;
            }
        } catch (error) {
            console.error('Lỗi kiểm tra số lần sử dụng:', error);
        }
        // ========== KẾT THÚC THÊM ==========
        
        // Kiểm tra điều kiện đơn hàng tối thiểu
        if (voucher.minOrderValue > 0 && voucher.minOrderValue > totalSelectedAmount.value) {
            voucherMessage.value = `Đơn hàng tối thiểu ${formatPrice(voucher.minOrderValue)} mới được áp dụng!`;
            voucherMessageType.value = 'text-warning';
            appliedVoucher.value = null;
            return;
        }
        
        // Tính số tiền giảm
        let discount = 0;
        if (voucher.type === 'percentage') {
            discount = (totalSelectedAmount.value * voucher.value) / 100;
            // Giới hạn giảm tối đa (nếu có)
            if (voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0 && discount > voucher.maxDiscountAmount) {
                discount = voucher.maxDiscountAmount;
            }
        } else {
            discount = voucher.value;
            if (discount > totalSelectedAmount.value) {
                discount = totalSelectedAmount.value;
            }
        }
        
        voucherDiscount.value = discount;
        appliedVoucher.value = voucher;
        voucherMessage.value = `Áp dụng thành công! Giảm ${voucher.type === 'percentage' ? voucher.value + '%' : formatPrice(voucher.value)}`;
        voucherMessageType.value = 'text-success';
        
    } catch (error) {
        console.error('Lỗi áp dụng voucher:', error);
        voucherMessage.value = 'Mã voucher không hợp lệ!';
        voucherMessageType.value = 'text-danger';
        voucherDiscount.value = 0;
        appliedVoucher.value = null;
    } finally {
        applyingVoucher.value = false;
    }
};

// [TÍNH NĂNG ĐIỀU CHỈNH SỐ LƯỢNG]: Gọi API cập nhật ngay khi bấm nút +/-
const updateQuantityAPI = async (cartId, newQuantity) => {
    if (newQuantity === null || newQuantity <= 0) { 
        removeItem(cartId); 
        return; 
    }
    
    newQuantity = Math.round(newQuantity * 10) / 10; 
    
    try {
        const response = await apiClient.put(`/cart/${cartId}?quantity=${newQuantity}`);
        cartItems.value = response.data;
    } catch (error) {
        let msg = error.response?.data?.message || error.response?.data || 'Không thể cập nhật';
        Swal.fire('Lỗi', msg, 'error');
        fetchCartItems(); 
    }
};

const increaseQuantity = (item) => { updateQuantityAPI(item.id, item.quantity + 0.5); };
const decreaseQuantity = (item) => { 
    if(item.quantity > 0.5) updateQuantityAPI(item.id, item.quantity - 0.5); 
    else removeItem(item.id); 
};
const onQuantityInputChange = (item, event) => { 
    const val = parseFloat(event.target.value); 
    if(!isNaN(val)) updateQuantityAPI(item.id, val); 
};

// [TÍNH NĂNG XÓA KHỎI GIỎ HÀNG]
const removeItem = async (cartId) => {
    const result = await Swal.fire({ title: 'Xác nhận xóa?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
    if (result.isConfirmed) {
        try {
            const res = await apiClient.delete(`/cart/${cartId}`);
            cartItems.value = res.data; 
            
            // Xóa item khỏi danh sách được tick (selectedProductIds) nếu nó bị xóa khỏi giỏ
            const currentProductIds = cartItems.value.map(i => i.product.id);
            selectedProductIds.value = selectedProductIds.value.filter(id => currentProductIds.includes(id));
        } catch (e) { console.error(e); }
    }
};

// ============================================================================
// 5. LOGIC THANH TOÁN (CHECKOUT) VÀ RÀNG BUỘC ĐỊA CHỈ
// ============================================================================

// Lấy danh sách địa chỉ từ Profile
const fetchSavedAddresses = async () => {
    try {
        const res = await apiClient.get('/addresses');
        savedAddresses.value = res.data;
        
        // Nếu có địa chỉ, tự động đánh dấu tick vào địa chỉ mặc định (hoặc địa chỉ đầu tiên)
        if (savedAddresses.value.length > 0) {
            const defaultAddr = savedAddresses.value.find(a => a.isDefault);
            selectedAddressId.value = defaultAddr ? defaultAddr.id : savedAddresses.value[0].id;
        } 
    } catch (err) {
        console.error("Lỗi lấy sổ địa chỉ:", err);
    }
};

// [TÍNH NĂNG RÀNG BUỘC ĐỊA CHỈ MỚI]: Bấm nút "Tiến hành đặt hàng"
const checkout = async () => {
    // 1. Kiểm tra phải tick ít nhất 1 sản phẩm
    if (selectedItems.value.length === 0) return Swal.fire('Thông báo', 'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán.', 'info');
    
    // 2. Lấy dữ liệu sổ địa chỉ
    if (isAuthenticated.value) {
        await fetchSavedAddresses();
        
        // NẾU CHƯA CÓ ĐỊA CHỈ NÀO -> CHẶN LẠI VÀ CHUYỂN HƯỚNG TỚI TRANG PROFILE
        if (savedAddresses.value.length === 0) {
            Swal.fire({
                title: 'Thiếu thông tin giao hàng',
                text: 'Vui lòng thiết lập thông tin cá nhân và địa chỉ trước khi đặt mua!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Đi tới thiết lập',
                cancelButtonText: 'Đóng'
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push('/profile'); // Chuyển thẳng tới trang hồ sơ cá nhân
                }
            });
            return; // Chặn không cho thực thi lệnh mở Modal bên dưới
        }
    }
    
    // 3. Đã qua các bước kiểm tra -> Mở Modal Thanh Toán
    if (checkoutModalInstance) checkoutModalInstance.show();
};

// [TÍNH NĂNG ĐẶT HÀNG]: Gửi lệnh lên Backend
const submitOrder = async () => {
    addressError.value = null;

    if (!selectedAddressId.value) {
        addressError.value = "Vui lòng chọn một địa chỉ giao hàng.";
        return;
    }

    // Tìm trong mảng savedAddresses xem địa chỉ nào khớp với ID được chọn
    const addr = savedAddresses.value.find(a => a.id === selectedAddressId.value);
    
    let finalRecipientName = addr.fullname;
    let finalRecipientPhone = addr.phone;
    let finalShippingAddress = addr.addressLine + ', ' + addr.ward + ', ' + addr.district + ', ' + addr.province;

    // Đóng gói DTO (Data Transfer Object) để gửi lên Server
    const orderDTO = {
        recipientName: finalRecipientName,
        recipientPhone: finalRecipientPhone,
        shippingAddress: finalShippingAddress,
        notes: orderData.notes,
        paymentMethod: orderData.paymentMethod,
        voucherCode: appliedVoucher.value ? appliedVoucher.value.code : null, // THAY ĐỔI: gửi voucher đã áp dụng
        items: selectedItems.value.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
        }))
    };

    try {
        const res = await apiClient.post('/orders', orderDTO);
        if (checkoutModalInstance) checkoutModalInstance.hide(); // Đóng form thanh toán

        // Xử lý nhánh rẽ: Thanh toán Bank vs Thanh toán COD
        if (orderData.paymentMethod === 'BANK') {
            createdOrder.value = res.data; 
            if (qrModalInstance) qrModalInstance.show(); // Bật form QR
            startPollingOrder(createdOrder.value.id); // Chạy tiến trình kiểm tra tiền vào
        } else {
            await Swal.fire({ title: 'Thành công!', text: 'Đơn hàng đã được tạo.', icon: 'success' });
            
            // ========== THÊM: PHÁT SỰ KIỆN ĐỂ ĐÁNH DẤU VOUCHER ĐÃ DÙNG ==========
            if (appliedVoucher.value) {
                markVoucherAsUsed(appliedVoucher.value.code);
                window.dispatchEvent(new CustomEvent('voucher-used', { 
                    detail: { code: appliedVoucher.value.code } 
                }));
            }
            // ========== KẾT THÚC THÊM ==========
            
            router.push('/order-history'); // Chuyển sang lịch sử đơn
        }
    } catch (error) {
        console.error(error);
        let errorMsg = error.response?.data?.message || error.response?.data || 'Có lỗi xảy ra.';
        Swal.fire('Lỗi đặt hàng', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg), 'error');
    }
};

// [POLLING KIỂM TRA THANH TOÁN QR]
const startPollingOrder = (orderId) => {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
        try {
            const res = await apiClient.get(`/orders/${orderId}`);
            const status = res.data.status;
            if (status === 'CONFIRMED' || status === 'PAID' || status === 'COMPLETED') { 
                clearInterval(pollingInterval); 
                if (qrModalInstance) qrModalInstance.hide();
                await Swal.fire({
                    title: 'Thanh toán thành công!',
                    text: 'Đơn hàng đã được xác nhận.',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false
                });
                
                // ========== THÊM: PHÁT SỰ KIỆN CHO THANH TOÁN BANK ==========
                if (appliedVoucher.value) {
                    markVoucherAsUsed(appliedVoucher.value.code);
                    window.dispatchEvent(new CustomEvent('voucher-used', { 
                        detail: { code: appliedVoucher.value.code } 
                    }));
                }
                // ========== KẾT THÚC THÊM ==========
                
                router.push('/order-history');
            }
        } catch (error) { console.error("Lỗi polling:", error); }
    }, 2500); // 2.5s gọi API 1 lần
};

onBeforeUnmount(() => {
    if (pollingInterval) clearInterval(pollingInterval);
});

onMounted(() => {
    if (!isAuthenticated.value) {
        router.push('/login');
        return;
    }
    fetchCartItems();
    fetchBankInfo();
    
    // Khởi tạo các Modal Bootstrap
    const checkoutEl = document.getElementById('checkoutModal');
    if (checkoutEl) checkoutModalInstance = new bootstrap.Modal(checkoutEl);
    
    const qrEl = document.getElementById('paymentQrModal');
    if (qrEl) qrModalInstance = new bootstrap.Modal(qrEl);
});
</script>

<template>
    <div class="container my-5">
        <h2 class="mb-4 text-center fw-bold">Giỏ hàng của bạn</h2>

        <div v-if="cartItems.length > 0">
            <div class="table-responsive shadow-sm rounded">
                <table class="table table-hover align-middle bg-white mb-0">
                    <thead class="table-dark">
                        <tr>
                            <th class="text-center py-3" style="width: 60px;">
                                <input type="checkbox" v-model="selectAll" class="form-check-input select-checkbox cursor-pointer" title="Chọn tất cả">
                            </th>
                            <th class="py-3">Sản phẩm</th> 
                            <th class="py-3">Đơn giá</th>
                            <th class="py-3" style="width: 160px;">Số lượng (Kg)</th>
                            <th class="py-3">Thành tiền</th>
                            <th class="text-center py-3">Xóa</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in cartItems" :key="item.id">
                            <td class="text-center">
                                <input type="checkbox" v-model="selectedProductIds" :value="item.product.id" class="form-check-input select-checkbox">
                            </td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <img :src="getImageUrl(item.product.image)" 
                                         width="60" height="60" 
                                         class="rounded object-fit-cover me-3 border"
                                         @error="$event.target.src='https://placehold.co/100x100?text=No+Image'">
                                    
                                    <div>
                                        <div class="fw-bold text-truncate" style="max-width: 200px;">{{ item.product.name }}</div>
                                        <small class="text-muted">#{{ item.product.id }}</small>
                                    </div>
                                </div>
                            </td>
                            <td>{{ formatPrice(item.product.price) }}/kg</td>
                            <td>
                                <div class="input-group input-group-sm">
                                    <button @click="decreaseQuantity(item)" class="btn btn-outline-secondary" type="button"><i class="bi bi-dash"></i></button>
                                    <input type="number" step="0.1" min="0.1" :value="item.quantity" @change="onQuantityInputChange(item, $event)" class="form-control text-center bg-white border-secondary-subtle fw-bold">
                                    <button @click="increaseQuantity(item)" class="btn btn-outline-secondary" type="button"><i class="bi bi-plus"></i></button>
                                </div>
                            </td>
                            <td class="text-danger fw-bold">{{ formatPrice(item.product.price * item.quantity) }}</td>
                            <td class="text-center">
                                <button @click="removeItem(item.id)" class="btn btn-link text-danger p-0 hover-scale">
                                    <i class="bi bi-trash fs-5"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="row mt-4 align-items-center">
                <div class="col-md-6 mb-3 mb-md-0">
                    <router-link to="/products" class="btn btn-outline-primary"><i class="bi bi-arrow-left me-1"></i> Tiếp tục mua sắm</router-link>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm bg-light">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="fw-semibold">Tổng thanh toán ({{ selectedItems.length }} sp):</span>
                                <span class="text-danger fs-4 fw-bold">{{ formatPrice(finalTotalAmount) }}</span>
                            </div>
                            <div v-if="isAuthenticated">
                                <button @click="checkout" class="btn btn-success w-100 py-2 fw-bold text-uppercase shadow-sm" :disabled="selectedItems.length === 0">Tiến hành đặt hàng</button>
                            </div>
                            <div v-else class="alert alert-warning mb-0 text-center py-2">
                                <i class="bi bi-exclamation-circle me-1"></i> Vui lòng <router-link to="/login" class="fw-bold text-decoration-none">Đăng nhập</router-link> để thanh toán.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="text-center py-5">
            <div class="mb-3"><i class="bi bi-cart-x text-muted" style="font-size: 4rem;"></i></div>
            <h4 class="text-muted">Giỏ hàng trống</h4>
            <router-link to="/products" class="btn btn-primary px-4 py-2">Mua sắm ngay</router-link>
        </div>

        <div class="modal fade" id="checkoutModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title fw-bold"><i class="bi bi-truck me-2"></i>THÔNG TIN GIAO HÀNG</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <form @submit.prevent="submitOrder">
                        <div class="modal-body p-4">
                            <div class="row">
                                <div class="col-md-7 border-end">
                                    <div class="mb-4">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <label class="form-label fw-bold mb-0">1. Thông tin người nhận & Địa chỉ</label>
                                            <router-link to="/profile" class="btn btn-link btn-sm text-decoration-none p-0">Sửa thông tin</router-link>
                                        </div>
                                        
                                        <div class="list-group">
                                            <label v-for="addr in savedAddresses" :key="addr.id" class="list-group-item list-group-item-action d-flex align-items-center cursor-pointer">
                                                <input class="form-check-input me-3" type="radio" :value="addr.id" v-model="selectedAddressId">
                                                <div>
                                                    <div class="fw-bold">{{ addr.fullname }} - {{ addr.phone }} <span v-if="addr.isDefault" class="badge bg-primary ms-1">Mặc định</span></div>
                                                    <div class="small text-secondary mt-1">{{ addr.addressLine }}, {{ addr.ward }}, {{ addr.district }}, {{ addr.province }}</div>
                                                </div>
                                            </label>
                                        </div>
                                        
                                        <div v-if="addressError" class="text-danger small mt-2"><i class="bi bi-exclamation-circle"></i> {{ addressError }}</div>
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label fw-bold">2. Phương thức thanh toán</label>
                                        <div class="d-flex gap-2">
                                            <div class="form-check border rounded p-2 px-4 flex-fill cursor-pointer" :class="{'border-success bg-success-subtle': orderData.paymentMethod === 'COD'}">
                                                <input class="form-check-input" type="radio" v-model="orderData.paymentMethod" value="COD" id="payCOD">
                                                <label class="form-check-label w-100 cursor-pointer fw-semibold" for="payCOD"><i class="bi bi-cash-coin me-1"></i> Tiền mặt (COD)</label>
                                            </div>
                                            <div class="form-check border rounded p-2 px-4 flex-fill cursor-pointer" :class="{'border-success bg-success-subtle': orderData.paymentMethod === 'BANK'}">
                                                <input class="form-check-input" type="radio" v-model="orderData.paymentMethod" value="BANK" id="payBank">
                                                <label class="form-check-label w-100 cursor-pointer fw-semibold" for="payBank"><i class="bi bi-qr-code-scan me-1"></i> Chuyển khoản (QR)</label>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- THÊM: Mã giảm giá -->
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Mã giảm giá (nếu có)</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control" v-model="orderData.voucherCode" 
                                                   placeholder="Nhập mã voucher..." style="text-transform: uppercase">
                                            <button class="btn btn-outline-primary" type="button" @click="applyVoucher" :disabled="applyingVoucher">
                                                <i class="bi bi-ticket-perforated me-1"></i> {{ applyingVoucher ? 'Đang áp dụng...' : 'Áp dụng' }}
                                            </button>
                                        </div>
                                        <div v-if="voucherMessage" class="small mt-1" :class="voucherMessageType">
                                            <i :class="'bi ' + voucherMessageIcon"></i> {{ voucherMessage }}
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Ghi chú (Tùy chọn)</label>
                                        <textarea v-model="orderData.notes" class="form-control" rows="2" placeholder="Ví dụ: Giao hàng giờ hành chính..."></textarea>
                                    </div>
                                </div>
                                
                                <div class="col-md-5 bg-light p-3 rounded">
                                    <h6 class="fw-bold border-bottom pb-2 mb-3">Đơn hàng của bạn</h6>
                                    <div style="max-height: 250px; overflow-y: auto;">
                                        <div v-for="item in selectedItems" :key="item.id" class="d-flex justify-content-between align-items-center mb-2 small border-bottom pb-2">
                                            <div class="d-flex align-items-center">
                                                <img :src="getImageUrl(item.product.image)" width="40" height="40" class="rounded border me-2 object-fit-cover">
                                                <div><div class="text-truncate" style="max-width: 120px;">{{ item.product.name }}</div><div class="text-muted">x{{ item.quantity }} kg</div></div>
                                            </div>
                                            <div class="fw-semibold">{{ formatPrice(item.product.price * item.quantity) }}</div>
                                        </div>
                                    </div>
                                    <div class="mt-3 pt-2 border-top">
                                        <div class="d-flex justify-content-between mb-1"><span>Tạm tính:</span><span>{{ formatPrice(totalSelectedAmount) }}</span></div>
                                        <div v-if="voucherDiscount > 0" class="d-flex justify-content-between mb-1 text-success">
                                            <span><i class="bi bi-ticket-perforated me-1"></i> Giảm giá:</span>
                                            <span>- {{ formatPrice(voucherDiscount) }}</span>
                                        </div>
                                        <div class="d-flex justify-content-between fs-5 fw-bold text-danger mt-2">
                                            <span>Tổng cộng:</span>
                                            <span>{{ formatPrice(finalTotalAmount) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-0 bg-light">
                            <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Quay lại</button>
                            <button type="submit" class="btn btn-success px-5 fw-bold">ĐẶT HÀNG NGAY</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="modal fade" id="paymentQrModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content text-center shadow-lg border-0 rounded-4">
                    <div class="modal-header bg-primary text-white justify-content-center">
                        <h5 class="modal-title fw-bold">THANH TOÁN ĐƠN HÀNG #DH-{{ createdOrder?.id }}</h5>
                    </div>
                    <div class="modal-body p-4">
                        <p class="text-muted mb-3">Vui lòng quét mã bên dưới để thanh toán.</p>
                        
                        <div class="position-relative d-inline-block mb-3" v-if="shopBank.bankId">
                            <img :src="qrCodeUrlCreated" class="img-fluid rounded border shadow-sm" style="max-width: 280px;" alt="QR Code">
                        </div>
                        <div v-else class="text-center py-4">
                            <div class="spinner-border text-secondary" role="status"></div>
                            <p class="small text-muted mt-2">Đang tạo mã QR...</p>
                        </div>

                        <div class="d-flex justify-content-center align-items-center mb-3">
                            <div class="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                            <span class="text-primary fw-bold animate__animated animate__pulse animate__infinite">Đang chờ thanh toán...</span>
                        </div>

                        <div class="bg-light p-3 rounded text-start">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted">Ngân hàng:</span>
                                <span class="fw-bold text-dark">{{ shopBank.bankId }} - {{ shopBank.accountName }}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted">Số tài khoản:</span>
                                <span class="fw-bold text-dark">{{ shopBank.accountNo }}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted">Số tiền:</span>
                                <span class="fw-bold text-danger">{{ formatPrice(createdOrder?.totalAmount) }}</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">Nội dung:</span>
                                <span class="fw-bold text-primary">DH{{ createdOrder?.id }}</span>
                            </div>
                        </div>
                        
                        <div class="alert alert-info small mt-3 mb-0">
                            <i class="bi bi-info-circle me-1"></i> 
                            Hệ thống sẽ <strong>tự động chuyển trang</strong> ngay khi nhận được tiền. Bạn không cần làm gì thêm.
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center border-0 pb-4">
                        <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Đóng và kiểm tra sau</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.select-checkbox { width: 20px; height: 20px; cursor: pointer; }
.hover-scale:hover { transform: scale(1.2); transition: transform 0.2s; }
.cursor-pointer { cursor: pointer; }
</style>