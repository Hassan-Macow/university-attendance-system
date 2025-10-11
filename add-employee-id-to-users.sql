-- Add employee_id column to users table
-- This allows all users (students, lecturers, deans, superadmin) to have an employee/student ID

-- Add the employee_id column
ALTER TABLE users 
ADD COLUMN employee_id VARCHAR(50) UNIQUE;

-- Add an index for better performance
CREATE INDEX idx_users_employee_id ON users(employee_id);

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN users.employee_id IS 'Employee ID or Student ID for all users';

-- Example: Update existing users with employee IDs (optional)
-- You can run these manually for existing users if needed
-- UPDATE users SET employee_id = 'EMP001' WHERE email = 'admin@university.edu';
-- UPDATE users SET employee_id = 'STU001' WHERE email = 'student@university.edu';
