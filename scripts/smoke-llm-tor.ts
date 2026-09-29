/**
 * Smoke AgentRouter via Tor (or relay). Expect: smoke_llm_tor_ok
 * Usage: bun run scripts/smoke-llm-tor.ts
 */
import { liveChat, getAgentRouterKey } from "../src/lib/llm/agent-router";

async function main() {
  const key = getAgentRouterKey();
  const relay = process.env["BELL_LLM_RELAY_URL"]?.trim();
  console.log("key", key ? "present" : "absent");
  console.log("tor", process.env["AGENTROUTER_USE_TOR"] ?? "0");
  console.log("relay", relay ? "set" : "unset");
  console.log("model", process.env["BELL_LLM_MODEL"] ?? "deepseek-v4-flash");

  if (process.env["AGENTROUTER_USE_TOR"] === "1") {
    try {
      const ip = await fetch("https://api.ipify.org", {
        // @ts-expect-error — debug only; Tor path uses socks in liveChat
      }).catch(() => null);
      void ip;
      console.log("tor socks", process.env["AGENTROUTER_TOR_SOCKS"] ?? "socks5h://127.0.0.1:9050");
    } catch {
      /* ignore */
    }
  }

  const r = await liveChat({
    user: 'Reply with exactly: {"pong":true}',
    maxTokens: 32,
  });
  console.log(JSON.stringify(r).slice(0, 400));
  if (!r.ok) {
    console.error("smoke_llm_failed");
    process.exit(1);
  }
  console.log("provider agentrouter model", r.model, "path", r.path);
  console.log("smoke_llm_tor_ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
