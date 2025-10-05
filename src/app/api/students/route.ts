import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const department_id = searchParams.get('department_id')
    const batch_id = searchParams.get('batch_id')
    const offset = (page - 1) * limit

    let query = supabase
      .from('students')
      .select(`
        *,
        departments!inner(*),
        batches!inner(*),
        campuses!inner(*)
      `, { count: 'exact' })

    if (department_id) {
      query = query.eq('department_id', department_id)
    }
    if (batch_id) {
      query = query.eq('batch_id', batch_id)
    }

    const { data: students, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: students,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages
      }
    })
  } catch (error) {
    console.error('Students fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { full_name, reg_no, department_id, batch_id, campus_id, email, phone } = body

    if (!full_name || !reg_no || !department_id || !batch_id || !campus_id) {
      return NextResponse.json(
        { error: 'Full name, registration number, department, batch, and campus are required' },
        { status: 400 }
      )
    }

    // Check if registration number already exists
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('reg_no', reg_no)
      .single()

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student with this registration number already exists' },
        { status: 400 }
      )
    }

    const { data: student, error } = await supabase
      .from('students')
      .insert({
        full_name,
        reg_no,
        department_id,
        batch_id,
        campus_id,
        email: email || null,
        phone: phone || null
      })
      .select(`
        *,
        departments!inner(*),
        batches!inner(*),
        campuses!inner(*)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create student' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: student,
      message: 'Student created successfully'
    })
  } catch (error) {
    console.error('Student creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
