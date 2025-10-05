import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const department_id = searchParams.get('department_id')
    const lecturer_id = searchParams.get('lecturer_id')
    const offset = (page - 1) * limit

    let query = supabase
      .from('courses')
      .select(`
        *,
        departments!inner(*),
        lecturers!inner(
          *,
          users!inner(*)
        ),
        batches!inner(*)
      `, { count: 'exact' })

    if (department_id) {
      query = query.eq('department_id', department_id)
    }
    if (lecturer_id) {
      query = query.eq('lecturer_id', lecturer_id)
    }

    const { data: courses, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: courses,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages
      }
    })
  } catch (error) {
    console.error('Courses fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, department_id, lecturer_id, batch_id, credits } = body

    if (!name || !code || !department_id || !lecturer_id || !batch_id) {
      return NextResponse.json(
        { error: 'Name, code, department, lecturer, and batch are required' },
        { status: 400 }
      )
    }

    // Check if course code already exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code)
      .single()

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course with this code already exists' },
        { status: 400 }
      )
    }

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        name,
        code,
        department_id,
        lecturer_id,
        batch_id,
        credits: credits || 3
      })
      .select(`
        *,
        departments!inner(*),
        lecturers!inner(
          *,
          users!inner(*)
        ),
        batches!inner(*)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: course,
      message: 'Course created successfully'
    })
  } catch (error) {
    console.error('Course creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
