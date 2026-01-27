<script setup>
import { reactive, onMounted } from 'vue';
import Swal from 'sweetalert2';

// Dữ liệu mô phỏng đang có trên trang Client
const aboutData = reactive({
    // 1. Banner
    bannerTitle: "Chào Mừng Bạn Đến Trái Cây Bay",
    bannerSubtitle: "Nơi Cung Cấp Trái Cây Tươi Sạch - Fresh & Healthy",
    bannerImage: "/imgs/bannerGioiThieu.jpg",
    
    // 2. Về Chúng Tôi
    introTitle: "Về Chúng Tôi",
    introText1: "Công ty cổ phần thực phẩm dinh dưỡng Trái Cây Bay là đơn vị chuyên cung cấp các loại trái cây hoa quả, rau sạch nhập khẩu và nội địa chất lượng cao. Chúng tôi cam kết chất lượng sản phẩm sạch từ thiên nhiên, không hóa chất bảo quản.",
    introText2: "Trái cây của chúng tôi sẽ mang đến cho khách hàng sự an tâm tuyệt đối. Chúng tôi mong muốn có cơ hội được phục vụ quý khách và góp phần phát triển ngành thực phẩm sạch tại Việt Nam.",
    introImage: "/imgs/logoTraiCaybay.jpg",

    // 3. Email Newsletter
    emailNewsletter: "Nhận thông tin cập nhật qua email về các ưu đãi đặc biệt.",

    // 4. Vì Sao Chọn Chúng Tôi
    whyChooseTitle: "Vì Sao Chọn Sản Phẩm Của Chúng Tôi",
    whyChooseSubtitle: "Cam kết mang đến cho khách hàng những sản phẩm chất lượng nhất, dịch vụ tốt nhất.",
    
    // 4.1 Các Box Icon (5 cột)
    feature1Title: "MIỄN PHÍ VẬN CHUYỂN",
    feature1Desc: "Bán kính 2km",
    
    feature2Title: "HỖ TRỢ 24/7",
    feature2Desc: "Hotline: 0987.654.321",
    
    feature3Title: "GIỜ LÀM VIỆC",
    feature3Desc: "T2 - CN: Giờ hành chính",

    feature4Title: "ĐỔI TRẢ DỄ DÀNG", // [MỚI]
    feature4Desc: "Trong vòng 24h nếu lỗi", // [MỚI]

    feature5Title: "NHIỀU ƯU ĐÃI", // [MỚI]
    feature5Desc: "Quà tặng & Mã giảm giá", // [MỚI]

    // 5. Gallery Ảnh
    galleryImage1: "/imgs/Nho_Tim_Cardinal.jpg",
    galleryImage2: "/imgs/Tao_Rockit_New_Zealand.jpg",
    galleryImage3: "/imgs/Tao_Gala_My.jpg",
    galleryImage4: "/imgs/Nho_Tim_Cardinal.jpg",

    // 6. Đối tác / Nhà cung cấp
    partner1Name: "HIPSTER",
    partner1Logo: "/imgs/no-image.png", 
    partner2Name: "GOLDENGRID",
    partner2Logo: "/imgs/no-image.png",
    partner3Name: "REAL ESTATE",
    partner3Logo: "/imgs/no-image.png", 
    partner4Name: "BALIRESORT",
    partner4Logo: "/imgs/no-image.png",
});

// Hàm lưu dữ liệu (Giả lập gọi API)
const saveAboutInfo = () => {
    console.log("Dữ liệu gửi đi:", aboutData);
    // Sau này sẽ gọi API: await apiClient.put('/admin/about', aboutData);
    
    Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Đã cập nhật thông tin trang Giới thiệu!',
        confirmButtonColor: '#0d6efd'
    });
};

// Hàm reset về mặc định (Demo)
const resetForm = () => {
    Swal.fire({
        title: 'Đặt lại dữ liệu?',
        text: "Các thay đổi chưa lưu sẽ bị mất!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.reload();
        }
    });
};
</script>

