<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi } from '../api/orderApi'
import type { Order } from '../types/order'
import { useToast } from '../composables/useToast'
import { User, MapPin, Package, LogOut, Home, CheckCircle2, AlertCircle, Loader2, Download } from '@lucide/vue'
import logoIcon from '../assets/logo-icon.png'

const router = useRouter()
const { showToast } = useToast()
const email = ref('')
const name = ref('')
const address = ref('')
const orders = ref<Order[]>([])
const ordersLoading = ref(false)
const downloadingOrderId = ref<number | null>(null)

const isLoading = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')

onMounted(() => {
  const currentEmail = localStorage.getItem('customer-email')
  if (!currentEmail) {
    router.push('/customer-auth')
    return
  }
  email.value = currentEmail

  // Load customer profile data
  const profilesKey = 'customer-profiles'
  const profiles = JSON.parse(localStorage.getItem(profilesKey) || '{}')
  const profile = profiles[currentEmail] || { name: '', address: '' }

  name.value = profile.name || ''
  address.value = profile.address || ''

  fetchOrders(currentEmail)
})

const fetchOrders = async (currentEmail: string) => {
  ordersLoading.value = true
  try {
    const response = await orderApi.getByEmail(currentEmail)
    orders.value = response.success ? response.data : []
  } catch (e) {
    orders.value = []
  } finally {
    ordersLoading.value = false
  }
}

