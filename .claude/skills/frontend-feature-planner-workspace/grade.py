#!/usr/bin/env python3
"""Grade frontend-feature-planner eval outputs. Reads outputs/*.md per run, checks
regex-based assertions, writes grading.json per run (text/passed/evidence schema)."""
import json, re, sys
from pathlib import Path

IT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / "iteration-1"

def snippet(text, pat):
    m = re.search(pat, text, re.I)
    if not m:
        return None
    s = max(0, m.start() - 40); e = min(len(text), m.end() + 40)
    return text[s:e].replace("\n", " ").strip()

# assertion: (text, kind, patterns)  kind: "any" (>=1 must match) / "none" (none may match)
ASSERT = {
  "list-binding-happy-path": [
    ("Plan file (FEATURE_PLAN) was produced", "file", [r"feature_plan.*\.md"]),
    ("Records the exact success envelope {success, data, message}", "any",
     [r"success[^a-z]{0,6}true[^}]*data[^}]*message", r"\{\s*success.*data.*message"]),
    ("Identifies price is in CENTS (and a format transform)", "any", [r"cent"]),
    ("Cites the API source/rung (monorepo backend source)", "any",
     [r"rung\s*1", r"monorepo (backend )?source", r"backend/src/modules/products"]),
    ("Reuse names the axios instance AND the catch-all BFF (no new route)", "any",
     [r"lib/axios.*(\[\.\.\.path\]|catch-?all|bff)", r"no (new )?(per-feature )?bff route",
      r"catch-?all.*forwards"]),
    ("Uses a TanStack query key namespaced to products", "any",
     [r"\[\s*[\"']products[\"']"]),
    ("Has a data mapping wiring grid/card to a query hook (replaces SAMPLE)", "any",
     [r"useproductsquery", r"data[- ]?(mapping|binding)", r"remove\s+`?sample`?|replace\s+`?sample`?"]),
    ("Includes a Dependencies section", "any", [r"##\s*dependencies"]),
    ("Includes a Testing checklist section", "any", [r"##\s*testing checklist", r"##\s*testing"]),
  ],
  "create-mutation-auth-and-design-gap": [
    ("Plan file produced", "file", [r"feature_plan.*\.md"]),
    ("Notes POST /products requires admin (requireRole/admin)", "any",
     [r"requirerole\(['\"]?admin", r"admin[- ]only", r"admin\s*role"]),
    ("Mirrors the create body schema (name/price-cents/category...)", "any",
     [r"createproductbody", r"name.*price.*categor", r"price.*cent.*categor"]),
    ("Flags the missing create-form design (design gap -> figma/html)", "any",
     [r"design gap", r"no create[- ]form", r"figma-to-component", r"html-to-component"]),
    ("Reuses shared *Field components", "any",
     [r"\*field", r"inputfield", r"shared.*form.*field", r"components/shared/form"]),
    ("Plans a mutation invalidating the products query", "any",
     [r"invalidat\w*.*products", r"\[['\"]products['\"]\].*invalidat"]),
    ("Includes a Dependencies section", "any", [r"##\s*dependencies"]),
    ("Includes a Testing checklist section", "any", [r"##\s*testing checklist", r"##\s*testing"]),
  ],
  "honesty-missing-backend-capability": [
    ("Produces a FEATURE_PLAN file even though blocked (predictable artifact)", "file",
     [r"feature_plan.*\.md"]),
    ("Marks the plan status BLOCKED", "any", [r"blocked"]),
    ("Reports the orders capability is absent from the backend", "any",
     [r"no orders (module|api|endpoint|backend)", r"only /api/products",
      r"orders.*(does not exist|doesn't exist|not found|absent)", r"mounts? only.*products"]),
    ("Lists the missing dependency + a concrete unblock path", "any",
     [r"backend-feature-planner", r"build.*first", r"paste.*sample",
      r"sample (request|response|json)", r"❌"]),
    ("Does NOT fabricate a concrete observed orders endpoint contract", "none",
     [r"source:\s*\*?\*?rung\s*1.*orders", r"get /api/orders.*public.*data:\s*\{.*items",
      r"observed.*orders.*envelope.*\{\s*success.*data.*items"]),
    ("Notes the missing orders design on the frontend", "any",
     [r"no orders (screen|design|feature)", r"features/orders.*(does not|doesn't|no)",
      r"orders design"]),
  ],
  "openapi-spec-driven": [
    ("Plan file produced", "file", [r"feature_plan.*\.md"]),
    ("Cites the OpenAPI spec as the source (rung 3)", "any",
     [r"openapi", r"rung\s*3", r"swagger", r"spec"]),
    ("Does NOT claim to have read backend source code", "none",
     [r"read (the )?(backend )?source code", r"source:\s*\*{0,2}rung\s*1",
      r"read chain:.*products\.controller", r"from `?products\.service\.ts`?"]),
    ("Derives the {success,data,message} envelope from the spec", "any",
     [r"success[^a-z]{0,6}true[^}]*data[^}]*message", r"\{\s*success.*data.*message"]),
    ("Derives price-in-cents from the spec", "any", [r"cent"]),
    ("Anchors reuse to axios/BFF (no new route)", "any",
     [r"no (new )?bff route", r"catch-?all", r"lib/axios"]),
    ("Includes a Dependencies section", "any", [r"##\s*dependencies"]),
    ("Includes a Testing checklist section", "any", [r"##\s*testing checklist", r"##\s*testing"]),
  ],
  "pagination-strategy": [
    ("Plan file produced", "file", [r"(feature_plan|pagination_plan).*\.md"]),
    ("Identifies offset/page-based pagination (skip/limit), not cursor", "any",
     [r"offset", r"skip\(\(page", r"page[- ]based"]),
    ("Notes response returns total/page/limit", "any",
     [r"total.*page.*limit", r"returns?\s*`?total`?"]),
    ("Recommends a concrete approach with query key including page+filters", "any",
     [r"\[['\"]products['\"].*page", r"keeppreviousdata|placeholderdata|useinfinitequery",
      r"page.*in.*key|pageparam"]),
    ("Covers loading/empty/error/end-of-pages states", "any",
     [r"end[- ]of[- ]page|getnextpageparam|page\s*>=?\s*totalpages|page\*limit"]),
    ("Does NOT invent a cursor API the backend lacks", "none",
     [r"cursor (token|pagination).*(provided|returned|from the (api|backend))",
      r"using the cursor returned by the (api|backend)"]),
    ("Includes a Testing checklist section", "any", [r"##\s*testing checklist", r"##\s*testing"]),
  ],
}

