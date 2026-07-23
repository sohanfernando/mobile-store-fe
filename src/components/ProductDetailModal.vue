<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Product } from '../types/product'
import { X, Smartphone } from '@lucide/vue'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const selectedVariantIndex = ref(0)
const brokenVariantImages = ref<Set<number>>(new Set())

const currentVariant = computed(() => {
  if (!props.product.colorVariants || props.product.colorVariants.length === 0) return null
  return props.product.colorVariants[selectedVariantIndex.value]
})

const handleImageError = (variantId?: number) => {
  if (variantId) {
    brokenVariantImages.value.add(variantId)
  }
}

const selectVariant = (index: number) => {
  selectedVariantIndex.value = index
}

const totalStock = computed(() => {
  if (!props.product.colorVariants) return 0
  return props.product.colorVariants.reduce((sum, v) => sum + v.stockQuantity, 0)
})
</script>

<template>
  <div class="space-y-6 relative">
    <!-- Header with Close Button -->
    <div class="flex items-start justify-between">
      <div>
        <span class="text-xs font-bold text-primary uppercase tracking-widest">{{ props.product.brand }}</span>
        <h2 class="text-3xl font-extrabold text-text tracking-tight mt-1">{{ props.product.name }}</h2>
        <p v-if="props.product.modelNumber" class="text-xs text-muted mt-1">Model: <span class="font-mono text-muted">{{ props.product.modelNumber }}</span></p>
      </div>
      <button
        @click="emit('close')"
        class="p-2 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-border transition-all cursor-pointer"
        type="button"
        title="Close details"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8">

      <!-- Left Column: Image Slider/Viewer -->
      <div class="md:col-span-5 flex flex-col items-center">
        <!-- Interactive Slide Viewer Container -->
        <div class="relative w-full aspect-square rounded-3xl bg-surface border border-border flex items-center justify-center overflow-hidden mb-4 shadow-inner group">
          <Transition name="slide" mode="out-in">
            <img
              :key="selectedVariantIndex"
              v-if="currentVariant && currentVariant.images?.[0] && !brokenVariantImages.has(currentVariant.id || 0)"
              :src="currentVariant.images[0]"
              :alt="props.product.name + ' - ' + currentVariant.color"
              class="h-full w-full object-contain p-6 group-hover:scale-105 transition-all duration-300"
              @error="handleImageError(currentVariant.id)"
            />
            <div v-else class="flex flex-col items-center justify-center text-muted py-10">
              <Smartphone class="w-16 h-16 text-muted mb-2" />
              <span class="text-xs uppercase tracking-wider text-muted font-bold">No Variant Image</span>
            </div>
          </Transition>

          <!-- Current Color Overlay Badge -->
          <span v-if="currentVariant" class="absolute bottom-4 left-4 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-xl bg-white/90 border border-border text-primary">
            {{ currentVariant.color }}
          </span>
        </div>
      </div>

      <!-- Right Column: Specs & Actions -->
      <div class="md:col-span-7 space-y-6">

        <!-- Pricing & Stock Header -->
        <div class="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted">Retail Price</p>
            <p class="text-2xl font-black text-text">Rs. {{ props.product.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted">Total Stock</p>
            <p class="text-2xl font-black text-primary">{{ totalStock }} units</p>
          </div>
        </div>

        <!-- Color Variant Selector -->
        <div v-if="props.product.colorVariants && props.product.colorVariants.length > 0 && !(props.product.colorVariants.length === 1 && (props.product.colorVariants[0].color.toLowerCase() === 'standard' || props.product.colorVariants[0].color.toLowerCase() === 'default'))" class="space-y-3">
          <label class="block text-xs font-semibold uppercase tracking-wider text-muted">Select Variant Color:</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(v, index) in props.product.colorVariants"
              :key="v.id"
              @click="selectVariant(index)"
              type="button"
              class="px-4 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2"
              :class="selectedVariantIndex === index
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white border-border text-muted hover:text-text hover:border-muted/40'"
            >
              <span>{{ v.color }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-black/10 text-current">
                Qty: {{ v.stockQuantity }}
              </span>
            </button>
          </div>
        </div>

        <!-- Tech Specifications Grid -->
        <div class="space-y-3">
          <label class="block text-xs font-semibold uppercase tracking-wider text-muted">Technical Specifications</label>
          <div class="grid grid-cols-2 gap-4">

            <div class="p-3 bg-surface border border-border rounded-xl flex flex-col">
              <span class="text-[10px] uppercase font-semibold text-muted">RAM Memory</span>
              <span class="text-sm font-bold text-text mt-0.5">{{ props.product.ramGb ? props.product.ramGb + ' GB' : 'N/A' }}</span>
            </div>

            <div class="p-3 bg-surface border border-border rounded-xl flex flex-col">
              <span class="text-[10px] uppercase font-semibold text-muted">Internal Storage</span>
              <span class="text-sm font-bold text-text mt-0.5">{{ props.product.storageGb ? (props.product.storageGb >= 1000 ? (props.product.storageGb % 1024 === 0 ? props.product.storageGb / 1024 : props.product.storageGb / 1000) + ' TB' : props.product.storageGb + ' GB') : 'N/A' }}</span>
            </div>

            <div class="p-3 bg-surface border border-border rounded-xl flex flex-col">
              <span class="text-[10px] uppercase font-semibold text-muted">Warranty Term</span>
              <span class="text-sm font-bold text-text mt-0.5">{{ props.product.warrantyPeriod ? props.product.warrantyPeriod + ' Months' : 'N/A' }}</span>
            </div>

            <div class="p-3 bg-surface border border-border rounded-xl flex flex-col">
              <span class="text-[10px] uppercase font-semibold text-muted">Current Color Stock</span>
              <span class="text-sm font-bold text-success mt-0.5" v-if="currentVariant">{{ currentVariant.stockQuantity }} units</span>
            </div>

          </div>
        </div>

        <!-- Description Box -->
        <div class="space-y-2">
          <label class="block text-xs font-semibold uppercase tracking-wider text-muted">Product Description</label>
          <div class="p-4 rounded-xl bg-surface border border-border text-text text-xs leading-relaxed max-h-80 overflow-y-auto">
            <div v-html="props.product.description || 'No description provided.'" class="description-content"></div>
          </div>
          <!-- Description Image (Legacy Fallback) -->
          <div v-if="props.product.descriptionImageUrl" class="mt-3 rounded-2xl overflow-hidden border border-border bg-surface flex justify-center p-2 max-h-[600px] overflow-y-auto">
            <img :src="props.product.descriptionImageUrl" alt="Product specifications details" class="max-w-full h-auto rounded-xl" />
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
/* Slider transition: Slide-out left, Slide-in right */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

/* Rich Text Description Content Styles */
.description-content :deep(h2) {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text, #2d3748);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  text-align: center;
}
.description-content :deep(h3) {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text, #2d3748);
  margin-top: 0.85rem;
  margin-bottom: 0.4rem;
  text-align: center;
}
.description-content :deep(p) {
  color: var(--muted, #718096);
  font-size: 0.75rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
  text-align: center;
}
.description-content :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-right: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--muted, #718096);
  display: inline-block;
  text-align: left;
}
.description-content :deep(li) {
  margin-bottom: 0.25rem;
}
.description-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  margin: 1rem auto;
  display: block;
}
</style>
