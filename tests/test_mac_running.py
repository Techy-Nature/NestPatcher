"""Checks the Mac "is TiTS running?" test with fake `ps` output.

    python tests/test_mac_running.py patchers/NestPatcher_TiTS_Mac_v1.9.py
    python tests/test_mac_running.py patchers/NestPatcher_TiTS_Linux_v1.12.py
"""
import sys
import importlib.util

spec = importlib.util.spec_from_file_location("nest_mac", sys.argv[1])
nest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nest)

failed = []


def check(label, ok):
    print(("PASS " if ok else "FAIL ") + label)
    if not ok:
        failed.append(label)


app = "/Users/me/Games/TiTS.app"
win = "/Users/me/Games/TiTS-backer-0.9.168-win"
me = 300


def ps(*rows):
    return "\n".join("%d %d %s" % row for row in rows) + "\n"


base = [(1, 0, "/sbin/launchd"), (200, 1, "/bin/zsh -l"), (me, 200, "/usr/bin/python3 NestPatcher_TiTS_Mac_v1.9.py")]
check("nothing running", not nest.mac_running_from_game(ps(*base), app, me))
found = nest.mac_running_from_game(ps(*base, (400, 1, app + "/Contents/MacOS/TiTS")), app, me)
check("TiTS.app from this folder is the game", bool(found) and "400" in found)
check("a TiTS.app from another folder is not this game",
      not nest.mac_running_from_game(ps(*base, (400, 1, "/Applications/TiTS.app/Contents/MacOS/TiTS")), app, me))
check("an exported TiTS.app in NestExports is not this game",
      not nest.mac_running_from_game(ps(*base, (400, 1, "/Users/me/nestmods/NestExports/TiTS.app/Contents/MacOS/TiTS")), app, me))
check("the patcher inside the game folder is not the game",
      not nest.mac_running_from_game(ps(*base[:2], (me, 200, "/usr/bin/python3 " + win + "/NestPatcher_TiTS_Mac_v1.9.py")), win, me))
check("the patcher's parent (a launcher in the game folder) is not the game",
      not nest.mac_running_from_game(ps(base[0], (200, 1, win + "/NestPatcher_GUI_v0.14"), (me, 200, "python3 x.py")), win, me))
found = nest.mac_running_from_game(ps(*base, (500, 1, "wine64-preloader Z:" + win.replace("/", "\\") + "\\TiTS.exe")), win, me)
check("TiTS.exe through Wine/CrossOver is the game", bool(found) and "500" in found)

print("\nALL PASSED" if not failed else "\nFAILED: " + ", ".join(failed))
sys.exit(1 if failed else 0)
