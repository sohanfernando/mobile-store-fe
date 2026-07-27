<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { productApi } from '../api/productApi'
import { adminApi } from '../api/adminApi'
import type { Product, CreateProductRequest } from '../types/product'
import { X, Plus, Trash2, Loader2, AlertCircle, Bold, Italic, List, AlignLeft, AlignCenter, AlignRight, Link, Upload, ChevronDown } from '@lucide/vue'

const editor = ref<HTMLDivElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const singleImageInput = ref<HTMLInputElement | null>(null)
const variantImageInputs = ref<(HTMLInputElement | null)[]>([])

const MAX_IMAGE_BYTES = 3 * 1024 * 1024

const uploadImageFile = async (file: File): Promise<string> => {
  const response = await adminApi.uploadImage(file)
  if (!response.success) {
    throw new Error(response.message || 'Failed to upload image')
  }
  return response.data.url
}

const exec = (command: string, arg: string = '') => {
  if (editor.value) {
    editor.value.focus()
  }
  document.execCommand(command, false, arg)
  onEditorInput()
}

const onEditorInput = () => {
  if (editor.value) {
    form.value.description = editor.value.innerHTML
  }
}

const insertImageLink = () => {
  const url = prompt('Enter the image URL:')
  if (url) {
    exec('insertHTML', `<img src="${normalizeImageUrl(url)}" class="max-w-full h-auto rounded-2xl shadow-md my-4 block mx-auto" />`)
  }
}

const triggerFileUpload = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleSingleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  for (const file of Array.from(files)) {
    if (file.size > MAX_IMAGE_BYTES) {
      errorMessage.value = `"${file.name}" is too large. Please choose files under 3MB.`
      continue
    }
    try {
      singleImages.value.push(await uploadImageFile(file))
    } catch (error: any) {
      errorMessage.value = error.message || `Failed to upload "${file.name}"`
    }
  }
  input.value = ''
}

const removeSingleImage = (index: number) => {
  singleImages.value.splice(index, 1)
}

const handleVariantImageUpload = async (event: Event, variantIndex: number) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  for (const file of Array.from(files)) {
    if (file.size > MAX_IMAGE_BYTES) {
      errorMessage.value = `"${file.name}" is too large. Please choose files under 3MB.`
      continue
    }
    try {
      form.value.colorVariants[variantIndex].images.push(await uploadImageFile(file))
    } catch (error: any) {
      errorMessage.value = error.message || `Failed to upload "${file.name}"`
    }
  }
  input.value = ''
}

const removeVariantImage = (variantIndex: number, imageIndex: number) => {
  form.value.colorVariants[variantIndex].images.splice(imageIndex, 1)
}

const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    if (file.size > MAX_IMAGE_BYTES) {
      errorMessage.value = `"${file.name}" is too large. Please choose files under 3MB.`
    } else {
      try {
        const url = await uploadImageFile(file)
        exec('insertHTML', `<img src="${url}" class="max-w-full h-auto rounded-2xl shadow-md my-4 block mx-auto" />`)
      } catch (error: any) {
        errorMessage.value = error.message || `Failed to upload "${file.name}"`
      }
    }
  }
  input.value = ''
}

watch(() => editor.value, (el) => {
  if (el && props.product) {
    el.innerHTML = props.product.description || ''
  }
})

const props = defineProps<{
  product?: Product | null
}>()

const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'cancel'): void
}>()

const form = ref<CreateProductRequest>({
  name: '',
  brand: '',
  modelNumber: '',
  description: '',
  descriptionImageUrl: '',
  price: 0,
  category: 'Mobile Phones',
  ramGb: 0,
  storageGb: 0,
  warrantyPeriod: 0,
  colorVariants: [{ color: '', stockQuantity: 0, images: [] }]
})

const isLoading = ref(false)
const errorMessage = ref('')
const validationErrors = ref<Record<string, string>>({})

const storageInputValue = ref<number>(0)
const storageUnit = ref<'GB' | 'TB'>('GB')

watch([storageInputValue, storageUnit], ([val, unit]) => {
  form.value.storageGb = unit === 'TB' ? (val || 0) * 1000 : (val || 0)
})

const hasColorVariants = ref(true)
const singleStock = ref<number>(0)
const singleImages = ref<string[]>([])
const singleVariantId = ref<number | undefined>(undefined)
let isInitialLoad = true

