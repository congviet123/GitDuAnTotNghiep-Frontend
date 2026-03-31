<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/services/api';
import { useAuthStore } from '@/store/auth';
import Swal from 'sweetalert2';

const route   = useRoute();
const router  = useRouter();
const authStore = useAuthStore();
const articleId = Number(route.params.id);

// --- ARTICLE ---
const article    = ref(null);
const isLoading  = ref(true);
const isLiked    = ref(false);
const likeCount  = ref(0);
const shareCount = ref(0);
let   viewTimer  = null;

// --- COMMENTS STATE ---
const rootComments  = ref([]);           // list of root comment objects
const rootPage      = ref(0);
const rootHasMore   = ref(true);
const rootLoading   = ref(false);
const totalComments = ref(0);
const PAGE_SIZE     = 5;

// Per-root-comment reply state keyed by comment id
// replies[id] = { data: [], page: 0, hasMore: true, loading: false, open: false }
const replies = reactive({});

// New comment / reply input
const newCommentContent = ref('');
const submittingComment = ref(false);

// Which comment has the reply box open
const activeReplyId     = ref(null);
const replyInputContent = ref('');
const submittingReply   = ref(false);

// ---------- HELPERS ----------
const formatDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')} ${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};

const avatarUrl = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random&color=fff&size=40`;

const getImageUrl = (img) => {
  if (!img) return 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=1000&q=80';
  if (img.startsWith('http') || img.startsWith('blob:')) return img;
  let clean = img.startsWith('/') ? img.slice(1) : img;
  if (clean.startsWith('imgs/')) clean = clean.slice(5);
  return `http://localhost:8080/imgs/${clean}`;
};

// ---------- ARTICLE ----------
const fetchArticleDetail = async () => {
  isLoading.value = true;
  try {
    const res = await apiClient.get(`/news/${articleId}`);
    article.value    = res.data;
    likeCount.value  = res.data.likeCount  || 0;
    shareCount.value = res.data.shareCount || 0;
    isLiked.value    = res.data.likedByCurrentUser;
  } catch (err) {
    console.error('Lỗi tải bài viết', err);
  } finally {
    isLoading.value = false;
  }
};

const incrementView = async () => {
  try { await apiClient.post(`/news-engagement/view/${articleId}`); } catch {}
};

const toggleLike = async () => {
  if (!authStore.isAuthenticated) {
    Swal.fire({
      title: 'Yêu cầu đăng nhập', text: 'Bạn cần đăng nhập để thích bài viết này!',
      icon: 'info', showCancelButton: true,
      confirmButtonText: 'Đăng nhập', cancelButtonText: 'Hủy'
    }).then(r => { if (r.isConfirmed) router.push('/login'); });
    return;
  }
  isLiked.value = !isLiked.value;
  isLiked.value ? likeCount.value++ : likeCount.value--;
  try {
    await apiClient.post(`/news-engagement/like/${articleId}`);
  } catch {
    isLiked.value = !isLiked.value;
    isLiked.value ? likeCount.value++ : likeCount.value--;
  }
};

// --- SHARE ---
const showShareModal = ref(false);

const recordShare = async (platform, receiverEmail = null) => {
  if (!authStore.isAuthenticated) return;
  try {
    await apiClient.post(`/news-engagement/share/${articleId}`, {
      platform,
      newsUrl: window.location.href,
      receiverEmail: receiverEmail || null,
    });
    shareCount.value++;
  } catch (err) {
    console.error('Lỗi ghi nhận chia sẻ', err);
  }
};

const shareCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    await recordShare('COPY_LINK');
    showShareModal.value = false;
    Swal.fire({ icon: 'success', title: 'Đã sao chép liên kết!', timer: 2000, showConfirmButton: false });
  } catch {}
};


