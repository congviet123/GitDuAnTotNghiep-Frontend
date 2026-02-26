<script setup>
import { reactive, onMounted } from 'vue';
import Swal from 'sweetalert2';
import { contactService } from '@/services/contactService';

// Dữ liệu form (ĐÃ THÊM mapUrl để lưu link nhúng bản đồ)
const contactData = reactive({
    address: "",
    phone: "",
    email: "",
    mapUrl: "" // THÊM MỚI: link nhúng bản đồ từ Google Maps
});

// Loading state
const loading = reactive({ 
    get: false, 
    save: false 
});

// ===== HÀM TẢI DỮ LIỆU TỪ API =====
const loadContactInfo = async () => {
    loading.get = true;
    try {
        const response = await contactService.getContactInfo();
        const data = response.data;
        
        // Gán dữ liệu từ API vào form
        contactData.address = data.address || "";
        contactData.phone = data.phone || "";
        contactData.email = data.email || "";
        contactData.mapUrl = data.mapUrl || ""; // THÊM MỚI: lấy mapUrl từ database
        
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Không thể tải thông tin liên hệ từ server!'
        });
    } finally {
        loading.get = false;
    }
};

// ===== HÀM LƯU DỮ LIỆU =====
const saveContactInfo = async () => {
    // Kiểm tra dữ liệu nhập (chỉ check 3 trường cơ bản, mapUrl có thể để trống)
    if (!contactData.address || !contactData.phone || !contactData.email) {
        Swal.fire({
            icon: 'warning',
            title: 'Chưa nhập đủ',
            text: 'Vui lòng nhập đầy đủ thông tin cơ bản!'
        });
        return;
    }
    
    loading.save = true;
    try {
        // THAY ĐỔI: gửi cả 4 trường lên API (bao gồm mapUrl)
        const payload = {
            address: contactData.address,
            phone: contactData.phone,
            email: contactData.email,
            mapUrl: contactData.mapUrl // THÊM MỚI: gửi mapUrl lên server
        };
        
        await contactService.updateContactInfo(payload);
        
        Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đã cập nhật thông tin liên hệ!',
            timer: 2000,
            showConfirmButton: false
        });
        
        // Tải lại dữ liệu mới nhất
        await loadContactInfo();
        
    } catch (error) {
        console.error("Lỗi lưu dữ liệu:", error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Không thể lưu thông tin! Vui lòng kiểm tra kết nối.'
        });
    } finally {
        loading.save = false;
    }
};

// ===== HÀM RESET FORM =====
const resetForm = () => {
    Swal.fire({
        title: 'Hoàn tác?',
        text: "Dữ liệu sẽ trở về mặc định từ server!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            loadContactInfo(); // Tải lại từ API
        }
    });
};

// Gọi API khi component được mount
onMounted(() => {
    loadContactInfo();
});
</script>

