const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addUser() {
  try {
    console.log('🚀 Adding user to Supabase...')
    
    // First, let's check if we have any campuses
    const { data: campuses, error: campusError } = await supabase
      .from('campuses')
      .select('*')
      .limit(1)
    
    if (campusError) {
      console.error('❌ Error fetching campuses:', campusError.message)
      return
    }
    
    if (!campuses || campuses.length === 0) {
      console.log('📝 No campuses found. Creating a sample campus...')
      
      const { data: newCampus, error: campusCreateError } = await supabase
        .from('campuses')
        .insert({
          name: 'Main Campus',
          latitude: 12.3456,
          longitude: 78.9012,
          allowed_radius: 100
        })
        .select()
        .single()
      
      if (campusCreateError) {
        console.error('❌ Error creating campus:', campusCreateError.message)
        return
      }
      
      console.log('✅ Campus created:', newCampus.name)
    }
    
    // Get the first campus
    const { data: campusData, error: campusFetchError } = await supabase
      .from('campuses')
      .select('*')
      .limit(1)
      .single()
    
    if (campusFetchError) {
      console.error('❌ Error fetching campus:', campusFetchError.message)
      return
    }
    
    // Check if we have any departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .limit(1)
    
    if (deptError) {
      console.error('❌ Error fetching departments:', deptError.message)
      return
    }
    
    if (!departments || departments.length === 0) {
      console.log('📝 No departments found. Creating a sample department...')
      
      const { data: newDept, error: deptCreateError } = await supabase
        .from('departments')
        .insert({
          name: 'Computer Science',
          campus_id: campusData.id
        })
        .select()
        .single()
      
      if (deptCreateError) {
        console.error('❌ Error creating department:', deptCreateError.message)
        return
      }
      
      console.log('✅ Department created:', newDept.name)
    }
    
    // Get the first department
    const { data: deptData, error: deptFetchError } = await supabase
      .from('departments')
      .select('*')
      .limit(1)
      .single()
    
    if (deptFetchError) {
      console.error('❌ Error fetching department:', deptFetchError.message)
      return
    }
    
    // Now add a user
    const userData = {
      name: 'Super Admin',
      email: 'admin@university.edu',
      password_hash: '$2b$10$rQZ8vQZ8vQZ8vQZ8vQZ8vO', // This is a placeholder - in real app, hash the password
      role: 'superadmin',
      campus_id: campusData.id,
      department_id: deptData.id
    }
    
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()
    
    if (userError) {
      console.error('❌ Error creating user:', userError.message)
      return
    }
    
    console.log('✅ User created successfully!')
    console.log('📧 Email:', newUser.email)
    console.log('👤 Name:', newUser.name)
    console.log('🔑 Role:', newUser.role)
    console.log('🏫 Campus:', campusData.name)
    console.log('🏢 Department:', deptData.name)
    
    console.log('\n🎉 You can now login with:')
    console.log('Email: admin@university.edu')
    console.log('Password: (use the password you set in Supabase Auth)')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

addUser()
