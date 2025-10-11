'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, MapPin, Edit } from 'lucide-react'
import { Campus } from '@/lib/types'
import { showToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'

export default function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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
      console.log('=== Fetching Campuses from Database ===')
      const { supabase } = await import('@/lib/supabase')
      
      const { data: campuses, error } = await supabase
        .from('campuses')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Campuses from database:', { data: campuses, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Error', 'Failed to fetch campuses from database')
        return
      }

      console.log('Real campuses from database:', campuses)
      setCampuses(campuses || [])
    } catch (error) {
      console.error('Failed to fetch campuses:', error)
      showToast.error('Error', 'Failed to fetch campuses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Form validation
    if (!formData.name.trim()) {
      showToast.error('Validation Error', 'Please enter a campus name')
      return
    }
    if (!formData.latitude || isNaN(Number(formData.latitude))) {
      showToast.error('Validation Error', 'Please enter a valid latitude')
      return
    }
    if (!formData.longitude || isNaN(Number(formData.longitude))) {
      showToast.error('Validation Error', 'Please enter a valid longitude')
      return
    }
    if (!formData.allowed_radius || isNaN(Number(formData.allowed_radius)) || Number(formData.allowed_radius) <= 0) {
      showToast.error('Validation Error', 'Please enter a valid radius (greater than 0)')
      return
    }

    setIsCreating(true)

    try {
      console.log('=== Creating Campus in Database ===')
      console.log('Form data:', formData)
      
      const { supabase } = await import('@/lib/supabase')
      
      const { data: campus, error } = await supabase
        .from('campuses')
        .insert({
          name: formData.name.trim(),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          allowed_radius: parseInt(formData.allowed_radius)
        })
        .select()
        .single()

      console.log('Database response:', { data: campus, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Creation Failed', `Failed to create campus: ${error.message}`)
        return
      }

      console.log('Campus created successfully, updating list')
      setCampuses([campus, ...campuses])
      setFormData({ name: '', latitude: '', longitude: '', allowed_radius: '100' })
      setShowForm(false)
      showToast.success('Campus Created', 'Campus has been created successfully in database!')
    } catch (error) {
      console.error('Failed to create campus:', error)
      showToast.error('Creation Failed', 'Failed to create campus')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditCampus = (campus: Campus) => {
    setEditingId(campus.id)
    setIsEditing(true)
    setFormData({
      name: campus.name,
      latitude: campus.latitude.toString(),
      longitude: campus.longitude.toString(),
      allowed_radius: campus.allowed_radius.toString()
    })
    setShowForm(true)
  }

  const handleUpdateCampus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    // Form validation
    if (!formData.name.trim()) {
      showToast.error('Validation Error', 'Please enter a campus name')
      return
    }
    if (!formData.latitude || isNaN(Number(formData.latitude))) {
      showToast.error('Validation Error', 'Please enter a valid latitude')
      return
    }
    if (!formData.longitude || isNaN(Number(formData.longitude))) {
      showToast.error('Validation Error', 'Please enter a valid longitude')
      return
    }
    if (!formData.allowed_radius || isNaN(Number(formData.allowed_radius)) || Number(formData.allowed_radius) <= 0) {
      showToast.error('Validation Error', 'Please enter a valid radius (greater than 0)')
      return
    }

    setIsCreating(true)

    try {
      console.log('=== Updating Campus in Database ===')
      console.log('Form data:', formData)
      console.log('Editing ID:', editingId)
      
      const { supabase } = await import('@/lib/supabase')
      
      const { data: campus, error } = await supabase
        .from('campuses')
        .update({
          name: formData.name.trim(),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          allowed_radius: parseInt(formData.allowed_radius),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId)
        .select()
        .single()

      console.log('Database response:', { data: campus, error })

      if (error) {
        console.error('Database error:', error)
        showToast.error('Update Failed', `Failed to update campus: ${error.message}`)
        return
      }

      console.log('Campus updated successfully, updating list')
      setCampuses(campuses.map(c => c.id === editingId ? campus : c))
      setFormData({ name: '', latitude: '', longitude: '', allowed_radius: '100' })
      setShowForm(false)
      setIsEditing(false)
      setEditingId(null)
      showToast.success('Campus Updated', 'Campus has been updated successfully in database!')
    } catch (error) {
      console.error('Failed to update campus:', error)
      showToast.error('Update Failed', 'Failed to update campus')
    } finally {
      setIsCreating(false)
    }
  }


  const handleCancel = () => {
    setFormData({ name: '', latitude: '', longitude: '', allowed_radius: '100' })
    setShowForm(false)
    setIsEditing(false)
    setEditingId(null)
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
              <CardTitle>{isEditing ? 'Edit Campus' : 'Add New Campus'}</CardTitle>
              <CardDescription>
                {isEditing ? 'Update the campus details' : 'Enter the campus details including location coordinates'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={isEditing ? handleUpdateCampus : handleCreateCampus} className="space-y-4">
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
                      min="1"
                      max="10000"
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
                      placeholder="e.g., 12.3456"
                      required
                      min="-90"
                      max="90"
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
                      placeholder="e.g., 78.9012"
                      required
                      min="-180"
                      max="180"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Campus' : 'Create Campus')}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditCampus(campus)}
                          >
                            <Edit className="h-4 w-4" />
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
