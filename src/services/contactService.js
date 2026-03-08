// services/contactService.js
import apiClient from './api';  // <--- IMPORT apiClient từ file api.js có sẵn

export const contactService = {
    // Lấy thông tin liên hệ
    getContactInfo() {
        return apiClient.get('/contact-info');  // Gọi API GET
    },

    // Cập nhật thông tin liên hệ
    updateContactInfo(data) {
        return apiClient.put('/contact-info', data);  // Gọi API PUT
    },

    // Gửi tin nhắn liên hệ
    sendContactMessage(data) {
        return apiClient.post('/contact/send-message', data);
    }
};