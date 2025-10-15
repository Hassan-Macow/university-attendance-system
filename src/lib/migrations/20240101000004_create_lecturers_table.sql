-- Create lecturers table
CREATE TABLE IF NOT EXISTS lecturers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  specialization TEXT,
  qualification TEXT,
  experience_years INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, department_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_lecturers_user_id ON lecturers(user_id);
CREATE INDEX IF NOT EXISTS idx_lecturers_department_id ON lecturers(department_id);
CREATE INDEX IF NOT EXISTS idx_lecturers_employee_id ON lecturers(employee_id);

-- Enable Row Level Security
ALTER TABLE lecturers ENABLE ROW LEVEL SECURITY;

-- Create policies for lecturers table
-- Superadmins can do everything
CREATE POLICY "Superadmins can do everything on lecturers"
  ON lecturers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Deans can view lecturers in their department
CREATE POLICY "Deans can view lecturers in their department"
  ON lecturers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'dean'
      AND users.department_id = lecturers.department_id
    )
  );

-- Deans can create lecturers in their department
CREATE POLICY "Deans can create lecturers in their department"
  ON lecturers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'dean'
      AND users.department_id = lecturers.department_id
    )
  );

-- Lecturers can view their own record
CREATE POLICY "Lecturers can view their own record"
  ON lecturers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'lecturer'
      AND users.id = lecturers.user_id
    )
  );

-- Students can view all lecturers
CREATE POLICY "Students can view lecturers"
  ON lecturers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'student'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lecturers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lecturers_updated_at
  BEFORE UPDATE ON lecturers
  FOR EACH ROW
  EXECUTE FUNCTION update_lecturers_updated_at();
