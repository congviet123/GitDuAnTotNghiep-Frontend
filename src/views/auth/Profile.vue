<script setup>
import { ref, reactive, onMounted } from 'vue';
import apiClient from '@/services/api';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

// --- STATE ---
const activeTab = ref('info'); 
const loading = ref(false);
const pageLoading = ref(true); // Loading xoay khi mới vào trang

// Form thông tin cá nhân
const form = reactive({
    username: '',
    fullname: '',
    email: '',
    phone: ''
});

// State cho địa chỉ
const addresses = ref([]);
const showAddressModal = ref(false);
const isEditAddress = ref(false);
const addressForm = ref({
    id: null,
    fullname: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    addressLine: '',
    isDefault: false
});

// --- METHODS: PROFILE ---
const fetchProfile = async () => {
    try {
        // Gọi API: /rest/account/profile
        const response = await apiClient.get('/account/profile');
        Object.assign(form, response.data);
    } catch (error) {
        console.error('Lỗi tải hồ sơ:', error);
    }
};

const saveProfile = async () => {
    loading.value = true;
    try {
        await apiClient.put('/account/profile', form);
        
        // Cập nhật ngay tên hiển thị trên Header (không cần F5)
        const updatedUser = { ...authStore.user, ...form };
        authStore.login(updatedUser, authStore.token);

        await Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Cập nhật thông tin thành công!',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Lỗi cập nhật:', error);
        Swal.fire('Thất bại', 'Có lỗi xảy ra khi lưu hồ sơ.', 'error');
    } finally {
        loading.value = false;
    }
};

// --- METHODS: ADDRESS ---
const fetchAddresses = async () => {
    try {
        // Gọi API: /rest/addresses
        const res = await apiClient.get('/addresses');
        addresses.value = res.data;
    } catch (error) {
        console.error("Lỗi tải địa chỉ:", error);
        // Lỗi 500 sẽ được api.js bắt và hiện thông báo chung
    }
};

const openAddressModal = (addr = null) => {
    showAddressModal.value = true;
    if (addr) {
        // Chế độ Sửa
        isEditAddress.value = true;
        addressForm.value = { ...addr };
    } else {
        // Chế độ Thêm mới
        isEditAddress.value = false;
        addressForm.value = { 
            id: null, 
            fullname: form.fullname, 
            phone: form.phone, 
            province: '', district: '', ward: '', addressLine: '', 
            isDefault: false 
        };
    }
};

const saveAddress = async () => {
    try {
        if (isEditAddress.value) {
            await apiClient.put(`/addresses/${addressForm.value.id}`, addressForm.value);
        } else {
            await apiClient.post('/addresses', addressForm.value);
        }
        showAddressModal.value = false;
        fetchAddresses(); // Tải lại danh sách
        
        Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đã lưu địa chỉ!',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể lưu địa chỉ. Vui lòng thử lại.', 'error');
    }
};

const deleteAddress = async (id) => {
    const result = await Swal.fire({
        title: 'Bạn chắc chắn?',
        text: "Bạn muốn xóa địa chỉ này?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            await apiClient.delete(`/addresses/${id}`);
            fetchAddresses();
            Swal.fire('Đã xóa!', 'Địa chỉ đã được xóa.', 'success');
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể xóa địa chỉ.', 'error');
        }
    }
};

onMounted(async () => {
    // Nếu chưa đăng nhập thì đá về Login
    if (!authStore.isAuthenticated) {
        router.push('/login');
        return;
    }

    try {
        // Chạy song song 2 API để tải nhanh hơn
        await Promise.all([fetchProfile(), fetchAddresses()]);
    } catch (e) {
        console.error("Lỗi khởi tạo:", e);
    } finally {
        pageLoading.value = false;
    }
});
</script>

