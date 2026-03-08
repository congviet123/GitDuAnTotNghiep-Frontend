<script setup>
    // danh sách sản phẩm với phân trang, bộ lọc, tìm kiếm
import { ref, onMounted, reactive, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import apiClient from '@/services/api';
import { useAuthStore } from '@/store/auth';
import Swal from 'sweetalert2';

// --- STATE ---
const products = ref([]);
const categories = ref([]);
const isLoading = ref(false);
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

// Phân trang
const currentPage = ref(0);
const totalPages = ref(0);
const pageSize = ref(20);

// Bộ lọc (Input trên giao diện)
const filters = reactive({
    keyword: '',
    categoryId: '',
    minPrice: null,
    maxPrice: null
});

// --- HELPER ---
// Hàm xử lý ảnh chuẩn xác
const getImageUrl = (imageName) => {
    if (!imageName) return 'https://placehold.co/300x300?text=No+Image';
    
    // 1. Link online hoặc blob
    if (imageName.startsWith('http') || imageName.startsWith('blob:')) return imageName;

    // 2. Chuẩn hóa tên file
    let cleanName = imageName;

    // Bỏ dấu gạch chéo đầu
    if (cleanName.startsWith('/')) {
        cleanName = cleanName.substring(1);
    }

    // Bỏ prefix "imgs/" nếu có (Vì Backend đã map /imgs/** vào thư mục gốc rồi)
    if (cleanName.startsWith('imgs/')) {
        cleanName = cleanName.substring(5);
    }
    
    // Kết quả: http://localhost:8080/imgs/ten_file.jpg
    return `http://localhost:8080/imgs/${cleanName}`;
};

const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
};

// --- METHODS ---
const fetchCategories = async () => {
    try {
        const res = await apiClient.get('/client/categories');
        categories.value = res.data;
    } catch (err) {
        console.error("Lỗi tải danh mục", err);
    }
};

// [LOGIC CHÍNH] Tải sản phẩm từ URL
const fetchProducts = async (page = 0) => {
    isLoading.value = true;
    try {
        // Lấy tham số từ URL (đây là nguồn sự thật duy nhất để gọi API)
        const params = {
            keyword: route.query.keyword || null,
            categoryId: route.query.categoryId || null,
            minPrice: route.query.minPrice || null,
            maxPrice: route.query.maxPrice || null,
            page: page,
            size: pageSize.value
        };

        //KHÔNG đồng bộ ngược lại vào input `filters`
        // Để input luôn trống sau khi tìm kiếm theo ý bạn.

        const res = await apiClient.get('/client/products', { params });

        if (res.data && res.data.content) {
            products.value = res.data.content;
            totalPages.value = res.data.totalPages;
            currentPage.value = res.data.number;
        } else if (Array.isArray(res.data)) {
            products.value = res.data;
            totalPages.value = 1;
        } else {
            products.value = [];
        }
    } catch (err) {
        console.error("Lỗi tải sản phẩm", err);
        products.value = [];
    } finally {
        isLoading.value = false;
    }
};

// Thực hiện tìm kiếm và xóa input
const applyFilters = () => {
    // 1. Đẩy bộ lọc lên URL để gọi API
    const query = {};
    if (filters.keyword) query.keyword = filters.keyword;
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.minPrice) query.minPrice = filters.minPrice;
    if (filters.maxPrice) query.maxPrice = filters.maxPrice;

    router.push({ query: query });

    // 2. Xóa trắng input ngay lập tức
    filters.keyword = '';
    filters.categoryId = '';
    filters.minPrice = null;
    filters.maxPrice = null;
    
    // (Lưu ý: fetchProducts sẽ được gọi tự động nhờ watch URL bên dưới)
};

const resetFilters = () => {
    // Xóa URL query về rỗng -> Tải tất cả sản phẩm
    router.push({ query: {} }); 
    
    // Đảm bảo input cũng rỗng
    filters.keyword = '';
    filters.categoryId = '';
    filters.minPrice = null;
    filters.maxPrice = null;
};

