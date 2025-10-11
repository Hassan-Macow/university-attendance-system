-- Multi-Campus Lecturer Support
-- Run this SQL in your Supabase SQL Editor

-- 1. Create lecturer_campuses junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.lecturer_campuses (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  lecturer_id uuid NOT NULL,
  campus_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT false, -- One campus can be marked as primary
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT lecturer_campuses_pkey PRIMARY KEY (id),
  CONSTRAINT lecturer_campuses_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT lecturer_campuses_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE CASCADE,
  CONSTRAINT lecturer_campuses_unique UNIQUE (lecturer_id, campus_id)
) TABLESPACE pg_default;

-- 2. Create trigger for updated_at
CREATE TRIGGER update_lecturer_campuses_updated_at 
BEFORE UPDATE ON public.lecturer_campuses 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 3. Enable RLS
ALTER TABLE public.lecturer_campuses ENABLE ROW LEVEL SECURITY;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lecturer_campuses_lecturer_id ON public.lecturer_campuses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_lecturer_campuses_campus_id ON public.lecturer_campuses(campus_id);
CREATE INDEX IF NOT EXISTS idx_lecturer_campuses_is_primary ON public.lecturer_campuses(is_primary);

-- 5. Migrate existing data (if any lecturers exist)
-- This will create lecturer_campus relationships for existing lecturers
INSERT INTO public.lecturer_campuses (lecturer_id, campus_id, is_primary)
SELECT 
  u.id as lecturer_id,
  u.campus_id,
  true as is_primary
FROM public.users u
WHERE u.role = 'lecturer' 
  AND u.campus_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.lecturer_campuses lc 
    WHERE lc.lecturer_id = u.id
  );

-- 6. Create a view for easy querying of lecturers with their campuses
CREATE OR REPLACE VIEW public.lecturers_with_campuses AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.department_id,
  u.created_at,
  u.updated_at,
  d.name as department_name,
  c.name as primary_campus_name,
  c.id as primary_campus_id,
  array_agg(
    json_build_object(
      'id', lc.campus_id,
      'name', camp.name,
      'is_primary', lc.is_primary
    ) ORDER BY lc.is_primary DESC, camp.name
  ) as campuses
FROM public.users u
LEFT JOIN public.lecturer_campuses lc ON u.id = lc.lecturer_id
LEFT JOIN public.campuses camp ON lc.campus_id = camp.id
LEFT JOIN public.departments d ON u.department_id = d.id
LEFT JOIN public.campuses c ON u.campus_id = c.id
WHERE u.role = 'lecturer'
GROUP BY u.id, u.name, u.email, u.role, u.department_id, u.created_at, u.updated_at, d.name, c.name, c.id;

-- 7. Create a function to add a campus to a lecturer
CREATE OR REPLACE FUNCTION add_lecturer_campus(
  p_lecturer_id uuid,
  p_campus_id uuid,
  p_is_primary boolean DEFAULT false
)
RETURNS void AS $$
BEGIN
  -- If setting as primary, unset other primary campuses for this lecturer
  IF p_is_primary THEN
    UPDATE public.lecturer_campuses 
    SET is_primary = false 
    WHERE lecturer_id = p_lecturer_id;
  END IF;
  
  -- Insert the new campus relationship
  INSERT INTO public.lecturer_campuses (lecturer_id, campus_id, is_primary)
  VALUES (p_lecturer_id, p_campus_id, p_is_primary)
  ON CONFLICT (lecturer_id, campus_id) DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 8. Create a function to remove a campus from a lecturer
CREATE OR REPLACE FUNCTION remove_lecturer_campus(
  p_lecturer_id uuid,
  p_campus_id uuid
)
RETURNS void AS $$
BEGIN
  DELETE FROM public.lecturer_campuses 
  WHERE lecturer_id = p_lecturer_id AND campus_id = p_campus_id;
END;
$$ LANGUAGE plpgsql;