const downloadInvoice = async (order: Order) => {
  downloadingOrderId.value = order.id
  try {
    const blob = await orderApi.downloadPdf(order.id)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `invoice-${order.orderNumber}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    showToast('Failed to download invoice. Please try again.', 'error')
  } finally {
    downloadingOrderId.value = null
  }
}

const handleSaveProfile = () => {
  isLoading.value = true
  saveSuccess.value = false
  saveError.value = ''

  setTimeout(() => {
    try {
      const profilesKey = 'customer-profiles'
      const profiles = JSON.parse(localStorage.getItem(profilesKey) || '{}')
      
      if (!profiles[email.value]) {
        profiles[email.value] = {}
      }

      profiles[email.value].name = name.value
      profiles[email.value].address = address.value

      localStorage.setItem(profilesKey, JSON.stringify(profiles))
      
      saveSuccess.value = true
      isLoading.value = false
      
      // Auto-hide success checkmark after 3 seconds
      setTimeout(() => {
        saveSuccess.value = false
      }, 3000)
    } catch (e) {
      isLoading.value = false
      saveError.value = 'Failed to save changes. Please try again.'
    }
  }, 800)
}

const handleSignOut = () => {
  localStorage.removeItem('customer-token')
  localStorage.removeItem('customer-email')
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-background text-text font-sans pb-12 relative overflow-hidden">
    <!-- Decorative background elements -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>

    <!-- Header Navigation -->
    <header class="h-20 border-b border-border bg-background/95 sticky top-0 z-40">
      <div class="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">

        <!-- Logo -->
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <img :src="logoIcon" alt="TechPulse" class="w-5 h-5 object-contain" />
          </div>
          <span class="font-extrabold text-base text-text tracking-tight uppercase">TechPulse</span>
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-4">
          <button
            @click="router.push('/')"
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-muted hover:text-text transition-all text-xs font-semibold cursor-pointer"
          >
            <Home class="w-4 h-4" />
            <span class="hidden sm:inline">Back to Shop</span>
          </button>

          <button
            @click="handleSignOut"
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-error/10 border border-error/20 text-error hover:text-error hover:bg-error/20 transition-all text-xs font-semibold cursor-pointer"
          >
            <LogOut class="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </header>

    <!-- Main Container -->
    <main class="max-w-6xl mx-auto px-6 mt-10 relative z-10">
      
      <!-- Greeting Header -->
      <div class="mb-10">
        <h1 class="text-3xl font-black text-text tracking-tight">
          Welcome, <span class="text-primary">{{ name || 'Customer' }}</span>
        </h1>
        <p class="text-sm text-muted mt-1">Manage your shipping details and review order history.</p>
      </div>

      <!-- Dashboard Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <!-- Left Column: Profile Card -->
        <div class="lg:col-span-5 space-y-6">
          <div class="bg-surface border border-border rounded-3xl p-6 shadow-xl">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                <User class="w-5 h-5" />
              </div>
              <h2 class="text-lg font-bold text-text tracking-tight">Profile Details</h2>
            </div>

            <!-- Profile Error -->
            <Transition name="fade">
              <div v-if="saveError" class="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
                <AlertCircle class="w-4 h-4 text-error" />
                <span>{{ saveError }}</span>
              </div>
            </Transition>

            <!-- Profile Form -->
            <form @submit.prevent="handleSaveProfile" class="space-y-5">

              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Registered Email</label>
                <div class="w-full bg-white border border-border rounded-xl py-3 px-4 text-muted text-sm font-mono select-all">
                  {{ email }}
                </div>
              </div>

              <div>
                <label for="name" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Full Name</label>
                <input
                  id="name"
                  v-model="name"
                  type="text"
                  placeholder="Enter your name"
                  class="w-full bg-white border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label for="address" class="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Shipping Address</label>
                <textarea
                  id="address"
                  v-model="address"
                  rows="4"
                  placeholder="Enter your street address, city, zip code..."
                  class="w-full bg-white border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium resize-none leading-relaxed"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                class="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer"
                :disabled="isLoading"
              >
                <Loader2 v-if="isLoading" class="animate-spin w-4 h-4 text-white" />
                <CheckCircle2 v-else-if="saveSuccess" class="w-4 h-4 text-success" />
                <span>{{ isLoading ? 'Saving Changes...' : saveSuccess ? 'Saved Successfully!' : 'Save Details' }}</span>
              </button>

            </form>
          </div>
        </div>

        <!-- Right Column: Order History -->
        <div class="lg:col-span-7 space-y-6">
          <div class="bg-surface border border-border rounded-3xl p-6 shadow-xl">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                <MapPin class="w-5 h-5" />
              </div>
              <h2 class="text-lg font-bold text-text tracking-tight">Order History</h2>
            </div>

            <!-- Loading State -->
            <div v-if="ordersLoading" class="flex items-center justify-center py-16">
              <Loader2 class="animate-spin h-8 w-8 text-primary" />
            </div>

            <!-- Empty Order State -->
            <div v-else-if="orders.length === 0" class="text-center py-16 flex flex-col items-center justify-center bg-white border border-border rounded-2xl p-8">
              <div class="w-16 h-16 rounded-2xl bg-surface border border-border text-muted flex items-center justify-center mb-4">
                <Package class="w-8 h-8" />
              </div>
              <h3 class="text-base font-bold text-text mb-1.5">No orders found</h3>
              <p class="text-muted text-xs max-w-xs mb-6">
                You haven't placed any premium orders yet. Head back to the store to browse our latest products.
              </p>
              <button
                @click="router.push('/')"
                class="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer"
              >
                Browse Products
              </button>
            </div>

            <!-- Orders List -->
            <div v-else class="space-y-4">
              <div
                v-for="order in orders"
                :key="order.id"
                class="bg-white border border-border rounded-2xl p-5 hover:border-muted/40 transition-all shadow-sm"
              >
                <!-- Order Header -->
                <div class="flex items-start justify-between border-b border-border pb-3 mb-3">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-primary">Order ID</span>
                    <h4 class="text-sm font-mono font-bold text-text">{{ order.orderNumber }}</h4>
                    <p class="text-[10px] text-muted mt-0.5">Date: {{ new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}</p>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-muted">Status</span>
                    <div class="mt-1">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-success/10 border border-success/20 text-success">
                        {{ order.status }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Products Summary -->
                <div class="space-y-2">
                  <div
                    v-for="item in order.items"
                    :key="item.id"
                    class="flex items-center justify-between text-xs py-1"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] text-muted bg-surface border border-border px-1.5 py-0.5 rounded">
                        x{{ item.quantity }}
                      </span>
                      <span class="font-bold text-text">{{ item.productName }}</span>
                      <span class="text-[9px] uppercase tracking-wider font-semibold text-muted">
                        ({{ item.variantColor }})
                      </span>
                    </div>
                    <span class="font-mono text-muted">Rs. {{ (item.unitPrice * item.quantity).toLocaleString() }}</span>
                  </div>
                </div>

                <!-- Order Footer -->
                <div class="flex items-center justify-between border-t border-border pt-3 mt-3">
                  <button
                    @click="downloadInvoice(order)"
                    :disabled="downloadingOrderId === order.id"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-muted/40 text-muted hover:text-text text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Loader2 v-if="downloadingOrderId === order.id" class="w-3.5 h-3.5 animate-spin" />
                    <Download v-else class="w-3.5 h-3.5" />
                    <span>Invoice</span>
                  </button>
                  <div class="text-sm font-bold text-text text-right">
                    <span class="text-muted text-xs font-semibold block">Total Paid</span>
                    <span class="text-primary">Rs. {{ order.total.toLocaleString() }}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>

    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
