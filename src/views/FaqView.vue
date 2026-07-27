<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import FaqAccordion from '../components/FaqAccordion.vue'
import Footer from '../components/Footer.vue'

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

    <main class="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-10">

      <section class="text-center max-w-2xl mx-auto space-y-4">
        <h1 class="text-4xl md:text-5xl font-black text-text tracking-tight">Help & FAQ Center</h1>
        <p class="text-xs sm:text-sm text-muted leading-relaxed font-semibold">
          Quick answers to the questions we hear most often.
        </p>
      </section>

      <FaqAccordion />

      <!-- Still need help -->
      <section class="bg-surface border border-border rounded-3xl p-6 md:p-8 text-center space-y-4">
        <p class="text-xs sm:text-sm text-muted font-semibold">Still have a question?</p>
        <RouterLink
          to="/contact"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
        >
          Contact Support
        </RouterLink>
      </section>

      <!-- Related policies -->
      <section class="flex flex-wrap gap-3 justify-center pt-2">
        <RouterLink to="/shipping-delivery" class="text-xs font-bold text-primary hover:underline">Shipping & Delivery</RouterLink>
        <span class="text-border">•</span>
        <RouterLink to="/returns-refunds" class="text-xs font-bold text-primary hover:underline">Returns & Refunds</RouterLink>
        <span class="text-border">•</span>
        <RouterLink to="/warranty-policy" class="text-xs font-bold text-primary hover:underline">Warranty Policies</RouterLink>
      </section>

    </main>

    <Footer />

  </div>
</template>
