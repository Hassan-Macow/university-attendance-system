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
  IconRefresh,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react'
import { showToast } from '@/components/ui/toast'

interface AttendanceReport {
  id: string
  studentName: string
  regNo: string
  studentId: string
  course: string
  courseName: string
  courseId: string
  department: string
  date: string
  timestamp: string // Store original timestamp for date operations
  status: string
  attendanceRate: number
  absentCount: number // Number of times this student was absent
}

interface Stats {
  totalStudents: number
  presentToday: number
  absentToday: number
}

interface CourseStats {
  courseId: string
  courseName: string
  courseCode: string
  totalStudents: number
  present: number
  absent: number
  late: number
  attendanceRate: number
}

export default function ReportsPage() {
  const [reports, setReports] = useState<AttendanceReport[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [departments, setDepartments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
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

      let query = supabase
        .from('attendance')
        .select(`
          id,
          status,
          timestamp,
          student_id,
          students!inner(
            id,
            full_name,
            reg_no
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
        .limit(500) // Limit to prevent loading too much data

      // Apply date filters
      if (filters.startDate) {
        query = query.gte('timestamp', new Date(filters.startDate).toISOString())
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte('timestamp', endDate.toISOString())
      }

      // Apply course filter at database level
      if (filters.course && filters.course !== 'all') {
        query = query.eq('class_sessions.courses.id', filters.course)
      }

      // Apply department filter at database level
      if (filters.department && filters.department !== 'all') {
        const selectedDept = departments.find(d => d.name === filters.department)
        if (selectedDept) {
          query = query.eq('class_sessions.courses.department_id', selectedDept.id)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching reports:', error)
        showToast.error('Error', 'Failed to fetch attendance reports')
        setIsLoading(false)
        return
      }

      // Get unique student IDs to batch calculate attendance rates and absent counts
      const uniqueStudentIds = [...new Set((data || []).map((r: any) => r.student_id))]
      
      // Build query for student attendance - apply same filters
      let attendanceQuery = supabase
        .from('attendance')
        .select('student_id, status, class_sessions!inner(courses!inner(id))')
        .in('student_id', uniqueStudentIds)

      // Apply same date filters
      if (filters.startDate) {
        attendanceQuery = attendanceQuery.gte('timestamp', new Date(filters.startDate).toISOString())
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        attendanceQuery = attendanceQuery.lte('timestamp', endDate.toISOString())
      }

      // Apply course filter if set
      if (filters.course && filters.course !== 'all') {
        attendanceQuery = attendanceQuery.eq('class_sessions.courses.id', filters.course)
      }

      // Apply department filter if set
      if (filters.department && filters.department !== 'all') {
        const selectedDept = departments.find(d => d.name === filters.department)
        if (selectedDept) {
          attendanceQuery = attendanceQuery.eq('class_sessions.courses.department_id', selectedDept.id)
        }
      }

      const { data: allStudentAttendance } = await attendanceQuery

      // Calculate attendance rates and absent counts for each student (in memory)
      const studentAttendanceMap = new Map<string, { total: number; present: number; absent: number }>()
      
      if (allStudentAttendance) {
        allStudentAttendance.forEach((att: any) => {
          if (!studentAttendanceMap.has(att.student_id)) {
            studentAttendanceMap.set(att.student_id, { total: 0, present: 0, absent: 0 })
          }
          const stats = studentAttendanceMap.get(att.student_id)!
          stats.total++
          if (att.status === 'present') {
            stats.present++
          } else if (att.status === 'absent') {
            stats.absent++
          }
        })
      }

      // Transform data using pre-calculated attendance rates and absent counts
      const transformedReports: AttendanceReport[] = (data || []).map((record: any) => {
        const studentStats = studentAttendanceMap.get(record.student_id) || { total: 0, present: 0, absent: 0 }
        const attendanceRate = studentStats.total > 0 
          ? Math.round((studentStats.present / studentStats.total) * 100) 
          : 0

        return {
          id: record.id,
          studentName: record.students.full_name,
          regNo: record.students.reg_no,
          studentId: record.student_id,
          course: record.class_sessions.courses.code,
          courseName: record.class_sessions.courses.name,
          courseId: record.class_sessions.courses.id,
          department: record.class_sessions.courses.departments.name,
          date: new Date(record.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          timestamp: record.timestamp, // Store original timestamp
          status: record.status,
          attendanceRate,
          absentCount: studentStats.absent
        }
      })

      setReports(transformedReports)

      // Calculate course-level statistics
      await calculateCourseStats(transformedReports)
    } catch (error) {
      console.error('Error loading reports:', error)
      showToast.error('Error', 'Failed to load attendance reports')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCourseStats = async (reports: AttendanceReport[]) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Group reports by course
      const courseMap = new Map<string, {
        courseId: string
        courseName: string
        courseCode: string
        records: AttendanceReport[]
      }>()

      reports.forEach(report => {
        if (!courseMap.has(report.courseId)) {
          courseMap.set(report.courseId, {
            courseId: report.courseId,
            courseName: report.courseName,
            courseCode: report.course,
            records: []
          })
        }
        courseMap.get(report.courseId)!.records.push(report)
      })

      // Get all course batch IDs in one query
      const courseIds = Array.from(courseMap.keys())
      const { data: coursesInfo } = await supabase
        .from('courses')
        .select('id, batch_id')
        .in('id', courseIds)

      const batchIds = [...new Set(coursesInfo?.map(c => c.batch_id).filter(Boolean) || [])]
      
      // Get all student counts for all batches in one query
      const { data: batchStudentCounts } = await supabase
        .from('students')
        .select('batch_id')
        .in('batch_id', batchIds)

      // Count students per batch
      const batchCountMap = new Map<string, number>()
      batchStudentCounts?.forEach((s: any) => {
        batchCountMap.set(s.batch_id, (batchCountMap.get(s.batch_id) || 0) + 1)
      })

      // Create course to batch mapping
      const courseBatchMap = new Map<string, string>()
      coursesInfo?.forEach(c => {
        if (c.batch_id) {
          courseBatchMap.set(c.id, c.batch_id)
        }
      })

      // Calculate stats for each course (all in memory now, no more queries)
      const stats: CourseStats[] = Array.from(courseMap.values()).map((courseData) => {
        const batchId = courseBatchMap.get(courseData.courseId)
        const totalStudents = batchId ? (batchCountMap.get(batchId) || 0) : 0

        // Count attendance by status
        const present = courseData.records.filter(r => r.status === 'present').length
        const absent = courseData.records.filter(r => r.status === 'absent').length
        const late = courseData.records.filter(r => r.status === 'late').length

        // Calculate attendance rate
        const totalRecords = courseData.records.length
        const attendanceRate = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0

        return {
          courseId: courseData.courseId,
          courseName: courseData.courseName,
          courseCode: courseData.courseCode,
          totalStudents,
          present,
          absent,
          late,
          attendanceRate
        }
      })

      setCourseStats(stats)
    } catch (error) {
      console.error('Error calculating course stats:', error)
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
    const headers = ['Student Name', 'Registration No', 'Course Code', 'Course Name', 'Department', 'Date', 'Status', 'Absent Count', 'Attendance Rate (%)']
    const csvData = reports.map(report => [
      report.studentName,
      report.regNo,
      report.course,
      report.courseName,
      report.department,
      report.date,
      report.status,
      report.absentCount.toString(),
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
    setCurrentPage(1) // Reset to first page when filters change
    await fetchReports()
  }

  // Pagination calculations
  const totalPages = Math.ceil(reports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReports = reports.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.startDate, filters.endDate, filters.department, filters.course])

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
                        <option key={course.id} value={course.id}>
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

          {/* Course Statistics - Show when course filter is applied */}
          {filters.course && filters.course !== 'all' && courseStats.length > 0 && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Course Attendance Summary</CardTitle>
                  <CardDescription>
                    Attendance statistics for the selected course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {courseStats.map((stat) => (
                      <div key={stat.courseId} className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{stat.courseCode}</h3>
                          <p className="text-sm text-muted-foreground">{stat.courseName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">Total Students</p>
                            <p className="text-xl font-bold">{stat.totalStudents}</p>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">Present</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">{stat.present}</p>
                          </div>
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">Absent</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">{stat.absent}</p>
                          </div>
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">Late</p>
                            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stat.late}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-muted-foreground">Attendance Rate</span>
                            <span className="text-sm font-semibold">{stat.attendanceRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-[#1B75BB] h-2 rounded-full transition-all" 
                              style={{ width: `${stat.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                <>
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
                          <TableHead>Absent Count</TableHead>
                          <TableHead>Attendance Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedReports.map((report) => (
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
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{report.date}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(report.timestamp).toLocaleDateString('en-US', { 
                                  weekday: 'short' 
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              report.status === 'present' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : report.status === 'late'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {report.status === 'present' && <IconCheck className="h-3 w-3 mr-1" />}
                              {report.status === 'absent' && <IconX className="h-3 w-3 mr-1" />}
                              {report.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${
                                report.absentCount > 5 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : report.absentCount > 3
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {report.absentCount}
                              </span>
                              <span className="text-xs text-muted-foreground">times</span>
                            </div>
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
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </select>
                        <span className="text-sm text-muted-foreground">
                          Showing {startIndex + 1}-{Math.min(endIndex, reports.length)} of {reports.length} records
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <IconChevronLeft className="h-4 w-4" />
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
                          <IconChevronRight className="h-4 w-4" />
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
    </MainLayout>
  )
}