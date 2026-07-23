# TechPulse — Frontend

Vue 3 + TypeScript single-page app for **TechPulse**, an electronics e-commerce store. Customer storefront (browsing, cart, checkout, order tracking) and an admin dashboard (catalog, orders, coupons, reviews, analytics), backed by the [TechPulse backend](https://github.com/sohanfernando/mobile-store-be).

## Tech Stack

- **Vue 3** (`<script setup>`) + **TypeScript**
- **Vite** for dev server and builds
- **Tailwind CSS v4**
- **Vue Router** for client-side routing and route guards
- **Axios** for API calls
- **@stomp/stompjs** for the WebSocket connection to the admin dashboard's live order notifications
- **@stripe/stripe-js** for checkout payments
- **vee-validate** + **yup** for form validation
- **@lucide/vue** for icons

## Prerequisites

- Node.js 20+
- The [backend](https://github.com/sohanfernando/mobile-store-be) running locally on `http://localhost:8080` (the dev server proxies `/api`, `/uploads`, and `/ws` to it — see `vite.config.ts`)

## Getting Started

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

### Other scripts

```bash
npm run build     # type-checks (vue-tsc) then builds for production
npm run preview   # preview the production build locally
```

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero, featured collections, catalog with filters/search |
| `/product/:id` | Product details, color variants, reviews |
| `/cart` | Shopping cart with coupon support |
| `/checkout` | Multi-step checkout (info → shipping → Stripe payment) |
| `/customer-auth` | Customer sign in / account creation |
| `/dashboard` | Customer account — order history, invoice download |
| `/contact` | Store locator, contact form, FAQ |
| `/login` | Admin login |
| `/admin` | Admin dashboard — products, orders, reviews, customers, coupons, analytics |

Admin routes (`/admin`) require an admin JWT; the customer dashboard (`/dashboard`) requires a customer session — both are enforced by a router navigation guard.

## Project Structure

```
src/
├── views/          Route-level page components
├── components/     Reusable and admin-panel components (forms, modals, tables)
├── api/            Axios modules per backend resource (products, orders, auth, admin, ...)
├── composables/     Shared reactive logic (toasts, SEO meta, WebSocket order updates)
├── directives/      Custom Vue directives (scroll-reveal)
├── router/          Route definitions and auth guards
└── types/           Shared TypeScript types
```

## Notes

- Product images are uploaded through the backend's `FileStorageService` and served from `/uploads/**` — the dev server proxy must point at a running backend for images and API calls to resolve.
- Admin actions (product/order/coupon management) attach a JWT from `localStorage` via Axios interceptors; a `401`/`403` typically means the admin session expired or was revoked (see the backend's token revocation on logout).
