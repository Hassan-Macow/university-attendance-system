import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const { data: campuses, error, count } = await supabase
      .from('campuses')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch campuses' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: campuses,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages
      }
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
    const body = await request.json()
    const { name, latitude, longitude, allowed_radius } = body

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Name, latitude, and longitude are required' },
        { status: 400 }
      )
    }

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

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create campus' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: campus,
      message: 'Campus created successfully'
    })
  } catch (error) {
    console.error('Campus creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
