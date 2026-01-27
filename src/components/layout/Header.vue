<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth'; 
import { useCartStore } from '@/store/cart';
import apiClient from '@/services/api'; 

const authStore = useAuthStore();
const cartStore = useCartStore();
const router = useRouter();
const keyword = ref('');

// --- STATE ---
const isUserDropdownOpen = ref(false);
const isCategoryOpen = ref(false); 
const userDropdownRef = ref(null);
const categoryRef = ref(null); 
const categories = ref([]); 

// --- LOGIC ---
const fetchCategories = async () => {
    try {
        const res = await apiClient.get('/client/categories');
        categories.value = res.data;
    } catch (err) {
        console.error("Lỗi tải danh mục header:", err);
    }
};

const toggleUserDropdown = () => isUserDropdownOpen.value = !isUserDropdownOpen.value;
const toggleCategoryDropdown = () => isCategoryOpen.value = !isCategoryOpen.value; 

const closeDropdowns = (event) => {
    if (userDropdownRef.value && !userDropdownRef.value.contains(event.target)) {
        isUserDropdownOpen.value = false;
    }
    if (categoryRef.value && !categoryRef.value.contains(event.target)) {
        isCategoryOpen.value = false;
    }
};

const handleCategoryClick = (category) => {
    router.push({ path: '/products', query: { categoryId: category.id } });
    isCategoryOpen.value = false; 
};

const handleSearch = () => {
    if (keyword.value.trim()) {
        router.push({ path: '/products', query: { keyword: keyword.value } });
        keyword.value = '';
    }
};

const handleLogout = () => {
    authStore.logout();
    router.push('/login');
};

const isAdmin = computed(() => {
    if (!authStore.user) return false;
    const role = authStore.user.role || authStore.user.roleName;
    if (typeof role === 'object' && role !== null && role.name) return role.name === 'ROLE_ADMIN' || role.name === 'ADMIN';
    if (typeof role === 'string') return role === 'ROLE_ADMIN' || role === 'ADMIN';
    if (Array.isArray(role)) return role.includes('ROLE_ADMIN') || role.includes('ADMIN');
    return false;
});

onMounted(() => { 
    document.addEventListener('click', closeDropdowns); 
    fetchCategories(); 
});
onUnmounted(() => { 
    document.removeEventListener('click', closeDropdowns); 
});
</script>

