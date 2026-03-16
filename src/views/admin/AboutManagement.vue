<script setup>
import { reactive, onMounted, ref } from 'vue';
import Swal from 'sweetalert2';
import aboutService from '@/services/aboutService';

// Thêm ref cho file input
const bannerFileInput = ref(null);
const introFileInput = ref(null);
const galleryFileInputs = ref([]);
const partnerFileInputs = ref([]);

// Dữ liệu từ form
const aboutData = reactive({
    // Banner
    bannerTitle: "",
    bannerSubtitle: "",
    bannerImage: "",
    
    // Về Chúng Tôi
    introTitle: "",
    introText1: "",
    introText2: "",
    introImage: "",

    // Email Newsletter
    emailNewsletter: "",

    // Vì Sao Chọn Chúng Tôi
    whyChooseTitle: "",
    whyChooseSubtitle: "",
    
    // Features (5 cột)
    feature1Title: "",
    feature1Desc: "",
    feature2Title: "",
    feature2Desc: "",
    feature3Title: "",
    feature3Desc: "",
    feature4Title: "",
    feature4Desc: "",
    feature5Title: "",
    feature5Desc: "",

    // Gallery Ảnh
    galleryImage1: "",
    galleryImage2: "",
    galleryImage3: "",
    galleryImage4: "",

    // Đối tác
    partner1Name: "",
    partner1Logo: "", 
    partner2Name: "",
    partner2Logo: "",
    partner3Name: "",
    partner3Logo: "", 
    partner4Name: "",
    partner4Logo: "",
});

// Hàm xử lý đường dẫn ảnh - SỬA HOÀN CHỈNH
const fixImageUrl = (url) => {
    if (!url) return '';
    
    let fixedUrl = url;
    
    // Xử lý tất cả các lỗi có thể
    const fixes = [
        { from: '/imsgs/', to: '/imgs/' },
        { from: '/imgs//imgs/', to: '/imgs/' },
        { from: '/imgs/imgs/', to: '/imgs/' },
        { from: '//imgs/', to: '/imgs/' },
        { from: '/imgss/', to: '/imgs/' },
        { from: '/imggs/', to: '/imgs/' },
        { from: '/imos/', to: '/imgs/' }
    ];
    
    fixes.forEach(fix => {
        while (fixedUrl.includes(fix.from)) {
            fixedUrl = fixedUrl.replace(fix.from, fix.to);
        }
    });
    
    // Đảm bảo URL bắt đầu bằng /
    if (!fixedUrl.startsWith('/') && !fixedUrl.startsWith('http')) {
        fixedUrl = '/' + fixedUrl;
    }
    
    return fixedUrl;
};

// Hàm upload ảnh - SỬA LẠI
const uploadImage = async (file, targetField) => {
    if (!file) return;
    
    try {
        Swal.fire({
            title: 'Đang upload...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const response = await aboutService.uploadImage(file);
        
        // Lấy URL từ response
        let imageUrl = response.data.url || response.data;
        console.log('1. URL gốc từ backend:', imageUrl);
        
        // FIX URL NGAY LẬP TỨC
        imageUrl = fixImageUrl(imageUrl);
        console.log('2. URL sau khi fix:', imageUrl);
        
        // Gán URL vào field tương ứng
        aboutData[targetField] = imageUrl;
        console.log('3. Đã gán vào', targetField, '=', imageUrl);
        
        Swal.fire({
            icon: 'success',
            title: 'Upload thành công',
            text: 'Ảnh đã được tải lên!',
            timer: 1500,
            showConfirmButton: false
        });
        
    } catch (error) {
        console.error("Upload error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Upload thất bại',
            text: 'Không thể tải ảnh lên!'
        });
    }
};

// Xử lý chọn file cho Banner
const handleBannerUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        uploadImage(file, 'bannerImage');
    }
};

// Xử lý chọn file cho Intro
const handleIntroUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        uploadImage(file, 'introImage');
    }
};

// Xử lý chọn file cho Gallery
const handleGalleryUpload = (index, event) => {
    const file = event.target.files[0];
    if (file) {
        const fieldMap = ['galleryImage1', 'galleryImage2', 'galleryImage3', 'galleryImage4'];
        uploadImage(file, fieldMap[index]);
    }
};

// Xử lý chọn file cho Partner
const handlePartnerUpload = (index, event) => {
    const file = event.target.files[0];
    if (file) {
        const fieldMap = ['partner1Logo', 'partner2Logo', 'partner3Logo', 'partner4Logo'];
        uploadImage(file, fieldMap[index]);
    }
};

