#!/usr/bin/env python3
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

import os
import re
import sys
import json
import time
import shutil
import struct
import hashlib
import zipfile
import platform
import tempfile
import subprocess


TOOL_NAME = 'NestPatcher_TiTS_GUI_v0.4.py'
TOOL_VERSION = '0.4'
PLATFORM_DEFAULT = None
PLATFORM_LABEL = 'GUI'
CREDIT = 'Based on KittyPatcher by LibraKitty (the original Windows patcher).'
# No version in the settings name, so a newer patcher keeps your saved folders.
SETTINGS_NAME = 'NestPatcher_TiTS_GUI.settings.json'

# --------------------------------------------------------------------------
# Where things live
# --------------------------------------------------------------------------

def tool_root():
    """Folder that holds this tool. For a packed .exe or AppImage, the folder
    the user actually sees, not the temporary unpack folder."""
    if os.environ.get("NESTPATCHER_HOME"):
        # Set by the Windows .exe launcher: the folder the .exe sits in.
        return os.path.abspath(os.environ["NESTPATCHER_HOME"])
    if os.environ.get("APPIMAGE"):
        return os.path.dirname(os.path.abspath(os.environ["APPIMAGE"]))
    if getattr(sys, "frozen", False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


def detect_platform():
    if os.environ.get("TERMUX_VERSION") or os.path.isdir("/data/data/com.termux"):
        return "android"
    if sys.platform.startswith("win"):
        return "windows"
    if sys.platform == "darwin":
        return "mac"
    return "linux"


ROOT = tool_root()
PLATFORM = detect_platform()
SETTINGS = os.path.join(ROOT, SETTINGS_NAME)
# NestPatcher keeps its own names everywhere so it can never be mixed up with
# LibraKitty's KittyPatcher: nestmods/ for mods, mods/nest/ inside the game.
MODS_DIR_NAME = "nestmods"
OLD_MODS_DIR_NAME = "kitty-mods"
RUNTIME_NAME = "nest-inline.js"
MODS = os.path.join(ROOT, MODS_DIR_NAME)
GAME = ""              # folder the player opens (has TiTS.exe / the Linux binary)
RESOURCES = ""         # GAME/resources (Electron), or "" for a bare www folder
APP = ""               # folder with index.html and main.<hash>.js
BACKUP = LOGS = RUNTIME_DIR = ENABLED = LOG_PATH = ""

# The GUI adds a function here to see every log line as it happens.
LOG_HOOKS = []

HEADER = re.compile(
    r"^(?P<kind>Add Javascript|Add Content|Add Boot|Add Item|Item JS|Replace|Add JS|Rep|Add C|Add B)"
    r"(?:\s+\[(?P<target>[^\]]*)\])?\s*:?\s*(?:#.*)?$"
)
WITH_LINE = re.compile(r"^\s*(?:With:|W:)\s*$")

HASHED = re.compile(r"^(?P<base>.+)\.[a-fA-F0-9]{8,}\.(?P<ext>js|css)$")

# Places Node.js often lives that are not always on PATH.
if PLATFORM == "windows":
    EXTRA_BIN = [os.path.join(os.environ.get("ProgramFiles", r"C:\Program Files"), "nodejs"),
                 os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "nodejs"),
                 os.path.join(os.environ.get("APPDATA", ""), "nvm", "current")]
else:
    EXTRA_BIN = ["/usr/local/bin", "/usr/bin", "/opt/homebrew/bin",
                 os.path.expanduser("~/.volta/bin"), os.path.expanduser("~/.local/bin"),
                 "/data/data/com.termux/files/usr/bin"]


def set_mods(path):
    global MODS, BACKUP, LOGS, ENABLED, LOG_PATH
    MODS = os.path.abspath(os.path.expanduser(path))
    BACKUP = os.path.join(MODS, "backup")
    LOGS = os.path.join(MODS, "logs")
    ENABLED = os.path.join(MODS, "enabled.txt")
    LOG_PATH = os.path.join(LOGS, "ModPatchLog.txt")


def is_www(folder):
    """A folder that holds the game's web files directly."""
    if not os.path.isfile(os.path.join(folder, "index.html")):
        return False
    try:
        return any(name.startswith("main.") and name.endswith(".js") for name in os.listdir(folder))
    except OSError:
        return False


def resolve_game(path):
    """Turn whatever the user pointed at into (game, resources, app).

    Accepts the game folder, its resources folder, resources/app, the .exe or
    Linux binary inside the game folder, a TiTS.app bundle, or a bare www
    folder (an extracted APK's assets/www or the browser build)."""
    path = os.path.abspath(os.path.expanduser(path.strip().strip('"').strip("'")))
    path = path.rstrip("/\\") or path
    if os.path.isfile(path):
        path = os.path.dirname(path)
    if path.endswith(".app") and os.path.isdir(os.path.join(path, "Contents", "Resources")):
        resources = os.path.join(path, "Contents", "Resources")
        return path, resources, os.path.join(resources, "app")
    base = os.path.basename(path).lower()
    if base == "app" and os.path.basename(os.path.dirname(path)).lower() == "resources":
        resources = os.path.dirname(path)
        return os.path.dirname(resources), resources, path
    if base == "resources" and (os.path.isdir(os.path.join(path, "app"))
                                or os.path.isfile(os.path.join(path, "app.asar"))):
        return os.path.dirname(path), path, os.path.join(path, "app")
    resources = os.path.join(path, "resources")
    if os.path.isdir(os.path.join(resources, "app")) or os.path.isfile(os.path.join(resources, "app.asar")):
        return path, resources, os.path.join(resources, "app")
    for inner in (os.path.join(path, "assets", "www"), os.path.join(path, "www"), path):
        if is_www(inner):
            return path, "", inner
    # Unknown layout: assume an Electron folder so error messages name resources/app.
    return path, resources, os.path.join(resources, "app")


def set_game(path):
    global GAME, RESOURCES, APP, RUNTIME_DIR
    GAME, RESOURCES, APP = resolve_game(path)
    RUNTIME_DIR = os.path.join(APP, "mods", "nest")


