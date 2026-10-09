"""
Stamps ONE cache-busting version on every local JS import and on the CSS/JS tags of index.html.

  python tools/bump_version.py            # new version from the current time
  python tools/bump_version.py 20261009_a # explicit version
  python tools/bump_version.py --check    # exit 1 if versions are mixed (use before a commit)

Why every import: browsers keep each module URL on its own. If main.js?v=NEW imports './historyManager.js' without a
version, a visitor with the old copy cached gets a new router and an old history manager, the import fails and the whole
app goes dead. The same module must also always carry the SAME string, otherwise it loads twice and its state splits.
Run this once before every deploy that touches assets/js or assets/css.
"""
import pathlib
import re
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
JS_FILES = sorted((ROOT / "assets" / "js").rglob("*.js"))
INDEX = ROOT / "index.html"
# import x from './a.js'  |  export { x } from '../a.js?v=1'  |  import './a.js'
IMPORT_RE = re.compile(r"""((?:from|import)\s*)(['"])(\.{1,2}/[^'"?]+\.js)(?:\?v=[^'"]*)?\2""")
TAG_RE = re.compile(r"""((?:href|src)=")(assets/(?:css|js)/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?(")""")


def read(path):
    return path.read_bytes().decode("utf-8")


def write(path, text):
    path.write_bytes(text.encode("utf-8"))


def versions_found():
    found = set()
    for path in JS_FILES:
        found.update(m.group(0).split("?v=")[1][:-1] if "?v=" in m.group(0) else "" for m in IMPORT_RE.finditer(read(path)))
    found.update(m.group(0).split("?v=")[1][:-1] if "?v=" in m.group(0) else "" for m in TAG_RE.finditer(read(INDEX)))
    return found


def main():
    args = sys.argv[1:]
    if args == ["--check"]:
        found = versions_found()
        print("versions in use:", sorted(found))
        sys.exit(0 if len(found) == 1 and "" not in found else 1)
    version = args[0] if args else time.strftime("%Y%m%d_%H%M")
    changed = 0
    for path in JS_FILES:
        text = read(path)
        new = IMPORT_RE.sub(lambda m: f"{m.group(1)}{m.group(2)}{m.group(3)}?v={version}{m.group(2)}", text)
        if new != text:
            write(path, new)
            changed += 1
    text = read(INDEX)
    new = TAG_RE.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={version}{m.group(3)}", text)
    if new != text:
        write(INDEX, new)
        changed += 1
    print(f"version {version}: {changed} files updated")


if __name__ == "__main__":
    main()
