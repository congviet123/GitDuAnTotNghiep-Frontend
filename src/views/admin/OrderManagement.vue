<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import apiClient from '@/services/api';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';

// --- STATE ---
const orders = ref([]);
const loading = ref(false);
const error = ref(null);
const selectedIds = ref([]); // Danh sách ID các đơn hàng được chọn để in hàng loạt
const selectAll = ref(false); // Trạng thái của checkbox "Chọn tất cả"

// --- TRẠNG THÁI BỘ LỌC ---
const filter = reactive({
    status: 'ALL',
    paymentMethod: 'ALL',
    startDate: '',
    endDate: '',
    quickType: 'all'
});

// Form cập nhật trạng thái đơn hàng
const updateForm = reactive({
    status: '',
    sendEmail: false,
    message: ''
});

// Cấu hình in hóa đơn
const printConfig = reactive({
    orderId: null,      // ID đơn hàng nếu in lẻ
    isBulk: false,      // Cờ đánh dấu in hàng loạt hay in lẻ
    paperSize: 'A4'     // Khổ giấy mặc định
});

// Đơn hàng đang được chọn để xem chi tiết hoặc cập nhật
const selectedOrder = reactive({
    id: null, account: {}, totalAmount: 0, createDate: null,
    orderDetails: [], status: '', shippingAddress: '', notes: '', paymentMethod: '',
    isPrinted: false
});

// Các tùy chọn trạng thái đơn hàng
const statusOptions = [
    { value: 'PENDING', label: 'Đang chờ xử lý' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'PREPARING', label: 'Đang chuẩn bị đơn' },
    { value: 'SHIPPING', label: 'Đang vận chuyển' },
    { value: 'SHIPPED', label: 'Đang giao hàng' },
    { value: 'DELIVERED', label: 'Giao thành công' },
    { value: 'COMPLETED', label: 'Hoàn tất đơn' },
    { value: 'CANCEL_REQUESTED', label: 'Chờ xác nhận hủy' },
    { value: 'CANCELLED_REFUNDED', label: 'Hủy thành công - Đã hoàn tiền' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'RETURN_REQUESTED', label: 'Yêu cầu trả hàng' },
    { value: 'HIDDEN', label: 'Đã ẩn đơn hàng' }
];

// --- LOGIC PARSER GHI CHÚ ---
const parsedReturnInfo = computed(() => {
    const noteRaw = selectedOrder.notes || '';
    const returnKey = "| Yêu cầu trả:";
    if (noteRaw.includes(returnKey)) {
        const parts = noteRaw.split(returnKey);
        const cleanNote = parts[0].trim();
        const returnPart = parts[1];
        let reason = returnPart;
        let banking = "Không có thông tin ngân hàng";
        if (returnPart.includes('[') && returnPart.includes(']')) {
            const splitBracket = returnPart.split('[');
            reason = splitBracket[0].trim();
            banking = splitBracket[1].replace(']', '').trim();
        }
        return { isReturn: true, reason: reason, bankingInfo: banking, cleanNote: cleanNote };
    }
    return { isReturn: false, reason: '', bankingInfo: '', cleanNote: noteRaw };
});

// --- METHODS ---

// Xử lý Checkbox "Chọn tất cả"
const toggleSelectAll = () => {
    if (selectAll.value) {
        selectedIds.value = orders.value.map(o => o.id);
    } else {
        selectedIds.value = [];
    }
};

// Reset lựa chọn khi danh sách đơn hàng thay đổi
watch(orders, () => {
    selectedIds.value = [];
    selectAll.value = false;
});

const toDateString = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

// Xử lý bộ lọc nhanh
const setQuickFilter = (type) => {
    filter.quickType = type;
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
        // Hôm nay: start và end mặc định là now, chỉ cần format lại khi gọi API
    } else if (type === 'yesterday') {
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
    } else if (type === '7days') {
        start.setDate(now.getDate() - 7);
    } else {
        // Reset bộ lọc
        filter.status = 'ALL';
        filter.paymentMethod = 'ALL';
        filter.startDate = '';
        filter.endDate = '';
        filter.quickType = 'all';
        fetchOrders();
        return;
    }

    filter.startDate = toDateString(start);
    filter.endDate = toDateString(end);
    fetchOrders();
};

