<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import apiClient from '@/services/api';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/store/auth';

// ========== KHỞI TẠO authStore ==========
const authStore = useAuthStore();

// ========== KIỂM TRA CÓ PHẢI STAFF KHÔNG ==========
const isStaff = computed(() => {
    const user = authStore.user;
    if (!user || !user.role) return false;
    const roleName = typeof user.role === 'object' ? user.role.name : user.role;
    return roleName === 'STAFF' || roleName === 'ROLE_STAFF';
});
// ===============================================

// --- STATE ---
const newsList = ref([]);
const loading = ref(false);
const isEdit = ref(false);
const selectedFile = ref(null);
let newsModal = null;
let commentModal = null;

// --- COMMENT STATE ---
const comments = ref([]);
const commentLoading = ref(false);
const currentNews = ref(null);
const commentPagination = reactive({
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
});

// --- PAGINATION STATE ---
const pagination = reactive({
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
});

// --- FILTER STATE ---
const filters = reactive({
    keyword: '',
    sortBy: 'id',
    sortDir: 'desc',
});

// --- FORM ---
const form = reactive({
    id: null,
    title: '',
    content: '',
    imagePreview: '',
    productLink: '',
});

// --- HELPERS ---
const getImageUrl = (img) => {
    if (!img) return 'https://placehold.co/60x45?text=No+Img';
    if (img.startsWith('http')) return img;
    return `http://localhost:8080/imgs/${img.replace(/^\/|imgs\//g, '')}`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
};

// --- FETCH ---
const fetchNews = async () => {
    loading.value = true;
    try {
        const params = {
            page: pagination.page,
            size: pagination.size,
            sortBy: filters.sortBy,
            sortDir: filters.sortDir,
        };
        if (filters.keyword) params.search = filters.keyword;

        const res = await apiClient.get('/news', { params });
        const data = res.data;

        if (data.content !== undefined) {
            newsList.value = data.content;
            pagination.totalPages = data.totalPages;
            pagination.totalElements = data.totalElements;
        } else {
            newsList.value = Array.isArray(data) ? data : [];
            pagination.totalPages = 1;
            pagination.totalElements = newsList.value.length;
        }
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// --- SEARCH & SORT ---
const searchNews = () => {
    pagination.page = 0;
    fetchNews();
};

const resetFilters = () => {
    filters.keyword = '';
    filters.sortBy = 'id';
    filters.sortDir = 'desc';
    pagination.page = 0;
    fetchNews();
};

const changeSortDir = (dir) => {
    filters.sortDir = dir;
    pagination.page = 0;
    fetchNews();
};

// --- PAGINATION ---
const goToPage = (p) => {
    if (p < 0 || p >= pagination.totalPages) return;
    pagination.page = p;
    fetchNews();
};

// --- MODAL ---
const openNewsModal = (item = null) => {
    selectedFile.value = null;
    if (item) {
        isEdit.value = true;
        form.id = item.id;
        form.title = item.title;
        form.content = item.content;
        form.imagePreview = item.image ? getImageUrl(item.image) : '';
        form.productLink = item.productLink || '';
    } else {
        isEdit.value = false;
        form.id = null;
        form.title = '';
        form.content = '';
        form.imagePreview = '';
        form.productLink = '';
    }
    newsModal.show();
};

const onFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFile.value = file;
        form.imagePreview = URL.createObjectURL(file);
    }
};

