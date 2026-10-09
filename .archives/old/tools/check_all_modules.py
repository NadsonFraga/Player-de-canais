import os
import subprocess
import json
import urllib.request
import asyncio
import websockets

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

async def check_all_modules():
    user_data = os.path.abspath("scratch/edge_check_profile")
    os.makedirs(user_data, exist_ok=True)
    
    proc = subprocess.Popen([
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9223",
        "--remote-allow-origins=*",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--no-first-run",
        "http://localhost:8787"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    try:
        await asyncio.sleep(2)
        req = urllib.request.urlopen("http://127.0.0.1:9223/json")
        targets = json.loads(req.read().decode('utf-8'))
        page_target = next((t for t in targets if t.get("type") == "page"), None)
        if not page_target:
            print("No page target found!")
            return
            
        async with websockets.connect(page_target["webSocketDebuggerUrl"]) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            
            # Find all .js files in assets/js
            js_files = []
            for root, dirs, files in os.walk('assets/js'):
                for f in files:
                    if f.endswith('.js'):
                        rel = os.path.relpath(os.path.join(root, f), 'assets/js').replace('\\', '/')
                        js_files.append(rel)
                        
            print(f"Testing dynamic import for {len(js_files)} JS files...")
            
            cmd_id = 10
            for f in sorted(js_files):
                cmd_id += 1
                expr = f"import('/assets/js/{f}?check={time.time()}')"
                await ws.send(json.dumps({
                    "id": cmd_id,
                    "method": "Runtime.evaluate",
                    "params": {"expression": expr, "awaitPromise": True}
                }))
                
                # wait for response
                while True:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    if data.get("id") == cmd_id:
                        result = data.get("result", {})
                        if "exceptionDetails" in result:
                            exc = result["exceptionDetails"]
                            desc = exc.get("exception", {}).get("description", exc.get("text"))
                            print(f"[FAIL] {f}: {desc}")
                        else:
                            print(f"[PASS] {f}")
                        break

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    import time
    asyncio.run(check_all_modules())
