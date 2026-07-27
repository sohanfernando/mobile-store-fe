import axios from "axios";
import type { ApiResponse, CreateProductRequest, Product, UpdateProductRequest } from "../types/product";

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Attach the admin token when present - only admin-only routes (product create/update/delete)
// actually require it; public GETs simply ignore the extra header.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin-token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

export const productApi = {
    getAll(includeInactive = false): Promise<ApiResponse<Product[]>> {
        return api.get('/products', { params: { includeInactive } }).then(res => res.data);
    },

    getById(id: number): Promise<ApiResponse<Product>> {
        return api.get(`/products/${id}`).then(res => res.data);
    },

    create(productData: CreateProductRequest): Promise<ApiResponse<Product>> {
        return api.post('/products', productData).then(res => res.data)
    },

    update(id: number, productData: UpdateProductRequest): Promise<ApiResponse<Product>> {
        return api.put(`/products/${id}`, productData).then(res => res.data)
    },

    setActive(id: number, active: boolean): Promise<ApiResponse<Product>> {
        return api.patch(`/products/${id}/status`, { active }).then(res => res.data)
    },

    delete(id: number): Promise<ApiResponse<void>> {
        return api.delete(`/products/${id}`).then(res => res.data);
    }
}