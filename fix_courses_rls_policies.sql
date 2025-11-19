-- Fix RLS policies for courses table to work with custom authentication
-- The issue: RLS policies check auth.uid() but the app uses custom auth (not Supabase Auth)
-- Solution: Drop restrictive policies and create permissive ones

-- Drop existing restrictive policies that check auth.uid()
DROP POLICY IF EXISTS "Superadmins can do everything on courses" ON courses;
DROP POLICY IF EXISTS "Deans can view courses in their department" ON courses;
DROP POLICY IF EXISTS "Deans can create courses in their department" ON courses;
DROP POLICY IF EXISTS "Deans can update courses in their department" ON courses;
DROP POLICY IF EXISTS "Lecturers can view their courses" ON courses;
DROP POLICY IF EXISTS "Students can view courses" ON courses;

-- Create permissive policies that allow all operations
-- This allows operations using the anon key (which your app uses)
-- Note: Since you're using custom authentication, RLS can't check user roles
-- Your application-level authorization should handle permissions

-- Allow all SELECT operations
CREATE POLICY "Allow all to view courses"
  ON courses
  FOR SELECT
  USING (true);

-- Allow all INSERT operations
CREATE POLICY "Allow all to create courses"
  ON courses
  FOR INSERT
  WITH CHECK (true);

-- Allow all UPDATE operations
CREATE POLICY "Allow all to update courses"
  ON courses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow all DELETE operations
CREATE POLICY "Allow all to delete courses"
  ON courses
  FOR DELETE
  USING (true);

