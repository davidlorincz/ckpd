# Ověření členství ČKPD — API pro partnery

Rozhraní pro partnery komory, kteří členům poskytují výhody (slevy, přístupy,
nabídky zakázek). Partner se zeptá na ověřovací kód člena a dostane zpět, zda
členství platí a v jaké variantě.

Server-to-server. **Klíč nikdy nevystavuj v prohlížeči** — endpoint záměrně
neposílá CORS hlavičky, aby to nešlo ani omylem.

---

## Endpoint

```
GET https://ckpd.cz/api/v1/verify?code=<ověřovací kód>
Authorization: Bearer <klíč partnera>
```

Klíč vydává komora na vyžádání; každý partner má vlastní. Ukáže se jen jednou
při vydání — ztracený klíč nelze obnovit, jen nahradit novým.

## Odpověď — platné členství

```json
{
  "valid": true,
  "memberNumber": "CKPD-2026-0142",
  "tier": "pro",
  "tierLabel": "PRO",
  "price": 499,
  "currency": "CZK",
  "period": "měsíc",
  "memberSince": "2026-06-14",
  "paidUntil": "2026-09-30",
  "name": "Jan Novák"
}
```

| pole | význam |
|---|---|
| `memberNumber` | Členské číslo. Neměnné, není tajné — klidně ho zobraz v účtu. |
| `tier` | `zakladni` \| `pro` \| `cestne` — podle toho odstupňuj výhody. |
| `memberSince` | Datum vzniku členství (ISO). |
| `paidUntil` | Do kdy je příspěvek uhrazen (ISO). Po tomhle datu se ptej znovu. |
| `name` | Jméno **jen** se souhlasem člena se zveřejněním, jinak `null`. |

## Odpověď — neplatné

```json
{ "valid": false }
```

Vrací se úplně stejně pro neznámý kód, špatný tvar i pro členství, které
skončilo. Je to záměr — z odpovědi nejde zjistit, které kódy existují.

## Chyby

| HTTP | tělo | kdy |
|---|---|---|
| `400` | `{"error":"missing_code"}` | chybí parametr `code` |
| `401` | `{"error":"unauthorized"}` | chybí, neplatný nebo zrušený klíč |
| `429` | `{"error":"rate_limited"}` | překročen limit; hlavička `Retry-After: 60` |

Na každou odpověď se vrací `X-RateLimit-Limit`, `-Remaining` a `-Reset`
(unixový čas). Výchozí limit je 60 dotazů za minutu, po dohodě jde zvýšit.

---

## Formát kódu

Člen má dvě věci a nesmí se plést:

- **Členské číslo** `CKPD-2026-0142` — identita. Není tajná, zobrazuj ji.
- **Ověřovací kód** `CKPD-2026-0142-K7M9XQ2T` — členské číslo plus osm
  náhodných znaků. Tímhle se ověřuje.

Samotné členské číslo API odmítne. Kdyby stačilo, dalo by se projet
`0001`–`9999` a stáhnout celou členskou základnu.

Vstup se normalizuje, takže tolerujeme malá písmena, mezery místo pomlček,
chybějící prefix `CKPD-` i klasické záměny `I`/`l` za `1` a `O` za `0`.
Znaková sada je Crockford base32 (`0-9`, `A-Z` bez `I`, `L`, `O`, `U`).

## Jak to zapojit

Kód **nesbírej opakovaně**. Nech člena vložit ho jednou při propojení účtu,
ověř ho a ulož si u sebe jen `memberNumber` + `paidUntil` + `tier`. Kód
u sebe držet nemusíš. Po `paidUntil` se zeptej znovu — buď si kód nech
uložený bezpečně (jako heslo), nebo si o něj řekni znovu.

```bash
curl -s -H "Authorization: Bearer $CKPD_API_KEY" \
  "https://ckpd.cz/api/v1/verify?code=CKPD-2026-0142-K7M9XQ2T"
```

## Na co si dát pozor

- **Necachuj odpovědi.** Členství může skončit a odvolaný souhlas se
  zveřejněním se musí projevit hned. Endpoint proto posílá `Cache-Control: no-store`.
- **Neposílej kódy do logů** třetích stran.
- **Neptej se dávkově** na kódy, které ti člen nedal. Každý dotaz včetně
  neúspěšného se u komory zaznamenává a série neúspěchů vypadá jako hádání
  kódů.
- **Neexistuje endpoint, který vrátí seznam členů.** Ověřit jde jen kód,
  který ti člen sám dal. Dotaz podle e-mailu nebo jména rozhraní neumí
  záměrně.
