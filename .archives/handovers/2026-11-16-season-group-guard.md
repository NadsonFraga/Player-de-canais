# Handover: Multi-Season Episode Group Guard

- **Branch:** `feat/season-group-guard`
- **Date:** 2026-11-16
- **Objective:** Fix multi-season episode group expansion and verify full test matrix.

## Key Changes
- Enforced a score threshold of >= 65 for episode groups replacing established multi-season series (`regular.length > 1`), protecting canonical season numbering (e.g. Dragon Ball Z 9 seasons) while preserving genuine parts splitting (Lupin, La Casa de Papel).
- Verified full test matrix across Python, Node, browser, and security checks.

## Next Step
Merge `feat/season-group-guard` into `staging` with `--no-ff`, push to `origin/staging`, and proceed with production promotion checklist.
