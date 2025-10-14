'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, GraduationCap, Edit, Trash2 } from 'lucide-react'
import { Program, Department } from '@/lib/types'
import { showToast } from '@/components/ui/toast'

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department_id: '',
    description: ''
  })

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    const { getCurrentUser } = await import('@/lib/auth')
    const user = await getCurrentUser()
    setCurrentUser(user)
    fetchPrograms()
    fetchDepartments()
  }

  const fetchPrograms = async () => {
    try {
      console.log('=== Fetching Programs from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      // Get current user to check role
      const { getCurrentUser } = await import('@/lib/auth')
      const currentUser = await getCurrentUser()

      let query = supabase
        .from('programs')
        .select(`
          *,
          departments!inner(*)
        `)
        .order('created_at', { ascending: false })

      // If user is a dean, filter by their department
      if (currentUser?.role === 'dean') {
        const { data: userData } = await supabase
          .from('users')
          .select('department_id')
          .eq('id', currentUser.id)
          .single()

        if (userData?.department_id) {
          query = query.eq('department_id', userData.department_id)
        }
      }

      const { data: programs, error } = await query

      console.log('Programs from database:', { data: programs, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Error', 'Failed to fetch programs from database')
        return
      }

      setPrograms(programs || [])
    } catch (error) {
      console.error('Failed to fetch programs:', error)
      showToast.error('Error', 'Failed to fetch programs')
    } finally {
      setIsLoading(false)
    }
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
        .select('*')
        .order('created_at', { ascending: false })

      // If user is a dean, filter by their department
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
    }
  }

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      console.log('=== Creating Program in Database ===')
      console.log('Form data:', formData)
      
      const { supabase } = await import('@/lib/supabase')
      
      const { data: program, error } = await supabase
        .from('programs')
        .insert({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          department_id: formData.department_id,
          description: formData.description.trim() || null
        })
        .select(`
          *,
          departments!inner(*)
        `)
        .single()

      console.log('Database response:', { data: program, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Creation Failed', `Failed to create program: ${error.message}`)
        return
      }

      console.log('Program created successfully, updating list')
      setPrograms([program, ...programs])
      setFormData({ name: '', code: '', department_id: '', description: '' })
      setShowForm(false)
      showToast.success('Program Created', 'Program has been created successfully in database!')
    } catch (error) {
      console.error('Failed to create program:', error)
      showToast.error('Creation Failed', 'Failed to create program')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateProgram = async () => {
    if (!editingProgram) return

    try {
      setIsCreating(true)
      console.log('=== Updating Program ===')
      const { supabase } = await import('@/lib/supabase')

      if (!formData.name || !formData.code || !formData.department_id) {
        showToast.error('Validation Error', 'Please fill in all required fields')
        return
      }

      const { data: program, error } = await supabase
        .from('programs')
        .update({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          department_id: formData.department_id,
          description: formData.description.trim() || null
        })
        .eq('id', editingProgram.id)
        .select(`
          *,
          departments!inner(*)
        `)
        .single()

      if (error) {
        console.error('Database error:', error)
        showToast.error('Update Failed', `Failed to update program: ${error.message}`)
        return
      }

      console.log('Program updated successfully')
      setPrograms(programs.map(p => p.id === editingProgram.id ? program : p))
      setFormData({ name: '', code: '', department_id: '', description: '' })
      setEditingProgram(null)
      setShowForm(false)
      showToast.success('Program Updated', 'Program has been updated successfully!')
    } catch (error) {
      console.error('Failed to update program:', error)
      showToast.error('Update Failed', 'Failed to update program')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProgram = async (programId: string, programName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${programName}? This action cannot be undone.`)) {
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId)

      if (error) {
        console.error('Failed to delete program:', error)
        showToast.error('Delete Failed', `Failed to delete program: ${error.message}`)
        return
      }

      setPrograms(programs.filter(p => p.id !== programId))
      showToast.success('Success!', 'Program deleted successfully')
    } catch (error) {
      console.error('Failed to delete program:', error)
      showToast.error('Error', 'Failed to delete program')
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading programs...</p>
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
            <h1 className="text-3xl font-bold">Programs</h1>
            <p className="text-muted-foreground">
              {currentUser?.role === 'dean' ? 'Manage programs in your department' : 'Manage academic programs within departments'}
            </p>
          </div>
          <Button onClick={() => {
            setEditingProgram(null)
            setFormData({ name: '', code: '', department_id: currentUser?.role === 'dean' && currentUser?.department_id ? currentUser.department_id : '', description: '' })
            setShowForm(!showForm)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Program
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingProgram ? 'Edit Program' : 'Add New Program'}</CardTitle>
              <CardDescription>
                {editingProgram ? 'Update program information' : 'Create a new academic program'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e: React.FormEvent) => {
                e.preventDefault()
                editingProgram ? handleUpdateProgram() : handleCreateProgram(e)
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Program Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Information Technology"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Program Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., IT"
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
                      disabled={currentUser?.role === 'dean'}
                    >
                      <option value="">Select a department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the program"
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (editingProgram ? 'Updating...' : 'Creating...') : (editingProgram ? 'Update Program' : 'Create Program')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false)
                    setEditingProgram(null)
                    setFormData({ name: '', code: '', department_id: '', description: '' })
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Programs</CardTitle>
            <CardDescription>
              List of all academic programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programs.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No programs found</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Program
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell>{program.code}</TableCell>
                      <TableCell>
                        {departments.find(dept => dept.id === program.department_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {program.description || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(program.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingProgram(program)
                              setFormData({
                                name: program.name,
                                code: program.code,
                                department_id: program.department_id,
                                description: program.description || ''
                              })
                              setShowForm(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteProgram(program.id, program.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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
