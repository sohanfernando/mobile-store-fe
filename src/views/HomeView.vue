<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { productApi } from '../api/productApi'
import type { Product } from '../types/product'
import { useToast } from '../composables/useToast'
import ProductCard from '../components/ProductCard.vue'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import ankerLogo from '../assets/anker-logo.svg'
import dysonLogo from '../assets/dyson-logo.png'
import heroVideo from '../assets/videos/Smartphones_transitioning_on_whi…_1080p_202607121819.mp4'
import {
  Smartphone, Search, ShoppingCart, Sparkles, X, Plus,
  Minus, Trash2, SlidersHorizontal, ChevronRight, ChevronDown,
  CheckCircle2, Star, Shield, ArrowRight,
  Watch, Headphones, BatteryCharging, Volume2, Camera, Home, Gamepad2
} from '@lucide/vue'

const router = useRouter()
const route = useRoute()
const { showToast } = useToast()
const products = ref<Product[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

// Authentication state
const isLoggedIn = ref(false)

// Shopping Cart state
const cart = ref<{ product: Product; variant: any; quantity: number }[]>([])
const isCartOpen = ref(false)

// Search & Filter state
const searchQuery = ref('')
const selectedBrand = ref('')
const selectedStorage = ref<number | null>(null)
const maxPrice = ref(600000)
const sortBy = ref('featured')
const showFilters = ref(false)
const selectedCategory = ref('')

const categoryIcons: Record<string, any> = {
  'Mobile Phones': Smartphone,
  'Smartwatches': Watch,
  'Earphones And Headphones': Headphones,
  'Power Banks': BatteryCharging,
  'Speakers': Volume2,
  'Cameras': Camera,
  'Appliances': Home,
  'Gaming Consoles': Gamepad2
}

const selectCategory = (categoryName: string) => {
  selectedCategory.value = categoryName
  selectedBrand.value = ''
  scrollToSection('catalog-section')
}

// Checkout success overlay
const showCheckoutSuccess = ref(false)
const successOrderId = ref('')

// Background Video Hero configuration

const handleQueryRoute = () => {
  if (route.query.category !== undefined) {
    selectedCategory.value = String(route.query.category || '')
    scrollToSection('catalog-section')
  }
  if (route.query.brand !== undefined) {
    selectedBrand.value = String(route.query.brand || '')
    scrollToSection('catalog-section')
  }
  if (route.query.sort !== undefined) {
    sortBy.value = String(route.query.sort || 'featured')
    scrollToSection('catalog-section')
  }
  if (route.query.search === 'true') {
    showFilters.value = true
    scrollToSection('catalog-section')
  }
  if (route.query.shopAll === 'true') {
    resetFilters()
    scrollToSection('catalog-section')
  }
}

onMounted(() => {
  fetchProducts()
  loadCart()
  checkAuth()
  handleQueryRoute()
})

watch(() => route.query, () => {
  handleQueryRoute()
})

const checkAuth = () => {
  isLoggedIn.value = !!localStorage.getItem('customer-token')
}

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

// Search & Filter Operations
const filteredProducts = computed(() => {
  let list = [...products.value]

  // Search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) || 
      (p.description && p.description.toLowerCase().includes(q))
    )
  }

  // Brand filter
  if (selectedBrand.value) {
    list = list.filter(p => p.brand.toLowerCase() === selectedBrand.value.toLowerCase())
  }

  // Category filter
  if (selectedCategory.value) {
    list = list.filter(p => p.category?.toLowerCase() === selectedCategory.value.toLowerCase())
  }

  // Storage filter
  if (selectedStorage.value) {
    if (selectedStorage.value === 1000) {
      list = list.filter(p => p.storageGb === 1000 || p.storageGb === 1024)
    } else if (selectedStorage.value === 2000) {
      list = list.filter(p => p.storageGb === 2000 || p.storageGb === 2048)
    } else {
      list = list.filter(p => p.storageGb === selectedStorage.value)
    }
  }

  // Price filter
  list = list.filter(p => p.price <= maxPrice.value)

  // Sort
  if (sortBy.value === 'price-low') {
    list.sort((a, b) => a.price - b.price)
  } else if (sortBy.value === 'price-high') {
    list.sort((a, b) => b.price - a.price)
  } else if (sortBy.value === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy.value === 'newest') {
    list.sort((a, b) => b.id - a.id)
  }

  return list
})

