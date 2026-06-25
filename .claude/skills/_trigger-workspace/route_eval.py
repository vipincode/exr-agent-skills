#!/usr/bin/env python3
"""Cross-suite routing eval.

For each labeled query, present ALL skill descriptions to a fresh `claude -p`
session and ask which single skill (or 'none') should activate. Compare to the
gold label and report accuracy + a confusion map (which skill steals which).

This measures disambiguation across the suite, not isolated trigger/no-trigger.
"""
import argparse, json, os, re, subprocess, sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

SKILLS_DIR = Path(__file__).resolve().parent.parent  # .claude/skills
SKILL_NAMES = ["project-onboard", "express-ts-bootstrap", "feature-planner",
               "module-builder", "test-writer", "code-review"]


def read_descriptions(overrides: dict | None = None) -> dict:
    out = {}
    for name in SKILL_NAMES:
        if overrides and name in overrides:
            out[name] = overrides[name]
            continue
        text = (SKILLS_DIR / name / "SKILL.md").read_text(encoding="utf-8")
        m = re.search(r"^description:\s*(.+?)\n(?=\w+:|---)", text, re.S | re.M)
        out[name] = " ".join(m.group(1).split()) if m else ""
    return out


def build_prompt(descriptions: dict, query: str) -> str:
    catalog = "\n".join(f"- {n}: {d}" for n, d in descriptions.items())
    return (
        "You are a router. Below is a catalog of available skills, each with a "
        "description of when it should be used. A user has sent a request. Decide "
        "which ONE skill should activate, or 'none' if no skill in the catalog is "
        "the right fit (e.g. the request is frontend, a different stack, or outside "
        "what these skills do).\n\n"
        f"SKILLS:\n{catalog}\n\n"
        f"USER REQUEST:\n\"{query}\"\n\n"
        "Reply with ONLY the exact skill name (or 'none'). No explanation."
    )


def route_one(query: str, prompt: str, model: str, timeout: int) -> str:
    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
    cmd = ["claude", "-p", prompt, "--model", model]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, env=env)
        out = (r.stdout or "").strip().lower()
    except Exception as e:
        return f"ERROR:{e}"
    for n in SKILL_NAMES + ["none"]:
        if n in out:
            return n
    return f"UNPARSED:{out[:60]}"


def run(eval_path: Path, model: str, workers: int, timeout: int, overrides: dict | None):
    data = json.loads(eval_path.read_text(encoding="utf-8"))
    queries = data["queries"]
    descriptions = read_descriptions(overrides)

    results = []
    with ProcessPoolExecutor(max_workers=workers) as ex:
        futs = {}
        for q in queries:
            p = build_prompt(descriptions, q["query"])
            futs[ex.submit(route_one, q["query"], p, model, timeout)] = q
        for fut in as_completed(futs):
            q = futs[fut]
            predicted = fut.result()
            results.append({"id": q["id"], "query": q["query"],
                            "gold": q["correct"], "predicted": predicted,
                            "correct": predicted == q["correct"]})

    results.sort(key=lambda r: r["id"])
    correct = sum(1 for r in results if r["correct"])
    total = len(results)

    # Confusion: gold -> predicted counts for misses
    confusion = {}
    for r in results:
        if not r["correct"]:
            confusion.setdefault(r["gold"], {}).setdefault(r["predicted"], 0)
            confusion[r["gold"]][r["predicted"]] += 1

    return {"accuracy": correct / total, "correct": correct, "total": total,
            "results": results, "confusion": confusion, "descriptions": descriptions}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--eval-set", required=True)
    ap.add_argument("--model", default="claude-opus-4-8")
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--timeout", type=int, default=90)
    ap.add_argument("--overrides", default=None, help="JSON file of {skill: description} overrides")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    overrides = json.loads(Path(args.overrides).read_text(encoding="utf-8")) if args.overrides else None
    output = run(Path(args.eval_set), args.model, args.workers, args.timeout, overrides)
    Path(args.out).write_text(json.dumps(output, indent=2), encoding="utf-8")

    print(f"\nAccuracy: {output['correct']}/{output['total']} = {output['accuracy']:.0%}\n")
    for r in output["results"]:
        mark = "OK " if r["correct"] else "XX "
        print(f"{mark} #{r['id']:>2} gold={r['gold']:<22} pred={r['predicted']:<22} {r['query'][:50]}")
    print("\nConfusion (gold -> wrongly predicted):")
    for gold, preds in output["confusion"].items():
        for pred, c in preds.items():
            print(f"  {gold} -> {pred}: {c}")


if __name__ == "__main__":
    main()
