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
    
    <p class="page-description">Visual view of how tasks spread across the week for each developer. In-progress tasks shown first, ready tasks fill remaining capacity from today onward.</p>
    
    <!-- Developer Timeline Cards -->
    <div v-for="dev in filteredOccupancy" :key="dev.id" class="timeline-card">
      <div class="timeline-header">
        <div class="dev-info">
          <div class="dev-name">{{ dev.name }}</div>
          <div class="dev-meta">{{ getRoleLabel(dev.role) }} &middot; {{ dev.capacity }}h/day</div>
        </div>
        <div class="dev-stats">
          <span class="stat active-stat">{{ dev.activeTasks }} active</span>
          <span class="stat queued-stat">{{ dev.queuedTasks }} queued</span>
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
          <!-- In-progress tasks -->
          <div 
            v-for="task in getInProgressForDay(dev.id, day)" 
            :key="task.id" 
            class="timeline-task task-inprogress"
            :class="'size-' + task.size"
          >
            <span class="task-size-badge" :class="'size-' + task.size">{{ task.size }}</span>
            <span class="task-title" :title="task.title">{{ task.title }}</span>
            <span v-if="task.actualHours" class="task-hours-badge">
              {{ task.actualHours }}/{{ task.estimatedHours }}h
            </span>
            <span v-else class="task-hours">{{ task.estimatedHours }}h</span>
            <span v-if="isOverdue(task)" class="overdue-badge">Overdue</span>
          </div>

          <!-- Ready tasks (fill remaining capacity from today onward) -->
          <div 
            v-for="task in getReadyForDay(dev.id, day)" 
            :key="task.id" 
            class="timeline-task task-ready"
            :class="'size-' + task.size"
          >
            <span class="task-size-badge" :class="'size-' + task.size">{{ task.size }}</span>
            <span class="task-title" :title="task.title">{{ task.title }}</span>
            <span class="task-hours">{{ task.estimatedHours }}h</span>
            <span class="ready-label">READY</span>
          </div>

          <!-- Capacity indicator -->
          <div class="capacity-bar" v-if="getDayAllocation(dev.id, day).total > 0">
            <div 
              class="capacity-fill" 
              :class="{
                'capacity-over': getDayAllocation(dev.id, day).total > dev.capacity,
                'capacity-full': getDayAllocation(dev.id, day).total === dev.capacity
              }"
              :style="{ width: Math.min(100, (getDayAllocation(dev.id, day).total / dev.capacity) * 100) + '%' }"
            ></div>
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
const weekOffset = ref(0)

const roleOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Web', value: 'web' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Shopify', value: 'shopify' }
]

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

// Calculate the Monday of the current week based on weekOffset
const weekDates = computed(() => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset + (weekOffset.value * 7))
  monday.setHours(0, 0, 0, 0)
  
  const dates = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
})

const weekLabel = computed(() => {
  const start = weekDates.value[0]
  const end = weekDates.value[4]
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
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getDevCapacity(devId) {
  const dev = dataStore.developers.find(d => d.id === devId)
  return (parseInt(dev?.capacity) || 8)
}

function getRemainingHours(task) {
  const estimated = task.estimatedHours || 4
  const actual = task.actualHours || 0
  return Math.max(0, estimated - actual)
}

// Get all in-progress tasks for a developer that touch a specific day
// Uses actualHours to project remaining work from today forward
function getInProgressForDay(devId, date) {
  const capacity = getDevCapacity(devId)
  const dayStart = normalizeDate(date)
  const todayNorm = normalizeDate(new Date())
  
  const inProgressTasks = dataStore.tasks.filter(t => 
    t.assigneeId === devId && t.status === 'in-progress' && t.startedAt
  )
  
  return inProgressTasks.filter(task => {
    const taskStart = parseLocalDate(task.startedAt)
    if (isNaN(taskStart.getTime())) return false
    const taskStartNorm = normalizeDate(taskStart)
    
    // For past days: show original schedule (startedAt + estimatedHours)
    // For today and future: project based on remaining hours from today
    if (dayStart < todayNorm) {
      const hoursToAllocate = task.estimatedHours || 4
      const daysNeeded = Math.ceil(hoursToAllocate / capacity)
      const taskEnd = new Date(taskStartNorm)
      taskEnd.setDate(taskEnd.getDate() + daysNeeded)
      return dayStart >= taskStartNorm && dayStart < taskEnd
    } else {
      // Today and future: use remaining hours projected from today
      const remaining = getRemainingHours(task)
      if (remaining <= 0) {
        // Task should be done but hasn't been moved — still show on today
        return dayStart.getTime() === todayNorm.getTime()
      }
      const daysNeededFromToday = Math.ceil(remaining / capacity)
      const projectedEnd = new Date(todayNorm)
      projectedEnd.setDate(projectedEnd.getDate() + daysNeededFromToday)
      return dayStart >= todayNorm && dayStart < projectedEnd
    }
  })
}

// Get ready tasks projected into empty capacity slots from today onward
function getReadyForDay(devId, date) {
  const capacity = getDevCapacity(devId)
  const dayStart = normalizeDate(date)
  const todayNorm = normalizeDate(new Date())
  
  // Only show ready tasks from today onward (not in past days)
  if (dayStart < todayNorm) return []
  
  // Get all in-progress tasks for this developer
  const inProgressTasks = dataStore.tasks.filter(t => 
    t.assigneeId === devId && t.status === 'in-progress' && t.startedAt
  )
  
  // Get all ready tasks for this developer, sorted by createdAt (FIFO)
  const readyTasks = dataStore.tasks
    .filter(t => t.assigneeId === devId && t.status === 'ready')
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateA - dateB
    })
  
  if (readyTasks.length === 0) return []
  
  // Build a schedule from today to end of visible week (and a bit beyond for spanning)
  const schedule = buildReadySchedule(devId, inProgressTasks, readyTasks, capacity, todayNorm)
  
  // Return ready tasks that fall on this specific day
  const dateKey = dayStart.toISOString().split('T')[0]
  return schedule[dateKey] || []
}

