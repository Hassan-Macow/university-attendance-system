import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const department_id = searchParams.get('department_id')
    const offset = (page - 1) * limit

    let query = supabase
      .from('lecturers')
      .select(`
        *,
        users!inner(*),
        departments!inner(*)
      `, { count: 'exact' })

    if (department_id) {
      query = query.eq('department_id', department_id)
    }

    const { data: lecturers, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch lecturers' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: lecturers,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages
      }
    })
  } catch (error) {
    console.error('Lecturers fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, department_id, employee_id, phone } = body

    if (!name || !email || !password || !department_id) {
      return NextResponse.json(
        { error: 'Name, email, password, and department are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Get department to get campus_id
    const { data: department } = await supabase
      .from('departments')
      .select('campus_id')
      .eq('id', department_id)
      .single()

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 400 }
      )
    }

    // Create user first
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        role: 'lecturer',
        campus_id: department.campus_id,
        department_id
      })
      .select()
      .single()

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create lecturer record
    const { data: lecturer, error: lecturerError } = await supabase
      .from('lecturers')
      .insert({
        user_id: user.id,
        department_id,
        employee_id: employee_id || null
      })
      .select(`
        *,
        users!inner(*),
        departments!inner(*)
      `)
      .single()

    if (lecturerError) {
      // Rollback user creation
      await supabase.from('users').delete().eq('id', user.id)
      return NextResponse.json(
        { error: 'Failed to create lecturer record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: lecturer,
      message: 'Lecturer created successfully'
    })
  } catch (error) {
    console.error('Lecturer creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
