// khôi phục mật khẩu qua email
<script setup>
import { ref } from 'vue';
import apiClient from '@/services/api';
import Swal from 'sweetalert2';

const email = ref('');
const loading = ref(false);

const handleSubmit = async () => {
    loading.ref = true;
    try {
        await apiClient.post('/auth/forgot-password', null, { params: { email: email.value } });
        Swal.fire('Đã gửi', 'Vui lòng kiểm tra email để lấy lại mật khẩu.', 'success');
    } catch (err) {
        Swal.fire('Lỗi', 'Email không tồn tại trong hệ thống.', 'error');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
  <div class="container d-flex justify-content-center py-5">
    <div class="card shadow-sm w-100" style="max-width: 400px;">
      <div class="card-header bg-dark text-white text-center"><h4 class="mb-0">Quên mật khẩu</h4></div>
      <div class="card-body p-4 text-center">
        <p class="small text-muted">Nhập email của bạn để nhận mật khẩu mới.</p>
        <form @submit.prevent="handleSubmit">
          <input type="email" v-model="email" class="form-control mb-3" placeholder="Email của bạn" required>
          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Đang gửi...' : 'Gửi yêu cầu' }}
            </button>
            <router-link to="/login" class="btn btn-outline-secondary">Quay lại Đăng nhập</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>