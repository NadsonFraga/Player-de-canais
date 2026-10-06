import subprocess
import time
import json
import urllib.request
import asyncio
import os
import sys
import websockets

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

async def test_session():
    # Start Edge in headless mode with clean user data dir
    user_data = os.path.abspath("scratch/edge_profile")
    os.makedirs(user_data, exist_ok=True)
    
    proc = subprocess.Popen([
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--no-first-run",
        "http://localhost:8787"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    try:
        await asyncio.sleep(2)
        # Find page target
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        targets = json.loads(req.read().decode('utf-8'))
        page_target = next((t for t in targets if t.get("type") == "page" and "localhost:8787" in t.get("url", "")), None)
        if not page_target:
            # fallback to any page
            page_target = next((t for t in targets if t.get("type") == "page"), None)
            
        if not page_target:
            print("No page target found!")
            return
            
        ws_url = page_target["webSocketDebuggerUrl"]
        print(f"Connecting to CDP: {ws_url}")
        
        async with websockets.connect(ws_url) as ws:
            # Enable Console, Runtime, Page, Network
            await ws.send(json.dumps({"id": 1, "method": "Console.enable"}))
            await ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
            await ws.send(json.dumps({"id": 3, "method": "Page.enable"}))
            await ws.send(json.dumps({"id": 4, "method": "Network.enable"}))
            await ws.send(json.dumps({"id": 5, "method": "Network.setCacheDisabled", "params": {"cacheDisabled": True}}))
            
            # Reload page with cache disabled
            await ws.send(json.dumps({"id": 6, "method": "Page.reload", "params": {"ignoreCache": True}}))
            
            # Listen for logs for 3 seconds
            logs = []
            
            async def read_incoming():
                while True:
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=0.5)
                        data = json.loads(msg)
                        if data.get("method") == "Runtime.consoleAPICalled":
                            args = [a.get("value", a.get("description", "")) for a in data["params"]["args"]]
                            logs.append(f"[{data['params']['type'].upper()}] " + " ".join(map(str, args)))
                        elif data.get("method") == "Runtime.exceptionThrown":
                            details = data["params"]["exceptionDetails"]
                            text = details.get("text", "")
                            exc = details.get("exception", {}).get("description", "")
                            logs.append(f"[EXCEPTION] {text}: {exc}")
                    except asyncio.TimeoutError:
                        break
                    except Exception as e:
                        break

            await read_incoming()
            print("=== CONSOLE LOGS ON INITIAL LOAD ===")
            for l in logs:
                print(l)
                
            # Now evaluate document state: activeElement, buttons, etc.
            cmd_id = 100
            async def eval_js(expr):
                nonlocal cmd_id
                cmd_id += 1
                await ws.send(json.dumps({
                    "id": cmd_id,
                    "method": "Runtime.evaluate",
                    "params": {"expression": expr, "returnByValue": True}
                }))
                while True:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    if data.get("id") == cmd_id:
                        return data.get("result", {}).get("result", {}).get("value")

            res_state = await eval_js("""
                (() => {
                    const capsule = document.getElementById('floating-nav-capsule');
                    const tabHome = document.getElementById('nav-tab-home');
                    const tabTv = document.getElementById('nav-tab-tv');
                    const viewHome = document.getElementById('view-home');
                    const viewTv = document.getElementById('view-tv');
                    return {
                        hasCapsule: !!capsule,
                        capsuleStyles: capsule ? {
                            display: window.getComputedStyle(capsule).display,
                            visibility: window.getComputedStyle(capsule).visibility,
                            opacity: window.getComputedStyle(capsule).opacity,
                            pointerEvents: window.getComputedStyle(capsule).pointerEvents,
                            zIndex: window.getComputedStyle(capsule).zIndex
                        } : null,
                        viewHomeHidden: viewHome ? viewHome.classList.contains('hidden') : null,
                        viewTvHidden: viewTv ? viewTv.classList.contains('hidden') : null,
                        tabHomeActive: tabHome ? tabHome.classList.contains('active') : null,
                        tabTvActive: tabTv ? tabTv.classList.contains('active') : null,
                        currentAppViewAttr: document.body.getAttribute('data-app-view'),
                        windowTvzinhaActions: typeof window.TvzinhaActions
                    };
                })()
            """)
            print("\n=== DOM EVALUATION INITIAL STATE ===")
            print(json.dumps(res_state, indent=2))

            # Now test clicking #nav-tab-tv
            print("\n--- Clicking #nav-tab-tv ---")
            click_res = await eval_js("""
                (() => {
                    const tabTv = document.getElementById('nav-tab-tv');
                    if (!tabTv) return 'No tabTv';
                    tabTv.click();
                    return 'Clicked tabTv';
                })()
            """)
            print("Click result:", click_res)

            await asyncio.sleep(1)
            await read_incoming()

            res_after_click = await eval_js("""
                (() => {
                    const tabTv = document.getElementById('nav-tab-tv');
                    const tabHome = document.getElementById('nav-tab-home');
                    const viewHome = document.getElementById('view-home');
                    const viewTv = document.getElementById('view-tv');
                    return {
                        viewHomeHidden: viewHome ? viewHome.classList.contains('hidden') : null,
                        viewTvHidden: viewTv ? viewTv.classList.contains('hidden') : null,
                        tabHomeActive: tabHome ? tabHome.classList.contains('active') : null,
                        tabTvActive: tabTv ? tabTv.classList.contains('active') : null,
                        currentAppViewAttr: document.body.getAttribute('data-app-view')
                    };
                })()
            """)
            print("\n=== DOM STATE AFTER CLICKING TV ===")
            print(json.dumps(res_after_click, indent=2))

            # Now test clicking #nav-tab-movies
            print("\n--- Clicking #nav-tab-movies ---")
            await eval_js("document.getElementById('nav-tab-movies')?.click()")
            await asyncio.sleep(1)
            await read_incoming()

            res_movies_click = await eval_js("""
                (() => {
                    const tabMovies = document.getElementById('nav-tab-movies');
                    const viewMovies = document.getElementById('view-movies');
                    return {
                        viewMoviesHidden: viewMovies ? viewMovies.classList.contains('hidden') : null,
                        tabMoviesActive: tabMovies ? tabMovies.classList.contains('active') : null,
                        currentAppViewAttr: document.body.getAttribute('data-app-view')
                    };
                })()
            """)
            print("\n=== DOM STATE AFTER CLICKING MOVIES ===")
            print(json.dumps(res_movies_click, indent=2))

            # Print any new console logs
            if logs:
                print("\n=== ALL LOGS ACCUMULATED ===")
                for l in logs:
                    print(l)

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    asyncio.run(test_session())
