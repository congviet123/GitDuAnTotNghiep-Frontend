<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import Chart from 'chart.js/auto';

// ==========================================
// SHARED CONSTANTS
// ==========================================
const availableYears = ref(Array.from({length: 6}, (_, i) => (2023 + i).toString())); // 2023 -> 2028

// ==========================================
// 1. DOANH THU (Line Chart)
// ==========================================
const revYear = ref(new Date().getFullYear().toString());
const revMonth = ref('all');
const revenueChartInstance = ref(null);

const mockRevenue = {
    yearly: [50, 60, 70, 60, 50, 60, 70, 80, 90, 100, 110, 120], // 12 tháng
    monthly: [15, 20, 18, 25] // 4 tuần
};

const yearlyRevenueTotal = computed(() => {
    // Logic tính tổng tiền để hiển thị text
    let total = 0;
    if (revMonth.value === 'all') total = mockRevenue.yearly.reduce((a, b) => a + b, 0);
    else total = mockRevenue.monthly.reduce((a, b) => a + b, 0);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total * 1000000);
});

// ==========================================
// 2. SẢN PHẨM (Doughnut Chart)
// ==========================================
const prodYear = ref(new Date().getFullYear().toString());
const prodMonth = ref('all');
const bestSellingChartInstance = ref(null);
const slowSellingChartInstance = ref(null);

const mockProduct = {
    yearly: {
        best: { labels: ['Nho Xanh', 'Táo Envy', 'Cam Mỹ'], data: [3000, 2500, 1800] },
        slow: { labels: ['Chanh dây', 'Cóc', 'Khế'], data: [100, 80, 50] }
    },
    monthly: {
        best: { labels: ['Cherry', 'Dâu Tây', 'Kiwi'], data: [250, 180, 120] },
        slow: { labels: ['Chuối', 'Ổi', 'Xoài'], data: [15, 10, 5] }
    }
};

// ==========================================
// 3. ĐƠN HÀNG (Doughnut Chart)
// ==========================================
const orderYear = ref(new Date().getFullYear().toString());
const orderMonth = ref('all');
const orderChartInstance = ref(null);

const mockOrder = {
    yearly: { labels: ['Hoàn tất', 'Đã hủy'], data: [2500, 180] },
    monthly: { labels: ['Hoàn tất', 'Đã hủy'], data: [200, 15] }
};

// ==========================================
// 4. TIN TỨC (Pie Chart)
// ==========================================
const newsYear = ref(new Date().getFullYear().toString());
const newsMonth = ref('all');
const newsViewChartInstance = ref(null);
const newsLikeChartInstance = ref(null);

const mockNews = {
    yearly: {
        view: { labels: ['Sức khỏe 2025', 'Nông sản Việt', 'Nhập khẩu'], data: [15000, 10000, 8000] },
        like: { labels: ['Sức khỏe 2025', 'Nông sản Việt', 'Nhập khẩu'], data: [1200, 900, 500] }
    },
    monthly: {
        view: { labels: ['Món quà Tết', 'Trái cây mùa hè', 'Detox'], data: [1200, 800, 600] },
        like: { labels: ['Món quà Tết', 'Trái cây mùa hè', 'Detox'], data: [150, 80, 40] }
    }
};

// ==========================================
// RENDER FUNCTIONS
// ==========================================

const renderRevenueChart = () => {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    if (revenueChartInstance.value) revenueChartInstance.value.destroy();

    let labels, data;
    if (revMonth.value === 'all') {
        labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        data = mockRevenue.yearly;
    } else {
        labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        data = mockRevenue.monthly;
    }

    revenueChartInstance.value = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: `Doanh thu (Triệu VNĐ)`,
                data: data,
                backgroundColor: 'rgba(13, 110, 253, 0.2)',
                borderColor: '#0d6efd',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
};

