import { supabase } from './supabase'
import { User } from './types'

export interface AuthUser extends User {
  isAuthenticated: boolean;
}

export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    // Demo users for testing without database
    const demoUsers = [
      {
        id: '1',
        name: 'Super Admin',
        email: 'admin@university.edu',
        password: 'admin123',
        role: 'superadmin' as const,
        campus_id: 'campus-1',
        department_id: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Dr. John Smith',
        email: 'dean@cs.edu',
        password: 'dean123',
        role: 'dean' as const,
        campus_id: 'campus-1',
        department_id: 'dept-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Dr. Jane Doe',
        email: 'lecturer@cs.edu',
        password: 'lecturer123',
        role: 'lecturer' as const,
        campus_id: 'campus-1',
        department_id: 'dept-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // Find user by email
    const user = demoUsers.find(u => u.email === email)
    
    if (!user) {
      return { user: null, error: 'Invalid credentials' }
    }

    // Check password
    if (user.password !== password) {
      return { user: null, error: 'Invalid credentials' }
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user
    
    const authUser: AuthUser = {
      ...userWithoutPassword,
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
