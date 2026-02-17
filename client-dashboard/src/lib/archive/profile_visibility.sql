-- Allow Staff to view basic profile info of other staff (for history lookup)
-- Previously, "Users can view own profile" was strict.
-- We need to relax it slightly so staff can see names of others.

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Staff can view basic profile info" ON profiles;

CREATE POLICY "Staff can view basic profile info"
  ON profiles FOR SELECT
  USING (
    true -- Allow reading all profiles (id, role, display_name are public-ish). 
    -- If you have sensitive columns like 'phone_number', you should separate them or use specific column select.
    -- For this app, profiles only has id, role, display_name.
  );