<template>
    <div class="container-fluid p-4">
        <!-- Hiển thị loading khi đang tải -->
        <div v-if="loading.get" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="mt-2">Đang tải thông tin...</p>
        </div>

        <!-- Hiển thị form khi đã tải xong -->
        <template v-else>
            <!-- Header với nút chức năng -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="text-primary fw-bold">Quản lý trang Liên Hệ</h2>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-secondary" @click="resetForm" :disabled="loading.save">
                        <i class="bi bi-arrow-counterclockwise me-1"></i> Đặt lại
                    </button>
                    <button class="btn btn-primary px-4 fw-bold" @click="saveContactInfo" :disabled="loading.save">
                        <i class="bi bi-save me-1"></i> 
                        {{ loading.save ? 'Đang lưu...' : 'Lưu thay đổi' }}
                    </button>
                </div>
            </div>

            <div class="row g-4">
                <!-- Cột trái: Form chỉnh sửa -->
                <div class="col-lg-6">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white py-3">
                            <h5 class="fw-bold m-0 text-primary">
                                <i class="bi bi-pencil-square me-2"></i>Chỉnh sửa thông tin
                            </h5>
                        </div>
                        <div class="card-body">
                            <!-- Địa chỉ -->
                            <div class="mb-3">
                                <label class="form-label fw-bold">Địa chỉ cửa hàng</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light">
                                        <i class="bi bi-geo-alt-fill text-danger"></i>
                                    </span>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        v-model="contactData.address"
                                        placeholder="Nhập địa chỉ..."
                                    >
                                </div>
                            </div>

                            <!-- Số điện thoại -->
                            <div class="mb-3">
                                <label class="form-label fw-bold">Số điện thoại / Hotline</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light">
                                        <i class="bi bi-telephone-fill text-success"></i>
                                    </span>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        v-model="contactData.phone"
                                        placeholder="VD: 0900 000 001 | 0987654321"
                                    >
                                </div>
                            </div>

                            <!-- Email -->
                            <div class="mb-3">
                                <label class="form-label fw-bold">Email hỗ trợ</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light">
                                        <i class="bi bi-envelope-fill text-warning"></i>
                                    </span>
                                    <input 
                                        type="email" 
                                        class="form-control" 
                                        v-model="contactData.email"
                                        placeholder="example@gmail.com"
                                    >
                                </div>
                            </div>

                            <!-- THAY ĐỔI: Link nhúng bản đồ (Có thể chỉnh sửa) -->
                            <div class="mb-3">
                                <label class="form-label fw-bold text-info">
                                    <i class="bi bi-map me-1"></i>Link nhúng bản đồ (Google Maps)
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light">
                                        <i class="bi bi-link-45deg text-info"></i>
                                    </span>
                                    <input 
                                        type="url" 
                                        class="form-control" 
                                        v-model="contactData.mapUrl"
                                        placeholder="https://www.google.com/maps/embed?pb=..."
                                    >
                                </div>
                                <!-- THÊM MỚI: Hướng dẫn lấy link nhúng -->
                                <div class="form-text mt-2">
                                    <i class="bi bi-info-circle me-1 text-info"></i>
                                    <strong>Cách lấy link nhúng:</strong> 
                                    Vào Google Maps → Chọn địa điểm → Chia sẻ → Nhúng bản đồ → Sao chép link trong src="..."
                                </div>
                                <!-- THÊM MỚI: Ví dụ cụ thể -->
                                <div class="alert alert-light small mt-2 p-2 border">
                                    <i class="bi bi-quote me-1"></i>
                                    Ví dụ: https://www.google.com/maps/embed?pb=!1m18!1m12...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Cột phải: Xem trước giao diện -->
                <div class="col-lg-6">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white py-3">
                            <h5 class="fw-bold m-0 text-success">
                                <i class="bi bi-eye me-2"></i>Xem trước giao diện
                            </h5>
                        </div>
                        <div class="card-body bg-light">
                            <div class="bg-white p-4 rounded border shadow-sm">
                                <h5 class="fw-bold text-uppercase mb-3">Thông tin liên lạc</h5>
                                
                                <!-- Địa chỉ preview -->
                                <div class="d-flex align-items-start mb-3">
                                    <i class="bi bi-geo-alt-fill text-primary me-3 mt-1"></i>
                                    <div>
                                        <span class="fw-bold d-block text-dark">Địa chỉ</span>
                                        <span class="text-muted small">{{ contactData.address || 'Chưa có địa chỉ' }}</span>
                                    </div>
                                </div>

                                <!-- SĐT preview -->
                                <div class="d-flex align-items-start mb-3">
                                    <i class="bi bi-telephone-fill text-primary me-3 mt-1"></i>
                                    <div>
                                        <span class="fw-bold d-block text-dark">Số điện thoại</span>
                                        <span class="text-muted small">{{ contactData.phone || 'Chưa có số điện thoại' }}</span>
                                    </div>
                                </div>

                                <!-- Email preview -->
                                <div class="d-flex align-items-start mb-3">
                                    <i class="bi bi-envelope-fill text-primary me-3 mt-1"></i>
                                    <div>
                                        <span class="fw-bold d-block text-dark">Hỗ trợ</span>
                                        <span class="text-muted small">{{ contactData.email || 'Chưa có email' }}</span>
                                    </div>
                                </div>

                                <!-- THAY ĐỔI: Map preview (hiển thị từ database) -->
                                <div class="mt-4">
                                    <h6 class="fw-bold mb-2">Bản đồ hiển thị:</h6>
                                    <!-- Kiểm tra nếu có mapUrl thì hiển thị iframe, không thì hiển thị thông báo -->
                                    <div v-if="contactData.mapUrl" class="rounded overflow-hidden border" style="height: 200px;">
                                        <iframe 
                                            :src="contactData.mapUrl" 
                                            width="100%" 
                                            height="100%" 
                                            style="border:0;" 
                                            allowfullscreen="" 
                                            loading="lazy"
                                            title="Bản đồ preview">
                                        </iframe>
                                    </div>
                                    <div v-else class="bg-light p-4 text-center text-muted rounded border" style="height: 200px;">
                                        <i class="bi bi-map fs-1 d-block mb-2"></i>
                                        <span>Chưa có link bản đồ</span>
                                        <p class="small mt-2">Vui lòng nhập link nhúng bản đồ để xem trước</p>
                                    </div>
                                    <!-- THÊM MỚI: Thông báo trạng thái -->
                                    <div class="small text-muted mt-1">
                                        <i class="bi bi-check-circle-fill text-success me-1" v-if="contactData.mapUrl"></i>
                                        <i class="bi bi-exclamation-circle-fill text-warning me-1" v-else></i>
                                        {{ contactData.mapUrl ? 'Link map đã được cập nhật' : 'Đang dùng map mặc định' }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>