"""Edge cases for a NestPatcher command-line script (fake game, no TiTS files).

    python tests/test_cli_extras.py patchers/NestPatcher_TiTS_Linux_v1.12.py

- enabled.txt saved with a BOM (Notepad) and with Windows line endings
- enabled.txt names with different capital letters (written on Windows, used on Linux)
- a .mod file saved with a BOM
- backups left from an older TiTS version (main.<hash>.js renamed by an update)
- --menu shows the menu again after a job and says so when a number is wrong
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


def setup():
    root = tempfile.mkdtemp(prefix="nest-extra-")
    smoke_test.build(root, "nestmods")
    os.rename(os.path.join(root, "game"), os.path.join(root, "TiTS-test"))
    tool = os.path.join(root, "tool")
    shutil.copy2(script, tool)
    return root, tool, os.path.join(tool, "nestmods"), os.path.join(root, "TiTS-test", "resources", "app")


def run(tool, *args, stdin=""):
    result = subprocess.run([sys.executable, os.path.basename(script)] + list(args), cwd=tool,
                            input=stdin, capture_output=True, text=True, timeout=120)
    return result.returncode, result.stdout + result.stderr


root, tool, mods, app = setup()
try:
    with open(os.path.join(mods, "enabled.txt"), "wb") as handle:
        handle.write(b"\xef\xbb\xbfSmoke.mod\r\nExtra.js\r\n")
    code, out = run(tool, "--dry-run")
    check("enabled.txt with a BOM and CRLF works", code == 0 and "3 replacements" in out, out)

    with open(os.path.join(mods, "enabled.txt"), "w") as handle:
        handle.write("smoke.MOD\nextra.js\n")
    code, out = run(tool, "--dry-run")
    check("names with other capital letters find their files", code == 0 and "3 replacements" in out, out)
    case_sensitive = not os.path.isfile(os.path.join(mods, "SMOKE.MOD"))   # Linux yes; Windows/Mac no
    if case_sensitive:
        check("  ... and say so", "using Smoke.mod" in out, out)

    with open(os.path.join(mods, "Smoke.mod"), "rb") as handle:
        body = handle.read()
    with open(os.path.join(mods, "Smoke.mod"), "wb") as handle:
        handle.write(b"\xef\xbb\xbf" + body.lstrip(b"#").replace(b" Smoke test mod\n", b"", 1))
    with open(os.path.join(mods, "enabled.txt"), "w") as handle:
        handle.write("Smoke.mod\nExtra.js\n")
    code, out = run(tool, "--dry-run")
    check(".mod saved with a BOM works", code == 0 and "3 replacements" in out, out)

    # Patch, then "update" the game: new main bundle name, fresh index.html.
    code, out = run(tool)
    check("patch exits 0", code == 0, out)
    os.remove(os.path.join(app, "main.1a2b3c4d.js"))
    with open(os.path.join(app, "main.9f9f9f9f.js"), "w", newline="\n") as handle:
        handle.write(smoke_test.MAIN.replace("0.9.999", "0.9.1000"))
    with open(os.path.join(app, "index.html"), "w", newline="\n") as handle:
        handle.write(smoke_test.CLEAN_INDEX.replace("main.1a2b3c4d.js", "main.9f9f9f9f.js"))
    # The update didn't change the content bundle (same name), but its copy in the game is
    # still the patched one: only the kept clean backup lets the patch find its text.
    code, out = run(tool, "--restore")
    check("restore refuses backups from another TiTS version", code == 1 and "different TiTS version" in out, out)
    with open(os.path.join(app, "index.html")) as handle:
        check("  ... and leaves index.html alone", "main.9f9f9f9f.js" in handle.read())
    code, out = run(tool, "--dry-run")
    check("dry run notes the old backups", code == 0 and "different TiTS version" in out, out)
    code, out = run(tool)
    check("patch after an update exits 0", code == 0 and "Moved them to" in out, out)
    check("  ... unchanged bundle's clean copy kept", "Kept the clean copies of 1" in out, out)
    with open(os.path.join(app, "index.html")) as handle:
        index = handle.read()
    check("  ... index loads the new main bundle", "main.9f9f9f9f.js" in index and "main.1a2b3c4d.js" not in index, index)
    check("  ... old backups set aside", any(name.startswith("backup-old-") for name in os.listdir(mods)))
    with open(os.path.join(mods, "backup", "index.html")) as handle:
        check("  ... fresh index backup is from the new game", "main.9f9f9f9f.js" in handle.read())
    code, out = run(tool, "--restore")
    check("restore works again after that", code == 0 and "RESTORED" in out, out)

    code, out = run(tool, "--menu", stdin="9\n5\n0\n")
    check("menu: a wrong number is explained", "is not on the list" in out, out)
    check("menu: shows again after a job", out.count("0) Quit") >= 2 and "Settings file:" in out, out)
    check("menu: 0 quits", code == 0, out)
finally:
    shutil.rmtree(root, ignore_errors=True)

print("\nALL PASSED" if not failed else "\nFAILED: " + ", ".join(failed))
sys.exit(1 if failed else 0)
