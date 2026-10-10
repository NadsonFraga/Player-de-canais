# Plan: Decouple .archives from Git Submodule and Fix Cloudflare Pages Builds

## Objective & Scope
- **Objective:** Completely remove the Git submodule configuration from the root repository (`Player-de-canais`), place `.archives/` into `.gitignore`, and ensure Cloudflare Pages builds succeed without attempting to clone the private repository.
- **Scope:**
  - Remove `.gitmodules` and untrack `.archives` from root git index.
  - Add `.archives/` to root `.gitignore`.
  - Maintain `.archives/` as an independent local git clone pointing to `NadsonFraga/Player-de-canais-archives`.
  - Push root repository to trigger and verify Cloudflare Pages build.
  - Keep workflow synchronization intact.

## Impacted Files
- `.gitmodules` (Removed from tracking)
- `.gitignore` (Updated to add `.archives/`)
- Root Git index (Remove cached `.archives` submodule reference)

## Step-by-Step Strategy
1. **Remove Submodule from Root Index:**
   - Execute `git rm --cached .archives`
   - Execute `git rm .gitmodules`
2. **Update .gitignore:**
   - Append `.archives/` to `.gitignore` so local files in `.archives/` are completely ignored by the root repository.
3. **Commit and Push Root Changes:**
   - Commit changes: `refactor(ci): decouple .archives from git submodule to fix cloudflare builds`
   - Push to `origin master`.
4. **Submodule Continuity Verification:**
   - Verify that `.archives/` remains an active git repository locally (`git status` inside `.archives`).
5. **Verify Cloudflare Pages Build:**
   - Inspect GitHub commit status via `gh api` to confirm Cloudflare Pages build switches to green.

## Testing & Edge Cases
- Test that `git status` in root shows `.archives/` as ignored and no untracked submodule warnings.
- Test that `git status` inside `.archives/` operates independently against `NadsonFraga/Player-de-canais-archives`.
- Confirm Cloudflare Pages deployment check succeeds without authentication errors.
