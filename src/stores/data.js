import { defineStore } from 'pinia'
import {
  getDevelopers, getTasks, getProjects,
  saveTask, updateTask, deleteTask,
  saveProject, updateProject, deleteProject,
  saveDeveloper, updateDeveloper, deleteDeveloper,
  clearAllData, resetSampleData, deleteAllTasks
} from '../db/database'

export const useDataStore = defineStore('data', {
  state: () => ({
    developers: [],
    tasks: [],
    projects: [],
    loading: false
  }),
  
  getters: {
    // Task stats
    taskStats: (state) => {
      const total = state.tasks.length
      const backlog = state.tasks.filter(t => t.status === 'backlog').length
      const ready = state.tasks.filter(t => t.status === 'ready').length
      const inProgress = state.tasks.filter(t => t.status === 'in-progress').length
      const review = state.tasks.filter(t => t.status === 'review').length
      const done = state.tasks.filter(t => t.status === 'done').length
      const blocked = state.tasks.filter(t => t.status === 'blocked').length
      return { total, backlog, ready, inProgress, review, done, blocked }
    },
    
    // Project stats
    projectStats: (state) => {
      const active = state.projects.filter(p => p.status === 'active').length
      const onTrack = state.projects.filter(p => p.health === 'on-track').length
      const atRisk = state.projects.filter(p => p.health === 'at-risk').length
      const blocked = state.projects.filter(p => p.health === 'blocked').length
      return { active, onTrack, atRisk, blocked, total: state.projects.length }
    },
    
    // Developer occupancy
    developerOccupancy: (state) => {
      return state.developers.map(dev => {
        const activeTasks = state.tasks.filter(t => 
          t.assigneeId === dev.id && 
          (t.status === 'in-progress' || t.status === 'review')
        )
        // Also count backlog and ready tasks for queue calculation
        const queuedTasks = state.tasks.filter(t => 
          t.assigneeId === dev.id && 
          (t.status === 'backlog' || t.status === 'ready')
        )
        const allocatedHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
        const queuedHours = queuedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
        const capacity = dev.capacity || 8
        const occupancyRate = Math.min(100, Math.round((allocatedHours / capacity) * 100))
        // Calculate days queued: queued hours / daily capacity
        const daysQueued = queuedHours > 0 ? Math.ceil(queuedHours / capacity) : 0
        const queuedTasksCount = queuedTasks.length
        return {
          ...dev,
          activeTasks: activeTasks.length,
          allocatedHours,
          occupancyRate,
          occupancyStatus: occupancyRate > 90 ? 'overloaded' : occupancyRate > 60 ? 'optimal' : 'available',
          daysQueued,
          queuedHours,
          queuedTasks: queuedTasksCount
        }
      })
    },
    
    // Developer effectiveness scores
    developerEffectiveness: (state) => {
      return state.developers.map(dev => {
        const devTasks = state.tasks.filter(t => t.assigneeId === dev.id)
        const completedTasks = devTasks.filter(t => t.status === 'done')
        const inProgressTasks = devTasks.filter(t => t.status === 'in-progress' || t.status === 'review')
        
        // Completion rate (tasks completed vs assigned)
        const completionRate = devTasks.length > 0 
          ? (completedTasks.length / devTasks.length) * 100 
          : 0
        
        // Cycle time efficiency (actual vs estimated)
        let cycleTimeEfficiency = 0
        if (completedTasks.length > 0) {
          const ratios = completedTasks
            .filter(t => t.estimatedHours > 0 && t.actualHours > 0)
            .map(t => Math.min(1, t.estimatedHours / t.actualHours))
          cycleTimeEfficiency = ratios.length > 0 
            ? (ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100 
            : 50
        }
        
        // Quality score (lower rework = higher quality)
        let qualityScore = 100
        if (completedTasks.length > 0) {
          const avgRework = completedTasks.reduce((sum, t) => sum + (t.reworkCount || 0), 0) / completedTasks.length
          qualityScore = Math.max(0, 100 - (avgRework * 25))
        }
        
        // On-time delivery
        let onTimeDelivery = 50
        if (completedTasks.length > 0) {
          const onTime = completedTasks.filter(t => t.actualHours <= t.estimatedHours).length
          onTimeDelivery = (onTime / completedTasks.length) * 100
        }
        
        // Consistency (based on completed task count over time)
        const consistency = Math.min(100, completedTasks.length * 15)
        
        // Task complexity handling
        let complexityScore = 50
        const xlTasks = devTasks.filter(t => t.size === 'XL')
        const xlCompleted = xlTasks.filter(t => t.status === 'done')
        if (xlTasks.length > 0) {
          complexityScore = (xlCompleted.length / xlTasks.length) * 100
        } else if (completedTasks.length > 0) {
          complexityScore = 70
        }
        
        // Weighted effectiveness score
        const effectivenessScore = Math.round(
          (completionRate * 0.25) +
          (cycleTimeEfficiency * 0.20) +
          (qualityScore * 0.20) +
          (consistency * 0.15) +
          (complexityScore * 0.10) +
          (onTimeDelivery * 0.10)
        )
        
        const rating = effectivenessScore >= 85 ? 'top' :
                       effectivenessScore >= 70 ? 'strong' :
                       effectivenessScore >= 55 ? 'solid' :
                       effectivenessScore >= 40 ? 'needs-improvement' : 'underperformer'
        
        return {
          ...dev,
          effectivenessScore,
          rating,
          metrics: {
            completionRate: Math.round(completionRate),
            cycleTimeEfficiency: Math.round(cycleTimeEfficiency),
            qualityScore: Math.round(qualityScore),
            consistency: Math.round(consistency),
            complexityScore: Math.round(complexityScore),
            onTimeDelivery: Math.round(onTimeDelivery)
          },
          completedTasks: completedTasks.length,
          inProgressTasks: inProgressTasks.length,
          totalTasks: devTasks.length
        }
      }).sort((a, b) => b.effectivenessScore - a.effectivenessScore)
    },
    
    // Get task by size hours mapping
    sizeHours: () => ({
      'S': 3,
      'M': 6,
      'L': 12,
      'XL': 24
    })
  },
  
  actions: {
    async loadData() {
      this.loading = true
      try {
        this.developers = await getDevelopers()
        this.tasks = await getTasks()
        this.projects = await getProjects()
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        this.loading = false
      }
    },
    
    async addTask(task) {
      await saveTask(task)
      await this.loadData()
    },
    
    async editTask(id, updates) {
      await updateTask(id, updates)
      await this.loadData()
    },
    
    async removeTask(id) {
      await deleteTask(id)
      await this.loadData()
    },
    
    async addProject(project) {
      await saveProject(project)
      await this.loadData()
    },
    
    async editProject(id, updates) {
      await updateProject(id, updates)
      await this.loadData()
    },
    
    async removeProject(id) {
      await deleteProject(id)
      await this.loadData()
    },
    
    async addDeveloper(developer) {
      await saveDeveloper(developer)
      await this.loadData()
    },
    
    async editDeveloper(id, updates) {
      await updateDeveloper(id, updates)
      await this.loadData()
    },
    
    async removeDeveloper(id) {
      await deleteDeveloper(id)
      await this.loadData()
    },
    
    async clearAllData() {
      await clearAllData()
      await this.loadData()
    },
    
    async resetSampleData() {
      await resetSampleData()
      await this.loadData()
    },
    
    async deleteAllTasks() {
      await deleteAllTasks()
      await this.loadData()
    }
  }
})