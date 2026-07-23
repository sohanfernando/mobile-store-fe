import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import HomeView from '../views/HomeView.vue'
import CustomerAuthView from '../views/CustomerAuthView.vue'
import UserDashboardView from '../views/UserDashboardView.vue'
import ProductDetailsView from '../views/ProductDetailsView.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import ContactView from '../views/ContactView.vue'
import { useSeo, type SeoOptions } from '../composables/useSeo'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: false,
        seo: {
          title: 'TechPulse — Premium Mobile Phones & Electronics Store',
          description: 'Shop premium smartphones, smartwatches, headphones, power banks, speakers, cameras, gaming consoles and appliances at TechPulse. Authentic products, competitive prices, and warranty on every order.',
          keywords: 'mobile phones, smartphones, smartwatches, headphones, electronics store, TechPulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/customer-auth',
      name: 'customer-auth',
      component: CustomerAuthView,
      meta: {
        requiresAuth: false,
        seo: {
          title: 'Sign In or Create an Account',
          description: 'Log in or create your free TechPulse account to track orders, save your details, and enjoy a faster checkout.',
          robots: 'noindex, follow'
        } satisfies SeoOptions
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: UserDashboardView,
      meta: {
        requiresCustomerAuth: true,
        seo: {
          title: 'My Account',
          description: 'View your order history and manage your TechPulse account.',
          robots: 'noindex, nofollow'
        } satisfies SeoOptions
      }
    },
    {
      path: '/product/:id',
      name: 'product-details',
      component: ProductDetailsView,
      meta: {
        requiresAuth: false,
        seo: {
          title: 'Product Details',
          description: 'Explore detailed specs, pricing, and available colors for this device at TechPulse.'
        } satisfies SeoOptions
      }
    },
    {
      path: '/cart',
      name: 'cart',
      component: CartView,
      meta: {
        requiresAuth: false,
        seo: {
          title: 'Your Shopping Cart',
          description: 'Review the items in your TechPulse shopping cart before checkout.',
          robots: 'noindex, follow'
        } satisfies SeoOptions
      }
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutView,
      meta: {
        requiresAuth: false,
        seo: {
          title: 'Checkout',
          description: 'Securely complete your TechPulse order.',
          robots: 'noindex, nofollow'
        } satisfies SeoOptions
      }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        requiresAuth: false,
        seo: {
          title: 'Admin Login',
          robots: 'noindex, nofollow'
        } satisfies SeoOptions
      }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: {
        requiresAuth: true,
        seo: {
          title: 'Admin Dashboard',
          robots: 'noindex, nofollow'
        } satisfies SeoOptions
      }
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView,
      meta: {
        requiresAuth: false,
        seo: {
          title: 'Contact Us — TechPulse',
          description: 'Get in touch with TechPulse. Find store locations, opening hours, or send us an inquiry.',
          keywords: 'contact, techpulse, colombo 15, store locator'
        } satisfies SeoOptions
      }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const adminToken = localStorage.getItem('admin-token')
  const customerToken = localStorage.getItem('customer-token')
  const requiresAdminAuth = to.matched.some(record => record.meta.requiresAuth === true)
  const requiresCustomerAuth = to.matched.some(record => record.meta.requiresCustomerAuth === true)

  if (requiresAdminAuth && !adminToken) {
    next('/login')
  } else if (requiresCustomerAuth && !customerToken) {
    next('/customer-auth')
  } else if (to.name === 'login' && adminToken) {
    next('/admin')
  } else if (to.name === 'customer-auth' && customerToken) {
    next('/dashboard')
  } else {
    next()
  }
})

router.afterEach((to) => {
  const seo = to.meta.seo as SeoOptions | undefined
  if (seo) {
    useSeo(seo)
  }
})

export default router
