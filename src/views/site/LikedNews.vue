<script setup>
import { ref, reactive, onMounted } from 'vue';
import apiClient from '@/services/api';

const newsList = ref([]);
const loading = ref(false);

const pagination = reactive({
    page: 0,
    size: 6,
    totalPages: 0,
    totalElements: 0,
});

const getImageUrl = (img) => {
    if (!img) return 'https://placehold.co/500x300?text=No+Image';
    if (img.startsWith('http')) return img;
    return `http://localhost:8080/imgs/${img.replace(/^\/|imgs\//g, '')}`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const fetchLikedNews = async (page = 0) => {
    loading.value = true;
    try {
        const res = await apiClient.get('/news/liked', {
            params: { page, size: pagination.size, sortBy: 'id', sortDir: 'desc' }
        });
        const data = res.data;

        const mapItem = (item) => ({
            ...item,
            desc: (item.summary || item.content || '').replace(/<[^>]*>?/gm, '')
        });

        if (data.content !== undefined) {
            newsList.value = data.content.map(mapItem);
            pagination.totalPages = data.totalPages;
            pagination.totalElements = data.totalElements;
            pagination.page = data.number;
        } else {
            newsList.value = Array.isArray(data) ? data.map(mapItem) : [];
            pagination.totalPages = 1;
            pagination.totalElements = newsList.value.length;
            pagination.page = 0;
        }
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const changePage = (p) => {
    if (p < 0 || p >= pagination.totalPages) return;
    fetchLikedNews(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => fetchLikedNews(0));
</script>

<template>
    <div class="container py-5">
        <!-- HEADER -->
        <div class="text-center mb-5">
            <h2 class="fw-bold text-uppercase" style="color: #007bff;">
                <i class="bi bi-heart-fill text-danger me-2"></i>Tin Tức Đã Thích
            </h2>
            <p class="text-muted">Những bài viết bạn đã yêu thích</p>
        </div>

        <!-- LOADING -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Đang tải dữ liệu...</p>
        </div>

        <div v-else>
            <!-- CARDS -->
            <div class="row g-4" v-if="newsList.length > 0">
                <div class="col-md-4" v-for="item in newsList" :key="item.id">
                    <div class="card h-100 border-0 shadow-sm hover-up">
                        <div class="overflow-hidden rounded-top">
                            <router-link :to="'/news/' + item.id">
                                <img :src="getImageUrl(item.image)"
                                     class="card-img-top object-fit-cover"
                                     :alt="item.title"
                                     style="height: 200px;"
                                     @error="e => e.target.src = 'https://placehold.co/500x300?text=No+Image'">
                            </router-link>
                        </div>
                        <div class="card-body">
                            <small class="text-muted">
                                <i class="bi bi-calendar3 me-1"></i>{{ formatDate(item.createDate) }}
                            </small>
                            <h5 class="card-title fw-bold mt-2">
                                <router-link :to="'/news/' + item.id" class="text-decoration-none text-dark hover-blue">
                                    {{ item.title }}
                                </router-link>
                            </h5>
                            <p class="card-text text-muted small text-clamp">{{ item.desc }}</p>
                        </div>
                        <div class="card-footer bg-white border-0 pb-3">
                            <router-link :to="'/news/' + item.id" class="btn btn-outline-primary btn-sm rounded-pill fw-bold">
                                Xem chi tiết <i class="bi bi-arrow-right"></i>
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>

            <!-- EMPTY STATE -->
            <div v-else class="text-center py-5 text-muted">
                <i class="bi bi-heart display-1 text-danger opacity-50"></i>
                <p class="mt-3 fs-5">Bạn chưa thích bài viết nào.</p>
                <router-link to="/news" class="btn btn-outline-primary mt-2">
                    <i class="bi bi-newspaper me-2"></i>Khám phá tin tức
                </router-link>
            </div>

            <!-- PAGINATION -->
            <div class="d-flex justify-content-center mt-5" v-if="pagination.totalPages > 1">
                <nav>
                    <ul class="pagination">
                        <li class="page-item" :class="{ disabled: pagination.page === 0 }">
                            <button class="page-link" @click="changePage(pagination.page - 1)">&laquo;</button>
                        </li>
                        <li class="page-item"
                            v-for="p in pagination.totalPages" :key="p"
                            :class="{ active: pagination.page === p - 1 }">
                            <button class="page-link" @click="changePage(p - 1)">{{ p }}</button>
                        </li>
                        <li class="page-item" :class="{ disabled: pagination.page === pagination.totalPages - 1 }">
                            <button class="page-link" @click="changePage(pagination.page + 1)">&raquo;</button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </div>
</template>

<style scoped>
.hover-up { transition: transform 0.3s; }
.hover-up:hover { transform: translateY(-5px); }
.hover-blue:hover { color: #007bff !important; }
.text-clamp {
    text-align: justify;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
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
    border-radius: 6px !important;
}
</style>
