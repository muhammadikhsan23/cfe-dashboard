<template>
  <div class="developers-view">
    <div class="page-header">
      <h1>Developer Occupancy</h1>
      <Dropdown v-model="roleFilter" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="All Roles" />
    </div>
    
    <!-- Summary Metrics -->
    <div class="summary-metrics">
      <div class="metric-card" :class="avgDaysBacklog >= 5 ? 'metric-bad' : avgDaysBacklog >= 3 ? 'metric-warn' : 'metric-good'">
        <div class="metric-value">{{ avgDaysBacklog }}</div>
        <div class="metric-label">Avg Days Backlog</div>
        <div v-if="avgDaysBacklog >= 5" class="metric-alert">Above 5-day threshold</div>
      </div>
      <div class="metric-card metric-warn">
        <div class="metric-value">{{ totalAssignedHours }}h</div>
        <div class="metric-label">Total Assigned Hours</div>
        <div class="metric-sub">Across {{ filteredOccupancy.length }} developers</div>
      </div>
      <div class="metric-card metric-good">
        <div class="metric-value">{{ availableDevs }}</div>
        <div class="metric-label">Available Devs</div>
        <div class="metric-sub">Out of {{ filteredOccupancy.length }} total</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">{{ totalTasks }}</div>
        <div class="metric-label">Total Tasks</div>
        <div class="metric-sub">{{ inProgressTasks }} in progress</div>
      </div>
    </div>
    
    <!-- Developer Cards -->
    <div class="developers-grid">
      <div v-for="dev in filteredOccupancy" :key="dev.id" class="dev-card">
        <div class="dev-header">
          <div>
            <div class="dev-name">{{ dev.name }} ({{ getRoleLabel(dev.role) }})</div>
            <div class="dev-capacity">Capacity: {{ dev.capacity }} hours/day • {{ getLevelLabel(dev.level) }} Level</div>
          </div>
          <span class="days-indicator" :class="getDaysIndicatorClass(dev)">{{ dev.daysQueued }} days queued</span>
        </div>
        
        <div class="workload-section">
          <div class="workload-text">
            <strong>{{ dev.allocatedHours + dev.queuedHours }}</strong> hours assigned across <strong>{{ dev.activeTasks + dev.queuedTasks }}</strong> tasks
          </div>
          <div class="workload-bar-container">
            <div class="workload-bar" :class="getWorkloadBarClass(dev)" :style="{ width: Math.min(100, dev.occupancyRate) + '%' }">
              {{ dev.occupancyRate }}% workload ({{ dev.allocatedHours }}h / {{ dev.capacity }}h capacity)
            </div>
          </div>
          <div class="workload-labels">
            <span>0h</span>
            <span>{{ dev.capacity }}h (1 day)</span>
            <span>{{ dev.capacity * 5 }}h (5 days)</span>
            <span>{{ dev.capacity * 6 }}h+</span>
          </div>
        </div>
        
        <div class="queue-depth">
          <div class="queue-item" :class="getQueueItemClass(dev.daysQueued, 'days')">
            <div class="queue-value">{{ dev.daysQueued }}</div>
            <div class="queue-label">Days of Work</div>
          </div>
          <div class="queue-item">
            <div class="queue-value">{{ dev.activeTasks + dev.queuedTasks }}</div>
            <div class="queue-label">Tasks Queued</div>
          </div>
          <div class="queue-item" :class="dev.activeTasks === 0 ? 'queue-good' : 'queue-warn'">
            <div class="queue-value">{{ dev.activeTasks }}</div>
            <div class="queue-label">In Progress</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/data'

const dataStore = useDataStore()
const roleFilter = ref('')

const roleOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Web', value: 'web' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Shopify', value: 'shopify' }
]

const filteredOccupancy = computed(() => {
  if (!roleFilter.value) return dataStore.developerOccupancy
  return dataStore.developerOccupancy.filter(d => d.role === roleFilter.value)
})

