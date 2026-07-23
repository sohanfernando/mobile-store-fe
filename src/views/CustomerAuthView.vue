<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, CheckCircle2, AlertCircle, Loader2, Sparkles } from '@lucide/vue'
import logoIcon from '../assets/logo-icon.png'

const router = useRouter()
const email = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const newsAndOffers = ref(true)

const step = ref<'email' | 'otp'>('email') // email -> otp
const generatedOtp = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')


const handleEmailSubmit = () => {
  if (!email.value.trim()) {
    errorMessage.value = 'Please enter a valid email address'
    return
  }
  
  isLoading.value = true
  errorMessage.value = ''
  infoMessage.value = ''

  setTimeout(() => {
    // Generate a random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    generatedOtp.value = code
    isLoading.value = false
    step.value = 'otp'
    infoMessage.value = `OTP sent! Copy the verification code from the alert panel below.`
  }, 1000)
}

const handleOtpInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value

  // Only allow digits
  if (!/^\d*$/.test(value)) {
    otpDigits.value[index] = ''
    return
  }

  // Auto-focus next input
  if (value && index < 5) {
    const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement
    if (nextInput) nextInput.focus()
  }

  // Check if fully entered
  if (otpDigits.value.every(d => d !== '')) {
    verifyOtp()
  }
}

const handleKeyDown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement
    if (prevInput) {
      prevInput.focus()
      otpDigits.value[index - 1] = ''
    }
  }
}

const verifyOtp = () => {
  const enteredOtp = otpDigits.value.join('')
  isLoading.value = true
  errorMessage.value = ''

  setTimeout(() => {
    if (enteredOtp === generatedOtp.value) {
      // Login successful!
      localStorage.setItem('customer-token', 'cust-' + Math.random().toString(36).substring(2))
      localStorage.setItem('customer-email', email.value)
      
      // Initialize customer profile in localStorage if it doesn't exist
      const profilesKey = 'customer-profiles'
      const profiles = JSON.parse(localStorage.getItem(profilesKey) || '{}')
      if (!profiles[email.value]) {
        profiles[email.value] = {
          name: '',
          address: '',
          orders: []
        }
        localStorage.setItem(profilesKey, JSON.stringify(profiles))
      }

      isLoading.value = false
      router.push('/dashboard')
    } else {
      isLoading.value = false
      errorMessage.value = 'Invalid OTP. Please try again.'
      // Reset inputs
      otpDigits.value = ['', '', '', '', '', '']
      const firstInput = document.getElementById('otp-0') as HTMLInputElement
      if (firstInput) firstInput.focus()
    }
  }, 1000)
}

const resendOtp = () => {
  isLoading.value = true
  errorMessage.value = ''
  
  setTimeout(() => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    generatedOtp.value = code
    isLoading.value = false
    infoMessage.value = 'A new verification code has been generated!'
  }, 800)
}

const goBackToEmail = () => {
  step.value = 'email'
  otpDigits.value = ['', '', '', '', '', '']
  errorMessage.value = ''
  infoMessage.value = ''
}
</script>

