-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  year_level INTEGER NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, department_id, academic_year)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_batches_department_id ON batches(department_id);
CREATE INDEX IF NOT EXISTS idx_batches_academic_year ON batches(academic_year);
CREATE INDEX IF NOT EXISTS idx_batches_year_level ON batches(year_level);

-- Enable Row Level Security
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- Create policies for batches table
-- Superadmins can do everything
CREATE POLICY "Superadmins can do everything on batches"
  ON batches
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Deans can view batches in their department
CREATE POLICY "Deans can view batches in their department"
  ON batches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'dean'
      AND users.department_id = batches.department_id
    )
  );

-- Deans can create batches in their department
CREATE POLICY "Deans can create batches in their department"
  ON batches
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'dean'
      AND users.department_id = batches.department_id
    )
  );

-- Lecturers can view batches in their department
CREATE POLICY "Lecturers can view batches in their department"
  ON batches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'lecturer'
      AND EXISTS (
        SELECT 1 FROM lecturers
        WHERE lecturers.user_id = users.id
        AND lecturers.department_id = batches.department_id
      )
    )
  );

-- Students can view batches in their department
CREATE POLICY "Students can view batches in their department"
  ON batches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'student'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.user_id = users.id
        AND students.department_id = batches.department_id
      )
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batches_updated_at
  BEFORE UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION update_batches_updated_at();
