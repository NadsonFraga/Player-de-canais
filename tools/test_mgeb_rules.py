"""
Checks the MGEB source rules: an answer for another episode is refused (P5), each source's length is
measured and a source whose length disagrees with the others is ranked last (P7), and an empty playlist
is not a live source (P2).

Part 1 runs the same cases against tools/local_server.py (Python) and functions/api/resolve.js (Node,
loaded in memory with its helpers exported, the file itself is not changed). The lengths are the ones
measured on 2026-10-10 (DBZ, Bleach, Re:Zero).

Part 2 (--live) asks /api/resolve of a running local server, one title at a time with a pause between
them (MGEB throttles bursts).

Usage:
    python tools/test_mgeb_rules.py
    python tools/local_server.py                    (in another terminal, for --live)
    python tools/test_mgeb_rules.py --live [--base=http://127.0.0.1:8787] [--only=DBZ]
"""
import importlib.util
import json
import pathlib
import struct
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

ROOT = pathlib.Path(__file__).resolve().parent.parent
base = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--base=")), "http://127.0.0.1:8787")
failures = 0


def check(name, ok, detail=""):
    global failures
    failures += 0 if ok else 1
    print(f"  {'OK  ' if ok else 'FAIL'} {name} {detail}")


def moov_hex(version, timescale, duration):
    """A moov box holding only an mvhd box, as hex."""
    if version == 1:
        body = bytes([1, 0, 0, 0]) + bytes(16) + struct.pack(">IQ", timescale, duration) + bytes(80)
    else:
        body = bytes([0, 0, 0, 0]) + bytes(8) + struct.pack(">II", timescale, duration) + bytes(80)
    mvhd = struct.pack(">I", 8 + len(body)) + b"mvhd" + body
    return (struct.pack(">I", 8 + len(mvhd)) + b"moov" + mvhd).hex()


def src(duration, quality=1080, kind="hls-single", raw_url="https://cdn.example/a.m3u8"):
    return {"duration": duration, "alive": True, "probed": True, "quality": quality, "kind": kind,
            "raw_url": raw_url, "synthetic": False, "duration_mismatch": False}


def group_detail(*sizes_and_names):
    """A TMDB episode group detail: ("Season 1", 24), ("Specials", 5, 0)... episodes numbered
    continuously on TMDB season 1 (season 0 for specials), listed out of order on purpose."""
    groups, next_ep = [], 1
    for order, item in enumerate(sizes_and_names):
        name, size = item[0], item[1]
        season = item[2] if len(item) > 2 else 1
        eps = []
        for i in range(size):
            number = (i + 1) if season == 0 else next_ep + i
            eps.append({"season_number": season, "episode_number": number, "order": i})
        if season != 0:
            next_ep += size
        groups.append({"name": name, "order": order, "episodes": list(reversed(eps))})
    return {"groups": list(reversed(groups))}


JJK = group_detail(("Season 1", 24), ("Season 2", 23), ("Specials", 5, 0), ("Season 3", 12))
REZERO = group_detail(("Season 1", 25), ("Season 2", 25), ("Specials", 81, 0), ("Season 3", 16), ("Season 4", 19))
ONE_GROUP = group_detail(("Season 1", 59))

