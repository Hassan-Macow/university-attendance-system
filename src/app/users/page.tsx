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
  IconTrash,
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

interface User {
  id: string
  name: string
  email: string
  role: 'superadmin' | 'dean' | 'lecturer' | 'student'
  campus_id: string
  department_id?: string
  employee_id?: string
  reg_no?: string
  created_at: string
  updated_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'lecturer' as const,
    campus_id: '',
    department_id: '',
    employee_id: '',
    reg_no: '',
    password: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // Mock data for demonstration
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Dr. John Smith',
          email: 'john.smith@university.edu',
          role: 'dean',
          campus_id: 'campus-1',
          department_id: 'dept-1',
          employee_id: 'EMP001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Dr. Jane Doe',
          email: 'jane.doe@university.edu',
          role: 'lecturer',
          campus_id: 'campus-1',
          department_id: 'dept-1',
          employee_id: 'EMP002',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Ahmed Hassan',
          email: 'ahmed.hassan@student.university.edu',
          role: 'student',
          campus_id: 'campus-1',
          department_id: 'dept-1',
          reg_no: 'STU001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
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

  const handleCreateUser = async () => {
    setIsCreating(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        campus_id: formData.campus_id,
        department_id: formData.department_id,
        employee_id: formData.employee_id,
        reg_no: formData.reg_no,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setUsers([...users, newUser])
      setFormData({
        name: '',
        email: '',
        role: 'lecturer',
        campus_id: '',
        department_id: '',
        employee_id: '',
        reg_no: '',
        password: ''
      })
      setShowForm(false)
      alert('User created successfully!')
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Error creating user')
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

          {/* Create User Form */}
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
                <CardDescription>
                  Create accounts for lecturers, deans, or students
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
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="lecturer">Lecturer</option>
                      <option value="dean">Department Dean</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campus">Campus</Label>
                    <select
                      id="campus"
                      value={formData.campus_id}
                      onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Campus</option>
                      <option value="campus-1">Main Campus</option>
                      <option value="campus-2">North Campus</option>
                    </select>
                  </div>
                  {formData.role !== 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="employee_id">Employee ID</Label>
                      <Input
                        id="employee_id"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        placeholder="Enter employee ID"
                      />
                    </div>
                  )}
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
                    <Label htmlFor="password">Initial Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter initial password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                      </button>
                    </div>
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
                  <Button onClick={handleCreateUser} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
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
                            <Button variant="outline" size="sm">
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <IconShield className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <IconTrash className="h-4 w-4" />
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
