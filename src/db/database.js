import { get, set, del, clear, keys, entries } from 'idb-keyval'

const DB_KEYS = {
  DEVELOPERS: 'developers',
  TASKS: 'tasks',
  PROJECTS: 'projects',
  TASK_LOGS: 'task_logs',
  USERS: 'users'
}

// Initialize with empty data (only users for authentication)
export async function initDatabase() {
  const existingUsers = await get(DB_KEYS.USERS)
  if (!existingUsers) {
    await set(DB_KEYS.USERS, [
      { id: 'admin', name: 'Manager', role: 'manager', pin: '1234' },
      { id: 'web-dev', name: 'Web Developer', role: 'web', pin: '5678' },
      { id: 'mobile-dev', name: 'Mobile Developer', role: 'mobile', pin: '9012' },
      { id: 'shopify-dev', name: 'Shopify Developer', role: 'shopify', pin: '3456' }
    ])
  }
  
  const existingDevelopers = await get(DB_KEYS.DEVELOPERS)
  if (!existingDevelopers) {
    await set(DB_KEYS.DEVELOPERS, [
      { id: 'dev-1', name: 'John Smith', role: 'web', level: 'senior', capacity: 8 },
      { id: 'dev-2', name: 'Sarah Johnson', role: 'mobile', level: 'mid', capacity: 7 },
      { id: 'dev-3', name: 'Mike Chen', role: 'shopify', level: 'junior', capacity: 6 }
    ])
  }
  
  const existingProjects = await get(DB_KEYS.PROJECTS)
  if (!existingProjects) {
    await set(DB_KEYS.PROJECTS, [
      { id: 'proj-1', name: 'E-commerce Redesign', status: 'active', health: 'on-track', startDate: '2026-06-01', endDate: '2026-07-15' },
      { id: 'proj-2', name: 'Mobile App v2.0', status: 'active', health: 'at-risk', startDate: '2026-06-05', endDate: '2026-08-01' },
      { id: 'proj-3', name: 'Shopify Migration', status: 'active', health: 'on-track', startDate: '2026-06-10', endDate: '2026-07-30' }
    ])
  }
  
  const existingTasks = await get(DB_KEYS.TASKS)
  if (!existingTasks) {
    await set(DB_KEYS.TASKS, [
      { id: 't-1', title: 'Homepage UI Redesign', projectId: 'proj-1', assigneeId: 'dev-1', status: 'in-progress', size: 'XL', priority: 'high', estimatedHours: 32, actualHours: 16, role: 'web', reworkCount: 0, createdAt: '2026-06-01', startedAt: '2026-06-02', completedAt: null },
      { id: 't-2', title: 'API Integration', projectId: 'proj-1', assigneeId: 'dev-1', status: 'backlog', size: 'L', priority: 'high', estimatedHours: 12, actualHours: 0, role: 'web', reworkCount: 0, createdAt: '2026-06-03', startedAt: null, completedAt: null },
      { id: 't-3', title: 'Payment Module', projectId: 'proj-2', assigneeId: 'dev-2', status: 'in-progress', size: 'L', priority: 'medium', estimatedHours: 12, actualHours: 4, role: 'mobile', reworkCount: 0, createdAt: '2026-06-05', startedAt: '2026-06-06', completedAt: null },
      { id: 't-4', title: 'Push Notifications', projectId: 'proj-2', assigneeId: 'dev-2', status: 'backlog', size: 'M', priority: 'medium', estimatedHours: 6, actualHours: 0, role: 'mobile', reworkCount: 0, createdAt: '2026-06-07', startedAt: null, completedAt: null },
      { id: 't-5', title: 'Product Import Script', projectId: 'proj-3', assigneeId: 'dev-3', status: 'review', size: 'M', priority: 'high', estimatedHours: 8, actualHours: 10, role: 'shopify', reworkCount: 1, createdAt: '2026-06-10', startedAt: '2026-06-11', completedAt: null },
      { id: 't-6', title: 'Theme Customization', projectId: 'proj-3', assigneeId: 'dev-3', status: 'ready', size: 'L', priority: 'medium', estimatedHours: 10, actualHours: 0, role: 'shopify', reworkCount: 0, createdAt: '2026-06-12', startedAt: null, completedAt: null },
      { id: 't-7', title: 'Bug Fixes', projectId: 'proj-1', assigneeId: 'dev-1', status: 'done', size: 'S', priority: 'low', estimatedHours: 4, actualHours: 3, role: 'web', reworkCount: 0, createdAt: '2026-06-01', startedAt: '2026-06-01', completedAt: '2026-06-01' }
    ])
  }
  
  return { initialized: true }
}

