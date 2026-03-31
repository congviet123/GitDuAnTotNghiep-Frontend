import apiClient from './api';

export const voucherService = {
    // Lấy tất cả voucher
    getAllVouchers() {
        return apiClient.get('/vouchers');
    },

    // Lấy voucher đang hoạt động
    getActiveVouchers() {
        return apiClient.get('/vouchers/active');
    },

    // Lấy voucher công khai (cho khách hàng)
    getPublicVouchers() {
        return apiClient.get('/vouchers/public');
    },

    // Lấy voucher theo mã
    getVoucherByCode(code) {
        return apiClient.get(`/vouchers/${code}`);
    },

    // Kiểm tra mã tồn tại
    checkCodeExists(code) {
        return apiClient.get(`/vouchers/check/${code}`);
    },

    // Tạo voucher mới
    createVoucher(data) {
        return apiClient.post('/vouchers', data);
    },

    // Cập nhật voucher
    updateVoucher(code, data) {
        return apiClient.put(`/vouchers/${code}`, data);
    },

    // Xóa voucher
    deleteVoucher(code) {
        return apiClient.delete(`/vouchers/${code}`);
    }
};