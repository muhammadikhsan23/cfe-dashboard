<template>
  <div class="workload-timeline-view">
    <div class="page-header">
      <h1>Workload Timeline</h1>
      <div class="header-actions">
        <div class="week-nav">
          <button @click="prevWeek" class="nav-btn">&#8592;</button>
          <span class="week-label">{{ weekLabel }}</span>
          <button @click="nextWeek" class="nav-btn">&#8594;</button>
          <button @click="goToCurrentWeek" class="today-btn">Today</button>
        </div>
        <Dropdown v-model="roleFilter" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="All Roles" />
      </div>
    </div>
    
    <p class="page-description">Visual view of how tasks spread across the week for each developer</p>
    
    <!-- Developer Timeline Cards -->
    <div v-for="dev in filteredOccupancy" :key="dev.id" class="timeline-card">
      <div class="timeline-header">
        <div class="dev-info">
          <div class="dev-name">{{ dev.name }}</div>
          <div class="dev-meta">{{ getRoleLabel(dev.role) }} &middot; {{ dev.capacity }}h/day</div>
        </div>
        <div class="dev-stats">
          <span class="stat">{{ dev.activeTasks }} active</span>
          <span class="stat">{{ dev.queuedTasks }} queued</span>
        </div>
      </div>
      <div class="timeline">
        <!-- Header row -->
        <div class="timeline-name-cell"></div>
        <div 
          v-for="(day, idx) in weekDates" 
          :key="idx" 
          class="timeline-header-cell"
          :class="{ 'is-today': isToday(day) }"
        >
          <div class="day-name">{{ dayNames[idx] }}</div>
          <div class="day-num">{{ day.getDate() }}</div>
        </div>
        
        <!-- Tasks row -->
        <div class="timeline-name-cell">{{ dev.name.split(' ')[0] }}</div>
        <div 
          v-for="(day, idx) in weekDates" 
          :key="idx" 
          class="timeline-day-cell"
          :class="{ 'is-today': isToday(day) }"
        >
          <div 
            v-for="task in getTasksForDay(dev.id, day)" 
            :key="task.id" 
            class="timeline-task"
            :class="'size-' + task.size"
          >
            <span class="task-size-badge" :class="'size-' + task.size">{{ task.size }}</span>
            <span class="task-title" :title="task.title">{{ task.title }}</span>
            <span class="task-hours">{{ task.estimatedHours }}h</span>
            <span v-if="isOverdue(task)" class="overdue-badge">Overdue</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="filteredOccupancy.length === 0" class="empty-state">
      <p>No developers found for the selected role.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/data'

const dataStore = useDataStore()
const roleFilter = ref('')
const weekOffset = ref(0) // 0 = current week, -1 = last week, etc.

const roleOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Web', value: 'web' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Shopify', value: 'shopify' }
]

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Calculate the Monday of the current week based on weekOffset
const weekDates = computed(() => {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // offset to get to Monday
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset + (weekOffset.value * 7))
  monday.setHours(0, 0, 0, 0)
  
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
})

