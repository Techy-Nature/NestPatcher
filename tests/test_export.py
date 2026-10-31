"""Checks --export-mac and --export-appimage on a tiny fake game, with no internet.

    python tests/test_export.py patchers/NestPatcher_TiTS_Linux_v1.6.py

Fake Electron zips are built here with the same layout as the real ones
(Electron.app with framework symlinks and helper apps for macOS; a top-level
"electron" program for Linux). The AppImage part needs mksquashfs and
unsquashfs (squashfs-tools); it is skipped when they are missing, or on Windows.
"""
import argparse
import os
import plistlib
import shutil
import stat
import subprocess
import sys
import tempfile
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import smoke_test  # noqa: E402  (reuses its fake game)

GAME_MAIN = 'require("electron");\n'
HELPERS = ["Electron Helper", "Electron Helper (GPU)", "Electron Helper (Renderer)", "Electron Helper (Plugin)"]
FAKE_LINUX_ELECTRON = """#!/bin/sh
# Stands in for Electron: proves AppRun starts it next to resources/app.
HERE="$(dirname "$(readlink -f "$0")")"
[ -f "$HERE/resources/app/mods/nest/nest-inline.js" ] && echo "FAKE-ELECTRON-OK $*"
"""


def entry(name, mode):
    info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
    info.create_system = 3
    info.external_attr = mode << 16
    return info


def plist(**values):
    return plistlib.dumps(values)


def fake_mac_zip(path):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(entry("LICENSE", 0o100644), "MIT")
        z.writestr(entry("version", 0o100644), "28.3.3")
        z.writestr(entry("Electron.app/", 0o40755), b"")
        z.writestr(entry("Electron.app/Contents/Info.plist", 0o100644), plist(
            CFBundleName="Electron", CFBundleDisplayName="Electron", CFBundleExecutable="Electron",
            CFBundleIdentifier="com.github.Electron", CFBundleIconFile="electron.icns",
            ElectronAsarIntegrity={"Resources/default_app.asar": {"algorithm": "SHA256", "hash": "x"}}))
        z.writestr(entry("Electron.app/Contents/MacOS/Electron", 0o100755), b"\xcf\xfa\xed\xfe fake")
        z.writestr(entry("Electron.app/Contents/Resources/electron.icns", 0o100644), b"icns")
        z.writestr(entry("Electron.app/Contents/Resources/default_app.asar", 0o100644), b"asar")
        fw = "Electron.app/Contents/Frameworks/Electron Framework.framework/"
        z.writestr(entry(fw + "Versions/A/Electron Framework", 0o100755), b"lib")
        z.writestr(entry(fw + "Versions/A/Resources/Info.plist", 0o100644), plist(CFBundleVersion="28.3.3"))
        z.writestr(entry(fw + "Versions/Current", 0o120755), "A")
        z.writestr(entry(fw + "Electron Framework", 0o120755), "Versions/Current/Electron Framework")
        for helper in HELPERS:
            base = "Electron.app/Contents/Frameworks/" + helper + ".app/Contents/"
            z.writestr(entry(base + "Info.plist", 0o100644), plist(
                CFBundleName=helper, CFBundleIdentifier="com.github.Electron.helper"))
            z.writestr(entry(base + "MacOS/" + helper, 0o100755), b"helper")


