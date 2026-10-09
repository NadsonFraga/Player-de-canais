import subprocess
import time
import json
import urllib.request
import asyncio
import os
import websockets

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

async def test_natural_scroll():
    user_data = os.path.abspath("scratch/edge_scroll_verify")
    os.makedirs(user_data, exist_ok=True)

    proc = subprocess.Popen([
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9228",
        "--remote-allow-origins=*",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--window-size=1280,720",
        "--no-first-run",
        "http://localhost:8787"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        await asyncio.sleep(2)
        req = urllib.request.urlopen("http://127.0.0.1:9228/json")
        targets = json.loads(req.read().decode('utf-8'))
        page_target = next((t for t in targets if t.get("type") == "page" and "localhost:8787" in t.get("url", "")), None)
        assert page_target, "No page target found"

        async with websockets.connect(page_target["webSocketDebuggerUrl"]) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            await ws.send(json.dumps({"id": 2, "method": "Network.enable"}))
            await ws.send(json.dumps({"id": 3, "method": "Network.setCacheDisabled", "params": {"cacheDisabled": True}}))
            await ws.send(json.dumps({"id": 4, "method": "Page.reload", "params": {"ignoreCache": True}}))
            await asyncio.sleep(2)

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

            # Check initial state
            init_res = await evaluate("""
                (() => {
                    const html = document.documentElement;
                    const body = document.body;
                    return {
                        htmlScrollHeight: html.scrollHeight,
                        bodyScrollHeight: body.scrollHeight,
                        windowInnerHeight: window.innerHeight,
                        htmlOverflowY: window.getComputedStyle(html).overflowY,
                        bodyOverflowY: window.getComputedStyle(body).overflowY,
                        canScroll: html.scrollHeight > window.innerHeight
                    };
                })()
            """)
            print("INITIAL SCROLL CAPABILITY:", json.dumps(init_res, indent=2))

            # Perform window.scrollTo(0, 250)
            scroll_res = await evaluate("""
                (() => {
                    window.scrollTo(0, 250);
                    return {
                        scrollY: window.scrollY,
                        pageYOffset: window.pageYOffset,
                        htmlScrollTop: document.documentElement.scrollTop
                    };
                })()
            """)
            print("\nAFTER window.scrollTo(0, 250):", json.dumps(scroll_res, indent=2))

            # Test smooth mouse wheel simulation via Input.dispatchMouseEvent
            await ws.send(json.dumps({
                "id": 100,
                "method": "Input.dispatchMouseEvent",
                "params": {
                    "type": "mouseWheel",
                    "x": 400,
                    "y": 400,
                    "deltaX": 0,
                    "deltaY": 150
                }
            }))
            await asyncio.sleep(0.5)

            wheel_res = await evaluate("""
                (() => {
                    return {
                        scrollY: window.scrollY,
                        pageYOffset: window.pageYOffset
                    };
                })()
            """)
            print("\nAFTER WHEEL SCROLL EVENT:", json.dumps(wheel_res, indent=2))

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    asyncio.run(test_natural_scroll())
