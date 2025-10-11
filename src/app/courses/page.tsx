'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, BookOpen, Edit } from 'lucide-react'
import { Course, Department, Batch } from '@/lib/types'
import { showToast } from '@/components/ui/toast'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [lecturers, setLecturers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department_id: '',
    batch_id: '',
    lecturer_id: '',
    credits: '3'
  })

  useEffect(() => {
    fetchCourses()
    fetchDepartments()
    fetchBatches()
    fetchLecturers()
  }, [])

  const fetchCourses = async () => {
    try {
      console.log('=== Fetching Courses from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          *,
          departments!inner(*),
          batches!inner(*),
          lecturers!inner(
            *,
            users!inner(*)
          )
        `)
        .order('created_at', { ascending: false })

      console.log('Courses from database:', { data: courses, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Error', 'Failed to fetch courses from database')
        return
      }

      setCourses(courses || [])
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      showToast.error('Error', 'Failed to fetch courses')
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

  const fetchBatches = async () => {
    try {
      console.log('=== Fetching Batches from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      const { data: batches, error } = await supabase
        .from('batches')
        .select(`
          *,
          departments!inner(*)
        `)
        .order('created_at', { ascending: false })

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
    }
  }

  const fetchLecturers = async () => {
    try {
      console.log('=== Fetching Lecturers with Multi-Campus Support ===')
      const { supabase } = await import('@/lib/supabase')
      
      // First try to use the view if it exists
      const { data: lecturers, error } = await supabase
        .from('lecturers_with_campuses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.log('View not available, falling back to basic query')
        // Fallback to basic query if view doesn't exist
        const { data: basicLecturers, error: basicError } = await supabase
          .from('users')
          .select(`
            *,
            campuses!inner(*),
            departments(*)
          `)
          .eq('role', 'lecturer')
          .order('created_at', { ascending: false })

        if (basicError) {
          console.error('Database error:', basicError)
          showToast.error('Error', 'Failed to fetch lecturers from database')
          return
        }

        setLecturers(basicLecturers || [])
        return
      }

      console.log('Lecturers with campuses:', { data: lecturers, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Error', 'Failed to fetch lecturers from database')
        return
      }

      setLecturers(lecturers || [])
    } catch (error) {
      console.error('Failed to fetch lecturers:', error)
      showToast.error('Error', 'Failed to fetch lecturers')
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      console.log('=== Creating Course in Database ===')
      console.log('Form data:', formData)
      
      const { supabase } = await import('@/lib/supabase')
      
      // First, check if lecturer exists in lecturers table, if not create it
      let lecturerRecord = null
      
      // Check if lecturer already exists in lecturers table
      const { data: existingLecturer } = await supabase
        .from('lecturers')
        .select('*')
        .eq('user_id', formData.lecturer_id)
        .single()

      if (existingLecturer) {
        lecturerRecord = existingLecturer
      } else {
        // Create lecturer record if it doesn't exist
        const { data: newLecturer, error: lecturerError } = await supabase
          .from('lecturers')
          .insert({
            user_id: formData.lecturer_id,
            department_id: formData.department_id,
            employee_id: `EMP${Date.now()}` // Generate a temporary employee ID
          })
          .select('*')
          .single()

        if (lecturerError) {
          console.error('Error creating lecturer record:', lecturerError)
          showToast.error('Creation Failed', `Failed to create lecturer record: ${lecturerError.message}`)
          return
        }
        lecturerRecord = newLecturer
      }

      const { data: course, error } = await supabase
        .from('courses')
        .insert({
          name: formData.name.trim(),
          code: formData.code.trim(),
          department_id: formData.department_id,
          batch_id: formData.batch_id,
          lecturer_id: lecturerRecord.id, // Use the lecturer record ID
          credits: parseInt(formData.credits)
        })
        .select(`
          *,
          departments!inner(*),
          batches!inner(*)
        `)
        .single()

      console.log('Database response:', { data: course, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Creation Failed', `Failed to create course: ${error.message}`)
        return
      }

      console.log('Course created successfully, updating list')
      setCourses([course, ...courses])
      setFormData({ name: '', code: '', department_id: '', batch_id: '', lecturer_id: '', credits: '3' })
      setShowForm(false)
      showToast.success('Course Created', 'Course has been created successfully in database!')
    } catch (error) {
      console.error('Failed to create course:', error)
      showToast.error('Creation Failed', 'Failed to create course')
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
            <p className="text-muted-foreground">Loading courses...</p>
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
            <h1 className="text-3xl font-bold">Courses</h1>
            <p className="text-muted-foreground">
              Manage academic courses and assignments
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Course</CardTitle>
              <CardDescription>
                Create a new academic course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Course Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter course name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Course Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., CS201"
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
                    <Label htmlFor="batch_id">Batch</Label>
                    <select
                      id="batch_id"
                      value={formData.batch_id}
                      onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a batch</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lecturer_id">Lecturer</Label>
                    <select
                      id="lecturer_id"
                      value={formData.lecturer_id}
                      onChange={(e) => setFormData({ ...formData, lecturer_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a lecturer</option>
                      {lecturers.map((lecturer) => (
                        <option key={lecturer.id} value={lecturer.id}>
                          {lecturer.name || 'Unknown Lecturer'}
                          {lecturer.campuses && lecturer.campuses.length > 0 && (
                            ` (${lecturer.campuses.map((c: any) => c.name).join(', ')})`
                          )}
                          {lecturer.primary_campus_name && !lecturer.campuses && (
                            ` (${lecturer.primary_campus_name})`
                          )}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                      placeholder="3"
                      min="1"
                      max="6"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Course'}
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
            <CardTitle>All Courses</CardTitle>
            <CardDescription>
              List of all academic courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first course
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Lecturer</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.name}</TableCell>
                      <TableCell>{course.code}</TableCell>
                      <TableCell>
                        {departments.find(dept => dept.id === course.department_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {batches.find(batch => batch.id === course.batch_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {course.lecturers?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>
                        {new Date(course.created_at).toLocaleDateString()}
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
