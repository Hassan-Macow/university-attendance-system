-- Create course_enrollments table to track which students are enrolled in which courses
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a student can only be enrolled once per course
  UNIQUE(course_id, student_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read enrollments
CREATE POLICY "Allow authenticated users to read enrollments"
  ON course_enrollments
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins and lecturers to insert enrollments
CREATE POLICY "Allow admins and lecturers to insert enrollments"
  ON course_enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow admins to update and delete enrollments
CREATE POLICY "Allow admins to update enrollments"
  ON course_enrollments
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to delete enrollments"
  ON course_enrollments
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to automatically enroll all students in a batch when a course is created
CREATE OR REPLACE FUNCTION auto_enroll_batch_students()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new course is created, enroll all students from that batch
  INSERT INTO course_enrollments (course_id, student_id)
  SELECT NEW.id, s.id
  FROM students s
  WHERE s.batch_id = NEW.batch_id
  ON CONFLICT (course_id, student_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-enroll students when a course is created
DROP TRIGGER IF EXISTS trigger_auto_enroll_students ON courses;
CREATE TRIGGER trigger_auto_enroll_students
  AFTER INSERT ON courses
  FOR EACH ROW
  EXECUTE FUNCTION auto_enroll_batch_students();

-- Migrate existing data: Enroll all students in courses based on their batch
INSERT INTO course_enrollments (course_id, student_id)
SELECT c.id as course_id, s.id as student_id
FROM courses c
INNER JOIN students s ON s.batch_id = c.batch_id
ON CONFLICT (course_id, student_id) DO NOTHING;

COMMENT ON TABLE course_enrollments IS 'Tracks which students are enrolled in which courses';
COMMENT ON COLUMN course_enrollments.course_id IS 'Reference to the course';
COMMENT ON COLUMN course_enrollments.student_id IS 'Reference to the student';
COMMENT ON COLUMN course_enrollments.enrolled_at IS 'When the student was enrolled in the course';
