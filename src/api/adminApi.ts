import axios from "axios";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface CategoryShare {
    category: string;
    revenue: number;
}

export interface SalesTrend {
    month: string;
    revenue: number;
}

export interface AdminAnalytics {
    totalRevenue: number;
    totalOrders: number;
    lowStockCount: number;
    totalCustomers: number;
    categoryShare: CategoryShare[];
    salesTrend: SalesTrend[];
}

export interface GlobalReview {
    id: number;
    authorName: string;
    rating: number;
    title: string;
    text: string;
    verifiedPurchase: boolean;
    createdAt: string;
    productId: number | null;
    productName: string | null;
    productBrand: string | null;
}

export interface CustomerProfile {
    id: number;
    email: string;
    name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    active: boolean;
    orderCount: number;
    createdAt: string;
}

export interface Coupon {
    id: number;
    code: string;
    discountType: 'PERCENTAGE' | 'FLAT';
    discountValue: number;
    expiryDate: string;
    active: boolean;
    maxUses: number | null;
    usesCount: number;
    minOrderAmount: number | null;
    createdAt: string;
}

export interface CreateCouponRequest {
    code: string;
    discountType: 'PERCENTAGE' | 'FLAT';
    discountValue: number;
    expiryDate: string;
    maxUses?: number;
    minOrderAmount?: number;
}

const api = axios.create({
    baseURL: '/api/admin',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Set authorization header if token exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin-token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

export const adminApi = {
    getAnalytics(): Promise<ApiResponse<AdminAnalytics>> {
        return api.get('/analytics').then(res => res.data);
    },

    getAllReviews(): Promise<ApiResponse<GlobalReview[]>> {
        return api.get('/reviews').then(res => res.data);
    },

    deleteReview(id: number): Promise<ApiResponse<void>> {
        return api.delete(`/reviews/${id}`).then(res => res.data);
    },

    getAllCustomers(): Promise<ApiResponse<CustomerProfile[]>> {
        return api.get('/customers').then(res => res.data);
    },

    toggleCustomerStatus(id: number): Promise<ApiResponse<CustomerProfile>> {
        return api.patch(`/customers/${id}/toggle-status`).then(res => res.data);
    },

    getCoupons(): Promise<ApiResponse<Coupon[]>> {
        return api.get('/coupons').then(res => res.data);
    },

    createCoupon(data: CreateCouponRequest): Promise<ApiResponse<Coupon>> {
        return api.post('/coupons', data).then(res => res.data);
    },

    deleteCoupon(id: number): Promise<ApiResponse<void>> {
        return api.delete(`/coupons/${id}`).then(res => res.data);
    },

    downloadOrderPdf(id: number): Promise<Blob> {
        return api.get(`/orders/${id}/pdf`, { responseType: 'blob' }).then(res => res.data);
    },

    uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data);
    }
}
