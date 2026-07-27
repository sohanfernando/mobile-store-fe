<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '../types/product'
import { getDistinctValues, type CategoryFilterState } from '../composables/useProductFilters'
import { X, RotateCcw } from '@lucide/vue'

const props = defineProps<{
  products: Product[]
  filters: CategoryFilterState
  showBrandFilter: boolean
  showRamFilter: boolean
  showStorageFilter: boolean
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:filters', val: CategoryFilterState): void
  (e: 'close'): void
}>()

const STORAGE_BUCKETS = [128, 256, 512, 1000, 2000]

const storageMatches = (product: Product, bucket: number): boolean => {
  if (bucket === 1000) return product.storageGb === 1000 || product.storageGb === 1024
  if (bucket === 2000) return product.storageGb === 2000 || product.storageGb === 2048
  return product.storageGb === bucket
}

const storageLabel = (bucket: number): string => (bucket >= 1000 ? `${bucket / 1000} TB` : `${bucket} GB`)

const priceBounds = computed(() => {
  const prices = props.products.map(p => p.price)
  if (prices.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...prices), max: Math.max(...prices) }
})

const availableColors = computed(() => {
  const colors = new Set<string>()
  for (const product of props.products) {
    for (const variant of product.colorVariants || []) {
      if (variant.color && variant.color.trim()) colors.add(variant.color)
    }
  }
  return Array.from(colors)
})

const availableBrands = computed(() => getDistinctValues(props.products, p => p.brand))

const availableRamOptions = computed(() => {
  const values = new Set(props.products.map(p => p.ramGb).filter((v): v is number => !!v && v > 0))
  return Array.from(values).sort((a, b) => a - b)
})

const availableStorageOptions = computed(() =>
  STORAGE_BUCKETS.filter(bucket => props.products.some(p => storageMatches(p, bucket)))
)

const update = (partial: Partial<CategoryFilterState>) => {
  emit('update:filters', { ...props.filters, ...partial })
}

const toggleInArray = (key: 'colors' | 'brands', value: string) => {
  const current = props.filters[key]
  const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
  update({ [key]: next } as Partial<CategoryFilterState>)
}

const minPrice = computed({
  get: () => props.filters.minPrice,
  set: (val: number) => update({ minPrice: Math.min(val, props.filters.maxPrice) })
})

const maxPrice = computed({
  get: () => props.filters.maxPrice,
  set: (val: number) => update({ maxPrice: Math.max(val, props.filters.minPrice) })
})

const hasActiveFilters = computed(() => {
  const f = props.filters
  return f.availability !== 'all' || f.colors.length > 0 || f.brands.length > 0 ||
    f.ramGb !== null || f.storageGb !== null ||
    f.minPrice > priceBounds.value.min || f.maxPrice < priceBounds.value.max
})

const clearAll = () => {
  update({
    availability: 'all',
    minPrice: priceBounds.value.min,
    maxPrice: priceBounds.value.max,
    colors: [],
    brands: [],
    ramGb: null,
    storageGb: null
  })
}
</script>

