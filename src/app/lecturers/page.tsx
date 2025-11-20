'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, User, Edit, Mail } from 'lucide-react'
import { Lecturer, Department } from '@/lib/types'
import { showToast } from '@/components/ui/toast'

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department_id: '',
    employee_id: ''
  })

  useEffect(() => {
    fetchLecturers()
    fetchDepartments()
  }, [])

  const fetchLecturers = async () => {
    try {
      console.log('=== Fetching Lecturers from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      // Get current user to check role
      const { getCurrentUser } = await import('@/lib/auth')
      const currentUser = await getCurrentUser()

      let query = supabase
        .from('lecturers')
        .select(`
          *,
          users!inner(*),
          departments!inner(*)
        `)
        .order('created_at', { ascending: false })

      // Filter removed - superadmin sees all
      if (false && currentUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('department_id')
          .eq('id', currentUser?.id || '')
          .single()

        if (userData?.department_id) {
          query = query.eq('department_id', userData?.department_id)
        }
      }

      const { data: lecturers, error } = await query

      console.log('Lecturers from database:', { data: lecturers, error })

      if (error) {
        console.error('Database error:', error)
        return
      }

      setLecturers(lecturers || [])
    } catch (error) {
      console.error('Failed to fetch lecturers:', error)
    } finally {
      setIsLoading(false)
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
        return
      }

      setDepartments(departments || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const handleCreateLecturer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      console.log('=== Creating Lecturer in Database ===')
      console.log('Form data:', formData)
      
      const { supabase } = await import('@/lib/supabase')
      
      // First create the user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: 'lecturer'
        })
        .select()
        .single()

      if (userError) {
        console.error('User creation error:', userError)
        showToast.error('Creation Failed', `Failed to create user: ${userError.message}`)
        return
      }

      console.log('User created:', user)

      // Then create the lecturer record
      const { data: lecturer, error: lecturerError } = await supabase
        .from('lecturers')
        .insert({
          user_id: user.id,
          department_id: formData.department_id,
          employee_id: formData.employee_id.trim()
        })
        .select(`
          *,
          users!inner(*),
          departments!inner(*)
        `)
        .single()

      console.log('Lecturer creation response:', { data: lecturer, error: lecturerError })

      if (lecturerError) {
        console.error('Lecturer creation error:', lecturerError)
        showToast.error('Creation Failed', `Failed to create lecturer: ${lecturerError.message}`)
        return
      }

      console.log('Lecturer created successfully, updating list')
      setLecturers([lecturer, ...lecturers])
      setFormData({ name: '', email: '', department_id: '', employee_id: '' })
      setShowForm(false)
      showToast.success('Lecturer Created', 'Lecturer has been created successfully in database!')
    } catch (error) {
      console.error('Failed to create lecturer:', error)
      showToast.error('Creation Failed', 'Failed to create lecturer')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading lecturers...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="p-8">
          <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Lecturers</h1>
            <p className="text-muted-foreground">
              Manage faculty members and their assignments
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lecturer
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Lecturer</CardTitle>
              <CardDescription>
                Create a new faculty member account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateLecturer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="lecturer@university.edu"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee ID</Label>
                    <Input
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      placeholder="EMP001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department_id">Department</Label>
                    <select
                      id="department_id"
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Lecturer'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Lecturers</CardTitle>
            <CardDescription>
              List of all faculty members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lecturers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No lecturers found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first lecturer
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lecturer
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lecturers.map((lecturer) => (
                    <TableRow key={lecturer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          N/A
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          N/A
                        </div>
                      </TableCell>
                      <TableCell>{lecturer.employee_id || 'N/A'}</TableCell>
                      <TableCell>
                        {departments.find(dept => dept.id === lecturer.department_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(lecturer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
