import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LoaderCircle, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ModeBadge } from "@/components/status";
import { fetchAgenticWalletStatus } from "@/lib/wallet.functions";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — BELL" },
      {
        name: "description",
        content: "Connect Binance Agentic Wallet so BELL can fund and send gift wraps honestly.",
      },
    ],
  }),
  component: WalletConnect,
});

function WalletConnect() {
  const fetchStatus = useServerFn(fetchAgenticWalletStatus);
  const [busy, setBusy] = useState(true);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [howTo, setHowTo] = useState<string[]>([]);

  async function refresh() {
    setBusy(true);
    try {
      const s = await fetchStatus();
      setConnected(s.connected);
      setAddress(s.address);
      setDetail(s.detail);
      setHowTo(s.howTo);
    } catch (e) {
      setConnected(false);
      setDetail(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  return (
    <AppShell
      eyebrow="Agentic Wallet"
      title="Connect once. Wrap for real."
      action={
        <Button asChild variant="outline">
          <Link to="/gift">Back to gift</Link>
        </Button>
      }
    >
      <div className="wallet-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="kicker">Binance Agentic Wallet</span>
              <h2>{connected ? "Ready to fund gifts" : "Not connected yet"}</h2>
            </div>
            <Wallet />
          </div>
          <p>
            BELL does not replace Binance buy or Markets. Your wallet still owns swaps and sends —
            we use it only after a session-honest wrap gate.
          </p>
          <div className="wallet-status-row">
            <ModeBadge mode={connected ? "broadcast" : "unavailable"} />
            <span>{busy ? "Checking…" : detail}</span>
          </div>
          {address && (
            <p className="wallet-address">
              <code>{address}</code>
            </p>
          )}
          <div className="gift-actions">
            <Button type="button" disabled={busy} onClick={() => void refresh()}>
              {busy ? <LoaderCircle className="animate-spin" /> : <Wallet />}
              Refresh status
            </Button>
            <Button asChild variant="outline">
              <Link to="/gift">Wrap a gift box</Link>
            </Button>
          </div>
        </section>

        <aside className="panel">
          <span className="kicker">How to pair</span>
          <h2>From your machine</h2>
          <ol className="wallet-steps">
            {howTo.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="body-muted">
            Pairing codes expire quickly. If the app says “wrong,” run{" "}
            <code>bash scripts/baw-connect.sh</code> again for a fresh code.
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
