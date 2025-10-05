import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const course_id = searchParams.get('course_id')
    const lecturer_id = searchParams.get('lecturer_id')
    const campus_id = searchParams.get('campus_id')
    const date = searchParams.get('date')
    const offset = (page - 1) * limit

    let query = supabase
      .from('class_sessions')
      .select(`
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
      `, { count: 'exact' })

    if (course_id) {
      query = query.eq('course_id', course_id)
    }
    if (lecturer_id) {
      query = query.eq('lecturer_id', lecturer_id)
    }
    if (campus_id) {
      query = query.eq('campus_id', campus_id)
    }
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      
      query = query
        .gte('schedule_time', startDate.toISOString())
        .lt('schedule_time', endDate.toISOString())
    }

    const { data: sessions, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('schedule_time', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch class sessions' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: sessions,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages
      }
    })
  } catch (error) {
    console.error('Class sessions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { course_id, campus_id, lecturer_id, schedule_time, duration_minutes, room } = body

    if (!course_id || !campus_id || !lecturer_id || !schedule_time) {
      return NextResponse.json(
        { error: 'Course, campus, lecturer, and schedule time are required' },
        { status: 400 }
      )
    }

    const { data: session, error } = await supabase
      .from('class_sessions')
      .insert({
        course_id,
        campus_id,
        lecturer_id,
        schedule_time: new Date(schedule_time).toISOString(),
        duration_minutes: duration_minutes || 60,
        room: room || null
      })
      .select(`
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
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create class session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: session,
      message: 'Class session created successfully'
    })
  } catch (error) {
    console.error('Class session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
