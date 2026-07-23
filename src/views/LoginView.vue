<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api/authApi'
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from '@lucide/vue'
import logoIcon from '../assets/logo-icon.png'

const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const response = await authApi.login(email.value, password.value)
    if (response.success && response.data) {
      localStorage.setItem('admin-token', response.data.token)
      localStorage.setItem('admin-email', response.data.email)
      router.push('/admin')
    } else {
      errorMessage.value = response.message || 'Login failed'
    }
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message
    } else {
      errorMessage.value = 'Invalid email or password'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden font-sans">
    <!-- Decorative background elements -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>

    <!-- Login Card -->
    <div class="w-full max-w-md bg-surface border border-border rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300 hover:border-primary/30">

      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-inner">
          <img :src="logoIcon" alt="TechPulse" class="w-10 h-10 object-contain" />
        </div>
        <h2 class="text-3xl font-extrabold text-text tracking-tight">Admin Portal</h2>
        <p class="text-muted mt-2 text-sm">Sign in to manage inventory & orders</p>
      </div>

      <!-- Error Message -->
      <Transition name="fade">
        <div v-if="errorMessage" class="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm flex items-center gap-3">
          <AlertCircle class="w-5 h-5 text-error shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>
      </Transition>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Email Address</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
              <Mail class="w-5 h-5" />
            </span>
            <input
              v-model="email"
              type="email"
              id="email"
              required
              placeholder="sohan.f@mobile-store.com"
              class="w-full bg-white border border-border rounded-xl py-3 pl-10 pr-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              :disabled="isLoading"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Password</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
              <Lock class="w-5 h-5" />
            </span>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              id="password"
              required
              placeholder="••••••••"
              class="w-full bg-white border border-border rounded-xl py-3 pl-10 pr-10 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              :disabled="isLoading"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-text transition-colors cursor-pointer focus:outline-none"
              :title="showPassword ? 'Hide password' : 'Show password'"
              tabindex="-1"
            >
              <EyeOff v-if="showPassword" class="w-5 h-5" />
              <Eye v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-3 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/30 flex items-center justify-center gap-2 text-sm mt-8 cursor-pointer"
        >
          <Loader2 v-if="isLoading" class="animate-spin h-5 w-5 text-white" />
          <span>{{ isLoading ? 'Authenticating...' : 'Sign In' }}</span>
        </button>
      </form>
    </div>
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
  transform: translateY(-10px);
}
</style>
