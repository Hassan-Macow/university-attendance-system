import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    console.log('=== Fetching Departments from Database ===')
    
    // Use the working Supabase client from the lib
    const { supabase } = await import('@/lib/supabase')
    
    const { data: departments, error } = await supabase
      .from('departments')
      .select(`
        *,
        campuses!inner(*)
      `)
      .order('created_at', { ascending: false })

    console.log('Database response:', { data: departments, error })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch departments from database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: departments || [],
      pagination: {
        page: 1,
        limit: 10,
        total: departments?.length || 0,
        total_pages: 1
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
    console.log('=== Department Creation API Called ===')
    
    const body = await request.json()
    const { name, campus_id } = body

    console.log('Request body:', { name, campus_id })

    if (!name || !campus_id) {
      return NextResponse.json(
        { error: 'Name and campus_id are required' },
        { status: 400 }
      )
    }

    // Use the working Supabase client from the lib
    const { supabase } = await import('@/lib/supabase')
    
    console.log('Creating department in database...')
    
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

    console.log('Database response:', { data: department, error })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to create department: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: department,
      message: 'Department created successfully in database'
    })
  } catch (error) {
    console.error('Department creation error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('=== Department Update API Called ===')
    
    const body = await request.json()
    const { id, name, campus_id } = body

    console.log('Request body:', { id, name, campus_id })

    if (!id || !name || !campus_id) {
      return NextResponse.json(
        { error: 'ID, name, and campus_id are required' },
        { status: 400 }
      )
    }

    // Remove mock data check - always use real Supabase

    const { data: department, error } = await supabase
      .from('departments')
      .update({
        name,
        campus_id
      })
      .eq('id', id)
      .select(`
        *,
        campuses!inner(*)
      `)
      .single()

    console.log('Supabase response:', { data: department, error })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Failed to update department: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: department,
      message: 'Department updated successfully'
    })
  } catch (error) {
    console.error('Department update error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== Department Delete API Called ===')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    console.log('Delete request for ID:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      )
    }

    // Remove mock data check - always use real Supabase

    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)

    console.log('Supabase delete response:', { error })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Failed to delete department: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Department deleted successfully'
    })
  } catch (error) {
    console.error('Department deletion error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
