<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
// [MỚI] Import cartStore để xử lý luồng thêm giỏ hàng thông minh
import { useCartStore } from '@/store/cart'; 
import { voucherService } from '@/services/voucherService'; // THÊM: Import voucherService

const router = useRouter();
const cartStore = useCartStore();

// ========== THÊM: STATE CHO VOUCHER ==========
const availableVouchers = ref([]);
const showVoucherNotice = ref(false);

// ========== THÊM: STATE CHO ICON CUỘN LÊN ĐẦU TRANG ==========
const showScrollTop = ref(false);

// Kiểm tra có voucher khuyến mãi đang có không
const checkAvailableVouchers = async () => {
    try {
        const response = await voucherService.getPublicVouchers();
        availableVouchers.value = response.data.filter(v => {
            const today = new Date();
            const start = new Date(v.startDate);
            const end = new Date(v.expiryDate);
            today.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return today >= start && today <= end;
        });
        showVoucherNotice.value = availableVouchers.value.length > 0;
    } catch (error) {
        console.error("Lỗi kiểm tra voucher:", error);
    }
};

// Chuyển đến trang giới thiệu và cuộn xuống phần voucher
const goToVouchers = () => {
    router.push({ path: '/about', query: { scrollTo: 'voucher' } });
};

// Xử lý cuộn trang để hiển thị/ẩn icon cuộn lên đầu
const handleScroll = () => {
    showScrollTop.value = window.scrollY > 300;
};

// Cuộn lên đầu trang
const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
// ========== KẾT THÚC THÊM ==========

// Cấu hình Banner Carousel
const banners = ref([
    '/imgs/banner1.jpg',
    '/imgs/banner2.jpg',
    '/imgs/banner3.jpg'
]);

// State chứa danh sách sản phẩm
const discountProducts = ref([]);
const bestSellerProducts = ref([]);
const newProducts = ref([]);
const isLoading = ref(false);

onMounted(async () => {
    // Tải dữ liệu sản phẩm 
    isLoading.value = true;
    try {
        const [resDiscount, resBest, resNew] = await Promise.all([
            apiClient.get('/client/products/discount'),
            apiClient.get('/client/products/bestsellers'),
            apiClient.get('/client/products/new')
        ]);

        discountProducts.value = resDiscount.data;
        bestSellerProducts.value = resBest.data;
        newProducts.value = resNew.data;
        
        // THÊM: Kiểm tra voucher khuyến mãi
        await checkAvailableVouchers();
        
        // THÊM: Lắng nghe sự kiện cuộn trang
        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Gọi ngay để kiểm tra trạng thái ban đầu
        
    } catch (err) {
        console.error("Lỗi tải trang chủ", err);
    } finally {
        isLoading.value = false;
    }
});

// THÊM: Dọn dẹp sự kiện khi component bị hủy
onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleScroll);
});

// Hàm xử lý ảnh chuẩn xác 
const getImageUrl = (imageName) => {
    if (!imageName) return 'https://placehold.co/300x300?text=No+Image';
    if (imageName.startsWith('http') || imageName.startsWith('blob:')) return imageName;
    
    let cleanName = imageName;
    if (cleanName.startsWith('/')) cleanName = cleanName.substring(1);
    
    // Logic chung: Nếu có chữ imgs/ rồi thì thôi, chưa có thì thêm vào
    const baseUrl = 'http://localhost:8080';
    if (cleanName.startsWith('imgs/')) return `${baseUrl}/${cleanName}`;
    return `${baseUrl}/imgs/${cleanName}`;
};

const formatPrice = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

// Đổi tham số từ productId thành cả object product
const addToCart = async (product) => {
    // Gọi hàm từ Store, Store sẽ tự quyết định lưu DB hay lưu LocalStorage
    // Mặc định thêm 1kg
    try {
        await cartStore.addToCart(product, 1);
    } catch (err) {
        console.error(err);
    }
};
</script>

