import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BELL_SESSION_COOKIE,
  getSessionAuthStatus,
  mintBellSession,
  parseBellSessionCookie,
  resolveActiveTenantId,
  type TenantMembership,
} from "../auth/session";

const tenantA: TenantMembership = {
  tenantId: "11111111-1111-1111-1111-111111111111",
  userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  role: "owner",
  walletAddress: null,
  slug: "alpha",
  displayName: "Alpha Desk",
};

const tenantB: TenantMembership = {
  tenantId: "22222222-2222-2222-2222-222222222222",
  userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  role: "trader",
  walletAddress: null,
  slug: "beta",
  displayName: "Beta Desk",
};

describe("bell session cookie", () => {
  const prev = process.env["BELL_SESSION_SECRET"];

  beforeEach(() => {
    delete process.env["BELL_SESSION_SECRET"];
  });

  afterEach(() => {
    if (prev == null) delete process.env["BELL_SESSION_SECRET"];
    else process.env["BELL_SESSION_SECRET"] = prev;
  });

  it("fail-closes without session secret", () => {
    const auth = getSessionAuthStatus();
    expect(auth.ok).toBe(false);
  });

  it("mints and verifies httpOnly cookie when secret present", () => {
    process.env["BELL_SESSION_SECRET"] = "test-session-secret-32b";
    const minted = mintBellSession({
      userId: tenantA.userId,
      tenants: [tenantA, tenantB],
      activeTenantId: tenantB.tenantId,
    });
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    expect(minted.data.session.activeTenantId).toBe(tenantB.tenantId);

    const parsed = parseBellSessionCookie(`${BELL_SESSION_COOKIE}=${minted.data.cookieValue}`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.userId).toBe(tenantA.userId);
    expect(resolveActiveTenantId(parsed.data)).toBe(tenantB.tenantId);
  });

  it("rejects bad signature", () => {
    process.env["BELL_SESSION_SECRET"] = "test-session-secret-32b";
    const minted = mintBellSession({ userId: tenantA.userId, tenants: [tenantA] });
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    const parsed = parseBellSessionCookie(
      `${BELL_SESSION_COOKIE}=${minted.data.cookieValue}tampered`,
    );
    expect(parsed.ok).toBe(false);
  });

  it("never invents active tenant outside membership", () => {
    process.env["BELL_SESSION_SECRET"] = "test-session-secret-32b";
    const minted = mintBellSession({
      userId: tenantA.userId,
      tenants: [tenantA],
      activeTenantId: "99999999-9999-9999-9999-999999999999",
    });
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    expect(minted.data.session.activeTenantId).toBe(tenantA.tenantId);
  });
});
