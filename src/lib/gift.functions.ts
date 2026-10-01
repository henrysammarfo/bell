/**
 * BELL Gift Box — session-honest wrap + claim-link gifts.
 * Payer wraps; receiver claims. Never invents tx hashes.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { requireNeonAuth } from "@/integrations/neon/auth-middleware";
import { getNeonSql } from "@/integrations/neon/db";
import { evaluateSessionGate } from "@/lib/adapters/session-gate";
import { quoteAndSimulate } from "@/lib/adapters/binance-trading";
import { agenticMarketSwap, getAgenticWalletStatus } from "@/lib/adapters/agentic-wallet";
import { publicClaimUrl } from "@/lib/gift-code";

const WrapInput = z.object({
  ticker: z.string().trim().toUpperCase().min(1).max(16),
  amountUsdt: z.string().trim().min(1).max(32),
  note: z.string().trim().max(280).default(""),
  recipientLabel: z.string().trim().max(80).default(""),
  gapMode: z.boolean().default(false),
  gapAcknowledged: z.boolean().default(false),
  /** When true, attempt Agentic Wallet swap to fund the gift. */
  fundWithWallet: z.boolean().default(false),
});

const ClaimInput = z.object({
  claimCode: z.string().trim().min(12).max(64),
  claimerAddress: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, "claimerAddress must be a 0x EVM address"),
});

function mintClaimCode(): string {
  return randomBytes(18).toString("base64url");
}

function publicOrigin(): string {
  return (
    process.env["BELL_PUBLIC_ORIGIN"]?.trim() ||
    process.env["VITE_APP_URL"]?.trim() ||
    "https://bell.vercel.app"
  );
}

export const previewGiftGate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ticker: z.string().trim().min(1).max(16),
        gapMode: z.boolean().default(false),
        gapAcknowledged: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const gate = await evaluateSessionGate({
      ticker: data.ticker,
      gapMode: data.gapMode,
      gapAcknowledged: data.gapAcknowledged,
    });
    if (!gate.ok) {
      return {
        ok: false as const,
        reason: gate.reason,
        detail: gate.detail,
        mode: "unavailable" as const,
      };
    }
    return {
      ok: true as const,
      mode: gate.data.mode,
      decision: gate.data.decision,
      sessionLabel: gate.data.sessionLabel,
      gapLabel: gate.data.gapLabel,
      reasons: gate.data.reasons,
      symbol: gate.data.symbol,
      contractAddress: gate.data.contractAddress,
      dynamic: gate.data.dynamic,
    };
  });

