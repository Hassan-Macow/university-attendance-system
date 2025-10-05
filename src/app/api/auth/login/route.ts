import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Query user from database
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        campuses!inner(*),
        departments(*)
      `)
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // In a real app, you'd verify the password hash here
    // For now, we'll skip password verification for development

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({
      data: userWithoutPassword,
      message: 'Login successful'
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
