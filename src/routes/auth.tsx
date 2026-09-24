import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Mail } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { BellLogo } from "@/components/bell-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ next: typeof s["next"] === "string" && String(s["next"]).startsWith("/") ? String(s["next"]) : "/brief" }),
  head: () => ({ meta: [{ title: "Trader Access — BELL" }, { name: "description", content: "Sign in to save BELL trade briefs, watchlists, simulations, activity, and DX reports." }, { property: "og:title", content: "Trader Access — BELL" }, { property: "og:description", content: "Private, persistent BELL trader records." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) void navigate({ to: next }); }); }, [navigate, next]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const result = mode === "signin" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + next } });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (result.data.session) void navigate({ to: next });
    else setMessage("Check your email to confirm your account, then sign in.");
  }

  async function google() {
    sessionStorage.setItem("bell-auth-next", next);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) setMessage(result.error.message);
    else if (!result.redirected) void navigate({ to: next });
  }

  return <main className="auth-page"><section className="auth-brand"><BellLogo/><div><p className="eyebrow">Private trader workspace</p><h1>Keep every decision accountable.</h1><p>Your briefs, watchers, simulations, activity, and DX notes stay tied to your account.</p></div><Bell className="auth-watermark"/></section><section className="auth-form-wrap"><form className="panel auth-form" onSubmit={submit}><span className="kicker">Trader access</span><h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2><p>Continue with Google or use your email.</p><Button type="button" variant="outline" className="w-full" onClick={google}>G Continue with Google</Button><div className="auth-divider"><span>or</span></div><label>Email<Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="trader@example.com"/></label><label>Password<Input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>{message && <p className="form-message" role="status">{message}</p>}<Button className="w-full" disabled={busy}><Mail/>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</Button><button type="button" className="auth-switch" onClick={()=>setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "New to BELL? Create an account" : "Already have an account? Sign in"}</button></form></section></main>;
}
