// src/services/supplierService.js
import api from "./api";

export default {
    getAll() {
        return api.get("/api/suppliers");
    }
};