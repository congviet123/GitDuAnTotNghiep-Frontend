<script setup>
// Trang Giới thiệu - About Us
</script>

<template>
    <div class="about-page">
        <div class="position-relative text-center text-white banner-section d-flex align-items-center justify-content-center">
            <div class="content position-relative z-2 px-3">
                <p class="mb-2 text-uppercase letter-spacing-2">Trang Chủ / Giới Thiệu</p>
                <h1 class="fw-bold display-5">Chào Mừng Bạn Đến Trái Cây Bay</h1>
                <div class="separator mx-auto my-3"></div>
                <p class="fs-5">Nơi Cung Cấp Trái Cây Tươi Sạch - Fresh & Healthy</p>
            </div>
            <div class="overlay"></div>
        </div>

        <div class="container py-5 my-5">
            <div class="row align-items-center g-5">
                <div class="col-lg-6">
                    <h2 class="fw-bold text-uppercase mb-4 text-success-custom">Về Chúng Tôi</h2>
                    <p class="text-muted mb-4 text-justify">
                        Công ty cổ phần thực phẩm dinh dưỡng Trái Cây Bay là đơn vị chuyên cung cấp các loại trái cây hoa quả, rau sạch nhập khẩu và nội địa chất lượng cao. Chúng tôi cam kết chất lượng sản phẩm sạch từ thiên nhiên, không hóa chất bảo quản.
                    </p>
                    <p class="text-muted mb-4 text-justify">
                        Trái cây của chúng tôi sẽ mang đến cho khách hàng sự an tâm tuyệt đối. Chúng tôi mong muốn có cơ hội được phục vụ quý khách và góp phần phát triển ngành thực phẩm sạch tại Việt Nam.
                    </p>
                    <router-link to="/products" class="btn btn-success-custom rounded-pill px-5 py-2 fw-bold text-white">
                        MUA NGAY
                    </router-link>
                </div>
                <div class="col-lg-6">
                    <div class="about-image-wrapper text-center">
                        <img src="/imgs/logoTraiCayBay.jpg" 
                             alt="Về chúng tôi" class="img-fluid rounded-custom shadow-sm about-logo">
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-light py-5">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h3 class="fw-bold mb-1">Theo dõi bản tin chính sách điều khoản của chúng tôi</h3>
                        <p class="text-muted mb-0">Nhận thông tin cập nhật qua email về các ưu đãi đặc biệt.</p>
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

        <div class="bg-success-custom text-white py-5">
            <div class="container py-4">
                <div class="text-center mb-5">
                    <h2 class="fw-bold text-uppercase">Vì Sao Chọn Sản Phẩm Của Chúng Tôi</h2>
                    <p class="w-75 mx-auto opacity-75">
                        Cam kết mang đến cho khách hàng những sản phẩm chất lượng nhất, dịch vụ tốt nhất.
                    </p>
                </div>

                <div class="row text-center g-4 justify-content-center row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
                    
                    <div class="col">
                        <div class="feature-box h-100">
                            <div class="icon-wrapper mb-3 mx-auto bg-white text-success-custom rounded-circle d-flex align-items-center justify-content-center">
                                <i class="bi bi-truck fs-1"></i>
                            </div>
                            <h5 class="fw-bold fs-6">MIỄN PHÍ VẬN CHUYỂN</h5>
                            <p class="small opacity-75">Bán kính 2km</p>
                        </div>
                    </div>
                    
                    <div class="col">
                        <div class="feature-box h-100">
                            <div class="icon-wrapper mb-3 mx-auto bg-white text-success-custom rounded-circle d-flex align-items-center justify-content-center">
                                <i class="bi bi-headset fs-1"></i>
                            </div>
                            <h5 class="fw-bold fs-6">HỖ TRỢ 24/7</h5>
                            <p class="small opacity-75">Hotline: 0987.654.321</p>
                        </div>
                    </div>
                    
                    <div class="col">
                        <div class="feature-box h-100">
                            <div class="icon-wrapper mb-3 mx-auto bg-white text-success-custom rounded-circle d-flex align-items-center justify-content-center">
                                <i class="bi bi-clock-history fs-1"></i>
                            </div>
                            <h5 class="fw-bold fs-6">GIỜ LÀM VIỆC</h5>
                            <p class="small opacity-75">T2 - CN: Giờ hành chính</p>
                        </div>
                    </div>

                    <div class="col">
                        <div class="feature-box h-100">
                            <div class="icon-wrapper mb-3 mx-auto bg-white text-success-custom rounded-circle d-flex align-items-center justify-content-center">
                                <i class="bi bi-arrow-repeat fs-1"></i>
                            </div>
                            <h5 class="fw-bold fs-6">ĐỔI TRẢ DỄ DÀNG</h5>
                            <p class="small opacity-75">Trong vòng 24h nếu lỗi</p>
                        </div>
                    </div>

                    <div class="col">
                        <div class="feature-box h-100">
                            <div class="icon-wrapper mb-3 mx-auto bg-white text-success-custom rounded-circle d-flex align-items-center justify-content-center">
                                <i class="bi bi-gift fs-1"></i>
                            </div>
                            <h5 class="fw-bold fs-6">NHIỀU ƯU ĐÃI</h5>
                            <p class="small opacity-75">Quà tặng & Mã giảm giá</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div class="container py-5">
            <div class="row g-4">
                <div class="col-6 col-md-3">
                    <div class="ratio ratio-1x1 overflow-hidden rounded shadow-sm">
                        <img src="http://localhost:8080/imgs/Nho_Tim_Cardinal.jpg" class="img-fluid object-fit-cover hover-zoom" alt="Fruit 1">
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="ratio ratio-1x1 overflow-hidden rounded shadow-sm">
                        <img src="http://localhost:8080/imgs/Tao_Rockit_New_Zealand.jpg" class="img-fluid object-fit-cover hover-zoom" alt="Fruit 2">
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="ratio ratio-1x1 overflow-hidden rounded shadow-sm">
                        <img src="http://localhost:8080/imgs/Tao_Gala_My.jpg" class="img-fluid object-fit-cover hover-zoom" alt="Fruit 3">
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="ratio ratio-1x1 overflow-hidden rounded shadow-sm">
                        <img src="http://localhost:8080/imgs/Nho_Tim_Cardinal.jpg" class="img-fluid object-fit-cover hover-zoom" alt="Fruit 4">
                    </div>
                </div>
            </div>
        </div>

        <div class="container pb-5">
            <hr class="mb-5">
            <div class="row text-center align-items-center grayscale-logos">
                <div class="col-6 col-md-3 mb-4 mb-md-0"><h3 class="fw-bold text-muted">HIPSTER</h3></div>
                <div class="col-6 col-md-3 mb-4 mb-md-0"><h3 class="fw-bold text-muted">GOLDENGRID</h3></div>
                <div class="col-6 col-md-3 mb-4 mb-md-0"><h3 class="fw-bold text-muted">REAL ESTATE</h3></div>
                <div class="col-6 col-md-3"><h3 class="fw-bold text-muted">BALIRESORT</h3></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* --- TÙY CHỈNH MÀU SẮC (GIỐNG ẢNH MẪU VITAGREEN) --- */
.text-success-custom { color: #28a745 !important; }
.bg-success-custom { background-color: #28a745 !important; }
.btn-success-custom { background-color: #28a745; border-color: #28a745; transition: all 0.3s; }
.btn-success-custom:hover { background-color: #218838; transform: translateY(-2px); }

/* Banner Style */
.banner-section {
    background-image: url('/imgs/bannerGioiThieu.jpg');
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
    border-radius: 20px; /* Bo góc nhẹ */
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