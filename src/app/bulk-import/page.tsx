'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  IconUpload,
  IconDownload,
  IconFileSpreadsheet,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconUsers,
  IconBuilding,
  IconSchool
} from '@tabler/icons-react'

interface ImportResult {
  success: number
  errors: number
  total: number
  details: string[]
}

export default function BulkImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showTemplate, setShowTemplate] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'text/csv') {
        setSelectedFile(file)
        setImportResult(null)
      } else {
        alert('Please select an Excel (.xlsx) or CSV file')
      }
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    setIsUploading(true)
    try {
      // Mock import process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock results
      const mockResult: ImportResult = {
        success: 45,
        errors: 5,
        total: 50,
        details: [
          'Row 2: Invalid email format',
          'Row 7: Missing registration number',
          'Row 12: Duplicate email address',
          'Row 18: Invalid department ID',
          'Row 23: Missing campus information'
        ]
      }
      
      setImportResult(mockResult)
    } catch (error) {
      alert('Error importing file')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Mock template download
    const csvContent = `Full Name,Email,Registration Number,Campus,Department,Batch
John Doe,john.doe@student.university.edu,STU001,Main Campus,Computer Science,2024
Jane Smith,jane.smith@student.university.edu,STU002,Main Campus,Computer Science,2024
Ahmed Hassan,ahmed.hassan@student.university.edu,STU003,North Campus,Engineering,2024`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bulk Import
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Import students, lecturers, or other users in bulk using Excel files
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUpload className="h-5 w-5" />
                  Upload File
                </CardTitle>
                <CardDescription>
                  Select an Excel or CSV file to import users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileSelect}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#1B75BB] file:text-white hover:file:bg-[#0d5a8a]"
                  />
                </div>

                {selectedFile && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <IconFileSpreadsheet className="h-5 w-5" />
                      <span className="font-medium">{selectedFile.name}</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      File size: {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleImport} 
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? 'Importing...' : 'Import Users'}
                </Button>
              </CardContent>
            </Card>

            {/* Template Download */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconDownload className="h-5 w-5" />
                  Download Template
                </CardTitle>
                <CardDescription>
                  Get the correct format for importing users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button onClick={downloadTemplate} variant="outline" className="w-full">
                    <IconFileSpreadsheet className="h-4 w-4 mr-2" />
                    Download Student Template (CSV)
                  </Button>
                  
                  <Button onClick={downloadTemplate} variant="outline" className="w-full">
                    <IconUsers className="h-4 w-4 mr-2" />
                    Download Lecturer Template (CSV)
                  </Button>
                  
                  <Button onClick={downloadTemplate} variant="outline" className="w-full">
                    <IconBuilding className="h-4 w-4 mr-2" />
                    Download Department Template (CSV)
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Template Requirements:</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Use the provided CSV templates</li>
                    <li>• Include all required columns</li>
                    <li>• Use proper email formats</li>
                    <li>• Ensure unique registration numbers</li>
                    <li>• Match campus and department names exactly</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Import Results */}
          {importResult && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconFileSpreadsheet className="h-5 w-5" />
                  Import Results
                </CardTitle>
                <CardDescription>
                  Summary of the import process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {importResult.success}
                    </div>
                    <div className="text-sm text-green-800 dark:text-green-200">Successfully Imported</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {importResult.errors}
                    </div>
                    <div className="text-sm text-red-800 dark:text-red-200">Errors</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {importResult.total}
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">Total Records</div>
                  </div>
                </div>

                {importResult.details.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 text-red-600 dark:text-red-400">Error Details:</h4>
                    <div className="space-y-2">
                      {importResult.details.map((detail, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                          <IconX className="h-4 w-4" />
                          {detail}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.success > 0 && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <IconCheck className="h-5 w-5" />
                      <span className="font-medium">
                        {importResult.success} users have been successfully imported!
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconAlertCircle className="h-5 w-5" />
                Import Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">For Students:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Full Name (required)</li>
                    <li>• Email address (must be unique)</li>
                    <li>• Registration Number (must be unique)</li>
                    <li>• Campus (must match existing campus)</li>
                    <li>• Department (must match existing department)</li>
                    <li>• Batch (optional)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">For Lecturers:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Full Name (required)</li>
                    <li>• Email address (must be unique)</li>
                    <li>• Employee ID (must be unique)</li>
                    <li>• Campus (must match existing campus)</li>
                    <li>• Department (must match existing department)</li>
                    <li>• Role (lecturer/dean)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
