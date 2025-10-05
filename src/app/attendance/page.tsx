'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle, XCircle, Clock, MapPin, Users, BookOpen } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'

interface ClassSession {
  id: string
  course_name: string
  course_code: string
  schedule_time: string
  duration_minutes: number
  room?: string
  campus_name: string
  campus_latitude: number
  campus_longitude: number
  campus_radius: number
}

interface Student {
  id: string
  full_name: string
  reg_no: string
  attendance_status?: 'present' | 'absent' | 'late'
  attendance_time?: string
}

export default function AttendancePage() {
  const [currentSession, setCurrentSession] = useState<ClassSession | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTakingAttendance, setIsTakingAttendance] = useState(false)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    fetchCurrentSession()
    getCurrentLocation()
  }, [])

  const fetchCurrentSession = async () => {
    try {
      // Mock data for now - in real app, fetch from API
      const mockSession: ClassSession = {
        id: '1',
        course_name: 'Data Structures and Algorithms',
        course_code: 'CS201',
        schedule_time: new Date().toISOString(),
        duration_minutes: 60,
        room: 'A101',
        campus_name: 'Main Campus',
        campus_latitude: 40.7128,
        campus_longitude: -74.0060,
        campus_radius: 100
      }
      
      setCurrentSession(mockSession)
      
      // Mock students data
      const mockStudents: Student[] = [
        { id: '1', full_name: 'John Doe', reg_no: 'CS2024001' },
        { id: '2', full_name: 'Jane Smith', reg_no: 'CS2024002' },
        { id: '3', full_name: 'Bob Johnson', reg_no: 'CS2024003' },
        { id: '4', full_name: 'Alice Brown', reg_no: 'CS2024004' }
      ]
      
      setStudents(mockStudents)
    } catch (error) {
      console.error('Failed to fetch current session:', error)
    } finally {
      setIsLoading(false)
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

  const handleAttendanceStatus = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!isWithinCampusRadius()) {
      alert('You must be within the campus radius to take attendance')
      return
    }

    setIsTakingAttendance(true)

    try {
      // Update local state
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? { ...student, attendance_status: status, attendance_time: new Date().toISOString() }
          : student
      ))

      // In real app, send to API
      console.log(`Marked student ${studentId} as ${status}`)
    } catch (error) {
      console.error('Failed to update attendance:', error)
      alert('Failed to update attendance')
    } finally {
      setIsTakingAttendance(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-50'
      case 'late':
        return 'text-yellow-600 bg-yellow-50'
      case 'absent':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4" />
      case 'late':
        return <Clock className="h-4 w-4" />
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="p-8">
          <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Take Attendance</h1>
          <p className="text-muted-foreground">
            Mark student attendance for the current class session
          </p>
        </div>

        {/* Current Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Current Class Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Course</Label>
                <p className="text-lg font-semibold">{currentSession.course_name}</p>
                <p className="text-sm text-muted-foreground">{currentSession.course_code}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Time & Location</Label>
                <p className="text-lg font-semibold">
                  {new Date(currentSession.schedule_time).toLocaleString()}
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

        {/* Location Status */}
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

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students ({students.length})
            </CardTitle>
            <CardDescription>
              Click the buttons to mark attendance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Registration No</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.reg_no}</TableCell>
                    <TableCell>
                      {student.attendance_status ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.attendance_status)}`}>
                          {getStatusIcon(student.attendance_status)}
                          {student.attendance_status}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not marked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.attendance_time 
                        ? new Date(student.attendance_time).toLocaleTimeString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAttendanceStatus(student.id, 'present')}
                          disabled={isTakingAttendance || !isWithinCampusRadius()}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAttendanceStatus(student.id, 'late')}
                          disabled={isTakingAttendance || !isWithinCampusRadius()}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Late
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAttendanceStatus(student.id, 'absent')}
                          disabled={isTakingAttendance || !isWithinCampusRadius()}
                          className="text-red-600 hover:text-red-700"
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
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
