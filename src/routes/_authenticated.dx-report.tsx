import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, Code2, ExternalLink, KeyRound, LoaderCircle, X } from "lucide-react";
import { useEffect, useState, useEffectEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { collectDxEvidence, type DxEvidenceRow } from "@/lib/dx-evidence.functions";
import { saveDxReport } from "@/lib/trader-data.functions";

export const Route = createFileRoute("/_authenticated/dx-report")({
  head: () => ({
    meta: [
      { title: "Developer Experience Report — BELL" },
      {
        name: "description",
        content: "BELL's candid implementation notes for BNB Chain tokenized-stock APIs.",
      },
      { property: "og:title", content: "BELL DX Report" },
      {
        property: "og:description",
        content: "Specific integration evidence, status codes, and unresolved gaps.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DX,
});

function DX() {
  const collect = useServerFn(collectDxEvidence);
  const save = useServerFn(saveDxReport);
  const [rows, setRows] = useState<DxEvidenceRow[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [at, setAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const load = useEffectEvent(async () => {
    setLoading(true);
    const res = await collect();
    setRows(res.rows);
    setNotes(res.notes);
    setAt(res.collectedAt);
    setLoading(false);
  });

  useEffect(() => {
    void load();
  }, [load]);

  async function persist() {
    const content = [
      `# BELL DX evidence · ${at}`,
      ...rows.map(
        (r) =>
          `- ${r.ok ? "OK" : "FAIL"} · ${r.name} · HTTP ${r.httpStatus ?? "n/a"} · auth=${r.signedAuth} · ${r.detail}`,
      ),
      "",
      ...notes.map((n) => `- ${n}`),
    ].join("\n");
    await save({
      data: {
        id: null,
        title: `DX evidence ${at.slice(0, 10)}`,
        content,
        status: "draft",
      },
    });
    setSaved(true);
  }

  return (
    <AppShell eyebrow="Human notes · implementation evidence" title="DX report">
      <div className="report-intro">
        <div>
          <p className="eyebrow">BELL build report</p>
          <h2>Honest software needs an honest integration report.</h2>
        </div>
        <p>
          Live evidence below — HTTP statuses from public RWA endpoints, session HMAC readiness,
          AgentRouter config, and Binance signing readiness. No AI fluff.
        </p>
      </div>

      <section className="panel auth-sequence">
        <div>
          <KeyRound />
          <span className="kicker">Live evidence</span>
          <h2>Collected {at || "…"}</h2>
        </div>
        {loading ? (
          <p>
            <LoaderCircle className="animate-spin inline" /> Probing APIs…
          </p>
        ) : (
          <ul className="dx-evidence-list">
            {rows.map((r) => (
              <li key={r.name}>
                {r.ok ? <Check /> : <X />}
                <strong>{r.name}</strong>
                <span>
                  HTTP {r.httpStatus ?? "—"} · {r.signedAuth} · {r.detail}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="status-codes">
          <span>
            <b>200</b> usable response
          </span>
          <span>
            <b>400</b> parameter/schema issue
          </span>
          <span>
            <b>401</b> signature or clock
          </span>
          <span>
            <b>429</b> back off
          </span>
        </div>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => void persist()}
          disabled={loading || saved}
        >
          {saved ? "Saved to dx_reports" : "Save evidence draft"}
        </Button>
      </section>

      <div className="report-grid">
        <section className="panel report-card">
          <Check />
          <h3>What worked</h3>
          <ul>
            <li>Public RWA list + market status on BSC 56</li>
            <li>Server fail-closed gate before simulate</li>
            <li>httpOnly session HMAC when BELL_SESSION_SECRET set</li>
          </ul>
        </section>
        <section className="panel report-card">
          <AlertTriangle />
          <h3>What needed care</h3>
          <ul>
            <li>referencePrice ≠ official NYSE</li>
            <li>overnight openState can be true while cash is closed</li>
            <li>AgentRouter cloud WAF → Tor or relay required</li>
          </ul>
        </section>
        <section className="panel report-card">
          <X />
          <h3>What is not claimed</h3>
          <ul>
            <li>No invented mainnet fills</li>
            <li>No unhackable / nation-state-proof security</li>
            <li>No coverage for restricted jurisdictions</li>
          </ul>
        </section>
      </div>

      <p className="source-note">{notes.join(" · ")}</p>
      <Button variant="outline" asChild>
        <a href="https://github.com/henrysammarfo/bell" target="_blank" rel="noreferrer">
          <Code2 />
          Public repository
          <ExternalLink />
        </a>
      </Button>
    </AppShell>
  );
}
