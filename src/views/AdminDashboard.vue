<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { productApi } from '../api/productApi'
import { orderApi } from '../api/orderApi'
import { authApi } from '../api/authApi'
import type { Product } from '../types/product'
import type { Order, OrderStatus } from '../types/order'
import ProductForm from '../components/ProductForm.vue'
import ProductDetailModal from '../components/ProductDetailModal.vue'
import OrderDetailModal from '../components/OrderDetailModal.vue'
import AdminAnalytics from '../components/AdminAnalytics.vue'
import AdminReviews from '../components/AdminReviews.vue'
import AdminCustomers from '../components/AdminCustomers.vue'
import AdminCoupons from '../components/AdminCoupons.vue'
import { useToast } from '../composables/useToast'
import { useOrderSocket } from '../composables/useOrderSocket'
import { Smartphone, Package, ShoppingBag, LogOut, Plus, AlertCircle, Loader2, Pencil, Trash2, Search, X, ChevronDown, BarChart3, MessageSquare, Users, Eye, Ticket, Menu } from '@lucide/vue'
import logoIcon from '../assets/logo-icon.png'

const router = useRouter()
const { showToast } = useToast()
const adminEmail = ref('')
const activeTab = ref<'analytics' | 'products' | 'orders' | 'reviews' | 'customers' | 'coupons'>('analytics')
const mobileSidebarOpen = ref(false)

const orders = ref<Order[]>([])
const ordersLoading = ref(false)
const ordersError = ref('')
const newOrderCount = ref(0)
const orderStatusOptions: OrderStatus[] = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const fetchOrders = async () => {
  ordersLoading.value = true
  ordersError.value = ''
  try {
    const response = await orderApi.getAll()
    if (response.success) {
      orders.value = response.data
    } else {
      ordersError.value = response.message || 'Failed to fetch orders'
    }
  } catch (error: any) {
    ordersError.value = 'Failed to load orders. Make sure the backend server is running.'
  } finally {
    ordersLoading.value = false
  }
}

const switchTab = (tab: 'analytics' | 'products' | 'orders' | 'reviews' | 'customers' | 'coupons') => {
  activeTab.value = tab
  mobileSidebarOpen.value = false
  if (tab === 'orders') {
    newOrderCount.value = 0
    fetchOrders()
  } else if (tab === 'products') {
    fetchProducts()
  }
}

const { connect: connectOrderSocket, disconnect: disconnectOrderSocket } = useOrderSocket()

const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
  if (newStatus === order.status) return
  try {
    const response = await orderApi.updateStatus(order.id, newStatus)
    if (response.success) {
      order.status = response.data.status
      showToast('Order status updated successfully', 'success')
    } else {
      showToast(response.message || 'Failed to update order status', 'error')
    }
  } catch (error: any) {
    showToast('An error occurred while updating the order status.', 'error')
  }
}

