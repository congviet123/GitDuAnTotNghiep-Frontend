import axios from 'axios';
import { useAuthStore } from '@/store/auth';
import Swal from 'sweetalert2';

// 1. Khởi tạo Axios với BaseURL là /rest
const apiClient = axios.create({
    baseURL: 'http://localhost:8080/rest',
    headers: {
        'Content-Type': 'application/json',
    },
    // Cho phép gửi Cookie (JSESSIONID) đi kèm request
    // Bắt buộc phải có để giữ đăng nhập cho cả Google và Login thường
    withCredentials: true 
});

// 2. Interceptor Request: Gửi kèm Token
apiClient.interceptors.request.use(config => {
    // Ưu tiên lấy token từ localStorage để đảm bảo luôn có ngay cả khi Store chưa load xong
    const token = localStorage.getItem('token');
    
    // Kiểm tra kỹ hơn để tránh gửi chuỗi "null" hoặc "undefined"
    if (token && token !== 'null' && token !== 'undefined') {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// 3. Interceptor Response: Xử lý lỗi toàn cục
apiClient.interceptors.response.use(
    response => response,
    error => {
        // Tránh lỗi khi server sập hoàn toàn (không có response)
        if (error.response) {
            // Gọi store bên trong interceptor để tránh lỗi vòng lặp import
            const authStore = useAuthStore();
            const status = error.response.status;

            // --- Lỗi 401: Hết hạn phiên đăng nhập hoặc chưa đăng nhập ---
            if (status === 401) {
                // Chỉ redirect nếu không đang ở trang login/register (tránh vòng lặp vô tận)
                if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Phiên đăng nhập hết hạn',
                        text: 'Vui lòng đăng nhập lại để tiếp tục!',
                        timer: 3000,
                        showConfirmButton: false
                    }).then(() => {
                        authStore.logout(); // Xóa dữ liệu trong Pinia/LocalStorage
                        window.location.href = '/login'; // Chuyển hướng (Hard reload để xóa sạch state cũ)
                    });
                }
            }

            // --- Lỗi 403: Không có quyền (User vào trang Admin) ---
            if (status === 403) {
                Swal.fire({
                    icon: 'error',
                    title: 'Truy cập bị từ chối',
                    text: 'Bạn không có quyền thực hiện thao tác này.'
                });
            }

            // ---  Lỗi 500: Lỗi Server (Code lỗi, Database lỗi...) ---
            if (status === 500) {
                console.error("Server Error:", error.response.data);
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi hệ thống',
                    text: 'Máy chủ gặp sự cố (500). Vui lòng chụp ảnh màn hình và liên hệ Admin.'
                });
            }

        } else {
            // --- Lỗi mạng (Server tắt, sai port, CORS...) ---
            console.error("Network Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi kết nối',
                text: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền hoặc thử lại sau.'
            });
        }

        return Promise.reject(error);
    }
);

export default apiClient;