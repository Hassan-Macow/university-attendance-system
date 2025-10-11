import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Bulk upload started')
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    console.log('File received:', file.name, 'Type:', file.type, 'Size:', file.size)

    // Parse both CSV and Excel files
    let lines: string[] = []
    
    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      // Handle CSV files
      const text = await file.text()
      lines = text.split('\n').filter(line => line.trim())
    } else {
      // Handle Excel files - for now, we'll treat them as CSV
      // In production, you'd want to use a proper Excel parser like 'xlsx'
      const text = await file.text()
      lines = text.split('\n').filter(line => line.trim())
    }
    
    if (lines.length < 2) {
      return NextResponse.json({ success: false, error: 'File must contain at least a header and one data row' }, { status: 400 })
    }

    // Parse CSV with proper handling of quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0])
    const dataRows = lines.slice(1)

    // Validate headers - support both 4-column and 6-column formats
    const requiredHeaders = ['Full Name', 'Registration Number', 'Department Name', 'Batch Name']
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required columns: ${missingHeaders.join(', ')}. Required columns: Full Name, Registration Number, Department Name, Batch Name` 
      }, { status: 400 })
    }

    // Detect format - check if it's 4-column or 6-column format
    const isOldFormat = headers.includes('Email') && headers.includes('Phone')
    console.log('Detected format:', isOldFormat ? '6-column (old)' : '4-column (new)')

    let imported = 0
    const errors = []

    console.log('Processing', dataRows.length, 'rows')

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = parseCSVLine(dataRows[i])
        
        if (row.length < headers.length) {
          errors.push(`Row ${i + 2}: Insufficient data`)
          continue
        }

        // Parse data based on detected format
        let studentData
        if (isOldFormat) {
          // 6-column format: Full Name, Registration Number, Email, Phone, Department Name, Batch Name
          studentData = {
            full_name: row[0],
            reg_no: row[1],
            email: row[2] || null,
            phone: row[3] || null,
            department_name: row[4],
            batch_name: row[5]
          }
        } else {
          // 4-column format: Full Name, Registration Number, Department Name, Batch Name
          studentData = {
            full_name: row[0],
            reg_no: row[1],
            email: null,
            phone: null,
            department_name: row[2],
            batch_name: row[3]
          }
        }

        console.log(`Processing row ${i + 2}:`, studentData)

        // Validate required fields
        if (!studentData.full_name || !studentData.reg_no || !studentData.department_name || !studentData.batch_name) {
          errors.push(`Row ${i + 2}: Missing required fields`)
          continue
        }

        // Validate field lengths according to students table schema
        if (studentData.full_name.length > 255) {
          errors.push(`Row ${i + 2}: Full name exceeds 255 characters`)
          continue
        }
        if (studentData.reg_no.length > 50) {
          errors.push(`Row ${i + 2}: Registration number exceeds 50 characters`)
          continue
        }

        // Get department ID
        console.log(`Looking for department: ${studentData.department_name}`)
        const { data: department, error: deptError } = await supabase
          .from('departments')
          .select('id')
          .eq('name', studentData.department_name)
          .single()

        if (deptError || !department) {
          console.log(`Department error:`, deptError)
          errors.push(`Row ${i + 2}: Department '${studentData.department_name}' not found`)
          continue
        }

        console.log(`Found department ID: ${department.id}`)

        // Get batch ID
        console.log(`Looking for batch: ${studentData.batch_name}`)
        const { data: batch, error: batchError } = await supabase
          .from('batches')
          .select('id')
          .eq('name', studentData.batch_name)
          .single()

        if (batchError || !batch) {
          console.log(`Batch error:`, batchError)
          errors.push(`Row ${i + 2}: Batch '${studentData.batch_name}' not found`)
          continue
        }

        console.log(`Found batch ID: ${batch.id}`)

        // Get campus ID from department
        const { data: campus, error: campusError } = await supabase
          .from('departments')
          .select('campus_id')
          .eq('id', department.id)
          .single()

        if (campusError || !campus) {
          console.log(`Campus error:`, campusError)
          errors.push(`Row ${i + 2}: Could not find campus for department`)
          continue
        }

        console.log(`Found campus ID: ${campus.campus_id}`)

        // Insert student with data from the parsed format
        const studentInsertData = {
          full_name: studentData.full_name,
          reg_no: studentData.reg_no,
          email: studentData.email,
          phone: studentData.phone,
          department_id: department.id,
          batch_id: batch.id,
          campus_id: campus.campus_id
        }

        console.log(`Inserting student:`, studentInsertData)
        const { error: insertError } = await supabase
          .from('students')
          .insert([studentInsertData])

        if (insertError) {
          console.log(`Insert error:`, insertError)
          if (insertError.code === '23505') {
            errors.push(`Row ${i + 2}: Registration number '${studentData.reg_no}' already exists`)
          } else {
            errors.push(`Row ${i + 2}: ${insertError.message}`)
          }
          continue
        }

        console.log(`Successfully imported student: ${studentData.full_name}`)
        imported++
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`Bulk upload completed. Imported: ${imported}, Total: ${dataRows.length}, Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      imported,
      total: dataRows.length,
      errors: errors.slice(0, 10), // Limit errors to first 10
      message: `Successfully imported ${imported} out of ${dataRows.length} students`
    })

  } catch (error) {
    console.error('Bulk upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process file' 
    }, { status: 500 })
  }
}
