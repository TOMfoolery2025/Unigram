-- Make event registrations readable by all authenticated users (for attendance lists & public calendars)

CREATE POLICY "Authenticated users can view all event registrations"
  ON public.event_registrations
  FOR SELECT
  TO authenticated
  USING (true);


