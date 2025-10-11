import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qnnmpyjirjnxpwnajvid.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubm1weWppcmpueHB3bmFqdmlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzMxNDIsImV4cCI6MjA3NTQwOTE0Mn0.wdFsPsDgyKUvmeCRkDWzlpTlx_4gvdA6YumvV8gRb3s'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campus ID is required' },
        { status: 400 }
      )
    }

    console.log('=== Deleting Campus from Database ===')
    console.log('Campus ID:', id)

    // Create a fresh Supabase client for direct database deletion
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })

    // Delete from Supabase database
    const { error } = await supabase
      .from('campuses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database delete error:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to delete from database: ${error.message}`,
        details: error
      }, { status: 500 })
    }

    console.log('Campus deleted successfully from database')
    return NextResponse.json({
      success: true,
      message: 'Campus deleted successfully from database'
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
