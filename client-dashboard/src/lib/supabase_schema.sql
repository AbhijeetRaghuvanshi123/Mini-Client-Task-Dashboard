-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Create profiles table
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Profiles Policies
-- 1. Users can view their own profile
create policy "Users can view own profile" 
  on profiles for select 
  using (auth.uid() = id);

-- 2. Admins can view all profiles
create policy "Admins can view all profiles" 
  on profiles for select 
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create tasks table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  assigned_to uuid references profiles(id) on delete set null,
  due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on tasks
alter table tasks enable row level security;

-- Tasks Policies

-- A. Staff Policies
-- 1. Staff can view tasks assigned to them
create policy "Staff can view assigned tasks"
  on tasks for select
  using (
    auth.uid() = assigned_to 
    or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 2. Staff can update status of tasks assigned to them
create policy "Staff can update assigned tasks"
  on tasks for update
  using (auth.uid() = assigned_to)
  with check (auth.uid() = assigned_to);
  -- Note: Staff cannot reassign tasks, only update status/details if assigned to them.
  -- Depending on strictness, we might want to limit WHICH columns they can update, 
  -- but RLS usually covers rows. For column level security we'd need more triggers or rigid functions.
  -- For this specific prompt: "Can UPDATE only tasks where assigned_to = auth.uid()"

-- B. Admin Policies (Admins can do everything)
-- We handled Admin SELECT in the policy above (OR exists ... admin)
-- But typically clean separation is better or a catch-all admin policy.

-- Let's stick to the prompt's request for clear policies.

-- Re-doing policies to be cleaner and distinct as per prompt logic often preferred.

drop policy if exists "Staff can view assigned tasks" on tasks;
drop policy if exists "Staff can update assigned tasks" on tasks;

-- Policy 1: Staff SELECT (Own tasks)
create policy "Staff SELECT own tasks"
  on tasks for select
  using (auth.uid() = assigned_to);

-- Policy 2: Staff UPDATE (Own tasks)
create policy "Staff UPDATE own tasks"
  on tasks for update
  using (auth.uid() = assigned_to);

-- Policy 3: Admin SELECT (All tasks)
create policy "Admin SELECT all tasks"
  on tasks for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Policy 4: Admin UPDATE (All tasks)
create policy "Admin UPDATE all tasks"
  on tasks for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Policy 5: Admin INSERT (All tasks)
create policy "Admin INSERT tasks"
  on tasks for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Policy 6: Admin DELETE (All tasks)
create policy "Admin DELETE tasks"
  on tasks for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- Trigger to hande new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'staff');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

