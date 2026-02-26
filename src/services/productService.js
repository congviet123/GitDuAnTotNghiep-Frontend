// src/services/productService.js
import api from "./api";

export default {
    getAll() {
        return api.get("/api/products");
    }
};