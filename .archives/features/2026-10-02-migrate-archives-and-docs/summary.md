# Summary: Migration of Documentation to `.archives/` and Relocation of `proximos_jogos.json`

- **Task Name:** `migrate-archives-and-docs`
- **Execution Date:** 2026-10-02
- **Status:** COMPLETED
- **Branch:** `master` (root) / `main` (submodule)

---

## 1. Overview of Changes

1. **Elimination of `arquivos/` Directory:**
   - The legacy `arquivos/` folder has been completely eradicated from the project tree.
2. **Relocation of Runtime Asset:**
   - `proximos_jogos.json` was moved from `arquivos/proximos_jogos.json` to the repository root (`./proximos_jogos.json`), placing it alongside `canais.json`.
3. **Code Reference Updates:**
   - `script.js`: Updated fetch path to `"proximos_jogos.json?t=" + Date.now()`.
   - `_headers`: Updated Cloudflare Pages cache headers rule to `/proximos_jogos.json`.
   - `scripts/test_get_matches.py`: Updated `OUTPUT_FILE_PATH` to `"proximos_jogos.json"`.
   - `.github/workflows/update_matches.yml`: Updated git stage target to `proximos_jogos.json`.
4. **Migration to Private `.archives/` Submodule:**
   - All internal blueprints and specifications (`DESIGN_SYSTEM.md`, `PROJECT_KNOWLEDGE_BASE.md`, `FEAT_TEAM_SELECTION_PLAN.md`, `FEAT_ADBLOCK_NOTICE_PLAN.md`, `PLANNING.md`) migrated to `.archives/scopes/`.
   - Standby channels (`canais_nao_utilizados.json`) and scraping source dumps (`fonte.html`) migrated to `.archives/reference/`.
   - Deprecated legacy backups migrated to `.archives/old/`.
   - Redundant `.gitkeep` files removed from populated folders.

---

## 2. Impacted & Modified Files

### Root Repository (`Player-de-canais`):
- `script.js` (Modified fetch path)
- `_headers` (Modified cache rule path)
- `scripts/test_get_matches.py` (Modified scraper output path)
- `.github/workflows/update_matches.yml` (Modified git add target)
- `proximos_jogos.json` (Relocated to root)
- `arquivos/` (Completely deleted)
- `.archives` (Updated submodule pointer)

### Submodule Repository (`Player-de-canais-archives`):
- `.archives/scopes/*` (All architecture blueprints migrated)
- `.archives/reference/*` (Standby channels & reference dumps migrated)
- `.archives/old/*` (Legacy backups migrated)
- `.archives/plans/migrate-archives-and-docs.md` (Task plan)
- `.archives/summaries/migrate-archives-and-docs-summary.md` (This summary)

---

## 3. Verification & Validation

- Verified that `proximos_jogos.json` at root is valid JSON with `updatedAt` and `teams` properties.
- Verified 0 remaining references to `arquivos/` across all tracked project files.
- Confirmed that `.archives/` submodule contains all architecture documentation and pushed cleanly to remote private repository.