// Lấy danh sách đơn hàng từ API
const fetchOrders = async () => {
    loading.value = true;
    try {
        const params = {};
        if (filter.status !== 'ALL') params.status = filter.status;
        if (filter.paymentMethod !== 'ALL') params.paymentMethod = filter.paymentMethod;
        if (filter.startDate) params.startDate = filter.startDate + "T00:00:00";
        if (filter.endDate) params.endDate = filter.endDate + "T23:59:59";

        const response = await apiClient.get('/admin/orders', { params });
        const data = response.data.content || response.data;
        orders.value = Array.isArray(data) ? data.sort((a, b) => new Date(b.createDate) - new Date(a.createDate)) : [];
    } catch (err) {
        error.value = 'Lỗi tải danh sách hóa đơn.';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// Làm mới dữ liệu
const refreshData = () => {
    setQuickFilter('all');
};

// Xem chi tiết đơn hàng
const viewDetails = async (orderId) => {
    try {
        const response = await apiClient.get(`/admin/orders/${orderId}`);
        Object.assign(selectedOrder, response.data);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('orderModal')).show();
    } catch (err) {
        Swal.fire('Lỗi', 'Không thể tải chi tiết.', 'error');
    }
};

// Mở modal cập nhật trạng thái
const openStatusModal = (order) => {
    Object.assign(selectedOrder, order);
    updateForm.status = order.status;
    updateForm.sendEmail = false;
    updateForm.message = `Xin chào ${getOrdererName(order)}, đơn hàng #${order.id} của bạn đã được cập nhật trạng thái: ${translateStatus(order.status)}.`;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('statusModal')).show();
};

// Thực hiện cập nhật trạng thái
const updateOrderStatus = async () => {
    loading.value = true;
    try {
        const payload = { status: updateForm.status, sendEmail: updateForm.sendEmail.toString(), message: updateForm.message };
        await apiClient.put(`/admin/orders/${selectedOrder.id}/status`, payload);
        
        // Cập nhật UI
        const index = orders.value.findIndex(o => o.id === selectedOrder.id);
        if (index !== -1) orders.value[index].status = updateForm.status;
        
        Swal.fire('Thành công', 'Đã cập nhật đơn hàng.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('statusModal')).hide();
    } catch (err) {
        Swal.fire('Lỗi', 'Cập nhật thất bại.', 'error');
    } finally {
        loading.value = false;
    }
};

// Xóa đơn hàng
const deleteOrder = async (orderId) => {
    const result = await Swal.fire({ title: 'Xóa đơn hàng?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Xóa' });
    if (result.isConfirmed) {
        try {
            await apiClient.delete(`/admin/orders/${orderId}`);
            orders.value = orders.value.filter(o => o.id !== orderId);
            Swal.fire('Đã xóa!', '', 'success');
        } catch (err) {
            Swal.fire('Lỗi', 'Không thể xóa.', 'error');
        }
    }
};

// --- LOGIC IN HÓA ĐƠN PDF ---

// Mở modal in LẺ (cho 1 đơn)
const openPrintModal = (order) => {
    printConfig.orderId = order.id;
    printConfig.isBulk = false;
    printConfig.paperSize = 'A4';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('printModal')).show();
};

// Mở modal in HÀNG LOẠT (cho nhiều đơn)
const openBulkPrintModal = () => {
    if (selectedIds.value.length === 0) {
        Swal.fire('Chưa chọn đơn hàng', 'Vui lòng tích chọn ít nhất 1 đơn hàng để in.', 'warning');
        return;
    }
    printConfig.isBulk = true;
    printConfig.paperSize = 'A4';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('printModal')).show();
}