const shareEmail = async () => {
  if (!authStore.isAuthenticated) {
    Swal.fire({
      title: 'Yêu cầu đăng nhập', text: 'Bạn cần đăng nhập để chia sẻ qua email!',
      icon: 'info', showCancelButton: true,
      confirmButtonText: 'Đăng nhập', cancelButtonText: 'Hủy'
    }).then(r => { if (r.isConfirmed) router.push('/login'); });
    showShareModal.value = false;
    return;
  }
  showShareModal.value = false;
  const { value: email, isConfirmed } = await Swal.fire({
    title: 'Chia sẻ qua Email',
    input: 'email',
    inputLabel: 'Nhập địa chỉ email người nhận',
    inputPlaceholder: 'example@email.com',
    showCancelButton: true,
    confirmButtonText: 'Gửi',
    cancelButtonText: 'Hủy',
    inputValidator: (v) => !v ? 'Vui lòng nhập email!' : undefined,
  });
  if (!isConfirmed || !email) return;
  try {
    await recordShare('EMAIL', email);
    Swal.fire({ icon: 'success', title: 'Đã gửi email chia sẻ!', timer: 2000, showConfirmButton: false });
  } catch {
    Swal.fire('Lỗi', 'Không thể gửi email. Vui lòng thử lại.', 'error');
  }
};

// ---------- ROOT COMMENTS ----------
const fetchRootComments = async (reset = false) => {
  if (rootLoading.value) return;
  rootLoading.value = true;
  try {
    const res  = await apiClient.get(`/news-comments/news/${articleId}/root`, {
      params: { page: rootPage.value, size: PAGE_SIZE }
    });
    const data = res.data;
    const items = data.content || data || [];

    if (reset) {
      rootComments.value = items;
    } else {
      rootComments.value.push(...items);
    }

    totalComments.value = data.totalElements ?? rootComments.value.length;
    rootHasMore.value   = !data.last;           // Spring Page exposes `last`
  } catch (err) {
    console.error('Lỗi tải bình luận', err);
  } finally {
    rootLoading.value = false;
  }
};

const loadMoreComments = () => {
  rootPage.value++;
  fetchRootComments();
};

// ---------- REPLIES ----------
const initReplyState = (cmtId) => {
  if (!replies[cmtId]) {
    replies[cmtId] = { data: [], page: 0, hasMore: true, loading: false, open: false };
  }
};

const toggleReplies = async (cmt) => {
  initReplyState(cmt.id);
  const state = replies[cmt.id];

  if (state.open) {
    // Collapse
    state.open = false;
    return;
  }

  // First open — load page 0
  state.open = true;
  if (state.data.length === 0) {
    await fetchReplies(cmt.id);
  }
};

const fetchReplies = async (parentId) => {
  const state = replies[parentId];
  if (!state || state.loading) return;
  state.loading = true;
  try {
    const res  = await apiClient.get(`/news-comments/${parentId}/replies`, {
      params: { page: state.page, size: PAGE_SIZE }
    });
    const data  = res.data;
    const items = data.content || data || [];
    state.data.push(...items);
    state.hasMore = !data.last;
  } catch (err) {
    console.error('Lỗi tải trả lời', err);
  } finally {
    state.loading = false;
  }
};

const loadMoreReplies = async (parentId) => {
  replies[parentId].page++;
  await fetchReplies(parentId);
};

// ---------- SUBMIT COMMENT ----------
const requireLogin = () => {
  if (!authStore.isAuthenticated) {
    Swal.fire({
      title: 'Yêu cầu đăng nhập', text: 'Bạn cần đăng nhập để bình luận!',
      icon: 'info', showCancelButton: true,
      confirmButtonText: 'Đăng nhập', cancelButtonText: 'Hủy'
    }).then(r => { if (r.isConfirmed) router.push('/login'); });
    return false;
  }
  return true;
};

const submitComment = async () => {
  if (!requireLogin()) return;
  const content = newCommentContent.value.trim();
  if (!content) return;
  submittingComment.value = true;
  try {
    const res = await apiClient.post('/news-comments', { newsId: articleId, content });
    // Prepend to list and update counter
    rootComments.value.unshift(res.data);
    totalComments.value++;
    newCommentContent.value = '';
  } catch (err) {
    Swal.fire('Lỗi', 'Không thể gửi bình luận.', 'error');
  } finally {
    submittingComment.value = false;
  }
};

