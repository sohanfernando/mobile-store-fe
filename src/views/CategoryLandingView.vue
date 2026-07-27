<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { productApi } from '../api/productApi'
import type { Product } from '../types/product'
import { useToast } from '../composables/useToast'
import {
  categoryFilterRelevance,
  DEFAULT_FILTER_RELEVANCE,
  getTotalStock,
  type CategoryFilterState
} from '../composables/useProductFilters'
import ProductCard from '../components/ProductCard.vue'
import CategoryFilterSidebar from '../components/CategoryFilterSidebar.vue'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { SlidersHorizontal, Search, ChevronDown } from '@lucide/vue'

interface RouteFilter {
  type: 'category' | 'brand'
  value: string
}

const router = useRouter()
const route = useRoute()
const { showToast } = useToast()

const products = ref<Product[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const isLoggedIn = ref(false)
const cart = ref<{ product: Product; variant: any; quantity: number }[]>([])
const sidebarOpen = ref(false)
const sortBy = ref('featured')

const routeFilter = computed<RouteFilter | undefined>(() => route.meta.filter as RouteFilter | undefined)

const pageTitle = computed(() => {
  const value = routeFilter.value?.value
  if (value === 'Appliances') return 'Home Appliances'
  if (routeFilter.value?.type === 'brand') return `${value} Store`
  return value || 'Products'
})

const scopedProducts = computed(() => {
  const f = routeFilter.value
  if (!f) return []
  return products.value.filter(p => f.type === 'category' ? p.category === f.value : p.brand === f.value)
})

const relevance = computed(() => categoryFilterRelevance[routeFilter.value?.value || ''] ?? DEFAULT_FILTER_RELEVANCE)
const showBrandFilter = computed(() => routeFilter.value?.type !== 'brand')

const defaultFilters = (): CategoryFilterState => {
  const prices = scopedProducts.value.map(p => p.price)
  return {
    availability: 'all',
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    colors: [],
    brands: [],
    ramGb: null,
    storageGb: null
  }
}

const filters = ref<CategoryFilterState>(defaultFilters())

const storageMatches = (product: Product, bucket: number): boolean => {
  if (bucket === 1000) return product.storageGb === 1000 || product.storageGb === 1024
  if (bucket === 2000) return product.storageGb === 2000 || product.storageGb === 2048
  return product.storageGb === bucket
}

const filteredProducts = computed(() => {
  let list = [...scopedProducts.value]
  const f = filters.value

  if (f.availability === 'in-stock') {
    list = list.filter(p => getTotalStock(p) > 0)
  } else if (f.availability === 'out-of-stock') {
    list = list.filter(p => getTotalStock(p) === 0)
  }

  list = list.filter(p => p.price >= f.minPrice && p.price <= f.maxPrice)

  if (f.colors.length > 0) {
    list = list.filter(p => p.colorVariants?.some(v => f.colors.includes(v.color)))
  }

  if (f.brands.length > 0) {
    list = list.filter(p => f.brands.includes(p.brand))
  }

  if (f.ramGb !== null) {
    list = list.filter(p => p.ramGb === f.ramGb)
  }

  if (f.storageGb !== null) {
    list = list.filter(p => storageMatches(p, f.storageGb as number))
  }

  if (sortBy.value === 'price-low') list.sort((a, b) => a.price - b.price)
  else if (sortBy.value === 'price-high') list.sort((a, b) => b.price - a.price)
  else if (sortBy.value === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
  else if (sortBy.value === 'newest') list.sort((a, b) => b.id - a.id)

  return list
})

const fetchProducts = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await productApi.getAll()
    if (response.success && response.data) {
      products.value = response.data
    } else {
      products.value = []
      errorMessage.value = response.message || 'Failed to load products.'
    }
  } catch (error: any) {
    products.value = []
    errorMessage.value = error.response?.data?.message || error.message || 'Failed to connect to server.'
    showToast(errorMessage.value, 'error')
  } finally {
    isLoading.value = false
  }
}