<template>
  <!-- Mobile backdrop -->
  <div
    v-if="isOpen"
    @click="emit('close')"
    class="fixed inset-0 bg-text/40 z-20 lg:hidden"
  ></div>

  <aside
    class="w-72 shrink-0 bg-white border border-border rounded-3xl p-6 space-y-7 fixed lg:static inset-y-4 left-4 z-30 transition-transform duration-300 lg:translate-x-0 overflow-y-auto max-h-[calc(100vh-2rem)] lg:max-h-none"
    :class="isOpen ? 'translate-x-0' : 'translate-x-[-120%]'"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-black text-text uppercase tracking-wider">Filters</h3>
      <div class="flex items-center gap-2">
        <button
          v-if="hasActiveFilters"
          @click="clearAll"
          class="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-dark uppercase tracking-wider cursor-pointer"
          title="Clear all filters"
        >
          <RotateCcw class="w-3 h-3" />
          <span>Clear</span>
        </button>
        <button
          @click="emit('close')"
          class="p-1.5 rounded-lg bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer lg:hidden"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Availability -->
    <div class="space-y-2.5">
      <label class="block text-[10px] font-bold uppercase tracking-wider text-muted">Availability</label>
      <div class="flex flex-col gap-2">
        <button
          v-for="opt in (['all', 'in-stock', 'out-of-stock'] as const)"
          :key="opt"
          @click="update({ availability: opt })"
          class="text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer"
          :class="filters.availability === opt ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted hover:text-text'"
        >
          {{ opt === 'all' ? 'All' : opt === 'in-stock' ? 'In Stock' : 'Out of Stock' }}
        </button>
      </div>
    </div>

    <!-- Price Range -->
    <div v-if="priceBounds.max > priceBounds.min" class="space-y-2.5">
      <label class="block text-[10px] font-bold uppercase tracking-wider text-muted">Price Range</label>
      <div class="flex items-center gap-2">
        <input
          v-model.number="minPrice"
          type="number"
          :min="priceBounds.min"
          :max="priceBounds.max"
          class="w-1/2 min-w-0 bg-white border border-border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary"
        />
        <span class="text-muted text-xs">—</span>
        <input
          v-model.number="maxPrice"
          type="number"
          :min="priceBounds.min"
          :max="priceBounds.max"
          class="w-1/2 min-w-0 bg-white border border-border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary"
        />
      </div>
      <div class="relative h-1.5 flex items-center">
        <div class="absolute inset-x-0 h-1.5 bg-border rounded-lg"></div>
        <div
          class="absolute h-1.5 bg-primary rounded-lg"
          :style="{
            left: `${((minPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100}%`,
            right: `${100 - ((maxPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100}%`
          }"
        ></div>
        <input
          v-model.number="minPrice"
          type="range"
          :min="priceBounds.min"
          :max="priceBounds.max"
          :step="Math.max(1, Math.round((priceBounds.max - priceBounds.min) / 100))"
          class="absolute inset-x-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-primary pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
        />
        <input
          v-model.number="maxPrice"
          type="range"
          :min="priceBounds.min"
          :max="priceBounds.max"
          :step="Math.max(1, Math.round((priceBounds.max - priceBounds.min) / 100))"
          class="absolute inset-x-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-primary pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
        />
      </div>
      <div class="flex items-center justify-between text-[10px] text-muted font-mono">
        <span>Rs. {{ priceBounds.min.toLocaleString() }}</span>
        <span>Rs. {{ priceBounds.max.toLocaleString() }}</span>
      </div>
    </div>

    <!-- Color -->
    <div v-if="availableColors.length > 0" class="space-y-2.5">
      <label class="block text-[10px] font-bold uppercase tracking-wider text-muted">Color</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="color in availableColors"
          :key="color"
          @click="toggleInArray('colors', color)"
          class="px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer"
          :class="filters.colors.includes(color) ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted hover:text-text'"
        >
          {{ color }}
        </button>
      </div>
    </div>

    <!-- Brand -->
    <div v-if="showBrandFilter && availableBrands.length > 1" class="space-y-2.5">
      <label class="block text-[10px] font-bold uppercase tracking-wider text-muted">Brand</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="brand in availableBrands"
          :key="brand"
          @click="toggleInArray('brands', brand)"
          class="px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer"
          :class="filters.brands.includes(brand) ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted hover:text-text'"
        >
          {{ brand }}
        </button>
      </div>
    </div>

    <!-- RAM -->
    <div v-if="showRamFilter && availableRamOptions.length > 0" class="space-y-2.5">
      <label class="block text-[10px] font-bold uppercase tracking-wider text-muted">RAM</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="ram in availableRamOptions"
          :key="ram"
          @click="update({ ramGb: filters.ramGb === ram ? null : ram })"
          class="px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer"
          :class="filters.ramGb === ram ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted hover:text-text'"
        >
          {{ ram }} GB
        </button>
      </div>
    </div>

    <!-- Storage -->
    <div v-if="showStorageFilter && availableStorageOptions.length > 0" class="space-y-2.5">
      <label class="block text-[10px] font-bold uppercase tracking-wider text-muted">Storage</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="bucket in availableStorageOptions"
          :key="bucket"
          @click="update({ storageGb: filters.storageGb === bucket ? null : bucket })"
          class="px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer"
          :class="filters.storageGb === bucket ? 'bg-primary border-primary text-white' : 'bg-white border-border text-muted hover:text-text'"
        >
          {{ storageLabel(bucket) }}
        </button>
      </div>
    </div>
  </aside>
</template>
