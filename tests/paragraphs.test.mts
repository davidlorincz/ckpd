/**
 * Testy slučování titulků do čitelných odstavců.
 *
 *   node --test "tests/*.test.mts"
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { toParagraphs } from "../lib/digiuniverzita.ts";

const cue = (start: number, end: number, text: string) => ({ start, end, text });

test("prázdný vstup dá prázdný výstup", () => {
  assert.deepEqual(toParagraphs([]), []);
});

test("odstavec si drží čas své první věty", () => {
  const out = toParagraphs([
    cue(10, 12, "První věta je tady."),
    cue(12, 14, "Druhá věta je tu."),
  ]);
  assert.equal(out[0].start, 10);
  assert.equal(out[0].end, 14);
});

test("nesekají se věty uprostřed", () => {
  const out = toParagraphs(
    [
      cue(0, 2, "Já jsem Alex z DRONPRO a v téhle lekci"),
      cue(2, 4, "vám ho dám — bez paragrafů, po lidsku,"),
      cue(4, 6, "na příkladech."),
    ],
    { minChars: 10, maxChars: 500 },
  );
  assert.equal(out.length, 1);
  assert.ok(out[0].text.endsWith("na příkladech."));
});

test("uzavírá se až na konci věty, ne na délce", () => {
  const out = toParagraphs(
    [
      cue(0, 1, "Kratičká."),
      cue(1, 2, "Další věta pokračuje a je delší než limit"),
      cue(2, 3, "a končí až tady."),
    ],
    { minChars: 15, maxChars: 500 },
  );
  // první se uzavře až po překročení minima na hranici věty
  for (const p of out) assert.match(p.text, /[.!?…]$/);
});

test("velmi dlouhý blok bez tečky se přesto rozdělí", () => {
  const many = Array.from({ length: 60 }, (_, i) =>
    cue(i, i + 1, "slovo slovo slovo slovo"),
  );
  const out = toParagraphs(many, { minChars: 100, maxChars: 200 });
  assert.ok(out.length > 1);
  for (const p of out) assert.ok(p.text.length <= 260, `délka ${p.text.length}`);
});

test("prázdné titulky se zahodí", () => {
  const out = toParagraphs([
    cue(0, 1, "  "),
    cue(1, 2, "Skutečný text."),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].text, "Skutečný text.");
  assert.equal(out[0].start, 1);
});

test("žádný text se neztratí ani nezdvojí", () => {
  const cues = Array.from({ length: 40 }, (_, i) =>
    cue(i * 2, i * 2 + 2, `veta cislo ${i}.`),
  );
  const joined = toParagraphs(cues)
    .map((p) => p.text)
    .join(" ");
  assert.equal(joined, cues.map((c) => c.text).join(" "));
});

test("odstavce jdou v čase za sebou a nepřekrývají se", () => {
  const cues = Array.from({ length: 40 }, (_, i) =>
    cue(i * 2, i * 2 + 2, `Veta cislo ${i} je tady a je dost dlouha.`),
  );
  const out = toParagraphs(cues);
  for (let i = 1; i < out.length; i++) {
    assert.ok(out[i].start >= out[i - 1].end, "odstavce se překrývají");
  }
});
