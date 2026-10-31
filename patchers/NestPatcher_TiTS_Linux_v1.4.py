#!/usr/bin/env python3
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


TOOL_NAME = 'NestPatcher_TiTS_Linux_v1.4.py'
TOOL_VERSION = '1.4'
PLATFORM_DEFAULT = 'linux'
PLATFORM_LABEL = 'Linux'
CREDIT = 'Based on KittyPatcher by LibraKitty (the original Windows patcher).'
# No version in the settings name, so a newer patcher keeps your saved folders.
SETTINGS_NAME = 'NestPatcher_TiTS_Linux.settings.json'

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


# A needle may name minified functions through @@name@@ wildcards, because the
# PC and Android builds of TiTS give the same function different short names.
# Each @@name@@ matches one JavaScript identifier; repeating a name means the
# same identifier, and @@name@@ in the With text puts the matched name back.
WILDCARD = re.compile(r"@@([A-Za-z_][A-Za-z0-9_]*)@@")


def needle_pattern(old):
    """A compiled regex for a needle with @@name@@ wildcards, or None for a plain needle."""
    if not WILDCARD.search(old):
        return None
    parts, seen, pos = [], set(), 0
    for match in WILDCARD.finditer(old):
        parts.append(re.escape(old[pos:match.start()]))
        name = match.group(1)
        parts.append("(?P=" + name + ")" if name in seen else "(?P<" + name + ">[A-Za-z_$][A-Za-z0-9_$]*)")
        seen.add(name)
        pos = match.end()
    parts.append(re.escape(old[pos:]))
    return re.compile("".join(parts))


def needle_in(text, block):
    pattern = block.get("pattern")
    return bool(pattern.search(text)) if pattern else block["old"] in text


def needle_count(text, block):
    pattern = block.get("pattern")
    return sum(1 for _ in pattern.finditer(text)) if pattern else text.count(block["old"])


def replace_first(text, block):
    pattern = block.get("pattern")
    if not pattern:
        return text.replace(block["old"], block["new"], 1)
    match = pattern.search(text)
    found = match.groupdict()
    new = WILDCARD.sub(lambda w: found.get(w.group(1), w.group(0)), block["new"])
    return text[:match.start()] + new + text[match.end():]


def parse_mod(path):
    with open(path, "r", encoding="utf-8", errors="replace") as handle:
        text = handle.read().replace("\r\n", "\n").replace("\r", "\n")
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
            blocks[-1]["pattern"] = needle_pattern(blocks[-1]["old"])
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
        with open(ENABLED, "r", encoding="utf-8", errors="replace") as handle:
            for line in handle:
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


def locate(files, target, block):
    key = basename_key(target) if target else ""
    by_key = {}
    for name in files:
        by_key.setdefault(basename_key(name), name)
    if key and key in by_key and needle_in(files[by_key[key]], block):
        return by_key[key], "named"
    hits = [name for name, text in files.items() if block["old"] and needle_in(text, block)]
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
            real, how = locate(files, block["target"], block)
            label = block["mod"] + " -> " + (block["target"] or "(any)")
            if not real:
                next_pending.append(block)
                continue
            occurrences = needle_count(files[real], block)
            if occurrences > 8:
                log("STOP: unsafe needle (" + str(occurrences) + ") " + label)
                return 1
            files[real] = replace_first(files[real], block)
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
# Command line
# --------------------------------------------------------------------------

import argparse

MENU = [
    ("Test my mods (dry run, changes nothing)", ["--dry-run"]),
    ("Patch the game with my mods", []),
    ("Turn all mods off (restore the original game files)", ["--restore"]),
    ("Make a bug report zip", ["--bug-report"]),
    ("Show the folders and tools in use", ["--show"]),
    ("Unpack app.asar (only if the patcher asked for it)", ["--unpack-asar"]),
]


def menu():
    say("")
    say("NestPatcher " + TOOL_VERSION + " for " + PLATFORM_LABEL)
    say(CREDIT)
    for number, (label, _) in enumerate(MENU, 1):
        say("  " + str(number) + ") " + label)
    say("  0) Quit")
    try:
        answer = input("Type a number and press Enter: ").strip()
    except EOFError:
        return None
    if answer.isdigit() and 1 <= int(answer) <= len(MENU):
        return MENU[int(answer) - 1][1]
    return None


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(errors="replace")
        except (AttributeError, ValueError):
            pass
    parser = argparse.ArgumentParser(
        description="NestPatcher " + TOOL_VERSION + " (" + PLATFORM_LABEL + "): validated, reversible game-file patching")
    parser.add_argument("--dry-run", action="store_true", help="validate and preview without writing game files")
    parser.add_argument("--fresh", action="store_true", help="regenerate from saved baselines; clear obsolete NestPatcher runtime files (also default)")
    parser.add_argument("--skip-validation", action="store_true", help="dangerous: skip Node.js syntax validation")
    parser.add_argument("--find", nargs="+", metavar="TERM", help="search game JavaScript and save excerpts to nestmods/logs/SourceSearch.txt (read-only)")
    parser.add_argument("--game", "--app", dest="game", metavar="PATH", help="the TiTS game folder (remembered for later runs)")
    parser.add_argument("--mods", metavar="PATH", help="mods folder (default: nestmods next to this script; remembered)")
    parser.add_argument("--unpack-asar", action="store_true", help="extract resources/app.asar to resources/app so it can be patched")
    if PLATFORM_DEFAULT == "linux":
        parser.add_argument("--extract-appimage", metavar="FILE", help="unpack a TiTS .AppImage into a folder that can be patched")
    parser.add_argument("--restore", action="store_true", help="put the clean original game files back (turns every mod off)")
    parser.add_argument("--bug-report", action="store_true", help="save a zip with your log, enabled.txt and system info to send to the mod author")
    parser.add_argument("--note", metavar="TEXT", default="", help="with --bug-report: what went wrong, in your own words")
    parser.add_argument("--menu", action="store_true", help="show a numbered menu instead of using flags")
    parser.add_argument("--show", action="store_true", help="print the paths in use and exit")
    parser.add_argument("--forget", action="store_true", help="delete saved --game/--mods settings and exit")
    parser.add_argument("--version", action="version", version="NestPatcher " + TOOL_VERSION + ". " + CREDIT)
    args = parser.parse_args(argv)

    if args.menu:
        picked = menu()
        if picked is None:
            return 0
        keep = []
        if args.game:
            keep += ["--game", args.game]
        if args.mods:
            keep += ["--mods", args.mods]
        return main(keep + picked)

    if PLATFORM != PLATFORM_DEFAULT:
        say("Note: this is the " + PLATFORM_LABEL + " patcher but you seem to be on " + PLATFORM + ".")
        say("It will still try, but the matching patcher for your system gives better help messages.")

    if args.forget:
        if os.path.isfile(SETTINGS):
            os.remove(SETTINGS)
        say("Saved settings cleared.")
        return 0
    if PLATFORM_DEFAULT == "linux" and getattr(args, "extract_appimage", None):
        target = extract_appimage(args.extract_appimage)
        if not target:
            return 1
        args.game = target
    if not configure(args.game, args.mods):
        return 1
    if args.show:
        return show_paths()
    if args.unpack_asar:
        return unpack_asar()
    if args.restore:
        return restore_originals()
    if args.find:
        return find_sources(args.find)
    if args.bug_report:
        bug_report(args.note)
        return 0
    return apply(args.dry_run, args.fresh, not args.skip_validation,
                 after_build=resign_bundle if PLATFORM == "mac" else None)


if __name__ == "__main__":
    raise SystemExit(main())
