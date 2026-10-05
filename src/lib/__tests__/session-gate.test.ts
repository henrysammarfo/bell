import { describe, expect, it } from "vitest";
import { decideGate, DEFAULT_TOXIC_GAP_PCT } from "../adapters/session-gate";
import { computeGapPct, formatGapPct } from "../adapters/rwa-dynamic";
import { evaluateCashSession } from "../adapters/cash-session";

describe("computeGapPct", () => {
  it("computes positive and negative gaps", () => {
    expect(computeGapPct(110, 100)).toBeCloseTo(10);
    expect(computeGapPct(90, 100)).toBeCloseTo(-10);
  });
  it("returns null when inputs missing", () => {
    expect(computeGapPct(null, 100)).toBeNull();
    expect(computeGapPct(100, null)).toBeNull();
    expect(computeGapPct(100, 0)).toBeNull();
  });
  it("formats gap labels", () => {
    expect(formatGapPct(1.84)).toBe("+1.84%");
    expect(formatGapPct(-0.42)).toBe("-0.42%");
    expect(formatGapPct(null)).toBe("n/a");
  });
});

describe("decideGate", () => {
  it("ALLOW when cash open and gap fine", () => {
    const r = decideGate({
      cashOpen: true,
      assetHalted: false,
      gapPct: 0.5,
      toxicGapPct: DEFAULT_TOXIC_GAP_PCT,
      gapMode: false,
      gapAcknowledged: false,
      rwaMarketStatus: "open",
    });
    expect(r.decision).toBe("ALLOW");
    expect(r.sessionLabel).toBe("open");
  });

  it("DENY when cash closed without gap mode", () => {
    const r = decideGate({
      cashOpen: false,
      assetHalted: false,
      gapPct: 0.1,
      toxicGapPct: DEFAULT_TOXIC_GAP_PCT,
      gapMode: false,
      gapAcknowledged: false,
      rwaMarketStatus: "overnight",
    });
    expect(r.decision).toBe("DENY");
    expect(r.sessionLabel).toBe("closed");
  });

  it("DENY on toxic gap even if cash open unless gap mode", () => {
    const r = decideGate({
      cashOpen: true,
      assetHalted: false,
      gapPct: 5,
      toxicGapPct: DEFAULT_TOXIC_GAP_PCT,
      gapMode: false,
      gapAcknowledged: false,
      rwaMarketStatus: "open",
    });
    expect(r.decision).toBe("DENY");
  });

  it("ALLOW closed session only with gap mode + acknowledgement", () => {
    const r = decideGate({
      cashOpen: false,
      assetHalted: false,
      gapPct: 8,
      toxicGapPct: DEFAULT_TOXIC_GAP_PCT,
      gapMode: true,
      gapAcknowledged: true,
      rwaMarketStatus: "overnight",
    });
    expect(r.decision).toBe("ALLOW");
    expect(r.sessionLabel).toBe("gap");
  });

  it("DENY gap mode without acknowledgement", () => {
    const r = decideGate({
      cashOpen: false,
      assetHalted: false,
      gapPct: 8,
      toxicGapPct: DEFAULT_TOXIC_GAP_PCT,
      gapMode: true,
      gapAcknowledged: false,
      rwaMarketStatus: "overnight",
    });
    expect(r.decision).toBe("DENY");
  });

  it("DENY when asset halted", () => {
    const r = decideGate({
      cashOpen: true,
      assetHalted: true,
      gapPct: 0,
      toxicGapPct: DEFAULT_TOXIC_GAP_PCT,
      gapMode: true,
      gapAcknowledged: true,
      rwaMarketStatus: "open",
    });
    expect(r.decision).toBe("DENY");
    expect(r.sessionLabel).toBe("halted");
  });
});

describe("evaluateCashSession", () => {
  it("returns ok adapter shape", () => {
    const r = evaluateCashSession(new Date("2026-09-28T14:00:00Z")); // Mon 10:00 ET
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.nyWeekday).toBe("Mon");
      expect(r.data.open).toBe(true);
    }
  });

  it("marks weekend closed", () => {
    const r = evaluateCashSession(new Date("2026-09-26T18:00:00Z")); // Sat
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.open).toBe(false);
      expect(r.data.label.toLowerCase()).toContain("weekend");
    }
  });
});
