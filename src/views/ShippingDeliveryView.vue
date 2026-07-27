<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { Truck, Store, Clock, MapPin, PackageSearch } from '@lucide/vue'

const router = useRouter()
const isLoggedIn = ref(false)
const cart = ref<{ product: any; variant: any; quantity: number }[]>([])

const checkAuth = () => {
  isLoggedIn.value = !!localStorage.getItem('customer-token')
}

const loadCart = () => {
  const stored = localStorage.getItem('mobile-store-cart')
  if (stored) {
    cart.value = JSON.parse(stored)
  }
}

const totalCartItems = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0)
})

onMounted(() => {
  checkAuth()
  loadCart()
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

    <main class="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-10">

      <section class="text-center max-w-2xl mx-auto space-y-4">
        <h1 class="text-4xl md:text-5xl font-black text-text tracking-tight">Shipping & Delivery</h1>
        <p class="text-xs sm:text-sm text-muted leading-relaxed font-semibold">
          How your order gets from our store to your door.
        </p>
      </section>

      <!-- Delivery Methods -->
      <section class="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div class="flex items-center gap-2">
          <Truck class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-black text-text tracking-tight">Delivery Methods</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-surface border border-border rounded-2xl p-5 space-y-2">
            <div class="flex items-center gap-2">
              <Store class="w-4 h-4 text-primary" />
              <h3 class="font-bold text-sm text-text">Store Pickup</h3>
            </div>
            <p class="text-xs text-muted leading-relaxed">
              Free. Collect your order in person from our store once it's ready. Choose "Pickup" at checkout.
            </p>
          </div>
          <div class="bg-surface border border-border rounded-2xl p-5 space-y-2">
            <div class="flex items-center gap-2">
              <Truck class="w-4 h-4 text-primary" />
              <h3 class="font-bold text-sm text-text">Standard Delivery</h3>
            </div>
            <p class="text-xs text-muted leading-relaxed">
              Rs. 200 flat rate, delivered islandwide across Sri Lanka. Cost is fixed regardless of order size or destination.
            </p>
          </div>
        </div>
      </section>

      <!-- Timeframes -->
      <section class="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
        <div class="flex items-center gap-2">
          <Clock class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-black text-text tracking-tight">Delivery Timeframes</h2>
        </div>
        <p class="text-xs sm:text-sm text-muted leading-relaxed">
          Standard delivery typically takes <strong class="text-text">2-4 business days</strong> from order confirmation, depending on your location.
          Store pickup orders are usually ready within 1 business day - we'll notify you once your order status changes to "Shipped".
        </p>
      </section>

      <!-- Coverage -->
      <section class="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
        <div class="flex items-center gap-2">
          <MapPin class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-black text-text tracking-tight">Delivery Coverage</h2>
        </div>
        <p class="text-xs sm:text-sm text-muted leading-relaxed">
          We currently deliver islandwide within Sri Lanka. Enter your full address, city, and postal code at checkout so our courier can reach you without delays.
        </p>
      </section>

      <!-- Tracking -->
      <section class="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
        <div class="flex items-center gap-2">
          <PackageSearch class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-black text-text tracking-tight">Tracking Your Order</h2>
        </div>
        <p class="text-xs sm:text-sm text-muted leading-relaxed">
          You'll receive an email update whenever your order's status changes (Processing, Shipped, Delivered). You can also check the live status anytime
          from <RouterLink to="/dashboard" class="text-primary font-bold hover:underline">your account dashboard</RouterLink>.
        </p>
      </section>

      <!-- Related policies -->
      <section class="flex flex-wrap gap-3 justify-center pt-4">
        <RouterLink to="/returns-refunds" class="text-xs font-bold text-primary hover:underline">Returns & Refunds</RouterLink>
        <span class="text-border">•</span>
        <RouterLink to="/warranty-policy" class="text-xs font-bold text-primary hover:underline">Warranty Policies</RouterLink>
        <span class="text-border">•</span>
        <RouterLink to="/faq" class="text-xs font-bold text-primary hover:underline">FAQ Center</RouterLink>
      </section>

    </main>

    <Footer />

  </div>
</template>