const weekLabel = computed(() => {
  const start = weekDates.value[0]
  const end = weekDates.value[6]
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startStr} - ${endStr}`
})

const filteredOccupancy = computed(() => {
  if (!roleFilter.value) return dataStore.developerOccupancy
  return dataStore.developerOccupancy.filter(d => d.role === roleFilter.value)
})

function isToday(date) {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function parseLocalDate(dateStr) {
  // Parse date string as local date (not UTC) to avoid timezone issues
  // Format: "2026-06-09" -> local midnight
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getTasksForDay(devId, date) {
  const tasks = dataStore.tasks.filter(t => 
    t.assigneeId === devId && 
    (t.status === 'in-progress' || t.status === 'ready')
  )
  
  return tasks.filter(task => {
    // Use started_at if available, otherwise created_at
    const taskDateStr = task.startedAt || task.createdAt
    if (!taskDateStr) return false
    
    const taskStart = parseLocalDate(taskDateStr)
    if (isNaN(taskStart.getTime())) return false
    
    // Check if task falls on this date or spans to this date
    const taskEnd = new Date(taskStart)
    const hoursToAllocate = task.estimatedHours || 4
    const capacity = getDevCapacity(devId)
    const daysNeeded = Math.ceil(hoursToAllocate / capacity)
    taskEnd.setDate(taskStart.getDate() + daysNeeded)
    
    // Compare date-only (strip time component)
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return dayStart >= new Date(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate()) && 
           dayStart < new Date(taskEnd.getFullYear(), taskEnd.getMonth(), taskEnd.getDate())
  })
}

function getDevCapacity(devId) {
  const dev = dataStore.developers.find(d => d.id === devId)
  return (parseInt(dev?.capacity) || 8)
}

function isOverdue(task) {
  if (task.status !== 'in-progress' || !task.startedAt) return false
  const started = new Date(task.startedAt)
  if (isNaN(started.getTime())) return false
  const now = new Date()
  const daysElapsed = Math.floor((now - started) / (1000 * 60 * 60 * 24))
  const dev = dataStore.developers.find(d => d.id === task.assigneeId)
  const capacity = parseInt(dev?.capacity) || 8
  const daysNeeded = Math.ceil((task.estimatedHours || 4) / capacity)
  return daysElapsed > daysNeeded
}

function getRoleLabel(role) {
  const labels = { web: 'Web', mobile: 'Mobile', shopify: 'Shopify' }
  return labels[role] || role
}

function prevWeek() {
  weekOffset.value--
}

function nextWeek() {
  weekOffset.value++
}

function goToCurrentWeek() {
  weekOffset.value = 0
}
</script>

<style scoped>
.workload-timeline-view {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.page-header h1 {
  font-size: 24px;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.page-description {
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 24px;
}

/* Week Navigation */
.week-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  color: #374151;
  font-size: 14px;
}

.nav-btn:hover {
  background: #f3f4f6;
}

.today-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.today-btn:hover {
  background: #2563eb;
}

.week-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  min-width: 160px;
  text-align: center;
}

/* Timeline Cards */
.timeline-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.dev-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.dev-meta {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.dev-stats {
  display: flex;
  gap: 12px;
}

.stat {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 12px;
}

/* Timeline Grid */
.timeline {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  gap: 4px;
}

.timeline-name-cell {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  padding: 8px 4px;
  display: flex;
  align-items: center;
}

.timeline-header-cell {
  text-align: center;
  padding: 8px;
  border-radius: 4px;
  background: #f8fafc;
}

.timeline-header-cell.is-today {
  background: #dbeafe;
}

.day-name {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
}

.day-num {
  font-size: 16px;
  font-weight: 700;
  color: #374151;
}

.timeline-day-cell {
  background: #f8fafc;
  border-radius: 4px;
  padding: 6px;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.timeline-day-cell.is-today {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

/* Tasks */
.timeline-task {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 11px;
  background: #f1f5f9;
  border-left: 3px solid #94a3b8;
}

.timeline-task.size-S {
  background: #f0fdf4;
  border-left-color: #22c55e;
}

.timeline-task.size-M {
  background: #eff6ff;
  border-left-color: #3b82f6;
}

.timeline-task.size-L {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.timeline-task.size-XL {
  background: #fef2f2;
  border-left-color: #ef4444;
}

.task-size-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  flex-shrink: 0;
}

.task-size-badge.size-S { background: #dcfce7; color: #166534; }
.task-size-badge.size-M { background: #dbeafe; color: #1e40af; }
.task-size-badge.size-L { background: #fef3c7; color: #92400e; }
.task-size-badge.size-XL { background: #fee2e2; color: #991b1b; }

.task-title {
  flex: 1;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.task-hours {
  color: #6b7280;
  font-weight: 600;
  flex-shrink: 0;
}

.overdue-badge {
  background: #fee2e2;
  color: #991b1b;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 3px;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

@media (max-width: 1024px) {
  .timeline {
    grid-template-columns: 80px repeat(5, 1fr);
  }
  .timeline-header-cell:nth-child(n+7),
  .timeline-day-cell:nth-child(n+7) {
    display: none;
  }
}
</style>