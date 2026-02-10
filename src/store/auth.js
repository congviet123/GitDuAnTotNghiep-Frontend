import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => {
    // 1. Lấy Token từ LocalStorage
    const token = localStorage.getItem('token');
    
    // 2. Lấy User và parse an toàn (tránh lỗi crash app nếu JSON bị lỗi)
    let user = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        user = JSON.parse(userStr);
      }
    } catch (e) {
      console.error("Lỗi parse user từ localStorage:", e);
      localStorage.removeItem('user'); // Xóa data hỏng để tránh lỗi lặp lại
    }

    return {
      user: user,
      token: token,
      

      // Kiểm tra ngay lúc khởi tạo: Nếu có Token HOẶC có User (trường hợp Google Login) thì coi như đã đăng nhập.
      isAuthenticated: !!token || !!user
    };
  },

  actions: {
    // Hàm login: Nhận vào userData và token (token có thể null nếu dùng Google/Social Login)
    login(userData, token = null) {
      // 1. Lưu thông tin User (Nếu có)
      if (userData) {
          this.user = userData;
          localStorage.setItem('user', JSON.stringify(userData));
      }
      
      // 2. Xử lý Token (Nếu có)
      if (token) {
        this.token = token;
        localStorage.setItem('token', token);
      }
      
      // 3. Cập nhật trạng thái đăng nhập
      // Chỉ set true nếu thực sự có dữ liệu user hoặc token trong state
      this.isAuthenticated = !!this.user || !!this.token;
    },

    // Hàm cập nhật thông tin user (Dùng khi sửa profile mà không cần login lại)
    updateUser(newInfo) {
        if (this.user) {
            // Gộp thông tin cũ và mới
            this.user = { ...this.user, ...newInfo };
            localStorage.setItem('user', JSON.stringify(this.user));
        }
    },

    // Hàm logout
    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      
      // Xóa sạch localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('cart'); // [BỔ SUNG] Xóa luôn giỏ hàng tạm nếu có
      
    }
  },
  
  // Getters giúp kiểm tra quyền hạn nhanh chóng
  getters: {
    isAdmin: (state) => {
        const user = state.user;
        
        // Nếu chưa đăng nhập hoặc user không có role -> False
        if (!user || !user.role) return false;

  
        // Backend Spring Boot trả về Entity User có quan hệ @ManyToOne với Role, 
        // nên user.role thường là một Object: { id: 1, name: 'ROLE_ADMIN' }
        // Tuy nhiên, ta vẫn check typeof để an toàn tuyệt đối.
        const roleName = typeof user.role === 'object' ? user.role.name : user.role;
        
        // Danh sách các Role được phép truy cập trang Quản trị (Admin Dashboard)
        // Khớp với Database: ROLE_ADMIN, ROLE_STAFF (Shipper thường dùng App riêng hoặc hạn chế)
        const adminRoles = ['ADMIN', 'ROLE_ADMIN', 'ROLE_STAFF'];
        
        return adminRoles.includes(roleName);
    }
  }
});