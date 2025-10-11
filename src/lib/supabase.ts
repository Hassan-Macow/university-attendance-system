import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

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
console.log('Supabase URL:', supabaseUrl || 'NOT SET')
console.log('Supabase Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase environment variables are not set!')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured')
  // Throw error - don't create placeholder client
  throw new Error('Missing required Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig)
  console.log('✅ Supabase client initialized successfully with:', supabaseUrl)
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