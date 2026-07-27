import type { Product } from '../types/product'

export interface CategoryFilterState {
  availability: 'all' | 'in-stock' | 'out-of-stock'
  minPrice: number
  maxPrice: number
  colors: string[]
  brands: string[]
  ramGb: number | null
  storageGb: number | null
}

export const getTotalStock = (product: Product): number => {
  if (!product.colorVariants) return 0
  return product.colorVariants.reduce((sum, v) => sum + v.stockQuantity, 0)
}

export const getDistinctValues = (products: Product[], picker: (p: Product) => string): string[] => {
  const values = new Set(products.map(picker).filter(v => v && v.trim()))
  return Array.from(values)
}

// Which extra spec filters are worth showing per category - RAM/Storage don't apply to
// Speakers or Power Banks. Mirrors the relevance already established for the admin
// ProductForm's category field visibility (src/components/ProductForm.vue).
export interface CategoryFilterRelevance {
  showRam: boolean
  showStorage: boolean
}

export const categoryFilterRelevance: Record<string, CategoryFilterRelevance> = {
  'Mobile Phones':            { showRam: true,  showStorage: true },
  'Smartwatches':              { showRam: true,  showStorage: true },
  'Earphones And Headphones':  { showRam: false, showStorage: false },
  'Power Banks':               { showRam: false, showStorage: false },
  'Speakers':                  { showRam: false, showStorage: false },
  'Cameras':                   { showRam: false, showStorage: true },
  'Appliances':                { showRam: false, showStorage: false },
  'Gaming Consoles':           { showRam: true,  showStorage: true },
}

export const DEFAULT_FILTER_RELEVANCE: CategoryFilterRelevance = { showRam: false, showStorage: false }
