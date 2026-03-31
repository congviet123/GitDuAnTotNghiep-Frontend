<script setup>
import { ref, onMounted } from 'vue';
import { contactService } from '@/services/contactService';
import { voucherService } from '@/services/voucherService';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';

const router = useRouter();

// State cho thông tin liên hệ (lấy từ API)
const contactInfo = ref({
    address: 'QTSC 9 Building, Đ. Tô Ký, Tân Chánh Hiệp, Quận 12, TP.HCM',
    phone: '0900 000 001 | 0987654321',
    email: 'CongViet47@gmail.com',
    mapUrl: '' // THÊM MỚI: link nhúng bản đồ từ database
});

// State cho form gửi tin nhắn
const form = ref({
    name: '',
    email: '',
    message: ''
});

// THÊM: State cho voucher
const availableVouchers = ref([]);
const showVoucherNotice = ref(false);

// THÊM MỚI: Loading state cho việc gửi tin nhắn
const sending = ref(false);

// Tải thông tin liên hệ từ API
const loadContactInfo = async () => {
    try {
        const response = await contactService.getContactInfo();
        const data = response.data;
        // SỬA: Đọc từ mapIframe thay vì mapUrl
        contactInfo.value = {
            address: data.address || contactInfo.value.address,
            phone: data.phone || contactInfo.value.phone,
            email: data.email || contactInfo.value.email,
            mapUrl: data.mapIframe || '' // ĐỔI: mapUrl -> mapIframe
        };
    } catch (error) {
        console.error('Lỗi tải thông tin liên hệ:', error);
    }
};

// THÊM: Kiểm tra voucher khuyến mãi
const checkAvailableVouchers = async () => {
    try {
        const response = await voucherService.getPublicVouchers();
        availableVouchers.value = response.data.filter(v => {
            const today = new Date();
            const start = new Date(v.startDate);
            const end = new Date(v.expiryDate);
            today.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return today >= start && today <= end;
        });
        showVoucherNotice.value = availableVouchers.value.length > 0;
    } catch (error) {
        console.error("Lỗi kiểm tra voucher:", error);
    }
};

// THÊM: Chuyển đến trang giới thiệu và cuộn xuống phần voucher
const goToVouchers = () => {
    router.push({ path: '/about', query: { scrollTo: 'voucher' } });
};

// THAY ĐỔI: Hàm gửi tin nhắn (gửi về email trong thông tin liên hệ)
const submitForm = async () => {
    // Kiểm tra dữ liệu nhập
    if (!form.value.name || !form.value.email || !form.value.message) {
        Swal.fire({
            icon: 'warning',
            title: 'Chưa nhập đủ',
            text: 'Vui lòng nhập đầy đủ họ tên, email và nội dung tin nhắn!'
        });
        return;
    }

    // Kiểm tra email hợp lệ (cơ bản)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.value.email)) {
        Swal.fire({
            icon: 'warning',
            title: 'Email không hợp lệ',
            text: 'Vui lòng nhập đúng định dạng email!'
        });
        return;
    }

    sending.value = true;
    
    try {
        // THÊM MỚI: Gửi tin nhắn qua API
        const response = await contactService.sendContactMessage({
            name: form.value.name,
            email: form.value.email,
            message: form.value.message,
            toEmail: contactInfo.value.email // Gửi đến email trong thông tin liên hệ
        });

        // Kiểm tra kết quả từ server
        if (response.data && response.data.success) {
            // Hiển thị thông báo thành công
            Swal.fire({
                icon: 'success',
                title: 'Gửi tin nhắn thành công!',
                text: 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất!',
                timer: 3000,
                showConfirmButton: true,
                confirmButtonText: 'Đóng',
                confirmButtonColor: '#007bff'
            });
            
            // Reset form sau khi gửi thành công
            form.value = {
                name: '',
                email: '',
                message: ''
            };
        } else {
            throw new Error(response.data?.message || 'Gửi tin nhắn thất bại');
        }
        
    } catch (error) {
        console.error('Lỗi gửi tin nhắn:', error);
        // Hiển thị thông báo lỗi chi tiết hơn
        Swal.fire({
            icon: 'error',
            title: 'Gửi tin nhắn thất bại',
            text: error.response?.data?.message || error.message || 'Không thể gửi tin nhắn. Vui lòng thử lại sau!',
            confirmButtonText: 'Đóng',
            confirmButtonColor: '#dc3545'
        });
    } finally {
        sending.value = false;
    }
};

