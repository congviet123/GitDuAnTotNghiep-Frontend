// 1. Import CSS tùy chỉnh 
import '/src/assets/main.css'

// 2. Import các thư viện cốt lõi của Vue
import { createApp } from 'vue'
import { createPinia } from 'pinia' 

// 3. Import Component gốc và Router
import App from './App.vue'
import router from './router' 

// 4. Import Bootstrap 5 (CSS và JS Bundle đầy đủ)
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

// 5. Import và Cấu hình SweetAlert2 (Thông báo đẹp)
import Swal from 'sweetalert2'

const app = createApp(App)


// Tạo biến toàn cục cho SweetAlert2 để dùng ở mọi nơi (window.Swal)
window.Swal = Swal;

// Tạo cấu hình Toast (Thông báo nhỏ góc màn hình)
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});
window.Toast = Toast; // Gán Toast vào window để dùng nhanh


app.use(createPinia()) // Kích hoạt Pinia (Store)
app.use(router)        // ✅ Kích hoạt Router (Điều hướng)

app.mount('#app')