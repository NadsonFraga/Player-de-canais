import subprocess
import time
import json
import urllib.request
import asyncio
import os
import sys

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def run_headless_test():
    proc = subprocess.Popen([
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "http://localhost:8787"
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    try:
        time.sleep(2)
        # Fetch targets from CDP
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        targets = json.loads(req.read().decode('utf-8'))
        print("CDP targets found:", len(targets))
        for t in targets:
            print("Target:", t.get("title"), t.get("url"), t.get("webSocketDebuggerUrl"))
            
    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    run_headless_test()
