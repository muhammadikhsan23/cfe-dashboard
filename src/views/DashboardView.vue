<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>Dashboard Overview</h1>
      <p class="subtitle">Welcome back, {{ authStore.userName }}</p>
    </div>
    
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="stat-card">
        <div class="icon bg-primary">
          <i class="pi pi-list"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ dataStore.taskStats.total }}</span>
          <span class="stat-label">Total Tasks</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-warning">
          <i class="pi pi-spinner"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ dataStore.taskStats.inProgress }}</span>
          <span class="stat-label">In Progress</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-success">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ dataStore.taskStats.done }}</span>
          <span class="stat-label">Completed</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-danger">
          <i class="pi pi-exclamation-circle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ dataStore.taskStats.blocked }}</span>
          <span class="stat-label">Blocked</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-info">
          <i class="pi pi-briefcase"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ dataStore.projectStats.active }}</span>
          <span class="stat-label">Active Projects</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
          <i class="pi pi-users"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ dataStore.developers.length }}</span>
          <span class="stat-label">Developers</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-hours">
          <i class="pi pi-clock"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ hoursSummary.estimated }}h</span>
          <span class="stat-label">Estimated Hours</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-hours-actual">
          <i class="pi pi-clock"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ hoursSummary.actual }}h</span>
          <span class="stat-label">Actual Hours</span>
        </div>
      </div>
    </div>
    
    <!-- Main Content Grid -->
    <div class="dashboard-grid">
      <!-- Task Status Chart -->
      <div class="card">
        <h3>Task Status Distribution</h3>
        <div ref="taskChart" class="chart-container"></div>
      </div>
      
      <!-- Role Distribution -->
      <div class="card">
        <h3>Tasks by Role</h3>
        <div ref="roleChart" class="chart-container"></div>
      </div>
      
      <!-- Project Health -->
      <div class="card full-width">
        <h3>Running Projects</h3>
        <div class="project-list">
          <div v-for="project in dataStore.projects.slice(0, 5)" :key="project.id" class="project-item">
            <div class="project-info">
              <h4>{{ project.name }}</h4>
              <span class="client">{{ project.client }}</span>
            </div>
            <div class="project-progress">
              <ProgressBar :value="getProjectProgress(project.id)" :class="['progress-' + project.health]" />
            </div>
            <Tag :value="project.health" :severity="getHealthSeverity(project.health)" />
          </div>
        </div>
      </div>
      
      <!-- Developer Occupancy -->
      <div class="card full-width">
        <h3>Developer Occupancy</h3>
        <div class="occupancy-section">
          <h4 class="section-title high-occupancy">
            <i class="pi pi-arrow-up"></i> High Occupancy
          </h4>
          <div class="occupancy-grid">
            <div v-for="dev in highOccupancy" :key="dev.id" class="dev-occupancy">
              <div class="dev-header">
                <span class="dev-name">{{ dev.name }}</span>
                <Tag :value="dev.occupancyRate + '%'" :severity="getOccupancySeverity(dev.occupancyStatus)" />
              </div>
              <div class="dev-details">
                <span class="dev-role">{{ getRoleLabel(dev.role) }}</span>
                <span class="dev-tasks">{{ dev.activeTasks }} active tasks</span>
              </div>
            </div>
          </div>
        </div>
        <div class="occupancy-section low-section">
          <h4 class="section-title low-occupancy">
            <i class="pi pi-arrow-down"></i> Low Occupancy
          </h4>
          <div class="occupancy-grid">
            <div v-for="dev in lowOccupancy" :key="dev.id" class="dev-occupancy">
              <div class="dev-header">
                <span class="dev-name">{{ dev.name }}</span>
                <Tag :value="dev.occupancyRate + '%'" :severity="getOccupancySeverity(dev.occupancyStatus)" />
              </div>
              <div class="dev-details">
                <span class="dev-role">{{ getRoleLabel(dev.role) }}</span>
                <span class="dev-tasks">{{ dev.activeTasks }} active tasks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Activity -->
      <div class="card full-width">
        <h3>Recent Completed Tasks</h3>
        <div class="activity-list">
          <div v-for="task in recentCompleted" :key="task.id" class="activity-item">
            <div class="activity-icon bg-success">
              <i class="pi pi-check"></i>
            </div>
            <div class="activity-details">
              <span class="task-title">{{ task.title }}</span>
              <span class="task-meta">
                {{ getDeveloperName(task.assigneeId) }} • {{ task.size }} • 
                Est: {{ task.estimatedHours }}h → Actual: {{ task.actualHours }}h • 
                {{ formatDate(task.completedAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'
import * as echarts from 'echarts'

import { onUnmounted } from 'vue'

const authStore = useAuthStore()
const dataStore = useDataStore()
const taskChart = ref(null)
const roleChart = ref(null)
let taskChartInstance = null
let roleChartInstance = null

const sortedByOccupancy = computed(() => {
  return [...dataStore.developerOccupancy].sort((a, b) => b.occupancyRate - a.occupancyRate)
})

const highOccupancy = computed(() => {
  return sortedByOccupancy.value.slice(0, 3)
})

const lowOccupancy = computed(() => {
  return [...dataStore.developerOccupancy]
    .sort((a, b) => a.occupancyRate - b.occupancyRate)
    .slice(0, 3)
})

const recentCompleted = computed(() => {
  return dataStore.tasks
    .filter(t => t.status === 'done')
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 5)
})

const hoursSummary = computed(() => {
  const completedTasks = dataStore.tasks.filter(t => t.status === 'done' && t.actualHours > 0)
  const estimated = completedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
  const actual = completedTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
  return { estimated, actual }
})

function getProjectProgress(projectId) {
  const tasks = dataStore.tasks.filter(t => t.projectId === projectId)
  if (tasks.length === 0) return 0
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
  if (totalHours === 0) return 0
  const doneHours = tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
  return Math.round((doneHours / totalHours) * 100)
}

function getHealthSeverity(health) {
  const map = { 'on-track': 'success', 'at-risk': 'warn', 'blocked': 'danger', 'completed': 'info' }
  return map[health] || null
}

function getOccupancySeverity(status) {
  const map = { overloaded: 'danger', optimal: 'success', available: 'warn' }
  return map[status] || null
}

function getRoleLabel(role) {
  const labels = { web: 'Web', mobile: 'Mobile', shopify: 'Shopify' }
  return labels[role] || role
}

function getDeveloperName(id) {
  const dev = dataStore.developers.find(d => d.id === id)
  return dev?.name || 'Unassigned'
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function initCharts() {
  // Dispose existing chart instances to prevent memory leaks
  if (taskChartInstance) {
    taskChartInstance.dispose()
    taskChartInstance = null
  }
  if (roleChartInstance) {
    roleChartInstance.dispose()
    roleChartInstance = null
  }
  
  // Task Status Pie Chart
  if (taskChart.value) {
    taskChartInstance = echarts.init(taskChart.value)
    taskChartInstance.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: dataStore.taskStats.backlog, name: 'Backlog', itemStyle: { color: '#94a3b8' } },
          { value: dataStore.taskStats.ready, name: 'Ready', itemStyle: { color: '#3b82f6' } },
          { value: dataStore.taskStats.inProgress, name: 'In Progress', itemStyle: { color: '#f59e0b' } },
          { value: dataStore.taskStats.review, name: 'Review', itemStyle: { color: '#8b5cf6' } },
          { value: dataStore.taskStats.done, name: 'Done', itemStyle: { color: '#10b981' } },
          { value: dataStore.taskStats.blocked, name: 'Blocked', itemStyle: { color: '#ef4444' } }
        ],
        label: { show: false },
        emphasis: { label: { show: true, fontWeight: 'bold' } }
      }]
    })
  }
  
  // Role Distribution Bar Chart
  if (roleChart.value) {
    roleChartInstance = echarts.init(roleChart.value)
    const webTasks = dataStore.tasks.filter(t => t.role === 'web').length
    const mobileTasks = dataStore.tasks.filter(t => t.role === 'mobile').length
    const shopifyTasks = dataStore.tasks.filter(t => t.role === 'shopify').length
    roleChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['Web', 'Mobile', 'Shopify'], axisLabel: { fontWeight: 'bold' } },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: [
          { value: webTasks, itemStyle: { color: '#3b82f6' } },
          { value: mobileTasks, itemStyle: { color: '#8b5cf6' } },
          { value: shopifyTasks, itemStyle: { color: '#10b981' } }
        ],
        barWidth: '50%',
        label: { show: true, position: 'top' }
      }]
    })
  }
}

