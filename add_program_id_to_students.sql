-- Migration: Add program_id column to students table
-- This script adds the program_id column to link students to programs

-- Step 1: Make sure the programs table exists (if not, create it first)
-- You should run create_programs_table.sql first if programs table doesn't exist

-- Step 2: Add program_id column to students table (optional, nullable)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_students_program_id ON students(program_id);

-- Step 4: Add comment to document the column
COMMENT ON COLUMN students.program_id IS 'Optional reference to the program the student is enrolled in';

-- Note: Existing students will have NULL program_id, which is fine since it's optional
-- You can update existing students later if needed

