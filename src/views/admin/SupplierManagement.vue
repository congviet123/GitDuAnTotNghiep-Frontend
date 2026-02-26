    <script setup>
    import { ref, reactive, computed, onMounted } from 'vue';
    import Swal from 'sweetalert2';
    import * as bootstrap from 'bootstrap';

    import supplierService from "@/services/supplierService";
    import apiClient from "@/services/api";

    // --- STATE ---
    const suppliers = ref([]);
    const isEdit = ref(false);
    let supplierModal = null;
    const searchQuery = ref("");

    // Form dữ liệu (Khớp với bảng Supplier)
    const form = reactive({
    id: null,
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    active: true
});


  
    onMounted(() => {
        supplierModal = new bootstrap.Modal(document.getElementById('supplierModal'));
        loadSuppliers();
    });
  
    const loadSuppliers = async () => {
    const res = await supplierService.getAll();
    suppliers.value = res.data;
    };
   

    const handleSearch = async () => {
    if (!searchQuery.value.trim()) {
        loadSuppliers();
        return;
    }

    const res = await apiClient.get("/api/suppliers/search", {
        params: { keyword: searchQuery.value }
    });

    suppliers.value = res.data;
    };

    // --- CRUD ---
    const openModal = (item = null) => {
        if (item) {
            isEdit.value = true;
            Object.assign(form, item);
        } else {
            isEdit.value = false;
            Object.assign(form, {
                id: null,
                name: '',
                contactName: '',
                phone: '',
                email: '',
                address: '',
                bankName: '',
                bankAccountNumber: '',
                bankAccountHolder: '',
                active: true
            });
        }
        supplierModal.show();
    };

    
    const saveSupplier = async () => {
    try {
        if (isEdit.value) {
            await apiClient.put(`/api/suppliers/${form.id}`, form);
            Swal.fire('Thành công', 'Cập nhật thành công!', 'success');
        } else {
            await apiClient.post("/api/suppliers", form);
            Swal.fire('Thành công', 'Thêm mới thành công!', 'success');
        }

        supplierModal.hide();
        loadSuppliers();

    } catch (error) {
        Swal.fire('Lỗi', 'Không thể lưu dữ liệu!', 'error');
    }
};


  
    const deleteSupplier = (id) => {
    Swal.fire({
        title: 'Xác nhận xóa?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await apiClient.delete(`/api/suppliers/${id}`);
            Swal.fire('Đã xóa!', '', 'success');
            loadSuppliers();
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
                            <tr v-for="item in suppliers" :key="item.id">
                                <td>{{ item.id }}</td>
                                <td>
                                    <div class="fw-bold text-primary">{{ item.name }}</div>
                                    <small class="text-muted">
                                        <i class="bi bi-geo-alt me-1"></i>{{ item.address }}
                                    </small>
                                </td>
                                <td>{{ item.contactName }}</td>
                                <td>
                                    <div>
                                        <i class="bi bi-telephone me-1 text-success"></i>{{ item.phone }}
                                    </div>
                                    <small class="text-muted">
                                        <i class="bi bi-envelope me-1"></i>{{ item.email }}
                                    </small>
                                </td>
                                <td>
                                    <span class="badge rounded-pill" :class="item.active ? 'bg-success' : 'bg-secondary'">
                                        {{ item.active ? 'Đang hợp tác' : 'Ngừng' }}
                                    </span>
                                </td>
                                <td class="text-end">
                                    <button class="btn btn-sm btn-outline-warning me-2"
                                         @click="openModal(item)">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger"
                                            @click="deleteSupplier(item.id)">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>

                            <tr v-if="suppliers.length === 0">
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
                                        <input type="text" class="form-control" v-model="form.contactName">
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
                                        <input type="text" class="form-control" v-model="form.bankName">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label small text-muted fw-bold">Số tài khoản</label>
                                        <input type="text" class="form-control" v-model="form.bankAccountNumber">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label small text-muted fw-bold">Chủ tài khoản</label>
                                        <input type="text" class="form-control" v-model="form.bankAccountHolder">
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