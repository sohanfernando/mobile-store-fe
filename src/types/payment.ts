import type { CreateOrderItemRequest } from './order'

export interface CreatePaymentIntentRequest {
  shippingMethod: string
  items: CreateOrderItemRequest[]
  couponCode?: string
  email?: string
}

export interface PaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
  amount: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}
