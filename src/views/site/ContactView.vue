<script setup>
import { ref } from 'vue';

// State cho form
const form = ref({
    name: '',
    email: '',
    message: ''
});

const submitForm = () => {
    alert(`Gửi tin nhắn thành công!\nHọ tên: ${form.value.name}\nEmail: ${form.value.email}`);
};
</script>

<template>
    <div class="contact-page">
        <div class="container py-5">
            <nav aria-label="breadcrumb" class="mb-4">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><router-link to="/" class="text-decoration-none text-muted">Trang chủ</router-link></li>
                    <li class="breadcrumb-item active text-primary-blue fw-bold" aria-current="page">Liên hệ</li>
                </ol>
            </nav>

            <div class="row g-5 mb-5">
                <div class="col-lg-6">
                    <div class="mb-5">
                        <h4 class="fw-bold text-uppercase mb-4 text-dark">Thông tin liên lạc</h4>
                        
                        <div class="d-flex align-items-start mb-3">
                            <i class="bi bi-geo-alt-fill text-primary-blue fs-5 me-3"></i>
                            <div>
                                <span class="fw-bold d-block">Địa chỉ</span>
                                <span class="text-muted">QTSC 9 Building, Đ. Tô Ký, Tân Chánh Hiệp, Quận 12, TP.HCM</span>
                            </div>
                        </div>

                        <div class="d-flex align-items-start mb-3">
                            <i class="bi bi-telephone-fill text-primary-blue fs-5 me-3"></i>
                            <div>
                                <span class="fw-bold d-block">Số điện thoại</span>
                                <span class="text-muted">0900 000 001 | 0987654321</span>
                            </div>
                        </div>

                        <div class="d-flex align-items-start mb-3">
                            <i class="bi bi-envelope-fill text-primary-blue fs-5 me-3"></i>
                            <div>
                                <span class="fw-bold d-block">Hỗ trợ</span>
                                <span class="text-muted">CongViet47@gmail.com</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 class="fw-bold text-uppercase mb-4 text-dark">Gửi tin nhắn</h4>
                        <form @submit.prevent="submitForm">
                            <div class="mb-3">
                                <input type="text" class="form-control rounded-pill py-2 px-3 bg-light border-0" 
                                       placeholder="Họ tên" v-model="form.name" required>
                            </div>
                            <div class="mb-3">
                                <input type="email" class="form-control rounded-pill py-2 px-3 bg-light border-0" 
                                       placeholder="Email" v-model="form.email" required>
                            </div>
                            <div class="mb-3">
                                <textarea class="form-control rounded-3 py-2 px-3 bg-light border-0" rows="4" 
                                          placeholder="Nội dung tin nhắn..." v-model="form.message"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary-blue text-white rounded-pill px-5 fw-bold">
                                GỬI NGAY
                            </button>
                        </form>
                    </div>
                </div>

                <div class="col-lg-6">
                    <div class="map-container shadow-sm rounded overflow-hidden h-100">
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.420663996833!2d106.62615171098252!3d10.855574789254332!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752b6c59ba4c97%3A0x535e784068f1558b!2zVHLGsOG7nW5nIENhbyDEkOG6s25nIFRlY2hub2xvZ3kgU2lnb24gU1R1!5e0!3m2!1svi!2s!4v1706692345678!5m2!1svi!2s" 
                            width="100%" height="100%" style="border:0; min-height: 450px;" allowfullscreen="" loading="lazy">
                        </iframe>
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

.breadcrumb-item + .breadcrumb-item::before { content: ">"; }

.form-control:focus {
    box-shadow: none;
    border: 1px solid #007bff !important;
    background-color: #fff !important;
}

/* Feature Icon */
.feature-icon {
    width: 70px; height: 70px;
    transition: transform 0.3s, background-color 0.3s;
}
.feature-icon:hover {
    transform: translateY(-5px);
    background-color: #007bff !important; /* Đổi nền xanh khi hover */
    color: white !important; /* Đổi icon trắng */
}
</style>