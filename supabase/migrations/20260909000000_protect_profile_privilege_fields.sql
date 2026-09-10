-- Prevent regular users from changing profile fields that control access or provenance.
-- Admins and the service role retain their existing management capabilities.

CREATE OR REPLACE FUNCTION public.protect_profile_privilege_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- The trigger fires for every update, but only self-service updates are
  -- restricted. Admins/superadmins and server-side service-role operations
  -- keep the existing behavior.
  IF auth.uid() IS NOT NULL
     AND NOT public.is_admin_or_super(auth.uid()) THEN
    NEW.status := OLD.status;
    NEW.level := OLD.level;
    NEW.invited_by := OLD.invited_by;
    NEW.created_at := OLD.created_at;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_privilege_fields() FROM PUBLIC;

DROP TRIGGER IF EXISTS protect_profile_privilege_fields ON public.profiles;

CREATE TRIGGER protect_profile_privilege_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privilege_fields();
