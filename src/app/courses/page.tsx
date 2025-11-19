'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, BookOpen, Edit, Filter, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Course, Department, Batch, Program } from '@/lib/types'
import { showToast } from '@/components/ui/toast'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [lecturers, setLecturers] = useState<any[]>([]) // For filter dropdown (lecturer records)
  const [lecturerUsers, setLecturerUsers] = useState<any[]>([]) // For form dropdown (user records)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    department_id: '',
    program_id: '',
    batch_id: '',
    lecturer_id: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department_id: '',
    program_id: '',
    batch_id: '',
    lecturer_id: '',
    credits: '3'
  })

  useEffect(() => {
    fetchCourses()
    fetchDepartments()
    fetchPrograms()
    fetchBatches()
    fetchLecturers()
    fetchLecturerUsers()
  }, [])

  const fetchCourses = async () => {
    try {
      console.log('=== Fetching Courses from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      // Get current user to check role
      const { getCurrentUser } = await import('@/lib/auth')
      const currentUser = await getCurrentUser()

      let query = supabase
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


      const { data: courses, error } = await query

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

  const fetchPrograms = async () => {
    try {
      console.log('=== Fetching Programs from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      const { data: programs, error } = await supabase
        .from('programs')
        .select(`
          *,
          departments!inner(*)
        `)
        .order('created_at', { ascending: false })

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
      console.log('=== Fetching Lecturers for Course Filter ===')
      const { supabase } = await import('@/lib/supabase')
      
      // Fetch lecturer records with user info for the filter dropdown
      // We need lecturer table IDs to match with course.lecturer_id
      const { data: lecturerRecords, error: lecturerError } = await supabase
        .from('lecturers')
        .select(`
          id,
          user_id,
          employee_id,
          users!inner(
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (lecturerError) {
        console.error('Database error:', lecturerError)
        showToast.error('Error', 'Failed to fetch lecturers from database')
        return
      }

      // Transform to include lecturer ID and user info
      const lecturersWithInfo = (lecturerRecords || []).map(lecturer => ({
        id: lecturer.id, // This is the lecturer table ID that matches course.lecturer_id
        lecturer_id: lecturer.id,
        user_id: lecturer.user_id,
        name: lecturer.users?.name || 'Unknown Lecturer',
        email: lecturer.users?.email || '',
        employee_id: lecturer.employee_id
      }))

      setLecturers(lecturersWithInfo)
    } catch (error) {
      console.error('Failed to fetch lecturers:', error)
      showToast.error('Error', 'Failed to fetch lecturers')
    }
  }

  const fetchLecturerUsers = async () => {
    try {
      console.log('=== Fetching Lecturer Users for Course Form ===')
      const { supabase } = await import('@/lib/supabase')
      
      // Fetch users with role 'lecturer' for the form dropdown
      // The form uses user_id to look up/create lecturer records
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          employee_id
        `)
        .eq('role', 'lecturer')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Error', 'Failed to fetch lecturer users from database')
        return
      }

      setLecturerUsers(users || [])
    } catch (error) {
      console.error('Failed to fetch lecturer users:', error)
      showToast.error('Error', 'Failed to fetch lecturer users')
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      console.log('=== Creating Course in Database ===')
      console.log('Form data:', formData)
      
      // Validate required fields
      if (!formData.name || !formData.code || !formData.department_id || !formData.batch_id || !formData.lecturer_id) {
        showToast.error('Validation Error', 'Please fill in all required fields')
        return
      }
      
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
          program_id: formData.program_id || null,
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
      setFormData({ name: '', code: '', department_id: '', program_id: '', batch_id: '', lecturer_id: '', credits: '3' })
      setShowForm(false)
      showToast.success('Course Created', 'Course has been created successfully in database!')
    } catch (error) {
      console.error('Creation error:', error)
      showToast.error('Error', 'Failed to create course')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateCourse = async () => {
    if (!editingCourse) return

    try {
      setIsCreating(true)
      console.log('=== Updating Course ===')
      const { supabase } = await import('@/lib/supabase')

      if (!formData.name || !formData.code || !formData.department_id || !formData.batch_id || !formData.lecturer_id) {
        showToast.error('Validation Error', 'Please fill in all required fields')
        return
      }

      // Get lecturer record ID from user_id (same logic as create)
      let lecturerRecord = null
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
            employee_id: `EMP${Date.now()}`
          })
          .select('*')
          .single()

        if (lecturerError) {
          console.error('Error creating lecturer record:', lecturerError)
          showToast.error('Update Failed', `Failed to create lecturer record: ${lecturerError.message}`)
          return
        }
        lecturerRecord = newLecturer
      }

      const { data: course, error } = await supabase
        .from('courses')
        .update({
          name: formData.name.trim(),
          code: formData.code.trim(),
          department_id: formData.department_id,
          program_id: formData.program_id || null,
          batch_id: formData.batch_id,
          lecturer_id: lecturerRecord.id, // Use the lecturer record ID
          credits: parseInt(formData.credits)
        })
        .eq('id', editingCourse.id)
        .select(`
          *,
          departments!inner(*),
          batches!inner(*),
          lecturers!inner(
            *,
            users!inner(*)
          )
        `)
        .single()

      if (error) {
        console.error('Database error:', error)
        showToast.error('Update Failed', `Failed to update course: ${error.message}`)
        return
      }

      console.log('Course updated successfully')
      setCourses(courses.map(c => c.id === editingCourse.id ? course : c))
      setFormData({ name: '', code: '', department_id: '', program_id: '', batch_id: '', lecturer_id: '', credits: '3' })
      setEditingCourse(null)
      setShowForm(false)
      showToast.success('Course Updated', 'Course has been updated successfully!')
    } catch (error) {
      console.error('Failed to create course:', error)
      showToast.error('Creation Failed', 'Failed to create course')
    } finally {
      setIsCreating(false)
    }
  }

  // Filter courses based on selected filters
  const filteredCourses = courses.filter(course => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        course.name?.toLowerCase().includes(searchLower) ||
        course.code?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Department filter
    if (filters.department_id && course.department_id !== filters.department_id) {
      return false
    }

    // Program filter
    if (filters.program_id) {
      if (course.program_id !== filters.program_id) {
        return false
      }
    }

    // Batch filter
    if (filters.batch_id && course.batch_id !== filters.batch_id) {
      return false
    }

    // Lecturer filter
    if (filters.lecturer_id && course.lecturer_id !== filters.lecturer_id) {
      return false
    }

    return true
  })

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  const clearFilters = () => {
    setFilters({
      search: '',
      department_id: '',
      program_id: '',
      batch_id: '',
      lecturer_id: ''
    })
    setCurrentPage(1) // Reset to first page when clearing filters
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return

    try {
      setIsCreating(true)
      const { supabase } = await import('@/lib/supabase')

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete.id)

      if (error) {
        console.error('Database error:', error)
        showToast.error('Deletion Failed', `Failed to delete course: ${error.message}`)
        return
      }

      // Remove from local state
      setCourses(courses.filter(c => c.id !== courseToDelete.id))
      setShowDeleteModal(false)
      setCourseToDelete(null)
      showToast.success('Course Deleted', 'Course has been deleted successfully')
    } catch (error) {
      console.error('Deletion error:', error)
      showToast.error('Error', 'Failed to delete course')
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
              <CardTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</CardTitle>
              <CardDescription>
                {editingCourse ? 'Update course information' : 'Create a new academic course'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault()
                editingCourse ? handleUpdateCourse() : handleCreateCourse(e)
              }} className="space-y-4">
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
                    <Label htmlFor="program_id">Program (Optional)</Label>
                    <select
                      id="program_id"
                      value={formData.program_id}
                      onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">No program</option>
                      {programs
                        .filter(prog => !formData.department_id || prog.department_id === formData.department_id)
                        .map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.name} ({program.code})
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
                          {batch.name} - Year {batch.year_level} ({batch.departments?.name || 'N/A'})
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
                      {lecturerUsers.map((lecturer) => (
                        <option key={lecturer.id} value={lecturer.id}>
                          {lecturer.name || 'Unknown Lecturer'}
                          {lecturer.employee_id && ` (${lecturer.employee_id})`}
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
                    {isCreating ? (editingCourse ? 'Updating...' : 'Creating...') : (editingCourse ? 'Update Course' : 'Create Course')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false)
                    setEditingCourse(null)
                    setFormData({ name: '', code: '', department_id: '', program_id: '', batch_id: '', lecturer_id: '', credits: '3' })
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>All Courses</CardTitle>
                <CardDescription>
                  List of all academic courses
                </CardDescription>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters Section */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filters
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by name or code..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter_department">Department</Label>
                  <select
                    id="filter_department"
                    value={filters.department_id}
                    onChange={(e) => {
                      setFilters({...filters, department_id: e.target.value, program_id: ''})
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter_program">Program</Label>
                  <select
                    id="filter_program"
                    value={filters.program_id}
                    onChange={(e) => setFilters({...filters, program_id: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!filters.department_id}
                  >
                    <option value="">All Programs</option>
                    {programs
                      .filter(prog => !filters.department_id || prog.department_id === filters.department_id)
                      .map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name} ({program.code})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter_batch">Batch</Label>
                  <select
                    id="filter_batch"
                    value={filters.batch_id}
                    onChange={(e) => setFilters({...filters, batch_id: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Batches</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} - Year {batch.year_level}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter_lecturer">Lecturer</Label>
                  <select
                    id="filter_lecturer"
                    value={filters.lecturer_id}
                    onChange={(e) => setFilters({...filters, lecturer_id: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Lecturers</option>
                    {lecturers.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.name || 'Unknown Lecturer'}
                        {lecturer.employee_id && ` (${lecturer.employee_id})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCourses.length} of {courses.length} courses
                </div>
              )}
            </div>

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
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses match your filters</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filter criteria
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Lecturer</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.name}</TableCell>
                      <TableCell>{course.code}</TableCell>
                      <TableCell>
                        {departments.find(dept => dept.id === course.department_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {course.program_id ? (programs.find(prog => prog.id === course.program_id)?.name || 'N/A') : '-'}
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              setEditingCourse(course)
                              // Need to get user_id from lecturer_id for the form
                              const { supabase } = await import('@/lib/supabase')
                              const { data: lecturerRecord } = await supabase
                                .from('lecturers')
                                .select('user_id')
                                .eq('id', course.lecturer_id)
                                .single()
                              
                              setFormData({
                                name: course.name,
                                code: course.code,
                                department_id: course.department_id,
                                program_id: course.program_id || '',
                                batch_id: course.batch_id,
                                lecturer_id: lecturerRecord?.user_id || course.lecturer_id,
                                credits: course.credits.toString()
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
                              setCourseToDelete(course)
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="itemsPerPage" className="text-sm text-muted-foreground">
                        Items per page:
                      </Label>
                      <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                      <span className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredCourses.length)} of {filteredCourses.length} courses
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="min-w-[2.5rem]"
                              >
                                {page}
                              </Button>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="px-2">...</span>
                          }
                          return null
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && courseToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Delete Course</CardTitle>
                <CardDescription>
                  Are you sure you want to delete this course? This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p className="font-medium">{courseToDelete.name}</p>
                  <p className="text-sm text-muted-foreground">Code: {courseToDelete.code}</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false)
                      setCourseToDelete(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteCourse}
                    disabled={isCreating}
                  >
                    {isCreating ? 'Deleting...' : 'Delete Course'}
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
