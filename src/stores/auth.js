import { defineStore } from 'pinia'
import { auth, db } from '../lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    isAuthenticated: false,
    loading: true,
    initialized: false
  }),
  
  getters: {
    isManager: (state) => state.user?.role === 'manager',
    userRole: (state) => state.user?.role,
    userName: (state) => state.user?.name,
    userEmail: (state) => state.user?.email
  },
  
  actions: {
    async init() {
      try {
        const { data: { session } } = await auth.getSession()
        if (session) {
          this.session = session
          await this.loadUserProfile(session.user.id)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        this.loading = false
        this.initialized = true
      }
    },

    async loadUserProfile(userId) {
      try {
        const users = await db.get('users', { id: userId })
        if (users && users.length > 0) {
          this.user = { ...users[0], email: this.session?.user?.email }
          this.isAuthenticated = true
        } else {
          // Fallback: create user profile from Supabase auth metadata
          const authUser = this.session?.user
          if (authUser) {
            const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User'
            const role = authUser.user_metadata?.role || 'web'
            const newUser = { id: userId, name, role, email: authUser.email, created_at: new Date().toISOString() }
            await db.create('users', newUser)
            this.user = newUser
            this.isAuthenticated = true
          }
        }
      } catch (err) {
        console.error('Error loading user profile:', err)
        // Fallback to session data if DB fails
        if (this.session?.user) {
          const authUser = this.session.user
          this.user = {
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: authUser.user_metadata?.role || 'web',
            email: authUser.email
          }
          this.isAuthenticated = true
        }
      }
    },

    async login(email, password) {
      try {
        const { data, error } = await auth.signIn(email, password)
        if (error) {
          return { success: false, error: error.message }
        }
        if (data?.session) {
          this.session = data.session
          await this.loadUserProfile(data.session.user.id)
          return { success: true }
        }
        return { success: false, error: 'Login failed - check your credentials' }
      } catch (err) {
        return { success: false, error: err.message || 'Login failed' }
      }
    },
    
    async logout() {
      await auth.signOut()
      this.user = null
      this.session = null
      this.isAuthenticated = false
    },

    async checkAuth() {
      const { data: { user } } = await auth.getUser()
      if (user) {
        await this.loadUserProfile(user.id)
      }
      return !!user
    }
  }
})