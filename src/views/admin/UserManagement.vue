<script setup>
import { ref, onMounted, reactive } from 'vue';
import apiClient from '@/services/api'; 
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';

// --- STATE ---
const users = ref([]);
const roles = ref([]);
const loading = ref(false); 
const isEdit = ref(false);
let userModal = null;

const form = reactive({
    username: '', password: '', fullname: '', email: '', 
    phone: '', enabled: true, role: { id: null },
    addresses: [] // Đổi từ String sang Mảng để chứa nhiều địa chỉ
});

// --- METHODS ---

const fetchRoles = async () => {
    try { roles.value = (await apiClient.get('/admin/roles')).data; } catch (e) {}
};

const fetchUsers = async () => {
    loading.value = true;
    try { users.value = (await apiClient.get('/admin/users')).data; } 
    catch (err) { Swal.fire('Lỗi', 'Không thể tải danh sách.', 'error'); } 
    finally { loading.value = false; }
};

/// [ĐÃ SỬA] Hàm trích xuất địa chỉ chống lỗi "undefined"
const getDefaultAddress = (addresses) => {
    if (!addresses || addresses.length === 0) return '-';
    
    // Tìm địa chỉ có isDefault = true, nếu không có thì lấy cái đầu tiên
    const target = addresses.find(a => a.isDefault === true) || addresses[0];
    
    // Gom các thành phần địa chỉ lại. 
    // Dùng || để bắt dự phòng (nếu bạn dùng biến detail thay vì street ở backend)
    const parts = [
        target.street || target.detail || target.specificAddress, 
        target.ward, 
        target.district, 
        target.city || target.province
    ];

    // .filter(Boolean) sẽ tự động xóa sạch mọi chữ undefined, null, hoặc rỗng
    // .join(', ') sẽ nối các chữ còn lại thành 1 chuỗi hoàn chỉnh
    const cleanAddress = parts.filter(Boolean).join(', ');

    return cleanAddress || '-';
};

const openModal = (user = null) => {
    if (user) {
        isEdit.value = true;
        apiClient.get(`/admin/users/${user.username}`).then(res => {
            const d = res.data;
            form.username = d.username;
            form.password = ''; 
            form.fullname = d.fullname;
            form.email = d.email;
            form.phone = d.phone;
            form.enabled = d.enabled;
            form.role = { id: d.role ? d.role.id : roles.value[0]?.id };
            // Lưu toàn bộ mảng địa chỉ vào form
            form.addresses = d.addresses || []; 
            userModal.show();
        });
    } else {
        isEdit.value = false;
        Object.assign(form, {
            username: '', password: '', fullname: '', email: '', 
            phone: '', enabled: true, addresses: [],
            role: { id: roles.value.find(r => r.name === 'ROLE_USER')?.id || null }
        });
        userModal.show();
    }
};

