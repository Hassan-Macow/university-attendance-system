import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Read the Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data found in the Excel file' },
        { status: 400 }
      )
    }

    // Validate required columns
    const requiredColumns = ['full_name', 'reg_no', 'department_id', 'batch_id', 'campus_id']
    const firstRow = data[0] as any
    const missingColumns = requiredColumns.filter(col => !(col in firstRow))
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      )
    }

    // Process each row
    const students = []
    const errors = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any
      const rowNumber = i + 2 // +2 because Excel is 1-indexed and we skip header

      try {
        // Validate required fields
        if (!row.full_name || !row.reg_no || !row.department_id || !row.batch_id || !row.campus_id) {
          errors.push(`Row ${rowNumber}: Missing required fields`)
          continue
        }

        // Check if student already exists
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('reg_no', row.reg_no)
          .single()

        if (existingStudent) {
          errors.push(`Row ${rowNumber}: Student with registration number ${row.reg_no} already exists`)
          continue
        }

        students.push({
          full_name: row.full_name,
          reg_no: row.reg_no,
          department_id: row.department_id,
          batch_id: row.batch_id,
          campus_id: row.campus_id,
          email: row.email || null,
          phone: row.phone || null
        })
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No valid students to import', errors },
        { status: 400 }
      )
    }

    // Insert students in batches
    const batchSize = 100
    const results = []
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('students')
        .insert(batch)
        .select()

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else {
        results.push(...(data || []))
      }
    }

    return NextResponse.json({
      data: {
        imported: results.length,
        total: students.length,
        errors: errors.length
      },
      message: `Successfully imported ${results.length} students`,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Student upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
