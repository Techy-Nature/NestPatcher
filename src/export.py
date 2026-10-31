
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
# so it can be made on Windows and Linux too. It is ad-hoc signed by the
# built-in signer below; on a Mac it is also unpacked and signed by codesign. The AppImage is packed with mksquashfs when it is
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
    folder = os.path.abspath(os.path.expanduser(out)) if out else os.path.join(MODS, "NestExports")
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
    """helper is False, or the helper app's new name (e.g. "TiTS Helper (GPU)")."""
    info = plistlib.loads(data)
    if helper:
        for key in ("CFBundleName", "CFBundleDisplayName", "CFBundleExecutable"):
            if isinstance(info.get(key), str):
                info[key] = info[key].replace("Electron Helper", name + " Helper", 1)
        if isinstance(helper, str):
            # Electron's helpers leave these out; macOS then guesses from the folder name.
            info.setdefault("CFBundleExecutable", helper)
            info.setdefault("CFBundleName", helper)
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


def mac_opener(name):
    """The double-click opener next to the app (Terminal runs .command files)."""
    return ("""#!/bin/bash
# Double-click this file to open """ + name + """ (patched by NestPatcher).
# It clears the "downloaded from the internet" flag on """ + name + """.app, which
# macOS puts on everything that came in a zip, and then opens the game.
cd "$(dirname "$0")" || exit 1
APP=\"""" + name + """.app"
[ -d "$APP" ] || APP="/Applications/""" + name + """.app"
if [ ! -d "$APP" ]; then
  echo "Can't find """ + name + """.app. Keep this file in the same folder as """ + name + """.app."
  read -r -p "Press Enter to close." _
  exit 1
fi
xattr -cr "$APP" 2>/dev/null
# NestPatcher already signed the app. If macOS disagrees, sign it again here.
if ! /usr/bin/codesign --verify --deep "$APP" >/dev/null 2>&1; then
  /usr/bin/codesign --force --deep --sign - "$APP" >/dev/null 2>&1
fi
open "$APP"
echo "Opening """ + name + """... You can close this window."
exit 0
""")


def mac_readme(name, folder_name, signed=True):
    return ("""How to open """ + name + """.app (patched by NestPatcher)
================================================

1. Double-click this zip on your Mac to unzip it.
2. Double-click "Open """ + name + """.command" (in the same folder as """ + name + """.app).
   The game opens. Next time you can double-click """ + name + """.app itself.

The first time only, macOS may say it can't check "Open """ + name + """.command":
   * macOS 15 or newer: click Done, open System Settings > Privacy & Security,
     scroll down and click "Open Anyway" next to it, then confirm.
   * older macOS: right-click the file, choose Open, then Open again.
That message comes from the zip being downloaded. Copying the zip with a USB
stick avoids it. Only apps signed with a paid Apple Developer ID skip it.

You can move """ + name + """.app to Applications. If you do, move
"Open """ + name + """.command" too, or keep it: it also finds the app there.
""" + ("" if signed else """
NestPatcher could not sign every part of this app. The opener signs it on the
Mac instead (that needs Apple's codesign tool, which macOS includes).
""") + """
If you'd rather use Terminal: cd into this folder, then run
       xattr -cr """ + name + """.app
       open """ + name + """.app

Your saves are kept inside the game. They are not shared with the Windows game,
so use the game's own Save to File / Load from File to move a save across.

Made by NestPatcher """ + TOOL_VERSION + """ (""" + CREDIT + """)
Electron (the program around the game) is MIT licensed.
""")


