"""Glue engine.py + a front end into the single-file patchers users download."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(HERE), "patchers")
CLI_VERSION = "1.3"
GUI_VERSION = "0.4"

HEADERS = {
    "linux": """#!/usr/bin/env python3
# NestPatcher for Trials in Tainted Space, Linux edition (Debian, Ubuntu, Mint,
# Fedora, Nobara and friends).
# Based on KittyPatcher by LibraKitty (the original Windows patcher).
# Same .mod format, flags and safety rules as the Desktop, Android and Mac patchers:
# Replace / With still swaps exact text. Hashed bundles such as
# content_first14.<hash>.js are found from the plain name content_first14.js.
# Add Javascript blocks load from mods/nest/nest-inline.js.
#
# Linux differences:
#   * The game folder can live anywhere (~/Games/TiTS is a good spot). The patcher
#     looks next to itself, in ~/Games, ~/Downloads, ~/Desktop and /opt, or you
#     point at it once with --game and it is remembered.
#   * A TiTS .AppImage is unpacked once with --extract-appimage into a normal
#     folder; you then start the game from that folder's AppRun.
#   * If the game ships packed as resources/app.asar, --unpack-asar extracts it
#     (pure Python, no npm needed) and keeps the original as app.asar.nest-original.
#   * Node.js install hints match your distro (apt on Debian/Ubuntu, dnf on
#     Fedora/Nobara).
#   * Mods live in nestmods/ next to this script, outside the game, so a game
#     update cannot wipe them.
""",
    "windows": """# NestPatcher for Trials in Tainted Space, Windows 10/11 edition.
# Based on KittyPatcher by LibraKitty (the original Windows patcher).
# Same .mod format, flags and safety rules as the Desktop, Android and Mac patchers:
# Replace / With still swaps exact text. Hashed bundles such as
# content_first14.<hash>.js are found from the plain name content_first14.js.
# Add Javascript blocks load from mods/nest/nest-inline.js.
#
# Windows differences:
#   * The game folder (the one with TiTS.exe and resources\\) can live anywhere.
#     The patcher looks next to itself, on the Desktop, in Downloads, Documents,
#     C:\\Games and Program Files, or you point at it once with --game.
#   * Program Files is write-protected, so the patcher explains how to move the
#     game to C:\\Games if Windows blocks it.
#   * Double-click NestPatcher_Windows_v1.3.bat for a numbered menu.
#   * Mods live in nestmods\\ next to this script, outside the game, so a game
#     update cannot wipe them.
""",
    "gui": """#!/usr/bin/env python3
# NestPatcher GUI for Trials in Tainted Space (Windows, Linux, macOS, Android/Termux).
# Based on KittyPatcher by LibraKitty (the original Windows patcher).
# DRAFT. Runs the same patch engine as the command-line NestPatcher, but shows a
# dark control panel in your web browser instead of asking you to type flags.
#
#   * Nothing leaves your computer: the panel is served only to this machine
#     (127.0.0.1) and every request needs a secret key made fresh each run.
#   * Tabs: Patch (test / patch / restore), Mods (tick mods on or off; this
#     rewrites enabled.txt and keeps a .bak), Search, and Report a bug (writes a
#     zip with your log and system info, user name blanked out).
#   * Only Python's standard library is used, so it packs cleanly into a
#     Windows .exe or a Linux AppImage with PyInstaller (see the build scripts).
""",
}

LABELS = {"linux": "Linux", "windows": "Windows 10/11", "gui": "GUI"}
NAMES = {"linux": "NestPatcher_TiTS_Linux_v" + CLI_VERSION + ".py",
         "windows": "NestPatcher_TiTS_Windows_v" + CLI_VERSION + ".py",
         "gui": "NestPatcher_TiTS_GUI_v" + GUI_VERSION + ".py"}


def build(kind):
    engine = open(os.path.join(HERE, "engine.py"), encoding="utf-8").read()
    front = open(os.path.join(HERE, "gui.py" if kind == "gui" else "cli.py"), encoding="utf-8").read()
    version = GUI_VERSION if kind == "gui" else CLI_VERSION
    settings = {"linux": "NestPatcher_TiTS_Linux.settings.json",
                "windows": "NestPatcher_TiTS_Windows.settings.json",
                "gui": "NestPatcher_TiTS_GUI.settings.json"}[kind]
    constants = "\n".join([
        "",
        "TOOL_NAME = " + repr(NAMES[kind]),
        "TOOL_VERSION = " + repr(version),
        "PLATFORM_DEFAULT = " + (repr(kind) if kind != "gui" else "None"),
        "PLATFORM_LABEL = " + repr(LABELS[kind]),
        "CREDIT = " + repr("Based on KittyPatcher by LibraKitty (the original Windows patcher)."),
        "# No version in the settings name, so a newer patcher keeps your saved folders.",
        "SETTINGS_NAME = " + repr(settings),
        "",
    ])
    imports_end = engine.index("\n# ----")
    text = HEADERS[kind] + "\n" + engine[:imports_end] + "\n" + constants + engine[imports_end:] + front
    path = os.path.join(OUT, NAMES[kind])
    with open(path, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(text)
    if kind != "windows":
        os.chmod(path, 0o755)
    print("built " + path)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for kind in sys.argv[2:] or ("linux", "windows", "gui"):
        build(kind)
