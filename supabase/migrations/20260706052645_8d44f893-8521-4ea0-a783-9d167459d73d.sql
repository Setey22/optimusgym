
CREATE TABLE public.completed_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id uuid REFERENCES public.routines(id) ON DELETE SET NULL,
  routine_name text,
  gender public.routine_gender NOT NULL,
  level integer NOT NULL,
  day integer NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  completed_date date NOT NULL GENERATED ALWAYS AS ((completed_at AT TIME ZONE 'UTC')::date) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX completed_days_unique_per_day
  ON public.completed_days (user_id, gender, level, day, completed_date);

CREATE INDEX completed_days_user_completed_at_idx
  ON public.completed_days (user_id, completed_at DESC);

GRANT SELECT, INSERT, DELETE ON public.completed_days TO authenticated;
GRANT ALL ON public.completed_days TO service_role;

ALTER TABLE public.completed_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completed days"
  ON public.completed_days FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_or_super(auth.uid()));

CREATE POLICY "Users can insert their own completed days"
  ON public.completed_days FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed days"
  ON public.completed_days FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
