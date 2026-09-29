import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ExternalLink, LoaderCircle, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { MetaRow, ModeBadge } from "@/components/status";
import { broadcastTrade } from "@/lib/trading.functions";

export const Route = createFileRoute("/_authenticated/receipt")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s["mode"] === "gap" ? ("gap" as const) : ("open" as const),
    ticker: typeof s["ticker"] === "string" ? s["ticker"] : "AAPL",
    amount: typeof s["amount"] === "string" ? s["amount"] : "20.00",
  }),
  head: () => ({
    meta: [
      { title: "Transaction Receipt — BELL" },
      {
        name: "description",
        content: "BELL transaction receipt — real hash or honest unavailable.",
      },
      { property: "og:title", content: "BELL Transaction Receipt" },
      {
        property: "og:description",
        content: "Transparent status from decision gate to wallet result.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Receipt,
});

function Receipt() {
  const { mode, ticker, amount } = Route.useSearch();
  const broadcast = useServerFn(broadcastTrade);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [explorer, setExplorer] = useState<string | null>(null);
  const [modeLabel, setModeLabel] = useState<string>("unavailable");

  async function tryBroadcast() {
    setBusy(true);
    setError(null);
    try {
      const res = await broadcast({
        data: {
          ticker,
          amountUsdt: amount,
          gapMode: mode === "gap",
          gapAcknowledged: mode === "gap",
          confirmBroadcast: true,
        },
      });
      if (!res.ok) {
        setError(`${res.reason}: ${res.detail}`);
        setModeLabel(res.mode);
        setTxHash(null);
        return;
      }
      setTxHash(res.data.txHash);
      setExplorer(res.data.explorerUrl);
      setModeLabel(res.data.mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell eyebrow="Step 4 of 4" title="Receipt">
      <div className="receipt-shell">
        <div className="receipt-success">
          {txHash ? <CheckCircle2 /> : <TriangleAlert />}
          <span>{txHash ? "Broadcast confirmed" : "No fake fill"}</span>
          <h2>{txHash ? "Mainnet proof recorded" : "Connect Agentic Wallet to broadcast"}</h2>
          <p>
            BELL never invents a transaction hash. Without Binance Web3 keys + wallet session, this
            step stays labeled unavailable.
          </p>
        </div>
        <section className="panel receipt-card">
          <div className="receipt-id">
            <span>Transaction</span>
            <ModeBadge mode={modeLabel} />
          </div>
          <code>{txHash ?? "— no hash —"}</code>
          <div className="meta-list">
            <MetaRow
              label="Decision"
              value={mode === "gap" ? "Allowed · gap acknowledged" : "Allowed · session verified"}
            />
            <MetaRow label="Network" value="BSC mainnet" />
            <MetaRow label="Asset" value={ticker} />
            <MetaRow label="Spend" value={`${amount} USDT`} />
            <MetaRow label="Status" value={txHash ? "Broadcast" : (error ?? "Awaiting wallet")} />
          </div>
          <div className="timeline">
            <p>
              <i />
              Intent parsed
            </p>
            <p>
              <i />
              Session checked (server)
            </p>
            <p>
              <i />
              Simulation gated
            </p>
            <p>
              <i />
              {txHash ? "Broadcast complete" : "Broadcast locked until wallet"}
            </p>
          </div>
          <Button
            className="w-full"
            onClick={() => void tryBroadcast()}
            disabled={busy || Boolean(txHash)}
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />}
            {txHash ? "Broadcast complete" : "Attempt Agentic Wallet broadcast"}
          </Button>
          <Button
            variant="outline"
            className="w-full mt-2"
            disabled={!explorer}
            asChild={Boolean(explorer)}
          >
            {explorer ? (
              <a href={explorer} target="_blank" rel="noreferrer">
                Open explorer <ExternalLink />
              </a>
            ) : (
              <span>
                Explorer unavailable <ExternalLink />
              </span>
            )}
          </Button>
        </section>
        <Button asChild variant="link">
          <Link to="/activity">View activity log</Link>
        </Button>
      </div>
    </AppShell>
  );
}
