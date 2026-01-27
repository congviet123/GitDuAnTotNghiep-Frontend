<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';



import Header from '@/components/layout/Header.vue';
import Footer from '@/components/layout/Footer.vue';

const route = useRoute();

// Kiểm tra xem có phải trang Admin không
const isAdminPage = computed(() => {
  // Tránh lỗi null và kiểm tra đường dẫn bắt đầu bằng /admin
  return route.path && route.path.startsWith('/admin');
});
</script>

<template>
  <div v-if="!isAdminPage" class="client-layout d-flex flex-column min-vh-100">
    
    <Header />

    <main class="flex-grow-1">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <Footer />
  </div>

  <div v-else class="admin-wrapper">
    <router-view />
  </div>
</template>

<style>
/* CSS Global cho toàn app */
body {
  font-family: 'Roboto', 'Arial', sans-serif;
  background-color: #f8f9fa; /* Màu nền xám nhẹ dễ nhìn */
  margin: 0;
}

/* 1. Hiệu ứng chuyển trang mờ dần (Fade) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 2. CSS reset cho Admin */
.admin-wrapper {
  min-height: 100vh;
  background-color: #f4f6f9; 
}

/* 3. Tùy chỉnh thanh cuộn cho đẹp hơn (Optional) */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1; 
}
::-webkit-scrollbar-thumb {
  background: #ccc; 
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #007bff; /* Màu xanh khi hover thanh cuộn */
}
</style>