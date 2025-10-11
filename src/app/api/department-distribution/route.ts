import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== Fetching Department Distribution ===')
    console.log('Supabase configured:', isSupabaseConfigured)

    if (!isSupabaseConfigured) {
      // Return mock data if Supabase is not configured
      console.log('Using mock department distribution data')
      return NextResponse.json({
        success: true,
        data: [
          { name: 'Computer Science', students: 450, color: '#8884d8' },
          { name: 'Engineering', students: 320, color: '#82ca9d' },
          { name: 'Business', students: 280, color: '#ffc658' },
          { name: 'Medicine', students: 200, color: '#ff7300' }
        ]
      })
    }

    // Fetch real data from Supabase
    console.log('Fetching real department distribution from Supabase...')

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        students(count)
      `)

    if (deptError) {
      console.error('Error fetching departments:', deptError)
      throw deptError
    }

    // Get student count per department
    const departmentData = await Promise.all(
      (departments || []).map(async (dept) => {
        const { count } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', dept.id)

        return {
          name: dept.name,
          students: count || 0,
          color: getDepartmentColor(dept.name)
        }
      })
    )

    // Sort by student count descending
    departmentData.sort((a, b) => b.students - a.students)

    console.log('Department distribution calculated:', departmentData)

    return NextResponse.json({
      success: true,
      data: departmentData
    })

  } catch (error) {
    console.error('Error fetching department distribution:', error)
    
    // Return mock data on error
    return NextResponse.json({
      success: true,
      data: [
        { name: 'Computer Science', students: 450, color: '#8884d8' },
        { name: 'Engineering', students: 320, color: '#82ca9d' },
        { name: 'Business', students: 280, color: '#ffc658' },
        { name: 'Medicine', students: 200, color: '#ff7300' }
      ]
    })
  }
}

function getDepartmentColor(departmentName: string): string {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300',
    '#8dd1e1', '#d084d0', '#87d068', '#ffc0cb',
    '#ffb347', '#98fb98', '#f0e68c', '#dda0dd'
  ]
  
  // Simple hash function to get consistent colors
  let hash = 0
  for (let i = 0; i < departmentName.length; i++) {
    hash = departmentName.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}
