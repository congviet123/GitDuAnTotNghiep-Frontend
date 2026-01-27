<script setup>
import { ref, onMounted, computed, reactive, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import { useAuthStore } from '@/store/auth';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';

const router = useRouter();
const authStore = useAuthStore();

// --- STATE ---
const cartItems = ref([]);
const selectedProductIds = ref([]);
const addressError = ref(null);
const userProfile = ref(null);
const addressType = ref('new');

// Biến phục vụ thanh toán Online
const createdOrder = ref(null); 
let pollingInterval = null;     

//  Thay vì hardcode, ta dùng ref rỗng để hứng dữ liệu từ Backend
const shopBank = ref({
    bankId: '',
    accountNo: '',
    accountName: ''
});

const orderData = reactive({
    recipientName: '', recipientPhone: '', shippingAddress: '', notes: '', paymentMethod: 'COD'
});

// --- COMPUTED ---
const selectedItems = computed(() => {
    return cartItems.value.filter(item => selectedProductIds.value.includes(item.productId));
});

const totalSelectedAmount = computed(() => {
    return selectedItems.value.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
});

//Tạo QR Code dựa trên dữ liệu lấy từ API
const qrCodeUrlCreated = computed(() => {
    // Chỉ tạo QR khi đã có đơn hàng và đã tải xong thông tin ngân hàng
    if (!createdOrder.value || !shopBank.value.bankId) return '';
    
    const amount = Math.round(createdOrder.value.totalAmount);
    const content = `DH${createdOrder.value.id}`;
    
    // Sử dụng thông tin từ shopBank.value (dữ liệu động)
    return `https://img.vietqr.io/image/${shopBank.value.bankId}-${shopBank.value.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
});

// --- HELPER ---
const getImageUrl = (imageName) => {
    if (!imageName) return 'https://placehold.co/100x100?text=No+Image';
    if (imageName.startsWith('http')) return imageName;
    return `http://localhost:8080/imgs/${imageName}`;
};

const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
};

// --- METHODS (CART) ---
const fetchCartItems = async () => {
    try {
        const response = await apiClient.get('/cart');
        cartItems.value = response.data;
        if(cartItems.value.length > 0 && selectedProductIds.value.length === 0) {
            selectedProductIds.value = cartItems.value.map(item => item.productId);
        }
    } catch (error) { console.error('Lỗi tải giỏ hàng:', error); }
};


// Hàm gọi API Backend để lấy thông tin ngân hàng (Bảo mật source code)
const fetchBankInfo = async () => {
    try {
        // Gọi API Backend: /rest/sepay/bank-info
        const response = await apiClient.get('/sepay/bank-info');
        shopBank.value = response.data;
    } catch (error) {
        console.error('Lỗi kết nối đến hệ thống thanh toán. Vui lòng thử lại sau:', error);
        shopBank.value = { bankId: '', accountNo: '', accountName: '' };
    }
};

const updateQuantityAPI = async (productId, newQuantity) => {
    if (newQuantity === null || newQuantity <= 0) { removeItem(productId); return; }
    newQuantity = Math.round(newQuantity * 10) / 10;
    try {
        const response = await apiClient.put(`/cart/${productId}?quantity=${newQuantity}`);
        cartItems.value = response.data;
    } catch (error) {
        let errorMsg = 'Không thể cập nhật số lượng.';
        if (error.response && error.response.data) errorMsg = error.response.data.message || error.response.data;
        Swal.fire({ icon: 'warning', title: 'Thông báo', text: typeof errorMsg === 'string' ? errorMsg : 'Lỗi hệ thống' });
        fetchCartItems();
    }
};

const increaseQuantity = (pid) => { const item = cartItems.value.find(i => i.productId === pid); if(item) updateQuantityAPI(pid, item.quantity + 0.5); };
const decreaseQuantity = (pid) => { const item = cartItems.value.find(i => i.productId === pid); if(item && item.quantity > 0.5) updateQuantityAPI(pid, item.quantity - 0.5); else removeItem(pid); };
const onQuantityInputChange = (pid, event) => { const val = parseFloat(event.target.value); if(!isNaN(val)) updateQuantityAPI(pid, val); };

const removeItem = async (productId) => {
    const result = await Swal.fire({ title: 'Xác nhận xóa?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
    if (result.isConfirmed) {
        try {
            const res = await apiClient.delete(`/cart/${productId}`);
            cartItems.value = res.data;
            selectedProductIds.value = selectedProductIds.value.filter(id => id !== productId);
        } catch (e) { console.error(e); }
    }
};

// --- METHODS (CHECKOUT) ---
const fetchUserProfile = async () => {
    try {
        const res = await apiClient.get('/client/profile');
        userProfile.value = res.data;
        if (userProfile.value.address) { addressType.value = 'saved'; fillOrderInfoFromProfile(); } 
        else { addressType.value = 'new'; if (userProfile.value.fullname) orderData.recipientName = userProfile.value.fullname; if (userProfile.value.phone) orderData.recipientPhone = userProfile.value.phone; }
    } catch (err) { addressType.value = 'new'; }
};

const fillOrderInfoFromProfile = () => {
    if (userProfile.value) {
        orderData.recipientName = userProfile.value.fullname;
        orderData.recipientPhone = userProfile.value.phone;
        orderData.shippingAddress = userProfile.value.address;
    }
};

watch(addressType, (newVal) => {
    if (newVal === 'saved') fillOrderInfoFromProfile();
    else orderData.shippingAddress = ''; 
});

const checkout = async () => {
    if (selectedItems.value.length === 0) return Swal.fire('Thông báo', 'Vui lòng chọn sản phẩm.', 'info');
    if (authStore.isAuthenticated) await fetchUserProfile();
    new bootstrap.Modal(document.getElementById('checkoutModal')).show();
};

const submitOrder = async () => {
    addressError.value = null;
    if (!orderData.shippingAddress.trim()) { addressError.value = "Vui lòng nhập địa chỉ."; return; }
    if (!orderData.recipientName || !orderData.recipientPhone) { addressError.value = "Thiếu thông tin người nhận."; return; }

    const fullShippingInfo = `${orderData.shippingAddress} (Người nhận: ${orderData.recipientName}, SĐT: ${orderData.recipientPhone})`;

    const orderDTO = {
        shippingAddress: fullShippingInfo,
        notes: orderData.notes,
        items: selectedItems.value,
        paymentMethod: orderData.paymentMethod
    };

    try {
        const res = await apiClient.post('/orders', orderDTO);
        
        // 1. Tắt modal nhập thông tin
        const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
        if (checkoutModal) checkoutModal.hide();

        // 2. Kiểm tra phương thức thanh toán
        if (orderData.paymentMethod === 'BANK') {
            createdOrder.value = res.data; 
            
            // Mở Modal QR
            const qrModal = new bootstrap.Modal(document.getElementById('paymentQrModal'));
            qrModal.show();
            
            // Bắt đầu tự động kiểm tra trạng thái
            startPollingOrder(createdOrder.value.id);
            
        } else {
            // [LOGIC COD]
            await Swal.fire({ title: 'Thành công!', text: 'Đơn hàng đã được tạo.', icon: 'success' });
            router.push('/order-history');
        }
    } catch (error) {
        let errorMsg = 'Có lỗi xảy ra.';
        if(error.response && error.response.data) errorMsg = error.response.data.message || error.response.data;
        Swal.fire('Lỗi đặt hàng', typeof errorMsg === 'string' ? errorMsg : 'Lỗi hệ thống', 'error');
        fetchCartItems();
    }
};

// [HÀM POLLING] Kiểm tra trạng thái đơn hàng mỗi 2.5 giây
const startPollingOrder = (orderId) => {
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(async () => {
        try {
            const res = await apiClient.get(`/orders/${orderId}`);
            const status = res.data.status;
            
            // Nếu trạng thái đã đổi thành công (do Webhook cập nhật)
            if (status === 'CONFIRMED' || status === 'PAID') {
                clearInterval(pollingInterval); 

                const qrModalElement = document.getElementById('paymentQrModal');
                const qrModal = bootstrap.Modal.getInstance(qrModalElement);
                if (qrModal) qrModal.hide();

                await Swal.fire({
                    title: 'Thanh toán thành công!',
                    text: 'Hệ thống đã xác nhận tiền về tài khoản.',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false
                });
                router.push('/order-history');
            }
        } catch (error) {
            console.error("Lỗi polling:", error);
        }
    }, 2500);
};

onBeforeUnmount(() => {
    if (pollingInterval) clearInterval(pollingInterval);
});

onMounted(() => {
    fetchCartItems();
    fetchBankInfo();  // Gọi hàm lấy thông tin ngân hàng khi tải trang
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
                            <th class="py-3">Sản phẩm</th> <th class="py-3">Đơn giá</th>
                            <th class="py-3" style="width: 160px;">Số lượng (Kg)</th>
                            <th class="py-3">Thành tiền</th>
                            <th class="text-center py-3">Xóa</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in cartItems" :key="item.productId">
                            <td class="text-center"><input type="checkbox" v-model="selectedProductIds" :value="item.productId" class="form-check-input select-checkbox"></td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <img :src="getImageUrl(item.image)" width="60" height="60" class="rounded object-fit-cover me-3 border">
                                    <div><div class="fw-bold text-truncate" style="max-width: 200px;">{{ item.productName }}</div><small class="text-muted">#{{ item.productId }}</small></div>
                                </div>
                            </td>
                            <td>{{ formatPrice(item.price) }}/kg</td>
                            <td>
                                <div class="input-group input-group-sm">
                                    <button @click="decreaseQuantity(item.productId)" class="btn btn-outline-secondary" type="button"><i class="bi bi-dash"></i></button>
                                    <input type="number" step="0.1" min="0.1" :value="item.quantity" @change="onQuantityInputChange(item.productId, $event)" class="form-control text-center bg-white border-secondary-subtle fw-bold">
                                    <button @click="increaseQuantity(item.productId)" class="btn btn-outline-secondary" type="button"><i class="bi bi-plus"></i></button>
                                </div>
                            </td>
                            <td class="text-danger fw-bold">{{ formatPrice(item.price * item.quantity) }}</td>
                            <td class="text-center"><button @click="removeItem(item.productId)" class="btn btn-link text-danger p-0 hover-scale"><i class="bi bi-trash fs-5"></i></button></td>
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
                            <div v-if="authStore.isAuthenticated">
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
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Thông tin người nhận <span class="text-danger">*</span></label>
                                        <div class="mb-3 d-flex gap-3 bg-light p-2 rounded" v-if="userProfile && userProfile.address">
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" v-model="addressType" value="saved" id="addrSaved">
                                                <label class="form-check-label cursor-pointer" for="addrSaved">Dùng địa chỉ đã lưu</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" v-model="addressType" value="new" id="addrNew">
                                                <label class="form-check-label cursor-pointer" for="addrNew">Nhập địa chỉ mới</label>
                                            </div>
                                        </div>
                                        <div class="row g-2 mb-2">
                                            <div class="col-md-6"><input type="text" class="form-control" v-model="orderData.recipientName" placeholder="Họ và tên" required :disabled="addressType === 'saved'"></div>
                                            <div class="col-md-6"><input type="text" class="form-control" v-model="orderData.recipientPhone" placeholder="Số điện thoại" required :disabled="addressType === 'saved'"></div>
                                        </div>
                                        <textarea v-model="orderData.shippingAddress" class="form-control" rows="3" placeholder="Số nhà, đường, phường/xã, quận/huyện..." required :disabled="addressType === 'saved'"></textarea>
                                        <div v-if="addressError" class="text-danger small mt-1"><i class="bi bi-exclamation-circle"></i> {{ addressError }}</div>
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Phương thức thanh toán</label>
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
                                        <label class="form-label fw-bold">Ghi chú</label>
                                        <textarea v-model="orderData.notes" class="form-control" rows="2" placeholder="Ví dụ: Giao hàng giờ hành chính..."></textarea>
                                    </div>
                                </div>
                                <div class="col-md-5 bg-light p-3 rounded">
                                    <h6 class="fw-bold border-bottom pb-2 mb-3">Đơn hàng của bạn</h6>
                                    <div style="max-height: 250px; overflow-y: auto;">
                                        <div v-for="item in selectedItems" :key="item.productId" class="d-flex justify-content-between align-items-center mb-2 small border-bottom pb-2">
                                            <div class="d-flex align-items-center">
                                                <img :src="getImageUrl(item.image)" width="40" height="40" class="rounded border me-2 object-fit-cover">
                                                <div><div class="text-truncate" style="max-width: 120px;">{{ item.productName }}</div><div class="text-muted">x{{ item.quantity }} kg</div></div>
                                            </div>
                                            <div class="fw-semibold">{{ formatPrice(item.price * item.quantity) }}</div>
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