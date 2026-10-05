import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, LoaderCircle, Terminal, Wallet } from "lucide-react";
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

const PAIR_CMD = "bash scripts/baw-connect.sh";

function WalletConnect() {
  const fetchStatus = useServerFn(fetchAgenticWalletStatus);
  const [busy, setBusy] = useState(true);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [howTo, setHowTo] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

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

  async function copyCmd() {
    await navigator.clipboard.writeText(PAIR_CMD);
    setCopied(true);
  }

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
            Binance Markets already buys and sends. BELL only uses your Agentic Wallet{" "}
            <em>after</em> a session-honest gift wrap — never invents a tx hash.
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
          <span className="kicker">Pair in 60 seconds</span>
          <h2>From your machine</h2>
          <div className="wallet-cmd">
            <Terminal />
            <code>{PAIR_CMD}</code>
            <Button type="button" size="icon" variant="ghost" aria-label="Copy command" onClick={() => void copyCmd()}>
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
          <ol className="wallet-steps">
            <li>Install Binance app (Agentic Wallet / Web3) for your region.</li>
            <li>
              Run <code>{PAIR_CMD}</code> — it installs <code>baw</code> if needed.
            </li>
            <li>Open the printed URL or enter the pairing code in the app.</li>
            <li>
              Codes expire fast. If it says “wrong”, re-run for a <strong>fresh</strong> code.
            </li>
            <li>Confirm until status is CONNECTED, then hit Refresh here.</li>
            {(howTo.length > 5 ? howTo.slice(5) : []).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="body-muted">
            Full notes: <code>docs/memory/SETUP_JEV_AND_WALLET.md</code>
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
