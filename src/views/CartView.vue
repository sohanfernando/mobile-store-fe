<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { productApi } from '../api/productApi'
import type { Product } from '../types/product'
import { useToast } from '../composables/useToast'
import ProductCard from '../components/ProductCard.vue'
import Navbar from '../components/Navbar.vue'
import {
  Smartphone, ShoppingCart, Plus, Minus, Trash2, ArrowLeft,
  ChevronDown, ChevronUp, Loader2
} from '@lucide/vue'

const APPLIED_COUPON_KEY = 'applied-coupon'

const router = useRouter()
const { showToast } = useToast()
const cart = ref<any[]>([])
const isLoggedIn = ref(false)
const adminLoggedIn = ref(false)

const totalCartItems = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0)
})

const specialInstructions = ref('')
const agreeTerms = ref(false)
const discountOpen = ref(false)
const discountCode = ref('')
const discountApplied = ref(false)
const discountAmount = ref(0)
const discountType = ref<'PERCENTAGE' | 'FLAT'>('PERCENTAGE')
const appliedCode = ref('')
const isApplyingDiscount = ref(false)

const allProducts = ref<Product[]>([])

onMounted(() => {
  loadCart()
  checkAuth()
  fetchAllProducts()
  restorePersistedCoupon()
})

const checkAuth = () => {
  isLoggedIn.value = !!localStorage.getItem('customer-token')
  adminLoggedIn.value = !!localStorage.getItem('admin-token')
}

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

const seedMockProducts = (): Product[] => {
  return [
    {
      id: 901,
      name: 'iPhone 15 Pro Max',
      brand: 'Apple',
      modelNumber: 'A3106',
      description: 'The titanium powerhouse from Apple featuring the cutting-edge A17 Pro SoC.',
      price: 383680,
      category: 'Mobile Phones',
      ramGb: 8,
      storageGb: 256,
      warrantyPeriod: 12,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9011, color: 'Natural Titanium', stockQuantity: 15, images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=400&q=80'] }
      ]
    },
    {
      id: 902,
      name: 'Galaxy S24 Ultra',
      brand: 'Samsung',
      modelNumber: 'SM-S928B',
      description: 'Equipped with an integrated S-Pen, dynamic AMOLED 2X, a 200MP camera.',
      price: 415680,
      category: 'Mobile Phones',
      ramGb: 12,
      storageGb: 512,
      warrantyPeriod: 24,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9021, color: 'TitanYellow', stockQuantity: 8, images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80'] }
      ]
    },
    {
      id: 903,
      name: 'Google Pixel 8 Pro',
      brand: 'Google',
      modelNumber: 'GC3VE',
      description: 'The smart phone that keeps you moving. Google Tensor G3 powers Gemini Nano.',
      price: 319680,
      category: 'Mobile Phones',
      ramGb: 12,
      storageGb: 128,
      warrantyPeriod: 12,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9031, color: 'Bay Blue', stockQuantity: 7, images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80'] }
      ]
    },
    {
      id: 904,
      name: 'OnePlus 12',
      brand: 'OnePlus',
      modelNumber: 'CPH2581',
      description: 'Unmatched charging capabilities with 100W SUPERVOOC. Hasselblad Camera.',
      price: 255680,
      category: 'Mobile Phones',
      ramGb: 16,
      storageGb: 512,
      warrantyPeriod: 18,
      createdAt: '',
      updatedAt: '',
      active: true,
      colorVariants: [
        { id: 9041, color: 'Flowy Emerald', stockQuantity: 2, images: ['https://images.unsplash.com/photo-1565630916779-e303be97b6f5?auto=format&fit=crop&w=400&q=80'] }
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

const cartSubtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
})

const discountDeduction = computed(() => {
  if (!discountApplied.value) return 0
  if (discountType.value === 'PERCENTAGE') {
    return cartSubtotal.value * discountAmount.value / 100
  } else {
    return Math.min(cartSubtotal.value, discountAmount.value)
  }
})

