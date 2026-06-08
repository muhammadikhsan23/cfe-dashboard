<template>
  <div class="admin-view">
    <div class="page-header">
      <h1>Admin Panel</h1>
    </div>
    
    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="developers"><i class="pi pi-users"></i> Developers</Tab>
        <Tab value="tasks"><i class="pi pi-list"></i> All Tasks</Tab>
        <Tab value="projects"><i class="pi pi-briefcase"></i> All Projects</Tab>
        <Tab value="reports"><i class="pi pi-file"></i> Reports</Tab>
        <Tab value="settings"><i class="pi pi-cog"></i> Settings</Tab>
      </TabList>
      
      <TabPanels>
        <!-- Developers Management -->
        <TabPanel value="developers">
          <div class="panel-header">
            <h3>Developer Management</h3>
            <div class="actions">
              <Button label="Export CSV" icon="pi pi-download" severity="secondary" @click="exportDevelopersCSV" />
              <Button label="Import CSV" icon="pi pi-upload" severity="secondary" @click="triggerImport('developers')" />
              <Button label="Add Developer" icon="pi pi-plus" @click="showDevDialog = true" />
            </div>
          </div>
          <input type="file" ref="developersFileInput" accept=".csv,.json" style="display:none" @change="handleImport($event, 'developers')" />
          <DataTable :value="dataStore.developers" stripedRows>
            <Column field="name" header="Name" />
            <Column field="role" header="Role">
              <template #body="{ data }">
                <Tag :value="getRoleLabel(data.role)" />
              </template>
            </Column>
            <Column field="level" header="Level">
              <template #body="{ data }">
                <Tag :value="getLevelLabel(data.level)" :severity="getLevelSeverity(data.level)" />
              </template>
            </Column>
            <Column field="type" header="Type">
              <template #body="{ data }">
                <Tag :value="data.type === 'staff' ? 'Staff' : 'Outsource'" :severity="data.type === 'staff' ? 'success' : 'warn'" />
              </template>
            </Column>
            <Column field="capacity" header="Capacity (h/day)" />
            <Column field="skills" header="Skills">
              <template #body="{ data }">
                <span>{{ (data.skills || []).join(', ') }}</span>
              </template>
            </Column>
            <Column header="Actions">
              <template #body="{ data }">
                <Button icon="pi pi-pencil" text rounded size="small" @click="editDeveloper(data)" />
                <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="deleteDeveloper(data.id)" />
              </template>
            </Column>
          </DataTable>
        </TabPanel>
        
        <!-- All Tasks -->
        <TabPanel value="tasks">
          <div class="panel-header">
            <h3>All Tasks</h3>
            <div class="actions">
              <Button label="Export CSV" icon="pi pi-download" severity="secondary" @click="exportTasksCSV" />
              <Button label="Import CSV" icon="pi pi-upload" severity="secondary" @click="triggerImport('tasks')" />
              <Button label="Add Task" icon="pi pi-plus" @click="showTaskDialog = true" />
            </div>
          </div>
          <input type="file" ref="tasksFileInput" accept=".csv,.json" style="display:none" @change="handleImport($event, 'tasks')" />
          <DataTable :value="dataStore.tasks" stripedRows sortField="createdAt" :sortOrder="-1">
            <Column field="title" header="Title" />
            <Column field="status" header="Status">
              <template #body="{ data }">
                <Tag :value="formatStatus(data.status)" :severity="getStatusSeverity(data.status)" />
              </template>
            </Column>
            <Column field="size" header="Size">
              <template #body="{ data }">
                <span class="size-badge" :class="'size-' + data.size">{{ data.size }}</span>
              </template>
            </Column>
            <Column field="priority" header="Priority">
              <template #body="{ data }">
                <span :class="'priority-' + data.priority">{{ capitalize(data.priority) }}</span>
              </template>
            </Column>
            <Column field="assigneeId" header="Assignee">
              <template #body="{ data }">
                {{ getDeveloperName(data.assigneeId) }}
              </template>
            </Column>
            <Column field="projectId" header="Project">
              <template #body="{ data }">
                {{ getProjectName(data.projectId) }}
              </template>
            </Column>
            <Column field="estimatedHours" header="Est. Hours" />
            <Column field="reworkCount" header="Rework" />
            <Column header="Actions">
              <template #body="{ data }">
                <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="deleteTask(data.id)" />
              </template>
            </Column>
          </DataTable>
        </TabPanel>
        
        <!-- All Projects -->
        <TabPanel value="projects">
          <div class="panel-header">
            <h3>All Projects</h3>
            <div class="actions">
              <Button label="Export CSV" icon="pi pi-download" severity="secondary" @click="exportProjectsCSV" />
              <Button label="Import CSV" icon="pi pi-upload" severity="secondary" @click="triggerImport('projects')" />
              <Button label="Add Project" icon="pi pi-plus" @click="showProjectDialog = true" />
            </div>
          </div>
          <input type="file" ref="projectsFileInput" accept=".csv,.json" style="display:none" @change="handleImport($event, 'projects')" />
          <DataTable :value="dataStore.projects" stripedRows>
            <Column field="name" header="Name" />
            <Column field="client" header="Client" />
            <Column field="health" header="Health">
              <template #body="{ data }">
                <Tag :value="data.health" :severity="getHealthSeverity(data.health)" />
              </template>
            </Column>
            <Column field="startDate" header="Start Date" />
            <Column field="endDate" header="End Date" />
            <Column header="Actions">
              <template #body="{ data }">
                <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="deleteProject(data.id)" />
              </template>
            </Column>
          </DataTable>
        </TabPanel>
        
        <!-- Reports -->
        <TabPanel value="reports">
          <div class="panel-header">
            <h3>Developer Evaluation Report</h3>
            <div class="actions">
              <Button label="Export Report" icon="pi pi-download" severity="secondary" @click="exportReport" />
            </div>
          </div>
          <div class="report-grid">
            <div v-for="dev in dataStore.developerEffectiveness" :key="dev.id" class="report-card">
              <div class="report-header">
                <h4>{{ dev.name }}</h4>
                <span class="effectiveness-rating" :class="'rating-' + dev.rating">{{ dev.effectivenessScore }}</span>
              </div>
              <div class="report-metrics">
                <div class="metric-row">
                  <span class="metric-label">Completion Rate</span>
                  <span class="metric-value">{{ dev.metrics.completionRate }}%</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Quality Score</span>
                  <span class="metric-value">{{ dev.metrics.qualityScore }}%</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">On-Time Delivery</span>
                  <span class="metric-value">{{ dev.metrics.onTimeDelivery }}%</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Cycle Time Efficiency</span>
                  <span class="metric-value">{{ dev.metrics.cycleTimeEfficiency }}%</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Consistency</span>
                  <span class="metric-value">{{ dev.metrics.consistency }}%</span>
                </div>
              </div>
              <div class="report-summary">
                <p><strong>Tasks Completed:</strong> {{ dev.completedTasks }} / {{ dev.totalTasks }}</p>
                <p><strong>Rating:</strong> {{ getRatingLabel(dev.rating) }}</p>
                <p><strong>Level:</strong> {{ getLevelLabel(dev.level) }}</p>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <!-- Settings -->
        <TabPanel value="settings">
          <div class="panel-header">
            <h3>Data Management</h3>
          </div>
          <div class="settings-section">
            <div class="setting-card primary">
              <h4>Backup All Data</h4>
              <p>Export complete database as JSON (developers, tasks, projects)</p>
              <div class="btn-row">
                <Button label="Export Backup" icon="pi pi-download" @click="exportAllData" />
                <Button label="Import Backup" icon="pi pi-upload" severity="secondary" @click="triggerImport('all')" />
              </div>
              <input type="file" ref="allFileInput" accept=".json" style="display:none" @change="handleImport($event, 'all')" />
            </div>
            <div class="setting-card warn">
              <h4>Delete All Tasks</h4>
              <p>Remove all tasks but keep developers and projects</p>
              <Button label="Delete All Tasks" icon="pi pi-trash" severity="warn" @click="deleteAllTasksAction" />
            </div>
            <div class="setting-card">
              <h4>Reset Sample Data</h4>
              <p>Restore all data to default sample data</p>
              <Button label="Reset Data" icon="pi pi-refresh" severity="warn" @click="resetSampleData" />
            </div>
            <div class="setting-card danger">
              <h4>Delete All Data</h4>
              <p>This action cannot be undone</p>
              <Button label="Delete All" icon="pi pi-trash" severity="danger" @click="clearAllData" />
            </div>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
    
    <!-- Developer Dialog -->
    <Dialog v-model:visible="showDevDialog" :header="editingDev ? 'Edit Developer' : 'Add Developer'" modal :style="{ width: '500px' }">
      <div class="form-group">
        <label>Name</label>
        <InputText v-model="devForm.name" class="full-width" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Role</label>
          <Dropdown v-model="devForm.role" :options="devRoleOptions" optionLabel="label" optionValue="value" class="full-width" />
        </div>
        <div class="form-group">
          <label>Type</label>
          <Dropdown v-model="devForm.type" :options="devTypeOptions" optionLabel="label" optionValue="value" class="full-width" />
        </div>
      </div>
      <div class="form-group">
        <label>Level</label>
        <Dropdown v-model="devForm.level" :options="devLevelOptions" optionLabel="label" optionValue="value" class="full-width" @change="onLevelChange" />
      </div>
      <div class="form-group">
        <label>Daily Capacity (hours)</label>
        <InputNumber v-model="devForm.capacity" class="full-width" />
      </div>
      <div class="form-group">
        <label>Skills (comma separated)</label>
        <InputText v-model="devForm.skillsStr" class="full-width" />
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="closeDevDialog" />
        <Button label="Save" @click="saveDeveloper" />
      </template>
    </Dialog>

    <!-- Task Dialog -->
    <Dialog v-model:visible="showTaskDialog" :header="editingTask ? 'Edit Task' : 'Add Task'" modal :style="{ width: '600px' }">
      <div class="form-group">
        <label>Title</label>
        <InputText v-model="taskForm.title" class="full-width" />
      </div>
      <div class="form-row">
          <div class="form-group">
            <label>Project</label>
            <Dropdown v-model="taskForm.projectId" :options="dataStore.projects" optionLabel="name" optionValue="id" placeholder="Select project" class="full-width" filter :overlayStyle="{ maxWidth: '300px' }" />
          </div>
          <div class="form-group">
            <label>Assignee</label>
            <Dropdown v-model="taskForm.assigneeId" :options="dataStore.developers" optionLabel="name" optionValue="id" placeholder="Select developer" class="full-width" filter :overlayStyle="{ maxWidth: '300px' }" />
          </div>
      </div>
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <Dropdown v-model="taskForm.status" :options="statusOptions" optionLabel="label" optionValue="value" class="full-width" />
          </div>
          <div class="form-group">
            <label>Size</label>
            <Dropdown v-model="taskForm.size" :options="sizeOptions" optionLabel="label" optionValue="value" class="full-width" @change="onSizeChange" />
            <small class="field-hint" v-if="taskForm.size">{{ getSizeHint(taskForm.size) }}</small>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Priority</label>
            <Dropdown v-model="taskForm.priority" :options="priorityOptions" optionLabel="label" optionValue="value" class="full-width" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <Dropdown v-model="taskForm.role" :options="devRoleOptions" optionLabel="label" optionValue="value" class="full-width" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Estimated Hours (auto-filled from size)</label>
            <InputNumber v-model="taskForm.estimatedHours" class="full-width" />
          </div>
          <div class="form-group">
            <label>Rework Count</label>
            <InputNumber v-model="taskForm.reworkCount" class="full-width" />
          </div>
        </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="closeTaskDialog" />
        <Button label="Save" @click="saveTask" />
      </template>
    </Dialog>

    <!-- Project Dialog -->
    <Dialog v-model:visible="showProjectDialog" :header="editingProject ? 'Edit Project' : 'Add Project'" modal :style="{ width: '500px' }">
      <div class="form-group">
        <label>Name</label>
        <InputText v-model="projectForm.name" class="full-width" />
      </div>
      <div class="form-group">
        <label>Client</label>
        <InputText v-model="projectForm.client" class="full-width" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Health</label>
          <Dropdown v-model="projectForm.health" :options="healthOptions" optionLabel="label" optionValue="value" class="full-width" />
        </div>
        <div class="form-group">
          <label>Status</label>
          <Dropdown v-model="projectForm.status" :options="projectStatusOptions" optionLabel="label" optionValue="value" class="full-width" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Start Date</label>
          <InputText v-model="projectForm.startDate" placeholder="YYYY-MM-DD" class="full-width" />
        </div>
        <div class="form-group">
          <label>End Date</label>
          <InputText v-model="projectForm.endDate" placeholder="YYYY-MM-DD" class="full-width" />
        </div>
      </div>
      <div class="form-group">
        <label>Assigned Roles</label>
        <div class="role-checkboxes">
          <div class="role-checkbox-item">
            <Checkbox v-model="projectForm.roles" value="web" inputId="role-web" />
            <label for="role-web" class="role-checkbox-label">Web</label>
          </div>
          <div class="role-checkbox-item">
            <Checkbox v-model="projectForm.roles" value="mobile" inputId="role-mobile" />
            <label for="role-mobile" class="role-checkbox-label">Mobile</label>
          </div>
          <div class="role-checkbox-item">
            <Checkbox v-model="projectForm.roles" value="shopify" inputId="role-shopify" />
            <label for="role-shopify" class="role-checkbox-label">Shopify</label>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <Textarea v-model="projectForm.description" class="full-width" rows="3" />
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="closeProjectDialog" />
        <Button label="Save" @click="saveProject" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/data'