// Summary metrics
const avgDaysBacklog = computed(() => {
  if (filteredOccupancy.value.length === 0) return 0
  const total = filteredOccupancy.value.reduce((sum, d) => sum + (d.daysQueued || 0), 0)
  return Math.round(total / filteredOccupancy.value.length)
})

const totalAssignedHours = computed(() => {
  return filteredOccupancy.value.reduce((sum, d) => sum + d.allocatedHours + d.queuedHours, 0)
})

const availableDevs = computed(() => {
  return filteredOccupancy.value.filter(d => d.occupancyStatus === 'available').length
})

const totalTasks = computed(() => {
  return dataStore.tasks.length
})

const inProgressTasks = computed(() => {
  return dataStore.tasks.filter(t => t.status === 'in-progress' || t.status === 'review').length
})

function getRoleLabel(role) {
  const labels = { web: 'Web', mobile: 'Mobile', shopify: 'Shopify' }
  return labels[role] || role
}

function getLevelLabel(level) {
  const labels = { junior: 'Junior', mid: 'Mid', senior: 'Senior', lead: 'Lead' }
  return labels[level] || level
}

function getDaysIndicatorClass(dev) {
  const days = dev.daysQueued || 0
  if (days >= 5) return 'overloaded'
  if (days >= 3) return 'heavy'
  return ''
}

function getWorkloadBarClass(dev) {
  if (dev.occupancyStatus === 'overloaded') return 'overloaded'
  if (dev.occupancyStatus === 'optimal') return 'normal'
  return 'normal'
}

function getQueueItemClass(value, type) {
  if (type === 'days') {
    if (value >= 5) return 'queue-bad'
    if (value >= 3) return 'queue-warn'
    return 'queue-good'
  }
  return ''
}
</script>

<style scoped>
.developers-view {
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

/* Summary Metrics */
.summary-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  margin-top: 4px;
}

.metric-sub {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

.metric-alert {
  font-size: 11px;
  color: #dc2626;
  margin-top: 4px;
}

.metric-good .metric-value { color: #10b981; }
.metric-warn .metric-value { color: #f59e0b; }
.metric-bad .metric-value { color: #ef4444; }

/* Developer Cards */
.developers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.dev-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s;
}

.dev-card:hover {
  transform: translateY(-2px);
}

.dev-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.dev-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.dev-capacity {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

.days-indicator {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: #e0e7ff;
  color: #3730a3;
  white-space: nowrap;
}

.days-indicator.heavy {
  background: #fef3c7;
  color: #92400e;
}

.days-indicator.overloaded {
  background: #fee2e2;
  color: #991b1b;
}

/* Workload Section */
.workload-section {
  margin-bottom: 16px;
}

.workload-text {
  font-size: 13px;
  color: #374151;
  margin-bottom: 8px;
}

.workload-bar-container {
  background: #e5e7eb;
  border-radius: 8px;
  height: 24px;
  overflow: hidden;
  margin-bottom: 8px;
}

.workload-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
  transition: width 0.3s ease;
  min-width: 60px;
}

.workload-bar.normal {
  background: linear-gradient(90deg, #10b981, #059669);
}

.workload-bar.overloaded {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.workload-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #6b7280;
}

/* Queue Depth */
.queue-depth {
  display: flex;
  gap: 16px;
}

.queue-item {
  flex: 1;
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.queue-value {
  font-size: 24px;
  font-weight: 700;
}

.queue-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  margin-top: 4px;
}

.queue-good .queue-value { color: #10b981; }
.queue-warn .queue-value { color: #f59e0b; }
.queue-bad .queue-value { color: #ef4444; }

@media (max-width: 1200px) {
  .summary-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .summary-metrics {
    grid-template-columns: 1fr;
  }
  .developers-grid {
    grid-template-columns: 1fr;
  }
}
</style>