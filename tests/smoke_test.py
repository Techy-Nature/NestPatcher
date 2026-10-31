"""End-to-end check of a NestPatcher command-line script on a tiny fake game.

    python tests/smoke_test.py patchers/NestPatcher_TiTS_Linux_v1.4.py
    python tests/smoke_test.py patchers/NestPatcher_TiTS_Windows_v1.4.py --python path/to/python

No TiTS files are needed: the fake game has an index.html, a hashed main.<hash>.js
with a version string, and one content bundle. Node.js must be on PATH (or set
NESTPATCHER_NODE) because patching validates JavaScript with node --check.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

MAIN = 'e.exports={i8:"0.9.999"};function greet(){return "world"}function Xq(e){return e+1}function count(){return Xq(2)}\n'
CONTENT = 'function shop(){return ["apple"]}\n'
INDEX = ('<!doctype html><html><head><script defer src="main.1a2b3c4d.js"></script>'
         '<script src="mods/kitty/kitty-inline.js"></script></head><body></body></html>\n')
MOD = """# Smoke test mod
Replace [main.js]:
return "world"
With:
return "nest"

Rep [content_test.js]:
["apple"]
W:
["apple","pear"]

# @@name@@ stands for a minified function name (it differs between game builds).
Rep [main.js]:
function count(){return @@add@@(2)}
W:
function count(){return @@add@@(3)}

Add Javascript:
window.smokeTest = true;
"""


def build(root, mods_name):
    app = os.path.join(root, "game", "resources", "app")
    os.makedirs(app)
    files = {"index.html": INDEX, "main.1a2b3c4d.js": MAIN, "content_test.5e6f7a8b.js": CONTENT}
    for name, text in files.items():
        with open(os.path.join(app, name), "w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
    os.makedirs(os.path.join(app, "mods", "kitty"))   # leftover from KittyPatcher
    mods = os.path.join(root, "tool", mods_name)
    os.makedirs(mods)
    with open(os.path.join(mods, "Smoke.mod"), "w", encoding="utf-8") as handle:
        handle.write(MOD)
    with open(os.path.join(mods, "Extra.js"), "w", encoding="utf-8") as handle:
        handle.write("window.extra = 1;\n")
    with open(os.path.join(mods, "enabled.txt"), "w", encoding="utf-8") as handle:
        handle.write("# load list\nSmoke.mod\nExtra.js\n")
    return app


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("script")
    parser.add_argument("--python", default=sys.executable)
    args = parser.parse_args()
    script = os.path.abspath(args.script)
    if os.sep in args.python or "/" in args.python:
        args.python = os.path.abspath(args.python)
    failures = []

    def check(label, ok):
        print(("PASS " if ok else "FAIL ") + label)
        if not ok:
            failures.append(label)

    root = tempfile.mkdtemp(prefix="nest-smoke-")
    try:
        app = build(root, "kitty-mods")
        tool = os.path.join(root, "tool")
        shutil.copy2(script, tool)
        local = os.path.join(tool, os.path.basename(script))
        game = os.path.join(root, "game")

        def run(*extra):
            result = subprocess.run([args.python, local, "--game", game] + list(extra), cwd=tool,
                                    capture_output=True, text=True, encoding="utf-8", errors="replace")
            print(result.stdout[-1500:] + result.stderr[-1500:])
            return result

        def read(name):
            with open(os.path.join(app, name), encoding="utf-8") as handle:
                return handle.read()

        result = run("--dry-run")
        check("dry run exits 0", result.returncode == 0)
        check("dry run counts 2 replacements", "DRY RUN: 3 replacements" in result.stdout)
        check("kitty-mods renamed to nestmods", os.path.isdir(os.path.join(tool, "nestmods"))
              and not os.path.isdir(os.path.join(tool, "kitty-mods")))
        check("dry run leaves game alone", read("main.1a2b3c4d.js") == MAIN)

        result = run()
        check("patch exits 0", result.returncode == 0)
        check("main bundle patched", 'return "nest"' in read("main.1a2b3c4d.js"))
        check("wildcard keeps the game's own function name", "function count(){return Xq(3)}" in read("main.1a2b3c4d.js"))
        check("content bundle patched", '["apple","pear"]' in read("content_test.5e6f7a8b.js"))
        index = read("index.html")
        check("index loads mods/nest", 'src="mods/nest/nest-inline.js"' in index and 'src="mods/nest/Extra.js"' in index)
        check("index has no mods/kitty tags", "mods/kitty/" not in index)
        check("KittyPatcher leftovers removed", not os.path.isdir(os.path.join(app, "mods", "kitty")))
        check("runtime written", os.path.isfile(os.path.join(app, "mods", "nest", "nest-inline.js")))

        result = run()
        check("second patch exits 0", result.returncode == 0)
        check("second patch does not double-apply", read("main.1a2b3c4d.js").count('"nest"') == 1)

        with open(os.path.join(tool, "nestmods", "enabled.txt"), "a", encoding="utf-8") as handle:
            handle.write("Missing.mod\n")
        result = run()
        check("missing mod stops the build", result.returncode != 0 and "Missing enabled files" in result.stdout)

        result = run("--restore")
        check("restore exits 0", result.returncode == 0)
        check("restore brings back the original", read("main.1a2b3c4d.js") == MAIN)

        result = run("--bug-report", "--note", "smoke")
        logs = os.path.join(tool, "nestmods", "logs")
        check("bug report zip written", result.returncode == 0 and any(
            name.startswith("NestBugReport_") for name in os.listdir(logs)))
    finally:
        shutil.rmtree(root, ignore_errors=True)
    print("\n" + ("ALL PASSED" if not failures else str(len(failures)) + " FAILED: " + ", ".join(failures)))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