const dataStore = useDataStore()

const activeTab = ref('developers')
const showDevDialog = ref(false)
const showTaskDialog = ref(false)
const showProjectDialog = ref(false)
const editingDev = ref(null)
const editingTask = ref(null)
const editingProject = ref(null)

const developersFileInput = ref(null)
const tasksFileInput = ref(null)
const projectsFileInput = ref(null)
const allFileInput = ref(null)

const devForm = ref({ name: '', role: 'web', type: 'staff', level: 'mid', capacity: 7, skillsStr: '' })
const taskForm = ref({ title: '', projectId: '', assigneeId: '', role: 'web', status: 'backlog', size: 'M', priority: 'medium', estimatedHours: 0, reworkCount: 0 })
const projectForm = ref({ name: '', client: '', status: 'active', health: 'on-track', startDate: '', endDate: '', roles: [], description: '' })

const devRoleOptions = [
  { label: 'Web', value: 'web' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Shopify', value: 'shopify' }
]

const devTypeOptions = [
  { label: 'Staff', value: 'staff' },
  { label: 'Outsource', value: 'outsource' }
]

const devLevelOptions = [
  { label: 'Junior (6h/day)', value: 'junior' },
  { label: 'Mid (7h/day)', value: 'mid' },
  { label: 'Senior (8h/day)', value: 'senior' },
  { label: 'Lead (6h/day)', value: 'lead' }
]

const statusOptions = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'Ready', value: 'ready' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Review', value: 'review' },
  { label: 'Done', value: 'done' },
  { label: 'Blocked', value: 'blocked' }
]

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

