-- Consolidated Supabase Schema
-- Merges: supabase_schema.sql, fix_rls_recursion.sql, ownership_updates.sql, profile_updates.sql, profile_visibility.sql

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. TABLES

-- Profiles Table
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure display_name exists if table was created before
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'display_name') then
    alter table profiles add column display_name text;
  end if;
end $$;

-- Tasks Table
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  assigned_to uuid references profiles(id) on delete set null,
  due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Task History Table
create table if not exists task_history (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  changed_by uuid references auth.users(id),
  field_changed text not null,
  old_value text,
  new_value text,
  changed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. FUNCTIONS

-- Check Admin Role (Security Definer to prevent RLS recursion)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Handle New User Creation (Trigger Function)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id, 
    'staff',
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Log Task Changes (Trigger Function)
create or replace function log_task_changes()
returns trigger as $$
declare
  changer_id uuid;
begin
  changer_id := auth.uid();
  
  if (old.status is distinct from new.status) then
    insert into task_history (task_id, changed_by, field_changed, old_value, new_value)
    values (new.id, changer_id, 'status', old.status, new.status);
  end if;

  if (old.assigned_to is distinct from new.assigned_to) then
    insert into task_history (task_id, changed_by, field_changed, old_value, new_value)
    values (new.id, changer_id, 'assigned_to', old.assigned_to::text, new.assigned_to::text);
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 4. ROW LEVEL SECURITY (RLS) & POLICIES

-- PROFILES
alter table profiles enable row level security;

-- Drop existing policies to ensure clean state if re-running
drop policy if exists "Public view basic profile info" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Admins can update all profiles" on profiles;

-- Policy: Everyone can view basic profile info (needed for UI to show names)
create policy "Public view basic profile info"
  on profiles for select
  using (true);

-- Policy: Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Policy: Admins can update all profiles
create policy "Admins can update all profiles"
  on profiles for update
  using (is_admin());

-- TASKS
alter table tasks enable row level security;

drop policy if exists "Select tasks" on tasks;
drop policy if exists "Update tasks" on tasks;
drop policy if exists "Admin insert" on tasks;
drop policy if exists "Admin delete" on tasks;

-- Policy: Select (View)
-- Staff: Own + Unassigned
-- Admin: All
create policy "Select tasks"
  on tasks for select
  using (
    auth.uid() = assigned_to 
    or 
    assigned_to is null
    or
    is_admin()
  );

-- Policy: Update
-- Staff: Own + Unassigned (claim)
-- Admin: All
create policy "Update tasks"
  on tasks for update
  using (
    auth.uid() = assigned_to 
    or 
    assigned_to is null
    or
    is_admin()
  )
  with check (
    (assigned_to = auth.uid()) 
    or 
    (assigned_to is null)
    or
    is_admin()
  );

-- Policy: Insert (Admin Only)
create policy "Admin insert"
  on tasks for insert
  with check (is_admin());

-- Policy: Delete (Admin Only)
create policy "Admin delete"
  on tasks for delete
  using (is_admin());

-- TASK HISTORY
alter table task_history enable row level security;

drop policy if exists "View history" on task_history;

-- Policy: View History
-- Staff: If they can see the task
-- Admin: All (covered by logic)
create policy "View history"
  on task_history for select
  using (
    exists (
      select 1 from tasks 
      where tasks.id = task_history.task_id 
      and (
        tasks.assigned_to = auth.uid() 
        or tasks.assigned_to is null
        or is_admin()
      )
    )
  );

-- 5. TRIGGERS

-- Trigger: New User -> Create Profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: Task Change -> Log History
drop trigger if exists on_task_change on tasks;
create trigger on_task_change
  after update on tasks
  for each row
  execute procedure log_task_changes();
