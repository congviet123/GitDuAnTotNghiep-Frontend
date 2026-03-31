<script setup>
import { ref, onMounted, reactive, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import apiClient from '@/services/api';
import { voucherService } from '@/services/voucherService';

const articles = ref([]);
const isLoading = ref(false);
const router = useRouter();
const route = useRoute();

const currentPage = ref(0);
const totalPages = ref(0);
const pageSize = ref(6);

const filters = reactive({
    keyword: ''
});

// THÊM: State cho voucher
const availableVouchers = ref([]);
const showVoucherNotice = ref(false);

// THÊM: Kiểm tra voucher khuyến mãi
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

// THÊM: Chuyển đến trang giới thiệu và cuộn xuống phần voucher
const goToVouchers = () => {
    router.push({ path: '/about', query: { scrollTo: 'voucher' } });
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
};

const getImageUrl = (imageName) => {
    if (!imageName) return 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=500&q=80';
    
    if (imageName.startsWith('http') || imageName.startsWith('blob:')) return imageName;

    let cleanName = imageName;
    if (cleanName.startsWith('/')) {
        cleanName = cleanName.substring(1);
    }
    if (cleanName.startsWith('imgs/')) {
        cleanName = cleanName.substring(5);
    }
    
    return `http://localhost:8080/imgs/${cleanName}`;
};

const fetchNews = async (page = 0) => {
    isLoading.value = true;
    try {
        const params = {
            keyword: route.query.keyword || null,
            page: page,
            size: pageSize.value
        };

        const res = await apiClient.get('/news', { params });

        if (res.data && res.data.content) {
            articles.value = res.data.content.map(item => {
                // Lấy summary hoặc content, sau đó xóa bỏ các thẻ HTML để lấy text thuần
                const rawText = item.summary || item.content || '';
                const plainText = rawText.replace(/<[^>]*>?/gm, ''); 
                return {
                    ...item,
                    desc: plainText
                };
            });
            totalPages.value = res.data.totalPages;
            currentPage.value = res.data.number;
        } else if (Array.isArray(res.data)) {
            articles.value = res.data.map(item => {
                const rawText = item.summary || item.content || '';
                const plainText = rawText.replace(/<[^>]*>?/gm, '');
                return {
                    ...item,
                    desc: plainText
                };
            });
            totalPages.value = 1;
        } else {
            articles.value = [];
        }
    } catch (err) {
        console.error("Lỗi tải tin tức", err);
        articles.value = [];
    } finally {
        isLoading.value = false;
    }
};

const applyFilters = () => {
    const query = {};
    if (filters.keyword) query.keyword = filters.keyword;
    router.push({ query: query });

    filters.keyword = '';
};

const resetFilters = () => {
    router.push({ query: {} }); 
    filters.keyword = '';
};

const changePage = (pageNumber) => {
    if (pageNumber >= 0 && pageNumber < totalPages.value) {
        fetchNews(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

watch(
    () => route.query,
    (newQuery, oldQuery) => {
        if (JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
            fetchNews(0);
        }
    }
);

onMounted(async () => {
    await fetchNews(0);
    await checkAvailableVouchers();
});
</script>

<template>
    <div class="container py-5">
        <div class="text-center mb-5">
            <h2 class="fw-bold text-uppercase text-primary-blue">Tin Tức & Sự Kiện</h2>
            <p class="text-muted">Cập nhật những kiến thức dinh dưỡng và ưu đãi mới nhất</p>
        </div>

        <!-- THÊM: Icon voucher nổi -->
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

        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Đang tải tin tức...</p>
        </div>

        <div v-else>
            <div class="row g-4" v-if="articles.length > 0">
                <div class="col-md-4" v-for="item in articles" :key="item.id">
                    <div class="card h-100 border-0 shadow-sm hover-up">
                        <div class="overflow-hidden rounded-top">
                            <router-link :to="'/news/' + item.id">
                                <img :src="getImageUrl(item.image)" class="card-img-top object-fit-cover" :alt="item.title" style="height: 200px;" @error="e => e.target.src = 'https://placehold.co/500x300?text=No+Image'">
                            </router-link>
                        </div>
                        <div class="card-body">
                            <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> {{ formatDate(item.createDate) }}</small>
                            <h5 class="card-title fw-bold mt-2">
                                <router-link :to="'/news/' + item.id" class="text-decoration-none text-dark hover-blue">
                                    {{ item.title }}
                                </router-link>
                            </h5>
                            <p class="card-text text-muted small text-justify">{{ item.desc }}</p>
                        </div>
                        <div class="card-footer bg-white border-0 pb-3">
                            <router-link :to="'/news/' + item.id" class="btn btn-outline-primary btn-sm rounded-pill fw-bold">
                                Xem chi tiết <i class="bi bi-arrow-right"></i>
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="text-center py-5 text-muted">
                <i class="bi bi-newspaper display-1"></i>
                <p class="mt-3 fs-5">Hiện chưa có tin tức nào.</p>
                <button class="btn btn-outline-primary mt-2" @click="resetFilters" v-if="route.query.keyword">Xem tất cả</button>
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
    </div>
</template>

<style scoped>
.text-primary-blue { color: #007bff; }
.hover-up { transition: transform 0.3s; }
.hover-up:hover { transform: translateY(-5px); }
.hover-blue:hover { color: #007bff !important; }
.text-justify { 
    text-align: justify;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 3rem;
}

.pagination .page-item.active .page-link {
    background-color: #007bff;
    border-color: #007bff;
    color: white;
}
.pagination .page-link {
    color: #007bff;
    cursor: pointer;
}

/* THÊM: CSS cho icon voucher nổi */
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
</style>
