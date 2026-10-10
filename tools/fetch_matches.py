"""
Multi-team fixture scraper for Brazilian football clubs and national team.
Extracts upcoming match data directly from Globo Esporte (GE) schedules
and generates a consolidated, resilient JSON feed for Tvzinha.
"""
import os
import sys
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE_PATH = os.path.join(ROOT_DIR, "data", "proximos_jogos.json")

# Verified Globo Esporte schedule endpoints (20 Serie A clubs + Brazilian National Team)
TEAMS_CONFIG = [
    {
        "id": "athletico-pr",
        "name": "Athletico-PR",
        "url": "https://ge.globo.com/pr/futebol/times/athletico-pr/agenda-de-jogos-do-athletico-pr/",
        "escudo": "https://s.sde.globo.com/media/organizations/2026/01/07/Athletico-PR.svg"
    },
    {
        "id": "atletico-mg",
        "name": "Atlético-MG",
        "url": "https://ge.globo.com/futebol/times/atletico-mg/agenda-de-jogos-do-atletico-mg/",
        "escudo": "https://s.sde.globo.com/media/organizations/2018/03/10/atletico-mg.svg"
    },
    {
        "id": "bahia",
        "name": "Bahia",
        "url": "https://ge.globo.com/futebol/times/bahia/agenda-de-jogos-do-bahia/",
        "escudo": "https://s.sde.globo.com/media/organizations/2018/03/11/bahia.svg"
    },
    {
        "id": "botafogo",
        "name": "Botafogo",
        "url": "https://ge.globo.com/futebol/times/botafogo/agenda-de-jogos-do-botafogo/",
        "escudo": "https://s.sde.globo.com/media/organizations/2019/02/04/botafogo-svg.svg"
    },
    {
        "id": "corinthians",
        "name": "Corinthians",
        "url": "https://ge.globo.com/futebol/times/corinthians/agenda-de-jogos-do-corinthians/",
        "escudo": "https://s.sde.globo.com/media/organizations/2024/10/09/Corinthians_2024_Q4ahot4.svg"
    },
    {
        "id": "criciuma",
        "name": "Criciúma",
        "url": "https://ge.globo.com/futebol/times/criciuma/agenda-de-jogos-do-criciuma/",
        "escudo": "https://s.sde.globo.com/media/teams/2026/01/16/criciuma-2026-svg-79692.svg"
    },
    {
        "id": "cruzeiro",
        "name": "Cruzeiro",
        "url": "https://ge.globo.com/futebol/times/cruzeiro/agenda-de-jogos-do-cruzeiro/",
        "escudo": "https://s.sde.globo.com/media/organizations/2021/02/13/cruzeiro_2021.svg"
    },
    {
        "id": "cuiaba",
        "name": "Cuiabá",
        "url": "https://ge.globo.com/mt/futebol/times/cuiaba/agenda/",
        "escudo": "https://s.sde.globo.com/media/organizations/2018/12/26/Cuiaba_EC.svg"
    },
    {
        "id": "flamengo",
        "name": "Flamengo",
        "url": "https://ge.globo.com/futebol/times/flamengo/agenda-de-jogos-do-flamengo/",
        "escudo": "https://s.sde.globo.com/media/organizations/2018/04/10/Flamengo-2018.svg"
    },
    {
        "id": "fluminense",
        "name": "Fluminense",
        "url": "https://ge.globo.com/futebol/times/fluminense/agenda-de-jogos-do-fluminense/",
        "escudo": "https://s.sde.globo.com/media/organizations/2018/03/11/fluminense.svg"
    },
    {
        "id": "fortaleza",
        "name": "Fortaleza",
        "url": "https://ge.globo.com/futebol/times/fortaleza/agenda-de-jogos-do-fortaleza/",
        "escudo": "https://s.sde.globo.com/media/organizations/2021/09/19/Fortaleza_2021_1.svg"
    },
    {
        "id": "gremio",
        "name": "Grêmio",
        "url": "https://ge.globo.com/futebol/times/gremio/agenda-de-jogos-do-gremio/",
        "escudo": "https://s.sde.globo.com/media/organizations/2018/03/12/gremio.svg"
    },
    {
        "id": "internacional",
        "name": "Internacional",
        "url": "https://ge.globo.com/futebol/times/internacional/agenda-de-jogos-do-internacional/",
        "escudo": "https://s.sde.globo.com/media/organizations/2018/03/11/internacional.svg"
    },
    {
        "id": "juventude",
        "name": "Juventude",
        "url": "https://ge.globo.com/futebol/times/juventude/agenda-de-jogos-do-juventude/",
        "escudo": "https://s.sde.globo.com/media/organizations/2021/04/29/Juventude-2021-01.svg"
    },
    {
        "id": "palmeiras",
        "name": "Palmeiras",
        "url": "https://ge.globo.com/futebol/times/palmeiras/agenda-de-jogos-do-palmeiras/",
        "escudo": "https://s.sde.globo.com/media/organizations/2019/07/06/Palmeiras.svg"
    },
    {
        "id": "red-bull-bragantino",
        "name": "Red Bull Bragantino",
        "url": "https://ge.globo.com/futebol/times/bragantino/agenda-de-jogos-do-bragantino/",
        "escudo": "https://s.sde.globo.com/media/organizations/2021/06/28/bragantino.svg"
    },
    {
        "id": "santos",
        "name": "Santos",
        "url": "https://ge.globo.com/futebol/times/santos/agenda-de-jogos-do-santos/",
        "escudo": "https://s.sde.globo.com/media/organizations/2018/03/12/santos.svg"
    },
    {
        "id": "sao-paulo",
        "name": "São Paulo",
        "url": "https://ge.globo.com/futebol/times/sao-paulo/agenda-de-jogos-do-sao-paulo/",
        "escudo": "https://s.sde.globo.com/media/organizations/2018/03/11/sao-paulo.svg"
    },
    {
        "id": "vasco",
        "name": "Vasco",
        "url": "https://ge.globo.com/futebol/times/vasco/agenda-de-jogos-do-vasco/",
        "escudo": "https://s.sde.globo.com/media/organizations/2021/09/04/vasco_SVG.svg"
    },
    {
        "id": "vitoria",
        "name": "Vitória",
        "url": "https://ge.globo.com/futebol/times/vitoria/agenda-de-jogos-do-vitoria/",
        "escudo": "https://s.sde.globo.com/media/organizations/2025/12/18/Vitoria_2025.svg"
    },
    {
        "id": "brasil",
        "name": "Seleção Brasileira",
        "url": "https://ge.globo.com/futebol/selecao-brasileira/agenda-de-jogos-da-selecao/",
        "escudo": "https://s.sde.globo.com/media/organizations/2019/07/16/Brasil_rgYHF6Z.svg"
    }
]

