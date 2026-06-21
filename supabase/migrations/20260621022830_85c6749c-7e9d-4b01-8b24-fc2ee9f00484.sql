
CREATE POLICY "Public read media buckets" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('routine-covers', 'exercise-covers', 'exercise-videos'));

CREATE POLICY "Admins insert media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('routine-covers', 'exercise-covers', 'exercise-videos')
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins update media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('routine-covers', 'exercise-covers', 'exercise-videos')
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins delete media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('routine-covers', 'exercise-covers', 'exercise-videos')
    AND public.has_role(auth.uid(), 'admin')
  );