const changePage = (pageNumber) => {
    if (pageNumber >= 0 && pageNumber < totalPages.value) {
        fetchProducts(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Theo dõi URL thay đổi -> Gọi API
watch(
    () => route.query,
    (newQuery, oldQuery) => {
        if (JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
            fetchProducts(0);
        }
    }
);

const addToCart = async (productId) => {
    if (!authStore.isAuthenticated) {
        Swal.fire({
            title: 'Yêu cầu đăng nhập', text: 'Bạn cần đăng nhập để mua hàng!', icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Đăng nhập ngay', cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) router.push('/login');
        });
        return;
    }
    try {
        await apiClient.post('/cart/add', { productId, quantity: 1 });
        window.Toast ? window.Toast.fire({ icon: 'success', title: 'Đã thêm vào giỏ!' }) 
                     : Swal.fire('Thành công', 'Đã thêm vào giỏ hàng', 'success');
    } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Không thể thêm vào giỏ hàng', 'error');
    }
};

// Khởi tạo
onMounted(async () => {
    await fetchCategories();
    await fetchProducts(0);
});
</script>

<template>
    <div class="container my-4">
        <h1 class="mb-4 text-center fw-bold border-bottom pb-2">
            <span v-if="route.query.categoryId && categories.length > 0">
                Danh mục: <span class="text-primary">{{ categories.find(c => c.id == route.query.categoryId)?.name }}</span>
            </span>
            <span v-else-if="route.query.keyword">
                Kết quả tìm kiếm: "<span class="text-primary">{{ route.query.keyword }}</span>"
            </span>
            <span v-else>Danh sách Sản phẩm</span>
        </h1>

        <div class="row mb-5 p-4 bg-light rounded shadow-sm">
            <div class="col-lg-4">
                <input type="text" class="form-control" v-model="filters.keyword" 
                       placeholder="Tìm tên sản phẩm..." @keyup.enter="applyFilters">
            </div>
            
            <div class="col-lg-3">
                <select class="form-select" v-model="filters.categoryId" @change="applyFilters">
                    <option value="">-- Chọn danh mục --</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                        {{ cat.name }}
                    </option>
                </select>
            </div>
            
            <div class="col-lg-5">
                <div class="input-group">
                    <span class="input-group-text">Giá từ</span>
                    <input type="number" class="form-control" v-model.number="filters.minPrice">
                    <span class="input-group-text">đến</span>
                    <input type="number" class="form-control" v-model.number="filters.maxPrice">
                </div>
            </div>
            
            <div class="col-12 mt-3 text-end">
                <button class="btn btn-primary me-2" @click="applyFilters">
                    <i class="bi bi-search"></i> Lọc & Tìm
                </button>
                <button class="btn btn-secondary" @click="resetFilters">Xem tất cả</button>
            </div>
        </div>

        <div v-if="isLoading" class="text-center py-5 my-5">
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 fs-5 text-muted">Đang tải dữ liệu...</p>
        </div>

        <div v-else>
            <div v-if="products && products.length > 0">
                <div class="row row-cols-2 row-cols-md-4 g-4">
                    <div class="col" v-for="p in products" :key="p.id">
                        <div class="card h-100 product-card position-relative">
                            
                            <div v-if="p.discount > 0" class="discount-badge">
                                -{{ p.discount }}%
                            </div>

                            <img :src="getImageUrl(p.image)" 
                                 class="card-img-top product-img" 
                                 :alt="p.name" 
                                 loading="lazy" 
                                 @error="e => e.target.src = 'https://placehold.co/300x300?text=No+Image'">
                            
                            <div class="card-body text-center d-flex flex-column">
                                <h5 class="card-title text-truncate" :title="p.name">{{ p.name }}</h5>
                                
                                <p class="sale-price mb-1">{{ formatPrice(p.price) }}</p>
                                
                                <p v-if="p.discount > 0" class="original-price mb-2">
                                    {{ formatPrice(p.originalPrice) }}
                                </p>
                                <p v-else class="mb-2" style="height: 24px;"></p> 
                                
                                <div class="mt-auto d-flex justify-content-center gap-2">
                                    <button class="btn btn-primary btn-fruit btn-sm" @click="addToCart(p.id)">
                                        <i class="bi bi-cart-plus"></i> Mua
                                    </button>
                                    <router-link :to="'/products/' + p.id" class="btn btn-outline-secondary btn-sm">
                                        Chi tiết
                                    </router-link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-center mt-5" v-if="totalPages > 1">
                    <nav aria-label="Page navigation">
                        <ul class="pagination">
                            <li class="page-item" :class="{ disabled: currentPage === 0 }">
                                <button class="page-link" @click="changePage(currentPage - 1)">&laquo;</button>
                            </li>
                            <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page - 1 }">
                                <button class="page-link" @click="changePage(page - 1)">{{ page }}</button>
                            </li>
                            <li class="page-item" :class="{ disabled: currentPage === totalPages - 1 }">
                                <button class="page-link" @click="changePage(currentPage + 1)">&raquo;</button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div v-else class="text-center py-5 text-muted">
                <i class="bi bi-search display-1"></i>
                <p class="mt-3">Không tìm thấy sản phẩm phù hợp.</p>
                <button class="btn btn-outline-primary mt-2" @click="resetFilters">Xem tất cả</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.product-card { 
    transition: all .3s; 
    border: 1px solid #eee;
    position: relative; 
}
.product-card:hover { 
    transform: translateY(-5px); 
    box-shadow: 0 10px 20px rgba(0,0,0,0.1); 
    border-color: #ff6b01; 
}
.product-img { 
    height: 200px; 
    object-fit: contain; 
    padding: 10px; 
}

.discount-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: #dc3545; 
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 0.85rem;
    z-index: 10;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.sale-price {
    color: #dc3545; 
    font-weight: bold;
    font-size: 1.2rem;
}

.original-price {
    text-decoration: line-through;
    color: #999;
    font-size: 0.9rem;
}

.btn-fruit { 
    background-color: #ff6b01; 
    border-color: #ff6b01; 
    color: white; 
}
.btn-fruit:hover { 
    background-color: #e65b00; 
}

.pagination .page-item.active .page-link {
    background-color: #ff6b01;
    border-color: #ff6b01;
    color: white;
}
.pagination .page-link {
    color: #ff6b01;
    cursor: pointer;
}
</style>