const healthOptions = [
  { label: 'On Track', value: 'on-track' },
  { label: 'At Risk', value: 'at-risk' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Completed', value: 'completed' }
]

const projectStatusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'On Hold', value: 'on-hold' },
  { label: 'Completed', value: 'completed' }
]

const levelCapacity = { junior: 6, mid: 7, senior: 8, lead: 6 }

function getRoleLabel(role) {
  const labels = { web: 'Web', mobile: 'Mobile', shopify: 'Shopify' }
  return labels[role] || role
}

function getLevelLabel(level) {
  const labels = { junior: 'Junior', mid: 'Mid', senior: 'Senior', lead: 'Lead' }
  return labels[level] || level
}

function getLevelSeverity(level) {
  const map = { junior: 'info', mid: 'success', senior: 'contrast', lead: 'warn' }
  return map[level] || null
}

function capitalize(str) {
  return str?.charAt(0).toUpperCase() + str?.slice(1)
}

function formatStatus(status) {
  return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getStatusSeverity(status) {
  const map = { 'backlog': 'secondary', 'ready': 'info', 'in-progress': 'warn', 'review': 'contrast', 'done': 'success', 'blocked': 'danger' }
  return map[status] || null
}

function getHealthSeverity(health) {
  const map = { 'on-track': 'success', 'at-risk': 'warn', 'blocked': 'danger', 'completed': 'info' }
  return map[health] || null
}

function getDeveloperName(id) {
  return dataStore.developers.find(d => d.id === id)?.name || 'Unassigned'
}

function getProjectName(id) {
  return dataStore.projects.find(p => p.id === id)?.name || '-'
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

// =================== CSV EXPORT ===================

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCSV(val) {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function exportDevelopersCSV() {
  const headers = ['Name', 'Role', 'Level', 'Type', 'Capacity', 'Skills']
  const rows = dataStore.developers.map(d => [
    d.name, d.role, d.level || '', d.type, d.capacity, (d.skills || []).join('; ')
  ])
  const csv = [headers, ...rows].map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadFile(csv, 'developers-export.csv', 'text/csv')
}

function exportTasksCSV() {
  const headers = ['Title', 'Status', 'Size', 'Priority', 'Assignee', 'Project', 'Est. Hours', 'Actual Hours', 'Rework', 'Created', 'Started', 'Completed']
  const rows = dataStore.tasks.map(t => [
    t.title, t.status, t.size, t.priority,
    getDeveloperName(t.assigneeId), getProjectName(t.projectId),
    t.estimatedHours, t.actualHours || 0, t.reworkCount || 0,
    t.createdAt, t.startedAt || '', t.completedAt || ''
  ])
  const csv = [headers, ...rows].map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadFile(csv, 'tasks-export.csv', 'text/csv')
}

function exportProjectsCSV() {
  const headers = ['Name', 'Client', 'Status', 'Health', 'Start Date', 'End Date', 'Assigned Roles', 'Description']
  const rows = dataStore.projects.map(p => [
    p.name, p.client, p.status, p.health,
    p.startDate, p.endDate, (p.assignedRoles || []).join('; '), p.description || ''
  ])
  const csv = [headers, ...rows].map(r => r.map(escapeCSV).join(',')).join('\n')
  downloadFile(csv, 'projects-export.csv', 'text/csv')
}

function exportReport() {
  const devs = dataStore.developerEffectiveness
  let text = 'DEVELOPER EVALUATION REPORT\n'
  text += '='.repeat(50) + '\nGenerated: ' + new Date().toLocaleString() + '\n\n'
  
  for (const dev of devs) {
    text += `${dev.name} - Score: ${dev.effectivenessScore} (${getRatingLabel(dev.rating)})\n`
    text += `  Level: ${getLevelLabel(dev.level)} | Type: ${dev.type}\n`
    text += `  Completion Rate: ${dev.metrics.completionRate}%\n`
    text += `  Quality Score: ${dev.metrics.qualityScore}%\n`
    text += `  On-Time Delivery: ${dev.metrics.onTimeDelivery}%\n`
    text += `  Cycle Time Efficiency: ${dev.metrics.cycleTimeEfficiency}%\n`
    text += `  Consistency: ${dev.metrics.consistency}%\n`
    text += `  Tasks Completed: ${dev.completedTasks}/${dev.totalTasks}\n`
    text += '-'.repeat(30) + '\n'
  }
  
  downloadFile(text, 'evaluation-report.txt', 'text/plain')
}

function exportAllData() {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    developers: dataStore.developers,
    tasks: dataStore.tasks,
    projects: dataStore.projects
  }
  const json = JSON.stringify(backup, null, 2)
  const date = new Date().toISOString().split('T')[0]
  downloadFile(json, `cfe-backup-${date}.json`, 'application/json')
}

// =================== CSV/JSON IMPORT ===================

function triggerImport(type) {
  const refs = {
    developers: developersFileInput,
    tasks: tasksFileInput,
    projects: projectsFileInput,
    all: allFileInput
  }
  refs[type]?.value?.click()
}

async function handleImport(event, type) {
  const file = event.target.files[0]
  if (!file) return

  const text = await file.text()

  if (file.name.endsWith('.json')) {
    handleJSONImport(text, type)
  } else {
    handleCSVImport(text, type)
  }
  event.target.value = ''
}

async function handleJSONImport(text, type) {
  try {
    const data = JSON.parse(text)
    
    if (type === 'all') {
      if (!confirm('This will replace ALL current data with the backup. Continue?')) return
      if (data.developers) {
        for (const dev of data.developers) {
          await dataStore.addDeveloper(dev)
        }
      }
      if (data.projects) {
        for (const proj of data.projects) {
          await dataStore.addProject(proj)
        }
      }
      if (data.tasks) {
        for (const task of data.tasks) {
          await dataStore.addTask(task)
        }
      }
      alert('Backup imported successfully!')
    } else if (type === 'developers' && Array.isArray(data)) {
      for (const dev of data) {
        if (dev.name && dev.role) {
          await dataStore.addDeveloper(dev)
        }
      }
      alert('Developers imported!')
    } else if (type === 'tasks' && Array.isArray(data)) {
      for (const task of data) {
        if (task.title) {
          await dataStore.addTask(task)
        }
      }
      alert('Tasks imported!')
    } else if (type === 'projects' && Array.isArray(data)) {
      for (const proj of data) {
        if (proj.name) {
          await dataStore.addProject(proj)
        }
      }
      alert('Projects imported!')
    }
    await dataStore.loadData()
  } catch (e) {
    alert('Error importing JSON: ' + e.message)
  }
}

async function handleCSVImport(text, type) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) {
    alert('CSV file is empty')
    return
  }

  const headers = parseCSVLine(lines[0])
  const count = lines.length - 1

  if (type === 'developers') {
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i])
      const obj = {}
      headers.forEach((h, idx) => { obj[h] = row[idx] || '' })
      if (obj.Name && obj.Role) {
        await dataStore.addDeveloper({
          name: obj.Name,
          role: obj.Role.toLowerCase(),
          level: obj.Level || 'mid',
          type: obj.Type || 'staff',
          capacity: parseInt(obj.Capacity) || 7,
          skills: (obj.Skills || '').split(';').map(s => s.trim()).filter(Boolean)
        })
      }
    }
    alert(`Imported ${count} developers!`)
  } else if (type === 'tasks') {
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i])
      const obj = {}
      headers.forEach((h, idx) => { obj[h] = row[idx] || '' })
      if (obj.Title) {
        const assignee = dataStore.developers.find(d => d.name === obj.Assignee)
        const project = dataStore.projects.find(p => p.name === obj.Project)
        await dataStore.addTask({
          title: obj.Title,
          status: obj.Status || 'backlog',
          size: obj.Size || 'M',
          priority: obj.Priority || 'medium',
          assigneeId: assignee?.id || '',
          projectId: project?.id || '',
          role: assignee?.role || 'web',
          estimatedHours: parseFloat(obj['Est. Hours']) || 0,
          actualHours: parseFloat(obj['Actual Hours']) || 0,
          reworkCount: parseInt(obj.Rework) || 0,
          createdAt: obj.Created || new Date().toISOString().split('T')[0],
          startedAt: obj.Started || null,
          completedAt: obj.Completed || null
        })
      }
    }
    alert(`Imported ${count} tasks!`)
  } else if (type === 'projects') {
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i])
      const obj = {}
      headers.forEach((h, idx) => { obj[h] = row[idx] || '' })
      if (obj.Name) {
        await dataStore.addProject({
          name: obj.Name,
          client: obj.Client || '',
          status: obj.Status || 'active',
          health: obj.Health || 'on-track',
          startDate: obj['Start Date'] || '',
          endDate: obj['End Date'] || '',
          assignedRoles: (obj['Assigned Roles'] || '').split(';').map(s => s.trim().toLowerCase()).filter(Boolean),
          description: obj.Description || ''
        })
      }
    }
    alert(`Imported ${count} projects!`)
  }
  await dataStore.loadData()
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// =================== CRUD OPERATIONS ===================

