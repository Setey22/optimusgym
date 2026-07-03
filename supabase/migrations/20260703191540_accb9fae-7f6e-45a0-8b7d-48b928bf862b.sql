
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  link_url text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('hombres','damas','both')),
  is_active boolean NOT NULL DEFAULT true,
  position smallint NOT NULL DEFAULT 1 CHECK (position BETWEEN 1 AND 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ads TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active ads" ON public.ads
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage ads" ON public.ads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ads_set_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
