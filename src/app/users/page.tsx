'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  IconUsers,
  IconPlus,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconMail,
  IconUser,
  IconShield,
  IconBuilding,
  IconSchool,
  IconDownload,
  IconUpload
} from '@tabler/icons-react'
import { showToast } from '@/components/ui/toast'
import type { User, UserRole } from '@/lib/types'

export interface UserFormData {
  id: string
  name: string
  email: string
  role: UserRole
  campus_id: string
  department_id: string
  employee_id: string
  reg_no: string
  password: string
  campuses: string[]
  is_active?: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [campuses, setCampuses] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [employeeIdError, setEmployeeIdError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    id: '',
    name: '',
    email: '',
    role: 'lecturer',
    campus_id: '',
    department_id: '',
    employee_id: '',
    reg_no: '',
    password: '',
    campuses: []
  })

  useEffect(() => {
    fetchUsers()
    fetchCampuses()
    fetchDepartments()
  }, [])

  const fetchUsers = async () => {
    try {
      console.log('=== Fetching Users from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          *,
          campuses!inner(*),
          departments(*)
        `)
        .order('created_at', { ascending: false })

      console.log('Users from database:', { data: users, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Error', 'Failed to fetch users from database')
        return
      }

      setUsers(users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      showToast.error('Error', 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCampuses = async () => {
    try {
      console.log('=== Fetching Campuses from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      const { data: campuses, error } = await supabase
        .from('campuses')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Campuses from database:', { data: campuses, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Error', 'Failed to fetch campuses from database')
        return
      }

      setCampuses(campuses || [])
    } catch (error) {
      console.error('Error fetching campuses:', error)
      showToast.error('Error', 'Failed to fetch campuses')
    }
  }

  const fetchDepartments = async () => {
    try {
      console.log('=== Fetching Departments from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      const { data: departments, error } = await supabase
        .from('departments')
        .select(`
          *,
          campuses!inner(*)
        `)
        .order('created_at', { ascending: false })

      console.log('Departments from database:', { data: departments, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Error', 'Failed to fetch departments from database')
        return
      }

      setDepartments(departments || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
      showToast.error('Error', 'Failed to fetch departments')
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password })
  }

  // Check if email or employee ID already exists
  const checkExistingUser = async (email: string, employeeId: string) => {
    if (!email.trim() && !employeeId.trim()) return

    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Build query to exclude current user if editing
      let query = supabase
        .from('users')
        .select('id, email, employee_id')
        .or(`email.eq.${email.trim()},employee_id.eq.${employeeId.trim()}`)
      
      // If editing, exclude the current user
      if (isEditing && editingUser) {
        query = query.neq('id', editingUser.id)
      }
      
      const { data: existingUsers, error } = await query

      if (error) {
        console.error('Error checking existing users:', error)
        return
      }

      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0]
        if (existingUser.email === email.trim()) {
          setEmailError('This email is already taken')
        } else {
          setEmailError('')
        }
        
        if (existingUser.employee_id === employeeId.trim()) {
          setEmployeeIdError('This Employee ID is already taken')
        } else {
          setEmployeeIdError('')
        }
      } else {
        setEmailError('')
        setEmployeeIdError('')
      }
    } catch (error) {
      console.error('Error checking existing user:', error)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditing(true)
    setShowForm(true)
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      campus_id: '',
      department_id: user.department_id || '',
      employee_id: '',
      reg_no: '',
      password: '', // Don't pre-fill password for security
      campuses: [] // Will be populated from user's campuses
    })
    setEmailError('')
    setEmployeeIdError('')
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    
    setIsCreating(true)
    try {
      console.log('=== Updating User in Database ===')
      console.log('Form data:', formData)
      
      const { supabase } = await import('@/lib/supabase')
      
      // Ensure we have at least one campus selected
      if (formData.campuses.length === 0) {
        showToast.error('Validation Error', 'Please select at least one campus')
        return
      }

      if (!formData.employee_id.trim()) {
        showToast.error('Validation Error', `Please enter ${formData.role === 'student' ? 'Student ID' : 'Employee ID'}`)
        return
      }

      // Check for validation errors
      if (emailError || employeeIdError) {
        showToast.error('Validation Error', 'Please fix the errors above before submitting')
        return
      }

      // Check if email or employee_id already exists (excluding current user)
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id, email, employee_id')
        .or(`email.eq.${formData.email.trim()},employee_id.eq.${formData.employee_id.trim()}`)
        .neq('id', editingUser.id)

      if (checkError) {
        console.error('Error checking existing users:', checkError)
        showToast.error('Validation Error', 'Failed to validate user data')
        return
      }

      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0]
        if (existingUser.email === formData.email.trim()) {
          showToast.error('Validation Error', 'A user with this email address already exists. Please use a different email.')
        } else if (existingUser.employee_id === formData.employee_id.trim()) {
          showToast.error('Validation Error', 'A user with this Employee ID already exists. Please use a different Employee ID.')
        }
        return
      }

      // Update the user
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        campus_id: formData.campuses[0], // Use first selected campus as primary
        department_id: formData.department_id || null,
        employee_id: formData.employee_id.trim() || null
      }

      // Only update password if provided
      if (formData.password.trim()) {
        updateData.password_hash = formData.password.trim()
      }

      const { data: user, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', editingUser.id)
        .select(`
          *,
          campuses!inner(*),
          departments(*)
        `)
        .single()

      console.log('Database response:', { data: user, error })

      if (error) {
        console.error('Database error:', error)
        
        // Handle specific error types
        if (error.code === '23505') {
          if (error.message.includes('email')) {
            showToast.error('Update Failed', 'A user with this email address already exists. Please use a different email.')
          } else if (error.message.includes('employee_id')) {
            showToast.error('Update Failed', 'A user with this Employee ID already exists. Please use a different Employee ID.')
          } else {
            showToast.error('Update Failed', 'A user with this information already exists. Please check your details.')
          }
        } else {
          showToast.error('Update Failed', `Failed to update user: ${error.message}`)
        }
        return
      }

      // If it's a lecturer, update lecturer record and campus relationships
      if (formData.role === 'lecturer') {
        console.log('Updating lecturer record and campus relationships')
        
        // Update or create lecturer record
        const { data: lecturer, error: lecturerError } = await supabase
          .from('lecturers')
          .upsert({
            user_id: user.id,
            department_id: formData.department_id,
            employee_id: formData.employee_id.trim()
          })
          .select('*')
          .single()

        if (lecturerError) {
          console.error('Error updating lecturer record:', lecturerError)
          showToast.error('Warning', 'User updated but lecturer record failed')
        } else {
          console.log('Lecturer record updated successfully')
        }

        // Update multi-campus relationships
        if (formData.campuses.length > 0) {
          // First, remove existing relationships
          await supabase
            .from('lecturer_campuses')
            .delete()
            .eq('lecturer_id', user.id)

          // Then add new relationships
          const lecturerCampusInserts = formData.campuses.map((campusId, index) => ({
            lecturer_id: user.id,
            campus_id: campusId,
            is_primary: index === 0 // First campus is primary
          }))

          const { error: campusError } = await supabase
            .from('lecturer_campuses')
            .insert(lecturerCampusInserts)

          if (campusError) {
            console.error('Error updating lecturer campus relationships:', campusError)
            showToast.error('Warning', 'User updated but campus assignments failed')
          }
        }
      }

      // Refresh the users list
      await fetchUsers()
      
      // Reset form and close
      setFormData({
        id: '',
        name: '',
        email: '',
        role: 'lecturer',
        campus_id: '',
        department_id: '',
        employee_id: '',
        reg_no: '',
        password: '',
        campuses: []
      })
      setShowForm(false)
      setIsEditing(false)
      setEditingUser(null)
      setEmailError('')
      setEmployeeIdError('')
      
      showToast.success('Success', 'User updated successfully! They can now login with their credentials.')
      
    } catch (error) {
      console.error('Error updating user:', error)
      showToast.error('Error', 'Failed to update user')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateUser = async () => {
    setIsCreating(true)
    try {
      console.log('=== Creating User in Database ===')
      console.log('Form data:', formData)
      
      const { supabase } = await import('@/lib/supabase')
      
      // Ensure we have at least one campus selected
      if (formData.campuses.length === 0) {
        showToast.error('Validation Error', 'Please select at least one campus')
        return
      }

      if (!formData.employee_id.trim()) {
        showToast.error('Validation Error', `Please enter ${formData.role === 'student' ? 'Student ID' : 'Employee ID'}`)
        return
      }

      // Check for validation errors
      if (emailError || employeeIdError) {
        showToast.error('Validation Error', 'Please fix the errors above before submitting')
        return
      }

      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email, employee_id')
        .or(`email.eq.${formData.email.trim()},employee_id.eq.${formData.employee_id.trim()}`)
        .single()

      if (existingUser && !checkError) {
        if (existingUser.email === formData.email.trim()) {
          showToast.error('Validation Error', 'A user with this email address already exists. Please use a different email.')
        } else if (existingUser.employee_id === formData.employee_id.trim()) {
          showToast.error('Validation Error', 'A user with this Employee ID already exists. Please use a different Employee ID.')
        }
        return
      }

      // For now, let's create the user directly in the users table
      // and handle authentication separately
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          password_hash: formData.password || 'temp_password_123', // Store password for now
          campus_id: formData.campuses[0], // Use first selected campus as primary (guaranteed to exist)
          department_id: formData.department_id || null,
          employee_id: formData.employee_id.trim() || null
        })
        .select(`
          *,
          campuses!inner(*),
          departments(*)
        `)
        .single()

      console.log('Database response:', { data: user, error })

      if (error) {
        console.error('Database error:', error)
        
        // Handle specific error types
        if (error.code === '23505') {
          if (error.message.includes('email')) {
            showToast.error('Creation Failed', 'A user with this email address already exists. Please use a different email.')
          } else if (error.message.includes('employee_id')) {
            showToast.error('Creation Failed', 'A user with this Employee ID already exists. Please use a different Employee ID.')
          } else {
            showToast.error('Creation Failed', 'A user with this information already exists. Please check your details.')
          }
        } else {
          showToast.error('Creation Failed', `Failed to create user: ${error.message}`)
        }
        return
      }

      // If it's a lecturer, create lecturer record and campus relationships
      if (formData.role === 'lecturer') {
        console.log('Creating lecturer record and campus relationships')
        
        // Create lecturer record
        const { data: lecturer, error: lecturerError } = await supabase
          .from('lecturers')
          .insert({
            user_id: user.id,
            department_id: formData.department_id,
            employee_id: `EMP${Date.now()}` // Generate employee ID
          })
          .select('*')
          .single()

        if (lecturerError) {
          console.error('Error creating lecturer record:', lecturerError)
          showToast.error('Warning', 'User created but lecturer record failed')
        } else {
          console.log('Lecturer record created successfully')
        }

        // Create multi-campus relationships if campuses selected
        if (formData.campuses.length > 0) {
          const lecturerCampusInserts = formData.campuses.map((campusId, index) => ({
            lecturer_id: user.id,
            campus_id: campusId,
            is_primary: index === 0 // First campus is primary
          }))

          const { error: campusError } = await supabase
            .from('lecturer_campuses')
            .insert(lecturerCampusInserts)

          if (campusError) {
            console.error('Error creating lecturer campus relationships:', campusError)
            showToast.error('Warning', 'User created but campus assignments failed')
          } else {
            console.log('Lecturer campus relationships created successfully')
          }
        }
      }

      console.log('User created successfully, updating list')
      setUsers([user, ...users])
      setFormData({
        id: '',
        name: '',
        email: '',
        role: 'lecturer',
        campus_id: '',
        department_id: '',
        employee_id: '',
        reg_no: '',
        password: '',
        campuses: []
      })
      setShowForm(false)
      showToast.success('User Created', 'User account created successfully! They can now log in with their email and password.')
    } catch (error) {
      console.error('Error creating user:', error)
      showToast.error('Creation Failed', 'Failed to create user')
    } finally {
      setIsCreating(false)
    }
  }

  const handleBulkImport = () => {
    // Mock bulk import functionality
    alert('Bulk import feature will be implemented here')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'dean': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'lecturer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'student': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage lecturers, deans, and students
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex gap-4">
            <Button onClick={() => setShowForm(true)} className="bg-[#1B75BB] hover:bg-[#0d5a8a]">
              <IconPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
            <Button onClick={handleBulkImport} variant="outline">
              <IconUpload className="h-4 w-4 mr-2" />
              Bulk Import (Excel)
            </Button>
            <Button variant="outline">
              <IconDownload className="h-4 w-4 mr-2" />
              Export Users
            </Button>
          </div>

          {/* Create/Edit User Form */}
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{isEditing ? 'Edit User' : 'Create New User'}</CardTitle>
                <CardDescription>
                  {isEditing ? 'Update user information and settings' : 'Create accounts for lecturers, deans, or students'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <IconUser className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <IconMail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value })
                          setEmailError('')
                          // Check for existing user after a short delay
                          setTimeout(() => {
                            checkExistingUser(e.target.value, formData.employee_id)
                          }, 500)
                        }}
                        className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                        placeholder="Enter email address"
                      />
                    </div>
                    {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="lecturer">Lecturer</option>
                      <option value="dean">Department Dean</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <select
                      id="department"
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {formData.role === 'lecturer' ? 'Teaching Campuses' : 'Campus'}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="space-y-2">
                      {campuses.map((campus) => (
                        <label key={campus.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.campuses.includes(campus.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  campuses: [...formData.campuses, campus.id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  campuses: formData.campuses.filter(id => id !== campus.id)
                                })
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{campus.name}</span>
                        </label>
                      ))}
                    </div>
                    {formData.campuses.length === 0 && (
                      <p className="text-red-500 text-xs">Please select at least one campus</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">
                      {formData.role === 'student' ? 'Student ID' : 'Employee ID'} *
                    </Label>
                    <Input
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) => {
                        setFormData({ ...formData, employee_id: e.target.value })
                        setEmployeeIdError('')
                        // Check for existing user after a short delay
                        setTimeout(() => {
                          checkExistingUser(formData.email, e.target.value)
                        }, 500)
                      }}
                      className={employeeIdError ? 'border-red-500' : ''}
                      placeholder={formData.role === 'student' ? 'Enter student ID' : 'Enter employee ID'}
                      required
                    />
                    {employeeIdError && <p className="text-red-500 text-xs">{employeeIdError}</p>}
                  </div>
                  {formData.role === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="reg_no">Registration Number</Label>
                      <Input
                        id="reg_no"
                        value={formData.reg_no}
                        onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
                        placeholder="Enter registration number"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {isEditing ? 'New Password (leave blank to keep current)' : 'Initial Password'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={isEditing ? 'Enter new password (optional)' : 'Enter initial password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                      </button>
                    </div>
                    {isEditing && (
                      <p className="text-xs text-gray-500">
                        Leave password field empty to keep the current password
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generatePassword}
                      className="w-full"
                    >
                      Generate Secure Password
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={isEditing ? handleUpdateUser : handleCreateUser} 
                    disabled={isCreating}
                  >
                    {isCreating 
                      ? (isEditing ? 'Updating...' : 'Creating...') 
                      : (isEditing ? 'Update User' : 'Create User')
                    }
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false)
                      setIsEditing(false)
                      setEditingUser(null)
                      setEmailError('')
                      setEmployeeIdError('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                All Users ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">ID Number</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#1B75BB] rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {user.name.charAt(0)}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {user.employee_id || user.reg_no || 'N/A'}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <IconShield className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
