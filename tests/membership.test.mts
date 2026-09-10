import test from "node:test";
import assert from "node:assert/strict";

import { isMembershipActive } from "../convex/lib/membershipState.ts";

const DAY = 86_400_000;

/*
 * Kdy členství platí.
 *
 * Ruční udělení členství adminem zapisuje `currentPeriodEnd: undefined`
 * právě proto, že to tady znamená „platí navždy" — nic v systému členství
 * neexpiruje, platnost se dopočítává při každém čtení. Kdyby se to pravidlo
 * změnilo, udělená členství by ze dne na den zhasla.
 *
 * Testuje se convexová strana, protože je autoritativní a nemá importy —
 * `lib/membership.ts` má vlastní kopii pravidla, ale sahá na `@/lib/site`,
 * který nativní type-stripping Nodu neumí rozlousknout. Třetí kopie je
 * inline v `convex/digiAdmin.ts`.
 */

test("členství bez data konce platí navždy", () => {
  const now = Date.now();
  assert.equal(isMembershipActive({ status: "active" }, now), true);
  assert.equal(
    isMembershipActive({ status: "active", currentPeriodEnd: undefined }, now),
    true,
  );
});

test("datum v budoucnu platí, v minulosti ne", () => {
  const now = Date.now();
  assert.equal(
    isMembershipActive({ status: "active", currentPeriodEnd: now + DAY }, now),
    true,
  );
  assert.equal(
    isMembershipActive({ status: "active", currentPeriodEnd: now - DAY }, now),
    false,
  );
  // Hranice: poslední okamžik období ještě platí.
  assert.equal(
    isMembershipActive({ status: "active", currentPeriodEnd: now }, now),
    true,
  );
});

test("jiný stav než active neplatí, ani bez data konce", () => {
  const now = Date.now();
  for (const status of ["none", "pending", "past_due", "canceled"] as const) {
    assert.equal(isMembershipActive({ status }, now), false, status);
    assert.equal(
      isMembershipActive({ status, currentPeriodEnd: now + DAY }, now),
      false,
      status,
    );
  }
});

test("odebrané členství přestane platit okamžitě, i když období běží dál", () => {
  // `adminRevokeMembership` nechává `currentPeriodEnd` být a překlápí jen
  // stav — ověřovací API i veřejný seznam na to musí zareagovat hned.
  const now = Date.now();
  assert.equal(
    isMembershipActive({ status: "canceled", currentPeriodEnd: now + 365 * DAY }, now),
    false,
  );
});