CASES = {
    # group detail, TMDB season, TMDB episode -> real season/episode (None: no mapping)
    "merged": [
        ["JJK E24", JJK, 1, 24, [1, 24]],
        ["JJK E25", JJK, 1, 25, [2, 1]],
        ["JJK E41 (Trovão, parte 2)", JJK, 1, 41, [2, 17]],
        ["JJK E48", JJK, 1, 48, [3, 1]],
        ["JJK E60 (beyond the list)", JJK, 1, 60, None],
        ["Re:Zero E26", REZERO, 1, 26, [2, 1]],
        ["Re:Zero E51", REZERO, 1, 51, [3, 1]],
        ["only one regular group", ONE_GROUP, 1, 41, None],
    ],
    "title": [
        ["One Piece - T1E1 - Eu Sou Luffy!", 1, 62, False],
        ["One Piece - T1E1 - Eu Sou Luffy!", 1, 1, True],
        ["Naruto Shippuden - T6E1 - Episódio 1", 6, 1, True],
        ["Show - T10E1 - Nome", 1, 1, False],
        ["Show - t2e10 - nome", 2, 10, True],
        ["Título sem o padrão", 3, 7, True],
    ],
    "hls": [
        ["#EXTM3U\n#EXTINF:10.0,\na.ts\n#EXTINF:5.5,\nb.ts\n#EXT-X-ENDLIST\n", 2, 15.5],
        ["#EXTM3U\n#EXTINF:10.0,\na.ts\n#EXTINF:5.5,\nb.ts\n", 2, None],
        ["#EXTM3U\n#EXT-X-ENDLIST\n", 0, 0],
    ],
    "mvhd": [
        [moov_hex(0, 1000, 1469800), 1469.8],
        [moov_hex(1, 90000, 1453 * 90000 + 54000), 1453.6],
        [moov_hex(0, 1000, 0xFFFFFFFF), None],
    ],
    # lengths per source -> which ones must be flagged
    "outliers": [
        ["DBZ T1E1", [1453.6, 1469.8, 1342.4], [False, False, True]],
        ["Bleach T1E1", [1475.1, 1384.3, 1371.1, 1371.1], [True, False, False, False]],
        ["Re:Zero T1E1", [3001.9, 3001.7, 2950.7], [False, False, False]],
        ["two lengths only", [1453.6, 1342.0], [False, False]],
        ["one unknown", [1453.6, None, 1469.8, 1342.4], [False, False, False, True]],
    ],
    # trusted source length, others' lengths -> may the ranking stop early?
    "early_stop": [
        ["trusted confirmed", 1469.8, [1453.6], True],
        ["trusted is the odd one", 1342.4, [1453.6], False],
        ["trusted alone", 1453.6, [], False],
        ["trusted without length", None, [1453.6], False],
    ],
}


def run_python():
    spec = importlib.util.spec_from_file_location("local_server", ROOT / "tools" / "local_server.py")
    ls = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ls)
    out = {"merged": [], "title": [], "hls": [], "mvhd": [], "outliers": [], "early_stop": []}
    for _, detail, s, e, _ in CASES["merged"]:
        mapped = ls.map_merged_episode(ls.regular_season_groups(detail), s, e)
        out["merged"].append(list(mapped) if mapped else None)
    for title, s, e, _ in CASES["title"]:
        out["title"].append(ls.mgeb_episode_matches(title, s, e))
    for text, _, _ in CASES["hls"]:
        d = ls.hls_playlist_duration(text)
        out["hls"].append([d["segments"], d["seconds"]])
    for hx, _ in CASES["mvhd"]:
        out["mvhd"].append(ls.parse_moov_duration(bytes.fromhex(hx), 0))
    for _, lengths, _ in CASES["outliers"]:
        sources = [src(d) for d in lengths]
        ls.mark_duration_outliers(sources)
        out["outliers"].append([s["duration_mismatch"] for s in sources])
    for _, top, others, _ in CASES["early_stop"]:
        results = [src(top)] + [src(d, quality=720) for d in others]
        out["early_stop"].append(bool(ls.can_stop_probing(results)))
    return out


NODE_HARNESS = r"""
import { readFileSync } from "node:fs";
const [file] = process.argv.slice(1);
const casesJson = readFileSync(0, "utf8");
const code = readFileSync(file, "utf8") +
  "\nexport { mgebEpisodeMatches, hlsPlaylistDuration, parseMoovDuration, markDurationOutliers, canStopProbing," +
  " regularSeasonGroups, mapMergedEpisode };\n";
const m = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
const cases = JSON.parse(casesJson);
const src = (d, quality = 1080) => ({ duration: d, alive: true, probed: true, quality, kind: "hls-single",
  raw_url: "https://cdn.example/a.m3u8", synthetic: false, duration_mismatch: false });
const out = {
  merged: cases.merged.map(([, detail, s, e]) => {
    const mapped = m.mapMergedEpisode(m.regularSeasonGroups(detail), s, e);
    return mapped ? [mapped.season, mapped.episode] : null;
  }),
  title: cases.title.map(([t, s, e]) => m.mgebEpisodeMatches(t, s, e)),
  hls: cases.hls.map(([t]) => { const d = m.hlsPlaylistDuration(t); return [d.segments, d.seconds]; }),
  mvhd: cases.mvhd.map(([hx]) => m.parseMoovDuration(Uint8Array.from(Buffer.from(hx, "hex")), 0)),
  outliers: cases.outliers.map(([, lengths]) => {
    const sources = lengths.map(d => src(d));
    m.markDurationOutliers(sources);
    return sources.map(s => s.duration_mismatch);
  }),
  early_stop: cases.early_stop.map(([, top, others]) => Boolean(m.canStopProbing([src(top), ...others.map(d => src(d, 720))]))),
};
console.log(JSON.stringify(out));
"""


