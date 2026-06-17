-- =======================================================
-- ROW LEVEL SECURITY (RLS) LOCKDOWN SCRIPT
-- Run this in your Supabase SQL Editor
-- =======================================================

-- 1. Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 2. Organizations: Only the owner can view/edit
CREATE POLICY "Orgs: Owner access" ON organizations
  FOR ALL USING (auth.uid() = owner_id);

-- Helper Function: Check if user has access to an event
-- An event is accessible if the user owns the organization it belongs to
-- OR if the user is explicitly a team_member for that event.
CREATE OR REPLACE FUNCTION user_can_access_event(target_event_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN;
  is_team BOOLEAN;
BEGIN
  -- Check if user owns the organization of this event
  SELECT EXISTS (
    SELECT 1 FROM events e
    JOIN organizations o ON e.org_id = o.id
    WHERE e.id = target_event_id AND o.owner_id = auth.uid()
  ) INTO is_owner;

  IF is_owner THEN RETURN TRUE; END IF;

  -- Check if user is in team_members
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE event_id = target_event_id AND user_id = auth.uid()
  ) INTO is_team;

  RETURN is_team;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Events: Owners and Team Members can view/edit
CREATE POLICY "Events: Access via owner or team" ON events
  FOR ALL USING (user_can_access_event(id));

-- Allow inserting into events if the user owns the organization
CREATE POLICY "Events: Owners can insert" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = org_id AND o.owner_id = auth.uid()
    )
  );

-- Allow public users to view events that are marked as public
CREATE POLICY "Events: Public can view public events" ON events
  FOR SELECT USING (is_public = true);

-- Allow public users to view child records of public events
CREATE POLICY "TicketTypes: Public can view tickets of public events" ON ticket_types
  FOR SELECT USING (EXISTS (SELECT 1 FROM events e WHERE e.id = ticket_types.event_id AND e.is_public = true));

CREATE POLICY "FormFields: Public can view form fields of public events" ON form_fields
  FOR SELECT USING (EXISTS (SELECT 1 FROM events e WHERE e.id = form_fields.event_id AND e.is_public = true));

CREATE POLICY "Speakers: Public can view speakers of public events" ON speakers
  FOR SELECT USING (EXISTS (SELECT 1 FROM events e WHERE e.id = speakers.event_id AND e.is_public = true));

CREATE POLICY "Sponsors: Public can view sponsors of public events" ON sponsors
  FOR SELECT USING (EXISTS (SELECT 1 FROM events e WHERE e.id = sponsors.event_id AND e.is_public = true));

-- 4. Apply standard Event-based policies to all child tables
-- Since all these tables have an `event_id`, we just check if the user can access that event.

CREATE POLICY "ChildEvents: Access via event" ON child_events FOR ALL USING (user_can_access_event(parent_event_id));
CREATE POLICY "TicketTypes: Access via event" ON ticket_types FOR ALL USING (user_can_access_event(event_id));
CREATE POLICY "FormFields: Access via event" ON form_fields FOR ALL USING (user_can_access_event(event_id));
CREATE POLICY "Coupons: Access via event" ON coupons FOR ALL USING (user_can_access_event(event_id));
CREATE POLICY "Guests: Access via event" ON guests FOR ALL USING (user_can_access_event(event_id));
CREATE POLICY "Venues: Access via event" ON venues FOR ALL USING (user_can_access_event(event_id));
CREATE POLICY "InventoryItems: Access via event" ON inventory_items FOR ALL USING (user_can_access_event(event_id));
CREATE POLICY "Speakers: Access via event" ON speakers FOR ALL USING (user_can_access_event(event_id));
CREATE POLICY "Sponsors: Access via event" ON sponsors FOR ALL USING (user_can_access_event(event_id));
CREATE POLICY "EmailTemplates: Access via event" ON email_templates FOR ALL USING (user_can_access_event(event_id));
CREATE POLICY "MessageLogs: Access via event" ON message_logs FOR ALL USING (user_can_access_event(event_id));
CREATE POLICY "PageViews: Access via event" ON page_views FOR ALL USING (user_can_access_event(event_id));
CREATE POLICY "CustomInsights: Access via event" ON custom_insights FOR ALL USING (user_can_access_event(event_id));

-- For venue_checkins, we need to join back to venues to get the event_id
CREATE POLICY "VenueCheckins: Access via venue event" ON venue_checkins FOR ALL USING (
  EXISTS (
    SELECT 1 FROM venues v 
    WHERE v.id = venue_checkins.venue_id 
    AND user_can_access_event(v.event_id)
  )
);

-- For inventory_claims, join back to inventory_items
CREATE POLICY "InventoryClaims: Access via item event" ON inventory_claims FOR ALL USING (
  EXISTS (
    SELECT 1 FROM inventory_items i
    WHERE i.id = inventory_claims.item_id
    AND user_can_access_event(i.event_id)
  )
);

-- Note: We need a bypass for public API insertions (like a guest registering, or a page view occurring)
-- Public users (anon) should be able to insert page_views and guests but NOT read or update them.
CREATE POLICY "PageViews: Public insert" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Guests: Public insert" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "VenueCheckins: Public insert" ON venue_checkins FOR INSERT WITH CHECK (true);
CREATE POLICY "InventoryClaims: Public insert" ON inventory_claims FOR INSERT WITH CHECK (true);