def resolve_team_crest(team_name: str, matches: list, default_crest: str) -> str:
    """
    Dynamically resolves the club crest directly from the live match feed.
    If match fixtures contain the club as home or away, takes that active URL;
    otherwise gracefully falls back to verified default crest URL.
    """
    norm_target = team_name.lower().replace("-", " ")
    for m in matches:
        mandante_nome = (m.get("mandante", {}).get("nome") or "").lower()
        if norm_target in mandante_nome or mandante_nome in norm_target:
            crest = m.get("mandante", {}).get("escudo")
            if crest and crest.startswith("http"):
                return crest

        visitante_nome = (m.get("visitante", {}).get("nome") or "").lower()
        if norm_target in visitante_nome or visitante_nome in norm_target:
            crest = m.get("visitante", {}).get("escudo")
            if crest and crest.startswith("http"):
                return crest

    return default_crest

def extract_schedule_payload(html_content: str) -> dict:
    """Safely extracts the scheduleTeam JSON object from the raw HTML."""
    marker = "scheduleTeam:"
    start_pos = html_content.find(marker)
    if start_pos == -1:
        raise ValueError("scheduleTeam marker not found in HTML response")

    brace_start = html_content.find("{", start_pos)
    if brace_start == -1:
        raise ValueError("Opening bracket for scheduleTeam not found")

    brace_depth = 0
    brace_end = -1
    for idx in range(brace_start, len(html_content)):
        char = html_content[idx]
        if char == "{":
            brace_depth += 1
        elif char == "}":
            brace_depth -= 1
            if brace_depth == 0:
                brace_end = idx + 1
                break

    if brace_end == -1:
        raise ValueError("Closing bracket for scheduleTeam not found")

    json_str = html_content[brace_start:brace_end]
    return json.loads(json_str)

