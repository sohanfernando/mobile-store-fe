<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi, type Coupon } from '../api/adminApi'
import { useToast } from '../composables/useToast'
import { Ticket, Plus, Trash2, Loader2, Percent, Coins, Calendar, Tag } from '@lucide/vue'

const { showToast } = useToast()
const coupons = ref<Coupon[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

// Form state
const showCreateForm = ref(false)
const code = ref('')
const discountType = ref<'PERCENTAGE' | 'FLAT'>('PERCENTAGE')
const discountValue = ref<number | null>(null)
const expiryDate = ref('')
const maxUses = ref<number | null>(null)
const minOrderAmount = ref<number | null>(null)
const isCreating = ref(false)

const fetchCoupons = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await adminApi.getCoupons()
    if (response.success) {
      coupons.value = response.data
    } else {
      errorMessage.value = response.message || 'Failed to fetch coupons list'
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to connect to backend server'
    showToast(errorMessage.value, 'error')
  } finally {
    isLoading.value = false
  }
}

const handleCreateCoupon = async () => {
  if (!code.value.trim()) {
    showToast('Coupon code is required', 'error')
    return
  }
  if (!discountValue.value || discountValue.value <= 0) {
    showToast('Discount value must be greater than 0', 'error')
    return
  }
  if (discountType.value === 'PERCENTAGE' && discountValue.value > 100) {
    showToast('Percentage discount cannot exceed 100%', 'error')
    return
  }
  if (!expiryDate.value) {
    showToast('Expiry date is required', 'error')
    return
  }

  isCreating.value = true
  try {
    const response = await adminApi.createCoupon({
      code: code.value.toUpperCase().trim(),
      discountType: discountType.value,
      discountValue: discountValue.value,
      expiryDate: expiryDate.value,
      maxUses: maxUses.value ?? undefined,
      minOrderAmount: minOrderAmount.value ?? undefined
    })
    if (response.success) {
      showToast('Coupon generated successfully', 'success')
      coupons.value.push(response.data)
      // Reset form
      code.value = ''
      discountValue.value = null
      expiryDate.value = ''
      maxUses.value = null
      minOrderAmount.value = null
      showCreateForm.value = false
    } else {
      showToast(response.message || 'Failed to create coupon', 'error')
    }
  } catch (error: any) {
    showToast(error.message || 'Failed to create coupon', 'error')
  } finally {
    isCreating.value = false
  }
}

const handleDeleteCoupon = async (id: number) => {
  if (!confirm('Are you sure you want to delete this coupon?')) return
  try {
    const response = await adminApi.deleteCoupon(id)
    if (response.success) {
      coupons.value = coupons.value.filter(c => c.id !== id)
      showToast('Coupon deleted successfully', 'success')
    } else {
      showToast(response.message || 'Failed to delete coupon', 'error')
    }
  } catch (error: any) {
    showToast(error.message || 'Failed to delete coupon', 'error')
  }
}

