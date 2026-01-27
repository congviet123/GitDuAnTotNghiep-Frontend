<script setup>
import { ref, onMounted, reactive, watch } from 'vue';
import apiClient from '@/services/api';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';

// --- STATE ---
const products = ref([]);
const categories = ref([]);
const isEdit = ref(false);
const loading = ref(false);
const selectedFile = ref(null);
const searchResultLabel = ref(''); // [MỚI] Biến lưu dòng thông báo kết quả tìm kiếm

// Cấu hình phân trang (Lấy nhiều để hiện hết)
const pageSize = ref(1000); 

// Bộ lọc
const filters = reactive({
    keyword: '',
    categoryId: '',
    minPrice: null,
    maxPrice: null,
    minQty: null,
    maxQty: null,
    minDiscount: null, // [MỚI] Thêm trường lọc giảm giá tối thiểu
    maxDiscount: null  // [MỚI] Thêm trường lọc giảm giá tối đa
});

// Form dữ liệu
const form = reactive({
    id: null, 
    name: '', 
    price: 0,           
    originalPrice: 0,   
    importPrice: 0,     
    discount: 0,        
    quantity: 0, 
    createDate: '',     
    isLiquidation: false, 
    description: '', 
    image: null, 
    available: true, 
    category: { id: null }
});

// --- HELPER FORMAT ---
const formatPrice = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const getImageUrl = (imgName) => {
    if (!imgName) return 'https://placehold.co/60x60?text=No+Img';
    if (imgName.startsWith('blob:')) return imgName;
    if (imgName.startsWith('imgs/')) return `http://localhost:8080/${imgName}`;
    return `http://localhost:8080/imgs/${imgName}`;
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
};

// Chuyển đổi ngày từ API (ISO) sang format input (yyyy-mm-dd)
const formatForInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
};

// --- LOGIC TÍNH GIÁ TỰ ĐỘNG ---
watch(
    () => [form.originalPrice, form.discount],
    ([newOriginal, newDiscount]) => {
        if (newOriginal >= 0 && newDiscount >= 0) {
            const finalPrice = newOriginal * (100 - newDiscount) / 100;
            form.price = Math.round(finalPrice);
        }
    }
);

// --- METHODS ---

const fetchData = async (showWarning = true) => {
    loading.value = true;
    try {
        const params = {
            page: 0, size: pageSize.value,
            keyword: filters.keyword || null,
            categoryId: filters.categoryId || null,
            minPrice: filters.minPrice || null,
            maxPrice: filters.maxPrice || null,
            minQty: filters.minQty || null,
            maxQty: filters.maxQty || null,
            minDiscount: filters.minDiscount || null, // [MỚI] Gửi tham số giảm giá lên server
            maxDiscount: filters.maxDiscount || null  // [MỚI] Gửi tham số giảm giá lên server
        };

        const [resProducts, resCategories] = await Promise.all([
            apiClient.get('/admin/products', { params }),
            apiClient.get('/admin/categories')
        ]);

        if (resProducts.data.content) {
            products.value = resProducts.data.content;
        } else {
            products.value = resProducts.data;
        }
        categories.value = resCategories.data;
        
        if (showWarning) checkLowStock(products.value);

    } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Không thể kết nối Server', 'error');
    } finally {
        loading.value = false;
    }
};

const checkLowStock = (list) => {
    const lowStockItems = list.filter(p => parseFloat(p.quantity) < 5 && p.available);
    if (lowStockItems.length > 0) {
        window.Toast.fire({
            icon: 'warning',
            title: `Cảnh báo: Có ${lowStockItems.length} sản phẩm sắp hết hàng (< 5kg)!`
        });
    }
};

// [MỚI] Logic Tìm kiếm: Tạo thông báo, Gọi API, Xóa input
const searchProducts = async () => {
    // 1. Tạo chuỗi thông báo kết quả dựa trên các bộ lọc hiện tại
    const parts = [];
    if (filters.keyword) parts.push(`Tên: "${filters.keyword}"`);
    if (filters.categoryId) {
        const cat = categories.value.find(c => c.id == filters.categoryId);
        if (cat) parts.push(`Danh mục: ${cat.name}`);
    }
    if (filters.minDiscount || filters.maxDiscount) {
        parts.push(`Giảm giá: ${filters.minDiscount || 0}% - ${filters.maxDiscount || 'max'}%`);
    }
    if (filters.minPrice || filters.maxPrice) {
        parts.push(`Giá: ${filters.minPrice || 0} - ${filters.maxPrice || 'max'}`);
    }
    if (filters.minQty || filters.maxQty) {
        parts.push(`Kho: ${filters.minQty || 0} - ${filters.maxQty || 'max'} kg`);
    }

    if (parts.length > 0) {
        searchResultLabel.value = `Kết quả tìm kiếm cho: ${parts.join(' | ')}`;
    } else {
        searchResultLabel.value = ''; 
    }

    // 2. Gọi API để lấy dữ liệu mới
    await fetchData(false);
    
    // 3. Xóa trắng các ô nhập liệu sau khi tìm kiếm xong
    filters.keyword = '';
    filters.categoryId = '';
    filters.minPrice = null;
    filters.maxPrice = null;
    filters.minQty = null;
    filters.maxQty = null;
    filters.minDiscount = null;
    filters.maxDiscount = null;
};

