import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BellRing,
  BrainCircuit,
  FileCode2,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  RadioTower,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { BellLogo } from "./bell-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/integrations/neon/auth-client";
import { clearHttpOnlySession } from "@/lib/session.functions";

const nav = [
  ["/gift", "Gift", BellRing],
  ["/desk", "Desk", LayoutDashboard],
  ["/brief", "Brief", BrainCircuit],
  ["/markets", "Markets", Search],
  ["/watchers", "Watchers", RadioTower],
  ["/activity", "Activity", Activity],
  ["/dx-report", "DX report", FileCode2],
] as const;

export function AppShell({
  children,
  eyebrow,
  title,
  action,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();

  async function signOut() {
    try {
      await authClient?.signOut();
    } catch {
      /* ignore */
    }
    try {
      await clearHttpOnlySession();
    } catch {
      /* ignore */
    }
    router.invalidate();
    await router.navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="app-header">
        <BellLogo />
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map(([to, label]) => (
            <Link key={to} to={to} className={`nav-pill ${path === to ? "nav-pill-active" : ""}`}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="status-dot status-open" />
            BSC mainnet
          </div>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link to="/wallet">
              <Wallet />
              Connect wallet
            </Link>
          </Button>
          {!loading &&
            (user ? (
              <Button variant="ghost" size="icon" aria-label="Sign out" title="Sign out" onClick={signOut}>
                <LogOut />
              </Button>
            ) : (
              <Button asChild variant="ghost" size="icon" aria-label="Sign in" title="Sign in">
                <Link to="/auth" search={{ next: path }}>
                  <LogIn />
                </Link>
              </Button>
            ))}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </header>
      {open && (
        <nav className="mobile-nav">
          {nav.map(([to, label, Icon]) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} className="mobile-nav-link">
              <Icon />
              {label}
            </Link>
          ))}
          <Link to="/wallet" onClick={() => setOpen(false)} className="mobile-nav-link">
            <Wallet />
            Wallet
          </Link>
        </nav>
      )}
      <main className="app-main">
        <div className="page-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          {action}
        </div>
        {children}
      </main>
      <footer className="app-footer">
        <span>BELL · Gift boxes with closed-session honesty on BSC</span>
        <span>Not investment advice · Availability varies by region</span>
      </footer>
    </div>
  );
}