<template>
    <div class="container py-5">
        <div v-if="pageLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <div v-else class="row justify-content-center">
            <div class="col-md-4 col-lg-3 mb-4">
                <div class="card border-0 shadow-sm sticky-top" style="top: 20px; z-index: 1;">
                    <div class="card-body text-center py-4 bg-light rounded-top">
                        <div class="avatar-circle mx-auto mb-3 fw-bold fs-2 text-white bg-primary d-flex align-items-center justify-content-center">
                            {{ form.fullname ? form.fullname.charAt(0).toUpperCase() : 'U' }}
                        </div>
                        <h6 class="fw-bold mb-0 text-truncate px-2" :title="form.fullname">{{ form.fullname || 'Người dùng' }}</h6>
                        <small class="text-muted d-block text-truncate px-2" :title="form.email">{{ form.email }}</small>
                    </div>
                    <div class="list-group list-group-flush">
                        <button class="list-group-item list-group-item-action py-3 border-0" 
                                :class="{ 'active-menu': activeTab === 'info' }" 
                                @click="activeTab = 'info'">
                            <i class="bi bi-person-circle me-2"></i> Hồ sơ cá nhân
                        </button>
                        <button class="list-group-item list-group-item-action py-3 border-0" 
                                :class="{ 'active-menu': activeTab === 'address' }" 
                                @click="activeTab = 'address'">
                            <i class="bi bi-geo-alt-fill me-2"></i> Sổ địa chỉ
                        </button>
                    </div>
                </div>
            </div>

            <div class="col-md-8 col-lg-8">
                <div v-if="activeTab === 'info'" class="card shadow border-0 animate__animated animate__fadeIn">
                    <div class="card-header bg-white py-3">
                        <h5 class="mb-0 fw-bold text-primary">Cập nhật Hồ sơ</h5>
                    </div>
                    <div class="card-body p-4">
                        <form @submit.prevent="saveProfile">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label text-muted small fw-bold">TÊN ĐĂNG NHẬP</label>
                                    <input type="text" class="form-control bg-light" v-model="form.username" readonly disabled>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-muted small fw-bold">EMAIL</label>
                                    <input type="email" class="form-control bg-light" v-model="form.email" readonly disabled>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Họ và tên <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" v-model="form.fullname" required placeholder="Nhập họ tên đầy đủ">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Số điện thoại</label>
                                    <input type="tel" class="form-control" v-model="form.phone" placeholder="Số điện thoại liên lạc">
                                </div>
                            </div>

                            <div class="mt-4 d-flex justify-content-end">
                                <button type="submit" class="btn btn-primary px-4 fw-bold shadow-sm" :disabled="loading">
                                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                    Lưu Thay Đổi
                                </button>
                            </div>
                        </form>
                        
                        <hr class="my-4">
                        <div class="d-flex justify-content-center gap-3 flex-wrap">
                            <router-link to="/auth/change-password" class="btn btn-outline-secondary btn-sm">
                                <i class="bi bi-key me-1"></i> Đổi mật khẩu
                            </router-link>
                            <router-link to="/order-history" class="btn btn-outline-success btn-sm">
                                <i class="bi bi-bag-check me-1"></i> Đơn hàng đã đặt
                            </router-link>
                        </div>
                    </div>
                </div>

                <div v-if="activeTab === 'address'" class="card shadow border-0 animate__animated animate__fadeIn">
                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <h5 class="mb-0 fw-bold text-primary">Địa chỉ nhận hàng</h5>
                        <button class="btn btn-success btn-sm fw-bold shadow-sm" @click="openAddressModal()">
                            <i class="bi bi-plus-lg me-1"></i> Thêm mới
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div v-if="addresses.length === 0" class="text-center py-5 text-muted">
                            <i class="bi bi-geo-alt fs-1 d-block mb-2 opacity-25"></i>
                            <p>Bạn chưa lưu địa chỉ nào.</p>
                        </div>
                        <div v-else class="list-group list-group-flush">
                            <div v-for="addr in addresses" :key="addr.id" class="list-group-item p-4 border-bottom position-relative hover-bg-light transition">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1 pe-3">
                                        <div class="mb-1 d-flex align-items-center flex-wrap gap-2">
                                            <span class="fw-bold fs-5 text-dark">{{ addr.fullname }}</span>
                                            <span class="text-secondary border-start ps-2">{{ addr.phone }}</span>
                                            <span v-if="addr.isDefault" class="badge bg-success bg-opacity-10 text-success border border-success">Mặc định</span>
                                        </div>
                                        <div class="text-secondary mt-1">
                                            <i class="bi bi-house-door me-1"></i> {{ addr.addressLine }}
                                        </div>
                                        <div class="text-secondary small mt-1">
                                            <i class="bi bi-map me-1"></i> {{ addr.ward }}, {{ addr.district }}, {{ addr.province }}
                                        </div>
                                    </div>
                                    <div class="d-flex flex-column gap-2">
                                        <button class="btn btn-outline-primary btn-sm" @click="openAddressModal(addr)" title="Sửa">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button v-if="!addr.isDefault" class="btn btn-outline-danger btn-sm" @click="deleteAddress(addr.id)" title="Xóa">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showAddressModal" class="modal d-block fade show" style="background: rgba(0,0,0,0.5); z-index: 1050;">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title fw-bold">
                            <i class="bi" :class="isEditAddress ? 'bi-pencil-square' : 'bi-plus-circle'"></i>
                            {{ isEditAddress ? ' Cập nhật địa chỉ' : ' Thêm địa chỉ mới' }}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" @click="showAddressModal = false"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form @submit.prevent="saveAddress">
                            <div class="row g-3 mb-3">
                                <div class="col-6">
                                    <label class="form-label small fw-bold">Họ và tên</label>
                                    <input v-model="addressForm.fullname" class="form-control" required placeholder="Người nhận" />
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-bold">Số điện thoại</label>
                                    <input v-model="addressForm.phone" class="form-control" required placeholder="09xxx..." />
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label small fw-bold">Tỉnh / Thành phố</label>
                                <input v-model="addressForm.province" class="form-control" required placeholder="Nhập Tỉnh/Thành..." />
                            </div>
                            <div class="row g-3 mb-3">
                                <div class="col-6">
                                    <label class="form-label small fw-bold">Quận / Huyện</label>
                                    <input v-model="addressForm.district" class="form-control" required placeholder="Nhập Quận/Huyện..." />
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-bold">Phường / Xã</label>
                                    <input v-model="addressForm.ward" class="form-control" required placeholder="Nhập Phường/Xã..." />
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label small fw-bold">Địa chỉ cụ thể</label>
                                <textarea v-model="addressForm.addressLine" class="form-control" rows="2" placeholder="Số nhà, tên đường, tòa nhà..." required></textarea>
                            </div>

                            <div class="form-check mb-4 bg-light p-2 rounded border">
                                <input class="form-check-input ms-1" type="checkbox" v-model="addressForm.isDefault" id="defaultCheck">
                                <label class="form-check-label fw-bold ms-2 cursor-pointer" for="defaultCheck">Đặt làm địa chỉ mặc định</label>
                            </div>

                            <div class="d-flex justify-content-end gap-2 border-top pt-3">
                                <button type="button" class="btn btn-light px-4" @click="showAddressModal = false">Hủy</button>
                                <button type="submit" class="btn btn-primary px-4 fw-bold">
                                    <i class="bi bi-save me-1"></i> Lưu thông tin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.avatar-circle {
    width: 80px; height: 80px;
    border-radius: 50%;
}
.active-menu {
    background-color: #e7f1ff;
    color: #0d6efd; 
    font-weight: bold;
    border-left: 4px solid #0d6efd !important;
}
.hover-bg-light:hover {
    background-color: #f8f9fa;
}
.cursor-pointer {
    cursor: pointer;
}
</style>