const resetFilters = () => {
    searchResultLabel.value = ''; // [MỚI] Xóa dòng thông báo kết quả
    Object.assign(filters, { 
        keyword: '', categoryId: '', 
        minPrice: null, maxPrice: null, 
        minQty: null, maxQty: null,
        minDiscount: null, maxDiscount: null 
    });
    fetchData(false);
};

const openModal = async (productId = null) => {
    selectedFile.value = null;
    
    Object.assign(form, {
        id: null, name: '', price: 0, quantity: 0, description: '', 
        image: null, available: true, isLiquidation: false,
        importPrice: 0, originalPrice: 0, discount: 0, createDate: '',
        category: { id: categories.value[0]?.id || null }
    });

    if (productId) {
        isEdit.value = true;
        try {
            const res = await apiClient.get(`/admin/products/${productId}`);
            Object.assign(form, res.data);
            
            if (res.data.createDate) {
                form.createDate = formatForInput(res.data.createDate);
            }
            
            if (!form.category) form.category = { id: categories.value[0]?.id };
        } catch (err) { return; }
    } else { 
        isEdit.value = false; 
    }
    
    const modalEl = document.getElementById('productModal');
    if(modalEl) new bootstrap.Modal(modalEl).show();
};

const onFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) { selectedFile.value = file; form.image = URL.createObjectURL(file); }
};