<template>
  <div class="min-h-screen flex bg-background font-sans overflow-hidden">

    <!-- Left Authentication Panel -->
    <div class="w-full lg:w-[45%] flex flex-col justify-between p-8 sm:p-12 md:p-16 bg-surface border-r border-border z-10 relative">

      <!-- Top Branding -->
      <div>
        <div class="flex items-center gap-2 mb-2 cursor-pointer" @click="router.push('/')">
          <div class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
            <img :src="logoIcon" alt="TechPulse" class="w-5 h-5 object-contain" />
          </div>
          <span class="font-black text-xl tracking-tight text-text uppercase">TechPulse</span>
        </div>
        <p class="text-[9px] uppercase font-bold tracking-widest text-muted pl-10">Your Trusted Electronics Store</p>
      </div>

      <!-- Center Form -->
      <div class="max-w-md w-full mx-auto my-auto py-12 space-y-8">

        <div>
          <h2 class="text-3xl font-extrabold text-text tracking-tight">Sign in</h2>
          <p class="text-muted mt-2 text-sm">Sign in or create an account</p>
        </div>

        <!-- Feedback Messages -->
        <Transition name="fade">
          <div v-if="errorMessage" class="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-3">
            <AlertCircle class="w-4 h-4 text-error shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>
        </Transition>

        <Transition name="fade">
          <div v-if="infoMessage" class="p-4 rounded-xl bg-success/10 border border-success/30 text-success text-xs flex items-center gap-3">
            <CheckCircle2 class="w-4 h-4 text-success shrink-0" />
            <span>{{ infoMessage }}</span>
          </div>
        </Transition>

        <!-- Step 1: Email Form -->
        <form v-if="step === 'email'" @submit.prevent="handleEmailSubmit" class="space-y-6">
          <div class="space-y-2">
            <div class="relative flex items-center">
              <input
                v-model="email"
                type="email"
                required
                placeholder="Email"
                class="w-full bg-white border border-border rounded-xl py-3.5 pl-4 pr-12 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                :disabled="isLoading"
              />
              <button
                type="submit"
                class="absolute right-2 p-2 rounded-lg bg-primary hover:bg-primary-dark text-white transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                :disabled="isLoading"
              >
                <Loader2 v-if="isLoading" class="animate-spin w-4 h-4" />
                <ArrowRight v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <input
              v-model="newsAndOffers"
              type="checkbox"
              id="offers"
              class="w-4 h-4 rounded border-border bg-white text-primary focus:ring-primary/20 focus:ring-2 mt-0.5"
            />
            <label for="offers" class="text-xs text-muted select-none leading-relaxed">
              Email me with news and offers
            </label>
          </div>
        </form>

        <!-- Step 2: OTP Verification -->
        <div v-else class="space-y-6">
          <div class="space-y-3">
            <label class="block text-xs font-semibold uppercase tracking-wider text-muted">
              Enter 6-digit Verification Code
            </label>

            <div class="flex gap-2 justify-between">
              <input
                v-for="(_, idx) in otpDigits"
                :key="idx"
                :id="'otp-' + idx"
                v-model="otpDigits[idx]"
                type="text"
                maxLength="1"
                class="w-12 h-14 bg-white border border-border rounded-xl text-center text-xl font-bold text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                @input="handleOtpInput(idx, $event)"
                @keydown="handleKeyDown(idx, $event)"
                :disabled="isLoading"
              />
            </div>
          </div>

          <div class="flex items-center justify-between text-xs pt-2">
            <button
              @click="goBackToEmail"
              type="button"
              class="text-muted hover:text-text transition-colors cursor-pointer"
            >
              Change Email
            </button>
            <button
              @click="resendOtp"
              type="button"
              class="text-primary hover:text-primary-dark font-semibold transition-colors cursor-pointer"
              :disabled="isLoading"
            >
              Resend OTP
            </button>
          </div>
        </div>

        <!-- Simulated Device Box (Alert Box with code) -->
        <Transition name="fade">
          <div v-if="step === 'otp' && generatedOtp" class="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 shadow-inner">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
              <p class="text-[10px] font-bold uppercase tracking-wider text-primary">Simulated Email Gateway</p>
            </div>
            <p class="text-xs text-muted">
              A temporary passcode has been simulated for testing:
            </p>
            <p class="text-lg font-mono font-bold tracking-[0.25em] text-text mt-2 bg-white p-2.5 rounded-lg border border-border text-center">
              {{ generatedOtp }}
            </p>
          </div>
        </Transition>

      </div>

      <!-- Bottom Links -->
      <div class="text-center space-y-4">
        <p class="text-[10px] text-muted">
          By continuing, you agree to our
          <a href="#" class="underline hover:text-text transition-colors">Terms of service</a>
        </p>
        <a href="#" class="text-[10px] font-semibold text-muted hover:text-text transition-colors inline-block">
          Privacy policy
        </a>
      </div>

    </div>

    <!-- Right Presentation Panel (constellation/universe space) -->
    <div class="hidden lg:flex lg:w-[55%] bg-surface relative items-center justify-center p-12 select-none">

      <!-- Interactive Constellation Network Animation (CSS-based) -->
      <div class="absolute inset-0 flex items-center justify-center overflow-hidden opacity-50">
        <svg class="w-full h-full text-border" xmlns="http://www.w3.org/2000/svg">
          <!-- Constellation lines -->
          <line x1="20%" y1="30%" x2="45%" y2="25%" stroke="currentColor" stroke-width="0.75" stroke-dasharray="4 4" class="line-pulse" style="animation-delay: 0s;" />
          <line x1="45%" y1="25%" x2="70%" y2="35%" stroke="currentColor" stroke-width="0.75" class="line-pulse" style="animation-delay: 1.5s;" />
          <line x1="20%" y1="30%" x2="35%" y2="60%" stroke="currentColor" stroke-width="0.75" class="line-pulse" style="animation-delay: 2.5s;" />
          <line x1="35%" y1="60%" x2="60%" y2="70%" stroke="currentColor" stroke-width="0.75" stroke-dasharray="3 3" class="line-pulse" style="animation-delay: 0.8s;" />
          <line x1="70%" y1="35%" x2="60%" y2="70%" stroke="currentColor" stroke-width="0.75" class="line-pulse" style="animation-delay: 1.2s;" />
          <line x1="45%" y1="25%" x2="60%" y2="70%" stroke="currentColor" stroke-width="0.75" class="line-pulse" style="animation-delay: 2s;" />
          <line x1="35%" y1="60%" x2="70%" y2="35%" stroke="currentColor" stroke-width="0.75" class="line-pulse" style="animation-delay: 3s;" />

          <!-- Orbit rings -->
          <circle cx="50%" cy="50%" r="20%" fill="none" stroke="rgba(232, 85, 58, 0.12)" stroke-width="1.5" />
          <circle cx="50%" cy="50%" r="35%" fill="none" stroke="rgba(232, 85, 58, 0.08)" stroke-dasharray="5 15" stroke-width="1" class="spin-slow" />
        </svg>
      </div>

      <!-- Glowing Star Nodes -->
      <div class="absolute top-[30%] left-[20%] w-2 h-2 bg-primary rounded-full blur-[1px] glow-pulse" style="animation-delay: 0s;"></div>
      <div class="absolute top-[25%] left-[45%] w-3 h-3 bg-secondary rounded-full blur-[2px] glow-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-[35%] left-[70%] w-2.5 h-2.5 bg-primary-dark rounded-full blur-[1px] glow-pulse" style="animation-delay: 2s;"></div>
      <div class="absolute top-[60%] left-[35%] w-3 h-3 bg-primary-dark rounded-full blur-[2px] glow-pulse" style="animation-delay: 1.5s;"></div>
      <div class="absolute top-[70%] left-[60%] w-2 h-2 bg-secondary rounded-full blur-[1px] glow-pulse" style="animation-delay: 2.5s;"></div>

      <!-- Central Visual Element -->
      <div class="relative z-10 text-center max-w-sm flex flex-col items-center">
        <!-- Floating Logo Circle -->
        <div class="w-24 h-24 rounded-full bg-white border border-border flex items-center justify-center mb-6 shadow-2xl relative group hover:border-primary/30 transition-all duration-300">
          <Sparkles class="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h3 class="text-xl font-bold text-text tracking-tight">The Ultimate Tech Catalog</h3>
        <p class="text-muted text-xs mt-3 leading-relaxed">
          Access the latest electronics, specs, comparison tables, and place orders in seconds. Log in to track your premium shipments.
        </p>
      </div>

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
  transform: translateY(-8px);
}

/* Animations for space visualization */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
    box-shadow: 0 0 10px rgba(232, 85, 58, 0.4);
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
    box-shadow: 0 0 20px rgba(232, 85, 58, 0.8);
  }
}

.glow-pulse {
  animation: pulse 4s infinite ease-in-out;
}

@keyframes linePulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.7; }
}

.line-pulse {
  animation: linePulse 5s infinite ease-in-out;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin-slow {
  transform-origin: center;
  animation: spin 60s linear infinite;
}
</style>
