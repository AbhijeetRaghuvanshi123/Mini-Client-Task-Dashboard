-- 1. Enable Staff to View/Claim Unassigned Tasks
-- Previously, Staff could only see tasks assigned to them. 
-- We need to change this: Staff can see assigned_to = them OR assigned_to is NULL (to claim).

DROP POLICY IF EXISTS "Staff SELECT own tasks" ON tasks;
DROP POLICY IF EXISTS "Staff SELECT own or unassigned" ON tasks;
CREATE POLICY "Staff SELECT own or unassigned"
  ON tasks FOR SELECT
  USING (
    auth.uid() = assigned_to 
    OR 
    assigned_to IS NULL
  );

DROP POLICY IF EXISTS "Staff UPDATE own tasks" ON tasks;
DROP POLICY IF EXISTS "Staff UPDATE own or claim unassigned" ON tasks;
CREATE POLICY "Staff UPDATE own or claim unassigned"
  ON tasks FOR UPDATE
  USING (
    auth.uid() = assigned_to 
    OR 
    assigned_to IS NULL
  )
  WITH CHECK (
    -- Can update if currently assigned to them OR claiming (setting assigned_to to themselves)
    (assigned_to = auth.uid()) 
    OR 
    (assigned_to IS NULL) -- Logic: Only allow if unassigned (claiming)
  );

-- 2. Create Task History Table
CREATE TABLE IF NOT EXISTS task_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id), -- or profiles(id)
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  changed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on History
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- Staff can view history of tasks they can see
DROP POLICY IF EXISTS "Staff view history of accessible tasks" ON task_history;
CREATE POLICY "Staff view history of accessible tasks"
  ON task_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_history.task_id 
      AND (
        tasks.assigned_to = auth.uid() 
        OR tasks.assigned_to IS NULL
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- 3. Trigger for Auto-History
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
DECLARE
  changer_id uuid;
BEGIN
  changer_id := auth.uid();
  
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value)
    VALUES (NEW.id, changer_id, 'status', OLD.status, NEW.status);
  END IF;

  IF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value)
    VALUES (NEW.id, changer_id, 'assigned_to', OLD.assigned_to::text, NEW.assigned_to::text);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_change ON tasks;
CREATE TRIGGER on_task_change
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE PROCEDURE log_task_changes();
