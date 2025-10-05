'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
import { getCurrentUser } from '@/lib/auth'
import { DashboardStats } from '@/lib/types'
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

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Chart data
  const attendanceData = [
    { name: 'Mon', attendance: 85, students: 1200 },
    { name: 'Tue', attendance: 87, students: 1250 },
    { name: 'Wed', attendance: 82, students: 1180 },
    { name: 'Thu', attendance: 89, students: 1300 },
    { name: 'Fri', attendance: 91, students: 1350 },
    { name: 'Sat', attendance: 78, students: 1100 },
    { name: 'Sun', attendance: 65, students: 900 }
  ]

  const departmentData = [
    { name: 'Computer Science', students: 450, color: '#8884d8' },
    { name: 'Engineering', students: 320, color: '#82ca9d' },
    { name: 'Business', students: 280, color: '#ffc658' },
    { name: 'Medicine', students: 200, color: '#ff7300' }
  ]


  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    
    // Demo data - works without database
    setStats({
      total_students: 1250,
      total_lecturers: 85,
      total_courses: 156,
      total_departments: 12,
      total_campuses: 3,
      attendance_rate_today: 87.5,
      attendance_rate_week: 82.3,
      attendance_rate_month: 85.1
    })
    
    setIsLoading(false)
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
      change: '+12%',
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
      change: '+5%',
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
      change: '+8%',
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
      change: '+2%',
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
      change: '+3.2%',
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
      change: '+1.8%',
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
      change: '+2.5%',
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
              
              {(user?.role === 'superadmin' || user?.role === 'dean') && (
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
