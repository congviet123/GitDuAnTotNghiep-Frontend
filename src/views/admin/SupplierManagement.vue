<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';

// --- STATE ---
const suppliers = ref([]);
const isEdit = ref(false);
let supplierModal = null;

// Form dữ liệu (Khớp với bảng Supplier)
const form = reactive({
    id: null,
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
    active: true
});

const searchQuery = ref('');

// --- MOCK DATA ---
onMounted(() => {
    supplierModal = new bootstrap.Modal(document.getElementById('supplierModal'));
    
    // Dữ liệu giả
    suppliers.value = [
        {
            id: 1, name: "Công ty TNHH Rau Sạch Việt", contact_name: "Nguyễn Văn A", 
            phone: "0901234567", email: "contact@rausach.vn", address: "Hà Nội",
            bank_name: "Vietcombank", bank_account_number: "9988776655", bank_account_holder: "NGUYEN VAN A",
            active: true
        },
        {
            id: 2, name: "Vựa Trái Cây Miền Tây", contact_name: "Trần Thị B", 
            phone: "0909888777", email: "mientayfruit@gmail.com", address: "Cần Thơ",
            bank_name: "Techcombank", bank_account_number: "1122334455", bank_account_holder: "TRAN THI B",
            active: true
        }
    ];
});

// --- FILTER (LOGIC CŨ GIỮ NGUYÊN) ---
const filteredSuppliers = computed(() => {
    if (!searchQuery.value) return suppliers.value;
    const lower = searchQuery.value.toLowerCase();
    return suppliers.value.filter(s => 
        s.name.toLowerCase().includes(lower) || 
        s.phone.includes(lower) ||
        s.contact_name.toLowerCase().includes(lower)
    );
});

// Hàm xử lý khi bấm nút Tìm kiếm (Có thể mở rộng gọi API sau này)
const handleSearch = () => {
    console.log("Đang tìm kiếm với từ khóa:", searchQuery.value);
    // Hiện tại logic computed đã tự lọc real-time nên không cần code thêm ở đây
};

// --- CRUD ---
const openModal = (item = null) => {
    if (item) {
        isEdit.value = true;
        Object.assign(form, item);
    } else {
        isEdit.value = false;
        Object.assign(form, {
            id: null, name: '', contact_name: '', phone: '', email: '', address: '',
            bank_name: '', bank_account_number: '', bank_account_holder: '', active: true
        });
    }
    supplierModal.show();
};

const saveSupplier = () => {
    if (!form.name || !form.phone) {
        Swal.fire('Lỗi', 'Vui lòng nhập tên và số điện thoại!', 'error');
        return;
    }

    if (isEdit.value) {
        const index = suppliers.value.findIndex(s => s.id === form.id);
        if (index !== -1) suppliers.value[index] = { ...form };
        Swal.fire('Thành công', 'Cập nhật nhà cung cấp thành công!', 'success');
    } else {
        const newId = suppliers.value.length + 1;
        suppliers.value.unshift({ ...form, id: newId });
        Swal.fire('Thành công', 'Thêm nhà cung cấp mới thành công!', 'success');
    }
    supplierModal.hide();
};

const deleteSupplier = (id) => {
    Swal.fire({
        title: 'Xác nhận xóa?', text: "Bạn có chắc muốn ngừng hợp tác với nhà cung cấp này?", icon: 'warning',
        showCancelButton: true, confirmButtonText: 'Đồng ý'
    }).then((result) => {
        if (result.isConfirmed) {
            suppliers.value = suppliers.value.filter(s => s.id !== id);
            Swal.fire('Đã xóa!', '', 'success');
        }
    });
};
</script>

<template>
    <div class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-primary fw-bold">Quản lý Nhà Cung Cấp</h2>
            <button class="btn btn-primary shadow-sm" @click="openModal()">
                <i class="bi bi-plus-lg me-2"></i> Thêm NCC Mới
            </button>
        </div>

        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                            <input 
                                type="text" 
                                class="form-control border-start-0 border-end-0" 
                                v-model="searchQuery" 
                                @keyup.enter="handleSearch"
                                placeholder="Tìm theo tên công ty, người liên hệ, sđt...">
                            <button class="btn btn-primary px-4 fw-bold" @click="handleSearch">
                                Tìm kiếm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card border-0 shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light text-nowrap">
                        <tr>
                            <th>ID</th>
                            <th>Tên Nhà Cung Cấp</th>
                            <th>Người liên hệ</th>
                            <th>Điện thoại / Email</th>
                            <th>Trạng thái</th>
                            <th class="text-end">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in filteredSuppliers" :key="item.id">
                            <td>{{ item.id }}</td>
                            <td>
                                <div class="fw-bold text-primary">{{ item.name }}</div>
                                <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>{{ item.address }}</small>
                            </td>
                            <td>{{ item.contact_name }}</td>
                            <td>
                                <div><i class="bi bi-telephone me-1 text-success"></i>{{ item.phone }}</div>
                                <small class="text-muted"><i class="bi bi-envelope me-1"></i>{{ item.email }}</small>
                            </td>
                            <td>
                                <span class="badge rounded-pill" :class="item.active ? 'bg-success' : 'bg-secondary'">
                                    {{ item.active ? 'Đang hợp tác' : 'Ngừng' }}
                                </span>
                            </td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-outline-warning me-2" @click="openModal(item)" title="Sửa">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" @click="deleteSupplier(item.id)" title="Xóa">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="filteredSuppliers.length === 0">
                            <td colspan="6" class="text-center py-4 text-muted">
                                Không tìm thấy nhà cung cấp nào phù hợp.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="modal fade" id="supplierModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title fw-bold">{{ isEdit ? 'Cập nhật thông tin' : 'Thêm Nhà Cung Cấp' }}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form @submit.prevent="saveSupplier">
                            <div class="row g-3">
                                <div class="col-md-12">
                                    <label class="form-label fw-bold">Tên nhà cung cấp <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" v-model="form.name" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Người liên hệ</label>
                                    <input type="text" class="form-control" v-model="form.contact_name">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Số điện thoại <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" v-model="form.phone" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Email</label>
                                    <input type="email" class="form-control" v-model="form.email">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Địa chỉ</label>
                                    <input type="text" class="form-control" v-model="form.address">
                                </div>
                                
                                <h6 class="text-primary mt-4 border-bottom pb-2 fw-bold"><i class="bi bi-bank me-2"></i>Thông tin thanh toán</h6>
                                <div class="col-md-4">
                                    <label class="form-label small text-muted fw-bold">Tên ngân hàng</label>
                                    <input type="text" class="form-control" v-model="form.bank_name">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small text-muted fw-bold">Số tài khoản</label>
                                    <input type="text" class="form-control" v-model="form.bank_account_number">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small text-muted fw-bold">Chủ tài khoản</label>
                                    <input type="text" class="form-control" v-model="form.bank_account_holder">
                                </div>

                                <div class="col-12 mt-3">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" v-model="form.active" id="activeSwitch">
                                        <label class="form-check-label fw-bold" for="activeSwitch">Đang hợp tác</label>
                                    </div>
                                </div>
                            </div>
                            <div class="text-end mt-4">
                                <button type="button" class="btn btn-light me-2" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" class="btn btn-primary fw-bold">Lưu thông tin</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>