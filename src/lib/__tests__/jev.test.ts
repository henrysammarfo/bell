import { describe, expect, it } from "vitest";
import { parseJevGiftAnswers } from "../adapters/jev";

describe("parseJevGiftAnswers", () => {
  it("parses noul, choice, and score fields", () => {
    const j = parseJevGiftAnswers(
      {
        wrap_honest: { type: "noul", noul: 0.91 },
        gift_timing: {
          type: "choice",
          choice: "send_now",
          confidence: 0.8,
          probabilities: { send_now: 0.8, wait_for_open: 0.15, gap_ack_only: 0.05 },
        },
        freshness_risk: {
          type: "score",
          score: 0.2,
          confidence: 0.9,
          probabilities: { "0": 0.85, "1": 0.1, "2": 0.05 },
          legend: {
            "0": "Low — reference looks session-honest",
            "1": "Medium — watch overnight or mild gap",
            "2": "High — closed session or toxic gap risk",
          },
        },
      },
      { model: "typesafe/jev-1.13-test", cost: 0.00002 },
    );
    expect(j.wrapHonest).toBeCloseTo(0.91);
    expect(j.timing).toBe("send_now");
    expect(j.timingConfidence).toBeCloseTo(0.8);
    expect(j.freshnessRisk).toBeCloseTo(0.2);
    expect(j.freshnessLabel).toMatch(/Low/);
    expect(j.mode).toBe("live");
    expect(j.model).toContain("jev");
  });

  it("tolerates missing answers", () => {
    const j = parseJevGiftAnswers({});
    expect(j.wrapHonest).toBeNull();
    expect(j.timing).toBeNull();
    expect(j.freshnessRisk).toBeNull();
  });

  it("maps AI SDK boolean.probability to wrapHonest", () => {
    const j = parseJevGiftAnswers(
      {
        wrap_honest: { type: "boolean", probability: 0.88 },
        gift_timing: { type: "choice", choice: "wait_for_open", confidence: 0.7 },
        freshness_risk: { type: "score", score: 2 },
      },
      { provider: "vercel-ai-gateway" },
    );
    expect(j.wrapHonest).toBeCloseTo(0.88);
    expect(j.timing).toBe("wait_for_open");
    expect(j.freshnessLabel).toMatch(/High/);
    expect(j.provider).toBe("vercel-ai-gateway");
  });
});
