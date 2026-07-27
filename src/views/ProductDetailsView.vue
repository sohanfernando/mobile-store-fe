<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productApi } from '../api/productApi'
import { reviewApi } from '../api/reviewApi'
import type { Product } from '../types/product'
import type { Review } from '../types/review'
import { useToast } from '../composables/useToast'
import { useSeo } from '../composables/useSeo'
import ProductCard from '../components/ProductCard.vue'
import Navbar from '../components/Navbar.vue'
import { 
  Smartphone, ShoppingCart, X, Plus, 
  Minus, Trash2, Star, 
  Share2, MessageSquare, ArrowLeftRight, ChevronDown, ChevronUp
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const product = ref<Product | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

// Nav states
const isLoggedIn = ref(false)
const adminLoggedIn = ref(false)
const isCartOpen = ref(false)
const cart = ref<any[]>([])

// Details states
const selectedVariantIndex = ref(0)
const quantity = ref(1)
const activeTab = ref<'details' | 'specs' | 'reviews'>('details')
const expandedFaq = ref<number | null>(null)
const writeReviewOpen = ref(false)
const userReviewText = ref('')
const userReviewRating = ref(5)
const isImageBroken = ref(false)

const handleImageError = () => {
  isImageBroken.value = true
}

const checkAuth = () => {
  isLoggedIn.value = !!localStorage.getItem('customer-token')
  adminLoggedIn.value = !!localStorage.getItem('admin-token')
}

// Fallback seed data in case backend catalog is empty
const seedMockProducts = (): Product[] => {
  return [
    {
      id: 901,
      name: 'iPhone 15 Pro Max',
      brand: 'Apple',
      modelNumber: 'A3106',
      description: 'The titanium powerhouse from Apple featuring the cutting-edge A17 Pro SoC, a 120Hz Super Retina XDR display, and 5x optical telephoto lens.',
      price: 383680,
      category: 'Mobile Phones',
      ramGb: 8,
      storageGb: 256,
      warrantyPeriod: 12,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9011, color: 'Natural Titanium', stockQuantity: 15, images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=400&q=80'] },
        { id: 9012, color: 'Space Black', stockQuantity: 12, images: ['https://images.unsplash.com/photo-1695048133031-64d5c9071661?auto=format&fit=crop&w=400&q=80'] }
      ]
    },
    {
      id: 902,
      name: 'Galaxy S24 Ultra',
      brand: 'Samsung',
      modelNumber: 'SM-S928B',
      description: 'Equipped with an integrated S-Pen, dynamic AMOLED 2X, a 200MP camera, and a titanium frame powered by Snapdragon 8 Gen 3.',
      price: 415680,
      category: 'Mobile Phones',
      ramGb: 12,
      storageGb: 512,
      warrantyPeriod: 24,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9021, color: 'Titanium Yellow', stockQuantity: 8, images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80'] },
        { id: 9022, color: 'Titanium Gray', stockQuantity: 14, images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=400&q=80'] }
      ]
    },
    {
      id: 903,
      name: 'Google Pixel 8 Pro',
      brand: 'Google',
      modelNumber: 'GC3VE',
      description: 'The smart phone that keeps you moving. Google Tensor G3 powers Gemini Nano on-device, offering magic eraser, best take, and real-time translation.',
      price: 319680,
      category: 'Mobile Phones',
      ramGb: 12,
      storageGb: 128,
      warrantyPeriod: 12,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9031, color: 'Bay Blue', stockQuantity: 7, images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80'] },
        { id: 9032, color: 'Obsidian Black', stockQuantity: 9, images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'] }
      ]
    },
    {
      id: 904,
      name: 'OnePlus 12',
      brand: 'OnePlus',
      modelNumber: 'CPH2581',
      description: 'Unmatched charging capabilities with 100W SUPERVOOC. Premium display, 4th Gen Hasselblad Camera, and Snapdragon 8 Gen 3.',
      price: 255680,
      category: 'Mobile Phones',
      ramGb: 16,
      storageGb: 512,
      warrantyPeriod: 18,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9041, color: 'Flowy Emerald', stockQuantity: 2, images: ['https://images.unsplash.com/photo-1565630916779-e303be97b6f5?auto=format&fit=crop&w=400&q=80'] },
        { id: 9042, color: 'Silky Black', stockQuantity: 18, images: ['https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=400&q=80'] }
      ]
    },
    {
      id: 906,
      name: 'Apple Watch Ultra 2',
      brand: 'Apple',
      modelNumber: 'MRFW3HN/A',
      description: 'The ultimate sports watch. Featuring a rugged titanium case, up to 36 hours of battery life.',
      price: 279000,
      category: 'Smartwatches',
      ramGb: 0,
      storageGb: 64,
      warrantyPeriod: 12,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9061, color: 'Orange Ocean Band', stockQuantity: 8, images: ['https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=400&q=80'] }
      ]
    },
    {
      id: 907,
      name: 'Sony WH-1000XM5 Headphones',
      brand: 'Sony',
      modelNumber: 'WH1000XM5/B',
      description: 'Industry-leading noise canceling overhead headphones.',
      price: 125000,
      category: 'Earphones And Headphones',
      ramGb: 0,
      storageGb: 0,
      warrantyPeriod: 12,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9071, color: 'Black', stockQuantity: 15, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'] }
      ]
    },
    {
      id: 909,
      name: 'JBL Charge 5 Portable Speaker',
      brand: 'JBL',
      modelNumber: 'JBLCHARGE5BLK',
      description: 'Deliver bold JBL Original Pro Sound.',
      price: 68000,
      category: 'Speakers',
      ramGb: 0,
      storageGb: 0,
      warrantyPeriod: 12,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9091, color: 'Midnight Black', stockQuantity: 20, images: ['https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=400&q=80'] }
      ]
    },
    {
      id: 911,
      name: 'PlayStation 5 Slim Console',
      brand: 'Sony',
      modelNumber: 'CFI-2000',
      description: 'Experience lightning-fast loading with an ultra-high speed SSD.',
      price: 185000,
      category: 'Gaming Consoles',
      ramGb: 16,
      storageGb: 1024,
      warrantyPeriod: 12,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9111, color: 'Classic White', stockQuantity: 14, images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80'] }
      ]
    }
  ]
}

