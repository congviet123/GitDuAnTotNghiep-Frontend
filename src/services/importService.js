// src/services/importService.js
import api from "./api";

export default {
    getAll(params) {
        return api.get("/api/imports", { params });
    },
    getById(id) {
        return api.get(`/api/imports/${id}`);
    },
    create(data) {
        return api.post("/api/imports", data);
    }
};
