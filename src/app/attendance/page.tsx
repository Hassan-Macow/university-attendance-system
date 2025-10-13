'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle, XCircle, Clock, MapPin, Users, BookOpen, Calendar } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { showToast } from '@/components/ui/toast'

interface ClassSession {
  id: string
  course_id: string
  course_name: string
  course_code: string
  batch_id: string
  batch_name: string
  department_id: string
  department_name: string
  schedule_time: string
  duration_minutes: number
  room?: string
  campus_id: string
  campus_name: string
  campus_latitude: number
  campus_longitude: number
  campus_radius: number
}

interface Student {
  id: string
  full_name: string
  reg_no: string
  attendance_status?: 'present' | 'absent'
  attendance_time?: string
  attendance_id?: string
}

export default function AttendancePage() {
  const [availableSessions, setAvailableSessions] = useState<ClassSession[]>([])
  const [currentSession, setCurrentSession] = useState<ClassSession | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTakingAttendance, setIsTakingAttendance] = useState(false)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [attendanceSubmittedAt, setAttendanceSubmittedAt] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  useEffect(() => {
    loadData()
    getCurrentLocation()
  }, [])

  // Timer effect - check every second if 15 minutes have passed
  useEffect(() => {
    if (!attendanceSubmittedAt) return

    const interval = setInterval(() => {
      const now = new Date()
      const elapsed = now.getTime() - attendanceSubmittedAt.getTime()
      const fifteenMinutes = 15 * 60 * 1000 // 15 minutes in milliseconds
      const remaining = fifteenMinutes - elapsed

      if (remaining <= 0) {
        setTimeRemaining(null)
        setAttendanceSubmittedAt(null)
        clearInterval(interval)
      } else {
        setTimeRemaining(Math.ceil(remaining / 1000)) // seconds remaining
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [attendanceSubmittedAt])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (user && user.role === 'lecturer') {
      await fetchLecturerSessions(user.id)
    }
  }

  const fetchLecturerSessions = async (userId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Get lecturer ID
      const { data: lecturerData } = await supabase
        .from('lecturers')
        .select('id')
        .eq('user_id', userId)
        .single()
      
      if (!lecturerData) {
        showToast.error('Error', 'Lecturer profile not found')
        setIsLoading(false)
        return
      }

      // Get today's and upcoming sessions for this lecturer (next 7 days)
      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const endOfWeek = new Date(nextWeek.setHours(23, 59, 59, 999)).toISOString()

      const { data: sessions, error } = await supabase
        .from('class_sessions')
        .select(`
          id,
          schedule_time,
          duration_minutes,
          room,
          lecturer_id,
          courses!inner(
            id,
            name,
            code,
            lecturer_id,
            department_id,
            batches!inner(
              id,
              name
            ),
            departments!inner(
              id,
              name
            )
          ),
          campuses!inner(
            id,
            name,
            latitude,
            longitude,
            allowed_radius
          )
        `)
        .eq('lecturer_id', lecturerData.id)
        .gte('schedule_time', startOfDay)
        .lte('schedule_time', endOfWeek)
        .order('schedule_time', { ascending: true })

      if (error) {
        console.error('Error fetching sessions:', error)
        showToast.error('Error', 'Failed to fetch class sessions')
        setIsLoading(false)
        return
      }

      const transformedSessions: ClassSession[] = sessions?.map((session: any) => ({
        id: session.id,
        course_id: session.courses.id,
        course_name: session.courses.name,
        course_code: session.courses.code,
        batch_id: session.courses.batches.id,
        batch_name: session.courses.batches.name,
        department_id: session.courses.departments.id,
        department_name: session.courses.departments.name,
        schedule_time: session.schedule_time,
        duration_minutes: session.duration_minutes,
        room: session.room,
        campus_id: session.campuses.id,
        campus_name: session.campuses.name,
        campus_latitude: session.campuses.latitude,
        campus_longitude: session.campuses.longitude,
        campus_radius: session.campuses.allowed_radius
      })) || []

      setAvailableSessions(transformedSessions)
      
      // Auto-select the first session
      if (transformedSessions.length > 0) {
        await selectSession(transformedSessions[0])
      } else {
        console.log('⚠️ No class sessions found for the next 7 days')
        showToast.error('No Sessions', 'No class sessions scheduled for the next 7 days. Please contact admin to schedule classes.')
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading sessions:', error)
      showToast.error('Error', 'Failed to load attendance data')
      setIsLoading(false)
    }
  }

  const selectSession = async (session: ClassSession) => {
    setCurrentSession(session)
    await fetchStudentsForSession(session)
  }

  const fetchStudentsForSession = async (session: ClassSession) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      console.log('📚 Fetching students for session:', {
        course_name: session.course_name,
        department_id: session.department_id,
        department_name: session.department_name,
        batch_id: session.batch_id,
        batch_name: session.batch_name
      })
      
      // Get students enrolled in this specific department AND batch
      // Students must match BOTH department_id AND batch_id
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, reg_no, batch_id, department_id')
        .eq('department_id', session.department_id)
        .eq('batch_id', session.batch_id)
        .order('full_name', { ascending: true })

      console.log('👥 Students query result:', {
        count: studentsData?.length || 0,
        students: studentsData?.map(s => ({ 
          name: s.full_name, 
          dept_id: s.department_id, 
          batch_id: s.batch_id 
        })),
        error: studentsError
      })

      if (studentsError) {
        console.error('Error fetching students:', studentsError)
        showToast.error('Error', 'Failed to fetch students')
        return
      }
      
      if (!studentsData || studentsData.length === 0) {
        console.warn('⚠️ No students found for batch:', session.batch_id)
        showToast.error('No Students', `No students found in ${session.batch_name}. Please ensure students are assigned to this batch.`)
        setStudents([])
        return
      }

      // Get existing attendance records for this session
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('id, student_id, status, timestamp')
        .eq('session_id', session.id)

      // Merge students with their attendance status
      const studentsWithAttendance: Student[] = studentsData?.map((student: any) => {
        const attendance = attendanceData?.find((a: any) => a.student_id === student.id)
        return {
          id: student.id,
          full_name: student.full_name,
          reg_no: student.reg_no,
          attendance_status: attendance?.status,
          attendance_time: attendance?.timestamp,
          attendance_id: attendance?.id
        }
      }) || []

      setStudents(studentsWithAttendance)
      
      // Select all students by default
      setSelectedStudents(new Set(studentsWithAttendance.map(s => s.id)))
    } catch (error) {
      console.error('Error fetching students:', error)
      showToast.error('Error', 'Failed to fetch students')
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      // Deselect all
      setSelectedStudents(new Set())
    } else {
      // Select all
      setSelectedStudents(new Set(students.map(s => s.id)))
    }
  }

  const handleSubmitAttendance = async () => {
    if (!isWithinCampusRadius()) {
      showToast.error('Location Error', 'You must be within the campus radius to take attendance')
      return
    }

    if (!currentSession) {
      showToast.error('Error', 'No session selected')
      return
    }

    setIsTakingAttendance(true)

    try {
      const { supabase } = await import('@/lib/supabase')
      const currentUser = await getCurrentUser()
      const now = new Date().toISOString()

      // Prepare attendance records for ALL students
      const attendanceRecords = students.map(student => ({
        session_id: currentSession.id,
        student_id: student.id,
        status: selectedStudents.has(student.id) ? 'present' : 'absent',
        timestamp: now,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude
      }))

      // Delete existing attendance for this session
      await supabase
        .from('attendance')
        .delete()
        .eq('session_id', currentSession.id)

      // Insert all new records
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceRecords)
        .select('id, student_id, status')

      if (error) throw error

      // Update local state for all students
      setStudents(prev => prev.map(student => {
        const attendanceRecord = data?.find((a: any) => a.student_id === student.id)
        return {
          ...student,
          attendance_status: attendanceRecord?.status,
          attendance_time: now,
          attendance_id: attendanceRecord?.id
        }
      }))

      const presentCount = selectedStudents.size
      const absentCount = students.length - selectedStudents.size
      
      // Set submission time to start the 15-minute timer
      setAttendanceSubmittedAt(new Date())
      
      showToast.success('Success', `Attendance submitted: ${presentCount} present, ${absentCount} absent. You can edit for 15 minutes.`)
    } catch (error: any) {
      console.error('Failed to submit attendance:', error)
      const errorMessage = error?.message || 'Failed to submit attendance'
      showToast.error('Error', errorMessage)
    } finally {
      setIsTakingAttendance(false)
    }
  }

  const handleMarkSelectedAsPresent = async () => {
    if (!isWithinCampusRadius()) {
      showToast.error('Location Error', 'You must be within the campus radius to take attendance')
      return
    }

    if (!currentSession) {
      showToast.error('Error', 'No session selected')
      return
    }

    if (selectedStudents.size === 0) {
      showToast.error('Error', 'No students selected')
      return
    }

    setIsTakingAttendance(true)

    try {
      const { supabase } = await import('@/lib/supabase')
      const currentUser = await getCurrentUser()
      const now = new Date().toISOString()

      // Prepare attendance data for selected students
      const selectedStudentsList = students.filter(s => selectedStudents.has(s.id))
      const attendanceRecords = selectedStudentsList.map(student => ({
        session_id: currentSession.id,
        student_id: student.id,
        status: 'present' as const,
        timestamp: now,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude
      }))

      // Delete existing attendance for selected students
      await supabase
        .from('attendance')
        .delete()
        .eq('session_id', currentSession.id)
        .in('student_id', Array.from(selectedStudents))

      // Insert new records
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceRecords)
        .select('id, student_id')

      if (error) throw error

      // Update local state for selected students
      setStudents(prev => prev.map(student => {
        if (selectedStudents.has(student.id)) {
          const attendanceRecord = data?.find((a: any) => a.student_id === student.id)
          return {
            ...student,
            attendance_status: 'present' as const,
            attendance_time: now,
            attendance_id: attendanceRecord?.id
          }
        }
        return student
      }))

      showToast.success('Success', `Marked ${selectedStudents.size} student(s) as present`)
    } catch (error: any) {
      console.error('Failed to mark selected as present:', error)
      const errorMessage = error?.message || 'Failed to mark selected students as present'
      showToast.error('Error', errorMessage)
    } finally {
      setIsTakingAttendance(false)
    }
  }

  const handleMarkUnselectedAsAbsent = async () => {
    if (!isWithinCampusRadius()) {
      showToast.error('Location Error', 'You must be within the campus radius to take attendance')
      return
    }

    if (!currentSession) {
      showToast.error('Error', 'No session selected')
      return
    }

    const unselectedStudents = students.filter(s => !selectedStudents.has(s.id))
    
    if (unselectedStudents.length === 0) {
      showToast.error('Error', 'All students are selected')
      return
    }

    setIsTakingAttendance(true)

    try {
      const { supabase } = await import('@/lib/supabase')
      const currentUser = await getCurrentUser()
      const now = new Date().toISOString()

      // Prepare attendance data for unselected students
      const attendanceRecords = unselectedStudents.map(student => ({
        session_id: currentSession.id,
        student_id: student.id,
        status: 'absent' as const,
        timestamp: now,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude
      }))

      const unselectedIds = unselectedStudents.map(s => s.id)

      // Delete existing attendance for unselected students
      await supabase
        .from('attendance')
        .delete()
        .eq('session_id', currentSession.id)
        .in('student_id', unselectedIds)

      // Insert new records
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceRecords)
        .select('id, student_id')

      if (error) throw error

      // Update local state for unselected students
      setStudents(prev => prev.map(student => {
        if (!selectedStudents.has(student.id)) {
          const attendanceRecord = data?.find((a: any) => a.student_id === student.id)
          return {
            ...student,
            attendance_status: 'absent' as const,
            attendance_time: now,
            attendance_id: attendanceRecord?.id
          }
        }
        return student
      }))

      showToast.success('Success', `Marked ${unselectedStudents.length} student(s) as absent`)
    } catch (error: any) {
      console.error('Failed to mark unselected as absent:', error)
      const errorMessage = error?.message || 'Failed to mark unselected students as absent'
      showToast.error('Error', errorMessage)
    } finally {
      setIsTakingAttendance(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
        setLocationError(null)
      },
      (error) => {
        setLocationError('Unable to retrieve your location')
        console.error('Location error:', error)
      }
    )
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  const isWithinCampusRadius = (): boolean => {
    if (!userLocation || !currentSession) return false
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      currentSession.campus_latitude,
      currentSession.campus_longitude
    )
    
    return distance <= currentSession.campus_radius
  }

  const handleAttendanceStatus = async (studentId: string, status: 'present' | 'absent') => {
    if (!isWithinCampusRadius()) {
      showToast.error('Location Error', 'You must be within the campus radius to take attendance')
      return
    }

    if (!currentSession) {
      showToast.error('Error', 'No session selected')
      return
    }

    setIsTakingAttendance(true)

    try {
      const { supabase } = await import('@/lib/supabase')
      const student = students.find(s => s.id === studentId)
      
      if (!student) return

      const currentUser = await getCurrentUser()
      const now = new Date().toISOString()
      const attendanceData = {
        session_id: currentSession.id,
        student_id: studentId,
        status: status,
        timestamp: now,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude
      }

      // Check if attendance already exists
      if (student.attendance_id) {
        // Update existing attendance
        const { error } = await supabase
          .from('attendance')
          .update({
            status: status,
            timestamp: now,
            latitude: userLocation?.latitude,
            longitude: userLocation?.longitude
          })
          .eq('id', student.attendance_id)

        if (error) throw error
        
        showToast.success('Success', `Updated ${student.full_name} to ${status}`)
      } else {
        // Create new attendance record
        const { data, error } = await supabase
          .from('attendance')
          .insert([attendanceData])
          .select('id')
          .single()

        if (error) throw error

        showToast.success('Success', `Marked ${student.full_name} as ${status}`)
        
        // Update local state with new attendance ID
        setStudents(prev => prev.map(s => 
          s.id === studentId 
            ? { ...s, attendance_status: status, attendance_time: new Date().toISOString(), attendance_id: data.id }
            : s
        ))
        return
      }

      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === studentId 
          ? { ...s, attendance_status: status, attendance_time: new Date().toISOString() }
          : s
      ))
    } catch (error: any) {
      console.error('Failed to update attendance:', error)
      const errorMessage = error?.message || 'Failed to update attendance'
      showToast.error('Error', errorMessage)
    } finally {
      setIsTakingAttendance(false)
    }
  }


  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const isAttendanceLocked = (): boolean => {
    return attendanceSubmittedAt !== null && timeRemaining === null
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
      case 'absent':
        return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4" />
      case 'absent':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading attendance session...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!currentSession) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No active class session</h3>
          <p className="text-muted-foreground">
            There are no classes scheduled at this time
          </p>
        </div>
      </MainLayout>
    )
  }

  const attendanceStats = {
    total: students.length,
    present: students.filter(s => s.attendance_status === 'present').length,
    absent: students.filter(s => s.attendance_status === 'absent').length,
    pending: students.filter(s => !s.attendance_status).length
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="p-8">
          <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Take Attendance</h1>
          <p className="text-muted-foreground">
            Mark student attendance for your class sessions
          </p>
        </div>

        {/* Session Selector */}
        {availableSessions.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Class Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {availableSessions.map((session) => (
                  <Button
                    key={session.id}
                    variant={currentSession?.id === session.id ? 'default' : 'outline'}
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => selectSession(session)}
                  >
                    <div className="font-semibold">{session.course_name}</div>
                    <div className="text-sm opacity-80">{session.course_code}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(session.schedule_time).toLocaleTimeString()} • {session.room}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Stats */}
        {currentSession && students.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{attendanceStats.total}</div>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                <p className="text-xs text-muted-foreground">Present</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                <p className="text-xs text-muted-foreground">Absent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-600">{attendanceStats.pending}</div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Session Info */}
        {currentSession && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Current Class Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Course</Label>
                <p className="text-lg font-semibold">{currentSession.course_name}</p>
                <p className="text-sm text-muted-foreground">{currentSession.course_code}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Batch</Label>
                <p className="text-lg font-semibold">{currentSession.batch_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Time & Location</Label>
                <p className="text-lg font-semibold">
                  {new Date(currentSession.schedule_time).toLocaleTimeString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentSession.room} • {currentSession.campus_name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Duration</Label>
                <p className="text-lg font-semibold">{currentSession.duration_minutes} minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Location Status */}
        {currentSession && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              {locationError ? (
                <div className="text-red-600">
                  <p className="font-medium">Location Error</p>
                  <p className="text-sm">{locationError}</p>
                  <Button 
                    onClick={getCurrentLocation} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : userLocation ? (
                <div className={isWithinCampusRadius() ? 'text-green-600' : 'text-red-600'}>
                  <p className="font-medium">
                    {isWithinCampusRadius() ? '✓ Within Campus Radius' : '✗ Outside Campus Radius'}
                  </p>
                  <p className="text-sm">
                    Distance: {userLocation ? Math.round(calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      currentSession.campus_latitude,
                      currentSession.campus_longitude
                    )) : 0}m (Max: {currentSession.campus_radius}m)
                  </p>
                </div>
              ) : (
                <div className="text-yellow-600">
                  <p className="font-medium">Getting Location...</p>
                  <p className="text-sm">Please allow location access to take attendance</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Students List */}
        {currentSession && students.length > 0 && (
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Students ({students.length})
                </CardTitle>
                <CardDescription>
                  Check present students, uncheck absent students, then click Submit Attendance
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitAttendance}
                  disabled={isTakingAttendance || !isWithinCampusRadius() || isAttendanceLocked()}
                  className={isAttendanceLocked() ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isAttendanceLocked() 
                    ? 'Attendance Locked' 
                    : `Submit Attendance (${selectedStudents.size} Present, ${students.length - selectedStudents.size} Absent)`
                  }
                </Button>
                {timeRemaining !== null && (
                  <span className="text-xs text-orange-600 font-medium">
                    ⏱️ Edit time remaining: {formatTimeRemaining(timeRemaining)}
                  </span>
                )}
                {isAttendanceLocked() && (
                  <span className="text-xs text-red-600 font-medium">
                    🔒 Attendance locked - 15 minutes have passed
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedStudents.size === students.length && students.length > 0}
                      onChange={toggleSelectAll}
                      disabled={isAttendanceLocked()}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </TableHead>
                  <TableHead className="font-medium">Student</TableHead>
                  <TableHead className="font-medium">Registration No</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Time</TableHead>
                  <TableHead className="text-right font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        disabled={isAttendanceLocked()}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{student.reg_no}</TableCell>
                    <TableCell>
                      {student.attendance_status ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.attendance_status)}`}>
                          {getStatusIcon(student.attendance_status)}
                          <span className="capitalize">{student.attendance_status}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not marked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.attendance_time 
                        ? new Date(student.attendance_time).toLocaleTimeString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAttendanceStatus(student.id, 'present')}
                          disabled={isTakingAttendance || !isWithinCampusRadius() || isAttendanceLocked()}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAttendanceStatus(student.id, 'absent')}
                          disabled={isTakingAttendance || !isWithinCampusRadius() || isAttendanceLocked()}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Absent
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
