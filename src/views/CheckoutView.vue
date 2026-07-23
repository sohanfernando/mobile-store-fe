<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe, StripeElements } from '@stripe/stripe-js'
import { useToast } from '../composables/useToast'
import { orderApi } from '../api/orderApi'
import { paymentApi } from '../api/paymentApi'
import logoIcon from '../assets/logo-icon.png'
import axios from 'axios'
import {
  Smartphone, ShoppingCart, User, ChevronRight, ChevronDown,
  Check, ArrowLeft, Loader2, Info, Lock, Tag
} from '@lucide/vue'

const router = useRouter()
const { showToast } = useToast()
const cart = ref<any[]>([])
const isLoggedIn = ref(false)
const userEmail = ref('')

// Step control
const currentStep = ref(1) // 1: Information, 2: Shipping, 3: Payment
const isSubmitting = ref(false)
const orderCompleted = ref(false)
const completedOrderId = ref('')

// Form Fields
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const country = ref('Sri Lanka')
const address = ref('')
const apartment = ref('')
const city = ref('')
const postalCode = ref('')
const phone = ref('')
const saveInfo = ref(true)

// Shipping Method selection
const shippingMethod = ref('pickup') // 'pickup' (Free) or 'heavy' (Rs. 200.00)

// Shipping prices in Rs
const shippingPrices = {
  pickup: { rs: 0, label: 'Store Pickup' },
  heavy: { rs: 200, label: 'Heavy Weight Shipping' }
}

// Stripe payment state
const stripe = ref<Stripe | null>(null)
const elements = ref<StripeElements | null>(null)
const paymentElementRef = ref<HTMLDivElement | null>(null)
const isCreatingIntent = ref(false)
const paymentReady = ref(false)
const paymentError = ref('')
let mountedPaymentElement: { unmount: () => void; mount: (el: HTMLElement) => void } | null = null

// Instructions loaded from cart
const orderInstructions = ref('')

onMounted(() => {
  loadCart()
  checkAuth()
  loadInstructions()
  restorePersistedCoupon()
})

const checkAuth = () => {
  const token = localStorage.getItem('customer-token')
  const emailVal = localStorage.getItem('customer-email')
  if (token && emailVal) {
    isLoggedIn.value = true
    userEmail.value = emailVal
    email.value = emailVal
    
    // Load existing profile details
    const profiles = JSON.parse(localStorage.getItem('customer-profiles') || '{}')
    const profile = profiles[emailVal]
    if (profile) {
      if (profile.name) {
        const parts = profile.name.split(' ')
        firstName.value = parts[0] || ''
        lastName.value = parts.slice(1).join(' ') || ''
      }
      if (profile.address) {
        // Simple address parsing if possible, or just prefill the address field
        address.value = profile.address
      }
    }
  }
}

const loadCart = () => {
  const stored = localStorage.getItem('mobile-store-cart')
  if (stored) {
    cart.value = JSON.parse(stored)
  }
  if (cart.value.length === 0) {
    // If cart is empty, send back to cart page
    router.push('/cart')
  }
}

const loadInstructions = () => {
  const stored = localStorage.getItem('checkout-instructions')
  if (stored) {
    orderInstructions.value = stored
  }
}

// Coupon / Promo Code state
const APPLIED_COUPON_KEY = 'applied-coupon'
const discountCode = ref('')
const discountApplied = ref(false)
const discountAmount = ref(0)
const discountType = ref<'PERCENTAGE' | 'FLAT'>('PERCENTAGE')
const appliedCode = ref('')
const isApplyingDiscount = ref(false)
const discountError = ref('')

