<script setup>
import { ref, onMounted, reactive, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import apiClient from '@/services/api';

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
});
</script>

<template>
    <div class="container py-5">
        <div class="text-center mb-5">
            <h2 class="fw-bold text-uppercase text-primary-blue">Tin Tức & Sự Kiện</h2>
            <p class="text-muted">Cập nhật những kiến thức dinh dưỡng và ưu đãi mới nhất</p>
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
</style>
