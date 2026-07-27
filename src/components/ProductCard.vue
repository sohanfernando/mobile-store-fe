<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Product } from '../types/product'
import { getTotalStock } from '../composables/useProductFilters'
import { Smartphone, Pencil, Trash2 } from '@lucide/vue'

const props = withDefaults(defineProps<{
  product: Product
  isAdmin?: boolean
}>(), {
  isAdmin: false
})

const emit = defineEmits<{
  (e: 'edit', product: Product): void
  (e: 'delete', id: number): void
  (e: 'click', product: Product): void
}>()

const isImageBroken = ref(false)

const handleImageError = () => {
  isImageBroken.value = true
}

const totalStock = computed(() => getTotalStock(props.product))

const productImage = computed(() => {
  if (!props.product.colorVariants || props.product.colorVariants.length === 0) return ''
  const validVariant = props.product.colorVariants.find(v => v.images?.[0] && !isImageBroken.value)
  return validVariant ? validVariant.images[0] : ''
})
const plainTextDescription = computed(() => {
  const desc = props.product.description || ''
  return desc
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim() || 'No description provided.'
})
</script>

<template>
  <div
    @click="!isAdmin && emit('click', props.product)"
    class="bg-white border border-border rounded-3xl p-5 hover:border-primary/30 transition-all duration-300 flex flex-col justify-between group shadow-sm"
    :class="{ 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-text/5': !isAdmin }"
  >
    <div>
      <!-- Product Image Placeholder or actual image -->
      <div class="h-44 w-full rounded-2xl bg-surface border border-border flex items-center justify-center overflow-hidden mb-4 relative">
        <img
          v-if="productImage"
          :src="productImage"
          :alt="props.product.name"
          class="h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
          @error="handleImageError"
        />
        <!-- Fallback representation if image missing -->
        <div v-else class="flex flex-col items-center justify-center text-muted">
          <Smartphone class="w-12 h-12 mb-2 text-muted" />
          <span class="text-xs uppercase tracking-wider text-muted font-semibold">{{ props.product.brand }}</span>
        </div>

        <!-- Stock Status Badge -->
        <span
          class="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-white shadow-sm"
          :class="{
            'bg-success': totalStock > 10,
            'bg-warning': totalStock > 0 && totalStock <= 10,
            'bg-error': totalStock === 0
          }"
        >
          {{ totalStock === 0 ? 'Out of Stock' : `${totalStock} Left` }}
        </span>
      </div>

      <!-- Product Meta -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-primary uppercase tracking-wider">{{ props.product.brand }}</span>
          <span class="text-xs text-muted font-medium">{{ props.product.modelNumber }}</span>
        </div>
        <h4 class="text-lg font-bold text-text tracking-tight truncate group-hover:text-primary transition-colors">
          {{ props.product.name }}
        </h4>
        <p class="text-muted text-xs line-clamp-2 leading-relaxed min-h-[32px]">
          {{ plainTextDescription }}
        </p>
      </div>

      <!-- Specs Badges -->
      <div class="flex flex-wrap items-center gap-2 mt-4">
        <span v-if="props.product.ramGb && props.product.ramGb > 0" class="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-surface border border-border text-muted">
          {{ props.product.ramGb }} GB RAM
        </span>
        <span v-if="props.product.storageGb && props.product.storageGb > 0" class="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-surface border border-border text-muted">
          {{ props.product.storageGb >= 1000 ? (props.product.storageGb % 1024 === 0 ? props.product.storageGb / 1024 : props.product.storageGb / 1000) + ' TB' : props.product.storageGb + ' GB' }} ROM
        </span>
      </div>
    </div>

    <!-- Pricing and Actions -->
    <div class="mt-5 flex items-center justify-between">
      <span class="text-xl font-extrabold text-text">
        Rs. {{ props.product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
      </span>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2" @click.stop>
        <template v-if="isAdmin">
          <button
            @click="emit('edit', props.product)"
            class="p-2 rounded-xl bg-surface hover:bg-border text-muted hover:text-text transition-all border border-border cursor-pointer"
            title="Edit Product"
          >
            <Pencil class="w-4 h-4" />
          </button>
          <button
            @click="emit('delete', props.product.id)"
            class="p-2 rounded-xl bg-surface hover:bg-error/10 text-muted hover:text-error transition-all border border-border cursor-pointer"
            title="Delete Product"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </template>
        <template v-else>
          <button
            @click="emit('click', props.product)"
            class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs cursor-pointer transition-all active:scale-95 shadow-md shadow-primary/10"
          >
            Details
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
