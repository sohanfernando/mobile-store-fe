<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { adminApi, type CustomerProfile } from '../api/adminApi'
import { useToast } from '../composables/useToast'
import { Users, Search, Loader2, Mail, Phone, MapPin, Calendar, ShoppingBag, Shield, ShieldAlert } from '@lucide/vue'

const { showToast } = useToast()
const customers = ref<CustomerProfile[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchFilter = ref('')

const fetchCustomers = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await adminApi.getAllCustomers()
    if (response.success) {
      customers.value = response.data
    } else {
      errorMessage.value = response.message || 'Failed to load customers list'
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to connect to backend server'
    showToast(errorMessage.value, 'error')
  } finally {
    isLoading.value = false
  }
}

const toggleStatus = async (customer: CustomerProfile) => {
  try {
    const response = await adminApi.toggleCustomerStatus(customer.id)
    if (response.success) {
      customer.active = response.data.active
      showToast(`Customer account ${customer.active ? 'activated' : 'suspended'} successfully`, 'success')
    } else {
      showToast(response.message || 'Failed to update status', 'error')
    }
  } catch (error: any) {
    showToast(error.message || 'Failed to toggle status', 'error')
  }
}

onMounted(() => {
  fetchCustomers()
})

const filteredCustomers = computed(() => {
  if (!searchFilter.value.trim()) return customers.value
  const q = searchFilter.value.trim().toLowerCase()
  return customers.value.filter(c => 
    (c.name && c.name.toLowerCase().includes(q)) ||
    c.email.toLowerCase().includes(q) ||
    (c.phone && c.phone.toLowerCase().includes(q)) ||
    (c.city && c.city.toLowerCase().includes(q)) ||
    (c.country && c.country.toLowerCase().includes(q))
  )
})
</script>

