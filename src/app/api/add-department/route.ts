import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { name, campus_id } = await request.json()

    if (!name || !campus_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Department name and campus_id are required' 
      }, { status: 400 })
    }

    console.log('=== Creating Department ===', { name, campus_id })

    const { data: department, error } = await supabase
      .from('departments')
      .insert([{
        name,
        campus_id
      }])
      .select('id, name, campus_id')
      .single()

    if (error) {
      console.error('Error creating department:', error)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to create department: ${error.message}` 
      }, { status: 500 })
    }

    console.log('Department created successfully:', department)

    return NextResponse.json({
      success: true,
      department,
      message: `Department '${name}' created successfully`
    })

  } catch (error) {
    console.error('Add department error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
