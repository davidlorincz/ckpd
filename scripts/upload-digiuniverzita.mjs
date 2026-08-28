#!/usr/bin/env node
/**
 * Nahraje mastery lekcí k Muxu a napojí je na lekce v Convexu.
 *
 * Idempotentní: ptá se Convexu, které lekce ještě video nemají, takže
 * opakované spuštění po přerušení pokračuje tam, kde skončilo.
 *
 *   node --env-file=.env.local scripts/upload-digiuniverzita.mjs [--limit N]
 *
 * Poznámka k plánu: free plán Muxu drží nejvýš 10 assetů. Kurz má 11 lekcí,
 * takže na kompletní nahrání je potřeba Pay-As-You-Go (karta; 100 000 minut
 * přehrání měsíčně a 20 $ kreditu zůstávají zdarma).
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const COURSE_SLUG = "open-a1-a3";
const MASTERS_DIR =
  process.env.DRONPRO_MASTERS_DIR ??
  path.join(
    os.homedir(),
    "Developer/Obsidian Vault/Projects/DronPro/Assets/generated/kurz-a1a3",
  );

const limitArg = process.argv.indexOf("--limit");
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const id = process.env.MUX_TOKEN_ID;
const secret = process.env.MUX_TOKEN_SECRET;
if (!id || !secret) {
  console.error("Chybí MUX_TOKEN_ID / MUX_TOKEN_SECRET.");
  process.exit(1);
}
const auth = "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mux(pathname, init = {}) {
  const res = await fetch(`https://api.mux.com${pathname}`, {
    ...init,
    headers: { authorization: auth, "content-type": "application/json", ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.messages?.join("; ") ?? res.statusText;
    throw new Error(`Mux ${pathname} → ${res.status}: ${msg}`);
  }
  return body.data;
}

function convex(fnName, args) {
  const out = execFileSync("npx", ["convex", "run", fnName, JSON.stringify(args)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const trimmed = out.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

async function uploadOne(lesson) {
  const file = path.join(MASTERS_DIR, lesson.sourceMaster);
  if (!fs.existsSync(file)) throw new Error(`Master nenalezen: ${file}`);
  const bytes = fs.readFileSync(file);
  const mb = (bytes.length / 1024 / 1024).toFixed(0);

  process.stdout.write(`  ${String(lesson.position).padStart(2)}. ${lesson.slug} (${mb} MB) `);

  const upload = await mux("/video/v1/uploads", {
    method: "POST",
    body: JSON.stringify({
      cors_origin: "*",
      new_asset_settings: {
        // Basic = enkódování zdarma; na výukové video s plochou grafikou stačí
        video_quality: "basic",
        // podepsané přehrávání — adresa bez platného tokenu nesmí hrát
        playback_policies: ["signed"],
        passthrough: `${COURSE_SLUG}/${lesson.slug}`,
      },
    }),
  });

  const put = await fetch(upload.url, {
    method: "PUT",
    headers: { "content-type": "video/mp4" },
    body: bytes,
  });
  if (!put.ok) throw new Error(`PUT → ${put.status} ${put.statusText}`);
  process.stdout.write("nahráno");

  let assetId = null;
  for (let i = 0; i < 120 && !assetId; i++) {
    const u = await mux(`/video/v1/uploads/${upload.id}`);
    if (u.asset_id) assetId = u.asset_id;
    else if (u.status === "errored") throw new Error(`upload errored: ${JSON.stringify(u.error)}`);
    else await sleep(3000);
  }
  if (!assetId) throw new Error("asset se nevytvořil v limitu");

  let asset = null;
  for (let i = 0; i < 200 && !asset; i++) {
    const a = await mux(`/video/v1/assets/${assetId}`);
    if (a.status === "ready") asset = a;
    else if (a.status === "errored") throw new Error(`asset errored: ${JSON.stringify(a.errors)}`);
    else {
      process.stdout.write(".");
      await sleep(3000);
    }
  }
  if (!asset) throw new Error("enkódování nedoběhlo v limitu");

  const playbackId = asset.playback_ids?.[0]?.id;
  if (!playbackId) throw new Error("asset nemá playback ID");

  convex("digiuniverzita:attachVideo", {
    courseSlug: COURSE_SLUG,
    lessonSlug: lesson.slug,
    videoProvider: "mux",
    videoAssetId: playbackId,
    durationSeconds: asset.duration ? Math.round(asset.duration) : undefined,
  });

  console.log(` ✓ ${Math.round(asset.duration)}s`);
}

const pending = convex("digiuniverzita:lessonsMissingVideo", { courseSlug: COURSE_SLUG });
if (!Array.isArray(pending) || pending.length === 0) {
  console.log("Všechny lekce už video mají.");
  process.exit(0);
}

const todo = pending.filter((l) => l.sourceMaster).slice(0, limit);
console.log(`Nahrávám ${todo.length} z ${pending.length} chybějících lekcí:\n`);

let done = 0;
for (const lesson of todo) {
  try {
    await uploadOne(lesson);
    done += 1;
  } catch (err) {
    console.log(` ✗ ${err.message}`);
    if (/free plan|asset limit|limit reached/i.test(err.message)) {
      console.error(
        "\nDošel limit free plánu (10 assetů). Přidej kartu v Mux dashboardu\n" +
          "(Pay-As-You-Go) a spusť skript znovu — naváže tam, kde skončil.",
      );
      break;
    }
  }
}
console.log(`\nHotovo: ${done}/${todo.length}`);
