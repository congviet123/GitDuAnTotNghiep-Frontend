<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import aboutService from '@/services/aboutService';
import { voucherService } from '@/services/voucherService';
import Swal from 'sweetalert2';

const route = useRoute();

// Hàm xử lý đường dẫn ảnh bị lỗi
const fixImageUrl = (url) => {
    if (!url) return '';
    
    let fixedUrl = url;
    
    if (fixedUrl.includes('/imgs//imgs/')) {
        fixedUrl = fixedUrl.replace('/imgs//imgs/', '/imgs/');
    }
    else if (fixedUrl.includes('/imgs/imgs/')) {
        fixedUrl = fixedUrl.replace('/imgs/imgs/', '/imgs/');
    }
    else if (fixedUrl.includes('/imos/')) {
        fixedUrl = fixedUrl.replace('/imos/', '/imgs/');
    }
    
    if (!fixedUrl.startsWith('/') && !fixedUrl.startsWith('http')) {
        fixedUrl = '/' + fixedUrl;
    }
    
    return fixedUrl;
};

const aboutData = ref({
    bannerTitle: "Chào Mừng Bạn Đến Trái Cây Bay",
    bannerSubtitle: "Nơi Cung Cấp Trái Cây Tươi Sạch - Fresh & Healthy",
    bannerImage: "/imgs/bannerGioiThieu.jpg",
    introTitle: "Về Chúng Tôi",
    introText1: "",
    introText2: "",
    introImage: "/imgs/logoTraiCayBay.jpg",
    emailNewsletter: "Nhận thông tin cập nhật qua email về các ưu đãi đặc biệt.",
    whyChooseTitle: "Vì Sao Chọn Sản Phẩm Của Chúng Tôi",
    whyChooseSubtitle: "Cam kết mang đến cho khách hàng những sản phẩm chất lượng nhất, dịch vụ tốt nhất.",
    features: [],
    galleryImages: [],
    partners: []
});

// STATE CHO VOUCHER
const publicVouchers = ref([]);
const isLoadingVouchers = ref(false);
const showVoucherNotice = ref(false);
const availableVouchers = ref([]);

