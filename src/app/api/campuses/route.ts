import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest) {
  try {
    console.log('=== Fetching Campuses from Database ===')
    
    const { data: campuses, error } = await supabase
      .from('campuses')
      .select('*')
      .eq('is_active', true) // Only show active campuses
      .order('created_at', { ascending: false })

    console.log('Database response:', { data: campuses, error })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch campuses from database' },
        { status: 500 }
      )
    }

    console.log('Real campuses from database:', campuses)
    return NextResponse.json({
      data: campuses || []
    })
  } catch (error) {
    console.error('Campuses fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Campus Creation API Called ===')
    console.log('Request URL:', request.url)
    console.log('Request method:', request.method)
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { name, latitude, longitude, allowed_radius } = body

    console.log('Parsed data:', { name, latitude, longitude, allowed_radius })

    if (!name || latitude === undefined || longitude === undefined) {
      console.log('Validation failed: missing required fields')
      return NextResponse.json(
        { error: 'Name, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    console.log('Attempting to insert into Supabase...')
    
    const { data: campus, error } = await supabase
      .from('campuses')
      .insert({
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        allowed_radius: allowed_radius || 100
      })
      .select()
      .single()

    console.log('Supabase response:', { data: campus, error })

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { 
          error: `Failed to create campus: ${error.message}`,
          details: error.details,
          hint: error.hint,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('Campus created successfully:', campus)
    return NextResponse.json({
      data: campus,
      message: 'Campus created successfully'
    })
  } catch (error) {
    console.error('Campus creation error:', error)
    return NextResponse.json(
      { 
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, latitude, longitude, allowed_radius } = body

    if (!id || !name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'ID, name, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    const { data: campus, error } = await supabase
      .from('campuses')
      .update({
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        allowed_radius: allowed_radius || 100
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update campus' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: campus,
      message: 'Campus updated successfully'
    })
  } catch (error) {
    console.error('Campus update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Campus ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('campuses')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete campus' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Campus deleted successfully'
    })
  } catch (error) {
    console.error('Campus deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}