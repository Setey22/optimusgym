
-- Rename ads table to avoid ad-blocker filters
ALTER TABLE public.ads RENAME TO promo_slots;

-- Drop old policies (they reference old name)
DROP POLICY IF EXISTS "ads_select_public" ON public.promo_slots;
DROP POLICY IF EXISTS "ads_all_admin" ON public.promo_slots;
DROP POLICY IF EXISTS "Public can view active ads" ON public.promo_slots;
DROP POLICY IF EXISTS "Admins manage ads" ON public.promo_slots;
DROP POLICY IF EXISTS "ads_select" ON public.promo_slots;
DROP POLICY IF EXISTS "ads_all" ON public.promo_slots;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_slots TO authenticated;
GRANT SELECT ON public.promo_slots TO anon;
GRANT ALL ON public.promo_slots TO service_role;

CREATE POLICY "promo_select" ON public.promo_slots FOR SELECT
  USING (is_active = true OR public.is_admin_or_super(auth.uid()));

CREATE POLICY "promo_all_admin" ON public.promo_slots FOR ALL
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Storage policies for new promo-images bucket
DROP POLICY IF EXISTS "promo_images_select" ON storage.objects;
DROP POLICY IF EXISTS "promo_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "promo_images_update" ON storage.objects;
DROP POLICY IF EXISTS "promo_images_delete" ON storage.objects;

CREATE POLICY "promo_images_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'promo-images');

CREATE POLICY "promo_images_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'promo-images' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "promo_images_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'promo-images' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "promo_images_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'promo-images' AND public.is_admin_or_super(auth.uid()));
