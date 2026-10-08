# Plan: Complete Elimination of `arquivos/` & Migration to `.archives/` + Root JSON

- **Task Name:** `migrate-archives-and-docs`
- **Status:** PENDING_APPROVAL
- **Author:** Antigravity Orchestrator

---

## 1. Objective & Scope

### Objective
Completely remove the legacy `arquivos/` folder from the root repository.
1. Migrate all internal documentation, specs, and legacy dumps to the private `.archives/` submodule.
2. Relocate active runtime football schedule `proximos_jogos.json` to the project root (`./proximos_jogos.json`) alongside `canais.json`.
3. Update all code references, scrapers, headers, and CI workflows to point to the new root path.
4. Remove temporary `.gitkeep` files from populated directories.

### Scope
- **Root Repository Changes:**
  - `arquivos/` directory: COMPLETELY DELETED.
  - `proximos_jogos.json`: Moved to `./proximos_jogos.json` (project root).
  - Code references updated in:
    1. `script.js` (line 597: `fetch("proximos_jogos.json?t=" + ...)`)
    2. `_headers` (line 2: `/proximos_jogos.json`)
    3. `scripts/test_get_matches.py` (line 20: `OUTPUT_FILE_PATH = "proximos_jogos.json"`)
    4. `.github/workflows/update_matches.yml` (line 31: `git add proximos_jogos.json`)
- **Submodule Changes (`.archives/`):**
  - `.archives/scopes/`: Receives `PROJECT_KNOWLEDGE_BASE.md`, `DESIGN_SYSTEM.md`, `FEAT_TEAM_SELECTION_PLAN.md`, `FEAT_ADBLOCK_NOTICE_PLAN.md`, `PLANNING.md`.
  - `.archives/reference/`: Receives `canais_nao_utilizados.json`, `fonte.html`.
  - `.archives/old/`: Receives legacy archive backups.
  - Redundant `.gitkeep` files removed.

---

## 2. Impacted Files

| File Path | Action | Description |
| :--- | :--- | :--- |
| `script.js` | MODIFY | Update fetch path from `arquivos/proximos_jogos.json` to `proximos_jogos.json` |
| `_headers` | MODIFY | Update Cloudflare Pages rule from `/arquivos/proximos_jogos.json` to `/proximos_jogos.json` |
| `scripts/test_get_matches.py` | MODIFY | Update `OUTPUT_FILE_PATH` to `"proximos_jogos.json"` |
| `.github/workflows/update_matches.yml` | MODIFY | Update git stage target to `proximos_jogos.json` |
| `arquivos/` | DELETE | Fully remove directory after moving contents |
| `proximos_jogos.json` | CREATE (ROOT) | Relocated from `arquivos/` |
| `.archives/scopes/*` | CREATE | Blueprints migrated from `arquivos/docs/` |
| `.archives/reference/*` | CREATE | Standby channels & scraping dumps migrated |
| `.archives/old/*` | CREATE | Legacy backup scripts migrated |

---

## 3. Step-by-Step Strategy

1. **Step 1: Populate `.archives/`:**
   - Copy `arquivos/docs/*.md` to `.archives/scopes/`.
   - Copy `arquivos/canais_nao_utilizados.json` and `arquivos/fonte.html` to `.archives/reference/`.
   - Copy `arquivos/old/` to `.archives/old/`.
   - Remove redundant `.gitkeep` files from populated directories.
   - Commit and push to private repository (`Player-de-canais-archives`).
2. **Step 2: Relocate Runtime Assets in Root:**
   - Move `arquivos/proximos_jogos.json` to `./proximos_jogos.json`.
   - Delete `arquivos/` folder completely.
3. **Step 3: Update Code References:**
   - Update `script.js` line 597.
   - Update `_headers` line 2.
   - Update `scripts/test_get_matches.py` line 20.
   - Update `.github/workflows/update_matches.yml` line 31.
4. **Step 4: Verify Scraper Execution Locally:**
   - Run `python scripts/test_get_matches.py` locally and verify that `./proximos_jogos.json` is updated and valid JSON.
5. **Step 5: Commit & Push Root Repository:**
   - Commit changes to `origin/master`.

---

## 4. Testing & Verification

1. **Local Python Execution:**
   - Execute `python scripts/test_get_matches.py` to guarantee no `FileNotFoundError` and valid output at root.
2. **JSON Schema Integrity:**
   - Verify `proximos_jogos.json` parses as valid JSON with club schedule arrays.
3. **Zero Remnants of `arquivos`:**
   - Run search across the repository to verify 0 stale references to `arquivos/`.

---

## Changelog & Micro-adjustments
- Strategy updated to completely eliminate `arquivos/` folder, moving `proximos_jogos.json` to the root alongside `canais.json`.