import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const session_id = searchParams.get('session_id')
    const student_id = searchParams.get('student_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const offset = (page - 1) * limit

    let query = supabase
      .from('attendance')
      .select(`
        *,
        class_sessions!inner(
          *,
          courses!inner(
            *,
            departments!inner(*),
            lecturers!inner(
              *,
              users!inner(*)
            ),
            batches!inner(*)
          ),
          campuses!inner(*)
        ),
        students!inner(
          *,
          departments!inner(*),
          batches!inner(*),
          campuses!inner(*)
        )
      `, { count: 'exact' })

    if (session_id) {
      query = query.eq('session_id', session_id)
    }
    if (student_id) {
      query = query.eq('student_id', student_id)
    }
    if (start_date) {
      query = query.gte('timestamp', start_date)
    }
    if (end_date) {
      query = query.lte('timestamp', end_date)
    }

    const { data: attendance, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('timestamp', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: attendance,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages
      }
    })
  } catch (error) {
    console.error('Attendance fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, student_id, status, latitude, longitude } = body

    if (!session_id || !student_id || !status) {
      return NextResponse.json(
        { error: 'Session ID, student ID, and status are required' },
        { status: 400 }
      )
    }

    // Check if attendance already exists for this session and student
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id')
      .eq('session_id', session_id)
      .eq('student_id', student_id)
      .single()

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance already recorded for this student in this session' },
        { status: 400 }
      )
    }

    // Verify GPS location if provided
    if (latitude && longitude) {
      const { data: session } = await supabase
        .from('class_sessions')
        .select(`
          campuses!inner(latitude, longitude, allowed_radius)
        `)
        .eq('id', session_id)
        .single()

      if (session?.campuses && session.campuses.length > 0) {
        const campus = session.campuses[0]
        const distance = calculateDistance(
          latitude,
          longitude,
          campus.latitude,
          campus.longitude
        )

        if (distance > campus.allowed_radius) {
          return NextResponse.json(
            { error: 'Location is outside the allowed campus radius' },
            { status: 400 }
          )
        }
      }
    }

    const { data: attendance, error } = await supabase
      .from('attendance')
      .insert({
        session_id,
        student_id,
        status,
        latitude: latitude || null,
        longitude: longitude || null
      })
      .select(`
        *,
        class_sessions!inner(
          *,
          courses!inner(
            *,
            departments!inner(*),
            lecturers!inner(
              *,
              users!inner(*)
            ),
            batches!inner(*)
          ),
          campuses!inner(*)
        ),
        students!inner(
          *,
          departments!inner(*),
          batches!inner(*),
          campuses!inner(*)
        )
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to record attendance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: attendance,
      message: 'Attendance recorded successfully'
    })
  } catch (error) {
    console.error('Attendance recording error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate distance between two GPS coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
}
