import { Link } from "@tanstack/react-router";

export function BellMark({ className = "h-8 w-8" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="currentColor"/><path d="M14 31h20l-3.1-4.2V20a6.9 6.9 0 0 0-5.1-6.7V11h-3.6v2.3a6.9 6.9 0 0 0-5.1 6.7v6.8L14 31Z" fill="var(--color-background)"/><path d="M20.4 34a4 4 0 0 0 7.2 0h-7.2Z" fill="var(--color-background)"/><path d="M30.9 26.8 34 31h-8.2l5.1-4.2Z" fill="var(--color-signal)"/></svg>;
}
export function BellLogo({ compact = false }: { compact?: boolean }) {
  return <Link to="/" aria-label="BELL home" className="inline-flex items-center gap-2.5 text-foreground"><BellMark className="h-8 w-8"/>{!compact && <span className="font-display text-[18px] font-semibold tracking-[.18em]">BELL</span>}</Link>;
}
