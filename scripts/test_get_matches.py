import os
import json
import urllib.request
from datetime import datetime, timedelta

GE_VASCO_SCHEDULE_URL = "https://ge.globo.com/futebol/times/vasco/agenda-de-jogos-do-vasco/"
OUTPUT_FILE_PATH = os.path.join("arquivos", "proximos_jogos.json")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

def extract_schedule_team_json(html_content: str) -> dict:
    """
    Extracts the scheduleTeam JSON object from the raw HTML.
    Targeting scheduleTeam directly bypasses unquoted JavaScript keys
    present in the enclosing window.dataSportsSchedule object.
    """
    marker = "scheduleTeam:"
    start_pos = html_content.find(marker)
    if start_pos == -1:
        raise ValueError("Marker 'scheduleTeam:' not found in HTML response.")

    brace_start = html_content.find("{", start_pos)
    if brace_start == -1:
        raise ValueError("Opening brace for scheduleTeam not found.")

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
        raise ValueError("Could not find matching closing brace for scheduleTeam JSON.")

    json_substring = html_content[brace_start:brace_end]
    return json.loads(json_substring)

def fetch_and_process_matches():
    print(f"[1/4] Requesting schedule page from: {GE_VASCO_SCHEDULE_URL}")
    req = urllib.request.Request(
        GE_VASCO_SCHEDULE_URL,
        headers={"User-Agent": USER_AGENT}
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            if response.status != 200:
                raise RuntimeError(f"HTTP request failed with status: {response.status}")
            html = response.read().decode("utf-8", errors="ignore")
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch schedule from Globo Esporte: {exc}") from exc

    print(f"[2/4] HTML retrieved ({len(html)} bytes). Parsing scheduleTeam payload...")
    schedule_data = extract_schedule_team_json(html)
    future_events = (
        (schedule_data.get("teamAgenda") or {}).get("future") or []
    )
    print(f"[3/4] Found {len(future_events)} raw upcoming events. Applying business rules...")

    # Business Rule: Matches remain valid up to 1 day after match date
    cutoff_date = datetime.now().date() - timedelta(days=1)
    print(f"      Temporal cutoff date (Today - 1 day): {cutoff_date}")

    filtered_matches = []
    for item in future_events:
        match_info = (item or {}).get("match") or {}
        start_date_str = match_info.get("startDate")
        if not start_date_str:
            continue

        try:
            match_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except ValueError:
            continue

        if match_date >= cutoff_date:
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

            live_sources = [
                source.get("name")
                for source in (match_info.get("liveWatchSources") or [])
                if source and source.get("name")
            ]

            filtered_matches.append({
                "id": match_info.get("id"),
                "data": start_date_str,
                "hora": hora_fmt,
                "campeonato": championship_name,
                "local": stadium_name,
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

    # Limit to next 7 matches (user requested 6 to 7 matches)
    final_matches = filtered_matches[:7]
    print(f"[4/4] Sliced to next {len(final_matches)} fixtures.")

    os.makedirs(os.path.dirname(OUTPUT_FILE_PATH), exist_ok=True)
    with open(OUTPUT_FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(final_matches, f, ensure_ascii=False, indent=2)

    print(f"Data saved successfully to: {OUTPUT_FILE_PATH}\n")
    print("=== Processed Matches Output ===")
    print(json.dumps(final_matches, ensure_ascii=False, indent=2))
    return final_matches

if __name__ == "__main__":
    fetch_and_process_matches()
