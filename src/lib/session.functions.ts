import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  bellSessionClearCookieHeader,
  bellSessionSetCookieHeader,
  getSessionAuthStatus,
  mintBellSession,
  type TenantMembership,
} from "@/lib/auth/session";

async function ensurePersonalTenant(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<TenantMembership[]> {
  const { data: existing } = await supabase
    .from("tenant_members")
    .select("tenant_id, user_id, role, wallet_address, tenants(slug, display_name)")
    .eq("user_id", userId);

  if (existing && existing.length > 0) {
    return existing.map(
      (row: {
        tenant_id: string;
        user_id: string;
        role: "owner" | "trader" | "viewer";
        wallet_address: string | null;
        tenants: { slug: string; display_name: string } | null;
      }) => ({
        tenantId: row.tenant_id,
        userId: row.user_id,
        role: row.role,
        walletAddress: row.wallet_address,
        slug: row.tenants?.slug ?? null,
        displayName: row.tenants?.display_name ?? null,
      }),
    );
  }

  const slug = `desk-${userId.replace(/-/g, "").slice(0, 10)}`;
  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .insert({ slug, display_name: "Personal desk" })
    .select("id, slug, display_name")
    .single();
  if (tErr || !tenant) {
    // Table may not be migrated yet — fail closed with empty tenants
    return [];
  }
  const { error: mErr } = await supabase.from("tenant_members").insert({
    tenant_id: tenant.id,
    user_id: userId,
    role: "owner",
  });
  if (mErr) return [];
  return [
    {
      tenantId: tenant.id,
      userId,
      role: "owner",
      walletAddress: null,
      slug: tenant.slug,
      displayName: tenant.display_name,
    },
  ];
}

export const getBellSessionStatus = createServerFn({ method: "GET" }).handler(async () =>
  getSessionAuthStatus(),
);

/** Mint httpOnly bell_session after Supabase auth. */
export const mintHttpOnlySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenants = await ensurePersonalTenant(context.supabase, context.userId);
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