/** Wrap a gift after session gate + quote. Auth required (payer). */
export const wrapGiftBox = createServerFn({ method: "POST" })
  .middleware([requireNeonAuth])
  .inputValidator((input: unknown) => WrapInput.parse(input))
  .handler(async ({ data, context }) => {
    const gate = await evaluateSessionGate({
      ticker: data.ticker,
      gapMode: data.gapMode,
      gapAcknowledged: data.gapAcknowledged,
    });
    if (!gate.ok) {
      return {
        ok: false as const,
        reason: gate.reason,
        detail: gate.detail,
        mode: "unavailable" as const,
      };
    }
    if (gate.data.decision === "DENY") {
      return {
        ok: false as const,
        reason: "gate_deny",
        detail: gate.data.reasons.join(" "),
        mode: "unavailable" as const,
        sessionLabel: gate.data.sessionLabel,
        gapLabel: gate.data.gapLabel,
      };
    }

    const sim = await quoteAndSimulate({
      ticker: data.ticker,
      amountUsdt: data.amountUsdt,
      contractAddress: gate.data.contractAddress,
      symbol: gate.data.symbol,
      referencePrice: gate.data.dynamic?.referencePrice ?? null,
      tokenPrice: gate.data.dynamic?.tokenPrice ?? null,
    });
    if (!sim.ok) {
      return {
        ok: false as const,
        reason: sim.reason,
        detail: sim.detail,
        mode: sim.mode,
      };
    }

    let wrapTxHash: string | null = null;
    let wrapDetail = `${sim.data.mode} · ${sim.data.detail}`;
    let status: "ready" | "wrapped" = "ready";

    if (data.fundWithWallet && gate.data.contractAddress) {
      const funded = await agenticMarketSwap({
        amountUsdt: data.amountUsdt,
        toTokenAddress: gate.data.contractAddress,
        symbol: gate.data.symbol ?? data.ticker,
      });
      if (funded.ok) {
        wrapTxHash = funded.data.txHash;
        wrapDetail = funded.data.detail;
        status = "wrapped";
      } else {
        wrapDetail = `Quote ok · fund deferred (${funded.reason}: ${funded.detail})`;
      }
    }

    const claimCode = mintClaimCode();
    const sql = getNeonSql();
    const rows = await sql`
      INSERT INTO public.gift_boxes (
        claim_code, sender_user_id, ticker, symbol, contract_address,
        amount_usdt, note, recipient_label,
        gate_decision, session_label, gap_label, gap_mode, gap_acknowledged,
        status, quote_json, wrap_detail, wrap_tx_hash
      )
      VALUES (
        ${claimCode},
        ${context.userId},
        ${data.ticker},
        ${gate.data.symbol},
        ${gate.data.contractAddress},
        ${data.amountUsdt},
        ${data.note},
        ${data.recipientLabel},
        ${gate.data.decision},
        ${gate.data.sessionLabel},
        ${gate.data.gapLabel},
        ${data.gapMode},
        ${data.gapAcknowledged},
        ${status},
        ${JSON.stringify({
          expectedOut: sim.data.expectedOut,
          referenceLabel: sim.data.referenceLabel,
          priceImpact: sim.data.priceImpact,
          networkFee: sim.data.networkFee,
          mode: sim.data.mode,
        })}::jsonb,
        ${wrapDetail},
        ${wrapTxHash}
      )
      RETURNING id, claim_code, status, created_at
    `;
    const row = rows[0];
    if (!row) {
      return {
        ok: false as const,
        reason: "gift_insert_failed",
        detail: "Could not persist gift box",
        mode: "unavailable" as const,
      };
    }

    await sql`
      INSERT INTO public.activity_history (
        user_id, event_type, symbol, amount, state, detail
      )
      VALUES (
        ${context.userId},
        ${"gift_wrap"},
        ${data.ticker},
        ${data.amountUsdt},
        ${status === "wrapped" ? "Wrapped" : "Gift ready"},
        ${`Gift for ${data.recipientLabel || "someone"} · ${gate.data.sessionLabel}`}
      )
    `;

    const claimUrl = publicClaimUrl(publicOrigin(), claimCode);
    return {
      ok: true as const,
      mode: sim.data.mode,
      giftId: String(row.id),
      claimCode,
      claimUrl,
      status,
      wrapTxHash,
      wrapDetail,
      expectedOut: sim.data.expectedOut,
      sessionLabel: gate.data.sessionLabel,
      gapLabel: gate.data.gapLabel,
      symbol: gate.data.symbol ?? data.ticker,
    };
  });

