---
name: performance-audit
description: Identify measurable performance problems with evidence. Inspect relevant areas, cite evidence when possible, rank findings by impact/confidence/effort, and avoid premature optimization. Read-only by default.
---

# performance-audit

Identify measurable performance problems.

## When to use
- Requested performance review.
- Investigating slow loads, large bundles, or slow API responses.

## When NOT to use
- You will be modifying code (this skill is analysis-first; implement separately).
- The task is a simple correctness fix.

## Inputs
- Scope (whole repo or specific page/module).
- Available metrics or reports.

## Inspect as relevant
Frontend bundle; unused assets; rendering; network requests; images/media; caching; database queries; N+1 queries; indexes; API payloads; repeated computation; memory use; concurrency; blocking I/O; build time; server configuration; Core Web Vitals; large monolith components.

## Rules
- Measure or cite evidence when possible.
- Do not recommend premature optimization.
- Rank findings by impact, confidence, and effort.
- Distinguish measured bottlenecks from hypotheses (label clearly).
- Read-only unless implementation is explicitly requested.

## Expected output
- Baseline or available evidence.
- Findings.
- Impact.
- Confidence.
- Recommended fix.
- Estimated effort.
- Verification metric.

## Completion criteria
- Findings ranked and evidence-backed.
- Hypotheses distinguished from measured facts.
- No premature/unjustified optimizations recommended.
