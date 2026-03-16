<script setup>
import { ref, onMounted } from 'vue';
import aboutService from '@/services/aboutService';

// Hàm xử lý đường dẫn ảnh bị lỗi
const fixImageUrl = (url) => {
    if (!url) return '';
    
    let fixedUrl = url;
    
    // Xử lý lỗi 2 lần /imgs
    if (fixedUrl.includes('/imgs//imgs/')) {
        fixedUrl = fixedUrl.replace('/imgs//imgs/', '/imgs/');
    }
    // Xử lý trường hợp /imgs/imgs/ (không có dấu / thừa)
    else if (fixedUrl.includes('/imgs/imgs/')) {
        fixedUrl = fixedUrl.replace('/imgs/imgs/', '/imgs/');
    }
    // Xử lý lỗi /imos/ thành /imgs/
    else if (fixedUrl.includes('/imos/')) {
        fixedUrl = fixedUrl.replace('/imos/', '/imgs/');
    }
    
    // Đảm bảo URL bắt đầu bằng /
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

const loadAboutData = async () => {
    try {
        const response = await aboutService.getAboutPage();
        let data = response.data;
        
        // Fix đường dẫn ảnh trong dữ liệu
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

        <!-- Newsletter Section -->
        <div class="bg-light py-5">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h3 class="fw-bold mb-1">Theo dõi bản tin chính sách điều khoản của chúng tôi</h3>
                        <p class="text-muted mb-0">{{ aboutData.emailNewsletter }}</p>
                    </div>
                    <div class="col-md-6 mt-3 mt-md-0">
                        <div class="input-group">
                            <input type="email" class="form-control py-3" placeholder="Nhập email của bạn...">
                            <button class="btn btn-success-custom text-white px-4 fw-bold" type="button">Đăng ký</button>
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
/* TÙY CHỈNH MÀU SẮC */
.text-success-custom { color: #28a745 !important; }
.bg-success-custom { background-color: #28a745 !important; }
.btn-success-custom { background-color: #28a745; border-color: #28a745; transition: all 0.3s; }
.btn-success-custom:hover { background-color: #218838; transform: translateY(-2px); }

/* Banner Style */
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

/* Image Wrapper */
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

/* Icon Wrapper */
.icon-wrapper {
    width: 80px; height: 80px;
}
.feature-box:hover .icon-wrapper {
    transform: scale(1.1); transition: transform 0.3s;
}

/* Hover Effect cho Gallery */
.hover-zoom { transition: transform 0.5s ease; }
.hover-zoom:hover { transform: scale(1.1); }

/* Logo đối tác màu xám */
.grayscale-logos h3 {
    opacity: 0.5; transition: opacity 0.3s; cursor: pointer;
}
.grayscale-logos h3:hover { opacity: 1; color: #28a745 !important; }

/* Text Justify */
.text-justify { text-align: justify; }

/* CSS phụ trợ cho ảnh gallery vuông */
.ratio-1x1 {
    aspect-ratio: 1/1;
}
.object-fit-cover {
    object-fit: cover;
    width: 100%;
    height: 100%;
}
</style>