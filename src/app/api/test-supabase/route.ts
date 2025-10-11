import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== Testing Supabase Connection ===')
    
    // Test 1: Basic connection
    const { data: testData, error: testError } = await supabase
      .from('campuses')
      .select('count')
      .limit(1)

    console.log('Test 1 - Count query:', { data: testData, error: testError })

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Count query failed',
        details: testError
      })
    }

    // Test 2: Try to insert a test record
    const { data: insertData, error: insertError } = await supabase
      .from('campuses')
      .insert({
        name: 'Test Campus',
        latitude: 0.0,
        longitude: 0.0,
        allowed_radius: 100
      })
      .select()
      .single()

    console.log('Test 2 - Insert query:', { data: insertData, error: insertError })

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Insert query failed',
        details: insertError,
        countData: testData
      })
    }

    // Test 3: Clean up - delete the test record
    const { error: deleteError } = await supabase
      .from('campuses')
      .delete()
      .eq('id', insertData.id)

    console.log('Test 3 - Delete query:', { error: deleteError })

    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      countData: testData,
      insertData: insertData
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
