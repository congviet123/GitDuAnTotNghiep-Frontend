<script setup>
import { reactive, ref } from 'vue';
import apiClient from '@/services/api';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoading = ref(false);

const form = reactive({
    password: '',       // Giữ nguyên tên biến state này cho tiện
    newPassword: '',
    confirmPassword: ''
});

const showPass = reactive({
    old: false,
    new: false,
    confirm: false
});

const handleChangePassword = async () => {
    // 1. Validate Client
    if (!form.password || !form.newPassword || !form.confirmPassword) {
        Swal.fire('Cảnh báo', 'Vui lòng điền đầy đủ các trường!', 'warning');
        return;
    }

    if (form.newPassword !== form.confirmPassword) {
        Swal.fire('Lỗi', 'Mật khẩu xác nhận không khớp!', 'error');
        return;
    }

    if (form.newPassword.length < 6) {
        Swal.fire('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự!', 'warning');
        return;
    }

    isLoading.value = true;
    try {
        // Mapping: key gửi đi phải là 'currentPassword' để khớp với Java DTO
        const payload = {
            currentPassword: form.password, 
            newPassword: form.newPassword,
            confirmPassword: form.confirmPassword
        };

        await apiClient.put('/account/change-password', payload);

        await Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.',
            confirmButtonText: 'Đăng nhập lại'
        });

        localStorage.removeItem('token'); 
        localStorage.removeItem('user');
        router.push('/login');

    } catch (err) {
        console.error(err);
        const msg = err.response?.data || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
        Swal.fire('Lỗi', msg, 'error');
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div class="container my-5">
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow-sm border-0 rounded-3">
                    <div class="card-header bg-white border-bottom-0 pt-4 pb-0 text-center">
                        <h3 class="fw-bold text-primary-fruit">Đổi Mật Khẩu</h3>
                        <p class="text-muted small">Bảo mật tài khoản của bạn</p>
                    </div>

                    <div class="card-body p-4">
                        <form @submit.prevent="handleChangePassword">
                            
                            <div class="mb-3">
                                <label class="form-label fw-bold">Mật khẩu hiện tại</label>
                                <div class="input-group">
                                    <input :type="showPass.old ? 'text' : 'password'" 
                                           class="form-control" 
                                           v-model="form.password" 
                                           placeholder="Nhập mật khẩu cũ...">
                                    <button class="btn btn-outline-secondary" type="button" 
                                            @click="showPass.old = !showPass.old">
                                        <i class="bi" :class="showPass.old ? 'bi-eye-slash' : 'bi-eye'"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">Mật khẩu mới</label>
                                <div class="input-group">
                                    <input :type="showPass.new ? 'text' : 'password'" 
                                           class="form-control" 
                                           v-model="form.newPassword" 
                                           placeholder="Nhập mật khẩu mới (min 6 ký tự)...">
                                    <button class="btn btn-outline-secondary" type="button" 
                                            @click="showPass.new = !showPass.new">
                                        <i class="bi" :class="showPass.new ? 'bi-eye-slash' : 'bi-eye'"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="mb-4">
                                <label class="form-label fw-bold">Xác nhận mật khẩu mới</label>
                                <div class="input-group">
                                    <input :type="showPass.confirm ? 'text' : 'password'" 
                                           class="form-control" 
                                           v-model="form.confirmPassword" 
                                           placeholder="Nhập lại mật khẩu mới...">
                                    <button class="btn btn-outline-secondary" type="button" 
                                            @click="showPass.confirm = !showPass.confirm">
                                        <i class="bi" :class="showPass.confirm ? 'bi-eye-slash' : 'bi-eye'"></i>
                                    </button>
                                </div>
                                <div v-if="form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword" 
                                     class="text-danger small mt-1">
                                    <i class="bi bi-exclamation-circle"></i> Mật khẩu xác nhận chưa khớp
                                </div>
                            </div>

                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-fruit text-white py-2" :disabled="isLoading">
                                    <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                                    <span v-else><i class="bi bi-shield-lock-fill me-2"></i> Xác nhận đổi mật khẩu</span>
                                </button>
                                <router-link to="/profile" class="btn btn-light text-muted">
                                    Hủy bỏ
                                </router-link>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.text-primary-fruit { color: #ff6b01; }
.btn-fruit { background-color: #ff6b01; border-color: #ff6b01; transition: all 0.3s; }
.btn-fruit:hover { background-color: #e65b00; border-color: #e65b00; }
.form-control:focus { border-color: #ff6b01; box-shadow: 0 0 0 0.25rem rgba(255, 107, 1, 0.25); }
.input-group-text { background-color: white; }
</style>