<template>
  <div class="analytics-view">
    <div class="page-header">
      <h1>Analytics & Reports</h1>
    </div>
    
    <div class="charts-grid">
      <!-- Task Completion Trend -->
      <div class="chart-card">
        <h3>Task Completion Trend</h3>
        <div ref="completionChart" class="chart-container"></div>
      </div>
      
      <!-- Task Size Distribution -->
      <div class="chart-card">
        <h3>Task Size Distribution</h3>
        <div ref="sizeChart" class="chart-container"></div>
      </div>
      
      <!-- Role Performance Comparison -->
      <div class="chart-card full-width">
        <h3>Role Performance Comparison</h3>
        <div ref="roleChart" class="chart-container"></div>
      </div>
      
      <!-- Priority Distribution -->
      <div class="chart-card">
        <h3>Priority Distribution</h3>
        <div ref="priorityChart" class="chart-container"></div>
      </div>
      
      <!-- Project Task Distribution -->
      <div class="chart-card">
        <h3>Tasks per Project</h3>
        <div ref="projectChart" class="chart-container"></div>
      </div>
    </div>
    
    <!-- Summary Stats -->
    <div class="summary-section">
      <h2>Summary Statistics</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <span class="label">Total Tasks</span>
          <span class="value">{{ dataStore.taskStats.total }}</span>
        </div>
        <div class="summary-card">
          <span class="label">Completion Rate</span>
          <span class="value">{{ completionRate }}%</span>
        </div>
        <div class="summary-card">
          <span class="label">Avg Cycle Time</span>
          <span class="value">{{ avgCycleTime }} days</span>
        </div>
        <div class="summary-card">
          <span class="label">Total Projects</span>
          <span class="value">{{ dataStore.projectStats.total }}</span>
        </div>
        <div class="summary-card">
          <span class="label">Active Projects</span>
          <span class="value">{{ dataStore.projectStats.active }}</span>
        </div>
        <div class="summary-card">
          <span class="label">Developers</span>
          <span class="value">{{ dataStore.developers.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore } from '../stores/data'
import * as echarts from 'echarts'

const dataStore = useDataStore()
const completionChart = ref(null)
const sizeChart = ref(null)
const roleChart = ref(null)
const priorityChart = ref(null)
const projectChart = ref(null)

const completionRate = computed(() => {
  const total = dataStore.tasks.length
  const done = dataStore.taskStats.done
  return total > 0 ? Math.round((done / total) * 100) : 0
})

const avgCycleTime = computed(() => {
  const completed = dataStore.tasks.filter(t => t.status === 'done' && t.startedAt && t.completedAt)
  if (completed.length === 0) return 0
  const totalDays = completed.reduce((sum, t) => {
    const start = new Date(t.startedAt)
    const end = new Date(t.completedAt)
    return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  }, 0)
  return Math.round(totalDays / completed.length * 10) / 10
})

function initCompletionChart() {
  if (!completionChart.value) return
  
  const chart = echarts.init(completionChart.value)
  const dates = [...new Set(dataStore.tasks
    .filter(t => t.completedAt)
    .map(t => t.completedAt)
    .sort())]
  
  const cumulativeDone = []
  let count = 0
  for (const date of dates) {
    count = dataStore.tasks.filter(t => t.completedAt <= date).length
    cumulativeDone.push({ date, count })
  }
  
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: cumulativeDone.map(d => d.date.slice(5)), axisLabel: { rotate: 45 } },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      data: cumulativeDone.map(d => d.count),
      smooth: true,
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.3)' }, { offset: 1, color: 'rgba(59,130,246,0.05)' }] } },
      itemStyle: { color: '#3b82f6' },
      lineStyle: { width: 3 }
    }]
  })
}

function initSizeChart() {
  if (!sizeChart.value) return
  
  const chart = echarts.init(sizeChart.value)
  const sCount = dataStore.tasks.filter(t => t.size === 'S').length
  const mCount = dataStore.tasks.filter(t => t.size === 'M').length
  const lCount = dataStore.tasks.filter(t => t.size === 'L').length
  const xlCount = dataStore.tasks.filter(t => t.size === 'XL').length
  
  chart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: sCount, name: 'S (2-4h)', itemStyle: { color: '#10b981' } },
        { value: mCount, name: 'M (4-8h)', itemStyle: { color: '#3b82f6' } },
        { value: lCount, name: 'L (8-16h)', itemStyle: { color: '#f59e0b' } },
        { value: xlCount, name: 'XL (16-32h)', itemStyle: { color: '#ef4444' } }
      ],
      label: { formatter: '{b}: {c}' }
    }]
  })
}

function initRoleChart() {
  if (!roleChart.value) return
  
  const chart = echarts.init(roleChart.value)
  const roles = ['web', 'mobile', 'shopify']
  const roleLabels = ['Web', 'Mobile', 'Shopify']
  const colors = ['#3b82f6', '#8b5cf6', '#10b981']
  
  const data = roles.map(role => {
    const tasks = dataStore.tasks.filter(t => t.role === role)
    const done = tasks.filter(t => t.status === 'done').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    const backlog = tasks.filter(t => t.status === 'backlog').length
    return { done, inProgress, backlog }
  })
  
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['Done', 'In Progress', 'Backlog'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: roleLabels },
    yAxis: { type: 'value' },
    series: [
      { name: 'Done', type: 'bar', stack: 'total', data: data.map(d => d.done), itemStyle: { color: '#10b981' } },
      { name: 'In Progress', type: 'bar', stack: 'total', data: data.map(d => d.inProgress), itemStyle: { color: '#f59e0b' } },
      { name: 'Backlog', type: 'bar', stack: 'total', data: data.map(d => d.backlog), itemStyle: { color: '#94a3b8' } }
    ]
  })
}

function initPriorityChart() {
  if (!priorityChart.value) return
  
  const chart = echarts.init(priorityChart.value)
  const urgent = dataStore.tasks.filter(t => t.priority === 'urgent').length
  const high = dataStore.tasks.filter(t => t.priority === 'high').length
  const medium = dataStore.tasks.filter(t => t.priority === 'medium').length
  const low = dataStore.tasks.filter(t => t.priority === 'low').length
  
  chart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: urgent, name: 'Urgent', itemStyle: { color: '#ef4444' } },
        { value: high, name: 'High', itemStyle: { color: '#f97316' } },
        { value: medium, name: 'Medium', itemStyle: { color: '#3b82f6' } },
        { value: low, name: 'Low', itemStyle: { color: '#6b7280' } }
      ],
      label: { formatter: '{b}: {c}' }
    }]
  })
}

function initProjectChart() {
  if (!projectChart.value) return
  
  const chart = echarts.init(projectChart.value)
  const data = dataStore.projects.map(p => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
    value: dataStore.tasks.filter(t => t.projectId === p.id).length
  }))
  
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { rotate: 45 } },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: data.map(d => d.value),
      itemStyle: { color: '#667eea' },
      label: { show: true, position: 'top' }
    }]
  })
}

function initAllCharts() {
  initCompletionChart()
  initSizeChart()
  initRoleChart()
  initPriorityChart()
  initProjectChart()
}

watch(() => dataStore.tasks, () => {
  setTimeout(initAllCharts, 100)
})

onMounted(() => {
  setTimeout(initAllCharts, 200)
})
</script>

<style scoped>
.analytics-view {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  color: #1f2937;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-card h3 {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.summary-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.summary-section h2 {
  font-size: 18px;
  color: #1f2937;
  margin-bottom: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.summary-card {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.summary-card .label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.summary-card .value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>