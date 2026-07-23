<script setup lang="ts">
import { ref } from 'vue'
import { Send, CheckCircle2, MessageSquare, AlertCircle } from '@lucide/vue'

const name = ref('')
const email = ref('')
const phone = ref('')
const inquiryType = ref('general')
const orderNumber = ref('')
const message = ref('')

const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref('')

const validateForm = () => {
  if (!name.value.trim()) return 'Name is required.'
  if (!email.value.trim() || !email.value.includes('@')) return 'Please enter a valid email address.'
  if (!phone.value.trim()) return 'Phone number is required.'
  if (!message.value.trim()) return 'Message cannot be empty.'
  return null
}

const handleSubmit = async () => {
  submitError.value = ''
  
  const errorMsg = validateForm()
  if (errorMsg) {
    submitError.value = errorMsg
    return
  }

  isSubmitting.value = true
  
  // Simulate API call
  try {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    submitSuccess.value = true
    // Reset form fields
    name.value = ''
    email.value = ''
    phone.value = ''
    inquiryType.value = 'general'
    orderNumber.value = ''
    message.value = ''
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      submitSuccess.value = false
    }, 5000)
  } catch (err) {
    submitError.value = 'Failed to send message. Please try again later.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2 mb-2">
      <MessageSquare class="w-6 h-6 text-primary" />
      <h2 class="text-2xl font-black text-text tracking-tight">Send us your message</h2>
    </div>

    <div class="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm w-full">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        
        <!-- Grid layout for smaller inputs -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Name -->
          <div class="space-y-2">
            <label for="contact-name" class="block text-[10px] font-bold uppercase tracking-wider text-muted">Name *</label>
            <input
              id="contact-name"
              v-model="name"
              type="text"
              required
              placeholder="Your full name"
              class="w-full bg-background border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs font-semibold"
            />
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label for="contact-email" class="block text-[10px] font-bold uppercase tracking-wider text-muted">Email *</label>
            <input
              id="contact-email"
              v-model="email"
              type="email"
              required
              placeholder="Your email address"
              class="w-full bg-background border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs font-semibold"
            />
          </div>

          <!-- Phone Number -->
          <div class="space-y-2">
            <label for="contact-phone" class="block text-[10px] font-bold uppercase tracking-wider text-muted">Phone Number *</label>
            <input
              id="contact-phone"
              v-model="phone"
              type="text"
              required
              placeholder="E.g., +94 77 123 4567"
              class="w-full bg-background border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs font-semibold"
            />
          </div>

          <!-- Inquiry Type -->
          <div class="space-y-2">
            <label for="contact-inquiry" class="block text-[10px] font-bold uppercase tracking-wider text-muted">Inquiry Type *</label>
            <div class="relative">
              <select
                id="contact-inquiry"
                v-model="inquiryType"
                class="w-full appearance-none bg-background border border-border rounded-xl py-3 px-4 text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs font-semibold"
              >
                <option value="general">General Inquiry</option>
                <option value="support">Order Support</option>
                <option value="warranty">Warranty & Returns</option>
                <option value="corporate">Corporate Sales</option>
              </select>
              <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                <span class="text-[10px]">▼</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Number (Optional) -->
        <div class="space-y-2">
          <label for="contact-order" class="block text-[10px] font-bold uppercase tracking-wider text-muted">Order Number (if applicable)</label>
          <input
            id="contact-order"
            v-model="orderNumber"
            type="text"
            placeholder="E.g., #ORD-12345"
            class="w-full bg-background border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs font-semibold"
          />
        </div>

        <!-- Message -->
        <div class="space-y-2">
          <label for="contact-message" class="block text-[10px] font-bold uppercase tracking-wider text-muted">Message *</label>
          <textarea
            id="contact-message"
            v-model="message"
            required
            rows="6"
            placeholder="Type your message here..."
            class="w-full bg-background border border-border rounded-xl py-3 px-4 text-text placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs font-semibold resize-none"
          ></textarea>
        </div>

        <!-- Submission Feedback -->
        <div class="space-y-4">
          <Transition name="fade">
            <div v-if="submitError" class="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle class="w-4 h-4" />
              <span>{{ submitError }}</span>
            </div>
          </Transition>

          <Transition name="fade">
            <div v-if="submitSuccess" class="p-4 bg-success/10 border border-success/20 text-success rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4" />
              <span>Your message has been sent successfully! We will get back to you shortly.</span>
            </div>
          </Transition>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span v-if="isSubmitting">Sending Message...</span>
            <span v-else>Send Message</span>
            <Send class="w-3.5 h-3.5" />
          </button>
        </div>

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
  transform: translateY(-5px);
}
</style>
