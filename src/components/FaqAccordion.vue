<script setup lang="ts">
import { ref } from 'vue'
import { HelpCircle, ChevronDown } from '@lucide/vue'

interface FAQItem {
  id: number
  question: string
  answer: string
}

const faqs = ref<FAQItem[]>([
  {
    id: 1,
    question: 'How to place an order?',
    answer: 'Browse our extensive catalog of premium products, choose your preferred variant (such as color or storage size), and add the items to your shopping cart. Once you are done, click on the cart drawer and proceed to the Checkout page where you can fill in your shipping details and choose your preferred payment option.'
  },
  {
    id: 2,
    question: 'What are the delivery and shipping charges?',
    answer: 'We deliver islandwide in Sri Lanka. Standard shipping charges are calculated at checkout based on your delivery district. Standard shipping typically takes 2-4 business days, while express delivery options are available for selected regions.'
  },
  {
    id: 3,
    question: "What is TechPulse's Return & Refund Policy?",
    answer: 'We accept returns for items with verified manufacturing defects within 7 days of purchase. The product must be returned unused, in its original pristine packaging, and with all accessories and booklets included. Contact our support team directly to initiate a return request.'
  },
  {
    id: 4,
    question: 'What is the warranty period on electronics?',
    answer: 'All our products come with a comprehensive store warranty. The warranty period typically ranges from 6 months up to 2 years, depending on the manufacturer and the specific product. Detailed warranty details are specified on individual product invoice details.'
  }
])

const openFaqId = ref<number | null>(null)

const toggleFaq = (id: number) => {
  if (openFaqId.value === id) {
    openFaqId.value = null
  } else {
    openFaqId.value = id
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2 mb-2">
      <HelpCircle class="w-6 h-6 text-primary" />
      <h2 class="text-2xl font-black text-text tracking-tight">Frequently Asked Questions</h2>
    </div>

    <div class="w-full space-y-4">
      <div
        v-for="faq in faqs"
        :key="faq.id"
        class="bg-white border border-border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
        :class="openFaqId === faq.id ? 'border-primary/30 ring-2 ring-primary/5' : ''"
      >
        <!-- Accordion Header -->
        <button
          @click="toggleFaq(faq.id)"
          class="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-text hover:text-primary transition-colors cursor-pointer select-none"
        >
          <span>{{ faq.question }}</span>
          <ChevronDown
            class="w-4 h-4 text-muted shrink-0 transition-transform duration-300"
            :class="openFaqId === faq.id ? 'rotate-180 text-primary' : ''"
          />
        </button>

        <!-- Accordion Body (Slide Transition) -->
        <div
          v-show="openFaqId === faq.id"
          class="px-6 pb-5 pt-1 text-xs text-muted font-medium leading-relaxed border-t border-dashed border-border"
        >
          {{ faq.answer }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.border-t-dashed {
  border-top-style: dashed;
}
</style>
