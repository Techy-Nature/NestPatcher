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
#   * --export-appimage packs the patched game into one .AppImage file, and
#     --export-mac makes a macOS TiTS.app (as a zip) from the same game.
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


TOOL_NAME = 'NestPatcher_TiTS_Linux_v1.8.py'
TOOL_VERSION = '1.8'
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


VERSION_TAG = re.compile(r"_v\d+(?:\.\d+)*(?=\.[^.]+$)", re.IGNORECASE)


def same_mod_twice(names):
    """Groups of enabled files that are versions of one mod, e.g. TN_X.mod and TN_X_v2.6.mod.
    Running both applies the mod twice, so the second copy can't find its text."""
    groups = {}
    for name in names:
        key = VERSION_TAG.sub("", os.path.basename(name)).lower()
        groups.setdefault(key, []).append(name)
    return [group for group in groups.values() if len(group) > 1]


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
    twice = same_mod_twice([os.path.basename(path) for path in enabled_mods()])
    if twice:
        for group in twice:
            log("STOP: two versions of the same mod are turned on: " + ", ".join(group))
        log("Keep only the newest version of each in enabled.txt (put # in front of the others). No changes made.")
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
    save_game_runtime(path)
    say("Unpacked to " + target)
    say("From now on start the game with: \"" + os.path.join(target, "AppRun") + "\"")
    say("After patching you can pack it back into one file with --export-appimage.")
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
# Export: pack the patched game as a macOS app or a Linux AppImage
# --------------------------------------------------------------------------
#
# TiTS is a web game inside Electron. resources/app (the part NestPatcher
# patches) is the same on every system; only the Electron program around it
# differs. So an export takes the patched app/ folder and wraps it in an
# Electron for the target system:
#   * same system as the source game (TiTS.app -> Mac zip, Linux folder or
#     unpacked AppImage -> AppImage): the game's own Electron is reused.
#   * anything else (the Windows game, an Android www folder): the matching
#     Electron is downloaded from github.com/electron/electron, checked
#     against Electron's SHASUMS256.txt, and kept in nestmods/downloads.
# The Mac export is written as a zip with Python's zipfile (symlinks kept),
# so it can be made on Windows and Linux too. On a Mac it is also unpacked
# and ad-hoc signed. The AppImage is packed with mksquashfs when it is
# installed, or else with the small built-in packer below (pure Python), so it
# can be made on Android or anywhere else without squashfs-tools.

import mmap
import stat
import zlib
import plistlib
import urllib.error
import urllib.request

DEFAULT_ELECTRON = "28.3.3"
EXPORT_NAME = "TiTS"
EXPORT_TITLE = "Trials in Tainted Space"
BUNDLE_ID = "com.techynest.nestpatched.tits"
ELECTRON_URL = "https://github.com/electron/electron/releases/download/v{ver}/{file}"
RUNTIME_URL = "https://github.com/AppImage/type2-runtime/releases/download/continuous/runtime-{arch}"
ELECTRON_IN_BINARY = re.compile(rb"Electron/(\d{1,3}\.\d{1,3}\.\d{1,3})")
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
APPIMAGE_ARCH = {"x64": "x86_64", "arm64": "aarch64"}
# Originals that NestPatcher (or KittyPatcher) moved aside; never exported.
BACKUP_NAMES = {"app.asar.nest-original", "app.asar.unpacked.nest-original", "app.asar.kitty-original"}
# Files in resources/ that belong to the old Electron, or are backups.
SKIP_RESOURCES = BACKUP_NAMES | {"default_app.asar", "elevate.exe", "electron.icns"}

SHELL_MAIN = r"""// Small Electron starter written by NestPatcher for exported games.
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280, height: 820, backgroundColor: "#000000", autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  if (win.webContents.setWindowOpenHandler) {
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:/i.test(url)) shell.openExternal(url);
      return { action: "deny" };
    });
  }
  win.loadFile(path.join(__dirname, "index.html"));
});
app.on("window-all-closed", () => app.quit());
"""

FALLBACK_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
<rect width="256" height="256" rx="48" fill="#17121f"/>
<circle cx="128" cy="128" r="92" fill="none" stroke="#c48cff" stroke-width="10"/>
<text x="128" y="150" font-family="DejaVu Sans, Arial, sans-serif" font-size="64" font-weight="700"
 text-anchor="middle" fill="#efe6ff">TiTS</text></svg>
"""


def host_arch():
    machine = platform.machine().lower()
    return "arm64" if machine in ("arm64", "aarch64", "armv8l") else "x64"


def export_folder(out=None):
    folder = os.path.abspath(os.path.expanduser(out)) if out else os.path.join(ROOT, "NestExports")
    os.makedirs(folder, exist_ok=True)
    return folder


def plain_version(text):
    match = re.search(r"\d+\.\d+\.\d+", text or "")
    return match.group(0) if match else ""


# ---------- what kind of game we were given ----------

def is_elf(path):
    try:
        with open(path, "rb") as handle:
            return handle.read(4) == b"\x7fELF"
    except OSError:
        return False


def linux_game_binary(folder):
    """The main program in a Linux Electron folder (the biggest ELF file at the top)."""
    best = None
    try:
        names = os.listdir(folder)
    except OSError:
        return None
    for name in names:
        path = os.path.join(folder, name)
        if (name in ("chrome-sandbox", "chrome_crashpad_handler") or ".so" in name
                or not os.path.isfile(path) or not is_elf(path)):
            continue
        size = os.path.getsize(path)
        if best is None or size > best[0]:
            best = (size, name)
    return best[1] if best else None


def source_kind():
    """mac (TiTS.app), appdir (unpacked AppImage), linux (Electron folder),
    windows (TiTS.exe folder) or web (a bare www folder, e.g. from the APK)."""
    if GAME.endswith(".app"):
        return "mac"
    if not RESOURCES:
        return "web"
    if os.path.isfile(os.path.join(GAME, "AppRun")):
        return "appdir"
    try:
        names = os.listdir(GAME)
    except OSError:
        names = []
    if any(name.lower().endswith(".exe") for name in names):
        return "windows"
    if linux_game_binary(GAME):
        return "linux"
    return "windows"


# ---------- which Electron the game uses ----------

def scan_for_electron(path):
    try:
        with open(path, "rb") as handle:
            tail = b""
            while True:
                chunk = handle.read(8 << 20)
                if not chunk:
                    return ""
                match = ELECTRON_IN_BINARY.search(tail + chunk)
                if match:
                    return match.group(1).decode()
                tail = chunk[-64:]
    except OSError:
        return ""


def electron_version():
    """(version, where it came from), or ("", "") when the game does not say."""
    if GAME.endswith(".app"):
        framework = os.path.join(GAME, "Contents", "Frameworks", "Electron Framework.framework")
        for rel in (("Versions", "A", "Resources", "Info.plist"), ("Resources", "Info.plist")):
            try:
                with open(os.path.join(framework, *rel), "rb") as handle:
                    found = plain_version(str(plistlib.load(handle).get("CFBundleVersion", "")))
                if found:
                    return found, "Electron Framework Info.plist"
            except (OSError, ValueError, plistlib.InvalidFileException):
                continue
    if GAME and os.path.isfile(os.path.join(GAME, "version")):
        try:
            with open(os.path.join(GAME, "version"), encoding="utf-8", errors="replace") as handle:
                found = plain_version(handle.read(64))
            if found:
                return found, "the game's version file"
        except OSError:
            pass
    programs = []
    if GAME and os.path.isdir(GAME) and not GAME.endswith(".app"):
        for name in os.listdir(GAME):
            path = os.path.join(GAME, name)
            if os.path.isfile(path) and (name.lower().endswith(".exe") or is_elf(path)) \
                    and os.path.getsize(path) > 20 * 1024 * 1024:
                programs.append((os.path.getsize(path), path))
    for _, path in sorted(programs, reverse=True)[:3]:
        found = scan_for_electron(path)
        if found:
            return found, os.path.basename(path)
    try:
        with open(os.path.join(APP, "package.json"), encoding="utf-8") as handle:
            package = json.load(handle)
        for section in ("devDependencies", "dependencies"):
            found = plain_version(str(package.get(section, {}).get("electron", "")))
            if found:
                return found, "app/package.json"
    except (OSError, ValueError, AttributeError):
        pass
    return "", ""


def pick_electron(version, electron_zip_path):
    """The Electron version to download: --electron, else the game's own, else the default."""
    if version or electron_zip_path:
        return version or "(from your zip)"
    found, where = electron_version()
    if found:
        say("The game uses Electron " + found + " (read from " + where + "), so the export uses it too.")
        return found
    say("Could not tell which Electron the game uses, so using Electron " + DEFAULT_ELECTRON + ".")
    return DEFAULT_ELECTRON