// Thực hiện tải file PDF
const downloadInvoice = async () => {
    try {
        bootstrap.Modal.getInstance(document.getElementById('printModal')).hide();

        Swal.fire({
            title: 'Đang tạo PDF...',
            text: printConfig.isBulk ? `Đang gộp ${selectedIds.value.length} hóa đơn...` : `Đang xuất hóa đơn khổ ${printConfig.paperSize}...`,
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        let response;
        let fileName = "";

        if (printConfig.isBulk) {
            // API IN NHIỀU
            const idsString = selectedIds.value.join(',');
            response = await apiClient.get(`/admin/orders/export-pdf/bulk`, {
                params: { ids: idsString, paperSize: printConfig.paperSize },
                responseType: 'blob'
            });
            fileName = `HoaDon_TongHop_${printConfig.paperSize}.pdf`;
        } else {
            // API IN LẺ
            response = await apiClient.get(`/admin/orders/${printConfig.orderId}/export-pdf`, {
                params: { paperSize: printConfig.paperSize },
                responseType: 'blob' 
            });
            fileName = `HoaDon_DH${printConfig.orderId}_${printConfig.paperSize}.pdf`;
        }

        // Tạo link tải ảo
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        
        // Dọn dẹp
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Cập nhật trạng thái "Đã in" trên giao diện
        if (printConfig.isBulk) {
            selectedIds.value.forEach(id => {
                const index = orders.value.findIndex(o => o.id === id);
                if (index !== -1) orders.value[index].isPrinted = true;
            });
            selectedIds.value = []; // Reset sau khi in xong
            selectAll.value = false;
        } else {
            const index = orders.value.findIndex(o => o.id === printConfig.orderId);
            if (index !== -1) orders.value[index].isPrinted = true;
        }

        Swal.fire({ icon: 'success', title: 'Thành công!', text: 'File PDF đã được tải xuống.' });

    } catch (err) {
        console.error("Lỗi gốc:", err);
        if (err.response && err.response.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const errorJson = JSON.parse(reader.result);
                    Swal.fire('Lỗi Backend', errorJson.message || 'Lỗi không xác định', 'error');
                } catch (e) {
                    Swal.fire('Lỗi', 'Đã xảy ra lỗi 500 nhưng không đọc được nội dung.', 'error');
                }
            };
            reader.readAsText(err.response.data);
        } else {
            Swal.fire('Lỗi', 'Không thể xuất hóa đơn. Vui lòng thử lại.', 'error');
        }
    }
};

// --- HELPERS ---
const translateStatus = (s) => statusOptions.find(opt => opt.value === s)?.label || s;
const getBadgeClass = (s) => {
    if (['DELIVERED', 'COMPLETED'].includes(s)) return 'bg-success';
    if (['PENDING', 'CANCEL_REQUESTED'].includes(s)) return 'bg-warning text-dark';
    if (['CANCELLED', 'CANCELLED_REFUNDED'].includes(s)) return 'bg-danger';
    return 'bg-primary';
};
const canDelete = (s) => ['COMPLETED', 'HIDDEN', 'CANCELLED', 'CANCELLED_REFUNDED'].includes(s);
const getPaymentMethodName = (m) => m === 'BANK' ? 'Chuyển khoản' : 'Tiền mặt (COD)'; 
const getPaymentMethodClass = (m) => m === 'BANK' ? 'text-primary border-primary' : 'text-success border-success';
const getOrdererName = (o) => o.account?.fullname || o.account?.username || 'Khách vãng lai';
const getOrdererEmail = (o) => o.account?.email || 'N/A';
const getImageUrl = (img) => img ? `http://localhost:8080/imgs/${img.replace(/^\/|imgs\//g, '')}` : 'https://placehold.co/50x50';
const formatPrice = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN') : 'N/A';

onMounted(fetchOrders);
</script>

