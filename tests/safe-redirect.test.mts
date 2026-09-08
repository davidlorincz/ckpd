import test from "node:test";
import assert from "node:assert/strict";

import { safeRedirectPath } from "../lib/safeRedirect.ts";

const HOST = "ckpd.cz";

/* ------------------------------------------------- co se pustit má */

test("obyčejná cesta projde beze změny", () => {
  assert.equal(safeRedirectPath("/muj-ucet/predplatne"), "/muj-ucet/predplatne");
  assert.equal(
    safeRedirectPath("/digiuniverzita/lekce-3?cas=42"),
    "/digiuniverzita/lekce-3?cas=42",
  );
});

test("absolutní adresa na našem hostu se zkrátí na cestu", () => {
  assert.equal(
    safeRedirectPath("https://ckpd.cz/muj-ucet/doklady", "/muj-ucet", HOST),
    "/muj-ucet/doklady",
  );
  // Clerk posílá právě tenhle tvar — na dev běhu i s portem.
  assert.equal(
    safeRedirectPath(
      "http://localhost:3000/muj-ucet/predplatne",
      "/muj-ucet",
      "localhost:3000",
    ),
    "/muj-ucet/predplatne",
  );
});

/* --------------------------------------------- co se pustit nesmí */

test("cizí doména nikdy neprojde", () => {
  for (const value of [
    "https://evil.cz/prihlaseni",
    "//evil.cz",
    "/\\evil.cz",
    "http://ckpd.cz.evil.cz/muj-ucet",
    "javascript:alert(1)",
  ]) {
    assert.equal(safeRedirectPath(value, "/muj-ucet", HOST), "/muj-ucet", value);
  }
});

test("bez znalosti hostu se absolutní adresa zahodí, i kdyby byla naše", () => {
  assert.equal(safeRedirectPath("https://ckpd.cz/muj-ucet"), "/muj-ucet");
});

test("návrat na auth obrazovku by zacyklil, proto propadne", () => {
  for (const value of [
    "/prihlaseni",
    "/registrace",
    "/sso-callback?mode=signIn",
    "/prihlaseni/cokoli",
  ]) {
    assert.equal(safeRedirectPath(value), "/muj-ucet", value);
  }
  // `/prihlaseni-neco` ale auth obrazovka není a zůstat smí.
  assert.equal(safeRedirectPath("/prihlaseni-neco"), "/prihlaseni-neco");
});

test("řídicí znaky a přerostlé hodnoty propadnou", () => {
  assert.equal(safeRedirectPath("/muj-ucet\nLocation: evil"), "/muj-ucet");
  assert.equal(safeRedirectPath(`/${"a".repeat(3000)}`), "/muj-ucet");
});

test("chybějící nebo vícenásobná hodnota propadne", () => {
  assert.equal(safeRedirectPath(undefined), "/muj-ucet");
  assert.equal(safeRedirectPath(["/a", "/b"]), "/muj-ucet");
  assert.equal(safeRedirectPath(""), "/muj-ucet");
});