def load_settings():
    # Fall back to the file saved under the old KittyPatcher name, so nobody
    # has to pick their folders again after the rename.
    old = os.path.join(ROOT, SETTINGS_NAME.replace("NestPatcher", "KittyPatcher"))
    for path in (SETTINGS, old):
        try:
            with open(path, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except (OSError, ValueError):
            continue
    return {}


def save_settings(data):
    with open(SETTINGS, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)
    say("Saved settings to " + SETTINGS)


def looks_like_game(folder):
    _, resources, app = resolve_game(folder)
    return (os.path.isfile(os.path.join(app, "index.html"))
            or (resources and os.path.isfile(os.path.join(resources, "app.asar"))))


def search_places():
    home = os.path.expanduser("~")
    places = [ROOT, os.path.dirname(ROOT)]
    if PLATFORM == "windows":
        for env in ("USERPROFILE",):
            base = os.environ.get(env, home)
            places += [os.path.join(base, sub) for sub in ("Desktop", "Downloads", "Documents", "Games")]
            places.append(os.path.join(base, "OneDrive", "Desktop"))
        places += [os.environ.get("ProgramFiles", r"C:\Program Files"),
                   os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
                   os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs"),
                   r"C:\Games"]
    elif PLATFORM == "mac":
        places += ["/Applications", os.path.join(home, "Applications"),
                   os.path.join(home, "Downloads"), os.path.join(home, "Desktop")]
    elif PLATFORM == "android":
        shared = os.path.join(home, "storage", "shared")
        places += [os.path.join(shared, "git.gay-repos", "TITS-Modding", "extracted", "apk"),
                   os.path.join(shared, "Download")]
    else:
        places += [os.path.join(home, sub) for sub in ("Games", "games", "Downloads", "Desktop",
                                                        "Applications", "Documents")]
        places += [os.path.join(home, ".local", "share"), "/opt"]
    return [place for place in places if place and os.path.isdir(place)]


def find_games():
    """Look two folders deep for TiTS-looking game folders."""
    found = []
    for place in search_places():
        if looks_like_game(place) and place not in found and place not in (ROOT,):
            found.append(place)
        try:
            names = sorted(os.listdir(place))
        except OSError:
            continue
        for name in names:
            low = name.lower()
            if "tits" not in low and "tainted" not in low and "trials" not in low:
                continue
            first = os.path.join(place, name)
            candidates = [first]
            if os.path.isdir(first):
                try:
                    candidates += [os.path.join(first, sub) for sub in sorted(os.listdir(first))]
                except OSError:
                    pass
            for candidate in candidates:
                if os.path.isdir(candidate) and looks_like_game(candidate):
                    game = resolve_game(candidate)[0]
                    if game not in found:
                        found.append(game)
    if looks_like_game(ROOT) and ROOT not in found:
        found.insert(0, ROOT)
    return found


def which_tool(*names):
    # The .exe and AppImage bundles carry their own Node.js and point to it here.
    bundled = os.environ.get("NESTPATCHER_NODE", "")
    if bundled and any(name in ("node", "nodejs") for name in names) and os.path.isfile(bundled):
        return bundled
    for name in names:
        hit = shutil.which(name)
        if hit:
            return hit
        for folder in EXTRA_BIN:
            for suffix in ("", ".exe", ".cmd"):
                candidate = os.path.join(folder, name + suffix)
                if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
                    return candidate
    return None


OS_RELEASE = "/etc/os-release"


def os_release():
    info = {}
    try:
        with open(OS_RELEASE, encoding="utf-8") as handle:
            for line in handle:
                if "=" in line:
                    key, value = line.rstrip("\n").split("=", 1)
                    info[key] = value.strip().strip('"')
    except OSError:
        pass
    return info


def distro_family():
    """debian, fedora, arch, suse or '' from /etc/os-release. Nobara counts as fedora."""
    info = os_release()
    ids = (info.get("ID", "") + " " + info.get("ID_LIKE", "")).lower().split()
    for family, names in (("fedora", ("fedora", "nobara", "rhel", "centos", "ultramarine", "bazzite")),
                          ("debian", ("debian", "ubuntu", "linuxmint", "pop", "elementary", "zorin", "raspbian")),
                          ("arch", ("arch", "manjaro", "endeavouros", "cachyos", "steamos")),
                          ("suse", ("suse", "opensuse", "opensuse-tumbleweed", "opensuse-leap"))):
        if any(item in names for item in ids):
            return family
    return ""


def node_install_hint():
    if PLATFORM == "windows":
        return ("Install Node.js LTS: open PowerShell and run  winget install OpenJS.NodeJS.LTS\n"
                "(or download the Windows installer from https://nodejs.org). Then close and reopen this window.")
    if PLATFORM == "mac":
        return "Install Node.js with: brew install node   (or the macOS installer from nodejs.org)"
    if PLATFORM == "android":
        return "Install Node.js in Termux with: pkg install nodejs"
    family = distro_family()
    if family == "fedora":
        return "Install Node.js with: sudo dnf install nodejs"
    if family == "debian":
        return "Install Node.js with: sudo apt update && sudo apt install nodejs"
    if family == "arch":
        return "Install Node.js with: sudo pacman -S nodejs"
    if family == "suse":
        return "Install Node.js with: sudo zypper install nodejs"
    return "Install Node.js from your package manager (the package is usually called nodejs)."


# --------------------------------------------------------------------------
# Core patcher (same behaviour as the Desktop / Android / Mac patchers;
# based on KittyPatcher by LibraKitty)
# --------------------------------------------------------------------------

def say(message):
    try:
        print(message)
    except UnicodeEncodeError:
        print(message.encode("ascii", "replace").decode("ascii"))
    for hook in LOG_HOOKS:
        hook(message)


def log(message):
    say(message)
    os.makedirs(LOGS, exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as handle:
        handle.write(message + "\n")


def basename_key(path):
    name = os.path.basename(path.replace("\\", "/").strip())
    match = HASHED.match(name)
    if match:
        return match.group("base") + "." + match.group("ext")
    return name


def load_game_files():
    found = {}
    for name in os.listdir(APP):
        if not name.endswith(".js") or name.startswith("._"):
            continue
        backup = os.path.join(BACKUP, name)
        path = backup if os.path.isfile(backup) else os.path.join(APP, name)
        with open(path, "r", encoding="utf-8", errors="replace") as handle:
            found[name] = handle.read()
    return found


def parse_mod(path):
    text = open(path, "r", encoding="utf-8", errors="replace").read().replace("\r\n", "\n").replace("\r", "\n")
    # Standalone # lines are .mod annotations, not replacement JavaScript.
    # Remove them before parsing to prevent accidentally splicing metadata into
    # minified webpack bundles when adjacent Replace blocks are separated by notes.
    lines = [line for line in text.split("\n") if not line.lstrip().startswith("#")]
    blocks = []
    index = 0
    while index < len(lines):
        match = HEADER.match(lines[index])
        if not match:
            index += 1
            continue
        kind = match.group("kind")
        target = (match.group("target") or "").strip()
        index += 1
        if kind in ("Replace", "Rep"):
            old_lines = []
            while index < len(lines) and not WITH_LINE.match(lines[index]):
                old_lines.append(lines[index])
                index += 1
            if index >= len(lines):
                break
            index += 1
            new_lines = []
            while index < len(lines) and not HEADER.match(lines[index]):
                new_lines.append(lines[index])
                index += 1
            blocks.append({
                "kind": "Replace",
                "target": target,
                "old": "\n".join(old_lines).strip(),
                "new": "\n".join(new_lines).strip(),
                "mod": os.path.basename(path),
            })
        else:
            body = []
            while index < len(lines) and not HEADER.match(lines[index]):
                body.append(lines[index])
                index += 1
            blocks.append({
                "kind": "Add Javascript",
                "target": target,
                "old": "",
                "new": "\n".join(body).strip(),
                "mod": os.path.basename(path),
            })
    return blocks


def enabled_names():
    names = []
    if os.path.isfile(ENABLED):
        for line in open(ENABLED, "r", encoding="utf-8", errors="replace"):
            line = line.split("#", 1)[0].strip()
            if line:
                names.append(line)
    else:
        names = sorted(
            name for name in os.listdir(MODS)
            if (name.lower().endswith(".mod") or name.lower().endswith(".js"))
            and not name.startswith("._")
        )
    return names


def enabled_mods():
    resolved = []
    for name in enabled_names():
        path = os.path.join(MODS, name)
        if os.path.isfile(path):
            resolved.append(path)
        else:
            log("Missing mod listed in enabled.txt: " + name)
    return resolved


def locate(files, target, needle):
    key = basename_key(target) if target else ""
    by_key = {}
    for name in files:
        by_key.setdefault(basename_key(name), name)
    if key and key in by_key and needle in files[by_key[key]]:
        return by_key[key], "named"
    hits = [name for name, text in files.items() if needle and needle in text]
    if len(hits) == 1:
        return hits[0], "searched"
    if key:
        hashed = [name for name in hits if basename_key(name) == key]
        if len(hashed) == 1:
            return hashed[0], "searched"
    return None, hits


def check_js(label, source, node):
    """Validate actual JavaScript using Node's parser, not a text heuristic."""
    fd, path = tempfile.mkstemp(prefix="nest-check-", suffix=".js")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            stream.write(source)
        try:
            result = subprocess.run([node, "--check", path], text=True, capture_output=True,
                                    timeout=90, **hidden_window())
        except (OSError, subprocess.TimeoutExpired) as exc:
            log("VALIDATION ERROR " + label + ": " + str(exc))
            return False
        if result.returncode:
            log("INVALID JavaScript in " + label + ":\n" + (result.stderr or result.stdout).strip())
            return False
        log("VALID " + label)
        return True
    finally:
        if os.path.exists(path):
            os.unlink(path)


def hidden_window():
    """Stop a black console window flashing up for each node check on Windows."""
    if PLATFORM == "windows" and hasattr(subprocess, "CREATE_NO_WINDOW"):
        return {"creationflags": subprocess.CREATE_NO_WINDOW}
    return {}


def clean_index(source):
    """Remove NestPatcher (mods/nest) and KittyPatcher (mods/kitty) script tags, even when inline."""
    return re.sub(
        r'<script\b(?=[^>]*\bsrc="mods/(?:kitty|nest)/[^"<>]+\.js")[^>]*></script>\s*',
        '', source,
        flags=re.IGNORECASE,
    )


def make_runtime(blocks):
    parts = ["/* NestPatcher runtime: generated; do not edit. */"]
    for block in blocks:
        # Preserve isolation between independent mods.
        parts.extend(["try {", "/* " + block["mod"].replace("*/", "* /") + " */",
                      block["new"], "} catch (err) { console.error('[NestPatcher runtime]', err); }"])
    return "\n".join(parts) + "\n"


def game_executables():
    """Executables in the game folder, used to tell whether the game is open."""
    names = []
    try:
        for name in os.listdir(GAME):
            path = os.path.join(GAME, name)
            if not os.path.isfile(path):
                continue
            low = name.lower()
            if PLATFORM == "windows":
                if low.endswith(".exe") and not low.startswith(("unins", "notification_helper", "crashpad")):
                    names.append(name)
            elif os.access(path, os.X_OK) and "." not in name and not low.startswith("chrome"):
                names.append(name)
    except OSError:
        pass
    return names


def game_running():
    if not GAME or not RESOURCES:
        return False
    if PLATFORM == "windows":
        exes = {name.lower() for name in game_executables()}
        if not exes:
            return False
        try:
            result = subprocess.run(["tasklist", "/FO", "CSV", "/NH"], capture_output=True, text=True,
                                    errors="replace", **hidden_window())
        except OSError:
            return False
        for line in result.stdout.splitlines():
            first = line.split(",", 1)[0].strip('"').lower()
            if first in exes:
                return True
        return False
    if PLATFORM == "mac":
        try:
            result = subprocess.run(["pgrep", "-f", os.path.basename(GAME) + "/Contents/MacOS/"],
                                    capture_output=True, text=True)
            return result.returncode == 0
        except OSError:
            return False
    # Linux: any process whose program file sits inside the game folder.
    game_real = os.path.realpath(GAME) + os.sep
    try:
        pids = [pid for pid in os.listdir("/proc") if pid.isdigit()]
    except OSError:
        return False
    for pid in pids:
        try:
            exe = os.path.realpath(os.readlink("/proc/" + pid + "/exe"))
        except OSError:
            continue
        if exe.startswith(game_real):
            return True
    return False


def quit_hint():
    if PLATFORM == "windows":
        return "Close the game window (or end it in Task Manager)."
    if PLATFORM == "mac":
        return "Quit it (Cmd+Q)."
    return "Close the game window."


def permission_hint(exc):
    log("PERMISSION DENIED: " + str(exc))
    if PLATFORM == "windows":
        log("Windows blocked writing inside " + GAME + ". Fix one of these, then run again:")
        log("  1. Best: copy the whole game folder out of Program Files, e.g. to C:\\Games\\TiTS,")
        log("     and point the patcher at the copy (--game \"C:\\Games\\TiTS\").")
        log("  2. Or right-click the launcher and choose Run as administrator.")
        log("  3. If Windows Security says Controlled folder access blocked it, allow Python in")
        log("     Windows Security > Virus & threat protection > Ransomware protection.")
    elif PLATFORM == "mac":
        log("macOS blocked writing inside " + GAME + ". Fix one of these, then run again:")
        log("  1. System Settings > Privacy & Security > App Management: turn on Terminal.")
        log("  2. Or copy TiTS.app out of /Applications (e.g. to ~/Games) and use --game on the copy.")
    else:
        log("Linux blocked writing inside " + GAME + ". Fix one of these, then run again:")
        log("  1. Best: copy the game folder somewhere you own, e.g. ~/Games/TiTS, and use --game on it.")
        log("  2. Or take ownership: sudo chown -R \"$USER\" \"" + GAME + "\"")
        log("  (A game from a Flatpak or a read-only AppImage cannot be patched in place; see the guide.)")


def preflight():
    """Return a problem description, or '' when the game and mods folders look usable."""
    if not os.path.isdir(MODS):
        return ("Mods folder not found: " + MODS +
                "\nCreate it and put enabled.txt plus your .mod/.js files inside.")
    if not os.path.isdir(APP):
        if RESOURCES and os.path.isfile(os.path.join(RESOURCES, "app.asar")):
            return "This game is packed as app.asar. Run once with --unpack-asar (GUI: Unpack app.asar), then patch."
        return "Game folder not found: " + APP
    if RESOURCES and os.path.isfile(os.path.join(RESOURCES, "app.asar")):
        return ("STOP: both app/ and app.asar exist. Electron loads app.asar first, so patches would be ignored.\n"
                "Run --unpack-asar again (it moves app.asar aside) or rename app.asar yourself.")
    return ""


def apply(dry_run=False, fresh=False, validate=True, after_build=None):
    if os.path.isfile(LOG_PATH) and not dry_run:
        os.remove(LOG_PATH)
    problem = preflight()
    if problem:
        if os.path.isdir(MODS):
            log(problem)
        else:
            say(problem)
        return 1
    if not dry_run and game_running():
        log("STOP: TiTS is running. " + quit_hint() + " Then run the patcher again.")
        return 1
    node = which_tool("node", "nodejs")
    if validate and not node:
        log("STOP: Node.js is required for JavaScript syntax checking. Nothing was changed.")
        log(node_install_hint())
        log("You may explicitly opt out using --skip-validation (not recommended).")
        return 1
    log("NestPatcher " + TOOL_VERSION + " (" + PLATFORM + ")")
    log("Game: " + APP)
    log("Mods: " + MODS)
    files = load_game_files()  # Backups, if present, are the clean baseline.
    log("Loaded " + str(len(files)) + " game scripts (using available backups)")
    replacements, scripts, copy_js = [], [], []
    missing = []
    for path in enabled_mods():
        if path.lower().endswith(".js"):
            copy_js.append(path)
            log("Runtime script " + os.path.basename(path))
            continue
        for block in parse_mod(path):
            if block["kind"] == "Add Javascript":
                if block["new"]:
                    scripts.append(block)
                    log("Add Javascript from " + block["mod"])
            elif block["old"] and block["new"]:
                replacements.append(block)
            else:
                log("Skip empty Replace in " + block["mod"])
    # enabled_mods logs missing names; stop on any missing dependency to avoid half-working builds.
    if os.path.isfile(ENABLED):
        for name in enabled_names():
            if not os.path.isfile(os.path.join(MODS, name)):
                missing.append(name)
    if missing:
        log("STOP: Missing enabled files: " + ", ".join(missing))
        log("Remove missing entries from enabled.txt or restore the missing files. No changes made.")
        return 1

    pending = list(replacements)
    applied = 0
    for wave in range(4):
        if not pending:
            break
        next_pending = []
        for block in pending:
            real, how = locate(files, block["target"], block["old"])
            label = block["mod"] + " -> " + (block["target"] or "(any)")
            if not real:
                next_pending.append(block)
                continue
            occurrences = files[real].count(block["old"])
            if occurrences > 8:
                log("STOP: unsafe needle (" + str(occurrences) + ") " + label)
                return 1
            files[real] = files[real].replace(block["old"], block["new"], 1)
            block["real"] = real
            applied += 1
            log("OK " + block["mod"] + " in " + real)
        pending = next_pending
        if pending and wave == 0:
            log("Retrying " + str(len(pending)) + " dependent replacements")
    if pending:
        for block in pending:
            log("MISS " + block["mod"] + " -> " + (block["target"] or "(any)"))
        log("STOP: Some replacements were not found. No game files modified.")
        return 1

    touched = sorted({block["real"] for block in replacements if "real" in block})
    # A disabled mod's former edits must disappear, too. Restore every backed-up
    # top-level JS bundle, even when this run has no replacement targeting it.
    restore_only = []
    if os.path.isdir(BACKUP):
        for name in os.listdir(BACKUP):
            if name.endswith(".js") and name in files and name not in touched:
                restore_only.append(name)
    write_bundles = sorted(set(touched) | set(restore_only))
    runtime = make_runtime(scripts)
    runtime_js = {}
    for path in copy_js:
        with open(path, encoding="utf-8", errors="replace") as handle:
            runtime_js[os.path.basename(path)] = handle.read()
    if RUNTIME_NAME in runtime_js:
        log("STOP: " + RUNTIME_NAME + " is reserved for generated content")
        return 1
    runtime_js[RUNTIME_NAME] = runtime
    index_path = os.path.join(APP, "index.html")
    index_backup_path = os.path.join(BACKUP, "index.html")
    if not os.path.isfile(index_path):
        log("STOP: index.html was not found")
        return 1
    # Prefer pre-patcher snapshot; when absent, remove only known NestPatcher tags.
    index_base_path = index_backup_path if os.path.isfile(index_backup_path) else index_path
    with open(index_base_path, encoding="utf-8", errors="replace") as handle:
        index_base = handle.read()
    index_clean = clean_index(index_base)
    if "</head>" not in index_clean:
        log("STOP: index.html lacks </head>. No changes made.")
        return 1
    # Defer NestPatcher runtime scripts so the game's deferred Webpack bundles run first.
    script_tags = "\n".join('<script defer src="mods/nest/' + name + '"></script>'
                            for name in sorted(runtime_js))
    new_index = index_clean.replace("</head>", script_tags + "\n</head>", 1)

    if validate:
        for name in touched:
            if not check_js(name, files[name], node):
                log("STOP: patched game bundle failed syntax checking. No changes made.")
                return 1
        for name, source in runtime_js.items():
            if not check_js("runtime/" + name, source, node):
                log("STOP: invalid runtime script. No changes made.")
                return 1

    previous_runtime_names = set()
    if os.path.isdir(RUNTIME_DIR):
        previous_runtime_names = {name for name in os.listdir(RUNTIME_DIR) if name.endswith(".js")}
    stale = previous_runtime_names - set(runtime_js)
    log("Fresh rebuild baseline: " + ("explicit --fresh" if fresh else "automatic backup-based regeneration"))
    log("Old runtime scripts to remove: " + (", ".join(sorted(stale)) or "none"))
    log("Previously patched bundles to restore: " + (", ".join(sorted(restore_only)) or "none"))
    if dry_run:
        log("DRY RUN: " + str(applied) + " replacements, " + str(len(runtime_js)) + " runtime files; no changes made.")
        return 0

    # Capture original bytes so even an I/O exception can roll the installation back.
    targets = [os.path.join(APP, name) for name in write_bundles] + [index_path]
    targets += [os.path.join(RUNTIME_DIR, name) for name in (set(runtime_js) | stale)]
    original = {}
    for path in targets:
        if os.path.isfile(path):
            with open(path, "rb") as handle:
                original[path] = handle.read()
        else:
            original[path] = None
    try:
        os.makedirs(BACKUP, exist_ok=True)
        # Snapshot source files only the first time. NEVER overwrite existing baselines.
        for name in touched:
            path = os.path.join(BACKUP, name)
            if not os.path.exists(path):
                shutil.copy2(os.path.join(APP, name), path)
                log("Captured original bundle backup " + name)
        if not os.path.isfile(index_backup_path):
            shutil.copy2(index_path, index_backup_path)
            log("Captured original index.html backup")
        os.makedirs(RUNTIME_DIR, exist_ok=True)
        for name in write_bundles:
            with open(os.path.join(APP, name), "w", encoding="utf-8", newline="\n") as h:
                h.write(files[name])
        for name in stale:
            os.remove(os.path.join(RUNTIME_DIR, name))
        for name, source in runtime_js.items():
            with open(os.path.join(RUNTIME_DIR, name), "w", encoding="utf-8", newline="\n") as h:
                h.write(source)
        with open(index_path, "w", encoding="utf-8", newline="\n") as h:
            h.write(new_index)
    except Exception as exc:
        if isinstance(exc, PermissionError):
            permission_hint(exc)
        log("WRITE FAILURE: " + str(exc) + "; rolling back game files")
        for path, data in original.items():
            try:
                if data is None:
                    if os.path.exists(path):
                        os.remove(path)
                else:
                    os.makedirs(os.path.dirname(path), exist_ok=True)
                    with open(path, "wb") as h:
                        h.write(data)
            except OSError as recovery_error:
                log("ROLLBACK FAILED for " + path + ": " + str(recovery_error))
        return 1
    remove_kitty_runtime()
    if after_build:
        after_build()
    log("DONE: " + str(applied) + " replacements; " + str(len(runtime_js)) + " runtime scripts; validation " + ("passed" if validate else "skipped"))
    return 0


# --------------------------------------------------------------------------
# Restore: put the clean backups back (turns every mod off)
# --------------------------------------------------------------------------

def restore_originals():
    problem = preflight()
    if problem:
        say(problem)
        return 1
    if not os.path.isdir(BACKUP):
        say("No backups yet, so the game has never been patched by NestPatcher. Nothing to restore.")
        return 0
    if game_running():
        log("STOP: TiTS is running. " + quit_hint() + " Then try again.")
        return 1
    count = 0
    for name in sorted(os.listdir(BACKUP)):
        source = os.path.join(BACKUP, name)
        if os.path.isfile(source) and (name.endswith(".js") or name == "index.html"):
            shutil.copy2(source, os.path.join(APP, name))
            count += 1
    if os.path.isdir(RUNTIME_DIR):
        shutil.rmtree(RUNTIME_DIR)
    remove_kitty_runtime()
    log("RESTORED " + str(count) + " original files and removed mods/nest. Backups were kept.")
    return 0


# --------------------------------------------------------------------------
# app.asar support (pure Python, no npm needed)
# --------------------------------------------------------------------------

def read_asar_header(path):
    with open(path, "rb") as handle:
        head = handle.read(16)
        if len(head) < 16:
            raise ValueError("app.asar is too small")
        # Chromium pickle: [4][header pickle size][payload size][json length][json]
        header_size = struct.unpack("<I", head[4:8])[0]
        json_len = struct.unpack("<I", head[12:16])[0]
        header = json.loads(handle.read(json_len).decode("utf-8"))
    return header, 8 + header_size


def extract_asar(asar_path, dest):
    header, base = read_asar_header(asar_path)
    unpacked_root = asar_path + ".unpacked"
    count = 0
    with open(asar_path, "rb") as handle:
        stack = [(header, dest, unpacked_root)]
        while stack:
            node, out_dir, unpacked_dir = stack.pop()
            os.makedirs(out_dir, exist_ok=True)
            for name, entry in node.get("files", {}).items():
                if "/" in name or "\\" in name or name in ("..", ".") or ":" in name:
                    raise ValueError("unsafe path in app.asar: " + name)
                out = os.path.join(out_dir, name)
                if "files" in entry:
                    stack.append((entry, out, os.path.join(unpacked_dir, name)))
                elif "link" in entry:
                    continue
                elif entry.get("unpacked"):
                    shutil.copy2(os.path.join(unpacked_dir, name), out)
                    count += 1
                else:
                    handle.seek(base + int(entry["offset"]))
                    remaining = int(entry["size"])
                    with open(out, "wb") as target:
                        while remaining:
                            chunk = handle.read(min(remaining, 1 << 20))
                            if not chunk:
                                raise ValueError("app.asar ended early at " + name)
                            target.write(chunk)
                            remaining -= len(chunk)
                    if entry.get("executable") and PLATFORM != "windows":
                        os.chmod(out, 0o755)
                    count += 1
    return count


def unpack_asar():
    if not RESOURCES:
        say("This game folder is a plain web folder, so there is no app.asar to unpack.")
        return 0
    asar_path = os.path.join(RESOURCES, "app.asar")
    if not os.path.isfile(asar_path):
        say("No app.asar in " + RESOURCES + ". Nothing to unpack (the game is already a plain folder).")
        return 0
    if os.path.isdir(APP):
        say("STOP: " + APP + " already exists. Move it aside before unpacking again.")
        return 1
    staging = APP + ".nest-unpacking"
    if os.path.isdir(staging):
        shutil.rmtree(staging)
    try:
        count = extract_asar(asar_path, staging)
        if not os.path.isfile(os.path.join(staging, "index.html")):
            shutil.rmtree(staging)
            say("STOP: app.asar has no index.html at its top level, so this is not the expected TiTS layout.")
            return 1
        os.rename(staging, APP)
        os.rename(asar_path, asar_path + ".nest-original")
        if os.path.isdir(asar_path + ".unpacked"):
            os.rename(asar_path + ".unpacked", asar_path + ".unpacked.nest-original")
    except PermissionError as exc:
        if os.path.isdir(staging):
            shutil.rmtree(staging, ignore_errors=True)
        os.makedirs(LOGS, exist_ok=True)
        permission_hint(exc)
        return 1
    except (OSError, ValueError, KeyError) as exc:
        if os.path.isdir(staging):
            shutil.rmtree(staging, ignore_errors=True)
        say("STOP: could not unpack app.asar: " + str(exc))
        return 1
    say("Unpacked " + str(count) + " files to " + APP)
    say("Original kept as app.asar.nest-original. Electron now loads the app/ folder.")
    return 0


# --------------------------------------------------------------------------
# Linux: AppImage games
# --------------------------------------------------------------------------

def extract_appimage(path):
    """Unpack a TiTS AppImage into a normal folder next to it, which can be patched."""
    path = os.path.abspath(os.path.expanduser(path))
    if not os.path.isfile(path):
        say("AppImage not found: " + path)
        return None
    target = os.path.splitext(path)[0] + "-nest"
    if os.path.isdir(target):
        say("Already unpacked: " + target)
        return target
    work = tempfile.mkdtemp(prefix="nest-appimage-", dir=os.path.dirname(path))
    try:
        os.chmod(path, os.stat(path).st_mode | 0o111)
        result = subprocess.run([path, "--appimage-extract"], cwd=work, capture_output=True, text=True)
        extracted = os.path.join(work, "squashfs-root")
        if result.returncode or not os.path.isdir(extracted):
            say("STOP: could not unpack the AppImage:\n" + (result.stderr or result.stdout).strip())
            return None
        os.rename(extracted, target)
    except OSError as exc:
        say("STOP: could not unpack the AppImage: " + str(exc))
        return None
    finally:
        shutil.rmtree(work, ignore_errors=True)
    say("Unpacked to " + target)
    say("From now on start the game with: \"" + os.path.join(target, "AppRun") + "\"")
    return target


# --------------------------------------------------------------------------
# Read-only source search (same as Android --find)
# --------------------------------------------------------------------------

def find_sources(terms, context=150, max_hits=30):
    """Search game JavaScript without modifying game files.

    Hashed/minified bundles are reported as short surrounding excerpts rather
    than entire multi-megabyte lines. Prefer untouched backup copies when present.
    """
    if not os.path.isdir(APP):
        say("Game folder not found: " + APP)
        return 1
    os.makedirs(LOGS, exist_ok=True)
    report_path = os.path.join(LOGS, "SourceSearch.txt")
    terms = [term for term in terms if term]
    results = ["NestPatcher source search (read-only)", "Game directory: " + APP,
               "Terms: " + ", ".join(repr(t) for t in terms), ""]
    file_count = 0
    total_matches = 0
    for directory, folders, filenames in os.walk(APP):
        folders.sort()
        for filename in sorted(filenames):
            if not filename.lower().endswith(".js") or filename.startswith("._"):
                continue
            live_path = os.path.join(directory, filename)
            rel = os.path.relpath(live_path, APP)
            # Use original backup for top-level game bundles, not a patched copy.
            backup_path = os.path.join(BACKUP, filename) if directory == APP else None
            path = backup_path if backup_path and os.path.isfile(backup_path) else live_path
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as handle:
                    source = handle.read()
            except OSError as exc:
                results.append("READ ERROR " + rel + ": " + str(exc))
                continue
            file_hits = []
            for term in terms:
                count = source.count(term)
                if not count:
                    continue
                total_matches += count
                excerpts = []
                start = 0
                for _ in range(min(count, max_hits)):
                    at = source.find(term, start)
                    if at < 0:
                        break
                    lo, hi = max(0, at - context), min(len(source), at + len(term) + context)
                    snippet = source[lo:hi].replace("\r", " ").replace("\n", "\n    ")
                    excerpts.append("  offset " + str(at) + ": ..." + snippet + "...")
                    start = at + len(term)
                file_hits.append("  " + repr(term) + ": " + str(count) + " match(es)" +
                                 ("; first " + str(max_hits) + " shown" if count > max_hits else ""))
                file_hits.extend(excerpts)
            if file_hits:
                file_count += 1
                results.append("FILE: " + rel + (" [clean backup]" if path != live_path else ""))
                results.extend(file_hits)
                results.append("")
    results.append("SUMMARY: " + str(total_matches) + " match(es) across " + str(file_count) + " JavaScript file(s).")
    with open(report_path, "w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(results) + "\n")
    say(results[-1])
    say("Report saved to: " + report_path)
    return 0


# --------------------------------------------------------------------------
# Info, bug reports
# --------------------------------------------------------------------------

def game_version():
    """TiTS keeps its version in main.<hash>.js as e.exports={i8:"x.y.z"}."""
    try:
        for name in os.listdir(APP):
            if name.startswith("main.") and name.endswith(".js"):
                path = os.path.join(BACKUP, name)
                if not os.path.isfile(path):
                    path = os.path.join(APP, name)
                with open(path, "r", encoding="utf-8", errors="replace") as handle:
                    match = re.search(r'\{i8:"(\d+\.\d+\.\d+)"\}', handle.read())
                if match:
                    return match.group(1)
    except OSError:
        pass
    return "unknown"


def system_summary():
    lines = ["NestPatcher: " + TOOL_VERSION + " (" + TOOL_NAME + "), " + CREDIT,
             "Platform: " + PLATFORM + " / " + platform.platform(),
             "Python: " + sys.version.split()[0] + (" (packed)" if getattr(sys, "frozen", False) else "")]
    if PLATFORM in ("linux", "android"):
        info = os_release()
        if info:
            lines.append("Distro: " + info.get("PRETTY_NAME", info.get("ID", "?")) +
                         (" [" + distro_family() + " family]" if distro_family() else ""))
    node = which_tool("node", "nodejs")
    node_version = ""
    if node:
        try:
            node_version = subprocess.run([node, "--version"], capture_output=True, text=True,
                                          timeout=20, **hidden_window()).stdout.strip()
        except (OSError, subprocess.TimeoutExpired):
            node_version = "(did not answer)"
    lines.append("Node.js: " + (node_version or "NOT FOUND"))
    lines.append("TiTS version: " + game_version())
    return lines


def show_paths():
    say("Settings file: " + SETTINGS)
    say("Game folder:   " + GAME)
    say("Game files:    " + APP + ("" if os.path.isdir(APP) else "  (missing)"))
    say("Mods folder:   " + MODS + ("" if os.path.isdir(MODS) else "  (missing)"))
    say("Backups:       " + BACKUP)
    say("Log:           " + LOG_PATH)
    for line in system_summary():
        say(line)
    if not which_tool("node", "nodejs"):
        say(node_install_hint())
    return 0


def private(text):
    """Swap the home folder and user name out of a report before it is shared."""
    home = os.path.expanduser("~")
    if home and len(home) > 3:
        text = text.replace(home, "~")
    user = os.environ.get("USERNAME") or os.environ.get("USER") or ""
    if len(user) > 2:
        text = re.sub(r"(?i)([\\/])" + re.escape(user) + r"(?=[\\/])", r"\1<user>", text)
    return text


def mod_listing():
    rows = []
    enabled = set(enabled_names()) if os.path.isdir(MODS) else set()
    try:
        names = sorted(os.listdir(MODS))
    except OSError:
        return ["(mods folder missing)"]
    for name in names:
        path = os.path.join(MODS, name)
        if not os.path.isfile(path) or not name.lower().endswith((".mod", ".js")):
            continue
        with open(path, "rb") as handle:
            digest = hashlib.sha1(handle.read()).hexdigest()[:10]
        rows.append(("ON  " if name in enabled else "off ") + name + "  " +
                    str(os.path.getsize(path)) + " bytes  sha1 " + digest)
    for name in sorted(enabled):
        if not os.path.isfile(os.path.join(MODS, name)):
            rows.append("MISSING " + name)
    return rows


def bug_report(description="", steps="", contact=""):
    """Write a zip a player can send to the mod author. Returns its path."""
    os.makedirs(LOGS, exist_ok=True)
    stamp = time.strftime("%Y-%m-%d_%H-%M-%S")
    zip_path = os.path.join(LOGS, "NestBugReport_" + stamp + ".zip")
    summary = ["NestPatcher bug report  " + stamp, ""]
    summary += ["What went wrong:", description.strip() or "(not filled in)", ""]
    summary += ["What I was doing:", steps.strip() or "(not filled in)", ""]
    if contact.strip():
        summary += ["Contact: " + contact.strip(), ""]
    summary += ["--- System ---"] + system_summary()
    summary += ["", "--- Paths ---", "Game files: " + APP, "Mods: " + MODS, "",
                "--- Mods (ON = in enabled.txt) ---"] + mod_listing()
    report = private("\n".join(summary) + "\n")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("REPORT.txt", report)
        for path, name in ((LOG_PATH, "ModPatchLog.txt"), (ENABLED, "enabled.txt"),
                           (os.path.join(LOGS, "SourceSearch.txt"), "SourceSearch.txt")):
            if os.path.isfile(path):
                with open(path, "r", encoding="utf-8", errors="replace") as handle:
                    archive.writestr(name, private(handle.read()))
        index_path = os.path.join(APP, "index.html")
        if os.path.isfile(index_path):
            with open(index_path, "r", encoding="utf-8", errors="replace") as handle:
                archive.writestr("index.html", handle.read())
    say("Bug report saved: " + zip_path)
    say("Send this zip to the mod author. It has your patch log, enabled.txt and system info,")
    say("with your user name and home folder blanked out. It has no save files.")
    return zip_path



def migrate_mods_folder(path):
    """NestPatcher reads nestmods/, never kitty-mods/. If only a kitty-mods folder
    exists, rename it once (backups and logs move with it) and say so."""
    path = os.path.abspath(os.path.expanduser(path))
    parent, name = os.path.split(path.rstrip("/\\"))
    if name.lower() == OLD_MODS_DIR_NAME:
        path, name = os.path.join(parent, MODS_DIR_NAME), MODS_DIR_NAME
    if name != MODS_DIR_NAME:
        return path
    old = os.path.join(parent, OLD_MODS_DIR_NAME)
    if os.path.isdir(old) and not os.path.exists(path):
        try:
            os.rename(old, path)
            say("Renamed " + old + " to " + path)
            say("NestPatcher uses its own nestmods folder, so it can't be mixed up with KittyPatcher.")
        except OSError as exc:
            say("Could not rename " + old + " to " + MODS_DIR_NAME + ": " + str(exc))
            say("Rename that folder to " + MODS_DIR_NAME + " yourself, then run NestPatcher again.")
    elif os.path.isdir(old) and os.path.isdir(path):
        say("Note: both " + MODS_DIR_NAME + " and " + OLD_MODS_DIR_NAME + " exist in " + parent + ".")
        say("NestPatcher only reads " + MODS_DIR_NAME + ". " + OLD_MODS_DIR_NAME + " belongs to KittyPatcher.")
    return path


KITTY_FOUND = [""]


def warn_kittypatcher_nearby():
    """KittyPatcher and NestPatcher must not both patch one game: say so if KittyPatcher is beside us."""
    KITTY_FOUND[0] = ""
    places = {ROOT, os.path.dirname(MODS)}
    if GAME:
        places.add(GAME)
    for place in sorted(places):
        try:
            names = os.listdir(place)
        except OSError:
            continue
        for name in names:
            if re.match(r"(?i)^kittypatcher.*\.(exe|py)$", name):
                KITTY_FOUND[0] = os.path.join(place, name)
                say("WARNING: KittyPatcher (LibraKitty's patcher) is here: " + os.path.join(place, name))
                say("  NestPatcher is a different program. Use only one of them on a game,")
                say("  or each will undo the other's changes. Move KittyPatcher somewhere else.")
                return


def remove_kitty_runtime():
    """Drop a mods/kitty folder left by KittyPatcher; its script tags were already removed from index.html."""
    old = os.path.join(APP, "mods", "kitty")
    if os.path.isdir(old):
        try:
            shutil.rmtree(old)
            log("Removed leftover KittyPatcher files (mods/kitty). NestPatcher uses mods/nest.")
        except OSError as exc:
            log("WARNING: could not remove old mods/kitty: " + str(exc))


def configure(game=None, mods=None, remember=True, interactive=True):
    """Pick the game and mods folders from arguments, saved settings, or a search."""
    settings = load_settings()
    set_mods(migrate_mods_folder(mods or settings.get("mods") or os.path.join(ROOT, MODS_DIR_NAME)))
    if settings.get("mods") and settings["mods"] != MODS:
        settings["mods"] = MODS
        if settings.get("game"):
            save_settings(settings)
    chosen = game or settings.get("game")
    if chosen and not game and not looks_like_game(chosen):
        say("The saved game folder is gone: " + chosen + "  (searching again)")
        chosen = None
    if not chosen:
        games = find_games()
        if len(games) == 1:
            chosen = games[0]
            game = chosen
            say("Found game: " + chosen)
        elif len(games) > 1:
            say("Several TiTS folders were found:")
            for number, folder in enumerate(games, 1):
                say("  " + str(number) + ") " + folder)
            if interactive and sys.stdin and sys.stdin.isatty():
                answer = input("Type the number to use: ").strip()
                if answer.isdigit() and 1 <= int(answer) <= len(games):
                    chosen = games[int(answer) - 1]
                    game = chosen
            if not chosen:
                say("Run again with --game \"PATH TO THE GAME FOLDER\"." if interactive
                    else "Pick one of them on the Setup tab.")
                return False
        else:
            if interactive:
                say("Could not find the game. Run again with --game \"PATH TO THE GAME FOLDER\"")
                say("(tip: type --game then drag the game folder into this window).")
            else:
                say("Could not find the game by itself. Pick the game folder on the Setup tab.")
            return False
    set_game(chosen)
    warn_kittypatcher_nearby()
    if remember and (game or mods):
        settings["game"] = GAME
        settings["mods"] = MODS
        save_settings(settings)
    return True


def resign_bundle():
    """macOS only: editing files inside TiTS.app breaks its signature seal, so
    clear quarantine and apply a local ad-hoc signature."""
    if PLATFORM != "mac" or not GAME.endswith(".app"):
        return
    xattr = which_tool("xattr")
    if xattr:
        subprocess.run([xattr, "-dr", "com.apple.quarantine", GAME], capture_output=True)
        log("Cleared quarantine flag on " + os.path.basename(GAME))
    codesign = which_tool("codesign")
    if not codesign:
        log("WARNING: codesign not found. If macOS says the app is damaged, run: xcode-select --install")
        return
    result = subprocess.run([codesign, "--force", "--deep", "--sign", "-", GAME],
                            capture_output=True, text=True)
    if result.returncode:
        log("WARNING: ad-hoc re-sign failed:\n" + (result.stderr or result.stdout).strip())
    else:
        log("Ad-hoc re-signed " + os.path.basename(GAME))


# --------------------------------------------------------------------------
# GUI: a small local web server and a dark control panel
# --------------------------------------------------------------------------

import secrets
import threading
import webbrowser
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Where bug reports go. Fill these in before you share a build, or leave them
# empty and players are told to send the zip to whoever gave them the mods.
#   REPORT_URL: a page that takes reports, e.g. a GitHub "new issue" link such as
#     https://github.com/OWNER/REPO/issues/new  (title and text are filled in).
#   REPORT_EMAIL: an address; the player's mail app opens with the text filled in
#     and they attach the zip themselves.
REPORT_URL = ""
REPORT_EMAIL = ""

KEY = secrets.token_urlsafe(18)
JOB = {"running": False, "action": "", "result": None}
LINES = []
LINES_LOCK = threading.Lock()
LAST_PING = [None]   # set when the browser first opens the panel
SERVER = [None]
CONFIG_LOCK = threading.Lock()


def remember_line(message):
    with LINES_LOCK:
        LINES.extend(str(message).split("\n"))
        if len(LINES) > 20000:
            del LINES[:5000]


LOG_HOOKS.append(remember_line)


COMMENTED = re.compile(r"^#\s*([^\s#]+\.(?:mod|js))\s*$", re.IGNORECASE)


def mod_rows():
    """Every mod file in the mods folder plus every name enabled.txt asks for."""
    if not os.path.isdir(MODS):
        return []
    on = enabled_names() if os.path.isfile(ENABLED) else []
    files = sorted(name for name in os.listdir(MODS)
                   if name.lower().endswith((".mod", ".js")) and not name.startswith("._")
                   and os.path.isfile(os.path.join(MODS, name)))
    # Keep enabled.txt's order, including mods that are switched off with #.
    listed = []
    if os.path.isfile(ENABLED):
        with open(ENABLED, encoding="utf-8", errors="replace") as handle:
            for raw in handle:
                stripped = raw.strip()
                active = stripped.split("#", 1)[0].strip()
                commented = COMMENTED.match(stripped)
                name = active or (commented.group(1) if commented else "")
                if name and name not in listed and (active or name in files):
                    listed.append(name)
    order = listed + [name for name in files if name not in listed]
    rows = []
    for name in order:
        path = os.path.join(MODS, name)
        rows.append({"name": name, "on": name in on, "missing": not os.path.isfile(path),
                     "kind": "script" if name.lower().endswith(".js") else "patch",
                     "size": os.path.getsize(path) if os.path.isfile(path) else 0})
    return rows



def write_enabled(turn_on):
    """Rewrite enabled.txt: keep its order and notes, comment out mods turned off,
    add newly ticked mods at the end. The old file is kept as enabled.txt.bak."""
    turn_on = [name for name in turn_on if name]
    wanted = set(turn_on)
    lines = []
    if os.path.isfile(ENABLED):
        with open(ENABLED, encoding="utf-8", errors="replace") as handle:
            lines = handle.read().splitlines()
        shutil.copy2(ENABLED, ENABLED + ".bak")
    out, seen = [], set()
    for raw in lines:
        stripped = raw.strip()
        active = stripped.split("#", 1)[0].strip()
        commented = COMMENTED.match(stripped)
        if active:
            seen.add(active)
            out.append(raw if active in wanted else "# " + active)
        elif commented and commented.group(1) not in seen:
            name = commented.group(1)
            seen.add(name)
            out.append(name if name in wanted else raw)
        else:
            out.append(raw)
    for name in turn_on:
        if name not in seen:
            out.append(name)
    with open(ENABLED, "w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(out) + "\n")
    say("Saved enabled.txt (" + str(len(wanted)) + " mods on). Old copy: enabled.txt.bak")


def open_folder(path):
    if not path or not os.path.exists(path):
        return False
    try:
        if PLATFORM == "windows":
            os.startfile(path)
        elif PLATFORM == "mac":
            subprocess.Popen(["open", path])
        elif PLATFORM == "android":
            subprocess.Popen(["termux-open", path])
        else:
            subprocess.Popen(["xdg-open", path])
        return True
    except (OSError, AttributeError):
        return False


def open_url(url):
    if PLATFORM == "android" and which_tool("termux-open-url"):
        subprocess.Popen([which_tool("termux-open-url"), url])
        return True
    try:
        return webbrowser.open(url)
    except webbrowser.Error:
        return False


def pick_folder(title):
    """Native folder picker if Tk is available; otherwise the page asks the user to paste a path."""
    try:
        import tkinter
        from tkinter import filedialog
    except ImportError:
        return None
    try:
        root = tkinter.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        chosen = filedialog.askdirectory(title=title, mustexist=True)
        root.destroy()
        return chosen or ""
    except Exception:
        return None


def state():
    node = which_tool("node", "nodejs")
    return {
        "version": TOOL_VERSION, "platform": PLATFORM, "game": GAME, "app": APP, "mods": MODS,
        "gameOk": bool(APP) and os.path.isfile(os.path.join(APP, "index.html")),
        "asar": bool(RESOURCES) and os.path.isfile(os.path.join(RESOURCES, "app.asar")),
        "modsOk": os.path.isdir(MODS), "node": node or "", "nodeHint": "" if node else node_install_hint(),
        "titsVersion": game_version() if APP and os.path.isdir(APP) else "",
        "found": find_games(), "patched": os.path.isdir(BACKUP) and bool(os.listdir(BACKUP)),
        "running": JOB["running"], "reportUrl": REPORT_URL, "reportEmail": REPORT_EMAIL,
        "problem": preflight() if GAME else "Pick your game folder first.",
        "kitty": KITTY_FOUND[0],
        "ui": load_settings().get("ui", {}),
    }


def run_job(action, payload):
    try:
        if action == "dry":
            result = apply(dry_run=True)
        elif action == "patch":
            result = apply(after_build=resign_bundle if PLATFORM == "mac" else None)
        elif action == "restore":
            result = restore_originals()
        elif action == "unpack":
            result = unpack_asar()
        elif action == "find":
            terms = [term for term in payload.get("terms", []) if term]
            result = find_sources(terms) if terms else 1
            path = os.path.join(LOGS, "SourceSearch.txt")
            if terms and os.path.isfile(path):
                with open(path, encoding="utf-8", errors="replace") as handle:
                    text = handle.read()
                say(text[:200000] + ("\n... (cut; open the full file from the logs folder)" if len(text) > 200000 else ""))
        elif action == "appimage":
            target = extract_appimage(payload.get("path", ""))
            result = 0 if target else 1
            if target:
                configure(target, MODS, interactive=False)
        else:
            say("Unknown action: " + action)
            result = 1
    except Exception as exc:
        say("CRASH: " + type(exc).__name__ + ": " + str(exc))
        say("Please make a bug report from the Report a bug tab.")
        result = 1
    JOB["result"] = result
    JOB["running"] = False
    say("[finished: " + ("OK" if result == 0 else "stopped, see the lines above") + "]")


class Handler(BaseHTTPRequestHandler):
    server_version = "NestPatcher"

    def log_message(self, *args):
        pass

    def allowed(self):
        host = (self.headers.get("Host") or "").split(":")[0]
        if host not in ("127.0.0.1", "localhost"):
            return False
        if self.path.split("?")[0] in ("/", "/index.html", "/favicon.ico"):
            return True
        return secrets.compare_digest(self.headers.get("X-Nest-Key", ""), KEY)

    def send(self, code, body, kind="application/json"):
        data = body if isinstance(body, bytes) else body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", kind + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    def reply(self, obj, code=200):
        self.send(code, json.dumps(obj))

    def do_GET(self):
        if not self.allowed():
            return self.send(403, "forbidden", "text/plain")
        url = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(url.query)
        LAST_PING[0] = time.time()
        if url.path in ("/", "/index.html"):
            return self.send(200, PAGE, "text/html")
        if url.path == "/favicon.ico":
            return self.send(204, b"", "image/x-icon")
        if url.path == "/api/state":
            return self.reply(state())
        if url.path == "/api/log":
            since = int((query.get("since") or ["0"])[0] or 0)
            with LINES_LOCK:
                since = min(since, len(LINES))
                lines = LINES[since:since + 4000]
                total = since + len(lines)
            return self.reply({"lines": lines, "next": total, "running": JOB["running"], "result": JOB["result"]})
        if url.path == "/api/mods":
            return self.reply({"mods": mod_rows(), "hasList": os.path.isfile(ENABLED)})
        return self.send(404, "not found", "text/plain")

    def do_POST(self):
        if not self.allowed():
            return self.send(403, "forbidden", "text/plain")
        LAST_PING[0] = time.time()
        length = min(int(self.headers.get("Content-Length") or 0), 2 * 1024 * 1024)
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        except ValueError:
            return self.reply({"error": "bad request"}, 400)
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/configure":
            if JOB["running"]:
                return self.reply({"error": "Wait for the current job to finish."}, 409)
            game = (payload.get("game") or "").strip() or None
            mods = (payload.get("mods") or "").strip() or None
            with CONFIG_LOCK:
                ok = configure(game, mods, remember=True, interactive=False)
                return self.reply(dict(state(), ok=ok))
        if path == "/api/pick":
            chosen = pick_folder(payload.get("title") or "Choose a folder")
            return self.reply({"path": chosen, "unavailable": chosen is None})
        if path == "/api/run":
            if JOB["running"]:
                return self.reply({"error": "A job is already running."}, 409)
            action = payload.get("action", "")
            JOB.update(running=True, action=action, result=None)
            threading.Thread(target=run_job, args=(action, payload), daemon=True).start()
            return self.reply({"started": action})
        if path == "/api/mods":
            if JOB["running"]:
                return self.reply({"error": "Wait for the current job to finish."}, 409)
            if not os.path.isdir(MODS):
                return self.reply({"error": "Mods folder not found."}, 400)
            write_enabled(payload.get("on") or [])
            return self.reply({"mods": mod_rows(), "hasList": True})
        if path == "/api/bug":
            try:
                zip_path = bug_report(payload.get("description", ""), payload.get("steps", ""),
                                      payload.get("contact", ""))
                with zipfile.ZipFile(zip_path) as archive:
                    text = archive.read("REPORT.txt").decode("utf-8", "replace")
            except Exception as exc:
                return self.reply({"error": str(exc)}, 500)
            return self.reply({"zip": zip_path, "text": text})
        if path == "/api/open":
            target = {"mods": MODS, "logs": LOGS, "game": GAME}.get(payload.get("what"), "")
            if payload.get("what") == "logs":
                os.makedirs(LOGS, exist_ok=True)
            return self.reply({"ok": open_folder(target)})
        if path == "/api/link":
            url = payload.get("url", "")
            ok = url.startswith(("https://", "mailto:")) and open_url(url)
            return self.reply({"ok": bool(ok)})
        if path == "/api/ui":
            # Text size and theme are kept in the settings file, because the
            # panel's address (and so the browser's own storage) changes every run.
            with CONFIG_LOCK:
                settings = load_settings()
                try:
                    scale = min(2.5, max(0.8, float(payload.get("scale", 1))))
                except (TypeError, ValueError):
                    scale = 1.0
                theme = payload.get("theme") if payload.get("theme") in ("auto", "dark", "light") else "auto"
                settings["ui"] = {"scale": scale, "theme": theme}
                with open(SETTINGS, "w", encoding="utf-8") as handle:
                    json.dump(settings, handle, indent=2)
            return self.reply({"ok": True})
        if path == "/api/clear":
            with LINES_LOCK:
                LINES.clear()
            return self.reply({"ok": True})
        if path == "/api/quit":
            self.reply({"ok": True})
            threading.Thread(target=SERVER[0].shutdown, daemon=True).start()
            return None
        return self.send(404, "not found", "text/plain")


def watchdog():
    """Close the patcher a while after its browser tab is closed (no console to close on a packed exe)."""
    while True:
        time.sleep(15)
        if LAST_PING[0] and not JOB["running"] and time.time() - LAST_PING[0] > 120:
            say("Browser tab closed; stopping NestPatcher.")
            SERVER[0].shutdown()
            return


def gui_main():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(errors="replace")
        except (AttributeError, ValueError):
            pass
    no_browser = "--no-browser" in sys.argv
    port = 0
    for arg in sys.argv[1:]:
        if arg.startswith("--port="):
            port = int(arg.split("=", 1)[1])
    configure(interactive=False)
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    SERVER[0] = server
    url = "http://127.0.0.1:" + str(server.server_address[1]) + "/#k=" + KEY
    say("NestPatcher GUI " + TOOL_VERSION + " is running.")
    say("If your browser did not open, copy this into it:  " + url)
    say("Keep this window open while you use it. Close the browser tab or press Ctrl+C to stop.")
    if not no_browser:
        threading.Timer(0.6, open_url, args=(url,)).start()
    threading.Thread(target=watchdog, daemon=True).start()
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    server.server_close()
    return 0


PAGE = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NestPatcher</title>
<style>
:root,:root[data-theme=dark]{--bg:#121318;--logbg:#0b0c10;--thumb:#5a5f70;--track:#1b1d24;--panel:#1b1d24;--panel2:#23262f;--line:#2f3340;--text:#e7e8ee;--dim:#9aa0b0;
--accent:#c48cff;--accent2:#8f5ad6;--ok:#6fdc8c;--warn:#ffcf5c;--bad:#ff7a85;--focus:#ffd34d;--wbg:#2a2618;--bbg:#2b1a1e;--gbg:#17281d;color-scheme:dark}
@media (prefers-color-scheme:light){:root:not([data-theme=dark]){--bg:#f6f6f9;--panel:#ffffff;--panel2:#eef0f5;--line:#c9ccd6;--text:#17181d;--dim:#4f5566;--accent:#6b2fbf;--accent2:#6b2fbf;--ok:#17703a;--warn:#7a5600;--bad:#b0182a;--focus:#0a58ca;--logbg:#fbfbfd;--thumb:#8a90a2;--track:#e6e8ee;--wbg:#fff6dc;--bbg:#fde8eb;--gbg:#e4f5e9;color-scheme:light}}
:root[data-theme=light]{--bg:#f6f6f9;--panel:#ffffff;--panel2:#eef0f5;--line:#c9ccd6;--text:#17181d;--dim:#4f5566;--accent:#6b2fbf;--accent2:#6b2fbf;--ok:#17703a;--warn:#7a5600;--bad:#b0182a;--focus:#0a58ca;--logbg:#fbfbfd;--thumb:#8a90a2;--track:#e6e8ee;--wbg:#fff6dc;--bbg:#fde8eb;--gbg:#e4f5e9;color-scheme:light}
html{font-size:calc(16px * var(--scale,1))}
*{box-sizing:border-box}
*{scrollbar-width:auto;scrollbar-color:var(--thumb) var(--track)}
::-webkit-scrollbar{width:14px;height:14px}::-webkit-scrollbar-track{background:var(--track)}
::-webkit-scrollbar-thumb{background:var(--thumb);border-radius:7px;border:3px solid var(--track)}
html,body{overflow-y:auto}main{overflow-x:auto}
.status span,code{overflow-wrap:anywhere}
.a11y{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.a11y button,.a11y select{background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:6px 10px;font:inherit;font-size:.9rem;cursor:pointer;min-width:2.6rem}
.a11y .lbl{color:var(--dim);font-size:.85rem}
body{margin:0;background:var(--bg);color:var(--text);font:1rem/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid var(--line);background:var(--panel)}
header h1{font-size:1.25rem;margin:0;white-space:nowrap}header .ver{color:var(--dim);font-size:0.875rem}
header .sp{flex:1}
nav{display:flex;gap:4px;padding:8px 16px 0;background:var(--panel);border-bottom:1px solid var(--line);flex-wrap:wrap}
nav button{background:none;border:0;color:var(--dim);padding:10px 14px;font:inherit;border-bottom:3px solid transparent;cursor:pointer}
nav button[aria-selected=true]{color:var(--text);border-bottom-color:var(--accent)}
main{max-width:980px;margin:0 auto;padding:20px 16px 40px}
section[hidden]{display:none}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-bottom:16px}
.card h2{font-size:1.0625rem;margin:0 0 10px}
label{display:block;font-weight:600;margin:10px 0 4px}
.hint{color:var(--dim);font-size:0.875rem;margin:4px 0}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
input[type=text],textarea{width:100%;background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:10px;font:inherit}
textarea{min-height:90px;resize:vertical}
.row input[type=text]{flex:1;min-width:200px}
button.b{background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:10px 16px;font:inherit;font-weight:600;cursor:pointer}
button.b:hover{border-color:var(--accent)}
button.p{background:var(--accent2);border-color:var(--accent2);color:#fff}
button.p:hover{background:var(--accent)}
button.d{border-color:#6b3a42}
button:disabled{opacity:.45;cursor:not-allowed}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.status{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:0.9375rem}
.status b{color:var(--dim);font-weight:600}
.good{color:var(--ok)}.warn{color:var(--warn)}.bad{color:var(--bad)}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.chip{background:var(--panel2);border:1px solid var(--line);color:var(--text);border-radius:999px;padding:6px 12px;font:inherit;font-size:0.875rem;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#log{background:var(--logbg);resize:vertical;border:1px solid var(--line);border-radius:10px;padding:10px 12px;height:24rem;overflow:auto;
font:.8125rem/1.45 ui-monospace,Consolas,"DejaVu Sans Mono",monospace;white-space:pre-wrap;word-break:break-word}
#log .ok{color:var(--ok)}#log .bad{color:var(--bad)}#log .warn{color:var(--warn)}#log .dim{color:var(--dim)}
.mods{list-style:none;margin:0;padding:0;max-height:30rem;overflow:auto;border:1px solid var(--line);border-radius:10px}
.mods li{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--line)}
.mods li:last-child{border-bottom:0}
.mods input{width:20px;height:20px;accent-color:var(--accent)}
.mods .n{flex:1;word-break:break-all}.mods .k{color:var(--dim);font-size:0.8125rem}
.banner{border-left:4px solid var(--warn);background:var(--wbg);color:var(--text);padding:10px 12px;border-radius:6px;margin-bottom:14px}
.banner.bad{border-color:var(--bad);background:var(--bbg)}
.banner.good{border-color:var(--ok);background:var(--gbg)}
@media (max-width:600px){header{flex-wrap:wrap}.status{grid-template-columns:1fr}#log{height:19rem}}
</style></head><body>
<header><h1>🪺 NestPatcher</h1><span class="ver" id="ver"></span><span class="sp"></span>
<div class="a11y" role="group" aria-label="Display settings"><span class="lbl" id="sizelbl">Text 100%</span>
<button id="smaller" aria-label="Smaller text" title="Smaller text">A−</button><button id="bigger" aria-label="Bigger text" title="Bigger text">A+</button>
<button id="resetsize" title="Normal text size">Reset</button>
<label class="lbl" for="theme" style="margin:0;font-weight:400">Theme</label><select id="theme"><option value="auto">Auto</option><option value="dark">Dark</option><option value="light">Light</option></select></div>
<button class="b" id="quit" title="Stop NestPatcher">Close</button></header>
<p class="hint" style="margin:6px 20px 0">This is <b>NestPatcher</b>, not KittyPatcher. It uses its own <b>nestmods</b> folder. Based on KittyPatcher by LibraKitty.</p>
<nav role="tablist" aria-label="Sections">
<button role="tab" data-tab="setup" aria-selected="true">1. Setup</button>
<button role="tab" data-tab="patch" aria-selected="false">2. Patch</button>
<button role="tab" data-tab="mods" aria-selected="false">Mods on/off</button>
<button role="tab" data-tab="search" aria-selected="false">Search game code</button>
<button role="tab" data-tab="bug" aria-selected="false">Report a bug</button>
</nav>
<main>
<div id="banner" role="status" aria-live="polite"></div>

<section id="setup">
 <div class="card"><h2>Game folder</h2>
  <p class="hint" id="gamehint">The folder you start TiTS from. On Windows it has TiTS.exe and a resources folder.</p>
  <div class="row"><input type="text" id="game" aria-label="Game folder path" placeholder="Paste the game folder path here">
   <button class="b" id="pickgame">Browse…</button></div>
  <div class="chips" id="found" aria-label="Game folders found on this computer"></div>
 </div>
 <div class="card"><h2>Mods folder</h2>
  <p class="hint">Holds enabled.txt and your .mod / .js files. NestPatcher calls it <b>nestmods</b>. If you pick an old <b>kitty-mods</b> folder, NestPatcher renames it to nestmods for you (backups move with it), so KittyPatcher can't use it by mistake.</p>
  <div class="row"><input type="text" id="mods" aria-label="Mods folder path">
   <button class="b" id="pickmods">Browse…</button></div>
  <div class="row" style="margin-top:12px"><button class="b p" id="save">Save folders</button>
   <button class="b" id="openmods">Open mods folder</button></div>
 </div>
 <div class="card"><h2>Check</h2><div class="status" id="status"></div>
  <div class="row" style="margin-top:12px" id="extra"></div></div>
</section>

<section id="patch" hidden>
 <div class="card"><h2>Patch the game</h2>
  <p class="hint">Close TiTS first. <b>Test</b> changes nothing and tells you if every mod fits. <b>Patch</b> writes the mods into the game. <b>Turn all mods off</b> puts the original game files back.</p>
  <div class="row"><button class="b" id="dry">Test my mods</button><button class="b p" id="go">Patch the game</button>
  <button class="b d" id="restore">Turn all mods off</button><button class="b" id="openlogs">Open logs folder</button>
  <button class="b" id="clear">Clear</button></div>
  <p class="hint" id="androidnote" hidden>Android: after patching, rebuild and sign the APK with your usual tools. The patcher does not sign APKs.</p>
 </div>
 <div class="card"><h2>What happened</h2><div id="log" role="log" aria-live="polite" tabindex="0"></div>
  <p class="hint">If it says STOP, MISS or INVALID, the game was not changed. Make a bug report from the <a href="#" data-go="bug" style="color:var(--accent)">Report a bug</a> tab.</p></div>
</section>

<section id="mods" hidden>
 <div class="card"><h2>Mods on or off</h2>
  <p class="hint">Tick the mods you want, then Save. This rewrites enabled.txt in the same order (a copy is kept as enabled.txt.bak). Then go to Patch.</p>
  <div class="row" style="margin-bottom:10px"><button class="b p" id="savemods">Save</button><button class="b" id="allon">All on</button><button class="b" id="reload">Reload</button></div>
  <ul class="mods" id="modlist"></ul></div>
</section>

<section id="search" hidden>
 <div class="card"><h2>Search the game's code</h2>
  <p class="hint">Read-only. Finds text in the game's JavaScript (from the clean backups when they exist), for writing new .mod files. Results show on the Patch tab and in logs/SourceSearch.txt.</p>
  <div class="row"><input type="text" id="terms" aria-label="Search terms" placeholder="e.g. shellyTalk  (separate several with |)">
  <button class="b p" id="find">Search</button></div></div>
</section>

<section id="bug" hidden>
 <div class="card"><h2>Report a bug</h2>
  <p class="hint">This makes a zip with your patch log, enabled.txt, the mod list and system info. Your user name and home folder are blanked out. No save files are included.</p>
  <label for="what">What went wrong?</label><textarea id="what" placeholder="e.g. The game shows a black screen after patching"></textarea>
  <label for="steps">What were you doing just before?</label><textarea id="steps" placeholder="e.g. Turned on TN_Virine.mod, pressed Patch, opened Lerris's shop"></textarea>
  <label for="contact">How can the mod author reach you? (optional)</label><input type="text" id="contact" placeholder="Discord name or email">
  <div class="row" style="margin-top:12px"><button class="b p" id="makebug">Make bug report</button></div>
  <div id="bugout" style="margin-top:12px"></div></div>
</section>
</main>
<script>
const KEY=new URLSearchParams(location.hash.slice(1)).get("k")||"";
let S={},logNext=0,polling=false;
const $=id=>document.getElementById(id);
async function api(path,body){
 const r=await fetch(path,{method:body?"POST":"GET",headers:{"X-Nest-Key":KEY,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
 if(r.status===403){banner("This page lost its key. Close it and start NestPatcher again.","bad");throw new Error("key")}
 return r.json();
}
function banner(text,kind){$("banner").innerHTML=text?'<div class="banner '+(kind||"")+'">'+esc(text).replace(/\n/g,"<br>")+'</div>':""}
function esc(t){return String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function tab(name){document.querySelectorAll("nav button").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===name));
 document.querySelectorAll("main section").forEach(s=>s.hidden=s.id!==name);if(name==="mods")loadMods()}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>tab(b.dataset.tab));
document.querySelectorAll("[data-go]").forEach(a=>a.onclick=e=>{e.preventDefault();tab(a.dataset.go)});
function show(st){S=st;$("ver").textContent="v"+st.version+" · "+st.platform;
 if(document.activeElement!==$("game"))$("game").value=st.game||"";
 if(document.activeElement!==$("mods"))$("mods").value=st.mods||"";
 $("found").innerHTML=(st.found||[]).map(f=>'<button class="chip" title="'+esc(f)+'">'+esc(f)+'</button>').join("");
 $("found").querySelectorAll(".chip").forEach(c=>c.onclick=()=>{$("game").value=c.title;save()});
 const rows=[["Game files",st.gameOk?'<span class="good">found</span> '+esc(st.app):(st.asar?'<span class="warn">packed as app.asar, press Unpack below</span>':'<span class="bad">not found</span>')],
  ["TiTS version",esc(st.titsVersion||"?")],
  ["Mods folder",st.modsOk?'<span class="good">found</span>':'<span class="bad">not found</span>'],
  ["Node.js",st.node?'<span class="good">found</span>':'<span class="bad">missing</span> '+esc(st.nodeHint)],
  ["Patched before",st.patched?"yes (clean backups saved)":"no"]];
 $("status").innerHTML=rows.map(r=>"<b>"+r[0]+"</b><span>"+r[1]+"</span>").join("");
 let extra="";if(st.asar&&!st.gameOk)extra+='<button class="b p" id="unpack">Unpack app.asar</button>';
 if(st.platform==="linux")extra+='<button class="b" id="appimg">My game is an .AppImage…</button>';
 $("extra").innerHTML=extra;
 if($("unpack"))$("unpack").onclick=()=>run("unpack");
 if($("appimg"))$("appimg").onclick=()=>{const p=prompt("Full path to the TiTS .AppImage file:");if(p){tab("patch");run("appimage",{path:p})}};
 $("androidnote").hidden=st.platform!=="android";
 if(st.kitty)banner("KittyPatcher (LibraKitty's patcher) is in this folder: "+st.kitty+"\nNestPatcher is a different program. Use only one of them on a game, or each will undo the other's changes. Move KittyPatcher somewhere else.","bad");
 else if(st.problem)banner(st.problem,"warn");else if(!st.node)banner("Node.js is missing, so mods cannot be checked yet.\n"+st.nodeHint,"warn");else banner("");
 ["dry","go","restore","find","savemods"].forEach(id=>$(id).disabled=st.running);
}
async function refresh(){show(await api("/api/state"))}
async function save(){const st=await api("/api/configure",{game:$("game").value,mods:$("mods").value});show(st);
 if(st.ok&&!st.problem)banner("Folders saved.","good")}
$("save").onclick=save;
async function pick(id,title){const r=await api("/api/pick",{title});if(r.unavailable){banner("No folder picker on this system. Paste the path into the box instead.","warn");return}
 if(r.path){$(id).value=r.path;save()}}
$("pickgame").onclick=()=>pick("game","Choose the TiTS game folder");
$("pickmods").onclick=()=>pick("mods","Choose your mods folder");
$("openmods").onclick=()=>api("/api/open",{what:"mods"});
$("openlogs").onclick=()=>api("/api/open",{what:"logs"});
$("clear").onclick=async()=>{await api("/api/clear",{});$("log").innerHTML="";logNext=0};
function cls(l){if(/^(STOP|MISS|INVALID|WRITE FAILURE|ROLLBACK|CRASH|PERMISSION)/.test(l))return"bad";
 if(/^(OK |DONE|DRY RUN|RESTORED|Unpacked|Bug report saved|\[finished: OK)/.test(l))return"ok";
 if(/^(Missing|WARNING|Retrying|Skip|\[finished)/.test(l))return"warn";if(/^VALID /.test(l))return"dim";return""}
async function poll(){if(polling)return;polling=true;
 try{for(;;){const r=await api("/api/log?since="+logNext);logNext=r.next;
  if(r.lines.length){const box=$("log"),stick=box.scrollTop+box.clientHeight>=box.scrollHeight-30,frag=document.createDocumentFragment();
   r.lines.forEach(l=>{const d=document.createElement("div");d.textContent=l;const c=cls(l);if(c)d.className=c;frag.appendChild(d)});
   box.appendChild(frag);if(stick)box.scrollTop=box.scrollHeight}
  if(!r.running&&!r.lines.length)break;await new Promise(f=>setTimeout(f,r.running?400:50))}}
 finally{polling=false;refresh()}}
async function run(action,extra){tab("patch");const r=await api("/api/run",Object.assign({action},extra||{}));
 if(r.error){banner(r.error,"warn");return}refresh();poll()}
$("dry").onclick=()=>run("dry");
$("go").onclick=()=>run("patch");
$("restore").onclick=()=>{if(confirm("Put the original game files back? Every mod will be off until you patch again."))run("restore")};
$("find").onclick=()=>{const t=$("terms").value.split("|").map(s=>s.trim()).filter(Boolean);if(t.length)run("find",{terms:t})};
$("terms").onkeydown=e=>{if(e.key==="Enter")$("find").click()};
let MODS=[];
async function loadMods(){const r=await api("/api/mods");MODS=r.mods;drawMods(r.hasList)}
function drawMods(hasList){const ul=$("modlist");
 if(!MODS.length){ul.innerHTML='<li>No mods found. Check the mods folder on the Setup tab.</li>';return}
 ul.innerHTML=MODS.map((m,i)=>'<li><input type="checkbox" id="m'+i+'" '+(m.on?"checked":"")+'><label for="m'+i+'" class="n" style="margin:0;font-weight:400">'+esc(m.name)+
  (m.missing?' <span class="bad">(file missing; untick it)</span>':'')+'</label><span class="k">'+(m.kind==="script"?"script":"patch")+(m.size?" · "+Math.max(1,Math.round(m.size/1024))+" KB":"")+'</span></li>').join("");
 if(!hasList)banner("There is no enabled.txt yet, so every mod in the folder is used. Saving here creates one.","warn")}
$("savemods").onclick=async()=>{const on=MODS.filter((m,i)=>$("m"+i).checked).map(m=>m.name);const r=await api("/api/mods",{on});
 if(r.error){banner(r.error,"bad");return}MODS=r.mods;drawMods(true);banner("Saved. Now press Patch the game on the Patch tab.","good")};
$("allon").onclick=()=>MODS.forEach((m,i)=>{if(!m.missing)$("m"+i).checked=true});
$("reload").onclick=loadMods;
$("makebug").onclick=async()=>{$("makebug").disabled=true;
 try{const r=await api("/api/bug",{description:$("what").value,steps:$("steps").value,contact:$("contact").value});
 if(r.error){$("bugout").innerHTML='<div class="banner bad">'+esc(r.error)+'</div>';return}
 let h='<div class="banner good">Saved: <code>'+esc(r.zip)+'</code></div><div class="row"><button class="b" id="openbug">Open logs folder</button><button class="b" id="copybug">Copy report text</button>';
 const title="NestPatcher bug: "+($("what").value.split("\n")[0].slice(0,80)||"problem");
 if(S.reportUrl)h+='<button class="b p" id="sendurl">Open the report page</button>';
 if(S.reportEmail)h+='<button class="b p" id="sendmail">Email it</button>';
 h+='</div><p class="hint">'+(S.reportUrl||S.reportEmail?"Attach the zip file when the page or email opens.":"Send the zip to whoever gave you the mods (for example by Discord or email).")+'</p>';
 $("bugout").innerHTML=h;
 $("openbug").onclick=()=>api("/api/open",{what:"logs"});
 $("copybug").onclick=async()=>{try{await navigator.clipboard.writeText(r.text);$("copybug").textContent="Copied"}catch(e){prompt("Copy this:",r.text)}};
 const body=r.text.slice(0,6000);
 if($("sendurl"))$("sendurl").onclick=()=>api("/api/link",{url:S.reportUrl+(S.reportUrl.includes("?")?"&":"?")+"title="+encodeURIComponent(title)+"&body="+encodeURIComponent(body)});
 if($("sendmail"))$("sendmail").onclick=()=>api("/api/link",{url:"mailto:"+S.reportEmail+"?subject="+encodeURIComponent(title)+"&body="+encodeURIComponent(body.slice(0,1500))});
 }finally{$("makebug").disabled=false}};
$("quit").onclick=async()=>{if(!confirm("Close NestPatcher?"))return;await api("/api/quit",{});document.body.innerHTML='<main><div class="card"><h2>NestPatcher closed.</h2><p class="hint">You can close this tab.</p></div></main>'};
setInterval(()=>{if(!polling)api("/api/state").then(show).catch(()=>{})},10000);
let UI={scale:1,theme:"auto"};
function applyUI(){document.documentElement.style.setProperty("--scale",UI.scale);
 if(UI.theme==="auto")document.documentElement.removeAttribute("data-theme");else document.documentElement.setAttribute("data-theme",UI.theme);
 $("sizelbl").textContent="Text "+Math.round(UI.scale*100)+"%";$("theme").value=UI.theme;
 $("smaller").disabled=UI.scale<=0.8;$("bigger").disabled=UI.scale>=2.5}
function saveUI(){applyUI();api("/api/ui",UI).catch(()=>{})}
$("smaller").onclick=()=>{UI.scale=Math.max(0.8,Math.round((UI.scale-0.1)*10)/10);saveUI()};
$("bigger").onclick=()=>{UI.scale=Math.min(2.5,Math.round((UI.scale+0.1)*10)/10);saveUI()};
$("resetsize").onclick=()=>{UI.scale=1;saveUI()};
$("theme").onchange=()=>{UI.theme=$("theme").value;saveUI()};
document.addEventListener("keydown",e=>{if(e.altKey&&(e.key==="="||e.key==="+")){e.preventDefault();$("bigger").click()}
 if(e.altKey&&e.key==="-"){e.preventDefault();$("smaller").click()}});
refresh().then(()=>{if(S.ui){UI=Object.assign(UI,S.ui)}applyUI();if(S.gameOk&&S.modsOk)tab("patch");poll()});
</script></body></html>
"""


if __name__ == "__main__":
    raise SystemExit(gui_main())
