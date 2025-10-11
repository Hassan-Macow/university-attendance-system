-- Students Table Setup Script
-- This script creates the students table with the exact schema provided

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  reg_no VARCHAR(50) UNIQUE NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students(reg_no);
CREATE INDEX IF NOT EXISTS idx_students_department_id ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_campus_id ON students(campus_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_students_updated_at 
  BEFORE UPDATE ON students 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO students (full_name, reg_no, department_id, batch_id, campus_id, email, phone) 
-- VALUES 
--   ('John Doe', '2024-CS-001', (SELECT id FROM departments WHERE name = 'Computer Science' LIMIT 1), (SELECT id FROM batches WHERE name = '2024-2025' LIMIT 1), (SELECT id FROM campuses LIMIT 1), 'john.doe@university.edu', '+1234567890'),
--   ('Jane Smith', '2024-CS-002', (SELECT id FROM departments WHERE name = 'Computer Science' LIMIT 1), (SELECT id FROM batches WHERE name = '2024-2025' LIMIT 1), (SELECT id FROM campuses LIMIT 1), 'jane.smith@university.edu', '+1234567891');
