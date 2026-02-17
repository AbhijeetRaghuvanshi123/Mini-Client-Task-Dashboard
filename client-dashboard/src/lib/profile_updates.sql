-- 1. Add display_name column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name text;

-- 2. Update New User Trigger to set default display_name from email
-- We need to replace the function to access new.email (from auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    new.id, 
    'staff', -- default role
    split_part(new.email, '@', 1) -- default display_name from email prefix
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Allow users to update their own profile (display_name)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Ensure Admin can update any profile (if needed, or just rely on them being admins)
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
