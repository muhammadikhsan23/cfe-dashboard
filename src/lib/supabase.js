import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dkivlezxbuaomswiltrh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRraXZsZXp4YnVhb21zd2lsdHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4OTY1NzIsImV4cCI6MjA5NjQ3MjU3Mn0.9m6YM-j9HgEbd3_ZQ0LYsIhCIQsA8yoEEy1_tWGc-a0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const auth = {
  signUp: (email, password, name, role) => 
    supabase.auth.signUp({ email, password, options: { data: { name, role } } }),
  
  signIn: (email, password) => 
    supabase.auth.signInWithPassword({ email, password }),
  
  signOut: () => 
    supabase.auth.signOut(),
  
  getSession: () => 
    supabase.auth.getSession(),
  
  getUser: () => 
    supabase.auth.getUser(),
  
  onAuthStateChange: (callback) => 
    supabase.auth.onAuthStateChange(callback)
}

// Database helpers with error handling
export const db = {
  // Generic fetch
  get: async (table, filters = {}) => {
    let query = supabase.from(table).select('*')
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value)
    }
    const { data, error } = await query
    if (error) {
      console.error(`Error fetching ${table}:`, error)
      return []
    }
    return data
  },

  // Get single record
  getById: async (table, id) => {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
    if (error) return null
    return data
  },

  // Create
  create: async (table, item) => {
    const { data, error } = await supabase.from(table).insert(item).select()
    if (error) {
      console.error(`Error creating in ${table}:`, error)
      return null
    }
    return data[0]
  },

  // Update
  update: async (table, id, updates) => {
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select()
    if (error) {
      console.error(`Error updating ${table}:`, error)
      return null
    }
    return data[0]
  },

  // Delete
  delete: async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      console.error(`Error deleting from ${table}:`, error)
      return false
    }
    return true
  },

  // Real-time subscription
  subscribe: (table, callback, event = '*') => {
    return supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event, schema: 'public', table },
        (payload) => callback(payload)
      )
      .subscribe()
  },

  // Unsubscribe
  unsubscribe: (channel) => {
    if (channel) {
      supabase.removeChannel(channel)
    }
  }
}