def elf_arch(path):
    """x64 or arm64 for a Linux program, or ''."""
    try:
        with open(path, "rb") as handle:
            head = handle.read(20)
        machine = struct.unpack_from("<H" if head[5] == 1 else ">H", head, 18)[0]
        return {62: "x64", 183: "arm64"}.get(machine, "")
    except (OSError, struct.error, IndexError):
        return ""


# ---------- downloads ----------

def download(url, dest):
    """Download url to dest (atomically). Falls back to curl when Python has no
    certificates (common with the python.org installer on macOS)."""
    part = dest + ".part"
    say("Downloading " + url)
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "NestPatcher/" + TOOL_VERSION})
        try:
            response = urllib.request.urlopen(request, timeout=60)
        except urllib.error.URLError as exc:
            # Some Pythons (on Android, or python.org's on macOS) have no certificate list
            # of their own; Android keeps the system's in /system/etc/security/cacerts.
            system_certs = "/system/etc/security/cacerts"
            if "CERTIFICATE" not in str(exc).upper() or not os.path.isdir(system_certs):
                raise
            import ssl
            response = urllib.request.urlopen(request, timeout=60,
                                              context=ssl.create_default_context(capath=system_certs))
        with response, open(part, "wb") as handle:
            total = int(response.headers.get("Content-Length") or 0)
            done, shown = 0, -1
            while True:
                chunk = response.read(1 << 20)
                if not chunk:
                    break
                handle.write(chunk)
                done += len(chunk)
                if total > 4 << 20 and done * 10 // total != shown:
                    shown = done * 10 // total
                    say("  " + str(shown * 10) + "% of " + str(total // (1 << 20)) + " MB")
        os.replace(part, dest)
        return True
    except Exception as exc:
        if os.path.exists(part):
            os.remove(part)
        curl = which_tool("curl")
        if not curl:
            say("Download failed: " + str(exc))
            return False
        say("Python could not download it (" + type(exc).__name__ + "), trying curl...")
        result = subprocess.run([curl, "-fL", "--retry", "3", "-o", part, url], **hidden_window())
        if result.returncode or not os.path.isfile(part):
            if os.path.exists(part):
                os.remove(part)
            say("Download failed (curl exit code " + str(result.returncode) + ").")
            return False
        os.replace(part, dest)
        return True


def sha256_of(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def downloads_folder():
    folder = os.path.join(MODS, "downloads")
    os.makedirs(folder, exist_ok=True)
    return folder


def electron_zip(version, system, arch, given=None):
    """Path to electron-v<version>-<system>-<arch>.zip, downloaded and checked
    against Electron's SHASUMS256.txt, or None."""
    if given:
        given = os.path.abspath(os.path.expanduser(given))
        if not zipfile.is_zipfile(given):
            say("STOP: --electron-zip is not a zip file: " + given)
            return None
        say("Using the Electron zip you gave: " + given)
        return given
    name = "electron-v" + version + "-" + system + "-" + arch + ".zip"
    folder = downloads_folder()
    sums_path = os.path.join(folder, "SHASUMS256-v" + version + ".txt")
    if not os.path.isfile(sums_path) and not download(
            ELECTRON_URL.format(ver=version, file="SHASUMS256.txt"), sums_path):
        say("STOP: could not get the checksum list for Electron " + version + ".")
        say("Check your internet connection, or download " + name + " yourself and use --electron-zip FILE.")
        return None
    with open(sums_path, encoding="utf-8", errors="replace") as handle:
        sums = {}
        for line in handle:
            parts = line.split()
            if len(parts) == 2:
                sums[parts[1].lstrip("*")] = parts[0].lower()
    if name not in sums:
        say("STOP: Electron " + version + " has no " + system + "-" + arch + " download.")
        if arch == "arm64":
            say("Electron only has arm64 Mac builds from version 11. Use --arch x64 (Apple Silicon runs it through Rosetta),")
            say("or pick a newer Electron with --electron " + DEFAULT_ELECTRON + ".")
        return None
    path = os.path.join(folder, name)
    if os.path.isfile(path) and sha256_of(path) == sums[name]:
        say("Using saved " + name)
        return path
    if not download(ELECTRON_URL.format(ver=version, file=name), path):
        say("STOP: could not download " + name + ". You can download it yourself and use --electron-zip FILE.")
        return None
    if sha256_of(path) != sums[name]:
        os.remove(path)
        say("STOP: " + name + " did not match Electron's checksum, so it was deleted. Try again.")
        return None
    say("Checked " + name + " against Electron's SHASUMS256.txt.")
    return path


def appimage_runtime_size(path):
    """Length of the ELF runtime at the start of an AppImage (where its squashfs begins)."""
    with open(path, "rb") as handle:
        head = handle.read(64)
    if head[:4] != b"\x7fELF" or head[4] != 2:
        return 0
    endian = "<" if head[5] == 1 else ">"
    shoff = struct.unpack_from(endian + "Q", head, 0x28)[0]
    shentsize, shnum = struct.unpack_from(endian + "HH", head, 0x3A)
    return shoff + shentsize * shnum


def save_game_runtime(appimage):
    """Keep the runtime of the player's own TiTS AppImage as a spare for exports."""
    try:
        size = appimage_runtime_size(appimage)
        if not 4096 < size < 16 << 20:
            return
        with open(appimage, "rb") as handle:
            data = handle.read(size)
        arch = "aarch64" if struct.unpack_from("<H", data, 18)[0] == 183 else "x86_64"
        with open(os.path.join(downloads_folder(), "runtime-from-game-" + arch), "wb") as handle:
            handle.write(data)
    except (OSError, struct.error):
        pass


def appimage_runtime(arch, given=None):
    if given:
        given = os.path.abspath(os.path.expanduser(given))
        return given if os.path.isfile(given) else None
    folder = downloads_folder()
    path = os.path.join(folder, "runtime-" + arch)
    if os.path.isfile(path) and os.path.getsize(path) > 4096:
        return path
    if download(RUNTIME_URL.format(arch=arch), path):
        with open(path, "rb") as handle:
            head = handle.read(11)
        if head[:4] == b"\x7fELF" and head[8:11] == b"AI\x02":
            return path
        os.remove(path)
        say("The downloaded AppImage runtime did not look right, so it was deleted.")
    spare = os.path.join(folder, "runtime-from-game-" + arch)
    if os.path.isfile(spare):
        say("Using the runtime saved from your own TiTS AppImage instead.")
        return spare
    return None


# ---------- icons ----------

def png_size(data):
    if data[:8] != PNG_SIGNATURE or data[12:16] != b"IHDR":
        return 0, 0
    return struct.unpack(">II", data[16:24])


def make_png(width, height, rgba_rows):
    def chunk(kind, body):
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body) & 0xFFFFFFFF)
    raw = b"".join(b"\x00" + row for row in rgba_rows)
    return (PNG_SIGNATURE + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def dib_to_png(blob):
    """A 32-bit icon bitmap (BGRA, bottom-up) from an .exe, as a PNG."""
    header, width, height2, planes, bits = struct.unpack_from("<IiiHH", blob, 0)
    height = height2 // 2
    if header < 40 or bits != 32 or width <= 0 or height <= 0:
        return None
    stride = width * 4
    pixels = blob[header:header + stride * height]
    if len(pixels) < stride * height:
        return None
    rows = []
    for y in range(height - 1, -1, -1):
        row = bytearray(pixels[y * stride:(y + 1) * stride])
        row[0::4], row[2::4] = row[2::4], row[0::4]
        rows.append(bytes(row))
    return make_png(width, height, rows)


def exe_icon_png(path):
    """The biggest icon inside a Windows .exe, as PNG bytes (or None)."""
    try:
        with open(path, "rb") as handle, mmap.mmap(handle.fileno(), 0, access=mmap.ACCESS_READ) as data:
            if data[:2] != b"MZ":
                return None
            pe = struct.unpack_from("<I", data, 0x3C)[0]
            if data[pe:pe + 4] != b"PE\0\0":
                return None
            sections, optional_size = struct.unpack_from("<H", data, pe + 6)[0], struct.unpack_from("<H", data, pe + 20)[0]
            optional = pe + 24
            magic = struct.unpack_from("<H", data, optional)[0]
            directory = optional + (112 if magic == 0x20B else 96)
            resource_rva = struct.unpack_from("<I", data, directory + 16)[0]
            table = optional + optional_size

            def offset(rva):
                for index in range(sections):
                    vsize, vaddr, rawsize, rawptr = struct.unpack_from("<IIII", data, table + 40 * index + 8)
                    if vaddr <= rva < vaddr + max(vsize, rawsize):
                        return rva - vaddr + rawptr
                return None

            base = offset(resource_rva)
            if not resource_rva or base is None:
                return None

            def entries(at):
                named, ids = struct.unpack_from("<HH", data, base + at + 12)
                for index in range(named + ids):
                    yield struct.unpack_from("<II", data, base + at + 16 + 8 * index)

            best = None
            for ident, sub in entries(0):
                if ident != 3 or not sub & 0x80000000:      # 3 = RT_ICON
                    continue
                for _, icon in entries(sub & 0x7FFFFFFF):
                    if not icon & 0x80000000:
                        continue
                    for _, leaf in entries(icon & 0x7FFFFFFF):
                        if leaf & 0x80000000:
                            continue
                        rva, size = struct.unpack_from("<II", data, base + leaf)
                        start = offset(rva)
                        if start is None:
                            continue
                        blob = bytes(data[start:start + size])
                        try:
                            png = blob if blob[:8] == PNG_SIGNATURE else dib_to_png(blob)
                        except (ValueError, struct.error):
                            png = None
                        if png and (best is None or png_size(png)[0] > png_size(best)[0]):
                            best = png
            return best
    except (OSError, ValueError, struct.error):
        return None


def find_icon(given=None):
    """('png'|'icns'|'svg', bytes) for the exported app, or None."""
    if given:
        path = os.path.abspath(os.path.expanduser(given))
        try:
            with open(path, "rb") as handle:
                data = handle.read()
        except OSError:
            say("WARNING: could not read --icon " + path)
            data = b""
        if data[:8] == PNG_SIGNATURE:
            return "png", data
        if data[:4] == b"icns":
            return "icns", data
        if b"<svg" in data[:2048]:
            return "svg", data
        if data:
            say("WARNING: --icon must be a .png, .icns or .svg file; using the game's icon instead.")
    if GAME.endswith(".app"):
        try:
            with open(os.path.join(GAME, "Contents", "Info.plist"), "rb") as handle:
                icon = plistlib.load(handle).get("CFBundleIconFile", "")
            if icon:
                icon = icon if icon.endswith(".icns") else icon + ".icns"
                with open(os.path.join(RESOURCES, icon), "rb") as handle:
                    return "icns", handle.read()
        except (OSError, ValueError, plistlib.InvalidFileException):
            pass
    if GAME and os.path.isdir(GAME) and not GAME.endswith(".app"):
        for name in sorted(os.listdir(GAME)):
            if name.lower().endswith(".exe") and "uninstall" not in name.lower():
                png = exe_icon_png(os.path.join(GAME, name))
                if png:
                    return "png", png
    for folder in (RESOURCES, APP, GAME):
        if not folder or not os.path.isdir(folder):
            continue
        for name in sorted(os.listdir(folder)):
            low = name.lower()
            if low.endswith(".png") and ("icon" in low or low.startswith("tits")):
                with open(os.path.join(folder, name), "rb") as handle:
                    data = handle.read()
                if png_size(data)[0] >= 64:
                    return "png", data
    return None


def icns_from_png(png):
    kinds = {16: b"icp4", 32: b"icp5", 64: b"icp6", 128: b"ic07", 256: b"ic08", 512: b"ic09", 1024: b"ic10"}
    width, height = png_size(png)
    if width != height or width not in kinds:
        return None
    body = kinds[width] + struct.pack(">I", 8 + len(png)) + png
    return b"icns" + struct.pack(">I", 8 + len(body)) + body


# ---------- the game files that go into the export ----------

def payload(simple_shell=False):
    """List of (path inside resources/, source file or bytes) for the patched game."""
    items = []
    if RESOURCES and os.path.isdir(os.path.join(RESOURCES, "app")) and not simple_shell:
        for dirpath, dirnames, filenames in os.walk(RESOURCES):
            rel_dir = os.path.relpath(dirpath, RESOURCES)
            if rel_dir == ".":
                dirnames[:] = [d for d in dirnames if d not in SKIP_RESOURCES and not d.endswith(".lproj")]
                filenames = [f for f in filenames if f not in SKIP_RESOURCES and not f.endswith(".icns")
                             and not (f == "app.asar" and os.path.isdir(os.path.join(RESOURCES, "app")))]
            for name in filenames:
                path = os.path.join(dirpath, name)
                if os.path.isfile(path):
                    items.append((os.path.relpath(path, RESOURCES).replace(os.sep, "/"), path))
        package = os.path.join(APP, "package.json")
        main = "index.js"
        try:
            with open(package, encoding="utf-8") as handle:
                main = json.load(handle).get("main") or "index.js"
        except (OSError, ValueError, AttributeError):
            main = None
        if main and os.path.isfile(os.path.join(APP, main)):
            return items
        say("The game has no Electron start script of its own, so NestPatcher adds a small one.")
        items = [item for item in items if item[0] != "app/package.json"]
    else:
        items = []
        if RESOURCES:
            for dirpath, dirnames, filenames in os.walk(RESOURCES):
                rel_dir = os.path.relpath(dirpath, RESOURCES)
                if rel_dir == ".":
                    dirnames[:] = [d for d in dirnames if d == "app"]
                    filenames = []
                for name in filenames:
                    path = os.path.join(dirpath, name)
                    rel = os.path.relpath(path, RESOURCES).replace(os.sep, "/")
                    if rel != "app/package.json":
                        items.append((rel, path))
        else:
            for dirpath, dirnames, filenames in os.walk(APP):
                for name in filenames:
                    path = os.path.join(dirpath, name)
                    items.append(("app/" + os.path.relpath(path, APP).replace(os.sep, "/"), path))
    version = plain_version(game_version()) or "1.0.0"
    package = {"name": "tits-nestpatched", "productName": EXPORT_NAME, "version": version,
               "description": EXPORT_TITLE + ", patched by NestPatcher", "main": "nest-electron-main.js"}
    items.append(("app/package.json", (json.dumps(package, indent=2) + "\n").encode()))
    items.append(("app/nest-electron-main.js", SHELL_MAIN.encode()))
    return items


def warn_native_modules(items):
    native = [rel for rel, _ in items if rel.endswith(".node")]
    if native:
        say("WARNING: the game has compiled add-ons that only work on the system they were built for:")
        for rel in native[:5]:
            say("  " + rel)
        say("If the exported game will not start, export again with --simple-shell.")


def read_item(source):
    if isinstance(source, bytes):
        return source
    with open(source, "rb") as handle:
        return handle.read()


# ---------- macOS ----------

def mac_rename(rel, name):
    """Electron.app paths -> renamed paths, the way electron-packager does it."""
    if rel == "Contents/MacOS/Electron":
        return "Contents/MacOS/" + name
    prefix = "Contents/Frameworks/Electron Helper"
    if rel.startswith(prefix):
        return "/".join(part.replace("Electron Helper", name + " Helper", 1) if part.startswith("Electron Helper")
                        else part for part in rel.split("/"))
    return rel


def mac_plist(data, name, version, icon_file, helper=False):
    info = plistlib.loads(data)
    if helper:
        for key in ("CFBundleName", "CFBundleDisplayName", "CFBundleExecutable"):
            if isinstance(info.get(key), str):
                info[key] = info[key].replace("Electron Helper", name + " Helper", 1)
        if isinstance(info.get("CFBundleIdentifier"), str):
            info["CFBundleIdentifier"] = info["CFBundleIdentifier"].replace("com.github.Electron", BUNDLE_ID, 1)
    else:
        info.update({"CFBundleName": name, "CFBundleDisplayName": name, "CFBundleExecutable": name,
                     "CFBundleIdentifier": BUNDLE_ID,
                     "LSApplicationCategoryType": "public.app-category.role-playing-games",
                     "NSHumanReadableCopyright": EXPORT_TITLE + ", patched by NestPatcher (" + CREDIT + ")"})
        if version:
            info["CFBundleShortVersionString"] = info["CFBundleVersion"] = version
        if icon_file:
            info["CFBundleIconFile"] = icon_file
        info.pop("ElectronAsarIntegrity", None)
    return plistlib.dumps(info, fmt=plistlib.FMT_XML)


def zip_entry(name, mode, date_time=(2026, 1, 1, 0, 0, 0)):
    info = zipfile.ZipInfo(name, date_time=date_time)
    info.create_system = 3
    info.external_attr = (mode & 0xFFFF) << 16
    if stat.S_ISDIR(mode):
        info.external_attr |= 0x10
    info.compress_type = zipfile.ZIP_STORED if stat.S_ISLNK(mode) or stat.S_ISDIR(mode) else zipfile.ZIP_DEFLATED
    return info


def zip_existing_app(out, app_root, top):
    """Copy a ready TiTS.app into the zip as-is (symlinks kept, backups left out)."""
    for dirpath, dirnames, filenames in os.walk(app_root):
        dirnames.sort()
        keep = []
        for dirname in dirnames:
            path = os.path.join(dirpath, dirname)
            if dirname in BACKUP_NAMES:
                continue
            if os.path.islink(path):
                filenames.append(dirname)
            else:
                keep.append(dirname)
        dirnames[:] = keep
        rel_dir = os.path.relpath(dirpath, app_root).replace(os.sep, "/")
        base = top + ("" if rel_dir == "." else rel_dir + "/")
        out.writestr(zip_entry(base, stat.S_IFDIR | 0o755), b"")
        for filename in sorted(filenames):
            if filename in BACKUP_NAMES:
                continue
            path = os.path.join(dirpath, filename)
            if os.path.islink(path):
                out.writestr(zip_entry(base + filename, stat.S_IFLNK | 0o755), os.readlink(path).encode())
            elif os.path.isfile(path):
                mode = os.stat(path).st_mode
                with open(path, "rb") as source, out.open(zip_entry(base + filename, mode), "w", force_zip64=True) as dest:
                    shutil.copyfileobj(source, dest, 1 << 20)


def mac_readme(name, folder_name):
    return ("""How to open """ + name + """.app (patched by NestPatcher)
================================================

1. Double-click this zip on your Mac to unzip it. Move """ + name + """.app wherever you like
   (for example your Applications folder).
2. Open Terminal (Applications > Utilities > Terminal) and type these two lines.
   Type "cd ", then drag the folder that holds """ + name + """.app into the window and press Enter first.

       xattr -cr """ + name + """.app
       codesign --force --deep --sign - """ + name + """.app

   (If codesign is missing, run  xcode-select --install  once, then try again.)
3. Double-click """ + name + """.app. If macOS still says it can't check the app,
   right-click it, choose Open, then Open again.

Why: NestPatcher changed the game files, so the app no longer matches the
signature it came with. Those two lines remove the "downloaded" flag and give
the app a fresh local signature, which is all macOS needs to run it.

Your saves are kept inside the game. They are not shared with the Windows game,
so use the game's own Save to File / Load from File to move a save across.

Made by NestPatcher """ + TOOL_VERSION + """ (""" + CREDIT + """)
Electron (the program around the game) is MIT licensed.
""")


def export_mac(out=None, arch=None, version=None, electron_zip_path=None, icon=None, simple_shell=False):
    """Write <name>_v<game>_NestPatched_macOS-<arch>.zip (and on a Mac, the unpacked, signed .app)."""
    problem = export_preflight()
    if problem:
        say(problem)
        return 1
    kind = source_kind()
    game_ver = plain_version(game_version())
    reuse = kind == "mac" and not version and not electron_zip_path and not simple_shell
    arch = arch or (host_arch() if PLATFORM == "mac" else "x64")
    folder_name = EXPORT_NAME + "_v" + (game_ver or "unknown") + "_NestPatched_macOS" + ("" if reuse else "-" + arch)
    out_dir = export_folder(out)
    target = os.path.join(out_dir, folder_name + ".zip")
    part = target + ".part"
    name = EXPORT_NAME
    say("Making a macOS app from: " + GAME)
    try:
        with zipfile.ZipFile(part, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as out_zip:
            out_zip.writestr(zip_entry(folder_name + "/", stat.S_IFDIR | 0o755), b"")
            top = folder_name + "/" + name + ".app/"
            if reuse:
                say("This is already a Mac game, so its own Electron is kept.")
                zip_existing_app(out_zip, GAME, top)
            else:
                version = pick_electron(version, electron_zip_path)
                say("Electron " + version + " for macOS " + arch + ("" if arch == "x64" else " (Apple Silicon)"))
                source = electron_zip(version, "darwin", arch, electron_zip_path)
                if not source:
                    raise RuntimeError("")
                items = payload(simple_shell)
                warn_native_modules(items)
                icon_data = find_icon(icon)
                icns = None
                if icon_data and icon_data[0] == "icns":
                    icns = icon_data[1]
                elif icon_data and icon_data[0] == "png":
                    icns = icns_from_png(icon_data[1])
                    if not icns:
                        say("The game's icon is not a square 16-1024 px PNG, so the app keeps Electron's icon.")
                icon_file = name + ".icns" if icns else ""
                with zipfile.ZipFile(source) as electron:
                    if not any(n.startswith("Electron.app/Contents/MacOS/") for n in electron.namelist()):
                        say("STOP: that Electron zip has no Electron.app inside, so it is not a macOS Electron.")
                        raise RuntimeError("")
                    for info in electron.infolist():
                        entry = info.filename
                        if not entry.startswith("Electron.app/"):
                            if entry in ("LICENSE", "LICENSES.chromium.html"):
                                out_zip.writestr(zip_entry(folder_name + "/licenses/Electron-" + entry, 0o100644),
                                                 electron.read(info))
                            continue
                        rel = entry[len("Electron.app/"):]
                        if rel == "Contents/Resources/default_app.asar":
                            continue
                        if rel == "Contents/Resources/electron.icns" and icns:
                            continue
                        mode = info.external_attr >> 16 or (0o40755 if entry.endswith("/") else 0o100644)
                        new = top + mac_rename(rel, name)
                        is_helper_plist = rel.startswith("Contents/Frameworks/Electron Helper") and \
                            rel.endswith(".app/Contents/Info.plist")
                        if rel == "Contents/Info.plist" or is_helper_plist:
                            out_zip.writestr(zip_entry(new, mode),
                                             mac_plist(electron.read(info), name, game_ver, icon_file, is_helper_plist))
                        elif stat.S_ISLNK(mode) or stat.S_ISDIR(mode) or entry.endswith("/"):
                            out_zip.writestr(zip_entry(new, mode), electron.read(info) if stat.S_ISLNK(mode) else b"")
                        else:
                            with electron.open(info) as reader, out_zip.open(zip_entry(new, mode), "w", force_zip64=True) as writer:
                                shutil.copyfileobj(reader, writer, 1 << 20)
                if icns:
                    out_zip.writestr(zip_entry(top + "Contents/Resources/" + icon_file, 0o100644), icns)
                for rel, source_item in items:
                    out_zip.writestr(zip_entry(top + "Contents/Resources/" + rel, 0o100644), read_item(source_item))
                say("Added " + str(len(items)) + " game files.")
            out_zip.writestr(zip_entry(folder_name + "/HOW-TO-OPEN.txt", 0o100644), mac_readme(name, folder_name))
        os.replace(part, target)
    except RuntimeError:
        if os.path.exists(part):
            os.remove(part)
        return 1
    except (OSError, zipfile.BadZipFile, ValueError) as exc:
        if os.path.exists(part):
            os.remove(part)
        say("STOP: could not make the Mac app: " + str(exc))
        return 1
    say("DONE: Mac app zip saved to " + target)
    if PLATFORM == "mac":
        unpack_and_sign_mac(target, out_dir, folder_name, name)
    else:
        say("Copy the zip to the Mac, unzip it, and follow HOW-TO-OPEN.txt inside (two Terminal lines).")
    return 0


def unpack_and_sign_mac(zip_path, out_dir, folder_name, name):
    folder = os.path.join(out_dir, folder_name)
    if os.path.isdir(folder):
        shutil.rmtree(folder)
    ditto = which_tool("ditto")
    if ditto:
        result = subprocess.run([ditto, "-x", "-k", zip_path, out_dir], capture_output=True, text=True)
        if result.returncode:
            say("WARNING: could not unzip the app: " + (result.stderr or result.stdout).strip())
            return
    else:
        with zipfile.ZipFile(zip_path) as archive:
            for info in archive.infolist():
                dest = os.path.join(out_dir, *info.filename.rstrip("/").split("/"))
                mode = info.external_attr >> 16
                if info.filename.endswith("/"):
                    os.makedirs(dest, exist_ok=True)
                elif stat.S_ISLNK(mode):
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    os.symlink(archive.read(info).decode(), dest)
                else:
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    with archive.open(info) as reader, open(dest, "wb") as writer:
                        shutil.copyfileobj(reader, writer, 1 << 20)
                    os.chmod(dest, (mode & 0o777) or 0o644)
    app = os.path.join(folder, name + ".app")
    sign_app(app)
    say("Your Mac app is ready: " + app)
    say("Drag it to Applications if you like, then double-click it.")


def sign_app(app):
    xattr = which_tool("xattr")
    if xattr:
        subprocess.run([xattr, "-cr", app], capture_output=True)
    codesign = which_tool("codesign")
    if not codesign:
        say("WARNING: codesign not found. Run  xcode-select --install  once, then:")
        say("  codesign --force --deep --sign - \"" + app + "\"")
        return
    result = subprocess.run([codesign, "--force", "--deep", "--sign", "-", app], capture_output=True, text=True)
    if result.returncode:
        say("WARNING: ad-hoc signing failed:\n" + (result.stderr or result.stdout).strip())
    else:
        say("Ad-hoc signed " + os.path.basename(app) + " so macOS will open it.")


# ---------- Linux AppImage ----------

APPRUN = """#!/bin/sh
# {title}, patched by NestPatcher and packed as an AppImage.
HERE="$(dirname "$(readlink -f "$0")")"
# Chromium's sandbox needs user namespaces. Some systems (Ubuntu 24.04+, hardened
# kernels) turn them off for unpacked programs, and Electron then refuses to start.
# In that case start without the sandbox. NEST_NO_SANDBOX=1 forces it.
# Electron also refuses to run as root with the sandbox on.
if [ -n "$NEST_NO_SANDBOX" ] || [ "$(id -u)" = "0" ] \\
   || [ "$(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>/dev/null)" = "1" ] \\
   || [ "$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null)" = "0" ]; then
  set -- --no-sandbox "$@"
fi
exec "$HERE/{binary}" "$@"
"""

DESKTOP = """[Desktop Entry]
Type=Application
Name={title} (NestPatched)
Comment={title}, patched by NestPatcher
Exec={binary}
Icon={icon}
Terminal=false
Categories=Game;RolePlaying;
"""


def squashfs_hint():
    family = distro_family() if PLATFORM == "linux" else ""
    if PLATFORM == "mac":
        return "brew install squashfs"
    if family == "fedora":
        return "sudo dnf install squashfs-tools"
    if family == "arch":
        return "sudo pacman -S squashfs-tools"
    return "sudo apt install squashfs-tools"


def copy_tree(source, dest, skip=()):
    shutil.copytree(source, dest, symlinks=True,
                    ignore=lambda folder, names: [n for n in names if n in skip])


def export_appimage(out=None, arch=None, version=None, electron_zip_path=None, icon=None,
                    simple_shell=False, runtime=None):
    """Write <name>_v<game>_NestPatched-<arch>.AppImage next to the patcher (NestExports/)."""
    problem = export_preflight()
    if problem:
        say(problem)
        return 1
    # NESTPATCHER_BUILTIN_SQUASHFS=1 uses the built-in packer even when mksquashfs is there (tests).
    mksquashfs = None if os.environ.get("NESTPATCHER_BUILTIN_SQUASHFS") else which_tool("mksquashfs")
    if not mksquashfs:
        say("mksquashfs is not installed, so NestPatcher's own packer is used (slower, same result).")
    kind = source_kind()
    game_ver = plain_version(game_version())
    reuse = kind in ("linux", "appdir") and not version and not electron_zip_path and not simple_shell
    if reuse:
        own = linux_game_binary(GAME)
        found = elf_arch(os.path.join(GAME, own)) if own else ""
        if arch and found and arch != found:
            say("Note: the game's own Electron is " + found + ", so the AppImage is " + found + " (not " + arch + ").")
        arch = found or arch or host_arch()
    arch = arch or host_arch()
    machine = APPIMAGE_ARCH[arch]
    out_dir = export_folder(out)
    target = os.path.join(out_dir, EXPORT_NAME + "_v" + (game_ver or "unknown") + "_NestPatched-" + machine + ".AppImage")
    # Shared storage on Android (and Windows folders) can't hold symlinks or
    # program permissions, so build the AppDir in the private temp folder there.
    private = PLATFORM in ("android", "windows") or bool(os.environ.get("ANDROID_ROOT"))
    work = tempfile.mkdtemp(prefix="nest-appdir-", dir=None if private else out_dir)
    appdir = os.path.join(work, "AppDir")
    binary = EXPORT_NAME
    say("Making an AppImage from: " + GAME)
    try:
        runtime_path = appimage_runtime(machine, runtime)
        if not runtime_path:
            say("STOP: could not get the AppImage runtime (" + RUNTIME_URL.format(arch=machine) + ").")
            say("Check your internet connection, or download that file yourself and use --appimage-runtime FILE.")
            return 1
        icon_data = find_icon(icon)
        if kind == "appdir" and reuse:
            say("This is an unpacked AppImage, so it is packed again as it is.")
            copy_tree(GAME, appdir, skip=BACKUP_NAMES)
            desktop = [n for n in os.listdir(appdir) if n.endswith(".desktop")]
            if not desktop:
                inner = linux_game_binary(appdir) or binary
                write_desktop(appdir, inner, icon_data)
        else:
            if reuse:
                binary = linux_game_binary(GAME)
                say("This is already a Linux game, so its own Electron is kept (" + binary + ").")
                copy_tree(GAME, appdir, skip=BACKUP_NAMES)
            else:
                version = pick_electron(version, electron_zip_path)
                say("Electron " + version + " for Linux " + arch)
                source = electron_zip(version, "linux", arch, electron_zip_path)
                if not source:
                    return 1
                items = payload(simple_shell)
                warn_native_modules(items)
                inner = appdir
                with zipfile.ZipFile(source) as electron:
                    if "electron" not in electron.namelist():
                        say("STOP: that Electron zip has no 'electron' program inside, so it is not a Linux Electron.")
                        return 1
                    for info in electron.infolist():
                        if info.filename.endswith("/") or info.filename == "resources/default_app.asar":
                            continue
                        rel = binary if info.filename == "electron" else info.filename
                        dest = os.path.join(inner, *rel.split("/"))
                        os.makedirs(os.path.dirname(dest), exist_ok=True)
                        mode = info.external_attr >> 16
                        if stat.S_ISLNK(mode):
                            os.symlink(electron.read(info).decode(), dest)
                            continue
                        with electron.open(info) as reader, open(dest, "wb") as writer:
                            shutil.copyfileobj(reader, writer, 1 << 20)
                        os.chmod(dest, (mode & 0o777) or (0o755 if rel == binary else 0o644))
                for rel, source_item in items:
                    dest = os.path.join(inner, "resources", *rel.split("/"))
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    if isinstance(source_item, bytes):
                        with open(dest, "wb") as handle:
                            handle.write(source_item)
                    else:
                        shutil.copyfile(source_item, dest)
                say("Added " + str(len(items)) + " game files.")
            with open(os.path.join(appdir, "AppRun"), "w", encoding="utf-8", newline="\n") as handle:
                handle.write(APPRUN.format(title=EXPORT_TITLE, binary=binary))
            os.chmod(os.path.join(appdir, "AppRun"), 0o755)
            write_desktop(appdir, binary, icon_data)
        open_permissions(appdir)
        squash = os.path.join(work, "game.squashfs")
        say("Packing (this takes a minute)...")
        if mksquashfs:
            result = subprocess.run([mksquashfs, appdir, squash, "-root-owned", "-noappend", "-comp", "gzip", "-quiet"],
                                    capture_output=True, text=True)
            if result.returncode:
                say("STOP: mksquashfs failed:\n" + (result.stderr or result.stdout).strip())
                return 1
        else:
            pack_squashfs(appdir, squash, executables={"AppRun", binary, "chrome-sandbox", "chrome_crashpad_handler"})
        part = target + ".part"
        with open(part, "wb") as dest:
            for piece in (runtime_path, squash):
                with open(piece, "rb") as source:
                    shutil.copyfileobj(source, dest, 1 << 20)
        os.chmod(part, 0o755)
        os.replace(part, target)
    except (OSError, zipfile.BadZipFile, ValueError) as exc:
        say("STOP: could not make the AppImage: " + str(exc))
        return 1
    finally:
        shutil.rmtree(work, ignore_errors=True)
    say("DONE: AppImage saved to " + target)
    say("Start it by double-clicking it, or from a terminal: \"" + target + "\"")
    say("If your file manager won't run it, right-click > Properties > allow running as a program.")
    return 0


def open_permissions(folder):
    """Everyone must be able to read the AppImage's files (it is mounted as root),
    whatever the user's umask was while it was built."""
    for dirpath, dirnames, filenames in os.walk(folder):
        os.chmod(dirpath, 0o755)
        for name in filenames:
            path = os.path.join(dirpath, name)
            if os.path.islink(path):
                continue
            mode = os.stat(path).st_mode
            os.chmod(path, 0o755 if mode & 0o100 else 0o644)


def write_desktop(appdir, binary, icon_data):
    icon_name = EXPORT_NAME.lower()
    if icon_data and icon_data[0] == "png":
        icon_path, data = icon_name + ".png", icon_data[1]
    elif icon_data and icon_data[0] == "svg":
        icon_path, data = icon_name + ".svg", icon_data[1]
    else:
        icon_path, data = icon_name + ".svg", FALLBACK_SVG.encode()
    for old in (icon_name + ".png", icon_name + ".svg", ".DirIcon"):
        if os.path.lexists(os.path.join(appdir, old)):
            os.remove(os.path.join(appdir, old))
    with open(os.path.join(appdir, icon_path), "wb") as handle:
        handle.write(data)
    try:
        os.symlink(icon_path, os.path.join(appdir, ".DirIcon"))
    except OSError:
        with open(os.path.join(appdir, ".DirIcon"), "wb") as handle:
            handle.write(data)
    with open(os.path.join(appdir, icon_name + ".desktop"), "w", encoding="utf-8", newline="\n") as handle:
        handle.write(DESKTOP.format(title=EXPORT_TITLE, binary=binary, icon=icon_name))


# ---------- built-in squashfs packer ----------
#
# Writes a SquashFS 4.0 image (gzip, 128 KiB blocks, no fragments, no xattrs,
# everything owned by root), which is what an AppImage's runtime mounts.
# Only used when mksquashfs is not installed (for example on Android).

SQUASH_BLOCK = 128 * 1024
SQUASH_META = 8192


class _MetaWriter:
    """Packs a metadata table (inodes or directories) into 8 KiB blocks."""

    def __init__(self):
        self.out = bytearray()
        self.pending = bytearray()

    def position(self):
        return len(self.out), len(self.pending)

    def write(self, data):
        self.pending += data
        while len(self.pending) >= SQUASH_META:
            self._flush(self.pending[:SQUASH_META])
            del self.pending[:SQUASH_META]

    def _flush(self, chunk):
        packed = zlib.compress(bytes(chunk), 9)
        if len(packed) < len(chunk):
            self.out += struct.pack("<H", len(packed)) + packed
        else:
            self.out += struct.pack("<H", len(chunk) | 0x8000) + chunk

    def finish(self):
        if self.pending:
            self._flush(self.pending)
            self.pending = bytearray()
        return bytes(self.out)


def pack_squashfs(source, dest, executables=(), mtime=1767225600):
    """Pack the folder source into a SquashFS image at dest. Files named in
    executables get mode 755 even when the folder lost its permissions."""
    entries = []                      # (path, kind, mode, parent index)

    def visit(path, parent):
        index = len(entries)
        entries.append([path, "dir", 0o755, parent])
        names = sorted(os.listdir(path), key=lambda n: n.encode("utf-8", "surrogateescape"))
        children = []
        for name in names:
            child = os.path.join(path, name)
            if os.path.islink(child):
                children.append(len(entries))
                entries.append([child, "link", 0o777, index])
            elif os.path.isdir(child):
                children.append(visit(child, index))
            elif os.path.isfile(child):
                mode = 0o755 if (name in executables or os.stat(child).st_mode & 0o111) else 0o644
                children.append(len(entries))
                entries.append([child, "file", mode, index])
        entries[index].append(children)
        return index

    visit(source, None)
    count = len(entries)
    number = {index: index + 1 for index in range(count)}     # inode numbers start at 1
    inodes, dirs = _MetaWriter(), _MetaWriter()
    refs = {}
    with open(dest, "wb") as out:
        out.write(b"\0" * 96)
        data_pos = 96
        # Post-order: children before their folder, so a folder can list its children's inodes.
        order = []

        def post(index):
            for child in entries[index][4] if entries[index][1] == "dir" else ():
                if entries[child][1] == "dir":
                    post(child)
                else:
                    order.append(child)
            order.append(index)
        post(0)
        for index in order:
            path, kind, mode, parent = entries[index][:4]
            block, offset = inodes.position()
            refs[index] = (block << 16) | offset
            head = lambda t: struct.pack("<HHHHII", t, mode, 0, 0, mtime, number[index])
            if kind == "file":
                start = data_pos
                sizes = []
                size = 0
                with open(path, "rb") as handle:
                    while True:
                        chunk = handle.read(SQUASH_BLOCK)
                        if not chunk:
                            break
                        size += len(chunk)
                        packed = zlib.compress(chunk, 6)
                        if len(packed) < len(chunk):
                            out.write(packed)
                            sizes.append(len(packed))
                        else:
                            out.write(chunk)
                            sizes.append(len(chunk) | 0x1000000)
                        data_pos += sizes[-1] & 0xFFFFFF
                if size >= 1 << 32 or start >= 1 << 32:
                    raise ValueError("file too big for the built-in packer: " + path)
                inodes.write(head(2) + struct.pack("<IIII", start, 0xFFFFFFFF, 0, size)
                             + b"".join(struct.pack("<I", s) for s in sizes))
            elif kind == "link":
                target = os.readlink(path).encode("utf-8", "surrogateescape")
                inodes.write(head(3) + struct.pack("<II", 1, len(target)) + target)
            else:
                children = entries[index][4]
                listing_block, listing_offset = dirs.position()
                listing = bytearray()
                run = []

                def flush_run():
                    if not run:
                        return
                    base_block = refs[run[0]] >> 16
                    base_number = number[run[0]]
                    listing.extend(struct.pack("<III", len(run) - 1, base_block, base_number))
                    for child in run:
                        name = os.path.basename(entries[child][0]).encode("utf-8", "surrogateescape")
                        ckind = {"dir": 1, "file": 2, "link": 3}[entries[child][1]]
                        listing.extend(struct.pack("<HhHH", refs[child] & 0xFFFF, number[child] - base_number,
                                                   ckind, len(name) - 1) + name)
                    del run[:]

                for child in children:
                    if run and (len(run) == 256 or refs[child] >> 16 != refs[run[0]] >> 16
                                or abs(number[child] - number[run[0]]) > 32767):
                        flush_run()
                    run.append(child)
                flush_run()
                dirs.write(bytes(listing))
                subdirs = sum(1 for child in children if entries[child][1] == "dir")
                parent_number = number[parent] if parent is not None else count + 1
                if len(listing) + 3 > 0xFFFF:
                    raise ValueError("folder too big for the built-in packer: " + path)
                inodes.write(head(1) + struct.pack("<IIHHI", listing_block, 2 + subdirs, len(listing) + 3,
                                                   listing_offset, parent_number))
        inode_table = inodes.finish()
        dir_table = dirs.finish()
        inode_start = data_pos
        out.write(inode_table)
        dir_start = inode_start + len(inode_table)
        out.write(dir_table)
        ids = _MetaWriter()
        ids.write(struct.pack("<I", 0))
        id_block_start = dir_start + len(dir_table)
        out.write(ids.finish())
        id_table_start = out.tell()
        out.write(struct.pack("<Q", id_block_start))
        used = out.tell()
        out.write(b"\0" * (-used % 4096))
        none = 0xFFFFFFFFFFFFFFFF
        out.seek(0)
        out.write(struct.pack("<IIIIIHHHHHHQQQQQQQQ", 0x73717368, count, mtime, SQUASH_BLOCK, 0, 1, 17,
                              0x0010 | 0x0200, 1, 4, 0, refs[0], used, id_table_start, none,
                              inode_start, dir_start, none, none))


def export_preflight():
    if not APP or not os.path.isfile(os.path.join(APP, "index.html")):
        if RESOURCES and os.path.isfile(os.path.join(RESOURCES, "app.asar")):
            return "STOP: the game is still packed as app.asar. Unpack it (--unpack-asar) and patch it first."
        return "STOP: no game files found at " + (APP or "(no game folder set)") + ". Pick the game folder first."
    if not (os.path.isdir(BACKUP) and os.listdir(BACKUP)):
        say("Note: this game has not been patched yet, so the export will have no mods in it.")
    elif not os.path.isfile(os.path.join(RUNTIME_DIR, RUNTIME_NAME)):
        say("Note: no NestPatcher files are in the game right now (all mods off?), so the export will be unmodded.")
    return ""


# --------------------------------------------------------------------------
# Command line
# --------------------------------------------------------------------------

import argparse

# What this patcher needs, for the NestPatcher Android app (read without running
# this file; see "NEST_NEEDS" in the Android app guide). Keep it when you edit or
# rename this file, or the app can't tell which folders to ask for.
NEST_NEEDS = [
    {"key": "game", "label": "Game folder", "check": "game", "flag": "--game",
     "default": "extracted/apk/assets/www",
     "help": "The unpacked game: the folder with index.html and main.<something>.js in it. "
             "A folder above it also works (an extracted APK, or a PC game folder with resources/app)."},
    {"key": "mods", "label": "Mods folder", "check": "mods", "flag": "--mods", "default": "mods",
     "help": "Holds enabled.txt and your .mod / .js files. On a PC this is the nestmods folder. "
             "Clean backups of the game files are kept in its backup folder."},
]

MENU = [
    ("Test my mods (dry run, changes nothing)", ["--dry-run"]),
    ("Patch the game with my mods", []),
    ("Turn all mods off (restore the original game files)", ["--restore"]),
    ("Make a bug report zip", ["--bug-report"]),
    ("Show the folders and tools in use", ["--show"]),
    ("Unpack app.asar (only if the patcher asked for it)", ["--unpack-asar"]),
    ("Make a macOS app (zip) from the patched game", ["--export-mac"]),
    ("Make a Linux AppImage from the patched game", ["--export-appimage"]),
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
    parser.add_argument("--export-mac", action="store_true", help="pack the patched game as a macOS TiTS.app (zip; on a Mac also unpacked and signed)")
    parser.add_argument("--export-appimage", action="store_true", help="pack the patched game as one Linux .AppImage file (uses mksquashfs if installed, else a built-in packer)")
    parser.add_argument("--out", metavar="FOLDER", help="with --export-*: where to save it (default: NestExports next to this script)")
    parser.add_argument("--arch", choices=["x64", "arm64"], help="with --export-*: x64 (Intel/AMD, the default off-Mac) or arm64 (Apple Silicon, ARM Linux)")
    parser.add_argument("--electron", metavar="VERSION", help="with --export-*: use this Electron version instead of the game's own")
    parser.add_argument("--electron-zip", metavar="FILE", help="with --export-*: an Electron zip you downloaded yourself (no internet needed)")
    parser.add_argument("--appimage-runtime", metavar="FILE", help="with --export-appimage: an AppImage runtime file you downloaded yourself")
    parser.add_argument("--icon", metavar="FILE", help="with --export-*: a .png (square), .icns or .svg icon instead of the game's")
    parser.add_argument("--simple-shell", action="store_true", help="with --export-*: start the game with NestPatcher's small starter instead of the game's own")
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
    if args.export_mac or args.export_appimage:
        options = dict(out=args.out, arch=args.arch, version=args.electron,
                       electron_zip_path=args.electron_zip, icon=args.icon, simple_shell=args.simple_shell)
        result = 0
        if args.export_mac:
            result = export_mac(**options)
        if args.export_appimage and result == 0:
            result = export_appimage(runtime=args.appimage_runtime, **options)
        return result
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
