#!/usr/bin/env python3
"""Build benchmark.json (viewer schema) from arm-level grading.json + timing.json."""
import json, math, sys
from pathlib import Path
from datetime import datetime, timezone

IT = Path(sys.argv[1])
def stats(vals):
    if not vals: return {"mean":0.0,"stddev":0.0,"min":0.0,"max":0.0}
    n=len(vals); m=sum(vals)/n
    sd=math.sqrt(sum((x-m)**2 for x in vals)/(n-1)) if n>1 else 0.0
    return {"mean":round(m,4),"stddev":round(sd,4),"min":round(min(vals),4),"max":round(max(vals),4)}

runs=[]; by_cfg={}
for d in sorted(IT.glob("eval-*")):
    meta=json.load(open(d/"eval_metadata.json"))
    eid=meta.get("eval_id")
    for arm in ("with_skill","without_skill"):
        gp=d/arm/"grading.json"
        if not gp.exists(): continue
        g=json.load(open(gp))
        exps=g["expectations"]; total=len(exps); passed=sum(e["passed"] for e in exps)
        pr=passed/total if total else 0.0
        t=json.load(open(d/arm/"timing.json")) if (d/arm/"timing.json").exists() else {}
        runs.append({"eval_id":eid,"configuration":arm,"run_number":1,
            "result":{"pass_rate":pr,"passed":passed,"failed":total-passed,"total":total,
                "time_seconds":t.get("total_duration_seconds",0.0),"tokens":t.get("total_tokens",0),
                "tool_calls":0,"errors":0},
            "expectations":exps,"notes":[]})
        by_cfg.setdefault(arm,{"pr":[],"t":[],"tok":[]})
        by_cfg[arm]["pr"].append(pr); by_cfg[arm]["t"].append(t.get("total_duration_seconds",0.0))
        by_cfg[arm]["tok"].append(t.get("total_tokens",0))

run_summary={}
for cfg,v in by_cfg.items():
    run_summary[cfg]={"pass_rate":stats(v["pr"]),"time_seconds":stats(v["t"]),"tokens":stats(v["tok"])}
a,b=run_summary.get("with_skill",{}),run_summary.get("without_skill",{})
run_summary["delta"]={
    "pass_rate":f'{a.get("pass_rate",{}).get("mean",0)-b.get("pass_rate",{}).get("mean",0):+.2f}',
    "time_seconds":f'{a.get("time_seconds",{}).get("mean",0)-b.get("time_seconds",{}).get("mean",0):+.1f}',
    "tokens":f'{a.get("tokens",{}).get("mean",0)-b.get("tokens",{}).get("mean",0):+.0f}'}

bench={"metadata":{"skill_name":"frontend-feature-planner",
    "skill_path":"D:/SKILLS/exr-agent-skills/.claude/skills/frontend-feature-planner",
    "executor_model":"claude-opus-4-8","analyzer_model":"claude-opus-4-8",
    "timestamp":datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "evals_run":sorted({r["eval_id"] for r in runs}),"runs_per_configuration":1},
    "runs":runs,"run_summary":run_summary,"notes":[
      "Iteration 2. with_skill = v2 skill (always-write-even-when-blocked + new Dependencies and Testing-checklist sections). without_skill = the carried-forward iteration-1 no-skill baselines (behavior unchanged).",
      "Now a real positive delta: v2 passes all assertions including the two new structural sections (Dependencies, Testing checklist); the baselines fail exactly those on evals 0/1/3/4 because they never emit those headings. This is the skill's core value — predictable structure for the frontend-module-builder handoff — made measurable.",
      "Honesty eval (eval-2): v2 now writes a predictable FEATURE_PLAN_orders.md marked BLOCKED (missing capability stated, unblock path in Dependencies, no fabricated contract) instead of staying silent. Both arms pass; the win is the consistent artifact.",
      "Cost: v2 runs ~49k tokens vs ~36k baseline — the price of reading refs + producing the full template. Judge plan quality/depth in the Outputs tab; assertions only confirm coverage + structure."]}
json.dump(bench,open(IT/"benchmark.json","w"),indent=2)
print("wrote",IT/"benchmark.json")
print(json.dumps(run_summary,indent=2))
