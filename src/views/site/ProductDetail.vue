<script setup>
    // chi tiết sản phẩm, đánh giá, thêm vào giỏ hàng
import { ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/services/api';
import { useAuthStore } from '@/store/auth';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter(); 
const authStore = useAuthStore();   
const product = ref({});
const reviews = ref([]);
const newReview = reactive({ rating: 5, comment: '' });

onMounted(async () => {
    const productId = route.params.id;
    if (productId) {
        await fetchProductDetail(productId);
        await fetchReviews(productId);
    }
});

//  Hàm xử lý ảnh chuẩn xác
const getImageUrl = (imageName) => {
    if (!imageName) return 'https://placehold.co/300x300?text=No+Image';
    
    // 1. Nếu là link online hoặc blob preview thì giữ nguyên
    if (imageName.startsWith('http') || imageName.startsWith('blob:')) return imageName;

    // 2. Chuẩn hóa tên file để ghép với cổng Backend 8080
    let cleanName = imageName;

    // Bỏ dấu gạch chéo đầu (nếu có)
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

const fetchProductDetail = async (id) => {
    try {
        const res = await apiClient.get(`/client/products/${id}`);
        product.value = res.data;
    } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Không tìm thấy sản phẩm', 'error');
    }
};

const fetchReviews = async (id) => {
    try {
        const res = await apiClient.get(`/client/products/${id}/reviews`);
        reviews.value = res.data;
    } catch (err) {
        console.error("Lỗi tải đánh giá", err);
    }
};

const submitReview = async () => {
    if (!newReview.comment.trim()) {
        Swal.fire('Thông báo', 'Vui lòng nhập nội dung đánh giá', 'warning');
        return;
    }
    
    try {
        await apiClient.post('/reviews', {
            productId: product.value.id,
            rating: newReview.rating,
            comment: newReview.comment
        });
        
        Swal.fire('Thành công', 'Cảm ơn bạn đã đánh giá!', 'success');
        
        // Reset form và load lại
        newReview.comment = '';
        newReview.rating = 5;
        await fetchReviews(product.value.id);
        
    } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.', 'error');
    }
};

const addToCart = async () => {
    if (!authStore.isAuthenticated) {
        Swal.fire({
            title: 'Yêu cầu đăng nhập',
            text: 'Bạn cần đăng nhập để thêm vào giỏ hàng!',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Đăng nhập',
            cancelButtonText: 'Để sau'
        }).then((result) => {
            if (result.isConfirmed) {
                router.push('/login');
            }
        });
        return;
    }

    try {
        await apiClient.post('/cart/add', { productId: product.value.id, quantity: 1 });
        if (window.Toast) {
            window.Toast.fire({ icon: 'success', title: 'Đã thêm vào giỏ hàng!' });
        } else {
             Swal.fire('Thành công', 'Đã thêm vào giỏ hàng!', 'success');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Có lỗi xảy ra khi thêm vào giỏ', 'error');
    }
};

const formatPrice = (v) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
};
</script>

