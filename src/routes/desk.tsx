import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Bot, LoaderCircle, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState, useEffectEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ModeBadge, SessionBadge } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { evaluateGate } from "@/lib/rwa.functions";
import type { GateExplanation } from "@/lib/adapters/session-gate";
import type { AdapterResult } from "@/lib/adapters/types";

export const Route = createFileRoute("/desk")({
  head: () => ({
    meta: [
      { title: "Honest Desk — BELL" },
      {
        name: "description",
        content: "Check a BSC tokenized-stock order against its underlying market session.",
      },
      { property: "og:title", content: "BELL Honest Desk" },
      {
        property: "og:description",
        content: "Build an intent, check the session, then simulate before signing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Desk,
});

function Desk() {
  const runGate = useServerFn(evaluateGate);
  const [ticker, setTicker] = useState("AAPL");
  const [amount, setAmount] = useState("20.00");
  const [gap, setGap] = useState(false);
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<GateExplanation | null>(null);

  const refresh = useEffectEvent(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = (await runGate({
        data: {
          ticker,
          gapMode: gap,
          gapAcknowledged: ack,
        },
      })) as AdapterResult<GateExplanation>;
      if (!result.ok) {
        setGate(null);
        setError(`${result.reason}: ${result.detail}`);
        return;
      }
      setGate(result.data);
    } catch (e) {
      setGate(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void refresh();
  }, [ticker, gap, ack, refresh]);

  const denied = gate?.decision === "DENY";
  const sessionState = gate?.sessionLabel ?? "closed";

  return (
    <AppShell eyebrow="Intent  /  Gate  /  Simulate" title="Honest desk">
      <div className="desk-grid">
        <section className="panel order-panel">
          <div className="panel-heading">
            <div>
              <span className="kicker">Order intent</span>
              <h2>What do you want to buy?</h2>
            </div>
            <Bot />
          </div>
          <div className="prompt-box">
            <Sparkles />
            <Input
              aria-label="Order intent"
              value={`Buy ${ticker.toUpperCase()} with ${amount} USDT`}
              readOnly
            />
          </div>
          <div className="form-grid">
            <label>
              Ticker
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                aria-label="Ticker"
              />
            </label>
            <label>
              Spend (USDT)
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label="Spend amount"
              />
            </label>
          </div>
          <div className={`gap-control ${gap ? "gap-on" : ""}`}>
            <div>
              <strong>Weekend-gap mode</strong>
              <span>
                Proceed knowingly when the underlying session is closed or the gap is toxic.
              </span>
            </div>
            <Switch
              checked={gap}
              onCheckedChange={(v) => {
                setGap(v);
                if (!v) setAck(false);
              }}
              aria-label="Weekend-gap mode"
            />
          </div>
          {gap && (
            <label className="ack-row">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              <span>
                I acknowledge the on-chain price may diverge from the cash open — this is not a
                fresh Wall Street print.
              </span>
            </label>
          )}
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => void refresh()}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle className="animate-spin" /> Checking live status…
              </>
            ) : (
              "Re-check live gate"
            )}
          </Button>
        </section>

        <aside className={`panel gate-panel ${denied ? "gate-denied" : "gate-allowed"}`}>
          <div className="gate-top">
            <span className="kicker">Decision gate</span>
            <div className="flex gap-2 items-center">
              <SessionBadge state={sessionState} />
              {gate && <ModeBadge mode={gate.mode} />}
            </div>
          </div>
          <ShieldAlert className="gate-icon" />
          <p className="gate-word">
            {error ? "UNAVAILABLE" : denied ? "DENIED" : gate ? "ALLOW" : "…"}
          </p>
          <h2>
            {error
              ? "Could not prove session honesty."
              : denied
                ? "The reference is not honest enough."
                : sessionState === "gap"
                  ? "Gap mode acknowledged."
                  : "The session is live."}
          </h2>
          <p>
            {error
              ? error
              : gate?.reasons.join(" ") ||
                "Live RWA status + cash session are required before continue."}
          </p>
          {gate && (
            <div className="gap-stat">
              <span>On-chain gap · {gate.symbol ?? ticker} · API referencePrice ≠ NYSE</span>
              <strong>{gate.gapLabel}</strong>
            </div>
          )}
          {denied || error || !gate ? (
            <Button disabled className="w-full">
              Simulation locked
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link
                to="/simulate"
                search={{
                  mode: sessionState === "gap" ? "gap" : "open",
                  ticker: gate.ticker,
                  amount,
                }}
              >
                Continue to simulation
                <ArrowRight />
              </Link>
            </Button>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
