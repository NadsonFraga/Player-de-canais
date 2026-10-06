import subprocess
import time
import json
import urllib.request
import asyncio
import os
import shutil
import websockets

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

async def test_continue():
    user_data = os.path.abspath("scratch/edge_continue_profile")
    if os.path.exists(user_data):
        try:
            shutil.rmtree(user_data)
        except Exception:
            pass
    os.makedirs(user_data, exist_ok=True)

    proc = subprocess.Popen([
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9225",
        "--remote-allow-origins=*",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--window-size=1280,800",
        "--no-first-run",
        "http://localhost:8787"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        await asyncio.sleep(2)
        req = urllib.request.urlopen("http://127.0.0.1:9225/json")
        targets = json.loads(req.read().decode('utf-8'))
        page_target = next((t for t in targets if t.get("type") == "page" and "localhost:8787" in t.get("url", "")), None)
        assert page_target, "No page target found"

        async with websockets.connect(page_target["webSocketDebuggerUrl"]) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            await ws.send(json.dumps({"id": 2, "method": "Page.enable"}))

            cmd_id = 10
            async def evaluate(expr):
                nonlocal cmd_id
                cmd_id += 1
                await ws.send(json.dumps({
                    "id": cmd_id,
                    "method": "Runtime.evaluate",
                    "params": {"expression": expr, "returnByValue": True, "awaitPromise": True}
                }))
                while True:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    if data.get("id") == cmd_id:
                        res = data.get("result", {})
                        if "exceptionDetails" in res:
                            exc = res["exceptionDetails"]
                            return {"error": exc.get("exception", {}).get("description", exc.get("text"))}
                        return res.get("result", {}).get("value")

            # Seed localStorage with sample watch progress
            seed_res = await evaluate("""
                (() => {
                    const sample = {
                        "1396": {
                            id: 1396,
                            title: "Breaking Bad",
                            poster_path: "/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
                            backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
                            season: 1,
                            episode: 1,
                            episodeTitle: "Piloto",
                            mediaType: "tv",
                            timestamp: Date.now() - 1000
                        },
                        "108978": {
                            id: 108978,
                            title: "Reacher",
                            poster_path: "/j73ytuzmg43tcDCpuBHeg2i3x6n.jpg",
                            backdrop_path: "/tuCU2ctkdN9B4K915v479w91Nf4.jpg",
                            season: 1,
                            episode: 1,
                            episodeTitle: "Bem-vindo a Margrave",
                            mediaType: "tv",
                            timestamp: Date.now() - 2000
                        }
                    };
                    localStorage.setItem("tvzinha_watch_progress_v1", JSON.stringify(sample));
                    window.TvzinhaActions?.store?.setWatchProgress?.(sample);
                    // Trigger re-render
                    const seriesMod = window.TvzinhaActions;
                    // re-run render
                    const section = document.getElementById("home-continue-watching-section");
                    const track = document.getElementById("home-continue-watching-track");
                    // Check if function exists or trigger switchAppView('home')
                    return { seeded: true };
                })()
            """)
            print("Seed result:", seed_res)

            # Reload to trigger natural bootstrap with populated localStorage
            await ws.send(json.dumps({"id": 50, "method": "Page.reload"}))
            await asyncio.sleep(2)

            # Check rendered card styles
            card_info = await evaluate("""
                (() => {
                    const section = document.getElementById('home-continue-watching-section');
                    const cards = Array.from(document.querySelectorAll('.continue-card'));
                    if (!cards.length) return { count: 0, sectionHidden: section?.classList.contains('hidden') };

                    const first = cards[0];
                    const rect = first.getBoundingClientRect();
                    const media = first.querySelector('.continue-card-media');
                    const mediaRect = media ? media.getBoundingClientRect() : null;
                    const img = first.querySelector('.continue-card-media img');
                    const title = first.querySelector('.continue-card-title');
                    const ep = first.querySelector('.continue-card-ep');

                    return {
                        count: cards.length,
                        sectionHidden: section.classList.contains('hidden'),
                        cardDimensions: {
                            width: rect.width,
                            height: rect.height
                        },
                        mediaDimensions: mediaRect ? {
                            width: mediaRect.width,
                            height: mediaRect.height
                        } : null,
                        imgSrc: img ? img.src : null,
                        imgComputedHeight: img ? window.getComputedStyle(img).height : null,
                        titleText: title ? title.textContent : null,
                        epText: ep ? ep.textContent : null
                    };
                })()
            """)
            print("\nCARD INSPECTION RESULT:")
            print(json.dumps(card_info, indent=2))

            # Test clicking the first continue card
            print("\n>>> Testing Click on first continue card...")
            click_res = await evaluate("""
                (() => {
                    const first = document.querySelector('.continue-card');
                    if (!first) return { error: 'No card' };
                    first.click();
                    return { clicked: true };
                })()
            """)
            print("Click result:", click_res)
            await asyncio.sleep(1.5)

            modal_state = await evaluate("""
                (() => {
                    const modal = document.getElementById('series-modal');
                    const playerView = document.getElementById('series-player-view');
                    const epTitle = document.getElementById('series-player-current-ep');
                    return {
                        modalHidden: modal ? modal.classList.contains('hidden') : null,
                        playerViewVisible: playerView ? !playerView.classList.contains('hidden') : null,
                        currentEpPlaying: epTitle ? epTitle.textContent : null
                    };
                })()
            """)
            print("\nSERIES THEATER PLAYER STATE AFTER CLICK:")
            print(json.dumps(modal_state, indent=2))

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    asyncio.run(test_continue())
