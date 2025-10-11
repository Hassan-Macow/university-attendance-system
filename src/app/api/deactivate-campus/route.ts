import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campus ID is required' },
        { status: 400 }
      )
    }

    console.log('=== Deactivating Campus ===')
    console.log('Campus ID:', id)

    // Use the working Supabase client from the lib
    const { supabase } = await import('@/lib/supabase')
    
    // Update campus to inactive instead of deleting
    const { data: campus, error } = await supabase
      .from('campuses')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    console.log('Database response:', { data: campus, error })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to deactivate campus: ${error.message}`
      }, { status: 500 })
    }

    console.log('Campus deactivated successfully')
    return NextResponse.json({
      success: true,
      message: 'Campus deactivated successfully'
    })
  } catch (error) {
    console.error('Deactivate error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
