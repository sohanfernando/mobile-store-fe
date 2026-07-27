<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { RotateCcw, CheckCircle2, XCircle, Wallet, Mail } from '@lucide/vue'

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
        <h1 class="text-4xl md:text-5xl font-black text-text tracking-tight">Returns & Refunds</h1>
        <p class="text-xs sm:text-sm text-muted leading-relaxed font-semibold">
          Not the right fit? Here's how returns work at TechPulse.
        </p>
      </section>

      <!-- Return Window -->
      <section class="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
        <div class="flex items-center gap-2">
          <RotateCcw class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-black text-text tracking-tight">7-Day Return Window</h2>
        </div>
        <p class="text-xs sm:text-sm text-muted leading-relaxed">
          You may request a return within <strong class="text-text">7 days of delivery</strong>. Returns requested after this window cannot be accepted.
        </p>
      </section>

      <!-- Conditions -->
      <section class="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-5 shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-success/5 border border-success/20 rounded-2xl p-5 space-y-2">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-success" />
              <h3 class="font-bold text-sm text-text">Eligible for Return</h3>
            </div>
            <ul class="text-xs text-muted leading-relaxed list-disc list-inside space-y-1">
              <li>Unused and in original condition</li>
              <li>Original packaging, accessories, and manuals included</li>
              <li>Requested within 7 days of delivery</li>
            </ul>
          </div>
          <div class="bg-error/5 border border-error/20 rounded-2xl p-5 space-y-2">
            <div class="flex items-center gap-2">
              <XCircle class="w-4 h-4 text-error" />
              <h3 class="font-bold text-sm text-text">Not Eligible</h3>
            </div>
            <ul class="text-xs text-muted leading-relaxed list-disc list-inside space-y-1">
              <li>Opened earphones/headphones (hygiene items)</li>
              <li>Physical or liquid damage caused after delivery</li>
              <li>Missing original packaging or accessories</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Shipping cost -->
      <section class="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
        <div class="flex items-center gap-2">
          <Wallet class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-black text-text tracking-tight">Refunds & Return Shipping</h2>
        </div>
        <p class="text-xs sm:text-sm text-muted leading-relaxed">
          Once we receive and inspect your returned item, we'll process your refund to your original payment method. Return shipping costs are covered by the customer,
          except in cases where the item arrived defective or we sent the wrong product.
        </p>
      </section>

      <!-- How to start -->
      <section class="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
        <div class="flex items-center gap-2">
          <Mail class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-black text-text tracking-tight">How to Request a Return</h2>
        </div>
        <p class="text-xs sm:text-sm text-muted leading-relaxed">
          Contact our support team with your order number (found in <RouterLink to="/dashboard" class="text-primary font-bold hover:underline">your account dashboard</RouterLink>)
          and a short description of the issue. We'll walk you through the next steps.
        </p>
        <RouterLink
          to="/contact"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
        >
          Contact Support
        </RouterLink>
      </section>

      <!-- Related policies -->
      <section class="flex flex-wrap gap-3 justify-center pt-4">
        <RouterLink to="/shipping-delivery" class="text-xs font-bold text-primary hover:underline">Shipping & Delivery</RouterLink>
        <span class="text-border">•</span>
        <RouterLink to="/warranty-policy" class="text-xs font-bold text-primary hover:underline">Warranty Policies</RouterLink>
        <span class="text-border">•</span>
        <RouterLink to="/faq" class="text-xs font-bold text-primary hover:underline">FAQ Center</RouterLink>
      </section>

    </main>

    <Footer />

  </div>
</template>
