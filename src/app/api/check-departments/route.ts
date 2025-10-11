import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== Checking Available Departments ===')
    
    const { data: departments, error } = await supabase
      .from('departments')
      .select('id, name, campus_id')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching departments:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch departments' 
      }, { status: 500 })
    }

    console.log('Available departments:', departments)

    return NextResponse.json({
      success: true,
      departments: departments || [],
      message: `Found ${departments?.length || 0} departments`
    })

  } catch (error) {
    console.error('Check departments error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