// Gọi API khi component được mount
onMounted(() => {
    loadContactInfo();
    checkAvailableVouchers();
});
</script>

<template>
    <div class="contact-page">
        <div class="container py-5">
            <!-- Breadcrumb điều hướng -->
            <nav aria-label="breadcrumb" class="mb-4">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item">
                        <router-link to="/" class="text-decoration-none text-muted">Trang chủ</router-link>
                    </li>
                    <li class="breadcrumb-item active text-primary-blue fw-bold" aria-current="page">Liên hệ</li>
                </ol>
            </nav>

            <!-- THÊM: Icon voucher nổi -->
            <div v-if="showVoucherNotice" class="voucher-float-btn" @click="goToVouchers">
                <div class="voucher-icon">
                    <i class="bi bi-gift-fill"></i>
                    <span class="voucher-badge">{{ availableVouchers.length }}</span>
                </div>
                <div class="voucher-tooltip">
                    <i class="bi bi-ticket-perforated me-1"></i>
                    Có {{ availableVouchers.length }} mã giảm giá đang chờ bạn!
                </div>
            </div>

            <div class="row g-5 mb-5">
                <!-- Cột trái: Thông tin liên hệ và Form gửi tin nhắn -->
                <div class="col-lg-6">
                    <!-- Phần thông tin liên hệ -->
                    <div class="mb-5">
                        <h4 class="fw-bold text-uppercase mb-4 text-dark">Thông tin liên lạc</h4>
                        
                        <!-- Địa chỉ -->
                        <div class="d-flex align-items-start mb-3">
                            <i class="bi bi-geo-alt-fill text-primary-blue fs-5 me-3"></i>
                            <div>
                                <span class="fw-bold d-block">Địa chỉ</span>
                                <span class="text-muted">{{ contactInfo.address }}</span>
                            </div>
                        </div>

                        <!-- Số điện thoại -->
                        <div class="d-flex align-items-start mb-3">
                            <i class="bi bi-telephone-fill text-primary-blue fs-5 me-3"></i>
                            <div>
                                <span class="fw-bold d-block">Số điện thoại</span>
                                <span class="text-muted">{{ contactInfo.phone }}</span>
                            </div>
                        </div>

                        <!-- Email hỗ trợ -->
                        <div class="d-flex align-items-start mb-3">
                            <i class="bi bi-envelope-fill text-primary-blue fs-5 me-3"></i>
                            <div>
                                <span class="fw-bold d-block">Hỗ trợ</span>
                                <span class="text-muted">{{ contactInfo.email }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Form gửi tin nhắn -->
                    <div>
                        <h4 class="fw-bold text-uppercase mb-4 text-dark">Gửi tin nhắn</h4>
                        <form @submit.prevent="submitForm">
                            <!-- Họ tên -->
                            <div class="mb-3">
                                <input 
                                    type="text" 
                                    class="form-control rounded-pill py-2 px-3 bg-light border-0" 
                                    placeholder="Họ tên" 
                                    v-model="form.name" 
                                    :disabled="sending"
                                    required
                                >
                            </div>
                            
                            <!-- Email -->
                            <div class="mb-3">
                                <input 
                                    type="email" 
                                    class="form-control rounded-pill py-2 px-3 bg-light border-0" 
                                    placeholder="Email" 
                                    v-model="form.email" 
                                    :disabled="sending"
                                    required
                                >
                            </div>
                            
                            <!-- Nội dung tin nhắn -->
                            <div class="mb-3">
                                <textarea 
                                    class="form-control rounded-3 py-2 px-3 bg-light border-0" 
                                    rows="4" 
                                    placeholder="Nội dung tin nhắn..." 
                                    v-model="form.message"
                                    :disabled="sending"
                                    required
                                ></textarea>
                            </div>
                            
                            <!-- Nút gửi (THAY ĐỔI: thêm trạng thái loading) -->
                            <button 
                                type="submit" 
                                class="btn btn-primary-blue text-white rounded-pill px-5 fw-bold"
                                :disabled="sending"
                            >
                                <span v-if="sending">
                                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Đang gửi...
                                </span>
                                <span v-else>
                                    GỬI NGAY
                                </span>
                            </button>
                        </form>
                        
                        <!-- THÊM MỚI: Thông báo nhỏ -->
                        <p class="small text-muted mt-3">
                            <i class="bi bi-shield-check me-1"></i>
                            Thông tin của bạn sẽ được bảo mật và chỉ dùng để phản hồi tin nhắn.
                        </p>
                    </div>
                </div>

                <!-- Cột phải: Bản đồ Google Maps -->
                <div class="col-lg-6">
                    <div class="map-container shadow-sm rounded overflow-hidden h-100">
                        <!-- THAY ĐỔI: Sử dụng mapUrl từ database, nếu không có thì hiển thị thông báo -->
                        <iframe 
                            v-if="contactInfo.mapUrl"
                            :src="contactInfo.mapUrl" 
                            width="100%" 
                            height="100%" 
                            style="border:0; min-height: 450px;" 
                            allowfullscreen="" 
                            loading="lazy"
                            :title="'Bản đồ - ' + contactInfo.address"
                        >
                        </iframe>
                        <!-- Hiển thị khi chưa có mapUrl -->
                        <div v-else class="bg-light d-flex align-items-center justify-content-center h-100 text-muted" style="min-height: 450px;">
                            <div class="text-center p-4">
                                <i class="bi bi-map fs-1 mb-3 d-block"></i>
                                <span class="fw-bold">Bản đồ chưa được cập nhật</span>
                                <p class="small mt-2">Vui lòng quay lại sau</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.text-primary-blue { color: #007bff !important; }
.btn-primary-blue { background-color: #007bff; border-color: #007bff; transition: all 0.3s; }
.btn-primary-blue:hover { background-color: #0056b3; border-color: #0056b3; }
.btn-primary-blue:disabled { background-color: #6c757d; border-color: #6c757d; cursor: not-allowed; }

.breadcrumb-item + .breadcrumb-item::before { content: ">"; }

.form-control:focus {
    box-shadow: none;
    border: 1px solid #007bff !important;
    background-color: #fff !important;
}

/* Style cho map container */
.map-container {
    min-height: 450px;
    background-color: #f8f9fa;
}

/* Style cho input khi disabled */
.form-control:disabled {
    background-color: #e9ecef !important;
    cursor: not-allowed;
}

/* THÊM: CSS cho icon voucher nổi */
.voucher-float-btn {
    position: fixed;
    bottom: 100px;
    right: 30px;
    z-index: 999;
    cursor: pointer;
    animation: bounce 1s ease infinite;
}

.voucher-icon {
    position: relative;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #ff6b01, #ff8c3a);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 5px 20px rgba(255, 107, 1, 0.4);
    transition: transform 0.3s;
}

.voucher-icon i {
    font-size: 28px;
    color: white;
}

.voucher-icon:hover {
    transform: scale(1.1);
}

.voucher-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #dc3545;
    color: white;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    border: 2px solid white;
}

.voucher-tooltip {
    position: absolute;
    right: 70px;
    top: 50%;
    transform: translateY(-50%);
    background: #333;
    color: white;
    padding: 8px 15px;
    border-radius: 30px;
    font-size: 13px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
}

.voucher-tooltip::after {
    content: '';
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent transparent #333;
}

.voucher-float-btn:hover .voucher-tooltip {
    opacity: 1;
    visibility: visible;
    right: 80px;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}
</style>