// Generic CRUD operations
export async function getAll(collectionKey) {
  const data = await get(collectionKey)
  return data || []
}

export async function getById(collectionKey, id) {
  const data = await get(collectionKey)
  return data?.find(item => item.id === id)
}

export async function create(collectionKey, item) {
  const data = await get(collectionKey) || []
  data.push(item)
  await set(collectionKey, data)
  return item
}

export async function update(collectionKey, id, updates) {
  const data = await get(collectionKey) || []
  const index = data.findIndex(item => item.id === id)
  if (index !== -1) {
    // Convert to plain object to avoid Vue proxy issues with IndexedDB
    const plainUpdates = JSON.parse(JSON.stringify({ ...data[index], ...updates }))
    data[index] = plainUpdates
    await set(collectionKey, data)
    return data[index]
  }
  return null
}

export async function remove(collectionKey, id) {
  const data = await get(collectionKey) || []
  const filtered = data.filter(item => item.id !== id)
  await set(collectionKey, filtered)
  return true
}

export async function clearAll(collectionKey) {
  await del(collectionKey)
}

export async function deleteAllTasks() {
  await clearAll(DB_KEYS.TASKS)
}

export async function clearAllData() {
  await clear()
  // Reinitialize with empty data (only users structure)
  await set(DB_KEYS.USERS, [
    { id: 'admin', name: 'Manager', role: 'manager', pin: '1234' },
    { id: 'web-dev', name: 'Web Developer', role: 'web', pin: '5678' },
    { id: 'mobile-dev', name: 'Mobile Developer', role: 'mobile', pin: '9012' },
    { id: 'shopify-dev', name: 'Shopify Developer', role: 'shopify', pin: '3456' }
  ])
  await set(DB_KEYS.DEVELOPERS, [])
  await set(DB_KEYS.PROJECTS, [])
  await set(DB_KEYS.TASKS, [])
}

export async function resetSampleData() {
  await clearAllData()
  await initDatabase()
}

// Specific collection getters
export const getDevelopers = () => getAll(DB_KEYS.DEVELOPERS)
export const getTasks = () => getAll(DB_KEYS.TASKS)
export const getProjects = () => getAll(DB_KEYS.PROJECTS)
export const getUsers = () => getAll(DB_KEYS.USERS)

export const saveDeveloper = (dev) => create(DB_KEYS.DEVELOPERS, dev)
export const updateDeveloper = (id, updates) => update(DB_KEYS.DEVELOPERS, id, updates)
export const deleteDeveloper = (id) => remove(DB_KEYS.DEVELOPERS, id)

export const saveTask = (task) => create(DB_KEYS.TASKS, task)
export const updateTask = (id, updates) => update(DB_KEYS.TASKS, id, updates)
export const deleteTask = (id) => remove(DB_KEYS.TASKS, id)

export const saveProject = (project) => create(DB_KEYS.PROJECTS, project)
export const updateProject = (id, updates) => update(DB_KEYS.PROJECTS, id, updates)
export const deleteProject = (id) => remove(DB_KEYS.PROJECTS, id)

export { DB_KEYS }