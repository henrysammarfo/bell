import type { SessionState } from "@/lib/bell-data";
import { CircleCheck, CircleX, PauseCircle } from "lucide-react";
export function SessionBadge({ state }: { state: SessionState }) { const C=state==="open"?CircleCheck:state==="closed"?CircleX:PauseCircle; return <span className={`session-badge session-${state}`}><C/>{state}</span>; }
export function MetaRow({ label, value, mono=false }: { label:string; value:string; mono?:boolean }) { return <div className="meta-row"><span>{label}</span><strong className={mono?"font-mono":""}>{value}</strong></div>; }
