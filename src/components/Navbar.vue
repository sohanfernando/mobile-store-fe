<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, User, ShoppingCart, Menu, X, ChevronDown } from '@lucide/vue'
import logoIcon from '../assets/logo-icon.png'

const mobileMenuOpen = ref(false)
const mobileCategoriesOpen = ref(false)

const props = defineProps<{
  isLoggedIn: boolean
  totalCartItems: number
}>()

const emit = defineEmits<{
  (e: 'toggle-cart'): void
  (e: 'toggle-filters'): void
  (e: 'select-category', val: string): void
  (e: 'select-brand', val: string): void
  (e: 'select-sort', val: string): void
  (e: 'scroll-to', val: string): void
}>()

const route = useRoute()
const router = useRouter()

const handleLogoClick = () => {
  if (route.path !== '/') {
    router.push('/')
  } else {
    emit('scroll-to', 'hero-section')
  }
}

const handleHomeClick = () => {
  if (route.path !== '/') {
    router.push('/')
  } else {
    emit('scroll-to', 'hero-section')
  }
}

const handleShopAllClick = () => {
  if (route.path !== '/') {
    router.push({ path: '/', query: { shopAll: 'true' } })
  } else {
    emit('scroll-to', 'catalog-section')
    emit('select-category', '')
    emit('select-brand', '')
  }
}

const handleSelectCategory = (categoryName: string) => {
  if (route.path !== '/') {
    router.push({ path: '/', query: { category: categoryName } })
  } else {
    emit('select-category', categoryName)
    emit('scroll-to', 'catalog-section')
  }
}

const handleSelectBrand = (brandName: string) => {
  if (route.path !== '/') {
    router.push({ path: '/', query: { brand: brandName } })
  } else {
    emit('select-brand', brandName)
    emit('scroll-to', 'catalog-section')
  }
}



const handleSearchClick = () => {
  if (route.path !== '/') {
    router.push({ path: '/', query: { search: 'true' } })
  } else {
    emit('toggle-filters')
    emit('scroll-to', 'catalog-section')
  }
}

const handleUserClick = () => {
  if (props.isLoggedIn) {
    router.push('/dashboard')
  } else {
    router.push('/customer-auth')
  }
}
</script>