// Kích hoạt chọn file cho Banner
const triggerBannerUpload = () => {
    bannerFileInput.value.click();
};

// Kích hoạt chọn file cho Intro
const triggerIntroUpload = () => {
    introFileInput.value.click();
};

// Kích hoạt chọn file cho Gallery
const triggerGalleryUpload = (index) => {
    galleryFileInputs.value[index].click();
};

// Kích hoạt chọn file cho Partner
const triggerPartnerUpload = (index) => {
    partnerFileInputs.value[index].click();
};

// Load dữ liệu từ API
const loadAboutData = async () => {
    try {
        const response = await aboutService.getAboutPage();
        const data = response.data;
        
        // Fix đường dẫn ảnh trong dữ liệu cũ
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
        
        // Banner
        aboutData.bannerTitle = data.bannerTitle || "";
        aboutData.bannerSubtitle = data.bannerSubtitle || "";
        aboutData.bannerImage = data.bannerImage || "";
        
        // About Us
        aboutData.introTitle = data.introTitle || "";
        aboutData.introText1 = data.introText1 || "";
        aboutData.introText2 = data.introText2 || "";
        aboutData.introImage = data.introImage || "";
        
        // Email Newsletter
        aboutData.emailNewsletter = data.emailNewsletter || "";
        
        // Why Choose Us
        aboutData.whyChooseTitle = data.whyChooseTitle || "";
        aboutData.whyChooseSubtitle = data.whyChooseSubtitle || "";
        
        // Features
        if (data.features && data.features.length >= 5) {
            aboutData.feature1Title = data.features[0].title || "";
            aboutData.feature1Desc = data.features[0].description || "";
            aboutData.feature2Title = data.features[1].title || "";
            aboutData.feature2Desc = data.features[1].description || "";
            aboutData.feature3Title = data.features[2].title || "";
            aboutData.feature3Desc = data.features[2].description || "";
            aboutData.feature4Title = data.features[3].title || "";
            aboutData.feature4Desc = data.features[3].description || "";
            aboutData.feature5Title = data.features[4].title || "";
            aboutData.feature5Desc = data.features[4].description || "";
        }
        
        // Gallery
        if (data.galleryImages && data.galleryImages.length >= 4) {
            aboutData.galleryImage1 = data.galleryImages[0] || "";
            aboutData.galleryImage2 = data.galleryImages[1] || "";
            aboutData.galleryImage3 = data.galleryImages[2] || "";
            aboutData.galleryImage4 = data.galleryImages[3] || "";
        }
        
        // Partners
        if (data.partners && data.partners.length >= 4) {
            aboutData.partner1Name = data.partners[0].name || "";
            aboutData.partner1Logo = data.partners[0].logo || "";
            aboutData.partner2Name = data.partners[1].name || "";
            aboutData.partner2Logo = data.partners[1].logo || "";
            aboutData.partner3Name = data.partners[2].name || "";
            aboutData.partner3Logo = data.partners[2].logo || "";
            aboutData.partner4Name = data.partners[3].name || "";
            aboutData.partner4Logo = data.partners[3].logo || "";
        }
        
    } catch (error) {
        console.error("Error loading about data:", error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Không thể tải dữ liệu trang giới thiệu!'
        });
    }
};

// Lưu dữ liệu
const saveAboutInfo = async () => {
    try {
        const aboutDTO = {
            bannerTitle: aboutData.bannerTitle,
            bannerSubtitle: aboutData.bannerSubtitle,
            bannerImage: aboutData.bannerImage,
            
            introTitle: aboutData.introTitle,
            introText1: aboutData.introText1,
            introText2: aboutData.introText2,
            introImage: aboutData.introImage,
            
            emailNewsletter: aboutData.emailNewsletter,
            
            whyChooseTitle: aboutData.whyChooseTitle,
            whyChooseSubtitle: aboutData.whyChooseSubtitle,
            
            features: [
                { title: aboutData.feature1Title, description: aboutData.feature1Desc, icon: "bi-truck" },
                { title: aboutData.feature2Title, description: aboutData.feature2Desc, icon: "bi-headset" },
                { title: aboutData.feature3Title, description: aboutData.feature3Desc, icon: "bi-clock-history" },
                { title: aboutData.feature4Title, description: aboutData.feature4Desc, icon: "bi-arrow-repeat" },
                { title: aboutData.feature5Title, description: aboutData.feature5Desc, icon: "bi-gift" }
            ],
            
            galleryImages: [
                aboutData.galleryImage1,
                aboutData.galleryImage2,
                aboutData.galleryImage3,
                aboutData.galleryImage4
            ],
            
            partners: [
                { name: aboutData.partner1Name, logo: aboutData.partner1Logo },
                { name: aboutData.partner2Name, logo: aboutData.partner2Logo },
                { name: aboutData.partner3Name, logo: aboutData.partner3Logo },
                { name: aboutData.partner4Name, logo: aboutData.partner4Logo }
            ]
        };
        
        Swal.fire({
            title: 'Đang lưu...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        await aboutService.updateAboutPage(aboutDTO);
        
        Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đã cập nhật thông tin trang Giới thiệu!',
            confirmButtonColor: '#0d6efd'
        });
        
    } catch (error) {
        console.error("Error saving about data:", error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: error.response?.data?.message || 'Không thể lưu thông tin trang giới thiệu!'
        });
    }
};

