<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import apiClient from '@/services/api';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';

// 1. xử lý dữ liệu đơn hàng, đơn hàng được chọn, trạng thái loading, thông tin ngân hàng shop, thời gian hiện tại để đếm ngược
const orders = ref([]);
const selectedOrder = ref({ 
    id: null, orderDetails: [], totalAmount: 0, createDate: null, 
    notes: '', shippingAddress: '', status: '', paymentMethod: 'COD', account: {}
});
const loading = ref(false);
let pollingInterval = null; 
let countdownInterval = null; 

const shopBank = ref({
    bankId: '', accountNo: '', accountName: '' 
});

const currentNow = ref(new Date().getTime()); 

// 2. xử lý đếm ngược thời gian đổi trả & điều kiện hiển thị nút "Yêu cầu hoàn trả"

const startCountdownTimer = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        currentNow.value = new Date().getTime();
    }, 1000);
};

// Hàm tính toán đếm ngược cực kỳ thông minh
const getReturnTimeLeft = (order) => {
    // Ưu tiên lấy ngày Giao hàng. Nếu đơn cũ bị null, lấy tạm Ngày đặt hàng để đếm
    const baseDateString = order.deliveryDate || order.createDate;
    
    if (!baseDateString) return { expired: true, text: 'Hết hạn' };
    
    // Mốc bắt đầu + 24 tiếng
    const baseDate = new Date(baseDateString).getTime();
    const deadline = baseDate + (24 * 60 * 60 * 1000); 
    const diff = deadline - currentNow.value;

    // Nếu thời gian chênh lệch <= 0 nghĩa là đã quá 24h
    if (diff <= 0) return { expired: true, text: 'Hết hạn đổi trả' };

    // Tính toán Giờ, Phút, Giây còn lại
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Format lại cho đẹp (Ví dụ: 09h 05m 02s)
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return { 
        expired: false, 
        text: `Còn ${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s` 
    };
};

const canReturnOrder = (order) => {
    if (order.status !== 'DELIVERED') return false; // Chỉ đơn đã giao mới được trả
    const returnTime = getReturnTimeLeft(order);
    return !returnTime.expired; // Trả về true nếu chưa hết hạn
};

