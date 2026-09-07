import test from "node:test";
import assert from "node:assert/strict";

import {
  ALPHABET,
  formatCredentialCode,
  normalizeCode,
  normalizeCredentialCode,
} from "../convex/lib/code.ts";
import {
  EXPIRING_SOON_DAYS,
  SKILLS,
  credentialState,
  skillByKey,
  validUntilFor,
  validityLabel,
} from "../convex/lib/skills.ts";
import { isMembershipActive } from "../convex/lib/membershipState.ts";

const DAY = 86_400_000;

/* ------------------------------------------------------- kód certifikátu */

test("kód certifikátu projde tam a zpět pro celou abecedu", () => {
  for (const ch of ALPHABET) {
    const secret = ch.repeat(8);
    const code = formatCredentialCode(2026, secret);
    assert.equal(normalizeCredentialCode(code), `2026:${secret}`);
  }
});

test("normalizace odpouští zápis z papíru", () => {
  const expected = "2026:K7M9XQ2T";
  for (const input of [
    "CKPD-CERT-2026-K7M9XQ2T",
    "ckpd-cert-2026-k7m9xq2t",
    "CKPD CERT 2026 K7M9XQ2T",
    "CKPDCERT2026K7M9XQ2T",
    "  CKPD-CERT-2026-K7M9XQ2T  ",
  ]) {
    assert.equal(normalizeCredentialCode(input), expected, input);
  }
});

test("záměnné znaky se opraví na číslice", () => {
  // I a L → 1, O → 0; jinak by přepis z papíru selhal
  assert.equal(normalizeCredentialCode("CKPD-CERT-2026-IL0OK7M9"), "2026:1100K7M9");
});

test("nesmysly se odmítnou", () => {
  for (const input of [
    "",
    "   ",
    "CKPD-CERT-26-K7M9XQ2T", // krátký rok
    "CKPD-CERT-2026-K7M9XQ", // krátké tajemství
    "CKPD-CERT-2026-K7M9XQ2TX", // dlouhé tajemství
    "CKPD-CERT-2026-K7M9XQ2U", // U není v Crockford abecedě
    "úplný nesmysl",
  ]) {
    assert.equal(normalizeCredentialCode(input), null, JSON.stringify(input));
  }
});

test("kódy se navzájem nepřetahují", () => {
  // Kdyby prefixy splynuly, dal by se tajný kód člena poslat na veřejnou
  // stránku certifikátu — tohle je ta pojistka.
  const memberCode = "CKPD-2026-0142-K7M9XQ2T";
  const credentialCode = "CKPD-CERT-2026-K7M9XQ2T";

  assert.equal(normalizeCredentialCode(memberCode), null);
  assert.equal(normalizeCode(credentialCode), null);

  assert.ok(normalizeCode(memberCode));
  assert.ok(normalizeCredentialCode(credentialCode));
});

/* ------------------------------------------------------------ číselník */

test("číselník drží dohodnutý rozsah platnosti", () => {
  const keys = new Set<string>();
  for (const s of SKILLS) {
    assert.ok(s.validityYears >= 3 && s.validityYears <= 5, s.key);
    assert.ok(s.short.length <= 14, `${s.key}: ${s.short}`);
    assert.ok(!keys.has(s.key), `duplicitní klíč ${s.key}`);
    keys.add(s.key);
  }
});

test("neznámý obor se nedá vydat", () => {
  assert.equal(skillByKey("neexistuje"), undefined);
});

test("česká platnost se skloňuje", () => {
  assert.equal(validityLabel(1), "1 rok");
  assert.equal(validityLabel(3), "3 roky");
  assert.equal(validityLabel(4), "4 roky");
  assert.equal(validityLabel(5), "5 let");
});

/* ------------------------------------------------------------ platnost */

test("platnost se počítá v celých letech", () => {
  const issued = Date.UTC(2026, 8, 7);
  assert.equal(validUntilFor(issued, 3), Date.UTC(2029, 8, 7));
  assert.equal(validUntilFor(issued, 5), Date.UTC(2031, 8, 7));
});

test("29. února se posune na 28., ne na 1. březen", () => {
  const leap = Date.UTC(2028, 1, 29);
  assert.equal(validUntilFor(leap, 3), Date.UTC(2031, 1, 28));
  // a v přestupném cílovém roce zůstává 29.
  assert.equal(validUntilFor(leap, 4), Date.UTC(2032, 1, 29));
});

test("stav osvědčení zná čtyři situace", () => {
  const now = Date.UTC(2026, 8, 7);
  const far = { validUntil: now + 400 * DAY };
  const soon = { validUntil: now + 10 * DAY };
  const past = { validUntil: now - DAY };

  assert.equal(credentialState(far, now), "valid");
  assert.equal(credentialState(soon, now), "expiring");
  assert.equal(credentialState(past, now), "expired");
  // odebrání přebíjí i vypršení
  assert.equal(credentialState({ ...past, revokedAt: now }, now), "revoked");
});

test("hranice okna „končí platnost“ i vypršení sedí", () => {
  const now = Date.UTC(2026, 8, 7);
  const edge = now + EXPIRING_SOON_DAYS * DAY;

  assert.equal(credentialState({ validUntil: edge }, now), "expiring");
  assert.equal(credentialState({ validUntil: edge + 1 }, now), "valid");
  // přesně v okamžiku konce ještě platí, o milisekundu později už ne
  assert.equal(credentialState({ validUntil: now }, now), "expiring");
  assert.equal(credentialState({ validUntil: now - 1 }, now), "expired");
});

/* -------------------------------------------------------- stav členství */

test("platné členství se pozná stejně jako v partnerském API", () => {
  const now = Date.UTC(2026, 8, 7);
  const future = now + 30 * DAY;
  const past = now - DAY;

  assert.equal(isMembershipActive({ status: "active" }, now), true);
  assert.equal(
    isMembershipActive({ status: "active", currentPeriodEnd: future }, now),
    true,
  );
  assert.equal(
    isMembershipActive({ status: "active", currentPeriodEnd: past }, now),
    false,
  );

  for (const status of ["none", "pending", "past_due", "canceled"]) {
    assert.equal(
      isMembershipActive({ status, currentPeriodEnd: future }, now),
      false,
      status,
    );
  }
});
