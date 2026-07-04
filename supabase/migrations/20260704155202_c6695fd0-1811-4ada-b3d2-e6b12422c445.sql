
DROP POLICY IF EXISTS "Public read active ads" ON public.ads;
DROP POLICY IF EXISTS "Admins manage ads" ON public.ads;

CREATE POLICY "Public read active ads" ON public.ads
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins manage ads" ON public.ads
  FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

DROP POLICY IF EXISTS "Admins upload ad-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update ad-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete ad-images" ON storage.objects;

CREATE POLICY "Admins upload ad-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ad-images' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins update ad-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ad-images' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins delete ad-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ad-images' AND public.is_admin_or_super(auth.uid()));