<template>
    <div class="home-view-wrapper">

        <div class="container-fluid p-0 mb-5">
            <div id="homeBannerCarousel" 
                 class="carousel slide" 
                 data-bs-ride="carousel" 
                 data-bs-interval="3000"> 
                 <div class="carousel-inner">
                    <div v-for="(bannerPath, index) in banners"
                         :key="index"
                         class="carousel-item"
                         :class="{ active: index === 0 }">
                        <img :src="bannerPath"
                             class="d-block w-100 banner-img"
                             alt="Banner"
                             @error="e => e.target.src = 'https://placehold.co/1920x600?text=Banner+Fruits'">
                    </div>
                </div>

                <button class="carousel-control-prev" type="button" data-bs-target="#homeBannerCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#homeBannerCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Next</span>
                </button>
            </div>
        </div>

        <!-- THÊM: Icon thông báo voucher () -->
        <div v-if="showVoucherNotice" class="voucher-float-btn" @click="goToVouchers">
            <div class="voucher-icon">
                <i class="bi bi-gift-fill"></i>
                <span class="voucher-badge">{{ availableVouchers.length }}</span>
            </div>
            <div class="voucher-tooltip">
                <i class="bi bi-ticket-perforated me-1"></i>
                Có {{ availableVouchers.length }} mã giảm giá đang chờ bạn!
            </div>
        </div>
        
        <!-- THÊM: Icon cuộn lên đầu trang (đặt ở dưới, cách đáy 30px) -->
        <div class="scroll-top-btn" @click="scrollToTop" :class="{ show: showScrollTop }">
            <i class="bi bi-arrow-up"></i>
        </div>
        <!-- ========== KẾT THÚC THÊM ========== -->

        <div class="container my-4">
            
            <div v-if="isLoading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
            </div>

            <div v-else>
                <section class="mb-5" v-if="discountProducts.length > 0">
                    <h3 class="fw-bold text-danger border-bottom pb-2 mb-4"><i class="bi bi-tag-fill"></i> ĐANG GIẢM GIÁ SỐC</h3>
                    <div class="row row-cols-2 row-cols-md-4 g-4">
                        <div class="col" v-for="p in discountProducts" :key="p.id">
                            <div class="card h-100 product-card border-danger">
                                <div class="badge bg-danger position-absolute top-0 end-0 m-2" v-if="p.discount > 0">
                                    -{{ p.discount }}%
                                </div>
                                <img :src="getImageUrl(p.image)" class="card-img-top product-img" :alt="p.name" loading="lazy" @error="e => e.target.src = '/imgs/no-image.png'">
                                <div class="card-body text-center d-flex flex-column">
                                    <h6 class="card-title text-truncate" :title="p.name">{{ p.name }}</h6>
                                    <p class="text-danger fw-bold fs-5 mb-1">{{ formatPrice(p.price) }}</p>
                                    <small class="text-decoration-line-through text-muted" v-if="p.originalPrice > p.price">
                                        {{ formatPrice(p.originalPrice) }}
                                    </small>
                                    <div class="mt-auto d-flex justify-content-center gap-2 pt-3">
                                        <button class="btn btn-outline-danger btn-sm" @click="addToCart(p)">
                                            <i class="bi bi-cart-plus"></i> Chọn mua
                                        </button>
                                        <router-link :to="'/products/' + p.id" class="btn btn-secondary btn-sm">
                                            <i class="bi bi-eye"></i> Chi tiết
                                        </router-link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="mb-5" v-if="bestSellerProducts.length > 0">
                    <h3 class="fw-bold text-primary-fruit border-bottom pb-2 mb-4"><i class="bi bi-fire"></i> SẢN PHẨM BÁN CHẠY</h3>
                    <div class="row row-cols-2 row-cols-md-4 g-4">
                        <div class="col" v-for="p in bestSellerProducts" :key="p.id">
                            <div class="card h-100 product-card">
                                <img :src="getImageUrl(p.image)" class="card-img-top product-img" :alt="p.name" loading="lazy" @error="e => e.target.src = '/imgs/no-image.png'">
                                <div class="card-body text-center d-flex flex-column">
                                    <h6 class="card-title text-truncate" :title="p.name">{{ p.name }}</h6>
                                    <p class="text-primary-fruit fw-bold fs-5">{{ formatPrice(p.price) }}</p>
                                    <div class="mt-auto d-flex justify-content-center gap-2 pt-3">
                                        <button class="btn btn-primary btn-fruit btn-sm" @click="addToCart(p)">
                                            <i class="bi bi-cart-plus"></i> Chọn mua
                                        </button>
                                        <router-link :to="'/products/' + p.id" class="btn btn-outline-secondary btn-sm">
                                            <i class="bi bi-eye"></i> Chi tiết
                                        </router-link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="mb-5" v-if="newProducts.length > 0">
                    <h3 class="fw-bold text-success border-bottom pb-2 mb-4"><i class="bi bi-stars"></i> SẢN PHẨM MỚI VỀ</h3>
                    <div class="row row-cols-2 row-cols-md-4 g-4">
                        <div class="col" v-for="p in newProducts" :key="p.id">
                            <div class="card h-100 product-card">
                                <div class="badge bg-success position-absolute top-0 start-0 m-2">New</div>
                                <img :src="getImageUrl(p.image)" class="card-img-top product-img" :alt="p.name" loading="lazy" @error="e => e.target.src = '/imgs/no-image.png'">
                                <div class="card-body text-center d-flex flex-column">
                                    <h6 class="card-title text-truncate" :title="p.name">{{ p.name }}</h6>
                                    <p class="text-success fw-bold fs-5">{{ formatPrice(p.price) }}</p>
                                    <div class="mt-auto d-flex justify-content-center gap-2 pt-3">
                                        <button class="btn btn-success btn-sm" @click="addToCart(p)">
                                            <i class="bi bi-cart-plus"></i> Chọn mua
                                        </button>
                                        <router-link :to="'/products/' + p.id" class="btn btn-outline-secondary btn-sm">
                                            <i class="bi bi-eye"></i> Chi tiết
                                        </router-link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* CSS CHO BANNER FULL MÀN HÌNH */
