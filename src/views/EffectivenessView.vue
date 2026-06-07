<template>
  <div class="effectiveness-view">
    <div class="page-header">
      <h1>Developer Effectiveness Rankings</h1>
      <Dropdown v-model="roleFilter" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="All Roles" />
    </div>
    
    <!-- Leaderboard -->
    <div class="leaderboard">
      <div v-for="(dev, index) in filteredEffectiveness" :key="dev.id" class="leaderboard-item" :class="getRankClass(index)">
        <div class="rank">#{{ index + 1 }}</div>
        <div class="dev-info">
          <div class="dev-avatar">{{ dev.name[0] }}</div>
          <div class="dev-details">
            <h3>{{ dev.name }}</h3>
            <span class="dev-meta">{{ dev.type === 'staff' ? 'Staff' : 'Outsource' }} • {{ getRoleLabel(dev.role) }}</span>
          </div>
        </div>
        <div class="effectiveness-score">
          <div class="score-badge" :class="'rating-' + dev.rating">{{ dev.effectivenessScore }}</div>
          <span class="rating-label">{{ getRatingLabel(dev.rating) }}</span>
        </div>
        <div class="metrics">
          <div class="metric">
            <span class="metric-label">Completion</span>
            <span class="metric-value">{{ dev.metrics.completionRate }}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">Quality</span>
            <span class="metric-value">{{ dev.metrics.qualityScore }}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">On-Time</span>
            <span class="metric-value">{{ dev.metrics.onTimeDelivery }}%</span>
          </div>
        </div>
        <div class="task-counts">
          <span class="count done">{{ dev.completedTasks }} done</span>
          <span class="count active">{{ dev.inProgressTasks }} active</span>
        </div>
      </div>
    </div>
    
    <!-- Metrics Breakdown Chart -->
    <div class="chart-section">
      <h2>Metrics Breakdown</h2>
      <div ref="metricsChart" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore } from '../stores/data'
import * as echarts from 'echarts'

const dataStore = useDataStore()
const roleFilter = ref('')
const metricsChart = ref(null)

const roleOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Web', value: 'web' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Shopify', value: 'shopify' }
]

const filteredEffectiveness = computed(() => {
  if (!roleFilter.value) return dataStore.developerEffectiveness
  return dataStore.developerEffectiveness.filter(d => d.role === roleFilter.value)
})

function getRoleLabel(role) {
  const labels = { web: 'Web', mobile: 'Mobile', shopify: 'Shopify' }
  return labels[role] || role
}

function getRankClass(index) {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return ''
}

function getRatingLabel(rating) {
  const labels = {
    'top': 'Top Performer',
    'strong': 'Strong',
    'solid': 'Solid',
    'needs-improvement': 'Needs Improvement',
    'underperformer': 'Underperformer'
  }
  return labels[rating] || rating
}

function initMetricsChart() {
  if (!metricsChart.value || filteredEffectiveness.value.length === 0) return
  
  const chart = echarts.init(metricsChart.value)
  const devs = filteredEffectiveness.value.slice(0, 10)
  
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['Completion', 'Quality', 'On-Time', 'Cycle Time', 'Consistency'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: devs.map(d => d.name.split(' ')[0]), axisLabel: { width: 80, overflow: 'truncate' } },
    series: [
      { name: 'Completion', type: 'bar', stack: 'total', data: devs.map(d => d.metrics.completionRate), itemStyle: { color: '#3b82f6' } },
      { name: 'Quality', type: 'bar', stack: 'total', data: devs.map(d => d.metrics.qualityScore), itemStyle: { color: '#10b981' } },
      { name: 'On-Time', type: 'bar', stack: 'total', data: devs.map(d => d.metrics.onTimeDelivery), itemStyle: { color: '#f59e0b' } },
      { name: 'Cycle Time', type: 'bar', stack: 'total', data: devs.map(d => d.metrics.cycleTimeEfficiency), itemStyle: { color: '#8b5cf6' } },
      { name: 'Consistency', type: 'bar', stack: 'total', data: devs.map(d => d.metrics.consistency), itemStyle: { color: '#06b6d4' } }
    ]
  })
}

watch(() => dataStore.developers, () => {
  setTimeout(initMetricsChart, 100)
})

watch(roleFilter, () => {
  setTimeout(initMetricsChart, 100)
})

onMounted(() => {
  setTimeout(initMetricsChart, 200)
})
</script>

<style scoped>
.effectiveness-view {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  color: #1f2937;
}

.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.leaderboard-item:hover {
  transform: translateX(4px);
}

.leaderboard-item.rank-gold {
  border-left: 4px solid #fbbf24;
  background: linear-gradient(135deg, #fef3c7, white);
}

.leaderboard-item.rank-silver {
  border-left: 4px solid #94a3b8;
}

.leaderboard-item.rank-bronze {
  border-left: 4px solid #d97706;
}

.rank {
  font-size: 20px;
  font-weight: 700;
  color: #6b7280;
  width: 40px;
  text-align: center;
}

.dev-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.dev-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.dev-details h3 {
  font-size: 15px;
  color: #1f2937;
  margin-bottom: 2px;
}

.dev-meta {
  font-size: 12px;
  color: #6b7280;
}

.effectiveness-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.rating-top { background: linear-gradient(135deg, #10b981, #059669); }
.rating-strong { background: linear-gradient(135deg, #34d399, #10b981); }
.rating-solid { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
.rating-needs-improvement { background: linear-gradient(135deg, #fb923c, #f97316); }
.rating-underperformer { background: linear-gradient(135deg, #f87171, #ef4444); }

.rating-label {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

.metrics {
  display: flex;
  gap: 20px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metric-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.task-counts {
  display: flex;
  gap: 8px;
}

.count {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
}

.count.done { background: #dcfce7; color: #166534; }
.count.active { background: #fef3c7; color: #92400e; }

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.chart-section h2 {
  font-size: 18px;
  color: #1f2937;
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
  height: 400px;
}

@media (max-width: 1024px) {
  .leaderboard-item {
    flex-wrap: wrap;
  }
  .metrics {
    gap: 12px;
  }
}
</style>