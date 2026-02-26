<script setup>
import { reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'; 
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart'; // [MỚI] Thêm cart store
import apiClient from '@/services/api';
import Swal from 'sweetalert2';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const cartStore = useCartStore(); // [MỚI] Khởi tạo cart store
const form = reactive({ username: '', password: '' });

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

// 1. Xử lý đăng nhập thường (Username/Password)
const handleLogin = async () => {
    try {
        const res = await apiClient.post('/auth/login', { 
            username: form.username,
            password: form.password
        });
        const userData = res.data; 
        authStore.login(userData, null); 
        
        // [QUAN TRỌNG] Đồng bộ giỏ hàng từ LocalStorage lên DB ngay sau khi đăng nhập thành công
        await cartStore.syncLocalCartToDatabase();

        Toast.fire({ icon: 'success', title: 'Đăng nhập thành công!' });
        redirectUser();
    } catch (err) {
        console.error(err);
        // Lấy thông báo lỗi từ Backend (Đã bao gồm thông báo "Tài khoản bị khóa")
        Swal.fire({
            icon: 'error',
            title: 'Đăng nhập thất bại',
            text: err.response?.data || 'Sai tên đăng nhập hoặc mật khẩu!',
        });
    }
};

// 2. Chuyển hướng sang Google Login
const loginWithGoogle = () => {
    // Backend đã cấu hình prompt=select_account nên Google sẽ luôn hỏi chọn tài khoản
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
};

// 3. Xử lý kết quả trả về từ Google (Qua URL Query Param)
const checkGoogleLogin = async () => {
    // --- TRƯỜNG HỢP THÀNH CÔNG ---
    if (route.query.google_success === 'true') {
        try {
            Swal.fire({
                title: 'Đang đăng nhập...',
                text: 'Vui lòng chờ trong giây lát',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            const response = await apiClient.get('/account/profile');
            if (response.data) {
                authStore.login(response.data);
                
                // [QUAN TRỌNG] Đồng bộ giỏ hàng sau khi login Google
                await cartStore.syncLocalCartToDatabase();

                Swal.close(); 
                await Toast.fire({ icon: 'success', title: 'Đăng nhập Google thành công!' });
                
                // Xóa query param để URL sạch đẹp
                router.replace({ query: null });
                redirectUser();
            }
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể lấy thông tin tài khoản Google.', 'error');
        }
    }
    
    // --- TRƯỜNG HỢP THẤT BẠI ---
    else if (route.query.google_error) {
        const errorType = route.query.google_error;
        
        if (errorType === 'unregistered') {
            Swal.fire({
                icon: 'warning',
                title: 'Chưa đăng ký',
                text: 'Email Google này chưa có trong hệ thống. Vui lòng đăng ký tài khoản trước!',
                showCancelButton: true,
                confirmButtonText: 'Đăng ký ngay',
                cancelButtonText: 'Đóng'
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push('/register');
                }
            });
        } 
        // Bắt lỗi tài khoản bị khóa từ Google
        else if (errorType === 'disabled') {
             Swal.fire({
                icon: 'error',
                title: 'Tài khoản bị khóa',
                text: 'Tài khoản của bạn đã tạm bị khóa, vui lòng liên hệ admin để mở tài khoản.',
            });
        } 
        else {
            Swal.fire('Lỗi đăng nhập', 'Không thể đăng nhập bằng Google.', 'error');
        }
        
        // Xóa query param trên URL
        router.replace({ query: null });
    }
};

// Hàm điều hướng người dùng dựa theo Role
const redirectUser = () => {
    const roleName = authStore.user?.role?.name;
    // Hỗ trợ cả 2 tên role (đề phòng DB lưu khác nhau)
    if (roleName === 'ADMIN' || roleName === 'ROLE_ADMIN' || roleName === 'ROLE_STAFF') {
        router.push('/admin/dashboard');
    } else if (roleName === 'ROLE_SHIPPER') {
        router.push('/shipper/dashboard'); // Ví dụ trang shipper
    } else {
        router.push('/');
    }
};

onMounted(() => {
    checkGoogleLogin();
});
</script>

<template>
  <div class="login-container container d-flex justify-content-center align-items-center">
    <div class="card shadow-lg border-0 w-100" style="max-width: 400px;">
      <div class="card-header bg-primary text-white text-center">
        <h4 class="mb-0 fw-bold">Đăng nhập hệ thống</h4>
      </div>
      <div class="card-body p-4">
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label class="form-label">Tên đăng nhập</label>
            <input type="text" v-model="form.username" class="form-control" placeholder="Nhập tên đăng nhập" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Mật khẩu</label>
            <input type="password" v-model="form.password" class="form-control" placeholder="Nhập mật khẩu" required>
          </div>
          <button type="submit" class="btn btn-primary w-100 shadow-sm">Đăng nhập</button>
        </form>
        
        <div class="mt-3">
          <button @click="loginWithGoogle" class="btn btn-outline-danger w-100 shadow-sm">
            <i class="bi bi-google me-2"></i> Đăng nhập bằng Google
          </button>
        </div>
        
        <div class="text-center mt-4 pt-3 border-top">
          <router-link to="/register" class="d-block mb-2">Chưa có tài khoản? Đăng ký ngay</router-link>
          <router-link to="/auth/forgot-password" class="d-block small">Quên mật khẩu?</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container { min-height: 80vh; }
</style>