
-- Enable Row Level Security on registrations table
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT their own registrations
CREATE POLICY "Users can view their own registrations"
  ON registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to INSERT their own registrations
CREATE POLICY "Users can create their own registrations"
  ON registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own registrations (if needed)
CREATE POLICY "Users can update their own registrations"
  ON registrations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to DELETE their own registrations
CREATE POLICY "Users can delete their own registrations"
  ON registrations
  FOR DELETE
  USING (auth.uid() = user_id);
