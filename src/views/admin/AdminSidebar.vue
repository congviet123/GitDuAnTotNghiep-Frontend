
<script setup>
    // Đây là file con được gọi từ AdminLayout.vue
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
    Swal.fire({
        title: 'Đăng xuất?',
        text: "Bạn có chắc chắn muốn thoát phiên làm việc Admin?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            authStore.logout();
            router.push('/login');
        }
    });
};
</script>

<template>
    <div class="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark sidebar-container">
        <a href="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
            <i class="bi bi-speedometer2 fs-4 me-2"></i>
            <span class="fs-4 fw-bold">Admin Panel</span>
        </a>
        <hr>
        <ul class="nav nav-pills flex-column mb-auto">
            <li class="nav-item">
                <router-link to="/admin/dashboard" class="nav-link text-white" active-class="active">
                    <i class="bi bi-house-door me-2"></i> Dashboard
                </router-link>
            </li>
            <li>
                <router-link to="/admin/products" class="nav-link text-white" active-class="active">
                    <i class="bi bi-box-seam me-2"></i> Quản lý Sản phẩm
                </router-link>
            </li>
            
            <li>
                <router-link to="/admin/categories" class="nav-link text-white" active-class="active">
                    <i class="bi bi-tags-fill me-2"></i> Quản lý Loại hàng
                </router-link>
            </li>

            <li>
                <router-link to="/admin/orders" class="nav-link text-white" active-class="active">
                    <i class="bi bi-cart-check me-2"></i> Quản lý Đơn hàng
                </router-link>
            </li>
            <li>
                <router-link to="/admin/users" class="nav-link text-white" active-class="active">
                    <i class="bi bi-people me-2"></i> Quản lý Người dùng
                </router-link>
            </li>
            <li><router-link to="/admin/news" class="nav-link text-white d-flex align-items-center py-3 px-4 hover-effect" active-class="active-link">
    <i class="bi bi-newspaper me-3 fs-5"></i> <span class="fw-semibold">Quản lý Tin tức</span>
</router-link></li>

            <li><router-link to="/admin/about-cms" class="nav-link text-white d-flex align-items-center py-3 px-4 hover-effect" active-class="active-link">
    <i class="bi bi-info-square me-3 fs-5"></i>
    <span class="fw-semibold">Quản lý Giới thiệu</span>
</router-link></li>

<li><router-link to="/admin/contact-cms" class="nav-link text-white d-flex align-items-center py-3 px-4 hover-effect" active-class="active-link">
    <i class="bi bi-geo-alt me-3 fs-5"></i>
    <span class="fw-semibold">Quản lý Liên hệ</span>
</router-link></li>
<div class="sidebar-heading text-uppercase px-4 mt-4 mb-2 text-white-50 small fw-bold">Kho & Đối tác</div>
<li><router-link to="/admin/suppliers" class="nav-link text-white d-flex align-items-center py-3 px-4 hover-effect" active-class="active-link">
    <i class="bi bi-building me-3 fs-5"></i>
    <span class="fw-semibold">Nhà cung cấp</span>
</router-link>
</li>

<li><router-link to="/admin/imports" class="nav-link text-white d-flex align-items-center py-3 px-4 hover-effect" active-class="active-link">
    <i class="bi bi-box-arrow-in-down me-3 fs-5"></i>
    <span class="fw-semibold">Nhập hàng</span>
</router-link></li>

        </ul>
        <hr>
        <div class="dropdown">
            <a href="#" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="https://github.com/mdo.png" alt="" width="32" height="32" class="rounded-circle me-2">
                <strong>{{ authStore.user?.fullname || 'Admin' }}</strong>
            </a>
            <ul class="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
                <li><router-link class="dropdown-item" to="/">Về trang chủ Web</router-link></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" @click.prevent="handleLogout">Đăng xuất</a></li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.sidebar-container {
    width: 280px;
    height: 100vh; /* Full chiều cao màn hình */
    position: sticky; /* Cố định khi cuộn */
    top: 0;
}

.nav-link.active {
    background-color: #ff6b01 !important; /* Màu cam chủ đạo */
    color: white !important;
}

.nav-link:hover:not(.active) {
    background-color: rgba(255, 255, 255, 0.1);
}
</style>