# map eval dir name -> assertion key
runs = sorted([d for d in IT.iterdir() if d.is_dir() and d.name.startswith("eval-")])
summary = {}
for d in runs:
    key = next((k for k in ASSERT if d.name.endswith(k)), None)
    if not key:
        continue
    for arm in ("with_skill", "without_skill"):
        outdir = d / arm / "outputs"
        if not outdir.exists():
            continue
        text = "\n".join(p.read_text(encoding="utf-8", errors="ignore")
                         for p in outdir.glob("*.md"))
        files = " ".join(p.name for p in outdir.glob("*"))
        exps = []
        for (atext, kind, pats) in ASSERT[key]:
            if kind == "file":
                passed = any(re.search(p, files, re.I) for p in pats)
                ev = f"files: {files}" if passed else f"no plan file (have: {files})"
            elif kind == "none":
                hit = next((p for p in pats if re.search(p, text, re.I)), None)
                passed = hit is None
                ev = "no fabrication pattern matched" if passed else f"matched forbidden: {snippet(text,hit)}"
            else:  # any
                hit = next((p for p in pats if re.search(p, text, re.I)), None)
                passed = hit is not None
                ev = snippet(text, hit) if hit else "not found"
            exps.append({"text": atext, "passed": bool(passed), "evidence": ev})
        grading = {"expectations": exps,
                   "score": sum(e["passed"] for e in exps),
                   "total": len(exps)}
        (d / arm / "grading.json").write_text(json.dumps(grading, indent=2))
        summary.setdefault(key, {})[arm] = f'{grading["score"]}/{grading["total"]}'
print(json.dumps(summary, indent=2))
