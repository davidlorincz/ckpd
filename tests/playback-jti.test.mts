/**
 * Testy dohledání uniklého odkazu na video.
 *
 *   node --test "tests/*.test.mts"
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { extractPlaybackJti } from "../convex/lib/code.ts";

/** Poskládá JWT se zadaným payloadem. Podpis je pro čtení `jti` nepodstatný. */
function jwtWith(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${b64({ alg: "RS256", typ: "JWT" })}.${b64(payload)}.podpis-neni-potreba`;
}

/** Takové `jti` reálně vzniká: prvních 12 znaků UUID bez pomlček, tedy hex. */
const JTI = "9f3a2ba71c04";

test("holé jti projde", () => {
  assert.equal(extractPlaybackJti(JTI), JTI);
  assert.equal(extractPlaybackJti(`  ${JTI}  `), JTI);
});

test("holý řetězec mimo tvar jti se nebere", () => {
  // jti je vždy hex — cokoli jiného je překlep, ne identifikátor,
  // a nemá smysl s tím chodit do databáze
  assert.equal(extractPlaybackJti("9f3k2ma71c04"), null);
  assert.equal(extractPlaybackJti("ahoj"), null);
});

test("jti se přečte ze samotného tokenu", () => {
  assert.equal(extractPlaybackJti(jwtWith({ sub: "abc", jti: JTI })), JTI);
});

test("jti se přečte z celé adresy videa", () => {
  const url = `https://stream.mux.com/VwgjNnZA.m3u8?max_resolution=1080p&token=${jwtWith({ jti: JTI })}`;
  assert.equal(extractPlaybackJti(url), JTI);
});

test("token jako první parametr adresy", () => {
  assert.equal(
    extractPlaybackJti(`https://stream.mux.com/x.m3u8?token=${jwtWith({ jti: JTI })}&foo=1`),
    JTI,
  );
});

test("token bez jti nevrací nic", () => {
  assert.equal(extractPlaybackJti(jwtWith({ sub: "abc", aud: "v" })), null);
});

test("nesmysly nevracejí nic", () => {
  assert.equal(extractPlaybackJti(""), null);
  assert.equal(extractPlaybackJti("   "), null);
  assert.equal(extractPlaybackJti("https://ckpd.cz/kurz"), null);
  assert.equal(extractPlaybackJti("tohle není token"), null);
  assert.equal(extractPlaybackJti("a.b.c"), null);
});

test("payload, který není JSON, nespadne", () => {
  assert.equal(extractPlaybackJti("hlavicka.nenijson.podpis"), null);
});

test("jti jiného typu než řetězec se ignoruje", () => {
  assert.equal(extractPlaybackJti(jwtWith({ jti: 12345 })), null);
  assert.equal(extractPlaybackJti(jwtWith({ jti: "" })), null);
});

test("base64url se dekóduje správně (pomlčky a podtržítka)", () => {
  // payload nacpaný tak, aby v base64 vznikly znaky + a /
  const payload = { jti: JTI, pad: "??>>>???~~~ÿþ" };
  assert.equal(extractPlaybackJti(jwtWith(payload)), JTI);
});
