#!/usr/bin/env node
/**
 * content-lint — hlídá zakázanou slovní zásobu (PRD § 8).
 *
 * Komora nesmí přebírat jazyk státu: žádné „licence", „certifikace",
 * „oprávnění", „registr pilotů", „povinné členství", „akreditace",
 * „garantujeme bezpečnost". Právní termín „oprávněný zájem" (GDPR)
 * je povolen přes allow-list.
 *
 * Spuštění: node scripts/content-lint.mjs  (součást `pnpm build`)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "content", "lib"];
const EXTENSIONS = new Set([".ts", ".tsx", ".mdx", ".md"]);

/** [pravidlo, popis, allow-list — výskyty, které pravidlu nevadí] */
const RULES = [
  [/licenc\w*/giu, "'licence' — komora žádné nevydává ani nezmiňuje", []],
  [/certifik\w*/giu, "'certifikace/certifikát' — zakázaný jazyk státu", []],
  [
    /oprávněn\w*/giu,
    "'oprávnění' — zakázaný jazyk státu",
    [/oprávněn(ý|ého|ému|ém|ým)\s+záj(em|m\w*)/giu],
  ],
  [/akredit\w*/giu, "'akreditace' — zakázaný jazyk státu", []],
  [/registru?\s+pilot\w*/giu, "'registr pilotů' — komora nevede registr", []],
  [
    /povinn(é|ého|ém|ým|á|ou)\s+členstv\w*/giu,
    "'povinné členství' — členství je dobrovolné",
    [],
  ],
  [
    /garantujeme\s+bezpečnost\w*/giu,
    "'garantujeme bezpečnost' — negarantujeme, standardizujeme",
    [],
  ],
];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      yield* walk(full);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

const findings = [];

for (const dir of SCAN_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split("\n");
    for (const [pattern, description, allow] of RULES) {
      lines.forEach((line, i) => {
        // tenhle skript sám obsahuje zakázaná slova v definicích pravidel
        if (file.endsWith("content-lint.mjs")) return;
        for (const match of line.matchAll(new RegExp(pattern))) {
          const allowed = allow.some((a) =>
            [...line.matchAll(new RegExp(a))].some(
              (m) =>
                m.index <= match.index &&
                match.index < m.index + m[0].length,
            ),
          );
          if (!allowed) {
            findings.push({
              file: path.relative(ROOT, file),
              line: i + 1,
              match: match[0],
              description,
            });
          }
        }
      });
    }
  }
}

if (findings.length > 0) {
  console.error(`content-lint: ${findings.length} nález(ů) zakázané slovní zásoby\n`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  „${f.match}"  → ${f.description}`);
  }
  console.error("\nViz PRD § 8 — tato slova na web nepatří. Přeformuluj.");
  process.exit(1);
}

console.log("content-lint: OK — žádná zakázaná slovní zásoba.");