const renderProductCharts = () => {
    // Determine data source based on Month filter
    const source = prodMonth.value === 'all' ? mockProduct.yearly : mockProduct.monthly;

    // Best Selling
    const ctxBest = document.getElementById('bestSellingChart');
    if (ctxBest) {
        if (bestSellingChartInstance.value) bestSellingChartInstance.value.destroy();
        bestSellingChartInstance.value = new Chart(ctxBest, {
            type: 'doughnut',
            data: {
                labels: source.best.labels,
                datasets: [{ 
                    data: source.best.data, 
                    backgroundColor: ['#198754', '#20c997', '#0dcaf0'], 
                    hoverOffset: 4 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    // Slow Selling
    const ctxSlow = document.getElementById('slowSellingChart');
    if (ctxSlow) {
        if (slowSellingChartInstance.value) slowSellingChartInstance.value.destroy();
        slowSellingChartInstance.value = new Chart(ctxSlow, {
            type: 'doughnut',
            data: {
                labels: source.slow.labels,
                datasets: [{ 
                    data: source.slow.data, 
                    backgroundColor: ['#dc3545', '#fd7e14', '#ffc107'], 
                    hoverOffset: 4 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }
};

const renderOrderChart = () => {
    const source = orderMonth.value === 'all' ? mockOrder.yearly : mockOrder.monthly;
    
    const ctxOrder = document.getElementById('orderChart');
    if (ctxOrder) {
        if (orderChartInstance.value) orderChartInstance.value.destroy();
        orderChartInstance.value = new Chart(ctxOrder, {
            type: 'doughnut',
            data: {
                labels: source.labels,
                datasets: [{ 
                    data: source.data, 
                    backgroundColor: ['#198754', '#dc3545'] // Xanh (OK) - Đỏ (Hủy)
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
        });
    }
};

const renderNewsCharts = () => {
    const source = newsMonth.value === 'all' ? mockNews.yearly : mockNews.monthly;

    // Views
    const ctxView = document.getElementById('newsViewChart');
    if (ctxView) {
        if (newsViewChartInstance.value) newsViewChartInstance.value.destroy();
        newsViewChartInstance.value = new Chart(ctxView, {
            type: 'pie',
            data: {
                labels: source.view.labels,
                datasets: [{ data: source.view.data, backgroundColor: ['#0d6efd', '#6610f2', '#6f42c1'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    // Likes
    const ctxLike = document.getElementById('newsLikeChart');
    if (ctxLike) {
        if (newsLikeChartInstance.value) newsLikeChartInstance.value.destroy();
        newsLikeChartInstance.value = new Chart(ctxLike, {
            type: 'pie',
            data: {
                labels: source.like.labels,
                datasets: [{ data: source.like.data, backgroundColor: ['#d63384', '#e83e8c', '#fd7e14'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }
};

// --- WATCHERS ---
watch([revYear, revMonth], renderRevenueChart);
watch([prodYear, prodMonth], renderProductCharts);
watch([orderYear, orderMonth], renderOrderChart);
watch([newsYear, newsMonth], renderNewsCharts);

// --- INIT ---
onMounted(() => {
    nextTick(() => {
        renderRevenueChart();
        renderProductCharts();
        renderOrderChart();
        renderNewsCharts();
    });
});
</script>

<template>
    <div class="container-fluid py-4">
        <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
            <h2 class="text-primary fw-bold m-0">Dashboard Quản trị</h2>
            <div class="text-muted small">Cập nhật lần cuối: Vừa xong</div>
        </div>

        <div class="card shadow-sm border-0 mb-5">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 class="mb-0 fw-bold text-primary"><i class="bi bi-graph-up-arrow me-2"></i>Doanh Thu</h5>
                
                <div class="d-flex align-items-center gap-2">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-light fw-bold">Năm</span>
                        <select class="form-select shadow-none" v-model="revYear" style="width: 80px;">
                            <option v-for="y in availableYears" :value="y" :key="y">{{ y }}</option>
                        </select>
                    </div>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-light fw-bold">Tháng</span>
                        <select class="form-select shadow-none" v-model="revMonth" style="width: 100px;">
                            <option value="all">Cả năm</option>
                            <option v-for="m in 12" :key="m" :value="m.toString()">Tháng {{ m }}</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="alert alert-primary mb-0 d-flex justify-content-between align-items-center">
                            <div>
                                <small class="text-uppercase d-block">Tổng thu (Đang chọn)</small>
                                <span class="fw-bold fs-4">{{ yearlyRevenueTotal }}</span>
                            </div>
                            <i class="bi bi-wallet2 fs-1 opacity-50"></i>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="alert alert-success mb-0 d-flex justify-content-between align-items-center">
                            <div>
                                <small class="text-uppercase d-block">Dự báo tháng tới</small>
                                <span class="fw-bold fs-4">150,000,000 ₫</span>
                            </div>
                            <i class="bi bi-graph-up fs-1 opacity-50"></i>
                        </div>
                    </div>
                </div>
                <div style="height: 350px;">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-5">
            <div class="col-xl-6">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h6 class="mb-0 fw-bold text-success"><i class="bi bi-box-seam me-2"></i>Sản phẩm</h6>
                        
                        <div class="d-flex gap-1">
                            <select class="form-select form-select-sm shadow-none" v-model="prodYear" style="width: 80px;">
                                <option v-for="y in availableYears" :value="y" :key="y">{{ y }}</option>
                            </select>
                            <select class="form-select form-select-sm shadow-none" v-model="prodMonth" style="width: 100px;">
                                <option value="all">Cả năm</option>
                                <option v-for="m in 12" :key="m" :value="m.toString()">T{{ m }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-md-6 mb-3">
                                <h6 class="small text-muted mb-3">Bán Chạy Nhất</h6>
                                <div style="height: 200px;"><canvas id="bestSellingChart"></canvas></div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <h6 class="small text-muted mb-3">Bán Chậm / Tồn Kho</h6>
                                <div style="height: 200px;"><canvas id="slowSellingChart"></canvas></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-6">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h6 class="mb-0 fw-bold text-warning"><i class="bi bi-receipt me-2"></i>Đơn hàng</h6>
                        
                        <div class="d-flex gap-1">
                            <select class="form-select form-select-sm shadow-none" v-model="orderYear" style="width: 80px;">
                                <option v-for="y in availableYears" :value="y" :key="y">{{ y }}</option>
                            </select>
                            <select class="form-select form-select-sm shadow-none" v-model="orderMonth" style="width: 100px;">
                                <option value="all">Cả năm</option>
                                <option v-for="m in 12" :key="m" :value="m.toString()">T{{ m }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column align-items-center justify-content-center">
                        <h6 class="small text-muted mb-3">Tỷ lệ Hoàn tất vs Đã hủy</h6>
                        <div style="height: 250px; width: 100%;">
                            <canvas id="orderChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card shadow-sm border-0">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h6 class="mb-0 fw-bold text-info"><i class="bi bi-newspaper me-2"></i>Tin tức & Bài báo</h6>
                
                <div class="d-flex gap-1">
                    <select class="form-select form-select-sm shadow-none" v-model="newsYear" style="width: 80px;">
                        <option v-for="y in availableYears" :value="y" :key="y">{{ y }}</option>
                    </select>
                    <select class="form-select form-select-sm shadow-none" v-model="newsMonth" style="width: 100px;">
                        <option value="all">Cả năm</option>
                        <option v-for="m in 12" :key="m" :value="m.toString()">T{{ m }}</option>
                    </select>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 mb-4 mb-md-0 border-end">
                        <h6 class="text-center small text-muted mb-3">Top Lượt Xem (Views)</h6>
                        <div style="height: 250px;"><canvas id="newsViewChart"></canvas></div>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-center small text-muted mb-3">Top Yêu Thích (Likes)</h6>
                        <div style="height: 250px;"><canvas id="newsLikeChart"></canvas></div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.card { transition: all 0.3s ease; }
.card:hover { box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
</style>