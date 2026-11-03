"""Checks the Windows "is TiTS running?" test without Windows, using fake tasklist/PowerShell output.

    python tests/test_windows_running.py patchers/NestPatcher_TiTS_Windows_v1.10.py
"""
import os
import sys
import types
import tempfile
import importlib.util

spec = importlib.util.spec_from_file_location("nest_win", sys.argv[1])
nest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nest)

game = tempfile.mkdtemp(prefix="nest_win_")
os.makedirs(os.path.join(game, "resources"))
for name in ("TiTS.exe", "NestPatcher_GUI_v0.12.exe", "unins000.exe", "KittyPatcher TiTS.exe"):
    open(os.path.join(game, name), "w").close()
nest.GAME, nest.RESOURCES, nest.PLATFORM = game, os.path.join(game, "resources"), "windows"

failed = []


def check(label, ok):
    print(("PASS " if ok else "FAIL ") + label)
    if not ok:
        failed.append(label)


def running(tasklist, powershell):
    def fake(cmd, **kwargs):
        return types.SimpleNamespace(stdout=tasklist if cmd[0] == "tasklist" else powershell, returncode=0)
    nest.subprocess.run = fake
    return nest.game_running()


check("only TiTS.exe counts as the game", sorted(nest.game_executables()) == ["TiTS.exe"])
launcher = '"NestPatcher_GUI_v0.12.exe","%d","Console","1","5,000 K"\n' % os.getppid()
tits = '"TiTS.exe","4321","Console","1","100,000 K"\n'
check("patcher started from inside the game folder is not the game", not running(launcher, ""))
check("a TiTS.exe from another folder is not this game", not running(tits, "4321|C:\\Other\\TiTS.exe\n"))
check("TiTS.exe from the game folder is the game", bool(running(tits, "4321|" + os.path.join(game, "TiTS.exe") + "\n")))
check("hidden path plays safe", bool(running(tits, "")))
check("nothing running", not running('"explorer.exe","1","Console","1","5 K"\n', ""))

print("\nALL PASSED" if not failed else "\nFAILED: " + ", ".join(failed))
sys.exit(1 if failed else 0)
