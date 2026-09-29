import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cached: NeonQueryFunction<false, false> | null = null;

/** Server-only Neon SQL client (DATABASE_URL). Fail closed if unset. */
export function getNeonSql(): NeonQueryFunction<false, false> {
  if (cached) return cached;
  const url = process.env["DATABASE_URL"]?.trim();
  if (!url) {
    throw new Error("DATABASE_URL missing — connect Neon on Vercel Marketplace (Bell project)");
  }
  cached = neon(url);
  return cached;
}
