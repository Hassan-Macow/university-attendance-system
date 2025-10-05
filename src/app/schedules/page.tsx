'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react'

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      // Mock data for now
      setSchedules([
        {
          id: '1',
          course_name: 'Data Structures and Algorithms',
          course_code: 'CS201',
          lecturer_name: 'Dr. John Smith',
          campus_name: 'Main Campus',
          room: 'A101',
          schedule_time: '2024-01-15T09:00:00Z',
          duration_minutes: 60
        },
        {
          id: '2',
          course_name: 'Database Management Systems',
          course_code: 'CS202',
          lecturer_name: 'Dr. Jane Doe',
          campus_name: 'Main Campus',
          room: 'A102',
          schedule_time: '2024-01-15T11:00:00Z',
          duration_minutes: 90
        },
        {
          id: '3',
          course_name: 'Computer Networks',
          course_code: 'CS203',
          lecturer_name: 'Dr. Bob Johnson',
          campus_name: 'North Campus',
          room: 'B201',
          schedule_time: '2024-01-15T14:00:00Z',
          duration_minutes: 60
        }
      ])
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    } finally {
      setIsLoading(false)
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
              View and manage class schedules
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              This Week
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
            <CardDescription>
              List of scheduled classes and sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No schedules found</h3>
                <p className="text-muted-foreground">
                  No classes are scheduled at the moment
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
