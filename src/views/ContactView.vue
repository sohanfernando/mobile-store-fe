<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import StoreLocator from '../components/StoreLocator.vue'
import ContactForm from '../components/ContactForm.vue'
import Footer from '../components/Footer.vue'
import { HelpCircle, ArrowRight } from '@lucide/vue'

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
    
    <!-- Sticky Navbar -->
    <Navbar
      :is-logged-in="isLoggedIn"
      :total-cart-items="totalCartItems"
      @toggle-cart="router.push('/cart')"
      @select-category="(c) => router.push({ path: '/', query: { category: c } })"
      @select-brand="(b) => router.push({ path: '/', query: { brand: b } })"
      @select-sort="(s) => router.push({ path: '/', query: { sort: s } })"
    />

    <!-- Main Content Container -->
    <main class="max-w-7xl mx-auto px-6 py-12 md:py-16 space-y-20">
      
      <!-- Page Header -->
      <section class="text-center max-w-2xl mx-auto space-y-4">
        <h1 class="text-4xl md:text-5xl font-black text-text tracking-tight">Contact Us</h1>
        <p class="text-xs sm:text-sm text-muted leading-relaxed font-semibold">
          Stay in touch with us. Connect with us for any inquiries or questions you may have.
        </p>
      </section>

      <!-- Store Locator Component -->
      <section id="store-locator-section" class="pt-6">
        <StoreLocator />
      </section>

      <!-- Contact Form Component -->
      <section id="contact-form-section" class="pt-6 border-t border-border">
        <ContactForm />
      </section>

      <!-- FAQ Teaser -->
      <section id="faq-section" class="pt-6 border-t border-border pb-6">
        <RouterLink
          to="/faq"
          class="flex items-center justify-between gap-4 bg-surface border border-border rounded-3xl p-6 md:p-8 hover:border-primary/30 transition-all group"
        >
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <HelpCircle class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm font-black text-text tracking-tight">Have a question?</h2>
              <p class="text-xs text-muted font-semibold mt-0.5">Visit our full FAQ Center for quick answers.</p>
            </div>
          </div>
          <ArrowRight class="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
        </RouterLink>
      </section>

    </main>

    <!-- Footer Section -->
    <Footer />

  </div>
</template>

<style scoped>
/* Page transition styles if any */
</style>