// --- SAVE (CREATE / UPDATE) ---
const saveNews = async () => {
    const newsData = {
        title: form.title,
        content: form.content,
        productLink: form.productLink || null,
    };

    const formData = new FormData();
    formData.append('news', new Blob([JSON.stringify(newsData)], { type: 'application/json' }));
    if (selectedFile.value) formData.append('newsImage', selectedFile.value);

    const config = { headers: { 'Content-Type': 'multipart/form-data' } };

    loading.value = true;
    try {
        if (isEdit.value) {
            await apiClient.put(`/news/${form.id}`, formData, config);
            window.Toast?.fire({ icon: 'success', title: 'Cập nhật bài viết thành công!' });
        } else {
            await apiClient.post('/news', formData, config);
            window.Toast?.fire({ icon: 'success', title: 'Đăng bài viết mới thành công!' });
        }
        newsModal.hide();
        fetchNews();
    } catch (err) {
        const msg = err.response?.data?.message || err.response?.data || 'Có lỗi xảy ra.';
        Swal.fire('Thất bại', typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    } finally {
        loading.value = false;
    }
};

// --- DELETE - Chỉ Admin mới được xóa ---
const deleteNews = async (id) => {
    // Nếu là Staff thì không cho xóa
    if (isStaff.value) {
        Swal.fire({ 
            icon: 'warning', 
            title: 'Không có quyền!', 
            text: 'Bạn không có quyền xóa bài viết. Vui lòng liên hệ Admin.' 
        });
        return;
    }
    
    const result = await Swal.fire({
        title: 'Xóa bài viết?',
        text: 'Thao tác này không thể hoàn tác!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa ngay',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
        try {
            await apiClient.delete(`/news/${id}`);
            newsList.value = newsList.value.filter(n => n.id !== id);
            pagination.totalElements = Math.max(0, pagination.totalElements - 1);
            if (newsList.value.length === 0 && pagination.page > 0) {
                pagination.page--;
                fetchNews();
            }
            window.Toast?.fire({ icon: 'success', title: 'Đã xóa bài viết!' });
        } catch (err) {
            Swal.fire('Lỗi', 'Không thể xóa bài viết này.', 'error');
        }
    }
};

// --- COMMENT METHODS ---
const openCommentModal = async (newsItem) => {
    currentNews.value = newsItem;
    commentPagination.page = 0;
    await fetchComments();
    commentModal.show();
};

const fetchComments = async () => {
    if (!currentNews.value?.id) return;
    commentLoading.value = true;
    try {
        const res = await apiClient.get(`/news-comments/news/${currentNews.value.id}`, {
            params: { page: commentPagination.page, size: commentPagination.size }
        });
        const data = res.data;
        if (data.content !== undefined) {
            comments.value = data.content;
            commentPagination.totalPages = data.totalPages;
            commentPagination.totalElements = data.totalElements;
        } else {
            comments.value = Array.isArray(data) ? data : [];
            commentPagination.totalPages = 1;
            commentPagination.totalElements = comments.value.length;
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Không thể tải bình luận.', 'error');
    } finally {
        commentLoading.value = false;
    }
};

const goToCommentPage = (p) => {
    if (p < 0 || p >= commentPagination.totalPages) return;
    commentPagination.page = p;
    fetchComments();
};

const toggleCommentVisibility = async (comment) => {
    try {
        const res = await apiClient.put(`/news-comments/${comment.id}/toggle-visibility`);
        const idx = comments.value.findIndex(c => c.id === comment.id);
        if (idx === -1) return;

        comments.value[idx] = { ...comment, visiable: !comment.visiable, ...(res.data || {}) };

        const isNowVisible = comments.value[idx].visiable;
        window.Toast?.fire({
            icon: 'success',
            title: isNowVisible ? 'Đã hiện thị bình luận' : 'Đã ẩn bình luận'
        });
    } catch (err) {
        Swal.fire('Lỗi', 'Không thể thay đổi trạng thái bình luận.', 'error');
    }
};

onMounted(async () => {
    newsModal = new bootstrap.Modal(document.getElementById('newsModal'));
    commentModal = new bootstrap.Modal(document.getElementById('commentModal'));
    await fetchNews();
});
</script>

<template>
    <div class="container-fluid p-4">
        <!-- HEADER -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-primary fw-bold mb-0">Quản lý Tin Tức</h2>
            <button class="btn btn-primary shadow-sm px-4 fw-bold" @click="openNewsModal()">
                <i class="bi bi-plus-lg me-2"></i> Đăng bài mới
            </button>
        </div>

        <!-- FILTER BAR -->
        <div class="card border-0 shadow-sm mb-3 bg-white">
            <div class="card-body py-3">
                <div class="row g-3 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label small text-muted fw-bold mb-1">Tìm kiếm</label>
                        <div class="input-group">
                            <span class="input-group-text bg-light border-end-0">
                                <i class="bi bi-search text-muted"></i>
                            </span>
                            <input type="text" class="form-control border-start-0 ps-0 bg-light"
                                   v-model="filters.keyword"
                                   placeholder="Tìm theo tiêu đề..."
                                   @keyup.enter="searchNews">
                        </div>
                    </div>

                    <div class="col-md-2">
                        <label class="form-label small text-muted fw-bold mb-1">Sắp xếp theo</label>
                        <select class="form-select bg-light" v-model="filters.sortBy" @change="searchNews">
                            <option value="id">ID</option>
                            <option value="createDate">Ngày đăng</option>
                            <option value="viewCount">Lượt xem</option>
                            <option value="likeCount">Lượt thích</option>
                        </select>
                    </div>

                    <div class="col-md-2">
                        <label class="form-label small text-muted fw-bold mb-1">Thứ tự</label>
                        <div class="btn-group w-100" role="group">
                            <button type="button" class="btn btn-sm"
                                    :class="filters.sortDir === 'desc' ? 'btn-primary' : 'btn-outline-secondary'"
                                    @click="changeSortDir('desc')">
                                <i class="bi bi-sort-down me-1"></i> Giảm
                            </button>
                            <button type="button" class="btn btn-sm"
                                    :class="filters.sortDir === 'asc' ? 'btn-primary' : 'btn-outline-secondary'"
                                    @click="changeSortDir('asc')">
                                <i class="bi bi-sort-up me-1"></i> Tăng
                            </button>
                        </div>
                    </div>

                    <div class="col-md-2 d-flex gap-2">
                        <button class="btn btn-primary flex-fill" @click="searchNews">
                            <i class="bi bi-search me-1"></i> Tìm
                        </button>
                        <button class="btn btn-outline-secondary" @click="resetFilters" title="Làm mới">
                            <i class="bi bi-arrow-counterclockwise"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- STATS BAR -->
        <div class="d-flex justify-content-end mb-3">
            <span class="text-muted small">
                Tổng số bài viết: <b>{{ pagination.totalElements }}</b>
            </span>
        </div>

        <!-- TABLE -->
        <div v-if="loading && newsList.length === 0" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Đang tải dữ liệu...</p>
        </div>
        <div v-else class="table-responsive shadow-sm rounded border bg-white" style="max-height: 70vh; overflow-y: auto;">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-dark sticky-top text-nowrap">
                    <tr>
                        <th class="ps-3">#ID</th>
                        <th>Hình ảnh</th>
                        <th style="min-width: 280px;">Tiêu đề & Tác giả</th>
                        <th class="text-center">Ngày đăng</th>
                        <th class="text-center"><i class="bi bi-eye-fill" title="Lượt xem"></i> View</th>
                        <th class="text-center"><i class="bi bi-heart-fill" title="Lượt thích"></i> Like</th>
                        <th class="text-center"><i class="bi bi-share-fill" title="Lượt chia sẻ"></i> Share</th>
                        <th class="text-center">Bình luận</th>
                        <th class="text-center pe-3">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                <tr v-for="item in newsList" :key="item.id">
                    <td class="ps-3 fw-bold">#{{ item.id }}</td>
                    <td>
                        <img :src="getImageUrl(item.image)"
                             class="img-thumbnail object-fit-cover bg-light"
                             width="60" height="45" alt="Img">
                    </td>
                    <td>
                        <div class="fw-bold text-truncate" style="max-width: 300px;" :title="item.title">{{ item.title }}</div>
                        <small class="text-muted"><i class="bi bi-person-circle me-1"></i>{{ item.authorName || 'Admin' }}</small>
                    </td>
                    <td class="text-center"><small>{{ formatDate(item.createDate) }}</small></td>
                    <td class="text-center fw-bold">{{ (item.viewCount || 0).toLocaleString() }}</td>
                    <td class="text-center fw-bold text-danger">{{ (item.likeCount || 0).toLocaleString() }}</td>
                    <td class="text-center fw-bold text-success">{{ (item.shareCount || 0).toLocaleString() }}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" @click="openCommentModal(item)" title="Xem bình luận">
                            <i class="bi bi-chat-dots-fill"></i>
                        </button>
                    </td>
                    <td class="text-center pe-3">
                        <button class="btn btn-outline-primary btn-sm me-2" @click="openNewsModal(item)" title="Sửa">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <!-- Chỉ hiển thị nút xóa nếu không phải Staff -->
                        <button v-if="!isStaff" class="btn btn-outline-danger btn-sm" @click="deleteNews(item.id)" title="Xóa">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
                <tr v-if="newsList.length === 0 && !loading">
                    <td colspan="9" class="text-center py-5 text-muted">
                        <div class="d-flex flex-column align-items-center">
                            <i class="bi bi-newspaper fs-1 mb-2 opacity-50"></i>
                            <p class="mb-0">Không tìm thấy bài viết nào.</p>
                            <button class="btn btn-link text-decoration-none btn-sm mt-2" @click="resetFilters">Xóa bộ lọc</button>
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>

        <!-- PAGINATION -->
        <div v-if="pagination.totalPages > 1"
             class="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-white mt-2 rounded shadow-sm">
            <small class="text-muted">
                Trang {{ pagination.page + 1 }} / {{ pagination.totalPages }}
                ({{ pagination.totalElements }} bài viết)
            </small>
            <nav>
                <ul class="pagination pagination-sm mb-0">
                    <li class="page-item" :class="{ disabled: pagination.page === 0 }">
                        <button class="page-link" @click="goToPage(0)">&laquo;</button>
                    </li>
                    <li class="page-item" :class="{ disabled: pagination.page === 0 }">
                        <button class="page-link" @click="goToPage(pagination.page - 1)">&lsaquo;</button>
                    </li>
                    <li v-for="p in pagination.totalPages" :key="p - 1"
                        class="page-item" :class="{ active: pagination.page === p - 1 }">
                        <button class="page-link" @click="goToPage(p - 1)">{{ p }}</button>
                    </li>
                    <li class="page-item" :class="{ disabled: pagination.page === pagination.totalPages - 1 }">
                        <button class="page-link" @click="goToPage(pagination.page + 1)">&rsaquo;</button>
                    </li>
                    <li class="page-item" :class="{ disabled: pagination.page === pagination.totalPages - 1 }">
                        <button class="page-link" @click="goToPage(pagination.totalPages - 1)">&raquo;</button>
                    </li>
                </ul>
            </nav>
        </div>

        <!-- CREATE / EDIT MODAL -->
        <div class="modal fade" id="newsModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-lg">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title fw-bold">
                            {{ isEdit ? 'Cập nhật bài viết' : 'Đăng bài viết mới' }}
                        </h5>
                        <button type="button" class="btn-close btn-close-white"
                                data-bs-dismiss="modal" :disabled="loading"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form @submit.prevent="saveNews">
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label fw-bold">
                                        Tiêu đề bài viết <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" class="form-control"
                                           v-model="form.title" required
                                           placeholder="Nhập tiêu đề bài viết...">
                                </div>
                                <div class="col-12">
                                    <label class="form-label fw-bold">Ảnh bài viết</label>
                                    <input type="file" class="form-control" @change="onFileSelected" accept="image/*">
                                    <div class="mt-2 text-center border p-2 bg-light rounded" v-if="form.imagePreview">
                                        <img :src="form.imagePreview"
                                             style="max-height: 180px; object-fit: contain;"
                                             alt="Preview">
                                    </div>
                                </div>
                                <div class="col-12">
                                    <label class="form-label fw-bold">
                                        Nội dung chi tiết <span class="text-danger">*</span>
                                    </label>
                                    <textarea class="form-control" v-model="form.content"
                                              rows="8" required
                                              placeholder="Nhập nội dung bài viết (hỗ trợ HTML)..."></textarea>
                                </div>
                                <div class="col-12">
                                    <label class="form-label fw-bold">Link sản phẩm liên quan</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-light"><i class="bi bi-link-45deg"></i></span>
                                        <input type="url" class="form-control" v-model="form.productLink"
                                               placeholder="https://... (tùy chọn)">
                                    </div>
                                    <div class="form-text text-muted">Nếu bài viết liên quan đến sản phẩm, nhập link sản phẩm vào đây.</div>
                                </div>
                            </div>

                            <div class="text-end mt-4">
                                <button type="button" class="btn btn-light me-2"
                                        data-bs-dismiss="modal" :disabled="loading">
                                    Hủy
                                </button>
                                <button type="submit" class="btn btn-primary fw-bold px-4"
                                        :disabled="loading">
                                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                    {{ isEdit ? 'Cập nhật' : 'Đăng bài' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- COMMENT MODAL -->
        <div class="modal fade" id="commentModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title fw-bold text-primary mb-0">
                                <i class="bi bi-chat-dots me-2"></i>Bình luận bài viết
                            </h5>
                            <small class="text-muted text-truncate d-block" style="max-width: 480px;">
                                {{ currentNews?.title }}
                            </small>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body bg-light p-3" style="max-height: 500px; overflow-y: auto;">
                        <div v-if="commentLoading" class="text-center py-4">
                            <div class="spinner-border text-primary spinner-border-sm"></div>
                            <p class="mt-2 mb-0 text-muted small">Đang tải bình luận...</p>
                        </div>

                        <div v-else-if="comments.length === 0" class="text-center py-5 text-muted">
                            <i class="bi bi-chat-square-text fs-1 d-block mb-2 opacity-50"></i>
                            Chưa có bình luận nào cho bài viết này.
                        </div>

                        <ul v-else class="list-group list-group-flush">
                            <li v-for="cmt in comments" :key="cmt.id"
                                class="list-group-item rounded mb-2 border shadow-sm"
                                :class="{ 'opacity-50 bg-secondary-subtle': !cmt.visiable }">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1 me-3">
                                        <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                                            <span class="fw-bold text-dark">{{ cmt.author }}</span>
                                            <span class="badge bg-light text-secondary border fw-normal">
                                                {{ formatDate(cmt.createdDate) }}
                                            </span>
                                            <span v-if="!cmt.visiable" class="badge bg-warning text-dark">
                                                <i class="bi bi-eye-slash-fill me-1"></i>Đang ẩn
                                            </span>
                                            <span v-else class="badge bg-success-subtle text-success border border-success">
                                                <i class="bi bi-eye-fill me-1"></i>Hiện thị
                                            </span>
                                        </div>
                                        <p class="mb-0 text-secondary">{{ cmt.content }}</p>
                                    </div>

                                    <button class="btn btn-sm flex-shrink-0 mt-1"
                                            :class="cmt.visiable ? 'btn-outline-secondary' : 'btn-success'"
                                            :title="cmt.visiable ? 'Ẩn bình luận này' : 'Hiện lại bình luận'"
                                            @click="toggleCommentVisibility(cmt)">
                                        <i class="bi" :class="cmt.visiable ? 'bi-eye-slash' : 'bi-eye'"></i>
                                        <span class="ms-1 d-none d-sm-inline">
                                            {{ cmt.visiable ? 'Ẩn' : 'Hiện' }}
                                        </span>
                                    </button>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div v-if="commentPagination.totalPages > 1"
                         class="modal-footer d-flex justify-content-between align-items-center py-2 border-top bg-white">
                        <small class="text-muted">
                            Trang {{ commentPagination.page + 1 }} / {{ commentPagination.totalPages }}
                            ({{ commentPagination.totalElements }} bình luận)
                        </small>
                        <nav>
                            <ul class="pagination pagination-sm mb-0">
                                <li class="page-item" :class="{ disabled: commentPagination.page === 0 }">
                                    <button class="page-link" @click="goToCommentPage(commentPagination.page - 1)">&lsaquo;</button>
                                </li>
                                <li v-for="p in commentPagination.totalPages" :key="p - 1"
                                    class="page-item" :class="{ active: commentPagination.page === p - 1 }">
                                    <button class="page-link" @click="goToCommentPage(p - 1)">{{ p }}</button>
                                </li>
                                <li class="page-item" :class="{ disabled: commentPagination.page === commentPagination.totalPages - 1 }">
                                    <button class="page-link" @click="goToCommentPage(commentPagination.page + 1)">&rsaquo;</button>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    <div v-else class="modal-footer border-0 py-2">
                        <small class="text-muted me-auto">Tổng: {{ commentPagination.totalElements }} bình luận</small>
                        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Đóng</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.table th {
    font-size: 0.82rem;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    font-weight: 700;
}
.badge { font-weight: 600; }
.page-link { border-radius: 6px !important; }
</style>