// Build a schedule that fills ready tasks into empty slots
function buildReadySchedule(devId, inProgressTasks, readyTasks, capacity, startDate) {
  const schedule = {}
  
  // Calculate total 7 weeks ahead to handle large tasks spanning beyond visible week
  const totalDays = 49 // 7 weeks
  
  // For each day, calculate how much capacity is used by in-progress tasks
  const dailyInProgressHours = {}
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateKey = normalizeDate(d).toISOString().split('T')[0]
    dailyInProgressHours[dateKey] = 0
  }
  
  inProgressTasks.forEach(task => {
    const taskStart = parseLocalDate(task.startedAt)
    if (isNaN(taskStart.getTime())) return
    const taskStartNorm = normalizeDate(taskStart)
    
    // Use remaining hours (not full estimate) for today and future days
    const remaining = getRemainingHours(task)
    if (remaining <= 0) return // Task is effectively done
    
    // Project remaining work from today forward
    const daysNeededFromToday = Math.ceil(remaining / capacity)
    
    for (let day = 0; day < daysNeededFromToday; day++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + day)
      const dateKey = normalizeDate(d).toISOString().split('T')[0]
      if (dateKey in dailyInProgressHours) {
        const remainingAfterPrevDays = remaining - (day * capacity)
        const hoursThisDay = Math.min(capacity, remainingAfterPrevDays)
        dailyInProgressHours[dateKey] += hoursThisDay
      }
    }
  })
  
  // Fill ready tasks into remaining capacity, day by day
  const readyQueue = [...readyTasks]
  let currentTask = readyQueue.shift()
  let currentTaskRemaining = currentTask ? (currentTask.estimatedHours || 4) : 0
  const taskPlacements = {} // taskId -> [dateKeys]
  
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateKey = normalizeDate(d).toISOString().split('T')[0]
    
    const usedByInProgress = dailyInProgressHours[dateKey] || 0
    let remainingCapacity = Math.max(0, capacity - usedByInProgress)
    
    while (remainingCapacity > 0 && currentTask) {
      if (currentTaskRemaining <= remainingCapacity) {
        // Task fits entirely on this day
        if (!taskPlacements[currentTask.id]) taskPlacements[currentTask.id] = []
        taskPlacements[currentTask.id].push(dateKey)
        remainingCapacity -= currentTaskRemaining
        currentTask = readyQueue.shift()
        currentTaskRemaining = currentTask ? (currentTask.estimatedHours || 4) : 0
      } else {
        // Task overflows to next day
        currentTaskRemaining -= remainingCapacity
        if (!taskPlacements[currentTask.id]) taskPlacements[currentTask.id] = []
        taskPlacements[currentTask.id].push(dateKey)
        remainingCapacity = 0
      }
    }
  }
  
  // Build the schedule object
  for (const task of readyTasks) {
    const dateKeys = taskPlacements[task.id] || []
    for (const dateKey of dateKeys) {
      if (!schedule[dateKey]) schedule[dateKey] = []
      if (!schedule[dateKey].find(t => t.id === task.id)) {
        schedule[dateKey].push(task)
      }
    }
  }
  
  return schedule
}

