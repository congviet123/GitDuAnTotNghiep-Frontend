<script setup>
// đây là file cha nó gọi file con AdminSidebar.vue
import AdminSidebar from './AdminSidebar.vue'; 
</script>

<template>
    <div class="d-flex admin-layout">
        
        <AdminSidebar />

        <div class="flex-grow-1 bg-light">
            <header class="p-3 mb-3 border-bottom bg-white shadow-sm">
                <div class="container-fluid d-flex justify-content-between align-items-center">
                    <span class="text-muted small">Hệ thống quản trị Fruits Shop</span>
                </div>
            </header>

            <div class="container-fluid p-4">
                 <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </div>
        </div>
        
    </div>
</template>

<style scoped>
.admin-layout {
    min-height: 100vh;
}

/* Hiệu ứng chuyển trang mờ nhẹ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>