/** Public peek — no auth. Does not reveal sender user id. */
export const peekGiftBox = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ claimCode: z.string().trim().min(12).max(64) }).parse(input),
  )
  .handler(async ({ data }) => {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT
        ticker, symbol, amount_usdt, note, recipient_label,
        session_label, gap_label, gap_mode, status,
        quote_json, wrap_detail, wrap_tx_hash, claim_tx_hash,
        claimer_address, created_at, claimed_at
      FROM public.gift_boxes
      WHERE claim_code = ${data.claimCode}
      LIMIT 1
    `;
    const g = rows[0];
    if (!g) {
      return { ok: false as const, reason: "not_found", detail: "No gift for this link" };
    }
    const fingerprint = createHash("sha256")
      .update(data.claimCode)
      .digest("hex")
      .slice(0, 10);
    return {
      ok: true as const,
      gift: {
        ticker: String(g.ticker),
        symbol: (g.symbol as string | null) ?? String(g.ticker),
        amountUsdt: String(g.amount_usdt),
        note: String(g.note ?? ""),
        recipientLabel: String(g.recipient_label ?? ""),
        sessionLabel: String(g.session_label),
        gapLabel: String(g.gap_label),
        gapMode: Boolean(g.gap_mode),
        status: String(g.status),
        wrapDetail: String(g.wrap_detail ?? ""),
        wrapTxHash: (g.wrap_tx_hash as string | null) ?? null,
        claimTxHash: (g.claim_tx_hash as string | null) ?? null,
        claimerAddress: (g.claimer_address as string | null) ?? null,
        createdAt: String(g.created_at),
        claimedAt: g.claimed_at ? String(g.claimed_at) : null,
        quote: g.quote_json,
        fingerprint,
      },
    };
  });

/**
 * Claim gift into a wallet address.
 * If funded/wrapped + Agentic Wallet online → attempt send.
 * Else mark claimed intent honestly (claimer recorded, send pending).
 */
export const claimGiftBox = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ClaimInput.parse(input))
  .handler(async ({ data }) => {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT id, status, contract_address, amount_usdt, ticker, symbol, wrap_tx_hash
      FROM public.gift_boxes
      WHERE claim_code = ${data.claimCode}
      LIMIT 1
    `;
    const g = rows[0];
    if (!g) {
      return { ok: false as const, reason: "not_found", detail: "No gift for this link" };
    }
    if (String(g.status) === "claimed") {
      return {
        ok: false as const,
        reason: "already_claimed",
        detail: "This gift was already unwrapped",
      };
    }
    if (String(g.status) === "gated_deny" || String(g.status) === "expired") {
      return {
        ok: false as const,
        reason: "unclaimable",
        detail: `Gift status ${g.status}`,
      };
    }

    const wallet = await getAgenticWalletStatus();
    let claimTxHash: string | null = null;
    let detail =
      "Claim recorded. Sender must complete funded wrap + address-book send via Agentic Wallet — no fake hash.";

    // Honest path: we do not invent a transfer. If wallet connected and gift was funded,
    // attempt send (recipient must be in address book per Binance rules).
    if (wallet.connected && g.contract_address && String(g.status) === "wrapped") {
      const { spawn } = await import("node:child_process");
      const baw = process.env["BELL_BAW_BIN"]?.trim() || "baw";
      const sendResult = await new Promise<{ ok: boolean; text: string }>((resolve) => {
        const child = spawn(
          baw,
          [
            "wallet",
            "send",
            "--amount",
            String(g.amount_usdt),
            "--recipient",
            data.claimerAddress,
            "--binanceChainId",
            "56",
            "--tokenAddress",
            String(g.contract_address),
            "--json",
          ],
          { env: process.env, stdio: ["ignore", "pipe", "pipe"] },
        );
        let out = "";
        let err = "";
        const t = setTimeout(() => {
          child.kill("SIGTERM");
          resolve({ ok: false, text: "send timeout" });
        }, 90_000);
        child.stdout.on("data", (d) => {
          out += String(d);
        });
        child.stderr.on("data", (d) => {
          err += String(d);
        });
        child.on("close", () => {
          clearTimeout(t);
          resolve({ ok: true, text: out || err });
        });
        child.on("error", (e) => {
          clearTimeout(t);
          resolve({ ok: false, text: e.message });
        });
      });
      try {
        const json = JSON.parse(sendResult.text) as {
          success?: boolean;
          data?: { txHash?: string };
          error?: { message?: string };
        };
        if (json.success && json.data?.txHash) {
          claimTxHash = json.data.txHash;
          detail = `Agentic Wallet send submitted · pending confirmation · ${claimTxHash}`;
        } else {
          detail = `Send not completed: ${json.error?.message ?? sendResult.text.slice(0, 200)}. Recipient may need address-book entry in Binance Wallet. Claim still recorded.`;
        }
      } catch {
        detail = `Send path unavailable (${sendResult.text.slice(0, 160)}). Claim recorded without invented hash.`;
      }
    }

    await sql`
      UPDATE public.gift_boxes
      SET status = ${"claimed"},
          claimer_address = ${data.claimerAddress},
          claim_tx_hash = ${claimTxHash},
          wrap_detail = ${detail},
          claimed_at = now(),
          updated_at = now()
      WHERE claim_code = ${data.claimCode}
    `;

    return {
      ok: true as const,
      status: "claimed" as const,
      claimTxHash,
      explorerUrl: claimTxHash ? `https://bscscan.com/tx/${claimTxHash}` : null,
      detail,
      mode: claimTxHash ? ("broadcast" as const) : ("unavailable" as const),
      ticker: String(g.ticker),
      symbol: (g.symbol as string | null) ?? String(g.ticker),
    };
  });

export const listMyGifts = createServerFn({ method: "GET" })
  .middleware([requireNeonAuth])
  .handler(async ({ context }) => {
    const sql = getNeonSql();
    return sql`
      SELECT
        id, claim_code, ticker, symbol, amount_usdt, recipient_label,
        status, session_label, created_at, claimed_at, wrap_tx_hash, claim_tx_hash
      FROM public.gift_boxes
      WHERE sender_user_id = ${context.userId}
      ORDER BY created_at DESC
      LIMIT 40
    `;
  });
