import axios from 'axios';
import { useAuthStore } from '@/store/auth';
import Swal from 'sweetalert2';

const apiClient = axios.create({
    baseURL: 'http://localhost:8080/rest',
    headers: {
        'Content-Type': 'application/json',
    },
    // [QUAN TRỌNG] Cho phép gửi Cookie (JSESSIONID) đi kèm request
    // Bắt buộc phải có để giữ đăng nhập cho cả Google và Login thường
    withCredentials: true 
});

// 1. Gửi kèm Token (Dự phòng cho tương lai nếu dùng JWT)
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    // Kiểm tra kỹ hơn để tránh gửi chuỗi "null" hoặc "undefined"
    if (token && token !== 'null' && token !== 'undefined') {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// 2. Xử lý phản hồi và lỗi toàn cục
apiClient.interceptors.response.use(
    response => response,
    error => {
        // Tránh lỗi khi server sập hoàn toàn (không có response)
        if (error.response) {
            const authStore = useAuthStore();
            const status = error.response.status;

            // Lỗi 401: Hết hạn phiên đăng nhập hoặc chưa đăng nhập
            if (status === 401) {
                // Chỉ redirect nếu không đang ở trang login (tránh vòng lặp vô tận)
                if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Phiên đăng nhập hết hạn',
                        text: 'Vui lòng đăng nhập lại!',
                        timer: 3000,
                        showConfirmButton: false
                    }).then(() => {
                        authStore.logout(); // Xóa dữ liệu trong Pinia/LocalStorage
                        window.location.href = '/login';
                    });
                }
            }

            // Lỗi 403: Không có quyền (Ví dụ: User thường cố vào trang Admin)
            if (status === 403) {
                Swal.fire({
                    icon: 'error',
                    title: 'Truy cập bị từ chối',
                    text: 'Bạn không có quyền thực hiện thao tác này.'
                });
            }
        } else {
            // Lỗi mạng (Server tắt, sai port, CORS...)
            console.error("Network Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi kết nối',
                text: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
            });
        }

        return Promise.reject(error);
    }
);

export default apiClient;