function editDeveloper(dev) {
  editingDev.value = dev
  devForm.value = { name: dev.name, role: dev.role, type: dev.type, level: dev.level || 'mid', capacity: dev.capacity, skillsStr: (dev.skills || []).join(', ') }
  showDevDialog.value = true
}

function closeDevDialog() {
  editingDev.value = null
  devForm.value = { name: '', role: 'web', type: 'staff', level: 'mid', capacity: 7, skillsStr: '' }
  showDevDialog.value = false
}

function onLevelChange() {
  devForm.value.capacity = levelCapacity[devForm.value.level] || 7
}

async function saveDeveloper() {
  if (!devForm.value.name) return
  const skills = devForm.value.skillsStr.split(',').map(s => s.trim()).filter(Boolean)
  const devData = {
    name: devForm.value.name,
    role: devForm.value.role,
    type: devForm.value.type,
    level: devForm.value.level,
    capacity: devForm.value.capacity,
    skills
  }
  if (editingDev.value) {
    await dataStore.editDeveloper(editingDev.value.id, devData)
  } else {
    await dataStore.addDeveloper(devData)
  }
  closeDevDialog()
}

function editTask(task) {
  editingTask.value = task
  taskForm.value = { ...task }
  showTaskDialog.value = true
}

function closeTaskDialog() {
  editingTask.value = null
  taskForm.value = { title: '', projectId: '', assigneeId: '', role: 'web', status: 'backlog', size: 'M', priority: 'medium', estimatedHours: 0, reworkCount: 0 }
  showTaskDialog.value = false
}

