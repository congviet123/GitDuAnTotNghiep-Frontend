<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import Swal from 'sweetalert2';

const router = useRouter();

// Trạng thái các bước: 1 (Email), 2 (OTP), 3 (Đổi mật khẩu)
const currentStep = ref(1);
const loading = ref(false);

// Dữ liệu form
const form = reactive({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
});

// Trạng thái ẩn/hiện mật khẩu ở Bước 3
const showPassword = ref(false);
const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

// --- BƯỚC 1: GỬI EMAIL LẤY OTP ---
const handleSendOtp = async () => {
    loading.value = true;
    try {
        await apiClient.post('/auth/send-otp', { email: form.email });
        
        currentStep.value = 2; // Chuyển sang bước 2
        Swal.fire({
            icon: 'success',
            title: 'Đã gửi mã',
            text: 'Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
            timer: 2000,
            showConfirmButton: false
        });
    } catch (err) {
        const errorMsg = err.response?.data || 'Email không tồn tại trong hệ thống.';
        Swal.fire('Lỗi', errorMsg, 'error');
    } finally {
        loading.value = false;
    }
};

// --- BƯỚC 2: XÁC THỰC OTP ---
const handleVerifyOtp = async () => {
    if (!form.otp || form.otp.length !== 6) {
        Swal.fire('Cảnh báo', 'Vui lòng nhập đủ 6 số mã OTP.', 'warning');
        return;
    }

    loading.value = true;
    try {
        await apiClient.post('/auth/verify-otp', { 
            email: form.email, 
            otp: form.otp 
        });
        
        currentStep.value = 3; // Chuyển sang bước 3
        Swal.fire({
            icon: 'success',
            title: 'Xác thực thành công',
            text: 'Vui lòng thiết lập mật khẩu mới.',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (err) {
        const errorMsg = err.response?.data || 'Mã OTP không hợp lệ.';
        Swal.fire('Lỗi xác thực', errorMsg, 'error');
        
        // Nếu Backend báo quá 3 lần -> Bắt quay lại bước 1
        if (errorMsg.includes('bị hủy') || errorMsg.includes('quá 3 lần')) {
            form.otp = '';
            currentStep.value = 1;
        }
    } finally {
        loading.value = false;
    }
};

// --- BƯỚC 3: ĐẶT LẠI MẬT KHẨU ---
const handleResetPassword = async () => {
    if (form.newPassword !== form.confirmPassword) {
        Swal.fire('Lỗi', 'Mật khẩu xác nhận không khớp.', 'error');
        return;
    }

    if (form.newPassword.length < 6) {
        Swal.fire('Cảnh báo', 'Mật khẩu phải có ít nhất 6 ký tự.', 'warning');
        return;
    }

    loading.value = true;
    try {
        await apiClient.post('/auth/reset-password-otp', {
            email: form.email,
            newPassword: form.newPassword,
            confirmPassword: form.confirmPassword
        });
        
        await Swal.fire({
            icon: 'success',
            title: 'Hoàn tất',
            text: 'Đổi mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.'
        });
        
        router.push('/login'); // Đổi xong thì chuyển về trang Đăng nhập
    } catch (err) {
        const errorMsg = err.response?.data || 'Có lỗi xảy ra khi đổi mật khẩu.';
        Swal.fire('Lỗi', errorMsg, 'error');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
  <div class="container d-flex justify-content-center py-5">
    <div class="card shadow-sm w-100 border-0" style="max-width: 450px;">
      
      <div class="card-header bg-primary text-white text-center py-3">
        <h4 class="mb-0 fw-bold">Khôi phục mật khẩu</h4>
      </div>

      <div class="card-body p-4 text-center">
        
        <div v-if="currentStep === 1" class="animate__animated animate__fadeIn">
          <div class="mb-4">
            <i class="bi bi-envelope-paper text-primary" style="font-size: 3rem;"></i>
            <p class="text-muted mt-2">Nhập địa chỉ email của bạn, chúng tôi sẽ gửi mã OTP gồm 6 chữ số để xác minh.</p>
          </div>
          
          <form @submit.prevent="handleSendOtp">
            <input type="email" v-model="form.email" class="form-control mb-4 text-center" placeholder="Nhập email của bạn..." required>
            
            <div class="d-grid gap-2">
              <button type="submit" class="btn btn-primary fw-bold shadow-sm" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                <i class="bi bi-send me-1" v-else></i>
                {{ loading ? 'Đang kiểm tra...' : 'Gửi mã OTP' }}
              </button>
              <router-link to="/login" class="btn btn-outline-secondary mt-2">Quay lại Đăng nhập</router-link>
            </div>
          </form>
        </div>

        <div v-if="currentStep === 2" class="animate__animated animate__fadeInRight">
          <div class="mb-4">
            <i class="bi bi-shield-lock text-success" style="font-size: 3rem;"></i>
            <h5 class="fw-bold mt-2">Nhập mã xác thực</h5>
            <p class="text-muted small">Mã OTP đã được gửi đến: <strong class="text-dark">{{ form.email }}</strong></p>
          </div>
          
          <form @submit.prevent="handleVerifyOtp">
            <div class="mb-4">
                <input type="text" 
                       v-model="form.otp" 
                       class="form-control text-center fw-bold fs-4 tracking-widest bg-light" 
                       placeholder="------" 
                       maxlength="6" 
                       required>
            </div>
            
            <div class="d-grid gap-2">
              <button type="submit" class="btn btn-success fw-bold shadow-sm" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                <i class="bi bi-check-circle me-1" v-else></i>
                {{ loading ? 'Đang xác thực...' : 'Xác thực OTP' }}
              </button>
              <button type="button" @click="currentStep = 1" class="btn btn-link text-muted mt-2 text-decoration-none">
                 <i class="bi bi-arrow-left me-1"></i> Sử dụng Email khác
              </button>
            </div>
          </form>
        </div>

        <div v-if="currentStep === 3" class="animate__animated animate__fadeInRight">
          <div class="mb-4">
            <i class="bi bi-key text-warning" style="font-size: 3rem;"></i>
            <h5 class="fw-bold mt-2">Tạo mật khẩu mới</h5>
            <p class="text-muted small">Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn.</p>
          </div>
          
          <form @submit.prevent="handleResetPassword">
            <div class="input-group mb-3 text-start">
                <span class="input-group-text bg-light"><i class="bi bi-lock-fill"></i></span>
                <input :type="showPassword ? 'text' : 'password'" 
                       v-model="form.newPassword" 
                       class="form-control" 
                       placeholder="Nhập mật khẩu mới" 
                       required>
                <button class="btn btn-outline-secondary" type="button" @click="togglePasswordVisibility">
                    <i class="bi" :class="showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'"></i>
                </button>
            </div>

            <div class="input-group mb-4 text-start">
                <span class="input-group-text bg-light"><i class="bi bi-shield-check"></i></span>
                <input :type="showPassword ? 'text' : 'password'" 
                       v-model="form.confirmPassword" 
                       class="form-control" 
                       placeholder="Xác nhận mật khẩu mới" 
                       required>
            </div>
            
            <div class="d-grid gap-2">
              <button type="submit" class="btn btn-warning fw-bold shadow-sm text-dark" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                <i class="bi bi-save me-1" v-else></i>
                {{ loading ? 'Đang lưu...' : 'Đổi mật khẩu' }}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.tracking-widest {
    letter-spacing: 0.5em;
}
.input-group-text {
    width: 45px;
    justify-content: center;
}
</style>