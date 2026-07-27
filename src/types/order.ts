export type OrderStatus = 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export interface OrderItem {
  id: number
  productId: number
  productName: string
  variantColor: string
  unitPrice: number
  quantity: number
}

export interface Order {
  id: number
  orderNumber: string
  paymentIntentId: string
  email: string
  name: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  shippingMethod: string
  shippingCost: number
  subtotal: number
  total: number
  status: OrderStatus
  instructions?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateOrderItemRequest {
  productId: number
  variantId: number
  quantity: number
}

export interface CreateOrderRequest {
  email: string
  firstName: string
  lastName: string
  phone: string
  country: string
  address: string
  apartment?: string
  city: string
  postalCode: string
  shippingMethod: string
  paymentIntentId: string
  instructions?: string
  items: CreateOrderItemRequest[]
  couponCode?: string
}

export interface OrderStatusUpdateResult {
  order: Order
  emailSent: boolean | null
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}