def run_node():
    res = subprocess.run(
        ["node", "--input-type=module", "-e", NODE_HARNESS, "--", str(ROOT / "functions" / "api" / "resolve.js")],
        input=json.dumps(CASES), capture_output=True, text=True, encoding="utf-8")
    if res.returncode != 0:
        print(res.stderr)
        raise SystemExit("Node harness failed")
    return json.loads(res.stdout)


def same(a, b):
    if isinstance(a, float) or isinstance(b, float):
        return a is not None and b is not None and abs(a - b) < 0.05
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(same(x, y) for x, y in zip(a, b))
    return a == b


def check_unit(lang, out):
    print(f"\n== Rules ({lang})")
    for case, got in zip(CASES["merged"], out["merged"]):
        check(f"merged season: {case[0]}", got == case[4], f"-> {got}")
    for case, got in zip(CASES["title"], out["title"]):
        check(f"title '{case[0]}' asked T{case[1]}E{case[2]}", got == case[3], f"-> {got}")
    for case, got in zip(CASES["hls"], out["hls"]):
        check(f"playlist {case[1]} segments", same(got, [case[1], case[2]]), f"-> {got}")
    for case, got in zip(CASES["mvhd"], out["mvhd"]):
        check(f"mvhd -> {case[1]}", same(got, case[1]), f"-> {got}")
    for case, got in zip(CASES["outliers"], out["outliers"]):
        check(f"outliers {case[0]}", got == case[2], f"-> {got}")
    for case, got in zip(CASES["early_stop"], out["early_stop"]):
        check(f"early stop: {case[0]}", got == case[3], f"-> {got}")


py_out = run_python()
node_out = run_node()
check_unit("Python, local_server.py", py_out)
check_unit("Node, resolve.js", node_out)
print("\n== Parity")
check("Python and Node give the same answers", same(json.loads(json.dumps(py_out)), node_out))

# name, params, expectation ("404" or "ok"), host substring that must not lead
LIVE = [
    ("One Piece T1E1", {"id": 37854, "type": "serie", "season": 1, "episode": 1}, "ok", None),
    ("One Piece T1E62 (not on MGEB)", {"id": 37854, "type": "serie", "season": 1, "episode": 62}, "404", None),
    ("One Piece T1E500 (not on MGEB)", {"id": 37854, "type": "serie", "season": 1, "episode": 500}, "404", None),
    ("Naruto Shippuden T2E1", {"id": 31910, "type": "serie", "season": 2, "episode": 1}, "ok", None),
    ("Naruto Shippuden T6E1", {"id": 31910, "type": "serie", "season": 6, "episode": 1}, "ok", None),
    ("DBZ T1E1", {"id": 12971, "type": "serie", "season": 1, "episode": 1}, "ok", "mgeb.site"),
    ("DBZ T1E2", {"id": 12971, "type": "serie", "season": 1, "episode": 2}, "ok", "mgeb.site"),
    ("DBZ T1E3", {"id": 12971, "type": "serie", "season": 1, "episode": 3}, "ok", "mgeb.site"),
    ("Bleach T1E1", {"id": 30984, "type": "serie", "season": 1, "episode": 1}, "ok", "noflixplayer"),
    ("Re:Zero T1E1", {"id": 65942, "type": "serie", "season": 1, "episode": 1}, "ok", None),
    # One long season on TMDB, split on MGEB: the server must ask for the real season
    ("JJK T1E17 (no mapping needed)", {"id": 95479, "type": "anime", "lang": "dub", "season": 1, "episode": 17}, "T1E17", None),
    ("JJK T1E25 -> T2E1", {"id": 95479, "type": "anime", "lang": "dub", "season": 1, "episode": 25}, "T2E1", None),
    ("JJK T1E41 -> T2E17 (Trovão, parte 2)", {"id": 95479, "type": "anime", "lang": "dub", "season": 1, "episode": 41}, "T2E17", None),
    # Same TMDB structure, but MGEB follows the TMDB numbering here: nothing to convert
    ("Re:Zero T1E30 (MGEB uses TMDB numbering)", {"id": 65942, "type": "anime", "lang": "dub", "season": 1, "episode": 30}, "T1E30", None),
    ("Apotecária T1E30 (MGEB uses TMDB numbering)", {"id": 220542, "type": "anime", "lang": "dub", "season": 1, "episode": 30}, "T1E30", None),
    ("Friends T1E1", {"id": 1668, "type": "serie", "season": 1, "episode": 1}, "ok", None),
    ("Breaking Bad T1E1", {"id": 1396, "type": "serie", "season": 1, "episode": 1}, "ok", None),
    ("Avatar (movie)", {"id": 19995, "type": "movie"}, "ok", None),
    ("Zootopia 2 (movie)", {"id": 1084242, "type": "movie"}, "ok", None),
]


