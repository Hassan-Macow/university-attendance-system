import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Creating Students in Bulk ===')
    
    // Test Supabase connection with timeout
    console.log('Testing Supabase connection...')
    let testData, testError
    
    try {
      const testPromise = supabase
        .from('departments')
        .select('id, name')
        .limit(1)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
      
      const result = await Promise.race([testPromise, timeoutPromise])
      testData = result.data
      testError = result.error
    } catch (error) {
      console.log('Supabase connection failed:', error)
      return NextResponse.json({ 
        success: false, 
        error: `Database connection failed: ${error.message}` 
      }, { status: 500 })
    }
    
    if (testError) {
      console.log('Supabase query error:', testError)
      return NextResponse.json({ 
        success: false, 
        error: `Database query error: ${testError.message}` 
      }, { status: 500 })
    }
    
    console.log('Supabase connection successful')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { students } = body

    if (!students || !Array.isArray(students)) {
      console.log('Error: Students array is required')
      return NextResponse.json({ 
        success: false, 
        error: 'Students array is required' 
      }, { status: 400 })
    }

    console.log('Creating', students.length, 'students')
    console.log('First student example:', students[0])

    let imported = 0
    const errors = []

    for (let i = 0; i < students.length; i++) {
      try {
        const student = students[i]
        
        console.log(`Creating student ${i + 1}:`, student)

        // Validate required fields
        if (!student.full_name || !student.reg_no || !student.department_id || !student.batch_id) {
          errors.push(`Student ${i + 1}: Missing required fields`)
          continue
        }

        // Get campus_id from department
        console.log(`Getting campus for department: ${student.department_id}`)
        const { data: department, error: deptError } = await supabase
          .from('departments')
          .select('campus_id')
          .eq('id', student.department_id)
          .single()

        if (deptError) {
          console.log(`Department error:`, deptError)
          errors.push(`Student ${i + 1}: Department error - ${deptError.message}`)
          continue
        }

        if (!department) {
          console.log(`Department not found for ID: ${student.department_id}`)
          errors.push(`Student ${i + 1}: Department not found`)
          continue
        }

        console.log(`Found campus ID: ${department.campus_id}`)

        // Insert student
        const studentInsertData = {
          full_name: student.full_name,
          reg_no: student.reg_no,
          department_id: student.department_id,
          batch_id: student.batch_id,
          campus_id: department.campus_id,
          email: student.email || null,
          phone: student.phone || null
        }

        console.log(`Inserting student:`, studentInsertData)
        const { data: insertData, error: insertError } = await supabase
          .from('students')
          .insert([studentInsertData])
          .select()

        if (insertError) {
          console.log(`Insert error:`, insertError)
          if (insertError.code === '23505') {
            errors.push(`Student ${i + 1}: Registration number '${student.reg_no}' already exists`)
          } else {
            errors.push(`Student ${i + 1}: ${insertError.message}`)
          }
          continue
        }

        console.log(`Successfully created student: ${student.full_name}`, insertData)
        imported++
      } catch (error) {
        errors.push(`Student ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`Bulk create completed. Imported: ${imported}, Total: ${students.length}, Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      imported,
      total: students.length,
      errors: errors.slice(0, 10), // Limit errors to first 10
      message: `Successfully created ${imported} out of ${students.length} students`
    })

  } catch (error) {
    console.error('Bulk create error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create students' 
    }, { status: 500 })
  }
}
