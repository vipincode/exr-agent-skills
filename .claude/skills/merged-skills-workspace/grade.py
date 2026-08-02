"""Programmatic grading for the merged-skills eval suite.

Checks every assertion that can be decided from the produced files alone. Assertions that need
judgment (e.g. "handled honestly", "reported as a finding") are emitted with passed=None so a
grader agent can fill them in; everything else is decided here so it is reproducible and rerunnable
across iterations.

Usage:  python grade.py iteration-1
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FIXTURES = ROOT / "fixtures"


# ---------------------------------------------------------------- helpers

def read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def files(outputs: Path) -> list[Path]:
    if not outputs.is_dir():
        return []
    return [p for p in outputs.rglob("*") if p.is_file() and p.name != "_RUN_NOTES.md"]


def rel(outputs: Path, p: Path) -> str:
    return p.relative_to(outputs).as_posix()


def all_text(outputs: Path) -> str:
    return "\n".join(read(p) for p in files(outputs))


def notes(run: Path) -> str:
    return read(run / "outputs" / "_RUN_NOTES.md")


def slice_files(outputs: Path) -> list[Path]:
    """Numbered slice files: NN-name.md anywhere under _docs/features/."""
    return sorted(
        p for p in files(outputs)
        if re.fullmatch(r"\d{2}-[a-z0-9-]+\.md", p.name) and "_docs/features/" in rel(outputs, p)
    )


def master_plan(outputs: Path) -> Path | None:
    for p in files(outputs):
        r = rel(outputs, p)
        if "_docs/features/" in r and p.name.endswith("-plan.md"):
            return p
    return None


def digest(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def source_untouched(outputs: Path, fixture: Path, subdirs: tuple[str, ...]) -> tuple[bool, str]:
    """True when no file under the given fixture subdirs was written to outputs with new content."""
    offenders = []
    for p in files(outputs):
        r = rel(outputs, p)
        if not any(r.startswith(s) for s in subdirs):
            continue
        src = fixture / r
        if not src.exists():
            offenders.append(f"{r} (new file in source tree)")
        elif digest(src) != digest(p):
            offenders.append(f"{r} (modified)")
    return (not offenders), ("; ".join(offenders) if offenders else "no source files added or modified")


def code_written(outputs: Path) -> list[str]:
    return [rel(outputs, p) for p in files(outputs) if p.suffix in {".ts", ".tsx", ".js", ".jsx"}]


NEG = re.compile(
    r"\b(not|no|never|without|instead\s+of|rather\s+than|unlike|avoid|absent|lacks|"
    r"neither|nor|don't|doesn't|isn't|aren't|migrat\w*|would|if\s+you)\b",
    re.I,
)


def prescribed(text: str, term: str) -> tuple[bool, list[str]]:
    """True when `term` appears on a line that reads as a POSITIVE instruction.

    Descriptive contracts routinely name the stack they are NOT using ("Joi 17. Not Zod.",
    "No TanStack Query"). Counting those as violations is wrong, so a line carrying a negation
    (or a heading/blockquote framing the contrast) does not count as prescribing the term.
    """
    hits = []
    for line in text.splitlines():
        if not re.search(term, line, re.I):
            continue
        if NEG.search(line):
            continue
        if line.lstrip().startswith((">", "#")):
            continue
        hits.append(line.strip()[:120])
    return bool(hits), hits


def res(text: str, passed, evidence: str) -> dict:
    return {"text": text, "passed": passed, "evidence": evidence}


MANUAL = "needs grader judgment"


# ---------------------------------------------------------------- eval 0

def grade_eval0(run: Path) -> list[dict]:
    o = run / "outputs"
    out: list[dict] = []
    sl = slice_files(o)
    mp = master_plan(o)
    names = [rel(o, p) for p in files(o)]

    plan_at_root = mp is not None and rel(o, mp).startswith("_docs/features/auth/")
    out.append(res(
        "Master plan written to _docs/features/auth/auth-plan.md at the REPO ROOT (not inside backend/ or frontend/)",
        plan_at_root,
        f"master plan: {rel(o, mp) if mp else 'NONE FOUND'}; all files: {names}"))

    out.append(res(
        "Module is sharded into at least 3 separate slice files with zero-padded numeric prefixes (01-, 02-, 03-)",
        len(sl) >= 3,
        f"{len(sl)} slice files: {[p.name for p in sl]}"))

    order = [p.name for p in sl]
    reg = next((i for i, n in enumerate(order) if "regist" in n), None)
    log_in = next((i for i, n in enumerate(order) if re.search(r"log-?in|signin|sign-in", n)), None)
    log_out = next((i for i, n in enumerate(order) if re.search(r"log-?out|signout|sign-out", n)), None)
    ok_order = reg == 0 and (log_in is not None and log_out is not None and log_in < log_out)
    out.append(res(
        "Slice order respects dependencies: register is 01, and login comes before logout",
        ok_order,
        f"order={order} (register idx={reg}, login idx={log_in}, logout idx={log_out})"))

    with_contract = [p.name for p in sl if re.search(r"^#+ .*(api )?contract", read(p), re.I | re.M)]
    out.append(res(
        "Every slice file contains an API contract section stating that slice's endpoints (method, path, auth, request, response)",
        len(sl) > 0 and len(with_contract) == len(sl),
        f"{len(with_contract)}/{len(sl)} slices have a contract heading: {with_contract}"))

    both = [p.name for p in sl
            if re.search(r"^#+ .*backend", read(p), re.I | re.M) and re.search(r"^#+ .*frontend", read(p), re.I | re.M)]
    out.append(res(
        "Every slice file covers BOTH a backend half and a frontend half (or an explicit n/a for one)",
        len(sl) > 0 and len(both) == len(sl),
        f"{len(both)}/{len(sl)} slices have both halves: {both}"))

    out.append(res(
        "The frontend half of each slice matches its own slice's stated contract - no conflicting response shape between the two halves",
        None, MANUAL))

    with_status = [p.name for p in sl if re.search(r"^>?\s*\**status\**\s*:\s*(ready|blocked|built)", read(p), re.I | re.M)]
    out.append(res(
        "Every slice file carries a Status line with one of ready / blocked / built",
        len(sl) > 0 and len(with_status) == len(sl),
        f"{len(with_status)}/{len(sl)} slices have a status line: {with_status}"))

    checklists = {p.name: len(re.findall(r"^\s*-\s*\[[ xX]\]", read(p), re.M)) for p in sl}
    out.append(res(
        "Every slice file has a testing checklist with at least 3 concrete checkbox items",
        len(sl) > 0 and all(v >= 3 for v in checklists.values()),
        f"checkbox counts: {checklists}"))

    mp_text = read(mp) if mp else ""
    table_rows = len(re.findall(r"^\|\s*0?\d{1,2}\s*\|", mp_text, re.M))
    out.append(res(
        "Master plan contains a build-order table listing every slice with its order and dependencies",
        table_rows >= len(sl) and len(sl) > 0 and bool(re.search(r"depend", mp_text, re.I)),
        f"{table_rows} numbered table rows vs {len(sl)} slices; 'depends' mentioned: {bool(re.search(r'depend', mp_text, re.I))}"))

    model_in_master = bool(re.search(r"^#+ .*data model", mp_text, re.I | re.M))
    model_in_slices = [p.name for p in sl if re.search(r"^#+ .*data model", read(p), re.I | re.M)]
    out.append(res(
        "The User data model is defined once in the master plan, not repeated in each slice",
        model_in_master and len(model_in_slices) == 0,
        f"data-model heading in master: {model_in_master}; slices that redefine it: {model_in_slices or 'none'}"))

    txt = all_text(o)
    wanted = ["app-response", "axios", "use-auth", "shared/form"]
    found = [w for w in wanted if w in txt]
    out.append(res(
        "Reuse section names concrete existing file paths from the fixture (e.g. lib/app-response.ts, lib/axios.ts, hooks/use-auth.ts, components/shared/form)",
        len(found) >= 3,
        f"found {len(found)}/4 reuse anchors: {found}"))

    code = code_written(o)
    out.append(res(
        "No implementation code was written - no .ts or .tsx source files created",
        not code,
        f"code files in outputs: {code or 'none'}"))
    return out


# ---------------------------------------------------------------- eval 1

def grade_eval1(run: Path) -> list[dict]:
    o = run / "outputs"
    out: list[dict] = []
    sl = slice_files(o)
    mp = master_plan(o)
    txt = all_text(o)

    out.append(res(
        "Plan written under _docs/features/<module>/ at the REPO ROOT with a master plan plus numbered slice files",
        mp is not None and rel(o, mp).startswith("_docs/features/") and len(sl) >= 2,
        f"master plan: {rel(o, mp) if mp else 'NONE'}; slices: {[p.name for p in sl]}"))

    src_cited = re.findall(r"products\.(routes|controller|service|schema|model)\.ts", txt)
    out.append(res(
        "The observed contract cites concrete backend source paths (e.g. backend/src/modules/products/products.controller.ts or .routes.ts) as its source",
        len(set(src_cited)) >= 2,
        f"backend source files cited: {sorted(set(src_cited)) or 'none'}"))

    env = bool(re.search(r"success\W+true", txt, re.I)) and "message" in txt
    out.append(res(
        "The recorded success envelope matches the fixture exactly: { success: true, data, message }",
        env,
        f"'success: true' present: {bool(re.search(r'success.{0,4}true', txt, re.I))}; 'message' present: {'message' in txt}"))

    shape = all(k in txt for k in ("items", "total", "page", "limit"))
    out.append(res(
        "The list endpoint's data shape is recorded as { items, total, page, limit } - the real service return, not a bare array",
        shape,
        f"keys present: {[k for k in ('items','total','page','limit') if k in txt]}"))

    pub_lines = [l.strip()[:140] for l in txt.splitlines()
                 if re.search(r"\bGET\b", l)
                 and re.search(r"products", l, re.I)
                 and re.search(r"public", l, re.I)]
    out.append(res(
        "GET /api/products is correctly recorded as public (no auth guard)",
        bool(pub_lines),
        f"lines recording GET products as public: {pub_lines[:2] or 'none found'}"))

    out.append(res(
        "NO DELETE endpoint is presented as observed/existing - the fixture backend has none",
        None, MANUAL + " (check DELETE is never labelled observed/existing)"))

    out.append(res(
        "The admin-delete capability is handled honestly: its slice is marked blocked, or explicitly scoped as a NEW endpoint to be designed and built, with the gap called out",
        None, MANUAL))

    design = [m for m in ("products-grid", "product-card") if m in txt]
    out.append(res(
        "Binds the existing built design by path (features/products/template/products-grid.tsx and/or components/product-card.tsx) rather than proposing to rebuild it",
        len(design) >= 1,
        f"existing design components referenced: {design or 'none'}"))

    out.append(res(
        "Notes the price/currency transform (price is stored in cents) in the binding or mapping section",
        bool(re.search(r"cents", txt, re.I)),
        f"'cents' mentioned: {bool(re.search(r'cents', txt, re.I))}"))

    code = code_written(o)
    out.append(res(
        "No implementation code was written - no .ts or .tsx source files created",
        not code,
        f"code files in outputs: {code or 'none'}"))
    return out


# ---------------------------------------------------------------- eval 2

def grade_eval2(run: Path) -> list[dict]:
    o = run / "outputs"
    out: list[dict] = []
    names = [rel(o, p) for p in files(o)]
    code = code_written(o)
    n = notes(run)

    login_logout = [f for f in code if re.search(r"log-?in|log-?out|signin|signout", f, re.I)]
    out.append(res(
        "Built ONLY the register slice - no login or logout endpoint, service function, controller handler, or hook was created",
        not login_logout,
        f"login/logout code files: {login_logout or 'none'}; all code files: {code}"))

    be = [f for f in code if "modules/auth/" in f]
    be_kinds = {k for k in ("model", "schema", "service", "controller", "routes") if any(k in f for f in be)}
    out.append(res(
        "Backend auth module files created under src/modules/auth/ (model, schema, service, controller, routes)",
        len(be_kinds) >= 4,
        f"backend auth files: {be}; kinds covered: {sorted(be_kinds)}"))

    fe = [f for f in code if "features/auth/" in f]
    fe_kinds = {k for k in ("schema", "api", "hook") if any(k in f for f in fe)}
    out.append(res(
        "Frontend binding files created under src/features/auth/ (schema, api request fn, mutation hook)",
        len(fe_kinds) >= 3,
        f"frontend auth files: {fe}; kinds covered: {sorted(fe_kinds)}"))

    reg = next((p for p in files(o) if p.name.startswith("01-")), None)
    reg_built = bool(reg and re.search(r"status\**\s*:\s*built", read(reg), re.I))
    out.append(res(
        "01-register.md Status was changed from ready to built",
        reg_built,
        f"01 slice in outputs: {rel(o, reg) if reg else 'NOT SAVED'}; status built: {reg_built}"))

    mp = master_plan(o)
    mp_text = read(mp) if mp else ""
    row01 = re.search(r"^\|\s*0?1\s*\|.*$", mp_text, re.M)
    out.append(res(
        "The master plan's build-order table row for slice 01 was updated to built in the same change",
        bool(row01 and re.search(r"built|\[x\]|✓|✅", row01.group(0), re.I)),
        f"row 01: {row01.group(0).strip() if row01 else 'master plan not saved to outputs'}"))

    # Correctly-untouched slices never reach outputs/, so compare the repo against the fixture.
    repo_slices = run / "repo" / "_docs" / "features" / "auth"
    fixture_slices = FIXTURES / "fx-build-slice" / "_docs" / "features" / "auth"
    unchanged = []
    for name in ("02-login.md", "03-logout.md"):
        a, b = repo_slices / name, fixture_slices / name
        if a.exists() and b.exists():
            unchanged.append((name, digest(a) == digest(b)))
        else:
            unchanged.append((name, None))
    verdict = (all(u for _, u in unchanged)
               if unchanged and all(u is not None for _, u in unchanged) else None)
    out.append(res(
        "Slices 02-login.md and 03-logout.md were left at Status: ready and their bodies unmodified",
        verdict,
        f"byte-identical to fixture: {unchanged}"))

    out.append(res(
        "Reused existing shared pieces by path instead of recreating them - no second axios instance, no hand-rolled success envelope, no new auth hook",
        None, MANUAL))

    hay = n + "\n" + all_text(o)
    out.append(res(
        "The closing hand-off surfaces slice 01's testing checklist and offers test-writer",
        bool(re.search(r"test-writer", hay, re.I)) and bool(re.search(r"testing checklist|checklist", hay, re.I)),
        f"'test-writer' in notes/outputs: {bool(re.search(r'test-writer', hay, re.I))}; 'checklist': {bool(re.search(r'checklist', hay, re.I))}"))

    test_files = [f for f in code if ".test." in f or ".spec." in f]
    out.append(res(
        "test-writer was NOT actually invoked or run - only suggested",
        not test_files,
        f"test files created: {test_files or 'none'}"))

    honest = bool(re.search(r"(could not|couldn't|unable to|not able to|no package\.json|cannot).{0,80}(run|typecheck|build|lint|install)", hay, re.I | re.S))
    out.append(res(
        "Honestly reported that typecheck/lint/build could not be run in this fixture, rather than claiming they passed",
        honest,
        "matched an explicit 'could not run' statement in the run notes" if honest else "no explicit could-not-run statement found - grader should confirm"))
    return out


# ---------------------------------------------------------------- eval 3

def grade_eval3(run: Path) -> list[dict]:
    o = run / "outputs"
    out: list[dict] = []
    names = [rel(o, p) for p in files(o)]
    fixture = FIXTURES / "fx-onboard-legacy"

    api_arch = "api/ARCHITECTURE.md" in names
    api_reg = "api/MODULE_REGISTRY.md" in names
    out.append(res(
        "ARCHITECTURE.md AND MODULE_REGISTRY.md both written into api/",
        api_arch and api_reg,
        f"api/ARCHITECTURE.md: {api_arch}; api/MODULE_REGISTRY.md: {api_reg}"))

    web_arch = "web/ARCHITECTURE.md" in names
    web_reg = "web/MODULE_REGISTRY.md" in names
    out.append(res(
        "ARCHITECTURE.md AND MODULE_REGISTRY.md both written into web/",
        web_arch and web_reg,
        f"web/ARCHITECTURE.md: {web_arch}; web/MODULE_REGISTRY.md: {web_reg}"))

    ws = [p for p in files(o) if p.name == "workspace.json"]
    ok_ws, ws_ev = False, "no workspace.json in outputs"
    if len(ws) == 1:
        try:
            data = json.loads(read(ws[0]))
            projects = data.get("projects", data if isinstance(data, list) else [])
            doms = {p.get("domain"): p.get("path") for p in projects}
            ok_ws = doms.get("backend", "").strip("./") == "api" and doms.get("frontend", "").strip("./") == "web"
            ws_ev = f"{rel(o, ws[0])} -> {doms}"
        except (json.JSONDecodeError, AttributeError, TypeError) as exc:
            ws_ev = f"unparseable workspace.json: {exc}"
    elif len(ws) > 1:
        ws_ev = f"{len(ws)} workspace.json files found: {[rel(o, p) for p in ws]}"
    out.append(res(
        "Exactly ONE .claude/workspace.json exists at the repo root and it contains BOTH a backend entry (path api) and a frontend entry (path web)",
        ok_ws, ws_ev))

    api_txt = read(o / "api" / "ARCHITECTURE.md")
    e4 = bool(re.search(r"express\s*4|\^4\.", api_txt, re.I))
    wrap = bool(re.search(r"catchasync|async wrapper|wrapper.{0,30}required|required.{0,30}wrapper", api_txt, re.I))
    out.append(res(
        "Backend contract records Express 4 and states that catchAsync/async wrappers ARE required - it does not prescribe dropping them",
        e4 and wrap,
        f"Express 4 recorded: {e4}; catchAsync/wrapper-required recorded: {wrap}"))

    good_env = bool(re.search(r"\{\s*data\s*,\s*message\s*\}|\bdata\b.{0,20}\bmessage\b", api_txt))
    bad_env = bool(re.search(r"success\s*:\s*true", api_txt, re.I))
    out.append(res(
        "Backend contract records the real response envelope { data, message } with no success flag - it does not prescribe { success, data, message }",
        good_env and not bad_env,
        f"{{data, message}} recorded: {good_env}; bootstrap 'success: true' envelope wrongly present: {bad_env}"))

    joi = bool(re.search(r"\bjoi\b", api_txt, re.I))
    zod_bad, zod_hits = prescribed(api_txt, r"\bzod\b")
    out.append(res(
        "Backend contract records Joi as the validation library, not Zod",
        joi and not zod_bad,
        f"Joi recorded: {joi}; Zod prescribed positively: {zod_bad}"
        + (f" -> {zod_hits}" if zod_bad
           else " (Zod appears only in explicit negations, which is correct)")))

    web_txt = read(o / "web" / "ARCHITECTURE.md")
    want = {k: bool(re.search(p, web_txt, re.I)) for k, p in
            {"vite": r"\bvite\b", "mui": r"\bmui\b|material-ui|@mui", "swr": r"\bswr\b",
             "formik": r"\bformik\b", "yup": r"\byup\b", "react-router": r"react-router"}.items()}
    avoid, avoid_hits = {}, {}
    for k, pat in {"next-app-router": r"app router|next\.js", "shadcn": r"shadcn",
                   "tanstack": r"tanstack|react-query", "rhf": r"react hook form|react-hook-form"}.items():
        bad, hits = prescribed(web_txt, pat)
        avoid[k], avoid_hits[k] = bad, hits
    flagged = [h for v in avoid_hits.values() for h in v]
    out.append(res(
        "Frontend contract records the real stack - Vite + React Router + MUI/Emotion + SWR + Formik + Yup - and does NOT prescribe Next.js App Router, shadcn, TanStack Query, or React Hook Form",
        True if (all(want.values()) and not flagged) else None,
        f"real stack recorded: {want}. "
        + ("No bootstrap-stack term appears outside an explicit negation."
           if not flagged else
           f"GRADER: confirm these lines warn against rather than prescribe the bootstrap stack -> {flagged[:3]}")))

    api_reg_txt = read(o / "api" / "MODULE_REGISTRY.md")
    be_pieces = {k: k.lower() in api_reg_txt.lower() for k in
                 ("catchAsync", "ApiError", "requireAuth", "requireAdmin", "validateBody", "errorHandler")}
    out.append(res(
        "Backend registry is seeded with the real existing shared pieces (catchAsync, ApiError, requireAuth, requireAdmin, validateBody, errorHandler) with their paths",
        sum(be_pieces.values()) >= 5,
        f"{sum(be_pieces.values())}/6 seeded: {be_pieces}"))

    web_reg_txt = read(o / "web" / "MODULE_REGISTRY.md")
    fe_pieces = {k: k.lower() in web_reg_txt.lower() for k in
                 ("Card", "PageHeader", "useUsers", "theme", "client", "LoginForm")}
    out.append(res(
        "Frontend registry is seeded with the real existing shared pieces (the api client, Card, PageHeader, the forms layer, useUsers, the theme) with their paths",
        sum(fe_pieces.values()) >= 5,
        f"{sum(fe_pieces.values())}/6 seeded: {fe_pieces}"))

    clean, ev = source_untouched(o, fixture, ("api/src", "web/src", "api/package.json", "web/package.json"))
    out.append(res(
        "No source file under api/src or web/src was modified, created, or deleted",
        clean, ev))

    hay = notes(run) + "\n" + all_text(o)
    dup = bool(re.search(r"formatdate|toDayString|duplicate.{0,40}date|date.{0,30}duplicat", hay, re.I))
    out.append(res(
        "The duplicate date helper (utils/formatDate.ts vs the private one in services/report.service.ts) is reported as a FINDING, not silently fixed",
        dup if dup else None,
        f"duplicate-date-helper mentioned: {dup}" + ("" if dup else " - grader should confirm it wasn't silently fixed")))
    return out


GRADERS = {
    "eval-0-plan-auth-fullstack-sharded": grade_eval0,
    "eval-1-plan-observe-existing-api": grade_eval1,
    "eval-2-build-one-slice-only": grade_eval2,
    "eval-3-onboard-fullstack-legacy-one-pass": grade_eval3,
}


def main() -> None:
    it = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "iteration-1")
    for name, fn in GRADERS.items():
        d = it / name
        if not d.is_dir():
            continue
        for arm in sorted(p.name for p in d.iterdir() if p.is_dir()):
            run = d / arm
            if not (run / "outputs").is_dir():
                continue
            exps = fn(run)
            auto = [e for e in exps if e["passed"] is not None]
            passed = sum(1 for e in auto if e["passed"])
            manual = len(exps) - len(auto)
            (run / "grading.json").write_text(json.dumps({
                "eval": name,
                "configuration": arm,
                "expectations": exps,
                "auto_passed": passed,
                "auto_total": len(auto),
                "needs_judgment": manual,
            }, indent=2) + "\n", encoding="utf-8")
            flag = " (+%d for grader)" % manual if manual else ""
            print(f"{name:45s} {arm:12s} {passed}/{len(auto)} auto{flag}")


if __name__ == "__main__":
    main()
