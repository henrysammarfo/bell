CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner_all" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  rule text NOT NULL DEFAULT 'Notify when session opens',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT watchlist_symbol_length CHECK (char_length(symbol) BETWEEN 1 AND 16)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist_items TO authenticated;
GRANT ALL ON public.watchlist_items TO service_role;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlist_owner_all" ON public.watchlist_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX watchlist_items_user_created_idx ON public.watchlist_items(user_id, created_at DESC);
CREATE TRIGGER watchlist_items_updated_at BEFORE UPDATE ON public.watchlist_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.simulation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  session_state text NOT NULL CHECK (session_state IN ('open', 'closed', 'halted', 'gap')),
  amount text NOT NULL,
  outcome text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulation_results TO authenticated;
GRANT ALL ON public.simulation_results TO service_role;
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "simulations_owner_all" ON public.simulation_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX simulation_results_user_created_idx ON public.simulation_results(user_id, created_at DESC);
CREATE TRIGGER simulation_results_updated_at BEFORE UPDATE ON public.simulation_results FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.activity_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  symbol text NOT NULL,
  amount text NOT NULL DEFAULT '',
  state text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_history TO authenticated;
GRANT ALL ON public.activity_history TO service_role;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_owner_all" ON public.activity_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX activity_history_user_created_idx ON public.activity_history(user_id, created_at DESC);
CREATE TRIGGER activity_history_updated_at BEFORE UPDATE ON public.activity_history FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.trade_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  session_state text NOT NULL CHECK (session_state IN ('open', 'closed', 'halted')),
  thesis text NOT NULL,
  brief text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trade_briefs_symbol_length CHECK (char_length(symbol) BETWEEN 1 AND 16),
  CONSTRAINT trade_briefs_thesis_length CHECK (char_length(thesis) BETWEEN 10 AND 2000)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_briefs TO authenticated;
GRANT ALL ON public.trade_briefs TO service_role;
ALTER TABLE public.trade_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_briefs_owner_all" ON public.trade_briefs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX trade_briefs_user_created_idx ON public.trade_briefs(user_id, created_at DESC);
CREATE TRIGGER trade_briefs_updated_at BEFORE UPDATE ON public.trade_briefs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.dx_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dx_reports TO authenticated;
GRANT ALL ON public.dx_reports TO service_role;
ALTER TABLE public.dx_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dx_reports_owner_all" ON public.dx_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX dx_reports_user_created_idx ON public.dx_reports(user_id, created_at DESC);
CREATE TRIGGER dx_reports_updated_at BEFORE UPDATE ON public.dx_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();