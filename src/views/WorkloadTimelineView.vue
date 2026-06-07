<template>
  <div class="workload-timeline-view">
    <div class="page-header">
      <h1>Workload Timeline</h1>
      <div class="header-actions">
        <Dropdown v-model="roleFilter" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="All Roles" />
      </div>
    </div>
    
    <p class="page-description">Visual view of how tasks spread across the week for each developer</p>
    
    <!-- Developer Timeline Cards -->
    <div v-for="dev in filteredOccupancy" :key="dev.id" class="timeline-card">
      <div class="timeline-header">
        <div class="dev-name">{{ dev.name }} ({{ getRoleLabel(dev.role) }}) - {{ dev.capacity }}h/day capacity</div>
      </div>
      <div class="timeline">
        <div class="timeline-header-cell"></div>
        <div class="timeline-header-cell" v-for="day in weekDays" :key="day.key">{{ day.label }}</div>
        
        <div class="timeline-name-cell">{{ dev.name.split(' ')[0] }}</div>
        <div 
          v-for="(day, index) in getWeekDays(dev)" 
          :key="index" 
          class="timeline-day-cell"
        >
          <div 
            v-for="task in day.tasks" 
            :key="task.id" 
            class="timeline-task"
            :class="'size-' + task.size"
          >
            {{ task.title }} (Day {{ day.dayNum }})
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

const roleOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Web', value: 'web' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Shopify', value: 'shopify' }
]

const weekDays = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' }
]

const filteredOccupancy = computed(() => {
  if (!roleFilter.value) return dataStore.developerOccupancy
  return dataStore.developerOccupancy.filter(d => d.role === roleFilter.value)
})

function getRoleLabel(role) {
  const labels = { web: 'Web', mobile: 'Mobile', shopify: 'Shopify' }
  return labels[role] || role
}

function getWeekDays(dev) {
  // Get all tasks assigned to this developer (active + queued)
  const allTasks = dataStore.tasks.filter(t => 
    t.assigneeId === dev.id && 
    (t.status === 'in-progress' || t.status === 'review' || t.status === 'backlog' || t.status === 'ready')
  )
  
  // Sort tasks by creation date to simulate scheduling order
  const sortedTasks = [...allTasks].sort((a, b) => {
    if (a.status === 'in-progress' || a.status === 'review') return -1
    return 1
  })
  
  // Distribute tasks across days based on estimated hours
  const capacity = dev.capacity || 8
  let currentDay = 1
  let dayTasks = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }
  
  for (const task of sortedTasks) {
    const taskHours = task.estimatedHours || 4
    let hoursToAllocate = taskHours
    let startDay = currentDay
    
    // Find the day with available capacity
    while (hoursToAllocate > 0 && startDay <= 7) {
      const dayUsed = dayTasks[startDay].reduce((sum, t) => sum + (t._allocatedHours || 0), 0)
      const dayAvailable = capacity - dayUsed
      
      if (dayAvailable > 0) {
        const allocated = Math.min(hoursToAllocate, dayAvailable)
        dayTasks[startDay].push({ ...task, _allocatedHours: allocated })
        hoursToAllocate -= allocated
        currentDay = startDay
      } else {
        startDay++
      }
    }
  }
  
  // Return the weekDays from outer scope with task data
  return weekDays.map((day, index) => ({
    ...day,
    dayNum: index + 1,
    tasks: dayTasks[index + 1] || []
  }))
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

.page-description {
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 24px;
}

.timeline-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.timeline-header {
  margin-bottom: 12px;
}

.dev-name {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.timeline {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  gap: 4px;
}

.timeline-header-cell {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  padding: 8px;
}

.timeline-name-cell {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  padding: 8px 4px;
  display: flex;
  align-items: center;
}

.timeline-day-cell {
  background: #f8fafc;
  border-radius: 4px;
  padding: 4px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-task {
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: #1e40af;
  background: #dbeafe;
}

.timeline-task.size-XL {
  background: #fee2e2;
  color: #991b1b;
}

.timeline-task.size-L {
  background: #fef3c7;
  color: #92400e;
}

.timeline-task.size-M {
  background: #dbeafe;
  color: #1e40af;
}

.timeline-task.size-S {
  background: #dcfce7;
  color: #166534;
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