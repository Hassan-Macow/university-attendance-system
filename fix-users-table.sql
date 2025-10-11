-- Fix users table to handle password_hash properly
-- Run this SQL in your Supabase SQL Editor

-- Option 1: Make password_hash nullable (if you're using Supabase Auth separately)
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

-- Option 2: Or add a default value for password_hash
-- ALTER TABLE public.users ALTER COLUMN password_hash SET DEFAULT 'temp_password';

-- Option 3: Or if you want to keep it required, update existing records first
-- UPDATE public.users SET password_hash = 'temp_password' WHERE password_hash IS NULL;
-- ALTER TABLE public.users ALTER COLUMN password_hash SET NOT NULL;
