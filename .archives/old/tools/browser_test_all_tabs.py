import subprocess
import time
import json
import urllib.request
import asyncio
import os
import shutil
import websockets

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

async def test_all_tabs():
    user_data = os.path.abspath("scratch/edge_clean_test_profile")
    if os.path.exists(user_data):
        try:
            shutil.rmtree(user_data)
        except Exception:
            pass
    os.makedirs(user_data, exist_ok=True)
    
    proc = subprocess.Popen([
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9224",
        "--remote-allow-origins=*",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--no-first-run",
        "http://localhost:8787"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    try:
        await asyncio.sleep(2)
        req = urllib.request.urlopen("http://127.0.0.1:9224/json")
        targets = json.loads(req.read().decode('utf-8'))
        page_target = next((t for t in targets if t.get("type") == "page" and "localhost:8787" in t.get("url", "")), None)
        if not page_target:
            page_target = next((t for t in targets if t.get("type") == "page"), None)
            
        assert page_target, "No page target found"
        ws_url = page_target["webSocketDebuggerUrl"]
        
        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Console.enable"}))
            await ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
            await ws.send(json.dumps({"id": 3, "method": "Page.enable"}))
            
            exceptions = []
            console_logs = []
            
            async def drain_events(duration=0.5):
                end = time.time() + duration
                while time.time() < end:
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=0.2)
                        data = json.loads(msg)
                        if data.get("method") == "Runtime.exceptionThrown":
                            details = data["params"]["exceptionDetails"]
                            exceptions.append(details.get("exception", {}).get("description", details.get("text")))
                        elif data.get("method") == "Runtime.consoleAPICalled":
                            args = [str(a.get("value", a.get("description", ""))) for a in data["params"]["args"]]
                            console_logs.append(f"[{data['params']['type']}] " + " ".join(args))
                    except (asyncio.TimeoutError, websockets.ConnectionClosed):
                        pass

            cmd_id = 100
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

            await drain_events(2.0)
            
            # Initial state
            init_state = await evaluate("""
                ({
                    currentView: window.TvzinhaActions?.store ? window.TvzinhaActions.store.currentView : null,
                    bodyDataView: document.body.getAttribute('data-app-view'),
                    viewHomeHidden: document.getElementById('view-home')?.classList.contains('hidden'),
                    tabHomeActive: document.getElementById('nav-tab-home')?.classList.contains('active')
                })
            """)
            print("INITIAL STATE:", init_state)
            
            # Click Tab TV
            print("\n>>> Testing Click on #nav-tab-tv")
            await evaluate("document.getElementById('nav-tab-tv').click()")
            await drain_events(1.0)
            tv_state = await evaluate("""
                ({
                    currentView: window.TvzinhaActions?.store ? window.TvzinhaActions.store.currentView : null,
                    bodyDataView: document.body.getAttribute('data-app-view'),
                    viewTvHidden: document.getElementById('view-tv')?.classList.contains('hidden'),
                    viewHomeHidden: document.getElementById('view-home')?.classList.contains('hidden'),
                    tabTvActive: document.getElementById('nav-tab-tv')?.classList.contains('active')
                })
            """)
            print("TV STATE:", tv_state)
            
            # Click Tab Movies
            print("\n>>> Testing Click on #nav-tab-movies")
            await evaluate("document.getElementById('nav-tab-movies').click()")
            await drain_events(1.0)
            movies_state = await evaluate("""
                ({
                    currentView: window.TvzinhaActions?.store ? window.TvzinhaActions.store.currentView : null,
                    bodyDataView: document.body.getAttribute('data-app-view'),
                    viewMoviesHidden: document.getElementById('view-movies')?.classList.contains('hidden'),
                    tabMoviesActive: document.getElementById('nav-tab-movies')?.classList.contains('active')
                })
            """)
            print("MOVIES STATE:", movies_state)
            
            # Click Tab Series
            print("\n>>> Testing Click on #nav-tab-series")
            await evaluate("document.getElementById('nav-tab-series').click()")
            await drain_events(1.0)
            series_state = await evaluate("""
                ({
                    currentView: window.TvzinhaActions?.store ? window.TvzinhaActions.store.currentView : null,
                    bodyDataView: document.body.getAttribute('data-app-view'),
                    viewSeriesHidden: document.getElementById('view-series')?.classList.contains('hidden'),
                    tabSeriesActive: document.getElementById('nav-tab-series')?.classList.contains('active')
                })
            """)
            print("SERIES STATE:", series_state)

            # Click Tab Animes
            print("\n>>> Testing Click on #nav-tab-animes")
            await evaluate("document.getElementById('nav-tab-animes').click()")
            await drain_events(1.0)
            animes_state = await evaluate("""
                ({
                    currentView: window.TvzinhaActions?.store ? window.TvzinhaActions.store.currentView : null,
                    bodyDataView: document.body.getAttribute('data-app-view'),
                    viewAnimesHidden: document.getElementById('view-animes')?.classList.contains('hidden'),
                    tabAnimesActive: document.getElementById('nav-tab-animes')?.classList.contains('active')
                })
            """)
            print("ANIMES STATE:", animes_state)

            # Click Tab Sports
            print("\n>>> Testing Click on #nav-tab-sports (Em Breve)")
            await evaluate("document.getElementById('nav-tab-sports').click()")
            await drain_events(1.0)
            sports_state = await evaluate("""
                ({
                    currentView: window.TvzinhaActions?.store ? window.TvzinhaActions.store.currentView : null,
                    toastText: document.getElementById('app-toast')?.textContent,
                    toastVisible: !document.getElementById('app-toast')?.classList.contains('hidden')
                })
            """)
            print("SPORTS STATE:", sports_state)

            # Click Tab Home
            print("\n>>> Testing Click on #nav-tab-home")
            await evaluate("document.getElementById('nav-tab-home').click()")
            await drain_events(1.0)
            home_state = await evaluate("""
                ({
                    currentView: window.TvzinhaActions?.store ? window.TvzinhaActions.store.currentView : null,
                    bodyDataView: document.body.getAttribute('data-app-view'),
                    viewHomeHidden: document.getElementById('view-home')?.classList.contains('hidden'),
                    tabHomeActive: document.getElementById('nav-tab-home')?.classList.contains('active')
                })
            """)
            print("HOME RETURN STATE:", home_state)

            print("\n=== TOTAL UNCAUGHT EXCEPTIONS ===")
            print(f"Count: {len(exceptions)}")
            for exc in exceptions:
                print(" -", exc)

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    asyncio.run(test_all_tabs())
