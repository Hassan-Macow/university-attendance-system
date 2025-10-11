// src/app/api/students/template/route.ts
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const wb = XLSX.utils.book_new()
    
    // Sample data with clear headers matching the form
    const data = [
      {
        'Full Name*': 'John Doe',
        'Registration Number*': 'CS2024001',
        'Department*': 'Computer Science',
        'Batch*': 'Batch 1',
        'Email': 'john@example.com',
        'Phone': '+1234567890'
      },
      {
        'Full Name*': 'Jane Smith',
        'Registration Number*': 'CS2024002',
        'Department*': 'Computer Science',
        'Batch*': 'Batch 1',
        'Email': 'jane@example.com',
        'Phone': '+9876543210'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(data)
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Full Name
      { wch: 25 }, // Registration Number
      { wch: 25 }, // Department
      { wch: 20 }, // Batch
      { wch: 30 }, // Email
      { wch: 20 }  // Phone
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    
    // Add instructions sheet
    const instructions = [
      ['STUDENT UPLOAD INSTRUCTIONS'],
      [''],
      ['REQUIRED FIELDS (marked with *):'],
      ['- Full Name: Student\'s full name (e.g., John Doe)'],
      ['- Registration Number: Must be unique (e.g., CS2024001)'],
      ['- Department: Department name (must match exactly with system)'],
      ['- Batch: Batch name (must match exactly with system)'],
      [''],
      ['OPTIONAL FIELDS:'],
      ['- Email: Valid email address'],
      ['- Phone: Contact number'],
      [''],
      ['IMPORTANT NOTES:'],
      ['1. Department and Batch names must match EXACTLY with your system'],
      ['2. Registration numbers must be unique'],
      ['3. Keep the header row as is'],
      ['4. Save as .xlsx before uploading'],
      ['5. The system will automatically assign the correct campus based on department'],
      [''],
      ['EXAMPLE:'],
      ['Full Name: John Doe'],
      ['Registration Number: CS2024001'],
      ['Department: Computer Science'],
      ['Batch: Batch 1'],
      ['Email: john@example.com'],
      ['Phone: +1234567890']
    ]
    
    const ws2 = XLSX.utils.aoa_to_sheet(instructions)
    XLSX.utils.book_append_sheet(wb, ws2, 'Instructions')
    
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="students_upload_template.xlsx"'
      }
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate template' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}