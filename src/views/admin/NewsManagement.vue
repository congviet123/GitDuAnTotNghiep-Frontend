<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';

// --- STATE ---
const newsList = ref([]);
const comments = ref([]); 
const isEdit = ref(false);
let newsModal = null;
let commentModal = null;

// --- FILTER STATE (BỘ LỌC) ---
const filters = reactive({
    keyword: '',       
    timeFilter: 'all', 
    customDate: '',    
    sortBy: 'newest'   
});

// Form dữ liệu cho bài viết
const form = reactive({
    id: null,
    title: '',
    image: '',
    summary: '',
    content: '',
    author: 'Admin',
    date: new Date().toISOString().split('T')[0],
    views: 0, likes: 0, shares: 0
});

// --- MOCK DATA ---
onMounted(() => {
    newsModal = new bootstrap.Modal(document.getElementById('newsModal'));
    commentModal = new bootstrap.Modal(document.getElementById('commentModal'));

    // Dữ liệu mẫu
    newsList.value = [
        {
            id: 1, title: "Lợi ích tuyệt vời của quả Cherry Mỹ",
            image: "/imgs/Cherry_Do_Canada.jpg",
            summary: "Cherry chứa nhiều chất chống oxy hóa giúp bảo vệ tim mạch...",
            content: "Nội dung chi tiết...", author: "Admin", date: "2026-01-27",
            views: 1250, likes: 340, shares: 56,
            comments: [
                { id: 101, user: "Nguyễn Văn A", content: "Bài viết rất hữu ích!", date: "2026-01-27", status: "active" },
                { id: 102, user: "Lê Thị B", content: "Cherry đợt này giá bao nhiêu shop?", date: "2026-01-27", status: "active" },
                { id: 103, user: "Spam Bot", content: "Click vào đây nhận quà...", date: "2026-01-27", status: "hidden" }
            ]
        },
        {
            id: 2, title: "Cách chọn Dâu Tây Hàn Quốc chuẩn ngon",
            image: "/imgs/Dau_Tay_Han_Quoc_To.jpg",
            summary: "Hướng dẫn nhận biết dâu tây tươi, cuống xanh...",
            content: "Nội dung chi tiết...", author: "Thảo Vy", date: "2026-01-26",
            views: 5000, likes: 2100, shares: 300,
            comments: [{ id: 201, user: "Trần C", content: "Dâu ngọt lắm, cảm ơn shop", date: "2026-01-26", status: "active" }]
        },
        {
            id: 3, title: "Top 5 trái cây giàu Vitamin C hơn cả cam",
            image: "/imgs/Cam_Vang_Navel_Uc.jpg",
            summary: "Ổi, Kiwi, Dâu tây là những loại quả giàu C...",
            content: "Nội dung...", author: "Bác sĩ Dinh dưỡng", date: "2026-01-20", 
            views: 8600, likes: 4200, shares: 950,
            comments: [
                { id: 301, user: "Hoàng Nam", content: "Kiến thức hay quá", date: "2026-01-21", status: "active" },
                { id: 302, user: "Phạm Hương", content: "Mình muốn đặt 2kg cam", date: "2026-01-22", status: "active" }
            ]
        },
        {
            id: 4, title: "Dưa hấu không hạt - Món quà ngày Tết",
            image: "/imgs/Dua_Hau_Khong_Hat_Thai_Lan.jpg",
            summary: "Dưa hấu đỏ tươi, ngọt mát cho ngày hè...",
            content: "Nội dung...", author: "Admin", date: "2026-01-27",
            views: 150, likes: 10, shares: 2, comments: []
        }
    ];
});

// --- LOGIC LỌC & SẮP XẾP ---
const filteredNewsList = computed(() => {
    // 1. Lọc
    let result = newsList.value.filter(item => {
        const keywordLower = filters.keyword.toLowerCase();
        const matchKeyword = item.title.toLowerCase().includes(keywordLower) || 
                             item.author.toLowerCase().includes(keywordLower);
        if (!matchKeyword) return false;

        const itemDate = item.date;
        const today = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split('T')[0];

        if (filters.timeFilter === 'today') return itemDate === today;
        if (filters.timeFilter === 'yesterday') return itemDate === yesterday;
        if (filters.timeFilter === 'custom' && filters.customDate) return itemDate === filters.customDate;

        return true;
    });

    // 2. Sắp xếp
    if (filters.sortBy === 'viewDesc') result.sort((a, b) => b.views - a.views);
    else if (filters.sortBy === 'likeDesc') result.sort((a, b) => b.likes - a.likes);
    else if (filters.sortBy === 'shareDesc') result.sort((a, b) => b.shares - a.shares);
    else result.sort((a, b) => b.id - a.id); // Default

    return result;
});

