-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(code, department_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_programs_department_id ON programs(department_id);

-- Enable Row Level Security
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Create policies for programs table
-- Superadmins can do everything
CREATE POLICY "Superadmins can do everything on programs"
  ON programs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Deans can view programs in their department
CREATE POLICY "Deans can view programs in their department"
  ON programs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'dean'
      AND users.department_id = programs.department_id
    )
  );

-- Deans can create programs in their department
CREATE POLICY "Deans can create programs in their department"
  ON programs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'dean'
      AND users.department_id = programs.department_id
    )
  );

-- Deans can update programs in their department
CREATE POLICY "Deans can update programs in their department"
  ON programs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'dean'
      AND users.department_id = programs.department_id
    )
  );

-- Lecturers and students can view all programs
CREATE POLICY "Lecturers and students can view programs"
  ON programs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('lecturer', 'student')
    )
  );

-- Add program_id column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_courses_program_id ON courses(program_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_programs_updated_at();
