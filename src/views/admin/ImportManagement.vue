<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';
import importService from "@/services/importService";
import axios from "axios";
import supplierService from "@/services/supplierService";
import productService from "@/services/productService";

// --- STATE ---
const imports = ref([]);
const products = ref([]);
const suppliers = ref([]);
const importModal = ref(null);
const detailModal = ref(null);

// --- SEARCH STATE ---
const filters = reactive({
    keyword: '',
    startDate: '',
    endDate: ''
});

// --- FORM TẠO PHIẾU NHẬP MỚI ---
const form = reactive({
    supplier_id: '',
    account_username: 'Admin',
    notes: '',
    details: []
});

const selectedImport = ref(null);

// móc dữ liệu
onMounted(async () => {
    const importModalEl = document.getElementById('importModal');
    const detailModalEl = document.getElementById('detailModal');

    if (importModalEl) {
        importModal.value = new bootstrap.Modal(importModalEl);
    }

    if (detailModalEl) {
        detailModal.value = new bootstrap.Modal(detailModalEl);
    }

    loadImports();
    suppliers.value = (await supplierService.getAll()).data;
    products.value = (await productService.getAll()).data;
});
    
    //                                code mới của tuyến 
        const loadImports = async () => {
        const res = await importService.getAll({
            keyword: filters.keyword || null,
            startDate: filters.startDate || null,
            endDate: filters.endDate || null
        });
        imports.value = res.data;
    };

//                                           code mới của tuyến
watch(filters, () => {
    loadImports();
}, { deep: true });

const resetFilters = () => {
    filters.keyword = '';
    filters.startDate = '';
    filters.endDate = '';
};

// --- LOGIC TÍNH TOÁN ---
const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

const formTotalAmount = computed(() => {
    if (!form.details) return 0;
    return form.details.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
});

// --- ACTIONS FORM ---
import { nextTick } from 'vue';