// Which fields make sense per category - e.g. RAM/Storage don't apply to Speakers or Power Banks.
interface CategoryFieldConfig {
  showRam: boolean
  showStorage: boolean
  showWarranty: boolean
  showModelNumber: boolean
  defaultColorVariants: boolean
}

const categoryFieldConfig: Record<string, CategoryFieldConfig> = {
  'Mobile Phones':             { showRam: true,  showStorage: true,  showWarranty: true, showModelNumber: true, defaultColorVariants: true },
  'Smartwatches':               { showRam: true,  showStorage: true,  showWarranty: true, showModelNumber: true, defaultColorVariants: true },
  'Earphones And Headphones':   { showRam: false, showStorage: false, showWarranty: true, showModelNumber: true, defaultColorVariants: true },
  'Power Banks':                { showRam: false, showStorage: false, showWarranty: true, showModelNumber: true, defaultColorVariants: true },
  'Speakers':                   { showRam: false, showStorage: false, showWarranty: true, showModelNumber: true, defaultColorVariants: true },
  'Cameras':                    { showRam: false, showStorage: true,  showWarranty: true, showModelNumber: true, defaultColorVariants: true },
  'Appliances':                 { showRam: false, showStorage: false, showWarranty: true, showModelNumber: true, defaultColorVariants: true },
  'Gaming Consoles':            { showRam: true,  showStorage: true,  showWarranty: true, showModelNumber: true, defaultColorVariants: true },
}

const DEFAULT_FIELD_CONFIG: CategoryFieldConfig = {
  showRam: false, showStorage: false, showWarranty: true, showModelNumber: true, defaultColorVariants: true,
}

const activeFieldConfig = computed<CategoryFieldConfig>(
  () => categoryFieldConfig[form.value.category] ?? DEFAULT_FIELD_CONFIG
)

watch(() => form.value.category, (newCategory) => {
  if (isInitialLoad) return
  const config = categoryFieldConfig[newCategory] ?? DEFAULT_FIELD_CONFIG
  hasColorVariants.value = config.defaultColorVariants

  if (!config.showRam) {
    form.value.ramGb = 0
  }
  if (!config.showStorage) {
    form.value.storageGb = 0
    storageInputValue.value = 0
    storageUnit.value = 'GB'
  }
})

onMounted(() => {
  if (props.product) {
    form.value = {
      name: props.product.name,
      brand: props.product.brand,
      modelNumber: props.product.modelNumber || '',
      description: props.product.description || '',
      descriptionImageUrl: props.product.descriptionImageUrl || '',
      price: props.product.price,
      category: props.product.category || 'Mobile Phones',
      ramGb: props.product.ramGb || 0,
      storageGb: props.product.storageGb || 0,
      warrantyPeriod: props.product.warrantyPeriod || 0,
      colorVariants: props.product.colorVariants.map(v => ({
        id: v.id,
        color: v.color,
        stockQuantity: v.stockQuantity,
        images: [...(v.images || [])]
      }))
    }
    
    const sgb = props.product.storageGb || 0
    if (sgb >= 1000) {
      if (sgb % 1024 === 0) {
        storageInputValue.value = sgb / 1024
        storageUnit.value = 'TB'
      } else if (sgb % 1000 === 0) {
        storageInputValue.value = sgb / 1000
        storageUnit.value = 'TB'
      } else {
        storageInputValue.value = sgb
        storageUnit.value = 'GB'
      }
    } else {
      storageInputValue.value = sgb
      storageUnit.value = 'GB'
    }

    const hasVariants = props.product.colorVariants.length > 1 || 
                       (props.product.colorVariants.length === 1 && 
                        props.product.colorVariants[0].color.toLowerCase() !== 'standard' && 
                        props.product.colorVariants[0].color.toLowerCase() !== 'default');
    hasColorVariants.value = hasVariants;
    if (!hasVariants && props.product.colorVariants.length > 0) {
      singleStock.value = props.product.colorVariants[0].stockQuantity;
      singleImages.value = [...(props.product.colorVariants[0].images || [])];
      singleVariantId.value = props.product.colorVariants[0].id;
    }
  } else {
    hasColorVariants.value = (categoryFieldConfig[form.value.category] ?? DEFAULT_FIELD_CONFIG).defaultColorVariants
  }
  isInitialLoad = false
})

