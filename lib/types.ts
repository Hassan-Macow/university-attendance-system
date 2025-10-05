export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'dean' | 'lecturer';
  campus_id: string;
  department_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Campus {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  allowed_radius: number; // in meters
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  campus_id: string;
  created_at: string;
  updated_at: string;
}

export interface Lecturer {
  id: string;
  user_id: string;
  department_id: string;
  employee_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  full_name: string;
  reg_no: string;
  department_id: string;
  batch_id: string;
  campus_id: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  name: string;
  year_level: number;
  department_id: string;
  academic_year: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  department_id: string;
  lecturer_id: string;
  batch_id: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface ClassSession {
  id: string;
  course_id: string;
  campus_id: string;
  lecturer_id: string;
  schedule_time: string;
  duration_minutes: number;
  room?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late';
  timestamp: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_reg_no: string;
  status: 'present' | 'absent' | 'late';
  timestamp: string;
  latitude?: number;
  longitude?: number;
  course_name: string;
  course_code: string;
  lecturer_name: string;
  campus_name: string;
  department_name: string;
}

export interface DashboardStats {
  total_students: number;
  total_lecturers: number;
  total_courses: number;
  total_departments: number;
  total_campuses: number;
  attendance_rate_today: number;
  attendance_rate_week: number;
  attendance_rate_month: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
