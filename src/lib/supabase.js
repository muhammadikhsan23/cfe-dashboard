import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
export const auth = {
  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signUp: (email, password, name, role) => supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } }
  }),
  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  getUser: () => supabase.auth.getUser()
}

// Database helpers
export const db = {
  get: async (table, filters = {}) => {
    let query = supabase.from(table).select('*')
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
    const { data, error } = await query
    if (error) { console.error(`Error getting from ${table}:`, error); return [] }
    return data
  },
  create: async (table, item) => {
    const { data, error } = await supabase.from(table).insert([item]).select().single()
    if (error) { console.error(`Error creating in ${table}:`, error); return null }
    return data
  },
  update: async (table, id, updates) => {
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
    if (error) { console.error(`Error updating in ${table}:`, error); return null }
    return data
  },
  delete: async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { console.error(`Error deleting from ${table}:`, error); return false }
    return true
  },
  subscribe: (table, callback) => {
    return supabase.channel(table)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callback(payload)
      })
      .subscribe()
  },
  unsubscribe: (subscription) => {
    if (subscription) supabase.removeChannel(subscription)
  }
}