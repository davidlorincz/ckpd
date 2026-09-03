/**
 * Testy testovacího prostředí ověřovacího API a parseru kódů, o který se
 * opírá. `normalizeCode` je bezpečnostní hranice celého endpointu — všechno,
 * co projde, se ptá databáze.
 *
 *   node --test "tests/*.test.mts"
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { ALPHABET, normalizeCode } from "../convex/lib/code.ts";
import {
  SANDBOX_MEMBERS,
  findSandboxMember,
  resolveSandbox,
} from "../convex/lib/sandbox.ts";

/* ────────────────────────────── pískoviště ────────────────────────────── */

test("každý testovací kód projde normalizací na svůj lookup", () => {
  // tohle je ta pojistka, kvůli které je sandbox.ts bez závislostí:
  // kdyby se parser změnil, rozejdou se vydané kódy a spadne to tady
  for (const m of SANDBOX_MEMBERS) {
    assert.equal(
      normalizeCode(m.code),
      m.lookup,
      `kód ${m.code} se nenormalizuje na ${m.lookup}`,
    );
  }
});

test("kód začíná svým členským číslem", () => {
  for (const m of SANDBOX_MEMBERS) {
    assert.ok(
      m.code.startsWith(`${m.memberNumber}-`),
      `${m.code} neodpovídá číslu ${m.memberNumber}`,
    );
  }
});

test("kódy i lookupy jsou unikátní", () => {
  const codes = new Set(SANDBOX_MEMBERS.map((m) => m.code));
  const lookups = new Set(SANDBOX_MEMBERS.map((m) => m.lookup));
  assert.equal(codes.size, SANDBOX_MEMBERS.length);
  assert.equal(lookups.size, SANDBOX_MEMBERS.length);
});

test("findSandboxMember najde každý fixture a nic navíc", () => {
  for (const m of SANDBOX_MEMBERS) {
    assert.equal(findSandboxMember(m.lookup)?.code, m.code);
  }
  assert.equal(findSandboxMember("2026:9999:ZZZZZZZZ"), undefined);
  assert.equal(findSandboxMember(""), undefined);
});

test("tajemství jsou v abecedě a bez zaměnitelných znaků", () => {
  // I, L, O ani U v Crockford base32 nejsou; kdyby v tajemství byly,
  // normalizace by je přepsala a zapsaný kód by se rozešel s tím,
  // co je vidět v auditu
  for (const m of SANDBOX_MEMBERS) {
    const secret = m.code.slice(m.memberNumber.length + 1);
    assert.equal(secret.length, 8, `${m.code}: tajemství musí mít 8 znaků`);
    for (const ch of secret) {
      assert.ok(ALPHABET.includes(ch), `${m.code}: znak ${ch} není v abecedě`);
    }
  }
});

test("členská čísla pískoviště začínají od 9001", () => {
  // reálná pořadová čísla rostou od jedničky, takže je v logu poznat na první pohled
  for (const m of SANDBOX_MEMBERS) {
    const seq = Number(m.memberNumber.split("-")[2]);
    assert.ok(seq >= 9001, `${m.memberNumber} zasahuje do reálných čísel`);
  }
});

test("platné a vypršelé fixtury zůstávají v čase správně", () => {
  const now = Date.UTC(2026, 8, 3);
  const platny = resolveSandbox(SANDBOX_MEMBERS[0], now);
  const vyprsely = resolveSandbox(SANDBOX_MEMBERS[5], now);

  assert.ok(platny.currentPeriodEnd! > now, "referenční fixture musí platit");
  assert.ok(vyprsely.currentPeriodEnd! < now, "vypršelý fixture musí být v minulosti");
});

test("čestné členství nemá zaplacené období", () => {
  const cestny = SANDBOX_MEMBERS.find((m) => m.tier === "cestne")!;
  assert.equal(resolveSandbox(cestny, Date.now()).currentPeriodEnd, undefined);
});

test("resolveSandbox dává tvar, který ověřování čeká u skutečného člena", () => {
  const r = resolveSandbox(SANDBOX_MEMBERS[0], Date.UTC(2026, 8, 3));
  assert.equal(r.memberNumber, "CKPD-2026-9001");
  assert.equal(r.tier, "zakladni");
  assert.equal(r.status, "active");
  assert.equal(r.publicListing, true);
  assert.equal(new Date(r.memberSince!).toISOString().slice(0, 10), "2026-01-15");
});

/* ──────────────────────────── normalizace kódu ─────────────────────────── */

test("kód se normalizuje na rok:pořadí:tajemství", () => {
  assert.equal(normalizeCode("CKPD-2026-0142-K7M9XQ2T"), "2026:0142:K7M9XQ2T");
});

test("odpouští malá písmena, mezery i chybějící prefix", () => {
  const cil = "2026:0142:K7M9XQ2T";
  assert.equal(normalizeCode("ckpd-2026-0142-k7m9xq2t"), cil);
  assert.equal(normalizeCode("  CKPD 2026 0142 K7M9XQ2T  "), cil);
  assert.equal(normalizeCode("CKPD_2026_0142_K7M9XQ2T"), cil);
  assert.equal(normalizeCode("2026-0142-K7M9XQ2T"), cil);
});

test("zaměnitelné znaky v tajemství se srovnají", () => {
  // I a L vypadají jako jednička, O jako nula — člen kód opisuje z obrazovky
  assert.equal(normalizeCode("CKPD-2026-0142-IL0O567Z"), "2026:0142:1100567Z");
  assert.equal(normalizeCode("CKPD-2026-0142-OOOOOOOO"), "2026:0142:00000000");
  assert.equal(normalizeCode("CKPD-2026-0142-IIIIIIII"), "2026:0142:11111111");
});

test("holé členské číslo se odmítá", () => {
  // kdyby stačilo, dá se projet 0001–9999 a stáhnout členská základna
  assert.equal(normalizeCode("CKPD-2026-0142"), null);
  assert.equal(normalizeCode("CKPD-2026-9001"), null);
});

test("nesmysly se odmítají", () => {
  assert.equal(normalizeCode(""), null);
  assert.equal(normalizeCode("   "), null);
  assert.equal(normalizeCode("CKPD-2026-0142-K7M9XQ2"), null); // krátké tajemství
  assert.equal(normalizeCode("CKPD-2026-0142-K7M9XQ2TX"), null); // dlouhé
  assert.equal(normalizeCode("CKPD-26-0142-K7M9XQ2T"), null); // krátký rok
  assert.equal(normalizeCode("CKPD-2026-142-K7M9XQ2T"), null); // krátké pořadí
  assert.equal(normalizeCode("CKPD-2026-0142-K7M9XQ2!"), null); // znak mimo sadu
  assert.equal(normalizeCode("ahoj"), null);
});

test("U se v tajemství nebere", () => {
  // U v Crockford base32 chybí a normalizace ho na nic nepřepisuje
  assert.equal(normalizeCode("CKPD-2026-0142-UUUUUUUU"), null);
});
