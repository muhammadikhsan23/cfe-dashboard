<template>
  <div class="projects-view">
    <div class="page-header">
      <h1>Running Projects</h1>
      <div class="header-actions">
        <Button v-if="authStore.isManager" label="Add Project" icon="pi pi-plus" @click="showProjectDialog = true" />
      </div>
    </div>
    
    <div class="projects-grid">
      <div v-for="project in dataStore.projects" :key="project.id" class="project-card" :class="project.health">
        <div class="project-header">
          <h3>{{ project.name }}</h3>
          <Tag :value="project.health" :severity="getHealthSeverity(project.health)" />
        </div>
        <p class="client">{{ project.client }}</p>
        <p class="description">{{ project.description }}</p>
        
        <div class="progress-section">
          <div class="progress-info">
            <span>Progress</span>
            <span>{{ getProjectProgress(project.id) }}%</span>
          </div>
          <ProgressBar :value="getProjectProgress(project.id)" :class="'progress-' + project.health" />
        </div>
        
        <div class="task-breakdown">
          <div class="task-stat">
            <span class="label">Tasks</span>
            <span class="value">{{ getProjectTaskCount(project.id) }}</span>
          </div>
          <div class="task-stat">
            <span class="label">Done</span>
            <span class="value text-success">{{ getProjectDoneCount(project.id) }}</span>
          </div>
          <div class="task-stat">
            <span class="label">In Progress</span>
            <span class="value text-warning">{{ getProjectInProgressCount(project.id) }}</span>
          </div>
        </div>
        
        <div class="assigned-roles">
          <Chip v-for="role in project.assignedRoles" :key="role" :label="getRoleLabel(role)" />
        </div>
        
        <div class="project-dates">
          <span class="date"><i class="pi pi-calendar"></i> {{ formatDate(project.startDate) }}</span>
          <span class="date"><i class="pi pi-calendar-plus"></i> {{ formatDate(project.endDate) }}</span>
        </div>
        
        <div v-if="authStore.isManager" class="project-actions">
          <Button icon="pi pi-pencil" text rounded size="small" @click="editProject(project)" />
          <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="deleteProject(project.id)" />
        </div>
      </div>
    </div>
    
    <!-- Project Dialog -->
    <Dialog v-model:visible="showProjectDialog" :header="editingProject ? 'Edit Project' : 'New Project'" modal :style="{ width: '500px' }">
      <div class="form-group">
        <label>Project Name</label>
        <InputText v-model="projectForm.name" class="full-width" />
      </div>
      <div class="form-group">
        <label>Client</label>
        <InputText v-model="projectForm.client" class="full-width" />
      </div>
      <div class="form-group">
        <label>Description</label>
        <Textarea v-model="projectForm.description" rows="3" class="full-width" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Start Date</label>
          <InputText v-model="projectForm.startDate" type="date" class="full-width" />
        </div>
        <div class="form-group">
          <label>End Date</label>
          <InputText v-model="projectForm.endDate" type="date" class="full-width" />
        </div>
      </div>
      <div class="form-group">
        <label>Health Status</label>
        <Dropdown v-model="projectForm.health" :options="healthOptions" optionLabel="label" optionValue="value" class="full-width" />
      </div>
      <div class="form-group">
        <label>Assigned Roles</label>
        <div class="role-checkboxes">
          <div class="role-checkbox-item" v-for="role in roleOptions" :key="role.value">
            <Checkbox v-model="projectForm.assignedRoles" :value="role.value" :inputId="'role-' + role.value" />
            <label :for="'role-' + role.value" class="role-checkbox-label">{{ role.label }}</label>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="closeProjectDialog" />
        <Button label="Save" @click="saveProject" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'

const authStore = useAuthStore()
const dataStore = useDataStore()

const showProjectDialog = ref(false)
const editingProject = ref(null)
const projectForm = ref({
  name: '', client: '', description: '', startDate: '', endDate: '', health: 'on-track', assignedRoles: []
})

const healthOptions = [
  { label: 'On Track', value: 'on-track' },
  { label: 'At Risk', value: 'at-risk' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Completed', value: 'completed' }
]

const roleOptions = [
  { label: 'Web', value: 'web' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Shopify', value: 'shopify' }
]

function getProjectProgress(projectId) {
  const tasks = dataStore.tasks.filter(t => t.projectId === projectId)
  if (tasks.length === 0) return 0
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
  if (totalHours === 0) return 0
  const doneHours = tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
  return Math.round((doneHours / totalHours) * 100)
}

function getProjectTaskCount(projectId) {
  return dataStore.tasks.filter(t => t.projectId === projectId).length
}

function getProjectDoneCount(projectId) {
  return dataStore.tasks.filter(t => t.projectId === projectId && t.status === 'done').length
}

function getProjectInProgressCount(projectId) {
  return dataStore.tasks.filter(t => t.projectId === projectId && t.status === 'in-progress').length
}

function getHealthSeverity(health) {
  const map = { 'on-track': 'success', 'at-risk': 'warn', 'blocked': 'danger', 'completed': 'info' }
  return map[health] || null
}

function getRoleLabel(role) {
  const labels = { web: 'Web', mobile: 'Mobile', shopify: 'Shopify' }
  return labels[role] || role
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function editProject(project) {
  editingProject.value = project
  projectForm.value = { ...project, assignedRoles: [...(project.assignedRoles || [])] }
  showProjectDialog.value = true
}

function closeProjectDialog() {
  editingProject.value = null
  projectForm.value = { name: '', client: '', description: '', startDate: '', endDate: '', health: 'on-track', assignedRoles: [] }
  showProjectDialog.value = false
}

async function saveProject() {
  if (!projectForm.value.name) return
  
  if (editingProject.value) {
    await dataStore.editProject(editingProject.value.id, projectForm.value)
  } else {
    const newProject = {
      id: 'proj-' + Date.now(),
      ...projectForm.value,
      status: 'active'
    }
    await dataStore.addProject(newProject)
  }
  closeProjectDialog()
}

async function deleteProject(id) {
  if (confirm('Delete this project?')) {
    await dataStore.deleteProject(id)
  }
}
</script>

<style scoped>
.projects-view {
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

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.project-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid;
  transition: transform 0.2s;
}

.project-card:hover {
  transform: translateY(-4px);
}

.project-card.on-track { border-left-color: #10b981; }
.project-card.at-risk { border-left-color: #f59e0b; }
.project-card.blocked { border-left-color: #ef4444; }
.project-card.completed { border-left-color: #06b6d4; }

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.project-header h3 {
  font-size: 16px;
  color: #1f2937;
  flex: 1;
}

.client {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.description {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 16px;
  line-height: 1.5;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.progress-on-track :deep(.p-progressbar-value) { background: #10b981; }
.progress-at-risk :deep(.p-progressbar-value) { background: #f59e0b; }
.progress-blocked :deep(.p-progressbar-value) { background: #ef4444; }
.progress-completed :deep(.p-progressbar-value) { background: #06b6d4; }

.task-breakdown {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.task-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.task-stat .label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
}

.task-stat .value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.assigned-roles {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.project-dates {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.project-dates .date i {
  margin-right: 4px;
}

.project-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
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

.role-checkboxes {
  display: flex;
  gap: 24px;
}

.role-checkbox-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.role-checkbox-label {
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}
</style>