<script setup lang="ts">
import { ref } from 'vue'
import { MapPin, Clock, Phone } from '@lucide/vue'

const store = ref({
  name: 'TechPulse - Colombo 15',
  addressLines: ['214 Modara Street', 'Colombo 15', 'Sri Lanka'],
  openTimes: {
    weekdays: '9:00 AM - 7:30 PM',
    saturday: '9:00 AM - 6:00 PM',
    sunday: '9:00 AM - 2:00 PM'
  },
  phone: '+94 76 797 8321',
  mapEmbedUrl: 'https://maps.google.com/maps?q=214%20Modara%20Street%2C%20Colombo%2015&t=&z=16&ie=UTF8&iwloc=&output=embed'
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2 mb-2">
      <MapPin class="w-6 h-6 text-primary" />
      <h2 class="text-2xl font-black text-text tracking-tight">Store Locator</h2>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      <!-- Left side: Store details -->
      <div class="lg:col-span-5 bg-white border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
        <div>
          <h3 class="text-lg font-black text-text tracking-tight mb-5">{{ store.name }}</h3>
          
          <div class="space-y-5">
            <!-- Address -->
            <div class="flex items-start gap-3">
              <MapPin class="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div class="text-xs text-muted font-semibold leading-relaxed">
                <p v-for="(line, i) in store.addressLines" :key="i">{{ line }}</p>
              </div>
            </div>

            <!-- Open Time -->
            <div class="flex items-start gap-3">
              <Clock class="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div class="text-xs text-muted font-semibold leading-relaxed">
                <p class="font-extrabold text-text uppercase tracking-wider text-[9px] mb-1">Open Time</p>
                <p>Monday - Friday: {{ store.openTimes.weekdays }}</p>
                <p>Saturday: {{ store.openTimes.saturday }}</p>
                <p>Sunday: {{ store.openTimes.sunday }}</p>
              </div>
            </div>

            <!-- Phone -->
            <div class="flex items-start gap-3">
              <Phone class="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div class="text-xs text-muted font-semibold">
                <p class="font-extrabold text-text uppercase tracking-wider text-[9px] mb-1">Call Us on</p>
                <a :href="`tel:${store.phone}`" class="hover:text-primary transition-colors font-bold text-text">{{ store.phone }}</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Google Directions Link -->
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=214+Modara+Street,+Colombo+15"
          target="_blank"
          class="w-full py-3.5 rounded-xl bg-surface border border-border hover:border-primary/30 text-text hover:text-primary font-bold text-xs uppercase tracking-wider transition-all duration-300 text-center cursor-pointer block"
        >
          Get Directions
        </a>
      </div>

      <!-- Right side: Map embedding -->
      <div class="lg:col-span-7">
        <div class="relative bg-surface border border-border rounded-3xl overflow-hidden shadow-inner h-full min-h-[350px] w-full">
          <iframe
            :src="store.mapEmbedUrl"
            class="w-full h-full border-0 rounded-3xl min-h-[350px]"
            allowfullscreen="true"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
