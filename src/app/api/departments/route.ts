import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const { data: departments, error, count } = await supabase
      .from('departments')
      .select(`
        *,
        campuses!inner(*)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch departments' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: departments,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages
      }
    })
  } catch (error) {
    console.error('Departments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, campus_id } = body

    if (!name || !campus_id) {
      return NextResponse.json(
        { error: 'Name and campus_id are required' },
        { status: 400 }
      )
    }

    const { data: department, error } = await supabase
      .from('departments')
      .insert({
        name,
        campus_id
      })
      .select(`
        *,
        campuses!inner(*)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create department' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: department,
      message: 'Department created successfully'
    })
  } catch (error) {
    console.error('Department creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
