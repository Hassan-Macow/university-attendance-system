'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, MapPin, Edit, Trash2 } from 'lucide-react'
import { Campus } from '@/lib/types'

export default function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    allowed_radius: '100'
  })

  useEffect(() => {
    fetchCampuses()
  }, [])

  const fetchCampuses = async () => {
    try {
      const response = await fetch('/api/campuses')
      const data = await response.json()
      if (data.data) {
        setCampuses(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch campuses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/campuses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (data.data) {
        setCampuses([data.data, ...campuses])
        setFormData({ name: '', latitude: '', longitude: '', allowed_radius: '100' })
        setShowForm(false)
      } else {
        alert(data.error || 'Failed to create campus')
      }
    } catch (error) {
      console.error('Failed to create campus:', error)
      alert('Failed to create campus')
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
            <p className="text-muted-foreground">Loading campuses...</p>
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Campuses</h1>
            <p className="text-muted-foreground">
              Manage university campuses and their locations
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Campus
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Campus</CardTitle>
              <CardDescription>
                Enter the campus details including location coordinates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCampus} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campus Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter campus name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowed_radius">Allowed Radius (meters)</Label>
                    <Input
                      id="allowed_radius"
                      type="number"
                      value={formData.allowed_radius}
                      onChange={(e) => setFormData({ ...formData, allowed_radius: e.target.value })}
                      placeholder="100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="e.g., 40.7128"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="e.g., -74.0060"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Campus'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Campuses</CardTitle>
            <CardDescription>
              List of all university campuses with their locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campuses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No campuses found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first campus
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Campus
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Radius</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campuses.map((campus) => (
                    <TableRow key={campus.id}>
                      <TableCell className="font-medium">{campus.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Lat: {campus.latitude}</div>
                          <div>Lng: {campus.longitude}</div>
                        </div>
                      </TableCell>
                      <TableCell>{campus.allowed_radius}m</TableCell>
                      <TableCell>
                        {new Date(campus.created_at).toLocaleDateString()}
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
