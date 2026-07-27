export interface ColorVariant {
  id?: number
  color: string
  stockQuantity: number
  images: string[]
}

export interface Product {
  id: number
  name: string
  brand: string
  modelNumber: string
  description: string
  descriptionImageUrl?: string
  price: number
  category: string
  ramGb: number
  storageGb: number
  warrantyPeriod: number
  active: boolean
  colorVariants: ColorVariant[]
  createdAt: string
  updatedAt: string
}

export interface CreateProductRequest {
  name: string
  brand: string
  modelNumber: string
  description: string
  descriptionImageUrl?: string
  price: number
  category: string
  ramGb: number
  storageGb: number
  warrantyPeriod: number
  colorVariants: ColorVariant[]
}

export interface UpdateProductRequest extends CreateProductRequest {}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}