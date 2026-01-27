<script setup>
import { ref } from 'vue';

// Mock data bài viết
const articles = ref([
    {
        id: 1,
        title: "Lợi ích tuyệt vời của quả Cherry đối với sức khỏe tim mạch",
        desc: "Cherry không chỉ ngon mà còn chứa nhiều chất chống oxy hóa giúp bảo vệ tim mạch...",
        image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=500&q=80",
        date: "12/01/2026",
        author: "Admin"
    },
    {
        id: 2,
        title: "Cách chọn Dâu Tây Hàn Quốc chuẩn ngon ngọt",
        desc: "Hướng dẫn chi tiết cách nhận biết dâu tây tươi, cuống xanh và không bị dập...",
        image: "https://images.unsplash.com/photo-1518635017498-87f514b751ba?auto=format&fit=crop&w=500&q=80",
        date: "10/01/2026",
        author: "Thảo Vy"
    },
    {
        id: 3,
        title: "5 loại trái cây giàu Vitamin C hơn cả cam",
        desc: "Khám phá những loại quả quen thuộc nhưng lại là 'kho báu' Vitamin C...",
        image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80",
        date: "08/01/2026",
        author: "Bác sĩ Dinh dưỡng"
    }
]);
</script>

<template>
    <div class="container py-5">
        <div class="text-center mb-5">
            <h2 class="fw-bold text-uppercase text-primary-blue">Tin Tức & Sự Kiện</h2>
            <p class="text-muted">Cập nhật những kiến thức dinh dưỡng và ưu đãi mới nhất</p>
        </div>

        <div class="row g-4">
            <div class="col-md-4" v-for="item in articles" :key="item.id">
                <div class="card h-100 border-0 shadow-sm hover-up">
                    <div class="overflow-hidden rounded-top">
                        <router-link :to="'/news/' + item.id">
                            <img :src="item.image" class="card-img-top object-fit-cover" :alt="item.title" style="height: 200px;">
                        </router-link>
                    </div>
                    <div class="card-body">
                        <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> {{ item.date }}</small>
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
    </div>
</template>

<style scoped>
.text-primary-blue { color: #007bff; }
.hover-up { transition: transform 0.3s; }
.hover-up:hover { transform: translateY(-5px); }
.hover-blue:hover { color: #007bff !important; }
.text-justify { text-align: justify; }
</style>