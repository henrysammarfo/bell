import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ShieldCheck, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { MetaRow } from "@/components/status";

export const Route = createFileRoute("/_authenticated/review")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s["mode"] === "gap" ? ("gap" as const) : ("open" as const),
    ticker: typeof s["ticker"] === "string" ? s["ticker"] : "AAPL",
    amount: typeof s["amount"] === "string" ? s["amount"] : "20.00",
  }),
  head: () => ({
    meta: [
      { title: "Review Trade — BELL" },
      {
        name: "description",
        content: "Review BELL session safeguards before wallet confirmation.",
      },
      { property: "og:title", content: "Review BELL Decision" },
      {
        property: "og:description",
        content: "Every reason and risk remains visible before signing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Review,
});

function Review() {
  const { mode, ticker, amount } = Route.useSearch();
  const gap = mode === "gap";
  return (
    <AppShell eyebrow="Step 3 of 4" title="Review the decision">
      <div className="review-wrap">
        <section className={`decision-banner ${gap ? "decision-risk" : "decision-safe"}`}>
          {gap ? <TriangleAlert /> : <ShieldCheck />}
          <div>
            <span>{gap ? "EXPLICIT GAP MODE" : "SESSION VERIFIED"}</span>
            <h2>
              {gap
                ? "You chose to trade across a closed underlying session."
                : "This intent passed every BELL safeguard."}
            </h2>
            <p>
              {gap
                ? "The token price may diverge from the cash open. This is not presented as a fresh stock price."
                : "Fresh status, current reference, successful simulation, and bounded spend."}
            </p>
          </div>
        </section>
        <section className="panel review-card">
          <div>
            <span className="kicker">Order summary</span>
            <h2>Buy {ticker}</h2>
          </div>
          <div className="meta-list">
            <MetaRow label="Spend" value={`${amount} USDT`} />
            <MetaRow label="Session" value={gap ? "Closed · acknowledged" : "Open · verified"} />
            <MetaRow label="Simulation" value="Server-gated · no broadcast" />
            <MetaRow label="Wallet" value="Connect Agentic Wallet to broadcast (no fake hash)" />
          </div>
          <div className="review-actions">
            <Button asChild variant="outline">
              <Link to="/desk">
                <ArrowLeft />
                Back
              </Link>
            </Button>
            <Button asChild>
              <Link to="/receipt" search={{ mode, ticker, amount }}>
                Continue to receipt
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
