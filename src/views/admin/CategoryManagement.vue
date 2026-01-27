<script setup>
import { ref, onMounted, reactive } from 'vue';
import apiClient from '@/services/api';
import Swal from 'sweetalert2';

// Dữ liệu
const categories = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);

// Form model
const form = reactive({
    id: null,
    name: ''
});

// 1. Tải danh sách danh mục
const fetchCategories = async () => {
    isLoading.value = true;
    try {
        const res = await apiClient.get('/admin/categories');
        categories.value = res.data;
    } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Không thể tải danh sách danh mục', 'error');
    } finally {
        isLoading.value = false;
    }
};

// 2. Mở Modal Thêm
const openAddModal = () => {
    isEditing.value = false;
    form.id = null;
    form.name = '';
    showModal.value = true;
};

// 3. Mở Modal Sửa
const openEditModal = (item) => {
    isEditing.value = true;
    form.id = item.id;
    form.name = item.name;
    showModal.value = true;
};

// 4. Lưu dữ liệu (Thêm hoặc Sửa)
const saveData = async () => {
    if (!form.name.trim()) {
        Swal.fire('Lỗi', 'Tên danh mục không được để trống', 'warning');
        return;
    }

    try {
        if (isEditing.value) {
            // Update
            await apiClient.put(`/admin/categories/${form.id}`, form);
            Swal.fire('Thành công', 'Cập nhật danh mục thành công', 'success');
        } else {
            // Create
            await apiClient.post('/admin/categories', form);
            Swal.fire('Thành công', 'Thêm danh mục thành công', 'success');
        }
        showModal.value = false;
        fetchCategories(); // Load lại bảng
    } catch (err) {
        const msg = err.response?.data || 'Có lỗi xảy ra';
        Swal.fire('Lỗi', msg, 'error');
    }
};

// 5. Xóa danh mục
const deleteCategory = async (id) => {
    const result = await Swal.fire({
        title: 'Bạn chắc chắn?',
        text: "Không thể khôi phục sau khi xóa!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa ngay',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            await apiClient.delete(`/admin/categories/${id}`);
            Swal.fire('Đã xóa!', 'Danh mục đã bị xóa.', 'success');
            fetchCategories();
        } catch (err) {
            const msg = err.response?.data || 'Không thể xóa danh mục này (có thể do đang chứa sản phẩm).';
            Swal.fire('Lỗi', msg, 'error');
        }
    }
};

onMounted(() => {
    fetchCategories();
});
</script>

<template>
    <div class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3 class="fw-bold text-primary"><i class="bi bi-list-task"></i> Quản lý Danh mục</h3>
            <button class="btn btn-primary" @click="openAddModal">
                <i class="bi bi-plus-circle"></i> Thêm mới
            </button>
        </div>

        <div class="card shadow border-0">
            <div class="card-body p-0">
                <div v-if="isLoading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>

                <table v-else class="table table-hover mb-0 align-middle">
                    <thead class="table-light">
                        <tr>
                            <th class="ps-4">ID</th>
                            <th>Tên danh mục</th>
                            <th class="text-end pe-4">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="cat in categories" :key="cat.id">
                            <td class="ps-4 fw-bold">#{{ cat.id }}</td>
                            <td class="fw-semibold">{{ cat.name }}</td>
                            <td class="text-end pe-4">
                                <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(cat)">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" @click="deleteCategory(cat.id)">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="categories.length === 0">
                            <td colspan="3" class="text-center py-4 text-muted">Chưa có danh mục nào.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="showModal" class="modal-backdrop fade show"></div>
        <div class="modal fade" :class="{ 'show d-block': showModal }" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title fw-bold">
                            {{ isEditing ? 'Cập nhật Danh mục' : 'Thêm Danh mục Mới' }}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" @click="showModal = false"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form @submit.prevent="saveData">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Tên danh mục <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" v-model="form.name" placeholder="Ví dụ: Trái cây nhập khẩu..." required>
                            </div>
                            <div class="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" class="btn btn-secondary" @click="showModal = false">Hủy</button>
                                <button type="submit" class="btn btn-primary">Lưu lại</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-backdrop {
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1040;
}
.modal {
    z-index: 1050;
}
</style>