import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Menu, X } from "lucide-react";
import { useState } from "react";
import { BellLogo } from "@/components/bell-logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BELL — Wrap a stock. They unwrap it." },
      {
        name: "description",
        content:
          "Gift bStocks and Ondo tokenized stocks on BSC. Session-honest wrap — fail closed on fake weekend prices.",
      },
      { property: "og:title", content: "BELL — Tokenized stock gift boxes" },
      {
        property: "og:description",
        content: "You pay. They unwrap a real bStock or Ondo token — only when the session is honest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [menu, setMenu] = useState(false);
  return (
    <main className="home-viewport">
      <section className="home-screen home-screen-binance">
        <div className="home-atmosphere" aria-hidden="true">
          <div className="home-grid" />
          <div className="home-glow home-glow-a" />
          <div className="home-glow home-glow-b" />
          <div className="home-ring" />
        </div>
        <header className={`home-header ${menu ? "menu-open" : ""}`}>
          <BellLogo />
          <div className="home-actions">
            <nav>
              <Link to="/" activeOptions={{ exact: true }}>
                Home
              </Link>
              <Link to="/gift">Gift</Link>
              <Link to="/markets">Markets</Link>
              <Link to="/about">About</Link>
            </nav>
            <div className="time-panel">
              <span>bStocks · BSC</span>
              <strong>Wrap · Share · Unwrap</strong>
            </div>
            <Button asChild className="btn-binance">
              <Link to="/gift">Wrap a gift</Link>
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon-lg"
            className="home-menu"
            aria-label="Toggle navigation"
            onClick={() => setMenu((v) => !v)}
          >
            {menu ? <X /> : <Menu />}
          </Button>
        </header>
        <div className="home-content home-content-solo">
          <p className="home-brand-mark">BELL</p>
          <h1 className="home-title">
            <span className="title-clip">
              <span className="title-line title-line-one">Wrap a stock.</span>
            </span>
            <span className="title-clip">
              <span className="title-line title-line-two">They unwrap it.</span>
            </span>
          </h1>
          <p className="home-copy">
            Gift real bStocks on BNB Smart Chain. You pay. They claim the link.
            BELL still won’t wrap a fake weekend price.
          </p>
          <Button asChild size="hero" className="btn-binance">
            <Link to="/gift">
              <span>Wrap a gift box</span>
              <span className="arrow-box arrow-box-binance">
                <Gift />
              </span>
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
