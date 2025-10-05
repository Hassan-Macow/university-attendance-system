import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const department_id = searchParams.get('department_id')
    const offset = (page - 1) * limit

    let query = supabase
      .from('batches')
      .select(`
        *,
        departments!inner(*)
      `, { count: 'exact' })

    if (department_id) {
      query = query.eq('department_id', department_id)
    }

    const { data: batches, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch batches' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: batches,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages
      }
    })
  } catch (error) {
    console.error('Batches fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, year_level, department_id, academic_year } = body

    if (!name || !year_level || !department_id || !academic_year) {
      return NextResponse.json(
        { error: 'Name, year level, department, and academic year are required' },
        { status: 400 }
      )
    }

    // Check if batch with same name and department already exists
    const { data: existingBatch } = await supabase
      .from('batches')
      .select('id')
      .eq('name', name)
      .eq('department_id', department_id)
      .single()

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch with this name already exists in the department' },
        { status: 400 }
      )
    }

    const { data: batch, error } = await supabase
      .from('batches')
      .insert({
        name,
        year_level: parseInt(year_level),
        department_id,
        academic_year
      })
      .select(`
        *,
        departments!inner(*)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create batch' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: batch,
      message: 'Batch created successfully'
    })
  } catch (error) {
    console.error('Batch creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
