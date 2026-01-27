import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // =======================================================
    // 1. SITE ROUTES (GIAO DIỆN KHÁCH HÀNG - PUBLIC)
    // =======================================================
    { 
        path: '/',  
        name: 'home',
        component: () => import('@/views/site/HomeView.vue') 
    },
    { 
        path: '/products', 
        name: 'products',
        component: () => import('@/views/site/ProductList.vue') 
    },  
    { 
        path: '/products/:id', 
        name: 'product-detail',
        component: () => import('@/views/site/ProductDetail.vue') 
    },
    
    {
      path: '/contact',
      name: 'contact',
      component: () => import('@/views/site/ContactView.vue')
    },

{ 
  path: '/about', 
  name: 'about',
  component: () => import('@/views/site/AboutView.vue') 
},

// --- ROUTE TIN TỨC ---
{ 
  path: '/news', 
  name: 'news',
  component: () => import('@/views/site/NewsView.vue') 
},
{ 
  path: '/news/:id', 
  name: 'news-detail',
  component: () => import('@/views/site/NewsDetail.vue') 
},

    // --- Các trang cần đăng nhập (User) ---
    { 
        path: '/cart', 
        name: 'cart',
        component: () => import('@/views/site/CartView.vue'),
        meta: { requiresAuth: true } 
    },
    { 
        path: '/order-history', 
        name: 'order-history',
        component: () => import('@/views/site/OrderHistory.vue'), 
        meta: { requiresAuth: true } 
    },

    // =======================================================
    // 2. AUTH ROUTES (XÁC THỰC TÀI KHOẢN)
    // =======================================================
    { 
        path: '/login', 
        name: 'login',
        component: () => import('@/views/auth/Login.vue') 
    },
    { 
        path: '/register', 
        name: 'register',
        component: () => import('@/views/auth/Register.vue') 
    },
    { 
        path: '/profile', 
        name: 'profile',
        component: () => import('@/views/auth/Profile.vue'), 
        meta: { requiresAuth: true } 
    },
    { 
        path: '/auth/change-password', 
        name: 'change-password',
        component: () => import('@/views/auth/ChangePassword.vue'), 
        meta: { requiresAuth: true } 
    },
    { 
        path: '/auth/forgot-password', 
        name: 'forgot-password',
        component: () => import('@/views/auth/ForgotPassword.vue') 
    },

    // =======================================================
    // 3. ADMIN ROUTES (QUẢN TRỊ VIÊN - ROLE_ADMIN)
    // =======================================================
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'), 
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        // Redirect mặc định vào Dashboard
        { path: '', redirect: '/admin/dashboard' },
        
        { path: 'dashboard', component: () => import('@/views/admin/Dashboard.vue') },
        { path: 'products', component: () => import('@/views/admin/ProductManagement.vue') },
        
        //Thêm route cho trang Quản lý Danh mục
        { path: 'categories', component: () => import('@/views/admin/CategoryManagement.vue') },
        
        { path: 'users', component: () => import('@/views/admin/UserManagement.vue') },
        { path: 'orders', component: () => import('@/views/admin/OrderManagement.vue') },

        { path: 'news', component: () => import('@/views/admin/NewsManagement.vue') },

        { path: 'about-cms', component: () => import('@/views/admin/AboutManagement.vue') },

        { path: 'contact-cms', component: () => import('@/views/admin/ContactManagement.vue') },

        { path: 'suppliers', component: () => import('@/views/admin/SupplierManagement.vue') },
        
        { path: 'imports', component: () => import('@/views/admin/ImportManagement.vue') },

      ]
    },

    // Trang 404: Bắt tất cả các đường dẫn sai -> Về trang chủ
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  // Tự động cuộn lên đầu trang khi chuyển route
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// =======================================================
// NAVIGATION GUARDS (BẢO VỆ ROUTE)
// =======================================================
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  // 1. Kiểm tra yêu cầu Đăng nhập (requiresAuth)
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      // Nếu chưa đăng nhập -> đá về Login
      return next('/login');
  }

  // 2. Kiểm tra quyền Admin (requiresAdmin)
  if (to.meta.requiresAdmin) {
    // Lấy Role từ store (đảm bảo user tồn tại trước khi chấm role)
    const userRole = authStore.user?.role?.name;

    // So sánh chính xác với 'ROLE_ADMIN'
    if (userRole !== 'ROLE_ADMIN') {
        alert("Bạn không có quyền truy cập vùng quản trị!");
        return next('/'); // Đá về trang chủ
    }
  }
  
  // Cho phép đi tiếp
  next();
});

export default router;  