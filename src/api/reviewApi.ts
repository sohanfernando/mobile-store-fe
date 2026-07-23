import axios from "axios";
import type { ApiResponse } from "../types/product";
import type { CreateReviewRequest, Review } from "../types/review";

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
})

export const reviewApi = {
    getForProduct(productId: number): Promise<ApiResponse<Review[]>> {
        return api.get(`/products/${productId}/reviews`).then(res => res.data);
    },

    create(productId: number, review: CreateReviewRequest): Promise<ApiResponse<Review>> {
        return api.post(`/products/${productId}/reviews`, review).then(res => res.data);
    }
}
