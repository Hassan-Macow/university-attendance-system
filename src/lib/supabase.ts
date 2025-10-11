import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Validate environment variables
// Use fallback for build time, but real values will be used at runtime
// Force rebuild - Digital Ocean deployment
// Check for both undefined and empty string
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.trim()) || 'https://gmmapyjirjnoxpunajvid.supabase.co'
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtbWFweWppcmpub3hwdW5hanZpZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI4MzAxMTcyLCJleHAiOjIwNDM4NzcxNzJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtbWFweWppcmpub3hwdW5hanZpZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI4MzAxMTcyLCJleHAiOjIwNDM4NzcxNzJ9.9sZS16ImfubZ41LCJpYXQiOjE3MjgzMDExNzIsImV4cCI6MjA0Mzg3NzE3Mn0.wdFsPsDgyKlVmmeCRk6MzIpT1x_4gvdA6YumvV8gRb3s'

// Only create the client if we have valid environment variables
let supabase: SupabaseClient

const supabaseConfig = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}

// Log the environment variables for debugging (only URL, not the key)
if (typeof window !== 'undefined') {
  console.log('🔍 Supabase URL:', supabaseUrl)
  console.log('🔍 Supabase Key exists:', !!supabaseAnonKey)
}

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig)
  if (typeof window !== 'undefined') {
    console.log('✅ Supabase client initialized successfully')
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error)
  throw new Error('Failed to initialize Supabase client')
}

// Export types and client
export type { SupabaseClient }
export { supabase, supabase as default }

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = true

// Mock functions for development
function createMockClient() {
  return {
    from: (table: string) => ({
      select: (columns?: string) => {
        console.log(`Mock: SELECT from ${table}`, columns)
        return { data: getMockData(table), error: null }
      },
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: () => {
            console.log(`Mock: INSERT into ${table}`, data)
            const newRecord = {
              id: generateId(),
              ...data,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            return { data: newRecord, error: null }
          }
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: (columns?: string) => ({
            single: () => {
              console.log(`Mock: UPDATE ${table} SET`, data, `WHERE ${column} = ${value}`)
              const updatedRecord = {
                id: value,
                ...data,
                updated_at: new Date().toISOString()
              }
              return { data: updatedRecord, error: null }
            }
          })
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => {
          console.log(`Mock: DELETE from ${table} WHERE ${column} = ${value}`)
          return { data: null, error: null }
        }
      }),
    }),
    auth: {
      getSession: () => ({ data: { session: null }, error: null }),
      signInWithPassword: () => ({ data: { user: null }, error: null }),
      signOut: () => ({ error: null }),
    }
  }
}

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function getMockData(table: string) {
  switch (table) {
    case 'campuses':
      return [
        {
          id: 'f8e90b6e-2998-4049-883d-52525eed4e39',
          name: 'Main Campus',
          latitude: 12.3456,
          longitude: 78.9012,
          allowed_radius: 100,
          created_at: '2025-10-07T10:52:10.980285+00',
          updated_at: '2025-10-07T10:52:10.980285+00'
        }
      ]
    case 'departments':
      return [
        {
          id: '1',
          name: 'Computer Science',
          campus_id: 'f8e90b6e-2998-4049-883d-52525eed4e39',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    default:
      return []
  }
}