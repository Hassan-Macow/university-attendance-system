// Demo data for testing the attendance system
export const demoUsers = [
  {
    name: 'Super Admin',
    email: 'admin@university.edu',
    password: 'admin123',
    role: 'superadmin',
    campus_id: 'campus-1',
    department_id: null
  },
  {
    name: 'Dr. John Smith',
    email: 'dean@cs.edu',
    password: 'dean123',
    role: 'dean',
    campus_id: 'campus-1',
    department_id: 'dept-1'
  },
  {
    name: 'Dr. Jane Doe',
    email: 'lecturer@cs.edu',
    password: 'lecturer123',
    role: 'lecturer',
    campus_id: 'campus-1',
    department_id: 'dept-1'
  }
]

export const demoCampuses = [
  {
    name: 'Main Campus',
    latitude: 40.7128,
    longitude: -74.0060,
    allowed_radius: 100
  },
  {
    name: 'North Campus',
    latitude: 40.7589,
    longitude: -73.9851,
    allowed_radius: 150
  }
]

export const demoDepartments = [
  {
    name: 'Computer Science',
    campus_id: 'campus-1'
  },
  {
    name: 'Electrical Engineering',
    campus_id: 'campus-1'
  },
  {
    name: 'Mechanical Engineering',
    campus_id: 'campus-2'
  }
]

export const demoBatches = [
  {
    name: '2024 Batch',
    year_level: 1,
    department_id: 'dept-1',
    academic_year: '2024-2025'
  },
  {
    name: '2023 Batch',
    year_level: 2,
    department_id: 'dept-1',
    academic_year: '2023-2024'
  }
]

export const demoStudents = [
  {
    full_name: 'John Doe',
    reg_no: 'CS2024001',
    department_id: 'dept-1',
    batch_id: 'batch-1',
    campus_id: 'campus-1',
    email: 'john.doe@university.edu',
    phone: '+1234567890'
  },
  {
    full_name: 'Jane Smith',
    reg_no: 'CS2024002',
    department_id: 'dept-1',
    batch_id: 'batch-1',
    campus_id: 'campus-1',
    email: 'jane.smith@university.edu',
    phone: '+1234567891'
  },
  {
    full_name: 'Bob Johnson',
    reg_no: 'CS2024003',
    department_id: 'dept-1',
    batch_id: 'batch-1',
    campus_id: 'campus-1',
    email: 'bob.johnson@university.edu',
    phone: '+1234567892'
  }
]

export const demoCourses = [
  {
    name: 'Data Structures and Algorithms',
    code: 'CS201',
    department_id: 'dept-1',
    lecturer_id: 'lecturer-1',
    batch_id: 'batch-1',
    credits: 3
  },
  {
    name: 'Database Management Systems',
    code: 'CS202',
    department_id: 'dept-1',
    lecturer_id: 'lecturer-1',
    batch_id: 'batch-1',
    credits: 4
  }
]