<template>
  <header class="h-20 border-b border-border bg-background/95 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">

      <!-- Logo -->
      <div class="flex items-center gap-2 cursor-pointer group" @click="handleLogoClick">
        <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:border-primary/50 transition-colors">
          <img :src="logoIcon" alt="TechPulse" class="w-6 h-6 object-contain" />
        </div>
        <div>
          <span class="font-black text-lg text-text tracking-tight uppercase">TechPulse</span>
          <p class="text-[8px] uppercase tracking-wider text-muted leading-none">trusted mobile store</p>
        </div>
      </div>

      <!-- Middle navigation links -->
      <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-muted">
        <button @click="handleHomeClick" class="hover:text-text transition-colors cursor-pointer">Home</button>
        <button @click="handleShopAllClick" class="hover:text-text transition-colors cursor-pointer">Shop All</button>

        <!-- Categories with dropdown (Mega Menu) -->
        <div class="relative group/nav py-2">
          <button class="hover:text-text transition-colors cursor-pointer flex items-center gap-1">
            <span>Categories</span>
            <span class="text-[10px] opacity-60">▼</span>
          </button>
          <!-- Wrapper container to bridge hover gap -->
          <div class="absolute top-full left-1/2 transform -translate-x-[50%] pt-2 w-[92vw] max-w-190 opacity-0 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:pointer-events-auto transition-all duration-250 z-50">
            <div class="bg-background border border-border rounded-[28px] shadow-2xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">

              <!-- Column 1: Main Categories -->
              <div class="space-y-4">
                <h5 class="text-xs font-black uppercase tracking-wider text-primary">Main Categories</h5>
                <div class="flex flex-col gap-2.5 text-xs">
                  <button @click="handleSelectBrand('Apple')" class="text-left text-muted hover:text-text font-semibold transition-colors cursor-pointer">Apple Store</button>
                  <button @click="handleSelectCategory('Mobile Phones')" class="text-left text-muted hover:text-text font-semibold transition-colors cursor-pointer">Mobile Phones</button>
                  <button @click="handleSelectCategory('Smartwatches')" class="text-left text-muted hover:text-text font-semibold transition-colors cursor-pointer">Smartwatches</button>
                  <button @click="handleSelectCategory('Earphones And Headphones')" class="text-left text-muted hover:text-text font-semibold transition-colors cursor-pointer">Earphones & Headphones</button>
                  <button @click="handleSelectCategory('Power Banks')" class="text-left text-muted hover:text-text font-semibold transition-colors cursor-pointer">Power Banks</button>
                </div>
              </div>

              <!-- Column 2: Accessories -->
              <div class="space-y-4">
                <h5 class="text-xs font-black uppercase tracking-wider text-primary">Accessories</h5>
                <div class="flex flex-col gap-2.5 text-xs">
                  <button @click="handleSelectCategory('Speakers')" class="text-left text-muted hover:text-text font-semibold transition-colors cursor-pointer">Speakers</button>
                  <button @click="handleSelectCategory('Cameras')" class="text-left text-muted hover:text-text font-semibold transition-colors cursor-pointer">Cameras</button>
                </div>
              </div>

              <!-- Column 3: Appliances -->
              <div class="space-y-4">
                <h5 class="text-xs font-black uppercase tracking-wider text-primary">Appliances</h5>
                <div class="flex flex-col gap-2.5 text-xs">
                  <button @click="handleSelectCategory('Appliances')" class="text-left text-muted hover:text-text font-semibold transition-colors cursor-pointer">Home Appliances</button>
                </div>
              </div>

              <!-- Column 4: Exclusive Collections -->
              <div class="space-y-4">
                <h5 class="text-xs font-black uppercase tracking-wider text-primary">Exclusive Collections</h5>
                <div class="flex flex-col gap-2.5 text-xs">
                  <button @click="handleSelectCategory('Gaming Consoles')" class="text-left text-muted hover:text-text font-semibold transition-colors cursor-pointer">Gaming Consoles</button>
                </div>
              </div>

            </div>
          </div>
        </div>

        <RouterLink to="/contact" class="hover:text-text transition-colors cursor-pointer">Contact</RouterLink>
      </nav>

      <!-- Right Side Icons -->
      <div class="flex items-center gap-4">

        <!-- Search toggle button -->
        <button
          @click="handleSearchClick"
          class="p-2.5 rounded-xl bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer"
          title="Search & Filters"
        >
          <Search class="w-4 h-4" />
        </button>

        <!-- User profile dashboard button -->
        <button
          @click="handleUserClick"
          class="p-2.5 rounded-xl bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer flex items-center gap-1.5"
          :title="isLoggedIn ? 'Go to Dashboard' : 'Sign In'"
        >
          <User class="w-4 h-4" />
          <span v-if="isLoggedIn" class="text-xs text-primary font-bold hidden sm:inline">My Profile</span>
        </button>

        <!-- Cart button with counter badge -->
        <button
          @click="emit('toggle-cart')"
          class="p-2.5 rounded-xl bg-surface border border-border text-muted hover:text-text transition-colors relative cursor-pointer"
          title="Open Shopping Cart"
        >
          <ShoppingCart class="w-4 h-4" />
          <span
            v-if="totalCartItems > 0"
            class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-white font-black text-[10px] flex items-center justify-center border-2 border-background scale-105"
          >
            {{ totalCartItems }}
          </span>
        </button>

        <!-- Mobile menu toggle -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="p-2.5 rounded-xl bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer md:hidden"
          title="Menu"
        >
          <X v-if="mobileMenuOpen" class="w-4 h-4" />
          <Menu v-else class="w-4 h-4" />
        </button>

      </div>

    </div>

    <!-- Mobile Navigation Panel -->
    <Transition name="mobile-menu">
      <div v-if="mobileMenuOpen" class="md:hidden border-t border-border bg-background max-h-[calc(100vh-5rem)] overflow-y-auto">
        <nav class="px-6 py-4 flex flex-col gap-1 text-sm font-semibold text-muted">
          <button
            @click="handleHomeClick(); mobileMenuOpen = false"
            class="text-left py-3 hover:text-text transition-colors cursor-pointer border-b border-border/60"
          >
            Home
          </button>
          <button
            @click="handleShopAllClick(); mobileMenuOpen = false"
            class="text-left py-3 hover:text-text transition-colors cursor-pointer border-b border-border/60"
          >
            Shop All
          </button>

          <!-- Categories (collapsible) -->
          <button
            @click="mobileCategoriesOpen = !mobileCategoriesOpen"
            class="flex items-center justify-between py-3 hover:text-text transition-colors cursor-pointer border-b border-border/60"
          >
            <span>Categories</span>
            <ChevronDown class="w-4 h-4 transition-transform" :class="{ 'rotate-180': mobileCategoriesOpen }" />
          </button>
          <div v-if="mobileCategoriesOpen" class="flex flex-col gap-1 pl-4 pb-2">
            <button @click="handleSelectBrand('Apple'); mobileMenuOpen = false" class="text-left py-2 text-xs font-semibold hover:text-text transition-colors cursor-pointer">Apple Store</button>
            <button @click="handleSelectCategory('Mobile Phones'); mobileMenuOpen = false" class="text-left py-2 text-xs font-semibold hover:text-text transition-colors cursor-pointer">Mobile Phones</button>
            <button @click="handleSelectCategory('Smartwatches'); mobileMenuOpen = false" class="text-left py-2 text-xs font-semibold hover:text-text transition-colors cursor-pointer">Smartwatches</button>
            <button @click="handleSelectCategory('Earphones And Headphones'); mobileMenuOpen = false" class="text-left py-2 text-xs font-semibold hover:text-text transition-colors cursor-pointer">Earphones & Headphones</button>
            <button @click="handleSelectCategory('Power Banks'); mobileMenuOpen = false" class="text-left py-2 text-xs font-semibold hover:text-text transition-colors cursor-pointer">Power Banks</button>
            <button @click="handleSelectCategory('Speakers'); mobileMenuOpen = false" class="text-left py-2 text-xs font-semibold hover:text-text transition-colors cursor-pointer">Speakers</button>
            <button @click="handleSelectCategory('Cameras'); mobileMenuOpen = false" class="text-left py-2 text-xs font-semibold hover:text-text transition-colors cursor-pointer">Cameras</button>
            <button @click="handleSelectCategory('Appliances'); mobileMenuOpen = false" class="text-left py-2 text-xs font-semibold hover:text-text transition-colors cursor-pointer">Home Appliances</button>
            <button @click="handleSelectCategory('Gaming Consoles'); mobileMenuOpen = false" class="text-left py-2 text-xs font-semibold hover:text-text transition-colors cursor-pointer">Gaming Consoles</button>
          </div>

          <RouterLink
            to="/contact"
            @click="mobileMenuOpen = false"
            class="py-3 hover:text-text transition-colors cursor-pointer"
          >
            Contact
          </RouterLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
