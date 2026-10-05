import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircleOff, Gift, ScanSearch, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Why BELL Exists" },
      {
        name: "description",
        content: "Session-honest tokenized stock gift boxes on BSC — not another buy screen.",
      },
      { property: "og:title", content: "Why BELL Exists" },
      {
        property: "og:description",
        content: "You wrap. They unwrap. BELL fails closed on fake weekend prices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const steps = [
  [
    Gift,
    "Wrap a gift",
    "Pick a tokenized stock, amount, and note. You pay — they get a claim link, not a markets clone.",
  ],
  [
    CircleOff,
    "Fail closed",
    "Deny closed, halted, or toxic-gap wraps before anything reaches a wallet.",
  ],
  [
    ShieldCheck,
    "Quote + simulate",
    "Signed Binance paths expose expected out, impact, and fees — no invented hashes.",
  ],
  [
    ScanSearch,
    "They unwrap",
    "Friend opens the link, pastes a BSC address, and claims. Agentic Wallet sends when ready.",
  ],
] as const;

function About() {
  return (
    <AppShell eyebrow="Why BELL exists" title="Wrap a stock. They unwrap it.">
      <section className="about-lead">
        <h2>A gift ritual for tokenized stocks — with closed-session honesty underneath.</h2>
        <p>
          Binance Wallet already buys and sends. BELL is the wedge: payer wraps, receiver claims, and
          weekend fake prices still get a hard DENY unless you acknowledge gap mode. Built for
          non-restricted EU and APAC users exploring Ondo and bStocks on BNB Smart Chain.
        </p>
      </section>
      <div className="architecture">
        {steps.map(([Icon, title, copy], i) => (
          <article key={title}>
            <span className="step-number">0{i + 1}</span>
            <Icon />
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
      <section className="principles">
        <div>
          <span className="kicker">The one rule</span>
          <h2>If BELL cannot prove the session is usable, it does not wrap.</h2>
        </div>
        <Button asChild size="hero">
          <Link to="/gift">
            <span>Wrap a gift box</span>
            <span className="arrow-box">
              <ArrowRight />
            </span>
          </Link>
        </Button>
      </section>
      <p className="legal-note">
        BELL is not investment advice. Tokenized securities may be unavailable in your jurisdiction,
        including the US, Canada, UK, Japan, and the Netherlands. Mainnet actions must always be
        clearly labeled and independently verified. Jev (TypeSafe) is a typed decision model used as
        a second opinion on wrap honesty — not an LLM and not investment advice.
      </p>
    </AppShell>
  );
}
