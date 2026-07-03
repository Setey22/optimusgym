
CREATE POLICY "Public read ad-images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'ad-images');

CREATE POLICY "Admins upload ad-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update ad-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete ad-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));
