<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRight, CheckCircle2 } from '@lucide/vue'
import logoIcon from '../assets/logo-icon.png'

const emit = defineEmits<{
  (e: 'scroll-to', id: string): void
}>()

const newsletterEmail = ref('')
const newsletterSubscribed = ref(false)

const handleNewsletterSubmit = () => {
  if (newsletterEmail.value.trim()) {
    newsletterSubscribed.value = true
    newsletterEmail.value = ''
    setTimeout(() => {
      newsletterSubscribed.value = false
    }, 4000)
  }
}
</script>

<template>
  <!-- Footer Section -->
  <footer id="footer-section" class="border-t border-border bg-surface pt-16 pb-12 relative z-10">
    <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8">

      <!-- Left Panel: Logo & Description -->
      <div class="md:col-span-4 space-y-6">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <img :src="logoIcon" alt="TechPulse" class="w-5 h-5 object-contain" />
          </div>
          <span class="font-extrabold text-base text-text tracking-tight uppercase">TechPulse</span>
        </div>
        <p class="text-muted text-xs leading-relaxed max-w-sm">
          TechPulse is your premium trusted electronics and gadget store. We supply flagship electronics, smart devices, appliances, and wear tech with comprehensive store warranty policies.
        </p>
      </div>

      <!-- Quick Links -->
      <div class="md:col-span-2 space-y-4">
        <h4 class="text-xs font-black uppercase tracking-wider text-text">Quick Links</h4>
        <ul class="space-y-2.5 text-xs text-muted font-semibold">
          <li><button @click="emit('scroll-to', 'hero-section')" class="hover:text-text transition-colors cursor-pointer">Home</button></li>
          <li><button @click="emit('scroll-to', 'catalog-section')" class="hover:text-text transition-colors cursor-pointer">Shop All</button></li>
          <li><button @click="emit('scroll-to', 'catalog-section')" class="hover:text-text transition-colors cursor-pointer">Popular Categories</button></li>
          <li><button @click="emit('scroll-to', 'catalog-section')" class="hover:text-text transition-colors cursor-pointer">Official Brands</button></li>
        </ul>
      </div>

      <!-- Customer Service -->
      <div class="md:col-span-3 space-y-4">
        <h4 class="text-xs font-black uppercase tracking-wider text-text">Customer Support</h4>
        <ul class="space-y-2.5 text-xs text-muted font-semibold">
          <li><a href="#" class="hover:text-text transition-colors">Help FAQ Center</a></li>
          <li><a href="#" class="hover:text-text transition-colors">Store Shipping & Delivery</a></li>
          <li><a href="#" class="hover:text-text transition-colors">Returns & Refunds</a></li>
          <li><a href="#" class="hover:text-text transition-colors">Warranty Policies</a></li>
        </ul>
      </div>

      <!-- Newsletter Subscription -->
      <div class="md:col-span-3 space-y-4">
        <h4 class="text-xs font-black uppercase tracking-wider text-text">Weekly Newsletter</h4>
        <p class="text-muted text-xs leading-relaxed">
          Subscribe to receive premium deals and stock updates directly in your inbox.
        </p>

        <form @submit.prevent="handleNewsletterSubmit" class="space-y-2.5">
          <div class="relative flex items-center">
            <input
              v-model="newsletterEmail"
              type="email"
              required
              placeholder="Email Address"
              class="w-full bg-white border border-border rounded-xl py-3 pl-3 pr-10 text-text placeholder-muted/60 focus:outline-none focus:border-primary text-xs"
            />
            <button
              type="submit"
              class="absolute right-1.5 p-1.5 bg-primary hover:bg-primary-dark rounded-lg text-white transition-all cursor-pointer"
            >
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <Transition name="fade">
            <p v-if="newsletterSubscribed" class="text-[10px] text-success font-bold flex items-center gap-1.5">
              <CheckCircle2 class="w-3.5 h-3.5" />
              <span>Thank you for subscribing!</span>
            </p>
          </Transition>
        </form>
      </div>

    </div>

    <!-- Copyright border -->
    <div class="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-border text-center text-[10px] text-muted font-bold uppercase tracking-wider">
      <p>&copy; 2026 TechPulse. All Rights Reserved.</p>
    </div>
  </footer>
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
</style>
