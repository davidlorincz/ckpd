# ckpd-web

Veřejný web **České komory pilotů DRONů z.s.** — ckpd.cz.
Postaveno dle [CKPD Web — PRD](https://ckpd.cz) (Obsidian: `Projects/DronPro/Content/CKPD/CKPD Web — PRD.md`).

## Stack

- Next.js 15 (App Router, TypeScript, Turbopack), Tailwind CSS v4
- Fonty self-hosted přes `@fontsource` (Source Serif 4 Variable + Inter) — žádné Google Fonts CDN, žádné cookies, žádná analytika třetích stran
- Stanoviska: MDX v `content/stanoviska/*.mdx` (frontmatter: `title`, `date`, `perex`, `pdf?`, `draft?`)
- Formulář: React Hook Form + Zod — **zatím jen UI**, odeslání není napojené

## Příkazy

```bash
pnpm dev          # dev server
pnpm build        # content-lint + produkční build
pnpm lint:content # kontrola zakázané slovní zásoby (PRD § 8)
```

## Feature flagy (`lib/flags.ts`)

| Flag | Stav | Kdy zapnout |
|---|---|---|
| `SHOW_STATS` | vypnuto | až budou reálná čísla (nikdy smyšlená) |
| `SHOW_BODIES` | vypnuto | až budou obsazené orgány (Rada + Revizní komise) — **bez toho web nespouštět** (PRD § 4.7) |

## Obsahová pravidla

- Zakázaná slova („licence", „certifikace", „oprávnění", „registr pilotů", „povinné členství", „akreditace", „garantujeme bezpečnost") hlídá `scripts/content-lint.mjs` — běží v rámci `pnpm build`. Povolená výjimka: právní termín „oprávněný zájem" (GDPR).
- Členské výhody: zdroj pravdy je `memberBenefits` v `lib/site.ts`. Položky s `unconfirmed: true` se **nezobrazují** — před zveřejněním je musí potvrdit DRONPRO/Rada (nikdy neslibovat, co neplatí).
- Stanoviska s `draft: true` se zobrazují jen ve dev režimu (s bannerem „návrh k revizi"); v produkci jsou skrytá.

## Značka

- `public/brand/znak.svg` — symbol (čtyřrotorová značka), generováno Recraftem, optimalizováno svgo
- `public/brand/znak-inverse.svg` — papírová varianta na tmavé plochy
- `app/icon.svg` — favicon (symbol bez obvodového textu)
- Plná pečeť s textem po obvodu: komponenta `components/ui/Seal.tsx` (inline SVG, text sází Source Serif 4 z page CSS). Pro tiskové použití nechat text převést do křivek.

## Checklist před spuštěním (F0/F3/F4)

1. **Orgány** — obsadit Radu (5) a Revizní komisi (3), doplnit fotky do `public/lide/`, jména do `components/sections/Bodies.tsx`, zapnout `SHOW_BODIES`. Blokující podmínka launche.
2. **Stanovy PDF** — nahrát do `public/dokumenty/`, odkomentovat řádek v `components/sections/Transparency.tsx`.
3. **Datová schránka** — doplnit ID v `lib/site.ts` (`org.dataBox`).
4. **E-maily** — zřídit `info@ckpd.cz`, `media@ckpd.cz`, `rada@ckpd.cz` (samostatný účet, ne DRONPRO infrastruktura).
5. **Benefity** — potvrdit položky `unconfirmed` v `lib/site.ts` (přednostní servis, testovací dny, Zpráva v předstihu), nepotvrzené smazat.
6. **F3 backend** — Airtable base „CKPD — členové" + Resend (samostatný projekt!), server action do `components/forms/MembershipForm.tsx` místo stub stavu.
7. **První stanovisko** — zrevidovat draft `content/stanoviska/2026-08-sber-dat-o-provozu.mdx`, po schválení Radou odstranit `draft: true`.
8. **Deploy** — samostatný Vercel účet/projekt, doména ckpd.cz, `www` → apex redirect.
9. **Lighthouse** — cíl ≥ 95 mobil ve všech kategoriích; ověřit na produkčním buildu.

## Právní poznámky (ze strategie)

- Příspěvky musí vyplývat ze stanov (§ 19 ZDP — osvobození od daně z příjmů); formulaci nechat zkontrolovat účetní.
- Benefity vázané na příspěvek nesou riziko DPH režimu (protiplnění) — konzultovat s účetní formulaci „dobrovolné plnění partnerů".
- Patička musí vždy obsahovat disclosure DRONPRO a větu „Nejsme zřízeni zákonem…" (§ 132 obč. zák.).
