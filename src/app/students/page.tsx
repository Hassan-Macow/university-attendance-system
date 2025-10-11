'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, GraduationCap, Edit, Trash2, Upload, FileSpreadsheet, Download } from 'lucide-react'
import { Student, Department, Batch } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { ToastContainer, showToast } from '@/components/ui/toast'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedStudents, setUploadedStudents] = useState<any[]>([])
  const [showAssignment, setShowAssignment] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Upload, 2: Assign
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    reg_no: '',
    department_id: '',
    batch_id: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    fetchStudents()
    fetchDepartments()
    fetchBatches()
  }, [])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          departments!inner(*),
          batches!inner(*),
          campuses!inner(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch students:', error)
        return
      }

      setStudents(data || [])
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Failed to fetch departments:', error)
        return
      }

      setDepartments(data || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Failed to fetch batches:', error)
        return
      }

      setBatches(data || [])
    } catch (error) {
      console.error('Failed to fetch batches:', error)
    }
  }

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Get campus_id from selected department
      const selectedDepartment = departments.find(d => d.id === formData.department_id)
      if (!selectedDepartment) {
        showToast.error('Invalid Selection', 'Please select a valid department')
        return
      }

      const { data, error } = await supabase
        .from('students')
        .insert([{
          full_name: formData.full_name,
          reg_no: formData.reg_no,
          department_id: formData.department_id,
          batch_id: formData.batch_id,
          campus_id: selectedDepartment.campus_id,
          email: formData.email || null,
          phone: formData.phone || null
        }])
        .select(`
          *,
          departments!inner(*),
          batches!inner(*),
          campuses!inner(*)
        `)

      if (error) {
        if (error.code === '23505') {
          showToast.error('Duplicate Entry', 'Student with this registration number already exists')
        } else {
          showToast.error('Creation Failed', `Failed to create student: ${error.message}`)
        }
        return
      }

      if (data && data[0]) {
        setStudents([data[0], ...students])
        setFormData({ full_name: '', reg_no: '', department_id: '', batch_id: '', email: '', phone: '' })
        setShowForm(false)
        showToast.success('Success!', 'Student created successfully')
      }
    } catch (error) {
      console.error('Failed to create student:', error)
      showToast.error('Error', 'Failed to create student')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'text/csv' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls') ||
          file.name.endsWith('.csv')) {
        setUploadFile(file)
      } else {
        showToast.error('Invalid File', 'Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file')
      }
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/students/template')
      if (!response.ok) throw new Error('Failed to download template')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'students_upload_template.xlsx'
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      link.remove()
      
      showToast.success('Success!', 'Template downloaded successfully')
    } catch (error) {
      console.error('Error downloading template:', error)
      showToast.error('Download Failed', 'Failed to download template')
    }
  }

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      showToast.warning('No File Selected', 'Please select a file to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      console.log('Starting upload...', uploadFile.name)
      const formData = new FormData()
      formData.append('file', uploadFile)
      console.log('FormData created')

      console.log('Fetching /api/students/upload...')
      const response = await fetch('/api/students/upload', {
        method: 'POST',
        body: formData
      })
      console.log('Response received:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Result:', result)

      if (result.success) {
        showToast.success('Upload Complete!', `Successfully uploaded ${result.count} students`)
        setShowBulkUpload(false)
        setUploadFile(null)
        fetchStudents() // Refresh the list
      } else {
        showToast.error('Upload Failed', result.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showToast.error('Upload Failed', error instanceof Error ? error.message : 'Please try again')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleAssignDepartments = async () => {
    if (!selectedDepartmentId || !selectedBatchId) {
      showToast.warning('Incomplete Selection', 'Please select both department and batch for all students')
      return
    }

    console.log('=== Starting Bulk Create ===')
    console.log('Selected Department ID:', selectedDepartmentId)
    console.log('Selected Batch ID:', selectedBatchId)
    console.log('Number of students:', uploadedStudents.length)

    setIsUploading(true)

    try {
      // Apply the selected department and batch to all students
      const studentsWithAssignment = uploadedStudents.map(student => ({
        ...student,
        department_id: selectedDepartmentId,
        batch_id: selectedBatchId
      }))

      console.log('Students with assignment:', studentsWithAssignment)

      const response = await fetch('/api/students/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students: studentsWithAssignment
        }),
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response result:', result)

      if (result.success) {
        showToast.success('Success!', `Successfully created ${result.imported} students`)
        setShowBulkUpload(false)
        setShowAssignment(false)
        setUploadedStudents([])
        setCurrentStep(1)
        setUploadFile(null)
        setSelectedDepartmentId('')
        setSelectedBatchId('')
        fetchStudents() // Refresh the list
      } else {
        showToast.error('Creation Failed', result.error)
      }
    } catch (error) {
      console.error('Creation error:', error)
      showToast.error('Error', `Failed to create students: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <MainLayout>
      <ToastContainer />
      <div className="min-h-screen bg-background">
        <div className="p-8">
          <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Students</h1>
            <p className="text-muted-foreground">
              Manage student records and information
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Student</CardTitle>
              <CardDescription>
                Enter student information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg_no">Registration Number</Label>
                    <Input
                      id="reg_no"
                      value={formData.reg_no}
                      onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
                      placeholder="e.g., CS2024001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department_id">Department</Label>
                    <select
                      id="department_id"
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch_id">Batch</Label>
                    <select
                      id="batch_id"
                      value={formData.batch_id}
                      onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a batch</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="student@university.edu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Student'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Bulk Upload Form */}
        {showBulkUpload && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Bulk Upload Students
              </CardTitle>
              <CardDescription>
                Upload multiple students using an Excel file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload" className="text-sm font-medium mb-2 block">
                    Select Excel or CSV File
                  </Label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  />
                  {uploadFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {uploadFile.name}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">How to Upload:</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold">1.</span>
                      <p>Click "Download Template" to get the Excel file</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold">2.</span>
                      <p>Fill in all required fields (marked with *)</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold">3.</span>
                      <p>Save the file and upload it here</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded border-l-4 border-amber-400">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      <strong>Important:</strong> Make sure to get the correct Department ID, Batch ID, and Campus ID from your system before filling the template.
                    </p>
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleBulkUpload} 
                    disabled={!uploadFile || isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Students'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBulkUpload(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Assignment Form */}
        {showAssignment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                Assign Department & Batch for All Students
              </CardTitle>
              <CardDescription>
                Select one department and one batch that will apply to all {uploadedStudents.length} students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Single Selection for All Students */}
                <div className="p-6 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Department for All Students *</Label>
                      <select
                        value={selectedDepartmentId}
                        onChange={(e) => setSelectedDepartmentId(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Batch for All Students *</Label>
                      <select
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Select Batch</option>
                        {batches.map(batch => (
                          <option key={batch.id} value={batch.id}>
                            {batch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Preview of Students */}
                <div>
                  <h4 className="font-medium mb-3">Students to be created ({uploadedStudents.length}):</h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    {uploadedStudents.map((student, index) => (
                      <div key={index} className="p-3 border-b last:border-b-0 flex justify-between items-center">
                        <div>
                          <span className="font-medium">{student.full_name}</span>
                          <span className="text-muted-foreground ml-2">({student.reg_no})</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedDepartmentId ? departments.find(d => d.id === selectedDepartmentId)?.name : 'No department'} • 
                          {selectedBatchId ? batches.find(b => b.id === selectedBatchId)?.name : 'No batch'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleAssignDepartments}
                    disabled={isUploading || !selectedDepartmentId || !selectedBatchId}
                  >
                    {isUploading ? 'Creating Students...' : `Create ${uploadedStudents.length} Students`}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAssignment(false)
                      setCurrentStep(1)
                      setUploadedStudents([])
                      setSelectedDepartmentId('')
                      setSelectedBatchId('')
                    }}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
            <CardDescription>
              List of all enrolled students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No students found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first student
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Registration No</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{student.reg_no}</TableCell>
                      <TableCell>
                        {departments.find(dept => dept.id === student.department_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {batches.find(batch => batch.id === student.batch_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{student.email || 'N/A'}</TableCell>
                      <TableCell>{student.phone || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(student.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
