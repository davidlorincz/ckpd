#!/usr/bin/env node
/**
 * Naparsuje pool otázek z Obsidianu a nahraje ho do Convexu.
 *
 * DŮLEŽITÉ: pool vznikl jako best-guess podle EU a ÚCL pravidel a všechny
 * otázky mají v Obsidianu `verified: false`. Skript to respektuje — neověřené
 * otázky se ukládají jako `draft` a do losování se nikdy nedostanou.
 * Komora nemůže zkoušet piloty z klíčů, které sama neověřila.
 *
 *   node scripts/seed-kviz.mjs [--prod]
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const prod = process.argv.includes("--prod");
const SOURCE =
  process.env.DRONPRO_QUIZ_POOL ??
  path.join(
    os.homedir(),
    "Developer/Obsidian Vault/Projects/DronPro/Content/Kurzy CZ",
    "Test pilotů - 150 otázek k revizi V2.md",
  );

if (!fs.existsSync(SOURCE)) {
  console.error(`Pool nenalezen: ${SOURCE}`);
  process.exit(1);
}
const md = fs.readFileSync(SOURCE, "utf8");

/** Frontmatter říká, jestli klíče prošly revizí. */
const verifiedGlobally = /^verified:\s*true\s*$/m.test(md);

const questions = [];
let section = null;
let current = null;

const flush = () => {
  if (!current) return;
  if (current.options.length >= 2 && current.correctIndex >= 0) {
    questions.push(current);
  } else {
    console.warn(`  ⚠ přeskočeno (neúplné): ${current.question.slice(0, 60)}…`);
  }
  current = null;
};

for (const raw of md.split("\n")) {
  const line = raw.trim();

  // sekce, ale ne obsah na začátku dokumentu
  const sectionMatch = /^##\s+(?!Obsah\b)(.+)$/.exec(line);
  if (sectionMatch) {
    flush();
    // pryč s emoji a přebytečnými mezerami
    section = sectionMatch[1]
      .replace(/[\p{Extended_Pictographic}️]/gu, "")
      .trim();
    continue;
  }

  const questionMatch = /^###\s+Q(\d+)\.\s+(.+)$/.exec(line);
  if (questionMatch) {
    flush();
    if (!section) continue;
    current = {
      section,
      position: Number(questionMatch[1]),
      question: questionMatch[2].trim(),
      options: [],
      correctIndex: -1,
      explanation: "",
      verified: verifiedGlobally,
    };
    continue;
  }

  if (!current) continue;

  // `- ◻️ **A)** text` nebo `- **✅** **B)** text`
  const optionMatch = /^-\s+(.*?)\*\*([A-E])\)\*\*\s+(.+)$/.exec(line);
  if (optionMatch) {
    const isCorrect = optionMatch[1].includes("✅");
    if (isCorrect) current.correctIndex = current.options.length;
    current.options.push(optionMatch[3].trim());
    continue;
  }

  const explanationMatch = /^>\s*.*?\*\*Odůvodnění:\*\*\s*(.+)$/.exec(line);
  if (explanationMatch) {
    current.explanation = explanationMatch[1].trim();
  }
}
flush();

const sections = [...new Set(questions.map((q) => q.section))];
console.log(`Naparsováno ${questions.length} otázek v ${sections.length} sekcích:`);
for (const s of sections) {
  console.log(`  ${questions.filter((q) => q.section === s).length.toString().padStart(3)}  ${s}`);
}
console.log(`Klíče ověřené lektorem: ${verifiedGlobally ? "ANO" : "NE → otázky jdou jako draft"}`);

if (questions.length === 0) process.exit(1);

const argv = [
  "convex",
  "run",
  "quizzes:seedQuiz",
  JSON.stringify({
    courseSlug: "open-a1-a3",
    slug: "open-a1-a3-test",
    title: "Zkušební test A1/A3",
    perex:
      "Nanečisto podle zkoušky ÚCL: 30 otázek napříč pěti okruhy, " +
      "úspěšnost od 24 správných.",
    questionsPerAttempt: 30,
    passingScore: 24,
    // Dokud klíče neprojdou revizí, kvíz se nezveřejňuje.
    state: verifiedGlobally ? "published" : "draft",
    questions,
  }),
];
if (prod) argv.push("--prod");

const out = execFileSync("npx", argv, { encoding: "utf8" });
console.log(`\n${out.trim()}`);
