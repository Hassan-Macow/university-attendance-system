'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react'
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
  const [formData, setFormData] = useState({
    course_id: '',
    lecturer_id: '',
    campus_id: '',
    schedule_time: '',
    duration_minutes: 60,
    room: ''
  })

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    const user = await getCurrentUser()
    setCurrentUser(user)
    
    // Pass user to fetchSchedules to ensure filtering works
    await fetchSchedules(user)
    
    // Only fetch create form data if user can create schedules
    if (user && (user.role === 'superadmin' || user.role === 'dean')) {
      fetchCourses()
      fetchLecturers()
      fetchCampuses()
    }
  }

  // Check if user can create schedules
  const canCreateSchedule = () => {
    return currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'dean')
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
      } else if (activeUser && activeUser.role === 'dean') {
        console.log('🔒 Filtering schedules for dean:', activeUser.id)
        // Get dean's department
        const { data: userData } = await supabase
          .from('users')
          .select('department_id')
          .eq('id', activeUser.id)
          .single()

        if (userData?.department_id) {
          query = query.eq('courses.department_id', userData.department_id)
          console.log('✅ Applied dean filter for department_id:', userData.department_id)
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
  }

  const fetchCourses = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, code')
        .order('name')
      
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
      setShowCreateForm(false)
      setFormData({
        course_id: '',
        lecturer_id: '',
        campus_id: '',
        schedule_time: '',
        duration_minutes: 60,
        room: ''
      })
      fetchSchedules()
    } catch (error) {
      console.error('Error creating schedule:', error)
      showToast.error('Error', 'Failed to create class schedule')
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

        {/* Create Schedule Form - Only for SuperAdmin and Dean */}
        {showCreateForm && canCreateSchedule() && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Class</CardTitle>
              <CardDescription>
                Create a new class schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Schedule Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({...formData, schedule_time: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  />
                </div>

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

              <div className="flex gap-2 mt-6">
                <Button onClick={handleCreateSchedule}>
                  Create Schedule
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
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
            ) : (
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
                  {schedules.map((schedule) => (
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
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
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
