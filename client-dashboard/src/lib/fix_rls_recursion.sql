-- Fix Infinite Recursion Bug in RLS Policies

-- 1. Create a secure function to check admin status
-- 'security definer' allows this function to bypass RLS restrictions, preventing the loop
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 2. Update Profiles Policy to use the function
drop policy if exists "Admins can view all profiles" on profiles;

create policy "Admins can view all profiles" 
  on profiles for select 
  using (is_admin());

-- 3. Update Tasks Policies to use the function for Admins
drop policy if exists "Admin SELECT all tasks" on tasks;
drop policy if exists "Admin UPDATE all tasks" on tasks;
drop policy if exists "Admin INSERT tasks" on tasks;
drop policy if exists "Admin DELETE tasks" on tasks;

create policy "Admin SELECT all tasks" 
  on tasks for select 
  using (is_admin());

create policy "Admin UPDATE all tasks" 
  on tasks for update 
  using (is_admin());

create policy "Admin INSERT tasks" 
  on tasks for insert 
  with check (is_admin());

create policy "Admin DELETE tasks" 
  on tasks for delete 
  using (is_admin());