const brands = computed(() => {
  const brandSet = new Set(products.value.map(p => p.brand))
  return Array.from(brandSet)
})

// Collection aggregations
const newArrivals = computed(() => {
  return [...products.value].sort((a, b) => b.id - a.id).slice(0, 4)
})

const backInStock = computed(() => {
  return products.value.filter(p => {
    const stock = p.colorVariants?.reduce((sum, v) => sum + v.stockQuantity, 0) || 0
    return stock > 5
  }).slice(0, 4)
})

const bestSellers = computed(() => {
  return products.value.filter(p => p.price >= 250000).slice(0, 4)
})

// Cart Actions
const loadCart = () => {
  const stored = localStorage.getItem('mobile-store-cart')
  if (stored) {
    cart.value = JSON.parse(stored)
  }
}

const saveCart = () => {
  localStorage.setItem('mobile-store-cart', JSON.stringify(cart.value))
}


const updateCartQuantity = (index: number, change: number) => {
  const item = cart.value[index]
  const newQty = item.quantity + change
  if (newQty <= 0) {
    removeFromCart(index)
  } else if (newQty <= item.variant.stockQuantity) {
    item.quantity = newQty
    saveCart()
  } else {
    showToast(`Only ${item.variant.stockQuantity} units available in stock.`, 'warning')
  }
}

const removeFromCart = (index: number) => {
  cart.value.splice(index, 1)
  saveCart()
}

const totalCartItems = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0)
})

const cartSubtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
})

const orderNote = ref('')
const agreeTerms = ref(false)
const currentRecIndex = ref(0)

const drawerRecommendations = computed(() => {
  const list = products.value
  const cartProductIds = cart.value.map(item => item.product.id)
  return list.filter(p => !cartProductIds.includes(p.id))
})

const nextRec = () => {
  if (drawerRecommendations.value.length === 0) return
  currentRecIndex.value = (currentRecIndex.value + 1) % drawerRecommendations.value.length
}

const prevRec = () => {
  if (drawerRecommendations.value.length === 0) return
  currentRecIndex.value = (currentRecIndex.value - 1 + drawerRecommendations.value.length) % drawerRecommendations.value.length
}

const handleCheckout = () => {
  if (!agreeTerms.value) {
    showToast('Please agree to the terms and conditions to proceed.', 'warning')
    return
  }

  if (orderNote.value.trim()) {
    localStorage.setItem('checkout-instructions', orderNote.value)
  }

  isCartOpen.value = false
  router.push('/checkout')
}

// Filters reset
const resetFilters = () => {
  selectedBrand.value = ''
  selectedStorage.value = null
  selectedCategory.value = ''
  maxPrice.value = 600000
  searchQuery.value = ''
}

const selectBrandFromSlide = (brandName: string) => {
  selectedBrand.value = brandName
  scrollToSection('catalog-section')
}

const selectBrandFromCard = (brandName: string) => {
  selectedBrand.value = brandName
  scrollToSection('catalog-section')
}

const scrollToSection = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const getBrandLogoUrl = (brand: string): string => {
  const brandMap: Record<string, string> = {
    'apple': 'https://cdn.simpleicons.org/apple/2B2622',
    'samsung': 'https://cdn.simpleicons.org/samsung/1428A0',
    'google': 'https://www.vectorlogo.zone/logos/google/google-icon.svg',
    'oneplus': 'https://cdn.simpleicons.org/oneplus/F5001C',
    'xiaomi': 'https://cdn.simpleicons.org/xiaomi/FF6700',
    'oppo': 'https://cdn.simpleicons.org/oppo/008A5E',
    'sony': 'https://cdn.simpleicons.org/sony/000000',
    'jbl': 'https://cdn.simpleicons.org/jbl/FF6600',
    'anker': ankerLogo,
    'dyson': dysonLogo,
  }
  return brandMap[brand.toLowerCase()] || ''
}