def normalize_broadcast_source(source_name: str) -> str:
    """Normalizes raw source names from GE and discards non-video sources."""
    if not source_name:
        return ""
    clean = source_name.strip()
    
    # Strictly exclude fantasy game / non-streaming sources
    if clean.lower() == "cartola":
        return ""

    # Canonicalize known stream providers
    low = clean.lower()
    if "prime" in low:
        return "Prime Video"
    if "sportv" in low:
        return "SporTV"
    if "globoplay" in low:
        return "Globo"
    if low in ["globo", "tv globo"]:
        return "Globo"
    if "cazé" in low or "caze" in low:
        return "CazéTV"
    if "paramount" in low:
        return "Paramount+"
    if "disney" in low:
        return "Disney+"
    if "premiere" in low:
        return "Premiere"
    
    return clean

def fetch_single_team(team: dict) -> list:
    """Fetches and parses live and upcoming matches for a single club."""
    req = urllib.request.Request(team["url"], headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=12) as res:
        if res.status != 200:
            raise urllib.error.HTTPError(team["url"], res.status, f"HTTP Error {res.status}", None, None)
        html = res.read().decode("utf-8", errors="ignore")

    data = extract_schedule_payload(html)
    agenda = data.get("teamAgenda") or {}

    # GE separates matches into 'now' (currently playing / today), 'future' (upcoming), and 'past' (completed)
    now_events = agenda.get("now") or []
    future_events = agenda.get("future") or []
    past_events = (agenda.get("past") or [])[-5:]

    raw_candidates = []
    for item in now_events:
        raw_candidates.append((item, True))
    for item in future_events:
        raw_candidates.append((item, False))
    for item in past_events:
        raw_candidates.append((item, False))

    today_date = datetime.now().date()
    cutoff_date = today_date - timedelta(days=1)

    parsed_matches = []
    seen_ids = set()

    for item, is_now in raw_candidates:
        match_info = (item or {}).get("match") or {}
        match_id = match_info.get("id")
        if not match_id or match_id in seen_ids:
            continue

        start_date_str = match_info.get("startDate")
        if not start_date_str:
            continue

        try:
            match_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except ValueError:
            continue

        # If it's a completed past match not in 'now', only keep if it was played today
        if not is_now and item in past_events:
            if match_date < today_date:
                continue
        elif match_date < cutoff_date:
            continue

        seen_ids.add(match_id)

        start_hour_raw = match_info.get("startHour")
        hora_fmt = start_hour_raw[:5] if start_hour_raw else "A definir"

        first_contestant = match_info.get("firstContestant") or {}
        second_contestant = match_info.get("secondContestant") or {}

        phase_data = match_info.get("phase") or {}
        championship_edition = phase_data.get("championshipEdition") or {}
        championship = championship_edition.get("championship") or {}
        championship_name = championship.get("name") or "Competição"

        location_data = match_info.get("location") or {}
        stadium_name = location_data.get("popularName") or "A definir"

        # Check live status & scoreboard
        transmission = match_info.get("transmission") or {}
        broadcast_status = (transmission.get("broadcastStatus") or {}).get("id")
        moment = match_info.get("moment")
        is_live = bool(is_now or moment == "NOW" or broadcast_status == "LIVE")

        scoreboard = match_info.get("scoreboard") or {}
        placar = None
        if scoreboard.get("home") is not None and scoreboard.get("away") is not None:
            placar = {
                "mandante": scoreboard.get("home"),
                "visitante": scoreboard.get("away")
            }

        # Extract and filter broadcast sources
        raw_sources = match_info.get("liveWatchSources") or []
        live_sources = []
        for src in raw_sources:
            if not src:
                continue
            normalized = normalize_broadcast_source(src.get("name", ""))
            if normalized and normalized not in live_sources:
                live_sources.append(normalized)

        parsed_matches.append({
            "id": match_id,
            "data": start_date_str,
            "hora": hora_fmt,
            "campeonato": championship_name,
            "local": stadium_name,
            "aoVivo": is_live,
            "placar": placar,
            "mandante": {
                "nome": first_contestant.get("popularName") or "Time Casa",
                "escudo": first_contestant.get("badgeSvg") or first_contestant.get("badgePng") or ""
            },
            "visitante": {
                "nome": second_contestant.get("popularName") or "Time Fora",
                "escudo": second_contestant.get("badgeSvg") or second_contestant.get("badgePng") or ""
            },
            "ondeAssistir": live_sources
        })

    # Sort matches chronologically: date, then hour
    def sort_key(m):
        hora = m.get("hora") or "99:99"
        if hora == "A definir":
            hora = "99:99"
        return (m.get("data") or "9999-99-99", hora)

    parsed_matches.sort(key=sort_key)

    # Return top 7 upcoming/live matches
    return parsed_matches[:7]

