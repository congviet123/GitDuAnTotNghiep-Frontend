<script setup>
import { reactive, ref, onMounted } from 'vue';
import Swal from 'sweetalert2';
import { voucherService } from '@/services/voucherService';
import * as bootstrap from 'bootstrap';
import apiClient from '@/services/api'; // THÊM DÒNG NÀY

// Dữ liệu form
const voucherForm = reactive({
    code: "",
    description: "",
    type: "percentage",
    value: "",
    minOrderValue: "",
    startDate: "",
    expiryDate: "",
    usageLimit: "",
    perUserLimit: "1",
    status: "draft",
    visibility: "public"
});

// Danh sách voucher
const vouchers = ref([]);

// Loading state
const loading = reactive({
    list: false,
    save: false,
    delete: false
});

// Tab hiện tại
const activeTab = ref('overview');
const editingCode = ref(null);

// ========== THÊM: STATE CHO GỬI EMAIL ==========
const selectedVoucher = ref(null);
const sendEmailType = ref('all');
const singleEmails = ref('');
const sendingEmail = ref(false);
let sendEmailModal = null;
// ========== KẾT THÚC THÊM ==========

// Tạo mã ngẫu nhiên
const generateVoucherCode = () => {
    const prefix = 'VHF';
    const randomNum = Math.floor(10 + Math.random() * 90);
    const randomChars = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                        String.fromCharCode(65 + Math.floor(Math.random() * 26));
    voucherForm.code = `${prefix}${randomNum}${randomChars}`;
};

// Mở form tạo mới
const openCreateForm = () => {
    editingCode.value = null;
    activeTab.value = 'create';
    generateVoucherCode();
    Object.assign(voucherForm, {
        code: "",
        description: "",
        type: "percentage",
        value: "",
        minOrderValue: "",
        startDate: "",
        expiryDate: "",
        usageLimit: "",
        perUserLimit: "1",
        status: "draft",
        visibility: "public"
    });
    generateVoucherCode();
};

// Tải danh sách voucher
const loadVouchers = async () => {
    loading.list = true;
    try {
        const response = await voucherService.getAllVouchers();
        vouchers.value = response.data;
    } catch (error) {
        console.error("Lỗi tải danh sách:", error);
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể tải danh sách voucher!' });
    } finally {
        loading.list = false;
    }
};

// Lưu voucher
const saveVoucher = async () => {
    // Kiểm tra bắt buộc
    if (!voucherForm.code || !voucherForm.value || !voucherForm.startDate || !voucherForm.expiryDate) {
        Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng nhập đầy đủ!' });
        return;
    }

    // Kiểm tra mã hợp lệ
    if (voucherForm.code.includes(' ') || !/^[A-Z0-9]+$/.test(voucherForm.code)) {
        Swal.fire({ icon: 'warning', title: 'Mã không hợp lệ', text: 'Mã chỉ chứa chữ in hoa và số, không dấu cách!' });
        return;
    }

    // Kiểm tra ngày
    if (new Date(voucherForm.startDate) > new Date(voucherForm.expiryDate)) {
        Swal.fire({ icon: 'warning', title: 'Lỗi ngày', text: 'Ngày bắt đầu phải trước ngày kết thúc!' });
        return;
    }

    loading.save = true;
    try {
        const payload = {
            code: voucherForm.code.toUpperCase(),
            name: voucherForm.code.toUpperCase(),
            description: voucherForm.description,
            type: voucherForm.type,
            value: Number(voucherForm.value),
            minOrderValue: voucherForm.minOrderValue ? Number(voucherForm.minOrderValue) : 0,
            startDate: voucherForm.startDate,
            expiryDate: voucherForm.expiryDate,
            usageLimit: voucherForm.usageLimit ? Number(voucherForm.usageLimit) : 0,
            perUserLimit: Number(voucherForm.perUserLimit),
            status: voucherForm.status,
            visibility: voucherForm.visibility
        };
        
        if (editingCode.value) {
            await voucherService.updateVoucher(editingCode.value, payload);
            Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã cập nhật voucher!', timer: 1500, showConfirmButton: false });
        } else {
            await voucherService.createVoucher(payload);
            Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã tạo voucher mới!', timer: 1500, showConfirmButton: false });
        }
        
        await loadVouchers();
        activeTab.value = 'overview';
    } catch (error) {
        console.error("Lỗi lưu:", error);
        let msg = error.response?.data || 'Không thể lưu voucher!';
        if (msg.includes('tồn tại')) msg = 'Mã voucher đã tồn tại!';
        Swal.fire({ icon: 'error', title: 'Lỗi', text: msg });
    } finally {
        loading.save = false;
    }
};

