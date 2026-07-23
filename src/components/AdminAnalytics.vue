<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { adminApi, type AdminAnalytics } from '../api/adminApi'
import { useToast } from '../composables/useToast'
import { DollarSign, ShoppingBag, AlertTriangle, Users, Loader2 } from '@lucide/vue'

const { showToast } = useToast()
const analyticsData = ref<AdminAnalytics | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const fetchAnalytics = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await adminApi.getAnalytics()
    if (response.success) {
      analyticsData.value = response.data
    } else {
      errorMessage.value = response.message || 'Failed to load analytics data'
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to connect to backend server'
    showToast(errorMessage.value, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAnalytics()
})

// Line Chart Calculations (Sales Trend)
const lineChartWidth = 600
const lineChartHeight = 250
const padding = { top: 20, right: 30, bottom: 40, left: 70 }

const trendPoints = computed(() => {
  if (!analyticsData.value || !analyticsData.value.salesTrend || analyticsData.value.salesTrend.length === 0) return []
  const data = analyticsData.value.salesTrend
  const maxVal = Math.max(...data.map(d => d.revenue), 100000)
  
  const chartInnerWidth = lineChartWidth - padding.left - padding.right
  const chartInnerHeight = lineChartHeight - padding.top - padding.bottom

  return data.map((d, index) => {
    const x = padding.left + (index * (chartInnerWidth / (data.length - 1)))
    // Invert Y because SVG coordinates start from top-left
    const y = padding.top + chartInnerHeight - ((d.revenue / maxVal) * chartInnerHeight)
    return { x, y, label: d.month, val: d.revenue }
  })
})

