#!/usr/bin/env node
/**
 * Naplní veřejný seznam členů testovacími daty (convex/lib/seedMembers.ts).
 *
 * Volá interní mutace přes `npx convex run` — CLI má admin přístup, takže
 * seed nepotřebuje vlastní autentizaci ani veřejnou mutaci, kterou by šlo
 * zvenčí zneužít. Idempotentní: klíčem je členské číslo.
 *
 *   node scripts/seed-members.mjs [--reset] [--prod]
 */
import { execFileSync } from "node:child_process";

const prod = process.argv.includes("--prod");
const reset = process.argv.includes("--reset");

function run(fnName) {
  const argv = ["convex", "run", fnName, "{}"];
  if (prod) argv.push("--prod");
  return execFileSync("npx", argv, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

if (prod) {
  console.log("POZOR: zapisuje se na PRODUKČNÍ nasazení.");
}

if (reset) {
  const out = run("seed:seedMembersReset");
  console.log(`✓ smazáno ${out}`);
} else {
  const out = run("seed:seedMembers");
  console.log(`✓ ${out}`);
}
