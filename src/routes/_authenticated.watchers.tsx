import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BellRing,
  LoaderCircle,
  Pause,
  Play,
  Plus,
  RadioTower,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createWatchlistItem,
  deleteWatchlistItem,
  listWatchlist,
  updateWatchlistItem,
} from "@/lib/trader-data.functions";
import { runSessionWatcher, type WatcherHit } from "@/lib/watcher.functions";

type Watcher = Awaited<ReturnType<typeof listWatchlist>>[number];

export const Route = createFileRoute("/_authenticated/watchers")({
  head: () => ({
    meta: [
      { title: "Session Watchers — BELL" },
      {
        name: "description",
        content: "Private persistent watchers for tokenized-stock market sessions.",
      },
      { property: "og:title", content: "BELL Session Watchers" },
      {
        property: "og:description",
        content: "Save session watchers to your private trader account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Watchers,
});

function Watchers() {
  const list = useServerFn(listWatchlist);
  const create = useServerFn(createWatchlistItem);
  const update = useServerFn(updateWatchlistItem);
  const remove = useServerFn(deleteWatchlistItem);
  const run = useServerFn(runSessionWatcher);
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hits, setHits] = useState<WatcherHit[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    list()
      .then(setWatchers)
      .catch(() => setError("Your watchlist could not be loaded."))
      .finally(() => setLoading(false));
  }, [list]);

  async function add() {
    try {
      const row = await create({
        data: { symbol, rule: "Notify when session opens" },
      });
      setWatchers((x) => [row, ...x]);
      setSymbol("");
    } catch {
      setError("The watcher could not be saved.");
    }
  }

  async function toggle(w: Watcher) {
    await update({ data: { id: w.id, active: !w.active } });
    setWatchers((x) => x.map((a) => (a.id === w.id ? { ...a, active: !a.active } : a)));
  }

  async function del(id: string) {
    await remove({ data: { id } });
    setWatchers((x) => x.filter((a) => a.id !== id));
  }

  async function runNow() {
    setRunning(true);
    setError("");
    try {
      const res = await run({ data: { gapMode: false } });
      if (!res.ok) {
        setError(`${res.reason}: ${res.detail}`);
        setHits([]);
      } else {
        setHits(res.hits);
      }
    } catch {
      setError("Watcher run failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <AppShell eyebrow="Private watchlist · Agent Studio path" title="Session watchers">
      <div className="two-col">
        <section>
          <div className="watcher-list">
            {loading ? (
              <div className="empty-row">
                <LoaderCircle className="animate-spin" />
                Loading watchlist…
              </div>
            ) : watchers.length === 0 ? (
              <div className="empty-row">No saved watchers yet.</div>
            ) : (
              watchers.map((w) => (
                <article className="panel watcher" key={w.id}>
                  <div className="watcher-icon">
                    <RadioTower />
                  </div>
                  <div>
                    <span className="kicker">{w.symbol} underlying</span>
                    <h2>{w.rule}</h2>
                    <p>
                      {w.active
                        ? "Watching provider status and cash session honesty."
                        : "Paused · no checks running."}
                    </p>
                  </div>
                  <span className={`watch-state ${w.active ? "watch-active" : ""}`}>
                    {w.active ? "Active" : "Paused"}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={w.active ? "Pause watcher" : "Resume watcher"}
                    onClick={() => toggle(w)}
                  >
                    {w.active ? <Pause /> : <Play />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete watcher"
                    onClick={() => del(w.id)}
                  >
                    <Trash2 />
                  </Button>
                </article>
              ))
            )}
          </div>
          {hits.length > 0 && (
            <div className="panel mt-4">
              <span className="kicker">Last live run</span>
              <ul className="dx-evidence-list">
                {hits.map((h) => (
                  <li key={h.symbol}>
                    <strong>
                      {h.symbol} · {h.decision}
                    </strong>
                    <span>
                      {h.sessionLabel} · gap {h.gapLabel} · {h.mode} · {h.reasons[0]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && <p className="form-message">{error}</p>}
        </section>
        <aside className="panel">
          <BellRing className="feature-icon" />
          <span className="kicker">Create watcher</span>
          <h2 className="mt-2">Wait for honesty, not hype.</h2>
          <p className="body-muted">
            Track a ticker and run a live RWA gate check (Agent Studio special path). No fake
            alerts.
          </p>
          <label className="form-label">
            Ticker
            <Input
              placeholder="e.g. NVDA"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </label>
          <Button className="mt-4 w-full" disabled={!symbol} onClick={add}>
            <Plus />
            Save watcher
          </Button>
          <Button
            className="mt-2 w-full"
            variant="outline"
            disabled={running || watchers.length === 0}
            onClick={() => void runNow()}
          >
            {running ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
            Run live session check
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}
