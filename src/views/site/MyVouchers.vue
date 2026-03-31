<script setup>
import { ref, onMounted } from 'vue';
import Swal from 'sweetalert2';

const savedVouchers = ref([]);
const isLoading = ref(false);

// Lấy danh sách voucher đã lưu từ localStorage
const loadSavedVouchers = () => {
    isLoading.value = true;
    try {
        const stored = localStorage.getItem('savedVouchers');
        const usedVouchers = JSON.parse(localStorage.getItem('usedVouchers') || '[]');
        
        if (stored) {
            let vouchers = JSON.parse(stored);
            // Đồng bộ trạng thái used từ danh sách usedVouchers
            vouchers = vouchers.map(v => ({
                ...v,
                used: usedVouchers.includes(v.code) || v.used
            }));
            savedVouchers.value = vouchers;
            // Lưu lại để đồng bộ
            localStorage.setItem('savedVouchers', JSON.stringify(vouchers));
        } else {
            savedVouchers.value = [];
        }
    } catch (error) {
        console.error("Lỗi tải voucher:", error);
        savedVouchers.value = [];
    } finally {
        isLoading.value = false;
    }
};

// Xóa voucher đã lưu
const removeSavedVoucher = (voucherCode) => {
    Swal.fire({
        title: 'Xóa voucher?',
        text: `Bạn có chắc muốn xóa voucher ${voucherCode} khỏi danh sách đã lưu?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            let saved = JSON.parse(localStorage.getItem('savedVouchers') || '[]');
            // KHÔNG XÓA KHỎI usedVouchers, chỉ xóa khỏi savedVouchers
            saved = saved.filter(v => v.code !== voucherCode);
            localStorage.setItem('savedVouchers', JSON.stringify(saved));
            loadSavedVouchers();
            Swal.fire({
                icon: 'success',
                title: 'Đã xóa',
                text: 'Voucher đã được xóa khỏi danh sách!',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
};

// Sao chép mã voucher
const copyVoucherCode = (code) => {
    navigator.clipboard.writeText(code);
    Swal.fire({
        icon: 'success',
        title: 'Đã sao chép!',
        text: `Mã ${code} đã được sao chép vào clipboard`,
        timer: 1500,
        showConfirmButton: false
    });
};

// Đánh dấu voucher đã dùng (gọi sau khi đặt hàng thành công)
const markVoucherAsUsed = (voucherCode) => {
    // Lấy danh sách voucher đã dùng
    let usedVouchers = JSON.parse(localStorage.getItem('usedVouchers') || '[]');
    
    // Nếu chưa có thì thêm vào
    if (!usedVouchers.includes(voucherCode)) {
        usedVouchers.push(voucherCode);
        localStorage.setItem('usedVouchers', JSON.stringify(usedVouchers));
    }
    
    // Cập nhật trạng thái used trong danh sách voucher đã lưu
    let saved = JSON.parse(localStorage.getItem('savedVouchers') || '[]');
    const index = saved.findIndex(v => v.code === voucherCode);
    if (index !== -1) {
        saved[index].used = true;
        localStorage.setItem('savedVouchers', JSON.stringify(saved));
        loadSavedVouchers();
    }
};

// Format tiền tệ
const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
};

// Format ngày
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
};

// Kiểm tra voucher còn hiệu lực
const isVoucherValid = (startDate, expiryDate) => {
    if (!startDate || !expiryDate) return false;
    const today = new Date();
    const start = new Date(startDate);
    const expiry = new Date(expiryDate);
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return today >= start && today <= expiry;
};

onMounted(() => {
    loadSavedVouchers();
    
    // Lắng nghe sự kiện từ CartView.vue khi đặt hàng thành công
    window.addEventListener('voucher-used', (event) => {
        if (event.detail && event.detail.code) {
            markVoucherAsUsed(event.detail.code);
        }
    });
});
</script>

<template>
    <div class="container my-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-primary">
                <i class="bi bi-ticket-perforated me-2"></i> Voucher của tôi
            </h2>
            <router-link to="/about#voucher-section" class="btn btn-outline-primary">
                <i class="bi bi-plus-circle me-1"></i> Khám phá thêm voucher
            </router-link>
        </div>

        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else-if="savedVouchers.length === 0" class="text-center py-5">
            <i class="bi bi-ticket-perforated fs-1 text-muted"></i>
            <p class="text-muted mt-3">Bạn chưa có voucher nào.</p>
            <router-link to="/about#voucher-section" class="btn btn-primary mt-2">
                <i class="bi bi-gift me-1"></i> Nhận voucher ngay
            </router-link>
        </div>

        <div v-else class="row g-4">
            <div v-for="voucher in savedVouchers" :key="voucher.code" class="col-md-6 col-lg-4">
                <div class="card voucher-card h-100 border-0 shadow-sm" :class="{ 'voucher-used': voucher.used }">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <span class="badge bg-primary mb-2">ĐÃ LƯU</span>
                                <h4 class="voucher-code font-monospace mb-0">{{ voucher.code }}</h4>
                            </div>
                            <span v-if="voucher.used" class="badge bg-secondary">Đã sử dụng</span>
                            <span v-else-if="!isVoucherValid(voucher.startDate, voucher.expiryDate)" 
                                  class="badge bg-warning">Hết hạn</span>
                            <span v-else class="badge bg-success">Còn hiệu lực</span>
                        </div>
                        
                        <h5 class="fw-bold mb-2">{{ voucher.name }}</h5>
                        <p class="text-muted small mb-3">{{ voucher.description || 'Không có mô tả' }}</p>
                        
                        <div class="voucher-value mb-3">
                            <span v-if="voucher.type === 'percentage'" class="display-6 fw-bold text-danger">
                                {{ voucher.value }}%
                            </span>
                            <span v-else class="display-6 fw-bold text-danger">
                                {{ formatPrice(voucher.value) }}
                            </span>
                            <span class="text-muted ms-2">giảm</span>
                        </div>
                        
                        <div class="voucher-condition small text-muted mb-3">
                            <div v-if="voucher.minOrderValue > 0">
                                <i class="bi bi-cart-check me-1"></i> Đơn tối thiểu: {{ formatPrice(voucher.minOrderValue) }}
                            </div>
                            <div v-else>
                                <i class="bi bi-infinity me-1"></i> Không yêu cầu đơn tối thiểu
                            </div>
                            <div>
                                <i class="bi bi-calendar-range me-1"></i> 
                                {{ formatDate(voucher.startDate) }} - {{ formatDate(voucher.expiryDate) }}
                            </div>
                        </div>
                        
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-outline-primary flex-grow-1" 
                                    :disabled="voucher.used || !isVoucherValid(voucher.startDate, voucher.expiryDate)"
                                    @click="copyVoucherCode(voucher.code)">
                                <i class="bi bi-copy me-2"></i> Sao chép mã
                            </button>
                            <button class="btn btn-outline-danger" @click="removeSavedVoucher(voucher.code)">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                        
                        <div v-if="voucher.used" class="alert alert-secondary small mt-3 mb-0 py-2">
                            <i class="bi bi-check-circle me-1"></i> Bạn đã sử dụng voucher này
                        </div>
                        <div v-else-if="!isVoucherValid(voucher.startDate, voucher.expiryDate)" 
                             class="alert alert-warning small mt-3 mb-0 py-2">
                            <i class="bi bi-clock-history me-1"></i> Voucher đã hết hạn
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.voucher-card {
    transition: transform 0.3s, box-shadow 0.3s;
    border-radius: 16px;
}
.voucher-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.1);
}
.voucher-card.voucher-used {
    opacity: 0.7;
    background: #f8f9fa;
}
.voucher-code {
    background: #f8f9fa;
    padding: 4px 12px;
    border-radius: 8px;
    display: inline-block;
    letter-spacing: 1px;
    font-weight: bold;
}
.voucher-value {
    border-top: 1px dashed #dee2e6;
    padding-top: 12px;
}
</style>