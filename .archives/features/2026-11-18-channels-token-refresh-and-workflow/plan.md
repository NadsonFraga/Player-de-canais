# Plan: Channels Daily Token Refresh & Automated GitHub Action

- **Branch:** `hotfix/channels-token-refresh-and-workflow`
- **Target:** `master`
- **Date:** 2026-11-18
- **Version:** `20261118_1114`
- **Objective:** Restore 52 live channels whose 24-hour ephemeral tokens expired, and deploy an automated GitHub Actions cron workflow (`refresh_channels.yml`) running every 6 hours so live channels never fall off the air again.

## Scope of Changes
1. **Catalog Stream Tokens Refreshed:**
   - Ran `tools/extract_channel_stream.py --all` across 52 unique channel slugs.
   - Synchronized `data/canais.json` and `assets/js/core/fallbackChannels.js`.
2. **Automated GitHub Action Workflow:**
   - Created `.github/workflows/refresh_channels.yml` with a recurring 6-hour cron (`0 */6 * * *`) and on-demand `workflow_dispatch`.
   - Automatically executes `tools/extract_channel_stream.py --all` and pushes fresh tokens to `master`, ensuring tokens never hit the 24-hour expiration window.
3. **Cache Version Bump:**
   - Bumped version to `20261118_1114`.
