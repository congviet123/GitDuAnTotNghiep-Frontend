<script setup>
import { ref, onMounted, reactive } from 'vue';
import apiClient from '@/services/api'; 
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';

// --- STATE ---
const users = ref([]);
const roles = ref([]);
const loading = ref(false); // Biến này dùng để disable nút bấm
const isEdit = ref(false);
let userModal = null;

const form = reactive({
    username: '', password: '', fullname: '', email: '', 
    address: '', phone: '', enabled: true, role: { id: null }
});

// --- METHODS ---

const fetchRoles = async () => {
    try { roles.value = (await apiClient.get('/admin/roles')).data; } catch (e) {}
};

const fetchUsers = async () => {
    // Chỉ hiện loading icon nhỏ, không chặn màn hình
    loading.value = true;
    try { users.value = (await apiClient.get('/admin/users')).data; } 
    catch (err) { Swal.fire('Lỗi', 'Không thể tải danh sách.', 'error'); } 
    finally { loading.value = false; }
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
            form.address = d.address;
            form.phone = d.phone;
            form.enabled = d.enabled;
            form.role = { id: d.role ? d.role.id : roles.value[0]?.id };
            userModal.show();
        });
    } else {
        isEdit.value = false;
        Object.assign(form, {
            username: '', password: '', fullname: '', email: '', 
            address: '', phone: '', enabled: true, 
            role: { id: roles.value.find(r => r.name === 'ROLE_USER')?.id || null }
        });
        userModal.show();
    }
};

// HÀM LƯU VỚI HIỆU ỨNG LOADING CHẶN MÀN HÌNH
const saveUser = async () => {
    // 1. Hiện popup Loading ngay lập tức
    Swal.fire({
        title: 'Đang xử lý...',
        text: 'Hệ thống đang cập nhật và gửi email thông báo. Vui lòng chờ...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading(); // Hiển thị vòng xoay
        }
    });

    loading.value = true; // Disable nút bấm ở background

    try {
        const payload = { ...form };
        
        if (isEdit.value) {
            // Lấy trạng thái CŨ để so sánh
            const oldUser = users.value.find(u => u.username === form.username);
            const wasEnabled = oldUser ? oldUser.enabled : true;
            const isNowEnabled = form.enabled;

            // Gọi API (Mất khoảng 2-3s để gửi mail)
            await apiClient.put(`/admin/users/${form.username}`, payload);
            
            // 2. Đóng popup Loading sau khi API chạy xong
            Swal.close(); 

            // 3. Hiện thông báo kết quả 
            if (wasEnabled && !isNowEnabled) {
                // Trường hợp: Đang Mở -> KHÓA
                await Swal.fire({
                    title: 'Khóa tài khoản thành công',
                    text: 'Đã gửi thông báo khóa tài khoản qua gmail.',
                    icon: 'success'
                });
            } else if (!wasEnabled && isNowEnabled) {
                // Trường hợp: Đang Khóa -> MỞ
                await Swal.fire({
                    title: 'Mở khóa thành công',
                    text: 'Đã gửi email thông báo mở lại tài khoản.',
                    icon: 'success'
                });
            } else {
                // Cập nhật thông tin thường
                await Swal.fire('Thành công', 'Cập nhật thông tin thành công!', 'success');
            }

        } else {
            // Thêm mới
            await apiClient.post('/admin/users', payload);
            Swal.close(); // Đóng loading
            await Swal.fire('Thành công', 'Đã thêm tài khoản mới!', 'success');
        }
        
        userModal.hide();
        fetchUsers(); // Tải lại danh sách
        
    } catch (err) {
        Swal.close(); // Đóng loading nếu lỗi
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
        // Hiện loading khi xóa luôn cho đồng bộ
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
              <th>SĐT</th> <th>Địa chỉ</th> <th>Vai trò</th>
              <th>Trạng thái</th> <th class="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.username">
              <td class="ps-3 fw-bold">{{ u.username }}</td>
              <td>{{ u.fullname }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.phone || '-' }}</td>
              <td :title="u.address">{{ u.address || '-' }}</td>
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
                <button class="btn btn-primary btn-sm me-1" @click="openModal(u)">Sửa</button>
                <button class="btn btn-danger btn-sm" @click="deleteUser(u.username)">Xóa</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal fade" id="userModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold">{{ isEdit ? 'Cập nhật thông tin' : 'Thêm tài khoản mới' }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" :disabled="loading"></button>
          </div>
          <div class="modal-body p-4">
            <form @submit.prevent="saveUser">
              <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Tên đăng nhập <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" v-model="form.username" :disabled="isEdit" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Mật khẩu <span v-if="!isEdit" class="text-danger">*</span></label>
                    <input type="password" class="form-control" v-model="form.password" :required="!isEdit" placeholder="Để trống nếu không đổi">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Họ tên <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" v-model="form.fullname" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Email <span class="text-danger">*</span></label>
                    <input type="email" class="form-control" v-model="form.email" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">SĐT</label>
                    <input type="text" class="form-control" v-model="form.phone">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Địa chỉ</label>
                    <input type="text" class="form-control" v-model="form.address">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Vai trò <span class="text-danger">*</span></label>
                    <select class="form-select" v-model="form.role.id" required>
                      <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name.replace('ROLE_', '') }}</option>
                    </select>
                  </div>
                  <div class="col-md-6 d-flex align-items-center mt-4">
                      <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" id="enabledSwitch" v-model="form.enabled">
                          <label class="form-check-label fw-bold" for="enabledSwitch">
                              {{ form.enabled ? 'Đang hoạt động (Active)' : 'Đang bị khóa (Blocked)' }}
                          </label>
                      </div>
                  </div>
              </div>
              <div class="modal-footer border-0 px-0 pb-0 mt-4">
                <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal" :disabled="loading">Hủy</button>
                <button type="submit" class="btn btn-primary px-5 fw-bold" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ isEdit ? 'Cập nhật' : 'Thêm mới' }}
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
</style>