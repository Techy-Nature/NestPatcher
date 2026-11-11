"""Checks the GUI's web server on a tiny fake game (no browser needed).

    python tests/test_gui.py patchers/NestPatcher_TiTS_GUI_v0.14.py
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import smoke_test  # noqa: E402

script = os.path.abspath(sys.argv[1])
failed = []


def check(label, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + label)
    if not ok:
        failed.append(label)
        if detail:
            print(str(detail)[-3000:])


root = tempfile.mkdtemp(prefix="nest-gui-")
proc = None
try:
    smoke_test.build(root, "nestmods")
    os.rename(os.path.join(root, "game"), os.path.join(root, "TiTS-test"))
    tool = os.path.join(root, "tool")
    shutil.copy2(script, tool)
    # No -u and no PYTHONUNBUFFERED: the GUI itself must print its address straight
    # away even when its output goes to a pipe (it hung CI when it didn't).
    env = dict(os.environ)
    env.pop("PYTHONUNBUFFERED", None)
    proc = subprocess.Popen([sys.executable, os.path.basename(script), "--no-browser"], cwd=tool, env=env,
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    seen = []
    threading.Thread(target=lambda: [seen.append(line) for line in proc.stdout], daemon=True).start()
    url = ""
    started = time.time()
    while time.time() - started < 30 and not url:
        url = next((line.split("into it:", 1)[1].strip() for line in list(seen) if "#k=" in line), "")
        time.sleep(0.1)
    check("GUI prints its address", bool(url), "".join(seen))
    if not url:
        raise SystemExit(1)
    base, key = url.split("/#k=")

    def call(path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        request = urllib.request.Request(base + path, data=data, method="POST" if body is not None else "GET",
                                         headers={"X-Nest-Key": key, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as err:
            return err.code, json.loads(err.read() or b"{}")

    def wait_job():
        for _ in range(600):
            code, log = call("/api/log?since=0")
            if not log["running"]:
                return log
            time.sleep(0.1)
        return log

    code, st = call("/api/state")
    check("state finds the game", code == 200 and st["gameOk"] and st["modsOk"], st)
    good_game = st["game"]

    code, st = call("/api/configure", {"game": os.path.join(root, "no such folder"), "mods": st["mods"]})
    check("a game folder that doesn't exist is refused", code == 200 and st.get("error") and not st.get("ok"), st)
    code, st = call("/api/state")
    check("  ... and the saved folder is kept", st["game"] == good_game, st)

    results = []
    threads = [threading.Thread(target=lambda: results.append(call("/api/run", {"action": "dry"})[0])) for _ in range(4)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    check("four quick clicks start one job", sorted(results) == [200, 409, 409, 409], results)
    log = wait_job()
    check("dry run finishes OK", log["result"] == 0, log["lines"][-10:])

    call("/api/clear", {})
    call("/api/run", {"action": "find", "terms": 5})
    log = wait_job()
    lines = "\n".join(log["lines"])
    check("a crash is reported, not hung", log["result"] == 1 and "CRASH:" in lines, lines)
    check("  ... with where it happened", "  at " in lines, lines)
    with open(os.path.join(st["mods"], "logs", "ModPatchLog.txt"), encoding="utf-8") as handle:
        check("  ... and goes into the patch log for bug reports", "CRASH:" in handle.read())

    code, mods = call("/api/mods")
    check("mods list", code == 200 and [m["name"] for m in mods["mods"]][:2] == ["Smoke.mod", "Extra.js"], mods)
    code, mods = call("/api/mods", {"on": ["Smoke.mod"]})
    with open(os.path.join(st["mods"], "enabled.txt"), encoding="utf-8") as handle:
        check("turning a mod off comments it out", "# Extra.js" in handle.read())

    call("/api/run", {"action": "patch"})
    log = wait_job()
    check("patch OK", log["result"] == 0, log["lines"][-10:])
    call("/api/run", {"action": "restore"})
    log = wait_job()
    check("restore OK", log["result"] == 0, log["lines"][-10:])

    code, bug = call("/api/bug", {"description": "test", "steps": "", "contact": ""})
    check("bug report zip", code == 200 and os.path.isfile(bug.get("zip", "")), bug)

    request = urllib.request.Request(base + "/api/state")
    try:
        urllib.request.urlopen(request, timeout=10)
        check("no key, no answer", False)
    except urllib.error.HTTPError as err:
        check("no key, no answer", err.code == 403)

    call("/api/quit", {})
    proc.wait(timeout=20)
    check("quit stops the server", proc.returncode is not None)
finally:
    if proc and proc.poll() is None:
        proc.kill()
    shutil.rmtree(root, ignore_errors=True)

print("\nALL PASSED" if not failed else "\nFAILED: " + ", ".join(failed))
sys.exit(1 if failed else 0)
