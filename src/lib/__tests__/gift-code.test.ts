import { describe, expect, it } from "vitest";
import { claimFingerprint, isValidClaimCode, publicClaimUrl } from "../gift-code";

describe("isValidClaimCode", () => {
  it("accepts base64url-ish codes of valid length", () => {
    expect(isValidClaimCode("abcdefghijkl")).toBe(true);
    expect(isValidClaimCode("abc_def-GHIJ0123")).toBe(true);
  });
  it("rejects short or dirty codes", () => {
    expect(isValidClaimCode("short")).toBe(false);
    expect(isValidClaimCode("has spaces!!!!")).toBe(false);
    expect(isValidClaimCode("")).toBe(false);
  });
});

describe("publicClaimUrl", () => {
  it("joins origin and code without double slash", () => {
    expect(publicClaimUrl("https://bell.vercel.app/", "abc123def456")).toBe(
      "https://bell.vercel.app/gift/claim/abc123def456",
    );
  });
});

describe("claimFingerprint", () => {
  it("is stable for the same code", () => {
    expect(claimFingerprint("abcdefghijkl")).toBe(claimFingerprint("abcdefghijkl"));
  });
});
