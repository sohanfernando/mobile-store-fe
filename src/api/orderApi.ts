import axios from "axios";
import type { ApiResponse, CreateOrderRequest, Order, OrderStatus } from "../types/order";

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Attach the admin token when present - only the admin-only status-update route requires it;
// customer-facing create/list/download requests simply ignore the extra header.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin-token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

export const orderApi = {
    create(orderData: CreateOrderRequest): Promise<ApiResponse<Order>> {
        return api.post('/orders', orderData).then(res => res.data)
    },

    getByEmail(email: string): Promise<ApiResponse<Order[]>> {
        return api.get('/orders', { params: { email } }).then(res => res.data)
    },

    getAll(): Promise<ApiResponse<Order[]>> {
        return api.get('/orders').then(res => res.data)
    },

    updateStatus(id: number, status: OrderStatus): Promise<ApiResponse<Order>> {
        return api.patch(`/orders/${id}/status`, { status }).then(res => res.data)
    },

    downloadPdf(id: number): Promise<Blob> {
        return api.get(`/orders/${id}/pdf`, { responseType: 'blob' }).then(res => res.data)
    }
}
