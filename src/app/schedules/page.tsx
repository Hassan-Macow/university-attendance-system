'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Clock, MapPin, User, BookOpen, Edit, Trash2, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showToast } from '@/components/ui/toast'
import { getCurrentUser } from '@/lib/auth'
import { AuthUser } from '@/lib/auth'

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [allSchedules, setAllSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [lecturers, setLecturers] = useState<any[]>([])
  const [campuses, setCampuses] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'week'>('all')
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isEditingSchedule, setIsEditingSchedule] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<any | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchFilters, setSearchFilters] = useState({
    search: '',
    course_id: '',
    lecturer_id: '',
    campus_id: '',
    startDate: '',
    endDate: ''
  })
  const [formData, setFormData] = useState({
    course_id: '',
    lecturer_id: '',
    campus_id: '',
    schedule_time: '',
    duration_minutes: 60,
    room: '',
    repeat_mode: 'single', // 'single' or 'semester'
    selected_days: [] as string[], // ['monday', 'wednesday', 'friday']
    semester_weeks: 8, // For custom semester duration
    semester_start_date: '', // For custom semester
    semester_end_date: '' // For custom semester
  })

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    const user = await getCurrentUser()
    setCurrentUser(user)
    
    // Pass user to fetchSchedules to ensure filtering works
    await fetchSchedules(user)
    
    // Fetch create form data if user can create schedules (including lecturers)
    if (user && (user.role === 'superadmin' || user.role === 'lecturer')) {
      fetchCourses(user)
      fetchLecturers()
      fetchCampuses()
    }
  }

  // Check if user can create schedules
  const canCreateSchedule = () => {
    return currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'lecturer')
  }

  const fetchSchedules = async (user?: AuthUser | null) => {
    try {
      console.log('=== Fetching Class Schedules from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      // Use passed user or currentUser state
      const activeUser = user || currentUser
      
      let query = supabase
        .from('class_sessions')
        .select(`
          *,
          courses!inner(
            *,
            departments!inner(*),
            lecturers!inner(
              *,
              users!inner(*)
            )
          ),
          campuses!inner(*)
        `)

      // If user is a lecturer, only show their schedules
      if (activeUser && activeUser.role === 'lecturer') {
        console.log('🔒 Filtering schedules for lecturer:', activeUser.id)
        // First get the lecturer ID for this user
        const { data: lecturerData, error: lecturerError } = await supabase
          .from('lecturers')
          .select('id')
          .eq('user_id', activeUser.id)
          .single()
        
        console.log('Lecturer data:', lecturerData, 'Error:', lecturerError)
        
        if (lecturerData) {
          query = query.eq('lecturer_id', lecturerData.id)
          console.log('✅ Applied lecturer filter for lecturer_id:', lecturerData.id)
        } else {
          console.log('⚠️ No lecturer profile found for user')
        }
      } else {
        console.log('👑 Showing all schedules for role:', activeUser?.role)
      }

      const { data: schedules, error } = await query.order('schedule_time', { ascending: true })

      console.log('Class sessions from database:', { data: schedules, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Error', 'Failed to fetch class schedules from database')
        return
      }

      // Transform the data to match the expected format
      const transformedSchedules = schedules?.map(session => ({
        id: session.id,
        course_name: session.courses?.name || 'Unknown Course',
        course_code: session.courses?.code || 'N/A',
        lecturer_name: session.courses?.lecturers?.users?.name || 'Unknown Lecturer',
        campus_name: session.campuses?.name || 'Unknown Campus',
        room: session.room || 'TBD',
        schedule_time: session.schedule_time,
        duration_minutes: session.duration_minutes || 60,
        department_name: session.courses?.departments?.name || 'Unknown Department'
      })) || []

      setSchedules(transformedSchedules)
      setAllSchedules(transformedSchedules)
    } catch (error) {
      console.error('Error fetching schedules:', error)
      showToast.error('Error', 'Failed to fetch class schedules')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter schedules based on selected mode
  const filterSchedules = (mode: 'all' | 'today' | 'week') => {
    setFilterMode(mode)
    
    if (mode === 'all') {
      setSchedules(allSchedules)
      return
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const filtered = allSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.schedule_time)
      
      if (mode === 'today') {
        return scheduleDate >= today && scheduleDate < tomorrow
      } else if (mode === 'week') {
        return scheduleDate >= today && scheduleDate < weekEnd
      }
      return true
    })

    setSchedules(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }

  // Apply search filters (combines with filterMode)
  const applySearchFilters = () => {
    let filtered = [...allSchedules]

    // First apply filterMode (today/week/all)
    if (filterMode === 'today') {
      const now = new Date()
      const todayStart = new Date(now.setHours(0, 0, 0, 0))
      const todayEnd = new Date(now.setHours(23, 59, 59, 999))
      filtered = filtered.filter(s => {
        const scheduleDate = new Date(s.schedule_time)
        return scheduleDate >= todayStart && scheduleDate <= todayEnd
      })
    } else if (filterMode === 'week') {
      const now = new Date()
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      filtered = filtered.filter(s => {
        const scheduleDate = new Date(s.schedule_time)
        return scheduleDate >= weekStart && scheduleDate <= weekEnd
      })
    }

    // Then apply search filters
    // Search text filter
    if (searchFilters.search) {
      const searchLower = searchFilters.search.toLowerCase()
      filtered = filtered.filter(s => 
        s.course_name?.toLowerCase().includes(searchLower) ||
        s.course_code?.toLowerCase().includes(searchLower) ||
        s.lecturer_name?.toLowerCase().includes(searchLower) ||
        s.campus_name?.toLowerCase().includes(searchLower) ||
        s.room?.toLowerCase().includes(searchLower)
      )
    }

    // Course filter
    if (searchFilters.course_id) {
      filtered = filtered.filter(s => s.course_id === searchFilters.course_id)
    }

    // Lecturer filter
    if (searchFilters.lecturer_id) {
      filtered = filtered.filter(s => s.lecturer_id === searchFilters.lecturer_id)
    }

    // Campus filter
    if (searchFilters.campus_id) {
      filtered = filtered.filter(s => s.campus_id === searchFilters.campus_id)
    }

    // Date range filter
    if (searchFilters.startDate) {
      const startDate = new Date(searchFilters.startDate)
      startDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(s => new Date(s.schedule_time) >= startDate)
    }

    if (searchFilters.endDate) {
      const endDate = new Date(searchFilters.endDate)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(s => new Date(s.schedule_time) <= endDate)
    }

    setSchedules(filtered)
    setCurrentPage(1)
  }

  // Clear search filters
  const clearSearchFilters = () => {
    setSearchFilters({
      search: '',
      course_id: '',
      lecturer_id: '',
      campus_id: '',
      startDate: '',
      endDate: ''
    })
    filterSchedules(filterMode) // Reapply the current filterMode
    setCurrentPage(1)
  }

  // Pagination calculations
  const totalPages = Math.ceil(schedules.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSchedules = schedules.slice(startIndex, endIndex)

  const hasActiveSearchFilters = Object.values(searchFilters).some(value => value !== '')

  // Delete schedule handler
  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return

    try {
      const { supabase } = await import('@/lib/supabase')

      const { error } = await supabase
        .from('class_sessions')
        .delete()
        .eq('id', scheduleToDelete.id)

      if (error) {
        console.error('Database error:', error)
        showToast.error('Deletion Failed', `Failed to delete schedule: ${error.message}`)
        return
      }

      // Remove from local state
      setSchedules(schedules.filter(s => s.id !== scheduleToDelete.id))
      setAllSchedules(allSchedules.filter(s => s.id !== scheduleToDelete.id))
      setShowDeleteModal(false)
      setScheduleToDelete(null)
      showToast.success('Schedule Deleted', 'Class schedule has been deleted successfully')
    } catch (error) {
      console.error('Deletion error:', error)
      showToast.error('Error', 'Failed to delete schedule')
    }
  }

  // Handle edit from table
  const handleEditFromTable = (schedule: any) => {
    setSelectedSchedule(schedule)
    setIsEditingSchedule(true)
    setShowDetailsModal(true)
    setFormData({
      course_id: schedule.course_id,
      lecturer_id: schedule.lecturer_id,
      campus_id: schedule.campus_id,
      schedule_time: new Date(schedule.schedule_time).toISOString().slice(0, 16),
      duration_minutes: schedule.duration_minutes || 60,
      room: schedule.room || '',
      repeat_mode: 'single',
      selected_days: [],
      semester_weeks: 8,
      semester_start_date: '',
      semester_end_date: ''
    })
  }

  const fetchCourses = async (user?: AuthUser | null) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const activeUser = user || currentUser
      
      let query = supabase
        .from('courses')
        .select('id, name, code, lecturer_id, department_id')
        .order('name')
      
      // Filter courses for lecturers - only show their own courses
      if (activeUser?.role === 'lecturer') {
        const { data: lecturerData } = await supabase
          .from('lecturers')
          .select('id')
          .eq('user_id', activeUser.id)
          .single()
        
        if (lecturerData) {
          query = query.eq('lecturer_id', lecturerData.id)
        }
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchLecturers = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('lecturers')
        .select(`
          id,
          users!inner(name, email)
        `)
        .order('users(name)')
      
      if (error) throw error
      setLecturers(data || [])
    } catch (error) {
      console.error('Error fetching lecturers:', error)
    }
  }

  const fetchCampuses = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('campuses')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      setCampuses(data || [])
    } catch (error) {
      console.error('Error fetching campuses:', error)
    }
  }


  const handleCreateSchedule = async () => {
    try {
      if (!formData.course_id || !formData.lecturer_id || !formData.campus_id || !formData.schedule_time) {
        showToast.error('Validation Error', 'Please fill in all required fields')
        return
      }

      const { supabase } = await import('@/lib/supabase')
      
      if (formData.repeat_mode === 'single') {
        // Single schedule creation
        const { error } = await supabase
          .from('class_sessions')
          .insert([{
            course_id: formData.course_id,
            lecturer_id: formData.lecturer_id,
            campus_id: formData.campus_id,
            schedule_time: formData.schedule_time,
            duration_minutes: formData.duration_minutes,
            room: formData.room || null
          }])

        if (error) throw error
        showToast.success('Success', 'Class schedule created successfully!')
      } else {
        // Semester-based schedule creation
        if (formData.selected_days.length === 0) {
          showToast.error('Validation Error', 'Please select at least one day for the semester schedule')
          return
        }

        // Use custom dates
        if (!formData.semester_start_date || !formData.semester_end_date) {
          showToast.error('Validation Error', 'Please select start and end dates for the semester')
          return
        }
        const startDate = new Date(formData.semester_start_date)
        const endDate = new Date(formData.semester_end_date)
        const semesterInfo = `${formData.semester_weeks} weeks`

        if (!formData.schedule_time) {
          showToast.error('Validation Error', 'Please select a time for the class')
          return
        }

        // Parse the time from schedule_time (format: YYYY-MM-DDTHH:mm or HH:mm)
        const timeString = formData.schedule_time.includes('T') 
          ? formData.schedule_time.split('T')[1] 
          : formData.schedule_time
        const [hours, minutes] = timeString.split(':').map(Number)

        // Generate schedules for each selected day within the semester
        const schedules: any[] = []
        endDate.setHours(23, 59, 59) // Include the entire end date

        // Day name to day number mapping
        const dayMap: { [key: string]: number } = {
          'sunday': 0,
          'monday': 1,
          'tuesday': 2,
          'wednesday': 3,
          'thursday': 4,
          'friday': 5,
          'saturday': 6
        }

        const selectedDayNumbers = formData.selected_days.map(day => dayMap[day.toLowerCase()])

        // Calculate number of weeks
        const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))

        // Iterate through each day in the semester
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay()
          
          // Check if this day is in the selected days
          if (selectedDayNumbers.includes(dayOfWeek)) {
            const scheduleDateTime = new Date(currentDate)
            scheduleDateTime.setHours(hours, minutes, 0, 0)

            schedules.push({
              course_id: formData.course_id,
              lecturer_id: formData.lecturer_id,
              campus_id: formData.campus_id,
              schedule_time: scheduleDateTime.toISOString(),
              duration_minutes: formData.duration_minutes,
              room: formData.room || null
            })
          }

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1)
        }

        if (schedules.length === 0) {
          showToast.error('Validation Error', 'No valid dates found for the selected days in the semester')
          return
        }

        // Insert all schedules at once
        const { error } = await supabase
          .from('class_sessions')
          .insert(schedules)

        if (error) throw error

        const sessionsPerWeek = formData.selected_days.length
        const totalWeeks = Math.ceil(schedules.length / sessionsPerWeek)
        showToast.success('Success', `Created ${schedules.length} class sessions for ${totalWeeks} weeks (${semesterInfo})!`)
      }

      setShowCreateForm(false)
      setFormData({
        course_id: '',
        lecturer_id: '',
        campus_id: '',
        schedule_time: '',
        duration_minutes: 60,
        room: '',
        repeat_mode: 'single',
        selected_days: [],
        semester_weeks: 8,
        semester_start_date: '',
        semester_end_date: ''
      })
      fetchSchedules()
    } catch (error) {
      console.error('Error creating schedule:', error)
      showToast.error('Error', 'Failed to create class schedule')
    }
  }

  const handleUpdateSchedule = async () => {
    try {
      if (!selectedSchedule || !formData.schedule_time) {
        showToast.error('Validation Error', 'Please fill in all required fields')
        return
      }

      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('class_sessions')
        .update({
          course_id: formData.course_id,
          lecturer_id: formData.lecturer_id,
          campus_id: formData.campus_id,
          schedule_time: formData.schedule_time,
          duration_minutes: formData.duration_minutes,
          room: formData.room || null
        })
        .eq('id', selectedSchedule.id)

      if (error) throw error

      showToast.success('Success', 'Schedule updated successfully!')
      setIsEditingSchedule(false)
      setShowDetailsModal(false)
      setSelectedSchedule(null)
      await fetchSchedules(currentUser)
    } catch (error) {
      console.error('Error updating schedule:', error)
      showToast.error('Error', 'Failed to update schedule')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (dateString: string) => {
    const now = new Date()
    const scheduleDate = new Date(dateString)
    const diffInHours = (scheduleDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 0) return 'text-muted-foreground'
    if (diffInHours < 1) return 'text-green-600'
    if (diffInHours < 24) return 'text-blue-600'
    return 'text-foreground'
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading schedules...</p>
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
            <h1 className="text-3xl font-bold">Class Schedules</h1>
            <p className="text-muted-foreground">
              {canCreateSchedule() ? 'View and manage class schedules' : 'View your assigned class schedules'}
            </p>
            {currentUser?.role === 'lecturer' && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                <Calendar className="h-4 w-4" />
                <span>Read-only view • Contact admin to schedule classes</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {canCreateSchedule() && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Class
              </Button>
            )}
            <Button 
              variant={filterMode === 'today' ? 'default' : 'outline'}
              onClick={() => filterSchedules('today')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </Button>
            <Button 
              variant={filterMode === 'week' ? 'default' : 'outline'}
              onClick={() => filterSchedules('week')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              This Week
            </Button>
            {filterMode !== 'all' && (
              <Button 
                variant="ghost"
                onClick={() => filterSchedules('all')}
              >
                Clear Filter
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle className="text-lg">Search & Filters</CardTitle>
              </div>
              {hasActiveSearchFilters && (
                <Button variant="outline" size="sm" onClick={clearSearchFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by course, lecturer, campus..."
                    value={searchFilters.search}
                    onChange={(e) => setSearchFilters({...searchFilters, search: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter_course">Course</Label>
                <select
                  id="filter_course"
                  value={searchFilters.course_id}
                  onChange={(e) => setSearchFilters({...searchFilters, course_id: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter_lecturer">Lecturer</Label>
                <select
                  id="filter_lecturer"
                  value={searchFilters.lecturer_id}
                  onChange={(e) => setSearchFilters({...searchFilters, lecturer_id: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Lecturers</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.users?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter_campus">Campus</Label>
                <select
                  id="filter_campus"
                  value={searchFilters.campus_id}
                  onChange={(e) => setSearchFilters({...searchFilters, campus_id: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Campuses</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={searchFilters.startDate}
                  onChange={(e) => setSearchFilters({...searchFilters, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={searchFilters.endDate}
                  onChange={(e) => setSearchFilters({...searchFilters, endDate: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={applySearchFilters} className="bg-[#1B75BB] hover:bg-[#0d5a8a]">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              {hasActiveSearchFilters && (
                <Button variant="outline" onClick={clearSearchFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
            {hasActiveSearchFilters && (
              <div className="mt-2 text-sm text-muted-foreground">
                Showing {schedules.length} of {allSchedules.length} schedules
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Schedule Form - Only for SuperAdmin */}
        {showCreateForm && canCreateSchedule() && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Class</CardTitle>
              <CardDescription>
                Create a new class schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Schedule Mode Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Schedule Type *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="single"
                        checked={formData.repeat_mode === 'single'}
                        onChange={(e) => setFormData({...formData, repeat_mode: e.target.value as 'single' | 'semester'})}
                        className="w-4 h-4"
                      />
                      <span>Single Schedule</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="semester"
                        checked={formData.repeat_mode === 'semester'}
                        onChange={(e) => setFormData({...formData, repeat_mode: e.target.value as 'single' | 'semester'})}
                        className="w-4 h-4"
                      />
                      <span>Semester Schedule (Weekly Recurring)</span>
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Course *</label>
                    <select
                      value={formData.course_id}
                      onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select a course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Lecturer *</label>
                    <select
                      value={formData.lecturer_id}
                      onChange={(e) => setFormData({...formData, lecturer_id: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select a lecturer</option>
                      {lecturers.map(lecturer => (
                        <option key={lecturer.id} value={lecturer.id}>
                          {lecturer.users?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Campus *</label>
                    <select
                      value={formData.campus_id}
                      onChange={(e) => setFormData({...formData, campus_id: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select a campus</option>
                      {campuses.map(campus => (
                        <option key={campus.id} value={campus.id}>
                          {campus.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.repeat_mode === 'single' ? (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Schedule Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={formData.schedule_time}
                        onChange={(e) => setFormData({...formData, schedule_time: e.target.value})}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Semester Start Date *</label>
                        <input
                          type="date"
                          value={formData.semester_start_date}
                          onChange={(e) => setFormData({...formData, semester_start_date: e.target.value})}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Semester End Date *</label>
                        <input
                          type="date"
                          value={formData.semester_end_date}
                          onChange={(e) => {
                            const endDate = e.target.value
                            setFormData({...formData, semester_end_date: endDate})
                            // Auto-calculate weeks
                            if (formData.semester_start_date && endDate) {
                              const start = new Date(formData.semester_start_date)
                              const end = new Date(endDate)
                              const weeks = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
                              setFormData(prev => ({...prev, semester_end_date: endDate, semester_weeks: weeks}))
                            }
                          }}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Semester Duration (weeks)</label>
                        <input
                          type="number"
                          value={formData.semester_weeks}
                          onChange={(e) => {
                            const weeks = parseInt(e.target.value) || 8
                            setFormData({...formData, semester_weeks: weeks})
                            // Auto-calculate end date
                            if (formData.semester_start_date) {
                              const start = new Date(formData.semester_start_date)
                              const end = new Date(start)
                              end.setDate(end.getDate() + (weeks * 7))
                              setFormData(prev => ({...prev, semester_weeks: weeks, semester_end_date: end.toISOString().split('T')[0]}))
                            }
                          }}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background"
                          min="4"
                          max="20"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Class Time *</label>
                        <input
                          type="time"
                          value={formData.schedule_time ? (formData.schedule_time.includes('T') ? formData.schedule_time.split('T')[1].slice(0, 5) : formData.schedule_time) : ''}
                          onChange={(e) => {
                            const time = e.target.value
                            const date = formData.semester_start_date || new Date().toISOString().split('T')[0]
                            setFormData({...formData, schedule_time: `${date}T${time}`})
                          }}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Days of Week *</label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <label key={day} className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-accent">
                              <input
                                type="checkbox"
                                checked={formData.selected_days.includes(day.toLowerCase())}
                                onChange={(e) => {
                                  const days = e.target.checked
                                    ? [...formData.selected_days, day.toLowerCase()]
                                    : formData.selected_days.filter(d => d !== day.toLowerCase())
                                  setFormData({...formData, selected_days: days})
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{day.slice(0, 3)}</span>
                            </label>
                          ))}
                        </div>
                        {formData.selected_days.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Selected: {formData.selected_days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-sm font-medium mb-2 block">Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 60})}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      min="30"
                      max="180"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Room</label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) => setFormData({...formData, room: e.target.value})}
                      placeholder="e.g., Room 101, Lab A"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                </div>

                {formData.repeat_mode === 'semester' && formData.selected_days.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm font-medium mb-2">Semester Schedule Preview:</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        <strong>Days:</strong> {formData.selected_days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                      </p>
                      {formData.semester_start_date && formData.semester_end_date && (
                        <p>
                          <strong>Duration:</strong> {new Date(formData.semester_start_date).toLocaleDateString()} to {new Date(formData.semester_end_date).toLocaleDateString()} ({formData.semester_weeks} weeks)
                        </p>
                      )}
                      {formData.schedule_time && (
                        <p>
                          <strong>Time:</strong> {formData.schedule_time.includes('T') ? new Date(formData.schedule_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : formData.schedule_time}
                        </p>
                      )}
                      {formData.selected_days.length > 0 && formData.semester_weeks > 0 && (
                        <p className="text-green-600 dark:text-green-400 font-medium mt-2">
                          This will create approximately <strong>{formData.selected_days.length * formData.semester_weeks} class sessions</strong> ({formData.selected_days.length} sessions/week × {formData.semester_weeks} weeks)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <Button onClick={handleCreateSchedule}>
                    {formData.repeat_mode === 'semester' ? 'Create Semester Schedule' : 'Create Schedule'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowCreateForm(false)
                    setFormData({
                      course_id: '',
                      lecturer_id: '',
                      campus_id: '',
                      schedule_time: '',
                      duration_minutes: 60,
                      room: '',
                      repeat_mode: 'single',
                      selected_days: [],
                      semester_weeks: 8,
                      semester_start_date: '',
                      semester_end_date: ''
                    })
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {filterMode === 'today' ? "Today's Classes" : filterMode === 'week' ? 'This Week\'s Classes' : 'Upcoming Classes'}
            </CardTitle>
            <CardDescription>
              {filterMode === 'today' 
                ? 'Classes scheduled for today' 
                : filterMode === 'week' 
                ? 'Classes scheduled for this week' 
                : 'List of scheduled classes and sessions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No schedules found</h3>
                <p className="text-muted-foreground">
                  {filterMode === 'today' 
                    ? 'No classes scheduled for today' 
                    : filterMode === 'week' 
                    ? 'No classes scheduled for this week' 
                    : 'No classes are scheduled at the moment'}
                </p>
              </div>
            ) : paginatedSchedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No schedules match your filters</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                {hasActiveSearchFilters && (
                  <Button variant="outline" onClick={clearSearchFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Lecturer</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSchedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{schedule.course_name}</div>
                            <div className="text-sm text-muted-foreground">{schedule.course_code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {schedule.lecturer_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-2 ${getStatusColor(schedule.schedule_time)}`}>
                          <Clock className="h-4 w-4" />
                          {formatTime(schedule.schedule_time)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{schedule.campus_name}</div>
                            <div className="text-sm text-muted-foreground">Room {schedule.room}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{schedule.duration_minutes} min</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedSchedule(schedule)
                              setShowDetailsModal(true)
                            }}
                          >
                            View Details
                          </Button>
                          {canCreateSchedule() && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditFromTable(schedule)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setScheduleToDelete(schedule)
                                  setShowDeleteModal(true)
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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
                        className="flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                      <span className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, schedules.length)} of {schedules.length} schedules
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
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && scheduleToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Schedule</CardTitle>
              <CardDescription>
                Are you sure you want to delete this class schedule? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <p className="font-medium">{scheduleToDelete.course_name}</p>
                <p className="text-sm text-muted-foreground">Course: {scheduleToDelete.course_code}</p>
                <p className="text-sm text-muted-foreground">Lecturer: {scheduleToDelete.lecturer_name}</p>
                <p className="text-sm text-muted-foreground">
                  Time: {formatTime(scheduleToDelete.schedule_time)}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  ⚠️ This will also delete all attendance records for this session.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setScheduleToDelete(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSchedule}
                >
                  Delete Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Details Modal */}
      {showDetailsModal && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{selectedSchedule.course_name}</h2>
                  <p className="text-muted-foreground">{selectedSchedule.course_code}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedSchedule(null)
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Course Info */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Course
                </h3>
                {isEditingSchedule ? (
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg">{selectedSchedule.course_name} ({selectedSchedule.course_code})</p>
                )}
              </div>

              {/* Lecturer Info */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Lecturer
                </h3>
                {isEditingSchedule ? (
                  <select
                    value={formData.lecturer_id}
                    onChange={(e) => setFormData({...formData, lecturer_id: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="">Select a lecturer</option>
                    {lecturers.map(lecturer => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.users?.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg">{selectedSchedule.lecturer_name}</p>
                )}
              </div>

              {/* Schedule Time */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Schedule
                </h3>
                {isEditingSchedule ? (
                  <input
                    type="datetime-local"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                ) : (
                  <p className="text-lg">
                    {new Date(selectedSchedule.schedule_time).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
                {isEditingSchedule ? (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-md"
                      min="15"
                      step="15"
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground">Duration: {selectedSchedule.duration_minutes} minutes</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </h3>
                {isEditingSchedule ? (
                  <div className="space-y-2">
                    <select
                      value={formData.campus_id}
                      onChange={(e) => setFormData({...formData, campus_id: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select a campus</option>
                      {campuses.map(campus => (
                        <option key={campus.id} value={campus.id}>
                          {campus.name}
                        </option>
                      ))}
                    </select>
                    <label className="text-sm text-muted-foreground">Room</label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="e.g., House 100"
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-lg">{selectedSchedule.campus_name}</p>
                    <p className="text-muted-foreground">Room: {selectedSchedule.room}</p>
                  </>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Department
                </h3>
                <p className="text-lg">{selectedSchedule.department_name}</p>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 dark:bg-gray-900">
              {currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'lecturer') && (
                <div className="flex gap-3">
                  {isEditingSchedule ? (
                    <>
                      <Button
                        onClick={() => {
                          setIsEditingSchedule(false)
                          setFormData({
                            course_id: '',
                            lecturer_id: '',
                            campus_id: '',
                            schedule_time: '',
                            duration_minutes: 60,
                            room: '',
                            repeat_mode: 'single',
                            selected_days: [],
                            semester_weeks: 8,
                            semester_start_date: '',
                            semester_end_date: ''
                          })
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateSchedule}
                        className="flex-1"
                      >
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setIsEditingSchedule(true)
                          setFormData({
                            course_id: selectedSchedule.course_id,
                            lecturer_id: selectedSchedule.lecturer_id,
                            campus_id: selectedSchedule.campus_id,
                            schedule_time: new Date(selectedSchedule.schedule_time).toISOString().slice(0, 16),
                            duration_minutes: selectedSchedule.duration_minutes || 60,
                            room: selectedSchedule.room || '',
                            repeat_mode: 'single',
                            selected_days: [],
                            semester_weeks: 8,
                            semester_start_date: '',
                            semester_end_date: ''
                          })
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          setShowDetailsModal(false)
                          setSelectedSchedule(null)
                          setIsEditingSchedule(false)
                        }}
                        className="flex-1"
                      >
                        Close
                      </Button>
                    </>
                  )}
                </div>
              )}
              {currentUser && (currentUser.role === 'lecturer' || currentUser.role === 'student') && (
                <Button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedSchedule(null)
                  }}
                  className="w-full"
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
