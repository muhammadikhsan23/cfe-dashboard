<template>
  <div class="kanban-view">
    <div class="page-header">
      <h1>Kanban Board</h1>
      <div class="header-actions">
        <Dropdown v-model="roleFilter" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="All Roles" @change="onRoleChange" />
        <Dropdown v-model="developerFilter" :options="developerOptions" optionLabel="label" optionValue="value" placeholder="All Developers" filter />
        <Button label="Add Task" icon="pi pi-plus" @click="showTaskDialog = true" />
      </div>
    </div>
    
    <div class="kanban-board">
      <div v-for="column in columns" :key="column.status" class="kanban-column">
        <div class="column-header">
          <h3>{{ column.title }}</h3>
          <span class="task-count">{{ getTasksByStatus(column.status).length }}</span>
        </div>
        <div class="column-content">
          <div v-for="task in getTasksByStatus(column.status)" :key="task.id" class="kanban-card" @click="editTask(task)">
            <div class="card-header">
              <span class="size-badge" :class="'size-' + task.size">{{ task.size }}</span>
              <span class="priority-dot" :class="'priority-' + task.priority"></span>
            </div>
            <h4 class="task-title">{{ task.title }}</h4>
            <div class="card-meta">
              <span class="assignee">{{ getDeveloperName(task.assigneeId) }}</span>
              <span class="project">{{ getProjectName(task.projectId) }}</span>
            </div>
            <div class="card-footer">
              <Tag :value="task.size + ' (' + task.estimatedHours + 'h)'" severity="secondary" />
              <span class="days-badge" :class="getDaysBadgeClass(task)">
                ~{{ getEstimatedDays(task) }}d
              </span>
              <span v-if="task.actualHours > 0" class="actual-hours-badge">
                <i class="pi pi-clock"></i> {{ task.actualHours }}h
              </span>
              <span v-if="task.reworkCount > 0" class="rework-badge">
                <i class="pi pi-refresh"></i> {{ task.reworkCount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Task Dialog -->
    <Dialog v-model:visible="showTaskDialog" :header="editingTask ? 'Edit Task' : 'New Task'" modal :style="{ width: '600px' }">
      <div class="task-form">
        <div class="form-group">
          <label>Title</label>
          <InputText v-model="taskForm.title" class="full-width" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Project</label>
            <Dropdown v-model="taskForm.projectId" :options="projectOptions" optionLabel="name" optionValue="id" placeholder="Select Project" class="full-width" filter showClear :overlayStyle="{ maxWidth: '300px' }" />
          </div>
          <div class="form-group">
            <label>Assignee</label>
            <Dropdown v-model="taskForm.assigneeId" :options="filteredDevelopers" optionLabel="name" optionValue="id" placeholder="Select Developer" class="full-width" filter :overlayStyle="{ maxWidth: '300px' }" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <Dropdown v-model="taskForm.status" :options="statusOptions" optionLabel="label" optionValue="value" class="full-width" />
          </div>
          <div class="form-group">
            <label>Size</label>
            <div class="size-field">
              <Dropdown v-model="taskForm.size" :options="sizeOptions" optionLabel="label" optionValue="value" class="full-width" @change="onSizeChange" />
              <span class="size-hint" v-if="taskForm.size">{{ getSizeHint(taskForm.size) }}</span>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Priority</label>
            <Dropdown v-model="taskForm.priority" :options="priorityOptions" optionLabel="label" optionValue="value" class="full-width" />
          </div>
          <div class="form-group">
            <label>Est. Hours</label>
            <InputNumber v-model="taskForm.estimatedHours" class="full-width" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Actual Hours</label>
            <InputNumber v-model="taskForm.actualHours" class="full-width" :min="0" :step="0.5" placeholder="Enter actual hours" />
            <span v-if="formError" class="error-text">{{ formError }}</span>
          </div>
          <div class="form-group">
            <label>Rework Count</label>
            <InputNumber v-model="taskForm.reworkCount" class="full-width" :min="0" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="closeTaskDialog" />
        <Button v-if="authStore.isManager" label="Delete" severity="danger" @click="confirmDeleteTask" />
        <Button label="Save" @click="saveTask" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'

const authStore = useAuthStore()
const dataStore = useDataStore()

const roleFilter = ref('')
const developerFilter = ref('')
const roleOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Web', value: 'web' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Shopify', value: 'shopify' }
]

const columns = [
  { title: 'Backlog', status: 'backlog' },
  { title: 'Ready', status: 'ready' },
  { title: 'In Progress', status: 'in-progress' },
  { title: 'Review', status: 'review' },
  { title: 'Done', status: 'done' }
]

const statusOptions = columns.map(c => ({ label: c.title, value: c.status }))
const sizeOptions = [
  { label: 'S (2-4h)', value: 'S' },
  { label: 'M (4-8h)', value: 'M' },
  { label: 'L (8-16h)', value: 'L' },
  { label: 'XL (16-32h)', value: 'XL' }
]
const priorityOptions = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
]

const showTaskDialog = ref(false)
const editingTask = ref(null)
const formError = ref('')
const taskForm = ref({
  title: '', projectId: '', assigneeId: '', status: 'backlog', size: 'M', priority: 'medium', estimatedHours: 6, actualHours: 0, reworkCount: 0
})

const filteredDevelopers = computed(() => {
  if (!roleFilter.value) return dataStore.developers
  return dataStore.developers.filter(d => d.role === roleFilter.value)
})

const developerOptions = computed(() => {
  const devs = filteredDevelopers.value
  return [
    { label: 'All Developers', value: '' },
    ...devs.map(d => ({ label: d.name, value: d.id }))
  ]
})