const cartTotal = computed(() => {
  return Math.max(0, cartSubtotal.value - discountDeduction.value)
})

const applyCoupon = async (code: string, { silent = false }: { silent?: boolean } = {}) => {
  if (!code.trim()) {
    if (!silent) showToast('Please enter a coupon code.', 'warning')
    return
  }

  isApplyingDiscount.value = true
  try {
    const response = await axios.get(`/api/coupons/validate/${code.toUpperCase().trim()}`, {
      params: { subtotal: cartSubtotal.value }
    })
    const resData = response.data
    if (resData.success && resData.data) {
      discountApplied.value = true
      discountType.value = resData.data.discountType
      discountAmount.value = resData.data.discountValue
      appliedCode.value = resData.data.code
      localStorage.setItem(APPLIED_COUPON_KEY, appliedCode.value)
      if (!silent) showToast(`Coupon ${appliedCode.value} applied successfully!`, 'success')
      discountCode.value = ''
    } else if (!silent) {
      showToast(resData.message || 'Invalid coupon code.', 'error')
    }
  } catch (err: any) {
    if (!silent) {
      showToast(err.response?.data?.message || 'Failed to validate coupon code.', 'error')
    } else {
      // A previously-applied coupon is no longer valid (expired/deactivated) — clear it silently
      localStorage.removeItem(APPLIED_COUPON_KEY)
    }
  } finally {
    isApplyingDiscount.value = false
  }
}

const applyDiscount = () => applyCoupon(discountCode.value)

const removeDiscount = () => {
  discountApplied.value = false
  discountAmount.value = 0
  appliedCode.value = ''
  localStorage.removeItem(APPLIED_COUPON_KEY)
  showToast('Coupon removed.', 'info')
}

const restorePersistedCoupon = () => {
  const stored = localStorage.getItem(APPLIED_COUPON_KEY)
  if (stored) {
    discountOpen.value = true
    applyCoupon(stored, { silent: true })
  }
}

const handleCheckoutRedirect = () => {
  if (!agreeTerms.value) {
    showToast('Please agree to the terms and conditions to proceed.', 'warning')
    return
  }

  // Save order special instructions if filled
  if (specialInstructions.value.trim()) {
    localStorage.setItem('checkout-instructions', specialInstructions.value)
  }

  router.push('/checkout')
}

