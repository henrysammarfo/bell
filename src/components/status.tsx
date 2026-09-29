import type { SessionState } from "@/lib/bell-data";
import { CircleCheck, CircleX, PauseCircle, TriangleAlert } from "lucide-react";

export function SessionBadge({ state }: { state: SessionState }) {
  const C =
    state === "open"
      ? CircleCheck
      : state === "closed"
        ? CircleX
        : state === "gap"
          ? TriangleAlert
          : PauseCircle;
  return (
    <span className={`session-badge session-${state}`}>
      <C />
      {state}
    </span>
  );
}

export function MetaRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="meta-row">
      <span>{label}</span>
      <strong className={mono ? "font-mono" : ""}>{value}</strong>
    </div>
  );
}

export function ModeBadge({ mode }: { mode: string }) {
  return <span className="mode-badge">{mode}</span>;
}