const qrCodeUrl = computed(() => {
    if (!selectedOrder.value || !selectedOrder.value.id || !shopBank.value.bankId) return '';
    const amount = Math.round(selectedOrder.value.totalAmount);
    const content = `DH${selectedOrder.value.id}`;
    return `https://img.vietqr.io/image/${shopBank.value.bankId}-${shopBank.value.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
});

const parsedShippingInfo = computed(() => {
    const name = selectedOrder.value.account?.fullname || 'Khách lẻ';
    const phone = selectedOrder.value.account?.phone || '---';
    const address = selectedOrder.value.shippingAddress || '';
    const regex = /^(.*)\s\(Người nhận:\s(.*),\sSĐT:\s(.*)\)$/;
    const match = address.match(regex);
    if (match && match.length === 4) return { address: match[1], name: match[2], phone: match[3] };
    return { name, phone, address };
});

const returnRequestInfo = computed(() => {
    const raw = selectedOrder.value.notes || '';
    const regexNew = /\[Yêu cầu trả:\s*(.*?)\s*\|\s*Bank:\s*(.*?)\s*\|\s*KH:\s*(.*?)\]/;
    const matchNew = raw.match(regexNew);
    if (matchNew) {
        return { reason: matchNew[1], bank: matchNew[2], contact: matchNew[3], originalString: matchNew[0] };
    }
    const regexOld = /\|\s*Yêu cầu trả:\s*(.*?)\s*\[Hoàn tiền:\s*(.*?)\]/;
    const matchOld = raw.match(regexOld);
    if (matchOld) {
        return { reason: matchOld[1], bank: matchOld[2], contact: '', originalString: matchOld[0] };
    }
    return null;
});

const displayNote = computed(() => {
    const raw = selectedOrder.value.notes || '';
    if (returnRequestInfo.value) {
        return raw.replace(returnRequestInfo.value.originalString, '').trim();
    }
    return raw;
});

// 3. xử lý gọi API lấy lịch sử đơn hàng, thông tin ngân hàng shop, hủy đơn hàng, yêu cầu hoàn trả, xóa đơn hàng
const fetchOrderHistory = async () => {
    loading.value = true;
    try {
        const response = await apiClient.get('/orders');
        orders.value = response.data.filter(o => o.status !== 'HIDDEN');
    } catch (error) { console.error(error); } finally { loading.value = false; }
};

const fetchBankInfo = async () => {
    try {
        const response = await apiClient.get('/sepay/bank-info');
        shopBank.value = response.data;
    } catch (error) {
        shopBank.value = { bankId: 'TPB', accountNo: '55222422222', accountName: 'NGUYEN CONG VIET' };
    }
};

// 4. sử lý gọi API hủy đơn hàng, yêu cầu hoàn trả, xóa đơn hàng
const cancelOrder = async (order) => {
    if (!isTransfer(order.paymentMethod)) {
        const { value: reason } = await Swal.fire({
            title: 'Hủy đơn hàng?',
            input: 'select',
            inputOptions: {
                'Đổi ý, không muốn mua nữa': 'Đổi ý, không muốn mua nữa',
                'Tìm thấy nơi khác giá rẻ hơn': 'Tìm thấy nơi khác giá rẻ hơn',
                'Muốn thay đổi địa chỉ/sđt nhận hàng': 'Muốn thay đổi địa chỉ/sđt nhận hàng',
                'Muốn thay đổi sản phẩm trong đơn': 'Muốn thay đổi sản phẩm trong đơn',
                'Thủ tục thanh toán quá rắc rối': 'Thủ tục thanh toán quá rắc rối',
                'Thời gian giao hàng quá lâu': 'Thời gian giao hàng quá lâu',
                'Khác': 'Lý do khác'
            },
            inputPlaceholder: 'Chọn lý do hủy...',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận hủy',
            confirmButtonColor: '#d33',
            inputValidator: (value) => { if (!value) return 'Bạn cần chọn một lý do!'; }
        });

        if (reason) {
            try {
                await apiClient.put(`/orders/${order.id}/cancel`, { reason });
                await Swal.fire('Thành công', 'Đơn hàng đã được hủy.', 'success');
                fetchOrderHistory();
            } catch (e) {
                Swal.fire('Lỗi', e.response?.data || 'Lỗi hủy đơn.', 'error');
            }
        }
    } 
    else {
        const { value: formValues } = await Swal.fire({
            title: 'HỦY ĐƠN & HOÀN TIỀN',
            width: '600px',
            html: `
                <div class="text-start fs-6" style="font-family: Arial, sans-serif;">
                    <div class="alert alert-warning small mb-3 border-warning rounded">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i> Đơn hàng này đã được thanh toán. Vui lòng cung cấp thông tin tài khoản ngân hàng để chúng tôi hoàn tiền lại cho bạn.
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-bold text-dark">Lý do hủy đơn <span class="text-danger">*</span></label>
                        <select id="swal-cancel-reason" class="form-select mb-2">
                            <option value="" disabled selected>-- Chọn lý do hủy --</option>
                            <option value="Đổi ý, không muốn mua nữa">Đổi ý, không muốn mua nữa</option>
                            <option value="Tìm thấy nơi khác giá rẻ hơn">Tìm thấy nơi khác giá rẻ hơn</option>
                            <option value="Muốn thay đổi địa chỉ/sđt nhận hàng">Muốn thay đổi địa chỉ/sđt nhận hàng</option>
                            <option value="Muốn thay đổi sản phẩm trong đơn">Muốn thay đổi sản phẩm trong đơn</option>
                            <option value="Lý do khác">Lý do khác</option>
                        </select>
                    </div>
                    <div class="mb-3 border p-3 rounded bg-light">
                        <h6 class="text-primary fw-bold mb-3"><i class="bi bi-credit-card-2-front me-1"></i> Thông tin nhận tiền hoàn</h6>
                        <div class="row g-3 mb-3">
                            <div class="col-12">
                                <label class="small text-muted mb-1">Tên Ngân hàng <span class="text-danger">*</span></label>
                                <input id="swal-cancel-bankName" class="form-control" placeholder="VD: Vietcombank, MBBank...">
                            </div>
                            <div class="col-6">
                                <label class="small text-muted mb-1">Số tài khoản <span class="text-danger">*</span></label>
                                <input id="swal-cancel-accNo" class="form-control" placeholder="Nhập số tài khoản">
                            </div>
                            <div class="col-6">
                                <label class="small text-muted mb-1">Tên chủ TK <span class="text-danger">*</span></label>
                                <input id="swal-cancel-accName" class="form-control text-uppercase" placeholder="VD: NGUYEN VAN A">
                            </div>
                        </div>
                        <div class="bg-white p-2 rounded border border-dashed">
                            <label class="small fw-bold text-dark d-block mb-1"><i class="bi bi-qr-code"></i> Ảnh QR Ngân hàng (Tùy chọn)</label>
                            <input type="file" id="swal-cancel-qrImage" class="form-control form-control-sm" accept="image/*">
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true, confirmButtonText: '<i class="bi bi-send-fill me-1"></i> Xác nhận', confirmButtonColor: '#d33',
            preConfirm: () => {
                const reason = document.getElementById('swal-cancel-reason').value;
                const bankName = document.getElementById('swal-cancel-bankName').value;
                const accNo = document.getElementById('swal-cancel-accNo').value;
                const accName = document.getElementById('swal-cancel-accName').value;
                const qrFile = document.getElementById('swal-cancel-qrImage').files[0];

                if (!reason || !bankName || !accNo || !accName) { Swal.showValidationMessage('Vui lòng điền đủ thông tin!'); return false; }
                return { reason, bankName, accNo, accName, qrFile };
            }
        });

        if (formValues) {
            try {
                Swal.fire({ title: 'Đang xử lý...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                const formData = new FormData();
                formData.append('reason', formValues.reason); formData.append('bankName', formValues.bankName);
                formData.append('accNo', formValues.accNo); formData.append('accName', formValues.accName);
                if (formValues.qrFile) formData.append('qrFile', formValues.qrFile);

                await apiClient.post(`/orders/${order.id}/cancel-paid`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                await Swal.fire('Thành công', 'Yêu cầu hủy đơn đã được gửi.', 'success');
                fetchOrderHistory();
            } catch (e) { Swal.fire('Lỗi', e.response?.data || 'Lỗi hủy đơn', 'error'); }
        }
    }
};

const requestReturn = async (order) => {
    let adminOptions = '';
    try {
        const res = await apiClient.get('/users/admins'); 
        const admins = res.data;
        if (admins && admins.length > 0) {
            adminOptions = admins.map(a => `<option value="${a.email}">${a.fullname} (${a.email})</option>`).join('');
        } else { adminOptions = `<option value="admin@traicaystore.com">Admin Mặc định</option>`; }
    } catch (e) { adminOptions = `<option value="admin@traicaystore.com">Admin Store</option>`; }

    let defName = '', defPhone = '', defEmail = '';
    try {
        const userRes = await apiClient.get('/client/profile'); 
        defName = userRes.data.fullname || ''; defPhone = userRes.data.phone || ''; defEmail = userRes.data.email || '';
    } catch (e) { defName = order.accountFullname || ''; }

    const shopName = "TRÁI CÂY NHẬP KHẨU STORE";

    const { value: formValues } = await Swal.fire({
        title: 'YÊU CẦU HOÀN TRẢ ĐƠN HÀNG', width: '700px',
        html: `
            <div class="text-start fs-6" style="font-family: Arial, sans-serif;">
                <div class="alert alert-danger small mb-3">
                    <i class="bi bi-clock-history"></i> Bạn chỉ có <strong>24 giờ</strong> tính từ lúc nhận hàng để gửi yêu cầu hoàn trả.
                </div>
                <div class="mb-3 bg-light p-2 rounded border">
                    <h6 class="text-primary fw-bold mb-1"><i class="bi bi-shop me-1"></i> Gửi đến (Shop)</h6>
                    <div class="small mb-2"><strong>Shop:</strong> ${shopName}</div>
                    <label class="small text-muted">Chọn Admin xử lý:</label>
                    <select id="swal-adminEmail" class="form-select form-select-sm">${adminOptions}</select>
                </div>
                <div class="mb-3 border p-3 rounded position-relative">
                    <h6 class="text-primary fw-bold mb-2"><i class="bi bi-person-circle me-1"></i> Thông tin khách hàng yêu cầu hoàn đơn</h6>
                    <div class="mb-2">
                        <div class="form-check form-check-inline"><input class="form-check-input" type="radio" name="infoOption" id="optDefault" value="default" checked><label class="form-check-label" for="optDefault">Thông tin mặc định (TK)</label></div>
                        <div class="form-check form-check-inline"><input class="form-check-input" type="radio" name="infoOption" id="optCustom" value="custom"><label class="form-check-label" for="optCustom">Nhập thông tin mới</label></div>
                    </div>
                    <div class="row g-2" id="infoInputs">
                        <div class="col-6"><label class="small text-muted">Họ tên</label><input id="swal-name" class="form-control form-control-sm" value="${defName}" readonly></div>
                        <div class="col-6"><label class="small text-muted">SĐT</label><input id="swal-phone" class="form-control form-control-sm" value="${defPhone}" readonly></div>
                        <div class="col-12"><label class="small text-muted">Email (Nhận kết quả)</label><input id="swal-email" class="form-control form-control-sm" value="${defEmail}" readonly></div>
                    </div>
                </div>
                <div class="mb-3 border p-3 rounded">
                    <h6 class="text-primary fw-bold mb-2"><i class="bi bi-credit-card-2-front me-1"></i> Thông tin nhận tiền hoàn</h6>
                    <div class="row g-2 mb-2">
                        <div class="col-12"><input id="swal-bankName" class="form-control" placeholder="Tên Ngân hàng (VD: MBBank, VCB)"></div>
                        <div class="col-7"><input id="swal-accNo" class="form-control" placeholder="Số tài khoản"></div>
                        <div class="col-5"><input id="swal-accName" class="form-control" placeholder="Tên chủ TK"></div>
                    </div>
                    <div class="bg-light p-2 rounded border border-dashed">
                        <label class="small fw-bold text-dark d-block mb-1"><i class="bi bi-qr-code"></i> Ảnh QR Ngân hàng (Tùy chọn)</label>
                        <input type="file" id="swal-qrImage" class="form-control form-control-sm" accept="image/*">
                    </div>
                </div>
                <div class="mb-3">
                    <h6 class="text-primary fw-bold mb-2"><i class="bi bi-chat-text-fill me-1"></i> Lý do & Ảnh sản phẩm lỗi</h6>
                    <textarea id="swal-reason" class="form-control mb-2" rows="2" placeholder="Mô tả chi tiết lý do hoàn trả..."></textarea>
                    <label class="small text-muted d-block mb-1">Ảnh minh chứng sản phẩm:</label>
                    <input type="file" id="swal-images" class="form-control form-control-sm" multiple accept="image/*">
                </div>
            </div>
        `,
        showCancelButton: true, confirmButtonText: '<i class="bi bi-send-fill me-1"></i> Gửi yêu cầu', cancelButtonText: 'Hủy', focusConfirm: false,
        didOpen: () => {
            const optDefault = document.getElementById('optDefault'); const optCustom = document.getElementById('optCustom');
            const nameInput = document.getElementById('swal-name'); const phoneInput = document.getElementById('swal-phone'); const emailInput = document.getElementById('swal-email');
            const toggleInputs = (isCustom) => {
                nameInput.readOnly = !isCustom; phoneInput.readOnly = !isCustom; emailInput.readOnly = !isCustom;
                if (!isCustom) { 
                    nameInput.value = defName; phoneInput.value = defPhone; emailInput.value = defEmail;
                    nameInput.classList.remove('bg-white'); phoneInput.classList.remove('bg-white'); emailInput.classList.remove('bg-white');
                } else {
                    nameInput.value = ''; phoneInput.value = ''; emailInput.value = '';
                    nameInput.classList.add('bg-white'); phoneInput.classList.add('bg-white'); emailInput.classList.add('bg-white');
                }
            };
            optDefault.addEventListener('change', () => toggleInputs(false)); optCustom.addEventListener('change', () => toggleInputs(true));
            toggleInputs(false); 
        },
        preConfirm: () => {
            return {
                adminEmail: document.getElementById('swal-adminEmail').value, senderName: document.getElementById('swal-name').value, senderPhone: document.getElementById('swal-phone').value,
                senderEmail: document.getElementById('swal-email').value, bankName: document.getElementById('swal-bankName').value, accNo: document.getElementById('swal-accNo').value,
                accName: document.getElementById('swal-accName').value, qrFile: document.getElementById('swal-qrImage').files[0],
                reason: document.getElementById('swal-reason').value, files: document.getElementById('swal-images').files
            };
        }
    });

    if (formValues) {
        if (!formValues.senderName || !formValues.senderPhone || !formValues.senderEmail || !formValues.bankName || !formValues.accNo || !formValues.accName || !formValues.reason) { Swal.fire('Lỗi', 'Vui lòng điền đủ thông tin!', 'warning'); return; }
        try {
            Swal.fire({ title: 'Đang xử lý...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
            const formData = new FormData();
            Object.keys(formValues).forEach(key => {
                if (key === 'files') { Array.from(formValues[key]).forEach(f => formData.append('files', f)); }
                else if (key === 'qrFile' && formValues[key]) { formData.append('qrFile', formValues[key]); }
                else { formData.append(key, formValues[key]); }
            });
            await apiClient.post(`/orders/${order.id}/return-request`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            await Swal.fire('Thành công', 'Đã gửi yêu cầu hoàn trả.', 'success');
            fetchOrderHistory();
        } catch (e) { Swal.fire('Lỗi', e.response?.data || 'Không gửi được yêu cầu.', 'error'); }
    }
};

const deleteOrder = async (orderId) => {
    const result = await Swal.fire({ title: 'Xóa lịch sử?', text: "Bạn sẽ không thấy đơn này nữa.", icon: 'warning', showCancelButton: true, confirmButtonText: 'Xóa vĩnh viễn' });
    if (result.isConfirmed) {
        try { await apiClient.delete(`/orders/${orderId}`); fetchOrderHistory(); Swal.fire('Đã xóa', '', 'success'); } catch (e) { Swal.fire('Lỗi', 'Không thể xóa.', 'error'); }
    }
};

// =======================================================================
// 5. xử lý hiển thị thông tin đơn hàng, trạng thái, hình thức thanh toán, thời gian đếm ngược đổi trả
// =======================================================================
const isTransfer = (method) => method === 'BANK' || method === 'QR';
const getPaymentMethodDisplay = (order) => isTransfer(order.paymentMethod) ? 'Chuyển khoản (QR)' : 'Tiền mặt (COD)';
const getPaymentClass = (order) => isTransfer(order.paymentMethod) ? 'text-primary border-primary bg-white' : 'text-success border-success bg-white';

const translateStatus = (status) => {
    const map = {
        'PENDING': 'Đang chờ xử lý', 'CONFIRMED': 'Đã xác nhận', 'PREPARING': 'Đang chuẩn bị hàng',
        'SHIPPING': 'Đang vận chuyển', 'SHIPPED': 'Đang giao hàng', 'DELIVERED': 'Giao thành công',
        'COMPLETED': 'Hoàn tất', 'CANCELLED': 'Yêu cầu hủy đơn hàng', 'RETURN_REQUESTED': 'Yêu cầu hoàn trả',
        'CANCELLED_REFUNDED': 'Đã hoàn tiền', 'PAID': 'Đã thanh toán', 'CANCEL_REQUESTED': 'Đã xác nhận hủy đơn hàng'
    };
    return map[status] || status;
};

const getStatusBadgeClass = (status) => {
    if (['PENDING', 'CANCEL_REQUESTED'].includes(status)) return 'bg-warning text-dark';
    if (['CONFIRMED', 'PAID', 'PREPARING', 'SHIPPING', 'SHIPPED'].includes(status)) return 'bg-primary';
    if (['DELIVERED', 'COMPLETED'].includes(status)) return 'bg-success';
    if (['CANCELLED', 'CANCELLED_REFUNDED'].includes(status)) return 'bg-danger';
    return 'bg-secondary';
};

const formatPrice = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') + ' ' + new Date(d).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : 'N/A';

// [ĐÃ SỬA] Hàm xử lý ảnh chuẩn xác chống lỗi
const getImageUrl = (imageName) => {
    if (!imageName) return 'https://placehold.co/100x100?text=No+Image';
    if (imageName.startsWith('http') || imageName.startsWith('blob:')) return imageName;

    let cleanName = imageName;
    if (cleanName.startsWith('/')) cleanName = cleanName.substring(1);

    const baseUrl = 'http://localhost:8080';
    if (cleanName.startsWith('imgs/')) return `${baseUrl}/${cleanName}`;
    
    return `${baseUrl}/imgs/${cleanName}`;
};

// =======================================================================
// 6. xử lý hiển thị chi tiết đơn hàng & thanh toán lại (đơn chuyển khoản) & polling trạng thái đơn hàng (đơn chuyển khoản)
// =======================================================================
const viewDetails = async (orderId) => {
    try {
        const response = await apiClient.get(`/orders/${orderId}`);
        selectedOrder.value = response.data;
        if (!Array.isArray(selectedOrder.value.orderDetails)) selectedOrder.value.orderDetails = [];
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        modal.show();
    } catch (e) { console.error(e); }
};

const stopPolling = () => { if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; } };

const startPollingOrder = (orderId) => {
    stopPolling();
    pollingInterval = setInterval(async () => {
        try {
            const res = await apiClient.get(`/orders/${orderId}`);
            if (['CONFIRMED', 'PAID', 'PREPARING'].includes(res.data.status)) {
                stopPolling();
                bootstrap.Modal.getInstance(document.getElementById('rePaymentQrModal'))?.hide();
                await fetchOrderHistory();
                Swal.fire({ title: 'Thanh toán thành công!', icon: 'success', timer: 3000, showConfirmButton: false });
            }
        } catch (e) { console.error(e); }
    }, 2500);
};

const openPaymentModal = () => {
    bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'))?.hide();
    new bootstrap.Modal(document.getElementById('rePaymentQrModal')).show();
    startPollingOrder(selectedOrder.value.id);
};

onBeforeUnmount(() => {
    stopPolling();
    if (countdownInterval) clearInterval(countdownInterval);
});

onMounted(() => { 
    fetchOrderHistory(); 
    fetchBankInfo(); 
    startCountdownTimer(); // Bắt đầu đếm ngược
});
</script>

<template>
    <div class="container my-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold mb-0 text-primary">Quản lý Đơn hàng</h2>
            <button @click="fetchOrderHistory" class="btn btn-outline-primary btn-sm rounded-pill px-3">
                <i class="bi bi-arrow-clockwise me-1"></i> Làm mới
            </button>
        </div>

        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>

        <div v-else-if="orders.length > 0" class="card shadow-sm border-0 rounded-3 overflow-hidden">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-dark">
                        <tr>
                            <th class="ps-4 py-3">Mã đơn</th>
                            <th>Người đặt</th>
                            <th>Ngày đặt</th>
                            <th>Tổng tiền</th>
                            <th>Hình thức TT</th>
                            <th>Trạng thái</th>
                            <th class="text-center">Thời gian đổi trả</th>
                            <th class="text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="order in orders" :key="order.id">
                            <td class="ps-4 fw-bold">#DH-{{ order.id }}</td>
                            <td>{{ order.account ? order.account.fullname : 'Khách' }}</td>
                            <td>{{ formatDate(order.createDate).split(' ')[0] }}</td>
                            <td class="text-danger fw-bold">{{ formatPrice(order.totalAmount) }}</td>
                            <td><span class="badge border" :class="getPaymentClass(order)">{{ getPaymentMethodDisplay(order) }}</span></td>
                            <td><span class="badge rounded-pill px-3 py-2" :class="getStatusBadgeClass(order.status)">{{ translateStatus(order.status) }}</span></td>
                            
                            <td class="text-center">
                                <span v-if="order.status === 'DELIVERED'">
                                    <span v-if="getReturnTimeLeft(order).expired" class="text-danger fw-bold small">
                                        <i class="bi bi-x-circle me-1"></i> Hết hạn đổi trả
                                    </span>
                                    <span v-else class="text-success fw-bold small" style="font-variant-numeric: tabular-nums;">
                                        <i class="bi bi-clock-history me-1"></i> {{ getReturnTimeLeft(order).text }}
                                    </span>
                                </span>
                                <span v-else class="text-muted small">-</span>
                            </td>

                            <td class="text-center">
                                <button class="btn btn-primary btn-sm me-2 fw-bold" @click="viewDetails(order.id)"><i class="bi bi-eye"></i> Chi tiết</button>
                                
                                <button v-if="['PENDING', 'CONFIRMED'].includes(order.status)" class="btn btn-warning btn-sm fw-bold me-2" @click="cancelOrder(order)">Hủy đơn</button>
                                
                                <button v-if="canReturnOrder(order)" class="btn btn-outline-secondary btn-sm fw-bold me-2" @click="requestReturn(order)">Hoàn trả</button>
                                
                                <button v-if="['COMPLETED', 'CANCELLED', 'CANCELLED_REFUNDED'].includes(order.status)" class="btn btn-danger btn-sm fw-bold" @click="deleteOrder(order.id)" title="Xóa lịch sử"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-else class="text-center py-5 bg-light rounded-3"><p class="text-muted">Bạn chưa có đơn hàng nào.</p><router-link to="/products" class="btn btn-primary rounded-pill px-4">Mua sắm ngay</router-link></div>

        <div class="modal fade" id="orderDetailModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg rounded-0 overflow-hidden">
                    <div class="modal-header bg-primary text-white py-3 px-4 rounded-0">
                        <h5 class="modal-title fw-bold fs-5"><i class="bi bi-receipt me-2"></i>Chi tiết đơn hàng #DH-{{ selectedOrder.id }}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body p-0 bg-white">
                        <div v-if="!isTransfer(selectedOrder.paymentMethod) && !['CANCELLED','CANCELLED_REFUNDED','DELIVERED','COMPLETED','RETURN_REQUESTED'].includes(selectedOrder.status)" class="alert alert-info m-0 rounded-0 border-0 px-4 py-3 d-flex align-items-center bg-info bg-opacity-10"><i class="bi bi-truck fs-1 me-3 text-info"></i><div><h6 class="fw-bold mb-1 text-info text-uppercase">Đơn hàng Tiền mặt (COD)</h6><span class="small text-dark">Vui lòng chuẩn bị tiền mặt <strong>{{ formatPrice(selectedOrder.totalAmount) }}</strong> khi nhận hàng.</span></div></div>
                        <div v-else-if="isTransfer(selectedOrder.paymentMethod) && selectedOrder.status === 'PENDING'" class="alert alert-warning m-0 rounded-0 border-0 px-4 py-3 bg-warning bg-opacity-10"><div class="d-flex align-items-center justify-content-between"><div class="d-flex align-items-center"><i class="bi bi-exclamation-triangle-fill fs-1 me-3 text-warning"></i><div><h6 class="fw-bold mb-1 text-dark">Chưa thanh toán!</h6><span class="small text-dark">Vui lòng chuyển khoản để xác nhận đơn hàng.</span></div></div><button @click="openPaymentModal" class="btn btn-primary fw-bold px-3 shadow-sm rounded-1"><i class="bi bi-qr-code-scan me-2"></i>Chuyển khoản ngay</button></div></div>
                        <div v-else-if="isTransfer(selectedOrder.paymentMethod) && ['CONFIRMED','PAID','PREPARING','SHIPPING','SHIPPED','DELIVERED','COMPLETED'].includes(selectedOrder.status)" class="alert alert-success m-0 rounded-0 border-0 px-4 py-3 d-flex align-items-center bg-success bg-opacity-10"><i class="bi bi-check-circle-fill fs-1 me-3 text-success"></i><div><h6 class="fw-bold mb-1 text-success text-uppercase">Đã thanh toán thành công!</h6><span class="small text-dark">Đơn hàng của bạn đã được thanh toán chuyển khoản thành công.</span></div></div>

                        <div class="p-4 border-bottom">
                            <div class="row g-4">
                                <div class="col-md-7 border-end">
                                    <h6 class="text-uppercase text-secondary small fw-bold mb-3"><i class="bi bi-geo-alt-fill text-danger me-1"></i> THÔNG TIN NHẬN HÀNG</h6>
                                    <div class="bg-light p-3 rounded border">
                                        <div class="d-flex align-items-center mb-2"><i class="bi bi-person-circle text-secondary me-2"></i><strong class="text-dark">{{ parsedShippingInfo.name }}</strong></div>
                                        <div class="d-flex align-items-center mb-2"><i class="bi bi-telephone-fill text-secondary me-2"></i><span>{{ parsedShippingInfo.phone }}</span></div>
                                        <div class="d-flex align-items-start"><i class="bi bi-house-door-fill text-secondary me-2 mt-1"></i><span>{{ parsedShippingInfo.address }}</span></div>
                                    </div>
                                    <div class="mt-3 text-muted small">
                                        <i class="bi bi-chat-left-text-fill me-1"></i> Ghi chú: <span class="fst-italic text-dark">{{ displayNote || '...' }}</span>
                                    </div>
                                </div>

                                <div class="col-md-5 ps-md-4">
                                    <h6 class="text-uppercase text-secondary small fw-bold mb-3"><i class="bi bi-info-circle-fill text-primary me-1"></i> THÔNG TIN ĐƠN HÀNG</h6>
                                    <div class="mb-3">
                                        <div class="d-flex align-items-center mb-1">
                                            <div class="bg-primary bg-opacity-10 text-primary rounded-circle p-2 me-3" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;"><i class="bi bi-calendar-event fs-5"></i></div>
                                            <div><small class="text-muted d-block">Ngày đặt</small><span class="fw-bold text-dark">{{ formatDate(selectedOrder.createDate) }}</span></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="d-flex align-items-center">
                                            <div class="bg-success bg-opacity-10 text-success rounded-circle p-2 me-3" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;"><i class="bi bi-credit-card fs-5"></i></div>
                                            <div><small class="text-muted d-block">Hình thức</small><span class="fw-bold text-dark">{{ isTransfer(selectedOrder.paymentMethod) ? 'Chuyển khoản (QR)' : 'Tiền mặt (COD)' }}</span></div>
                                        </div>
                                    </div>

                                    <div v-if="returnRequestInfo" class="mt-3 p-2 bg-danger bg-opacity-10 border border-danger rounded">
                                        <h6 class="text-danger small fw-bold mb-2"><i class="bi bi-arrow-return-left me-1"></i> YÊU CẦU HOÀN TRẢ</h6>
                                        <div class="small text-dark" style="font-size: 0.9em;">
                                            <div class="mb-1"><strong>Lý do:</strong> {{ returnRequestInfo.reason }}</div>
                                            <div class="mb-1"><strong>Bank:</strong> {{ returnRequestInfo.bank }}</div>
                                            <div v-if="returnRequestInfo.contact" class="fst-italic text-secondary" style="font-size: 0.85em;">({{ returnRequestInfo.contact }})</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="p-4">
                            <h6 class="text-uppercase text-secondary small fw-bold mb-3">SẢN PHẨM ĐÃ MUA</h6>
                            <div class="table-responsive">
                                <table class="table table-borderless align-middle mb-0">
                                    <thead><tr class="text-secondary small fw-bold border-bottom"><th class="ps-0 pb-2">Sản phẩm</th><th class="text-end pb-2">Đơn giá</th><th class="text-center pb-2">SL</th><th class="text-end pb-2">Thành tiền</th></tr></thead>
                                    <tbody>
                                        <tr v-for="detail in selectedOrder.orderDetails" :key="detail.id" class="border-bottom">
                                            <td class="ps-0 py-3">
                                                <div class="d-flex align-items-center">
                                                    <img :src="getImageUrl(detail.product?.image)" 
                                                         @error="e => e.target.src = 'https://placehold.co/100x100?text=No+Image'"
                                                         class="rounded bg-light border me-3" 
                                                         style="width: 50px; height: 50px; object-fit: cover;">
                                                    <div>
                                                        <div class="fw-bold text-dark">{{ detail.product?.name }}</div>
                                                        <small class="text-muted">Mã SP: #{{ detail.product?.id }}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="text-end text-muted">{{ formatPrice(detail.price) }}</td>
                                            <td class="text-center fw-bold">x{{ detail.quantity }}</td>
                                            <td class="text-end fw-bold text-dark">{{ formatPrice(detail.price * detail.quantity) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer bg-white border-top p-3 d-flex justify-content-between align-items-center"><button type="button" class="btn btn-secondary px-4 rounded-pill fw-bold" data-bs-dismiss="modal">Đóng</button><div class="d-flex align-items-center"><span class="text-secondary text-uppercase small fw-bold me-3">TỔNG THANH TOÁN:</span><span class="text-danger fs-3 fw-bold">{{ formatPrice(selectedOrder.totalAmount) }}</span></div></div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="rePaymentQrModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content text-center shadow-lg border-0 rounded-4">
                    <div class="modal-body p-4 pt-5 position-relative">
                        <button type="button" class="btn-close position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" @click="stopPolling"></button>
                        <p class="text-secondary mb-3">Vui lòng quét mã bên dưới để thanh toán.</p>
                        <div class="position-relative d-inline-block mb-3 p-2 border rounded shadow-sm bg-white" v-if="qrCodeUrl"><img :src="qrCodeUrl" class="img-fluid" style="max-width: 250px;"></div>
                        <div v-else class="text-center py-4"><div class="spinner-border text-primary"></div></div>
                        <div class="d-flex justify-content-center align-items-center mb-4 text-primary fw-bold fs-5"><div class="spinner-border spinner-border-sm me-2" role="status"></div><span>Đang chờ thanh toán...</span></div>
                        <div class="bg-light p-3 rounded text-start border mb-3">
                            <div class="d-flex justify-content-between mb-2"><span class="text-muted">Ngân hàng:</span><span class="fw-bold text-dark text-uppercase">{{ shopBank.bankId }} - {{ shopBank.accountName }}</span></div>
                            <div class="d-flex justify-content-between mb-2"><span class="text-muted">Số tài khoản:</span><span class="fw-bold text-dark fs-5">{{ shopBank.accountNo }}</span></div>
                            <div class="d-flex justify-content-between mb-2"><span class="text-muted">Số tiền:</span><span class="fw-bold text-danger fs-5">{{ formatPrice(selectedOrder.totalAmount) }}</span></div>
                            <div class="d-flex justify-content-between"><span class="text-muted">Nội dung:</span><span class="fw-bold text-primary">DH{{ selectedOrder.id }}</span></div>
                        </div>
                        <div class="alert alert-info small m-0 text-center border-info bg-info bg-opacity-10 text-dark"><i class="bi bi-info-circle me-1"></i>Hệ thống sẽ <strong>tự động chuyển trang</strong> ngay khi nhận được tiền.<br>Bạn không cần làm gì thêm.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-body { max-height: 90vh; overflow-y: auto; }
.modal-body::-webkit-scrollbar { width: 6px; }
.modal-body::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 3px; }
</style>