// --- TẠO THÔNG BÁO TRẠNG THÁI LỌC (MỚI) ---
const activeFiltersDescription = computed(() => {
    const parts = [];
    if (filters.keyword) parts.push(`Từ khóa: "${filters.keyword}"`);
    
    if (filters.timeFilter === 'today') parts.push('Thời gian: Hôm nay');
    else if (filters.timeFilter === 'yesterday') parts.push('Thời gian: Hôm qua');
    else if (filters.timeFilter === 'custom' && filters.customDate) parts.push(`Ngày: ${filters.customDate}`);
    
    if (parts.length === 0) return null; // Không có bộ lọc nào
    return parts.join(' | ');
});

const resetFilters = () => {
    filters.keyword = '';
    filters.timeFilter = 'all';
    filters.customDate = '';
    filters.sortBy = 'newest';
};

// --- CRUD TIN TỨC (Giữ nguyên) ---
const openNewsModal = (item = null) => {
    if (item) {
        isEdit.value = true;
        Object.assign(form, item);
    } else {
        isEdit.value = false;
        Object.assign(form, { 
            id: null, title: '', image: '', summary: '', content: '', author: 'Admin', 
            date: new Date().toISOString().split('T')[0], views: 0, likes: 0, shares: 0
        });
    }
    newsModal.show();
};

const saveNews = () => {
    if (isEdit.value) {
        const index = newsList.value.findIndex(n => n.id === form.id);
        if (index !== -1) newsList.value[index] = { ...form, comments: newsList.value[index].comments };
        Swal.fire('Thành công', 'Đã cập nhật bài viết!', 'success');
    } else {
        const newId = newsList.value.length > 0 ? Math.max(...newsList.value.map(n => n.id)) + 1 : 1;
        newsList.value.unshift({ ...form, id: newId, comments: [] });
        Swal.fire('Thành công', 'Đã đăng bài viết mới!', 'success');
    }
    newsModal.hide();
};

const deleteNews = (id) => {
    Swal.fire({
        title: 'Xóa bài viết?', text: "Không thể hoàn tác!", icon: 'warning',
        showCancelButton: true, confirmButtonText: 'Xóa ngay'
    }).then((result) => {
        if (result.isConfirmed) {
            newsList.value = newsList.value.filter(n => n.id !== id);
            Swal.fire('Đã xóa!', '', 'success');
        }
    });
};

// --- QUẢN LÝ BÌNH LUẬN (Giữ nguyên) ---
const currentNewsId = ref(null);
const openCommentModal = (newsItem) => {
    currentNewsId.value = newsItem.id;
    comments.value = newsItem.comments || [];
    commentModal.show();
};
const toggleCommentStatus = (comment) => {
    comment.status = comment.status === 'active' ? 'hidden' : 'active';
    const newsIdx = newsList.value.findIndex(n => n.id === currentNewsId.value);
    if(newsIdx !== -1) {
        const cmtIdx = newsList.value[newsIdx].comments.findIndex(c => c.id === comment.id);
        newsList.value[newsIdx].comments[cmtIdx] = comment;
    }
};
const deleteComment = (commentId) => {
    if(confirm('Xóa vĩnh viễn bình luận này?')) {
        comments.value = comments.value.filter(c => c.id !== commentId);
        const newsIdx = newsList.value.findIndex(n => n.id === currentNewsId.value);
        if(newsIdx !== -1) {
            newsList.value[newsIdx].comments = comments.value;
        }
    }
};
</script>

