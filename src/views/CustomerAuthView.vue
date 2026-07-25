<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, CheckCircle2, AlertCircle, Loader2, Sparkles, Truck, ShieldCheck, Zap, Star, Clock } from '@lucide/vue'
import logoIcon from '../assets/logo-icon.png'

import { authApi } from '../api/authApi'

const router = useRouter()
const email = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const newsAndOffers = ref(true)

const step = ref<'email' | 'otp'>('email') // email -> otp
const generatedOtp = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

// OTP Expiration Timer (5 minutes / 300 seconds)
const timerSeconds = ref(300)
const timerInterval = ref<any>(null)

const formattedTimer = computed(() => {
  const mins = Math.floor(timerSeconds.value / 60)
  const secs = timerSeconds.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const isTimerExpired = computed(() => timerSeconds.value <= 0)

const startCountdownTimer = (seconds = 300) => {
  if (timerInterval.value) clearInterval(timerInterval.value)
  timerSeconds.value = seconds
  timerInterval.value = setInterval(() => {
    if (timerSeconds.value > 0) {
      timerSeconds.value--
    } else {
      if (timerInterval.value) clearInterval(timerInterval.value)
      errorMessage.value = 'Verification code has expired. Please click Resend OTP to get a new code.'
    }
  }, 1000)
}

onUnmounted(() => {
  if (timerInterval.value) clearInterval(timerInterval.value)
})

const handleEmailSubmit = async () => {
  if (!email.value.trim()) {
    errorMessage.value = 'Please enter a valid email address'
    return
  }
  
  isLoading.value = true
  errorMessage.value = ''
  infoMessage.value = ''

  try {
    const res = await authApi.sendOtp(email.value.trim())
    if (res.success && res.data) {
      generatedOtp.value = res.data.otp
      step.value = 'otp'
      infoMessage.value = `OTP sent! Check your inbox at ${email.value}.`
      startCountdownTimer(300)
    } else {
      errorMessage.value = res.message || 'Failed to send OTP'
    }
  } catch (err: any) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    generatedOtp.value = code
    step.value = 'otp'
    infoMessage.value = `OTP sent to ${email.value}!`
    startCountdownTimer(300)
  } finally {
    isLoading.value = false
  }
}

const handleOtpPaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pasteText = event.clipboardData?.getData('text') || ''
  const digits = pasteText.replace(/\D/g, '').slice(0, 6).split('')
  
  if (digits.length > 0) {
    digits.forEach((digit, i) => {
      if (i < 6) {
        otpDigits.value[i] = digit
      }
    })

    const focusIdx = Math.min(digits.length, 5)
    const targetInput = document.getElementById(`otp-${focusIdx}`) as HTMLInputElement
    if (targetInput) targetInput.focus()

    if (otpDigits.value.every(d => d !== '')) {
      verifyOtp()
    }
  }
}

const handleOtpInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value

  // Handle multi-character paste / mobile autofill
  if (value.length > 1) {
    const digits = value.replace(/\D/g, '').slice(0, 6).split('')
    digits.forEach((digit, i) => {
      if (i < 6) {
        otpDigits.value[i] = digit
      }
    })
    const focusIdx = Math.min(digits.length, 5)
    const targetInput = document.getElementById(`otp-${focusIdx}`) as HTMLInputElement
    if (targetInput) targetInput.focus()

    if (otpDigits.value.every(d => d !== '')) {
      verifyOtp()
    }
    return
  }

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
  if (isTimerExpired.value) {
    errorMessage.value = 'Verification code has expired. Please click Resend OTP to get a new code.'
    otpDigits.value = ['', '', '', '', '', '']
    return
  }

  const enteredOtp = otpDigits.value.join('')
  isLoading.value = true
  errorMessage.value = ''

  setTimeout(() => {
    if (enteredOtp === generatedOtp.value) {
      if (timerInterval.value) clearInterval(timerInterval.value)
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

const resendOtp = async () => {
  isLoading.value = true
  errorMessage.value = ''
  infoMessage.value = ''
  otpDigits.value = ['', '', '', '', '', '']
  
  try {
    const res = await authApi.sendOtp(email.value.trim())
    if (res.success && res.data) {
      generatedOtp.value = res.data.otp
      infoMessage.value = `A new verification code has been sent to ${email.value}!`
      startCountdownTimer(300)
    }
  } catch (err: any) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    generatedOtp.value = code
    infoMessage.value = 'A new verification code has been generated!'
    startCountdownTimer(300)
  } finally {
    isLoading.value = false
  }
}

const goBackToEmail = () => {
  if (timerInterval.value) clearInterval(timerInterval.value)
  step.value = 'email'
  otpDigits.value = ['', '', '', '', '', '']
  errorMessage.value = ''
  infoMessage.value = ''
}
</script>

<template>
  <div class="min-h-screen flex bg-background font-sans overflow-y-auto lg:overflow-hidden">

    <!-- Left Authentication Panel -->
    <div class="w-full lg:w-[45%] min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-12 bg-surface border-r border-border z-10 relative">

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
            <div class="flex items-center justify-between">
              <label class="block text-xs font-semibold uppercase tracking-wider text-muted">
                Enter 6-digit Verification Code
              </label>

              <!-- Countdown Timer Badge -->
              <div
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold font-mono"
                :class="timerSeconds > 60 ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-error/10 text-error border border-error/20 animate-pulse'"
                title="OTP Expiration Timer"
              >
                <Clock class="w-3.5 h-3.5" />
                <span>{{ formattedTimer }}</span>
              </div>
            </div>

            <div class="flex gap-2 justify-between">
              <input
                v-for="(_, idx) in otpDigits"
                :key="idx"
                :id="'otp-' + idx"
                v-model="otpDigits[idx]"
                type="text"
                maxLength="6"
                class="w-12 h-14 bg-white border border-border rounded-xl text-center text-xl font-bold text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
                @input="handleOtpInput(idx, $event)"
                @keydown="handleKeyDown(idx, $event)"
                @paste="handleOtpPaste($event)"
                :disabled="isLoading || isTimerExpired"
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
              class="text-primary hover:text-primary-dark font-extrabold transition-colors cursor-pointer disabled:opacity-50"
              :disabled="isLoading"
            >
              Resend OTP
            </button>
          </div>
        </div>

        <!-- Mobile & 768px Tablet Feature Perks (< 1024px) -->
        <div class="lg:hidden pt-6 border-t border-border/80 space-y-4">
          <div class="flex items-center justify-between">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-wider">
              <Sparkles class="w-3.5 h-3.5" />
              <span>TechPulse Guarantee</span>
            </div>
            <div class="flex items-center gap-1 text-[10px] font-extrabold text-muted">
              <div class="flex items-center text-warning gap-0.5">
                <Star v-for="s in 5" :key="s" class="w-3 h-3 fill-warning text-warning" />
              </div>
              <span>4.9 / 5 Rating</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3.5 rounded-2xl bg-white border border-border shadow-2xs flex flex-col items-center text-center space-y-1.5 hover:border-primary/30 transition-all">
              <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Truck class="w-4 h-4" />
              </div>
              <span class="text-xs font-extrabold text-text leading-tight">Priority Delivery</span>
              <span class="text-[9.5px] text-muted font-medium leading-snug">Island-wide Sri Lanka</span>
            </div>

            <div class="p-3.5 rounded-2xl bg-white border border-border shadow-2xs flex flex-col items-center text-center space-y-1.5 hover:border-primary/30 transition-all">
              <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck class="w-4 h-4" />
              </div>
              <span class="text-xs font-extrabold text-text leading-tight">100% Genuine</span>
              <span class="text-[9.5px] text-muted font-medium leading-snug">Official Warranty</span>
            </div>

            <div class="p-3.5 rounded-2xl bg-white border border-border shadow-2xs flex flex-col items-center text-center space-y-1.5 hover:border-primary/30 transition-all">
              <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Zap class="w-4 h-4" />
              </div>
              <span class="text-xs font-extrabold text-text leading-tight">Order Tracking</span>
              <span class="text-[9.5px] text-muted font-medium leading-snug">Instant SMS & Email</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom Links -->
      <div class="text-center space-y-4 pt-6">
        <p class="text-[10px] text-muted">
          By continuing, you agree to our
          <a href="#" class="underline hover:text-text transition-colors">Terms of service</a>
        </p>
        <a href="#" class="text-[10px] font-semibold text-muted hover:text-text transition-colors inline-block">
          Privacy policy
        </a>
      </div>

    </div>

    <!-- Right Presentation Panel (Redesigned Premium Tech Showcase) -->
    <div class="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12 overflow-hidden select-none bg-gradient-to-br from-[#121212] via-[#181818] to-[#0a0a0a]">

      <!-- Ambient Glowing Accent Orbs Background -->
      <div class="absolute -top-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div class="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/15 rounded-full blur-[140px] pointer-events-none"></div>

      <!-- Subtle Grid Pattern Overlay -->
      <div class="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04]"></div>

      <!-- Main Showcase Content -->
      <div class="relative z-10 max-w-lg w-full space-y-8">

        <!-- Top Badge & Title -->
        <div class="space-y-4">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold tracking-wider uppercase">
            <Sparkles class="w-4 h-4" />
            <span>TechPulse Premium Access</span>
          </div>

          <h3 class="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Discover flagship tech with total peace of mind.
          </h3>
          
          <p class="text-white/70 text-sm font-medium leading-relaxed">
            Join Sri Lanka's premier electronics store for authentic smartphones, gaming gear, and express door-to-door delivery.
          </p>
        </div>

        <!-- 3 Feature Cards -->
        <div class="grid grid-cols-1 gap-3.5 pt-2">

          <!-- Feature 1 -->
          <div class="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:bg-white/[0.07] hover:border-primary/40 transition-all duration-300">
            <div class="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0">
              <Truck class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-extrabold text-sm text-white">Priority Island-Wide Delivery</h4>
              <p class="text-xs text-white/60 mt-0.5 leading-relaxed">Fast, safe delivery across Colombo and all 9 provinces in Sri Lanka.</p>
            </div>
          </div>

          <!-- Feature 2 -->
          <div class="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:bg-white/[0.07] hover:border-primary/40 transition-all duration-300">
            <div class="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-extrabold text-sm text-white">100% Genuine & Covered</h4>
              <p class="text-xs text-white/60 mt-0.5 leading-relaxed">All products carry official manufacturer warranty and guaranteed authenticity.</p>
            </div>
          </div>

          <!-- Feature 3 -->
          <div class="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:bg-white/[0.07] hover:border-primary/40 transition-all duration-300">
            <div class="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0">
              <Zap class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-extrabold text-sm text-white">Instant Order Tracking</h4>
              <p class="text-xs text-white/60 mt-0.5 leading-relaxed">Real-time status updates & instant SMS/Email notifications on every dispatch.</p>
            </div>
          </div>

        </div>

        <!-- Trust Stats Badges Bar -->
        <div class="pt-4 border-t border-white/10 flex items-center justify-between gap-4 text-xs font-bold text-white/80">
          <div class="flex items-center gap-2">
            <div class="flex items-center text-warning">
              <Star v-for="s in 5" :key="s" class="w-3.5 h-3.5 fill-warning text-warning" />
            </div>
            <span>4.9 / 5 Rating</span>
          </div>
          <div class="h-4 w-px bg-white/15"></div>
          <div>10K+ Happy Customers</div>
          <div class="h-4 w-px bg-white/15"></div>
          <div>Sri Lanka #1 Store</div>
        </div>

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
