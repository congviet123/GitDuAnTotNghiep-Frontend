import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('user')
  }),
  actions: {
    // Hàm này dùng cho cả Login thường và Login Google
    login(userData, token = null) {
      this.user = userData;
      this.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Nếu có token (Login thường) thì lưu, nếu không (Google Login dùng Cookie) thì thôi
      if (token) {
        this.token = token;
        localStorage.setItem('token', token);
      }
    },
    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Xóa Cookie Session (Optional: gọi thêm API logout backend nếu cần)
    }
  }
});