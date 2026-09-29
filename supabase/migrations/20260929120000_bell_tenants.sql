-- BELL multi-tenant membership (Supabase / Postgres)
-- user_id is auth.users uuid as text for JWT sub compatibility.

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_members (
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  wallet_address text,
  role text NOT NULL CHECK (role IN ('owner', 'trader', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.desk_preferences (
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  weekend_gap_default boolean NOT NULL DEFAULT false,
  strict_fail_closed boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS tenant_members_user_id_idx
  ON public.tenant_members (user_id);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desk_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_member_select ON public.tenants
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members m
      WHERE m.tenant_id = tenants.id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY tenant_members_self_select ON public.tenant_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY tenant_members_self_insert ON public.tenant_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY desk_prefs_self_select ON public.desk_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY desk_prefs_writer_insert ON public.desk_preferences
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tenant_members m
      WHERE m.tenant_id = desk_preferences.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'trader')
    )
  );

CREATE POLICY desk_prefs_writer_update ON public.desk_preferences
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tenant_members m
      WHERE m.tenant_id = desk_preferences.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'trader')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tenant_members m
      WHERE m.tenant_id = desk_preferences.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'trader')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO service_role, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.desk_preferences TO service_role, authenticated;
GRANT SELECT ON public.tenants TO authenticated;

-- Scope trader tables with optional tenant_id (nullable for back-compat)
ALTER TABLE public.watchlist_items ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.simulation_results ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.activity_history ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.trade_briefs ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.dx_reports ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