// Recommended related products
const recommendedProducts = computed(() => {
  if (cart.value.length === 0) return allProducts.value.slice(0, 4)
  const cartIds = cart.value.map(item => item.product.id)
  return allProducts.value.filter(p => !cartIds.includes(p.id)).slice(0, 4)
})

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-background text-text font-sans pb-1 relative overflow-hidden select-none">

    <!-- Decorative glow -->
    <div class="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

    <!-- Sticky Navbar -->
    <Navbar
      :is-logged-in="isLoggedIn"
      :total-cart-items="totalCartItems"
      @toggle-cart="router.push('/')"
    />

    <!-- Main Container -->
    <main class="max-w-7xl mx-auto px-6 mt-10">
      
      <!-- Breadcrumbs -->
      <nav class="text-xs text-muted mb-8 font-semibold flex items-center gap-2">
        <button @click="goHome" class="hover:text-text transition-colors cursor-pointer">Home</button>
        <span>/</span>
        <span class="text-muted">Your Cart</span>
      </nav>

      <!-- Page Title -->
      <div class="mb-10">
        <h1 class="text-3xl font-black text-text tracking-tight">Your Cart</h1>
        <p class="text-sm text-muted mt-1">Review the selected flagships prior to final secure checkout.</p>
      </div>

      <!-- Empty Cart View -->
      <div v-if="cart.length === 0" class="text-center py-20 bg-surface border border-border rounded-[32px] max-w-lg mx-auto p-8 shadow-inner">
        <ShoppingCart class="w-16 h-16 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-bold text-text mb-2">Your shopping cart is currently empty</h3>
        <p class="text-muted text-xs max-w-sm mx-auto mb-6">
          Explore our top performance smartphones and find the perfect model with advanced color variants.
        </p>
        <button
          @click="goHome"
          class="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 cursor-pointer"
        >
          Continue Shopping
        </button>
      </div>

      <!-- Main Layout -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left Column: Items Table (col-span-8) -->
        <div class="lg:col-span-8 space-y-6">
          <div class="bg-surface border border-border rounded-[32px] p-6 shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-border text-muted font-bold text-[10px] uppercase tracking-wider pb-3">
                    <th class="pb-4">Product Details</th>
                    <th class="pb-4 text-center">Quantity</th>
                    <th class="pb-4 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border text-sm">
                  <tr v-for="(item, index) in cart" :key="index" class="hover:bg-border/20 transition-colors">
                    <!-- Product Description -->
                    <td class="py-5">
                      <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
                          <img v-if="item.variant.imageUrl" :src="item.variant.imageUrl" :alt="item.product.name" class="w-full h-full object-cover" />
                          <Smartphone v-else class="w-6 h-6 text-muted" />
                        </div>
                        <div>
                          <h4 class="font-extrabold text-text leading-tight hover:text-primary transition-colors cursor-pointer" @click="router.push('/product/'+item.product.id)">
                            {{ item.product.name }}
                          </h4>
                          <p class="text-[10px] text-primary font-bold uppercase mt-1">Color: {{ item.variant.color }}</p>
                          <p class="text-[10px] text-muted font-mono mt-0.5">Rs. {{ item.product.price.toLocaleString() }} each</p>
                        </div>
                      </div>
                    </td>

                    <!-- Quantity adjusters -->
                    <td class="py-5 text-center">
                      <div class="inline-flex items-center gap-1.5 bg-white border border-border rounded-xl p-1 mx-auto">
                        <button @click="updateCartQuantity(index, -1)" class="p-1 text-muted hover:text-text transition-colors cursor-pointer">
                          <Minus class="w-3 h-3" />
                        </button>
                        <span class="text-xs font-mono font-bold text-text px-2 select-none">{{ item.quantity }}</span>
                        <button @click="updateCartQuantity(index, 1)" class="p-1 text-muted hover:text-text transition-colors cursor-pointer">
                          <Plus class="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        @click="removeFromCart(index)"
                        class="p-2 text-muted hover:text-error transition-all cursor-pointer inline-block align-middle ml-2"
                        title="Remove product"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </td>

                    <!-- Total Price -->
                    <td class="py-5 text-right font-bold text-text font-mono">
                      Rs. {{ (item.product.price * item.quantity).toLocaleString() }}.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Return link -->
            <div class="mt-8 pt-6 border-t border-border">
              <button
                @click="goHome"
                class="flex items-center gap-2 text-primary hover:text-primary-dark text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft class="w-4 h-4" />
                <span>Continue Shopping</span>
              </button>
            </div>

          </div>
        </div>

        <!-- Right Column: Billing card (col-span-4) -->
        <div class="lg:col-span-4 space-y-6">
          
          <!-- Instructions Card -->
          <div class="bg-surface border border-border rounded-[24px] p-5 space-y-3">
            <label for="instructions" class="block text-[10px] font-bold uppercase tracking-wider text-muted">Order Special Instructions</label>
            <textarea
              id="instructions"
              v-model="specialInstructions"
              rows="3"
              placeholder="E.g. Delivery request notes, gate code details, etc."
              class="w-full bg-white border border-border rounded-xl p-3 text-xs text-text focus:outline-none focus:border-primary resize-none font-medium leading-relaxed"
            ></textarea>
          </div>

          <!-- Promo Code Card -->
          <div class="bg-surface border border-border rounded-[24px] p-5">
            <button
              @click="discountOpen = !discountOpen"
              class="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted cursor-pointer"
            >
              <span>Apply Discounts</span>
              <ChevronDown v-if="!discountOpen" class="w-4 h-4 text-muted" />
              <ChevronUp v-else class="w-4 h-4 text-primary" />
            </button>

            <div v-if="discountOpen && !discountApplied" class="mt-4 flex gap-2">
              <input
                v-model="discountCode"
                type="text"
                placeholder="e.g. WELCOME10"
                class="bg-white border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none uppercase w-2/3"
                @keyup.enter="applyDiscount"
              />
              <button
                @click="applyDiscount"
                :disabled="isApplyingDiscount"
                class="px-4 py-2 bg-primary hover:bg-primary-dark rounded-xl text-xs font-bold text-white cursor-pointer w-1/3 disabled:opacity-50 flex items-center justify-center"
              >
                <Loader2 v-if="isApplyingDiscount" class="w-4 h-4 animate-spin" />
                <span v-else>Apply</span>
              </button>
            </div>

            <div v-else-if="discountApplied" class="mt-4 flex items-center justify-between bg-success/5 border border-success/15 p-3.5 rounded-xl">
              <div>
                <p class="text-xs font-black text-success">{{ appliedCode }} Applied</p>
                <p class="text-[9px] text-muted font-bold mt-0.5">
                  {{ discountType === 'PERCENTAGE' ? `${discountAmount}% Off` : `Rs. ${discountAmount.toLocaleString()} Off` }}
                </p>
              </div>
              <button
                @click="removeDiscount"
                class="text-[10px] font-black uppercase text-error hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>

          <!-- Checkout billing Card -->
          <div class="bg-surface border border-border rounded-[32px] p-6 space-y-6 shadow-xl">
            <div class="space-y-4">
              <div class="flex justify-between items-center text-xs">
                <span class="text-muted font-semibold">Subtotal</span>
                <span class="font-bold text-text font-mono">Rs. {{ cartSubtotal.toLocaleString() }}.00</span>
              </div>
              <div v-if="discountApplied" class="flex justify-between items-center text-xs text-success font-bold">
                <span>Discount ({{ appliedCode }})</span>
                <span class="font-mono">-Rs. {{ discountDeduction.toLocaleString() }}.00</span>
              </div>
              <div class="flex justify-between items-center text-sm font-bold border-t border-border pt-4 text-text">
                <span>Total Amount</span>
                <span class="text-primary font-mono">Rs. {{ cartTotal.toLocaleString() }}.00</span>
              </div>
              <p class="text-[10px] text-muted leading-normal">
                Taxes and shipping calculated at checkout
              </p>
            </div>

            <!-- Terms Agreement -->
            <div class="flex items-start gap-3">
              <input
                v-model="agreeTerms"
                type="checkbox"
                id="terms"
                class="w-4 h-4 rounded border-border bg-white text-primary focus:ring-primary/20 focus:ring-2 mt-0.5"
              />
              <label for="terms" class="text-xs text-muted select-none leading-relaxed">
                I agree with the <a href="#" class="underline hover:text-primary-dark font-semibold transition-colors">terms and conditions</a>
              </label>
            </div>

            <button
              @click="handleCheckoutRedirect"
              class="w-full py-4 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              Proceed to Checkout
            </button>
          </div>

        </div>

      </div>

      <!-- Related products section below fold -->
      <section v-if="cart.length > 0" class="mt-20 border-t border-border pt-12 mb-20">
        <div class="mb-10 text-center sm:text-left">
          <h3 class="text-xl font-black text-text tracking-tight uppercase">You May Also Like</h3>
          <p class="text-xs text-muted mt-1">A personalized collection, just for you</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductCard 
            v-for="p in recommendedProducts" 
            :key="p.id"
            :product="p" 
            :isAdmin="false"
            @click="router.push('/product/'+p.id)"
          />
        </div>
      </section>

    </main>

    <!-- Footer -->
    <footer class="border-t border-border bg-background mt-20 py-8 text-center text-[10px] text-muted font-bold uppercase tracking-wider">
      <p>&copy; 2026 TechPulse. All Rights Reserved. Built with Vue 3.</p>
    </footer>

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
</style>