const adminName = computed(() => {
  if (adminEmail.value === 'sohan.f@mobile-store.com') {
    return 'Sohan Fernando'
  }
  const namePart = adminEmail.value.split('@')[0]
  if (!namePart) return 'Administrator'
  return namePart.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
})
const products = ref<Product[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

// Modal state
const showModal = ref(false)
const currentEditingProduct = ref<Product | null>(null)
const brokenVariantImages = ref<Set<number>>(new Set())

// Detail Modal state
const showDetailModal = ref(false)
const selectedDetailProduct = ref<Product | null>(null)

const openDetailModal = (product: Product) => {
  selectedDetailProduct.value = product
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedDetailProduct.value = null
}

// Order Detail Modal state
const showOrderModal = ref(false)
const selectedOrder = ref<Order | null>(null)

const openOrderModal = (order: Order) => {
  selectedOrder.value = order
  showOrderModal.value = true
}

const closeOrderModal = () => {
  showOrderModal.value = false
  selectedOrder.value = null
}

const handleVariantImageError = (variantId: number) => {
  if (variantId) brokenVariantImages.value.add(variantId)
}

const getProductImage = (product: Product): string => {
  if (!product.colorVariants || product.colorVariants.length === 0) return ''
  // Find first variant that has an image and is not marked as broken
  const validVariant = product.colorVariants.find(v => v.images?.[0] && !brokenVariantImages.value.has(v.id || 0))
  return validVariant ? validVariant.images[0] : ''
}

const getProductImageId = (product: Product): number => {
  if (!product.colorVariants || product.colorVariants.length === 0) return 0
  const validVariant = product.colorVariants.find(v => v.images?.[0] && !brokenVariantImages.value.has(v.id || 0))
  return validVariant ? (validVariant.id || 0) : 0
}

const getTotalStock = (product: Product): number => {
  if (!product.colorVariants) return 0
  return product.colorVariants.reduce((sum, v) => sum + v.stockQuantity, 0)
}

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'

const getStockStatus = (product: Product): StockFilter => {
  const stock = getTotalStock(product)
  if (stock === 0) return 'out-of-stock'
  if (stock <= 10) return 'low-stock'
  return 'in-stock'
}

// Product table filters
const productSearchQuery = ref('')
const selectedCategoryFilter = ref('')
const stockFilter = ref<StockFilter>('all')

const productCategories = computed(() => {
  const set = new Set(products.value.map(p => p.category).filter((c): c is string => !!c))
  return Array.from(set).sort()
})

const hasActiveProductFilters = computed(() => {
  return !!productSearchQuery.value.trim() || !!selectedCategoryFilter.value || stockFilter.value !== 'all'
})

const filteredProducts = computed(() => {
  let list = products.value

  if (productSearchQuery.value.trim()) {
    const q = productSearchQuery.value.trim().toLowerCase()
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.modelNumber && p.modelNumber.toLowerCase().includes(q))
    )
  }

  if (selectedCategoryFilter.value) {
    list = list.filter(p => p.category === selectedCategoryFilter.value)
  }

  if (stockFilter.value !== 'all') {
    list = list.filter(p => getStockStatus(p) === stockFilter.value)
  }

  return list
})

const resetProductFilters = () => {
  productSearchQuery.value = ''
  selectedCategoryFilter.value = ''
  stockFilter.value = 'all'
}

onMounted(() => {
  adminEmail.value = localStorage.getItem('admin-email') || 'admin@techpulse.lk'
  fetchProducts()

  connectOrderSocket((event) => {
    showToast(`New order ${event.orderNumber} from ${event.name} — Rs. ${event.total.toLocaleString()} (${event.itemCount} item${event.itemCount === 1 ? '' : 's'})`, 'info')
    if (activeTab.value === 'orders') {
      fetchOrders()
    } else {
      newOrderCount.value++
    }
  })
})

onUnmounted(() => {
  disconnectOrderSocket()
})

const fetchProducts = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await productApi.getAll()
    if (response.success) {
      products.value = response.data
    } else {
      errorMessage.value = response.message || 'Failed to fetch products'
    }
  } catch (error: any) {
    errorMessage.value = 'Failed to load products. Make sure the backend server is running.'
  } finally {
    isLoading.value = false
  }
}

const showDeleteConfirmModal = ref(false)
const productToDelete = ref<Product | null>(null)

const confirmDelete = (product: Product) => {
  productToDelete.value = product
  showDeleteConfirmModal.value = true
}

const cancelDelete = () => {
  showDeleteConfirmModal.value = false
  productToDelete.value = null
}

const executeDelete = async () => {
  if (!productToDelete.value) return
  const id = productToDelete.value.id
  showDeleteConfirmModal.value = false
  productToDelete.value = null
  try {
    const response = await productApi.delete(id)
    if (response.success) {
      showToast('Product deleted successfully', 'success')
      fetchProducts()
    } else {
      showToast(response.message || 'Failed to delete product', 'error')
    }
  } catch (error: any) {
    const message = error.response?.data?.message || 'An error occurred while deleting the product.'
    showToast(message, 'error')
  }
}

const openAddModal = () => {
  currentEditingProduct.value = null
  showModal.value = true
}

const openEditModal = (product: Product) => {
  currentEditingProduct.value = product
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  currentEditingProduct.value = null
}

const onProductSaved = () => {
  closeModal()
  fetchProducts()
}

