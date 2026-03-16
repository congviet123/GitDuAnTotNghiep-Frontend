import api from './api';

const aboutService = {
    // Lấy dữ liệu trang giới thiệu
    getAboutPage() {
        return api.get('/about');
    },

    // Cập nhật dữ liệu trang giới thiệu
    updateAboutPage(data) {
        return api.put('/about/admin', data);
    },

    // Upload ảnh
    uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        return api.post('/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

export default aboutService;