def probe_ms(headers):
    """The 'probe' step (source checks) from Server-Timing, in ms."""
    for part in (headers.get("Server-Timing") or "").split(","):
        name, _, dur = part.strip().partition(";dur=")
        if name == "probe":
            return int(float(dur))
    return None


def resolve(params):
    url = f"{base}/api/resolve?{urllib.parse.urlencode({**params, 'title': 't'})}"
    started = time.time()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "TestClient/1.0"}), timeout=90) as res:
            return res.status, json.loads(res.read().decode("utf-8")), time.time() - started, probe_ms(res.headers)
    except urllib.error.HTTPError as err:
        return err.code, json.loads(err.read().decode("utf-8")), time.time() - started, probe_ms(err.headers)


if "--live" in sys.argv:
    print(f"\n== Live matrix ({base}), one title at a time")
    try:
        urllib.request.urlopen(f"{base}/__dev/clear-cache", timeout=10).read()
    except Exception:
        pass
    only = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--only=")), "")
    times, probes = [], []
    for name, params, expect, odd_host in LIVE:
        if only and only.lower() not in name.lower():
            continue
        status, data, secs, probe = resolve(params)
        times.append(secs)
        if probe is not None:
            probes.append(probe)
        sources = [data.get("primary_source")] + data.get("fallback_sources", []) if data.get("primary_source") else []
        summary = ", ".join(
            f"{urllib.parse.urlparse(s.get('raw_url', '')).netloc.split('.')[-2] if s.get('raw_url') else '?'}"
            f":{s.get('duration')}{'(x)' if s.get('duration_mismatch') else ''}{'' if s.get('alive') else '(dead)'}"
            for s in sources)
        if expect == "404":
            check(name, status == 404, f"HTTP {status} reason={data.get('reason')} {secs:.1f}s")
        elif expect.startswith("T"):
            got = data.get("mgeb_episode")
            check(name, status == 200 and got == expect and expect in (data.get("title") or ""),
                  f"HTTP {status} {secs:.1f}s asked {got} title={data.get('title')!r}")
        else:
            primary = (data.get("primary_source") or {}).get("raw_url", "")
            ok = status == 200 and bool(primary) and not (odd_host and odd_host in primary)
            # Movies have legitimate cuts of different lengths: never flagged
            if params["type"] == "movie":
                ok = ok and not any(s.get("duration_mismatch") for s in sources)
            check(name, ok, f"HTTP {status} {secs:.1f}s probe {probe}ms | {summary}")
        time.sleep(2.5)
    times.sort()
    probes.sort()
    print(f"  resolve time: median {times[len(times) // 2]:.1f}s, worst {times[-1]:.1f}s")
    if probes:
        print(f"  source checks (probe): median {probes[len(probes) // 2]} ms, worst {probes[-1]} ms")

print(f"\n{'All checks passed' if failures == 0 else f'{failures} check(s) failed'}")
sys.exit(1 if failures else 0)
