import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { evaluateSessionGate } from "@/lib/adapters/session-gate";
import { fetchRwaList, findByTicker } from "@/lib/adapters/rwa-list";
import { fetchRwaMarketStatus } from "@/lib/adapters/rwa-market-status";
import { fetchRwaDynamic, computeGapPct, formatGapPct } from "@/lib/adapters/rwa-dynamic";
import { fetchRwaAssetStatus } from "@/lib/adapters/rwa-asset-status";
import { evaluateCashSession } from "@/lib/adapters/cash-session";
import { BSC_CHAIN_ID } from "@/lib/adapters/rwa-endpoints";

const GateInput = z.object({
  ticker: z.string().trim().min(1).max(16),
  gapMode: z.boolean().default(false),
  gapAcknowledged: z.boolean().default(false),
  toxicGapPct: z.number().positive().max(50).optional(),
});

const TickerInput = z.object({
  ticker: z.string().trim().min(1).max(16),
});

export const getCashSession = createServerFn({ method: "GET" }).handler(async () =>
  evaluateCashSession(),
);

export const getRwaMarketStatus = createServerFn({ method: "GET" }).handler(async () =>
  fetchRwaMarketStatus(),
);

export const listBscMarkets = createServerFn({ method: "GET" }).handler(async () => {
  const cash = evaluateCashSession();
  const market = await fetchRwaMarketStatus();
  // bStocks central (type 3) — then Ondo (1) — then xStocks (2) if live on BSC
  const [bstock, ondo, xstock] = await Promise.all([
    fetchRwaList({ type: 3 }),
    fetchRwaList({ type: 1 }),
    fetchRwaList({ type: 2 }),
  ]);
  if (!bstock.ok && !ondo.ok && !xstock.ok) {
    return {
      ok: false as const,
      mode: "unavailable" as const,
      reason: bstock.reason,
      detail: bstock.detail,
      markets: [] as const,
    };
  }
  const items = [
    ...(bstock.ok ? bstock.data.items : []),
    ...(ondo.ok ? ondo.data.items : []),
    ...(xstock.ok ? xstock.data.items : []),
  ];
  // Dedupe by contract
  const seen = new Set<string>();
  const unique = items.filter((i) => {
    const k = `${i.chainId}:${i.contractAddress.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Enrich a curated slice — bStocks first so the gift desk surfaces Binance push assets
  const ordered = [
    ...unique.filter((i) => i.type === 3),
    ...unique.filter((i) => i.type === 1),
    ...unique.filter((i) => i.type !== 3 && i.type !== 1),
  ];
  const slice = ordered.slice(0, 24);
  const enriched = await Promise.all(
    slice.map(async (item) => {
      const [dyn, asset] = await Promise.all([
        fetchRwaDynamic({
          contractAddress: item.contractAddress,
          chainId: item.chainId,
        }),
        fetchRwaAssetStatus({
          contractAddress: item.contractAddress,
          chainId: item.chainId,
        }),
      ]);
      const gapPct = dyn.ok ? computeGapPct(dyn.data.tokenPrice, dyn.data.referencePrice) : null;
      const provider = item.type === 3 ? "bStocks" : item.type === 2 ? "xStocks" : "Ondo";
      let session: "open" | "closed" | "halted" = "closed";
      if (asset.ok && !asset.data.openState) session = "halted";
      else if (cash.ok && cash.data.open) session = "open";
      return {
        symbol: item.ticker,
        name: item.ticker,
        token: item.symbol,
        provider,
        contractAddress: item.contractAddress,
        chainId: item.chainId,
        price: dyn.ok && dyn.data.tokenPrice != null ? `$${dyn.data.tokenPrice.toFixed(2)}` : "—",
        referencePrice:
          dyn.ok && dyn.data.referencePrice != null
            ? `$${dyn.data.referencePrice.toFixed(2)}`
            : "—",
        gap: formatGapPct(gapPct),
        session,
        freshness: dyn.ok ? dyn.fetchedAt : "unavailable",
        mode: dyn.ok ? dyn.mode : ("unavailable" as const),
      };
    }),
  );

  return {
    ok: true as const,
    mode: "mainnet-read" as const,
    totalBsc: unique.length,
    counts: {
      bStocks: bstock.ok ? bstock.data.bscCount : 0,
      ondo: ondo.ok ? ondo.data.bscCount : 0,
      xStocks: xstock.ok ? xstock.data.bscCount : 0,
    },
    cashSession: cash.ok ? cash.data : null,
    rwaMarket: market.ok ? market.data : null,
    markets: enriched,
    chainId: BSC_CHAIN_ID,
  };
});

export const evaluateGate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GateInput.parse(input))
  .handler(async ({ data }) => evaluateSessionGate(data));

export const lookupTicker = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TickerInput.parse(input))
  .handler(async ({ data }) => {
    const list = await fetchRwaList();
    if (!list.ok) return list;
    const item = findByTicker(list.data.items, data.ticker);
    if (!item) {
      return {
        ok: false as const,
        mode: "unavailable" as const,
        source: "bell.lookup",
        reason: "ticker_not_on_bsc",
        detail: `No BSC match for ${data.ticker}`,
        fetchedAt: new Date().toISOString(),
      };
    }
    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      source: "bell.lookup",
      data: item,
      fetchedAt: new Date().toISOString(),
    };
  });
