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
  IconClock,
  IconX,
  IconTrendingUp,
  IconTrendingDown,
  IconTarget,
  IconBook,
  IconBuilding,
  IconChartPie,
  IconRefresh
} from '@tabler/icons-react'

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: '',
    course: ''
  })

  // Mock data
  const mockReports = [
    {
      id: 1,
      studentName: 'John Doe',
      studentId: 'STU001',
      course: 'Computer Science 101',
      department: 'Computer Science',
      date: '2024-01-15',
      status: 'Present',
      attendanceRate: 95
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      studentId: 'STU002',
      course: 'Mathematics 201',
      department: 'Mathematics',
      date: '2024-01-15',
      status: 'Late',
      attendanceRate: 87
    },
    {
      id: 3,
      studentName: 'Mike Johnson',
      studentId: 'STU003',
      course: 'Physics 101',
      department: 'Physics',
      date: '2024-01-15',
      status: 'Absent',
      attendanceRate: 72
    }
  ]

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setReports(mockReports)
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setReports(mockReports)
      setIsLoading(false)
    }, 1000)
  }

  const handleExport = () => {
    alert('Export functionality will be implemented here')
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const applyFilters = () => {
    // Mock filter application
    console.log('Applying filters:', filters)
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
                    <Input
                      id="department"
                      placeholder="Select department"
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className="pl-10"
                    />
                    <IconBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <div className="relative">
                    <Input
                      id="course"
                      placeholder="Select course"
                      value={filters.course}
                      onChange={(e) => handleFilterChange('course', e.target.value)}
                      className="pl-10"
                    />
                    <IconBook className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
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
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">1,089</p>
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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Late Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">89</p>
                    <div className="flex items-center mt-1">
                      <IconTrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-500 ml-1">-2%</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <IconClock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">69</p>
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
                        <TableHead>Student ID</TableHead>
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
                          <TableCell>{report.studentId}</TableCell>
                          <TableCell>{report.course}</TableCell>
                          <TableCell>{report.department}</TableCell>
                          <TableCell>{report.date}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              report.status === 'Present' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : report.status === 'Late'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {report.status === 'Present' && <IconCheck className="h-3 w-3 mr-1" />}
                              {report.status === 'Late' && <IconClock className="h-3 w-3 mr-1" />}
                              {report.status === 'Absent' && <IconX className="h-3 w-3 mr-1" />}
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