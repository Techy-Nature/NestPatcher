"""Runs a NestPatcher .py script inside the Android app.

Android has no Node.js, so the patcher's `node --check` step is swapped for a
check done by the phone's own JavaScript engine (Chromium, through a hidden
WebView); `checker.check(path)` returns "" when the file parses, or the error.
Everything else in the patcher script runs unchanged.

Also used by tests/test_android_harness.py on a PC, with a Node-based checker.
"""
import os
import sys
import inspect
import shutil
import tempfile
import threading
import traceback

NODE_STANDIN = "phone-javascript-engine"

class _ShutilWithNode(object):
    """shutil, except which('node') answers with the phone's JavaScript checker."""

    def __getattr__(self, name):
        return getattr(shutil, name)

    def which(self, name, *args, **kwargs):
        if name in ("node", "nodejs"):
            return NODE_STANDIN
        return shutil.which(name, *args, **kwargs)


class _LineWriter(object):
    """A stdout that hands each finished line to the app."""

    def __init__(self, sink):
        self.sink = sink
        self.buffer = ""
        self.lock = threading.Lock()

    def write(self, text):
        with self.lock:
            self.buffer += str(text)
            while "\n" in self.buffer:
                line, self.buffer = self.buffer.split("\n", 1)
                self.sink.line(line)
        return len(text)

    def flush(self):
        with self.lock:
            if self.buffer:
                self.sink.line(self.buffer)
                self.buffer = ""

    def isatty(self):
        return False


def _make_check_js(module, checker):
    def check_js(label, source, node=None):
        log = getattr(module, "log", print)
        fd, path = tempfile.mkstemp(prefix="nest-check-", suffix=".js")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as stream:
                stream.write(source)
            error = str(checker.check(path) or "")
        except Exception as exc:
            error = "checker failed: " + str(exc)
        finally:
            if os.path.exists(path):
                os.unlink(path)
        if error:
            log("INVALID JavaScript in " + label + ":\n" + error)
            return False
        log("VALID " + label)
        return True
    return check_js


def project_paths(project):
    www = os.path.join(project, "extracted", "apk", "assets", "www")
    mods = os.path.join(project, "mods")
    return www, mods


# ---------------------------------------------------------------- what each patcher needs
#
# Each patcher gets a list of "needs": the folders the app asks for before running it.
#   key:     name of the folder (also the key in the paths the app sends back)
#   label:   what the app calls it
#   help:    one or two sentences under the label
#   default: starting path, worked out from the TITS-Modding folder
#   flag:    command-line option the folder is passed with (cli scripts only)
#   check:   how "Check folders" tests it: android-project, game, mods, dir or file
#
# A custom .py can say what it needs with a top-level list, for example:
#   NEST_NEEDS = [
#       {"key": "game", "label": "Game folder", "flag": "--game", "check": "game"},
#       {"key": "mods", "label": "Mods folder", "flag": "--mods", "check": "mods"},
#   ]
# "default" there may be relative; it is joined to the TITS-Modding folder.

KIND_NAMES = {
    "android": "Android patcher",
    "cli": "command-line patcher (Linux/Windows)",
    "gui": "GUI patcher",
    "custom": "your own patcher",
}


def _read(script):
    try:
        with open(script, "r", encoding="utf-8") as handle:
            return handle.read()
    except OSError:
        return ""


def _declared_needs(source):
    """NEST_NEEDS from a script, read without running it. None if it has none."""
    import ast
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return None
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, "id", None) == "NEST_NEEDS" for t in node.targets):
            try:
                value = ast.literal_eval(node.value)
            except ValueError:
                return None
            if isinstance(value, (list, tuple)):
                return [dict(item) for item in value if isinstance(item, dict) and item.get("key")]
    return None


def kind_of_source(source):
    """Work out what sort of patcher a script is from its text, without running it."""
    if _declared_needs(source) is not None:
        return "custom"
    if "def gui_main" in source:
        return "gui"
    if "def set_game" in source and "def configure" in source:
        return "cli"
    if "PROJECT =" in source and '"extracted"' in source:
        return "android"
    return "custom"


