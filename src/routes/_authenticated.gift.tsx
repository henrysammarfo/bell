import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Gift, Link2, LoaderCircle, Package, Sparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeBadge } from "@/components/status";
import { previewGiftGate, wrapGiftBox, listMyGifts } from "@/lib/gift.functions";

export const Route = createFileRoute("/_authenticated/gift")({
  head: () => ({
    meta: [
      { title: "Gift Box — BELL" },
      {
        name: "description",
        content: "Wrap a session-honest tokenized stock gift. They unwrap the link.",
      },
    ],
  }),
  component: GiftCompose,
});

function GiftCompose() {
  const preview = useServerFn(previewGiftGate);
  const wrap = useServerFn(wrapGiftBox);
  const list = useServerFn(listMyGifts);

  const [ticker, setTicker] = useState("AAPL");
  const [amount, setAmount] = useState("20");
  const [note, setNote] = useState("A slice of the real market — unwrap when you’re ready.");
  const [recipient, setRecipient] = useState("");
  const [gapMode, setGapMode] = useState(false);
  const [gapAck, setGapAck] = useState(false);
  const [fund, setFund] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gateMsg, setGateMsg] = useState<string | null>(null);
  const [gateOk, setGateOk] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    claimUrl: string;
    status: string;
    expectedOut: string;
    wrapDetail: string;
    mode: string;
  } | null>(null);
  const [mine, setMine] = useState<
    Array<{
      claim_code: string;
      ticker: string;
      amount_usdt: string;
      recipient_label: string;
      status: string;
      created_at: string;
    }>
  >([]);

  useEffect(() => {
    void list().then((rows) => {
      setMine(
        (rows as Array<Record<string, unknown>>).map((r) => ({
          claim_code: String(r.claim_code),
          ticker: String(r.ticker),
          amount_usdt: String(r.amount_usdt),
          recipient_label: String(r.recipient_label ?? ""),
          status: String(r.status),
          created_at: String(r.created_at),
        })),
      );
    });
  }, [list, result]);

  async function checkGate() {
    setBusy(true);
    setGateMsg(null);
    try {
      const g = await preview({
        data: { ticker, gapMode, gapAcknowledged: gapAck },
      });
      if (!g.ok) {
        setGateOk(false);
        setGateMsg(`${g.reason}: ${g.detail}`);
      } else if (g.decision === "DENY") {
        setGateOk(false);
        setGateMsg(`DENY · ${g.sessionLabel} · ${g.reasons.join(" ")}`);
      } else {
        setGateOk(true);
        setGateMsg(
          `ALLOW · ${g.sessionLabel} · gap ${g.gapLabel} · ${g.symbol ?? ticker}`,
        );
      }
    } catch (e) {
      setGateOk(false);
      setGateMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onWrap(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    setCopied(false);
    try {
      const res = await wrap({
        data: {
          ticker,
          amountUsdt: amount,
          note,
          recipientLabel: recipient,
          gapMode,
          gapAcknowledged: gapAck,
          fundWithWallet: fund,
        },
      });
      if (!res.ok) {
        setGateOk(false);
        setGateMsg(`${res.reason}: ${res.detail}`);
        return;
      }
      setGateOk(true);
      setResult({
        claimUrl: res.claimUrl,
        status: res.status,
        expectedOut: res.expectedOut,
        wrapDetail: res.wrapDetail,
        mode: res.mode,
      });
      setGateMsg(`Wrapped · ${res.sessionLabel} · share the claim link`);
    } catch (err) {
      setGateMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.claimUrl);
    setCopied(true);
  }

  return (
    <AppShell
      eyebrow="Gift box"
      title="Wrap a stock. They unwrap it."
      action={
        <Button asChild variant="outline">
          <Link to="/wallet">Wallet</Link>
        </Button>
      }
    >
      <div className="gift-ritual" aria-hidden>
        <div className={`gift-box-visual ${result ? "gift-box-sealed" : ""}`}>
          <div className="gift-lid" />
          <div className="gift-body">
            <span>{ticker || "???"}</span>
            <small>${amount || "0"}</small>
          </div>
          <div className="gift-ribbon-v" />
          <div className="gift-ribbon-h" />
          <div className="gift-bow" />
        </div>
        <ol className="gift-steps">
          <li className={ticker && amount ? "done" : ""}>Pick ticker</li>
          <li className={note ? "done" : ""}>Write a note</li>
          <li className={result ? "done" : ""}>Wrap & share</li>
        </ol>
      </div>

      <div className="gift-grid">
        <form className="panel gift-compose" onSubmit={(e) => void onWrap(e)}>
          <div className="panel-heading">
            <div>
              <span className="kicker">Not another buy screen</span>
              <h2>Session-honest gift</h2>
            </div>
            <Gift />
          </div>
          <p>
            You pay. They get the tokenized stock. BELL still fails closed when the weekend print is
            fake — unless you flip gap mode on purpose.
          </p>

          <div className="form-grid">
            <label>
              Ticker
              <Input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
            </label>
            <label>
              USDT to wrap
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
          </div>

          <label className="form-label">
            For (name or @handle)
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Alex"
            />
          </label>

          <label className="form-label">
            Note in the box
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} />
          </label>

          <div className={`gap-control ${gapMode ? "gap-on" : ""}`}>
            <div>
              <strong>Weekend-gap mode</strong>
              <span>Only if you mean to wrap against a closed/overnight reference.</span>
            </div>
            <button
              type="button"
              className={gapMode ? "active" : ""}
              onClick={() => setGapMode((v) => !v)}
            >
              {gapMode ? "ON" : "OFF"}
            </button>
          </div>
          {gapMode && (
            <label className="ack-row">
              <input
                type="checkbox"
                checked={gapAck}
                onChange={(e) => setGapAck(e.target.checked)}
              />
              <span>I acknowledge this wrap may use a stale weekend/overnight reference.</span>
            </label>
          )}

          <label className="ack-row">
            <input type="checkbox" checked={fund} onChange={(e) => setFund(e.target.checked)} />
            <span>
              Fund now via Agentic Wallet (optional). Off = quote + claim link only — still honest.
            </span>
          </label>

          <div className="gift-actions">
            <Button type="button" variant="outline" disabled={busy} onClick={() => void checkGate()}>
              Check session
            </Button>
            <Button type="submit" disabled={busy || (gapMode && !gapAck)}>
              {busy ? <LoaderCircle className="animate-spin" /> : <Package />}
              Wrap gift box
            </Button>
          </div>

          {gateMsg && (
            <p className={`gift-gate-msg ${gateOk ? "ok" : "bad"}`} role="status">
              {gateMsg}
            </p>
          )}

          {result && (
            <div className="gift-link-card gift-link-pop">
              <div className="receipt-id">
                <span>
                  <Sparkles className="inline-spark" /> Claim link ready
                </span>
                <ModeBadge mode={result.mode} />
              </div>
              <code>{result.claimUrl}</code>
              <p>
                {result.expectedOut} · {result.status} · {result.wrapDetail}
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void copyLink()}
              >
                <Link2 /> {copied ? "Copied" : "Copy claim link"}
              </Button>
            </div>
          )}
        </form>

        <aside className="panel">
          <span className="kicker">Your boxes</span>
          <h2>Recent wraps</h2>
          <div className="gift-mine">
            {mine.length === 0 && <p className="body-muted">No gifts yet — wrap your first.</p>}
            {mine.map((g) => (
              <Link
                key={g.claim_code}
                to="/gift/claim/$code"
                params={{ code: g.claim_code }}
                className="gift-mine-row"
              >
                <strong>
                  {g.ticker} · {g.amount_usdt} USDT
                </strong>
                <small>
                  {g.recipient_label || "Open gift"} · {g.status}
                </small>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
