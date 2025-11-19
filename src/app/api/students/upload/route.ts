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
    // Get user information from request headers (set by middleware or client)
    const userEmail = request.headers.get('x-user-email')
    const userRole = request.headers.get('x-user-role')
    
    console.log('User info:', { email: userEmail, role: userRole })
    
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
    
    // Fetch all departments and batches to map names to IDs
    console.log('Attempting to fetch departments...')
    let departments: any[] | null = null
    let batches: any[] | null = null
    
    try {
      const deptResult = await supabase
        .from('departments')
        .select('id, name, campus_id')
      
      departments = deptResult.data
      const deptError = deptResult.error
      
      console.log('Departments query completed. Error:', deptError, 'Data count:', departments?.length)
      
      if (deptError) {
        console.error('Department fetch error:', deptError)
        return NextResponse.json(
          { 
            success: false,
            error: `Failed to fetch departments: ${deptError.message}. This might be a local development issue. The feature will work on production.`
          },
          { status: 500 }
        )
      }
    } catch (fetchError) {
      console.error('Department fetch exception:', fetchError)
      return NextResponse.json(
        { 
          success: false,
          error: `Network error fetching departments. This is a Windows/Node.js DNS issue in local development. Deploy to production to test the feature.`
        },
        { status: 500 }
      )
    }
    
    try {
      const batchResult = await supabase
        .from('batches')
        .select('id, name')
      
      batches = batchResult.data
      const batchError = batchResult.error
      
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
    } catch (fetchError) {
      console.error('Batch fetch exception:', fetchError)
      return NextResponse.json(
        { 
          success: false,
          error: `Network error fetching batches. This is a Windows/Node.js DNS issue in local development.`
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

    // Process and validate data with flexible column matching
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
    const warnings: Array<{ row: number; message: string }> = []

    console.log('Processing rows...')
    
    // Helper function to find column value (case-insensitive, flexible matching)
    const getColumnValue = (row: any, possibleNames: string[]): string | null => {
      for (const name of possibleNames) {
        const key = Object.keys(row).find(k => k.toLowerCase().includes(name.toLowerCase()))
        if (key && row[key]) {
          return row[key].toString().trim()
        }
      }
      return null
    }
    
    data.forEach((row: any, index: number) => {
      const rowNumber = index + 2 // +2 because of 0-index and header row
      
      try {
        // Flexible column matching
        const fullName = getColumnValue(row, ['full name', 'name', 'student name'])
        const regNo = getColumnValue(row, ['registration number', 'reg no', 'regno', 'registration', 'student id'])
        const departmentName = getColumnValue(row, ['department', 'dept'])
        const batchName = getColumnValue(row, ['batch', 'year', 'class'])
        const email = getColumnValue(row, ['email', 'e-mail'])
        const phone = getColumnValue(row, ['phone', 'mobile', 'contact'])
        
        // Validate required fields
        if (!fullName) {
          throw new Error('Full Name is required (column: "Full Name", "Name", or "Student Name")')
        }
        if (!regNo) {
          throw new Error('Registration Number is required (column: "Registration Number", "Reg No", or "Student ID")')
        }
        if (!departmentName) {
          throw new Error('Department is required (column: "Department" or "Dept")')
        }
        if (!batchName) {
          throw new Error('Batch is required (column: "Batch", "Year", or "Class")')
        }

        // Validate registration number format (alphanumeric, no special chars except dash/underscore)
        if (!/^[a-zA-Z0-9_-]+$/.test(regNo)) {
          warnings.push({
            row: rowNumber,
            message: `Registration number "${regNo}" contains special characters`
          })
        }

        // Find department by name (case-insensitive, partial match)
        const department = departments?.find(
          d => d.name.toLowerCase().includes(departmentName.toLowerCase()) ||
               departmentName.toLowerCase().includes(d.name.toLowerCase())
        )
        
        if (!department) {
          const availableDepts = departments?.map(d => d.name).join(', ') || 'none'
          throw new Error(`Department "${departmentName}" not found. Available: ${availableDepts}`)
        }

        // Department validation
        if (false) {
          throw new Error(`You can only upload students to your department. Selected: "${departmentName}"`)
        }

        // Find batch by name (case-insensitive, partial match)
        const batch = batches?.find(
          b => b.name.toLowerCase().includes(batchName.toLowerCase()) ||
               batchName.toLowerCase().includes(b.name.toLowerCase())
        )
        
        if (!batch) {
          const availableBatches = batches?.map(b => b.name).join(', ') || 'none'
          throw new Error(`Batch "${batchName}" not found. Available: ${availableBatches}`)
        }

        // Validate email format if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          warnings.push({
            row: rowNumber,
            message: `Invalid email format: "${email}"`
          })
        }

        students.push({
          full_name: fullName,
          reg_no: regNo,
          department_id: department.id,
          batch_id: batch.id,
          campus_id: department.campus_id,
          email: email || null,
          phone: phone || null
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
      ...(errors.length > 0 && { errors }),
      ...(warnings.length > 0 && { warnings })
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