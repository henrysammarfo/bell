import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Mail } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { BellLogo } from "@/components/bell-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, neonAuthConfigured } from "@/integrations/neon/auth-client";
import { mintHttpOnlySession } from "@/lib/session.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    next:
      typeof s["next"] === "string" && String(s["next"]).startsWith("/")
        ? String(s["next"])
        : "/gift",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — BELL" },
      {
        name: "description",
        content: "Sign in to wrap session-honest tokenized stock gifts on BSC.",
      },
      { property: "og:title", content: "Sign in — BELL" },
      {
        property: "og:description",
        content: "Wrap gifts. Fail closed on fake weekend prices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next: nextFromSearch } = Route.useSearch();
  const mint = useServerFn(mintHttpOnlySession);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const next =
    typeof window !== "undefined"
      ? sessionStorage.getItem("bell-auth-next") || nextFromSearch
      : nextFromSearch;

  async function afterAuth() {
    sessionStorage.removeItem("bell-auth-next");
    try {
      const minted = await mint();
      if (minted.ok && minted.setCookie && typeof document !== "undefined") {
        document.cookie = minted.setCookie;
      }
    } catch {
      // Session mint is best-effort — Neon Auth still valid; httpOnly may need BELL_SESSION_SECRET.
    }
    void navigate({ to: next });
  }

  useEffect(() => {
    if (!neonAuthConfigured() || !authClient) return;
    authClient.getSession().then(({ data }) => {
      if (data?.user) void afterAuth();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!authClient) {
      setMessage("Neon Auth is not configured (VITE_NEON_AUTH_URL).");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signin") {
        const result = await authClient.signIn.email({ email, password });
        setBusy(false);
        if (result.error) {
          setMessage(result.error.message ?? "Sign in failed");
          return;
        }
        void afterAuth();
        return;
      }
      const result = await authClient.signUp.email({
        email,
        password,
        name: name.trim() || email.split("@")[0] || "Trader",
      });
      setBusy(false);
      if (result.error) {
        setMessage(result.error.message ?? "Sign up failed");
        return;
      }
      if (result.data?.user || result.data?.session) void afterAuth();
      else setMessage("Check your email to confirm your account, then sign in.");
    } catch (e) {
      setBusy(false);
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <BellLogo />
        <div>
          <p className="eyebrow">Gift boxes · BSC</p>
          <h1>Wrap a stock. They unwrap it.</h1>
          <p>
            Sign in to compose session-honest gifts. Neon Auth + httpOnly desk cookies — no secrets
            in localStorage.
          </p>
        </div>
        <Bell className="auth-watermark" />
      </section>
      <section className="auth-form-wrap">
        <form className="panel auth-form" onSubmit={submit}>
          <span className="kicker">Your desk</span>
          <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
          <p>Email sign-in via Neon Managed Better Auth — then wrap your first gift.</p>
          {!neonAuthConfigured() && (
            <p className="form-message" role="alert">
              VITE_NEON_AUTH_URL is missing — connect Neon Marketplace on Vercel (Bell).
            </p>
          )}
          {mode === "signup" && (
            <label>
              Display name
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Desk name"
              />
            </label>
          )}
          <label>
            Email
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@example.com"
            />
          </label>
          <label>
            Password
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}
          <Button className="w-full" disabled={busy || !neonAuthConfigured()}>
            <Mail />
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
          <button
            type="button"
            className="auth-switch"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin"
              ? "New to BELL? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