const saveUser = async () => {
    Swal.fire({
        title: 'Đang xử lý...',
        text: 'Hệ thống đang cập nhật và gửi email thông báo. Vui lòng chờ...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => { Swal.showLoading(); }
    });

    loading.value = true;

    try {
        // Tránh gửi mảng addresses ngược lại Backend nếu API không hỗ trợ update Sổ địa chỉ qua User
        const { addresses, ...payload } = form; 
        
        if (isEdit.value) {
            const oldUser = users.value.find(u => u.username === form.username);
            const wasEnabled = oldUser ? oldUser.enabled : true;
            const isNowEnabled = form.enabled;

            await apiClient.put(`/admin/users/${form.username}`, payload);
            Swal.close(); 

            if (wasEnabled && !isNowEnabled) {
                await Swal.fire({ title: 'Khóa tài khoản thành công', text: 'Đã gửi thông báo khóa tài khoản qua gmail.', icon: 'success' });
            } else if (!wasEnabled && isNowEnabled) {
                await Swal.fire({ title: 'Mở khóa thành công', text: 'Đã gửi email thông báo mở lại tài khoản.', icon: 'success' });
            } else {
                await Swal.fire('Thành công', 'Cập nhật thông tin thành công!', 'success');
            }
        } else {
            await apiClient.post('/admin/users', payload);
            Swal.close(); 
            await Swal.fire('Thành công', 'Đã thêm tài khoản mới!', 'success');
        }
        
        userModal.hide();
        fetchUsers(); 
        
    } catch (err) {
        Swal.close(); 
        const msg = err.response?.data?.message || err.response?.data || 'Có lỗi xảy ra.';
        Swal.fire('Thất bại', typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    } finally {
        loading.value = false;
    }
};

const deleteUser = async (username) => {
    const r = await Swal.fire({
        title: 'Xác nhận xóa?', text: `Xóa user: ${username}?`, icon: 'warning',
        showCancelButton: true, confirmButtonText: 'Xóa ngay', cancelButtonText: 'Hủy'
    });

    if (r.isConfirmed) {
        Swal.fire({ title: 'Đang xóa...', didOpen: () => Swal.showLoading() });
        try {
            await apiClient.delete(`/admin/users/${username}`);
            users.value = users.value.filter(u => u.username !== username);
            Swal.fire('Đã xóa', '', 'success');
        } catch (err) {
            Swal.fire('Lỗi', 'User đã có đơn hàng. Vui lòng KHÓA tài khoản.', 'error');
        }
    }
};

onMounted(async () => {
    await fetchRoles();
    await fetchUsers();
    userModal = new bootstrap.Modal(document.getElementById('userModal'));
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="text-primary fw-bold mb-0">Quản lý Người dùng</h2>
        <button class="btn btn-success shadow-sm px-4 fw-bold" @click="openModal()">
            <i class="bi bi-person-plus-fill me-1"></i> Thêm người dùng
        </button>
    </div>

    <div v-if="loading && users.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <p class="mt-2 text-muted">Đang tải dữ liệu...</p>
    </div>

    <div v-else class="card shadow-sm border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th class="ps-3">Tài khoản</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>SĐT</th> <th>Địa chỉ mặc định</th> <th>Vai trò</th>
              <th>Trạng thái</th> <th class="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.username">
              <td class="ps-3 fw-bold">{{ u.username }}</td>
              <td>{{ u.fullname }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.phone || '-' }}</td>
              <td :title="getDefaultAddress(u.addresses)">
                  <div class="text-truncate" style="max-width: 250px;">{{ getDefaultAddress(u.addresses) }}</div>
              </td>
              <td>
                <span class="badge rounded-pill px-3 py-2" 
                      :class="{
                          'bg-danger': u.roleName === 'ROLE_ADMIN',
                          'bg-primary': u.roleName === 'ROLE_USER',
                          'bg-info text-dark': u.roleName === 'ROLE_STAFF',
                          'bg-warning text-dark': u.roleName === 'ROLE_SHIPPER'
                      }">
                  {{ u.roleName?.replace('ROLE_', '') }}
                </span>
              </td>
              <td>
                  <span v-if="u.enabled" class="badge bg-success-subtle text-success border border-success">Hoạt động</span>
                  <span v-else class="badge bg-danger-subtle text-danger border border-danger">Đã khóa</span>
              </td>
              <td class="text-center">
                <button class="btn btn-primary btn-sm me-1" @click="openModal(u)"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-danger btn-sm" @click="deleteUser(u.username)"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal fade" id="userModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-xl modal-dialog-centered"> <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold">{{ isEdit ? 'Cập nhật thông tin' : 'Thêm tài khoản mới' }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" :disabled="loading"></button>
          </div>
          <div class="modal-body p-4">
            <form @submit.prevent="saveUser">
              <div class="row">
                  <div class="col-md-6 border-end pe-4">
                      <h6 class="text-primary fw-bold text-uppercase mb-3"><i class="bi bi-person-lines-fill me-2"></i>Thông tin cơ bản</h6>
                      <div class="row g-3">
                          <div class="col-12">
                            <label class="form-label fw-bold small">Tên đăng nhập <span class="text-danger">*</span></label>
                            <input type="text" class="form-control bg-light" v-model="form.username" :disabled="isEdit" required>
                          </div>
                          <div class="col-12">
                            <label class="form-label fw-bold small">Mật khẩu <span v-if="!isEdit" class="text-danger">*</span></label>
                            <input type="password" class="form-control" v-model="form.password" :required="!isEdit" placeholder="Để trống nếu không đổi">
                          </div>
                          <div class="col-12">
                            <label class="form-label fw-bold small">Họ tên <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" v-model="form.fullname" required>
                          </div>
                          <div class="col-12">
                            <label class="form-label fw-bold small">Email <span class="text-danger">*</span></label>
                            <input type="email" class="form-control" v-model="form.email" required>
                          </div>
                          <div class="col-12">
                            <label class="form-label fw-bold small">SĐT Đăng ký</label>
                            <input type="text" class="form-control" v-model="form.phone">
                          </div>
                          <div class="col-md-6">
                            <label class="form-label fw-bold small">Vai trò <span class="text-danger">*</span></label>
                            <select class="form-select border-primary" v-model="form.role.id" required>
                              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name.replace('ROLE_', '') }}</option>
                            </select>
                          </div>
                          <div class="col-md-6 d-flex align-items-end mb-1">
                              <div class="form-check form-switch p-2 border rounded bg-light w-100">
                                  <input class="form-check-input ms-1 me-2" type="checkbox" id="enabledSwitch" v-model="form.enabled">
                                  <label class="form-check-label fw-bold small" :class="form.enabled ? 'text-success' : 'text-danger'" for="enabledSwitch">
                                      {{ form.enabled ? 'Đang hoạt động' : 'Tài khoản bị khóa' }}
                                  </label>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div class="col-md-6 ps-4">
                      <h6 class="text-success fw-bold text-uppercase mb-3"><i class="bi bi-journal-bookmark-fill me-2"></i>Sổ địa chỉ giao hàng</h6>
                      
                      <div v-if="!isEdit" class="alert alert-info small">
                          <i class="bi bi-info-circle me-1"></i> Sổ địa chỉ chỉ hiển thị khi xem thông tin tài khoản đã tồn tại.
                      </div>
                      
                      <div v-else>
                          <div v-if="form.addresses && form.addresses.length > 0" class="address-list-container pe-2" style="max-height: 450px; overflow-y: auto;">
                              <div v-for="(addr, index) in form.addresses" :key="addr.id" 
                                   class="card mb-3 border" 
                                   :class="addr.isDefault ? 'border-success bg-success-subtle shadow-sm' : 'border-secondary bg-light'">
                                  <div class="card-body p-3 position-relative">
                                      <span v-if="addr.isDefault" class="badge bg-success position-absolute top-0 end-0 m-2"><i class="bi bi-check-circle"></i> Mặc định</span>
                                      
                                      <div class="fw-bold text-dark mb-1"><i class="bi bi-person me-1"></i> {{ addr.fullname || form.fullname }}</div>
                                      <div class="small text-muted mb-2"><i class="bi bi-telephone me-1"></i> {{ addr.phone || form.phone }}</div>
                                      
                                     <div class="small lh-sm mt-2 pt-2 border-top">
    <strong v-if="addr.street || addr.detail">{{ addr.street || addr.detail }}</strong>
    <br v-if="addr.street || addr.detail">
    {{ [addr.ward, addr.district, addr.province || addr.city].filter(Boolean).join(', ') }}
</div>
                                  </div>
                              </div>
                          </div>
                          
                          <div v-else class="text-center py-5 bg-light rounded border border-dashed">
                              <i class="bi bi-geo-alt text-muted" style="font-size: 2rem;"></i>
                              <p class="text-muted mt-2 mb-0 small">Người dùng này chưa thiết lập địa chỉ giao hàng nào.</p>
                          </div>
                      </div>
                  </div>
              </div>
              <div class="modal-footer border-top pt-3 px-0 pb-0 mt-4">
                <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" :disabled="loading">Đóng</button>
                <button type="submit" class="btn btn-primary px-5 fw-bold" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-save me-1"></i>
                    {{ isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table th { font-size: 0.85rem; letter-spacing: 0.5px; text-transform: uppercase; }
.badge { font-weight: 600; }
.address-list-container::-webkit-scrollbar { width: 6px; }
.address-list-container::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 3px; }
</style>