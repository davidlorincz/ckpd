/**
 * Testy sledovaných úseků. Spouští se vestavěným runnerem Nodu — bez nové
 * závislosti, protože jediná netriviální logika v repu je zrovna tahle.
 *
 *   node --test tests/
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addRange,
  clampSegment,
  coverage,
  coverageRatio,
} from "../convex/lib/ranges.ts";

/** Zkratka: postupně přidá úseky do prázdna. */
function build(pairs: [number, number][]) {
  return pairs.reduce<ReturnType<typeof addRange>>(
    (acc, [s, e]) => addRange(acc, s, e),
    [],
  );
}

test("prázdný začátek", () => {
  assert.deepEqual(addRange([], 0, 10), [{ s: 0, e: 10 }]);
  assert.equal(coverage([]), 0);
});

test("navazující heartbeaty se slijí do jednoho úseku", () => {
  const r = build([
    [0, 15],
    [15, 30],
    [30, 45],
  ]);
  assert.deepEqual(r, [{ s: 0, e: 45 }]);
});

test("mezera zůstane mezerou", () => {
  const r = build([
    [0, 15],
    [60, 75],
  ]);
  assert.equal(r.length, 2);
  assert.equal(coverage(r), 30);
});

test("idempotence — tentýž heartbeat třikrát", () => {
  const once = build([[0, 15]]);
  const thrice = build([
    [0, 15],
    [0, 15],
    [0, 15],
  ]);
  assert.deepEqual(thrice, once);
  assert.equal(coverage(thrice), 15);
});

test("na pořadí heartbeatů nezáleží", () => {
  const inOrder = build([
    [0, 15],
    [15, 30],
    [30, 45],
  ]);
  const shuffled = build([
    [30, 45],
    [0, 15],
    [15, 30],
  ]);
  assert.deepEqual(shuffled, inOrder);
});

test("překryv se nesčítá dvakrát", () => {
  const r = build([
    [0, 20],
    [10, 30],
  ]);
  assert.deepEqual(r, [{ s: 0, e: 30 }]);
  assert.equal(coverage(r), 30);
});

test("smyčka prvních deseti sekund nikam nevede", () => {
  let r: ReturnType<typeof addRange> = [];
  for (let i = 0; i < 50; i++) r = addRange(r, 0, 10);
  assert.equal(coverage(r), 10);
  assert.equal(coverageRatio(r, 300), 10 / 300);
});

test("nová mezera uprostřed se zaplní a ostrůvky se spojí", () => {
  const r = build([
    [0, 30],
    [60, 90],
    [25, 65],
  ]);
  assert.deepEqual(r, [{ s: 0, e: 90 }]);
});

test("prázdný nebo obrácený úsek se ignoruje", () => {
  const base = build([[0, 10]]);
  assert.deepEqual(addRange(base, 20, 20), base);
  assert.deepEqual(addRange(base, 30, 20), base);
  assert.deepEqual(addRange(base, NaN, 40), base);
});

test("počet ostrůvků je zastropovaný a pokrytí neklesne", () => {
  let r: ReturnType<typeof addRange> = [];
  for (let i = 0; i < 400; i++) r = addRange(r, i * 10, i * 10 + 1);
  assert.ok(r.length <= 200, `ostrůvků ${r.length}`);
  assert.ok(coverage(r) >= 400, `pokrytí ${coverage(r)}`);
});

test("coverageRatio nepřeteče přes 1", () => {
  const r = build([[0, 400]]);
  assert.equal(coverageRatio(r, 300), 1);
  assert.equal(coverageRatio(r, 0), 0);
});

/* ------------------------------------------------------------- clamp */

test("clamp uřízne podvržený heartbeat", () => {
  const seg = clampSegment(0, 3600, {
    durationSeconds: 300,
    maxSegmentSeconds: 30,
  });
  assert.deepEqual(seg, { s: 0, e: 30 });
});

test("clamp propustí poctivý heartbeat beze změny", () => {
  const seg = clampSegment(45, 60, {
    durationSeconds: 300,
    maxSegmentSeconds: 30,
  });
  assert.deepEqual(seg, { s: 45, e: 60 });
});

test("clamp zarovná do délky videa", () => {
  const seg = clampSegment(290, 320, {
    durationSeconds: 300,
    maxSegmentSeconds: 30,
  });
  assert.deepEqual(seg, { s: 290, e: 300 });
});

test("clamp odmítne nesmysly", () => {
  const opts = { durationSeconds: 300, maxSegmentSeconds: 30 };
  assert.equal(clampSegment(60, 60, opts), null);
  assert.equal(clampSegment(90, 30, opts), null);
  assert.equal(clampSegment(-100, -50, opts), null);
  assert.equal(clampSegment(NaN, 30, opts), null);
});

test("podvržený heartbeat lekci nedokončí", () => {
  // 300s lekce, útočník posílá jeden velký úsek dokola
  let r: ReturnType<typeof addRange> = [];
  for (let i = 0; i < 20; i++) {
    const seg = clampSegment(0, 3600, {
      durationSeconds: 300,
      maxSegmentSeconds: 30,
    });
    if (seg) r = addRange(r, seg.s, seg.e);
  }
  assert.equal(coverage(r), 30);
  assert.ok(coverageRatio(r, 300) < 0.9);
});