const applyDiscountCode = async (codeOverride?: string, { silent = false }: { silent?: boolean } = {}) => {
  const code = codeOverride ?? discountCode.value
  if (!code.trim()) {
    if (!silent) showToast('Please enter a coupon code.', 'warning')
    return
  }

  isApplyingDiscount.value = true
  discountError.value = ''

  try {
    const response = await axios.get(`/api/coupons/validate/${code.toUpperCase().trim()}`, {
      params: { subtotal: cartSubtotal.value, email: email.value || undefined }
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

      // Re-initialize payment to reflect new price in payment intent
      if (currentStep.value === 3) {
        initializePayment()
      }
    } else if (!silent) {
      discountError.value = resData.message || 'Invalid coupon code.'
      showToast(discountError.value, 'error')
    } else {
      localStorage.removeItem(APPLIED_COUPON_KEY)
    }
  } catch (err: any) {
    if (!silent) {
      discountError.value = err.response?.data?.message || 'Failed to validate coupon code.'
      showToast(discountError.value, 'error')
    } else {
      localStorage.removeItem(APPLIED_COUPON_KEY)
    }
  } finally {
    isApplyingDiscount.value = false
  }
}

const restorePersistedCoupon = () => {
  const stored = localStorage.getItem(APPLIED_COUPON_KEY)
  if (stored) {
    applyDiscountCode(stored, { silent: true })
  }
}

const removeDiscount = () => {
  discountApplied.value = false
  discountAmount.value = 0
  appliedCode.value = ''
  localStorage.removeItem(APPLIED_COUPON_KEY)
  showToast('Coupon removed.', 'info')

  // Re-initialize payment to reflect original price
  if (currentStep.value === 3) {
    initializePayment()
  }
}

const discountDeduction = computed(() => {
  if (!discountApplied.value) return 0
  if (discountType.value === 'PERCENTAGE') {
    return cartSubtotal.value * discountAmount.value / 100
  } else {
    return Math.min(cartSubtotal.value, discountAmount.value)
  }
})

// Computations
const cartSubtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
})

const cartTotal = computed(() => {
  return Math.max(0, cartSubtotal.value - discountDeduction.value)
})

const selectedShippingCostRs = computed(() => {
  return shippingMethod.value === 'pickup' ? shippingPrices.pickup.rs : shippingPrices.heavy.rs
})

const orderTotalRs = computed(() => {
  return cartTotal.value + selectedShippingCostRs.value
})

// Stripe Payment Element initialization
const initializePayment = async () => {
  isCreatingIntent.value = true
  paymentReady.value = false
  paymentError.value = ''

  try {
    const response = await paymentApi.createIntent({
      shippingMethod: shippingMethod.value,
      items: cart.value.map(item => ({
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: item.quantity
      })),
      couponCode: discountApplied.value ? appliedCode.value : undefined,
      email: email.value
    })

    if (!response.success) {
      showToast(response.message || 'Failed to initialize payment.', 'error')
      return
    }

    if (!stripe.value) {
      stripe.value = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)
    }
    if (!stripe.value) {
      showToast('Unable to load payment provider. Please refresh and try again.', 'error')
      return
    }

    mountedPaymentElement?.unmount()

    elements.value = stripe.value.elements({ clientSecret: response.data.clientSecret })
    const paymentElement = elements.value.create('payment')
    mountedPaymentElement = paymentElement

    await nextTick()
    if (paymentElementRef.value) {
      paymentElement.mount(paymentElementRef.value)
      paymentReady.value = true
    }
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to initialize payment.', 'error')
  } finally {
    isCreatingIntent.value = false
  }
}

watch(shippingMethod, () => {
  if (currentStep.value === 3) {
    initializePayment()
  }
})

// Validations
const isInfoStepValid = computed(() => {
  return (
    email.value.trim() &&
    email.value.includes('@') &&
    firstName.value.trim() &&
    lastName.value.trim() &&
    address.value.trim() &&
    city.value.trim() &&
    postalCode.value.trim() &&
    phone.value.trim()
  )
})