<template>
    <div class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-primary fw-bold">Quản lý Tin Tức</h2>
            <button class="btn btn-primary shadow-sm px-4 fw-bold" @click="openNewsModal()">
                <i class="bi bi-plus-lg me-2"></i> Đăng bài mới
            </button>
        </div>

        <div class="card border-0 shadow-sm mb-3 bg-white">
            <div class="card-body py-3">
                <div class="row g-3 align-items-center">
                    <div class="col-md-3">
                        <label class="form-label small text-muted fw-bold mb-1">Tìm kiếm</label>
                        <div class="input-group">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
                            <input type="text" class="form-control border-start-0 ps-0 bg-light" 
                                   v-model="filters.keyword" 
                                   placeholder="Tên bài viết, tác giả...">
                        </div>
                    </div>

                    <div class="col-md-2">
                        <label class="form-label small text-muted fw-bold mb-1">Thời gian</label>
                        <select class="form-select bg-light" v-model="filters.timeFilter">
                            <option value="all">Tất cả</option>
                            <option value="today">Hôm nay</option>
                            <option value="yesterday">Hôm qua</option>
                            <option value="custom">Tùy chọn...</option>
                        </select>
                    </div>

                    <div class="col-md-2" v-if="filters.timeFilter === 'custom'">
                        <label class="form-label small text-muted fw-bold mb-1">Chọn ngày</label>
                        <input type="date" class="form-control bg-light" v-model="filters.customDate">
                    </div>

                    <div class="col-md-3">
                        <label class="form-label small text-muted fw-bold mb-1">Sắp xếp theo</label>
                        <select class="form-select bg-light" v-model="filters.sortBy">
                            <option value="newest">Mới nhất</option>
                            <option value="viewDesc">Lượt xem cao nhất</option>
                            <option value="likeDesc">Lượt thích cao nhất</option>
                            <option value="shareDesc">Lượt chia sẻ cao nhất</option>
                        </select>
                    </div>

                    <div class="col-md-2 text-end">
                        <label class="form-label d-block mb-1">&nbsp;</label>
                        <button class="btn btn-outline-secondary w-100" @click="resetFilters" title="Làm mới bộ lọc">
                            <i class="bi bi-arrow-counterclockwise me-1"></i> Làm mới
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="activeFiltersDescription" class="alert alert-info border-0 shadow-sm d-flex justify-content-between align-items-center mb-3">
            <div>
                <i class="bi bi-funnel-fill me-2"></i>
                Đang lọc theo: <strong>{{ activeFiltersDescription }}</strong>
            </div>
            <div>
                <span class="badge bg-white text-info border fs-6">
                    Tìm thấy: {{ filteredNewsList.length }} bài viết
                </span>
            </div>
        </div>
        <div v-else class="d-flex justify-content-end mb-3">
            <span class="text-muted small">Tổng số bài viết: <b>{{ newsList.length }}</b></span>
        </div>

        <div class="card shadow-sm border-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light text-nowrap">
                        <tr>
                            <th class="ps-3">#ID</th>
                            <th>Hình ảnh</th>
                            <th style="min-width: 250px;">Tiêu đề & Tác giả</th>
                            <th class="text-center">Ngày đăng</th>
                            
                            <th class="text-center"><i class="bi bi-eye-fill text-primary" title="Lượt xem"></i> View</th>
                            <th class="text-center"><i class="bi bi-heart-fill text-danger" title="Lượt thích"></i> Like</th>
                            <th class="text-center"><i class="bi bi-share-fill text-success" title="Lượt chia sẻ"></i> Share</th>
                            
                            <th class="text-center">Bình luận</th>
                            <th class="text-center pe-3">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in filteredNewsList" :key="item.id">
                            <td class="ps-3 fw-bold text-muted">{{ item.id }}</td>
                            <td>
                                <img :src="item.image || '/imgs/no-image.png'" class="rounded border shadow-sm object-fit-cover" width="60" height="45" alt="Img">
                            </td>
                            <td>
                                <div class="fw-bold text-dark text-truncate" style="max-width: 280px;" :title="item.title">{{ item.title }}</div>
                                <small class="text-muted"><i class="bi bi-person-circle me-1"></i>{{ item.author }}</small>
                            </td>
                            <td class="text-center">
                                <span class="badge bg-light text-dark border">{{ item.date }}</span>
                            </td>
                            
                            <td class="text-center fw-bold">{{ item.views.toLocaleString() }}</td>
                            <td class="text-center fw-bold text-danger">{{ item.likes.toLocaleString() }}</td>
                            <td class="text-center fw-bold text-success">{{ item.shares.toLocaleString() }}</td>

                            <td class="text-center">
                                <button class="btn btn-sm btn-light border position-relative text-primary" @click="openCommentModal(item)">
                                    <i class="bi bi-chat-dots-fill"></i>
                                    <span v-if="item.comments.length > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 0.65rem;">
                                        {{ item.comments.length }}
                                    </span>
                                </button>
                            </td>
                            <td class="text-center pe-3">
                                <button class="btn btn-sm btn-outline-warning me-2" @click="openNewsModal(item)" title="Sửa">
                                    <i class="bi bi-pencil-square"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" @click="deleteNews(item.id)" title="Xóa">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="filteredNewsList.length === 0">
                            <td colspan="10" class="text-center py-5 text-muted">
                                <div class="d-flex flex-column align-items-center">
                                    <i class="bi bi-search fs-1 mb-2 opacity-50"></i>
                                    <p class="mb-0">Không tìm thấy bài viết nào phù hợp.</p>
                                    <button class="btn btn-link text-decoration-none btn-sm mt-2" @click="resetFilters">Xóa bộ lọc</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="modal fade" id="newsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title fw-bold">{{ isEdit ? 'Cập nhật bài viết' : 'Đăng bài viết mới' }}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form @submit.prevent="saveNews">
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label fw-bold">Tiêu đề bài viết <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" v-model="form.title" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Link Hình ảnh</label>
                                    <input type="text" class="form-control" v-model="form.image" placeholder="/imgs/...">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Tác giả</label>
                                    <input type="text" class="form-control" v-model="form.author">
                                </div>
                                <div class="col-12">
                                    <label class="form-label fw-bold">Tóm tắt ngắn</label>
                                    <textarea class="form-control" v-model="form.summary" rows="2"></textarea>
                                </div>
                                <div class="col-12">
                                    <label class="form-label fw-bold">Nội dung chi tiết (HTML/Text)</label>
                                    <textarea class="form-control" v-model="form.content" rows="6"></textarea>
                                </div>
                                
                                <div class="col-12" v-if="isEdit">
                                    <div class="card bg-light border-0 p-3">
                                        <h6 class="fw-bold text-muted mb-2 small text-uppercase">Số liệu ảo (Demo)</h6>
                                        <div class="row g-3">
                                            <div class="col-md-4">
                                                <label class="form-label small">Lượt xem</label>
                                                <input type="number" class="form-control form-control-sm" v-model="form.views">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label small">Lượt thích</label>
                                                <input type="number" class="form-control form-control-sm" v-model="form.likes">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label small">Lượt chia sẻ</label>
                                                <input type="number" class="form-control form-control-sm" v-model="form.shares">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="text-end mt-4">
                                <button type="button" class="btn btn-light me-2" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" class="btn btn-primary fw-bold px-4">Lưu bài viết</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="commentModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header">
                        <h5 class="modal-title fw-bold text-primary">Quản lý bình luận</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body bg-light p-3" style="max-height: 500px; overflow-y: auto;">
                        <div v-if="comments.length === 0" class="text-center py-5 text-muted">
                            <i class="bi bi-chat-square-text fs-1 d-block mb-2 opacity-50"></i>
                            Chưa có bình luận nào cho bài viết này.
                        </div>
                        <ul class="list-group" v-else>
                            <li class="list-group-item d-flex justify-content-between align-items-start mb-2 rounded border-0 shadow-sm" 
                                v-for="cmt in comments" :key="cmt.id"
                                :class="{'opacity-50 bg-secondary-subtle': cmt.status === 'hidden'}">
                                <div>
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="fw-bold text-dark">{{ cmt.user }}</span>
                                        <span class="badge bg-light text-secondary border fw-normal">{{ cmt.date }}</span>
                                    </div>
                                    <p class="mb-0 mt-1 text-secondary">{{ cmt.content }}</p>
                                    <span v-if="cmt.status === 'hidden'" class="badge bg-warning text-dark mt-2">
                                        <i class="bi bi-eye-slash-fill me-1"></i> Đã ẩn do vi phạm
                                    </span>
                                </div>
                                <div class="d-flex gap-2 align-items-center">
                                    <button class="btn btn-sm" 
                                            :class="cmt.status === 'active' ? 'btn-outline-secondary' : 'btn-success'"
                                            @click="toggleCommentStatus(cmt)"
                                            :title="cmt.status === 'active' ? 'Ẩn bình luận' : 'Hiện bình luận'">
                                        <i class="bi" :class="cmt.status === 'active' ? 'bi-eye-slash' : 'bi-eye'"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="deleteComment(cmt.id)" title="Xóa vĩnh viễn">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>