<template>
  <div class="space-y-6">
    
    <!-- Title and Search bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <Users class="w-6 h-6 text-primary" />
        <h2 class="text-xl font-black text-text tracking-tight uppercase">Registered Customers Registry</h2>
      </div>

      <!-- Search input -->
      <div class="relative w-full sm:max-w-xs flex items-center">
        <input
          v-model="searchFilter"
          type="text"
          placeholder="Search customers..."
          class="w-full bg-white border border-border rounded-xl py-2.5 pl-3 pr-10 text-text placeholder-muted/60 focus:outline-none focus:border-primary text-xs font-semibold"
        />
        <Search class="absolute right-3 w-4 h-4 text-muted pointer-events-none" />
      </div>
    </div>

    <!-- Loader -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 class="w-8 h-8 text-primary animate-spin" />
      <span class="text-xs text-muted font-bold uppercase tracking-widest">Loading Customers Registry...</span>
    </div>

    <!-- Error message -->
    <div v-else-if="errorMessage" class="bg-error/10 border border-error/20 p-6 rounded-2xl text-error text-center text-xs font-bold uppercase tracking-wider space-y-4">
      <p>{{ errorMessage }}</p>
      <button @click="fetchCustomers" class="px-5 py-2.5 bg-error text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-error-dark transition-all cursor-pointer">Retry Loading</button>
    </div>

    <!-- Customers Table/Grid -->
    <div v-else>
      <!-- Mobile, Tablet & 1024px Screen Card View (< 1280px) -->
      <div class="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-if="filteredCustomers.length === 0" class="col-span-full bg-white border border-border rounded-2xl p-8 text-center text-muted font-bold uppercase tracking-wider text-xs">
          No customers registered
        </div>
        <div
          v-for="customer in filteredCustomers"
          :key="customer.id"
          class="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:border-primary/30 transition-all"
          :class="{'opacity-75 bg-error/[0.01]': !customer.active}"
        >
          <!-- Customer Avatar & Status header -->
          <div class="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-extrabold uppercase text-sm border shrink-0"
                :class="customer.active ? 'bg-primary/15 border-primary/20 text-primary' : 'bg-muted/15 border-muted/20 text-muted'"
              >
                {{ customer.name ? customer.name.charAt(0) : 'U' }}
              </div>
              <div class="min-w-0">
                <h4 class="font-extrabold text-sm text-text leading-tight truncate">{{ customer.name || 'User #' + customer.id }}</h4>
                <p class="text-[9px] uppercase tracking-wider text-muted font-bold">ID: {{ customer.id }}</p>
              </div>
            </div>
            <button
              @click="toggleStatus(customer)"
              class="px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer select-none shrink-0"
              :class="customer.active 
                ? 'bg-error/10 hover:bg-error border-error/20 hover:border-error text-error hover:text-white' 
                : 'bg-success/10 hover:bg-success border-success/20 hover:border-success text-success hover:text-white'"
            >
              {{ customer.active ? 'Suspend' : 'Activate' }}
            </button>
          </div>

          <!-- Contact & Info Grid -->
          <div class="space-y-2 text-xs">
            <div class="flex items-center gap-2 text-muted">
              <Mail class="w-3.5 h-3.5 text-primary shrink-0" />
              <a :href="`mailto:${customer.email}`" class="truncate hover:text-text font-semibold">{{ customer.email }}</a>
            </div>
            <div v-if="customer.phone" class="flex items-center gap-2 text-muted">
              <Phone class="w-3.5 h-3.5 text-primary shrink-0" />
              <a :href="`tel:${customer.phone}`" class="font-semibold hover:text-text">{{ customer.phone }}</a>
            </div>
            <div class="flex items-center gap-2 text-muted font-medium">
              <MapPin class="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{{ customer.city || 'N/A' }}, {{ customer.country || 'Sri Lanka' }}</span>
            </div>
          </div>

          <!-- Footer stats & Status -->
          <div class="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
            <div class="flex items-center gap-3">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border rounded-lg text-text font-extrabold text-xs">
                <ShoppingBag class="w-3.5 h-3.5 text-primary" />
                <span>{{ customer.orderCount || 0 }} orders</span>
              </div>
            </div>
            <span
              class="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 border"
              :class="customer.active ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'"
            >
              <component :is="customer.active ? Shield : ShieldAlert" class="w-3 h-3" />
              {{ customer.active ? 'Active' : 'Suspended' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Desktop Table View (>= 1280px) -->
      <div class="hidden xl:block bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-border bg-surface text-[10px] font-black uppercase tracking-wider text-muted select-none">
                <th class="py-4 px-6">Customer</th>
                <th class="py-4 px-6">Contact Info</th>
                <th class="py-4 px-6">Location</th>
                <th class="py-4 px-6 text-center">Orders</th>
                <th class="py-4 px-6">Joined Date</th>
                <th class="py-4 px-6 text-center">Status</th>
                <th class="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody class="divide-y divide-border text-xs font-semibold text-text">
              <tr v-if="filteredCustomers.length === 0">
                <td colspan="7" class="py-12 text-center text-muted font-bold uppercase tracking-wider">No customers registered</td>
              </tr>
              
              <tr v-for="customer in filteredCustomers" :key="customer.id" class="hover:bg-surface/30 transition-colors" :class="{'opacity-75 bg-error/[0.01]': !customer.active}">
                <!-- Name -->
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center font-extrabold uppercase text-xs border"
                         :class="customer.active ? 'bg-primary/15 border-primary/20 text-primary' : 'bg-muted/15 border-muted/20 text-muted'">
                      {{ customer.name ? customer.name.charAt(0) : 'U' }}
                    </div>
                    <div>
                      <p class="font-extrabold text-text">{{ customer.name || 'User #' + customer.id }}</p>
                      <p class="text-[9px] uppercase tracking-wider text-muted font-bold">ID: {{ customer.id }}</p>
                    </div>
                  </div>
                </td>

                <!-- Contact Info -->
                <td class="py-4 px-6">
                  <div class="space-y-1">
                    <div class="flex items-center gap-1.5 text-muted hover:text-text transition-colors">
                      <Mail class="w-3.5 h-3.5 text-muted" />
                      <a :href="`mailto:${customer.email}`">{{ customer.email }}</a>
                    </div>
                    <div v-if="customer.phone" class="flex items-center gap-1.5 text-muted hover:text-text transition-colors">
                      <Phone class="w-3.5 h-3.5 text-muted" />
                      <a :href="`tel:${customer.phone}`">{{ customer.phone }}</a>
                    </div>
                  </div>
                </td>

                <!-- Location -->
                <td class="py-4 px-6 text-muted font-medium">
                  <div class="flex items-center gap-1.5">
                    <MapPin class="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{{ customer.city || 'N/A' }}, {{ customer.country || 'Sri Lanka' }}</span>
                  </div>
                </td>

                <!-- Total Orders -->
                <td class="py-4 px-6 text-center text-text font-black">
                  <div class="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-border rounded-lg shadow-sm">
                    <ShoppingBag class="w-3.5 h-3.5 text-primary" />
                    <span>{{ customer.orderCount || 0 }}</span>
                  </div>
                </td>

                <!-- Joined Date -->
                <td class="py-4 px-6 text-muted font-medium">
                  <div class="flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-muted" />
                    <span>{{ new Date(customer.createdAt).toLocaleDateString() }}</span>
                  </div>
                </td>

                <!-- Status badge -->
                <td class="py-4 px-6">
                  <span class="text-[9px] font-extrabold uppercase px-2.5 py-1.5 rounded-full flex items-center justify-center w-24 gap-1 border"
                        :class="customer.active ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'">
                    <component :is="customer.active ? Shield : ShieldAlert" class="w-3 h-3" />
                    {{ customer.active ? 'Active' : 'Suspended' }}
                  </span>
                </td>

                <!-- Actions Toggle status -->
                <td class="py-4 px-6 text-right">
                  <button
                    @click="toggleStatus(customer)"
                    class="px-3.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer select-none"
                    :class="customer.active 
                      ? 'bg-error/10 hover:bg-error border-error/20 hover:border-error text-error hover:text-white' 
                      : 'bg-success/10 hover:bg-success border-success/20 hover:border-success text-success hover:text-white'"
                  >
                    {{ customer.active ? 'Suspend' : 'Activate' }}
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