// Xóa voucher
const deleteVoucher = (code) => {
    Swal.fire({
        title: 'Xóa voucher?',
        text: `Xóa voucher "${code}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    }).then(async (result) => {
        if (result.isConfirmed) {
            loading.delete = true;
            try {
                await voucherService.deleteVoucher(code);
                await loadVouchers();
                Swal.fire({ icon: 'success', title: 'Đã xóa', text: 'Xóa thành công!', timer: 1500, showConfirmButton: false });
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể xóa voucher!' });
            } finally {
                loading.delete = false;
            }
        }
    });
};

// Sửa voucher
const editVoucher = (voucher) => {
    editingCode.value = voucher.code;
    voucherForm.code = voucher.code;
    voucherForm.description = voucher.description || "";
    voucherForm.type = voucher.type;
    voucherForm.value = voucher.value;
    voucherForm.minOrderValue = voucher.minOrderValue;
    voucherForm.startDate = voucher.startDate;
    voucherForm.expiryDate = voucher.expiryDate;
    voucherForm.usageLimit = voucher.usageLimit;
    voucherForm.perUserLimit = voucher.perUserLimit;
    voucherForm.status = voucher.status;
    voucherForm.visibility = voucher.visibility;
    activeTab.value = 'create';
};

// ========== THÊM: HÀM MỞ MODAL GỬI EMAIL ==========
const openSendEmailModal = (voucher) => {
    selectedVoucher.value = voucher;
    sendEmailType.value = 'all';
    singleEmails.value = '';
    if (!sendEmailModal) {
        sendEmailModal = new bootstrap.Modal(document.getElementById('sendEmailModal'));
    }
    sendEmailModal.show();
};

// Gửi email voucher
const sendVoucherEmail = async () => {
    if (!selectedVoucher.value) return;
    
    let emails = [];
    if (sendEmailType.value === 'single') {
        if (!singleEmails.value.trim()) {
            Swal.fire('Thông báo', 'Vui lòng nhập email!', 'warning');
            return;
        }
        emails = singleEmails.value.split(',').map(e => e.trim()).filter(e => e);
    }
    
    sendingEmail.value = true;
    try {
        const payload = {
            voucherCode: selectedVoucher.value.code,
            sendType: sendEmailType.value,
            emails: emails
        };
        
        const response = await apiClient.post('/vouchers/send-email', payload);
        
        Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: response.data,
            timer: 3000,
            showConfirmButton: false
        });
        
        sendEmailModal.hide();
        
    } catch (error) {
        console.error('Lỗi gửi email:', error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: error.response?.data || 'Không thể gửi email!'
        });
    } finally {
        sendingEmail.value = false;
    }
};
// ========== KẾT THÚC THÊM ==========

// Format tiền tệ
const formatCurrency = (value) => {
    if (!value && value !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// Format ngày
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
};

// Badge trạng thái
const getStatusBadge = (status) => status === 'published' ? 'bg-success' : 'bg-warning';
const getStatusText = (status) => status === 'published' ? 'Đã xuất bản' : 'Bản nháp';

// Kiểm tra hiệu lực
const isValid = (start, end) => {
    if (!start || !end) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return today >= startDate && today <= endDate;
};

onMounted(() => {
    loadVouchers();
    // THÊM: Khởi tạo modal gửi email
    const modalEl = document.getElementById('sendEmailModal');
    if (modalEl) {
        sendEmailModal = new bootstrap.Modal(modalEl);
    }
});
</script>

<template>
    <div class="container-fluid p-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-primary fw-bold">Quản lý Voucher</h2>
            <button v-if="activeTab === 'overview'" class="btn btn-primary px-4" @click="openCreateForm">
                <i class="bi bi-plus-lg me-1"></i> Tạo voucher
            </button>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs mb-4">
            <li class="nav-item">
                <a class="nav-link" :class="{ active: activeTab === 'overview' }" href="#" @click.prevent="activeTab = 'overview'">
                    <i class="bi bi-list-ul me-2"></i>Tổng quan
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: activeTab === 'create' }" href="#" @click.prevent="activeTab = 'create'">
                    <i class="bi bi-plus-circle me-2"></i>{{ editingCode ? 'Sửa' : 'Tạo' }} voucher
                </a>
            </li>
        </ul>

        <!-- Tab tổng quan -->
        <div v-if="activeTab === 'overview'">
            <div class="card shadow-sm border-0">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th>Mã</th>
                                    <th>Mô tả</th>
                                    <th>Giảm giá</th>
                                    <th>Đơn tối thiểu</th>
                                    <th>Hiệu lực</th>
                                    <th>Số lượng</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="v in vouchers" :key="v.code">
                                    <td><span class="badge bg-dark p-2 font-monospace">{{ v.code }}</span></td>
                                    <td>
                                        <div class="fw-bold">{{ v.name }}</div>
                                        <small class="text-muted">{{ v.description }}</small>
                                    </td>
                                    <td>
                                        <span v-if="v.type === 'percentage'" class="text-success fw-bold">{{ v.value }}%</span>
                                        <span v-else class="text-primary fw-bold">{{ formatCurrency(v.value) }}</span>
                                    </td>
                                    <td>
                                        <span v-if="v.minOrderValue > 0" class="text-warning">{{ formatCurrency(v.minOrderValue) }}</span>
                                        <span v-else class="text-muted">Không</span>
                                    </td>
                                    <td>
                                        <div class="small">
                                            <div><i class="bi bi-calendar-start text-success"></i> {{ formatDate(v.startDate) }}</div>
                                            <div><i class="bi bi-calendar-end text-danger"></i> {{ formatDate(v.expiryDate) }}</div>
                                            <span v-if="isValid(v.startDate, v.expiryDate)" class="badge bg-success bg-opacity-10 text-success mt-1">
                                                <i class="bi bi-check-circle"></i> Còn hiệu lực
                                            </span>
                                            <span v-else class="badge bg-secondary bg-opacity-10 text-secondary mt-1">
                                                <i class="bi bi-x-circle"></i> Hết hạn
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div>{{ v.usedCount || 0 }} / {{ v.usageLimit || '∞' }}</div>
                                        <div v-if="v.usageLimit > 0" class="progress" style="height: 4px;">
                                            <div class="progress-bar" :style="{ width: ((v.usedCount || 0) / v.usageLimit * 100) + '%' }"></div>
                                        </div>
                                    </td>
                                    <td><span class="badge" :class="getStatusBadge(v.status)">{{ getStatusText(v.status) }}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" @click="editVoucher(v)"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-sm btn-outline-danger me-1" @click="deleteVoucher(v.code)"><i class="bi bi-trash"></i></button>
                                        <!-- THÊM NÚT GỬI MAIL -->
                                        <button class="btn btn-sm btn-outline-success" @click="openSendEmailModal(v)" title="Gửi mail">
                                            <i class="bi bi-envelope-paper"></i>
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="vouchers.length === 0">
                                    <td colspan="8" class="text-center py-5 text-muted">Chưa có voucher nào</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab tạo/sửa voucher -->
        <div v-if="activeTab === 'create'" class="row">
            <div class="col-lg-8">
                <div class="card shadow-sm border-0">
                    <div class="card-body">
                        <!-- Mã voucher -->
                        <div class="mb-4 p-3 bg-light rounded">
                            <label class="form-label fw-bold">Mã ưu đãi <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <input type="text" class="form-control font-monospace" v-model="voucherForm.code" 
                                    placeholder="VD: VHF20AB" style="text-transform: uppercase">
                                <button class="btn btn-outline-primary" type="button" @click="generateVoucherCode">
                                    <i class="bi bi-shuffle"></i> Tạo ngẫu nhiên
                                </button>
                            </div>
                            <div class="form-text">Mã khách hàng nhập khi thanh toán. Chỉ chứa chữ in hoa và số.</div>
                        </div>

                        <!-- Mô tả -->
                        <div class="mb-3">
                            <label class="form-label fw-bold">Mô tả</label>
                            <textarea class="form-control" v-model="voucherForm.description" rows="2" placeholder="Mô tả chi tiết..."></textarea>
                        </div>

                        <!-- Thông tin ưu đãi -->
                        <div class="card mb-3">
                            <div class="card-header bg-white"><h6 class="fw-bold m-0">Thông tin ưu đãi</h6></div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label fw-bold">Loại ưu đãi</label>
                                        <select class="form-select" v-model="voucherForm.type">
                                            <option value="percentage">Giảm theo %</option>
                                            <option value="fixed">Giảm theo số tiền</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label fw-bold">Mức ưu đãi <span class="text-danger">*</span></label>
                                        <div class="input-group">
                                            <input type="number" class="form-control" v-model="voucherForm.value">
                                            <span class="input-group-text">{{ voucherForm.type === 'percentage' ? '%' : '₫' }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label fw-bold">Đơn hàng tối thiểu</label>
                                    <div class="input-group">
                                        <span class="input-group-text">₫</span>
                                        <input type="number" class="form-control" v-model="voucherForm.minOrderValue" placeholder="Để trống nếu không yêu cầu">
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label fw-bold">Ngày bắt đầu <span class="text-danger">*</span></label>
                                        <input type="date" class="form-control" v-model="voucherForm.startDate">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label fw-bold">Ngày hết hạn <span class="text-danger">*</span></label>
                                        <input type="date" class="form-control" v-model="voucherForm.expiryDate">
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label fw-bold">Số lượng</label>
                                        <input type="number" class="form-control" v-model="voucherForm.usageLimit" placeholder="Để trống nếu không giới hạn">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label fw-bold">Giới hạn mỗi người</label>
                                        <select class="form-select" v-model="voucherForm.perUserLimit">
                                            <option value="1">1 lần</option>
                                            <option value="2">2 lần</option>
                                            <option value="3">3 lần</option>
                                            <option value="5">5 lần</option>
                                            <option value="10">10 lần</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <div class="card shadow-sm border-0">
                    <div class="card-header bg-white"><h6 class="fw-bold m-0">Xuất bản</h6></div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Trạng thái</label>
                            <select class="form-select" v-model="voucherForm.status">
                                <option value="draft">Bản nháp</option>
                                <option value="published">Công khai</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Hiển thị</label>
                            <select class="form-select" v-model="voucherForm.visibility">
                                <option value="public">Công khai</option>
                                <option value="private">Riêng tư</option>
                            </select>
                        </div>

                        <hr>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" @click="saveVoucher" :disabled="loading.save">
                                <i class="bi bi-save me-1"></i> {{ loading.save ? 'Đang lưu...' : (editingCode ? 'Cập nhật' : 'Tạo mới') }}
                            </button>
                            <button class="btn btn-outline-secondary" @click="activeTab = 'overview'">Hủy</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ========== THÊM: Modal gửi email voucher ========== -->
        <div class="modal fade" id="sendEmailModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title fw-bold">
                            <i class="bi bi-envelope-paper me-2"></i> Gửi email voucher
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Voucher: <span class="text-success">{{ selectedVoucher?.code }}</span></label>
                            <div class="small text-muted">{{ selectedVoucher?.name }} - Giảm {{ selectedVoucher?.type === 'percentage' ? selectedVoucher?.value + '%' : formatCurrency(selectedVoucher?.value) }}</div>
                        </div>
                        
                        <hr>
                        
                        <div class="mb-3">
                            <label class="form-label fw-bold">Chọn người nhận:</label>
                            <div class="d-flex gap-3 mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" v-model="sendEmailType" value="all" id="sendAll">
                                    <label class="form-check-label" for="sendAll">
                                        <i class="bi bi-people-fill me-1"></i> Tất cả khách hàng (USER)
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" v-model="sendEmailType" value="single" id="sendSingle">
                                    <label class="form-check-label" for="sendSingle">
                                        <i class="bi bi-person me-1"></i> Cá nhân
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Ô nhập email khi chọn cá nhân -->
                        <div v-if="sendEmailType === 'single'" class="mb-3">
                            <label class="form-label fw-bold">Nhập email (mỗi email cách nhau dấu phẩy):</label>
                            <textarea class="form-control" v-model="singleEmails" rows="3" 
                                      placeholder="VD: user1@gmail.com, user2@gmail.com"></textarea>
                            <div class="form-text text-muted small">Có thể nhập nhiều email, cách nhau bằng dấu phẩy</div>
                        </div>
                        
                        <div class="alert alert-info small">
                            <i class="bi bi-info-circle me-1"></i>
                            Email sẽ được gửi kèm mã voucher và thông tin giảm giá đến khách hàng.
                        </div>
                    </div>
                    <div class="modal-footer bg-light">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                        <button type="button" class="btn btn-success" @click="sendVoucherEmail" :disabled="sendingEmail">
                            <i class="bi bi-send me-1"></i> {{ sendingEmail ? 'Đang gửi...' : 'Gửi ngay' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <!-- ========== KẾT THÚC THÊM ========== -->
    </div>
</template>