const projectOptions = computed(() => {
  return [
    { name: '— No Project —', id: '' },
    ...dataStore.projects
  ]
})

const filteredTasks = computed(() => {
  let tasks = dataStore.tasks
  if (roleFilter.value) {
    tasks = tasks.filter(t => {
      const assignee = dataStore.developers.find(d => d.id === t.assigneeId)
      return assignee?.role === roleFilter.value
    })
  }
  if (developerFilter.value) tasks = tasks.filter(t => t.assigneeId === developerFilter.value)
  return tasks
})

function onRoleChange() {
  // Reset developer filter when role changes to avoid invalid selection
  developerFilter.value = ''
}

function getTasksByStatus(status) {
  return filteredTasks.value.filter(t => t.status === status)
}

function getDeveloperName(id) {
  return dataStore.developers.find(d => d.id === id)?.name || 'Unassigned'
}

function getProjectName(id) {
  return dataStore.projects.find(p => p.id === id)?.name || '-'
}

function editTask(task) {
  if (!authStore.isManager && task.status === 'done') return
  editingTask.value = task
  taskForm.value = { ...task, actualHours: task.actualHours || 0, reworkCount: task.reworkCount || 0 }
  formError.value = ''
  showTaskDialog.value = true
}

function closeTaskDialog() {
  editingTask.value = null
  formError.value = ''
  taskForm.value = { title: '', projectId: '', assigneeId: '', status: 'backlog', size: 'M', priority: 'medium', estimatedHours: 6, actualHours: 0, reworkCount: 0 }
  showTaskDialog.value = false
}

async function saveTask() {
  if (!taskForm.value.title) return
  
  // Validate actual hours when marking as done
  formError.value = ''
  if (taskForm.value.status === 'done' && (!taskForm.value.actualHours || taskForm.value.actualHours <= 0)) {
    formError.value = 'Please enter actual hours before marking as done'
    return
  }
  
  if (editingTask.value) {
    // Update completion date when marking as done
    const updates = {
      ...taskForm.value,
      completedAt: taskForm.value.status === 'done' && editingTask.value.status !== 'done' 
        ? new Date().toISOString().split('T')[0] 
        : editingTask.value.completedAt
    }
    await dataStore.editTask(editingTask.value.id, updates)
  } else {
    const now = new Date().toISOString().split('T')[0]
    const newTask = {
      ...taskForm.value,
      role: getDeveloperRole(taskForm.value.assigneeId),
      actualHours: taskForm.value.actualHours || 0,
      reworkCount: taskForm.value.reworkCount || 0,
      createdAt: now,
      startedAt: taskForm.value.status !== 'backlog' && taskForm.value.status !== 'ready' ? now : null,
      completedAt: taskForm.value.status === 'done' ? now : null
    }
    await dataStore.addTask(newTask)
  }
  closeTaskDialog()
}

async function confirmDeleteTask() {
  if (editingTask.value && authStore.isManager) {
    if (confirm(`Delete task "${editingTask.value.title}"?`)) {
      await dataStore.deleteTask(editingTask.value.id)
      closeTaskDialog()
    }
  }
}

function getDeveloperRole(developerId) {
  return dataStore.developers.find(d => d.id === developerId)?.role || 'web'
}

const sizeHoursMap = { S: 3, M: 6, L: 12, XL: 24 }
const sizeHints = { S: '2-4 hours', M: '4-8 hours', L: '8-16 hours', XL: '16-32 hours' }

function onSizeChange() {
  taskForm.value.estimatedHours = sizeHoursMap[taskForm.value.size] || 6
}

function getSizeHint(size) {
  return sizeHints[size] || ''
}

function getDeveloperCapacity(developerId) {
  const dev = dataStore.developers.find(d => d.id === developerId)
  return dev?.capacity || 8
}

function getEstimatedDays(task) {
  const hours = task.estimatedHours || 0
  const capacity = getDeveloperCapacity(task.assigneeId)
  return Math.max(1, Math.ceil(hours / capacity))
}

function getDaysBadgeClass(task) {
  const days = getEstimatedDays(task)
  if (days >= 4) return 'days-overloaded'
  if (days >= 2) return 'days-heavy'
  return 'days-normal'
}
</script>

<style scoped>
.kanban-view {
  max-width: 1600px;
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  min-height: 600px;
}

.kanban-column {
  background: #f1f5f9;
  border-radius: 12px;
  padding: 16px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.column-header h3 {
  font-size: 14px;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.task-count {
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.column-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 300px;
}

.kanban-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.size-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
}

.size-S { background: #dcfce7; color: #166534; }
.size-M { background: #dbeafe; color: #1e40af; }
.size-L { background: #fef3c7; color: #92400e; }
.size-XL { background: #fee2e2; color: #991b1b; }

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.priority-urgent { background: #ef4444; }
.priority-high { background: #f97316; }
.priority-medium { background: #3b82f6; }
.priority-low { background: #6b7280; }

.kanban-card h4 {
  font-size: 13px;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.4;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 8px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rework-badge {
  color: #f59e0b;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-form {
  padding: 16px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.full-width {
  width: 100%;
}

.field-hint {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #6b7280;
  font-style: italic;
}

.size-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.size-hint {
  font-size: 11px;
  color: #6b7280;
  font-style: italic;
  min-height: 16px;
}

.days-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.days-normal { background: #e0e7ff; color: #3730a3; }
.days-heavy { background: #fef3c7; color: #92400e; }
.days-overloaded { background: #fee2e2; color: #991b1b; }

.actual-hours-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  background: #dcfce7;
  color: #166534;
}

.error-text {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #ef4444;
  font-style: normal;
}

@media (max-width: 1200px) {
  .kanban-board {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
}
</style>