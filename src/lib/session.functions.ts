import { createServerFn } from "@tanstack/react-start";
import { requireNeonAuth } from "@/integrations/neon/auth-middleware";
import { getNeonSql } from "@/integrations/neon/db";
import {
  bellSessionClearCookieHeader,
  bellSessionSetCookieHeader,
  getSessionAuthStatus,
  mintBellSession,
  type TenantMembership,
} from "@/lib/auth/session";

async function ensurePersonalTenant(userId: string): Promise<TenantMembership[]> {
  const sql = getNeonSql();

  const existing = await sql`
    SELECT
      m.tenant_id,
      m.user_id,
      m.role,
      m.wallet_address,
      t.slug,
      t.display_name
    FROM public.tenant_members m
    JOIN public.tenants t ON t.id = m.tenant_id
    WHERE m.user_id = ${userId}
  `;

  if (existing.length > 0) {
    return existing.map((row) => ({
      tenantId: String(row.tenant_id),
      userId: String(row.user_id),
      role: row.role as "owner" | "trader" | "viewer",
      walletAddress: (row.wallet_address as string | null) ?? null,
      slug: (row.slug as string | null) ?? null,
      displayName: (row.display_name as string | null) ?? null,
    }));
  }

  const slug = `desk-${userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`;
  const tenants = await sql`
    INSERT INTO public.tenants (slug, display_name)
    VALUES (${slug}, ${"Personal desk"})
    ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING id, slug, display_name
  `;
  const tenant = tenants[0];
  if (!tenant) return [];

  await sql`
    INSERT INTO public.tenant_members (tenant_id, user_id, role)
    VALUES (${tenant.id}, ${userId}, ${"owner"})
    ON CONFLICT DO NOTHING
  `;

  return [
    {
      tenantId: String(tenant.id),
      userId,
      role: "owner",
      walletAddress: null,
      slug: String(tenant.slug),
      displayName: String(tenant.display_name),
    },
  ];
}

export const getBellSessionStatus = createServerFn({ method: "GET" }).handler(async () =>
  getSessionAuthStatus(),
);

/** Mint httpOnly bell_session after Neon Auth. */
export const mintHttpOnlySession = createServerFn({ method: "POST" })
  .middleware([requireNeonAuth])
  .handler(async ({ context }) => {
    const tenants = await ensurePersonalTenant(context.userId);
    const minted = mintBellSession({
      userId: context.userId,
      tenants,
    });
    if (!minted.ok) {
      return {
        ok: false as const,
        reason: minted.reason,
        detail: minted.detail,
        setCookie: null as string | null,
      };
    }
    return {
      ok: true as const,
      session: minted.data.session,
      activeTenantId: minted.data.session.activeTenantId,
      setCookie: bellSessionSetCookieHeader(minted.data.cookieValue),
      persistence: "httpOnly-server" as const,
    };
  });

export const clearHttpOnlySession = createServerFn({ method: "POST" }).handler(async () => ({
  ok: true as const,
  setCookie: bellSessionClearCookieHeader(),
}));
