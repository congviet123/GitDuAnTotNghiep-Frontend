// đăng ký tài khoản mới
<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import Swal from 'sweetalert2';

const router = useRouter();
const form = reactive({
    fullname: '', email: '', username: '', password: '', confirmPassword: ''
});

const handleRegister = async () => {
    if (form.password !== form.confirmPassword) return;
    try {
        await apiClient.post('/account/register', form);
        await Swal.fire('Thành công', 'Tạo tài khoản thành công!', 'success');
        router.push('/login');
    } catch (err) {
        Swal.fire('Lỗi', err.response?.data || 'Đăng ký thất bại', 'error');
    }
};
</script>

<template>
  <div class="container d-flex justify-content-center py-5">
    <div class="card shadow-lg border-0 w-100" style="max-width: 500px;">
      <div class="card-header bg-success text-white text-center">
        <h4 class="mb-0 fw-bold">Đăng ký tài khoản mới</h4>
      </div>
      <div class="card-body p-4">
        <form @submit.prevent="handleRegister">
          <div class="mb-3">
            <label class="form-label">Họ và tên</label>
            <input type="text" v-model="form.fullname" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" v-model="form.email" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Tên đăng nhập</label>
            <input type="text" v-model="form.username" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Mật khẩu</label>
            <input type="password" v-model="form.password" class="form-control" required minlength="6">
          </div>
          <div class="mb-3">
            <label class="form-label">Xác nhận mật khẩu</label>
            <input type="password" v-model="form.confirmPassword" class="form-control" required>
            <small v-if="form.password && form.password !== form.confirmPassword" class="text-danger">Mật khẩu không khớp!</small>
          </div>
          <button type="submit" class="btn btn-success w-100 mt-3" :disabled="form.password !== form.confirmPassword">Đăng ký</button>
        </form>
        <div class="text-center mt-4"><router-link to="/login">Đã có tài khoản? Đăng nhập</router-link></div>
      </div>
    </div>
  </div>
</template>