-- Run this in your Supabase SQL Editor to securely bypass RLS for emails

CREATE OR REPLACE FUNCTION get_email_template_secure(p_event_id UUID, p_trigger_type TEXT, p_secret TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Simple shared secret to prevent public anonymous access
  IF p_secret != 'entripass-internal-secret-8842' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT row_to_json(t) INTO result
  FROM email_templates t
  WHERE event_id = p_event_id AND trigger_type = p_trigger_type;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_smtp_config_secure(p_event_id UUID, p_secret TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  IF p_secret != 'entripass-internal-secret-8842' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT row_to_json(t) INTO result
  FROM email_templates t
  WHERE event_id = p_event_id
  LIMIT 1;

  RETURN result;
END;
$$;
