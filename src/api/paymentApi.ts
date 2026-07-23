import axios from "axios";
import type { ApiResponse, CreatePaymentIntentRequest, PaymentIntentResponse } from "../types/payment";

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
})

export const paymentApi = {
    createIntent(payload: CreatePaymentIntentRequest): Promise<ApiResponse<PaymentIntentResponse>> {
        return api.post('/payments/create-intent', payload).then(res => res.data)
    }
}
