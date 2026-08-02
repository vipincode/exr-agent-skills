"""Apply the judgment-required verdicts on top of grade.py's programmatic results.

grade.py decides everything a script can decide honestly and leaves the rest as passed=None.
This file records the verdicts that needed a human/grader read, each with the evidence it was
based on, so the scoring is reproducible: run `python grade.py <iter> && python judge.py <iter>`.

Keep the two separate. Mixing judgment into grade.py would make it impossible to tell which
results a rerun can be trusted to reproduce.
"""

from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent

# (eval dir, arm, assertion-text prefix) -> (passed, evidence)
VERDICTS: dict[tuple[str, str, str], tuple[bool, str]] = {
    ("eval-0-plan-auth-fullstack-sharded", "with_skill", "The frontend half of each slice matches"): (
        True,
        "01-register.md and 02-login.md each state one contract and both halves follow it. The "
        "frontend response schema deliberately differs from the backend's (data: { user }, no "
        "token) and says why: the BFF strips the token into an httpOnly cookie. That divergence is "
        "documented at the contract, not an accidental mismatch."),
    ("eval-0-plan-auth-fullstack-sharded", "old_skill", "The frontend half of each slice matches"): (
        False,
        "No slices exist. The contract is authored twice - once in backend/_docs/FEATURE_PLAN_auth.md "
        "and again in frontend/_docs/FEATURE_PLAN_auth.md, the latter marked 'PROPOSED, NOT "
        "OBSERVED'. Two documents holding one contract is the drift risk the merge removes."),

    ("eval-1-plan-observe-existing-api", "with_skill", "NO DELETE endpoint is presented as observed"): (
        True,
        "02-admin-delete-product.md line 46: 'Source: declared here (design mode) - DELETE "
        "/api/products/:id does not exist. I checked routes, controller, service and the registry; "
        "all four agree there is no delete.'"),
    ("eval-1-plan-observe-existing-api", "with_skill", "The admin-delete capability is handled honestly"): (
        True,
        "Scoped as a NEW endpoint in design mode and made buildable: the slice lists the backend "
        "files to add (service deleteProduct(id), the DELETE route) alongside the frontend binding, "
        "so the gap is closed rather than only flagged."),
    ("eval-1-plan-observe-existing-api", "old_skill", "NO DELETE endpoint is presented as observed"): (
        True,
        "FEATURE_PLAN_products.md line 46 marks DELETE 'DOES NOT EXIST - no route, controller, or "
        "service function. Not invented here.' The baseline did not fabricate it either."),
    ("eval-1-plan-observe-existing-api", "old_skill", "The admin-delete capability is handled honestly"): (
        True,
        "Marked 'PARTIALLY BLOCKED' with an unblock path. Honest, but it can only defer the work - "
        "a frontend-only planner cannot plan the missing endpoint, so build piece 7 stays blocked."),

    ("eval-2-build-one-slice-only", "with_skill", "Reused existing shared pieces by path"): (
        True,
        "auth.controller.ts imports `created` from ../../lib/app-response.js; register.ts imports "
        "`api` from @/lib/axios. No second axios instance, no hand-rolled success envelope. The "
        "existing use-auth.ts stub was extended in place rather than forked."),
    ("eval-2-build-one-slice-only", "old_skill", "Reused existing shared pieces by path"): (
        True,
        "Also imported the shared response helpers and the axios instance rather than recreating "
        "them. The dedup gate is shared behaviour and survived the merge intact."),
    ("eval-2-build-one-slice-only", "old_skill", "Slices 02-login.md and 03-logout.md were left"): (
        False,
        "Not applicable by construction, and that is the finding: the legacy plan format has no "
        "slices, so there is nothing to leave untouched and no resume point. This arm built "
        "register, login and logout in a single pass."),

    ("eval-3-onboard-fullstack-legacy-one-pass", "with_skill", "Frontend contract records the real stack"): (
        True,
        "Real stack recorded in full. The one flagged line - 'Adding a second library alongside one "
        "of these (e.g. TanStack Query next to SWR)' - warns against the bootstrap stack rather "
        "than prescribing it."),
    ("eval-3-onboard-fullstack-legacy-one-pass", "old_skill", "Frontend contract records the real stack"): (
        True,
        "Real stack recorded in full. The flagged line - 'those builders emit Next.js + Tailwind + "
        "shadcn; this project is Vite + MUI + Emotion' - is an explicit contrast, not a prescription."),
}


def main() -> None:
    it = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "iteration-1")
    applied = 0
    for (ev, arm, prefix), (passed, evidence) in VERDICTS.items():
        g = it / ev / arm / "grading.json"
        if not g.exists():
            print(f"missing: {g}")
            continue
        d = json.loads(g.read_text(encoding="utf-8"))
        hit = False
        for e in d["expectations"]:
            if e["text"].startswith(prefix):
                e["passed"], e["evidence"] = passed, evidence
                hit, applied = True, applied + 1
        if not hit:
            print(f"NO MATCH: {ev}/{arm} :: {prefix[:50]}")
        d["passed"] = sum(1 for e in d["expectations"] if e["passed"])
        d["total"] = len(d["expectations"])
        d["unresolved"] = sum(1 for e in d["expectations"] if e["passed"] is None)
        g.write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")

    print(f"\n{applied} judgments applied\n")
    print(f"{'eval':46s} {'with_skill':>12s} {'old_skill':>12s}")
    for ev in sorted(p.name for p in it.iterdir() if p.is_dir()):
        row = {}
        for arm in ("with_skill", "old_skill"):
            g = it / ev / arm / "grading.json"
            if g.exists():
                d = json.loads(g.read_text(encoding="utf-8"))
                row[arm] = f"{d['passed']}/{d['total']}"
        if row:
            print(f"{ev:46s} {row.get('with_skill',''):>12s} {row.get('old_skill',''):>12s}")


if __name__ == "__main__":
    main()
