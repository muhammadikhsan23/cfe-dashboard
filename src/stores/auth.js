import { defineStore } from 'pinia'
import { getUsers } from '../db/database'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false
  }),
  
  getters: {
    isManager: (state) => state.user?.role === 'manager',
    userRole: (state) => state.user?.role,
    userName: (state) => state.user?.name
  },
  
  actions: {
    async login(pin) {
      const users = await getUsers()
      const user = users.find(u => u.pin === pin)
      if (user) {
        this.user = user
        this.isAuthenticated = true
        localStorage.setItem('cfe_user', JSON.stringify(user))
        return { success: true }
      }
      return { success: false, error: 'Invalid PIN' }
    },
    
    logout() {
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('cfe_user')
    },
    
    restoreSession() {
      const saved = localStorage.getItem('cfe_user')
      if (saved) {
        this.user = JSON.parse(saved)
        this.isAuthenticated = true
      }
    }
  }
})