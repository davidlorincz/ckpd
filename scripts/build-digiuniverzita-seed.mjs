#!/usr/bin/env node
/**
 * build-digiuniverzita-seed — vygeneruje seed kurzu z produkčních podkladů.
 *
 * Čte `lessonNConfig.ts` z repa `dronpro-videos` (auto-generované Remotion configy,
 * v nichž už jsou `dur` a `caps: [{start,end,text}]` po whisper alignmentu) a složí
 * z nich `content/digiuniverzita/a1a3.json` — jediný vstup pro `convex/seed.ts`.
 *
 * Proč JSON a ne MDX: `scripts/content-lint.mjs` skenuje jen .ts/.tsx/.md/.mdx.
 * Názvy lekcí citují terminologii EASA („certifikovaná kategorie"), kterou lint
 * zakazuje v hlase komory — v citované legislativě je ale namístě. Lint se tím
 * neobchází pro vlastní UI texty, jen pro obsah kurzu.
 *
 * Spuštění: node scripts/build-digiuniverzita-seed.mjs [--vtt]
 *   --vtt  vypíše navíc WebVTT do content/digiuniverzita/vtt/ (ke kontrole titulků)
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const VIDEOS_REPO =
  process.env.DRONPRO_VIDEOS_DIR ??
  path.join(os.homedir(), "Developer/DronPro/dronpro-videos");

const MASTERS_DIR =
  process.env.DRONPRO_MASTERS_DIR ??
  path.join(
    os.homedir(),
    "Developer/Obsidian Vault/Projects/DronPro/Assets/generated/kurz-a1a3",
  );

const OUT = path.join(process.cwd(), "content/digiuniverzita/a1a3.json");

/**
 * Kurz OPEN A1/A3. Zdroj pravdy pro strukturu:
 * Obsidian → Content/Kurzy CZ/A1A3 video/A1A3 kurz — produkční přehled.md
 *
 * `master` = soubor v MASTERS_DIR, který se nahrává k providerovi (ne rip z YouTube).
 * `youtubeId` je jen evidence — odkud se obsah stěhuje; přehrávač ho nepoužívá.
 */
const COURSE = {
  slug: "open-a1-a3",
  title: "OPEN A1/A3 — legislativa dronů",
  perex:
    "Kompletní výklad pravidel pro otevřenou kategorii: od základních pojmů přes registraci " +
    "a zeměpisné zóny až po povinnosti pilota v praxi. Deset samostatných lekcí, každá do devíti minut.",
  /** undefined = jakýkoli aktivní člen (Základní i PRO). PRO kurzy dostanou "pro". */
  requiredTier: undefined,
  /**
   * Obálka kurzu. Je to ilustrace z produkce lekce 1 (`19-08-2026_kurz-a1a3-lekce1-i1`)
   * — flat vektor v DRONPRO stylu, navy a cyan. Obsahově sedí na celý kurz:
   * člověk, který si právě koupil dron a neví, co s ním smí.
   */
  coverImageUrl: "/digiuniverzita/open-a1-a3.webp",
  position: 1,
  sections: [
    { key: "zaklady", title: "Základy a vstup do provozu", lessons: [1, 2] },
    { key: "kategorie", title: "Kategorie a podkategorie", lessons: [3, 4, 5] },
    { key: "zony", title: "Zeměpisné zóny a mapa", lessons: [6, 7, 8, 9, 10] },
    { key: "praxe", title: "Povinnosti a praxe", lessons: [11] },
  ],
};