def needs_for(script, base):
    """(kind, list of needs) for a script, with defaults filled in from the TITS-Modding folder."""
    base = (base or "").rstrip("/")
    source = _read(script)
    kind = kind_of_source(source)
    www, mods = project_paths(base)
    if kind == "android":
        needs = [{
            "key": "project", "label": "Your TITS-Modding folder", "check": "android-project",
            "default": base,
            "help": "The Android patcher works inside one folder. It needs extracted/apk/assets/www "
                    "(the unpacked game) and mods (enabled.txt plus your .mod / .js files) in it."}]
    elif kind in ("cli", "gui"):
        needs = [
            {"key": "game", "label": "Game folder", "check": "game", "default": www,
             "flag": "--game" if kind == "cli" else "",
             "help": "The unpacked game: the folder with index.html and main.<something>.js in it. "
                     "A folder above it also works (an extracted APK, or a PC game folder with resources/app)."},
            {"key": "mods", "label": "Mods folder", "check": "mods", "default": mods,
             "flag": "--mods" if kind == "cli" else "",
             "help": "Holds enabled.txt and your .mod / .js files. On a PC this is the nestmods folder. "
                     "Clean backups of the game files are kept in its backup folder."}]
    else:
        declared = _declared_needs(source)
        if declared:
            needs = []
            for item in declared:
                need = {"key": str(item["key"]), "label": str(item.get("label") or item["key"]),
                        "help": str(item.get("help") or ""), "flag": str(item.get("flag") or ""),
                        "check": str(item.get("check") or "dir")}
                default = str(item.get("default") or "")
                need["default"] = default if default.startswith("/") else (
                    os.path.join(base, default) if default else base)
                needs.append(need)
        else:
            needs = [{
                "key": "project", "label": "Working folder", "check": "dir", "default": base,
                "help": "This script doesn't list what it needs (see NEST_NEEDS in the Android app guide), "
                        "so it runs inside this folder. NESTPATCHER_HOME points here too."}]
    for need in needs:
        need.setdefault("flag", "")
    return kind, needs


def needs_json(script, base):
    """needs_for() as JSON, for the app."""
    import json
    kind, needs = needs_for(script, base)
    return json.dumps({"kind": kind, "kindName": KIND_NAMES.get(kind, kind), "needs": needs})


def _game_web_folder(path):
    """The folder with index.html that the engine would patch, or None."""
    for inner in (path, os.path.join(path, "www"), os.path.join(path, "assets", "www"),
                  os.path.join(path, "extracted", "apk", "assets", "www"),
                  os.path.join(path, "resources", "app"), os.path.join(path, "app")):
        if os.path.isfile(os.path.join(inner, "index.html")):
            return inner
    return None


def check_need(need, path):
    """Lines saying whether one folder has what its patcher needs."""
    label = need.get("label") or need.get("key")
    check = need.get("check") or "dir"
    if not path:
        return ["MISSING " + label + ": no folder chosen"]
    if check == "android-project":
        www, mods = project_paths(path)
        return [("OK  " if os.path.isfile(os.path.join(www, "index.html")) else "MISSING ") + "game files: " + www,
                ("OK  " if os.path.isdir(mods) else "MISSING ") + "mods folder: " + mods,
                ("OK  " if os.path.isfile(os.path.join(mods, "enabled.txt")) else "no ") + "enabled.txt"]
    if check == "game":
        web = _game_web_folder(path)
        if web:
            return ["OK  " + label + ": game files in " + web]
        if os.path.isfile(os.path.join(path, "resources", "app.asar")):
            return ["OK  " + label + ": packed game (app.asar). Add --unpack-asar to Extra options the first time."]
        return ["MISSING " + label + ": no index.html in " + path + " or the usual folders under it"]
    if check == "mods":
        if not os.path.isdir(path):
            return ["MISSING " + label + ": " + path]
        return ["OK  " + label + ": " + path,
                ("OK  " if os.path.isfile(os.path.join(path, "enabled.txt")) else "no ") + "enabled.txt"]
    if check == "file":
        return [("OK  " if os.path.isfile(path) else "MISSING ") + label + ": " + path]
    return [("OK  " if os.path.isdir(path) else "MISSING ") + label + ": " + path]


def _parse_paths(paths):
    """The app sends {key: path} as JSON; tests and older callers send one project folder."""
    import json
    if isinstance(paths, dict):
        return dict(paths)
    text = str(paths or "")
    if text.strip().startswith("{"):
        return {str(k): str(v).rstrip("/") for k, v in json.loads(text).items()}
    return {"project": text.rstrip("/")}


def _fill_paths(kind, needs, paths):
    """Fill in anything the caller left out from the needs' defaults (and a lone project folder)."""
    project = paths.get("project", "")
    if project and kind in ("cli", "gui"):
        www, mods = project_paths(project)
        paths.setdefault("game", www)
        paths.setdefault("mods", mods)
    for need in needs:
        paths.setdefault(need["key"], need.get("default", ""))
    return paths


def describe_paths(script, paths):
    """Check every folder the chosen patcher needs. One line per finding."""
    paths = _parse_paths(paths)
    kind, needs = needs_for(script, paths.get("project") or next(iter(paths.values()), ""))
    paths = _fill_paths(kind, needs, paths)
    lines = []
    for need in needs:
        lines += check_need(need, paths.get(need["key"], ""))
    return "\n".join(lines)