async function saveTask() {
  if (!taskForm.value.title) return
  const proj = dataStore.projects.find(p => p.id === taskForm.value.projectId)
  const taskData = {
    title: taskForm.value.title,
    projectId: taskForm.value.projectId || '',
    assigneeId: taskForm.value.assigneeId || '',
    role: taskForm.value.role,
    status: taskForm.value.status,
    size: taskForm.value.size,
    priority: taskForm.value.priority,
    estimatedHours: taskForm.value.estimatedHours,
    actualHours: 0,
    reworkCount: taskForm.value.reworkCount || 0,
    createdAt: new Date().toISOString().split('T')[0],
    startedAt: null,
    completedAt: null
  }
  if (editingTask.value) {
    await dataStore.editTask(editingTask.value.id, taskData)
  } else {
    await dataStore.addTask(taskData)
  }
  closeTaskDialog()
}

function editProject(project) {
  editingProject.value = project
  projectForm.value = {
    name: project.name,
    client: project.client,
    status: project.status,
    health: project.health,
    startDate: project.startDate,
    endDate: project.endDate,
    roles: [...(project.assignedRoles || [])],
    description: project.description || ''
  }
  showProjectDialog.value = true
}

function closeProjectDialog() {
  editingProject.value = null
  projectForm.value = { name: '', client: '', status: 'active', health: 'on-track', startDate: '', endDate: '', roles: [], description: '' }
  showProjectDialog.value = false
}