// Lấy danh sách voucher công khai
const loadPublicVouchers = async () => {
    isLoadingVouchers.value = true;
    try {
        const response = await voucherService.getPublicVouchers();
        publicVouchers.value = response.data;
        // Kiểm tra voucher còn hiệu lực để hiển thị icon
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
        console.error("Lỗi tải voucher:", error);
    } finally {
        isLoadingVouchers.value = false;
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

// Chuyển đến phần voucher (cuộn xuống)
const goToVouchers = () => {
    const element = document.getElementById('voucher-section');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Lưu voucher vào localStorage
const saveVoucher = (voucher) => {
    // Lấy danh sách voucher đã lưu từ localStorage
    let savedVouchers = JSON.parse(localStorage.getItem('savedVouchers') || '[]');
    // Lấy danh sách voucher đã dùng
    let usedVouchers = JSON.parse(localStorage.getItem('usedVouchers') || '[]');
    
    // Kiểm tra đã lưu chưa
    if (savedVouchers.some(v => v.code === voucher.code)) {
        Swal.fire({
            icon: 'info',
            title: 'Đã lưu rồi!',
            text: `Voucher ${voucher.code} đã có trong danh sách của bạn.`,
            timer: 1500,
            showConfirmButton: false
        });
        return;
    }
    
    // Kiểm tra xem voucher này đã từng dùng chưa (trong lịch sử đã dùng)
    const isUsed = usedVouchers.includes(voucher.code);
    
    // Thêm voucher mới vào danh sách
    savedVouchers.push({
        code: voucher.code,
        name: voucher.name,
        description: voucher.description,
        type: voucher.type,
        value: voucher.value,
        minOrderValue: voucher.minOrderValue,
        startDate: voucher.startDate,
        expiryDate: voucher.expiryDate,
        used: isUsed, // Nếu đã từng dùng thì đánh dấu used = true
        savedDate: new Date().toISOString()
    });
    
    // Lưu lại vào localStorage
    localStorage.setItem('savedVouchers', JSON.stringify(savedVouchers));
    
    if (isUsed) {
        Swal.fire({
            icon: 'warning',
            title: 'Voucher đã sử dụng!',
            text: `Voucher ${voucher.code} đã được sử dụng trước đó, không thể dùng lại.`,
            timer: 2000,
            showConfirmButton: false
        });
    } else {
        Swal.fire({
            icon: 'success',
            title: 'Đã lưu!',
            text: `Voucher ${voucher.code} đã được lưu vào danh sách của bạn.`,
            timer: 1500,
            showConfirmButton: false
        });
    }
};

// Hàm cuộn đến phần voucher
const scrollToVoucher = () => {
    const element = document.getElementById('voucher-section');
    if (element) {
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
};

const loadAboutData = async () => {
    try {
        const response = await aboutService.getAboutPage();
        let data = response.data;
        
        if (data.bannerImage) {
            data.bannerImage = fixImageUrl(data.bannerImage);
        }
        if (data.introImage) {
            data.introImage = fixImageUrl(data.introImage);
        }
        if (data.galleryImages) {
            data.galleryImages = data.galleryImages.map(img => img ? fixImageUrl(img) : img);
        }
        if (data.partners) {
            data.partners.forEach(partner => {
                if (partner.logo) {
                    partner.logo = fixImageUrl(partner.logo);
                }
            });
        }
        
        aboutData.value = data;
    } catch (error) {
        console.error("Error loading about data:", error);
    }
};

onMounted(() => {
    loadAboutData();
    loadPublicVouchers();
    
    if (route.query.scrollTo === 'voucher') {
        scrollToVoucher();
    }
});
</script>

<template>
    <div class="about-page">
        <!-- Banner Section -->
        <div class="position-relative text-center text-white banner-section d-flex align-items-center justify-content-center"
             :style="{ backgroundImage: `url(${fixImageUrl(aboutData.bannerImage)})` }">
            <div class="content position-relative z-2 px-3">
                <p class="mb-2 text-uppercase letter-spacing-2">Trang Chủ / Giới Thiệu</p>
                <h1 class="fw-bold display-5">{{ aboutData.bannerTitle }}</h1>
                <div class="separator mx-auto my-3"></div>
                <p class="fs-5">{{ aboutData.bannerSubtitle }}</p>
            </div>
            <div class="overlay"></div>
        </div>

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

        <!-- About Us Section -->
        <div class="container py-5 my-5">
            <div class="row align-items-center g-5">
                <div class="col-lg-6">
                    <h2 class="fw-bold text-uppercase mb-4 text-success-custom">{{ aboutData.introTitle }}</h2>
                    <p class="text-muted mb-4 text-justify">{{ aboutData.introText1 }}</p>
                    <p class="text-muted mb-4 text-justify">{{ aboutData.introText2 }}</p>
                    <router-link to="/products" class="btn btn-success-custom rounded-pill px-5 py-2 fw-bold text-white">
                        MUA NGAY
                    </router-link>
                </div>
                <div class="col-lg-6">
                    <div class="about-image-wrapper text-center">
                        <img :src="fixImageUrl(aboutData.introImage)" 
                             alt="Về chúng tôi" class="img-fluid rounded-custom shadow-sm about-logo">
                    </div>
                </div>
            </div>
        </div>

        <!-- DANH SÁCH VOUCHER KHUYẾN MÃI -->
        <div id="voucher-section" class="bg-light py-5">
            <div class="container">
                <div class="text-center mb-4">
                    <h2 class="fw-bold text-success-custom">
                        <i class="bi bi-ticket-perforated me-2"></i> KHUYẾN MÃI ĐẶC BIỆT
                    </h2>
                    <p class="text-muted">Những mã giảm giá hấp dẫn dành riêng cho bạn</p>
                </div>

                <div v-if="isLoadingVouchers" class="text-center py-4">
                    <div class="spinner-border text-success-custom" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                </div>

                <div v-else-if="publicVouchers.length === 0" class="text-center py-4">
                    <p class="text-muted">Hiện chưa có chương trình khuyến mãi nào</p>
                </div>

                <div v-else class="row g-4">
                    <div v-for="voucher in publicVouchers" :key="voucher.code" class="col-md-6 col-lg-4">
                        <div class="card voucher-card h-100 border-0 shadow-sm">
                            <div class="card-body p-4">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <span class="badge bg-success-custom mb-2">MÃ GIẢM GIÁ</span>
                                        <h4 class="voucher-code font-monospace mb-0">{{ voucher.code }}</h4>
                                    </div>
                                    <span v-if="isVoucherValid(voucher.startDate, voucher.expiryDate)" 
                                          class="badge bg-success">Còn hiệu lực</span>
                                    <span v-else class="badge bg-secondary">Hết hạn</span>
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
                                    <div v-if="voucher.usageLimit > 0">
                                        <i class="bi bi-ticket-perforated me-1"></i> 
                                        Còn {{ voucher.usageLimit - (voucher.usedCount || 0) }} / {{ voucher.usageLimit }} lượt
                                    </div>
                                </div>
                                
                                <button class="btn btn-outline-success-custom w-100 mt-2" @click="saveVoucher(voucher)">
                                    <i class="bi bi-bookmark-plus me-2"></i> Lưu mã
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Why Choose Us Section -->
        <div class="bg-success-custom text-white py-5">
            <div class="container py-4">
                <div class="text-center mb-5">
                    <h2 class="fw-bold text-uppercase">{{ aboutData.whyChooseTitle }}</h2>
                    <p class="w-75 mx-auto opacity-75">{{ aboutData.whyChooseSubtitle }}</p>
                </div>

                <div class="row text-center g-4 justify-content-center row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
                    <div v-for="(feature, index) in aboutData.features" :key="index" class="col">
                        <div class="feature-box h-100">
                            <div class="icon-wrapper mb-3 mx-auto bg-white text-success-custom rounded-circle d-flex align-items-center justify-content-center">
                                <i :class="['bi', feature.icon || 'bi-star', 'fs-1']"></i>
                            </div>
                            <h5 class="fw-bold fs-6">{{ feature.title }}</h5>
                            <p class="small opacity-75">{{ feature.description }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Gallery Section -->
        <div class="container py-5">
            <div class="row g-4">
                <div v-for="(image, index) in aboutData.galleryImages" :key="index" class="col-6 col-md-3">
                    <div class="ratio ratio-1x1 overflow-hidden rounded shadow-sm">
                        <img :src="fixImageUrl(image)" class="img-fluid object-fit-cover hover-zoom" :alt="'Gallery ' + (index + 1)">
                    </div>
                </div>
            </div>
        </div>

        <!-- Partners Section -->
        <div class="container pb-5">
            <hr class="mb-5">
            <div class="row text-center align-items-center grayscale-logos">
                <div v-for="(partner, index) in aboutData.partners" :key="index" class="col-6 col-md-3 mb-4 mb-md-0">
                    <h3 class="fw-bold text-muted">{{ partner.name }}</h3>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.text-success-custom { color: #28a745 !important; }
.bg-success-custom { background-color: #28a745 !important; }
.btn-success-custom { background-color: #28a745; border-color: #28a745; transition: all 0.3s; }
.btn-success-custom:hover { background-color: #218838; transform: translateY(-2px); }
.btn-outline-success-custom {
    border: 1px solid #28a745;
    color: #28a745;
    background: transparent;
    transition: all 0.3s;
}
.btn-outline-success-custom:hover {
    background-color: #28a745;
    color: white;
    transform: translateY(-2px);
}

.banner-section {
    background-size: cover;
    background-position: center;
    height: 400px;
}
.overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.5);
}
.separator {
    width: 60px; height: 3px; background-color: #fff;
}
.letter-spacing-2 { letter-spacing: 2px; }

.about-image-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
}
.about-logo {
    max-height: 350px;
    width: auto;
    border-radius: 20px;
    transition: transform 0.3s;
}
.about-logo:hover {
    transform: scale(1.02);
}

.icon-wrapper {
    width: 80px; height: 80px;
}
.feature-box:hover .icon-wrapper {
    transform: scale(1.1); transition: transform 0.3s;
}

.hover-zoom { transition: transform 0.5s ease; }
.hover-zoom:hover { transform: scale(1.1); }

.grayscale-logos h3 {
    opacity: 0.5; transition: opacity 0.3s; cursor: pointer;
}
.grayscale-logos h3:hover { opacity: 1; color: #28a745 !important; }

.text-justify { text-align: justify; }

.ratio-1x1 {
    aspect-ratio: 1/1;
}
.object-fit-cover {
    object-fit: cover;
    width: 100%;
    height: 100%;
}

.voucher-card {
    transition: transform 0.3s, box-shadow 0.3s;
    border-radius: 16px;
}
.voucher-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.1);
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