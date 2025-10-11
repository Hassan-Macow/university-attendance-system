-- University Attendance Management System Database Setup
-- Run this SQL in your Supabase SQL Editor

-- 1. Create the campuses table
CREATE TABLE IF NOT EXISTS public.campuses (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name character varying(255) NOT NULL,
  latitude numeric(10, 8) NOT NULL,
  longitude numeric(11, 8) NOT NULL,
  allowed_radius integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT campuses_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 2. Create the departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name character varying(255) NOT NULL,
  campus_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id),
  CONSTRAINT departments_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 3. Create the users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name character varying(255) NOT NULL,
  email character varying(255) NOT NULL UNIQUE,
  password_hash character varying(255),
  role character varying(50) NOT NULL DEFAULT 'student',
  campus_id uuid,
  department_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE SET NULL,
  CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- 4. Create the update trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create triggers for updated_at columns
CREATE TRIGGER update_campuses_updated_at 
BEFORE UPDATE ON public.campuses 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at 
BEFORE UPDATE ON public.departments 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON public.users 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 6. Insert sample data (optional)
INSERT INTO public.campuses (name, latitude, longitude, allowed_radius) 
VALUES 
  ('Main Campus', 2.0469, 45.3182, 100),
  ('Business Campus', 2.0569, 45.3282, 150),
  ('Engineering Campus', 2.0369, 45.3082, 120)
ON CONFLICT DO NOTHING;

-- 7. Enable Row Level Security (RLS) for better security
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for RLS (basic policies - adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON public.campuses
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.departments
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.users
FOR ALL USING (auth.role() = 'authenticated');

-- 9. Grant necessary permissions
GRANT ALL ON public.campuses TO authenticated;
GRANT ALL ON public.departments TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campuses_is_active ON public.campuses(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_campus_id ON public.departments(campus_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON public.departments(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_campus_id ON public.users(campus_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);
