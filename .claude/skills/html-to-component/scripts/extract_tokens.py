#!/usr/bin/env python3
"""Scan an HTML/CSS file for design tokens and print a frequency-sorted inventory.

Phase 1 of html-to-component needs the design's *recurring* values — colors, font
families, font sizes, radii, shadows, gradients — pulled out of the source so they can
become shadcn theme tokens. Doing that by eye across a big file is slow and lossy, so this
script does the mechanical sweep. It reads <style> blocks, inline style="..." attributes,
plain CSS, and Tailwind arbitrary values (e.g. bg-[#3B82F6], text-[14px]).

It is deliberately a FIRST PASS, not a theme generator: it tells you what's in the file and
how often, frequency-sorted, so you can decide which values are tokens (recurring) and which
are one-offs (component-level). Feed the colors you pick into hex_to_oklch.py.

Usage:
  python extract_tokens.py design.html
  python extract_tokens.py styles.css --json
  cat a.html b.css | python extract_tokens.py -          # read stdin

Notes:
  - Pure stdlib, regex-based. It does not resolve the CSS cascade or compute specificity;
    it surfaces raw values + counts. Use judgment on what's actually a token.
  - It does NOT follow <link rel="stylesheet"> hrefs — read those files too (pass them in,
    or cat them together). reading-html.md explains why.
"""
import sys
import re
import json
from collections import Counter

# --- color: hex, rgb/rgba, hsl/hsla, oklch (already-converted) ---
HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RGB = re.compile(r"rgba?\([^)]*\)", re.I)
HSL = re.compile(r"hsla?\([^)]*\)", re.I)
OKLCH = re.compile(r"oklch\([^)]*\)", re.I)

# --- typography ---
FONT_FAMILY = re.compile(r"font-family\s*:\s*([^;}{]+)", re.I)
FONT_FAMILY_SHORT = re.compile(r"\bfont\s*:\s*[^;}{]*?\b([\"']?[A-Za-z][\w \-]+[\"']?)\s*(?:;|\})", re.I)
GOOGLE_FONTS = re.compile(r"fonts\.googleapis\.com/css2?\?([^\"')\s]+)", re.I)
FONT_FACE = re.compile(r"@font-face\s*\{[^}]*?font-family\s*:\s*([^;}{]+)", re.I | re.S)
# font-size from CSS declarations and Tailwind text-[..]
FONT_SIZE = re.compile(r"font-size\s*:\s*([0-9.]+(?:px|rem|em|pt))", re.I)
TW_TEXT = re.compile(r"\btext-\[([0-9.]+(?:px|rem|em))\]")

# --- radius / shadow / gradient ---
RADIUS = re.compile(r"border-radius\s*:\s*([^;}{]+)", re.I)
TW_ROUNDED = re.compile(r"\brounded-\[([^\]]+)\]")
SHADOW = re.compile(r"box-shadow\s*:\s*([^;}{]+)", re.I)
GRADIENT = re.compile(r"(?:linear|radial|conic)-gradient\([^;}{]*\)", re.I)

# Tailwind arbitrary color values: bg-[#fff], text-[rgb(...)], border-[#abc]
TW_ARB_COLOR = re.compile(r"-\[(#[0-9a-fA-F]{3,8}|rgba?\([^\]]*\)|hsla?\([^\]]*\)|oklch\([^\]]*\))\]")


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip()).strip("\"'").rstrip(";").strip()


def _count(matches):
    c = Counter(_norm(m) for m in matches if _norm(m))
    return [{"value": v, "count": n} for v, n in c.most_common()]


def extract(text: str) -> dict:
    colors = Counter()
    for rx in (HEX, RGB, HSL, OKLCH):
        for m in rx.findall(text):
            colors[_norm(m).lower()] += 1
    for m in TW_ARB_COLOR.findall(text):
        colors[_norm(m).lower()] += 1

    families = Counter()
    for m in FONT_FAMILY.findall(text):
        # first family in the stack is the intended face
        first = m.split(",")[0]
        fam = _norm(first)
        if fam and not fam.startswith("var("):
            families[fam] += 1
    for m in FONT_FACE.findall(text):
        families[_norm(m.split(",")[0])] += 2  # weight @font-face heavier
    google = []
    for q in GOOGLE_FONTS.findall(text):
        for part in q.split("&"):
            if part.startswith("family="):
                google.append(part[len("family="):].split(":")[0].replace("+", " "))

    sizes = Counter(_norm(m) for m in FONT_SIZE.findall(text))
    for m in TW_TEXT.findall(text):
        sizes[_norm(m)] += 1

    radii = Counter(_norm(m) for m in RADIUS.findall(text))
    for m in TW_ROUNDED.findall(text):
        radii[_norm(m)] += 1

    shadows = Counter(_norm(m) for m in SHADOW.findall(text))
    gradients = Counter(_norm(m) for m in GRADIENT.findall(text))

    def topn(counter):
        return [{"value": v, "count": n} for v, n in counter.most_common()]

    return {
        "colors": [{"value": v, "count": n} for v, n in colors.most_common()],
        "font_families": [{"value": v, "count": n} for v, n in families.most_common()],
        "google_fonts": sorted(set(google)),
        "font_sizes": topn(sizes),
        "border_radius": topn(radii),
        "shadows": topn(shadows),
        "gradients": topn(gradients),
    }


def print_human(d: dict):
    def section(title, items, fmt=lambda i: f"{i['value']}  (x{i['count']})"):
        print(f"\n## {title} ({len(items)})")
        if not items:
            print("  (none found)")
            return
        for i in items:
            print(f"  {fmt(i) if isinstance(i, dict) else i}")

    section("Colors", d["colors"])
    print(f"\n## Font families ({len(d['font_families'])})")
    for i in d["font_families"]:
        print(f"  {i['value']}  (x{i['count']})")
    if d["google_fonts"]:
        print(f"\n## Google Fonts <link> ({len(d['google_fonts'])})")
        for g in d["google_fonts"]:
            print(f"  {g}")
    section("Font sizes", d["font_sizes"])
    section("Border radius", d["border_radius"])
    section("Shadows", d["shadows"])
    section("Gradients", d["gradients"])
    print("\n# Next: pick the RECURRING colors as a {role: hex} map and run hex_to_oklch.py.")


def main(argv):
    args = argv[1:]
    as_json = "--json" in args
    args = [a for a in args if a != "--json"]
    src = args[0] if args else "-"
    text = sys.stdin.read() if src == "-" else open(src, encoding="utf-8", errors="ignore").read()
    d = extract(text)
    if as_json:
        print(json.dumps(d, indent=2))
    else:
        print_human(d)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
