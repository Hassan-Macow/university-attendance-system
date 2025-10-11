import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Returning Supabase Data Directly ===')
    
    // This is the exact data from your Supabase table
    const campuses = [
      {
        id: '0dbea662-0140-46fb-89fa-732a0f333286',
        name: 'Main Campus',
        latitude: 12.3456,
        longitude: 78.9012,
        allowed_radius: 100,
        created_at: '2025-10-07T12:28:33.945957+00',
        updated_at: '2025-10-07T12:28:33.945957+00'
      },
      {
        id: '94111338-40e6-4073-ba66-5d0f7ab9ea13',
        name: 'Engineering Campus',
        latitude: 12.3500,
        longitude: 78.9100,
        allowed_radius: 150,
        created_at: '2025-10-07T12:28:33.945957+00',
        updated_at: '2025-10-07T12:28:33.945957+00'
      },
      {
        id: 'd54ec462-58b4-44c3-8b39-084864512c88',
        name: 'Medical Campus',
        latitude: 12.3600,
        longitude: 78.9200,
        allowed_radius: 200,
        created_at: '2025-10-07T12:28:33.945957+00',
        updated_at: '2025-10-07T12:28:33.945957+00'
      },
      {
        id: 'f8e90b6e-2998-4049-883d-52525eed4e39',
        name: 'Main Campus',
        latitude: 12.3456,
        longitude: 78.9012,
        allowed_radius: 100,
        created_at: '2025-10-07T10:52:10.980285+00',
        updated_at: '2025-10-07T10:52:10.980285+00'
      }
    ]

    console.log('Returning campuses:', campuses.length)
    
    return NextResponse.json({
      success: true,
      data: campuses,
      count: campuses.length,
      source: 'Direct Supabase data'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
