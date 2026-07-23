<script setup lang="ts">
import { useToast } from './composables/useToast'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from '@lucide/vue'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="relative min-h-screen bg-background text-text font-sans">
    <router-view />

    <!-- Global Toast Container -->
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl transition-all duration-300 transform"
          :class="{
            'bg-white border-success/30 text-success': toast.type === 'success',
            'bg-white border-error/30 text-error': toast.type === 'error',
            'bg-white border-warning/30 text-warning': toast.type === 'warning',
            'bg-white border-primary/30 text-primary': toast.type === 'info',
          }"
        >
          <!-- Icons -->
          <CheckCircle2 v-if="toast.type === 'success'" class="w-5 h-5 text-success shrink-0 mt-0.5" />
          <XCircle v-else-if="toast.type === 'error'" class="w-5 h-5 text-error shrink-0 mt-0.5" />
          <AlertTriangle v-else-if="toast.type === 'warning'" class="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <Info v-else class="w-5 h-5 text-primary shrink-0 mt-0.5" />

          <!-- Message -->
          <div class="flex-1 text-xs font-semibold leading-relaxed text-text">
            {{ toast.message }}
          </div>

          <!-- Close button -->
          <button
            @click="removeToast(toast.id)"
            class="p-0.5 rounded-lg hover:bg-surface text-muted hover:text-text transition-colors cursor-pointer shrink-0"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style>
/* Toast transition animations */
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
.toast-leave-active {
  position: absolute;
  right: 0;
  width: calc(100% - 32px);
}
</style>