watch(() => dataStore.tasks, () => {
  setTimeout(initCharts, 100)
})

watch(() => dataStore.projects, () => {
  setTimeout(initCharts, 100)
})

onMounted(() => {
  setTimeout(initCharts, 200)
})

onUnmounted(() => {
  // Clean up chart instances when component is unmounted
  if (taskChartInstance) {
    taskChartInstance.dispose()
    taskChartInstance = null
  }
  if (roleChartInstance) {
    roleChartInstance.dispose()
    roleChartInstance = null
  }
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  color: #1f2937;
  margin-bottom: 4px;
}

.subtitle {
  color: #6b7280;
  font-size: 14px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-card .icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.bg-primary { background: #3b82f6; }
.bg-success { background: #10b981; }
.bg-warning { background: #f59e0b; }
.bg-danger { background: #ef4444; }
.bg-info { background: #06b6d4; }
.bg-hours { background: #8b5cf6; }
.bg-hours-actual { background: #ec4899; }

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card.full-width {
  grid-column: 1 / -1;
}

.card h3 {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
  height: 280px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.project-info {
  flex: 1;
}

.project-info h4 {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 2px;
}

.project-info .client {
  font-size: 12px;
  color: #6b7280;
}

.project-progress {
  flex: 2;
}

.progress-on-track :deep(.p-progressbar-value) { background: #10b981; }
.progress-at-risk :deep(.p-progressbar-value) { background: #f59e0b; }
.progress-blocked :deep(.p-progressbar-value) { background: #ef4444; }
.progress-completed :deep(.p-progressbar-value) { background: #06b6d4; }

.occupancy-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.occupancy-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.high-occupancy { color: #dc2626; }
.low-occupancy { color: #10b981; }

.dev-occupancy {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
}

.dev-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.dev-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.dev-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}

.task-title {
  font-size: 14px;
  color: #1f2937;
  display: block;
}

.task-meta {
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .occupancy-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>