def fake_linux_zip(path):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(entry("electron", 0o100755), FAKE_LINUX_ELECTRON)
        z.writestr(entry("chrome-sandbox", 0o104755), b"sandbox")
        z.writestr(entry("resources/default_app.asar", 0o100644), b"asar")
        z.writestr(entry("locales/en-US.pak", 0o100644), b"pak")
        z.writestr(entry("version", 0o100644), "28.3.3")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("script")
    parser.add_argument("--python", default=sys.executable)
    args = parser.parse_args()
    script = os.path.abspath(args.script)
    failures = []

    def check(label, ok):
        print(("PASS " if ok else "FAIL ") + label)
        if not ok:
            failures.append(label)

    root = tempfile.mkdtemp(prefix="nest-export-")
    try:
        app = smoke_test.build(root, "nestmods")
        with open(os.path.join(app, "package.json"), "w", encoding="utf-8") as handle:
            handle.write('{"name": "tits", "main": "electron-main.js"}\n')
        with open(os.path.join(app, "electron-main.js"), "w", encoding="utf-8", newline="\n") as handle:
            handle.write(GAME_MAIN)
        game = os.path.join(root, "game")
        # A Windows-style game folder whose .exe names its Electron version.
        with open(os.path.join(game, "TiTS.exe"), "wb") as handle:
            handle.seek(21 * 1024 * 1024)
            handle.write(b"...Chrome/120.0 Electron/27.1.2 Safari...")
        tool = os.path.join(root, "tool")
        shutil.copy2(script, tool)
        local = os.path.join(tool, os.path.basename(script))
        mac_zip = os.path.join(root, "electron-mac.zip")
        linux_zip = os.path.join(root, "electron-linux.zip")
        fake_mac_zip(mac_zip)
        fake_linux_zip(linux_zip)

        def run(*extra, where=game):
            result = subprocess.run([args.python, local, "--game", where] + list(extra), cwd=tool,
                                    capture_output=True, text=True, encoding="utf-8", errors="replace")
            print(result.stdout[-2500:] + result.stderr[-1500:])
            return result

        check("patch before export", run().returncode == 0)

        # --- which Electron the game uses (read from TiTS.exe) ---
        probe = subprocess.run([args.python, "-c",
                                "import runpy,sys;g=runpy.run_path(sys.argv[1],run_name='probe');"
                                "g['configure'](sys.argv[2],None,remember=False,interactive=False);"
                                "print('VER',g['electron_version']())", local, game],
                               cwd=tool, capture_output=True, text=True)
        check("Electron version read from TiTS.exe", "VER ('27.1.2', 'TiTS.exe')" in probe.stdout)

        # --- macOS ---
        result = run("--export-mac", "--electron-zip", mac_zip, "--arch", "arm64")
        out = os.path.join(tool, "NestExports", "TiTS_v0.9.999_NestPatched_macOS-arm64.zip")
        check("mac export exits 0", result.returncode == 0 and os.path.isfile(out))
        if os.path.isfile(out):
            with zipfile.ZipFile(out) as z:
                names = set(z.namelist())
                top = "TiTS_v0.9.999_NestPatched_macOS-arm64/TiTS.app/Contents/"
                check("app executable renamed", top + "MacOS/TiTS" in names)
                check("helpers renamed", all(top + "Frameworks/" + h.replace("Electron", "TiTS") + ".app/Contents/MacOS/"
                                             + h.replace("Electron", "TiTS") in names for h in HELPERS))
                check("default_app.asar left out", top + "Resources/default_app.asar" not in names)
                check("patched game inside", 'return "nest"' in z.read(top + "Resources/app/main.1a2b3c4d.js").decode())
                check("mod runtime inside", top + "Resources/app/mods/nest/nest-inline.js" in names)
                check("game's own start script kept", z.read(top + "Resources/app/electron-main.js").decode() == GAME_MAIN)
                check("Windows TiTS.exe not copied", not any(n.endswith("TiTS.exe") for n in names))
                info = plistlib.loads(z.read(top + "Info.plist"))
                check("Info.plist renamed", info["CFBundleName"] == "TiTS" and info["CFBundleExecutable"] == "TiTS"
                      and info["CFBundleVersion"] == "0.9.999" and "ElectronAsarIntegrity" not in info)
                helper = plistlib.loads(z.read(top + "Frameworks/TiTS Helper (GPU).app/Contents/Info.plist"))
                check("helper Info.plist renamed", helper["CFBundleName"] == "TiTS Helper (GPU)")
                link = z.getinfo(top + "Frameworks/Electron Framework.framework/Versions/Current")
                check("framework symlinks kept", stat.S_ISLNK(link.external_attr >> 16) and z.read(link) == b"A")
                exe = z.getinfo(top + "MacOS/TiTS")
                check("app executable stays executable", (exe.external_attr >> 16) & 0o111)
                check("how-to-open note included", "TiTS_v0.9.999_NestPatched_macOS-arm64/HOW-TO-OPEN.txt" in names)

        # A Mac game exported to a zip keeps its own Electron.
        mac_game = os.path.join(root, "mac", "TiTS.app")
        res = os.path.join(mac_game, "Contents", "Resources")
        shutil.copytree(app, os.path.join(res, "app"))
        os.makedirs(os.path.join(mac_game, "Contents", "MacOS"))
        with open(os.path.join(mac_game, "Contents", "MacOS", "TiTS"), "wb") as handle:
            handle.write(b"bin")
        if hasattr(os, "symlink") and os.name != "nt":
            os.symlink("A", os.path.join(mac_game, "Contents", "Current"))
        result = run("--export-mac", where=mac_game)
        out = os.path.join(tool, "NestExports", "TiTS_v0.9.999_NestPatched_macOS.zip")
        check("Mac game exports with its own Electron", result.returncode == 0 and os.path.isfile(out)
              and "already a Mac game" in result.stdout)
        if os.path.isfile(out) and os.name != "nt":
            with zipfile.ZipFile(out) as z:
                link = z.getinfo("TiTS_v0.9.999_NestPatched_macOS/TiTS.app/Contents/Current")
                check("own-app symlink kept", stat.S_ISLNK(link.external_attr >> 16))

        # A bare www folder (from the APK) gets NestPatcher's small start script.
        www = os.path.join(root, "www")
        shutil.copytree(app, www, ignore=shutil.ignore_patterns("package.json", "electron-main.js"))
        result = run("--export-mac", "--electron-zip", mac_zip, "--arch", "x64", "--out", os.path.join(root, "webout"),
                     where=www)
        out = os.path.join(root, "webout", "TiTS_v0.9.999_NestPatched_macOS-x64.zip")
        check("www folder exports", result.returncode == 0 and os.path.isfile(out))
        if os.path.isfile(out):
            with zipfile.ZipFile(out) as z:
                base = "TiTS_v0.9.999_NestPatched_macOS-x64/TiTS.app/Contents/Resources/app/"
                check("start script added for www", base + "nest-electron-main.js" in z.namelist()
                      and '"main": "nest-electron-main.js"' in z.read(base + "package.json").decode())

        # --- Linux AppImage ---
        tools = shutil.which("mksquashfs") and shutil.which("unsquashfs")
        if os.name == "nt" or not tools:
            print("SKIP AppImage checks (needs Linux with squashfs-tools)")
        else:
            runtime = os.path.join(root, "runtime")
            with open(runtime, "wb") as handle:
                handle.write(b"\x7fELF" + b"\0" * 8188)
            result = run("--export-appimage", "--electron-zip", linux_zip, "--appimage-runtime", runtime, "--arch", "x64")
            out = os.path.join(tool, "NestExports", "TiTS_v0.9.999_NestPatched-x86_64.AppImage")
            check("AppImage export exits 0", result.returncode == 0 and os.path.isfile(out))
            if os.path.isfile(out):
                check("AppImage is executable", os.access(out, os.X_OK))
                with open(out, "rb") as handle:
                    data = handle.read(8192 + 4)
                check("runtime then squashfs", data[:8192] == b"\x7fELF" + b"\0" * 8188 and data[8192:] == b"hsqs")
                unpacked = os.path.join(root, "unpacked")
                subprocess.run(["unsquashfs", "-q", "-n", "-o", "8192", "-d", unpacked, out], capture_output=True)
                check("AppRun, .desktop and icon at the top", all(os.path.exists(os.path.join(unpacked, n))
                                                                 for n in ("AppRun", "tits.desktop", ".DirIcon")))
                check("default_app.asar left out", not os.path.exists(os.path.join(unpacked, "resources", "default_app.asar")))
                main_js = os.path.join(unpacked, "resources", "app", "main.1a2b3c4d.js")
                check("patched game inside", os.path.isfile(main_js) and 'return "nest"' in open(main_js).read())
                started = subprocess.run([os.path.join(unpacked, "AppRun"), "--hello"], capture_output=True, text=True,
                                         env=dict(os.environ, NEST_NO_SANDBOX="1"))
                check("AppRun starts Electron with the game", "FAKE-ELECTRON-OK --no-sandbox --hello" in started.stdout)
                modes = [os.stat(os.path.join(d, n)).st_mode for d, _, fs in os.walk(unpacked) for n in fs
                         if not os.path.islink(os.path.join(d, n))]
                check("every file readable by everyone", all(m & 0o004 for m in modes))

            # A Linux game folder keeps its own Electron.
            linux_game = os.path.join(root, "linuxgame")
            os.makedirs(os.path.join(linux_game, "resources"))
            shutil.copytree(app, os.path.join(linux_game, "resources", "app"))
            # A fake ELF program (x86-64) stands in for the game's own Electron.
            with open(os.path.join(linux_game, "TiTS-bin"), "wb") as handle:
                handle.write(b"\x7fELF\x02\x01" + b"\0" * 12 + b"\x3e\x00" + b"\0" * 100)
            with open(os.path.join(linux_game, "libffmpeg.so"), "wb") as handle:
                handle.write(b"\x7fELF")
            result = run("--export-appimage", "--appimage-runtime", runtime, "--out", os.path.join(root, "linout"),
                         where=linux_game)
            check("Linux game exports with its own Electron", result.returncode == 0
                  and "already a Linux game" in result.stdout and "(TiTS-bin)" in result.stdout)

            result = run("--export-appimage", "--appimage-runtime", runtime, "--out", os.path.join(root, "x"),
                         where=os.path.join(root, "nowhere"))
            check("export without a game stops", result.returncode != 0)
    finally:
        shutil.rmtree(root, ignore_errors=True)
    print("\n" + ("ALL PASSED" if not failures else str(len(failures)) + " FAILED: " + ", ".join(failures)))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
