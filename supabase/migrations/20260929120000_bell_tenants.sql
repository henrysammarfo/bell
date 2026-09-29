-- BELL multi-tenant + trader tables for Neon Postgres.
-- Auth is Neon Managed Better Auth (neon_auth.*); app server enforces user_id.
-- No Supabase auth.uid() / RLS roles — those do not exist on Neon.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_members (
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id text NOT NULL,
  wallet_address text,
  role text NOT NULL CHECK (role IN ('owner', 'trader', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.desk_preferences (
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id text NOT NULL,
  weekend_gap_default boolean NOT NULL DEFAULT false,
  strict_fail_closed boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS tenant_members_user_id_idx
  ON public.tenant_members (user_id);

CREATE TABLE IF NOT EXISTS public.profiles (
  id text PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  tenant_id uuid REFERENCES public.tenants (id),
  symbol text NOT NULL,
  rule text NOT NULL DEFAULT 'Notify when session opens',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT watchlist_symbol_length CHECK (char_length(symbol) BETWEEN 1 AND 16)
);

CREATE TABLE IF NOT EXISTS public.simulation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  tenant_id uuid REFERENCES public.tenants (id),
  symbol text NOT NULL,
  session_state text NOT NULL CHECK (session_state IN ('open', 'closed', 'halted', 'gap')),
  amount text NOT NULL,
  outcome text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  tenant_id uuid REFERENCES public.tenants (id),
  event_type text NOT NULL,
  symbol text NOT NULL,
  amount text NOT NULL DEFAULT '',
  state text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trade_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  tenant_id uuid REFERENCES public.tenants (id),
  symbol text NOT NULL,
  session_state text NOT NULL CHECK (session_state IN ('open', 'closed', 'halted')),
  thesis text NOT NULL,
  brief text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trade_briefs_symbol_length CHECK (char_length(symbol) BETWEEN 1 AND 16),
  CONSTRAINT trade_briefs_thesis_length CHECK (char_length(thesis) BETWEEN 10 AND 2000)
);

CREATE TABLE IF NOT EXISTS public.dx_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  tenant_id uuid REFERENCES public.tenants (id),
  title text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS watchlist_items_user_created_idx
  ON public.watchlist_items (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS simulation_results_user_created_idx
  ON public.simulation_results (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_history_user_created_idx
  ON public.activity_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trade_briefs_user_created_idx
  ON public.trade_briefs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dx_reports_user_created_idx
  ON public.dx_reports (user_id, updated_at DESC);
