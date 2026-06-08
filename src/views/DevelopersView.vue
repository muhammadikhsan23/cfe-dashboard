<template>
  <div class="developers-view">
    <div class="page-header">
      <h1>Developer Occupancy</h1>
      <Dropdown v-model="roleFilter" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="All Roles" />
    </div>
    
    <!-- Summary Metrics -->
    <div class="summary-metrics">
      <div class="metric-card">
        <div class="metric-value">{{ avgDaysBacklog }}</div>
        <div class="metric-label">Avg Days Backlog</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">{{ totalAssignedHours }}h</div>
        <div class="metric-label">Total Assigned Hours</div>
        <div class="metric-sub">Across {{ filteredOccupancy.length }} developers</div>
      </div>
      <div class="metric-card">
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
          <div class="dev-info">
            <div class="dev-name">{{ dev.name }}</div>
            <div class="dev-meta">
              <Tag :value="getRoleLabel(dev.role)" />
              <Tag :value="getLevelLabel(dev.level)" severity="info" />
            </div>
          </div>
          <div class="status-badge" :class="'status-' + dev.occupancyStatus">
            <div class="status-icon" :class="'status-' + dev.occupancyStatus"></div>
            <span>{{ getStatusLabel(dev.occupancyStatus) }}</span>
          </div>
        </div>
        
        <!-- Metrics Row -->
        <div class="metrics-row">
          <div class="mini-metric">
            <div class="mini-value">{{ dev.capacity }}h</div>
            <div class="mini-label">Daily Capacity</div>
          </div>
          <div class="mini-metric">
            <div class="mini-value">{{ dev.allocatedHours }}h</div>
            <div class="mini-label">Active Work</div>
          </div>
          <div class="mini-metric">
            <div class="mini-value">{{ dev.queuedHours }}h</div>
            <div class="mini-label">Queued</div>
          </div>
          <div class="mini-metric">
            <div class="mini-value">{{ dev.daysQueued }}</div>
            <div class="mini-label">Days of Work</div>
          </div>
        </div>
        
        <!-- Workload Bar -->
        <div class="workload-section">
          <div class="workload-header">
            <span class="workload-label">Weekly Workload</span>
            <span class="workload-percent">{{ dev.occupancyRate }}%</span>
          </div>
          <div class="workload-bar-container">
            <div class="workload-bar-bg"></div>
            <div class="workload-bar-fill" :style="{ width: Math.min(100, dev.occupancyRate) + '%' }" :class="'fill-' + dev.occupancyStatus"></div>
            <div class="workload-bar-text">{{ dev.allocatedHours + dev.queuedHours }}h / {{ dev.capacity * 5 }}h</div>
          </div>
        </div>
        
        <!-- Task Breakdown -->
        <div class="task-breakdown">
          <div class="task-column">
            <div class="task-column-header">
              <span class="column-title">Active</span>
              <span class="column-count">{{ dev.activeTasks }}</span>
            </div>
            <div class="task-list">
              <div v-for="task in getActiveTasks(dev.id)" :key="task.id" class="task-item" :class="'task-' + task.status">
                <span class="task-title">{{ task.title }}</span>
                <span class="task-size" :class="'size-' + task.size">{{ task.size }}</span>
                <span class="task-hours">{{ task.estimatedHours }}h</span>
              </div>
              <div v-if="getActiveTasks(dev.id).length === 0" class="empty-tasks">No active tasks</div>
            </div>
          </div>
          <div class="task-column">
            <div class="task-column-header">
              <span class="column-title">Queued</span>
              <span class="column-count">{{ dev.queuedTasks }}</span>
            </div>
            <div class="task-list">
              <div v-for="task in getQueuedTasks(dev.id)" :key="task.id" class="task-item">
                <span class="task-title">{{ task.title }}</span>
                <span class="task-size" :class="'size-' + task.size">{{ task.size }}</span>
                <span class="task-hours">{{ task.estimatedHours }}h</span>
              </div>
              <div v-if="getQueuedTasks(dev.id).length === 0" class="empty-tasks">No queued tasks</div>
            </div>
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

function getStatusLabel(status) {
  const labels = {
    'available': 'Available',
    'optimal': 'Optimal',
    'overloaded': 'Overloaded'
  }
  return labels[status] || status
}

function getActiveTasks(devId) {
  return dataStore.tasks.filter(t => 
    t.assigneeId === devId && 
    (t.status === 'in-progress' || t.status === 'review')
  )
}

function getQueuedTasks(devId) {
  return dataStore.tasks.filter(t => 
    t.assigneeId === devId && 
    (t.status === 'backlog' || t.status === 'ready')
  )
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

/* Developer Cards */
.developers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
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

/* Dev Header */
.dev-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.dev-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.dev-meta {
  display: flex;
  gap: 8px;
}

/* Status Badge */
.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-available {
  background: #dcfce7;
  color: #166534;
}

.status-optimal {
  background: #dbeafe;
  color: #1e40af;
}

.status-overloaded {
  background: #fee2e2;
  color: #991b1b;
}

.status-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-icon.status-available { background: #10b981; }
.status-icon.status-optimal { background: #3b82f6; }
.status-icon.status-overloaded { background: #ef4444; }

/* Metrics Row */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.mini-metric {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.mini-value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.mini-label {
  font-size: 10px;
  color: #6b7280;
  text-transform: uppercase;
  margin-top: 2px;
}

/* Workload Section */
.workload-section {
  margin-bottom: 16px;
}

.workload-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.workload-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.workload-percent {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}

.workload-bar-container {
  position: relative;
  background: #e5e7eb;
  border-radius: 8px;
  height: 32px;
  overflow: hidden;
}

.workload-bar-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.workload-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 8px;
  transition: width 0.3s ease;
}

.fill-available { background: linear-gradient(90deg, #10b981, #059669); }
.fill-optimal { background: linear-gradient(90deg, #3b82f6, #2563eb); }
.fill-overloaded { background: linear-gradient(90deg, #ef4444, #dc2626); }

.workload-bar-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
}

/* Task Breakdown */
.task-breakdown {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.task-column {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
}

.task-column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.column-title {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.column-count {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 10px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: white;
  border-radius: 6px;
  font-size: 11px;
}

.task-title {
  flex: 1;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-size {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.size-S { background: #dcfce7; color: #166534; }
.size-M { background: #dbeafe; color: #1e40af; }
.size-L { background: #fef3c7; color: #92400e; }
.size-XL { background: #fee2e2; color: #991b1b; }

.task-hours {
  color: #6b7280;
  font-weight: 600;
}

.empty-tasks {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  padding: 8px;
}

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
  .metrics-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .task-breakdown {
    grid-template-columns: 1fr;
  }
}
</style>