const isExpired = (expiryStr: string) => {
  const expiry = new Date(expiryStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return expiry < today
}

onMounted(() => {
  fetchCoupons()
})
</script>

<template>
  <div class="space-y-6">
    
    <!-- Title & Action -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <Ticket class="w-6 h-6 text-primary shrink-0" />
        <h2 class="text-xl font-black text-text uppercase tracking-tight">Coupons & Promotions Manager</h2>
      </div>

      <button
        @click="showCreateForm = !showCreateForm"
        class="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-primary/10 active:scale-[0.98]"
      >
        <Plus class="w-4 h-4" />
        <span>{{ showCreateForm ? 'Close Editor' : 'Generate Coupon' }}</span>
      </button>
    </div>

    <!-- Create Coupon Form -->
    <div v-if="showCreateForm" class="bg-surface border border-border p-6 rounded-3xl max-w-xl shadow-inner space-y-4">
      <h3 class="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
        <Tag class="w-4 h-4 text-primary" /> New Promo Configuration
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Coupon Code -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-black uppercase text-muted tracking-wider">Coupon Code</label>
          <input
            v-model="code"
            type="text"
            placeholder="e.g. WELCOME10"
            class="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary uppercase placeholder-muted/50"
          />
        </div>

        <!-- Expiry Date -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-black uppercase text-muted tracking-wider">Expiry Date</label>
          <input
            v-model="expiryDate"
            type="date"
            class="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary"
          />
        </div>

        <!-- Discount Type -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-black uppercase text-muted tracking-wider">Discount Type</label>
          <div class="flex gap-2">
            <button
              type="button"
              @click="discountType = 'PERCENTAGE'"
              class="flex-1 py-2 px-3 border text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none"
              :class="discountType === 'PERCENTAGE' 
                ? 'bg-primary border-primary text-white' 
                : 'bg-white border-border text-muted hover:text-text'"
            >
              <Percent class="w-3.5 h-3.5" />
              <span>Percentage</span>
            </button>
            <button
              type="button"
              @click="discountType = 'FLAT'"
              class="flex-1 py-2 px-3 border text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none"
              :class="discountType === 'FLAT' 
                ? 'bg-primary border-primary text-white' 
                : 'bg-white border-border text-muted hover:text-text'"
            >
              <Coins class="w-3.5 h-3.5" />
              <span>Flat Amount</span>
            </button>
          </div>
        </div>

        <!-- Discount Value -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-black uppercase text-muted tracking-wider">
            Discount Value {{ discountType === 'PERCENTAGE' ? '(%)' : '(LKR)' }}
          </label>
          <input
            v-model="discountValue"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 10"
            class="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary placeholder-muted/50"
          />
        </div>

        <!-- Max Uses -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-black uppercase text-muted tracking-wider">
            Max Uses (optional)
          </label>
          <input
            v-model.number="maxUses"
            type="number"
            min="1"
            placeholder="Unlimited"
            class="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary placeholder-muted/50"
          />
        </div>

        <!-- Min Order Amount -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-black uppercase text-muted tracking-wider">
            Min Order Amount (LKR, optional)
          </label>
          <input
            v-model.number="minOrderAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="No minimum"
            class="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary placeholder-muted/50"
          />
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <button
          @click="handleCreateCoupon"
          :disabled="isCreating"
          class="flex items-center gap-1.5 px-5 py-2.5 bg-text text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-text/95 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Loader2 v-if="isCreating" class="w-4 h-4 animate-spin" />
          <span>Save Coupon</span>
        </button>
      </div>
    </div>

    <!-- Loader -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 class="w-8 h-8 text-primary animate-spin" />
      <span class="text-xs text-muted font-bold uppercase tracking-widest">Loading coupons...</span>
    </div>

    <!-- Error message -->
    <div v-else-if="errorMessage" class="bg-error/10 border border-error/20 p-6 rounded-2xl text-error text-center text-xs font-bold uppercase tracking-wider space-y-4">
      <p>{{ errorMessage }}</p>
      <button @click="fetchCoupons" class="px-5 py-2.5 bg-error text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-error-dark transition-all cursor-pointer">Retry Loading</button>
    </div>

    <!-- Coupons Table/Grid -->
    <div v-else>
      <!-- Mobile, Tablet & 1024px Screen Card View (< 1280px) -->
      <div class="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-if="coupons.length === 0" class="col-span-full bg-white border border-border rounded-2xl p-8 text-center text-muted font-bold uppercase tracking-wider text-xs">
          No active promotions
        </div>
        <div
          v-for="coupon in coupons"
          :key="coupon.id"
          class="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:border-primary/30 transition-all"
          :class="{'opacity-75 bg-muted/[0.02]': isExpired(coupon.expiryDate)}"
        >
          <!-- Header: Code, Type & Status -->
          <div class="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <span class="font-mono font-black text-primary text-base tracking-wide block">{{ coupon.code }}</span>
              <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border border-border bg-surface rounded-md text-muted inline-block mt-1">
                {{ coupon.discountType }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="isExpired(coupon.expiryDate)" class="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-error/10 text-error border border-error/20">
                Expired
              </span>
              <span v-else class="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
                Active
              </span>
              <button
                @click="handleDeleteCoupon(coupon.id)"
                class="p-2 rounded-xl border border-border bg-white hover:bg-error/10 text-muted hover:text-error hover:border-error/20 transition-all cursor-pointer inline-flex items-center justify-center shrink-0"
                title="Delete Coupon"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Value & Usage Details -->
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-[9px] uppercase font-bold text-muted tracking-wider block">Discount Value</span>
              <span class="font-black text-sm text-text">
                {{ coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `Rs. ${coupon.discountValue.toLocaleString()}` }}
              </span>
            </div>
            <div>
              <span class="text-[9px] uppercase font-bold text-muted tracking-wider block">Usage</span>
              <span class="font-bold text-text">
                {{ coupon.usesCount }}{{ coupon.maxUses !== null ? ` / ${coupon.maxUses}` : '' }}
              </span>
              <div v-if="coupon.minOrderAmount !== null" class="text-[9px] text-muted/70 font-bold uppercase tracking-wider mt-0.5">
                Min. Rs. {{ coupon.minOrderAmount.toLocaleString() }}
              </div>
            </div>
          </div>

          <!-- Expiry Date Footer -->
          <div class="pt-3 border-t border-border/60 flex items-center gap-1.5 text-xs text-muted font-medium">
            <Calendar class="w-3.5 h-3.5 text-muted shrink-0" />
            <span>Expires on {{ new Date(coupon.expiryDate).toLocaleDateString() }}</span>
          </div>
        </div>
      </div>

      <!-- Desktop Table View (>= 1280px) -->
      <div class="hidden xl:block bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-border bg-surface text-[10px] font-black uppercase tracking-wider text-muted select-none">
                <th class="py-4 px-6">Coupon Code</th>
                <th class="py-4 px-6">Discount Type</th>
                <th class="py-4 px-6">Discount Value</th>
                <th class="py-4 px-6">Usage</th>
                <th class="py-4 px-6">Expiry Date</th>
                <th class="py-4 px-6">Status</th>
                <th class="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-border text-xs font-semibold text-text">
              <tr v-if="coupons.length === 0">
                <td colspan="7" class="py-12 text-center text-muted font-bold uppercase tracking-wider">No active promotions</td>
              </tr>

              <tr v-for="coupon in coupons" :key="coupon.id" class="hover:bg-surface/30 transition-colors" :class="{'opacity-75 bg-muted/[0.02]': isExpired(coupon.expiryDate)}">
                <!-- Code -->
                <td class="py-4 px-6 font-mono font-black text-primary text-sm tracking-wide">
                  {{ coupon.code }}
                </td>

                <!-- Discount Type -->
                <td class="py-4 px-6">
                  <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border border-border bg-white rounded-md text-muted">
                    {{ coupon.discountType }}
                  </span>
                </td>

                <!-- Discount Value -->
                <td class="py-4 px-6 font-extrabold text-text">
                  {{ coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `Rs. ${coupon.discountValue.toLocaleString()}` }}
                </td>

                <!-- Usage -->
                <td class="py-4 px-6 text-muted font-medium">
                  <span>{{ coupon.usesCount }}{{ coupon.maxUses !== null ? ` / ${coupon.maxUses}` : '' }}</span>
                  <div v-if="coupon.minOrderAmount !== null" class="text-[9px] text-muted/70 font-bold uppercase tracking-wider mt-0.5">
                    Min. Rs. {{ coupon.minOrderAmount.toLocaleString() }}
                  </div>
                </td>

                <!-- Expiry Date -->
                <td class="py-4 px-6 text-muted font-medium">
                  <div class="flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-muted" />
                    <span>{{ new Date(coupon.expiryDate).toLocaleDateString() }}</span>
                  </div>
                </td>

                <!-- Status -->
                <td class="py-4 px-6">
                  <span v-if="isExpired(coupon.expiryDate)" class="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-error/10 text-error border border-error/20">
                    Expired
                  </span>
                  <span v-else class="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
                    Active
                  </span>
                </td>

                <!-- Actions -->
                <td class="py-4 px-6 text-right">
                  <button
                    @click="handleDeleteCoupon(coupon.id)"
                    class="p-2 rounded-xl border border-border bg-white hover:bg-error/10 text-muted hover:text-error hover:border-error/20 transition-all cursor-pointer inline-flex items-center justify-center"
                    title="Delete Coupon"
                  >
                    <Trash2 class="w-4 h-4" />
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