// Reset form
const resetForm = () => {
    Swal.fire({
        title: 'Đặt lại dữ liệu?',
        text: "Các thay đổi chưa lưu sẽ bị mất!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            loadAboutData();
        }
    });
};

// Load dữ liệu khi component được mount
onMounted(() => {
    loadAboutData();
});
</script>

<template>
    <div class="container-fluid p-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-primary fw-bold">Quản lý trang Giới Thiệu</h2>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary" @click="resetForm">
                    <i class="bi bi-arrow-counterclockwise me-1"></i> Đặt lại
                </button>
                <button class="btn btn-primary px-4 fw-bold" @click="saveAboutInfo">
                    <i class="bi bi-save me-1"></i> Lưu thay đổi
                </button>
            </div>
        </div>

        <div class="row g-4">
            <!-- Left Column - Forms -->
            <div class="col-lg-8">
                
                <!-- Banner Section -->
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-header bg-white py-3">
                        <h5 class="fw-bold m-0 text-primary"><i class="bi bi-image me-2"></i>Phần Banner (Đầu trang)</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Tiêu đề lớn</label>
                            <input type="text" class="form-control" v-model="aboutData.bannerTitle">
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Mô tả ngắn (Subtitle)</label>
                            <input type="text" class="form-control" v-model="aboutData.bannerSubtitle">
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Link ảnh Banner</label>
                            <div class="input-group">
                                <input type="text" class="form-control" v-model="aboutData.bannerImage" readonly>
                                <input type="file" ref="bannerFileInput" @change="handleBannerUpload" accept="image/*" style="display: none;">
                                <button class="btn btn-outline-secondary" @click="triggerBannerUpload">
                                    <i class="bi bi-upload"></i> Chọn ảnh
                                </button>
                            </div>
                            <div class="mt-2" v-if="aboutData.bannerImage">
                                <img :src="fixImageUrl(aboutData.bannerImage)" class="img-thumbnail" style="max-height: 100px;" alt="Preview">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- About Us Section -->
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-header bg-white py-3">
                        <h5 class="fw-bold m-0 text-success"><i class="bi bi-info-circle me-2"></i>Phần "Về Chúng Tôi"</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Tiêu đề mục</label>
                            <input type="text" class="form-control" v-model="aboutData.introTitle">
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Đoạn giới thiệu 1</label>
                            <textarea class="form-control" rows="4" v-model="aboutData.introText1"></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Đoạn giới thiệu 2</label>
                            <textarea class="form-control" rows="3" v-model="aboutData.introText2"></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Link ảnh minh họa (Bên phải)</label>
                            <div class="input-group">
                                <input type="text" class="form-control" v-model="aboutData.introImage" readonly>
                                <input type="file" ref="introFileInput" @change="handleIntroUpload" accept="image/*" style="display: none;">
                                <button class="btn btn-outline-secondary" @click="triggerIntroUpload">
                                    <i class="bi bi-upload"></i> Chọn ảnh
                                </button>
                            </div>
                            <div class="mt-2" v-if="aboutData.introImage">
                                <img :src="fixImageUrl(aboutData.introImage)" class="img-thumbnail" style="max-height: 100px;" alt="Preview">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Why Choose Us Section -->
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-header bg-white py-3">
                        <h5 class="fw-bold m-0 text-warning"><i class="bi bi-star me-2"></i>Phần "Vì Sao Chọn Chúng Tôi"</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3 mb-4">
                            <div class="col-12">
                                <label class="form-label fw-bold">Tiêu đề lớn</label>
                                <input type="text" class="form-control" v-model="aboutData.whyChooseTitle">
                            </div>
                            <div class="col-12">
                                <label class="form-label fw-bold">Mô tả phụ</label>
                                <textarea class="form-control" rows="2" v-model="aboutData.whyChooseSubtitle"></textarea>
                            </div>
                        </div>

                        <hr class="text-muted">

                        <h6 class="fw-bold text-muted mb-3">Nội dung chính sách điều khoản:</h6>
                        <div class="row g-3 justify-content-center">
                            <!-- Column 1 -->
                            <div class="col-md-4">
                                <div class="p-3 bg-light rounded h-100 border">
                                    <h6 class="fw-bold text-center text-primary">Cột 1 (Vận chuyển)</h6>
                                    <div class="mb-2">
                                        <label class="small text-muted">Tiêu đề</label>
                                        <input type="text" class="form-control form-control-sm" v-model="aboutData.feature1Title">
                                    </div>
                                    <div>
                                        <label class="small text-muted">Mô tả</label>
                                        <input type="text" class="form-control form-control-sm" v-model="aboutData.feature1Desc">
                                    </div>
                                </div>
                            </div>
                            <!-- Column 2 -->
                            <div class="col-md-4">
                                <div class="p-3 bg-light rounded h-100 border">
                                    <h6 class="fw-bold text-center text-primary">Cột 2 (Hỗ trợ)</h6>
                                    <div class="mb-2">
                                        <label class="small text-muted">Tiêu đề</label>
                                        <input type="text" class="form-control form-control-sm" v-model="aboutData.feature2Title">
                                    </div>
                                    <div>
                                        <label class="small text-muted">Mô tả</label>
                                        <input type="text" class="form-control form-control-sm" v-model="aboutData.feature2Desc">
                                    </div>
                                </div>
                            </div>
                            <!-- Column 3 -->
                            <div class="col-md-4">
                                <div class="p-3 bg-light rounded h-100 border">
                                    <h6 class="fw-bold text-center text-primary">Cột 3 (Giờ làm việc)</h6>
                                    <div class="mb-2">
                                        <label class="small text-muted">Tiêu đề</label>
                                        <input type="text" class="form-control form-control-sm" v-model="aboutData.feature3Title">
                                    </div>
                                    <div>
                                        <label class="small text-muted">Mô tả</label>
                                        <input type="text" class="form-control form-control-sm" v-model="aboutData.feature3Desc">
                                    </div>
                                </div>
                            </div>
                            <!-- Column 4 -->
                            <div class="col-md-4">
                                <div class="p-3 bg-light rounded h-100 border border-success">
                                    <h6 class="fw-bold text-center text-success">Cột 4 (Đổi trả)</h6>
                                    <div class="mb-2">
                                        <label class="small text-muted">Tiêu đề</label>
                                        <input type="text" class="form-control form-control-sm" v-model="aboutData.feature4Title">
                                    </div>
                                    <div>
                                        <label class="small text-muted">Mô tả</label>
                                        <input type="text" class="form-control form-control-sm" v-model="aboutData.feature4Desc">
                                    </div>
                                </div>
                            </div>
                            <!-- Column 5 -->
                            <div class="col-md-4">
                                <div class="p-3 bg-light rounded h-100 border border-danger">
                                    <h6 class="fw-bold text-center text-danger">Cột 5 (Ưu đãi)</h6>
                                    <div class="mb-2">
                                        <label class="small text-muted">Tiêu đề</label>
                                        <input type="text" class="form-control form-control-sm" v-model="aboutData.feature5Title">
                                    </div>
                                    <div>
                                        <label class="small text-muted">Mô tả</label>
                                        <input type="text" class="form-control form-control-sm" v-model="aboutData.feature5Desc">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Gallery Section -->
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-header bg-white py-3">
                        <h5 class="fw-bold m-0 text-danger"><i class="bi bi-images me-2"></i>Thư viện ảnh (Gallery)</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div v-for="(image, index) in ['galleryImage1', 'galleryImage2', 'galleryImage3', 'galleryImage4']" :key="index" class="col-md-6">
                                <label class="form-label fw-bold">Ảnh {{ index + 1 }}</label>
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control" v-model="aboutData[image]" readonly>
                                    <input type="file" :ref="el => galleryFileInputs[index] = el" @change="(e) => handleGalleryUpload(index, e)" accept="image/*" style="display: none;">
                                    <button class="btn btn-outline-secondary" @click="triggerGalleryUpload(index)">
                                        <i class="bi bi-upload"></i> Chọn ảnh
                                    </button>
                                </div>
                                <div v-if="aboutData[image]" class="mb-3">
                                    <img :src="fixImageUrl(aboutData[image])" class="img-thumbnail" style="max-height: 80px;" :alt="'Gallery ' + (index + 1)">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Partners Section -->
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-header bg-white py-3">
                        <h5 class="fw-bold m-0 text-secondary"><i class="bi bi-building me-2"></i>Đối tác & Nhà cung cấp</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div v-for="(partner, index) in ['partner1', 'partner2', 'partner3', 'partner4']" :key="index" class="col-md-6">
                                <div class="border p-3 rounded">
                                    <h6 class="fw-bold">Đối tác {{ index + 1 }}</h6>
                                    <div class="mb-2">
                                        <label class="small text-muted">Tên</label>
                                        <input type="text" class="form-control form-control-sm" v-model="aboutData[partner + 'Name']">
                                    </div>
                                    <div>
                                        <label class="small text-muted">Logo</label>
                                        <div class="input-group input-group-sm">
                                            <input type="text" class="form-control" v-model="aboutData[partner + 'Logo']" readonly>
                                            <input type="file" :ref="el => partnerFileInputs[index] = el" @change="(e) => handlePartnerUpload(index, e)" accept="image/*" style="display: none;">
                                            <button class="btn btn-outline-secondary" @click="triggerPartnerUpload(index)">
                                                <i class="bi bi-upload"></i>
                                            </button>
                                        </div>
                                        <div v-if="aboutData[partner + 'Logo']" class="mt-2">
                                            <img :src="fixImageUrl(aboutData[partner + 'Logo'])" class="img-thumbnail" style="max-height: 50px;" :alt="partner">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column - Preview -->
            <div class="col-lg-4">
                <div class="card shadow-sm border-0 sticky-top" style="top: 20px; z-index: 1;">
                    <div class="card-header bg-light py-3">
                        <h6 class="fw-bold m-0 text-dark"><i class="bi bi-eye me-2"></i>Xem trước ảnh</h6>
                    </div>
                    <div class="card-body text-center" style="max-height: 80vh; overflow-y: auto;">
                        <!-- Banner Preview -->
                        <p class="small text-muted fw-bold text-start mb-1">Banner:</p>
                        <div class="border rounded overflow-hidden mb-3 bg-dark">
                            <img :src="fixImageUrl(aboutData.bannerImage)" class="img-fluid" style="max-height: 100px; opacity: 0.8;" alt="Banner">
                        </div>

                        <!-- Intro Image Preview -->
                        <p class="small text-muted fw-bold text-start mb-1">Ảnh Giới thiệu:</p>
                        <div class="border rounded overflow-hidden p-2 mb-3">
                            <img :src="fixImageUrl(aboutData.introImage)" class="img-fluid rounded" style="max-height: 150px;" alt="Intro">
                        </div>

                        <!-- Gallery Preview -->
                        <p class="small text-muted fw-bold text-start mb-1">Gallery:</p>
                        <div class="row g-1 mb-3">
                            <div class="col-6"><img :src="fixImageUrl(aboutData.galleryImage1)" class="img-fluid rounded border" alt="G1"></div>
                            <div class="col-6"><img :src="fixImageUrl(aboutData.galleryImage2)" class="img-fluid rounded border" alt="G2"></div>
                            <div class="col-6"><img :src="fixImageUrl(aboutData.galleryImage3)" class="img-fluid rounded border" alt="G3"></div>
                            <div class="col-6"><img :src="fixImageUrl(aboutData.galleryImage4)" class="img-fluid rounded border" alt="G4"></div>
                        </div>

                        <!-- Partners Preview -->
                        <p class="small text-muted fw-bold text-start mb-1">Đối tác:</p>
                        <div class="row g-1">
                            <div class="col-3" :title="aboutData.partner1Name"><img :src="fixImageUrl(aboutData.partner1Logo)" class="img-fluid border rounded" alt="P1"></div>
                            <div class="col-3" :title="aboutData.partner2Name"><img :src="fixImageUrl(aboutData.partner2Logo)" class="img-fluid border rounded" alt="P2"></div>
                            <div class="col-3" :title="aboutData.partner3Name"><img :src="fixImageUrl(aboutData.partner3Logo)" class="img-fluid border rounded" alt="P3"></div>
                            <div class="col-3" :title="aboutData.partner4Name"><img :src="fixImageUrl(aboutData.partner4Logo)" class="img-fluid border rounded" alt="P4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>