const handleLogout = async () => {
  try {
    await authApi.logout()
  } catch {
    // Token may already be expired/invalid - clearing local state below is enough either way.
  }
  localStorage.removeItem('admin-token')
  localStorage.removeItem('admin-email')
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-background text-text flex font-sans overflow-x-hidden">
    <!-- Mobile sidebar backdrop -->
    <div
      v-if="mobileSidebarOpen"
      @click="mobileSidebarOpen = false"
      class="fixed inset-0 bg-text/40 z-40 lg:hidden"
    ></div>

    <!-- Sidebar -->
    <aside
      class="w-64 border-r border-border bg-surface flex flex-col justify-between p-6 shrink-0 fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 overflow-y-auto"
      :class="mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="space-y-8">
        <!-- Logo -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <img :src="logoIcon" alt="TechPulse" class="w-6 h-6 object-contain" />
            </div>
            <span class="font-bold text-lg text-text tracking-tight">TechPulse</span>
          </div>
          <button
            @click="mobileSidebarOpen = false"
            class="p-2 rounded-lg bg-white border border-border text-muted hover:text-text transition-colors cursor-pointer lg:hidden"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Nav Links -->
        <nav class="space-y-2">
          <a
            href="#"
            @click.prevent="switchTab('analytics')"
            class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer"
            :class="activeTab === 'analytics' ? 'bg-primary/10 border border-primary/20 text-primary' : 'text-muted hover:bg-border/40'"
          >
            <BarChart3 class="w-5 h-5" :class="activeTab === 'analytics' ? 'text-primary' : 'text-muted'" />
            <span>Analytics</span>
          </a>
          <a
            href="#"
            @click.prevent="switchTab('products')"
            class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer"
            :class="activeTab === 'products' ? 'bg-primary/10 border border-primary/20 text-primary' : 'text-muted hover:bg-border/40'"
          >
            <Package class="w-5 h-5" :class="activeTab === 'products' ? 'text-primary' : 'text-muted'" />
            <span>Products</span>
          </a>
          <a
            href="#"
            @click.prevent="switchTab('orders')"
            class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer"
            :class="activeTab === 'orders' ? 'bg-primary/10 border border-primary/20 text-primary' : 'text-muted hover:bg-border/40'"
          >
            <ShoppingBag class="w-5 h-5" :class="activeTab === 'orders' ? 'text-primary' : 'text-muted'" />
            <span>Orders</span>
            <span
              v-if="newOrderCount > 0"
              class="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center"
            >
              {{ newOrderCount }}
            </span>
          </a>
          <a
            href="#"
            @click.prevent="switchTab('reviews')"
            class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer"
            :class="activeTab === 'reviews' ? 'bg-primary/10 border border-primary/20 text-primary' : 'text-muted hover:bg-border/40'"
          >
            <MessageSquare class="w-5 h-5" :class="activeTab === 'reviews' ? 'text-primary' : 'text-muted'" />
            <span>Reviews</span>
          </a>
          <a
            href="#"
            @click.prevent="switchTab('customers')"
            class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer"
            :class="activeTab === 'customers' ? 'bg-primary/10 border border-primary/20 text-primary' : 'text-muted hover:bg-border/40'"
          >
            <Users class="w-5 h-5" :class="activeTab === 'customers' ? 'text-primary' : 'text-muted'" />
            <span>Customers</span>
          </a>
          <a
            href="#"
            @click.prevent="switchTab('coupons')"
            class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer"
            :class="activeTab === 'coupons' ? 'bg-primary/10 border border-primary/20 text-primary' : 'text-muted hover:bg-border/40'"
          >
            <Ticket class="w-5 h-5" :class="activeTab === 'coupons' ? 'text-primary' : 'text-muted'" />
            <span>Coupons</span>
          </a>
        </nav>
      </div>

      <!-- Footer Info -->
      <div class="border-t border-border pt-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-border flex items-center justify-center text-sm font-semibold text-text border border-border shrink-0" :title="adminEmail">
            {{ adminName.charAt(0).toUpperCase() }}
          </div>
          <div class="overflow-hidden">
            <p class="text-sm font-medium text-text truncate" :title="adminEmail">{{ adminName }}</p>
            <p class="text-xs text-muted">Administrator</p>
          </div>
        </div>

        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-border transition-all duration-200 text-sm font-semibold cursor-pointer"
        >
          <LogOut class="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Top Header -->
      <header class="h-20 border-b border-border bg-background/95 flex items-center justify-between px-4 md:px-8 shrink-0 gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <button
            @click="mobileSidebarOpen = true"
            class="p-2 rounded-lg bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer lg:hidden shrink-0"
          >
            <Menu class="w-5 h-5" />
          </button>
          <h1 class="text-base md:text-xl font-bold text-text tracking-tight uppercase truncate">
            {{
              activeTab === 'analytics' ? 'Dashboard Analytics' :
              activeTab === 'products' ? 'Products Management' :
              activeTab === 'orders' ? 'Orders Management' :
              activeTab === 'reviews' ? 'Reviews Moderation' :
              activeTab === 'customers' ? 'Customers Registry' :
              'Coupons & Promotions'
            }}
          </h1>
        </div>
        <div class="flex items-center gap-3 md:gap-6 shrink-0">
          <span class="text-sm text-muted hidden lg:inline">Status: <span class="text-success font-semibold">Online</span></span>
          <button
            v-if="activeTab === 'products'"
            @click="openAddModal"
            class="flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm cursor-pointer shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </header>

      <!-- Dashboard View Body -->
      <div v-if="activeTab === 'analytics'" class="flex-1 overflow-auto p-4 md:p-8">
        <div class="max-w-6xl mx-auto">
          <AdminAnalytics />
        </div>
      </div>

      <div v-else-if="activeTab === 'products'" class="flex-1 overflow-auto p-4 md:p-8">
        <div class="max-w-6xl mx-auto space-y-8">

          <!-- Error Banner -->
          <div v-if="errorMessage" class="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-sm flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <AlertCircle class="w-5 h-5 text-error shrink-0" />
              <span>{{ errorMessage }}</span>
            </div>
            <button @click="fetchProducts" class="px-4 py-1.5 bg-error/20 hover:bg-error/30 rounded-xl text-xs font-semibold transition-all cursor-pointer">
              Retry
            </button>
          </div>

          <!-- Loading state -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 class="animate-spin h-10 w-10 text-primary" />
            <span class="text-muted text-sm">Fetching catalog...</span>
          </div>

          <div v-else>
            <!-- Empty Catalog State -->
            <div v-if="products.length === 0" class="bg-surface border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div class="w-16 h-16 rounded-2xl bg-surface border border-border text-muted flex items-center justify-center mb-4">
                <Package class="w-8 h-8" />
              </div>
              <h3 class="text-lg font-bold text-text mb-2">No products loaded</h3>
              <p class="text-muted text-sm max-w-sm mb-6">
                Your inventory is currently empty. Get started by adding your first mobile device to the system.
              </p>
              <button
                @click="openAddModal"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm cursor-pointer shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              >
                <Plus class="w-4 h-4" />
                <span>Add First Product</span>
              </button>
            </div>

            <div v-else>
              <!-- Filter Bar -->
              <div class="flex flex-col md:flex-row md:items-center gap-3 mb-6">
                <div class="relative flex-1 min-w-55">
                  <input
                    v-model="productSearchQuery"
                    type="text"
                    placeholder="Search by name, brand or model..."
                    class="w-full bg-white border border-border rounded-xl py-2.5 pl-10 pr-9 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                  />
                  <Search class="w-4 h-4 text-muted absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <button
                    v-if="productSearchQuery"
                    @click="productSearchQuery = ''"
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-text cursor-pointer"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>

                <div class="relative">
                  <select
                    v-model="selectedCategoryFilter"
                    class="appearance-none bg-white border border-border rounded-xl py-2.5 pl-3.5 pr-9 text-text focus:outline-none focus:border-primary text-sm cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    <option v-for="cat in productCategories" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                  <ChevronDown class="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div class="relative">
                  <select
                    v-model="stockFilter"
                    class="appearance-none bg-white border border-border rounded-xl py-2.5 pl-3.5 pr-9 text-text focus:outline-none focus:border-primary text-sm cursor-pointer"
                  >
                    <option value="all">All Stock Levels</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                  <ChevronDown class="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  v-if="hasActiveProductFilters"
                  @click="resetProductFilters"
                  class="text-xs text-primary hover:text-primary-dark font-semibold underline cursor-pointer whitespace-nowrap"
                >
                  Clear Filters
                </button>
              </div>

              <!-- No results for current filters -->
              <div v-if="filteredProducts.length === 0" class="bg-surface border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-50">
                <div class="w-16 h-16 rounded-2xl bg-white border border-border text-muted flex items-center justify-center mb-4">
                  <Search class="w-7 h-7" />
                </div>
                <h3 class="text-lg font-bold text-text mb-2">No products match your filters</h3>
                <p class="text-muted text-sm max-w-sm mb-6">
                  Try adjusting your search or filter settings.
                </p>
                <button
                  @click="resetProductFilters"
                  class="px-5 py-2.5 bg-white border border-border hover:border-muted/40 text-text font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>

              <!-- Product Table & Card Layout -->
              <div v-else>
                <!-- Mobile, Tablet & 1024px Screen Card View (< 1280px) -->
                <div class="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="product in filteredProducts"
                    :key="product.id"
                    class="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:border-primary/30 transition-all"
                  >
                    <!-- Header: Image, Title, Brand & Actions -->
                    <div class="flex items-start justify-between gap-3">
                      <div @click="openDetailModal(product)" class="flex items-center gap-3 cursor-pointer group flex-1 min-w-0">
                        <div class="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center shrink-0 group-hover:border-primary/50 transition-colors">
                          <img
                            v-if="getProductImage(product)"
                            :src="getProductImage(product)"
                            :alt="product.name"
                            class="w-full h-full object-cover rounded-xl"
                            @error="handleVariantImageError(getProductImageId(product))"
                          />
                          <div v-else class="flex items-center justify-center w-12 h-12 bg-surface border border-border rounded-xl text-muted">
                            <Smartphone class="w-6 h-6" />
                          </div>
                        </div>
                        <div class="min-w-0">
                          <span class="text-[10px] text-primary font-bold uppercase tracking-wider">{{ product.brand }}</span>
                          <h4 class="font-bold text-text text-sm leading-tight truncate group-hover:text-primary transition-colors">{{ product.name }}</h4>
                          <p class="text-xs text-muted font-medium truncate">{{ product.category || 'Mobile Phones' }} • {{ product.modelNumber || 'N/A' }}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0">
                        <button
                          @click="openEditModal(product)"
                          class="p-2 rounded-lg bg-white hover:bg-surface border border-border hover:border-muted/40 text-muted hover:text-text transition-all cursor-pointer"
                          title="Edit Product"
                        >
                          <Pencil class="w-4 h-4" />
                        </button>
                        <button
                          @click="confirmDelete(product)"
                          class="p-2 rounded-lg bg-white hover:bg-error/10 border border-border hover:border-error/20 text-muted hover:text-error transition-all cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <!-- Specs & Variants Badges -->
                    <div class="flex flex-wrap gap-1.5 items-center pt-1">
                      <span v-if="product.ramGb && product.ramGb > 0" class="text-xs bg-white border border-border text-muted px-2.5 py-0.5 rounded-lg font-medium">
                        {{ product.ramGb }}GB RAM
                      </span>
                      <span v-if="product.storageGb && product.storageGb > 0" class="text-xs bg-white border border-border text-muted px-2.5 py-0.5 rounded-lg font-medium">
                        {{ product.storageGb >= 1000 ? (product.storageGb % 1024 === 0 ? product.storageGb / 1024 : product.storageGb / 1000) + 'TB' : product.storageGb + 'GB' }} ROM
                      </span>
                      <span
                        v-for="v in product.colorVariants"
                        :key="v.id"
                        v-show="v.color.toLowerCase() !== 'standard' && v.color.toLowerCase() !== 'default'"
                        class="text-[9px] bg-white border border-border text-muted px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold"
                      >
                        {{ v.color }}
                      </span>
                    </div>

                    <!-- Footer: Price & Stock -->
                    <div class="flex items-center justify-between pt-3 border-t border-border/60">
                      <div>
                        <span class="text-[10px] uppercase font-bold text-muted tracking-wider block">Price</span>
                        <span class="font-extrabold text-sm text-text">
                          Rs. {{ product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                        </span>
                      </div>
                      <div class="text-right">
                        <div class="flex items-center gap-1.5 justify-end">
                          <span
                            class="w-2 h-2 rounded-full"
                            :class="{
                              'bg-success': getTotalStock(product) > 10,
                              'bg-warning': getTotalStock(product) > 0 && getTotalStock(product) <= 10,
                              'bg-error': getTotalStock(product) === 0
                            }"
                          ></span>
                          <span
                            class="font-bold text-xs"
                            :class="{
                              'text-success': getTotalStock(product) > 10,
                              'text-warning': getTotalStock(product) > 0 && getTotalStock(product) <= 10,
                              'text-error': getTotalStock(product) === 0
                            }"
                          >
                            {{ getTotalStock(product) }} in stock
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Desktop Table View (>= 1280px) -->
                <div class="hidden xl:block bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl">
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                      <thead>
                        <tr class="bg-white border-b border-border text-muted font-semibold text-xs uppercase tracking-wider">
                          <th class="py-4 px-6">Product & Brand</th>
                          <th class="py-4 px-6">Model No.</th>
                          <th class="py-4 px-6">Category</th>
                          <th class="py-4 px-6">Specs (RAM/ROM)</th>
                          <th class="py-4 px-6">Price</th>
                          <th class="py-4 px-6">Stock</th>
                          <th class="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border text-sm">
                        <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-white transition-colors">
                          <!-- Name & Brand -->
                          <td class="py-4 px-6">
                            <div @click="openDetailModal(product)" class="flex items-center gap-3 cursor-pointer group/item">
                              <div class="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center shrink-0 group-hover/item:border-primary/50 transition-colors">
                                  <img
                                    v-if="getProductImage(product)"
                                    :src="getProductImage(product)"
                                    :alt="product.name"
                                    class="w-full h-full object-cover rounded-lg"
                                    @error="handleVariantImageError(getProductImageId(product))"
                                  />
                                  <div v-else class="flex items-center justify-center w-10 h-10 bg-surface border border-border rounded-lg text-muted">
                                    <Smartphone class="w-5 h-5" />
                                  </div>
                                </div>
                              <div>
                                <p class="font-bold text-text leading-tight group-hover/item:text-primary transition-colors">{{ product.name }}</p>
                                <div class="flex flex-wrap gap-1 mt-1 items-center">
                                  <span class="text-xs text-primary font-semibold uppercase tracking-wider mr-2">{{ product.brand }}</span>
                                  <span
                                    v-for="v in product.colorVariants"
                                    :key="v.id"
                                    v-show="v.color.toLowerCase() !== 'standard' && v.color.toLowerCase() !== 'default'"
                                    class="text-[9px] bg-white border border-border text-muted px-1 py-0.5 rounded uppercase tracking-wider font-semibold"
                                  >
                                    {{ v.color }}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <!-- Model -->
                          <td class="py-4 px-6 text-muted font-medium">
                            {{ product.modelNumber || 'N/A' }}
                          </td>
                          
                          <!-- Category -->
                          <td class="py-4 px-6 text-muted font-medium">
                            {{ product.category || 'Mobile Phones' }}
                          </td>

                          <!-- Specs -->
                          <td class="py-4 px-6">
                            <div class="flex flex-wrap gap-1.5 items-center">
                              <span v-if="product.ramGb && product.ramGb > 0" class="inline-flex items-center gap-1.5 text-xs bg-white border border-border text-muted px-2.5 py-1 rounded-lg">
                                {{ product.ramGb }}GB RAM
                              </span>
                              <span v-if="product.storageGb && product.storageGb > 0" class="inline-flex items-center gap-1.5 text-xs bg-white border border-border text-muted px-2.5 py-1 rounded-lg">
                                {{ product.storageGb >= 1000 ? (product.storageGb % 1024 === 0 ? product.storageGb / 1024 : product.storageGb / 1000) + 'TB' : product.storageGb + 'GB' }} ROM
                              </span>
                              <span v-if="!product.ramGb && !product.storageGb" class="text-muted">-</span>
                            </div>
                          </td>

                          <!-- Price -->
                          <td class="py-4 px-6 font-semibold text-text">
                            Rs. {{ product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                          </td>

                          <!-- Stock -->
                          <td class="py-4 px-6">
                            <div class="space-y-1.5">
                              <div class="flex items-center gap-2">
                                <span
                                  class="w-2 h-2 rounded-full"
                                  :class="{
                                    'bg-success': getTotalStock(product) > 10,
                                    'bg-warning': getTotalStock(product) > 0 && getTotalStock(product) <= 10,
                                    'bg-error': getTotalStock(product) === 0
                                  }"
                                ></span>
                                <span
                                  class="font-semibold text-xs"
                                  :class="{
                                    'text-success': getTotalStock(product) > 10,
                                    'text-warning': getTotalStock(product) > 0 && getTotalStock(product) <= 10,
                                    'text-error': getTotalStock(product) === 0
                                  }"
                                >
                                  {{ getTotalStock(product) }} units
                                </span>
                              </div>
                              <!-- Breakdown list -->
                              <div class="text-[10px] text-muted space-y-0.5 pl-4">
                                <div v-for="v in product.colorVariants" :key="v.id" class="flex items-center gap-1">
                                  <span class="truncate max-w-[80px] font-medium text-muted">{{ v.color }}:</span>
                                  <span class="font-bold text-text">{{ v.stockQuantity }}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <!-- Actions -->
                          <td class="py-4 px-6 text-right">
                            <div class="flex items-center justify-end gap-2">
                              <button
                                @click="openEditModal(product)"
                                class="p-2 rounded-lg bg-white hover:bg-surface border border-border hover:border-muted/40 text-muted hover:text-text transition-all cursor-pointer"
                                title="Edit Product"
                              >
                                <Pencil class="w-4 h-4" />
                              </button>
                              <button
                                @click="confirmDelete(product)"
                                class="p-2 rounded-lg bg-white hover:bg-error/10 border border-border hover:border-error/20 text-muted hover:text-error transition-all cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 class="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Orders View Body -->
      <div v-else-if="activeTab === 'orders'" class="flex-1 overflow-auto p-4 md:p-8">
        <div class="max-w-6xl mx-auto space-y-8">

          <!-- Error Banner -->
          <div v-if="ordersError" class="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-sm flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <AlertCircle class="w-5 h-5 text-error shrink-0" />
              <span>{{ ordersError }}</span>
            </div>
            <button @click="fetchOrders" class="px-4 py-1.5 bg-error/20 hover:bg-error/30 rounded-xl text-xs font-semibold transition-all cursor-pointer">
              Retry
            </button>
          </div>

          <!-- Loading state -->
          <div v-if="ordersLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 class="animate-spin h-10 w-10 text-primary" />
            <span class="text-muted text-sm">Fetching orders...</span>
          </div>

          <div v-else>
            <!-- Empty Orders State -->
            <div v-if="orders.length === 0" class="bg-surface border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div class="w-16 h-16 rounded-2xl bg-surface border border-border text-muted flex items-center justify-center mb-4">
                <ShoppingBag class="w-8 h-8" />
              </div>
              <h3 class="text-lg font-bold text-text mb-2">No orders yet</h3>
              <p class="text-muted text-sm max-w-sm">
                Orders placed by customers at checkout will show up here.
              </p>
            </div>

            <!-- Orders Table & Card View -->
            <div v-else>
              <!-- Mobile, Tablet & 1024px Screen Cards (< 1280px) -->
              <div class="xl:hidden space-y-4">
                <div
                  v-for="order in orders"
                  :key="order.id"
                  class="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:border-primary/30 transition-all"
                >
                  <!-- Top Header: Order #, Status Selector & Date -->
                  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div>
                      <span class="font-mono font-black text-sm text-text">#{{ order.orderNumber }}</span>
                      <span class="text-xs text-muted block font-medium">
                        {{ new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                      </span>
                    </div>
                    <div class="relative">
                      <select
                        :value="order.status"
                        @change="handleStatusChange(order, ($event.target as HTMLSelectElement).value as OrderStatus)"
                        class="appearance-none bg-white border border-border rounded-lg py-1.5 pl-2.5 pr-7 text-xs font-semibold text-text focus:outline-none focus:border-primary cursor-pointer"
                      >
                        <option v-for="status in orderStatusOptions" :key="status" :value="status">{{ status }}</option>
                      </select>
                      <ChevronDown class="w-3.5 h-3.5 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <!-- Customer & Order details -->
                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <p class="font-bold text-sm text-text">{{ order.name }}</p>
                      <p class="text-xs text-muted font-medium">{{ order.email }}</p>
                      <p class="text-xs text-muted/80 mt-1 font-semibold">{{ order.items.length }} item(s)</p>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] uppercase font-bold text-muted tracking-wider block">Total Amount</span>
                      <span class="font-black text-base text-primary">
                        Rs. {{ order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                      </span>
                    </div>
                  </div>

                  <!-- Action: Invoice details -->
                  <div class="pt-2 border-t border-border/40 flex justify-end">
                    <button
                      @click="openOrderModal(order)"
                      class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-surface border border-border hover:border-muted/40 text-text text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Eye class="w-4 h-4 text-primary" />
                      <span>View Details & Invoice</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Desktop Table View (>= 1280px) -->
              <div class="hidden xl:block bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl">
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-white border-b border-border text-muted font-semibold text-xs uppercase tracking-wider">
                        <th class="py-4 px-6">Order Number</th>
                        <th class="py-4 px-6">Customer</th>
                        <th class="py-4 px-6">Items</th>
                        <th class="py-4 px-6">Total</th>
                        <th class="py-4 px-6">Placed On</th>
                        <th class="py-4 px-6 text-right">Status</th>
                        <th class="py-4 px-6 text-center">Invoice</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border text-sm">
                      <tr v-for="order in orders" :key="order.id" class="hover:bg-white transition-colors">
                        <td class="py-4 px-6 font-mono font-bold text-text">{{ order.orderNumber }}</td>
                        <td class="py-4 px-6">
                          <p class="font-semibold text-text leading-tight">{{ order.name }}</p>
                          <p class="text-xs text-muted">{{ order.email }}</p>
                        </td>
                        <td class="py-4 px-6 text-muted font-medium">{{ order.items.length }} item(s)</td>
                        <td class="py-4 px-6 font-semibold text-text">
                          Rs. {{ order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                        </td>
                        <td class="py-4 px-6 text-muted font-medium">
                          {{ new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                        </td>
                        <td class="py-4 px-6 text-right">
                          <div class="relative inline-block">
                            <select
                              :value="order.status"
                              @change="handleStatusChange(order, ($event.target as HTMLSelectElement).value as OrderStatus)"
                              class="appearance-none bg-white border border-border rounded-lg py-1.5 pl-2.5 pr-7 text-xs font-semibold text-text focus:outline-none focus:border-primary cursor-pointer"
                            >
                              <option v-for="status in orderStatusOptions" :key="status" :value="status">{{ status }}</option>
                            </select>
                            <ChevronDown class="w-3.5 h-3.5 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </td>
                        <td class="py-4 px-6 text-center">
                          <button
                            @click="openOrderModal(order)"
                            class="p-2 rounded-lg bg-white hover:bg-surface border border-border hover:border-muted/40 text-muted hover:text-text transition-all cursor-pointer inline-flex items-center gap-1.5"
                            title="View Details & Invoice"
                          >
                            <Eye class="w-4 h-4" />
                            <span class="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Invoice</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

      </div>
    </div>

      <!-- Reviews View Body -->
      <div v-else-if="activeTab === 'reviews'" class="flex-1 overflow-auto p-4 md:p-8">
        <div class="max-w-6xl mx-auto">
          <AdminReviews />
        </div>
      </div>

      <!-- Customers View Body -->
      <div v-else-if="activeTab === 'customers'" class="flex-1 overflow-auto p-4 md:p-8">
        <div class="max-w-6xl mx-auto">
          <AdminCustomers />
        </div>
      </div>

      <!-- Coupons View Body -->
      <div v-else-if="activeTab === 'coupons'" class="flex-1 overflow-auto p-4 md:p-8">
        <div class="max-w-6xl mx-auto">
          <AdminCoupons />
        </div>
      </div>
    </main>

    <!-- Product Form Modal Overlay -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text/40 backdrop-blur-sm">
      <div class="bg-white border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-3xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
        <ProductForm
          :product="currentEditingProduct"
          @saved="onProductSaved"
          @cancel="closeModal"
        />
      </div>
    </div>

    <!-- Product Detail Modal Overlay -->
    <div v-if="showDetailModal && selectedDetailProduct" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text/40 backdrop-blur-sm animate-fade-in">
      <div class="bg-white border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
        <ProductDetailModal
          :product="selectedDetailProduct"
          @close="closeDetailModal"
        />
      </div>
    </div>

    <!-- Order Detail Modal Overlay -->
    <div v-if="showOrderModal && selectedOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text/40 backdrop-blur-sm animate-fade-in">
      <div class="bg-white border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
        <OrderDetailModal
          :order="selectedOrder"
          @close="closeOrderModal"
        />
      </div>
    </div>

    <!-- Deletion Confirmation Modal Overlay -->
    <div v-if="showDeleteConfirmModal && productToDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text/40 backdrop-blur-sm animate-fade-in">
      <div class="bg-white border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
        <div class="flex items-center gap-3 text-error">
          <AlertCircle class="w-6 h-6 shrink-0" />
          <h3 class="text-lg font-bold text-text">Delete Product</h3>
        </div>

        <p class="text-sm text-muted leading-relaxed font-sans">
          Are you sure you want to delete <span class="font-extrabold text-text">{{ productToDelete.name }}</span>? This action is permanent and cannot be undone.
        </p>

        <div class="flex gap-4 justify-end">
          <button
            @click="cancelDelete"
            class="px-5 py-2.5 bg-white hover:bg-surface border border-border text-muted font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="executeDelete"
            class="px-5 py-2.5 bg-error hover:bg-error/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-error/20"
          >
            Delete Product
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
