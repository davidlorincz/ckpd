import test from "node:test";
import assert from "node:assert/strict";

import { routeForCode } from "../lib/verifyRouting.ts";

test("potvrzení o absolvování míří na svoji stránku", () => {
  const t = routeForCode("CKPD-DU-2026-7F3K9QAB");
  assert.equal(t?.kind, "completion");
  assert.equal(t?.href, "/overit/potvrzeni/CKPD-DU-2026-7F3K9QAB");
});

test("osvědčení míří na svoji stránku", () => {
  const t = routeForCode("CKPD-CERT-2026-K7M9XQ2T");
  assert.equal(t?.kind, "credential");
  assert.equal(t?.href, "/overit/certifikace/CKPD-CERT-2026-K7M9XQ2T");
});

test("ověřovací kód člena míří na výpis člena", () => {
  const t = routeForCode("CKPD-2026-0142-K7M9XQ2T");
  assert.equal(t?.kind, "member");
  assert.equal(t?.href, "/overit/clen/CKPD-2026-0142-K7M9XQ2T");
});

test("výstup je kanonický, ať uživatel napsal cokoli", () => {
  // malá písmena, mezery i chybějící prefix musí dát tentýž odkaz
  for (const input of [
    "ckpd 2026 0142 k7m9xq2t",
    "CKPD-2026-0142-K7M9XQ2T",
    "2026-0142-K7M9XQ2T",
  ]) {
    assert.equal(
      routeForCode(input)?.href,
      "/overit/clen/CKPD-2026-0142-K7M9XQ2T",
      input,
    );
  }
  assert.equal(
    routeForCode("ckpd cert 2026 k7m9xq2t")?.href,
    "/overit/certifikace/CKPD-CERT-2026-K7M9XQ2T",
  );
});

test("kódy se nikdy nesmí svézt na cizí stránku", () => {
  // tohle je ta pojistka: tajný kód člena nesmí skončit na veřejné stránce
  assert.equal(routeForCode("CKPD-2026-0142-K7M9XQ2T")?.kind, "member");
  assert.equal(routeForCode("CKPD-DU-2026-7F3K9QAB")?.kind, "completion");
  assert.equal(routeForCode("CKPD-CERT-2026-K7M9XQ2T")?.kind, "credential");
});

test("nesmysl a neúplný vstup nikam nevedou", () => {
  for (const input of [
    "",
    "   ",
    "CKPD-2026-0142", // členské číslo bez tajemství
    "CKPD-CERT-2026", // osvědčení bez tajemství
    "CKPD-DU-2026", // potvrzení bez tajemství
    "kde mám ten kód",
    "12345",
  ]) {
    assert.equal(routeForCode(input), null, JSON.stringify(input));
  }
});
