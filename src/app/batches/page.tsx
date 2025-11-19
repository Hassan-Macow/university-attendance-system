'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Users, Edit, Trash2 } from 'lucide-react'
import { Batch, Department } from '@/lib/types'
import { showToast } from '@/components/ui/toast'

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    year_level: '',
    department_id: '',
    academic_year: ''
  })

  useEffect(() => {
    fetchBatches()
    fetchDepartments()
  }, [])

  const fetchBatches = async () => {
    try {
      console.log('=== Fetching Batches from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      // Get current user to check role
      const { getCurrentUser } = await import('@/lib/auth')
      const currentUser = await getCurrentUser()

      let query = supabase
        .from('batches')
        .select(`
          *,
          departments!inner(*)
        `)
        .order('created_at', { ascending: false })


      const { data: batches, error } = await query

      console.log('Batches from database:', { data: batches, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Error', 'Failed to fetch batches from database')
        return
      }

      setBatches(batches || [])
    } catch (error) {
      console.error('Failed to fetch batches:', error)
      showToast.error('Error', 'Failed to fetch batches')
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
        showToast.error('Error', 'Failed to fetch departments from database')
        return
      }

      setDepartments(departments || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
      showToast.error('Error', 'Failed to fetch departments')
    }
  }

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      console.log('=== Creating Batch in Database ===')
      console.log('Form data:', formData)
      
      const { supabase } = await import('@/lib/supabase')
      
      const { data: batch, error } = await supabase
        .from('batches')
        .insert({
          name: formData.name.trim(),
          year_level: parseInt(formData.year_level),
          department_id: formData.department_id,
          academic_year: formData.academic_year.trim()
        })
        .select(`
          *,
          departments!inner(*)
        `)
        .single()

      console.log('Database response:', { data: batch, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Creation Failed', `Failed to create batch: ${error.message}`)
        return
      }

      console.log('Batch created successfully, updating list')
      setBatches([batch, ...batches])
      setFormData({ name: '', year_level: '', department_id: '', academic_year: '' })
      setShowForm(false)
      showToast.success('Batch Created', 'Batch has been created successfully in database!')
    } catch (error) {
      console.error('Failed to create batch:', error)
      showToast.error('Creation Failed', 'Failed to create batch')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateBatch = async () => {
    if (!editingBatch) return

    try {
      setIsCreating(true)
      console.log('=== Updating Batch ===')
      const { supabase } = await import('@/lib/supabase')

      if (!formData.name || !formData.year_level || !formData.department_id || !formData.academic_year) {
        showToast.error('Validation Error', 'Please fill in all required fields')
        return
      }

      const { data: batch, error } = await supabase
        .from('batches')
        .update({
          name: formData.name.trim(),
          year_level: parseInt(formData.year_level),
          department_id: formData.department_id,
          academic_year: formData.academic_year.trim()
        })
        .eq('id', editingBatch.id)
        .select(`
          *,
          departments!inner(*)
        `)
        .single()

      if (error) {
        console.error('Database error:', error)
        showToast.error('Update Failed', `Failed to update batch: ${error.message}`)
        return
      }

      console.log('Batch updated successfully')
      setBatches(batches.map(b => b.id === editingBatch.id ? batch : b))
      setFormData({ name: '', year_level: '', department_id: '', academic_year: '' })
      setEditingBatch(null)
      setShowForm(false)
      showToast.success('Batch Updated', 'Batch has been updated successfully!')
    } catch (error) {
      console.error('Failed to create batch:', error)
      showToast.error('Creation Failed', 'Failed to create batch')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return

    try {
      setIsCreating(true)
      const { supabase } = await import('@/lib/supabase')

      // Check if batch has students or courses (optional - for warning)
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('batch_id', batchToDelete.id)
        .limit(1)

      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('batch_id', batchToDelete.id)
        .limit(1)

      if (students && students.length > 0) {
        showToast.error('Cannot Delete', 'This batch has students assigned. Please remove students first.')
        setShowDeleteModal(false)
        setBatchToDelete(null)
        return
      }

      if (courses && courses.length > 0) {
        showToast.error('Cannot Delete', 'This batch has courses assigned. Please remove courses first.')
        setShowDeleteModal(false)
        setBatchToDelete(null)
        return
      }

      // Delete the batch
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchToDelete.id)

      if (error) {
        console.error('Database error:', error)
        showToast.error('Deletion Failed', `Failed to delete batch: ${error.message}`)
        return
      }

      // Remove from local state
      setBatches(batches.filter(b => b.id !== batchToDelete.id))
      setShowDeleteModal(false)
      setBatchToDelete(null)
      showToast.success('Batch Deleted', 'Batch has been deleted successfully')
    } catch (error) {
      console.error('Deletion error:', error)
      showToast.error('Error', 'Failed to delete batch')
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
            <p className="text-muted-foreground">Loading batches...</p>
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
            <h1 className="text-3xl font-bold">Batches</h1>
            <p className="text-muted-foreground">
              Manage academic year groups and batches
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Batch
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingBatch ? 'Edit Batch' : 'Add New Batch'}</CardTitle>
              <CardDescription>
                {editingBatch ? 'Update batch information' : 'Create a new academic year group'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault()
                editingBatch ? handleUpdateBatch() : handleCreateBatch(e)
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Batch Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., 2024 Batch"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year_level">Year Level</Label>
                    <Input
                      id="year_level"
                      type="number"
                      value={formData.year_level}
                      onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
                      placeholder="1"
                      min="1"
                      max="5"
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
                  <div className="space-y-2">
                    <Label htmlFor="academic_year">Academic Year</Label>
                    <Input
                      id="academic_year"
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      placeholder="2024-2025"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (editingBatch ? 'Updating...' : 'Creating...') : (editingBatch ? 'Update Batch' : 'Create Batch')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false)
                    setEditingBatch(null)
                    setFormData({ name: '', year_level: '', department_id: '', academic_year: '' })
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
            <CardTitle>All Batches</CardTitle>
            <CardDescription>
              List of all academic year groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No batches found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first batch
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Batch
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Year Level</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.name}</TableCell>
                      <TableCell>{batch.year_level}</TableCell>
                      <TableCell>
                        {departments.find(dept => dept.id === batch.department_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{batch.academic_year}</TableCell>
                      <TableCell>
                        {new Date(batch.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingBatch(batch)
                              setFormData({
                                name: batch.name,
                                year_level: batch.year_level.toString(),
                                department_id: batch.department_id,
                                academic_year: batch.academic_year
                              })
                              setShowForm(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setBatchToDelete(batch)
                              setShowDeleteModal(true)
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && batchToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Delete Batch</CardTitle>
                <CardDescription>
                  Are you sure you want to delete this batch? This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p className="font-medium">{batchToDelete.name}</p>
                  <p className="text-sm text-muted-foreground">Year Level: {batchToDelete.year_level}</p>
                  <p className="text-sm text-muted-foreground">
                    Department: {departments.find(dept => dept.id === batchToDelete.department_id)?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">Academic Year: {batchToDelete.academic_year}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    ⚠️ This will fail if the batch has students or courses assigned. Please remove them first.
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false)
                      setBatchToDelete(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteBatch}
                    disabled={isCreating}
                  >
                    {isCreating ? 'Deleting...' : 'Delete Batch'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
