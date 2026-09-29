/**
 * AgentRouter gateway for BELL (VIGIL pattern).
 * Direct cloud egress often hits Aliyun WAF — use Tor SOCKS or BELL_LLM_RELAY_URL.
 * Host: https://agentrouter.org only. Never put key in VITE_*.
 */

import * as https from "node:https";
import { URL } from "node:url";

export type LiveChatResult =
  | { ok: true; text: string; model: string; path: string }
  | { ok: false; error: string; path?: string };

const AR_BASE = process.env["AGENTROUTER_BASE_URL"]?.trim() || "https://agentrouter.org/v1";

export function getAgentRouterKey(): string | null {
  return (
    process.env["AGENTROUTER_API_KEY"]?.trim() ||
    process.env["ANTHROPIC_AUTH_TOKEN"]?.trim() ||
    process.env["ANTHROPIC_API_KEY"]?.trim() ||
    null
  );
}

export function agentRouterConfigured(): boolean {
  return Boolean(getAgentRouterKey() || process.env["BELL_LLM_RELAY_URL"]?.trim());
}

function defaultModel(): string {
  return (
    process.env["BELL_LLM_MODEL"]?.trim() ||
    process.env["VIGIL_LLM_MODEL"]?.trim() ||
    "deepseek-v4-flash"
  );
}

/** Stainless / QwenCode headers — required by AgentRouter WAF heuristics. */
export function stainlessHeaders(key: string): Record<string, string> {
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "QwenCode/0.2.0 (linux; x64)",
    "x-stainless-lang": "js",
    "x-stainless-package-version": "6.34.0",
    "x-stainless-os": "Linux",
    "x-stainless-arch": "x64",
    "x-stainless-runtime": "node",
    "x-stainless-runtime-version": process.version,
    "x-stainless-retry-count": "0",
  };
}

function torEnabled(): boolean {
  const v = process.env["AGENTROUTER_USE_TOR"]?.trim();
  return v === "1" || v === "true";
}

function torSocks(): string {
  return process.env["AGENTROUTER_TOR_SOCKS"]?.trim() || "socks5h://127.0.0.1:9050";
}

async function postJsonViaFetch(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<{ status: number; text: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, text: await res.text() };
}

/** Node https + SocksProxyAgent — Bun undici must not be used for Tor. */
async function postJsonViaTor(
  urlStr: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<{ status: number; text: string }> {
  const { SocksProxyAgent } = await import("socks-proxy-agent");
  const agent = new SocksProxyAgent(torSocks());
  const url = new URL(urlStr);
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(payload),
        },
        agent,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            text: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function looksLikeWaf(text: string): boolean {
  const t = text.slice(0, 400).toLowerCase();
  return (
    t.includes("aliyun_waf") ||
    t.includes("<!doctype html") ||
    t.includes("access verification") ||
    t.includes("captcha")
  );
}

export async function liveChat(opts: {
  user: string;
  system?: string;
  model?: string;
  maxTokens?: number;
}): Promise<LiveChatResult> {
  const relay = process.env["BELL_LLM_RELAY_URL"]?.trim();
  const relayKey = process.env["BELL_LLM_RELAY_KEY"]?.trim() || getAgentRouterKey();
  const key = getAgentRouterKey();
  const model = opts.model ?? defaultModel();
  const messages = [
    ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
    { role: "user" as const, content: opts.user },
  ];
  const body = {
    model,
    temperature: 0.2,
    max_tokens: opts.maxTokens ?? 600,
    messages,
  };

  // Path 1: clean-egress relay (Vercel)
  if (relay) {
    if (!relayKey) {
      return {
        ok: false,
        error: "BELL_LLM_RELAY_URL set but no relay/AgentRouter key",
        path: "relay",
      };
    }
    try {
      const { status, text } = await postJsonViaFetch(
        `${relay.replace(/\/$/, "")}/chat/completions`,
        stainlessHeaders(relayKey),
        body,
      );
      if (looksLikeWaf(text)) {
        return { ok: false, error: "WAF_BLOCKED on relay", path: "relay" };
      }
      if (status >= 400) {
        return {
          ok: false,
          error: `relay HTTP ${status}: ${text.slice(0, 200)}`,
          path: "relay",
        };
      }
      const json = JSON.parse(text) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) {
        return { ok: false, error: "relay empty content", path: "relay" };
      }
      return { ok: true, text: content, model, path: "relay" };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        path: "relay",
      };
    }
  }

  if (!key) {
    return {
      ok: false,
      error: "AGENTROUTER_API_KEY missing and no BELL_LLM_RELAY_URL — fail closed (no mock brief)",
      path: "none",
    };
  }

  const url = `${AR_BASE.replace(/\/$/, "")}/chat/completions`;
  const pathLabel = torEnabled() ? "agentrouter+tor" : "agentrouter";

  try {
    const { status, text } = torEnabled()
      ? await postJsonViaTor(url, stainlessHeaders(key), body)
      : await postJsonViaFetch(url, stainlessHeaders(key), body);

    if (looksLikeWaf(text)) {
      return {
        ok: false,
        error:
          "WAF_BLOCKED — set AGENTROUTER_USE_TOR=1 with Tor SOCKS, or BELL_LLM_RELAY_URL for Vercel",
        path: pathLabel,
      };
    }
    if (status >= 400) {
      return {
        ok: false,
        error: `agentrouter HTTP ${status}: ${text.slice(0, 200)}`,
        path: pathLabel,
      };
    }
    const json = JSON.parse(text) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return { ok: false, error: "empty content", path: pathLabel };
    }
    return { ok: true, text: content, model, path: pathLabel };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      path: pathLabel,
    };
  }
}