def describe(project):
    """Check a TITS-Modding folder for the Android patcher (kept for older callers)."""
    return "\n".join(check_need({"label": "TITS-Modding folder", "check": "android-project"}, project))


def _home_for(kind, paths):
    """The folder the patcher treats as its own: settings, logs and backups stay with the user's files."""
    if kind in ("cli", "gui") and paths.get("mods"):
        return os.path.dirname(paths["mods"].rstrip("/")) or paths["mods"]
    return paths.get("project") or next(iter(paths.values()), "")


def load(script, project, checker):
    """Execute the patcher file as a module (without running its main) and patch in the checker.

    The module believes it lives in PROJECT/NestPatcher-app/, which is where the
    Android patcher expects to sit (it finds the project from its own location)."""
    with open(script, "r", encoding="utf-8") as handle:
        source = handle.read()
    name = "nestpatcher_run"
    module = type(sys)(name)
    where = os.path.join(project, "NestPatcher-app", os.path.basename(script))
    module.__file__ = where
    sys.modules[name] = module
    exec(compile(source, where, "exec"), module.__dict__)
    module.shutil = _ShutilWithNode()
    if hasattr(module, "check_js"):
        module.check_js = _make_check_js(module, checker)
    return module


def guess_kind(module):
    """gui: the browser GUI. cli: the shared-engine Windows/Linux scripts.
    android: the Android script. custom: anything else with or without main()."""
    if hasattr(module, "gui_main"):
        return "gui"
    if hasattr(module, "configure") and hasattr(module, "set_game"):
        return "cli"
    if hasattr(module, "PROJECT") and hasattr(module, "main"):
        return "android"
    return "custom"


def build_argv(kind, paths, extra, needs=None):
    if not isinstance(paths, dict):
        paths = _fill_paths(kind, needs or [], {"project": paths})
    argv = [a for a in (extra or "").split() if a]
    if kind == "cli":
        argv = ["--game", paths["game"], "--mods", paths["mods"]] + argv
    elif kind == "gui":
        argv = ["--no-browser", "--port=8765"] + argv
    elif needs:
        flagged = []
        for need in needs:
            if need.get("flag") and paths.get(need["key"]):
                flagged += [need["flag"], paths[need["key"]]]
        argv = flagged + argv
    return argv


def run(script, paths, kind, extra, checker, sink):
    """Run a patcher. Returns its exit code. Output goes to sink.line(text).
    paths is {key: folder} as JSON (from the app) or one TITS-Modding folder.
    kind "auto" works out what sort of patcher the file is."""
    writer = _LineWriter(sink)
    old_out, old_err, old_argv = sys.stdout, sys.stderr, sys.argv
    old_cwd = os.getcwd()
    sys.stdout = sys.stderr = writer
    code = 1
    try:
        paths = _parse_paths(paths)
        found_kind, needs = needs_for(script, paths.get("project") or next(iter(paths.values()), ""))
        if kind in (None, "", "auto"):
            kind = found_kind
        paths = _fill_paths(kind, needs, paths)
        home = _home_for(kind, paths)
        os.environ["NESTPATCHER_HOME"] = home
        if kind == "custom" and os.path.isdir(home):
            os.chdir(home)
        module = load(script, home, checker)
        sink.line("[NestPatcher app: running " + os.path.basename(script) + " as " + kind + "]")
        argv = build_argv(kind, paths, extra, needs)
        sys.argv = [os.path.basename(script)] + argv
        if kind == "gui":
            module.configure(paths["game"], paths["mods"], remember=True, interactive=False)
            main = module.gui_main
        else:
            main = getattr(module, "main", None)
        if main is None:
            # A custom script without main(): run it like `python script.py`.
            import runpy
            runpy.run_path(script, run_name="__main__")
            code = 0
        else:
            # Engine-based scripts take argv; the Android and Mac scripts read sys.argv.
            takes_argv = bool(inspect.signature(main).parameters) and kind != "gui"
            code = main(argv) if takes_argv else main()
            code = 0 if code is None else int(code)
    except SystemExit as exc:
        code = exc.code if isinstance(exc.code, int) else (0 if exc.code is None else 1)
    except Exception:
        print("CRASH inside the patcher:\n" + traceback.format_exc())
        code = 1
    finally:
        writer.flush()
        sys.stdout, sys.stderr, sys.argv = old_out, old_err, old_argv
        try:
            os.chdir(old_cwd)
        except OSError:
            pass
    return code
