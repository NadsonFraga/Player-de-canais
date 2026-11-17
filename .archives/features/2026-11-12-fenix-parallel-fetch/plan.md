# Feature Plan: FenixFlix Parallel Candidate Resolution

## 1. Goal
Eliminate sequential timeout bottlenecks in `resolveFenixFlixClient` when resolving content (such as series and movies) that possess both IMDb IDs and TMDB IDs, avoiding long wait times on unavailable streams while maintaining strict player separation (no automatic failover to MGEB, no unified player).

## 2. Root Cause Analysis
Previously, `resolveFenixFlixClient` iterated sequentially over `queryCandidates`:
- For movies/series having an IMDb ID (`tt...`) followed by a TMDB ID (`tmdb:...`), the client would spend 6 seconds waiting for candidate 1, and on failure/timeout, spend another 6 seconds waiting for candidate 2.
- In worst-case or cold-scrape scenarios, the user would wait 12–14 seconds before receiving a "No streams found" response.
- Furthermore, classic movies and older series are absent from Fenix's ephemeral scraper cache, causing needless latency.

## 3. Architecture & Implementation
- Replace sequential candidate loop with concurrent `Promise.all` using HTTP/2 multiplexing.
- Implement a unified 4.5-second total timeout across all candidate requests via a single `AbortController`.
- Prioritize the preferred candidate stream (e.g. IMDb tt... results if available, then TMDB).
- Keep player providers completely distinct in accordance with project directives (zero automatic failover between players).
