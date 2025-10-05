import { supabase } from './supabase'
import { User } from './types'

export interface AuthUser extends User {
  isAuthenticated: boolean;
}

export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    // For now, we'll use a simple email/password check
    // In production, you'd want to use proper authentication
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        campuses!inner(*),
        departments(*)
      `)
      .eq('email', email)
      .single()

    if (error || !data) {
      return { user: null, error: 'Invalid credentials' }
    }

    // In a real app, you'd verify the password hash here
    // For now, we'll skip password verification for development
    
    const authUser: AuthUser = {
      ...data,
      isAuthenticated: true
    }

    return { user: authUser, error: null }
  } catch (error) {
    return { user: null, error: 'Authentication failed' }
  }
}

export async function signOut(): Promise<void> {
  // Clear any stored authentication data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_user')
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem('auth_user')
    if (!stored) return null
    
    const user = JSON.parse(stored) as AuthUser
    return user.isAuthenticated ? user : null
  } catch {
    return null
  }
}

export function setCurrentUser(user: AuthUser): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('auth_user', JSON.stringify(user))
}

export function hasPermission(user: AuthUser, action: string, resource?: string): boolean {
  switch (user.role) {
    case 'superadmin':
      return true // SuperAdmin can do everything
    case 'dean':
      // Dean can only access their department
      return action !== 'manage_campuses' && action !== 'manage_global_settings'
    case 'lecturer':
      // Lecturer can only view assigned courses and take attendance
      return action === 'view_courses' || action === 'take_attendance'
    default:
      return false
  }
}

export function canAccessCampus(user: AuthUser, campusId: string): boolean {
  if (user.role === 'superadmin') return true
  return user.campus_id === campusId
}

export function canAccessDepartment(user: AuthUser, departmentId: string): boolean {
  if (user.role === 'superadmin') return true
  return user.department_id === departmentId
}
