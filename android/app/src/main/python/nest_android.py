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

# What each patcher needs on its command line to find the project's files.
#   android: the script finds PROJECT/extracted/apk/assets/www and PROJECT/mods by
#            itself, from where it thinks it lives (PROJECT/NestPatcher-app/).
#   cli:     --game and --mods point at the same folders.
#   gui:     configured with the same folders, then serves its panel on port 8765.


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


def describe(project):
    """One line per thing the app should show about the chosen folder."""
    www, mods = project_paths(project)
    lines = []
    lines.append(("OK  " if os.path.isfile(os.path.join(www, "index.html")) else "MISSING ")
                 + "game files: " + www)
    lines.append(("OK  " if os.path.isdir(mods) else "MISSING ") + "mods folder: " + mods)
    enabled = os.path.join(mods, "enabled.txt")
    lines.append(("OK  " if os.path.isfile(enabled) else "no ") + "enabled.txt")
    return "\n".join(lines)


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


def build_argv(kind, project, extra):
    www, mods = project_paths(project)
    argv = [a for a in (extra or "").split() if a]
    if kind == "cli":
        argv = ["--game", www, "--mods", mods] + argv
    elif kind == "gui":
        argv = ["--no-browser", "--port=8765"] + argv
    return argv


def run(script, project, kind, extra, checker, sink):
    """Run a patcher. Returns its exit code. Output goes to sink.line(text).
    kind "auto" works out what sort of patcher the file is."""
    writer = _LineWriter(sink)
    old_out, old_err, old_argv = sys.stdout, sys.stderr, sys.argv
    sys.stdout = sys.stderr = writer
    os.environ["NESTPATCHER_HOME"] = project
    code = 1
    try:
        module = load(script, project, checker)
        if kind in (None, "", "auto"):
            kind = guess_kind(module)
        sink.line("[NestPatcher app: running " + os.path.basename(script) + " as " + kind + "]")
        argv = build_argv(kind, project, extra)
        sys.argv = [os.path.basename(script)] + argv
        if kind == "gui":
            www, mods = project_paths(project)
            module.configure(www, mods, remember=True, interactive=False)
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
    return code

