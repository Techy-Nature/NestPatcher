"""Checks the Linux "is TiTS running?" test with a fake /proc folder.

    python tests/test_linux_running.py patchers/NestPatcher_TiTS_Linux_v1.12.py
"""
import os
import sys
import tempfile
import importlib.util

spec = importlib.util.spec_from_file_location("nest_linux", sys.argv[1])
nest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nest)

failed = []


def check(label, ok):
    print(("PASS " if ok else "FAIL ") + label)
    if not ok:
        failed.append(label)


base = tempfile.mkdtemp(prefix="nest_linux_")
game = os.path.join(base, "TiTS-backer-0.9.168-win")
os.makedirs(os.path.join(game, "resources"))
appimage = os.path.join(game, "NestPatcher_GUI_v0.14-x86_64.AppImage")
tits_exe = os.path.join(game, "TiTS.exe")
tits_bin = os.path.join(game, "TiTS")
for path in (appimage, tits_exe, tits_bin):
    open(path, "w").close()
nest.GAME, nest.RESOURCES = game, os.path.join(game, "resources")


def fake_proc(processes):
    """processes: {pid: (exe, argv0, parent_pid)}"""
    root = tempfile.mkdtemp(prefix="proc_", dir=base)
    for pid, (exe, argv0, parent) in processes.items():
        folder = os.path.join(root, str(pid))
        os.makedirs(folder)
        os.symlink(exe, os.path.join(folder, "exe"))
        with open(os.path.join(folder, "cmdline"), "wb") as handle:
            handle.write(argv0.encode() + b"\0--flag\0")
        with open(os.path.join(folder, "stat"), "w") as handle:
            handle.write("%d (x y) S %d 0 0\n" % (pid, parent))
    return root


me = os.getpid()
runtime = 5000   # the AppImage runtime, which stays as the patcher's parent
python = "/tmp/.mount_Nest/usr/python/bin/python3"

# Our own process isn't in a fake /proc, so put the real one in by its real id.
root = fake_proc({me: (python, python, runtime), runtime: (appimage, appimage, 1)})
check("AppImage inside the game folder is not the game", not nest.linux_running_from_game(root))

root = fake_proc({me: (python, python, 1), 6000: (appimage, appimage, 1)})
check("another NestPatcher copy is not the game", not nest.linux_running_from_game(root))

root = fake_proc({me: (python, python, 1), 7000: (tits_bin, tits_bin, 1)})
found = nest.linux_running_from_game(root)
check("native TiTS from the game folder is the game", bool(found) and "7000" in found)

wine_path = "Z:" + tits_exe.replace("/", "\\")
root = fake_proc({me: (python, python, 1), 8000: ("/usr/bin/wine64-preloader", wine_path, 1)})
found = nest.linux_running_from_game(root)
check("TiTS.exe under Wine is the game", bool(found) and "8000" in found)

root = fake_proc({me: (python, python, 1), 9000: ("/usr/bin/wine64-preloader", "Z:\\other\\TiTS.exe", 1),
                  9001: ("/usr/bin/bash", "bash", 1)})
check("nothing from this game running", not nest.linux_running_from_game(root))

print("\nALL PASSED" if not failed else "\nFAILED: " + ", ".join(failed))
sys.exit(1 if failed else 0)
