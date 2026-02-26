<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/services/api';
import { useAuthStore } from '@/store/auth';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const articleId = route.params.id;
const article = ref(null);
const isLoading = ref(true);

let viewTimer = null;

// --- HELPER ---
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
};

const getImageUrl = (imageName) => {
    if (!imageName) return 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=1000&q=80';
    if (imageName.startsWith('http') || imageName.startsWith('blob:')) return imageName;
    let cleanName = imageName.startsWith('/') ? imageName.substring(1) : imageName;
    if (cleanName.startsWith('imgs/')) cleanName = cleanName.substring(5);
    return `http://localhost:8080/imgs/${cleanName}`;
};

// --- METHODS ---
const fetchArticleDetail = async () => {
    isLoading.value = true;
    try {
        const res = await apiClient.get(`/news/${articleId}`);
        article.value = res.data;
        likeCount.value = res.data.likeCount || 0;
        // Giả sử có trạng thái liked từ BE nếu cần, ở đây FE đang tự quản lý isLiked
    } catch (err) {
        console.error("Lỗi tải chi tiết bài viết", err);
    } finally {
        isLoading.value = false;
    }
};

const incrementView = async () => {
    try {
        await apiClient.post(`/news-engagement/view/${articleId}`);
        console.log("Đã ghi nhận lượt xem sau 15 giây");
    } catch (err) {
        console.error("Lỗi tăng lượt xem", err);
    }
};

// --- LOGIC TƯƠNG TÁC ---
const isLiked = ref(false);
const likeCount = ref(0);
const newComment = ref('');
const replyContent = ref('');
const activeReplyId = ref(null);

// Dữ liệu Comment mẫu
const comments = reactive([
    {
        id: 1, user: "Nguyễn Văn A", avatar: "https://ui-avatars.com/api/?name=NV", 
        content: "Bài viết rất hữu ích, cảm ơn shop!", time: "2 giờ trước",
        replies: [
            { id: 11, user: "Admin", avatar: "https://ui-avatars.com/api/?name=Admin&background=007bff&color=fff", content: "Cảm ơn bạn đã ủng hộ ạ!", time: "1 giờ trước" }
        ]
    }
]);

const toggleLike = async () => {
    if (!authStore.isAuthenticated) {
        Swal.fire({
            title: 'Yêu cầu đăng nhập',
            text: 'Bạn cần đăng nhập để yêu thích bài viết này!',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Đăng nhập',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) router.push('/login');
        });
        return;
    }

    // Cập nhật UI ngay lập tức
    isLiked.value = !isLiked.value;
    isLiked.value ? likeCount.value++ : likeCount.value--;

    try {
        await apiClient.post(`/news-engagement/like/${articleId}`);
    } catch (err) {
        console.error("Lỗi toggle like", err);
        // Hoàn tác UI nếu lỗi
        isLiked.value = !isLiked.value;
        isLiked.value ? likeCount.value++ : likeCount.value--;
    }
};

const handleShare = async () => {
    // Copy link hiện tại
    try {
        await navigator.clipboard.writeText(window.location.href);
        
        if (authStore.isAuthenticated) {
            // Ghi nhận lượt share lên platform 'copy-link'
            await apiClient.post(`/news-engagement/share/${articleId}`, null, {
                params: { platform: 'copy-link' }
            });
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đã sao chép liên kết bài viết!',
            timer: 2000,
            showConfirmButton: false
        });
    } catch (err) {
        console.error("Lỗi share", err);
    }
};

const submitComment = () => {
    if (!newComment.value.trim()) return;
    comments.unshift({
        id: Date.now(),
        user: "Bạn (Khách)",
        avatar: "https://ui-avatars.com/api/?name=You",
        content: newComment.value,
        time: "Vừa xong",
        replies: []
    });
    newComment.value = '';
};

const toggleReplyInput = (commentId) => {
    activeReplyId.value = activeReplyId.value === commentId ? null : commentId;
    replyContent.value = '';
};

const submitReply = (parentComment) => {
    if (!replyContent.value.trim()) return;
    parentComment.replies.push({
        id: Date.now(),
        user: "Bạn (Khách)",
        avatar: "https://ui-avatars.com/api/?name=You",
        content: replyContent.value,
        time: "Vừa xong"
    });
    activeReplyId.value = null;
    replyContent.value = '';
};

onMounted(() => {
    fetchArticleDetail();
    
    // Đặt timer 15 giây để tăng lượt xem
    viewTimer = setTimeout(() => {
        incrementView();
    }, 15000);
});

onUnmounted(() => {
    if (viewTimer) clearTimeout(viewTimer);
});
</script>

