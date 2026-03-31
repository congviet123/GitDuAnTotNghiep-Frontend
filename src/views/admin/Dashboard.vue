<script setup>
// code mới của tuyến
import axios from 'axios';
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
const forecastRevenue = ref(0);
const totalRevenue = ref(0)

const mockRevenue = {
    yearly: [50, 60, 70, 60, 50, 60, 70, 80, 90, 100, 110, 120], // 12 tháng
    monthly: [15, 20, 18, 25] // 4 tuần
};


// code mơi của tuyến tính tổng doanh thu theo tháng 
// và năm
// const yearlyRevenueTotal = computed(() => {
//     if (revMonth.value === 'all') {
//         const total = (mockRevenue.yearly || [])
//             .reduce((a,b)=> a + Number(b || 0),0)
//         return new Intl.NumberFormat('vi-VN',{
//             style:'currency',
//             currency:'VND'
//         }).format(total)
//     } else {
//         const total = (mockRevenue.monthly || [])
//             .reduce((a,b)=> a + Number(b || 0),0)
//         return new Intl.NumberFormat('vi-VN',{
//             style:'currency',
//             currency:'VND'
//         }).format(total)
//     }

// })


const yearlyRevenueTotal = computed(() => {
    return new Intl.NumberFormat('vi-VN',{
        style:'currency',
        currency:'VND'
    }).format(totalRevenue.value)
})
// ==========================================
// 2. SẢN PHẨM (Doughnut Chart)
// ==========================================
const prodYear = ref(new Date().getFullYear().toString());
const prodMonth = ref('all');
const bestSellingChartInstance = ref(null);
const slowSellingChartInstance = ref(null);
// biến dữ liệu của tuyến
const productData = ref({
    best: { labels: [], data: [] },
    slow: { labels: [], data: [] }
})
const orderData = ref({
    labels: [],
    data: []
})

// ==========================================
// 3. ĐƠN HÀNG (Doughnut Chart)
// ==========================================
const orderYear = ref(new Date().getFullYear().toString());
const orderMonth = ref('all');
const orderChartInstance = ref(null);

const mockOrder = {
    yearly: { labels: ['Hoàn tất', 'Đã hoàn trả'], data: [2500, 180] },
    monthly: { labels: ['Hoàn tất', 'Đã hoàn trả'], data: [200, 15] }
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
        data = mockRevenue.yearly.map(v => Number(v));
    } else {
        labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        data = mockRevenue.monthly.map(v => Number(v));
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

    // ===== BÁN CHẠY =====
    const ctxBest = document.getElementById('bestSellingChart');
    if (ctxBest) {

        if (bestSellingChartInstance.value)
            bestSellingChartInstance.value.destroy();

        bestSellingChartInstance.value = new Chart(ctxBest, {
            type: 'doughnut',
            data: {
                labels: productData.value.best.labels,
                datasets: [{
                    data: productData.value.best.data,
                    backgroundColor: ['#198754', '#20c997', '#0dcaf0']
                }]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{ legend:{ position:'bottom' } }
            }
        });
    }

    // ===== TỒN KHO =====
    const ctxSlow = document.getElementById('slowSellingChart');
    if (ctxSlow) {

        if (slowSellingChartInstance.value)
            slowSellingChartInstance.value.destroy();

        slowSellingChartInstance.value = new Chart(ctxSlow, {
            type: 'doughnut',
            data: {
                labels: productData.value.slow.labels,
                datasets: [{
                    data: productData.value.slow.data,
                    backgroundColor: ['#dc3545','#fd7e14','#ffc107']
                }]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{ legend:{ position:'bottom' } }
            }
        });
    }
}

const renderOrderChart = () => {
    const source = orderData.value;
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

// code mới của tuyến 
const loadSalesData = async () => {
    const baseUrl = "http://localhost:8080/api/dashboard-sales"
    try{
        if(revMonth.value === "all"){
            const res = await axios.get(
                `${baseUrl}/revenue/${revYear.value}`
            )
            mockRevenue.yearly = res.data.monthlyRevenue || []
            forecastRevenue.value = res.data.forecast || 0
            totalRevenue.value = res.data.totalRevenue || 0
        }else{
            const res = await axios.get(
                `${baseUrl}/revenue/${revYear.value}/${revMonth.value}`
            )
            mockRevenue.monthly = res.data || []
            totalRevenue.value = mockRevenue.monthly.reduce((a,b)=>a+Number(b||0),0)
            forecastRevenue.value = 0
        }
        renderRevenueChart()
    }catch(e){
        console.error(e)
    }
}

const loadProductData = async () => {

    const baseUrl = "http://localhost:8080/api/dashboard-sales"

    try{
        const res = await axios.get(
            `${baseUrl}/products/${prodYear.value}/${prodMonth.value}`
        )
        const best = res.data.filter(i => i.type === "best")
        const slow = res.data.filter(i => i.type === "slow")
        productData.value.best.labels = best.map(i => i.name)
        productData.value.best.data = best.map(i => Number(i.value))
        productData.value.slow.labels = slow.map(i => i.name)
        productData.value.slow.data = slow.map(i => Number(i.value))
        renderProductCharts()
    }catch(e){
        console.error(e)
    }
}

// quản lý đơn 
const loadOrderData = async () => {

    const baseUrl = "http://localhost:8080/api/dashboard-sales"

    try{
        const res = await axios.get(
            `${baseUrl}/orders/${orderYear.value}/${orderMonth.value}`
        )

        orderData.value = {
            labels:['Hoàn tất','Đã hoàn tiền'],
            data:[
                res.data.completed || 0,
                res.data.refunded || 0
            ]
        }

        renderOrderChart()

    }catch(e){
        console.error(e)
    }
}




// --- WATCHERS ---       code mới của tuyến phần của thiện tự sửa thêm vào
watch([revYear,revMonth], loadSalesData);
// Các phần lọc theo tháng/năm của News thì giữ nguyên code cũ 
watch([prodYear, prodMonth], async ()=>{
    await loadProductData()
})
watch([orderYear, orderMonth], loadOrderData);



// --- INIT ---  code mới
onMounted(async () => {
    await loadSalesData()
    await loadProductData()
    await loadOrderData()
    nextTick(()=>{
        renderNewsCharts()
    })

})


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
                    <!-- <div class="col-md-6">
                        <div class="alert alert-success mb-0 d-flex justify-content-between align-items-center">
                            <div>
                                <small class="text-uppercase d-block">Dự báo tháng tới</small>
                                <span class="fw-bold fs-4">
                                    {{ new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(forecastRevenue) }}
                                </span>
                            </div>
                            <i class="bi bi-graph-up fs-1 opacity-50"></i>
                        </div>
                    </div> -->
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
                        <h6 class="small text-muted mb-3">Tỷ lệ Hoàn tất vs Đã hoàn trả</h6>
                        <div style="height: 250px; width: 100%;">
                            <canvas id="orderChart"></canvas>
                        </div>
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