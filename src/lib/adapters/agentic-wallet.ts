/**
 * Binance Agentic Wallet (`baw` CLI) bridge for BELL broadcast.
 * Never invents tx hashes — polls market-order list until FINISHED/FAILED.
 */
import { spawn } from "node:child_process";
import { errResult, okResult, type AdapterResult } from "./types";
import { BSC_CHAIN_ID } from "./rwa-endpoints";

const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";

export type AgenticStatus = {
  connected: boolean;
  address: string | null;
  detail: string;
};

function bawBin(): string {
  return process.env["BELL_BAW_BIN"]?.trim() || "baw";
}

async function runBaw(args: string[], timeoutMs = 120_000): Promise<{
  ok: boolean;
  json: unknown;
  stderr: string;
  code: number | null;
}> {
  return new Promise((resolve) => {
    const child = spawn(bawBin(), [...args, "--json"], {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({ ok: false, json: null, stderr: stderr || "baw timeout", code: null });
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += String(d);
    });
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ ok: false, json: null, stderr: e.message, code: null });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      let json: unknown = null;
      try {
        json = JSON.parse(stdout.trim() || "{}") as unknown;
      } catch {
        json = { raw: stdout.slice(0, 800) };
      }
      resolve({ ok: code === 0, json, stderr, code });
    });
  });
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

export async function getAgenticWalletStatus(): Promise<AgenticStatus> {
  const status = await runBaw(["wallet", "status"], 30_000);
  const root = asRecord(status.json);
  const data = asRecord(root?.["data"]);
  const st = String(data?.["status"] ?? "");
  if (!status.ok && /not found|ENOENT/i.test(status.stderr)) {
    return {
      connected: false,
      address: null,
      detail: "baw CLI not installed — npm i -g @binance/agentic-wallet@1.10.0",
    };
  }
  if (st !== "CONNECTED" && st !== "ALREADY_CONNECTED") {
    return {
      connected: false,
      address: null,
      detail: `Agentic Wallet ${st || "UNCONNECTED"} — run baw auth signin`,
    };
  }
  const addrRes = await runBaw(["wallet", "address"], 30_000);
  const addrRoot = asRecord(addrRes.json);
  const addrData = asRecord(addrRoot?.["data"]);
  const address =
    (typeof addrData?.["address"] === "string" && addrData["address"]) ||
    (typeof addrData?.["walletAddress"] === "string" && addrData["walletAddress"]) ||
    null;
  return {
    connected: true,
    address,
    detail: address ? `Connected ${address}` : "Connected (address unavailable)",
  };
}

export async function agenticMarketSwap(opts: {
  amountUsdt: string;
  toTokenAddress: string;
  symbol?: string | null;
}): Promise<
  AdapterResult<{
    mode: "broadcast";
    txHash: string;
    explorerUrl: string;
    orderId: string;
    detail: string;
  }>
> {
  const status = await getAgenticWalletStatus();
  if (!status.connected) {
    return errResult("bell.broadcast", "agentic_wallet_not_connected", status.detail);
  }

  const amount = opts.amountUsdt.trim();
  if (!amount || Number(amount) <= 0) {
    return errResult("bell.broadcast", "invalid_amount", "amountUsdt must be positive");
  }
  if (!opts.toTokenAddress) {
    return errResult("bell.broadcast", "missing_contract", "toTokenAddress required");
  }

  // Quote first (no execution)
  const quote = await runBaw(
    [
      "market-order",
      "quote",
      "--fromTokenQty",
      amount,
      "--fromToken",
      USDT_BSC,
      "--toToken",
      opts.toTokenAddress,
      "--binanceChainId",
      BSC_CHAIN_ID,
    ],
    60_000,
  );
  const quoteRoot = asRecord(quote.json);
  if (!quoteRoot?.["success"]) {
    const err = asRecord(quoteRoot?.["error"]);
    return errResult(
      "bell.broadcast",
      "agentic_quote_failed",
      String(err?.["message"] ?? quote.stderr ?? "market-order quote failed"),
    );
  }

  // Explicit broadcast — only after BELL gate + user confirmBroadcast
  const swap = await runBaw(
    [
      "market-order",
      "swap",
      "--fromTokenQty",
      amount,
      "--fromToken",
      USDT_BSC,
      "--toToken",
      opts.toTokenAddress,
      "--binanceChainId",
      BSC_CHAIN_ID,
    ],
    120_000,
  );
  const swapRoot = asRecord(swap.json);
  if (!swapRoot?.["success"]) {
    const err = asRecord(swapRoot?.["error"]);
    return errResult(
      "bell.broadcast",
      "agentic_swap_failed",
      String(err?.["message"] ?? swap.stderr ?? "market-order swap failed"),
    );
  }
  const swapData = asRecord(swapRoot["data"]);
  const orderId = String(swapData?.["orderId"] ?? "");
  if (!orderId) {
    return errResult(
      "bell.broadcast",
      "agentic_swap_no_order",
      "Swap submitted without orderId — refuse to invent hash",
    );
  }

  // Poll until terminal — orderId ≠ completed swap
  let txHash: string | null = null;
  let terminal = "";
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const list = await runBaw(["market-order", "list", "--orderId", orderId], 60_000);
    const listRoot = asRecord(list.json);
    const listData = asRecord(listRoot?.["data"]);
    const rows = Array.isArray(listData?.["list"])
      ? (listData["list"] as unknown[])
      : listData
        ? [listData]
        : [];
    const row = asRecord(rows[0]);
    const st = String(row?.["status"] ?? "");
    const hash = typeof row?.["txHash"] === "string" ? row["txHash"] : null;
    if (st === "FINISHED") {
      terminal = st;
      txHash = hash;
      break;
    }
    if (st === "FAILED") {
      return errResult(
        "bell.broadcast",
        "agentic_swap_failed_onchain",
        `orderId ${orderId} FAILED · txHash=${hash ?? "null"}`,
      );
    }
  }

  if (!txHash) {
    return errResult(
      "bell.broadcast",
      "agentic_swap_pending",
      `orderId ${orderId} not FINISHED yet (status=${terminal || "PENDING"}) — no fake hash`,
    );
  }

  return okResult("broadcast", "bell.broadcast", {
    mode: "broadcast",
    txHash,
    explorerUrl: `https://bscscan.com/tx/${txHash}`,
    orderId,
    detail: `Agentic Wallet market-order FINISHED · ${opts.symbol ?? "token"} · ${amount} USDT`,
  });
}
