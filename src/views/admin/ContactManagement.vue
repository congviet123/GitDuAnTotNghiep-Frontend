<script setup>
import { reactive } from 'vue';
import Swal from 'sweetalert2';

// Dữ liệu mô phỏng (Khớp với trang ContactView hiện tại)
const contactData = reactive({
    address: "QTSC 9 Building, Đ. Tô Ký, Tân Chánh Hiệp, Quận 12, TP.HCM",
    phone: "0900 000 001 | 0987654321",
    email: "CongViet47@gmail.com",
    // Link iframe mặc định
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.420663996833!2d106.62615171098252!3d10.855574789254332!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752b6c59ba4c97%3A0x535e784068f1558b!2zVHLGsOG7nW5nIENhbyDEkOG6s25nIFRlY2hub2xvZ3kgU2lnb24gU1R1!5e0!3m2!1svi!2s!4v1706692345678!5m2!1svi!2s"
});

// Hàm lưu (Giả lập)
const saveContactInfo = () => {
    console.log("Dữ liệu gửi đi:", contactData);
    // await apiClient.put('/admin/contact', contactData);
    
    Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Đã cập nhật thông tin liên hệ!',
        confirmButtonColor: '#0d6efd'
    });
};

// Hàm reset
const resetForm = () => {
    Swal.fire({
        title: 'Hoàn tác?',
        text: "Dữ liệu sẽ trở về mặc định!",
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
            <h2 class="text-primary fw-bold">Quản lý trang Liên Hệ</h2>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary" @click="resetForm">
                    <i class="bi bi-arrow-counterclockwise me-1"></i> Đặt lại
                </button>
                <button class="btn btn-primary px-4 fw-bold" @click="saveContactInfo">
                    <i class="bi bi-save me-1"></i> Lưu thay đổi
                </button>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-lg-6">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-white py-3">
                        <h5 class="fw-bold m-0 text-primary"><i class="bi bi-pencil-square me-2"></i>Chỉnh sửa thông tin</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Địa chỉ cửa hàng</label>
                            <div class="input-group">
                                <span class="input-group-text bg-light"><i class="bi bi-geo-alt-fill text-danger"></i></span>
                                <input type="text" class="form-control" v-model="contactData.address">
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Số điện thoại / Hotline</label>
                            <div class="input-group">
                                <span class="input-group-text bg-light"><i class="bi bi-telephone-fill text-success"></i></span>
                                <input type="text" class="form-control" v-model="contactData.phone">
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Email hỗ trợ</label>
                            <div class="input-group">
                                <span class="input-group-text bg-light"><i class="bi bi-envelope-fill text-warning"></i></span>
                                <input type="text" class="form-control" v-model="contactData.email">
                            </div>
                        </div>

                        <hr>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Link nhúng bản đồ (Google Map Embed URL)</label>
                            <textarea class="form-control mb-2" rows="3" v-model="contactData.mapUrl" 
                                      placeholder="Dán link src trong thẻ iframe của Google Map vào đây..."></textarea>
                            <div class="alert alert-info small py-2 mb-0">
                                <i class="bi bi-info-circle me-1"></i> 
                                <strong>Hướng dẫn:</strong> Vào Google Maps -> Chọn địa điểm -> Chia sẻ -> Nhúng bản đồ -> Copy nội dung trong <code>src="..."</code>.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-6">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-white py-3">
                        <h5 class="fw-bold m-0 text-success"><i class="bi bi-eye me-2"></i>Xem trước giao diện</h5>
                    </div>
                    <div class="card-body bg-light">
                        <div class="bg-white p-4 rounded border shadow-sm">
                            <h5 class="fw-bold text-uppercase mb-3">Thông tin liên lạc</h5>
                            
                            <div class="d-flex align-items-start mb-3">
                                <i class="bi bi-geo-alt-fill text-primary me-3 mt-1"></i>
                                <div>
                                    <span class="fw-bold d-block text-dark">Địa chỉ</span>
                                    <span class="text-muted small">{{ contactData.address }}</span>
                                </div>
                            </div>

                            <div class="d-flex align-items-start mb-3">
                                <i class="bi bi-telephone-fill text-primary me-3 mt-1"></i>
                                <div>
                                    <span class="fw-bold d-block text-dark">Số điện thoại</span>
                                    <span class="text-muted small">{{ contactData.phone }}</span>
                                </div>
                            </div>

                            <div class="d-flex align-items-start mb-3">
                                <i class="bi bi-envelope-fill text-primary me-3 mt-1"></i>
                                <div>
                                    <span class="fw-bold d-block text-dark">Hỗ trợ</span>
                                    <span class="text-muted small">{{ contactData.email }}</span>
                                </div>
                            </div>

                            <div class="mt-4">
                                <h6 class="fw-bold mb-2">Bản đồ hiển thị:</h6>
                                <div class="rounded overflow-hidden border" style="height: 300px;">
                                    <iframe 
                                        :src="contactData.mapUrl" 
                                        width="100%" 
                                        height="100%" 
                                        style="border:0;" 
                                        allowfullscreen="" 
                                        loading="lazy" 
                                        referrerpolicy="no-referrer-when-downgrade">
                                    </iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>