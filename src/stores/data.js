import { defineStore } from 'pinia'
import { db } from '../lib/supabase'

export const useDataStore = defineStore('data', {
  state: () => ({
    developers: [],
    tasks: [],
    projects: [],
    loading: false,
    subscriptions: []
  }),
  
  getters: {
    taskStats: (state) => {
      const tasks = state.tasks
      return {
        total: tasks.length,
        backlog: tasks.filter(t => t.status === 'backlog').length,
        ready: tasks.filter(t => t.status === 'ready').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length,
        blocked: tasks.filter(t => t.status === 'blocked').length
      }
    },
    projectStats: (state) => {
      const projects = state.projects
      return {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length
      }
    },
    activeProjects: (state) => state.projects.filter(p => p.status === 'active'),
    inProgressTasks: (state) => state.tasks.filter(t => t.status === 'in-progress'),
    completedTasks: (state) => state.tasks.filter(t => t.status === 'done'),
    tasksByRole: (state) => (role) => state.tasks.filter(t => t.role === role),
    developerWorkload: (state) => (devId) => {
      return state.tasks.filter(t => t.assigneeId === devId && t.status !== 'done')
    },
    developerOccupancy: (state) => {
      return state.developers.map(dev => {
        const allActiveTasks = state.tasks.filter(t => t.assigneeId === dev.id && t.status !== 'done')
        // Active = in-progress + review (currently being worked on)
        const activeTaskList = allActiveTasks.filter(t => t.status === 'in-progress' || t.status === 'review')
        // Queued = backlog + ready (waiting to be started)
        const queuedTaskList = allActiveTasks.filter(t => t.status === 'backlog' || t.status === 'ready')
        
        const activeTasks = activeTaskList.length
        const queuedTasks = queuedTaskList.length
        
        const allocatedHours = activeTaskList.reduce((sum, t) => sum + (parseInt(t.estimatedHours) || 0), 0)
        const queuedHours = queuedTaskList.reduce((sum, t) => sum + (parseInt(t.estimatedHours) || 0), 0)
        const totalHours = allocatedHours + queuedHours
        
        const dailyCapacity = parseInt(dev.capacity) || 8
        const daysQueued = dailyCapacity > 0 ? Math.ceil(queuedHours / dailyCapacity) : 0
        
        const weeklyCapacity = dailyCapacity * 5
        const occupancyRate = weeklyCapacity > 0 ? Math.round((totalHours / weeklyCapacity) * 100) : 0
        const occupancyStatus = occupancyRate > 100 ? 'overloaded' : occupancyRate > 60 ? 'optimal' : 'available'
        
        return { ...dev, activeTasks, queuedTasks, allocatedHours, queuedHours, totalHours, daysQueued, occupancyRate, occupancyStatus }
      })
    },
    developerEffectiveness: (state) => {
      return state.developers.map(dev => {
        const allTasks = state.tasks.filter(t => t.assigneeId === dev.id)
        const completedTasks = allTasks.filter(t => t.status === 'done')
        const totalTasks = allTasks.length
        const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0
        
        // Quality score: based on rework count (lower is better)
        const totalRework = completedTasks.reduce((sum, t) => sum + (t.reworkCount || 0), 0)
        const qualityScore = completedTasks.length > 0 ? Math.max(0, Math.round(100 - (totalRework / completedTasks.length) * 25)) : 100
        
        // On-time delivery: compare estimated vs actual hours
        const tasksWithHours = completedTasks.filter(t => t.estimatedHours > 0 && t.actualHours > 0)
        const onTimeCount = tasksWithHours.filter(t => t.actualHours <= t.estimatedHours).length
        const onTimeDelivery = tasksWithHours.length > 0 ? Math.round((onTimeCount / tasksWithHours.length) * 100) : 100
        
        // Cycle time efficiency: average of (estimated/actual) ratio
        const cycleTimeEfficiency = tasksWithHours.length > 0 
          ? Math.round(tasksWithHours.reduce((sum, t) => sum + Math.min(100, (t.estimatedHours / t.actualHours) * 100), 0) / tasksWithHours.length)
          : 100
        
        // Consistency: based on variance in actual vs estimated
        const consistency = tasksWithHours.length > 0 
          ? Math.round(100 - Math.min(50, Math.abs(completionRate - onTimeDelivery)))
          : 100
        
        // Overall effectiveness score
        const effectivenessScore = Math.round(
          completionRate * 0.3 + qualityScore * 0.25 + onTimeDelivery * 0.25 + cycleTimeEfficiency * 0.1 + consistency * 0.1
        )
        
        // Rating
        let rating = 'solid'
        if (effectivenessScore >= 90) rating = 'top'
        else if (effectivenessScore >= 75) rating = 'strong'
        else if (effectivenessScore >= 50) rating = 'solid'
        else if (effectivenessScore >= 30) rating = 'needs-improvement'
        else rating = 'underperformer'
        
        // Level based on role and effectiveness
        const levelMap = { junior: 0, mid: 1, senior: 2, lead: 3 }
        const level = dev.level || 'mid'
        
        return {
          ...dev,
          totalTasks,
          completedTasks: completedTasks.length,
          metrics: { completionRate, qualityScore, onTimeDelivery, cycleTimeEfficiency, consistency },
          effectivenessScore,
          rating,
          level
        }
      })
    }
  },
  
  actions: {
    async loadAll() {
      this.loading = true
      try {
        const [developers, tasks, projects] = await Promise.all([
          db.get('developers'),
          db.get('tasks'),
          db.get('projects')
        ])
        this.developers = (developers || []).map(d => this._taskToCamel(d, 'dev'))
        this.tasks = (tasks || []).map(t => this._taskToCamel(t, 'task'))
        this.projects = (projects || []).map(p => this._taskToCamel(p, 'proj'))
      } finally {
        this.loading = false
      }
    },

    setupRealtimeSync() {
      const devSub = db.subscribe('developers', (payload) => {
        this.loadAll()
      })
      this.subscriptions.push(devSub)

      const taskSub = db.subscribe('tasks', (payload) => {
        this.loadAll()
      })
      this.subscriptions.push(taskSub)

      const projSub = db.subscribe('projects', (payload) => {
        this.loadAll()
      })
      this.subscriptions.push(projSub)
    },

    cleanupSubscriptions() {
      this.subscriptions.forEach(sub => db.unsubscribe(sub))
      this.subscriptions = []
    },

    async addDeveloper(dev) {
      const { skillsStr, ...cleanDev } = dev
      const newDev = await db.create('developers', { ...cleanDev, created_at: new Date().toISOString() })
      if (newDev) this.developers.push(newDev)
      return newDev
    },

    async updateDeveloper(id, updates) {
      const { skillsStr, ...cleanUpdates } = updates
      const updated = await db.update('developers', id, cleanUpdates)
      if (updated) {
        const idx = this.developers.findIndex(d => d.id === id)
        if (idx !== -1) this.developers[idx] = updated
      }
      return updated
    },

    async deleteDeveloper(id) {
      const deleted = await db.delete('developers', id)
      if (deleted) this.developers = this.developers.filter(d => d.id !== id)
      return deleted
    },

     async addTask(task) {
       // Map camelCase to snake_case for Supabase
       // Use null instead of empty string for UUID columns
       const snakeTask = {
         title: task.title,
         project_id: task.projectId || null,
         assignee_id: task.assigneeId || null,
         status: task.status,
         size: task.size,
         priority: task.priority,
         estimated_hours: task.estimatedHours || 0,
         actual_hours: task.actualHours || 0,
         role: task.role,
         rework_count: task.reworkCount || 0,
         created_at: task.createdAt || new Date().toISOString().split('T')[0],
         started_at: task.startedAt || null,
         completed_at: task.completedAt || null
       }
       const newTask = await db.create('tasks', snakeTask)
       if (newTask) this.tasks.push(this._taskToCamel(newTask, 'task'))
       return newTask
     },

     async updateTask(id, updates) {
       // Map camelCase to snake_case for Supabase
       // Use null instead of empty string for UUID columns
       // Auto-set started_at when status changes to in-progress
       const today = new Date().toISOString().split('T')[0]
       
       // Get current task to check if status is changing
       const currentTask = this.tasks.find(t => t.id === id)
       const statusChangedToInProgress = currentTask && currentTask.status !== 'in-progress' && updates.status === 'in-progress'
       const statusChangedToDone = currentTask && currentTask.status !== 'done' && updates.status === 'done'
       
       const snakeUpdates = {
         title: updates.title,
         project_id: updates.projectId || null,
         assignee_id: updates.assigneeId || null,
         status: updates.status,
         size: updates.size,
         priority: updates.priority,
         estimated_hours: updates.estimatedHours,
         actual_hours: updates.actualHours,
         role: updates.role,
         rework_count: updates.reworkCount,
         // Auto-set started_at when transitioning to in-progress
         ...(statusChangedToInProgress && !currentTask.startedAt ? { started_at: today } : {}),
         // Auto-set completed_at when transitioning to done
         ...(statusChangedToDone ? { completed_at: today } : {})
       }
       // Remove undefined values
       Object.keys(snakeUpdates).forEach(key => {
         if (snakeUpdates[key] === undefined) delete snakeUpdates[key]
       })
       const updated = await db.update('tasks', id, snakeUpdates)
       if (updated) {
         const idx = this.tasks.findIndex(t => t.id === id)
         if (idx !== -1) this.tasks[idx] = this._taskToCamel(updated, 'task')
       }
       return updated
     },

    async deleteTask(id) {
      const deleted = await db.delete('tasks', id)
      if (deleted) this.tasks = this.tasks.filter(t => t.id !== id)
      return deleted
    },

    async addProject(project) {
      // Map camelCase to snake_case for Supabase
      const snakeProj = {
        name: project.name,
        client: project.client || '',
        status: project.status,
        health: project.health,
        start_date: project.startDate || '',
        end_date: project.endDate || '',
        assigned_roles: project.assignedRoles || [],
        description: project.description || ''
      }
      const newProj = await db.create('projects', snakeProj)
      if (newProj) this.projects.push(this._taskToCamel(newProj, 'proj'))
      return newProj
    },

    async updateProject(id, updates) {
      // Map camelCase to snake_case for Supabase
      const snakeUpdates = {
        name: updates.name,
        client: updates.client,
        status: updates.status,
        health: updates.health,
        start_date: updates.startDate,
        end_date: updates.endDate,
        assigned_roles: updates.assignedRoles,
        description: updates.description
      }
      // Remove undefined values
      Object.keys(snakeUpdates).forEach(key => {
        if (snakeUpdates[key] === undefined) delete snakeUpdates[key]
      })
      const updated = await db.update('projects', id, snakeUpdates)
      if (updated) {
        const idx = this.projects.findIndex(p => p.id === id)
        if (idx !== -1) this.projects[idx] = this._taskToCamel(updated, 'proj')
      }
      return updated
    },

    async deleteProject(id) {
      const deleted = await db.delete('projects', id)
      if (deleted) this.projects = this.projects.filter(p => p.id !== id)
      return deleted
    },

    async editDeveloper(id, updates) {
      return await this.updateDeveloper(id, updates)
    },

    async editTask(id, updates) {
      return await this.updateTask(id, updates)
    },

    async editProject(id, updates) {
      return await this.updateProject(id, updates)
    },

    async deleteAllTasks() {
      for (const task of this.tasks) {
        await db.delete('tasks', task.id)
      }
      this.tasks = []
    },

    async clearAllData() {
      for (const dev of this.developers) {
        await db.delete('developers', dev.id)
      }
      for (const task of this.tasks) {
        await db.delete('tasks', task.id)
      }
      for (const proj of this.projects) {
        await db.delete('projects', proj.id)
      }
      this.developers = []
      this.tasks = []
      this.projects = []
    },

    // Convert snake_case from Supabase to camelCase for the app
    _taskToCamel(item, type) {
      if (!item) return item
      if (type === 'task') {
        return {
          ...item,
          projectId: item.project_id,
          assigneeId: item.assignee_id,
          estimatedHours: parseInt(item.estimated_hours) || 0,
          actualHours: parseInt(item.actual_hours) || 0,
          reworkCount: parseInt(item.rework_count) || 0,
          createdAt: item.created_at,
          startedAt: item.started_at,
          completedAt: item.completed_at
        }
      } else if (type === 'proj') {
        return {
          ...item,
          startDate: item.start_date,
          endDate: item.end_date,
          assignedRoles: item.assigned_roles || []
        }
      } else if (type === 'dev') {
        return {
          ...item,
          capacity: parseInt(item.capacity) || 8,
          skills: item.skills || []
        }
      }
      return item
    },

    async resetSampleData() {
      await this.clearAllData()
      const sampleDevelopers = [
        { name: 'John Smith', role: 'web', level: 'senior', capacity: 8, type: 'staff', skills: ['Vue', 'React', 'Node.js'] },
        { name: 'Sarah Johnson', role: 'mobile', level: 'mid', capacity: 7, type: 'staff', skills: ['React Native', 'Flutter'] },
        { name: 'Mike Chen', role: 'shopify', level: 'junior', capacity: 6, type: 'outsource', skills: ['Liquid', 'Shopify API'] }
      ]
      for (const dev of sampleDevelopers) {
        await this.addDeveloper(dev)
      }
      const sampleProjects = [
        { name: 'E-commerce Redesign', client: 'ACME Corp', status: 'active', health: 'on-track', startDate: '2026-06-01', endDate: '2026-07-15', assignedRoles: ['web', 'shopify'], description: 'Complete redesign of the e-commerce platform' },
        { name: 'Mobile App v2.0', client: 'TechStart Inc', status: 'active', health: 'at-risk', startDate: '2026-06-05', endDate: '2026-08-01', assignedRoles: ['mobile'], description: 'Major version update with new features' },
        { name: 'Shopify Migration', client: 'RetailCo', status: 'active', health: 'on-track', startDate: '2026-06-10', endDate: '2026-07-30', assignedRoles: ['shopify', 'web'], description: 'Migrate from custom platform to Shopify' }
      ]
      for (const proj of sampleProjects) {
        await this.addProject(proj)
      }
      // Reload to get the new IDs
      await this.loadAll()
      
      const sampleTasks = [
        { title: 'Homepage redesign', projectId: this.projects[0]?.id, assigneeId: this.developers[0]?.id, status: 'done', size: 'L', priority: 'high', estimatedHours: 12, actualHours: 10, role: 'web', reworkCount: 0, createdAt: '2026-06-01', startedAt: '2026-06-02', completedAt: '2026-06-05' },
        { title: 'Add payment integration', projectId: this.projects[0]?.id, assigneeId: this.developers[2]?.id, status: 'in-progress', size: 'XL', priority: 'urgent', estimatedHours: 24, actualHours: 0, role: 'shopify', reworkCount: 1, createdAt: '2026-06-05', startedAt: '2026-06-06' },
        { title: 'Push notification feature', projectId: this.projects[1]?.id, assigneeId: this.developers[1]?.id, status: 'review', size: 'M', priority: 'medium', estimatedHours: 6, actualHours: 0, role: 'mobile', reworkCount: 0, createdAt: '2026-06-08' },
        { title: 'API optimization', projectId: this.projects[2]?.id, assigneeId: this.developers[0]?.id, status: 'backlog', size: 'S', priority: 'low', estimatedHours: 3, actualHours: 0, role: 'web', reworkCount: 0, createdAt: '2026-06-10' }
      ]
      for (const task of sampleTasks) {
        if (task.projectId && task.assigneeId) {
          await this.addTask(task)
        }
      }
      await this.loadAll()
    }
  }
})