const LESSONS = [
  {
    n: 1,
    slug: "uvod-a-zakladni-pojmy",
    title: "Úvod a základní pojmy",
    perex:
      "Kdo píše pravidla pro drony a kdo je u nás hlídá. Rozdíl mezi pilotem a provozovatelem, " +
      "zapojené a nezapojené osoby, shromáždění lidí a co znamená VLOS, EVLOS a BVLOS.",
    youtubeId: "9nUJhoDmZ40",
    master: "lekce1-final/lekce1-uvod-zakladni-pojmy-v3.mp4",
  },
  {
    n: 2,
    slug: "registrace-a-zkouska-pilota",
    title: "Registrace a zkouška pilota",
    perex:
      "Dvě povinnosti, které vyřídíte online, než poprvé vzlétnete. Registrace provozovatele, " +
      "registrační značka, účet na webu ÚCL, online test a doklad o absolvování.",
    youtubeId: "xR0OsLnOIMc",
    master: "lekce2-final/lekce2-registrace-a-zkouska-v3.mp4",
  },
  {
    n: 3,
    slug: "kategorie-provozu-a-stitky-c",
    title: "Kategorie provozu a štítky C",
    perex:
      "Tři kategorie podle rizika, hranice 120 metrů nad terénem, třídy C0 až C6 " +
      "a co dělat, když dron štítek nemá. Plus předletová příprava.",
    youtubeId: "s9IWih9yF78",
    master: "lekce3-final/lekce3-kategorie-provozu-stitky-C-v3.mp4",
  },
  {
    n: 4,
    slug: "podkategorie-a1-a2-a3",
    title: "Podkategorie A1, A2 a A3",
    perex:
      "Jak blízko lidí smíte létat a jak těžký dron k tomu potřebujete. Pravidlo 1:1, " +
      "průkaz A2, hustě osídlený prostor, pomalý režim a hranice 150 metrů od zástavby.",
    youtubeId: "bOYR2i-9nl8",
    master: "lekce4-final/lekce4-podkategorie-a1-a2-a3-v3.mp4",
  },
  {
    n: 5,
    slug: "specificka-a-certifikovana-kategorie",
    title: "Specifická a certifikovaná kategorie",
    perex:
      "Co dělat, když se let do otevřené kategorie nevejde. Analýza rizik, standardní scénáře " +
      "a proč se u nás zatím nepoužívají.",
    youtubeId: "X0iIxb1pp3w",
    master: "lekce5-final/lekce5-specificka-certifikovana-v3.mp4",
  },
  {
    n: 6,
    slug: "digitalni-mapa-dronemap",
    title: "Digitální mapa DroneMap",
    perex:
      "Praktický průchod dronemap.gov.cz: založení účtu, čtení zón, podmínky provozu " +
      "a zápis letu. Se záznamem skutečné obrazovky.",
    youtubeId: "RZdB8FyCbuY",
    master: "lekce6-final/lekce6-digitalni-mapa-dronemap-v3.mp4",
  },
  {
    n: 7,
    slug: "lkr310-a-system-vyhlasek",
    title: "LKR310 a systém vyhlášek",
    perex:
      "Jak je poskládaný systém zeměpisných zón. FIR LKAA, role ŘLP, co je opatření obecné povahy " +
      "a proč platí základ plus to, co je zrovna pod vámi.",
    youtubeId: "cLa6C3Z4CDQ",
    master: "lekce7-final/lekce7-LKR310-system-vyhlasek-v3.mp4",
  },
  {
    n: 8,
    slug: "zeleznice-vedeni-vvn-a-vodni-zdroje",
    title: "Železnice, vedení VVN a vodní zdroje",
    perex:
      "Ochranná pásma tří typů staveb, rozdíl mezi průletem a letem, kdo je správce " +
      "a jak se hlásí událost.",
    youtubeId: "ibC08FuqCA0",
    master: "lekce8-final/lekce8-zeleznice-vedeni-vodni-zdroje-v3.mp4",
    /**
     * ⚠️ Video uvádí 50 m AGL podle chyby v tehdejší vyhlášce (potvrzeno ŘLP);
     * po opravě vyhlášky se přerenderuje na 30 m.
     *
     * Publikované na Davidovo rozhodnutí (28. 8. 2026) kvůli testovacímu
     * náhledu. Poznámka zůstává, aby se na to nezapomnělo — před veřejným
     * spuštěním se lekce musí buď přerenderovat, nebo stáhnout zpět na draft.
     */
    state: "published",
    stateNote: "⚠️ Obsahuje 50 m AGL. Čeká na přerender s 30 m po opravě vyhlášky.",
  },
  {
    n: 9,
    slug: "letiste-lkr314-315",
    title: "Létání u letišť",
    perex:
      "Řízená a neřízená letiště, řízený okrsek, gridy a ATZ. Jak poznat, kam smíte, " +
      "a jak si vyžádat koordinaci.",
    youtubeId: "D43gpkmJBXs",
    master: "lekce9-final/lekce9-letani-u-letist-v3.mp4",
  },
  {
    n: 10,
    slug: "hop-silnice-priroda-odos-letecke-prostory",
    title: "HOP, silnice, příroda, ODOS a letecké prostory",
    perex:
      "Zbývajících pět vyhlášek: hustě osídlený prostor, ochranná pásma silnic, národní parky " +
      "a chráněné oblasti, objekty důležité pro obranu státu a zakázané prostory. Plus NOTAM.",
    youtubeId: "cxhoX65zfpU",
    master: "lekce10-final/lekce10-HOP-silnice-priroda-ODOS-prostory-v3.mp4",
  },
  {
    n: 11,
    slug: "povinnosti-a-letani-v-praxi",
    title: "Povinnosti a létání v praxi",
    perex:
      "Co je na provozovateli a co na pilotovi. Pojištění, firmware, návrat domů, létání za " +
      "soumraku, checklist před vzletem a co dělat, když do prostoru míří vrtulník.",
    youtubeId: "vHp8m50kEZA",
    master: "lekce11-final/lekce11-povinnosti-a-letani-v-praxi-v3.mp4",
    /**
     * Free plán Muxu drží nejvýš 10 assetů a kurz má 11 lekcí. Master i titulky
     * jsou hotové, chybí jen místo u providera — proto draft, ne archiv:
     * po přechodu na Pay-As-You-Go stačí nahrát video a přepnout na published.
     */
    state: "draft",
    stateNote: "⏳ Hotová, čeká na volný slot u Muxu (free plán drží 10 assetů).",
  },
];

