/**
 * Apply BELL Neon schema (idempotent). Usage:
 *   set -a && source .env.local && set +a && bun run scripts/apply-neon-schema.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const url = process.env["DATABASE_URL"]?.trim();
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = neon(url);
const schemaPath = resolve(
  import.meta.dir,
  "../supabase/migrations/20260929120000_bell_tenants.sql",
);
const schema = readFileSync(schemaPath, "utf8");

/** Split on semicolons that end statements (not inside comments). */
function splitStatements(raw: string): string[] {
  const noBlock = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  const lines = noBlock
    .split("\n")
    .map((l) => (l.trimStart().startsWith("--") ? "" : l))
    .join("\n");
  return lines
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const statements = splitStatements(schema);
console.log(`Applying ${statements.length} statements from ${schemaPath}`);

let ok = 0;
for (const stmt of statements) {
  try {
    await sql.query(stmt);
    ok++;
    console.log("OK", stmt.slice(0, 72).replace(/\s+/g, " "));
  } catch (e) {
    console.error("FAIL", stmt.slice(0, 72).replace(/\s+/g, " "));
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

const tables = await sql`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY 1
`;
console.log({ ok, tables: tables.map((t) => t.tablename) });