const validateForm = () => {
  const errors: Record<string, string> = {}
  if (!form.value.name.trim()) errors.name = 'Name is required'
  if (!form.value.brand.trim()) errors.brand = 'Brand is required'
  if (form.value.price <= 0) errors.price = 'Price must be greater than 0'
  
  if (hasColorVariants.value) {
    if (!form.value.colorVariants || form.value.colorVariants.length === 0) {
      errors.colorVariants = 'At least one color variant is required'
    } else {
      form.value.colorVariants.forEach((variant, index) => {
        if (!variant.color.trim()) {
          errors[`variant-${index}-color`] = 'Required'
        }
        if (variant.stockQuantity === null || variant.stockQuantity === undefined || variant.stockQuantity < 0) {
          errors[`variant-${index}-stockQuantity`] = 'Invalid stock'
        }
      })
    }
  } else {
    if (singleStock.value === null || singleStock.value === undefined || singleStock.value < 0) {
      errors.singleStock = 'Invalid stock'
    }
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

const getVariantError = (index: number, field: string) => {
  return validationErrors.value[`variant-${index}-${field}`]
}

const addColorVariant = () => {
  form.value.colorVariants.push({ color: '', stockQuantity: 0, images: [] })
}

const removeColorVariant = (index: number) => {
  if (form.value.colorVariants.length > 1) {
    form.value.colorVariants.splice(index, 1)
  }
}

const normalizeImageUrl = (url: string): string => {
  if (!url) return ''
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.hostname.includes('google.') && parsedUrl.pathname.includes('/imgres')) {
      const imgUrlParam = parsedUrl.searchParams.get('imgurl')
      if (imgUrlParam) {
        return decodeURIComponent(imgUrlParam)
      }
    }
  } catch (e) {
    // Return as-is if parsing fails
  }
  return url
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true
  errorMessage.value = ''

  form.value.descriptionImageUrl = normalizeImageUrl(form.value.descriptionImageUrl || '')

  if (!hasColorVariants.value) {
    form.value.colorVariants = [{
      id: singleVariantId.value,
      color: 'Standard',
      stockQuantity: singleStock.value || 0,
      images: singleImages.value
    }]
  }

  try {
    if (props.product) {
      await productApi.update(props.product.id, form.value)
    } else {
      await productApi.create(form.value)
    }
    emit('saved')
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message
    } else {
      errorMessage.value = 'Failed to save product. Please check your connection.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-border">
      <h3 class="text-xl font-bold text-text tracking-tight">
        {{ props.product ? 'Edit Product' : 'Add New Product' }}
      </h3>
      <button
        @click="emit('cancel')"
        class="text-muted hover:text-text transition-all text-sm focus:outline-none cursor-pointer"
        type="button"
      >
        <X class="w-6 h-6" />
      </button>
    </div>

    <!-- Error Banner -->
    <div v-if="errorMessage" class="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm flex items-center gap-3">
      <AlertCircle class="w-5 h-5 text-error shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Column 1 -->
        <div class="space-y-4">
          <div>
            <label for="name" class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Product Name *</label>
            <input
              v-model="form.name"
              type="text"
              id="name"
              placeholder="e.g., iPhone 15 Pro Max"
              class="w-full bg-white border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              :class="validationErrors.name ? 'border-error/50 focus:border-error' : 'border-border'"
              :disabled="isLoading"
            />
            <p v-if="validationErrors.name" class="text-xs text-error mt-1 font-medium">{{ validationErrors.name }}</p>
          </div>

          <div>
            <label for="brand" class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Brand *</label>
            <input
              v-model="form.brand"
              type="text"
              id="brand"
              placeholder="e.g., Apple"
              class="w-full bg-white border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              :class="validationErrors.brand ? 'border-error/50 focus:border-error' : 'border-border'"
              :disabled="isLoading"
            />
            <p v-if="validationErrors.brand" class="text-xs text-error mt-1 font-medium">{{ validationErrors.brand }}</p>
          </div>

          <div v-if="activeFieldConfig.showModelNumber">
            <label for="modelNumber" class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Model Number</label>
            <input
              v-model="form.modelNumber"
              type="text"
              id="modelNumber"
              placeholder="e.g., A3106"
              class="w-full bg-white border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label for="category" class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Category *</label>
            <div class="relative">
              <select
                v-model="form.category"
                id="category"
                class="appearance-none w-full bg-white border border-border rounded-xl py-3 pl-4 pr-10 text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm cursor-pointer"
                :disabled="isLoading"
              >
                <option value="Mobile Phones">Mobile Phones</option>
                <option value="Smartwatches">Smartwatches</option>
                <option value="Earphones And Headphones">Earphones & Headphones</option>
                <option value="Power Banks">Power Banks</option>
                <option value="Speakers">Speakers</option>
                <option value="Cameras">Cameras</option>
                <option value="Appliances">Appliances</option>
                <option value="Gaming Consoles">Gaming Consoles</option>
              </select>
              <ChevronDown class="w-4 h-4 text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <!-- Column 2 -->
        <div class="space-y-4">
          <div v-if="activeFieldConfig.showRam || activeFieldConfig.showStorage" class="flex gap-3">
            <div v-if="activeFieldConfig.showRam" class="w-32 sm:w-36 shrink-0">
              <label for="ramGb" class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">RAM (GB)</label>
              <input
                v-model.number="form.ramGb"
                type="number"
                id="ramGb"
                placeholder="8"
                class="w-full bg-white border border-border rounded-xl py-3 px-3.5 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                :disabled="isLoading"
              />
            </div>

            <div v-if="activeFieldConfig.showStorage" class="flex-1 min-w-0">
              <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Storage</label>
              <div class="flex gap-2">
                <input
                  v-model.number="storageInputValue"
                  type="number"
                  placeholder="256"
                  class="flex-1 min-w-0 bg-white border border-border rounded-xl py-3 px-3 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  :disabled="isLoading"
                />
                <div class="relative w-[72px] shrink-0">
                  <select
                    v-model="storageUnit"
                    class="appearance-none w-full bg-white border border-border rounded-xl py-3 pl-2.5 pr-6 text-text font-semibold focus:outline-none focus:border-primary transition-all text-xs sm:text-sm cursor-pointer"
                    :disabled="isLoading"
                  >
                    <option value="GB">GB</option>
                    <option value="TB">TB</option>
                  </select>
                  <ChevronDown class="w-3.5 h-3.5 text-muted absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <div class="flex-1 min-w-0">
              <label for="price" class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Price (Rs.) *</label>
              <input
                v-model.number="form.price"
                type="number"
                step="0.01"
                id="price"
                placeholder="380000.00"
                class="w-full bg-white border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                :class="validationErrors.price ? 'border-error/50 focus:border-error' : 'border-border'"
                :disabled="isLoading"
              />
              <p v-if="validationErrors.price" class="text-xs text-error mt-1 font-medium">{{ validationErrors.price }}</p>
            </div>

            <div v-if="activeFieldConfig.showWarranty" class="w-32 sm:w-36 shrink-0">
              <label for="warrantyPeriod" class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Warranty (mths)</label>
              <input
                v-model.number="form.warrantyPeriod"
                type="number"
                id="warrantyPeriod"
                placeholder="12"
                class="w-full bg-white border border-border rounded-xl py-3 px-3.5 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                :disabled="isLoading"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Color Variants Toggle -->
      <div class="flex items-center justify-between pt-4 border-t border-border">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted">Enable Multiple Color Variants</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="hasColorVariants" class="sr-only peer" :disabled="isLoading" />
          <div class="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      <!-- Color Variants Dynamic Section -->
      <div v-if="hasColorVariants" class="space-y-4 pt-4 border-t border-border">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-semibold uppercase tracking-wider text-muted">Color Variants *</label>
          <button
            type="button"
            @click="addColorVariant"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-primary hover:text-primary-dark hover:bg-border/50 text-xs font-semibold cursor-pointer transition-all"
            :disabled="isLoading"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Add Color Variant</span>
          </button>
        </div>

        <div v-if="validationErrors.colorVariants" class="text-xs text-error font-medium">
          {{ validationErrors.colorVariants }}
        </div>

        <div class="space-y-3">
          <div
            v-for="(variant, index) in form.colorVariants"
            :key="index"
            class="p-4 rounded-2xl bg-surface border border-border space-y-4 relative group"
          >
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
              <!-- Color Name -->
              <div class="md:col-span-5">
                <label :for="'variant-color-' + index" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Color Name *</label>
                <input
                  v-model="variant.color"
                  type="text"
                  :id="'variant-color-' + index"
                  placeholder="e.g., Space Black"
                  class="w-full bg-white border rounded-lg py-2.5 px-3 text-text placeholder-muted/60 focus:outline-none focus:border-primary transition-all text-xs"
                  :class="getVariantError(index, 'color') ? 'border-error/50 focus:border-error' : 'border-border'"
                  :disabled="isLoading"
                />
              </div>

              <!-- Stock Quantity -->
              <div class="md:col-span-5">
                <label :for="'variant-stock-' + index" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Stock Qty *</label>
                <input
                  v-model.number="variant.stockQuantity"
                  type="number"
                  :id="'variant-stock-' + index"
                  placeholder="15"
                  class="w-full bg-white border rounded-lg py-2.5 px-3 text-text placeholder-muted/60 focus:outline-none focus:border-primary transition-all text-xs"
                  :class="getVariantError(index, 'stockQuantity') ? 'border-error/50 focus:border-error' : 'border-border'"
                  :disabled="isLoading"
                />
              </div>

              <!-- Delete Button -->
              <div class="md:col-span-2 flex items-end justify-center pb-1">
                <button
                  type="button"
                  @click="removeColorVariant(index)"
                  class="p-2 rounded-lg bg-surface border border-border text-muted hover:text-error hover:border-error/20 hover:bg-error/5 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  :disabled="form.colorVariants.length <= 1 || isLoading"
                  title="Remove Color"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Images -->
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Images</label>
              <input
                type="file"
                :ref="el => variantImageInputs[index] = el as HTMLInputElement"
                accept="image/*"
                multiple
                class="hidden"
                @change="handleVariantImageUpload($event, index)"
                :disabled="isLoading"
              />
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(img, imgIndex) in variant.images"
                  :key="imgIndex"
                  class="relative w-14 h-14 rounded-lg overflow-hidden border border-border group/img"
                >
                  <img :src="img" alt="Color variant preview" class="w-full h-full object-cover" />
                  <button
                    type="button"
                    @click="removeVariantImage(index, imgIndex)"
                    class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 text-white transition-all cursor-pointer"
                    title="Remove image"
                    :disabled="isLoading"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
                <button
                  type="button"
                  @click="variantImageInputs[index]?.click()"
                  class="w-14 h-14 flex items-center justify-center rounded-lg border border-dashed border-border hover:border-primary/40 text-muted hover:text-text transition-all cursor-pointer"
                  title="Add images"
                  :disabled="isLoading"
                >
                  <Upload class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Single Stock & Image Section -->
      <div v-else class="space-y-4 pt-4 border-t border-border">
        <label class="block text-xs font-semibold uppercase tracking-wider text-muted">Product Stock & Image</label>
        <div class="p-4 rounded-2xl bg-surface border border-border grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="singleStock" class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Stock Quantity *</label>
            <input
              v-model.number="singleStock"
              type="number"
              id="singleStock"
              placeholder="e.g., 10"
              class="w-full bg-white border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary transition-all text-sm"
              :class="validationErrors.singleStock ? 'border-error/50 focus:border-error' : 'border-border'"
              :disabled="isLoading"
            />
            <p v-if="validationErrors.singleStock" class="text-xs text-error mt-1 font-medium">{{ validationErrors.singleStock }}</p>
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Product Images</label>
            <input
              type="file"
              ref="singleImageInput"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleSingleImageUpload"
              :disabled="isLoading"
            />
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(img, imgIndex) in singleImages"
                :key="imgIndex"
                class="relative w-20 h-20 rounded-xl overflow-hidden border border-border group"
              >
                <img :src="img" alt="Product image preview" class="w-full h-full object-cover" />
                <button
                  type="button"
                  @click="removeSingleImage(imgIndex)"
                  class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 text-white transition-all cursor-pointer"
                  title="Remove image"
                  :disabled="isLoading"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                @click="singleImageInput?.click()"
                class="w-20 h-20 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border hover:border-primary/40 text-muted hover:text-text transition-all cursor-pointer text-[10px] font-semibold"
                :disabled="isLoading"
              >
                <Upload class="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Rich Text Description Editor -->
      <div class="col-span-full">
        <label class="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Product Description</label>
        
        <div class="border border-border rounded-2xl bg-white overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <!-- Toolbar -->
          <div class="flex items-center gap-1.5 p-2.5 bg-surface border-b border-border flex-wrap">
            <button @click="exec('bold')" type="button" class="p-2 rounded-lg hover:bg-border text-muted hover:text-text transition-colors" title="Bold">
              <Bold class="w-4 h-4" />
            </button>
            <button @click="exec('italic')" type="button" class="p-2 rounded-lg hover:bg-border text-muted hover:text-text transition-colors" title="Italic">
              <Italic class="w-4 h-4" />
            </button>
            
            <div class="h-5 w-px bg-border mx-1"></div>

            <button @click="exec('formatBlock', '<h2>')" type="button" class="p-1 px-2 rounded-lg hover:bg-border text-muted hover:text-text font-black text-xs transition-colors" title="Heading 2">
              H2
            </button>
            <button @click="exec('formatBlock', '<h3>')" type="button" class="p-1 px-2 rounded-lg hover:bg-border text-muted hover:text-text font-bold text-xs transition-colors" title="Heading 3">
              H3
            </button>
            <button @click="exec('formatBlock', '<p>')" type="button" class="p-1 px-2 rounded-lg hover:bg-border text-muted hover:text-text font-medium text-xs transition-colors" title="Paragraph">
              P
            </button>
            <button @click="exec('insertUnorderedList')" type="button" class="p-2 rounded-lg hover:bg-border text-muted hover:text-text transition-colors" title="Bullet List">
              <List class="w-4 h-4" />
            </button>

            <div class="h-5 w-px bg-border mx-1"></div>

            <button @click="exec('justifyLeft')" type="button" class="p-2 rounded-lg hover:bg-border text-muted hover:text-text transition-colors" title="Align Left">
              <AlignLeft class="w-4 h-4" />
            </button>
            <button @click="exec('justifyCenter')" type="button" class="p-2 rounded-lg hover:bg-border text-muted hover:text-text transition-colors" title="Align Center">
              <AlignCenter class="w-4 h-4" />
            </button>
            <button @click="exec('justifyRight')" type="button" class="p-2 rounded-lg hover:bg-border text-muted hover:text-text transition-colors" title="Align Right">
              <AlignRight class="w-4 h-4" />
            </button>

            <div class="h-5 w-px bg-border mx-1"></div>

            <button @click="insertImageLink" type="button" class="p-2 rounded-lg hover:bg-border text-muted hover:text-text transition-colors flex items-center gap-1.5 text-xs font-semibold" title="Insert Image by URL">
              <Link class="w-4 h-4" />
              <span class="hidden sm:inline">Add Image URL</span>
            </button>
            
            <button @click="triggerFileUpload" type="button" class="p-2 rounded-lg hover:bg-border text-muted hover:text-text transition-colors flex items-center gap-1.5 text-xs font-semibold" title="Upload Image File">
              <Upload class="w-4 h-4" />
              <span class="hidden sm:inline">Upload Image</span>
            </button>
            <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleImageUpload" />
          </div>

          <!-- Contenteditable Area -->
          <div
            ref="editor"
            contenteditable="true"
            @input="onEditorInput"
            class="p-5 min-h-[250px] max-h-[400px] overflow-y-auto focus:outline-none prose prose-sm max-w-none text-text bg-white rich-editor text-center"
            placeholder="Write headings, paragraphs, bullet points, and add images to design your product detail view..."
          ></div>
        </div>
        <p class="text-[10px] text-muted mt-2">Design an immersive detail tab! Add rich typography, bold banners, bullet specs, and custom inline images or local graphics.</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-4 pt-4 border-t border-border">
        <button
          @click="emit('cancel')"
          type="button"
          class="px-5 py-2.5 rounded-xl border border-border text-muted hover:text-text hover:bg-surface transition-all text-sm font-semibold cursor-pointer"
          :disabled="isLoading"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 text-sm cursor-pointer"
          :disabled="isLoading"
        >
          <Loader2 v-if="isLoading" class="animate-spin h-5 w-5 text-white" />
          <span>{{ isLoading ? 'Saving...' : 'Save Product' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.rich-editor:empty:before {
  content: attr(placeholder);
  color: var(--muted, #718096);
  opacity: 0.6;
  pointer-events: none;
}
/* Style content inside the editor to preview it correctly */
.rich-editor :deep(h2) {
  font-size: 1.25rem;
  font-weight: 800;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.rich-editor :deep(h3) {
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 0.85rem;
  margin-bottom: 0.4rem;
}
.rich-editor :deep(p) {
  margin-bottom: 0.75rem;
}
.rich-editor :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
  display: inline-block;
  text-align: left;
}
.rich-editor :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 1rem;
  margin: 1rem auto;
  display: block;
}
</style>