const applyProductSeo = (p: Product) => {
  const image = p.colorVariants?.[0]?.images?.[0]
  const description = p.description
    ? p.description.slice(0, 160)
    : `Buy the ${p.brand} ${p.name} at TechPulse. ${p.ramGb ? `${p.ramGb}GB RAM, ` : ''}${p.storageGb}GB storage. Authentic product with warranty.`
  const inStock = (p.colorVariants?.reduce((sum, v) => sum + v.stockQuantity, 0) || 0) > 0

  useSeo({
    title: `${p.name} — ${p.brand}`,
    description,
    image,
    type: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      brand: { '@type': 'Brand', name: p.brand },
      description,
      image: image ? [image] : undefined,
      sku: p.modelNumber,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'LKR',
        price: p.price,
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: window.location.href
      }
    }
  })
}

const fetchProductDetails = async (id: number) => {
  isLoading.value = true
  errorMessage.value = ''
  isImageBroken.value = false
  selectedVariantIndex.value = 0
  quantity.value = 1

  try {
    const response = await productApi.getById(id)
    if (response.success && response.data) {
      product.value = response.data
    } else {
      // Find locally
      const mockList = seedMockProducts()
      product.value = mockList.find(p => p.id === id) || null
    }
  } catch (error: any) {
    const mockList = seedMockProducts()
    product.value = mockList.find(p => p.id === id) || null
  } finally {
    isLoading.value = false
    if (!product.value) {
      errorMessage.value = 'Product not found.'
      reviewsList.value = []
    } else {
      applyProductSeo(product.value)
      fetchReviews(product.value.id)
    }
  }
}

const allProducts = ref<Product[]>([])
const fetchAllProducts = async () => {
  try {
    const response = await productApi.getAll()
    if (response.success && response.data && response.data.length > 0) {
      allProducts.value = response.data
    } else {
      allProducts.value = seedMockProducts()
    }
  } catch (e) {
    allProducts.value = seedMockProducts()
  }
}

// Watch route to reload details if ID changes
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchProductDetails(Number(newId))
  }
})

onMounted(() => {
  checkAuth()
  loadCart()
  fetchAllProducts()
  if (route.params.id) {
    fetchProductDetails(Number(route.params.id))
  }
})

// Current color variant
const currentVariant = computed(() => {
  if (!product.value || !product.value.colorVariants || product.value.colorVariants.length === 0) return null
  return product.value.colorVariants[selectedVariantIndex.value]
})

// Photo gallery for the currently selected color variant
const selectedImageIndex = ref(0)
const currentImages = computed(() => currentVariant.value?.images || [])

watch(selectedVariantIndex, () => {
  selectedImageIndex.value = 0
  isImageBroken.value = false
})

// Related products
const relatedProducts = computed(() => {
  if (!product.value) return []
  return allProducts.value
    .filter(p => p.id !== product.value?.id)
    .slice(0, 4)
})

