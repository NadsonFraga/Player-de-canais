import subprocess
import time
import json
import urllib.request
import asyncio
import os
import websockets

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

async def trace_overflow():
    user_data = os.path.abspath("scratch/edge_trace_profile")
    os.makedirs(user_data, exist_ok=True)

    proc = subprocess.Popen([
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9227",
        "--remote-allow-origins=*",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--window-size=1280,800",
        "--no-first-run",
        "http://localhost:8787"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        await asyncio.sleep(2)
        req = urllib.request.urlopen("http://127.0.0.1:9227/json")
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

            # Check modals and overflow
            res = await evaluate("""
                (() => {
                    const modals = Array.from(document.querySelectorAll('.modal, .movie-modal, #team-select-modal, #adblock-modal, #series-modal')).map(m => ({
                        id: m.id,
                        className: m.className,
                        hidden: m.classList.contains('hidden'),
                        display: window.getComputedStyle(m).display
                    }));
                    return {
                        bodyOverflow: document.body.style.overflow,
                        bodyClass: document.body.className,
                        modals: modals
                    };
                })()
            """)
            print("OVERFLOW & MODALS AUDIT:")
            print(json.dumps(res, indent=2))

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    asyncio.run(trace_overflow())
