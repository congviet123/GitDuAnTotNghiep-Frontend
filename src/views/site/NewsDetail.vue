<script setup>
import { ref, reactive } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const articleId = route.params.id; // Lấy ID bài viết từ URL

// --- MOCK DATA BÀI VIẾT CHI TIẾT ---
const article = {
    title: "Lợi ích tuyệt vời của quả Cherry đối với sức khỏe tim mạch",
    date: "12/01/2026",
    author: "Admin",
    views: 1250,
    content: `
        <p>Cherry (hay còn gọi là quả anh đào) không chỉ có hương vị thơm ngon mà còn là một siêu thực phẩm với vô vàn lợi ích cho sức khỏe. Đặc biệt, loại quả này được mệnh danh là "người bạn tốt" của trái tim.</p>
        <h4>1. Giàu chất chống oxy hóa</h4>
        <p>Trong cherry chứa nhiều Anthocyanin - chất tạo nên màu đỏ sẫm của quả. Đây là chất chống oxy hóa mạnh mẽ giúp giảm viêm và ngăn ngừa các tổn thương tế bào.</p>
        <h4>2. Cải thiện giấc ngủ</h4>
        <p>Cherry là một trong số ít thực phẩm tự nhiên chứa Melatonin, hormone giúp điều hòa chu kỳ giấc ngủ, giúp bạn ngủ ngon và sâu hơn.</p>
        <img src="https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=1000&q=80" class="img-fluid rounded my-3" alt="Cherry">
        <p>Hãy bổ sung cherry vào thực đơn hàng ngày để có một trái tim khỏe mạnh nhé!</p>
    `
};

// --- LOGIC TƯƠNG TÁC ---
const isLiked = ref(false);
const likeCount = ref(156);
const newComment = ref('');
const replyContent = ref('');
const activeReplyId = ref(null); // ID comment đang được trả lời

// Dữ liệu Comment mẫu (Đa cấp)
const comments = reactive([
    {
        id: 1, user: "Nguyễn Văn A", avatar: "https://ui-avatars.com/api/?name=NV", 
        content: "Bài viết rất hữu ích, cảm ơn shop!", time: "2 giờ trước",
        replies: [
            { id: 11, user: "Admin", avatar: "https://ui-avatars.com/api/?name=Admin&background=007bff&color=fff", content: "Cảm ơn bạn đã ủng hộ ạ!", time: "1 giờ trước" }
        ]
    },
    {
        id: 2, user: "Trần Thị B", avatar: "https://ui-avatars.com/api/?name=TB", 
        content: "Cherry bên mình là nhập khẩu từ đâu vậy ạ?", time: "30 phút trước",
        replies: []
    }
]);

// Xử lý Like
const toggleLike = () => {
    isLiked.value = !isLiked.value;
    isLiked.value ? likeCount.value++ : likeCount.value--;
};

// Xử lý Share
const handleShare = () => {
    // Copy link hiện tại
    navigator.clipboard.writeText(window.location.href);
    alert("Đã sao chép liên kết bài viết!");
};

// Gửi Comment cha
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

// Mở ô nhập Reply
const toggleReplyInput = (commentId) => {
    activeReplyId.value = activeReplyId.value === commentId ? null : commentId;
    replyContent.value = '';
};

// Gửi Reply (Comment con)
const submitReply = (parentComment) => {
    if (!replyContent.value.trim()) return;
    parentComment.replies.push({
        id: Date.now(),
        user: "Bạn (Khách)",
        avatar: "https://ui-avatars.com/api/?name=You",
        content: replyContent.value,
        time: "Vừa xong"
    });
    activeReplyId.value = null; // Đóng ô nhập
    replyContent.value = '';
};
</script>

<template>
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <nav aria-label="breadcrumb" class="mb-4">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><router-link to="/news">Tin tức</router-link></li>
                        <li class="breadcrumb-item active" aria-current="page">Chi tiết bài viết</li>
                    </ol>
                </nav>

                <h1 class="fw-bold mb-3">{{ article.title }}</h1>
                <div class="d-flex align-items-center text-muted mb-4 small">
                    <span class="me-3"><i class="bi bi-person-fill"></i> {{ article.author }}</span>
                    <span class="me-3"><i class="bi bi-calendar3"></i> {{ article.date }}</span>
                    <span><i class="bi bi-eye"></i> {{ article.views }} lượt xem</span>
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
    </div>
</template>

<style scoped>
.article-content { line-height: 1.8; font-size: 1.1rem; color: #333; }
.article-content img { max-width: 100%; height: auto; }
.cursor-pointer { cursor: pointer; }
.animate-fade { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>