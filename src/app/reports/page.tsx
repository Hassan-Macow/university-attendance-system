'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  IconChartBar,
  IconDownload,
  IconFilter,
  IconCalendar,
  IconUsers,
  IconCheck,
  IconX,
  IconTrendingUp,
  IconTrendingDown,
  IconTarget,
  IconBook,
  IconBuilding,
  IconRefresh
} from '@tabler/icons-react'
import { showToast } from '@/components/ui/toast'

interface AttendanceReport {
  id: string
  studentName: string
  regNo: string
  course: string
  courseName: string
  department: string
  date: string
  status: string
  attendanceRate: number
}

interface Stats {
  totalStudents: number
  presentToday: number
  absentToday: number
}

export default function ReportsPage() {
  const [reports, setReports] = useState<AttendanceReport[]>([])
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [departments, setDepartments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: '',
    course: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([
      fetchReports(),
      fetchStats(),
      fetchDepartments(),
      fetchCourses()
    ])
  }

  const fetchDepartments = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase
        .from('departments')
        .select('id, name')
        .order('name')
      setDepartments(data || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchCourses = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase
        .from('courses')
        .select('id, name, code')
        .order('name')
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchReports = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Get current user to check role
      const { getCurrentUser } = await import('@/lib/auth')
      const currentUser = await getCurrentUser()

      let query = supabase
        .from('attendance')
        .select(`
          id,
          status,
          timestamp,
          students!inner(
            id,
            full_name,
            reg_no,
            batches!inner(
              courses!inner(department_id)
            )
          ),
          class_sessions!inner(
            id,
            courses!inner(
              id,
              name,
              code,
              department_id,
              departments!inner(
                name
              )
            )
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100)

      // If user is a dean, filter by their department
      if (currentUser?.role === 'dean') {
        const { data: userData } = await supabase
          .from('users')
          .select('department_id')
          .eq('id', currentUser.id)
          .single()

        if (userData?.department_id) {
          query = query.eq('class_sessions.courses.department_id', userData.department_id)
        }
      }

      // Apply date filters
      if (filters.startDate) {
        query = query.gte('timestamp', new Date(filters.startDate).toISOString())
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte('timestamp', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching reports:', error)
        showToast.error('Error', 'Failed to fetch attendance reports')
        setIsLoading(false)
        return
      }

      // Transform data and calculate attendance rates
      const transformedReports: AttendanceReport[] = await Promise.all(
        (data || []).map(async (record: any) => {
          // Calculate attendance rate for this student
          const studentId = record.students.id
          const { data: studentAttendance } = await supabase
            .from('attendance')
            .select('status')
            .eq('student_id', studentId)

          const total = studentAttendance?.length || 0
          const present = studentAttendance?.filter((a: any) => a.status === 'present').length || 0
          const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0

          return {
            id: record.id,
            studentName: record.students.full_name,
            regNo: record.students.reg_no,
            course: record.class_sessions.courses.code,
            courseName: record.class_sessions.courses.name,
            department: record.class_sessions.courses.departments.name,
            date: new Date(record.timestamp).toLocaleDateString(),
            status: record.status,
            attendanceRate
          }
        })
      )

      // Apply additional filters
      let filteredReports = transformedReports
      if (filters.department && filters.department !== 'all') {
        filteredReports = filteredReports.filter(r => 
          r.department.toLowerCase().includes(filters.department.toLowerCase())
        )
      }
      if (filters.course && filters.course !== 'all') {
        filteredReports = filteredReports.filter(r => 
          r.courseName.toLowerCase().includes(filters.course.toLowerCase()) ||
          r.course.toLowerCase().includes(filters.course.toLowerCase())
        )
      }

      setReports(filteredReports)
    } catch (error) {
      console.error('Error loading reports:', error)
      showToast.error('Error', 'Failed to load attendance reports')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Get total students
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // Get today's attendance
      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('status')
        .gte('timestamp', startOfDay)
        .lte('timestamp', endOfDay)

      const presentToday = todayAttendance?.filter(a => a.status === 'present').length || 0
      const absentToday = todayAttendance?.filter(a => a.status === 'absent').length || 0

      setStats({
        totalStudents: totalStudents || 0,
        presentToday,
        absentToday
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    await loadData()
  }

  const handleExport = () => {
    if (reports.length === 0) {
      showToast.error('No Data', 'No reports available to export')
      return
    }

    // Prepare CSV data
    const headers = ['Student Name', 'Registration No', 'Course Code', 'Course Name', 'Department', 'Date', 'Status', 'Attendance Rate (%)']
    const csvData = reports.map(report => [
      report.studentName,
      report.regNo,
      report.course,
      report.courseName,
      report.department,
      report.date,
      report.status,
      report.attendanceRate.toString()
    ])

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast.success('Success', `Exported ${reports.length} records to CSV`)
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const applyFilters = async () => {
    setIsLoading(true)
    await fetchReports()
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      department: '',
      course: ''
    })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Attendance Reports
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View and analyze attendance data across all departments
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRefresh} variant="outline">
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handleExport} className="bg-[#1B75BB] hover:bg-[#0d5a8a]">
                  <IconDownload className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center">
                <div className="h-10 w-10 bg-[#1B75BB] rounded-lg flex items-center justify-center mr-3">
                  <IconFilter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <CardDescription>Filter reports by date, department, or course</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="relative">
                    <Input
                      id="startDate"
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="pl-10"
                    />
                    <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative">
                    <Input
                      id="endDate"
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="pl-10"
                    />
                    <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <select
                      id="department"
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                    >
                      <option value="all">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <IconBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <div className="relative">
                    <select
                      id="course"
                      value={filters.course}
                      onChange={(e) => handleFilterChange('course', e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                    >
                      <option value="all">All Courses</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.name}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                    <IconBook className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={applyFilters} className="bg-[#1B75BB] hover:bg-[#0d5a8a]">
                  <IconFilter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <IconTrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500 ml-1">+12%</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-[#1B75BB] rounded-lg flex items-center justify-center">
                    <IconUsers className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.presentToday.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <IconTrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500 ml-1">+5%</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <IconCheck className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.absentToday.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <IconTrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-500 ml-1">-8%</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <IconX className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Report */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <div className="h-10 w-10 bg-[#1B75BB] rounded-lg flex items-center justify-center mr-3">
                  <IconTarget className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Detailed Attendance Report</CardTitle>
                  <CardDescription>Complete attendance records for the selected period</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <IconChartBar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports found</h3>
                  <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or check back later.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Reg No</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Attendance Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.studentName}</TableCell>
                          <TableCell>{report.regNo}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{report.courseName}</div>
                              <div className="text-sm text-muted-foreground">{report.course}</div>
                            </div>
                          </TableCell>
                          <TableCell>{report.department}</TableCell>
                          <TableCell>{report.date}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              report.status === 'present' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {report.status === 'present' && <IconCheck className="h-3 w-3 mr-1" />}
                              {report.status === 'absent' && <IconX className="h-3 w-3 mr-1" />}
                              {report.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-[#1B75BB] h-2 rounded-full" 
                                  style={{ width: `${report.attendanceRate}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{report.attendanceRate}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}