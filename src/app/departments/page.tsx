'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Building2, Edit } from 'lucide-react'
import { Department, Campus } from '@/lib/types'
import { showToast } from '@/components/ui/toast'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    campus_id: ''
  })

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    const { getCurrentUser } = await import('@/lib/auth')
    const user = await getCurrentUser()
    setCurrentUser(user)
    fetchDepartments()
    fetchCampuses()
  }

  const fetchDepartments = async () => {
    try {
      console.log('=== Fetching Departments from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      // Get current user to check role
      const { getCurrentUser } = await import('@/lib/auth')
      const currentUser = await getCurrentUser()

      let query = supabase
        .from('departments')
        .select(`
          *,
          campuses!inner(*)
        `)
        .order('created_at', { ascending: false })

      // If user is a dean, filter by their department only
      if (currentUser?.role === 'dean') {
        const { data: userData } = await supabase
          .from('users')
          .select('department_id')
          .eq('id', currentUser.id)
          .single()

        if (userData?.department_id) {
          query = query.eq('id', userData.department_id)
        }
      }

      const { data: departments, error } = await query

      console.log('Departments from database:', { data: departments, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Error', 'Failed to fetch departments from database')
        return
      }

      setDepartments(departments || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
      showToast.error('Error', 'Failed to fetch departments')
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
      console.error('Failed to fetch campuses:', error)
      showToast.error('Error', 'Failed to fetch campuses')
    }
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      console.log('=== Creating Department in Database ===')
      console.log('Form data:', formData)
      
      const { supabase } = await import('@/lib/supabase')
      
      const { data: department, error } = await supabase
        .from('departments')
        .insert({
          name: formData.name,
          campus_id: formData.campus_id
        })
        .select(`
          *,
          campuses!inner(*)
        `)
        .single()

      console.log('Database response:', { data: department, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Creation Failed', `Failed to create department: ${error.message}`)
        return
      }

      console.log('Department created successfully, updating list')
      setDepartments([department, ...departments])
      setFormData({ name: '', campus_id: '' })
      setShowForm(false)
      showToast.success('Department Created', 'Department has been created successfully in database!')
    } catch (error) {
      console.error('Failed to create department:', error)
      showToast.error('Creation Failed', 'Failed to create department')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditDepartment = (department: Department) => {
    setEditingId(department.id)
    setIsEditing(true)
    setFormData({
      name: department.name,
      campus_id: department.campus_id
    })
    setShowForm(true)
  }

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    setIsCreating(true)

    try {
      console.log('=== Updating Department ===')
      console.log('Form data:', formData)
      
      const response = await fetch('/api/departments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingId,
          ...formData
        }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.data) {
        console.log('Department updated successfully, updating list')
        setDepartments(departments.map(dept => 
          dept.id === editingId ? data.data : dept
        ))
        setFormData({ name: '', campus_id: '' })
        setShowForm(false)
        setIsEditing(false)
        setEditingId(null)
        showToast.success('Department Updated', 'Department has been updated successfully!')
      } else {
        console.log('Error updating department:', data.error)
        showToast.error('Update Failed', data.error || 'Failed to update department')
      }
    } catch (error) {
      console.error('Failed to update department:', error)
      showToast.error('Update Failed', 'Failed to update department')
    } finally {
      setIsCreating(false)
    }
  }


  const handleCancel = () => {
    setFormData({ name: '', campus_id: '' })
    setShowForm(false)
    setIsEditing(false)
    setEditingId(null)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading departments...</p>
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
            <h1 className="text-3xl font-bold">Departments</h1>
            <p className="text-muted-foreground">
              {currentUser?.role === 'dean' ? 'View your assigned department' : 'Manage academic departments within campuses'}
            </p>
          </div>
          {currentUser?.role === 'superadmin' && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          )}
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Department' : 'Add New Department'}</CardTitle>
              <CardDescription>
                {isEditing ? 'Update the department details' : 'Create a new academic department'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={isEditing ? handleUpdateDepartment : handleCreateDepartment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Department Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter department name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campus_id">Campus</Label>
                    <select
                      id="campus_id"
                      value={formData.campus_id}
                      onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a campus</option>
                      {campuses.map((campus) => (
                        <option key={campus.id} value={campus.id}>
                          {campus.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Department' : 'Create Department')}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
            <CardDescription>
              List of all academic departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departments.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No departments found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first department
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead>Created</TableHead>
                    {currentUser?.role === 'superadmin' && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>
                        {campuses.find(campus => campus.id === department.campus_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(department.created_at).toLocaleDateString()}
                      </TableCell>
                      {currentUser?.role === 'superadmin' && (
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditDepartment(department)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
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
