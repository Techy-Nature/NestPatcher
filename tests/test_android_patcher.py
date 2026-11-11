"""Edge cases for the standalone Android patcher (fake game, no TiTS files).

    python tests/test_android_patcher.py patchers/NestPatcher_TiTS_Android_v1.6.py

Layout it expects: TITS-Modding/<patcher folder>/script.py, TITS-Modding/mods,
TITS-Modding/extracted/apk/assets/www.
"""
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import smoke_test  # noqa: E402

script = os.path.abspath(sys.argv[1])
failed = []


def check(label, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + label)
    if not ok:
        failed.append(label)
        if detail:
            print(detail[-3000:])


def write(path, text, binary=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb" if binary else "w", **({} if binary else {"newline": "\n", "encoding": "utf-8"})) as handle:
        handle.write(text)


project = tempfile.mkdtemp(prefix="nest-android-patcher-")
try:
    www = os.path.join(project, "extracted", "apk", "assets", "www")
    mods = os.path.join(project, "mods")
    tool = os.path.join(project, "TITS-Patcher")
    write(os.path.join(www, "index.html"), smoke_test.CLEAN_INDEX)
    write(os.path.join(www, "main.1a2b3c4d.js"), smoke_test.MAIN)
    write(os.path.join(www, "content_test.5e6f7a8b.js"), smoke_test.CONTENT)
    write(os.path.join(mods, "Smoke.mod"), smoke_test.MOD)
    write(os.path.join(mods, "Extra.js"), "window.extra = 1;\n")
    os.makedirs(tool)
    shutil.copy2(script, tool)

    def run(*args):
        result = subprocess.run([sys.executable, os.path.basename(script)] + list(args), cwd=tool,
                                capture_output=True, text=True, timeout=120)
        return result.returncode, result.stdout + result.stderr

    write(os.path.join(mods, "enabled.txt"), b"\xef\xbb\xbfSmoke.mod\r\nExtra.js\r\n", binary=True)
    code, out = run("--dry-run")
    check("enabled.txt with a BOM and CRLF works", code == 0 and "3 replacements" in out, out)

    write(os.path.join(mods, "enabled.txt"), "smoke.MOD\nextra.js\n")
    code, out = run("--dry-run")
    check("names with other capital letters find their files", code == 0 and "3 replacements" in out, out)
    if not os.path.isfile(os.path.join(mods, "SMOKE.MOD")):
        check("  ... and say so", "using Smoke.mod" in out, out)

    write(os.path.join(mods, "Smoke.mod"), b"\xef\xbb\xbf" + smoke_test.MOD.split("\n", 1)[1].encode(), binary=True)
    write(os.path.join(mods, "enabled.txt"), "Smoke.mod\nExtra.js\n")
    code, out = run("--dry-run")
    check(".mod saved with a BOM works", code == 0 and "3 replacements" in out, out)

    code, out = run()
    check("patch exits 0", code == 0 and "DONE" in out, out)

    # A TiTS update: new main bundle name and a fresh index.html; the content bundle
    # didn't change (same name), but its copy in the game is still the patched one.
    os.remove(os.path.join(www, "main.1a2b3c4d.js"))
    write(os.path.join(www, "main.9f9f9f9f.js"), smoke_test.MAIN.replace("0.9.999", "0.9.1000"))
    write(os.path.join(www, "index.html"), smoke_test.CLEAN_INDEX.replace("main.1a2b3c4d.js", "main.9f9f9f9f.js"))
    code, out = run("--dry-run")
    check("dry run notes the old backups", code == 0 and "different TiTS version" in out, out)
    code, out = run()
    check("patch after an update exits 0", code == 0 and "Moved them to" in out, out)
    check("  ... unchanged bundle's clean copy kept", "Kept the clean copies of 1" in out, out)
    with open(os.path.join(www, "index.html")) as handle:
        index = handle.read()
    check("  ... index loads the new main bundle", "main.9f9f9f9f.js" in index and "main.1a2b3c4d.js" not in index, index)
    check("  ... old backups set aside", any(name.startswith("backup-old-") for name in os.listdir(mods)))
    with open(os.path.join(mods, "backup", "index.html")) as handle:
        check("  ... fresh index backup is from the new game", "main.9f9f9f9f.js" in handle.read())
    code, out = run()
    check("patching again is quiet about backups", code == 0 and "different TiTS version" not in out, out)
finally:
    shutil.rmtree(project, ignore_errors=True)

print("\nALL PASSED" if not failed else "\nFAILED: " + ", ".join(failed))
sys.exit(1 if failed else 0)