const openCreateModal = async () => {
    form.supplier_id = '';
    form.notes = '';
    form.details = [{ product_id: '', quantity: 1, unit_price: 0 }];

    await nextTick();

    const modalEl = document.getElementById('importModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
};

const addDetailRow = () => {
    form.details.push({ product_id: '', quantity: 1, unit_price: 0 });
};

const removeDetailRow = (index) => {
    if (form.details.length > 1) form.details.splice(index, 1);
};

   //                                              save import code mới của tuyến
   const saveImport = async () => {
    try {
        const payload = {
            supplierId: Number(form.supplier_id),
            accountUsername: form.account_username,
            notes: form.notes,
            totalAmount: formTotalAmount.value,
            details: form.details.map(d => ({
            productId: Number(d.product_id),
            quantity: Number(d.quantity),
            unitPrice: Number(d.unit_price)
            }))
        };

        await importService.create(payload);
        
        Swal.fire("Thành công", "Đã lưu phiếu nhập!", "success");
        importModal.value.hide();
        await loadImports();
    } catch (e) {
        Swal.fire("Lỗi", "Không thể lưu phiếu nhập", "error");
    }
};

//                                    code mới của tuyến
    const viewDetail = async (item) => {
    const res = await importService.getById(item.id);
    selectedImport.value = res.data;
    detailModal.value.show();
};

</script>

<template>
    <div class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-primary fw-bold">Quản lý Nhập Hàng</h2>
            <button class="btn btn-success shadow-sm fw-bold" @click="openCreateModal()">
                <i class="bi bi-plus-circle me-2"></i> Tạo Phiếu Nhập
            </button>
        </div>

        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label small fw-bold text-muted">Từ khóa</label>
                        <div class="input-group">
                            <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-secondary"></i></span>
                            <input type="text" class="form-control border-start-0 ps-0" 
                                   v-model="filters.keyword" 
                                   placeholder="Tìm mã phiếu, NCC, nhân viên...">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small fw-bold text-muted">Từ ngày</label>
                        <input type="date" class="form-control" v-model="filters.startDate">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small fw-bold text-muted">Đến ngày</label>
                        <input type="date" class="form-control" v-model="filters.endDate">
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-outline-secondary w-100" @click="resetFilters">
                            <i class="bi bi-arrow-counterclockwise me-1"></i> Đặt lại
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card border-0 shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Mã phiếu</th>
                            <th>Ngày nhập</th>
                            <th>Nhà cung cấp</th>
                            <th>Nhân viên</th>
                            <th>Tổng tiền</th>
                            <th class="text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
  <tr v-for="item in imports" :key="item.id">
    <td>
      #PN{{ item.id }}
    </td>

    <td>
      {{ item.importDate 
          ? new Date(item.importDate).toLocaleDateString('vi-VN') 
          : '' }}
    </td>

    <td>
      NCC #{{ item.supplierId }}
    </td>

    <td>
      {{ item.accountUsername }}
    </td>

    <td>
      {{ item.totalAmount 
          ? Number(item.totalAmount).toLocaleString('vi-VN') + ' đ' 
          : '0 đ' }}
    </td>

    <td>
      <button class="btn btn-info btn-sm">
        Chi tiết
      </button>
    </td>
  </tr>
</tbody>
                </table>
            </div>
        </div>

        <div class="modal fade" id="importModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title fw-bold"><i class="bi bi-cart-plus me-2"></i>Tạo Phiếu Nhập Kho</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body bg-light">
                        <form @submit.prevent="saveImport">
                            <div class="card border-0 shadow-sm mb-3">
                                <div class="card-body">
                                    <h6 class="fw-bold text-success border-bottom pb-2 mb-3">Thông tin chung</h6>
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <label class="form-label fw-bold small text-muted">Nhà cung cấp <span class="text-danger">*</span></label>
                                            <select class="form-select" v-model="form.supplier_id" required>
                                                <option value="" disabled>-- Chọn NCC --</option>
                                                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
                                            </select>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label fw-bold small text-muted">Nhân viên nhập</label>
                                            <input type="text" class="form-control" v-model="form.account_username" readonly>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label fw-bold small text-muted">Ghi chú</label>
                                            <input type="text" class="form-control" v-model="form.notes" placeholder="VD: Nhập hàng đợt 1">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="card border-0 shadow-sm">
                                <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                                    <h6 class="mb-0 fw-bold text-success">Danh sách sản phẩm</h6>
                                    <button type="button" class="btn btn-sm btn-primary" @click="addDetailRow">
                                        <i class="bi bi-plus-lg me-1"></i> Thêm dòng
                                    </button>
                                </div>
                                <div class="card-body p-0">
                                    <div class="table-responsive">
                                        <table class="table table-bordered mb-0">
                                            <thead class="table-light text-center">
                                                <tr>
                                                    <th style="width: 35%;">Sản phẩm <span class="text-danger">*</span></th>
                                                    <th style="width: 15%;">Số lượng <span class="text-danger">*</span></th>
                                                    <th style="width: 20%;">Giá vốn (VNĐ) <span class="text-danger">*</span></th>
                                                    <th style="width: 20%;">Thành tiền</th>
                                                    <th style="width: 10%;">Xóa</th>
                                                </tr>
                                            </thead>
                                            <tbody class="align-middle">
                                                <tr v-for="(detail, index) in form.details" :key="index">
                                                    <td>
                                                        <select class="form-select form-select-sm" v-model="detail.product_id" required>
                                                            <option value="" disabled>-- Chọn SP --</option>
                                                            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.unit }})</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input type="number" class="form-control form-control-sm text-center" v-model="detail.quantity" min="1" placeholder="1" required>
                                                    </td>
                                                    <td>
                                                        <input type="number" class="form-control form-control-sm text-end" v-model="detail.unit_price" min="0" step="1000" placeholder="0" required>
                                                    </td>
                                                    <td class="fw-bold text-end pe-3 text-success">
                                                        {{ formatCurrency(detail.quantity * detail.unit_price) }}
                                                    </td>
                                                    <td class="text-center">
                                                        <button type="button" class="btn btn-sm text-danger" @click="removeDetailRow(index)">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                                <tr v-if="form.details.length === 0">
                                                    <td colspan="5" class="text-center text-muted py-3">Chưa có sản phẩm nào. Vui lòng bấm "Thêm dòng".</td>
                                                </tr>
                                            </tbody>
                                            <tfoot class="table-light">
                                                <tr>
                                                    <td colspan="3" class="text-end fw-bold text-uppercase pt-3 pe-3">Tổng tiền thanh toán:</td>
                                                    <td class="text-end fw-bold text-danger fs-5">{{ formatCurrency(formTotalAmount) }}</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div class="text-end mt-4">
                                <button type="button" class="btn btn-secondary me-2 px-4" data-bs-dismiss="modal">Hủy bỏ</button>
                                <button type="submit" class="btn btn-success px-4 fw-bold">
                                    <i class="bi bi-save me-2"></i> Hoàn tất nhập hàng
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="detailModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content" v-if="selectedImport">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title fw-bold">Chi tiết phiếu nhập #PN{{ selectedImport.id }}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4 border-bottom pb-3">
                            <div class="col-md-6">
                                <p class="mb-1 text-muted small">Nhà cung cấp:</p>
                                <h6 class="fw-bold">{{ selectedImport.supplier_name }}</h6>
                            </div>
                            <div class="col-md-6 text-md-end">
                                <p class="mb-1 text-muted small">Thời gian nhập:</p>
                                <h6 class="fw-bold">{{ selectedImport.import_date }}</h6>
                            </div>
                            <div class="col-12 mt-2">
                                <p class="mb-1 text-muted small">Ghi chú:</p>
                                <span class="fst-italic">{{ selectedImport.notes || 'Không có ghi chú' }}</span>
                            </div>
                        </div>
                        <table class="table table-striped table-bordered">
                            <thead class="table-light text-center">
                                <tr>
                                    <th>STT</th>
                                    <th>Sản phẩm</th>
                                    <th>SL</th>
                                    <th>Đơn giá</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(d, i) in selectedImport.details" :key="i">
                                    <td class="text-center">{{ i + 1 }}</td>
                                    <td>{{ d.product_name }}</td>
                                    <td class="text-center">{{ d.quantity }}</td>
                                    <td class="text-end">{{ formatCurrency(d.unit_price) }}</td>
                                    <td class="text-end fw-bold">{{ formatCurrency(d.total) }}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="4" class="text-end fw-bold pt-3">TỔNG CỘNG</td>
                                    <td class="text-end fw-bold text-danger fs-5">{{ formatCurrency(selectedImport.total_amount) }}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>