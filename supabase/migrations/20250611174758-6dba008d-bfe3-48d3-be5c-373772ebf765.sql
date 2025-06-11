
-- Enable Row Level Security on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy to allow organizers to view their own events
CREATE POLICY "Users can view their own events" ON public.events
  FOR SELECT USING (organizer_id = auth.uid());

-- Policy to allow organizers to update their own events
CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE USING (organizer_id = auth.uid());

-- Policy to allow organizers to delete their own events
CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE USING (organizer_id = auth.uid());

-- Policy to allow admins and executives to view all events
CREATE POLICY "Admins and executives can view all events" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'executive')
    )
  );

-- Policy to allow admins and executives to update all events (for approval/rejection)
CREATE POLICY "Admins and executives can update all events" ON public.events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'executive')
    )
  );

-- Policy to allow admins to insert events
CREATE POLICY "Admins can create events" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'executive')
    )
  );
