
-- Update profiles table to support the executive role
-- Add columns to events table for approval workflow if they don't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS declined_reason TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Create a function to automatically assign executive role to the specific email
CREATE OR REPLACE FUNCTION assign_executive_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is the executive
  IF NEW.email = 'sj3035@srmist.edu.in' THEN
    NEW.role = 'executive';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically assign executive role
DROP TRIGGER IF EXISTS set_executive_role ON profiles;
CREATE TRIGGER set_executive_role
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_executive_role();

-- Update existing profile if it exists
UPDATE profiles 
SET role = 'executive' 
WHERE email = 'sj3035@srmist.edu.in';

-- Create function to send notification when event is declined
CREATE OR REPLACE FUNCTION notify_event_declined()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send notification if status changed to rejected and there's a reason
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' AND NEW.declined_reason IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      event_id,
      type,
      title,
      message
    ) VALUES (
      NEW.organizer_id,
      NEW.id,
      'event_declined',
      'Event Declined',
      'Your event "' || NEW.title || '" has been declined. Reason: ' || NEW.declined_reason
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event decline notifications
DROP TRIGGER IF EXISTS event_decline_notification ON events;
CREATE TRIGGER event_decline_notification
  AFTER UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_declined();