<template>
    <div class="container py-5">
        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Đang tải nội dung...</p>
        </div>

        <div class="row justify-content-center" v-else-if="article">
            <div class="col-lg-8">
                <nav aria-label="breadcrumb" class="mb-4">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><router-link to="/news">Tin tức</router-link></li>
                        <li class="breadcrumb-item active" aria-current="page">Chi tiết bài viết</li>
                    </ol>
                </nav>

                <h1 class="fw-bold mb-3">{{ article.title }}</h1>
                <div class="d-flex align-items-center text-muted mb-4 small">
                    <span class="me-3"><i class="bi bi-person-fill"></i> {{ article.authorName }}</span>
                    <span class="me-3"><i class="bi bi-calendar3"></i> {{ formatDate(article.createDate) }}</span>
                    <span><i class="bi bi-eye"></i> {{ article.viewCount }} lượt xem</span>
                </div>

                <!-- Hiển thị ảnh đại diện bài viết nếu có -->
                <div class="mb-4 text-center" v-if="article.image">
                    <img :src="getImageUrl(article.image)" class="img-fluid rounded shadow-sm" :alt="article.title" style="max-height: 500px; width: 100%; object-fit: cover;">
                </div>

                <div class="article-content mb-5" v-html="article.content"></div>

                <hr>

                <div class="d-flex gap-3 mb-5">
                    <button @click="toggleLike" class="btn rounded-pill px-4" 
                            :class="isLiked ? 'btn-danger' : 'btn-outline-danger'">
                        <i class="bi" :class="isLiked ? 'bi-heart-fill' : 'bi-heart'"></i> 
                        {{ isLiked ? 'Đã thích' : 'Yêu thích' }} ({{ likeCount }})
                    </button>
                    <button @click="handleShare" class="btn btn-outline-primary rounded-pill px-4">
                        <i class="bi bi-share-fill"></i> Chia sẻ
                    </button>
                </div>

                <div class="bg-light p-4 rounded">
                    <h5 class="fw-bold mb-4">Bình luận ({{ comments.length }})</h5>
                    
                    <div class="d-flex gap-3 mb-4">
                        <img src="https://ui-avatars.com/api/?name=You" class="rounded-circle" width="40" height="40">
                        <div class="w-100">
                            <textarea v-model="newComment" class="form-control mb-2" rows="2" placeholder="Viết bình luận của bạn..."></textarea>
                            <button @click="submitComment" class="btn btn-primary btn-sm px-4">Gửi</button>
                        </div>
                    </div>

                    <div class="comment-list">
                        <div v-for="cmt in comments" :key="cmt.id" class="mb-4">
                            <div class="d-flex gap-3">
                                <img :src="cmt.avatar" class="rounded-circle" width="40" height="40">
                                <div>
                                    <div class="bg-white p-3 rounded shadow-sm">
                                        <h6 class="fw-bold mb-1">{{ cmt.user }}</h6>
                                        <p class="mb-0 text-dark">{{ cmt.content }}</p>
                                    </div>
                                    <div class="d-flex gap-3 mt-1 ms-2 small">
                                        <span class="text-muted">{{ cmt.time }}</span>
                                        <span class="fw-bold text-primary cursor-pointer" @click="toggleReplyInput(cmt.id)">Trả lời</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="cmt.replies.length > 0" class="ms-5 mt-3 ps-3 border-start">
                                <div v-for="reply in cmt.replies" :key="reply.id" class="d-flex gap-3 mb-3">
                                    <img :src="reply.avatar" class="rounded-circle" width="30" height="30">
                                    <div class="bg-white p-2 px-3 rounded shadow-sm w-100">
                                        <h6 class="fw-bold mb-1 small">{{ reply.user }} <i v-if="reply.user === 'Admin'" class="bi bi-check-circle-fill text-primary small"></i></h6>
                                        <p class="mb-0 small text-dark">{{ reply.content }}</p>
                                    </div>
                                </div>
                            </div>

                            <div v-if="activeReplyId === cmt.id" class="ms-5 mt-2 d-flex gap-2 animate-fade">
                                <input v-model="replyContent" type="text" class="form-control form-control-sm" placeholder="Viết câu trả lời...">
                                <button @click="submitReply(cmt)" class="btn btn-primary btn-sm"><i class="bi bi-send"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="text-center py-5">
            <p class="text-muted">Không tìm thấy bài viết.</p>
            <router-link to="/news" class="btn btn-primary">Quay lại danh sách</router-link>
        </div>
    </div>
</template>

<style scoped>
.article-content { line-height: 1.8; font-size: 1.1rem; color: #333; }
.article-content :deep(img) { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
.article-content :deep(h4) { margin-top: 1.5rem; font-weight: bold; }
.cursor-pointer { cursor: pointer; }
.animate-fade { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>