async function saveProject() {
  if (!projectForm.value.name) return
  const projectData = {
    name: projectForm.value.name,
    client: projectForm.value.client,
    status: projectForm.value.status,
    health: projectForm.value.health,
    startDate: projectForm.value.startDate || '',
    endDate: projectForm.value.endDate || '',
    assignedRoles: projectForm.value.roles,
    description: projectForm.value.description || ''
  }
  if (editingProject.value) {
    await dataStore.editProject(editingProject.value.id, projectData)
  } else {
    await dataStore.addProject(projectData)
  }
  closeProjectDialog()
}

async function deleteDeveloper(id) {
  const dev = dataStore.developers.find(d => d.id === id)
  if (confirm(`Delete developer "${dev?.name}"? This will also affect their assigned tasks.`)) {
    await dataStore.deleteDeveloper(id)
  }
}

async function deleteAllTasksAction() {
  if (confirm(`Are you sure you want to delete ALL ${dataStore.tasks.length} tasks? This cannot be undone!`)) {
    await dataStore.deleteAllTasks()
  }
}

async function deleteTask(id) {
  const task = dataStore.tasks.find(t => t.id === id)
  if (confirm(`Delete task "${task?.title}"?`)) {
    await dataStore.deleteTask(id)
  }
}

async function deleteProject(id) {
  const proj = dataStore.projects.find(p => p.id === id)
  if (confirm(`Delete project "${proj?.name}"?`)) {
    await dataStore.deleteProject(id)
  }
}

