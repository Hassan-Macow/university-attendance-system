// src/app/api/students/upload/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Dynamic import to avoid SSR issues
const XLSX = require('xlsx')

// Create server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  console.log('=== Upload API called ===')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key exists:', !!supabaseKey)
  
  try {
    console.log('Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    console.log('File received:', file?.name, file?.size)

    if (!file) {
      console.log('No file provided')
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read the uploaded file
    console.log('Reading file...')
    const arrayBuffer = await file.arrayBuffer()
    console.log('File read, size:', arrayBuffer.byteLength)
    
    console.log('Parsing Excel...')
    const workbook = XLSX.read(arrayBuffer)
    console.log('Workbook sheets:', workbook.SheetNames)
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet)
    console.log('Data rows found:', data.length)

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No data found in the file' },
        { status: 400 }
      )
    }

    console.log('First row sample:', data[0])
    console.log('Fetching departments and batches...')
    console.log('Supabase client ready:', !!supabase)
    
    // Test Supabase connection first
    try {
      const testQuery = await supabase.from('departments').select('count', { count: 'exact', head: true })
      console.log('Supabase connection test:', testQuery.error ? 'FAILED' : 'SUCCESS')
      if (testQuery.error) {
        console.error('Connection test error:', testQuery.error)
      }
    } catch (testError) {
      console.error('Connection test exception:', testError)
    }
    
    // Fetch all departments and batches to map names to IDs
    console.log('Attempting to fetch departments...')
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name, campus_id')
    
    console.log('Departments query completed. Error:', deptError, 'Data count:', departments?.length)
    
    if (deptError) {
      console.error('Department fetch error:', deptError)
      return NextResponse.json(
        { 
          success: false,
          error: `Failed to fetch departments: ${deptError.message}`
        },
        { status: 500 }
      )
    }
    
    const { data: batches, error: batchError } = await supabase
      .from('batches')
      .select('id, name')
    
    if (batchError) {
      console.error('Batch fetch error:', batchError)
      return NextResponse.json(
        { 
          success: false,
          error: `Failed to fetch batches: ${batchError.message}`
        },
        { status: 500 }
      )
    }
    
    console.log('Departments:', departments?.length, 'Batches:', batches?.length)
    
    if (!departments || departments.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No departments found in the system. Please add departments first.'
        },
        { status: 400 }
      )
    }
    
    if (!batches || batches.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No batches found in the system. Please add batches first.'
        },
        { status: 400 }
      )
    }

    // Process and validate data
    const students: Array<{
      full_name: string
      reg_no: string
      department_id: string
      batch_id: string
      campus_id: string
      email: string | null
      phone: string | null
    }> = []
    const errors: Array<{ row: number; message: string }> = []

    console.log('Processing rows...')
    
    data.forEach((row: any, index: number) => {
      const rowNumber = index + 2 // +2 because of 0-index and header row
      
      try {
        // Validate required fields
        if (!row['Full Name*']) {
          throw new Error('Full Name is required')
        }
        if (!row['Registration Number*']) {
          throw new Error('Registration Number is required')
        }
        if (!row['Department*']) {
          throw new Error('Department is required')
        }
        if (!row['Batch*']) {
          throw new Error('Batch is required')
        }

        // Find department by name (case-insensitive)
        const departmentName = row['Department*'].toString().trim()
        const department = departments?.find(
          d => d.name.toLowerCase() === departmentName.toLowerCase()
        )
        
        if (!department) {
          throw new Error(`Department "${departmentName}" not found. Please use exact department name.`)
        }

        // Find batch by name (case-insensitive)
        const batchName = row['Batch*'].toString().trim()
        const batch = batches?.find(
          b => b.name.toLowerCase() === batchName.toLowerCase()
        )
        
        if (!batch) {
          throw new Error(`Batch "${batchName}" not found. Please use exact batch name.`)
        }

        students.push({
          full_name: row['Full Name*'].toString().trim(),
          reg_no: row['Registration Number*'].toString().trim(),
          department_id: department.id,
          batch_id: batch.id,
          campus_id: department.campus_id,
          email: row['Email'] ? row['Email'].toString().trim() : null,
          phone: row['Phone'] ? row['Phone'].toString().trim() : null
        })
      } catch (error) {
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    })

    console.log('Valid students:', students.length)
    console.log('Errors:', errors.length)
    
    if (errors.length > 0 && students.length === 0) {
      console.log('All rows have errors:', errors)
      return NextResponse.json(
        { 
          success: false,
          error: 'All rows have errors. Please check your file.',
          errors
        },
        { status: 400 }
      )
    }

    // Insert into database
    console.log('Inserting students into database...')
    const { data: result, error } = await supabase
      .from('students')
      .insert(students)
      .select()
    
    console.log('Insert result:', result?.length, 'Error:', error)

    if (error) {
      // Check for duplicate registration number
      if (error.code === '23505') {
        return NextResponse.json(
          { 
            success: false,
            error: 'One or more registration numbers already exist in the database'
          },
          { status: 400 }
        )
      }
      throw error
    }

    console.log('=== Upload successful ===')
    return NextResponse.json({
      success: true,
      count: result?.length || 0,
      students: result,
      ...(errors.length > 0 && { warnings: errors })
    })

  } catch (error: any) {
    console.error('=== Upload error ===', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process upload' },
      { status: 500 }
    )
  }
}