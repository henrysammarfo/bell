/**
 * Cloudflare Worker (or similar) clean-egress relay for AgentRouter.
 * Deploy separately; set BELL_LLM_RELAY_URL=https://YOUR_WORKER/v1 on Vercel.
 *
 * Env on worker: AGENTROUTER_API_KEY, optional RELAY_SHARED_SECRET
 */

export interface Env {
  AGENTROUTER_API_KEY: string;
  RELAY_SHARED_SECRET?: string;
}

const UPSTREAM = "https://agentrouter.org/v1/chat/completions";

function stainless(key: string): HeadersInit {
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
    "x-stainless-runtime-version": "worker",
    "x-stainless-retry-count": "0",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
        },
      });
    }
    if (!url.pathname.endsWith("/chat/completions")) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
      });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "method_not_allowed" }), {
        status: 405,
      });
    }
    if (env.RELAY_SHARED_SECRET) {
      const auth = request.headers.get("Authorization") ?? "";
      if (auth !== `Bearer ${env.RELAY_SHARED_SECRET}`) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
        });
      }
    }
    if (!env.AGENTROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "relay_misconfigured" }), {
        status: 500,
      });
    }
    const body = await request.text();
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: stainless(env.AGENTROUTER_API_KEY),
      body,
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