async function resetSampleData() {
  if (confirm('Reset all data to sample data? This will replace all current data.')) {
    await dataStore.resetSampleData()
  }
}

const sizeHoursMap = { S: 3, M: 6, L: 12, XL: 24 }
const sizeHints = { S: '2-4 hours', M: '4-8 hours', L: '8-16 hours', XL: '16-32 hours' }

function onSizeChange() {
  taskForm.value.estimatedHours = sizeHoursMap[taskForm.value.size] || 6
}

function getSizeHint(size) {
  return sizeHints[size] || ''
}

async function clearAllData() {
  if (confirm('Are you sure you want to delete ALL data (developers, tasks, projects)? This cannot be undone!')) {
    await dataStore.clearAllData()
  }
}
</script>

<style scoped>
.admin-view {
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

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-header h3 {
  font-size: 18px;
  color: #1f2937;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
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

.priority-urgent { color: #ef4444; font-weight: 600; }
.priority-high { color: #f97316; font-weight: 600; }
.priority-medium { color: #3b82f6; font-weight: 600; }
.priority-low { color: #6b7280; }

.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.report-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.report-header h4 {
  font-size: 16px;
  color: #1f2937;
}

.effectiveness-rating {
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 700;
  color: white;
}

.rating-top { background: linear-gradient(135deg, #10b981, #059669); }
.rating-strong { background: linear-gradient(135deg, #34d399, #10b981); }
.rating-solid { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
.rating-needs-improvement { background: linear-gradient(135deg, #fb923c, #f97316); }
.rating-underperformer { background: linear-gradient(135deg, #f87171, #ef4444); }

.report-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.metric-label {
  color: #6b7280;
}

.metric-value {
  font-weight: 600;
  color: #1f2937;
}

.report-summary {
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
}

.report-summary p {
  margin-bottom: 4px;
}

.settings-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.setting-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
}

.setting-card.primary {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  grid-column: span 2;
}

.setting-card.warn {
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.setting-card.danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.setting-card h4 {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 4px;
}

.setting-card p {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
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
</style>
