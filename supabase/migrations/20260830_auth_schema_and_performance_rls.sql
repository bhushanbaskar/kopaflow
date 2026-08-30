-- Migration: 20260830_auth_schema_and_performance_rls.sql
-- Description: Fixes GoTrue Auth token NULL scan errors, synchronizes auth.identities,
-- creates missing foreign key indexes, isolates security definer helper functions in private schema,
-- and ensures proper PostgREST table permissions.

-- ==========================================
-- 1. AUTH TOKEN SANITIZATION & IDENTITIES
-- ==========================================

-- Trigger to guarantee tokens in auth.users are never NULL (preventing Go gotrue sql scan crash)
-- and auto-confirm email for frictionless demo registration
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.handle_new_auth_user_tokens()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Guarantee empty string tokens to avoid NULL scan errors in Go gotrue
  NEW.confirmation_token := COALESCE(NEW.confirmation_token, '');
  NEW.recovery_token := COALESCE(NEW.recovery_token, '');
  NEW.email_change_token_new := COALESCE(NEW.email_change_token_new, '');
  NEW.email_change := COALESCE(NEW.email_change, '');
  NEW.phone_change := COALESCE(NEW.phone_change, '');
  NEW.phone_change_token := COALESCE(NEW.phone_change_token, '');
  NEW.email_change_token_current := COALESCE(NEW.email_change_token_current, '');
  NEW.reauthentication_token := COALESCE(NEW.reauthentication_token, '');

  -- Auto-confirm email immediately for demo mode
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  NEW.confirmed_at := COALESCE(NEW.confirmed_at, NOW());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_auth_user_tokens ON auth.users;
CREATE TRIGGER ensure_auth_user_tokens
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.handle_new_auth_user_tokens();

-- Trigger to automatically sync auth.identities and public.profiles upon registration
CREATE OR REPLACE FUNCTION private.handle_auth_user_created_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 1. Ensure identity exists for email provider
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    jsonb_build_object(
      'sub', NEW.id::text,
      'email', NEW.email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NEW.id::text,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (provider_id, provider) DO NOTHING;

  -- 2. Ensure public profile exists for new citizen
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    user_type,
    authority_id,
    role_id,
    locality,
    taluka,
    preferred_language,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'citizen'),
    NULL,
    'ROLE_CITIZEN',
    COALESCE(NEW.raw_user_meta_data->>'locality', 'Kopargaon'),
    'Kopargaon',
    'en',
    'ACTIVE',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_sync ON auth.users;
CREATE TRIGGER on_auth_user_created_sync
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.handle_auth_user_created_sync();

-- Sanitize existing auth.users rows
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '');

-- Ensure identities exist for all auth users
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  u.id::text,
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);

-- ==========================================
-- 2. PERFORMANCE INDEXES (FOREIGN KEYS)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_cargo_shipments_assigned_trip_id ON public.cargo_shipments(assigned_trip_id);
CREATE INDEX IF NOT EXISTS idx_cargo_shipments_origin_village_id ON public.cargo_shipments(origin_village_id);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_resolved_by_authority_id ON public.feedback_reports(resolved_by_authority_id);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_resolved_by_user_id ON public.feedback_reports(resolved_by_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_updates_author_authority_id ON public.feedback_updates(author_authority_id);
CREATE INDEX IF NOT EXISTS idx_feedback_updates_author_user_id ON public.feedback_updates(author_user_id);
CREATE INDEX IF NOT EXISTS idx_resilience_operations_actor_user_id ON public.resilience_operations(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_resilience_recovery_incidents_last_verified_snapshot_id ON public.resilience_recovery_incidents(last_verified_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_village_demand_aggregations_authority_id ON public.village_demand_aggregations(authority_id);

-- ==========================================
-- 3. SECURITY & RLS HELPER FUNCTIONS
-- ==========================================

CREATE OR REPLACE FUNCTION private.get_current_authority_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT authority_id FROM public.profiles 
  WHERE id = (SELECT auth.uid()) AND status = 'ACTIVE'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.get_current_role_id()
RETURNS VARCHAR(64)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role_id FROM public.profiles 
  WHERE id = (SELECT auth.uid()) AND status = 'ACTIVE'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (SELECT auth.uid()) 
      AND status = 'ACTIVE' 
      AND (role_id = 'ROLE_SUPER_ADMIN' OR authority_id = 'AUTH-ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION private.has_permission(p_permission VARCHAR(64))
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.role_permissions rp ON p.role_id = rp.role_id
    WHERE p.id = (SELECT auth.uid())
      AND p.status = 'ACTIVE'
      AND rp.permission_id = p_permission
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (SELECT auth.uid()) 
      AND status = 'ACTIVE' 
      AND (role_id = 'ROLE_SUPER_ADMIN' OR authority_id = 'AUTH-ADMIN')
  );
$$;

GRANT USAGE ON SCHEMA private TO authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, anon;

-- ==========================================
-- 4. GRANTS FOR POSTGREST & RLS ACCESS
-- ==========================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
