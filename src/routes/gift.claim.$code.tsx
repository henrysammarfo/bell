import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Gift, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeBadge } from "@/components/status";
import { claimGiftBox, peekGiftBox } from "@/lib/gift.functions";

export const Route = createFileRoute("/gift/claim/$code")({
  head: () => ({
    meta: [
      { title: "Unwrap gift — BELL" },
      { name: "description", content: "Claim a session-honest tokenized stock gift on BSC." },
    ],
  }),
  component: UnwrapGift,
});

function UnwrapGift() {
  const { code } = Route.useParams();
  const peek = useServerFn(peekGiftBox);
  const claim = useServerFn(claimGiftBox);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [gift, setGift] = useState<null | {
    ticker: string;
    symbol: string;
    amountUsdt: string;
    note: string;
    recipientLabel: string;
    sessionLabel: string;
    gapLabel: string;
    status: string;
    wrapDetail: string;
    wrapTxHash: string | null;
    claimTxHash: string | null;
    fingerprint: string;
  }>(null);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [claimDetail, setClaimDetail] = useState<string | null>(null);
  const [claimMode, setClaimMode] = useState<string>("unavailable");
  const [explorer, setExplorer] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    peek({ data: { claimCode: code } })
      .then((res) => {
        if (!alive) return;
        if (!res.ok) {
          setError(res.detail);
          setGift(null);
        } else {
          setGift(res.gift);
          setError(null);
          window.setTimeout(() => setOpened(true), 280);
        }
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [code, peek]);

  async function onClaim(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setClaimDetail(null);
    try {
      const res = await claim({
        data: { claimCode: code, claimerAddress: address },
      });
      if (!res.ok) {
        setClaimDetail(`${res.reason}: ${res.detail}`);
        return;
      }
      setClaimDetail(res.detail);
      setClaimMode(res.mode);
      setExplorer(res.explorerUrl);
      setGift((g) =>
        g
          ? {
              ...g,
              status: "claimed",
              claimTxHash: res.claimTxHash,
            }
          : g,
      );
    } catch (err) {
      setClaimDetail(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell eyebrow="Unwrap" title="Someone sent you a stock.">
      <div className="unwrap-shell">
        {loading && <p className="body-muted">Opening the box…</p>}
        {error && !loading && (
          <div className="panel unwrap-empty">
            <Gift className="feature-icon" />
            <h2>No gift here</h2>
            <p>{error}</p>
            <p className="body-muted">
              Links are one-time and case-sensitive. Ask the sender for a fresh wrap, or make your
              own.
            </p>
            <Button asChild className="mt-4">
              <Link to="/gift">Wrap a gift box</Link>
            </Button>
          </div>
        )}
        {gift && (
          <>
            <div
              className={`gift-box-visual unwrap-stage ${opened ? "gift-box-open" : ""} ${gift.status === "claimed" ? "gift-box-claimed" : ""}`}
              aria-hidden
            >
              <div className="gift-lid" />
              <div className="gift-body">
                <span>{gift.symbol}</span>
                <small>{gift.amountUsdt} USDT</small>
              </div>
              <div className="gift-ribbon-v" />
              <div className="gift-ribbon-h" />
              <div className="gift-bow" />
              <div className="gift-spark" />
            </div>

            <section className="panel unwrap-hero">
              <Sparkles className="feature-icon" />
              <span className="kicker">
                {gift.recipientLabel ? `For ${gift.recipientLabel}` : "Open gift"}
              </span>
              <h2>
                {gift.symbol} · {gift.amountUsdt} USDT wrap
              </h2>
              <p className="unwrap-note">“{gift.note || "A tokenized stock gift."}”</p>
              <div className="unwrap-meta">
                <span>
                  Session at wrap: <strong>{gift.sessionLabel}</strong>
                </span>
                <span>
                  Gap: <strong>{gift.gapLabel}</strong>
                </span>
                <span>
                  Status: <strong>{gift.status}</strong>
                </span>
                <ModeBadge mode={claimMode} />
              </div>
              <p className="body-muted">{gift.wrapDetail}</p>
              {gift.wrapTxHash && (
                <p className="body-muted">
                  Wrap tx: <code>{gift.wrapTxHash}</code>
                </p>
              )}
            </section>

            {gift.status !== "claimed" ? (
              <form className="panel" onSubmit={(e) => void onClaim(e)}>
                <div className="panel-heading">
                  <div>
                    <span className="kicker">Claim</span>
                    <h2>Paste your BSC wallet</h2>
                  </div>
                  <Gift />
                </div>
                <p>
                  BELL never invents a transfer hash. If Agentic Wallet can send (funded wrap +
                  address book), you’ll get a real tx — otherwise your claim is recorded honestly.
                </p>
                <label className="form-label">
                  0x address
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value.trim())}
                    placeholder="0x…"
                    required
                    pattern="0x[a-fA-F0-9]{40}"
                  />
                </label>
                <Button className="w-full mt-4" disabled={busy}>
                  {busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                  Unwrap into my wallet
                </Button>
                {claimDetail && (
                  <p className="gift-gate-msg ok" role="status">
                    {claimDetail}
                  </p>
                )}
                {explorer && (
                  <a className="body-muted" href={explorer} target="_blank" rel="noreferrer">
                    Open explorer
                  </a>
                )}
              </form>
            ) : (
              <section className="panel unwrap-done">
                <h2>Already unwrapped</h2>
                <p className="body-muted">{claimDetail ?? gift.wrapDetail}</p>
                {gift.claimTxHash && <code>{gift.claimTxHash}</code>}
              </section>
            )}

            <p className="legal-note">
              Fingerprint {gift.fingerprint} · Not investment advice · Geo restrictions apply ·
              Tokenized stock ≠ broker share certificate.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
