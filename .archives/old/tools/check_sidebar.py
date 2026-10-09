import asyncio, json, urllib.request, websockets

async def check():
    req = urllib.request.urlopen('http://127.0.0.1:9222/json')
    targets = json.loads(req.read().decode('utf-8'))
    page = next(t for t in targets if t.get('type') == 'page')
    async with websockets.connect(page['webSocketDebuggerUrl']) as ws:
        cmd = """(() => {
            const sidebar = document.getElementById('sidebar');
            const closeBtn = document.querySelector('.close-mobile');
            return {
                sidebarStyle: sidebar ? {
                    display: window.getComputedStyle(sidebar).display,
                    position: window.getComputedStyle(sidebar).position,
                    transform: window.getComputedStyle(sidebar).transform,
                    width: window.getComputedStyle(sidebar).width,
                    visibility: window.getComputedStyle(sidebar).visibility
                } : null,
                closeBtnDisplay: closeBtn ? window.getComputedStyle(closeBtn).display : null,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight
            };
        })()"""
        await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': cmd, 'returnByValue': True}}))
        msg = await ws.recv()
        print(json.dumps(json.loads(msg)['result']['result']['value'], indent=2))

if __name__ == '__main__':
    asyncio.run(check())