// Calculate total allocation for a day (for capacity bar)
function getDayAllocation(devId, date) {
  const capacity = getDevCapacity(devId)
  const dayStart = normalizeDate(date)
  
  // In-progress hours on this day
  const inProgressTasks = getInProgressForDay(devId, date)
  const inProgressHours = inProgressTasks.reduce((sum, task) => {
    const hours = task.estimatedHours || 4
    // Pro-rate: how much of this task falls on this specific day
    const taskStart = parseLocalDate(task.startedAt)
    const taskStartNorm = normalizeDate(taskStart)
    const daysSinceStart = Math.floor((dayStart - taskStartNorm) / (1000 * 60 * 60 * 24))
    const hoursAllocatedBefore = daysSinceStart * capacity
    const remainingHours = Math.max(0, hours - hoursAllocatedBefore)
    return sum + Math.min(capacity, remainingHours)
  }, 0)
  
  // Ready hours on this day
  const readyTasks = getReadyForDay(devId, date)
  const readyHours = readyTasks.reduce((sum, task) => {
    return sum + (task.estimatedHours || 4)
  }, 0)
  
  return {
    inProgress: inProgressHours,
    ready: readyHours,
    total: Math.min(capacity, inProgressHours) + readyHours
  }
}

function isOverdue(task) {
  if (task.status !== 'in-progress' || !task.startedAt) return false
  const started = parseLocalDate(task.startedAt)
  if (isNaN(started.getTime())) return false
  const now = new Date()
  const daysElapsed = Math.floor((now - started) / (1000 * 60 * 60 * 24))
  const dev = dataStore.developers.find(d => d.id === task.assigneeId)
  const capacity = parseInt(dev?.capacity) || 8
  // Use remaining hours for overdue check
  const remaining = getRemainingHours(task)
  if (remaining <= 0) return false // effectively done
  const daysNeeded = Math.ceil(remaining / capacity)
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

.active-stat {
  background: #dbeafe;
  color: #1e40af;
}

.queued-stat {
  background: #fef3c7;
  color: #92400e;
}

/* Timeline Grid */
.timeline {
  display: grid;
  grid-template-columns: 100px repeat(5, 1fr);
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
  min-height: 80px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  min-width: 0;
  overflow: hidden;
}

.timeline-day-cell.is-today {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

/* Tasks */
.timeline-task {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 11px;
  background: #f1f5f9;
  border-left: 3px solid #94a3b8;
  min-width: 0;
  overflow: hidden;
}

/* In-progress tasks */
.task-inprogress.size-S {
  background: #f0fdf4;
  border-left-color: #22c55e;
}

.task-inprogress.size-M {
  background: #eff6ff;
  border-left-color: #3b82f6;
}

.task-inprogress.size-L {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.task-inprogress.size-XL {
  background: #fef2f2;
  border-left-color: #ef4444;
}

/* Ready tasks - semi-transparent, dashed */
.task-ready {
  opacity: 0.55;
  border-left-style: dashed !important;
}

.task-ready.size-S {
  background: #f0fdf4;
  border-left-color: #22c55e;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255,255,255,0.15) 5px,
    rgba(255,255,255,0.15) 10px
  );
}

.task-ready.size-M {
  background: #eff6ff;
  border-left-color: #3b82f6;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255,255,255,0.15) 5px,
    rgba(255,255,255,0.15) 10px
  );
}

.task-ready.size-L {
  background: #fffbeb;
  border-left-color: #f59e0b;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255,255,255,0.15) 5px,
    rgba(255,255,255,0.15) 10px
  );
}

.task-ready.size-XL {
  background: #fef2f2;
  border-left-color: #ef4444;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255,255,255,0.15) 5px,
    rgba(255,255,255,0.15) 10px
  );
}

.task-ready .task-title {
  font-style: italic;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
  max-height: 2.6em;
  min-width: 0;
}

.task-hours {
  color: #6b7280;
  font-weight: 600;
  flex-shrink: 0;
  font-size: 10px;
}

.task-hours-badge {
  background: #1e40af;
  color: white;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
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

.ready-label {
  background: #e5e7eb;
  color: #6b7280;
  font-size: 8px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 3px;
  flex-shrink: 0;
  text-transform: uppercase;
}

/* Capacity Bar */
.capacity-bar {
  height: 3px;
  background: #e5e7eb;
  border-radius: 2px;
  margin-top: auto;
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.capacity-fill.capacity-full {
  background: #22c55e;
}

.capacity-fill.capacity-over {
  background: #ef4444;
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
}
</style>