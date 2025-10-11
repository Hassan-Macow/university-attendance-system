import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Parsing Student Names ===')
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

    // Validate headers - only need 2 columns
    const requiredHeaders = ['Full Name', 'Registration Number']
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required columns: ${missingHeaders.join(', ')}. Only 2 columns needed: Full Name, Registration Number` 
      }, { status: 400 })
    }

    console.log('Processing', dataRows.length, 'rows')

    const students = []
    const errors = []

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = parseCSVLine(dataRows[i])
        
        if (row.length < 2) {
          errors.push(`Row ${i + 2}: Insufficient data`)
          continue
        }

        const studentData = {
          full_name: row[0],
          reg_no: row[1],
          department_id: '', // Will be assigned in step 2
          batch_id: '', // Will be assigned in step 2
          email: null,
          phone: null
        }

        console.log(`Processing row ${i + 2}:`, studentData)

        // Validate required fields
        if (!studentData.full_name || !studentData.reg_no) {
          errors.push(`Row ${i + 2}: Missing required fields`)
          continue
        }

        // Validate field lengths
        if (studentData.full_name.length > 255) {
          errors.push(`Row ${i + 2}: Full name exceeds 255 characters`)
          continue
        }
        if (studentData.reg_no.length > 50) {
          errors.push(`Row ${i + 2}: Registration number exceeds 50 characters`)
          continue
        }

        students.push(studentData)
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`Parsed ${students.length} students successfully`)

    return NextResponse.json({
      success: true,
      students,
      total: dataRows.length,
      errors: errors.slice(0, 10), // Limit errors to first 10
      message: `Successfully parsed ${students.length} out of ${dataRows.length} students`
    })

  } catch (error) {
    console.error('Parse names error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to parse file' 
    }, { status: 500 })
  }
}