const linePath = computed(() => {
  const points = trendPoints.value
  if (points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
})

const areaPath = computed(() => {
  const points = trendPoints.value
  if (points.length === 0) return ''
  const startX = points[0].x
  const endX = points[points.length - 1].x
  const bottomY = lineChartHeight - padding.bottom
  const lineSegment = points.map(p => `L ${p.x} ${p.y}`).join(' ')
  return `M ${startX} ${bottomY} ${lineSegment} L ${endX} ${bottomY} Z`
})

const trendMaxValLabel = computed(() => {
  if (!analyticsData.value || !analyticsData.value.salesTrend) return 'Rs. 100,000'
  const max = Math.max(...analyticsData.value.salesTrend.map(d => d.revenue), 100000)
  return `Rs. ${max.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
})

// Donut Chart Calculations (Category Share)
const categoryColors = ['#F2762A', '#171717', '#3F8E5C', '#C9883A', '#C7402E', '#6B6B68']
const donutRadius = 70
const circumference = 2 * Math.PI * donutRadius // ~439.82

const categoryShares = computed(() => {
  if (!analyticsData.value || !analyticsData.value.categoryShare || analyticsData.value.categoryShare.length === 0) return []
  const data = analyticsData.value.categoryShare
  const total = data.reduce((sum, d) => sum + d.revenue, 0)
  
  let accumulatedPercent = 0
  return data.map((d, index) => {
    const percentage = total > 0 ? (d.revenue / total) : 0
    const strokeDasharray = `${percentage * circumference} ${circumference}`
    // Stroke-dashoffset starts from 0 (top of the donut) and rotates clockwise
    const strokeDashoffset = -accumulatedPercent * circumference
    accumulatedPercent += percentage

    return {
      name: d.category,
      revenue: d.revenue,
      percentage: percentage * 100,
      color: categoryColors[index % categoryColors.length],
      dasharray: strokeDasharray,
      dashoffset: strokeDashoffset
    }
  })
})
</script>

<template>
  <div class="space-y-8">
    
    <!-- Loader -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 class="w-8 h-8 text-primary animate-spin" />
      <span class="text-xs text-muted font-bold uppercase tracking-widest">Loading Dashboard Analytics...</span>
    </div>

    <!-- Error message -->
    <div v-else-if="errorMessage" class="bg-error/10 border border-error/20 p-6 rounded-2xl text-error text-center text-xs font-bold uppercase tracking-wider space-y-4">
      <p>{{ errorMessage }}</p>
      <button @click="fetchAnalytics" class="px-5 py-2.5 bg-error text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-error-dark transition-all cursor-pointer">Retry Loading</button>
    </div>

    <template v-else>
      <!-- KPI Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        
        <!-- Total Revenue -->
        <div class="bg-white border border-border p-6 rounded-3xl flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <DollarSign class="w-6 h-6" />
          </div>
          <div>
            <span class="text-[9px] font-black uppercase tracking-wider text-muted">Total Revenue</span>
            <h3 class="text-lg font-black text-text mt-0.5">Rs. {{ analyticsData?.totalRevenue.toLocaleString() }}</h3>
          </div>
        </div>

        <!-- Total Orders -->
        <div class="bg-white border border-border p-6 rounded-3xl flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center shrink-0">
            <ShoppingBag class="w-6 h-6" />
          </div>
          <div>
            <span class="text-[9px] font-black uppercase tracking-wider text-muted">Total Orders</span>
            <h3 class="text-lg font-black text-text mt-0.5">{{ analyticsData?.totalOrders }} Orders</h3>
          </div>
        </div>

        <!-- Low Stock Alerts -->
        <div class="bg-white border border-border p-6 rounded-3xl flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-2xl bg-error/10 border border-error/20 text-error flex items-center justify-center shrink-0">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <div>
            <span class="text-[9px] font-black uppercase tracking-wider text-muted">Low Stock Items</span>
            <h3 class="text-lg font-black text-text mt-0.5">{{ analyticsData?.lowStockCount }} Variants</h3>
          </div>
        </div>

        <!-- Total Customers -->
        <div class="bg-white border border-border p-6 rounded-3xl flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-2xl bg-success/10 border border-success/20 text-success flex items-center justify-center shrink-0">
            <Users class="w-6 h-6" />
          </div>
          <div>
            <span class="text-[9px] font-black uppercase tracking-wider text-muted">Total Customers</span>
            <h3 class="text-lg font-black text-text mt-0.5">{{ analyticsData?.totalCustomers }} Registered</h3>
          </div>
        </div>

      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        <!-- Sales Trend Line Chart (Left) -->
        <div class="xl:col-span-7 bg-white border border-border p-6 rounded-3xl shadow-sm space-y-6 w-full">
          <div>
            <h4 class="text-sm font-black text-text tracking-tight uppercase">Monthly Sales Revenue</h4>
            <p class="text-[10px] text-muted font-bold mt-0.5">Sales trends calculated over the last 6 months</p>
          </div>

          <!-- Line chart SVG -->
          <div class="relative w-full overflow-x-auto pb-2">
            <svg :viewBox="`0 0 ${lineChartWidth} ${lineChartHeight}`" class="w-full min-w-[500px] h-auto overflow-visible select-none">
              
              <!-- Grid lines -->
              <line
                :x1="padding.left"
                :y1="padding.top"
                :x2="lineChartWidth - padding.right"
                :y2="padding.top"
                stroke="var(--color-border)"
                stroke-dasharray="4 4"
              />
              <line
                :x1="padding.left"
                :y1="(padding.top + lineChartHeight - padding.bottom) / 2"
                :x2="lineChartWidth - padding.right"
                :y2="(padding.top + lineChartHeight - padding.bottom) / 2"
                stroke="var(--color-border)"
                stroke-dasharray="4 4"
              />
              <line
                :x1="padding.left"
                :y1="lineChartHeight - padding.bottom"
                :x2="lineChartWidth - padding.right"
                :y2="lineChartHeight - padding.bottom"
                stroke="var(--color-border)"
                stroke-width="1.5"
              />

              <!-- Y-axis labels -->
              <text :x="padding.left - 10" :y="padding.top + 4" text-anchor="end" class="fill-muted font-bold text-[10px] tracking-wider">{{ trendMaxValLabel }}</text>
              <text :x="padding.left - 10" :y="(padding.top + lineChartHeight - padding.bottom) / 2 + 4" text-anchor="end" class="fill-muted font-bold text-[10px] tracking-wider">50%</text>
              <text :x="padding.left - 10" :y="lineChartHeight - padding.bottom + 4" text-anchor="end" class="fill-muted font-bold text-[10px] tracking-wider">Rs. 0</text>

              <!-- Line paths -->
              <g v-if="trendPoints.length > 0">
                <!-- Area -->
                <path :d="areaPath" fill="url(#salesGrad)" />
                <!-- Line -->
                <path :d="linePath" fill="none" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                
                <!-- Data Nodes -->
                <g v-for="(p, i) in trendPoints" :key="i" class="group/point">
                  <circle
                    :cx="p.x"
                    :cy="p.y"
                    r="5"
                    fill="var(--color-primary)"
                    stroke="#ffffff"
                    stroke-width="2.5"
                    class="transition-all duration-200 cursor-pointer hover:r-7"
                  />
                  <!-- X-Axis Month label -->
                  <text :x="p.x" :y="lineChartHeight - padding.bottom + 20" text-anchor="middle" class="fill-muted font-bold text-[10px] tracking-wide uppercase">{{ p.label }}</text>
                  
                  <!-- Tooltip -->
                  <g class="opacity-0 group-hover/point:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <rect :x="p.x - 55" :y="p.y - 45" width="110" height="32" rx="8" fill="var(--color-secondary)" />
                    <text :x="p.x" :y="p.y - 25" text-anchor="middle" class="fill-white font-extrabold text-[9px] tracking-wider uppercase">Rs. {{ p.val.toLocaleString() }}</text>
                  </g>
                </g>
              </g>

              <!-- Gradients def -->
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <!-- Category Share Donut Chart (Right) -->
        <div class="xl:col-span-5 bg-white border border-border p-6 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between w-full">
          <div>
            <h4 class="text-sm font-black text-text tracking-tight uppercase">Revenue Share by Category</h4>
            <p class="text-[10px] text-muted font-bold mt-0.5">Calculated from total sales breakdown</p>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
            <!-- Donut SVG -->
            <div class="relative w-40 h-40 shrink-0">
              <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
                <circle cx="100" cy="100" :r="donutRadius" fill="none" stroke="var(--color-border)" stroke-width="24" />
                <circle
                  v-for="(share, i) in categoryShares"
                  :key="i"
                  cx="100"
                  cy="100"
                  :r="donutRadius"
                  fill="none"
                  :stroke="share.color"
                  stroke-width="24"
                  :stroke-dasharray="share.dasharray"
                  :stroke-dashoffset="share.dashoffset"
                  stroke-linecap="butt"
                  class="transition-all duration-500 hover:stroke-width-28 cursor-pointer"
                />
              </svg>
              <!-- Center stats summary -->
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-[8px] font-black text-muted uppercase tracking-wider leading-none">Total Share</span>
                <span class="text-sm font-black text-text mt-1">100%</span>
              </div>
            </div>

            <!-- Legend -->
            <div class="flex-1 space-y-3 w-full sm:w-auto">
              <div v-for="(share, i) in categoryShares" :key="i" class="flex items-center justify-between text-[11px] font-bold">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-md" :style="{ backgroundColor: share.color }"></div>
                  <span class="text-text max-w-[120px] truncate">{{ share.name }}</span>
                </div>
                <span class="text-muted">{{ share.percentage.toFixed(0) }}%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>

  </div>
</template>

<style scoped>
/* Tooltip point scale transition */
svg circle {
  transform-origin: center;
}
</style>