.banner-img {
    height: 420px; 
    width: 100%;
    object-fit: cover; 
}

/* Responsive */
@media (max-width: 768px) {
    .banner-img {
        height: 250px;
    }
}

.text-primary-fruit { color: #ff6b01; }
.btn-fruit { background-color: #ff6b01; border-color: #ff6b01; color: white; }
.btn-fruit:hover { background-color: #e65b00; border-color: #e65b00; }

.product-card { transition: transform 0.3s, box-shadow 0.3s; border: 1px solid #eee; }
.product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.product-img { height: 180px; object-fit: contain; padding: 15px; }

/* THÊM: CSS cho icon voucher nổi - đặt ở trên (cách đáy 100px) */
.voucher-float-btn {
    position: fixed;
    bottom: 100px;
    right: 30px;
    z-index: 999;
    cursor: pointer;
    animation: bounce 1s ease infinite;
}

.voucher-icon {
    position: relative;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #ff6b01, #ff8c3a);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 5px 20px rgba(255, 107, 1, 0.4);
    transition: transform 0.3s;
}

.voucher-icon i {
    font-size: 28px;
    color: white;
}

.voucher-icon:hover {
    transform: scale(1.1);
}

.voucher-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #dc3545;
    color: white;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    border: 2px solid white;
}

.voucher-tooltip {
    position: absolute;
    right: 70px;
    top: 50%;
    transform: translateY(-50%);
    background: #333;
    color: white;
    padding: 8px 15px;
    border-radius: 30px;
    font-size: 13px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
}

.voucher-tooltip::after {
    content: '';
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent transparent #333;
}

.voucher-float-btn:hover .voucher-tooltip {
    opacity: 1;
    visibility: visible;
    right: 80px;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

/* THÊM: CSS cho icon cuộn lên đầu trang - đặt ở dưới (cách đáy 30px) */
.scroll-top-btn {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 999;
    cursor: pointer;
    background: #28a745;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    transition: all 0.3s;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    opacity: 0;
    visibility: hidden;
}

.scroll-top-btn.show {
    opacity: 1;
    visibility: visible;
}

.scroll-top-btn:hover {
    background: #218838;
    transform: translateY(-5px);
}
</style>