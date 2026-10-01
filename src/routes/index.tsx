import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Gift, Menu, X } from "lucide-react";
import { useState } from "react";
import bg from "@/assets/bell-cinematic-bg.jpg";
import demo from "@/assets/bell-demo-visual.jpg";
import { BellLogo } from "@/components/bell-logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BELL — Wrap a stock. They unwrap it." },
      {
        name: "description",
        content:
          "BELL wraps tokenized stocks as session-honest gifts on BSC. Fail closed on fake weekend prices.",
      },
      { property: "og:title", content: "BELL — Tokenized stock gift boxes" },
      {
        property: "og:description",
        content: "You pay. They unwrap a real stock token — only when the session is honest.",
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
      <section className="home-screen">
        <img
          className="home-background"
          src={bg}
          width={1920}
          height={1080}
          alt="Monumental exchange bell at night"
        />
        <div className="home-vignette" />
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
              <span>Gift ritual</span>
              <strong>Wrap · Share · Unwrap</strong>
            </div>
            <Button asChild variant="light">
              <Link to="/gift">Wrap a gift</Link>
            </Button>
          </div>
          <Button
            variant="glass"
            size="icon-lg"
            className="home-menu"
            aria-label="Toggle navigation"
            onClick={() => setMenu((v) => !v)}
          >
            {menu ? <X /> : <Menu />}
          </Button>
        </header>
        <div className="home-content">
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
            Tokenized stocks as a gift box on BSC.
            <br />
            You pay. They claim the link.
            <br />
            BELL still won’t wrap a fake weekend price.
          </p>
          <Button asChild variant="light" size="hero">
            <Link to="/gift">
              <span>Wrap a gift box</span>
              <span className="arrow-box">
                <Gift />
              </span>
            </Link>
          </Button>
        </div>
        <article className="demo-card">
          <div className="demo-visual">
            <img
              src={demo}
              width={1024}
              height={1024}
              alt="Red and blue smoke around an exchange bell"
            />
            <div className="demo-signal">
              <span className="status-dot status-closed" />
              Session-gated wrap
            </div>
          </div>
          <Button asChild variant="glass" className="watch-button">
            <Link to="/desk">
              Power desk <ArrowUpRight />
            </Link>
          </Button>
        </article>
      </section>
    </main>
  );
}