// ---------- SUBMIT REPLY ----------
const toggleReplyInput = (cmtId) => {
  if (!requireLogin()) return;
  activeReplyId.value   = activeReplyId.value === cmtId ? null : cmtId;
  replyInputContent.value = '';
};

const submitReply = async (parentCmt) => {
  if (!requireLogin()) return;
  const content = replyInputContent.value.trim();
  if (!content) return;
  submittingReply.value = true;
  try {
    const res = await apiClient.post('/news-comments', {
      newsId: articleId, content, parentId: parentCmt.id
    });
    // Ensure reply state is initialized and open
    initReplyState(parentCmt.id);
    const state = replies[parentCmt.id];
    state.data.unshift(res.data);
    state.open = true;
    totalComments.value++;
    activeReplyId.value   = null;
    replyInputContent.value = '';
  } catch (err) {
    Swal.fire('Lỗi', 'Không thể gửi trả lời.', 'error');
  } finally {
    submittingReply.value = false;
  }
};

// ---------- LIFECYCLE ----------
onMounted(() => {
  fetchArticleDetail();
  fetchRootComments(true);
  viewTimer = setTimeout(incrementView, 15000);
});

onUnmounted(() => {
  if (viewTimer) clearTimeout(viewTimer);
});
</script>

<template>
  <div class="container py-5">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2 text-muted">Đang tải nội dung...</p>
    </div>

    <!-- Article -->
    <div class="row justify-content-center" v-else-if="article">
      <div class="col-lg-8">

        <!-- Breadcrumb -->
        <nav aria-label="breadcrumb" class="mb-4">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><router-link to="/news">Tin tức</router-link></li>
            <li class="breadcrumb-item active">Chi tiết bài viết</li>
          </ol>
        </nav>

        <h1 class="fw-bold mb-3">{{ article.title }}</h1>
        <div class="d-flex align-items-center text-muted mb-4 small flex-wrap gap-3">
          <span><i class="bi bi-person-fill me-1"></i>{{ article.authorName }}</span>
          <span><i class="bi bi-calendar3 me-1"></i>{{ formatDate(article.createDate) }}</span>
          <span><i class="bi bi-eye me-1"></i>{{ article.viewCount }} lượt xem</span>
          <span><i class="bi bi-share me-1"></i>{{ shareCount }} lượt chia sẻ</span>
        </div>

        <div class="mb-4 text-center" v-if="article.image">
          <img :src="getImageUrl(article.image)" class="img-fluid rounded shadow-sm"
               :alt="article.title" style="max-height:500px;width:100%;object-fit:cover;">
        </div>

        <div class="article-content mb-5" v-html="article.content"></div>

        <!-- Product Link -->
        <div v-if="article.productLink" class="mb-4">
          <a :href="article.productLink" target="_blank" rel="noopener noreferrer"
             class="btn btn-success rounded-pill px-4 fw-bold shadow-sm">
            <i class="bi bi-bag-fill me-2"></i>Xem sản phẩm
            <i class="bi bi-arrow-right ms-1"></i>
          </a>
        </div>

        <hr>

        <!-- Like / Share -->
        <div class="d-flex gap-3 mb-5">
          <button @click="toggleLike" class="btn rounded-pill px-4"
                  :class="isLiked ? 'btn-danger' : 'btn-outline-danger'">
            <i class="bi" :class="isLiked ? 'bi-heart-fill' : 'bi-heart'"></i>
            {{ isLiked ? 'Đã thích' : 'Yêu thích' }} ({{ likeCount }})
          </button>
          <button @click="showShareModal = true" class="btn btn-outline-primary rounded-pill px-4">
            <i class="bi bi-share-fill"></i> Chia sẻ ({{ shareCount }})
          </button>
        </div>

        <!-- Share Modal -->
        <div v-if="showShareModal" class="share-modal-backdrop" @click.self="showShareModal = false">
          <div class="share-modal">
            <div class="share-modal-header">
              <h6 class="mb-0 fw-bold"><i class="bi bi-share-fill me-2 text-primary"></i>Chia sẻ bài viết</h6>
              <button class="btn-close btn-sm" @click="showShareModal = false"></button>
            </div>
            <div class="share-modal-body">
              <button class="share-btn" @click="shareCopyLink">
                <i class="bi bi-link-45deg"></i>
                <span>Sao chép liên kết</span>
              </button>
              <button class="share-btn share-btn-email" @click="shareEmail">
                <i class="bi bi-envelope-fill"></i>
                <span>Email</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ===== COMMENT SECTION ===== -->
        <div class="bg-light p-4 rounded">

          <!-- Header -->
          <h5 class="fw-bold mb-4">
            <i class="bi bi-chat-dots me-2 text-primary"></i>Bình luận ({{ totalComments }})
          </h5>

          <!-- New comment box -->
          <div class="d-flex gap-3 mb-4">
            <img :src="avatarUrl(authStore.user?.fullname || authStore.user?.username)"
                 class="rounded-circle flex-shrink-0" width="40" height="40">
            <div class="w-100">
              <textarea v-model="newCommentContent" class="form-control mb-2" rows="2"
                        placeholder="Viết bình luận của bạn..."></textarea>
              <button @click="submitComment" class="btn btn-primary btn-sm px-4"
                      :disabled="submittingComment || !newCommentContent.trim()">
                <span v-if="submittingComment" class="spinner-border spinner-border-sm me-1"></span>
                Gửi bình luận
              </button>
            </div>
          </div>

          <!-- Comment list -->
          <div v-if="rootLoading && rootComments.length === 0" class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary"></div>
            <span class="ms-2 text-muted small">Đang tải bình luận...</span>
          </div>

          <div v-else-if="rootComments.length === 0" class="text-center py-4 text-muted">
            <i class="bi bi-chat-square-text fs-2 d-block mb-2 opacity-50"></i>
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </div>

          <div v-else class="comment-list">
            <div v-for="cmt in rootComments" :key="cmt.id" class="mb-4">

              <!-- Root comment bubble -->
              <div class="d-flex gap-3">
                <img :src="avatarUrl(cmt.author)" class="rounded-circle flex-shrink-0"
                     width="40" height="40">
                <div class="flex-grow-1">
                  <div class="bg-white p-3 rounded shadow-sm">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="fw-bold">{{ cmt.author }}</span>
                      <small class="text-muted">{{ formatDate(cmt.createdDate) }}</small>
                    </div>
                    <p class="mb-0 text-dark">{{ cmt.content }}</p>
                  </div>

                  <!-- Actions row -->
                  <div class="d-flex gap-3 mt-1 ms-2 small">
                    <span class="text-primary fw-bold cursor-pointer"
                          @click="toggleReplyInput(cmt.id)">
                      <i class="bi bi-reply me-1"></i>Trả lời
                    </span>
                    <span v-if="cmt.replyCount > 0 || (replies[cmt.id]?.data.length > 0)"
                          class="text-secondary fw-bold cursor-pointer"
                          @click="toggleReplies(cmt)">
                      <i class="bi me-1"
                         :class="replies[cmt.id]?.open ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                      {{ replies[cmt.id]?.open ? 'Ẩn trả lời' : 'Xem trả lời' }}
                    </span>
                    <span v-else class="text-secondary fw-bold cursor-pointer"
                          @click="toggleReplies(cmt)">
                      <i class="bi bi-chevron-down me-1"></i>Xem trả lời
                    </span>
                  </div>

                  <!-- Reply input -->
                  <div v-if="activeReplyId === cmt.id" class="mt-2 d-flex gap-2 animate-fade">
                    <img :src="avatarUrl(authStore.user?.fullname)"
                         class="rounded-circle flex-shrink-0" width="30" height="30">
                    <div class="d-flex gap-2 flex-grow-1">
                      <input v-model="replyInputContent" type="text"
                             class="form-control form-control-sm"
                             placeholder="Viết câu trả lời..."
                             @keyup.enter="submitReply(cmt)">
                      <button @click="submitReply(cmt)"
                              class="btn btn-primary btn-sm px-3"
                              :disabled="submittingReply || !replyInputContent.trim()">
                        <span v-if="submittingReply" class="spinner-border spinner-border-sm"></span>
                        <i v-else class="bi bi-send"></i>
                      </button>
                      <button @click="activeReplyId = null"
                              class="btn btn-outline-secondary btn-sm">
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Replies list (lazy) -->
                  <div v-if="replies[cmt.id]?.open" class="ms-4 mt-3 ps-3 border-start border-2">

                    <!-- Loading first page -->
                    <div v-if="replies[cmt.id].loading && replies[cmt.id].data.length === 0"
                         class="text-center py-2">
                      <div class="spinner-border spinner-border-sm text-secondary"></div>
                    </div>

                    <div v-for="reply in replies[cmt.id].data" :key="reply.id"
                         class="d-flex gap-2 mb-3 animate-fade">
                      <img :src="avatarUrl(reply.author)" class="rounded-circle flex-shrink-0"
                           width="30" height="30">
                      <div class="bg-white p-2 px-3 rounded shadow-sm flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <span class="fw-bold small">{{ reply.author }}</span>
                          <small class="text-muted">{{ formatDate(reply.createdDate) }}</small>
                        </div>
                        <p class="mb-0 small text-dark">{{ reply.content }}</p>
                      </div>
                    </div>

                    <!-- Load more replies -->
                    <div v-if="replies[cmt.id].hasMore" class="text-center mt-1 mb-2">
                      <button class="btn btn-outline-secondary btn-sm"
                              :disabled="replies[cmt.id].loading"
                              @click="loadMoreReplies(cmt.id)">
                        <span v-if="replies[cmt.id].loading"
                              class="spinner-border spinner-border-sm me-1"></span>
                        <i v-else class="bi bi-plus-circle me-1"></i>
                        Xem thêm trả lời
                      </button>
                    </div>

                  </div> <!-- /replies list -->

                </div>
              </div>

            </div><!-- /v-for root comment -->

            <!-- Load more root comments -->
            <div class="text-center mt-2">
              <button v-if="rootHasMore" class="btn btn-outline-primary px-5"
                      :disabled="rootLoading" @click="loadMoreComments">
                <span v-if="rootLoading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-arrow-down-circle me-2"></i>
                Xem thêm bình luận
              </button>
              <p v-else class="text-muted small mt-2">Đã hiển thị tất cả bình luận.</p>
            </div>

          </div><!-- /comment-list -->
        </div><!-- /comment section -->

      </div>
    </div>

    <!-- Not found -->
    <div v-else class="text-center py-5">
      <p class="text-muted">Không tìm thấy bài viết.</p>
      <router-link to="/news" class="btn btn-primary">Quay lại danh sách</router-link>
    </div>
  </div>
</template>

<style scoped>
.article-content {
  line-height: 1.8;
  font-size: 1.1rem;
  color: #333;
}
.article-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1rem 0;
}
.article-content :deep(h4) {
  margin-top: 1.5rem;
  font-weight: bold;
}
.cursor-pointer { cursor: pointer; }
.animate-fade { animation: fadeIn 0.25s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- Share Modal ---- */
.share-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  animation: fadeIn .2s ease;
}
.share-modal {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,.18);
  width: 320px;
  max-width: 95vw;
  overflow: hidden;
}
.share-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f0f0f0;
}
.share-modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .75rem;
  padding: 1.25rem;
}
.share-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .4rem;
  padding: .75rem .5rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 12px;
  background: #fafafa;
  cursor: pointer;
  font-size: .85rem;
  font-weight: 600;
  color: #333;
  transition: all .18s;
}
.share-btn i { font-size: 1.4rem; }
.share-btn:hover { background: #f0f4ff; border-color: #4f8ef7; color: #4f8ef7; transform: translateY(-2px); }
.share-btn-email i { color: #ea4335; }
.share-btn-email:hover { border-color: #ea4335; color: #ea4335; background: #fdecea; }
</style>
