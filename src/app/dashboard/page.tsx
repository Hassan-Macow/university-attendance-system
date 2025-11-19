'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
import { getCurrentUser } from '@/lib/auth'
import { DashboardStats } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { 
  IconUsers,
  IconSchool,
  IconBook,
  IconBuilding,
  IconChartBar,
  IconTrendingUp,
  IconCalendar,
  IconBolt,
  IconCheck,
  IconEye,
  IconActivity,
  IconChartPie,
  IconStar,
  IconTarget,
  IconClock,
  IconAward,
  IconTrophy,
  IconRocket
} from '@tabler/icons-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'

// Helper function to get department colors
const getDepartmentColor = (departmentName: string): string => {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300',
    '#8dd1e1', '#d084d0', '#87d068', '#ffc0cb',
    '#ffb347', '#98fb98', '#f0e68c', '#dda0dd'
  ]
  
  let hash = 0
  for (let i = 0; i < departmentName.length; i++) {
    hash = departmentName.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceData, setAttendanceData] = useState([
    { name: 'Mon', attendance: 85, students: 1200 },
    { name: 'Tue', attendance: 87, students: 1250 },
    { name: 'Wed', attendance: 82, students: 1180 },
    { name: 'Thu', attendance: 89, students: 1300 },
    { name: 'Fri', attendance: 91, students: 1350 },
    { name: 'Sat', attendance: 78, students: 1100 },
    { name: 'Sun', attendance: 65, students: 900 }
  ])
  const [departmentData, setDepartmentData] = useState([
    { name: 'Computer Science', students: 450, color: '#8884d8' },
    { name: 'Engineering', students: 320, color: '#82ca9d' },
    { name: 'Business', students: 280, color: '#ffc658' },
    { name: 'Medicine', students: 200, color: '#ff7300' }
  ])


  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load user
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        console.log('Loading dashboard data from Supabase...')

        // Fetch counts directly from Supabase
        const [
          { count: studentsCount },
          { count: lecturersCount },
          { count: coursesCount },
          { count: departmentsCount },
          { count: campusesCount }
        ] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('lecturers').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('departments').select('*', { count: 'exact', head: true }),
          supabase.from('campuses').select('*', { count: 'exact', head: true })
        ])

        console.log('Counts:', { studentsCount, lecturersCount, coursesCount, departmentsCount, campusesCount })

        // Calculate attendance rates
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

        const [
          { data: todayAttendance },
          { data: weekAttendance },
          { data: monthAttendance }
        ] = await Promise.all([
          supabase
            .from('attendance')
            .select('status')
            .gte('created_at', today.toISOString())
            .lt('created_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()),
          supabase
            .from('attendance')
            .select('status')
            .gte('created_at', weekAgo.toISOString()),
          supabase
            .from('attendance')
            .select('status')
            .gte('created_at', monthAgo.toISOString())
        ])

        const calculateAttendanceRate = (data: any[] | null) => {
          if (!data || data.length === 0) return 0
          const presentCount = data.filter(a => a.status === 'present').length
          return Math.round((presentCount / data.length) * 100 * 10) / 10
        }

        const attendance_rate_today = calculateAttendanceRate(todayAttendance)
        const attendance_rate_week = calculateAttendanceRate(weekAttendance)
        const attendance_rate_month = calculateAttendanceRate(monthAttendance)

        // Set stats
        setStats({
          total_students: studentsCount || 0,
          total_lecturers: lecturersCount || 0,
          total_courses: coursesCount || 0,
          total_departments: departmentsCount || 0,
          total_campuses: campusesCount || 0,
          attendance_rate_today,
          attendance_rate_week,
          attendance_rate_month,
          students_change: '+0%',
          lecturers_change: '+0%',
          courses_change: '+0%',
          departments_change: '+0%',
          attendance_today_change: '+0%',
          attendance_week_change: '+0%',
          attendance_month_change: '+0%'
        })

        // Fetch attendance trend data
        const { data: attendanceTrendData } = await supabase
          .from('attendance')
          .select('created_at, status')
          .gte('created_at', weekAgo.toISOString())
          .order('created_at', { ascending: true })

        // Group by day
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const dailyStats = new Map<string, { present: number; total: number }>()

        // Initialize all days
        for (let i = 0; i < 7; i++) {
          const date = new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
          const dayName = dayNames[date.getDay()]
          dailyStats.set(dayName, { present: 0, total: 0 })
        }

        // Process attendance data
        if (attendanceTrendData) {
          attendanceTrendData.forEach(record => {
            const date = new Date(record.created_at)
            const dayName = dayNames[date.getDay()]
            const dayData = dailyStats.get(dayName)
            if (dayData) {
              dayData.total++
              if (record.status === 'present') {
                dayData.present++
              }
            }
          })
        }

        // Convert to array
        const trendData = Array.from(dailyStats.entries()).map(([dayName, data]) => {
          const attendanceRate = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
          return {
            name: dayName,
            attendance: attendanceRate,
            students: data.total || 0
          }
        })

        setAttendanceData(trendData)

        // Fetch department distribution
        const { data: departments } = await supabase
          .from('departments')
          .select('id, name')

        if (departments) {
          const departmentData = await Promise.all(
            departments.map(async (dept) => {
              const { count } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('department_id', dept.id)

              return {
                name: dept.name,
                students: count || 0,
                color: getDepartmentColor(dept.name)
              }
            })
          )

          // Sort by student count and filter out empty departments
          departmentData.sort((a, b) => b.students - a.students)
          setDepartmentData(departmentData.filter(d => d.students > 0))
        }

        console.log('Dashboard data loaded successfully')
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDashboardData()
  }, [])

  if (isLoading) {
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

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.total_students || 0,
      icon: IconUsers,
      description: 'Enrolled students',
      change: stats?.students_change || '+12%',
      changeType: 'positive' as const,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      iconBg: 'bg-[#1B75BB]'
    },
    {
      title: 'Total Lecturers',
      value: stats?.total_lecturers || 0,
      icon: IconSchool,
      description: 'Active lecturers',
      change: stats?.lecturers_change || '+5%',
      changeType: 'positive' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      iconBg: 'bg-green-600'
    },
    {
      title: 'Total Courses',
      value: stats?.total_courses || 0,
      icon: IconBook,
      description: 'Active courses',
      change: stats?.courses_change || '+8%',
      changeType: 'positive' as const,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      iconBg: 'bg-purple-600'
    },
    {
      title: 'Departments',
      value: stats?.total_departments || 0,
      icon: IconBuilding,
      description: 'Active departments',
      change: stats?.departments_change || '+2%',
      changeType: 'positive' as const,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      iconBg: 'bg-orange-600'
    }
  ]

  const attendanceCards = [
    {
      title: 'Today\'s Attendance',
      value: `${stats?.attendance_rate_today || 0}%`,
      icon: IconTarget,
      description: 'Current day attendance rate',
      change: stats?.attendance_today_change || '+3.2%',
      changeType: 'positive' as const,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      iconBg: 'bg-emerald-600'
    },
    {
      title: 'This Week',
      value: `${stats?.attendance_rate_week || 0}%`,
      icon: IconTrendingUp,
      description: 'Weekly attendance rate',
      change: stats?.attendance_week_change || '+1.8%',
      changeType: 'positive' as const,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950',
      iconBg: 'bg-[#1B75BB]'
    },
    {
      title: 'This Month',
      value: `${stats?.attendance_rate_month || 0}%`,
      icon: IconTrophy,
      description: 'Monthly attendance rate',
      change: stats?.attendance_month_change || '+2.5%',
      changeType: 'positive' as const,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      iconBg: 'bg-amber-600'
    }
  ]

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's your academic dashboard overview
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.title} className={`${stat.bgColor} rounded-xl p-6 border border-gray-200 dark:border-slate-700`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            {/* Attendance Trend Chart */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#1B75BB] rounded-lg">
                  <IconChartBar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Attendance Trend</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData}>
                    <defs>
                      <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="attendance"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorAttendance)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Distribution */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <IconChartPie className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Department Distribution</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="students"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {departmentData.map((dept, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{dept.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attendance Stats */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {attendanceCards.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.title} className={`${stat.bgColor} rounded-xl p-6 border border-gray-200 dark:border-slate-700`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {stat.change}
                    </span>
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


          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#1B75BB] rounded-lg">
                  <IconRocket className="h-5 w-5 text-white" />
                </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {user?.role === 'superadmin' && (
                <>
                  <a href="/campuses" className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="p-2 bg-blue-600 rounded-lg w-fit mb-3">
                      <IconBuilding className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Manage Campuses</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add or edit campus information</p>
                  </a>
                  <a href="/departments" className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="p-2 bg-green-600 rounded-lg w-fit mb-3">
                      <IconBuilding className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Manage Departments</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Organize academic departments</p>
                  </a>
                </>
              )}
              
              {user?.role === 'superadmin' && (
                <>
                  <a href="/students" className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="p-2 bg-purple-600 rounded-lg w-fit mb-3">
                      <IconUsers className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Manage Students</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add or edit student records</p>
                  </a>
                  <a href="/courses" className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="p-2 bg-orange-600 rounded-lg w-fit mb-3">
                      <IconBook className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Manage Courses</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Create or update course information</p>
                  </a>
                </>
              )}
              
              <a href="/schedules" className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                <div className="p-2 bg-cyan-600 rounded-lg w-fit mb-3">
                  <IconCalendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">View Schedules</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check class schedules and timings</p>
              </a>
              
              <a href="/reports" className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                <div className="p-2 bg-pink-600 rounded-lg w-fit mb-3">
                  <IconChartBar className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">View Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Generate attendance reports</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