</script>

<template>
  <div class="min-h-screen bg-background text-text font-sans pb-1 relative overflow-hidden select-none">

    <!-- Sticky Navbar -->
    <Navbar
      :is-logged-in="isLoggedIn"
      :total-cart-items="totalCartItems"
      @toggle-cart="isCartOpen = !isCartOpen"
      @toggle-filters="showFilters = !showFilters; scrollToSection('catalog-section')"
      @select-category="selectCategory"
      @select-brand="(b) => { selectedBrand = b; scrollToSection('catalog-section') }"
      @select-sort="(s) => { sortBy = s; scrollToSection('catalog-section') }"
      @scroll-to="scrollToSection"
    />

    <!-- Hero Section (Video Banner) -->
    <!-- Hero Section (Video Banner Side-by-Side) -->
    <section id="hero-section" class="relative max-w-7xl mx-auto px-6 mt-6 min-h-[600px] rounded-[36px] overflow-hidden border border-border shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 bg-white py-12 md:py-6">
      
      <!-- Left details -->
      <div class="relative z-20 md:w-1/2 px-8 sm:px-12 md:px-16 text-text space-y-6">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles class="w-3.5 h-3.5" />
          <span>New Release</span>
        </div>

        <div class="space-y-3">
          <span class="text-xs font-bold text-primary uppercase tracking-widest">OnePlus</span>
          <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-text tracking-tight leading-tight">OnePlus 15</h1>
          <p class="text-xs sm:text-sm text-muted font-semibold max-w-md leading-relaxed">
            The peak of power and performance. Experience the stunning display, Snapdragon 8 Gen 5 processor, and a custom Hasselblad camera system.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-4 pt-4">
          <button
            @click="selectBrandFromSlide('OnePlus')"
            class="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-primary/30 cursor-pointer transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <span>Shop OnePlus</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
          <span class="text-text/80 text-xs font-bold bg-white/60 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-border">Starting from Rs. 279,990</span>
        </div>
      </div>

      <!-- Right side: Video showing OnePlus 15 (watermark hidden by scale-cropping) -->
      <div class="md:w-1/2 w-full flex justify-center items-center px-6 md:px-12">
        <div class="relative w-full h-[450px] rounded-[28px] overflow-hidden bg-white">
          <video
            autoplay
            loop
            muted
            playsinline
            class="absolute inset-0 w-full h-full object-cover scale-[1.08] origin-top-left"
          >
            <source :src="heroVideo" type="video/mp4" />
          </video>
        </div>
      </div>

    </section>

    <!-- Featured Collections Section -->
    <section class="max-w-7xl mx-auto px-6 mt-20">
      <div v-reveal class="mb-10 text-center sm:text-left">
        <h2 class="text-2xl font-black text-text tracking-tight">Featured Collections</h2>
        <p class="text-xs text-muted mt-1">Curated catalogs with direct premium links</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <!-- Apple Collection -->
        <div
          v-reveal="{ delay: 0 }"
          @click="selectBrandFromCard('Apple')"
          class="bg-surface border border-border rounded-3xl p-6 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
        >
          <div class="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-6">
            <Sparkles class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-text group-hover:text-primary transition-colors">Apple Ecosystem</h3>
          <p class="text-muted text-xs mt-2 leading-relaxed">Discover iPhones featuring advanced computational photography.</p>
          <div class="flex items-center gap-1.5 text-xs text-primary font-bold mt-6 group-hover:gap-2.5 transition-all">
            <span>Explore Now</span>
            <ChevronRight class="w-4 h-4" />
          </div>
        </div>

        <!-- Samsung Collection -->
        <div
          v-reveal="{ delay: 60 }"
          @click="selectBrandFromCard('Samsung')"
          class="bg-surface border border-border rounded-3xl p-6 hover:border-secondary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
        >
          <div class="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center mb-6">
            <Smartphone class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-text group-hover:text-secondary transition-colors">Galaxy AI Series</h3>
          <p class="text-muted text-xs mt-2 leading-relaxed">Integrated S-Pen, huge AMOLED screens, and custom zoom cameras.</p>
          <div class="flex items-center gap-1.5 text-xs text-secondary font-bold mt-6 group-hover:gap-2.5 transition-all">
            <span>Explore Now</span>
            <ChevronRight class="w-4 h-4" />
          </div>
        </div>

        <!-- Google Collection -->
        <div
          v-reveal="{ delay: 120 }"
          @click="selectBrandFromCard('Google')"
          class="bg-surface border border-border rounded-3xl p-6 hover:border-primary-dark/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
        >
          <div class="w-12 h-12 rounded-2xl bg-primary-dark/10 border border-primary-dark/20 text-primary-dark flex items-center justify-center mb-6">
            <Shield class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-text group-hover:text-primary-dark transition-colors">Pixel Magic</h3>
          <p class="text-muted text-xs mt-2 leading-relaxed">Google Tensor engines giving on-device translation and magic editors.</p>
          <div class="flex items-center gap-1.5 text-xs text-primary-dark font-bold mt-6 group-hover:gap-2.5 transition-all">
            <span>Explore Now</span>
            <ChevronRight class="w-4 h-4" />
          </div>
        </div>

        <!-- Budget Collection -->
        <div
          v-reveal="{ delay: 180 }"
          @click="selectedBrand = ''; maxPrice = 160000; scrollToSection('catalog-section')"
          class="bg-surface border border-border rounded-3xl p-6 hover:border-success/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
        >
          <div class="w-12 h-12 rounded-2xl bg-success/10 border border-success/20 text-success flex items-center justify-center mb-6">
            <Star class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-text group-hover:text-success transition-colors">Budget Favorites</h3>
          <p class="text-muted text-xs mt-2 leading-relaxed">Incredible value devices with full high refresh rate displays under Rs. 160,000.</p>
          <div class="flex items-center gap-1.5 text-xs text-success font-bold mt-6 group-hover:gap-2.5 transition-all">
            <span>Explore Now</span>
            <ChevronRight class="w-4 h-4" />
          </div>
        </div>

      </div>
    </section>

    <!-- New Arrivals Section -->
    <section class="max-w-7xl mx-auto px-6 mt-20">
      <div v-reveal class="mb-10 text-center sm:text-left">
        <h2 class="text-2xl font-black text-text tracking-tight">New Arrivals</h2>
        <p class="text-xs text-muted mt-1">The latest devices added to our inventory</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductCard
          v-for="(product, index) in newArrivals"
          :key="'new-'+product.id"
          v-reveal="{ delay: index * 60 }"
          :product="product"
          :isAdmin="false"
          @click="router.push('/product/' + product.id)"
        />
      </div>
    </section>

    <!-- Back in Stock Section -->
    <section class="max-w-7xl mx-auto px-6 mt-20">
      <div v-reveal class="mb-10 text-center sm:text-left">
        <h2 class="text-2xl font-black text-text tracking-tight">Back in Stock</h2>
        <p class="text-xs text-muted mt-1">Highly demanded models restocked in our shelves</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductCard
          v-for="(product, index) in backInStock"
          :key="'back-'+product.id"
          v-reveal="{ delay: index * 60 }"
          :product="product"
          :isAdmin="false"
          @click="router.push('/product/' + product.id)"
        />
      </div>
    </section>

    <!-- Popular Categories -->
    <section class="max-w-7xl mx-auto px-6 mt-20">
      <div v-reveal class="mb-10 text-center">
        <h2 class="text-2xl font-black text-text tracking-tight">Popular Categories</h2>
        <p class="text-xs text-muted mt-1">Browse items by category type</p>
      </div>

      <div class="flex flex-wrap justify-center gap-6">
        <button
          v-for="(cat, index) in ['Mobile Phones', 'Smartwatches', 'Earphones And Headphones', 'Power Banks', 'Speakers', 'Cameras', 'Appliances', 'Gaming Consoles']"
          :key="cat"
          v-reveal="{ delay: index * 40 }"
          @click="selectCategory(cat)"
          class="px-6 py-4 rounded-2xl bg-surface border border-border hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 text-muted hover:text-text transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-w-[130px] h-[100px]"
        >
          <component :is="categoryIcons[cat]" class="w-5 h-5 text-primary" />
          <span class="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">
            {{ cat === 'Earphones And Headphones' ? 'Audio' : cat }}
          </span>
        </button>
      </div>
    </section>

    <!-- Catalog, Search and Live Filters Section -->
    <section id="catalog-section" class="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-border">

      <!-- Section Header -->
      <div v-reveal class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 class="text-3xl font-black text-text tracking-tight">
            {{ selectedCategory ? selectedCategory : 'All Products' }}
          </h2>
          <p class="text-xs text-muted mt-1">Search, filter, and compare across brands</p>
        </div>

        <!-- Search Bar -->
        <div class="relative w-full md:w-80">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search products, specs..."
            class="w-full bg-white border border-border rounded-xl py-3 pl-10 pr-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs"
          />
          <Search class="w-4 h-4 text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />

          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-text"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Filters Panel Controls -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-3">
          <button
            @click="showFilters = !showFilters"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border hover:border-muted/40 text-muted hover:text-text transition-all text-xs font-bold cursor-pointer"
          >
            <SlidersHorizontal class="w-4 h-4" />
            <span>Filters</span>
          </button>

          <button
            v-if="selectedBrand || selectedStorage || selectedCategory || maxPrice < 600000"
            @click="resetFilters"
            class="text-xs text-primary hover:text-primary-dark font-semibold underline cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>

        <!-- Sorting -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted font-medium">Sort By:</span>
          <div class="relative">
            <select
              v-model="sortBy"
              class="appearance-none bg-white border border-border rounded-xl pl-3 pr-8 py-2 text-xs text-text focus:outline-none focus:border-primary"
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

      <!-- Filters Drawer/Accordion -->
      <Transition name="fade">
        <div v-if="showFilters" class="p-6 bg-surface border border-border rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 shadow-inner">

          <!-- Category Filter -->
          <div class="space-y-2.5">
            <label class="block text-[10px] font-bold uppercase tracking-wider text-muted">Filter Category</label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="selectedCategory = ''"
                class="px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                :class="!selectedCategory ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted hover:text-text'"
              >
                All
              </button>
              <button
                v-for="cat in ['Mobile Phones', 'Smartwatches', 'Earphones And Headphones', 'Power Banks', 'Speakers', 'Cameras', 'Appliances', 'Gaming Consoles']"
                :key="cat"
                @click="selectedCategory = cat"
                class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer"
                :class="selectedCategory === cat ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted hover:text-text'"
              >
                {{ cat === 'Earphones And Headphones' ? 'Audio' : cat }}
              </button>
            </div>
          </div>

          <!-- Brand Filter -->
          <div class="space-y-2.5">
            <label class="block text-[10px] font-bold uppercase tracking-wider text-muted">Filter Brand</label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="selectedBrand = ''"
                class="px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                :class="!selectedBrand ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted hover:text-text'"
              >
                All
              </button>
              <button
                v-for="b in brands"
                :key="b"
                @click="selectedBrand = b"
                class="px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                :class="selectedBrand === b ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted hover:text-text'"
              >
                {{ b }}
              </button>
            </div>
          </div>

          <!-- Storage capacity filter -->
          <div class="space-y-2.5">
            <label class="block text-[10px] font-bold uppercase tracking-wider text-muted">Internal Storage</label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="selectedStorage = null"
                class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer"
                :class="selectedStorage === null ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted hover:text-text'"
              >
                All
              </button>
              <button
                v-for="s in [128, 256, 512, 1000, 2000]"
                :key="s"
                @click="selectedStorage = s"
                class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer"
                :class="selectedStorage === s ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted hover:text-text'"
              >
                {{ s >= 1000 ? (s % 1024 === 0 ? s / 1024 : s / 1000) + ' TB' : s + ' GB' }}
              </button>
            </div>
          </div>

          <!-- Price range filter -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <label class="block text-[10px] font-bold uppercase tracking-wider text-muted">Max Price</label>
              <span class="text-xs font-mono font-bold text-primary">Rs. {{ maxPrice.toLocaleString() }}</span>
            </div>
            <input
              v-model.number="maxPrice"
              type="range"
              min="20000"
              max="600000"
              step="10000"
              class="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div class="flex items-center justify-between text-[10px] text-muted font-mono">
              <span>Rs. 20,000</span>
              <span>Rs. 600,000</span>
            </div>
          </div>

        </div>
      </Transition>

      <!-- Products Grid -->
      <div v-if="filteredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductCard 
          v-for="product in filteredProducts" 
          :key="product.id"
          :product="product" 
          :isAdmin="false"
          @click="router.push('/product/' + product.id)"
        />
      </div>

      <!-- Empty state filters -->
      <div v-else class="text-center py-20 flex flex-col items-center justify-center bg-surface border border-border rounded-3xl p-8">
        <div class="w-16 h-16 rounded-2xl bg-white border border-border text-muted flex items-center justify-center mb-4">
          <Search class="w-7 h-7" />
        </div>
        <h3 class="text-lg font-bold text-text mb-1.5">No products match your search</h3>
        <p class="text-muted text-sm max-w-sm mb-6">
          Try adjusting your filter settings or search query to find the product you need.
        </p>
        <button
          @click="resetFilters"
          class="px-5 py-2.5 bg-white border border-border hover:border-muted/40 text-text font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

    </section>

    <!-- Best Sellers Section -->
    <section class="max-w-7xl mx-auto px-6 mt-20">
      <div v-reveal class="mb-10 text-center sm:text-left">
        <h2 class="text-2xl font-black text-text tracking-tight">Best Sellers</h2>
        <p class="text-xs text-muted mt-1">Our top-selling flagship devices</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductCard
          v-for="(product, index) in bestSellers"
          :key="'best-'+product.id"
          v-reveal="{ delay: index * 60 }"
          :product="product"
          :isAdmin="false"
          @click="router.push('/product/' + product.id)"
        />
      </div>
    </section>

    <!-- Brands Grid -->
    <section class="max-w-7xl mx-auto px-6 mt-20 mb-20">
      <div v-reveal class="mb-10 text-center">
        <h2 class="text-2xl font-black text-text tracking-tight">Official Brands</h2>
        <p class="text-xs text-muted mt-1">We sell authentic gadgets directly from manufacturers</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
        <div
          v-for="(brandName, index) in ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Sony', 'JBL', 'Anker', 'Dyson']"
          :key="brandName"
          v-reveal="{ delay: index * 30 }"
          @click="selectBrandFromCard(brandName)"
          class="py-6 px-4 border border-border rounded-2xl hover:border-primary/30 hover:shadow-md bg-surface flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:scale-105 group"
        >
          <img 
            :src="getBrandLogoUrl(brandName)" 
            :alt="brandName" 
            class="object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" 
            :class="brandName === 'Anker' || brandName === 'Dyson' ? 'h-5 my-1.5' : 'h-8'"
          />
          <span class="font-bold text-[10px] tracking-widest text-muted group-hover:text-text uppercase transition-colors">{{ brandName }}</span>
        </div>
      </div>
    </section>

    <!-- Footer Section -->
    <Footer @scroll-to="scrollToSection" />

    <!-- Shopping Cart Slide-out Drawer Overlay -->
    <Transition name="fade">
      <div
        v-if="isCartOpen"
        @click="isCartOpen = false"
        class="fixed inset-0 z-50 bg-text/40"
      ></div>
    </Transition>

    <Transition name="cart">
      <div
        v-if="isCartOpen"
        class="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-border z-50 shadow-2xl p-6 flex flex-col justify-between"
      >
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-border">
          <div class="flex items-center gap-2">
            <ShoppingCart class="w-5 h-5 text-primary" />
            <h3 class="text-base font-bold text-text">Cart ({{ totalCartItems }})</h3>
          </div>
          <button
            @click="isCartOpen = false"
            class="p-1.5 rounded-lg bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Cart Items list -->
        <div class="flex-1 overflow-y-auto py-6 space-y-4">
          <div v-if="cart.length === 0" class="text-center py-20 text-muted space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-surface border border-border text-muted flex items-center justify-center mx-auto">
              <ShoppingCart class="w-7 h-7" />
            </div>
            <p class="text-xs font-bold uppercase tracking-wider">Your cart is empty</p>
          </div>

          <div
            v-for="(item, index) in cart"
            :key="index"
            class="flex items-center justify-between bg-surface border border-border p-4 rounded-2xl relative"
          >
            <div class="flex items-center gap-3">
              <!-- Variant preview or smartphone icon -->
              <div class="w-12 h-12 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="item.variant.imageUrl" :src="item.variant.imageUrl" :alt="item.product.name" class="w-full h-full object-cover" />
                <Smartphone v-else class="w-6 h-6 text-muted" />
              </div>

              <div>
                <h4 class="text-xs font-bold text-text truncate max-w-[150px]">{{ item.product.name }}</h4>
                <p class="text-[10px] text-primary font-bold uppercase mt-0.5">{{ item.variant.color }}</p>
                <p class="text-[10px] text-muted font-mono mt-1">Rs. {{ item.product.price.toLocaleString() }}</p>
              </div>
            </div>

            <!-- Qty actions & Delete -->
            <div class="flex flex-col items-end gap-2.5">
              <button
                @click="removeFromCart(index)"
                class="text-muted hover:text-error transition-colors p-1"
                title="Remove item"
              >
                <Trash2 class="w-4 h-4" />
              </button>

              <div class="flex items-center gap-1 bg-white border border-border rounded-lg p-1">
                <button
                  @click="updateCartQuantity(index, -1)"
                  class="p-1 text-muted hover:text-text transition-colors cursor-pointer"
                >
                  <Minus class="w-3 h-3" />
                </button>
                <span class="text-xs font-mono font-bold text-text px-2 select-none">{{ item.quantity }}</span>
                <button
                  @click="updateCartQuantity(index, 1)"
                  class="p-1 text-muted hover:text-text transition-colors cursor-pointer"
                >
                  <Plus class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations Carousel Slider -->
        <div v-if="drawerRecommendations.length > 0 && cart.length > 0" class="border-t border-border pt-4 pb-3">
          <div class="flex items-center justify-between mb-2.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted">Complete Your Setup</span>
            <div class="flex gap-1.5">
              <button @click="prevRec" class="p-1 rounded bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer">
                <span class="text-[8px]">◀</span>
              </button>
              <button @click="nextRec" class="p-1 rounded bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer">
                <span class="text-[8px]">▶</span>
              </button>
            </div>
          </div>

          <!-- Recommendation Card -->
          <div class="bg-surface border border-border rounded-2xl p-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="drawerRecommendations[currentRecIndex].colorVariants?.[0]?.images?.[0]" :src="drawerRecommendations[currentRecIndex].colorVariants[0].images[0]" :alt="drawerRecommendations[currentRecIndex].name" class="w-full h-full object-cover" />
                <Smartphone v-else class="w-5 h-5 text-muted" />
              </div>
              <div class="min-w-0">
                <h4 class="text-[11px] font-black text-text truncate max-w-[130px]">{{ drawerRecommendations[currentRecIndex].name }}</h4>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[10px] text-primary font-mono font-bold">Rs. {{ drawerRecommendations[currentRecIndex].price.toLocaleString() }}</span>
                  <div class="flex items-center text-warning text-[8px]">
                    <Star class="w-2.5 h-2.5 fill-warning" />
                    <span class="ml-0.5 text-muted font-bold">4.8</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              @click="router.push('/product/' + drawerRecommendations[currentRecIndex].id); isCartOpen = false"
              class="px-2.5 py-1.5 bg-primary hover:bg-primary-dark text-white text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Choose Options
            </button>
          </div>
        </div>

        <!-- Footer billing -->
        <div class="border-t border-border pt-4 space-y-4">
          <!-- Note -->
          <div v-if="cart.length > 0" class="space-y-1.5">
            <label for="drawer-note" class="block text-[9px] font-bold uppercase tracking-wider text-muted">Add order note</label>
            <textarea
              id="drawer-note"
              v-model="orderNote"
              rows="2"
              placeholder="E.g. courier instructions, timing, etc."
              class="w-full bg-white border border-border rounded-xl p-2.5 text-[10px] text-text focus:outline-none focus:border-primary resize-none font-medium"
            ></textarea>
          </div>

          <div class="flex items-center justify-between text-xs font-bold text-text">
            <span class="text-muted">Subtotal</span>
            <span class="font-mono">Rs. {{ cartSubtotal.toLocaleString() }}</span>
          </div>

          <!-- Terms -->
          <div v-if="cart.length > 0" class="flex items-start gap-2.5">
            <input
              v-model="agreeTerms"
              type="checkbox"
              id="drawer-terms"
              class="w-3.5 h-3.5 rounded border-border bg-white text-primary focus:ring-primary/20 focus:ring-2 mt-0.5 cursor-pointer"
            />
            <label for="drawer-terms" class="text-[10px] text-muted select-none cursor-pointer leading-normal">
              I agree with the <a href="#" class="underline hover:text-primary-dark font-semibold transition-colors">terms and conditions</a>
            </label>
          </div>

          <!-- Separate Actions -->
          <div class="grid grid-cols-2 gap-3" v-if="cart.length > 0">
            <button
              @click="isCartOpen = false; router.push('/cart')"
              class="w-full py-3 bg-white hover:bg-surface border border-border text-text font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              View Cart
            </button>

            <button
              @click="handleCheckout"
              class="w-full py-3 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Checkout</span>
              <ArrowRight class="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </Transition>



    <!-- Checkout Success Overlay -->
    <Transition name="fade">
      <div
        v-if="showCheckoutSuccess"
        class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-text/50"
      >
        <div class="text-center max-w-sm p-8 bg-white border border-border rounded-[32px] shadow-2xl flex flex-col items-center">
          <div class="w-20 h-20 rounded-full bg-success/10 border border-success/20 text-success flex items-center justify-center mb-6 shadow-inner animate-bounce">
            <CheckCircle2 class="w-10 h-10" />
          </div>
          <h2 class="text-2xl font-black text-text tracking-tight">Order Placed!</h2>
          <p class="text-muted text-xs mt-3 leading-relaxed">
            Your premium order <span class="font-mono text-primary font-bold">{{ successOrderId }}</span> has been submitted successfully.
          </p>
          <p class="text-[10px] text-muted mt-6 animate-pulse">
            Redirecting to your orders log...
          </p>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Cart slide-out transitions */
.cart-enter-active,
.cart-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.cart-enter-from,
.cart-leave-to {
  transform: translateX(100%);
}
</style>
