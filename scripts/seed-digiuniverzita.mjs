#!/usr/bin/env node
/**
 * Nahraje `content/digiuniverzita/*.json` do Convexu.
 *
 * Volá interní mutace přes `npx convex run` — CLI má admin přístup, takže
 * seed nepotřebuje vlastní autentizaci ani veřejnou mutaci, kterou by šlo
 * zvenčí zneužít. Idempotentní: klíčem je slug, opakované spuštění jen
 * aktualizuje.
 *
 *   node scripts/seed-digiuniverzita.mjs [--prod]
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const prod = process.argv.includes("--prod");
const file = path.join(process.cwd(), "content/digiuniverzita/a1a3.json");
if (!fs.existsSync(file)) {
  console.error(`Chybí ${file}. Spusť nejdřív: node scripts/build-digiuniverzita-seed.mjs`);
  process.exit(1);
}
const seed = JSON.parse(fs.readFileSync(file, "utf8"));

function run(fnName, args) {
  const argv = ["convex", "run", fnName, JSON.stringify(args)];
  if (prod) argv.push("--prod");
  const out = execFileSync("npx", argv, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return out.trim();
}

console.log(`Kurz: ${seed.course.title} (${seed.lessons.length} lekcí)${prod ? " → PRODUKCE" : ""}`);

// 1) kurz, moduly a lekce bez transkriptů
run("digiuniverzita:seedCourse", {
  course: {
    slug: seed.course.slug,
    title: seed.course.title,
    perex: seed.course.perex,
    coverImageUrl: seed.course.coverImageUrl ?? undefined,
    requiredTier: seed.course.requiredTier ?? undefined,
    position: seed.course.position,
    state: "published",
    sections: seed.course.sections,
  },
  lessons: seed.lessons.map((l) => ({
    slug: l.slug,
    title: l.title,
    perex: l.perex,
    position: l.position,
    sectionKey: l.sectionKey,
    kind: l.kind,
    durationSeconds: l.durationSeconds,
    state: l.state,
    ...(l.stateNote ? { stateNote: l.stateNote } : {}),
    isRequired: l.isRequired,
    isPreview: l.isPreview,
    ...(l.source?.master ? { sourceMaster: l.source.master } : {}),
    ...(l.source?.youtubeId ? { sourceYoutubeId: l.source.youtubeId } : {}),
  })),
});
console.log("  ✓ kurz, moduly a lekce");

// 2) transkripty po jednom — stovky vět na lekci
let cues = 0;
for (const l of seed.lessons) {
  run("digiuniverzita:seedTranscript", {
    courseSlug: seed.course.slug,
    lessonSlug: l.slug,
    segments: l.transcript,
  });
  cues += l.transcript.length;
  process.stdout.write(".");
}
console.log(`\n  ✓ transkripty (${cues} vět)`);
