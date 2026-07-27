<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { ShieldCheck, CheckCircle2, XCircle, FileText } from '@lucide/vue'

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
        <h1 class="text-4xl md:text-5xl font-black text-text tracking-tight">Warranty Policies</h1>
        <p class="text-xs sm:text-sm text-muted leading-relaxed font-semibold">
          Every product we sell is backed by its manufacturer's warranty.
        </p>
      </section>

      <!-- How it works -->
      <section class="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
        <div class="flex items-center gap-2">
          <ShieldCheck class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-black text-text tracking-tight">Manufacturer Warranty</h2>
        </div>
        <p class="text-xs sm:text-sm text-muted leading-relaxed">
          TechPulse honors the original manufacturer's warranty for every product we sell. The exact warranty period (typically ranging from
          <strong class="text-text">6 months up to 2 years</strong> depending on the manufacturer and product) is listed on each product's page and on your order invoice.
        </p>
      </section>

      <!-- Coverage -->
      <section class="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-5 shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-success/5 border border-success/20 rounded-2xl p-5 space-y-2">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-success" />
              <h3 class="font-bold text-sm text-text">Covered</h3>
            </div>
            <ul class="text-xs text-muted leading-relaxed list-disc list-inside space-y-1">
              <li>Manufacturing defects</li>
              <li>Hardware malfunctions under normal use</li>
              <li>Faults present out of the box</li>
            </ul>
          </div>
          <div class="bg-error/5 border border-error/20 rounded-2xl p-5 space-y-2">
            <div class="flex items-center gap-2">
              <XCircle class="w-4 h-4 text-error" />
              <h3 class="font-bold text-sm text-text">Not Covered</h3>
            </div>
            <ul class="text-xs text-muted leading-relaxed list-disc list-inside space-y-1">
              <li>Physical, liquid, or accidental damage</li>
              <li>Unauthorized repairs or modifications</li>
              <li>Normal wear and tear (batteries, cables)</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Claim process -->
      <section class="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
        <div class="flex items-center gap-2">
          <FileText class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-black text-text tracking-tight">Making a Warranty Claim</h2>
        </div>
        <p class="text-xs sm:text-sm text-muted leading-relaxed">
          Keep your order invoice - it's your proof of purchase and warranty start date. To make a claim, contact our support team with your order number
          (available in <RouterLink to="/dashboard" class="text-primary font-bold hover:underline">your account dashboard</RouterLink>) and a description of the fault.
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
        <RouterLink to="/returns-refunds" class="text-xs font-bold text-primary hover:underline">Returns & Refunds</RouterLink>
        <span class="text-border">•</span>
        <RouterLink to="/faq" class="text-xs font-bold text-primary hover:underline">FAQ Center</RouterLink>
      </section>

    </main>

    <Footer />

  </div>
</template>
