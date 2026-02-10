<script setup>
import { ref, onMounted, computed, reactive, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

// --- STATE ---
const cartItems = ref([]);
const selectedProductIds = ref([]); // Lưu Product ID để xử lý logic thanh toán
const addressError = ref(null);

// Quản lý địa chỉ
const savedAddresses = ref([]);
const addressType = ref('new');
const selectedAddressId = ref(null);

// Modal instances
let checkoutModalInstance = null;
let qrModalInstance = null;

// Biến thanh toán Online
const createdOrder = ref(null); 
let pollingInterval = null;     

const shopBank = ref({
    bankId: '',
    accountNo: '',
    accountName: ''
});

// Dữ liệu đơn hàng
const orderData = reactive({
    recipientName: '', 
    recipientPhone: '', 
    shippingAddress: '', 
    notes: '', 
    paymentMethod: 'COD'
});

// --- COMPUTED ---
const isAuthenticated = computed(() => authStore.isAuthenticated);

// Lọc ra các item (dòng giỏ hàng) được chọn dựa trên Product ID
const selectedItems = computed(() => {
    return cartItems.value.filter(item => selectedProductIds.value.includes(item.product.id));
});

// Tính tổng tiền: item.product.price * item.quantity
const totalSelectedAmount = computed(() => {
    return selectedItems.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
});

// QR Code
const qrCodeUrlCreated = computed(() => {
    if (!createdOrder.value || !shopBank.value.bankId) return '';
    const amount = Math.round(createdOrder.value.totalAmount);
    const content = `DH${createdOrder.value.id}`;
    return `https://img.vietqr.io/image/${shopBank.value.bankId}-${shopBank.value.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
});

// --- [SỬA LỖI ẢNH Ở ĐÂY] ---
const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://placehold.co/100x100?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;

    // Server Backend đang chạy ở port 8080
    const baseUrl = 'http://localhost:8080';


    // Trường hợp DB lưu đường dẫn đầy đủ 'imgs/tao.jpg'
    if (imagePath.startsWith('imgs/')) {
        return `${baseUrl}/${imagePath}`;
    }

    // Trường hợp dự phòng: Nếu DB chỉ lưu tên file 'tao.jpg' thì mới thêm 'imgs/'
    return `${baseUrl}/imgs/${imagePath}`;
};

const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
};

// --- METHODS (CART) ---
const fetchCartItems = async () => {
    if (!isAuthenticated.value) return;
    try {
        const response = await apiClient.get('/cart');
        cartItems.value = response.data; // Dữ liệu trả về là List<Cart> (Entity)
        
        // Mặc định chọn hết nếu chưa chọn gì
        if(cartItems.value.length > 0 && selectedProductIds.value.length === 0) {
            selectedProductIds.value = cartItems.value.map(item => item.product.id);
        }
    } catch (error) { console.error('Lỗi tải giỏ hàng:', error); }
};

const fetchBankInfo = async () => {
    try {
        // [TODO]: Thay bằng API thật nếu có
        shopBank.value = { bankId: 'TPB', accountNo: '0901111222', accountName: 'TRAI CAY BAY SHOP' };
    } catch (error) { console.error('Lỗi bank info:', error); }
};

// Logic Update số lượng
const updateQuantityAPI = async (cartId, newQuantity) => {
    if (newQuantity === null || newQuantity <= 0) { 
        removeItem(cartId); 
        return; 
    }
    
    newQuantity = Math.round(newQuantity * 10) / 10; // Làm tròn 1 số thập phân
    
    try {
        const response = await apiClient.put(`/cart/${cartId}?quantity=${newQuantity}`);
        cartItems.value = response.data;
    } catch (error) {
        let msg = error.response?.data?.message || error.response?.data || 'Không thể cập nhật';
        Swal.fire('Lỗi', msg, 'error');
        fetchCartItems(); 
    }
};

const increaseQuantity = (item) => { 
    updateQuantityAPI(item.id, item.quantity + 0.5); 
};

const decreaseQuantity = (item) => { 
    if(item.quantity > 0.5) updateQuantityAPI(item.id, item.quantity - 0.5); 
    else removeItem(item.id); 
};

const onQuantityInputChange = (item, event) => { 
    const val = parseFloat(event.target.value); 
    if(!isNaN(val)) updateQuantityAPI(item.id, val); 
};

const removeItem = async (cartId) => {
    const result = await Swal.fire({ title: 'Xác nhận xóa?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
    if (result.isConfirmed) {
        try {
            const res = await apiClient.delete(`/cart/${cartId}`);
            cartItems.value = res.data; 
            
            // Xóa item khỏi danh sách selectedProductIds nếu nó bị xóa khỏi giỏ
            // (Code này đảm bảo tính nhất quán UI)
            const currentProductIds = cartItems.value.map(i => i.product.id);
            selectedProductIds.value = selectedProductIds.value.filter(id => currentProductIds.includes(id));

        } catch (e) { console.error(e); }
    }
};

// --- METHODS (CHECKOUT) ---
const fetchSavedAddresses = async () => {
    try {
        const res = await apiClient.get('/addresses');
        savedAddresses.value = res.data;
        
        if (savedAddresses.value.length > 0) {
            addressType.value = 'saved';
            const defaultAddr = savedAddresses.value.find(a => a.isDefault);
            selectedAddressId.value = defaultAddr ? defaultAddr.id : savedAddresses.value[0].id;
        } else {
            addressType.value = 'new';
        }
    } catch (err) {
        console.error(err);
        addressType.value = 'new';
    }
};

const checkout = async () => {
    if (selectedItems.value.length === 0) return Swal.fire('Thông báo', 'Vui lòng chọn sản phẩm.', 'info');
    
    if (isAuthenticated.value) {
        await fetchSavedAddresses();
    }
    
    if (checkoutModalInstance) checkoutModalInstance.show();
};

const submitOrder = async () => {
    addressError.value = null;
    
    let finalRecipientName = '';
    let finalRecipientPhone = '';
    let finalShippingAddress = '';

    if (addressType.value === 'saved') {
        if (!selectedAddressId.value) {
            addressError.value = "Vui lòng chọn một địa chỉ.";
            return;
        }
        const addr = savedAddresses.value.find(a => a.id === selectedAddressId.value);
        if (addr) {
            finalRecipientName = addr.fullname;
            finalRecipientPhone = addr.phone;
            finalShippingAddress = addr.addressLine + ', ' + addr.ward + ', ' + addr.district + ', ' + addr.province;
        }
    } else {
        if (!orderData.shippingAddress.trim()) { addressError.value = "Vui lòng nhập địa chỉ."; return; }
        if (!orderData.recipientName || !orderData.recipientPhone) { addressError.value = "Thiếu thông tin người nhận."; return; }
        
        finalRecipientName = orderData.recipientName;
        finalRecipientPhone = orderData.recipientPhone;
        finalShippingAddress = orderData.shippingAddress;
    }

    const orderDTO = {
        recipientName: finalRecipientName,
        recipientPhone: finalRecipientPhone,
        shippingAddress: finalShippingAddress,
        notes: orderData.notes,
        paymentMethod: orderData.paymentMethod,
        voucherCode: null,
        items: selectedItems.value.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
        }))
    };

    try {
        const res = await apiClient.post('/orders', orderDTO);
        
        if (checkoutModalInstance) checkoutModalInstance.hide();

        if (orderData.paymentMethod === 'BANK') {
            createdOrder.value = res.data; 
            if (qrModalInstance) qrModalInstance.show();
            startPollingOrder(createdOrder.value.id);
        } else {
            await Swal.fire({ title: 'Thành công!', text: 'Đơn hàng đã được tạo.', icon: 'success' });
            router.push('/order-history');
        }
    } catch (error) {
        console.error(error);
        let errorMsg = error.response?.data?.message || error.response?.data || 'Có lỗi xảy ra.';
        Swal.fire('Lỗi đặt hàng', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg), 'error');
    }
};

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
                router.push('/order-history');
            }
        } catch (error) { console.error("Lỗi polling:", error); }
    }, 2500);
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
                            <th class="text-center py-3">Chọn</th>
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
                                <span class="text-danger fs-4 fw-bold">{{ formatPrice(totalSelectedAmount) }}</span>
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
                                        <label class="form-label fw-bold">1. Thông tin người nhận & Địa chỉ</label>
                                        
                                        <div class="d-flex gap-3 mb-3" v-if="savedAddresses.length > 0">
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" v-model="addressType" value="saved" id="addrSaved">
                                                <label class="form-check-label cursor-pointer" for="addrSaved">Sổ địa chỉ ({{ savedAddresses.length }})</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" v-model="addressType" value="new" id="addrNew">
                                                <label class="form-check-label cursor-pointer" for="addrNew">Nhập địa chỉ mới</label>
                                            </div>
                                        </div>

                                        <div v-if="addressType === 'saved' && savedAddresses.length > 0" class="list-group">
                                            <label v-for="addr in savedAddresses" :key="addr.id" class="list-group-item list-group-item-action d-flex align-items-center cursor-pointer">
                                                <input class="form-check-input me-3" type="radio" :value="addr.id" v-model="selectedAddressId">
                                                <div>
                                                    <div class="fw-bold">{{ addr.fullname }} - {{ addr.phone }} <span v-if="addr.isDefault" class="badge bg-primary ms-1">Mặc định</span></div>
                                                    <div class="small text-secondary">{{ addr.addressLine }}, {{ addr.ward }}, {{ addr.district }}, {{ addr.province }}</div>
                                                </div>
                                            </label>
                                            <router-link to="/profile" class="btn btn-outline-primary btn-sm mt-2 w-100"><i class="bi bi-gear"></i> Quản lý sổ địa chỉ</router-link>
                                        </div>

                                        <div v-else>
                                            <div class="row g-2 mb-2">
                                                <div class="col-md-6"><input type="text" class="form-control" v-model="orderData.recipientName" placeholder="Họ và tên người nhận" required></div>
                                                <div class="col-md-6"><input type="text" class="form-control" v-model="orderData.recipientPhone" placeholder="Số điện thoại" required></div>
                                            </div>
                                            <textarea v-model="orderData.shippingAddress" class="form-control" rows="3" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..." required></textarea>
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
                                        <div class="d-flex justify-content-between fs-5 fw-bold text-danger mt-2"><span>Tổng cộng:</span><span>{{ formatPrice(totalSelectedAmount) }}</span></div>
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