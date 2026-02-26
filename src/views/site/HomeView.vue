<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
// [MỚI] Import cartStore để xử lý luồng thêm giỏ hàng thông minh
import { useCartStore } from '@/store/cart'; 

const router = useRouter();
const cartStore = useCartStore();

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
    } catch (err) {
        console.error("Lỗi tải trang chủ", err);
    } finally {
        isLoading.value = false;
    }
});

// Hàm xử lý ảnh chuẩn xác (Giữ nguyên)
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

// [SỬA ĐỔI QUAN TRỌNG]: Đổi tham số từ productId thành cả object product
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
</style>