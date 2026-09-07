"""
Sestaví loga „<SLOVO> by DRONPRO" celá v křivkách.

Převzato z `uber_dronpro/scripts/build-logo.py`, kde vzor vznikl podle
endorsement lockupu HUBAI (HubaiLogo.tsx): hlavní nápis, pod ním zleva
zarovnaný řádek „by" + monochromní DRONPRO. Proporce se nepřebíraly doslova —
drží se vizuální hierarchie, ne čísla.

Mezera mezi „by" a DRONPRO se **dopočítává**, ne zadává: řádek se roztáhne
přes celou šířku hlavního nápisu (justifikace). S pevnou konstantou končil
podřádek na třech čtvrtinách šířky a lockup působil zmáčknutě.

Sazba jde do křivek, takže logo nezávisí na načtení fontu a DRONPRO wordmark
zůstane vcelku — je to registrovaná značka a nesmí se dělit na dvě barvy.

Spuštění (potřebuje fontTools, není v package.json):
    python3 scripts/build-logo.py
"""
import re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform

# Slova, pro která se lockup generuje. Krátká slova (ČKPD) mají vlastní
# poměry — u čtyř znaků je podřádek širší než nápis a výchozí hodnoty
# by daly nevyvážený blok.
WORDS = [
    ("BURZA", "burza", {}),
    ("PŮJČOVNA", "pujcovna", {}),
    ("ČKPD", "ckpd", {"DP_HEIGHT": 0.34, "BY_SIZE": 0.34, "ROW_GAP": 0.20}),
]

RAPID_BLACK = "public/fonts/DronProRapidVariable-BlackExt.woff2"
RAPID_BOLD = "public/fonts/DronProRapidVariable-BoldExt.woff2"
DRONPRO_SVG = "public/brand/dronpro-wordmark-navy.svg"

# Podíly vztažené k výšce hlavního slova.
DP_HEIGHT_DEFAULT = 0.46   # výška DRONPRO nápisu
ROW_GAP_DEFAULT = 0.16     # mezera mezi nápisem a řádkem „by“
BY_SIZE_DEFAULT = 0.46     # výška „by“ (stejná jako DRONPRO, sedí na společné účaří)
DP_OPACITY = 0.82
BY_OPACITY = 0.5
# Minimální mezera pro případ, že by hlavní slovo bylo tak krátké, že by se
# podřádek do jeho šířky nevešel (např. třípísmenná značka).
BY_GAP_MIN = 0.18


def word_path(word: str, font_path: str):
    """Vrátí (d, šířka, výška, xmin, ymax) pro slovo převedené do křivek."""
    font = TTFont(font_path)
    gs, cmap = font.getGlyphSet(), font.getBestCmap()
    kern = {}
    if "kern" in font:
        for st in font["kern"].kernTables:
            kern.update(st.kernTable)

    def run(pen_factory):
        x, prev = 0, None
        for ch in word:
            name = cmap[ord(ch)]
            if prev is not None:
                x += kern.get((prev, name), 0)
            gs[name].draw(TransformPen(pen_factory(), Transform(1, 0, 0, 1, x, 0)))
            x += gs[name].width
            prev = name

    spen = SVGPathPen(gs)
    run(lambda: spen)
    bpen = BoundsPen(gs)
    run(lambda: bpen)
    xmin, ymin, xmax, ymax = bpen.bounds
    return spen.getCommands(), xmax - xmin, ymax - ymin, xmin, ymax


def dronpro_path():
    s = open(DRONPRO_SVG, encoding="utf-8").read()
    d = re.search(r'\sd="([^"]+)"', s).group(1)
    vb = [float(n) for n in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    return d, vb[2], vb[3]


def build_one(word: str, slug: str, overrides: dict) -> None:
    """Vysází jedno logo. `overrides` přebíjí poměry pro krátká slova."""
    DP_HEIGHT = overrides.get("DP_HEIGHT", DP_HEIGHT_DEFAULT)
    ROW_GAP = overrides.get("ROW_GAP", ROW_GAP_DEFAULT)
    BY_SIZE = overrides.get("BY_SIZE", BY_SIZE_DEFAULT)

    mp_d, mp_w, mp_h, mp_xmin, mp_ymax = word_path(word, RAPID_BLACK)
    by_d, by_w, by_h, by_xmin, by_ymax = word_path("by", RAPID_BOLD)
    dp_d, dp_w, dp_h = dronpro_path()

    # Pracujeme v jednotkách, kde výška „Marketplace“ = 1000.
    U = 1000.0
    mp_scale = U / mp_h
    W_mp = mp_w * mp_scale

    dp_target_h = U * DP_HEIGHT
    dp_scale = dp_target_h / dp_h
    W_dp = dp_w * dp_scale

    by_target_h = U * BY_SIZE
    by_scale = by_target_h / by_h
    W_by = by_w * by_scale

    # Justifikace: „by“ vlevo, DRONPRO vpravo, mezera dopočítaná na šířku nápisu.
    BY_GAP = max((W_mp - W_by - W_dp) / U, BY_GAP_MIN)

    row_y = U + U * ROW_GAP
    # „by“ i DRONPRO sedí na společné účaří (align-items: flex-end u HUBAI).
    row_h = max(by_target_h, dp_target_h)
    total_h = row_y + row_h
    total_w = max(W_mp, W_by + U * BY_GAP + W_dp)


    def layer(d, scale, xmin, ymax, tx, top, opacity=None):
        """`top` je horní hrana prvku ve výsledném SVG; po překlopení y sedí kresba na [0, výška]."""
        op = f' opacity="{opacity}"' if opacity is not None else ""
        t = (
            f"translate({tx:.2f} {top:.2f}) scale({scale:.5f} {-scale:.5f}) "
            f"translate({-xmin:.2f} {-ymax:.2f})"
        )
        return f'<path{op} transform="{t}" d="{d}"/>'


    def build(color: str) -> str:
        parts = [
            layer(mp_d, mp_scale, mp_xmin, mp_ymax, 0, 0),
            layer(by_d, by_scale, by_xmin, by_ymax, 0, total_h - by_target_h, BY_OPACITY),
        ]
        # DRONPRO je hotová cesta v souřadnicích svého viewBoxu (y roste dolů).
        dp_x = W_by + U * BY_GAP
        dp_y = total_h - dp_target_h
        parts.append(
            f'<path opacity="{DP_OPACITY}" '
            f'transform="translate({dp_x:.2f} {dp_y:.2f}) scale({dp_scale:.5f})" d="{dp_d}"/>'
        )
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w:.1f} {total_h:.1f}" '
            f'fill="{color}" role="img" aria-label="{word} by DRONPRO">'
            + "".join(parts)
            + "</svg>"
        )


    for name, color in (("navy", "#000064"), ("white", "#ffffff"), ("current", "currentColor")):
        out = f"public/brand/{slug}-by-dronpro-{name}.svg"
        open(out, "w", encoding="utf-8").write(build(color))
        print(f"{out}  viewBox 0 0 {total_w:.0f} {total_h:.0f}  poměr {total_w/total_h:.3f}")


for word, slug, overrides in WORDS:
    build_one(word, slug, overrides)