def stage_existing_app(tree, app_root, top):
    """Copy a ready TiTS.app into the staged tree (symlinks kept, backups left out)."""
    for dirpath, dirnames, filenames in os.walk(app_root):
        dirnames.sort()
        keep = []
        for dirname in dirnames:
            if dirname in BACKUP_NAMES:
                continue
            if os.path.islink(os.path.join(dirpath, dirname)):
                filenames.append(dirname)
            else:
                keep.append(dirname)
        dirnames[:] = keep
        rel_dir = os.path.relpath(dirpath, app_root).replace(os.sep, "/")
        base = top + ("" if rel_dir == "." else rel_dir + "/")
        tree.add_dir(base)
        for filename in sorted(filenames):
            if filename in BACKUP_NAMES:
                continue
            path = os.path.join(dirpath, filename)
            if os.path.islink(path):
                tree.add_link(base + filename, os.readlink(path))
            elif os.path.isfile(path):
                with open(path, "rb") as reader:
                    tree.add_file(base + filename, os.stat(path).st_mode, reader=reader)


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
    say("The Mac app zip will be saved in: " + out_dir)
    private = PLATFORM in ("android", "windows") or bool(os.environ.get("ANDROID_ROOT"))
    work = tempfile.mkdtemp(prefix="nest-macapp-", dir=None if private else out_dir)
    tree = StagedTree(work)
    app = name + ".app"
    signed = False
    try:
        if reuse:
            say("This is already a Mac game, so its own Electron is kept.")
            stage_existing_app(tree, GAME, app + "/")
            for rel in [r for r in tree.items if "/_CodeSignature/" in r]:
                del tree.items[rel]                   # old seals; new ones are made below
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
            licenses = {}
            with zipfile.ZipFile(source) as electron:
                if not any(n.startswith("Electron.app/Contents/MacOS/") for n in electron.namelist()):
                    say("STOP: that Electron zip has no Electron.app inside, so it is not a macOS Electron.")
                    raise RuntimeError("")
                for info in electron.infolist():
                    entry = info.filename
                    if not entry.startswith("Electron.app/"):
                        if entry in ("LICENSE", "LICENSES.chromium.html"):
                            licenses[entry] = electron.read(info)
                        continue
                    rel = entry[len("Electron.app/"):]
                    if not rel or rel == "Contents/Resources/default_app.asar" or "/_CodeSignature/" in "/" + rel:
                        continue
                    if rel == "Contents/Resources/electron.icns" and icns:
                        continue
                    mode = info.external_attr >> 16 or (0o40755 if entry.endswith("/") else 0o100644)
                    new = app + "/" + mac_rename(rel.rstrip("/"), name)
                    is_helper_plist = rel.startswith("Contents/Frameworks/Electron Helper") and \
                        rel.endswith(".app/Contents/Info.plist")
                    if rel == "Contents/Info.plist" or is_helper_plist:
                        helper = new.split("/Contents/Frameworks/", 1)[-1].split(".app/", 1)[0] \
                            if is_helper_plist else False
                        tree.add_file(new, mode, data=mac_plist(electron.read(info), name, game_ver, icon_file,
                                                                helper))
                    elif stat.S_ISLNK(mode):
                        tree.add_link(new, electron.read(info).decode("utf-8"))
                    elif stat.S_ISDIR(mode) or entry.endswith("/"):
                        tree.add_dir(new)
                    else:
                        with electron.open(info) as reader:
                            tree.add_file(new, mode, reader=reader)
            if icns:
                tree.add_file(app + "/Contents/Resources/" + icon_file, 0o644, data=icns)
            for rel, source_item in items:
                tree.add_file(app + "/Contents/Resources/" + rel, 0o644, data=read_item(source_item))
            say("Added " + str(len(items)) + " game files.")
        say("Signing the app (built-in ad-hoc signing)...")
        try:
            count = sign_tree(tree, app)
            signed = True
            say("Signed " + str(count) + " programs and libraries.")
        except (ValueError, KeyError, struct.error) as exc:
            say("WARNING: the built-in signing did not work (" + str(exc) + ").")
            say("The opener in the zip signs the app on the Mac instead.")
        with zipfile.ZipFile(part, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as out_zip:
            top = folder_name + "/"
            out_zip.writestr(zip_entry(top, stat.S_IFDIR | 0o755), b"")
            tree.write_zip(out_zip, top)
            for entry, data in sorted(licenses.items()) if not reuse else ():
                out_zip.writestr(zip_entry(top + "licenses/Electron-" + entry, 0o100644), data)
            out_zip.writestr(zip_entry(top + "Open " + name + ".command", 0o100755), mac_opener(name))
            out_zip.writestr(zip_entry(top + "HOW-TO-OPEN.txt", 0o100644), mac_readme(name, folder_name, signed))
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
    finally:
        shutil.rmtree(work, ignore_errors=True)
    say("DONE: Mac app zip saved to " + target)
    if PLATFORM == "mac":
        unpack_and_sign_mac(target, out_dir, folder_name, name)
    else:
        say("Copy the zip to the Mac and unzip it there. Then double-click \"Open " + name + ".command\".")
        say("(The first time, macOS may ask you to allow it: see HOW-TO-OPEN.txt.)")
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
    if os.environ.get("NESTPATCHER_NO_CODESIGN"):
        # Keep NestPatcher's own signature (used by the tests to check it on a real Mac).
        xattr = which_tool("xattr")
        if xattr:
            subprocess.run([xattr, "-cr", app], capture_output=True)
    else:
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


# ---------- built-in macOS signing (ad-hoc, pure Python) ----------
#
# macOS only runs an app whose code signature matches its files (Apple Silicon
# refuses unsigned code outright). Patching changes the files, so the export is
# signed again here, the same way `codesign --force --deep --sign -` would:
# every Mach-O program and library gets a fresh ad-hoc signature (SHA-256 page
# hashes in a CodeDirectory), and every .app / .framework gets a
# _CodeSignature/CodeResources file that seals its other files. This works on
# Windows, Linux and Android too, so no Mac command is needed afterwards.
# Ad-hoc means "signed, but by nobody in particular": macOS still asks once
# before opening an app that came from the internet, which only a paid Apple
# Developer ID with notarization avoids.

CS_MAGIC_SUPERBLOB = 0xFADE0CC0
CS_MAGIC_CODEDIRECTORY = 0xFADE0C02
CS_MAGIC_REQUIREMENTS = 0xFADE0C01
CS_MAGIC_BLOBWRAPPER = 0xFADE0B01
CS_PAGE = 4096
MH_MAGIC_64 = 0xFEEDFACF
FAT_MAGIC = 0xCAFEBABE
LC_SEGMENT_64 = 0x19
LC_CODE_SIGNATURE = 0x1D

RULES = {
    "^Resources/": True,
    "^Resources/.*\\.lproj/": {"optional": True, "weight": 1000.0},
    "^Resources/.*\\.lproj/locversion.plist$": {"omit": True, "weight": 1100.0},
    "^Resources/Base\\.lproj/": {"weight": 1010.0},
    "^version.plist$": True,
}
RULES2 = {
    ".*\\.dSYM($|/)": {"weight": 11.0},
    "^(.*/)?\\.DS_Store$": {"omit": True, "weight": 2000.0},
    "^(Frameworks|SharedFrameworks|PlugIns|Plug-ins|XPCServices|Helpers|MacOS|Library/(Automator|Spotlight|LoginItems))/":
        {"nested": True, "weight": 10.0},
    "^.*": True,
    "^Info\\.plist$": {"omit": True, "weight": 20.0},
    "^PkgInfo$": {"omit": True, "weight": 20.0},
    "^Resources/": {"weight": 20.0},
    "^Resources/.*\\.lproj/": {"optional": True, "weight": 1000.0},
    "^Resources/.*\\.lproj/locversion.plist$": {"omit": True, "weight": 1100.0},
    "^Resources/Base\\.lproj/": {"weight": 1010.0},
    "^[^/]+$": {"nested": True, "weight": 10.0},
    "^embedded\\.provisionprofile$": {"nested": True, "weight": 20.0},
    "^version\\.plist$": {"weight": 20.0},
}


def _rule_for(rules, rel):
    """The matching resource rule with the highest weight, as a dict."""
    best, best_weight = None, -1.0
    for pattern, rule in rules.items():
        if re.search(pattern, rel):
            rule = {} if rule is True else rule
            weight = float(rule.get("weight", 1.0))
            if weight > best_weight:
                best, best_weight = rule, weight
    return best


def macho_kind(path):
    """'thin', 'fat' or None (not a Mach-O file NestPatcher can sign)."""
    try:
        with open(path, "rb") as handle:
            head = handle.read(8)
    except OSError:
        return None
    if len(head) < 8:
        return None
    if struct.unpack("<I", head[:4])[0] == MH_MAGIC_64:
        return "thin"
    if struct.unpack(">I", head[:4])[0] == FAT_MAGIC and 0 < struct.unpack(">I", head[4:8])[0] < 16:
        return "fat"   # (Java class files share the magic but have a big second number)
    return None


def _round_up(value, step):
    return (value + step - 1) // step * step


def _sign_thin(handle, start, length, ident, info_hash, res_hash):
    """Sign the 64-bit Mach-O at [start, start+length) of an open r+b file.
    Returns (new length, cdhash). The old signature (if any) is replaced."""
    handle.seek(start)
    header = handle.read(32)
    magic, _cpu, _sub, filetype, ncmds, sizeofcmds, flags, _res = struct.unpack("<IiiIIIII", header)
    if magic != MH_MAGIC_64:
        raise ValueError("not a 64-bit Mach-O program")
    cmds = bytearray(handle.read(sizeofcmds))
    linkedit = text = signature = None
    first_section = length
    pos = 0
    for _ in range(ncmds):
        cmd, size = struct.unpack_from("<II", cmds, pos)
        if cmd == LC_SEGMENT_64:
            name = cmds[pos + 8:pos + 24].rstrip(b"\0")
            if name == b"__LINKEDIT":
                linkedit = pos
            elif name == b"__TEXT":
                text = pos
            nsects = struct.unpack_from("<I", cmds, pos + 64)[0]
            for index in range(nsects):
                offset = struct.unpack_from("<I", cmds, pos + 72 + index * 80 + 48)[0]
                if offset:
                    first_section = min(first_section, offset)
        elif cmd == LC_CODE_SIGNATURE:
            signature = pos
        pos += size
    if linkedit is None or text is None:
        raise ValueError("no __LINKEDIT/__TEXT segment")
    le_vmaddr, le_vmsize, le_fileoff, le_filesize = struct.unpack_from("<QQQQ", cmds, linkedit + 24)
    if signature is not None:
        sig_off = struct.unpack_from("<I", cmds, signature + 8)[0]
    else:
        # Room for one more load command before the first section?
        if 32 + sizeofcmds + 16 > first_section:
            raise ValueError("no room in the header for a signature")
        sig_off = _round_up(le_fileoff + le_filesize, 16)
        signature = len(cmds)
        cmds += struct.pack("<IIII", LC_CODE_SIGNATURE, 16, sig_off, 0)
        ncmds += 1
        sizeofcmds += 16
    text_fileoff, text_filesize = struct.unpack_from("<QQ", cmds, text + 40)
    ident_bytes = ident.encode("utf-8") + b"\0"
    n_special = 3 if res_hash else 2
    n_code = (sig_off + CS_PAGE - 1) // CS_PAGE
    cd_len = 88 + len(ident_bytes) + 32 * (n_special + n_code)
    requirements = struct.pack(">III", CS_MAGIC_REQUIREMENTS, 12, 0)
    cms = struct.pack(">II", CS_MAGIC_BLOBWRAPPER, 8)
    super_len = 12 + 8 * 3 + cd_len + len(requirements) + len(cms)
    datasize = _round_up(super_len, 16)
    struct.pack_into("<II", cmds, signature + 8, sig_off, datasize)
    new_filesize = sig_off + datasize - le_fileoff
    struct.pack_into("<QQQQ", cmds, linkedit + 24, le_vmaddr, max(le_vmsize, _round_up(new_filesize, 0x4000)),
                     le_fileoff, new_filesize)
    handle.seek(start)
    handle.write(struct.pack("<IiiIIIII", magic, _cpu, _sub, filetype, ncmds, sizeofcmds, flags, _res) + bytes(cmds))
    # Hash every 4 KiB page up to the signature.
    hashes = []
    handle.seek(start)
    remaining = sig_off
    while remaining > 0:
        page = handle.read(min(CS_PAGE, remaining))
        if len(page) < min(CS_PAGE, remaining):
            page += b"\0" * (min(CS_PAGE, remaining) - len(page))
        hashes.append(hashlib.sha256(page).digest())
        remaining -= len(page)
    special = [b"\0" * 32] * n_special            # slot 1 Info.plist, 2 requirements, 3 resources
    special[0] = info_hash or b"\0" * 32
    special[1] = hashlib.sha256(requirements).digest()
    if res_hash:
        special[2] = res_hash
    hash_offset = 88 + len(ident_bytes) + 32 * n_special
    exec_flags = 1 if filetype == 2 else 0       # MH_EXECUTE: main binary
    directory = struct.pack(">IIIIIIIIIBBBBIIIIQQQQ", CS_MAGIC_CODEDIRECTORY, cd_len, 0x20400, 0x2,
                            hash_offset, 88, n_special, n_code, sig_off, 32, 2, 0, 12, 0, 0, 0, 0, 0,
                            text_fileoff, text_filesize, exec_flags)
    directory += ident_bytes + b"".join(reversed(special)) + b"".join(hashes)
    assert len(directory) == cd_len
    blobs = [(0, directory), (2, requirements), (0x10000, cms)]
    offset = 12 + 8 * len(blobs)
    index = b""
    for slot, blob in blobs:
        index += struct.pack(">II", slot, offset)
        offset += len(blob)
    superblob = struct.pack(">III", CS_MAGIC_SUPERBLOB, super_len, len(blobs)) + index + b"".join(b for _, b in blobs)
    handle.seek(start + sig_off)
    handle.write(superblob + b"\0" * (datasize - super_len))
    return sig_off + datasize, hashlib.sha256(directory).digest()[:20]


def macho_sign(path, ident, info_hash=None, res_hash=None):
    """Ad-hoc sign a Mach-O file in place (thin or universal). Returns its cdhash."""
    kind = macho_kind(path)
    if kind == "thin":
        with open(path, "r+b") as handle:
            length = os.fstat(handle.fileno()).st_size
            new_length, cdhash = _sign_thin(handle, 0, length, ident, info_hash, res_hash)
            handle.truncate(new_length)
        return cdhash
    if kind != "fat":
        raise ValueError("not a Mach-O file")
    with open(path, "rb") as handle:
        count = struct.unpack(">II", handle.read(8))[1]
        arches = [list(struct.unpack(">iiIII", handle.read(20))) for _ in range(count)]
        slices = []
        for arch in arches:
            handle.seek(arch[2])
            slices.append(handle.read(arch[3]))
    cdhash = None
    work = path + ".nest-slice"
    signed = []
    try:
        for arch, data in zip(arches, slices):
            with open(work, "w+b") as handle:
                handle.write(data)
                new_length, slice_hash = _sign_thin(handle, 0, len(data), ident, info_hash, res_hash)
                handle.truncate(new_length)
                handle.seek(0)
                signed.append(handle.read())
            cdhash = cdhash or slice_hash
    finally:
        if os.path.exists(work):
            os.remove(work)
    offset = arches[0][2]
    with open(path, "wb") as handle:
        layout = []
        for arch, data in zip(arches, signed):
            offset = _round_up(offset, 1 << arch[4])
            layout.append((arch, offset, data))
            offset += len(data)
        handle.write(struct.pack(">II", FAT_MAGIC, count))
        for arch, where, data in layout:
            handle.write(struct.pack(">iiIII", arch[0], arch[1], where, len(data), arch[4]))
        for _arch, where, data in layout:
            handle.seek(where)
            handle.write(data)
    return cdhash


class StagedTree:
    """Files for an export, kept as numbered files in a work folder so symlinks
    and file modes survive on Windows and Android storage too."""

    def __init__(self, work):
        self.work = work
        self.items = {}        # rel -> ("file", mode, path) / ("link", mode, target) / ("dir", mode, None)
        self.count = 0

    def add_dir(self, rel, mode=0o40755):
        self.items[rel.rstrip("/")] = ("dir", mode, None)

    def add_link(self, rel, target):
        self.items[rel] = ("link", stat.S_IFLNK | 0o755, target)

    def add_file(self, rel, mode, data=None, reader=None):
        self.count += 1
        path = os.path.join(self.work, str(self.count))
        with open(path, "wb") as handle:
            if reader is not None:
                shutil.copyfileobj(reader, handle, 1 << 20)
            else:
                handle.write(data)
        self.items[rel] = ("file", stat.S_IFREG | (mode & 0o7777 or 0o644), path)
        return path

    def read(self, rel):
        kind, _mode, where = self.items[rel]
        with open(where, "rb") as handle:
            return handle.read()

    def dirs(self):
        found = {rel for rel, item in self.items.items() if item[0] == "dir"}
        for rel in self.items:
            parts = rel.split("/")
            for size in range(1, len(parts)):
                found.add("/".join(parts[:size]))
        return found

    def resolve(self, rel):
        """Follow symlinks inside the tree (e.g. Versions/Current -> A)."""
        parts = rel.split("/")
        done = []
        hops = 0
        while parts:
            done.append(parts.pop(0))
            item = self.items.get("/".join(done))
            if item and item[0] == "link":
                hops += 1
                if hops > 40:
                    raise ValueError("symlink loop at " + rel)
                target = item[2]
                base = done[:-1] if not target.startswith("/") else []
                parts = [p for p in "/".join(base + [target]).split("/") if p and p != "."] + parts
                cleaned = []
                for part in parts:
                    if part == "..":
                        cleaned.pop()
                    else:
                        cleaned.append(part)
                parts, done = cleaned, []
        return "/".join(done)

    def write_zip(self, out_zip, prefix):
        dirs = self.dirs()
        for rel in sorted(dirs):
            out_zip.writestr(zip_entry(prefix + rel + "/", stat.S_IFDIR | 0o755), b"")
        for rel in sorted(self.items):
            kind, mode, where = self.items[rel]
            if kind == "link":
                out_zip.writestr(zip_entry(prefix + rel, mode), where.encode())
            elif kind == "file":
                with open(where, "rb") as source, out_zip.open(zip_entry(prefix + rel, mode), "w", force_zip64=True) as dest:
                    shutil.copyfileobj(source, dest, 1 << 20)


def _bundle_base(tree, bundle):
    """The folder a bundle's signature lives in: Foo.app/Contents or Foo.framework/Versions/A."""
    if bundle.endswith(".framework"):
        current = bundle + "/Versions/Current"
        if current in tree.items:
            return tree.resolve(current)
        return bundle
    return bundle + "/Contents"


def _bundle_info(tree, bundle, base):
    plist = base + ("/Resources/Info.plist" if bundle.endswith(".framework") else "/Info.plist")
    if plist not in tree.items or tree.items[plist][0] != "file":
        return None, {}
    data = tree.read(plist)
    try:
        return data, plistlib.loads(data)
    except Exception:
        return data, {}


def sign_tree(tree, app):
    """Ad-hoc sign the .app at `app` inside the staged tree, nested code first.
    Returns the number of programs and libraries signed."""
    dirs = tree.dirs()
    bundles = sorted((d for d in dirs if (d == app or d.startswith(app + "/"))
                      and (d.endswith(".app") or d.endswith(".framework"))),
                     key=lambda d: (-_bundle_base(tree, d).count("/"), d))
    cdhashes = {}
    signed = [0]
    signed_files = set()

    def sign_loose(rel):
        kind, _mode, where = tree.items[rel]
        if rel in signed_files or not macho_kind(where):
            return cdhashes.get(rel)
        name = rel.rsplit("/", 1)[-1].split(".")[0] or rel.rsplit("/", 1)[-1]
        cdhashes[rel] = macho_sign(where, name)
        signed_files.add(rel)
        signed[0] += 1
        return cdhashes[rel]

    for bundle in bundles:
        base = _bundle_base(tree, bundle)
        info_data, info = _bundle_info(tree, bundle, base)
        executable = info.get("CFBundleExecutable") or bundle.rsplit("/", 1)[-1].rsplit(".", 1)[0]
        main = base + ("/" if bundle.endswith(".framework") else "/MacOS/") + executable
        inner = [b for b in bundles if b != bundle and b.startswith(base + "/")]

        def inside_inner(rel):
            return any(rel == b or rel.startswith(b + "/") for b in inner)

        files, files2 = {}, {}
        members = sorted(rel for rel in tree.items if rel.startswith(base + "/"))
        for rel in members:                    # loose programs and libraries first
            if tree.items[rel][0] == "file" and rel != main and not inside_inner(rel) \
                    and "/_CodeSignature/" not in rel:
                sign_loose(rel)
        for rel in members:
            sub = rel[len(base) + 1:]
            kind, _mode, where = tree.items[rel]
            if kind == "dir" or rel == main or inside_inner(rel) or sub.startswith("_CodeSignature/"):
                continue
            rule2 = _rule_for(RULES2, sub) or {}
            if rule2.get("omit"):
                continue
            if kind == "link":
                files2[sub] = {"symlink": where}
                continue
            if rule2.get("nested") and rel in cdhashes:
                files2[sub] = {"cdhash": cdhashes[rel], "requirement": 'cdhash H"' + cdhashes[rel].hex() + '"'}
                continue
            with open(where, "rb") as handle:
                data = handle.read()
            sha1, sha256 = hashlib.sha1(data).digest(), hashlib.sha256(data).digest()
            entry = {"hash": sha1, "hash2": sha256}
            if rule2.get("optional"):
                entry["optional"] = True
            files2[sub] = entry
            rule1 = _rule_for(RULES, sub)
            if rule1 is not None and not rule1.get("omit"):
                files[sub] = {"hash": sha1, "optional": True} if rule1.get("optional") else sha1
        for nested in inner:                   # each nested bundle, sealed by its cdhash
            if any(nested != other and nested.startswith(other + "/") for other in inner):
                continue
            sub = nested[len(base) + 1:]
            if nested in cdhashes:
                files2[sub] = {"cdhash": cdhashes[nested],
                               "requirement": 'cdhash H"' + cdhashes[nested].hex() + '"'}
        resources = plistlib.dumps({"files": files, "files2": files2, "rules": RULES, "rules2": RULES2},
                                   fmt=plistlib.FMT_XML)
        tree.add_file(base + "/_CodeSignature/CodeResources", 0o644, data=resources)
        if main not in tree.items or tree.items[main][0] != "file":
            raise ValueError("missing program " + main)
        ident = info.get("CFBundleIdentifier") or executable
        cdhashes[bundle] = macho_sign(tree.items[main][2], ident,
                                      hashlib.sha256(info_data).digest() if info_data else None,
                                      hashlib.sha256(resources).digest())
        cdhashes[main] = cdhashes[bundle]
        signed_files.add(main)
        signed[0] += 1
    return signed[0]


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
    """Write <name>_v<game>_NestPatched-<arch>.AppImage in the mods folder (mods/NestExports/)."""
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
    say("The AppImage will be saved in: " + out_dir)
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
            pack_squashfs(appdir, squash, executables={"AppRun", binary, "chrome-sandbox", "chrome_crashpad_handler"}, report=say)
        part = target + ".part"
        with open(part, "wb") as dest:
            for piece in (runtime_path, squash):
                with open(piece, "rb") as source:
                    shutil.copyfileobj(source, dest, 1 << 20)
        try:
            os.chmod(part, 0o755)
        except OSError:
            # Android's shared storage doesn't keep file modes; chmod +x it on the PC.
            say("Note: this folder can't mark the AppImage as runnable. After copying it to the PC, run: chmod +x on it.")
        os.replace(part, target)
    except (OSError, zipfile.BadZipFile, ValueError, MemoryError) as exc:
        say("STOP: could not make the AppImage: " + str(exc))
        if os.path.exists(target + ".part"):
            os.remove(target + ".part")
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


def pack_squashfs(source, dest, executables=(), mtime=1767225600, report=None):
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
        read_total, next_report = 0, 25 << 20
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
                        read_total += len(chunk)
                        if report and read_total >= next_report:
                            report("  packed " + str(read_total >> 20) + " MB...")
                            next_report += 25 << 20
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