/** Vytáhne objekt z auto-generovaného `export const LESSONn: CourseLessonConfig = {…};`. */
function readLessonConfig(n) {
  const file = path.join(VIDEOS_REPO, `src/compositions/lesson${n}Config.ts`);
  if (!fs.existsSync(file)) {
    throw new Error(`Chybí config lekce ${n}: ${file}`);
  }
  const src = fs.readFileSync(file, "utf8");
  const start = src.indexOf("= {");
  if (start === -1) throw new Error(`Nečekaný tvar ${file}`);
  const body = src.slice(start + 2).replace(/;\s*$/, "").trim();
  try {
    return JSON.parse(body);
  } catch (err) {
    throw new Error(`Config lekce ${n} není platný JSON: ${err.message}`);
  }
}

/**
 * Titulky z configu jsou po větách (whisper alignment 92–98 %). Pro transkript
 * je to rovnou správná granularita — klik na řádek skočí na sekundu.
 * Zaokrouhlení na 2 desetiny stačí a zmenší JSON o čtvrtinu.
 */
function toSegments(caps) {
  return caps.map((c) => ({
    start: Math.round(c.start * 100) / 100,
    end: Math.round(c.end * 100) / 100,
    text: c.text.trim(),
  }));
}

function vttTime(seconds) {
  const ms = Math.round(seconds * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const f = String(ms % 1000).padStart(3, "0");
  return `${h}:${m}:${s}.${f}`;
}

function toVtt(segments) {
  const cues = segments.map(
    (s, i) => `${i + 1}\n${vttTime(s.start)} --> ${vttTime(s.end)}\n${s.text}`,
  );
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}

const warnings = [];
const sectionOf = new Map();
for (const s of COURSE.sections) {
  for (const n of s.lessons) sectionOf.set(n, s.key);
}

const lessons = LESSONS.map((meta, index) => {
  const config = readLessonConfig(meta.n);
  const durationSeconds = Math.round(config.dur);
  const segments = toSegments(config.caps);

  const masterPath = path.join(MASTERS_DIR, meta.master);
  if (!fs.existsSync(masterPath)) {
    warnings.push(`Lekce ${meta.n}: master nenalezen — ${masterPath}`);
  }

  const last = segments.at(-1);
  if (last && last.end > durationSeconds + 1) {
    warnings.push(
      `Lekce ${meta.n}: poslední titulek končí v ${last.end} s, ale video má ${durationSeconds} s.`,
    );
  }

  return {
    slug: meta.slug,
    title: meta.title,
    perex: meta.perex,
    position: index + 1,
    sectionKey: sectionOf.get(meta.n) ?? null,
    kind: "video",
    durationSeconds,
    state: meta.state ?? "published",
    ...(meta.stateNote ? { stateNote: meta.stateNote } : {}),
    isRequired: true,
    isPreview: false,
    source: {
      master: meta.master,
      youtubeId: meta.youtubeId,
      remotionDir: config.dir,
    },
    /** Doplní admin po nahrání k providerovi (convex/video.ts). */
    videoProvider: null,
    videoAssetId: null,
    transcript: segments,
  };
});

/**
 * Do čísel kurzu se počítají jen publikované lekce — katalog a detail kurzu
 * draftované lekce členům nezobrazují (`courseBySlug` filtruje podle `state`),
 * takže součet přes všechny by sliboval víc, než je vidět.
 */
const publishedLessons = lessons.filter((l) => l.state === "published");
const totalDurationSeconds = publishedLessons.reduce(
  (a, l) => a + l.durationSeconds,
  0,
);

const seed = {
  $schema: "./a1a3.schema.json",
  generatedFrom: "dronpro-videos/src/compositions/lesson*Config.ts",
  course: {
    ...COURSE,
    sections: COURSE.sections.map((s, i) => ({
      key: s.key,
      title: s.title,
      position: i + 1,
    })),
    lessonCount: publishedLessons.length,
    totalDurationSeconds,
  },
  lessons,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(seed, null, 2)}\n`, "utf8");

if (process.argv.includes("--vtt")) {
  const vttDir = path.join(process.cwd(), "content/digiuniverzita/vtt");
  fs.mkdirSync(vttDir, { recursive: true });
  for (const l of lessons) {
    fs.writeFileSync(path.join(vttDir, `${l.slug}.vtt`), toVtt(l.transcript), "utf8");
  }
  console.log(`WebVTT → ${path.relative(process.cwd(), vttDir)}/ (${lessons.length} souborů)`);
}

const mins = Math.round(totalDurationSeconds / 60);
const caps = lessons.reduce((a, l) => a + l.transcript.length, 0);
console.log(
  `${path.relative(process.cwd(), OUT)} — ${publishedLessons.length} publikovaných lekcí` +
    ` z ${lessons.length}, ${mins} min, ${caps} titulků`,
);
const drafts = lessons.filter((l) => l.state === "draft");
if (drafts.length) {
  console.log(`  draft: ${drafts.map((l) => l.slug).join(", ")}`);
}
for (const w of warnings) console.warn(`  ⚠ ${w}`);
