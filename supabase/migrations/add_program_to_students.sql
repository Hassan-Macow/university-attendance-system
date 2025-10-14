-- Add program_id column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_students_program_id ON students(program_id);

-- Update existing students to have no program (optional field)
-- Students can be assigned to programs later
