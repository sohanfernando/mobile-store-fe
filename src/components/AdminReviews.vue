<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { adminApi, type GlobalReview } from '../api/adminApi'
import { useToast } from '../composables/useToast'
import { Trash2, Star, MessageSquare, Loader2, Search } from '@lucide/vue'

const { showToast } = useToast()
const reviews = ref<GlobalReview[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchFilter = ref('')

const fetchReviews = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await adminApi.getAllReviews()
    if (response.success) {
      reviews.value = response.data
    } else {
      errorMessage.value = response.message || 'Failed to load reviews'
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to connect to backend server'
    showToast(errorMessage.value, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchReviews()
})

const filteredReviews = computed(() => {
  if (!searchFilter.value.trim()) return reviews.value
  const q = searchFilter.value.trim().toLowerCase()
  return reviews.value.filter(r => 
    r.authorName.toLowerCase().includes(q) ||
    (r.title && r.title.toLowerCase().includes(q)) ||
    r.text.toLowerCase().includes(q) ||
    (r.productName && r.productName.toLowerCase().includes(q)) ||
    (r.productBrand && r.productBrand.toLowerCase().includes(q))
  )
})

const isDeletingId = ref<number | null>(null)

const handleDeleteReview = async (id: number) => {
  if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return
  
  isDeletingId.value = id
  try {
    const response = await adminApi.deleteReview(id)
    if (response.success) {
      reviews.value = reviews.value.filter(r => r.id !== id)
      showToast('Review deleted successfully', 'success')
    } else {
      showToast(response.message || 'Failed to delete review', 'error')
    }
  } catch (error: any) {
    showToast(error.message || 'An error occurred while deleting the review', 'error')
  } finally {
    isDeletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    
    <!-- Title and Search bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <MessageSquare class="w-6 h-6 text-primary" />
        <h2 class="text-xl font-black text-text tracking-tight uppercase">Product Reviews Moderation</h2>
      </div>

      <!-- Search input -->
      <div class="relative w-full sm:max-w-xs flex items-center">
        <input
          v-model="searchFilter"
          type="text"
          placeholder="Search reviews..."
          class="w-full bg-white border border-border rounded-xl py-2.5 pl-3 pr-10 text-text placeholder-muted/60 focus:outline-none focus:border-primary text-xs font-semibold"
        />
        <Search class="absolute right-3 w-4 h-4 text-muted pointer-events-none" />
      </div>
    </div>

    <!-- Loader -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 class="w-8 h-8 text-primary animate-spin" />
      <span class="text-xs text-muted font-bold uppercase tracking-widest">Loading Reviews...</span>
    </div>

    <!-- Error message -->
    <div v-else-if="errorMessage" class="bg-error/10 border border-error/20 p-6 rounded-2xl text-error text-center text-xs font-bold uppercase tracking-wider space-y-4">
      <p>{{ errorMessage }}</p>
      <button @click="fetchReviews" class="px-5 py-2.5 bg-error text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-error-dark transition-all cursor-pointer">Retry Loading</button>
    </div>

    <!-- Reviews Table/Grid -->
    <div v-else>
      <!-- Mobile, Tablet & 1024px Card Layout (< 1280px) -->
      <div class="xl:hidden space-y-4">
        <div v-if="filteredReviews.length === 0" class="bg-white border border-border rounded-2xl p-8 text-center text-muted font-bold uppercase tracking-wider text-xs">
          No reviews found
        </div>
        <div
          v-for="review in filteredReviews"
          :key="review.id"
          class="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-3 hover:border-primary/30 transition-all"
        >
          <!-- Product info & Delete action -->
          <div class="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <span class="text-[9px] uppercase tracking-wider text-primary font-bold block">{{ review.productBrand }}</span>
              <h4 class="font-extrabold text-sm text-text leading-tight">{{ review.productName }}</h4>
            </div>
            <button
              @click="handleDeleteReview(review.id)"
              :disabled="isDeletingId === review.id"
              class="p-2 rounded-lg border border-error/20 bg-error/5 text-error hover:bg-error hover:text-white disabled:opacity-50 transition-all cursor-pointer shrink-0"
              title="Delete Review"
            >
              <Loader2 v-if="isDeletingId === review.id" class="w-4 h-4 animate-spin" />
              <Trash2 v-else class="w-4 h-4" />
            </button>
          </div>

          <!-- Reviewer, Rating & Date -->
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="font-extrabold text-text">{{ review.authorName }}</span>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-0.5">
                <Star
                  v-for="star in 5"
                  :key="star"
                  class="w-3.5 h-3.5"
                  :class="star <= review.rating ? 'fill-warning text-warning' : 'text-border'"
                />
              </div>
              <span class="text-[11px] text-muted font-medium">{{ new Date(review.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>

          <!-- Comment text -->
          <div class="bg-surface border border-border/50 rounded-xl p-3 space-y-1">
            <p v-if="review.title" class="font-extrabold text-text text-xs leading-tight">{{ review.title }}</p>
            <p class="text-muted text-xs font-medium leading-relaxed">{{ review.text }}</p>
          </div>
        </div>
      </div>

      <!-- Desktop Table View (>= 1280px) -->
      <div class="hidden xl:block bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-border bg-surface text-[10px] font-black uppercase tracking-wider text-muted select-none">
                <th class="py-4 px-6">Product</th>
                <th class="py-4 px-6">Reviewer</th>
                <th class="py-4 px-6">Rating</th>
                <th class="py-4 px-6">Comment</th>
                <th class="py-4 px-6">Submitted Date</th>
                <th class="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            
            <tbody class="divide-y divide-border text-xs font-semibold text-text">
              <tr v-if="filteredReviews.length === 0">
                <td colspan="6" class="py-12 text-center text-muted font-bold uppercase tracking-wider">No reviews found</td>
              </tr>
              
              <tr v-for="review in filteredReviews" :key="review.id" class="hover:bg-surface/30 transition-colors">
                <!-- Product info -->
                <td class="py-4 px-6 max-w-[180px]">
                  <div class="space-y-0.5">
                    <span class="text-[9px] uppercase tracking-wider text-primary font-bold">{{ review.productBrand }}</span>
                    <p class="font-extrabold truncate text-text">{{ review.productName }}</p>
                  </div>
                </td>

                <!-- Reviewer -->
                <td class="py-4 px-6">
                  <p class="font-extrabold">{{ review.authorName }}</p>
                </td>

                <!-- Rating -->
                <td class="py-4 px-6">
                  <div class="flex items-center gap-0.5">
                    <Star
                      v-for="star in 5"
                      :key="star"
                      class="w-3.5 h-3.5"
                      :class="star <= review.rating ? 'fill-warning text-warning' : 'text-border'"
                    />
                  </div>
                </td>

                <!-- Comment -->
                <td class="py-4 px-6 max-w-[320px]">
                  <div class="space-y-1">
                    <p v-if="review.title" class="font-extrabold text-text leading-tight">{{ review.title }}</p>
                    <p class="text-muted text-[11px] font-medium leading-relaxed max-h-16 overflow-y-auto">{{ review.text }}</p>
                  </div>
                </td>

                <!-- Submitted Date -->
                <td class="py-4 px-6 text-muted font-medium">
                  {{ new Date(review.createdAt).toLocaleDateString() }}
                </td>

                <!-- Action -->
                <td class="py-4 px-6 text-center">
                  <button
                    @click="handleDeleteReview(review.id)"
                    :disabled="isDeletingId === review.id"
                    class="p-2 rounded-lg border border-error/20 bg-error/5 text-error hover:bg-error hover:text-white disabled:opacity-50 transition-all cursor-pointer"
                    title="Delete Review"
                  >
                    <Loader2 v-if="isDeletingId === review.id" class="w-4 h-4 animate-spin" />
                    <Trash2 v-else class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
</style>