// Navigation actions
const nextStep = () => {
  if (currentStep.value === 1) {
    if (!isInfoStepValid.value) {
      showToast('Please fill out all required shipping and contact details.', 'warning')
      return
    }
    currentStep.value = 2
  } else if (currentStep.value === 2) {
    currentStep.value = 3
    initializePayment()
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const submitOrder = async () => {
  if (!stripe.value || !elements.value) {
    showToast('Payment is not ready yet. Please wait a moment and try again.', 'warning')
    return
  }

  isSubmitting.value = true
  paymentError.value = ''

  const { error, paymentIntent } = await stripe.value.confirmPayment({
    elements: elements.value,
    redirect: 'if_required'
  })

  if (error) {
    isSubmitting.value = false
    paymentError.value = error.message || 'Payment failed. Please try again.'
    showToast(paymentError.value, 'error')
    return
  }

  if (!paymentIntent || paymentIntent.status !== 'succeeded') {
    isSubmitting.value = false
    showToast('Payment was not completed. Please try again.', 'error')
    return
  }

  try {
    const targetEmail = email.value.trim()

    const response = await orderApi.create({
      email: targetEmail,
      firstName: firstName.value,
      lastName: lastName.value,
      phone: phone.value,
      country: country.value,
      address: address.value,
      apartment: apartment.value || undefined,
      city: city.value,
      postalCode: postalCode.value,
      shippingMethod: shippingMethod.value,
      paymentIntentId: paymentIntent.id,
      instructions: orderInstructions.value || undefined,
      items: cart.value.map(item => ({
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: item.quantity
      })),
      couponCode: discountApplied.value ? appliedCode.value : undefined
    })

    if (!response.success) {
      showToast(response.message || 'Your payment succeeded but the order could not be placed. Please contact support.', 'error')
      isSubmitting.value = false
      return
    }

    // If user was not logged in, log them in automatically so they can see their dashboard
    if (!isLoggedIn.value) {
      localStorage.setItem('customer-email', targetEmail)
      localStorage.setItem('customer-token', `mock-token-${Date.now()}`)
    }

    // Clear local states
    localStorage.removeItem('mobile-store-cart')
    localStorage.removeItem('checkout-instructions')
    localStorage.removeItem(APPLIED_COUPON_KEY)

    completedOrderId.value = response.data.orderNumber
    orderCompleted.value = true
    isSubmitting.value = false
  } catch (err: any) {
    isSubmitting.value = false
    showToast(err?.response?.data?.message || 'Your payment succeeded but the order could not be placed. Please contact support.', 'error')
  }
}

const goToDashboard = () => {
  router.push('/dashboard')
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-background text-text font-sans pb-12 relative overflow-hidden select-none">

    <!-- Decorative background elements -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse -z-10"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse -z-10" style="animation-delay: 2s;"></div>

    <!-- Sticky Header -->
    <header class="h-20 border-b border-border bg-background/95 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">

        <!-- Logo -->
        <div class="flex items-center gap-2 cursor-pointer group" @click="goHome">
          <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <img :src="logoIcon" alt="TechPulse" class="w-6 h-6 object-contain" />
          </div>
          <div>
            <span class="font-black text-lg text-text tracking-tight uppercase">TechPulse</span>
            <p class="text-[8px] uppercase tracking-wider text-muted leading-none">secure checkout</p>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs font-semibold text-muted">
          <Lock class="w-4 h-4 text-success" />
          <span class="hidden sm:inline">SSL Secure Payment</span>
        </div>

      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 mt-10">
      
      <!-- Order Success State -->
      <div v-if="orderCompleted" class="max-w-xl mx-auto mt-12 bg-white border border-border rounded-[32px] p-8 text-center shadow-2xl relative">
        <div class="w-20 h-20 bg-success/15 border border-success/30 text-success rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <Check class="w-10 h-10" />
        </div>

        <h1 class="text-3xl font-black text-text tracking-tight">Order Placed Successfully!</h1>
        <p class="text-muted text-sm mt-3 leading-relaxed">
          Thank you for buying from TechPulse. We have received your order and are preparing your items for shipping.
        </p>

        <div class="bg-surface border border-border rounded-2xl p-4 my-6 text-left max-w-sm mx-auto space-y-2.5">
          <div class="flex justify-between items-center text-xs">
            <span class="text-muted font-bold uppercase tracking-wider">Order ID:</span>
            <span class="font-mono font-bold text-primary select-all">{{ completedOrderId }}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-muted font-bold uppercase tracking-wider">Contact Email:</span>
            <span class="text-text font-bold">{{ email }}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-muted font-bold uppercase tracking-wider">Total Paid:</span>
            <span class="font-mono font-black text-text">Rs. {{ orderTotalRs.toLocaleString() }}</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="goToDashboard"
            class="px-6 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-primary/20 cursor-pointer"
          >
            Go To Dashboard
          </button>
          <button
            @click="goHome"
            class="px-6 py-3.5 bg-white hover:bg-surface border border-border text-text font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>

      <!-- Active Checkout Flow -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left Side: Interactive Steps Form (col-span-7) -->
        <div class="lg:col-span-7 space-y-8">
          
          <!-- Stepper Headings -->
          <div class="flex items-center justify-between bg-surface border border-border p-3 sm:p-4 rounded-2xl text-xs font-bold text-muted select-none">

            <div class="flex items-center gap-2" :class="{'text-primary': currentStep >= 1}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0" :class="currentStep > 1 ? 'bg-primary text-white' : 'bg-primary/10 border border-primary/30'">
                <Check v-if="currentStep > 1" class="w-3 h-3 text-white" />
                <span v-else>1</span>
              </span>
              <span class="hidden sm:inline">Information</span>
            </div>

            <ChevronRight class="w-4 h-4 text-muted shrink-0" />

            <div class="flex items-center gap-2" :class="{'text-primary': currentStep >= 2, 'text-muted': currentStep < 2}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0" :class="currentStep > 2 ? 'bg-primary text-white' : currentStep === 2 ? 'bg-primary/10 border border-primary/30' : 'bg-surface border border-border'">
                <Check v-if="currentStep > 2" class="w-3 h-3 text-white" />
                <span v-else>2</span>
              </span>
              <span class="hidden sm:inline">Shipping</span>
            </div>

            <ChevronRight class="w-4 h-4 text-muted shrink-0" />

            <div class="flex items-center gap-2" :class="{'text-primary': currentStep >= 3, 'text-muted': currentStep < 3}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0" :class="currentStep === 3 ? 'bg-primary/10 border border-primary/30' : 'bg-surface border border-border'">
                3
              </span>
              <span class="hidden sm:inline">Payment</span>
            </div>

          </div>

          <!-- STEP 1: INFORMATION -->
          <div v-if="currentStep === 1" class="bg-surface border border-border rounded-[32px] p-6 space-y-6 shadow-xl">

            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-lg font-black text-text">Contact Information</h2>
                <p class="text-xs text-muted mt-0.5">Please provide delivery address coordinate logs</p>
              </div>
              <div v-if="!isLoggedIn" class="text-right">
                <span class="text-[10px] text-muted leading-none">Already have an account?</span>
                <button @click="router.push('/customer-auth')" class="block text-xs text-primary font-bold hover:underline">Log in</button>
              </div>
              <div v-else class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/25 text-primary text-xs font-bold">
                <User class="w-3.5 h-3.5" />
                <span>Logged In</span>
              </div>
            </div>

            <div class="space-y-4">
              <!-- Email Address -->
              <div>
                <label for="checkout-email" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Email Address</label>
                <input
                  id="checkout-email"
                  v-model="email"
                  type="email"
                  placeholder="name@example.com"
                  class="w-full bg-white border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary text-sm font-medium disabled:opacity-50"
                  :disabled="isLoggedIn"
                  required
                />
              </div>

              <!-- Phone Number -->
              <div>
                <label for="checkout-phone" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Phone Number</label>
                <input
                  id="checkout-phone"
                  v-model="phone"
                  type="tel"
                  placeholder="+94 77 123 4567"
                  class="w-full bg-white border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary text-sm font-medium"
                  required
                />
              </div>

              <div class="border-t border-border pt-4">
                <h3 class="text-sm font-extrabold text-text mb-4">Shipping Address</h3>
              </div>

              <!-- Country -->
              <div>
                <label for="checkout-country" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Country/Region</label>
                <div class="relative">
                  <select
                    id="checkout-country"
                    v-model="country"
                    class="appearance-none w-full bg-white border border-border rounded-xl py-3 pl-4 pr-10 text-text focus:outline-none focus:border-primary text-sm font-semibold cursor-pointer"
                  >
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="India">India</option>
                  </select>
                  <ChevronDown class="w-4 h-4 text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <!-- First & Last Name -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="checkout-firstname" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">First Name</label>
                  <input
                    id="checkout-firstname"
                    v-model="firstName"
                    type="text"
                    placeholder="Sohan"
                    class="w-full bg-white border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary text-sm font-medium"
                    required
                  />
                </div>
                <div>
                  <label for="checkout-lastname" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Last Name</label>
                  <input
                    id="checkout-lastname"
                    v-model="lastName"
                    type="text"
                    placeholder="Fernando"
                    class="w-full bg-white border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <!-- Street Address -->
              <div>
                <label for="checkout-address" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Street Address</label>
                <input
                  id="checkout-address"
                  v-model="address"
                  type="text"
                  placeholder="123 Galle Road"
                  class="w-full bg-white border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary text-sm font-medium"
                  required
                />
              </div>

              <!-- Apartment, suite, etc. -->
              <div>
                <label for="checkout-apartment" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Apartment, suite, etc. (optional)</label>
                <input
                  id="checkout-apartment"
                  v-model="apartment"
                  type="text"
                  placeholder="Suite 4B"
                  class="w-full bg-white border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary text-sm font-medium"
                />
              </div>

              <!-- City, Postal Code -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="checkout-city" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">City</label>
                  <input
                    id="checkout-city"
                    v-model="city"
                    type="text"
                    placeholder="Colombo"
                    class="w-full bg-white border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary text-sm font-medium"
                    required
                  />
                </div>
                <div>
                  <label for="checkout-postal" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Postal Code</label>
                  <input
                    id="checkout-postal"
                    v-model="postalCode"
                    type="text"
                    placeholder="00300"
                    class="w-full bg-white border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <!-- Save Info -->
              <div class="flex items-center gap-3 pt-2">
                <input
                  v-model="saveInfo"
                  type="checkbox"
                  id="save-info"
                  class="w-4 h-4 rounded border-border bg-white text-primary focus:ring-primary/20 focus:ring-2 cursor-pointer"
                />
                <label for="save-info" class="text-xs text-muted select-none cursor-pointer">
                  Save this information for a faster checkout next time
                </label>
              </div>

            </div>

            <!-- Footer navigation -->
            <div class="pt-6 border-t border-border flex items-center justify-between">
              <button
                @click="router.push('/cart')"
                class="flex items-center gap-2 text-muted hover:text-text transition-all text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft class="w-4 h-4" />
                <span>Return to Cart</span>
              </button>

              <button
                @click="nextStep"
                class="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                Continue to Shipping
              </button>
            </div>

          </div>

          <!-- STEP 2: SHIPPING -->
          <div v-if="currentStep === 2" class="bg-surface border border-border rounded-[32px] p-6 space-y-6 shadow-xl">

            <div>
              <h2 class="text-lg font-black text-text">Shipping Method</h2>
              <p class="text-xs text-muted mt-0.5">Select a shipping service rate option</p>
            </div>

            <!-- Contact & Address Summary -->
            <div class="bg-white border border-border rounded-2xl p-4 divide-y divide-border text-xs font-medium space-y-3">
              <div class="flex justify-between items-start pb-3">
                <div class="w-1/4 text-muted font-bold uppercase tracking-wider">Contact</div>
                <div class="w-2/3 text-text select-all">{{ email }} &bull; {{ phone }}</div>
                <button @click="currentStep = 1" class="text-primary font-bold hover:underline">Change</button>
              </div>
              <div class="flex justify-between items-start pt-3">
                <div class="w-1/4 text-muted font-bold uppercase tracking-wider">Ship To</div>
                <div class="w-2/3 text-text leading-relaxed select-all">
                  {{ firstName }} {{ lastName }}, {{ address }}{{ apartment ? ', ' + apartment : '' }}, {{ city }}, {{ postalCode }}, {{ country }}
                </div>
                <button @click="currentStep = 1" class="text-primary font-bold hover:underline">Change</button>
              </div>
            </div>

            <!-- Method Selection -->
            <div class="space-y-4">
              <!-- Method 1: Pickup -->
              <label
                class="flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer"
                :class="shippingMethod === 'pickup' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted/40 bg-white'"
              >
                <div class="flex items-start gap-4">
                  <input
                    type="radio"
                    v-model="shippingMethod"
                    value="pickup"
                    class="w-4 h-4 text-primary border-border focus:ring-primary/20 focus:ring-2 mt-1.5"
                  />
                  <div>
                    <span class="font-extrabold text-sm text-text block">{{ shippingPrices.pickup.label }}</span>
                    <span class="text-[10px] text-muted leading-relaxed block mt-0.5">Collect directly from our premium flagship headquarters center</span>
                  </div>
                </div>
                <div class="text-right font-mono font-black text-sm text-text">
                  {{ shippingPrices.pickup.rs === 0 ? 'Free' : 'Rs. ' + shippingPrices.pickup.rs.toLocaleString() }}
                </div>
              </label>

              <!-- Method 2: Heavy Shipping -->
              <label
                class="flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer"
                :class="shippingMethod === 'heavy' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted/40 bg-white'"
              >
                <div class="flex items-start gap-4">
                  <input
                    type="radio"
                    v-model="shippingMethod"
                    value="heavy"
                    class="w-4 h-4 text-primary border-border focus:ring-primary/20 focus:ring-2 mt-1.5"
                  />
                  <div>
                    <span class="font-extrabold text-sm text-text block">{{ shippingPrices.heavy.label }}</span>
                    <span class="text-[10px] text-muted leading-relaxed block mt-0.5">Expedited courier dispatch matching heavy box safety checks</span>
                  </div>
                </div>
                <div class="text-right font-mono font-black text-sm text-text">
                  {{ shippingPrices.heavy.rs === 0 ? 'Free' : 'Rs. ' + shippingPrices.heavy.rs.toLocaleString() }}
                </div>
              </label>
            </div>

            <!-- Footer Navigation -->
            <div class="pt-6 border-t border-border flex items-center justify-between">
              <button
                @click="prevStep"
                class="flex items-center gap-2 text-muted hover:text-text transition-all text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft class="w-4 h-4" />
                <span>Return to Information</span>
              </button>

              <button
                @click="nextStep"
                class="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                Continue to Payment
              </button>
            </div>

          </div>

          <!-- STEP 3: PAYMENT -->
          <div v-if="currentStep === 3" class="bg-surface border border-border rounded-[32px] p-6 space-y-6 shadow-xl">

            <div>
              <h2 class="text-lg font-black text-text">Payment Method</h2>
              <p class="text-xs text-muted mt-0.5">All transactions are encrypted and 100% secure</p>
            </div>

            <!-- Contact, Address & Shipping Summary -->
            <div class="bg-white border border-border rounded-2xl p-4 divide-y divide-border text-xs font-medium space-y-3">
              <div class="flex justify-between items-start pb-3">
                <div class="w-1/4 text-muted font-bold uppercase tracking-wider">Contact</div>
                <div class="w-2/3 text-text select-all">{{ email }}</div>
                <button @click="currentStep = 1" class="text-primary font-bold hover:underline">Change</button>
              </div>
              <div class="flex justify-between items-start py-3">
                <div class="w-1/4 text-muted font-bold uppercase tracking-wider">Ship To</div>
                <div class="w-2/3 text-text leading-relaxed select-all">
                  {{ address }}{{ apartment ? ', ' + apartment : '' }}, {{ city }}, {{ country }}
                </div>
                <button @click="currentStep = 1" class="text-primary font-bold hover:underline">Change</button>
              </div>
              <div class="flex justify-between items-start pt-3">
                <div class="w-1/4 text-muted font-bold uppercase tracking-wider">Method</div>
                <div class="w-2/3 text-text">
                  {{ shippingMethod === 'pickup' ? shippingPrices.pickup.label : shippingPrices.heavy.label }}
                  &bull; <span class="font-mono text-muted">{{ selectedShippingCostRs === 0 ? 'Free' : 'Rs. ' + selectedShippingCostRs.toLocaleString() }}</span>
                </div>
                <button @click="currentStep = 2" class="text-primary font-bold hover:underline">Change</button>
              </div>
            </div>

            <!-- Stripe Payment Element -->
            <div class="space-y-4">
              <div class="p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs flex items-center gap-2">
                <Info class="w-4 h-4 text-primary" />
                <span>Payments are securely processed by Stripe. Your card details never touch our servers.</span>
              </div>

              <!-- Payment Element mount point -->
              <div class="bg-white border border-border rounded-2xl p-5">
                <div v-if="isCreatingIntent" class="flex items-center justify-center py-10">
                  <Loader2 class="animate-spin w-6 h-6 text-primary" />
                </div>
                <div ref="paymentElementRef" v-show="!isCreatingIntent"></div>
              </div>

              <p v-if="paymentError" class="text-xs text-error font-semibold">{{ paymentError }}</p>
            </div>

            <!-- Footer Navigation -->
            <div class="pt-6 border-t border-border flex items-center justify-between">
              <button
                @click="prevStep"
                class="flex items-center gap-2 text-muted hover:text-text transition-all text-xs font-semibold cursor-pointer"
                :disabled="isSubmitting"
              >
                <ArrowLeft class="w-4 h-4" />
                <span>Return to Shipping</span>
              </button>

              <button
                @click="submitOrder"
                class="px-6 py-3.5 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2"
                :disabled="isSubmitting || isCreatingIntent || !paymentReady"
              >
                <Loader2 v-if="isSubmitting" class="animate-spin w-4 h-4 text-white" />
                <span>{{ isSubmitting ? 'Processing Payment...' : 'Complete Payment' }}</span>
              </button>
            </div>

          </div>

        </div>

        <!-- Right Side: Order summary (col-span-5) -->
        <div class="lg:col-span-5 space-y-6">
          
          <div class="bg-surface border border-border rounded-[32px] p-6 shadow-xl space-y-6">

            <h2 class="text-lg font-black text-text flex items-center gap-2">
              <ShoppingCart class="w-5 h-5 text-primary" />
              <span>Order Summary</span>
            </h2>

            <!-- Items List -->
            <div class="divide-y divide-border max-h-80 overflow-y-auto pr-2 space-y-3">
              <div
                v-for="(item, idx) in cart"
                :key="idx"
                class="flex items-center gap-4 py-3 first:pt-0"
              >
                <div class="w-14 h-14 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shrink-0 relative">
                  <img v-if="item.variant.imageUrl" :src="item.variant.imageUrl" :alt="item.product.name" class="w-full h-full object-cover" />
                  <Smartphone v-else class="w-6 h-6 text-muted" />
                  <span class="absolute -top-1.5 -right-1.5 bg-primary border border-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center text-white">
                    {{ item.quantity }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-extrabold text-text text-xs truncate">{{ item.product.name }}</h4>
                  <p class="text-[9px] text-primary font-bold uppercase mt-0.5">{{ item.variant.color }}</p>
                  <p class="text-[9px] text-muted font-mono mt-0.5">Rs. {{ item.product.price.toLocaleString() }} each</p>
                </div>
                <div class="text-right font-mono font-bold text-text text-xs">
                  Rs. {{ (item.product.price * item.quantity).toLocaleString() }}.00
                </div>
              </div>
            </div>

            <!-- Coupon / Promo Input -->
            <div class="bg-white border border-border rounded-[24px] p-5 space-y-3">
              <label class="block text-[10px] font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Tag class="w-3.5 h-3.5 text-primary" /> Apply Coupon Code
              </label>
              
              <div v-if="!discountApplied" class="flex gap-2">
                <input
                  v-model="discountCode"
                  type="text"
                  placeholder="e.g. WELCOME10"
                  class="bg-white border border-border rounded-xl px-3 py-2 text-xs font-bold text-text focus:outline-none uppercase w-2/3 focus:border-primary"
                  @keyup.enter="applyDiscountCode()"
                />
                <button
                  @click="applyDiscountCode()"
                  :disabled="isApplyingDiscount"
                  class="px-4 py-2 bg-primary hover:bg-primary-dark rounded-xl text-xs font-black uppercase text-white cursor-pointer w-1/3 disabled:opacity-50 flex items-center justify-center"
                >
                  <Loader2 v-if="isApplyingDiscount" class="w-4 h-4 animate-spin" />
                  <span v-else>Apply</span>
                </button>
              </div>

              <div v-else class="flex items-center justify-between bg-success/5 border border-success/15 p-3.5 rounded-xl">
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

            <!-- Cost Breakdown -->
            <div class="border-t border-border pt-4 space-y-3.5 text-xs font-semibold text-muted">
              <div class="flex justify-between items-center">
                <span>Subtotal</span>
                <span class="font-mono text-text font-bold">Rs. {{ cartSubtotal.toLocaleString() }}.00</span>
              </div>

              <div v-if="discountApplied" class="flex justify-between items-center text-xs text-success font-bold">
                <span>Discount ({{ appliedCode }})</span>
                <span class="font-mono">-Rs. {{ discountDeduction.toLocaleString() }}.00</span>
              </div>

              <div class="flex justify-between items-center">
                <span>Shipping Method</span>
                <span class="text-text font-bold text-[10px] uppercase">
                  {{ shippingMethod === 'pickup' ? 'Store Pickup' : 'Heavy Shipping' }}
                </span>
              </div>

              <div class="flex justify-between items-center">
                <span>Shipping Charge</span>
                <div class="text-right">
                  <span class="font-mono text-text font-bold block">{{ selectedShippingCostRs === 0 ? 'Free' : 'Rs. ' + selectedShippingCostRs.toLocaleString() }}</span>
                </div>
              </div>

              <div class="flex justify-between items-center text-sm font-bold border-t border-border pt-4 text-text">
                <span>Total Amount</span>
                <span class="text-primary font-mono font-black">Rs. {{ orderTotalRs.toLocaleString() }}</span>
              </div>
            </div>

            <!-- Custom instructions notice -->
            <div v-if="orderInstructions.trim()" class="bg-white border border-border rounded-xl p-3.5 text-[10px] leading-relaxed">
              <span class="font-bold text-primary uppercase tracking-wider block mb-1">Order Special Instructions:</span>
              <p class="text-muted italic">"{{ orderInstructions }}"</p>
            </div>

          </div>

        </div>

      </div>

    </main>
  </div>
</template>

<style scoped>
/* Stepper animation or general custom transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
