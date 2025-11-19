'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AuthUser } from '@/lib/auth'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  IconCalendar, 
  IconClock, 
  IconUsers, 
  IconBook, 
  IconMapPin,
  IconChartBar,
  IconCheck,
  IconTrendingUp,
  IconSchool
} from '@tabler/icons-react'
import { format } from 'date-fns'

interface Course {
  id: string
  name: string
  code: string
  credits: number
  batches: {
    name: string
  }
}

interface ClassSession {
  id: string
  schedule_time: string
  duration_minutes: number
  room: string
  courses: {
    name: string
    code: string
    batches: {
      name: string
    }
  }
  campuses: {
    name: string
  }
}

interface LecturerStats {
  total_courses: number
  total_sessions_today: number
  total_students: number
  attendance_rate: number
}

export default function LecturerDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [todaySessions, setTodaySessions] = useState<ClassSession[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<ClassSession[]>([])
  const [stats, setStats] = useState<LecturerStats>({
    total_courses: 0,
    total_sessions_today: 0,
    total_students: 0,
    attendance_rate: 0
  })
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      
      if (currentUser.role !== 'lecturer') {
        router.push('/dashboard')
        return
      }
      
      setUser(currentUser)
      await fetchLecturerData(currentUser)
      setLoading(false)
    }

    loadData()
  }, [router])

  const fetchLecturerData = async (user: AuthUser) => {
    try {
      // Get lecturer ID from user
      const lecturerResponse = await fetch(`/api/lecturers?user_id=${user.id}`)
      const lecturerData = await lecturerResponse.json()
      
      if (!lecturerData.data || lecturerData.data.length === 0) {
        console.log('No lecturer profile found')
        return
      }

      const lecturerId = lecturerData.data[0].id

      // Fetch courses
      const coursesResponse = await fetch(`/api/courses?lecturer_id=${lecturerId}&limit=100`)
      const coursesData = await coursesResponse.json()
      
      if (coursesData.data) {
        setCourses(coursesData.data)
      }

      // Fetch all sessions for this lecturer (today and future)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()
      
      // Fetch sessions directly from Supabase to ensure proper filtering
      const { supabase } = await import('@/lib/supabase')
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('class_sessions')
        .select(`
          id,
          schedule_time,
          duration_minutes,
          room,
          courses!inner(
            id,
            name,
            code,
            lecturer_id,
            batches!inner(
              id,
              name
            )
          ),
          campuses!inner(
            id,
            name
          )
        `)
        .eq('lecturer_id', lecturerId) // Ensure we only get this lecturer's sessions
        .gte('schedule_time', todayISO) // Only future and today's sessions
        .order('schedule_time', { ascending: true })
        .limit(100)
      
      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
        return
      }
      
      let todayList: ClassSession[] = []
      let upcomingList: ClassSession[] = []
      
      if (sessionsData) {
        const now = new Date()
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)
        
        // Split into today's and upcoming
        todayList = sessionsData.filter((s: any) => {
          const sessionTime = new Date(s.schedule_time)
          return sessionTime >= today && sessionTime <= todayEnd
        }).map((s: any) => ({
          id: s.id,
          schedule_time: s.schedule_time,
          duration_minutes: s.duration_minutes,
          room: s.room,
          courses: {
            name: s.courses.name,
            code: s.courses.code,
            batches: {
              name: s.courses.batches.name
            }
          },
          campuses: {
            name: s.campuses.name
          }
        }))
        
        upcomingList = sessionsData.filter((s: any) => {
          const sessionTime = new Date(s.schedule_time)
          return sessionTime > todayEnd
        }).map((s: any) => ({
          id: s.id,
          schedule_time: s.schedule_time,
          duration_minutes: s.duration_minutes,
          room: s.room,
          courses: {
            name: s.courses.name,
            code: s.courses.code,
            batches: {
              name: s.courses.batches.name
            }
          },
          campuses: {
            name: s.campuses.name
          }
        }))
        
        setTodaySessions(todayList)
        setUpcomingSessions(upcomingList)
      }

      // Calculate stats
      setStats({
        total_courses: coursesData.data?.length || 0,
        total_sessions_today: todayList.length,
        total_students: coursesData.data?.reduce((sum: number, course: any) => sum + (course.batches?.student_count || 0), 0) || 0,
        attendance_rate: 85 // This should come from actual attendance data
      })
    } catch (error) {
      console.error('Error fetching lecturer data:', error)
    }
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'hh:mm a')
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return null
  }

  const statCards = [
    {
      title: 'My Courses',
      value: stats.total_courses,
      icon: IconBook,
      description: 'Active courses',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      iconBg: 'bg-[#1B75BB]'
    },
    {
      title: "Today's Classes",
      value: stats.total_sessions_today,
      icon: IconCalendar,
      description: 'Scheduled sessions',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      iconBg: 'bg-green-600'
    },
    {
      title: 'Total Students',
      value: stats.total_students,
      icon: IconUsers,
      description: 'Across all courses',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      iconBg: 'bg-purple-600'
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendance_rate}%`,
      icon: IconTrendingUp,
      description: 'This month',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      iconBg: 'bg-orange-600'
    }
  ]

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user.name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's your teaching schedule and course overview
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.title} className={`${stat.bgColor} rounded-xl p-6 border border-gray-200 dark:border-slate-700`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Today's Classes */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#1B75BB] rounded-lg">
                  <IconCalendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Classes</h3>
              </div>
              <div className="space-y-4">
                {todaySessions.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No classes scheduled for today
                  </p>
                ) : (
                  todaySessions.map((session) => (
                    <div key={session.id} className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{session.courses.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{session.courses.code}</p>
                        </div>
                        <Button size="sm" onClick={() => router.push('/attendance')}>
                          <IconCheck className="h-4 w-4 mr-1" />
                          Take Attendance
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <IconClock className="h-4 w-4" />
                          {formatTime(session.schedule_time)}
                        </div>
                        <div className="flex items-center gap-1">
                          <IconMapPin className="h-4 w-4" />
                          {session.room || 'TBA'}
                        </div>
                        <div className="flex items-center gap-1">
                          <IconSchool className="h-4 w-4" />
                          {session.courses.batches.name}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Classes */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-600 rounded-lg">
                  <IconClock className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Classes</h3>
              </div>
              <div className="space-y-4">
                {upcomingSessions.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No upcoming classes today
                  </p>
                ) : (
                  upcomingSessions.map((session) => (
                    <div key={session.id} className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{session.courses.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{session.courses.code}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => router.push('/schedules')}>
                          View Details
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <IconClock className="h-4 w-4" />
                          {formatTime(session.schedule_time)}
                        </div>
                        <div className="flex items-center gap-1">
                          <IconMapPin className="h-4 w-4" />
                          {session.room || 'TBA'}
                        </div>
                        <div className="flex items-center gap-1">
                          <IconSchool className="h-4 w-4" />
                          {session.courses.batches.name}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* My Courses */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-600 rounded-lg">
                <IconBook className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Courses</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-8">
                  No courses assigned yet
                </p>
              ) : (
                courses.map((course) => (
                  <div key={course.id} className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{course.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{course.code}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{course.batches.name}</span>
                      <span className="text-gray-600 dark:text-gray-400">{course.credits} Credits</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
