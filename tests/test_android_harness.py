"""Checks the Android app's Python harness (android/app/src/main/python/nest_android.py)
on a PC: every bundled patcher must run through it against an Android-style project
(PROJECT/extracted/apk/assets/www + PROJECT/mods), with Node standing in for the
phone's JavaScript engine.

    python tests/test_android_harness.py
"""
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(REPO, "android", "app", "src", "main", "python"))
sys.path.insert(0, HERE)

import nest_android  # noqa: E402
from smoke_test import MAIN, CONTENT, INDEX, MOD  # noqa: E402

NODE = shutil.which("node") or os.environ.get("NESTPATCHER_NODE")


class NodeChecker(object):
    def check(self, path):
        result = subprocess.run([NODE, "--check", path], capture_output=True, text=True)
        return (result.stderr or result.stdout).strip() if result.returncode else ""


class Sink(object):
    def __init__(self):
        self.lines = []

    def line(self, text):
        self.lines.append(text)

    def text(self):
        return "\n".join(self.lines)


def make_project(root):
    www = os.path.join(root, "extracted", "apk", "assets", "www")
    os.makedirs(www)
    for name, text in {"index.html": INDEX, "main.1a2b3c4d.js": MAIN, "content_test.5e6f7a8b.js": CONTENT}.items():
        with open(os.path.join(www, name), "w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
    mods = os.path.join(root, "mods")
    os.makedirs(mods)
    with open(os.path.join(mods, "Smoke.mod"), "w", encoding="utf-8") as handle:
        handle.write(MOD)
    with open(os.path.join(mods, "enabled.txt"), "w", encoding="utf-8") as handle:
        handle.write("Smoke.mod\n")
    return www


def one(pattern):
    hits = sorted(glob.glob(os.path.join(REPO, "patchers", pattern)))
    assert hits, pattern
    return hits[-1]


def main():
    failures = []

    def say(text):
        # The harness swaps sys.stdout while a patcher runs (the GUI keeps running).
        sys.__stdout__.write(text + "\n")
        sys.__stdout__.flush()

    def check(label, ok, sink=None):
        say(("PASS " if ok else "FAIL ") + label)
        if not ok:
            failures.append(label)
            if sink:
                say(sink.text()[-3000:])

    cases = [("auto", one("NestPatcher_TiTS_Android_v*.py")),
             ("auto", one("NestPatcher_TiTS_Linux_v*.py")),
             ("auto", one("NestPatcher_TiTS_Windows_v*.py"))]
    for kind, script in cases:
        root = tempfile.mkdtemp(prefix="nest-android-")
        try:
            www = make_project(root)
            label = os.path.basename(script)
            sink = Sink()
            code = nest_android.run(script, root, kind, "--dry-run", NodeChecker(), sink)
            check(label + " dry run", code == 0 and "DRY RUN: 3 replacements" in sink.text(), sink)
            expected = "android" if "_Android_" in label else "cli"
            check(label + " detected as " + expected, "as " + expected + "]" in sink.text(), sink)
            sink = Sink()
            code = nest_android.run(script, root, kind, "", NodeChecker(), sink)
            with open(os.path.join(www, "main.1a2b3c4d.js"), encoding="utf-8") as handle:
                patched = handle.read()
            check(label + " patch", code == 0 and 'return "nest"' in patched and "VALID " in sink.text(), sink)
            check(label + " fills in @@name@@ wildcards", "function count(){return Xq(3)}" in patched, sink)
            with open(os.path.join(www, "index.html"), encoding="utf-8") as handle:
                check(label + " uses mods/nest", "mods/nest/nest-inline.js" in handle.read(), sink)
            check(label + " leaves no NestPatcher-app folder", not os.path.exists(os.path.join(root, "NestPatcher-app")))
        finally:
            shutil.rmtree(root, ignore_errors=True)

    # Each patcher asks for the folders it needs.
    base = "/storage/emulated/0/TITS-Modding"
    expect = {"NestPatcher_TiTS_Android_v*.py": ("android", ["project"]),
              "NestPatcher_TiTS_Linux_v*.py": ("cli", ["game", "mods"]),
              "NestPatcher_TiTS_Windows_v*.py": ("cli", ["game", "mods"]),
              "NestPatcher_TiTS_GUI_v*.py": ("gui", ["game", "mods"])}
    for pattern, (kind, keys) in expect.items():
        info = json.loads(nest_android.needs_json(one(pattern), base))
        got = (info["kind"], [n["key"] for n in info["needs"]])
        check(pattern + " needs " + str(keys), got == (kind, keys))
    info = json.loads(nest_android.needs_json(one("NestPatcher_TiTS_Linux_v*.py"), base))
    check("cli defaults point into the TITS-Modding folder",
          info["needs"][0]["default"] == base + "/extracted/apk/assets/www"
          and info["needs"][1]["default"] == base + "/mods" and info["needs"][0]["flag"] == "--game")

    # The command-line patcher works with a game and mods folder anywhere (here: a bare www + nestmods).
    root = tempfile.mkdtemp(prefix="nest-android-")
    try:
        make_project(root)
        game = os.path.join(root, "game", "www")
        shutil.move(os.path.join(root, "extracted", "apk", "assets", "www"), game)
        mods = os.path.join(root, "stuff", "nestmods")
        os.makedirs(os.path.dirname(mods))
        shutil.move(os.path.join(root, "mods"), mods)
        script = one("NestPatcher_TiTS_Linux_v*.py")
        missing = nest_android.describe_paths(script, json.dumps({"game": os.path.join(root, "nope"), "mods": mods}))
        check("check folders spots a missing game", "MISSING Game folder" in missing and "OK  enabled.txt" in missing)
        found = nest_android.describe_paths(script, json.dumps({"game": os.path.join(root, "game"), "mods": mods}))
        check("check folders finds a www folder one level down", "OK  Game folder: game files in " + game in found)
        sink = Sink()
        code = nest_android.run(script, json.dumps({"game": game, "mods": mods}), "auto", "", NodeChecker(), sink)
        with open(os.path.join(game, "main.1a2b3c4d.js"), encoding="utf-8") as handle:
            patched = handle.read()
        check("cli patches separate game and nestmods folders",
              code == 0 and 'return "nest"' in patched and os.path.isdir(os.path.join(mods, "backup")), sink)
    finally:
        shutil.rmtree(root, ignore_errors=True)

    # A custom script can list its own needs; they arrive as command-line flags.
    root = tempfile.mkdtemp(prefix="nest-android-")
    try:
        script = os.path.join(root, "my_patcher.py")
        with open(script, "w", encoding="utf-8") as handle:
            handle.write("NEST_NEEDS = [\n"
                         "    {'key': 'saves', 'label': 'Save folder', 'flag': '--saves', 'default': 'saves'},\n"
                         "    {'key': 'list', 'label': 'List file', 'flag': '--list', 'check': 'file'},\n"
                         "]\n"
                         "def main(argv):\n"
                         "    print('ARGS ' + ' '.join(argv))\n"
                         "    return 0\n")
        info = json.loads(nest_android.needs_json(script, root))
        check("custom NEST_NEEDS are read", info["kind"] == "custom"
              and [n["key"] for n in info["needs"]] == ["saves", "list"]
              and info["needs"][0]["default"] == os.path.join(root, "saves"))
        os.makedirs(os.path.join(root, "saves"))
        sink = Sink()
        code = nest_android.run(script, json.dumps({"saves": os.path.join(root, "saves"), "list": "/x/list.txt"}),
                                "auto", "--loud", NodeChecker(), sink)
        check("custom script gets its folders as flags",
              code == 0 and ("ARGS --saves " + os.path.join(root, "saves") + " --list /x/list.txt --loud") in sink.text(), sink)
        plain = os.path.join(root, "plain.py")
        with open(plain, "w", encoding="utf-8") as handle:
            handle.write("print('hello')\n")
        info = json.loads(nest_android.needs_json(plain, root))
        check("a script without NEST_NEEDS gets one working folder",
              info["kind"] == "custom" and [n["key"] for n in info["needs"]] == ["project"])
    finally:
        shutil.rmtree(root, ignore_errors=True)

    # A syntax error in a mod must be caught by the stand-in checker.
    root = tempfile.mkdtemp(prefix="nest-android-")
    try:
        make_project(root)
        with open(os.path.join(root, "mods", "Broken.js"), "w", encoding="utf-8") as handle:
            handle.write("function (\n")
        with open(os.path.join(root, "mods", "enabled.txt"), "a", encoding="utf-8") as handle:
            handle.write("Broken.js\n")
        sink = Sink()
        code = nest_android.run(one("NestPatcher_TiTS_Android_v*.py"), root, "auto", "", NodeChecker(), sink)
        check("broken mod is refused", code != 0 and "INVALID JavaScript in runtime/Broken.js" in sink.text(), sink)
    finally:
        shutil.rmtree(root, ignore_errors=True)

    # Every shipped patcher says what it needs, so the app never has to guess from its name.
    expected = {"Android": ("android", ["project"]), "Mac": ("custom", ["app", "mods"]),
                "Linux": ("cli", ["game", "mods"]), "Windows": ("cli", ["game", "mods"]),
                "GUI": ("gui", ["game", "mods"])}
    scripts = sorted(glob.glob(os.path.join(REPO, "patchers", "*.py")))
    for script in scripts:
        name = os.path.basename(script)
        declared = nest_android._declared_needs(nest_android._read(script))
        check(name + " has NEST_NEEDS", bool(declared))
        for part, (kind, keys) in expected.items():
            if "_" + part + "_" in name:
                info = json.loads(nest_android.needs_json(script, "/x/TITS-Modding"))
                check(name + " is run as " + kind + " and asks for " + "/".join(keys),
                      info["kind"] == kind and [n["key"] for n in info["needs"]] == keys)
    check("every kind of patcher was checked", len(scripts) >= len(expected))

    # The Mac patcher runs from the app with a TiTS.app and a mods folder.
    root = tempfile.mkdtemp(prefix="nest-android-")
    try:
        www = make_project(root)
        bundle = os.path.join(root, "TiTS.app")
        os.makedirs(os.path.join(bundle, "Contents", "Resources"))
        shutil.move(www, os.path.join(bundle, "Contents", "Resources", "app"))
        script = one("NestPatcher_TiTS_Mac_v*.py")
        paths = json.dumps({"app": bundle, "mods": os.path.join(root, "mods")})
        check("Mac folders check out", "MISSING" not in nest_android.describe_paths(script, paths))
        sink = Sink()
        code = nest_android.run(script, paths, "auto", "--dry-run", NodeChecker(), sink)
        check("Mac patcher dry run from the app", code == 0 and "DRY RUN: 3 replacements" in sink.text(), sink)
        check("Mac settings stay out of TiTS.app", not any("settings" in f for _, _, files in os.walk(bundle) for f in files))
    finally:
        shutil.rmtree(root, ignore_errors=True)

    # The GUI starts its server and answers with the right key.
    root = tempfile.mkdtemp(prefix="nest-android-")
    try:
        make_project(root)
        sink = Sink()
        threading.Thread(target=nest_android.run,
                         args=(one("NestPatcher_TiTS_GUI_v*.py"), root, "auto", "", NodeChecker(), sink),
                         daemon=True).start()
        url = ""
        for _ in range(100):
            url = next((l.split("into it:", 1)[1].strip() for l in list(sink.lines) if "#k=" in l), "")
            if url:
                break
            time.sleep(0.1)
        check("GUI prints its address", bool(url), sink)
        if url:
            key = url.split("#k=", 1)[1]
            request = urllib.request.Request("http://127.0.0.1:8765/api/state", headers={"X-Nest-Key": key})
            state = json.load(urllib.request.urlopen(request, timeout=10))
            check("GUI sees the game and mods", state["gameOk"] and state["modsOk"], sink)
            request = urllib.request.Request("http://127.0.0.1:8765/api/quit", data=b"{}", method="POST",
                                             headers={"X-Nest-Key": key, "Content-Type": "application/json"})
            urllib.request.urlopen(request, timeout=10).read()
    finally:
        time.sleep(0.5)
        shutil.rmtree(root, ignore_errors=True)

    say("\n" + ("ALL PASSED" if not failures else str(len(failures)) + " FAILED: " + ", ".join(failures)))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
