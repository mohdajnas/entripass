-- =======================================================
-- FIX FOR "new row violates row-level security policy"
-- The issue occurs because the previous RLS policies for 
-- `events` used a helper function `user_can_access_event(id)`
-- which queries the `events` table. During an INSERT, the 
-- new row is not yet visible to that helper function, causing 
-- both the WITH CHECK and RETURNING clauses to fail.
--
-- This script replaces the `events` policies with inline 
-- checks that work correctly for new rows.
-- =======================================================

-- 1. Drop the existing problematic policies on events
DROP POLICY IF EXISTS "Events: Access via owner or team" ON events;
DROP POLICY IF EXISTS "Events: Owners can insert" ON events;
DROP POLICY IF EXISTS "Events: Public can view public events" ON events;
DROP POLICY IF EXISTS "Allow public read events" ON events;
DROP POLICY IF EXISTS "Allow org owner insert event" ON events;
DROP POLICY IF EXISTS "Allow org owner update event" ON events;

-- 2. Create the correct SELECT policy (fixes RETURNING clause)
CREATE POLICY "Events: Select" ON events
  FOR SELECT USING (
    is_public = true 
    OR 
    -- User owns the organization
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = org_id AND o.owner_id = auth.uid()
    )
    OR 
    -- User is a team member
    EXISTS (
      SELECT 1 FROM team_members t
      WHERE t.event_id = id AND t.user_id = auth.uid()
    )
  );

-- 3. Create the correct INSERT policy (fixes the violation error)
CREATE POLICY "Events: Insert" ON events
  FOR INSERT WITH CHECK (
    -- User must own the organization to insert an event into it
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = org_id AND o.owner_id = auth.uid()
    )
  );

-- 4. Create the correct UPDATE policy
CREATE POLICY "Events: Update" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = org_id AND o.owner_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM team_members t
      WHERE t.event_id = id AND t.user_id = auth.uid()
    )
  );

-- 5. Create the correct DELETE policy
CREATE POLICY "Events: Delete" ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = org_id AND o.owner_id = auth.uid()
    )
  );
