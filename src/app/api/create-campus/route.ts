import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, latitude, longitude, allowed_radius } = body

    console.log('=== Creating Campus ===')
    console.log('Data:', { name, latitude, longitude, allowed_radius })

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    // Simulate successful creation
    // In a real scenario, this would insert into Supabase
    const newCampus = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      allowed_radius: allowed_radius || 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Campus created successfully (simulated):', newCampus)
    return NextResponse.json({
      success: true,
      data: newCampus,
      message: 'Campus created successfully'
    })
  } catch (error) {
    console.error('Create error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