<template>
    <div class="container my-5" v-if="product.id">
        <div class="row">
            <div class="col-md-6 text-center mb-4 mb-md-0 position-relative">
                <div class="d-inline-block position-relative">
                    <img :src="getImageUrl(product.image)" 
                         class="img-fluid rounded shadow product-detail-img" 
                         :alt="product.name" 
                         loading="lazy"
                         @error="e => e.target.src = '/imgs/no-image.png'">
                    
                    <div v-if="product.discount > 0" class="detail-discount-badge">
                        -{{ product.discount }}%
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <h2 class="fw-bold mb-3">{{ product.name }}</h2>
                
                <div class="mb-3 d-flex align-items-center">
                    <h3 class="text-danger mb-0 fw-bold me-3">{{ formatPrice(product.price) }}</h3>
                    <span v-if="product.originalPrice > product.price" class="text-muted text-decoration-line-through fs-5">
                        {{ formatPrice(product.originalPrice) }}
                    </span>
                </div>
                
                <div class="mb-3">
                    <span class="badge bg-success me-2" v-if="product.available">Còn hàng</span>
                    <span class="badge bg-secondary" v-else>Hết hàng</span>
                    <span class="text-muted ms-2">Danh mục: <strong>{{ product.category?.name }}</strong></span>
                </div>
                
                <p class="text-muted">{{ product.description }}</p>
                
                <button @click="addToCart" class="btn btn-primary btn-fruit btn-lg mt-3 shadow">
                    <i class="bi bi-cart-plus me-2"></i> Thêm vào giỏ hàng
                </button>
            </div>
        </div>

        <div class="mt-5">
            <ul class="nav nav-tabs" id="productTab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active fw-bold" id="desc-tab" data-bs-toggle="tab" data-bs-target="#desc" type="button" role="tab">Mô tả chi tiết</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link fw-bold" id="review-tab" data-bs-toggle="tab" data-bs-target="#rev" type="button" role="tab">Đánh giá ({{ reviews.length }})</button>
                </li>
            </ul>
            
            <div class="tab-content border border-top-0 p-4 bg-white shadow-sm rounded-bottom">
                <div class="tab-pane fade show active" id="desc" role="tabpanel">
                    <p class="lh-lg">{{ product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.' }}</p>
                </div>
                
                <div class="tab-pane fade" id="rev" role="tabpanel">
                    <div v-if="reviews.length > 0">
                        <div v-for="r in reviews" :key="r.id" class="border-bottom mb-3 pb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <strong>{{ r.reviewerFullname || 'Khách hàng ẩn danh' }}</strong>
                                <div class="text-warning">
                                    <i v-for="n in 5" :key="n" 
                                       class="bi" 
                                       :class="n <= r.rating ? 'bi-star-fill' : 'bi-star'"></i>
                                </div>
                            </div>
                            <p class="mb-0 text-secondary">{{ r.comment }}</p>
                            <small class="text-muted fst-italic" v-if="r.createDate">{{ new Date(r.createDate).toLocaleDateString('vi-VN') }}</small>
                        </div>
                    </div>
                    <div v-else class="text-center py-3 text-muted">
                        Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
                    </div>
                    
                    <div v-if="authStore.isAuthenticated" class="mt-4 p-4 bg-light rounded border">
                        <h5 class="mb-3">Viết đánh giá của bạn:</h5>
                        <div class="mb-3">
                            <label class="form-label me-3">Đánh giá sao:</label>
                            <span v-for="n in 5" :key="n" 
                                  @click="newReview.rating = n" 
                                  class="fs-3 cursor-pointer me-1 star-rating" 
                                  :class="n <= newReview.rating ? 'text-warning' : 'text-muted'">★</span>
                        </div>
                        <div class="mb-3">
                            <textarea v-model="newReview.comment" class="form-control" rows="3" placeholder="Chia sẻ cảm nhận..."></textarea>
                        </div>
                        <button @click="submitReview" class="btn btn-success"><i class="bi bi-send me-1"></i> Gửi đánh giá</button>
                    </div>
                    
                    <div v-else class="alert alert-warning mt-4 text-center">
                        <i class="bi bi-exclamation-circle me-2"></i>
                        Vui lòng <router-link to="/login" class="fw-bold text-decoration-underline">đăng nhập</router-link> để viết đánh giá.
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div v-else class="text-center my-5 py-5">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-muted">Đang tải thông tin sản phẩm...</p>
    </div>
</template>

<style scoped>
.product-detail-img {
    max-height: 400px;
    object-fit: contain;
    width: 100%;
}

/* Style cho Badge giảm giá ở trang chi tiết (To hơn trang danh sách 1 chút) */
.detail-discount-badge {
    position: absolute;
    top: 15px;
    right: 15px;
    background-color: #dc3545;
    color: white;
    padding: 8px 15px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1.2rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    z-index: 10;
}

.cursor-pointer { cursor: pointer; }
.star-rating { transition: transform 0.2s; }
.star-rating:hover { transform: scale(1.2); }
.nav-tabs .nav-link.active {
    color: #ff6b01;
    border-top: 3px solid #ff6b01;
}
.nav-link { color: #6c757d; }

.btn-fruit { 
    background-color: #ff6b01; 
    border-color: #ff6b01; 
    color: white; 
}
.btn-fruit:hover { 
    background-color: #e65b00; 
}
</style>