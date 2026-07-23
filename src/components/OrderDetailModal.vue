<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '../types/order'
import { X, Printer, Mail, MapPin, Truck, ShieldAlert, Download } from '@lucide/vue'
import logoIcon from '../assets/logo-icon.png'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const calculatedDiscount = computed(() => {
  const diff = props.order.subtotal + props.order.shippingCost - props.order.total
  return diff > 0 ? Math.round(diff * 100) / 100 : 0
})

const vatAmount = computed(() => {
  const taxableAmount = Math.max(0, props.order.total - props.order.shippingCost)
  return (taxableAmount * 15) / 115
})

const generateInvoiceHtml = (isForDownload = false) => {
  return `
    <html>
      <head>
        <title>Invoice - ${props.order.orderNumber}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #171717;
            padding: 40px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #eaeaea;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 900;
            color: #F2762A;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo img {
            height: 32px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .invoice-title p {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #6B6B68;
            font-weight: bold;
          }
          .details-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .details-section h3 {
            margin-top: 0;
            margin-bottom: 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6B6B68;
            border-bottom: 1px solid #eaeaea;
            padding-bottom: 6px;
          }
          .details-section p {
            margin: 4px 0;
            font-size: 13px;
            font-weight: 600;
          }
          .details-section .muted {
            color: #6B6B68;
            font-weight: 500;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #F8F8F7;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6B6B68;
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #eaeaea;
          }
          td {
            padding: 16px;
            font-size: 13px;
            font-weight: 600;
            border-bottom: 1px solid #eaeaea;
          }
          .text-right {
            text-align: right;
          }
          .summary-section {
            display: flex;
            justify-content: flex-end;
          }
          .summary-table {
            width: 300px;
            margin-bottom: 0;
          }
          .summary-table td {
            padding: 8px 16px;
            border-bottom: none;
          }
          .summary-table tr.total-row td {
            border-top: 2px solid #171717;
            font-size: 16px;
            font-weight: 900;
            padding-top: 16px;
          }
          .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 11px;
            color: #6B6B68;
            border-top: 1px solid #eaeaea;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <img src="${window.location.origin}${logoIcon}" alt="TechPulse" />
            <span>TechPulse</span>
          </div>
          <div class="invoice-title">
            <h1>Invoice</h1>
            <p>Order #${props.order.orderNumber}</p>
          </div>
        </div>

        <div class="details-grid">
          <div class="details-section">
            <h3>Billed To</h3>
            <p>${props.order.name}</p>
            <p class="muted">${props.order.email}</p>
            <p class="muted">${props.order.phone}</p>
          </div>
          <div class="details-section">
            <h3>Shipping Details</h3>
            <p>${props.order.address}</p>
            <p>${props.order.city}, ${props.order.postalCode}</p>
            <p>${props.order.country}</p>
            <p class="muted">Method: ${props.order.shippingMethod}</p>
          </div>
        </div>

        <div class="details-grid" style="margin-top: -20px; margin-bottom: 30px;">
          <div class="details-section">
            <h3>Invoice Date</h3>
            <p>${new Date(props.order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div class="details-section">
            <h3>Order Status</h3>
            <p>${props.order.status}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Variant</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${props.order.items.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td style="color: #6B6B68;">${item.variantColor}</td>
                <td class="text-right">Rs. ${item.unitPrice.toLocaleString()}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">Rs. ${(item.unitPrice * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-section">
          <table class="summary-table">
            <tr>
              <td class="muted">Subtotal</td>
              <td class="text-right">Rs. ${props.order.subtotal.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="muted">Shipping</td>
              <td class="text-right">Rs. ${props.order.shippingCost.toLocaleString()}</td>
            </tr>
            ${calculatedDiscount.value > 0 ? `
            <tr style="color: #10B981; font-weight: bold;">
              <td>Discount Applied</td>
              <td class="text-right">-Rs. ${calculatedDiscount.value.toLocaleString()}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="muted">VAT (15% Included)</td>
              <td class="text-right">Rs. ${vatAmount.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td class="text-right">Rs. ${props.order.total.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>Thank you for shopping with TechPulse!</p>
          <p>If you have any questions about this invoice, contact us at support@techpulse.lk</p>
        </div>

        ${!isForDownload ? `
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        <\/script>
        ` : ''}
      </body>
    </html>
  `
}

const printInvoice = () => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(generateInvoiceHtml(false))
  printWindow.document.close()
}

import { adminApi } from '../api/adminApi'

const downloadPdf = async () => {
  try {
    const blob = await adminApi.downloadOrderPdf(props.order.id)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `invoice-${props.order.orderNumber}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download invoice PDF:', error)
  }
}
</script>

<template>
  <div id="invoice-content" class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-border pb-4">
      <div class="space-y-1">
        <span class="text-[10px] font-black text-primary uppercase tracking-wider">Order Detail Invoice</span>
        <h2 class="text-lg font-black text-text uppercase">Order {{ order.orderNumber }}</h2>
      </div>
      <button 
        @click="emit('close')"
        class="no-pdf p-2 rounded-xl bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Info Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface border border-border p-6 rounded-3xl">
      <!-- Customer details -->
      <div class="space-y-3">
        <span class="text-[9px] font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
          <Mail class="w-3.5 h-3.5 text-primary" /> Customer Info
        </span>
        <div class="text-xs font-bold text-text space-y-1">
          <p class="font-extrabold text-sm">{{ order.name }}</p>
          <p class="text-muted">{{ order.email }}</p>
          <p class="text-muted">{{ order.phone }}</p>
        </div>
      </div>

      <!-- Shipping details -->
      <div class="space-y-3">
        <span class="text-[9px] font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
          <MapPin class="w-3.5 h-3.5 text-primary" /> Shipping Address
        </span>
        <div class="text-xs font-bold text-text space-y-1">
          <p>{{ order.address }}</p>
          <p>{{ order.city }}, {{ order.postalCode }}</p>
          <p>{{ order.country }}</p>
        </div>
      </div>

      <!-- Order metadata -->
      <div class="space-y-3">
        <span class="text-[9px] font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
          <Truck class="w-3.5 h-3.5 text-primary" /> Order & Shipping Info
        </span>
        <div class="text-xs font-bold text-text space-y-1.5">
          <div class="flex justify-between">
            <span class="text-muted">Date:</span>
            <span>{{ new Date(order.createdAt).toLocaleDateString() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Method:</span>
            <span class="uppercase text-[10px] tracking-wide bg-white px-2 py-0.5 rounded-md border border-border">{{ order.shippingMethod }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-muted">Status:</span>
            <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full" 
                  :class="{
                    'bg-warning/10 text-warning border border-warning/20': order.status === 'PROCESSING',
                    'bg-info/10 text-info border border-info/20': order.status === 'SHIPPED',
                    'bg-success/10 text-success border border-success/20': order.status === 'DELIVERED',
                    'bg-error/10 text-error border border-error/20': order.status === 'CANCELLED'
                  }">
              {{ order.status }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Items section -->
    <div>
      <!-- Mobile item cards (< sm) -->
      <div class="sm:hidden space-y-3">
        <div
          v-for="item in order.items"
          :key="item.id"
          class="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-2.5"
        >
          <!-- Item title, variant & total -->
          <div class="flex items-start justify-between gap-2 border-b border-border/50 pb-2">
            <div>
              <h4 class="font-extrabold text-sm text-text leading-tight">{{ item.productName }}</h4>
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted bg-surface px-2 py-0.5 rounded border border-border inline-block mt-1">
                Variant: {{ item.variantColor }}
              </span>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[9px] uppercase font-bold text-muted tracking-wider block">Amount</span>
              <span class="font-black text-sm text-primary">Rs. {{ (item.unitPrice * item.quantity).toLocaleString() }}</span>
            </div>
          </div>

          <!-- Unit price & Qty -->
          <div class="flex items-center justify-between text-xs font-semibold text-muted pt-0.5">
            <span>Unit Price: <strong class="text-text">Rs. {{ item.unitPrice.toLocaleString() }}</strong></span>
            <span>Qty: <strong class="text-text px-2 py-0.5 bg-surface border border-border rounded-md">{{ item.quantity }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Desktop Items table (>= sm) -->
      <div class="hidden sm:block border border-border rounded-3xl overflow-hidden bg-white">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface border-b border-border text-[9px] font-black uppercase tracking-wider text-muted">
                <th class="py-3 px-5">Description</th>
                <th class="py-3 px-5">Variant</th>
                <th class="py-3 px-5 text-right">Unit Price</th>
                <th class="py-3 px-5 text-center">Quantity</th>
                <th class="py-3 px-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border text-xs font-bold text-text">
              <tr v-for="item in order.items" :key="item.id">
                <td class="py-3.5 px-5">{{ item.productName }}</td>
                <td class="py-3.5 px-5 text-muted">{{ item.variantColor }}</td>
                <td class="py-3.5 px-5 text-right">Rs. {{ item.unitPrice.toLocaleString() }}</td>
                <td class="py-3.5 px-5 text-center">{{ item.quantity }}</td>
                <td class="py-3.5 px-5 text-right">Rs. {{ (item.unitPrice * item.quantity).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Instructions / Notes if any -->
    <div v-if="order.instructions" class="bg-warning/5 border border-warning/10 p-4 rounded-2xl flex gap-2.5 items-start">
      <ShieldAlert class="w-4 h-4 text-warning shrink-0 mt-0.5" />
      <div class="text-xs">
        <p class="font-extrabold text-warning uppercase text-[9px] tracking-wider mb-0.5">Customer Delivery Instructions</p>
        <p class="text-text font-medium leading-relaxed">{{ order.instructions }}</p>
      </div>
    </div>

    <!-- Bottom summary & actions -->
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-t border-border pt-6">
      
      <!-- Action buttons -->
      <div class="flex items-center gap-3 no-pdf">
        <button 
          @click="printInvoice"
          class="flex items-center justify-center truncate gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-primary/10 active:scale-[0.98]"
        >
          <Printer class="w-4 h-4" />
          <span>Print Invoice</span>
        </button>

        <button 
          @click="downloadPdf"
          class="flex items-center justify-center truncate gap-2 px-5 py-3 rounded-xl bg-surface border border-border hover:bg-border/20 text-text font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98]"
        >
          <Download class="w-4 h-4" />
          <span>Download PDF</span>
        </button>
      </div>

      <!-- Totals Summary -->
      <div class="bg-surface border border-border px-6 py-4 rounded-3xl w-full sm:w-80 space-y-2">
        <div class="flex justify-between text-xs font-bold text-muted">
          <span>Subtotal</span>
          <span class="text-text">Rs. {{ order.subtotal.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between text-xs font-bold text-muted">
          <span>Shipping Cost</span>
          <span class="text-text">Rs. {{ order.shippingCost.toLocaleString() }}</span>
        </div>
        <div v-if="calculatedDiscount > 0" class="flex justify-between text-xs font-bold text-success">
          <span>Discount Applied</span>
          <span>-Rs. {{ calculatedDiscount.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between text-[11px] font-bold text-muted">
          <span>VAT (15% Included)</span>
          <span class="text-text/80">Rs. {{ vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
        </div>
        <div class="flex justify-between text-sm font-black border-t border-border pt-2 text-text">
          <span>Total</span>
          <span class="text-primary text-base">Rs. {{ order.total.toLocaleString() }}</span>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
</style>
