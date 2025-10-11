'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Department {
  id: string
  name: string
  campus_id: string
}

interface Campus {
  id: string
  name: string
}

export default function DebugDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newDeptName, setNewDeptName] = useState('')
  const [selectedCampusId, setSelectedCampusId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchDepartments()
    fetchCampuses()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/check-departments')
      const data = await response.json()
      
      if (data.success) {
        setDepartments(data.departments)
        console.log('Available departments:', data.departments)
      } else {
        console.error('Failed to fetch departments:', data.error)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCampuses = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('campuses')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching campuses:', error)
        return
      }

      setCampuses(data || [])
      if (data && data.length > 0) {
        setSelectedCampusId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching campuses:', error)
    }
  }

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim() || !selectedCampusId) {
      alert('Please enter department name and select a campus')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/add-department', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDeptName.trim(),
          campus_id: selectedCampusId
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`Department '${newDeptName}' created successfully!`)
        setNewDeptName('')
        fetchDepartments() // Refresh the list
      } else {
        alert(`Failed to create department: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating department:', error)
      alert('Failed to create department')
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
            <p className="text-muted-foreground">Loading departments...</p>
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
            <div>
              <h1 className="text-3xl font-bold">Debug Departments</h1>
              <p className="text-muted-foreground">
                Check existing departments and add missing ones
              </p>
            </div>

            {/* Existing Departments */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Departments ({departments.length})</CardTitle>
                <CardDescription>
                  These are the departments currently in your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {departments.length === 0 ? (
                  <p className="text-muted-foreground">No departments found</p>
                ) : (
                  <div className="space-y-2">
                    {departments.map((dept) => (
                      <div key={dept.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{dept.name}</span>
                        <span className="text-sm text-muted-foreground">ID: {dept.id.slice(0, 8)}...</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add New Department */}
            <Card>
              <CardHeader>
                <CardTitle>Add Missing Department</CardTitle>
                <CardDescription>
                  Add "Bank & Finance" or any other missing department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dept-name">Department Name</Label>
                    <Input
                      id="dept-name"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="e.g., Bank & Finance"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="campus">Campus</Label>
                    <select
                      id="campus"
                      value={selectedCampusId}
                      onChange={(e) => setSelectedCampusId(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      {campuses.map((campus) => (
                        <option key={campus.id} value={campus.id}>
                          {campus.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button 
                    onClick={handleCreateDepartment}
                    disabled={isCreating || !newDeptName.trim() || !selectedCampusId}
                  >
                    {isCreating ? 'Creating...' : 'Create Department'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Fix for Bank & Finance */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Fix</CardTitle>
                <CardDescription>
                  Click this button to quickly add "Bank & Finance" department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => {
                    setNewDeptName('Bank & Finance')
                    handleCreateDepartment()
                  }}
                  disabled={isCreating}
                  className="w-full"
                >
                  Add "Bank & Finance" Department
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
