// quản lý toàn bộ logic thêm/sửa/xóa và đồng bộ giỏ hàng

import { defineStore } from 'pinia';
import apiClient from '@/services/api';
import { useAuthStore } from '@/store/auth'; // Import store Auth để check trạng thái đăng nhập
import Swal from 'sweetalert2';

export const useCartStore = defineStore('cart', {
    state: () => ({
        items: [] // Danh sách sản phẩm trong giỏ
    }),

    getters: {
        // 1. Tính tổng tiền giỏ hàng
        totalAmount: (state) => {
            return state.items.reduce((total, item) => {
                // Xử lý giá: Nếu lấy từ DB thì product nằm trong object 'product', nếu Local thì có thể khác chút
                const product = item.product || {};
                const price = product.price || 0;
                const quantity = item.quantity || 0;
                return total + (price * quantity);
            }, 0);
        },

        // 2. Tính tổng số lượng sản phẩm (để hiện badge đỏ trên icon giỏ hàng)
        totalQuantity: (state) => {
            return state.items.reduce((total, item) => total + (item.quantity || 0), 0);
        }
    },

    actions: {
        // --- A. TẢI GIỎ HÀNG ---
        async fetchCart() {
            const authStore = useAuthStore();
            
            if (authStore.isAuthenticated) {
                // CASE 1: Đã đăng nhập -> Gọi API lấy từ DB
                try {
                    const res = await apiClient.get('/cart');
                    this.items = res.data; 
                } catch (error) {
                    console.error("Lỗi tải giỏ hàng từ Server:", error);
                }
            } else {
                // CASE 2: Khách vãng lai -> Lấy từ LocalStorage
                const localCart = localStorage.getItem('cart');
                this.items = localCart ? JSON.parse(localCart) : [];
            }
        },

        // --- B. THÊM VÀO GIỎ ---
        async addToCart(product, quantity = 1) {
            const authStore = useAuthStore();

            if (authStore.isAuthenticated) {
                // [LOGIC SERVER]
                try {
                    // Gọi API add (Backend đã sửa để nhận JSON {productId, quantity})
                    await apiClient.post('/cart/add', {
                        productId: product.id,
                        quantity: quantity
                    });
                    
                    // Tải lại giỏ để đồng bộ dữ liệu mới nhất
                    await this.fetchCart(); 
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Thành công',
                        text: 'Đã thêm sản phẩm vào giỏ hàng!',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } catch (error) {
                    // Lấy thông báo lỗi từ Backend (VD: Hết hàng)
                    const msg = error.response?.data || 'Không thể thêm vào giỏ.';
                    Swal.fire('Thất bại', msg, 'error');
                }
            } else {
                // [LOGIC LOCALSTORAGE]
                // Kiểm tra sản phẩm đã có chưa
                const existingItem = this.items.find(item => item.product.id === product.id);
                
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    // Tạo cấu trúc giống hệt Backend trả về để Frontend dễ hiển thị
                    this.items.push({
                        id: Date.now(), // ID giả tạm thời
                        product: product,
                        quantity: quantity
                    });
                }
                
                // Lưu xuống trình duyệt
                localStorage.setItem('cart', JSON.stringify(this.items));
                
                Swal.fire({
                    icon: 'success',
                    title: 'Đã thêm',
                    text: 'Sản phẩm đã được lưu tạm vào giỏ!',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        },

        // --- C. CẬP NHẬT SỐ LƯỢNG ---
        async updateQuantity(cartId, productId, newQuantity) {
            if (newQuantity < 1) return; // Không cho giảm dưới 1

            const authStore = useAuthStore();

            if (authStore.isAuthenticated) {
                // [LOGIC SERVER] - cartId là ID của dòng trong bảng Cart
                try {
                    const res = await apiClient.put(`/cart/${cartId}`, null, {
                        params: { quantity: newQuantity }
                    });
                    this.items = res.data; // Backend trả về list mới
                } catch (error) {
                    Swal.fire('Lỗi', error.response?.data || 'Không thể cập nhật số lượng', 'error');
                }
            } else {
                // [LOGIC LOCALSTORAGE] - Dùng productId để tìm
                const item = this.items.find(i => i.product.id === productId);
                if (item) {
                    item.quantity = newQuantity;
                    localStorage.setItem('cart', JSON.stringify(this.items));
                }
            }
        },

        // --- D. XÓA SẢN PHẨM ---
        async removeItem(cartId, productId) {
            const authStore = useAuthStore();

            if (authStore.isAuthenticated) {
                // [LOGIC SERVER]
                try {
                    const res = await apiClient.delete(`/cart/${cartId}`);
                    this.items = res.data; // Backend trả về list mới sau khi xóa
                } catch (error) {
                    console.error(error);
                }
            } else {
                // [LOGIC LOCALSTORAGE]
                this.items = this.items.filter(item => item.product.id !== productId);
                localStorage.setItem('cart', JSON.stringify(this.items));
            }
        },

        // --- E. XÓA SẠCH GIỎ (Sau khi đặt hàng) ---
        clearCart() {
            this.items = [];
            localStorage.removeItem('cart');
            // Nếu là user thì việc xóa DB sẽ do OrderService xử lý, Frontend chỉ cần clear state
        },

        // --- F. ĐỒNG BỘ (LOCAL -> SERVER) ---
        // Hàm này sẽ được gọi ở Login.vue sau khi đăng nhập thành công
        async syncLocalCartToDatabase() {
            const localCart = JSON.parse(localStorage.getItem('cart')) || [];
            if (localCart.length === 0) {
                // Không có gì để đồng bộ -> Chỉ cần tải giỏ từ DB về
                await this.fetchCart();
                return;
            }

            // Có hàng ở local -> Duyệt qua từng món và đẩy lên Server
            for (const item of localCart) {
                try {
                    await apiClient.post('/cart/add', {
                        productId: item.product.id,
                        quantity: item.quantity
                    });
                } catch (e) {
                    console.error(`Lỗi đồng bộ sản phẩm ID ${item.product.id}:`, e);
                }
            }

            // Sau khi đẩy xong thì xóa local và tải lại dữ liệu chuẩn từ Server
            localStorage.removeItem('cart');
            await this.fetchCart();
            
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Đã đồng bộ giỏ hàng của bạn!',
                showConfirmButton: false,
                timer: 3000
            });
        }
    }
});