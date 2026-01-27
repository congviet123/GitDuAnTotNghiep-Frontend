<script setup>
import { ref, onMounted, reactive } from 'vue';
import apiClient from '@/services/api';
import Swal from 'sweetalert2';

// --- STATE ---
const form = reactive({
    username: '',
    fullname: '',
    email: '',
    phone: '',
    address: ''
});

const loading = ref(false);

// --- METHODS ---
const fetchProfile = async () => {
    try {
        const response = await apiClient.get('/account/profile');
        // Cập nhật dữ liệu từ API vào form
        Object.assign(form, response.data);
    } catch (error) {
        console.error('Lỗi tải hồ sơ:', error);
        window.Toast.fire({
            icon: 'error',
            title: 'Không thể tải thông tin hồ sơ.'
        });
    }
};

const saveProfile = async () => {
    loading.value = true;
    try {
        const response = await apiClient.put('/account/profile', form);
        await Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: response.data || 'Cập nhật thông tin thành công!',
        });
    } catch (error) {
        console.error('Lỗi cập nhật hồ sơ:', error);
        const errMsg = error.response?.data || 'Lỗi cập nhật hồ sơ.';
        Swal.fire('Thất bại', errMsg, 'error');
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchProfile();
});
</script>

<template>
    <div class="container d-flex justify-content-center py-5">
        <div class="card shadow border-0" style="width: 100%; max-width: 700px;">
            <div class="card-header bg-primary text-white text-center py-3">
                <h4 class="mb-0 fw-bold">Cập nhật Hồ sơ Cá nhân</h4>
            </div>
            <div class="card-body p-4">
                <p class="text-muted mb-4 text-center">Vui lòng kiểm tra và cập nhật thông tin chính xác của bạn.</p>

                <form @submit.prevent="saveProfile">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-bold small text-uppercase text-muted">Tên đăng nhập</label>
                            <input type="text" class="form-control bg-light" v-model="form.username" readonly>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-bold small text-uppercase text-muted">Email</label>
                            <input type="email" class="form-control bg-light" v-model="form.email" readonly>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Họ và Tên</label>
                        <input type="text" class="form-control" v-model="form.fullname" required placeholder="Nhập họ tên đầy đủ">
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Số điện thoại</label>
                        <input type="tel" class="form-control" v-model="form.phone" placeholder="Số điện thoại liên lạc">
                    </div>

                    <div class="mb-4">
                        <label class="form-label fw-bold">Địa chỉ giao hàng mặc định</label>
                        <textarea class="form-control" v-model="form.address" rows="3" placeholder="Nhập địa chỉ nhận hàng"></textarea>
                    </div>

                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-primary btn-lg shadow-sm" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            Lưu Thay Đổi
                        </button>
                    </div>
                </form>

                <hr class="my-4">
                <div class="text-center d-flex justify-content-center gap-3">
                    <router-link to="/auth/change-password" class="text-decoration-none">
                        <i class="bi bi-key"></i> Đổi mật khẩu
                    </router-link>
                    <span class="text-muted">|</span>
                    <router-link to="/order-history" class="text-decoration-none text-success">
                        <i class="bi bi-bag-check"></i> Xem đơn hàng đã đặt
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>