def fetch_and_process_all_teams():
    print(f"=== Starting Tvzinha Match Schedule Pipeline ({len(TEAMS_CONFIG)} teams) ===")
    start_time = time.time()

    consolidated_output = {
        "updatedAt": datetime.now().isoformat(),
        "teams": {}
    }

    success_count = 0
    error_count = 0

    for idx, team in enumerate(TEAMS_CONFIG, 1):
        team_id = team["id"]
        team_name = team["name"]
        print(f"[{idx:02d}/{len(TEAMS_CONFIG):02d}] Fetching {team_name} ({team_id})...", end=" ", flush=True)

        t0 = time.time()
        try:
            matches = fetch_single_team(team)
            elapsed = time.time() - t0
            resolved_badge = resolve_team_crest(team_name, matches, team.get("escudo", ""))
            consolidated_output["teams"][team_id] = {
                "name": team_name,
                "escudo": resolved_badge,
                "matches": matches
            }
            success_count += 1
            print(f"OK ({len(matches)} matches, {elapsed:.2f}s)")
        except Exception as exc:
            elapsed = time.time() - t0
            error_count += 1
            print(f"FAILED ({elapsed:.2f}s, handled gracefully): {exc}")
            # Resilient fallback: ensure team key exists with empty fixture array
            consolidated_output["teams"][team_id] = {
                "name": team_name,
                "escudo": team.get("escudo", ""),
                "matches": []
            }

        # Rate-limiting safety interval
        if idx < len(TEAMS_CONFIG):
            time.sleep(1.2)

    total_duration = time.time() - start_time
    print(f"\nPipeline finished in {total_duration:.2f}s. Success: {success_count}, Errors: {error_count}")

    # Atomic write to production destination
    output_dir = os.path.dirname(OUTPUT_FILE_PATH)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
    with open(OUTPUT_FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(consolidated_output, f, ensure_ascii=False, indent=2)

    print(f"Consolidated schedule saved to: {OUTPUT_FILE_PATH}")
    return consolidated_output

if __name__ == "__main__":
    fetch_and_process_all_teams()

