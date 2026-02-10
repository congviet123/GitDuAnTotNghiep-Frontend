import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => {
    // 1. Lấy Token từ LocalStorage
    const token = localStorage.getItem('token');
    
    // 2. Lấy User và parse an toàn
    let user = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        user = JSON.parse(userStr);
      }
    } catch (e) {
      console.error("Lỗi parse user từ localStorage:", e);
      localStorage.removeItem('user'); // Xóa data hỏng
    }

    return {
      user: user,
      token: token,
      
      // Kiểm tra ngay lúc khởi tạo: Nếu có Token HOẶC có User thì coi như đã đăng nhập.
      isAuthenticated: !!token || !!user
    };
  },

  actions: {
    // Hàm login: Nhận vào userData và token (token có thể null nếu dùng Google)
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

    // Hàm logout
    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      
      // Xóa sạch localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // [Tùy chọn] Reload trang để xóa sạch các state rác của các component khác nếu cần
      // window.location.reload(); 
    }
  },
  
  // Getters giúp kiểm tra quyền hạn
  getters: {
    isAdmin: (state) => {
        const user = state.user;
        if (!user || !user.role) return false;

        // [SỬA ĐỂ AN TOÀN HƠN]:
        // Hỗ trợ trường hợp role là Object (role.name) hoặc String (role)
        const roleName = typeof user.role === 'object' ? user.role.name : user.role;
        
        // Danh sách các Role được phép vào trang Admin
        const adminRoles = ['ADMIN', 'ROLE_ADMIN', 'ROLE_STAFF'];
        
        return adminRoles.includes(roleName);
    }
  }
});