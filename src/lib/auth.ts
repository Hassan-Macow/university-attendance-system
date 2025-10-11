import { supabase } from './supabase'
import { User } from './types'

export interface AuthUser extends User {
  isAuthenticated: boolean;
}

export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    // Always use real Supabase authentication

    // First, try Supabase Auth (for original admin users)
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!authError && authData.user) {
        // Get user profile from our users table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select(`
            *,
            campuses!inner(*),
            departments(*)
          `)
          .eq('email', email)
          .single()

        if (userProfile) {
          const authUser: AuthUser = {
            ...userProfile,
            isAuthenticated: true
          }
          return { user: authUser, error: null }
        }
      }
    } catch (authError) {
      // If Supabase Auth fails, continue to custom authentication
    }

    // Fallback to custom authentication (for users created through User Management)
    // Try to find user by email first, then by employee_id
    let userProfile = null
    let profileError = null

    // First try to find by email
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select(`
        *,
        campuses!inner(*),
        departments(*)
      `)
      .eq('email', email)
      .single()

    if (userByEmail && !emailError) {
      userProfile = userByEmail
    } else {
      // If not found by email, try to find by employee_id
      const { data: userByEmployeeId, error: employeeIdError } = await supabase
        .from('users')
        .select(`
          *,
          campuses!inner(*),
          departments(*)
        `)
        .eq('employee_id', email) // Use the input as employee_id
        .single()

      if (userByEmployeeId && !employeeIdError) {
        userProfile = userByEmployeeId
      } else {
        profileError = employeeIdError
      }
    }

    if (profileError || !userProfile) {
      return { user: null, error: 'Invalid credentials' }
    }

    // Check password (simple comparison for custom users)
    if (userProfile.password_hash !== password) {
      return { user: null, error: 'Invalid credentials' }
    }

    // Return user with authentication status
    const authUser: AuthUser = {
      ...userProfile,
      isAuthenticated: true
    }

    return { user: authUser, error: null }
  } catch (error) {
    return { user: null, error: 'Authentication failed' }
  }
}

// Fallback demo authentication when Supabase is not configured
async function signInDemo(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
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
    department_id: userWithoutPassword.department_id || null,
    isAuthenticated: true
  }

  return { user: authUser, error: null }
}

export async function signOut(): Promise<void> {
  // Clear localStorage first
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_user')
  }
  
  // Sign out from Supabase Auth
  await supabase.auth.signOut()
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (typeof window === 'undefined') return null
  
  try {
    // First check localStorage for custom users (prioritize recent login)
    const stored = localStorage.getItem('auth_user')
    if (stored) {
      const user = JSON.parse(stored) as AuthUser
      if (user.isAuthenticated) {
        return user
      }
    }

    // If no localStorage user, try Supabase Auth session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (!error && session?.user) {
      // Get user profile from our users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          campuses!inner(*),
          departments(*)
        `)
        .eq('email', session.user.email)
        .single()

      if (userProfile) {
        return {
          ...userProfile,
          isAuthenticated: true
        }
      }
    }

    return null
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
