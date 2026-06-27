#!/usr/bin/env python3
"""Convert sRGB colors (hex / rgb / rgba) to the oklch() form shadcn/Tailwind v4 expects.

shadcn writes theme colors as `oklch(L C H)` (L in 0..1, C the chroma, H the hue in
degrees) and `oklch(L C H / A)` when there's alpha. Figma variables almost always come
back as hex (e.g. `#949494`) or rgba. Converting by hand is error-prone and you do it
dozens of times per theme, so let this script do it.

Usage:
  # one color -> one oklch string
  python hex_to_oklch.py "#3B82F6"
  python hex_to_oklch.py "rgb(59 130 246)"
  python hex_to_oklch.py "rgba(59,130,246,0.5)"

  # many at once (space/comma/newline separated), prints "<input> -> <oklch>" per line
  python hex_to_oklch.py "#0A0A0A" "#FAFAFA" "#3B82F6"

  # batch a JSON map of {token: color}; prints {token: "oklch(...)"} to stdout
  python hex_to_oklch.py --json tokens.json
  echo '{"primary":"#3B82F6","bg":"#0A0A0A"}' | python hex_to_oklch.py --json -

Notes:
  - Pure stdlib, no deps. Math matches culori / the CSS Color 4 oklab conversion, so the
    output round-trips with what `oklch()` renders in the browser.
  - Precision defaults to 4 decimals for L/C and 2 for H (shadcn's house style). Override
    with --precision.
"""
import sys
import json
import math
import re


def _srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def parse_color(s: str):
    """Return (r, g, b, a) with r/g/b in 0..1 and a in 0..1. Raises ValueError on junk."""
    s = s.strip().lower()
    m = re.fullmatch(r"#([0-9a-f]{3,8})", s)
    if m:
        h = m.group(1)
        if len(h) == 3:
            r, g, b = (int(h[i] * 2, 16) for i in range(3))
            a = 255
        elif len(h) == 4:
            r, g, b, a = (int(h[i] * 2, 16) for i in range(4))
        elif len(h) == 6:
            r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
            a = 255
        elif len(h) == 8:
            r, g, b, a = (int(h[i : i + 2], 16) for i in (0, 2, 4, 6))
        else:
            raise ValueError(f"bad hex length: {s}")
        return r / 255, g / 255, b / 255, a / 255

    m = re.fullmatch(r"rgba?\(([^)]+)\)", s)
    if m:
        parts = re.split(r"[,\s/]+", m.group(1).strip())
        parts = [p for p in parts if p]
        if len(parts) not in (3, 4):
            raise ValueError(f"bad rgb(): {s}")
        nums = []
        for p in parts[:3]:
            v = float(p[:-1]) * 255 / 100 if p.endswith("%") else float(p)
            nums.append(v / 255)
        a = 1.0
        if len(parts) == 4:
            ap = parts[3]
            a = float(ap[:-1]) / 100 if ap.endswith("%") else float(ap)
        return nums[0], nums[1], nums[2], a

    raise ValueError(f"unrecognized color: {s!r} (use #hex, rgb(), or rgba())")


def to_oklch(color: str, p_lc: int = 4, p_h: int = 2) -> str:
    r, g, b, a = parse_color(color)
    lr, lg, lb = _srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b)

    l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
    m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
    s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

    l_, m_, s_ = (math.copysign(abs(v) ** (1 / 3), v) for v in (l, m, s))

    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

    C = math.hypot(A, B)
    H = math.degrees(math.atan2(B, A)) % 360.0

    Ls = f"{round(L, p_lc):g}"
    Cs = f"{round(C, p_lc):g}"
    # achromatic: hue is meaningless, shadcn writes "oklch(L 0 0)"
    Hs = "0" if C < 1e-4 else f"{round(H, p_h):g}"

    if a >= 0.999:
        return f"oklch({Ls} {Cs} {Hs})"
    return f"oklch({Ls} {Cs} {Hs} / {round(a, 4):g})"


def main(argv):
    args = argv[1:]
    p_lc, p_h = 4, 2
    if "--precision" in args:
        i = args.index("--precision")
        p_lc = int(args[i + 1])
        del args[i : i + 2]

    if args and args[0] == "--json":
        src = args[1] if len(args) > 1 else "-"
        raw = sys.stdin.read() if src == "-" else open(src, encoding="utf-8").read()
        data = json.loads(raw)
        out = {k: to_oklch(str(v), p_lc, p_h) for k, v in data.items()}
        print(json.dumps(out, indent=2))
        return 0

    if not args:
        print(__doc__)
        return 1

    for c in args:
        try:
            print(f"{c} -> {to_oklch(c, p_lc, p_h)}")
        except ValueError as e:
            print(f"{c} -> ERROR: {e}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
