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
import ShippingDeliveryView from '../views/ShippingDeliveryView.vue'
import ReturnsRefundsView from '../views/ReturnsRefundsView.vue'
import WarrantyPolicyView from '../views/WarrantyPolicyView.vue'
import FaqView from '../views/FaqView.vue'
import CategoryLandingView from '../views/CategoryLandingView.vue'
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
      path: '/faq',
      name: 'faq',
      component: FaqView,
      meta: {
        requiresAuth: false,
        seo: {
          title: 'Help & FAQ Center — TechPulse',
          description: 'Answers to common questions about ordering, shipping, returns, and warranty at TechPulse.',
          keywords: 'faq, help, techpulse support'
        } satisfies SeoOptions
      }
    },
    {
      path: '/shipping-delivery',
      name: 'shipping-delivery',
      component: ShippingDeliveryView,
      meta: {
        requiresAuth: false,
        seo: {
          title: 'Shipping & Delivery — TechPulse',
          description: 'Delivery methods, timeframes, and coverage for TechPulse orders across Sri Lanka.',
          keywords: 'shipping, delivery, techpulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/returns-refunds',
      name: 'returns-refunds',
      component: ReturnsRefundsView,
      meta: {
        requiresAuth: false,
        seo: {
          title: 'Returns & Refunds — TechPulse',
          description: 'TechPulse\'s 7-day return window, eligibility conditions, and refund process.',
          keywords: 'returns, refunds, techpulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/warranty-policy',
      name: 'warranty-policy',
      component: WarrantyPolicyView,
      meta: {
        requiresAuth: false,
        seo: {
          title: 'Warranty Policies — TechPulse',
          description: 'Manufacturer warranty coverage, exclusions, and how to make a claim at TechPulse.',
          keywords: 'warranty, techpulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/apple-store',
      name: 'apple-store',
      component: CategoryLandingView,
      meta: {
        requiresAuth: false,
        filter: { type: 'brand', value: 'Apple' },
        seo: {
          title: 'Apple Store — iPhones, Watches, AirPods & More',
          description: 'Shop the full range of genuine Apple products at TechPulse — iPhones, Apple Watches, AirPods and accessories, with warranty on every order.',
          keywords: 'apple store, iphone, apple watch, airpods, techpulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/mobile-phones',
      name: 'mobile-phones',
      component: CategoryLandingView,
      meta: {
        requiresAuth: false,
        filter: { type: 'category', value: 'Mobile Phones' },
        seo: {
          title: 'Mobile Phones — Shop Smartphones Online',
          description: 'Browse the latest smartphones from Apple, Samsung and more at TechPulse. Filter by price, storage, RAM and color — authentic products with warranty.',
          keywords: 'mobile phones, smartphones, buy phone online, techpulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/smartwatches',
      name: 'smartwatches',
      component: CategoryLandingView,
      meta: {
        requiresAuth: false,
        filter: { type: 'category', value: 'Smartwatches' },
        seo: {
          title: 'Smartwatches — Shop the Latest Wearables',
          description: 'Browse smartwatches from top brands at TechPulse. Filter by price, storage, RAM and color — authentic products with warranty.',
          keywords: 'smartwatches, wearables, techpulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/earphones-headphones',
      name: 'earphones-headphones',
      component: CategoryLandingView,
      meta: {
        requiresAuth: false,
        filter: { type: 'category', value: 'Earphones And Headphones' },
        seo: {
          title: 'Earphones & Headphones — Shop Audio Gear',
          description: 'Browse earphones and headphones from top brands at TechPulse. Filter by price, color and brand — authentic products with warranty.',
          keywords: 'earphones, headphones, audio, techpulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/power-banks',
      name: 'power-banks',
      component: CategoryLandingView,
      meta: {
        requiresAuth: false,
        filter: { type: 'category', value: 'Power Banks' },
        seo: {
          title: 'Power Banks — Shop Portable Chargers',
          description: 'Browse power banks and portable chargers at TechPulse. Filter by price, color and brand — authentic products with warranty.',
          keywords: 'power banks, portable chargers, techpulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/speakers',
      name: 'speakers',
      component: CategoryLandingView,
      meta: {
        requiresAuth: false,
        filter: { type: 'category', value: 'Speakers' },
        seo: {
          title: 'Speakers — Shop Bluetooth & Smart Speakers',
          description: 'Browse speakers at TechPulse. Filter by price, color and brand — authentic products with warranty.',
          keywords: 'speakers, bluetooth speakers, techpulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/cameras',
      name: 'cameras',
      component: CategoryLandingView,
      meta: {
        requiresAuth: false,
        filter: { type: 'category', value: 'Cameras' },
        seo: {
          title: 'Cameras — Shop Digital Cameras Online',
          description: 'Browse cameras at TechPulse. Filter by price, storage, color and brand — authentic products with warranty.',
          keywords: 'cameras, digital cameras, techpulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/home-appliances',
      name: 'home-appliances',
      component: CategoryLandingView,
      meta: {
        requiresAuth: false,
        filter: { type: 'category', value: 'Appliances' },
        seo: {
          title: 'Home Appliances — Shop Appliances Online',
          description: 'Browse home appliances at TechPulse. Filter by price, color and brand — authentic products with warranty.',
          keywords: 'home appliances, techpulse'
        } satisfies SeoOptions
      }
    },
    {
      path: '/gaming-consoles',
      name: 'gaming-consoles',
      component: CategoryLandingView,
      meta: {
        requiresAuth: false,
        filter: { type: 'category', value: 'Gaming Consoles' },
        seo: {
          title: 'Gaming Consoles — PlayStation, Xbox & More',
          description: 'Find the latest gaming consoles and accessories at TechPulse, with genuine warranty and island-wide delivery.',
          keywords: 'gaming consoles, playstation, xbox, techpulse'
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