<template>
  <div class="container-fluid py-4 bg-light min-vh-100">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="text-primary fw-bold mb-0">Quản lý Đơn hàng</h2>
        <div>
            <button v-if="selectedIds.length > 0" class="btn btn-dark shadow-sm me-2" @click="openBulkPrintModal">
                <i class="bi bi-printer-fill me-1"></i> In {{ selectedIds.length }} đơn đã chọn
            </button>
            <button class="btn btn-outline-primary shadow-sm" @click="refreshData">
                <i class="bi bi-arrow-clockwise"></i> Làm mới
            </button>
        </div>
    </div>

    <div class="card p-3 mb-4 shadow-sm border-0 bg-white">
        <div class="row g-3 align-items-end">
            <div class="col-lg-2">
                <label class="form-label small fw-bold text-muted">Trạng thái</label>
                <select class="form-select border-primary-subtle shadow-sm" v-model="filter.status" @change="fetchOrders">
                    <option value="ALL">--- Tất cả ---</option>
                    <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{opt.label}}</option>
                </select>
            </div>
            <div class="col-lg-2">
                <label class="form-label small fw-bold text-muted">Thanh toán</label>
                <select class="form-select border-primary-subtle shadow-sm" v-model="filter.paymentMethod" @change="fetchOrders">
                    <option value="ALL">--- Tất cả ---</option>
                    <option value="COD">Tiền mặt (COD)</option>
                    <option value="BANK">Chuyển khoản / QR</option>
                </select>
            </div>
            <div class="col-lg-5">
                <label class="form-label small fw-bold text-muted">Thời gian (Từ ngày - Đến ngày)</label>
                <div class="input-group shadow-sm">
                    <input type="date" class="form-control border-primary-subtle" v-model="filter.startDate">
                    <span class="input-group-text bg-light border-primary-subtle">đến</span>
                    <input type="date" class="form-control border-primary-subtle" v-model="filter.endDate">
                    <button class="btn btn-primary px-3" @click="fetchOrders"><i class="bi bi-search"></i></button>
                </div>
            </div>
            <div class="col-lg-3 text-lg-end">
                <div class="btn-group btn-group-sm w-100 shadow-sm">
                    <button class="btn btn-outline-primary" :class="{active: filter.quickType === 'today'}" @click="setQuickFilter('today')">Hôm nay</button>
                    <button class="btn btn-outline-primary" :class="{active: filter.quickType === 'yesterday'}" @click="setQuickFilter('yesterday')">Hôm qua</button>
                    <button class="btn btn-outline-primary" :class="{active: filter.quickType === '7days'}" @click="setQuickFilter('7days')">7 ngày</button>
                    <button class="btn btn-outline-danger" @click="setQuickFilter('all')" title="Xóa tất cả bộ lọc">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div v-if="loading && orders.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
    </div>

    <div v-else class="card shadow-sm border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th class="ps-3 py-3" style="width: 40px;">
                  <input type="checkbox" class="form-check-input" v-model="selectAll" @change="toggleSelectAll">
              </th>
              <th class="py-3">Mã đơn</th>
              <th class="py-3">Người đặt</th>
              <th class="py-3">Ngày đặt</th>
              <th class="py-3">Tổng tiền</th>
              <th class="py-3">Thanh toán</th>
              <th class="py-3">Trạng thái</th>
              <th class="text-end pe-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id" :class="{'table-active': selectedIds.includes(order.id)}">
              <td class="ps-3">
                  <input type="checkbox" class="form-check-input" :value="order.id" v-model="selectedIds">
              </td>
              <td>
                  <div class="fw-bold">#DH-{{ order.id }}</div>
                  <span v-if="order.isPrinted" class="badge bg-success-subtle text-success border border-success mt-1">
                    <i class="bi bi-check-circle-fill me-1"></i>Đã in
                  </span>
              </td>
              <td>
                  <div class="fw-bold text-dark">{{ getOrdererName(order) }}</div>
                  <small class="text-muted">{{ getOrdererEmail(order) }}</small>
              </td> 
              <td style="font-size: 0.9rem;">{{ formatDate(order.createDate) }}</td>
              <td class="text-danger fw-bold">{{ formatPrice(order.totalAmount) }}</td> 
              <td>
                <span class="badge border shadow-sm" :class="getPaymentMethodClass(order.paymentMethod)">
                    {{ getPaymentMethodName(order.paymentMethod) }}
                </span>
              </td>
              <td>
                <span class="badge rounded-pill px-3 py-2 shadow-sm" :class="getBadgeClass(order.status)">
                  {{ translateStatus(order.status) }}
                </span>
              </td>
              <td class="text-end pe-3">
                <button class="btn btn-primary btn-sm me-1 shadow-sm" @click="viewDetails(order.id)" title="Xem"><i class="bi bi-eye"></i></button>
                <button class="btn btn-dark btn-sm me-1 shadow-sm" @click="openPrintModal(order)" title="In"><i class="bi bi-printer-fill"></i></button>
                <button class="btn btn-warning btn-sm me-1 shadow-sm" @click="openStatusModal(order)" title="Sửa"><i class="bi bi-pencil-square"></i></button>
                <button v-if="canDelete(order.status)" class="btn btn-outline-danger btn-sm shadow-sm" @click="deleteOrder(order.id)"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
            <tr v-if="orders.length === 0">
                <td colspan="8" class="text-center py-5 text-muted fst-italic">Không tìm thấy hóa đơn nào phù hợp.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal fade" id="orderModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold"><i class="bi bi-receipt me-2"></i>Chi tiết #DH-{{ selectedOrder.id }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0" v-if="selectedOrder.id">
            <div class="p-4">
                <div class="row g-4">
                    <div class="col-md-7">
                        <h6 class="text-secondary fw-bold mb-3">KHÁCH HÀNG</h6>
                        <div class="card border-0 shadow-sm bg-white p-3">
                            <div class="fw-bold fs-5 text-primary">{{ getOrdererName(selectedOrder) }}</div>
                            <div class="text-muted small"><i class="bi bi-geo-alt me-1"></i>{{ selectedOrder.shippingAddress }}</div>
                            <div class="mt-2 p-2 bg-light border-start border-4 border-warning small">
                                <strong>Ghi chú:</strong> {{ parsedReturnInfo.cleanNote || 'Không có' }}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-5">
                        <h6 class="text-secondary fw-bold mb-3">GIAO DỊCH</h6>
                        <div class="card border-0 shadow-sm bg-white p-3">
                            <div class="mb-1"><small>Thanh toán:</small> <span class="fw-bold text-primary">{{ getPaymentMethodName(selectedOrder.paymentMethod) }}</span></div>
                            <div v-if="parsedReturnInfo.isReturn" class="alert alert-danger p-2 mt-2 mb-0 small">
                                <strong>Hoàn tiền:</strong> {{ parsedReturnInfo.reason }}<br>
                                <strong>Bank:</strong> {{ parsedReturnInfo.bankingInfo }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4">
                    <table class="table align-middle border">
                        <thead class="table-light"><tr><th>Sản phẩm</th><th class="text-end">Đơn giá</th><th class="text-center">SL</th><th class="text-end">Tổng</th></tr></thead>
                        <tbody>
                            <tr v-for="d in selectedOrder.orderDetails" :key="d.id">
                                <td><img :src="getImageUrl(d.product.image)" class="rounded me-2" style="width: 40px;">{{ d.product.name }}</td>
                                <td class="text-end">{{ formatPrice(d.price) }}</td>
                                <td class="text-center">x{{ d.quantity }}</td>
                                <td class="text-end fw-bold text-danger">{{ formatPrice(d.price * d.quantity) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
          <div class="modal-footer bg-light d-flex justify-content-between">
             <button type="button" class="btn btn-secondary rounded-pill" data-bs-dismiss="modal">Đóng</button>
             <div class="text-end">
                 <small class="text-muted d-block">TỔNG CỘNG</small>
                 <span class="fs-4 fw-bold text-danger">{{ formatPrice(selectedOrder.totalAmount) }}</span>
             </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="statusModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-warning">
            <h5 class="modal-title fw-bold">Cập nhật đơn #DH-{{ selectedOrder.id }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
                <label class="form-label fw-bold">Chọn trạng thái:</label>
                <select class="form-select border-warning mb-3" v-model="updateForm.status">
                    <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <div class="form-check form-switch mb-2">
                    <input class="form-check-input" type="checkbox" id="emailSwitch" v-model="updateForm.sendEmail">
                    <label class="form-check-label fw-bold text-primary" for="emailSwitch">Gửi email thông báo</label>
                </div>
                <textarea v-if="updateForm.sendEmail" class="form-control" rows="3" v-model="updateForm.message"></textarea>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Hủy</button>
            <button type="button" class="btn btn-warning fw-bold px-4" @click="updateOrderStatus" :disabled="loading">Xác nhận</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="printModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header bg-dark text-white">
                    <h5 class="modal-title fw-bold">
                        <i class="bi bi-printer me-2"></i>
                        {{ printConfig.isBulk ? `In ${selectedIds.length} hóa đơn` : `In đơn #DH-${printConfig.orderId}` }}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Chọn Khổ giấy:</label>
                        <select class="form-select" v-model="printConfig.paperSize">
                            <option value="A4">A4 (Văn phòng tiêu chuẩn)</option>
                            <option value="A5">A5 (Sổ tay)</option>
                            <option value="A6">A6 (Máy in nhiệt, đơn nhỏ)</option>
                            <option value="A7">A7 (Bill nhỏ)</option>
                        </select>
                    </div>
                    <div class="alert alert-info small mb-0">
                        <i class="bi bi-info-circle me-1"></i> 
                        {{ printConfig.isBulk ? 'Hệ thống sẽ tạo 1 file PDF chứa tất cả hóa đơn (mỗi đơn 1 trang).' : 'Mã QR sẽ được tự động tích hợp để tra cứu.' }}
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Đóng</button>
                    <button type="button" class="btn btn-dark fw-bold px-4" @click="downloadInvoice">
                        <i class="bi bi-download me-2"></i>Tải PDF
                    </button>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>

<style scoped>
.table thead th { font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px; }
.badge { font-weight: 600; font-size: 0.8rem; }
.card { border-radius: 12px; }
.table-active { background-color: #f0f8ff !important; } /* Highlight dòng được chọn */
</style>