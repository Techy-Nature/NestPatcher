

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
