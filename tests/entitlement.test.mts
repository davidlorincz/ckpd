import test from "node:test";
import assert from "node:assert/strict";

import {
  ANONYMOUS,
  canAccessCourse,
  canAccessLesson,
  meetsTier,
  type Access,
} from "../convex/lib/entitlement.ts";

/**
 * Kdo se dostane k obsahu DIGI univerzity.
 *
 * Zmrazeno testem schválně: je to placená hranice a její pravidla se nedávno
 * měnila. Dřív `requiredTier` s hodnotou „zakladni" nebo „cestne" neomezilo
 * nic (propadlo na `return true`) a admin bez zaplaceného členství se dovnitř
 * nedostal vůbec.
 */

const member = (tier: Access["tier"], active = true): Access => ({
  memberId: "x" as Access["memberId"],
  active,
  tier,
  admin: false,
});

const admin: Access = { memberId: null, active: false, tier: undefined, admin: true };

const course = (requiredTier?: "zakladni" | "pro" | "cestne") => ({ requiredTier });
const lesson = (
  requiredTier?: "zakladni" | "pro" | "cestne",
  isPreview = false,
) => ({ requiredTier, isPreview });

/* ------------------------------------------------------- kdo dovnitř nesmí */

test("nepřihlášený nemá nárok na nic", () => {
  assert.equal(meetsTier(ANONYMOUS, undefined), false);
  assert.equal(canAccessCourse(ANONYMOUS, course()), false);
});

test("přihlášený bez zaplaceného členství nemá nárok na nic", () => {
  const unpaid = member("zakladni", false);
  assert.equal(canAccessCourse(unpaid, course()), false);
  assert.equal(canAccessCourse(unpaid, course("zakladni")), false);
  assert.equal(canAccessLesson(unpaid, course(), lesson()), false);
});

test("člen bez varianty se k obsahu s požadavkem nedostane", () => {
  assert.equal(canAccessCourse(member(undefined), course("zakladni")), false);
});

/* ------------------------------------------------------------- varianty */

test("bez požadavku stačí platné členství", () => {
  assert.equal(canAccessCourse(member("zakladni"), course()), true);
  assert.equal(canAccessCourse(member("pro"), course()), true);
});

test("Základní na PRO obsah nestačí", () => {
  assert.equal(canAccessCourse(member("zakladni"), course("pro")), false);
});

test("PRO i čestné členství otevírají PRO obsah", () => {
  assert.equal(canAccessCourse(member("pro"), course("pro")), true);
  assert.equal(canAccessCourse(member("cestne"), course("pro")), true);
});

test("požadavek „zakladni“ opravdu omezuje — nesmí propadnout na true", () => {
  // dřív tahle větev nic neomezila a nezaplacený člen prošel
  assert.equal(canAccessCourse(member("zakladni", false), course("zakladni")), false);
  assert.equal(canAccessCourse(member("zakladni"), course("zakladni")), true);
});

/* ---------------------------------------------------------------- admin */

test("admin vidí obsah i bez zaplaceného členství", () => {
  assert.equal(canAccessCourse(admin, course()), true);
  assert.equal(canAccessCourse(admin, course("pro")), true);
  assert.equal(canAccessLesson(admin, course("pro"), lesson("pro")), true);
});

/* ---------------------------------------------------------------- lekce */

test("veřejná ukázka hraje i nepřihlášenému", () => {
  assert.equal(canAccessLesson(ANONYMOUS, course("pro"), lesson("pro", true)), true);
});

test("lekce může nárok zpřísnit, ne zmírnit", () => {
  const zakladni = member("zakladni");
  assert.equal(canAccessLesson(zakladni, course(), lesson("pro")), false);
  // kurz je PRO, lekce bez požadavku — pořád platí přísnější z obou
  assert.equal(canAccessLesson(zakladni, course("pro"), lesson()), false);
});