<template>
    <header>
        <div class="header-top">
            <div class="container py-3">
                <div class="row align-items-center">
                    
                    <div class="col-md-3">
                        <router-link to="/" class="text-decoration-none d-flex align-items-center">
                            <img 
                                src="/imgs/logoTraiCayBay.jpg" 
                                alt="Logo Trái Cây Bay" 
                                class="header-logo"
                            >
                        </router-link>
                    </div>

                    <div class="col-md-5">
                        <div class="input-group">
                            <input type="text" class="form-control border-primary-blue rounded-start-pill ps-4" 
                                   placeholder="Tìm kiếm trái cây..." v-model="keyword" @keyup.enter="handleSearch">
                            <button class="btn btn-primary-blue text-white rounded-end-pill px-4 fw-bold" @click="handleSearch">
                                <i class="bi bi-search"></i>
                            </button>
                        </div>
                    </div>

                    <div class="col-md-4 d-flex justify-content-end align-items-center gap-4">
                        <div class="position-relative cursor-pointer hover-scale">
                            <router-link to="/cart" class="text-secondary text-decoration-none d-flex flex-column align-items-center">
                                <div class="position-relative">
                                    <i class="bi bi-cart3 fs-3 text-primary-blue"></i>
                                    <span v-if="cartStore.items.length > 0" 
                                          class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light">
                                        {{ cartStore.items.length }}
                                    </span>
                                </div>
                                <span class="small fw-bold mt-1">Giỏ hàng</span>
                            </router-link>
                        </div>

                        <div class="vr"></div>

                        <div class="cursor-pointer" ref="userDropdownRef">
                            <div v-if="!authStore.isAuthenticated" class="d-flex gap-2">
                                <router-link to="/login" class="btn btn-outline-primary rounded-pill btn-sm fw-bold">Đăng nhập</router-link>
                                <router-link to="/register" class="btn btn-primary-blue text-white rounded-pill btn-sm fw-bold">Đăng ký</router-link>
                            </div>

                            <div v-else class="dropdown">
                                <div @click="toggleUserDropdown" class="d-flex align-items-center text-decoration-none dropdown-toggle-custom" role="button">
                                    <div class="bg-light rounded-circle p-1 border me-2">
                                        <i class="bi bi-person-fill fs-4 text-primary-blue"></i>
                                    </div>
                                    <div class="d-flex flex-column">
                                        <span class="small text-muted">Xin chào,</span>
                                        <span class="fw-bold text-dark small">{{ authStore.user?.fullname || authStore.user?.username }}</span>
                                    </div>
                                    <i class="bi bi-chevron-down ms-2 small text-muted"></i>
                                </div>

                                <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 show-animation" :class="{ show: isUserDropdownOpen }">
                                    <li v-if="isAdmin">
                                        <router-link class="dropdown-item text-danger fw-bold" to="/admin/dashboard" @click="isUserDropdownOpen = false">
                                            <i class="bi bi-speedometer2 me-2"></i>Quản trị Admin
                                        </router-link>
                                    </li>
                                    <li v-if="isAdmin"><hr class="dropdown-divider"></li>
                                    <li><router-link class="dropdown-item" to="/profile" @click="isUserDropdownOpen = false"><i class="bi bi-person-badge me-2"></i>Hồ sơ cá nhân</router-link></li>
                                    <li><router-link class="dropdown-item" to="/order-history" @click="isUserDropdownOpen = false"><i class="bi bi-bag-check me-2"></i>Đơn mua</router-link></li>
                                    <li><router-link class="dropdown-item" to="/auth/change-password" @click="isUserDropdownOpen = false"><i class="bi bi-key me-2"></i>Đổi mật khẩu</router-link></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger" href="#" @click.prevent="handleLogout"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div> 
        <div class="bg-primary-blue text-white shadow-sm">
            <div class="container">
                <div class="row position-relative"> 
                    <div class="col-md-3 position-relative" ref="categoryRef">
                        <div class="bg-dark-blue py-3 d-flex align-items-center cursor-pointer px-3 h-100" 
                             @click="toggleCategoryDropdown">
                            <i class="bi bi-list fs-4 me-2"></i>
                            <span class="fw-bold text-uppercase">Danh mục sản phẩm</span>
                            <i class="bi ms-auto" :class="isCategoryOpen ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                        </div>

                        <div class="category-menu shadow" v-show="isCategoryOpen">
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item list-group-item-action cursor-pointer"
                                    @click="router.push('/products'); isCategoryOpen = false">
                                    <i class="bi bi-grid me-2 text-primary-blue"></i> Tất cả sản phẩm
                                </li>
                                
                                <li v-for="cat in categories" :key="cat.id" 
                                    class="list-group-item list-group-item-action cursor-pointer d-flex justify-content-between align-items-center"
                                    @click="handleCategoryClick(cat)">
                                    <span>
                                        <i class="bi bi-caret-right-fill text-muted small me-2"></i> {{ cat.name }}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="col-md-9 d-flex align-items-center">
                        <nav class="nav">
                            <router-link to="/" class="nav-link text-white text-uppercase px-3 fw-semibold hover-effect">Trang chủ</router-link>
                            <router-link to="/products" class="nav-link text-white text-uppercase px-3 fw-semibold hover-effect">Sản phẩm</router-link>
                            <router-link to="/about" class="nav-link text-white text-uppercase px-3 fw-semibold hover-effect">Giới thiệu</router-link>
                            <router-link to="/news" class="nav-link text-white text-uppercase px-3 fw-semibold hover-effect">Tin tức</router-link>
                            <router-link to="/contact" class="nav-link text-white text-uppercase px-3 fw-semibold hover-effect">Liên hệ</router-link>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    </header>
</template>

<style scoped>
.header-top {
    /* Đổi mã màu #ffffff thành mã màu nền của logo nếu logo không phải trắng tinh */
    background-color: #ffffff; 
}

/* LOGO */
.header-logo {
    height: 90px; 
    width: auto;
    object-fit: contain; 
    border-radius: 12px;
    transition: transform 0.3s ease;
}

.header-logo:hover {
    transform: scale(1.03);
}

/* --- MÀU SẮC --- */
.text-primary-blue { color: #007bff !important; }
.bg-primary-blue { background-color: #007bff !important; }
.bg-dark-blue { background-color: #0056b3 !important; }
.border-primary-blue { border-color: #007bff !important; }
.btn-primary-blue { background-color: #007bff; border-color: #007bff; transition: all 0.3s; }
.btn-primary-blue:hover { background-color: #0056b3; border-color: #0056b3; }

/* --- HIỆU ỨNG --- */
.hover-effect:hover { color: #ffc107 !important; background-color: rgba(255, 255, 255, 0.1); }
.hover-scale:hover { transform: scale(1.05); transition: transform 0.2s; }
.cursor-pointer { cursor: pointer; }
.vr { border-left: 1px solid #ccc; height: 40px; }

/* --- DROPDOWN --- */
.dropdown-menu { display: none; margin-top: 10px; }
.dropdown-menu.show { display: block; animation: fadeIn 0.2s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.dropdown-item:hover { background-color: #f8f9fa; color: #007bff; }
.dropdown-item:active { background-color: #007bff; color: white; }

/* --- MENU DANH MỤC --- */
.category-menu {
    position: absolute;
    top: 100%; 
    left: 12px; 
    width: calc(100% - 24px); 
    background: white;
    z-index: 1000;
    border-radius: 0 0 8px 8px;
    border: 1px solid rgba(0,0,0,0.1);
    animation: fadeIn 0.2s ease-in-out;
}

.list-group-item {
    border-left: none;
    border-right: none;
    font-size: 0.95rem;
    transition: all 0.2s;
    color: #444;
}

.list-group-item:hover {
    background-color: #f0f8ff; 
    color: #007bff;
    padding-left: 1.5rem; 
}

.list-group-item:last-child {
    border-bottom: none;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
}
</style>