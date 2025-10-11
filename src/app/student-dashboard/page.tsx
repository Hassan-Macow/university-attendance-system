'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AuthUser } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, BookOpen, CheckCircle, AlertCircle, MapPin } from 'lucide-react'

export default function StudentDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      
      if (currentUser.role !== 'student') {
        router.push('/dashboard')
        return
      }
      
      setUser(currentUser)
      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const todaySchedule = [
    {
      id: 1,
      course: 'Data Structures',
      lecturer: 'Dr. Smith',
      time: '09:00 AM - 10:30 AM',
      room: 'Room 101',
      status: 'upcoming'
    },
    {
      id: 2,
      course: 'Algorithms',
      lecturer: 'Dr. Johnson',
      time: '11:00 AM - 12:30 PM',
      room: 'Room 102',
      status: 'upcoming'
    },
    {
      id: 3,
      course: 'Database Systems',
      lecturer: 'Dr. Brown',
      time: '02:00 PM - 03:30 PM',
      room: 'Room 103',
      status: 'completed'
    }
  ]

  const attendanceStats = {
    totalClasses: 45,
    attended: 42,
    missed: 3,
    attendanceRate: 93.3
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceStats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {attendanceStats.attended} of {attendanceStats.totalClasses} classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaySchedule.filter(cls => cls.status === 'upcoming').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Classes remaining today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Active courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campus</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Main Campus</div>
              <p className="text-xs text-muted-foreground">
                Primary campus
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaySchedule.map((cls) => (
                  <div key={cls.id} className={`p-4 border rounded-lg ${
                    cls.status === 'completed' ? 'bg-green-50 border-green-200' :
                    cls.status === 'upcoming' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{cls.course}</h3>
                        <p className="text-sm text-gray-600">{cls.lecturer}</p>
                        <p className="text-sm text-gray-500">{cls.room}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{cls.time}</p>
                        <div className="flex items-center mt-1">
                          {cls.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <Clock className="h-4 w-4 text-blue-500 mr-1" />
                          )}
                          <span className={`text-xs ${
                            cls.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {cls.status === 'completed' ? 'Completed' : 'Upcoming'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Your attendance performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium">Classes Attended</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{attendanceStats.attended}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm font-medium">Classes Missed</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{attendanceStats.missed}</span>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Overall Attendance</span>
                    <span>{attendanceStats.attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${attendanceStats.attendanceRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