// Total stock for active color
const activeStock = computed(() => {
  return currentVariant.value ? currentVariant.value.stockQuantity : 0
})



// Cart persistence
const loadCart = () => {
  const stored = localStorage.getItem('mobile-store-cart')
  if (stored) {
    cart.value = JSON.parse(stored)
  }
}

const saveCart = () => {
  localStorage.setItem('mobile-store-cart', JSON.stringify(cart.value))
}

const handleAddToCart = () => {
  if (!product.value || !currentVariant.value) return

  const existing = cart.value.find(
    item => item.product.id === product.value?.id && item.variant.id === currentVariant.value?.id
  )

  if (existing) {
    const totalNewQty = existing.quantity + quantity.value
    if (totalNewQty <= currentVariant.value.stockQuantity) {
      existing.quantity = totalNewQty
    } else {
      existing.quantity = currentVariant.value.stockQuantity
      showToast(`Updated to maximum available stock (${currentVariant.value.stockQuantity} units).`, 'warning')
    }
  } else {
    cart.value.push({
      product: product.value,
      variant: currentVariant.value,
      quantity: quantity.value
    })
  }

  saveCart()
  isCartOpen.value = true
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
    showToast(`Only ${item.variant.stockQuantity} units in stock.`, 'warning')
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

// Reviews log
const reviewsList = ref<Review[]>([])
const isSubmittingReview = ref(false)

const fetchReviews = async (productId: number) => {
  try {
    const response = await reviewApi.getForProduct(productId)
    if (response.success && response.data) {
      reviewsList.value = response.data
    } else {
      reviewsList.value = []
    }
  } catch (e) {
    reviewsList.value = []
  }
}

const averageRating = computed(() => {
  if (reviewsList.value.length === 0) return 0
  const total = reviewsList.value.reduce((sum, r) => sum + r.rating, 0)
  return total / reviewsList.value.length
})

const getCustomerDisplayName = (email: string): string => {
  const profiles = JSON.parse(localStorage.getItem('customer-profiles') || '{}')
  const name = profiles[email]?.name
  return name && name.trim() ? name.trim() : email.split('@')[0]
}

const handleAddReview = async () => {
  if (!userReviewText.value.trim() || !product.value) return

  const authorEmail = localStorage.getItem('customer-email')
  if (!authorEmail) {
    showToast('Please sign in to write a review.', 'warning')
    return
  }

  isSubmittingReview.value = true
  try {
    const response = await reviewApi.create(product.value.id, {
      authorEmail,
      authorName: getCustomerDisplayName(authorEmail),
      rating: userReviewRating.value,
      title: userReviewRating.value >= 4 ? 'Great Device' : 'Average',
      text: userReviewText.value
    })
    if (response.success && response.data) {
      reviewsList.value.unshift(response.data)
      showToast('Thanks for your review!', 'success')
      userReviewText.value = ''
      userReviewRating.value = 5
      writeReviewOpen.value = false
    } else {
      showToast(response.message || 'Failed to submit review.', 'error')
    }
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to submit review.'
    showToast(message, 'error')
  } finally {
    isSubmittingReview.value = false
  }
}

// FAQs
const faqs = [
  { q: 'Is this device factory unlocked?', a: 'Yes. All devices sold at TechPulse are fully tested and carrier factory unlocked to work on all global networks.' },
  { q: 'What does the official warranty cover?', a: 'The warranty covers all manufacturer hardware failures, including display issues, defects, and internal board malfunctions. Does not cover physical or water damage.' },
  { q: 'How long does the battery last under heavy use?', a: 'Typically provides a full day of standard use, browsing, photography, and work tasks.' }
]

const toggleFaq = (idx: number) => {
  expandedFaq.value = expandedFaq.value === idx ? null : idx
}

// Navigation helpers
const shareProduct = () => {
  navigator.clipboard.writeText(window.location.href)
  showToast('Product link copied to clipboard!', 'success')
}

const compareProduct = () => {
  showToast(`${product.value?.name} has been added to your comparison queue.`, 'info')
}

const askQuestion = () => {
  showToast('Support Agent is offline. Please email customer support at customercare@techpulse.lk.', 'warning')
}



const categoryRoutes: Record<string, string> = {
  'Mobile Phones': '/mobile-phones',
  'Smartwatches': '/smartwatches',
  'Earphones And Headphones': '/earphones-headphones',
  'Power Banks': '/power-banks',
  'Speakers': '/speakers',
  'Cameras': '/cameras',
  'Appliances': '/home-appliances',
  'Gaming Consoles': '/gaming-consoles'
}

const goHome = () => {
  router.push('/')
}

const goToCategory = () => {
  if (product.value?.category) {
    const path = categoryRoutes[product.value.category]
    if (path) {
      router.push(path)
    } else {
      router.push({ path: '/', query: { category: product.value.category } })
    }
  } else {
    router.push('/')
  }
}

const goToCheckout = () => {
  isCartOpen.value = false
  router.push('/checkout')
}
</script>

<template>
  <div class="min-h-screen bg-background text-text font-sans pb-1 relative overflow-hidden select-none">

    <!-- Decor Background -->
    <div class="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-surface rounded-full blur-3xl -z-10 animate-pulse"></div>

    <!-- Sticky Navbar -->
    <Navbar
      :is-logged-in="isLoggedIn"
      :total-cart-items="totalCartItems"
      @toggle-cart="isCartOpen = !isCartOpen"
    />

    <!-- Main details panel -->
    <main class="max-w-7xl mx-auto px-6 mt-10">
      
      <!-- Breadcrumbs -->
      <nav class="text-xs text-muted mb-8 font-semibold flex items-center gap-2">
        <button @click="goHome" class="hover:text-text transition-colors cursor-pointer">Home</button>
        <span>/</span>
        <button v-if="product?.category" @click="goToCategory" class="hover:text-text transition-colors cursor-pointer">{{ product.category }}</button>
        <span v-if="product?.category">/</span>
        <span class="text-muted" v-if="product">{{ product.brand }}</span>
        <span class="text-muted" v-else>Loading</span>
      </nav>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <Smartphone class="animate-pulse h-12 w-12 text-primary" />
        <span class="text-muted text-sm">Loading product details...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage || !product" class="p-6 text-center max-w-sm mx-auto bg-surface border border-border rounded-3xl mt-10">
        <X class="w-12 h-12 text-error mx-auto mb-4" />
        <h3 class="text-base font-bold text-text mb-2">{{ errorMessage || 'Product details unavailable.' }}</h3>
        <button @click="goHome" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold cursor-pointer mt-4">
          Return to Shop
        </button>
      </div>

      <!-- Main Layout -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <!-- Left Column: Media Gallery (thumbnails + showcase) -->
        <div class="lg:col-span-7 flex flex-col md:flex-row gap-6">
          
          <!-- Vertical strip: photo gallery for the selected color -->
          <div class="flex md:flex-col flex-row flex-wrap gap-3 order-2 md:order-1 shrink-0">
            <button
              v-for="(img, imgIndex) in currentImages"
              :key="imgIndex"
              @click="selectedImageIndex = imgIndex; isImageBroken = false"
              class="w-16 h-16 rounded-xl border bg-surface overflow-hidden cursor-pointer transition-colors p-1 shrink-0 focus:outline-none"
              :class="selectedImageIndex === imgIndex ? 'border-primary shadow-md shadow-primary/10' : 'border-border hover:border-muted/40'"
            >
              <img :src="img" :alt="product.name + ' photo ' + (imgIndex + 1)" class="w-full h-full object-cover rounded-lg" />
            </button>
            <div v-if="currentImages.length === 0" class="w-16 h-16 rounded-xl border border-border bg-surface flex items-center justify-center text-muted shrink-0">
              <Smartphone class="w-5 h-5" />
            </div>
          </div>

          <!-- Large Main Image box -->
          <div class="flex-1 order-1 md:order-2">
            <div class="bg-surface border border-border rounded-[32px] p-8 flex items-center justify-center relative aspect-square shadow-xl overflow-hidden group">
              <Transition name="image-fade" mode="out-in">
                <img
                  v-if="currentImages[selectedImageIndex] && !isImageBroken"
                  :key="currentImages[selectedImageIndex]"
                  :src="currentImages[selectedImageIndex]"
                  :alt="product.name"
                  class="max-h-full max-w-full object-contain drop-shadow-2xl rounded-2xl group-hover:scale-105 transition-all duration-300 p-4"
                  @error="handleImageError"
                />
                <div v-else class="flex flex-col items-center justify-center text-muted">
                  <Smartphone class="w-20 h-20 text-muted mb-3" />
                  <span class="text-xs uppercase font-bold tracking-wider text-muted">Image Unavailable</span>
                </div>
              </Transition>

              <!-- Share and Action Buttons overlay -->
              <div class="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-3">
                <button
                  @click="askQuestion"
                  class="px-4 py-2 bg-white/80 border border-border text-[10px] uppercase font-bold tracking-wider rounded-xl hover:bg-white text-muted hover:text-text transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare class="w-3.5 h-3.5" />
                  <span>Ask Question</span>
                </button>

                <div class="flex gap-2">
                  <button
                    @click="compareProduct"
                    class="p-2.5 bg-white/80 border border-border rounded-xl hover:bg-white text-muted hover:text-text transition-all cursor-pointer"
                    title="Add to Compare"
                  >
                    <ArrowLeftRight class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="shareProduct"
                    class="p-2.5 bg-white/80 border border-border rounded-xl hover:bg-white text-muted hover:text-text transition-all cursor-pointer"
                    title="Share Product"
                  >
                    <Share2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Column: Specs Selection Pane -->
        <div class="lg:col-span-5 space-y-6">
          <div class="space-y-2">
            <span class="text-xs font-bold text-primary uppercase tracking-widest">{{ product.brand }}</span>
            <h1 class="text-3xl font-black text-text tracking-tight leading-tight">{{ product.name }}</h1>

            <!-- Ratings and stock status -->
            <div class="flex items-center gap-4 pt-1">
              <div v-if="reviewsList.length > 0" class="flex items-center gap-1">
                <Star v-for="star in 5" :key="star" class="w-3.5 h-3.5" :class="averageRating >= star ? 'text-warning fill-warning' : 'text-muted'" />
                <span class="text-xs font-semibold text-muted pl-1">({{ averageRating.toFixed(1) }} rating, {{ reviewsList.length }} review{{ reviewsList.length === 1 ? '' : 's' }})</span>
              </div>
              <span v-else class="text-xs font-semibold text-muted">No reviews yet</span>

              <div class="flex items-center gap-1.5">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="activeStock > 0 ? 'bg-success animate-pulse' : 'bg-error'"
                ></span>
                <span class="text-xs font-bold uppercase tracking-wider" :class="activeStock > 0 ? 'text-success' : 'text-error'">
                  {{ activeStock > 0 ? 'In Stock' : 'Out of Stock' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Price -->
          <div class="p-5 rounded-2xl bg-surface border border-border flex items-center justify-between">
            <div>
              <p class="text-[10px] uppercase font-bold tracking-wider text-muted">Retail Price</p>
              <p class="text-3xl font-black text-primary mt-1">Rs. {{ product.price.toLocaleString() }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] uppercase font-bold tracking-wider text-muted">Model No.</p>
              <p class="text-sm font-mono font-bold text-text mt-1.5">{{ product.modelNumber || 'N/A' }}</p>
            </div>
          </div>

          <!-- Color Selectors -->
          <div v-if="product && product.colorVariants && product.colorVariants.length > 0 && !(product.colorVariants.length === 1 && (product.colorVariants[0].color.toLowerCase() === 'standard' || product.colorVariants[0].color.toLowerCase() === 'default'))" class="space-y-3">
            <label class="block text-xs font-bold uppercase tracking-wider text-muted">Select Color Variant:</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(v, index) in product.colorVariants"
                :key="v.id"
                @click="selectedVariantIndex = index"
                class="px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                :class="selectedVariantIndex === index
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white border-border text-muted hover:text-text'"
              >
                <span>{{ v.color }}</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded-md bg-black/10 text-current">Qty: {{ v.stockQuantity }}</span>
              </button>
            </div>
          </div>

          <!-- Quantity Selection -->
          <div class="space-y-3">
            <label for="qty" class="block text-xs font-bold uppercase tracking-wider text-muted">Quantity:</label>
            <div class="flex items-center gap-3">
              <div class="flex items-center bg-surface border border-border rounded-xl p-1 max-w-[120px]">
                <button
                  @click="quantity = Math.max(1, quantity - 1)"
                  class="p-2 text-muted hover:text-text transition-colors cursor-pointer"
                >
                  <Minus class="w-3.5 h-3.5" />
                </button>
                <span class="text-sm font-mono font-bold text-text px-4 select-none">{{ quantity }}</span>
                <button
                  @click="quantity = Math.min(activeStock, quantity + 1)"
                  class="p-2 text-muted hover:text-text transition-colors cursor-pointer"
                  :disabled="quantity >= activeStock"
                >
                  <Plus class="w-3.5 h-3.5" />
                </button>
              </div>
              <span class="text-xs text-muted font-medium">Max available for this color: {{ activeStock }}</span>
            </div>
          </div>

          <!-- Add to Cart Button -->
          <div class="pt-4">
            <button
              @click="handleAddToCart"
              class="w-full py-4.5 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/25 active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              :disabled="activeStock <= 0"
            >
              <ShoppingCart class="w-4.5 h-4.5" />
              <span>{{ activeStock > 0 ? 'Add to Cart' : 'Out of Stock' }}</span>
            </button>
          </div>

        </div>

      </div>

      <!-- Tab Details Section (fold details) -->
      <section class="mt-20 border-t border-border pt-12">
        
        <!-- Tabs Header -->
        <div class="flex border-b border-border gap-6 mb-8 text-sm font-bold uppercase tracking-wider">
          <button
            @click="activeTab = 'details'"
            class="pb-4 relative transition-colors cursor-pointer"
            :class="activeTab === 'details' ? 'text-text' : 'text-muted hover:text-text'"
          >
            <span>Product Details</span>
            <span v-if="activeTab === 'details'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
          </button>
          <button
            @click="activeTab = 'specs'"
            class="pb-4 relative transition-colors cursor-pointer"
            :class="activeTab === 'specs' ? 'text-text' : 'text-muted hover:text-text'"
          >
            <span>Specifications</span>
            <span v-if="activeTab === 'specs'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
          </button>
          <button
            @click="activeTab = 'reviews'"
            class="pb-4 relative transition-colors cursor-pointer"
            :class="activeTab === 'reviews' ? 'text-text' : 'text-muted hover:text-text'"
          >
            <span>Reviews ({{ reviewsList.length }})</span>
            <span v-if="activeTab === 'reviews'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
          </button>
        </div>

        <!-- Tab Body -->
        <div class="bg-surface border border-border rounded-[32px] p-8 shadow-sm min-h-[200px]">

          <!-- Details tab -->
          <div v-if="activeTab === 'details'" class="space-y-6 text-muted text-sm leading-relaxed max-w-4xl mx-auto">
            <h4 class="text-text font-black text-xl tracking-tight text-center mb-6">Full Product Description</h4>
            <div v-html="product?.description || 'No detailed product description available.'" class="description-content"></div>
            <!-- Description Image (Legacy Fallback) -->
            <div v-if="product?.descriptionImageUrl" class="mt-4 rounded-3xl overflow-hidden border border-border bg-white flex justify-center p-4">
              <img :src="product.descriptionImageUrl" alt="Product specifications details" class="max-w-full h-auto rounded-2xl shadow-sm" />
            </div>
          </div>

          <!-- Specs tab -->
          <div v-else-if="activeTab === 'specs'" class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div v-if="product?.ramGb" class="p-4 bg-white border border-border rounded-xl flex items-center justify-between">
              <span class="text-xs font-bold text-muted uppercase tracking-wider">RAM Memory</span>
              <span class="text-sm font-extrabold text-text">{{ product?.ramGb ? product.ramGb + ' GB' : 'N/A' }}</span>
            </div>
            <div class="p-4 bg-white border border-border rounded-xl flex items-center justify-between">
              <span class="text-xs font-bold text-muted uppercase tracking-wider">Internal Storage</span>
              <span class="text-sm font-extrabold text-text">{{ product?.storageGb ? (product.storageGb >= 1000 ? (product.storageGb % 1024 === 0 ? product.storageGb / 1024 : product.storageGb / 1000) + ' TB' : product.storageGb + ' GB') : 'N/A' }}</span>
            </div>
            <div class="p-4 bg-white border border-border rounded-xl flex items-center justify-between">
              <span class="text-xs font-bold text-muted uppercase tracking-wider">Warranty Term</span>
              <span class="text-sm font-extrabold text-text">{{ product?.warrantyPeriod ? product.warrantyPeriod + ' Months' : 'N/A' }}</span>
            </div>
            <div class="p-4 bg-white border border-border rounded-xl flex items-center justify-between">
              <span class="text-xs font-bold text-muted uppercase tracking-wider">Official Brand</span>
              <span class="text-sm font-extrabold text-primary uppercase">{{ product?.brand }}</span>
            </div>
          </div>

          <!-- Reviews tab -->
          <div v-else-if="activeTab === 'reviews'" class="space-y-8">

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border pb-6">
              <div>
                <p class="text-xs font-bold text-muted uppercase tracking-wider mb-2">Customer Score Summary</p>
                <div v-if="reviewsList.length > 0" class="flex items-center gap-2">
                  <span class="text-3xl font-black text-text">{{ averageRating.toFixed(1) }}</span>
                  <div class="flex items-center">
                    <Star v-for="star in 5" :key="star" class="w-4.5 h-4.5" :class="averageRating >= star ? 'text-warning fill-warning' : 'text-muted'" />
                  </div>
                  <span class="text-xs text-muted pl-2">based on {{ reviewsList.length }} customer experience{{ reviewsList.length === 1 ? '' : 's' }}</span>
                </div>
                <p v-else class="text-xs text-muted">No customer reviews yet — be the first to share your experience.</p>
              </div>

              <button
                v-if="isLoggedIn"
                @click="writeReviewOpen = !writeReviewOpen"
                class="px-5 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Write a Review
              </button>
              <button
                v-else
                @click="router.push('/customer-auth')"
                class="px-5 py-3 rounded-xl bg-surface border border-border text-muted hover:text-text transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Sign in to Write a Review
              </button>
            </div>

            <!-- Review write box -->
            <Transition name="fade">
              <div v-if="writeReviewOpen" class="p-5 bg-white border border-border rounded-2xl max-w-xl space-y-4">
                <h4 class="text-xs font-black uppercase tracking-wider text-text">Submit your Experience</h4>

                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted font-semibold">Your Rating:</span>
                  <div class="flex gap-1">
                    <button
                      v-for="r in 5"
                      :key="r"
                      @click="userReviewRating = r"
                      type="button"
                      class="text-warning hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star class="w-5 h-5" :class="userReviewRating >= r ? 'fill-warning' : 'text-muted'" />
                    </button>
                  </div>
                </div>

                <textarea
                  v-model="userReviewText"
                  rows="3"
                  placeholder="Describe your user experience, pros/cons, delivery timing..."
                  class="w-full bg-white border border-border rounded-xl p-3.5 text-xs text-text focus:outline-none focus:border-primary resize-none"
                  :disabled="isSubmittingReview"
                ></textarea>

                <div class="flex justify-end gap-3">
                  <button @click="writeReviewOpen = false" class="px-4 py-2 text-muted hover:text-text text-xs font-semibold cursor-pointer" :disabled="isSubmittingReview">Cancel</button>
                  <button
                    @click="handleAddReview"
                    class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    :disabled="isSubmittingReview || !userReviewText.trim()"
                  >
                    {{ isSubmittingReview ? 'Submitting...' : 'Submit Review' }}
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Reviews list log -->
            <div v-if="reviewsList.length > 0" class="space-y-6 divide-y divide-border">
              <div v-for="(rev, idx) in reviewsList" :key="rev.id" class="pt-5" :class="{ 'pt-0 border-0': idx === 0 }">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-extrabold text-text">{{ rev.authorName }}</span>
                    <span v-if="rev.verifiedPurchase" class="text-[9px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Verified Buyer</span>
                  </div>
                  <span class="text-[10px] text-muted font-mono">{{ new Date(rev.createdAt).toLocaleDateString() }}</span>
                </div>

                <div class="flex items-center gap-0.5 mb-2">
                  <Star v-for="star in 5" :key="star" class="w-3 h-3 text-warning" :class="rev.rating >= star ? 'fill-warning' : 'text-muted'" />
                  <span class="text-xs font-bold text-text pl-2">{{ rev.title }}</span>
                </div>

                <p class="text-xs text-muted leading-relaxed max-w-3xl">{{ rev.text }}</p>
              </div>
            </div>

          </div>

        </div>

      </section>

      <!-- Frequently Asked Questions (FAQ) Section -->
      <section class="mt-20 border-t border-border pt-12">
        <div class="mb-8">
          <h3 class="text-xl font-black text-text tracking-tight uppercase">Frequently Asked Questions</h3>
          <p class="text-xs text-muted mt-1">Common product support inquiries & answers</p>
        </div>

        <div class="space-y-3 max-w-3xl">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="bg-surface border border-border rounded-2xl overflow-hidden transition-all"
          >
            <button
              @click="toggleFaq(idx)"
              class="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-sm text-text hover:text-primary cursor-pointer"
            >
              <span>{{ faq.q }}</span>
              <ChevronDown v-if="expandedFaq !== idx" class="w-4 h-4 text-muted" />
              <ChevronUp v-else class="w-4 h-4 text-primary" />
            </button>

            <Transition name="fade">
              <div v-if="expandedFaq === idx" class="px-6 pb-5 pt-1 text-xs text-muted leading-relaxed border-t border-border bg-white/40">
                {{ faq.a }}
              </div>
            </Transition>
          </div>
        </div>
      </section>

      <!-- "You may also like" related recommendation -->
      <section class="mt-20 border-t border-border pt-12 mb-20">
        <div class="mb-10 text-center sm:text-left">
          <h3 class="text-xl font-black text-text tracking-tight uppercase">You May Also Like</h3>
          <p class="text-xs text-muted mt-1">A personalized collection, just for you</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductCard 
            v-for="p in relatedProducts" 
            :key="p.id"
            :product="p" 
            :isAdmin="false"
            @click="router.push('/product/'+p.id)"
          />
        </div>
      </section>

    </main>

    <!-- Side Cart Drawer Overlay -->
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

        <!-- Items list -->
        <div class="flex-1 overflow-y-auto py-6 space-y-4">
          <div v-if="cart.length === 0" class="text-center py-20 text-muted space-y-4">
            <ShoppingCart class="w-7 h-7 mx-auto text-muted" />
            <p class="text-xs font-bold uppercase tracking-wider">Your cart is empty</p>
          </div>

          <div
            v-for="(item, index) in cart"
            :key="index"
            class="flex items-center justify-between bg-surface border border-border p-4 rounded-2xl"
          >
            <div class="flex items-center gap-3">
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
            <div class="flex flex-col items-end gap-2">
              <button
                @click="removeFromCart(index)"
                class="text-muted hover:text-error transition-colors p-1"
              >
                <Trash2 class="w-4 h-4" />
              </button>

              <div class="flex items-center gap-1 bg-white border border-border rounded-lg p-1">
                <button @click="updateCartQuantity(index, -1)" class="p-1 text-muted hover:text-text transition-colors cursor-pointer">
                  <Minus class="w-3 h-3" />
                </button>
                <span class="text-xs font-mono font-bold text-text px-2">{{ item.quantity }}</span>
                <button @click="updateCartQuantity(index, 1)" class="p-1 text-muted hover:text-text transition-colors cursor-pointer">
                  <Plus class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <!-- "You may also like" widget in drawer -->
          <div v-if="cart.length > 0 && relatedProducts.length > 0" class="pt-6 border-t border-border space-y-3">
            <h4 class="text-xs font-black uppercase tracking-wider text-muted">You may also like</h4>
            <div class="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden">
                  <img :src="relatedProducts[0].colorVariants[0]?.images?.[0] || ''" class="w-full h-full object-cover" />
                </div>
                <div>
                  <h5 class="text-[11px] font-bold text-text truncate max-w-[140px]">{{ relatedProducts[0].name }}</h5>
                  <p class="text-[10px] text-primary font-bold">Rs. {{ relatedProducts[0].price.toLocaleString() }}</p>
                </div>
              </div>
              <button
                @click="router.push('/product/'+relatedProducts[0].id); isCartOpen = false"
                class="px-3 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary text-primary hover:text-white transition-all text-[10px] font-bold uppercase rounded-lg cursor-pointer"
              >
                Choose options
              </button>
            </div>
          </div>

        </div>

        <!-- Footer billing -->
        <div class="border-t border-border pt-4 space-y-4">
          <div class="flex items-center justify-between text-sm font-bold text-text">
            <span class="text-muted">Total</span>
            <span>Rs. {{ cartSubtotal.toLocaleString() }}</span>
          </div>

          <p class="text-[10px] text-muted leading-normal">
            Taxes and shipping calculated at checkout
          </p>

          <div class="flex gap-3">
            <button
              @click="router.push('/cart'); isCartOpen = false"
              class="w-1/2 py-3.5 bg-white hover:bg-surface border border-border hover:border-muted/40 text-text font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              View Cart
            </button>
            <button
              @click="goToCheckout"
              class="w-1/2 py-3.5 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              :disabled="cart.length === 0"
            >
              Checkout
            </button>
          </div>
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
  transform: translateY(-8px);
}

.image-fade-enter-active,
.image-fade-leave-active {
  transition: opacity 0.3s ease;
}
.image-fade-enter-from,
.image-fade-leave-to {
  opacity: 0;
}

.cart-enter-active,
.cart-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.cart-enter-from,
.cart-leave-to {
  transform: translateX(100%);
}

/* Rich Text Description Content Styles */
.description-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text, #2d3748);
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
  text-align: center;
}
.description-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text, #2d3748);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  text-align: center;
}
.description-content :deep(p) {
  color: var(--muted, #718096);
  font-size: 0.875rem;
  line-height: 1.625;
  margin-bottom: 1.25rem;
  text-align: center;
}
.description-content :deep(ul) {
  list-style-type: disc;
  margin-left: 2rem;
  margin-right: 2rem;
  margin-bottom: 1.25rem;
  color: var(--muted, #718096);
  display: inline-block;
  text-align: left;
}
.description-content :deep(li) {
  margin-bottom: 0.5rem;
}
.description-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  margin: 1.75rem auto;
  display: block;
}
</style>
