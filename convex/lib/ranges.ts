/**
 * Sledované úseky videa.
 *
 * PROČ TO NENÍ JEN JEDNO ČÍSLO:
 *
 * Nabízí se držet u lekce `maxPosition` (nejdál dosažený bod) nebo
 * `watchedSeconds` (součet přehraného). Obojí se dá zlomit, a to bez zlé vůle:
 *
 *  - `maxPosition` sám o sobě → přetáhnu posuvník na konec a mám „dokoukáno“,
 *    aniž bych viděl jediný snímek.
 *  - `watchedSeconds` sám o sobě → nechám běžet prvních deset sekund ve smyčce
 *    a načítám si čas donekonečna.
 *
 * Poctivě to umí odpovědět jen **pokrytí**: které úseky videa reálně proběhly.
 * Držíme je jako seřazené, nepřekrývající se intervaly a při každém heartbeatu
 * do nich nový úsek sjednotíme. Sjednocení je idempotentní — tentýž heartbeat
 * poslaný třikrát, nebo heartbeaty, které dorazí přeházeně, dají stejný výsledek.
 * To je podstatné, protože klient posílá i `sendBeacon` při zavření karty a ten
 * nemá jak potvrdit doručení, takže se posílá radši jednou navíc.
 *
 * Postgres by na tohle měl `int4multirange`, kde `+` udělá merge sám.
 * V Convexu to musí být takhle ručně.
 */

/** Jeden souvislý úsek v sekundách media-time. `s` včetně, `e` mimo. */
export type Range = { s: number; e: number };

/**
 * Dva intervaly se slijí, když se překrývají nebo je mezi nimi mezera do 50 ms.
 * Tolerance je jen na plovoucí čárku — sousední heartbeaty se potkávají na
 * stejném čísle a zaokrouhlení by jinak nechalo vlásečnicové mezery a z nich
 * stovky ostrůvků. Vyšší hodnota by nadhodnocovala pokrytí, což by se propsalo
 * až do potvrzení o absolvování.
 */
const TOUCH_EPS = 0.05;

/**
 * Strop na počet ostrůvků v jednom dokumentu. Běžné sledování jich udělá
 * do dvaceti; kdo hodně přeskakuje, může jich nadělat mnohem víc a pole v
 * Convex dokumentu není nafukovací. Nad stropem se slévají nejtěsnější
 * sousedé — pokrytí tím může jen mírně narůst, nikdy neklesnout.
 */
const MAX_ISLANDS = 200;

/** Zaokrouhlení na milisekundy. Jemnější rozlišení nemá u videa smysl. */
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Přidá úsek a vrátí nové sjednocené pole. Vstup musí být seřazený a
 * nepřekrývající se — což platí, protože jinudy než přes tuhle funkci se
 * do něj nezapisuje.
 *
 * Prázdný nebo obrácený úsek se ignoruje.
 */
export function addRange(ranges: readonly Range[], s: number, e: number): Range[] {
  const from = round(s);
  const to = round(e);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    return ranges.map((r) => ({ ...r }));
  }

  const out: Range[] = [];
  let cur: Range = { s: from, e: to };
  let placed = false;

  for (const r of ranges) {
    if (r.e < cur.s - TOUCH_EPS) {
      // celý před vkládaným úsekem
      out.push({ ...r });
    } else if (r.s > cur.e + TOUCH_EPS) {
      // celý za ním — vkládaný úsek je hotový, zbytek se jen přepíše
      if (!placed) {
        out.push(cur);
        placed = true;
      }
      out.push({ ...r });
    } else {
      // dotýká se nebo překrývá → pohltíme
      cur = { s: Math.min(cur.s, r.s), e: Math.max(cur.e, r.e) };
    }
  }
  if (!placed) out.push(cur);

  return out.length > MAX_ISLANDS ? coalesce(out, MAX_ISLANDS) : out;
}

/**
 * Sleje nejtěsnější sousedy, dokud se pole nevejde do limitu.
 * Kvadratické, ale běží jen při překročení stropu a nad ~200 prvky.
 */
function coalesce(ranges: Range[], limit: number): Range[] {
  const out = ranges.map((r) => ({ ...r }));
  while (out.length > limit) {
    let bestIndex = 0;
    let bestGap = Infinity;
    for (let i = 0; i < out.length - 1; i++) {
      const gap = out[i + 1].s - out[i].e;
      if (gap < bestGap) {
        bestGap = gap;
        bestIndex = i;
      }
    }
    out.splice(bestIndex, 2, {
      s: out[bestIndex].s,
      e: Math.max(out[bestIndex].e, out[bestIndex + 1].e),
    });
  }
  return out;
}

/** Kolik sekund videa je reálně pokrytých. */
export function coverage(ranges: readonly Range[]): number {
  let total = 0;
  for (const r of ranges) total += r.e - r.s;
  return round(total);
}

/** Podíl pokrytí k délce videa, 0–1. Nula pro lekci bez známé délky. */
export function coverageRatio(
  ranges: readonly Range[],
  durationSeconds: number,
): number {
  if (!(durationSeconds > 0)) return 0;
  return Math.min(1, coverage(ranges) / durationSeconds);
}

/**
 * Ořez jednoho heartbeatu — **bezpečnostní hranice, ne kosmetika.**
 *
 * Klient hlásí, který úsek přehrál. Kdyby se mu věřilo, stačí jeden ručně
 * poslaný požadavek `{from: 0, to: 3600}` a lekce je „dokoukaná“ — a s ní
 * i potvrzení o absolvování, které má komora vydat.
 *
 * Server proto přijme nanejvýš dvojnásobek heartbeat intervalu (jeden
 * zameškaný tik se ještě vejde) a úsek zároveň zarovná do délky videa.
 * Vrací `null`, když z požadavku nezbude nic použitelného.
 */
export function clampSegment(
  from: number,
  to: number,
  opts: { durationSeconds: number; maxSegmentSeconds: number },
): Range | null {
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;

  const duration = opts.durationSeconds > 0 ? opts.durationSeconds : Infinity;
  const s = Math.max(0, Math.min(round(from), duration));
  const rawEnd = Math.max(0, Math.min(round(to), duration));
  if (rawEnd <= s) return null;

  const e = Math.min(rawEnd, round(s + opts.maxSegmentSeconds));
  return e > s ? { s, e } : null;
}