<template>
    <div class="container-fluid p-4">
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
            <div class="col-lg-8">
                
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
                                <input type="text" class="form-control" v-model="aboutData.bannerImage">
                                <button class="btn btn-outline-secondary"><i class="bi bi-upload"></i> Chọn ảnh</button>
                            </div>
                        </div>
                    </div>
                </div>

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
                                <input type="text" class="form-control" v-model="aboutData.introImage">
                                <button class="btn btn-outline-secondary"><i class="bi bi-upload"></i> Chọn ảnh</button>
                            </div>
                        </div>
                    </div>
                </div>

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

                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-header bg-white py-3">
                        <h5 class="fw-bold m-0 text-danger"><i class="bi bi-images me-2"></i>Thư viện ảnh (Gallery)</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-6"><label class="form-label fw-bold">Ảnh 1</label><input type="text" class="form-control" v-model="aboutData.galleryImage1"></div>
                            <div class="col-md-6"><label class="form-label fw-bold">Ảnh 2</label><input type="text" class="form-control" v-model="aboutData.galleryImage2"></div>
                            <div class="col-md-6"><label class="form-label fw-bold">Ảnh 3</label><input type="text" class="form-control" v-model="aboutData.galleryImage3"></div>
                            <div class="col-md-6"><label class="form-label fw-bold">Ảnh 4</label><input type="text" class="form-control" v-model="aboutData.galleryImage4"></div>
                        </div>
                    </div>
                </div>

                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-header bg-white py-3">
                        <h5 class="fw-bold m-0 text-secondary"><i class="bi bi-building me-2"></i>Đối tác & Nhà cung cấp</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="border p-3 rounded">
                                    <h6 class="fw-bold">Đối tác 1</h6>
                                    <div class="mb-2"><label class="small text-muted">Tên</label><input type="text" class="form-control form-control-sm" v-model="aboutData.partner1Name"></div>
                                    <div><label class="small text-muted">Logo</label><input type="text" class="form-control form-control-sm" v-model="aboutData.partner1Logo"></div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="border p-3 rounded">
                                    <h6 class="fw-bold">Đối tác 2</h6>
                                    <div class="mb-2"><label class="small text-muted">Tên</label><input type="text" class="form-control form-control-sm" v-model="aboutData.partner2Name"></div>
                                    <div><label class="small text-muted">Logo</label><input type="text" class="form-control form-control-sm" v-model="aboutData.partner2Logo"></div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="border p-3 rounded">
                                    <h6 class="fw-bold">Đối tác 3</h6>
                                    <div class="mb-2"><label class="small text-muted">Tên</label><input type="text" class="form-control form-control-sm" v-model="aboutData.partner3Name"></div>
                                    <div><label class="small text-muted">Logo</label><input type="text" class="form-control form-control-sm" v-model="aboutData.partner3Logo"></div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="border p-3 rounded">
                                    <h6 class="fw-bold">Đối tác 4</h6>
                                    <div class="mb-2"><label class="small text-muted">Tên</label><input type="text" class="form-control form-control-sm" v-model="aboutData.partner4Name"></div>
                                    <div><label class="small text-muted">Logo</label><input type="text" class="form-control form-control-sm" v-model="aboutData.partner4Logo"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div class="col-lg-4">
                <div class="card shadow-sm border-0 sticky-top" style="top: 20px; z-index: 1;">
                    <div class="card-header bg-light py-3">
                        <h6 class="fw-bold m-0 text-dark"><i class="bi bi-eye me-2"></i>Xem trước ảnh</h6>
                    </div>
                    <div class="card-body text-center" style="max-height: 80vh; overflow-y: auto;">
                        <p class="small text-muted fw-bold text-start mb-1">Banner:</p>
                        <div class="border rounded overflow-hidden mb-3 bg-dark">
                            <img :src="aboutData.bannerImage" class="img-fluid" style="max-height: 100px; opacity: 0.8;" alt="Banner">
                        </div>

                        <p class="small text-muted fw-bold text-start mb-1">Ảnh Giới thiệu:</p>
                        <div class="border rounded overflow-hidden p-2 mb-3">
                            <img :src="aboutData.introImage" class="img-fluid rounded" style="max-height: 150px;" alt="Intro">
                        </div>

                        <p class="small text-muted fw-bold text-start mb-1">Gallery:</p>
                        <div class="row g-1 mb-3">
                            <div class="col-6"><img :src="aboutData.galleryImage1" class="img-fluid rounded border" alt="G1"></div>
                            <div class="col-6"><img :src="aboutData.galleryImage2" class="img-fluid rounded border" alt="G2"></div>
                            <div class="col-6"><img :src="aboutData.galleryImage3" class="img-fluid rounded border" alt="G3"></div>
                            <div class="col-6"><img :src="aboutData.galleryImage4" class="img-fluid rounded border" alt="G4"></div>
                        </div>

                        <p class="small text-muted fw-bold text-start mb-1">Đối tác:</p>
                        <div class="row g-1">
                            <div class="col-3" :title="aboutData.partner1Name"><img :src="aboutData.partner1Logo" class="img-fluid border rounded" alt="P1"></div>
                            <div class="col-3" :title="aboutData.partner2Name"><img :src="aboutData.partner2Logo" class="img-fluid border rounded" alt="P2"></div>
                            <div class="col-3" :title="aboutData.partner3Name"><img :src="aboutData.partner3Logo" class="img-fluid border rounded" alt="P3"></div>
                            <div class="col-3" :title="aboutData.partner4Name"><img :src="aboutData.partner4Logo" class="img-fluid border rounded" alt="P4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>