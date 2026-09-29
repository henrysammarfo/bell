import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, LoaderCircle, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState, useEffectEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ModeBadge, SessionBadge } from "@/components/status";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listBscMarkets } from "@/lib/rwa.functions";
import type { SessionState } from "@/lib/bell-data";

type MarketRow = {
  symbol: string;
  name: string;
  token: string;
  provider: string;
  price: string;
  referencePrice: string;
  gap: string;
  session: SessionState;
  freshness: string;
  mode: string;
};

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Tokenized Markets — BELL" },
      {
        name: "description",
        content:
          "Inspect BSC tokenized stocks with underlying-session and reference freshness context.",
      },
      { property: "og:title", content: "BELL Tokenized Markets" },
      { property: "og:description", content: "Market status before token price." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Markets,
});

function Markets() {
  const load = useServerFn(listBscMarkets);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [mode, setMode] = useState<string>("…");
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useEffectEvent(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await load();
      if (!res.ok) {
        setRows([]);
        setMode("unavailable");
        setError(`${res.reason}: ${res.detail}`);
        return;
      }
      setMode(res.mode);
      setTotal(res.totalBsc);
      setRows(res.markets as MarketRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setMode("unavailable");
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(
    () =>
      rows.filter((m) =>
        (m.symbol + m.name + m.provider + m.token).toLowerCase().includes(q.toLowerCase()),
      ),
    [q, rows],
  );

  return (
    <AppShell
      eyebrow="RWA catalogue · BSC 56"
      title="Markets"
      action={
        <Button asChild>
          <Link to="/desk">
            New intent
            <ArrowRight />
          </Link>
        </Button>
      }
    >
      <div className="market-toolbar">
        <div className="searchbox">
          <Search />
          <Input
            placeholder="Search symbol, token, or provider"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" /> : <SlidersHorizontal />}
          {loading ? "Loading live…" : `${total} BSC · ${mode}`}
        </Button>
      </div>
      {error && (
        <p className="source-note text-risk">Live catalogue unavailable — fail closed. {error}</p>
      )}
      <section className="market-table">
        <div className="market-head">
          <span>Underlying</span>
          <span>Token</span>
          <span>On-chain / ref</span>
          <span>Session</span>
          <span>Freshness</span>
        </div>
        {filtered.map((m) => (
          <div className="market-row" key={`${m.token}-${m.symbol}`}>
            <div className="asset-cell">
              <span className="asset-icon">{m.symbol[0]}</span>
              <div>
                <strong>{m.symbol}</strong>
                <small>{m.name}</small>
              </div>
            </div>
            <div>
              <strong>{m.token}</strong>
              <small>
                {m.provider} · <ModeBadge mode={m.mode} />
              </small>
            </div>
            <div>
              <strong>{m.price}</strong>
              <small>
                ref {m.referencePrice} ·{" "}
                <span className={m.gap.startsWith("+") ? "text-risk" : ""}>{m.gap} gap</span>
              </small>
            </div>
            <SessionBadge state={m.session} />
            <span className="freshness">{m.freshness}</span>
          </div>
        ))}
      </section>
      <p className="source-note">
        Reference prices are API fields, not official NYSE or Nasdaq prices. BELL combines provider
        status with underlying-market checks. Mode: {mode}.
      </p>
    </AppShell>
  );
}
