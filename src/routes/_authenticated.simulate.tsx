import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, LoaderCircle, Save } from "lucide-react";
import { useEffect, useState, useEffectEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { MetaRow, ModeBadge } from "@/components/status";
import { saveSimulation } from "@/lib/trader-data.functions";
import { simulateTrade } from "@/lib/trading.functions";
import { evaluateGate } from "@/lib/rwa.functions";

export const Route = createFileRoute("/_authenticated/simulate")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s["mode"] === "gap" ? ("gap" as const) : ("open" as const),
    ticker: typeof s["ticker"] === "string" ? s["ticker"] : "AAPL",
    amount: typeof s["amount"] === "string" ? s["amount"] : "20.00",
  }),
  head: () => ({
    meta: [
      { title: "Transaction Simulation — BELL" },
      {
        name: "description",
        content: "Run and save a private BSC tokenized-stock dry run.",
      },
      { property: "og:title", content: "BELL Transaction Simulation" },
      {
        property: "og:description",
        content: "A saved, transparent dry run before any transaction is broadcast.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sim,
});

function Sim() {
  const { mode, ticker, amount } = Route.useSearch();
  const save = useServerFn(saveSimulation);
  const sim = useServerFn(simulateTrade);
  const gateFn = useServerFn(evaluateGate);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<{
    mode: string;
    symbol: string;
    expectedOut: string;
    referenceLabel: string;
    priceImpact: string;
    networkFee: string;
    detail: string;
  } | null>(null);

  const load = useEffectEvent(async () => {
    setLoading(true);
    setError(null);
    try {
      const gate = await gateFn({
        data: {
          ticker,
          gapMode: mode === "gap",
          gapAcknowledged: mode === "gap",
        },
      });
      if (!gate.ok) {
        setError(`${gate.reason}: ${gate.detail}`);
        setQuote(null);
        return;
      }
      if (gate.data.decision === "DENY") {
        setError(`Gate DENY — ${gate.data.reasons.join(" ")}`);
        setQuote(null);
        return;
      }
      const result = await sim({
        data: {
          ticker,
          amountUsdt: amount,
          gapMode: mode === "gap",
          gapAcknowledged: mode === "gap",
        },
      });
      if (!result.ok) {
        setError(`${result.reason}: ${result.detail}`);
        setQuote(null);
        return;
      }
      setQuote(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void load();
  }, [ticker, amount, mode, load]);

  async function saveResult() {
    if (!quote) return;
    setSaving(true);
    await save({
      data: {
        symbol: quote.symbol,
        sessionState: mode,
        amount: `${amount} USDT`,
        outcome: "Dry run complete",
        details: {
          minimumReceived: quote.expectedOut,
          priceImpact: quote.priceImpact,
          networkFee: quote.networkFee,
          mode: quote.mode,
        },
      },
    });
    setSaved(true);
    setSaving(false);
  }

  return (
    <AppShell eyebrow="Step 2 of 4" title="Transaction simulation">
      <div className="two-col">
        <section className="panel">
          <div className="simulation-status">
            <span>
              {loading ? <LoaderCircle className="animate-spin" /> : <Check />}
              {loading ? "Simulating…" : error ? "Unavailable" : "Dry run complete"}
            </span>
            <strong>NO BROADCAST</strong>
          </div>
          {error ? (
            <div className="warning-note">{error}</div>
          ) : quote ? (
            <>
              <div className="route-flow">
                <div>
                  <span>01</span>
                  <b>{amount} USDT</b>
                  <small>BNB Smart Chain</small>
                </div>
                <ArrowRight />
                <div>
                  <span>02</span>
                  <b>{quote.expectedOut}</b>
                  <small>{quote.symbol}</small>
                </div>
              </div>
              <div className="check-list">
                <p>
                  <Check /> Server gate re-checked ({mode})
                </p>
                <p>
                  <Check /> Mode <ModeBadge mode={quote.mode} />
                </p>
                <p>
                  <Check /> No state-changing call sent
                </p>
                <p>
                  <Check /> {quote.detail}
                </p>
              </div>
            </>
          ) : null}
        </section>
        <aside className="panel">
          <span className="kicker">Quote detail</span>
          <h2 className="mt-2">Expected outcome</h2>
          <div className="meta-list">
            <MetaRow label="Reference price" value={quote?.referenceLabel ?? "—"} />
            <MetaRow label="Expected out" value={quote?.expectedOut ?? "—"} />
            <MetaRow label="Price impact" value={quote?.priceImpact ?? "—"} />
            <MetaRow label="Network fee" value={quote?.networkFee ?? "—"} />
            <MetaRow label="Route" value="USDT → tokenized equity" />
          </div>
          {mode === "gap" && (
            <div className="warning-note">
              Gap mode stays visible through signing. BELL will not present this quote as current
              Wall Street pricing.
            </div>
          )}
          <Button
            variant="outline"
            className="mt-5 w-full"
            onClick={saveResult}
            disabled={!quote || saved || saving || Boolean(error)}
          >
            <Save />
            {saved ? "Saved to activity" : saving ? "Saving…" : "Save simulation"}
          </Button>
          <Button asChild className="mt-2 w-full" disabled={!quote || Boolean(error)}>
            <Link to="/review" search={{ mode, ticker, amount }}>
              Review decision
              <ArrowRight />
            </Link>
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}
