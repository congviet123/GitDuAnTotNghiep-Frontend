<script setup>
  // Lấy năm hiện tại bằng Javascript
const currentYear = new Date().getFullYear();

const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>

<template>
    <footer class="bg-light pt-5 pb-3 border-top mt-auto">
        <div class="container">
            <div class="row">
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="mb-3">
                        <router-link to="/">
                            <img 
                                src="/imgs/logoTraiCayBay.jpg" 
                                alt="Logo Trái Cây Bay" 
                                class="footer-logo"
                            >
                        </router-link>
                    </div>
                    
                    <p class="text-muted small mb-4 pe-3">
                        Hệ thống cung cấp trái cây nhập khẩu tươi ngon, vận chuyển đường hàng không, đảm bảo chất lượng tuyệt đối cho sức khỏe gia đình bạn.
                    </p>
                    <ul class="list-unstyled text-muted small">
                        <li class="mb-2"><i class="bi bi-geo-alt-fill me-2 text-primary-blue"></i> QTSC 9 Building, Đ. Tô Ký, Tân Chánh Hiệp, Quận 12, TP.HCM</li>
                        <li class="mb-2"><i class="bi bi-telephone-fill me-2 text-primary-blue"></i> 0900 000 001</li>
                        <li class="mb-2"><i class="bi bi-envelope-fill me-2 text-primary-blue"></i> CongViet47@gmail.com</li>
                    </ul>
                </div>

                <div class="col-lg-2 col-md-6 mb-4">
                    <h6 class="fw-bold mb-3 text-dark">Về chúng tôi</h6>
                    <ul class="list-unstyled">
                        <li class="mb-2"><router-link to="/" class="text-decoration-none text-secondary hover-link">Trang chủ</router-link></li>
                        <li class="mb-2"><router-link to="/products" class="text-decoration-none text-secondary hover-link">Sản phẩm</router-link></li>
                        <li class="mb-2"><router-link to="/news" class="text-decoration-none text-secondary hover-link">Tin tức</router-link></li>
                        <li class="mb-2"><router-link to="/about" class="text-decoration-none text-secondary hover-link">Giới thiệu</router-link></li>
                    </ul>
                </div>

                <div class="col-lg-2 col-md-6 mb-4">
                    <h6 class="fw-bold mb-3 text-dark">Chính sách</h6>
                    <ul class="list-unstyled">
                        <li class="mb-2"><a href="#" class="text-decoration-none text-secondary hover-link">Chính sách vận chuyển</a></li>
                        <li class="mb-2"><a href="#" class="text-decoration-none text-secondary hover-link">Chính sách đổi trả</a></li>
                        <li class="mb-2"><a href="#" class="text-decoration-none text-secondary hover-link">Chính sách ưu đãi</a></li>
                        <li class="mb-2"><a href="#" class="text-decoration-none text-secondary hover-link">Liên hệ hỗ trợ</a></li>
                    </ul>
                </div>

                <div class="col-lg-4 col-md-6 mb-4">
                    <h6 class="fw-bold mb-3 text-dark">Đăng ký nhận tin</h6>
                    <p class="text-muted small">Nhập email để nhận mã giảm giá và thông tin trái cây mới về.</p>
                    <div class="input-group mb-4">
                        <input type="email" class="form-control border-primary-blue" placeholder="Email của bạn...">
                        <button class="btn btn-primary-blue text-white" type="button">
                            <i class="bi bi-send-fill"></i> Gửi
                        </button>
                    </div>

                    <h6 class="fw-bold mb-3 text-dark">Kết nối với chúng tôi</h6>
                    <div class="d-flex gap-2">
                        <a href="#" class="social-icon bg-primary"><i class="bi bi-facebook"></i></a>
                        <a href="#" class="social-icon bg-info text-white"><i class="bi bi-twitter"></i></a>
                        <a href="#" class="social-icon bg-danger"><i class="bi bi-instagram"></i></a>
                        <a href="#" class="social-icon bg-danger"><i class="bi bi-youtube"></i></a>
                    </div>
                </div>
            </div>

            <div class="border-top pt-3 mt-3 d-flex justify-content-between align-items-center flex-wrap">
                <p class="text-muted small m-0">
                    &copy; {{ currentYear }} Bản quyền thuộc về <strong class="text-primary-blue">Trái Cây Bay</strong>.
                </p>
                
                <button @click="scrollToTop" class="btn btn-outline-primary btn-sm rounded-pill mt-2 mt-md-0">
                    Lên đầu trang <i class="bi bi-arrow-up"></i>
                </button>
            </div>
        </div>
        
        <button @click="scrollToTop" class="btn btn-primary-blue text-white shadow rounded-circle position-fixed bottom-0 end-0 m-4 d-none d-md-block" style="z-index: 99; width: 45px; height: 45px;">
            <i class="bi bi-chevron-up"></i>
        </button>
    </footer>
</template>

<style scoped>
/* --- LOGO FOOTER --- */
.footer-logo {
    height: 100px; /* Kích thước logo */
    width: auto;
    object-fit: contain;
    border-radius: 10px; /* Bo góc nhẹ */
    transition: transform 0.3s ease;
}
.footer-logo:hover {
    transform: scale(1.05); /* Hiệu ứng phóng to khi di chuột */
}

/* Màu xanh chủ đạo */
.text-primary-blue { color: #007bff !important; }
.bg-primary-blue { background-color: #007bff !important; }
.btn-primary-blue { background-color: #007bff; border-color: #007bff; }
.btn-primary-blue:hover { background-color: #0056b3; border-color: #0056b3; }
.border-primary-blue { border-color: #007bff !important; }

/* Link hover */
.hover-link { transition: color 0.2s; font-size: 0.9rem; }
.hover-link:hover { color: #007bff !important; padding-left: 5px; }

/* Social Icons */
.social-icon {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    color: white; border-radius: 5px;
    text-decoration: none; transition: transform 0.2s;
}
.social-icon:hover { transform: translateY(-3px); }
</style>