const saveProduct = async () => {
    const formData = new FormData();
    
    const productData = {
        id: form.id, 
        name: form.name, 
        price: parseFloat(form.price), 
        originalPrice: parseFloat(form.originalPrice || 0),
        importPrice: parseFloat(form.importPrice || 0),     
        discount: parseInt(form.discount || 0),             
        quantity: parseFloat(form.quantity),
        createDate: form.createDate ? form.createDate : null, 
        isLiquidation: form.isLiquidation, 
        description: form.description,
        available: form.available, 
        category: { id: form.category.id }
    };

    formData.append('product', new Blob([JSON.stringify(productData)], { type: 'application/json' }));
    if (selectedFile.value) formData.append('imageFile', selectedFile.value);

    try {
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        if (isEdit.value) {
            await apiClient.put(`/admin/products/${form.id}`, formData, config);
            window.Toast.fire({ icon: 'success', title: 'Cập nhật thành công!' });
        } else {
            await apiClient.post('/admin/products', formData, config);
            window.Toast.fire({ icon: 'success', title: 'Thêm mới thành công!' });
        }
        
        fetchData(false);
        const modalEl = document.getElementById('productModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();

    } catch (err) { 
        console.error("Lỗi API:", err);
        let errorMsg = 'Lỗi lưu dữ liệu';
        if (err.response && err.response.data) {
            if (typeof err.response.data === 'string') {
                errorMsg = err.response.data;
            } else {
                errorMsg = err.response.data.message || JSON.stringify(err.response.data);
            }
        }
        Swal.fire('Lỗi', errorMsg, 'error'); 
    }
};

const deleteProduct = async (item) => {
    if (item.quantity > 0 && !item.isLiquidation) {
        Swal.fire({ 
            icon: 'warning', title: 'Không thể xóa!', 
            html: `Sản phẩm còn <b>${item.quantity} kg</b>.<br>Cần chuyển sang "Hàng thanh lý" hoặc cập nhật kho về 0.` 
        });
        return;
    }
    const result = await Swal.fire({
        title: 'Xác nhận xóa?',
        html: item.quantity > 0 ? `Hàng thanh lý (còn ${item.quantity}kg). Xóa?` : `Sản phẩm đã hết hàng. Xóa?`,
        icon: 'warning', showCancelButton: true, confirmButtonText: 'Xóa ngay', confirmButtonColor: '#d33'
    });
    if (result.isConfirmed) {
        try {
            await apiClient.delete(`/admin/products/${item.id}`);
            products.value = products.value.filter(p => p.id !== item.id);
            window.Toast.fire({ icon: 'success', title: 'Đã xóa!' });
        } catch (err) { 
            console.error(err);
            const errorMsg = typeof err.response?.data === 'string' ? err.response?.data : 'Lỗi xóa sản phẩm';
            Swal.fire('Lỗi', errorMsg, 'error'); 
        }
    }
};

onMounted(() => fetchData(true));
</script>

<template>
  <div class="container-fluid py-4">
    <h1 class="mb-4 text-primary fw-bold border-bottom pb-2">Quản lý Kho Hàng</h1>

    <div class="card border-0 shadow-sm mb-4 bg-white">
        <div class="card-body">
            <h6 class="fw-bold text-muted mb-3"><i class="bi bi-funnel"></i> Bộ lọc tìm kiếm</h6>
            <div class="row g-3">
                <div class="col-lg-3 col-md-6">
                    <label class="form-label small fw-bold">Tên sản phẩm</label>
                    <input type="text" class="form-control" v-model="filters.keyword" placeholder="Nhập tên..." @keyup.enter="searchProducts">
                </div>
                <div class="col-lg-2 col-md-6">
                    <label class="form-label small fw-bold">Danh mục</label>
                    <select class="form-select" v-model="filters.categoryId">
                        <option value="">-- Tất cả --</option>
                        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                    </select>
                </div>
                
                <div class="col-lg-2 col-md-6">
                    <label class="form-label small fw-bold">% Giảm giá</label>
                    <div class="input-group">
                        <input type="number" class="form-control" v-model="filters.minDiscount" placeholder="Từ" @keyup.enter="searchProducts">
                        <span class="input-group-text bg-white border-start-0 border-end-0">-</span>
                        <input type="number" class="form-control" v-model="filters.maxDiscount" placeholder="Đến" @keyup.enter="searchProducts">
                    </div>
                </div>

                <div class="col-lg-3 col-md-6">
                    <label class="form-label small fw-bold">Khoảng giá (VNĐ)</label>
                    <div class="input-group">
                        <input type="number" class="form-control" v-model="filters.minPrice" placeholder="Min" @keyup.enter="searchProducts">
                        <span class="input-group-text bg-white border-start-0 border-end-0">-</span>
                        <input type="number" class="form-control" v-model="filters.maxPrice" placeholder="Max" @keyup.enter="searchProducts">
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                    <label class="form-label small fw-bold">Tồn kho (Kg)</label>
                    <div class="input-group">
                        <input type="number" class="form-control" v-model="filters.minQty" placeholder="Từ" step="0.1" @keyup.enter="searchProducts">
                        <span class="input-group-text bg-white border-start-0 border-end-0">-</span>
                        <input type="number" class="form-control" v-model="filters.maxQty" placeholder="Đến" step="0.1" @keyup.enter="searchProducts">
                    </div>
                </div>
            </div>
            
            <div class="mt-3 d-flex justify-content-between align-items-center">
                <div class="text-primary fw-bold fst-italic">
                    <span v-if="searchResultLabel"><i class="bi bi-info-circle me-1"></i> {{ searchResultLabel }}</span>
                </div>

                <div>
                    <button class="btn btn-secondary me-2" @click="resetFilters"><i class="bi bi-arrow-counterclockwise"></i> Reset</button>
                    <button class="btn btn-primary" @click="searchProducts"><i class="bi bi-search"></i> Tìm kiếm</button>
                </div>
            </div>
        </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="fs-5 text-muted">Tổng số sản phẩm: <span class="fw-bold text-dark">{{ products.length }}</span></h2>
      <button class="btn btn-success px-4 fw-bold shadow-sm" @click="openModal()"><i class="bi bi-plus-lg me-1"></i> Nhập hàng</button>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else class="table-responsive shadow-sm rounded border bg-white" style="max-height: 70vh; overflow-y: auto;">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-dark sticky-top">
          <tr>
            <th class="ps-3">ID</th>
            <th>Ảnh</th>
            <th>Tên sản phẩm</th>
            <th>Giá bán</th>
            <th>Giảm giá</th> 
            <th>Tồn kho (kg)</th>
            <th>Ngày nhập</th>
            <th>Trạng thái</th>
            <th class="text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td class="ps-3 fw-bold">#{{ p.id }}</td>
            <td><img :src="getImageUrl(p.image)" width="50" height="50" class="img-thumbnail object-fit-contain bg-light"></td>
            <td>
                <div class="fw-bold">{{ p.name }}</div>
                <small class="text-muted">{{ p.category?.name }}</small>
            </td>
            <td>
                <div v-if="p.discount > 0" class="text-decoration-line-through text-muted small">
                    {{ formatPrice(p.originalPrice) }}
                </div>
                <div class="text-danger fw-bold">{{ formatPrice(p.price) }}</div>
            </td>
            <td>
                <span v-if="p.discount > 0" class="badge bg-danger">-{{ p.discount }}%</span>
                <span v-else class="text-muted small">--</span>
            </td>
            <td>
                <span class="fw-bold" :class="{'text-danger': p.quantity < 5, 'text-success': p.quantity >= 5}">{{ p.quantity }}</span>
                <i v-if="p.quantity < 5" class="bi bi-exclamation-triangle-fill text-warning ms-1"></i>
            </td>
            <td><small>{{ formatDate(p.createDate) }}</small></td>
            <td>
               <span class="badge rounded-pill" :class="p.available ? 'bg-success' : 'bg-secondary'">{{ p.available ? 'Kinh doanh' : 'Ngừng bán' }}</span>
               <div v-if="p.isLiquidation" class="badge bg-warning text-dark mt-1">Thanh lý</div>
            </td>
            <td class="text-center">
              <button class="btn btn-outline-primary btn-sm me-2" @click="openModal(p.id)"><i class="bi bi-pencil-square"></i></button>
              <button class="btn btn-outline-danger btn-sm" @click="deleteProduct(p)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal fade" id="productModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold">{{ isEdit ? 'Cập nhật kho' : 'Nhập hàng mới' }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <form @submit.prevent="saveProduct">
              <div class="row">
                  <div class="col-md-6 border-end">
                      <div class="mb-3">
                        <label class="form-label fw-bold">Tên sản phẩm</label>
                        <input type="text" class="form-control" v-model="form.name" required>
                      </div>
                      
                      <div class="row bg-light p-2 rounded mb-3 border mx-0">
                          <div class="col-12 mb-2 text-primary fw-bold small text-uppercase">Quản lý nhập kho & Giá</div>
                          
                          <div class="col-md-6 mb-2">
                            <label class="form-label small fw-bold">Giá nhập (Vốn)</label>
                            <input type="number" class="form-control" v-model="form.importPrice" min="0">
                          </div>
                          <div class="col-md-6 mb-2">
                            <label class="form-label small fw-bold">Số lượng (Kg) *</label>
                            <input type="number" step="0.1" class="form-control border-primary" v-model="form.quantity" required min="0">
                          </div>

                          <div class="col-12 mb-2">
                              <label class="form-label small fw-bold">Ngày nhập kho</label>
                              <input type="date" class="form-control" v-model="form.createDate">
                              <div class="form-text small">Để trống sẽ lấy ngày hôm nay</div>
                          </div>
                      </div>

                      <div class="row bg-light p-2 rounded mb-3 border mx-0">
                          <div class="col-12 mb-2 text-success fw-bold small text-uppercase">Thiết lập giá bán</div>
                          
                          <div class="col-md-4 mb-2">
                            <label class="form-label small fw-bold">Giá niêm yết</label>
                            <input type="number" class="form-control" v-model="form.originalPrice" placeholder="VD: 100000" min="0">
                          </div>
                          <div class="col-md-4 mb-2">
                            <label class="form-label small fw-bold">Giảm giá (%)</label>
                            <select class="form-select" v-model="form.discount">
                                <option :value="0">0%</option>
                                <option :value="10">10%</option>
                                <option :value="20">20%</option>
                                <option :value="30">30%</option>
                                <option :value="50">50%</option>
                            </select>
                          </div>
                          <div class="col-md-4 mb-2">
                            <label class="form-label small fw-bold">Giá bán ra</label>
                            <input type="number" class="form-control bg-white text-danger fw-bold" v-model="form.price" readonly>
                            <small class="text-muted" style="font-size: 0.7rem;">Tự động tính</small>
                          </div>
                      </div>

                      <div class="mb-3">
                        <label class="form-label fw-bold">Danh mục</label>
                        <select class="form-select" v-model="form.category.id" required>
                          <option v-for="c in categories" :value="c.id" :key="c.id">{{ c.name }}</option>
                        </select>
                      </div>
                  </div>

                  <div class="col-md-6 ps-4">
                      <div class="mb-3">
                        <label class="form-label fw-bold">Ảnh sản phẩm</label>
                        <input type="file" class="form-control" @change="onFileSelected" accept="image/*">
                        <div class="mt-2 text-center border p-2 bg-light rounded">
                          <img :src="getImageUrl(form.image)" style="max-height: 200px; object-fit: contain;">
                        </div>
                      </div>
                      <div class="mb-3">
                          <label class="form-label fw-bold">Mô tả</label>
                          <textarea class="form-control" v-model="form.description" rows="4"></textarea>
                      </div>
                      
                      <div class="d-flex gap-4 mt-3 p-3 bg-light rounded border">
                          <div class="form-check form-switch">
                              <input class="form-check-input" type="checkbox" v-model="form.available" id="avail">
                              <label class="form-check-label" for="avail">Đang kinh doanh</label>
                          </div>
                          <div class="form-check form-switch">
                              <input class="form-check-input" type="checkbox" v-model="form.isLiquidation" id="liquid">
                              <label class="form-check-label text-warning fw-bold" for="liquid">Hàng thanh lý</label>
                          </div>
                      </div>
                  </div>
              </div>
              <div class="modal-footer border-0 pb-0 px-0">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                <button type="submit" class="btn btn-primary fw-bold px-4">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>