const checkAuth = () => {
  isLoggedIn.value = !!localStorage.getItem('customer-token')
}

const loadCart = () => {
  const stored = localStorage.getItem('mobile-store-cart')
  if (stored) {
    cart.value = JSON.parse(stored)
  }
}

const totalCartItems = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))

onMounted(async () => {
  checkAuth()
  loadCart()
  await fetchProducts()
  filters.value = defaultFilters()
})

// These 9 routes all render this same component instance, so switching between them
// (e.g. Mobile Phones -> Smartwatches) doesn't remount - reset filters (price bounds
// especially differ wildly per category) and scroll up whenever the route actually changes.
watch(() => route.path, () => {
  filters.value = defaultFilters()
  sortBy.value = 'featured'
  sidebarOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<template>
  <div class="min-h-screen bg-background text-text font-sans pb-1 relative overflow-hidden select-none">

    <Navbar
      :is-logged-in="isLoggedIn"
      :total-cart-items="totalCartItems"
      @toggle-cart="router.push('/cart')"
      @select-category="(c) => router.push({ path: '/', query: { category: c } })"
      @select-brand="(b) => router.push({ path: '/', query: { brand: b } })"
      @select-sort="(s) => router.push({ path: '/', query: { sort: s } })"
    />

    <main class="max-w-7xl mx-auto px-6 py-10 md:py-14">

      <!-- Page Header -->
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl md:text-4xl font-black text-text tracking-tight">{{ pageTitle }}</h1>
          <p class="text-xs text-muted mt-1">{{ filteredProducts.length }} product{{ filteredProducts.length === 1 ? '' : 's' }} found</p>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="sidebarOpen = true"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border hover:border-muted/40 text-muted hover:text-text transition-all text-xs font-bold cursor-pointer lg:hidden"
          >
            <SlidersHorizontal class="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div class="relative">
            <select
              v-model="sortBy"
              class="appearance-none bg-white border border-border rounded-xl pl-3 pr-8 py-2.5 text-xs text-text focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Alphabetical</option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 gap-3">
        <div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs text-muted font-bold uppercase tracking-widest">Loading products...</span>
      </div>

      <!-- Error state -->
      <div v-else-if="errorMessage" class="text-center py-24 flex flex-col items-center justify-center bg-surface border border-border rounded-3xl p-8">
        <h3 class="text-lg font-bold text-text mb-1.5">Something went wrong</h3>
        <p class="text-muted text-sm max-w-sm mb-6">{{ errorMessage }}</p>
        <button
          @click="fetchProducts"
          class="px-5 py-2.5 bg-white border border-border hover:border-muted/40 text-text font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>

      <!-- Sidebar + Grid -->
      <div v-else class="flex items-start gap-8">
        <CategoryFilterSidebar
          :products="scopedProducts"
          :filters="filters"
          :show-brand-filter="showBrandFilter"
          :show-ram-filter="relevance.showRam"
          :show-storage-filter="relevance.showStorage"
          :is-open="sidebarOpen"
          @update:filters="filters = $event"
          @close="sidebarOpen = false"
        />

        <div class="flex-1 min-w-0">
          <div v-if="filteredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <ProductCard
              v-for="product in filteredProducts"
              :key="product.id"
              :product="product"
              :is-admin="false"
              @click="router.push('/product/' + product.id)"
            />
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-20 flex flex-col items-center justify-center bg-surface border border-border rounded-3xl p-8">
            <div class="w-16 h-16 rounded-2xl bg-white border border-border text-muted flex items-center justify-center mb-4">
              <Search class="w-7 h-7" />
            </div>
            <h3 class="text-lg font-bold text-text mb-1.5">No products match your filters</h3>
            <p class="text-muted text-sm max-w-sm mb-6">
              Try adjusting or clearing some filters to see more results.
            </p>
          </div>
        </div>
      </div>

    </main>

    <Footer />

  </div>
</template>
