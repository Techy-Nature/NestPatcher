# NestPatcher for Trials in Tainted Space.
# Based on KittyPatcher by LibraKitty (the original Windows patcher).
# Replace / With still swaps exact text. Hashed bundles such as
# content_first14.<hash>.js are found from the plain name content_first14.js.
# Add Javascript blocks load from mods/nest/nest-inline.js.

import os
import re
import shutil
import sys
import subprocess
import tempfile
import argparse

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(ROOT)
APP = os.path.join(PROJECT, "extracted", "apk", "assets", "www")
MODS = os.path.join(PROJECT, "mods")
BACKUP = os.path.join(MODS, "backup")
LOGS = os.path.join(MODS, "logs")
RUNTIME_DIR = os.path.join(APP, "mods", "nest")
RUNTIME_JS = os.path.join(RUNTIME_DIR, "nest-inline.js")
ENABLED = os.path.join(MODS, "enabled.txt")
LOG_PATH = os.path.join(LOGS, "ModPatchLog.txt")

HEADER = re.compile(
    r"^(?P<kind>Add Javascript|Add Content|Add Boot|Add Item|Item JS|Replace|Add JS|Rep|Add C|Add B)"
    r"(?:\s+\[(?P<target>[^\]]*)\])?\s*:?\s*(?:#.*)?$"
)
WITH_LINE = re.compile(r"^\s*(?:With:|W:)\s*$")

HASHED = re.compile(r"^(?P<base>.+)\.[a-fA-F0-9]{8,}\.(?P<ext>js|css)$")


def log(message):
    print(message)
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
        if not name.endswith(".js"):
            continue
        backup = os.path.join(BACKUP, name)
        path = backup if os.path.isfile(backup) else os.path.join(APP, name)
        with open(path, "r", encoding="utf-8", errors="replace") as handle:
            found[name] = handle.read()
    return found


def read_file(path, binary=False):
    """Read a whole file and close it straight away."""
    if binary:
        with open(path, "rb") as handle:
            return handle.read()
    with open(path, encoding="utf-8") as handle:
        return handle.read()


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


def enabled_mods():
    names = []
    if os.path.isfile(ENABLED):
        for line in read_file(ENABLED).splitlines():
            line = line.split("#", 1)[0].strip()
            if line:
                names.append(line)
    else:
        names = sorted(
            name for name in os.listdir(MODS)
            if name.lower().endswith(".mod") or name.lower().endswith(".js")
        )
    resolved = []
    for name in names:
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


def snapshot(real_name, dry_run):
    """Keep the first pre-patch copy. Later runs read that copy, not the patched game."""
    source = os.path.join(APP, real_name)
    dest = os.path.join(BACKUP, real_name)
    os.makedirs(BACKUP, exist_ok=True)
    if os.path.isfile(dest):
        return
    if dry_run:
        log("Would back up " + real_name)
        return
    shutil.copy2(source, dest)
    log("Backed up " + real_name)


def ensure_script_tag(dry_run):
    index_path = os.path.join(APP, "index.html")
    with open(index_path, "r", encoding="utf-8") as handle:
        content = handle.read()
    backup = os.path.join(BACKUP, "index.html")
    if not os.path.isfile(backup) and not dry_run:
        os.makedirs(BACKUP, exist_ok=True)
        shutil.copy2(index_path, backup)
    names = ["nest-inline.js"]
    if os.path.isdir(RUNTIME_DIR):
        for name in sorted(os.listdir(RUNTIME_DIR)):
            if name.endswith(".js") and name not in names:
                names.append(name)
    insert = []
    for name in names:
        tag = '<script defer src="mods/nest/' + name + '"></script>'
        if tag not in content:
            insert.append(tag)
    if not insert:
        log("index.html already loads the NestPatcher runtime")
        return
    if "</head>" not in content:
        log("index.html has no </head>, runtime was not linked")
        return
    if dry_run:
        log("Would link " + ", ".join(insert))
        return
    content = content.replace("</head>", "\n".join(insert) + "</head>", 1)
    with open(index_path, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(content)
    log("Linked NestPatcher runtime from index.html")


def check_js(label, source, node):
    """Validate actual JavaScript using Node's parser, not a text heuristic."""
    fd, path = tempfile.mkstemp(prefix="nest-check-", suffix=".js")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            stream.write(source)
        try:
            result = subprocess.run([node, "--check", path], text=True,
                                    capture_output=True, timeout=90)
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


def clean_index(source):
    """Remove NestPatcher runtime script tags (old or deferred), even when inline."""
    return re.sub(
        r'<script\b(?=[^>]*\bsrc="mods/(?:kitty|nest)/[^"<>]+\.js")[^>]*></script>\s*',
        '', source,
    )


def make_runtime(blocks):
    parts = ["/* NestPatcher runtime: generated; do not edit. */"]
    for block in blocks:
        # Preserve isolation between independent mods.
        parts.extend(["try {", "/* " + block["mod"].replace("*/", "* /" ) + " */",
                      block["new"], "} catch (err) { console.error('[NestPatcher runtime]', err); }"])
    return "\n".join(parts) + "\n"


def apply(dry_run=False, fresh=False, validate=True):
    if os.path.isfile(LOG_PATH) and not dry_run:
        os.remove(LOG_PATH)
    if not os.path.isdir(APP):
        log("Game folder not found: " + APP)
        return 1
    node = shutil.which("node") or shutil.which("nodejs")
    if validate and not node:
        log("STOP: Node.js is required for JavaScript syntax checking. In proot-Debian: apt install nodejs")
        log("Nothing was changed. You may explicitly opt out using --skip-validation (not recommended).")
        return 1
    files = load_game_files()  # Backups, if present, are the clean baseline.
    log("Loaded " + str(len(files)) + " game scripts (using available backups)")
    backups = {}
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
        for raw in read_file(ENABLED).splitlines():
            name = raw.split("#", 1)[0].strip()
            if name and not os.path.isfile(os.path.join(MODS, name)):
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
    runtime_js = {os.path.basename(path): read_file(path) for path in copy_js}
    if "nest-inline.js" in runtime_js:
        log("STOP: nest-inline.js is reserved for generated content")
        return 1
    runtime_js["nest-inline.js"] = runtime
    index_path = os.path.join(APP, "index.html")
    index_backup_path = os.path.join(BACKUP, "index.html")
    if not os.path.isfile(index_path):
        log("STOP: index.html was not found")
        return 1
    # Prefer pre-patcher snapshot; when absent, remove only known NestPatcher tags.
    index_base_path = index_backup_path if os.path.isfile(index_backup_path) else index_path
    index_base = read_file(index_base_path)
    index_clean = clean_index(index_base)
    if "</head>" not in index_clean:
        log("STOP: index.html lacks </head>. No changes made.")
        return 1
    # Defer NestPatcher runtime scripts so the game's deferred Webpack bundles run first.
    # Rebuilds always regenerate these tags from the clean index baseline.
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
    original = {path: read_file(path, binary=True) if os.path.isfile(path) else None for path in targets}
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
        log("WRITE FAILURE: " + str(exc) + "; rolling back game files")
        for path, data in original.items():
            try:
                if data is None:
                    if os.path.exists(path): os.remove(path)
                else:
                    os.makedirs(os.path.dirname(path), exist_ok=True)
                    with open(path, "wb") as h: h.write(data)
            except OSError as recovery_error:
                log("ROLLBACK FAILED for " + path + ": " + str(recovery_error))
        return 1
    leftover = os.path.join(APP, "mods", "kitty")
    if os.path.isdir(leftover):
        shutil.rmtree(leftover, ignore_errors=True)
        log("Removed leftover KittyPatcher files (mods/kitty). NestPatcher uses mods/nest.")
    log("DONE: " + str(applied) + " replacements; " + str(len(runtime_js)) + " runtime scripts; validation " + ("passed" if validate else "skipped"))
    return 0




def find_sources(terms, context=150, max_hits=30):
    """Search extracted JavaScript without modifying game files.

    Hashed/minified bundles are reported as short surrounding excerpts rather
    than entire multi-megabyte lines. Prefer untouched backup copies when present.
    """
    if not os.path.isdir(APP):
        print("Game folder not found: " + APP)
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
            if not filename.lower().endswith(".js"):
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
    print("\n".join(results[-1:]))
    print("Report saved to: " + report_path)
    return 0



def main():
    parser = argparse.ArgumentParser(description="NestPatcher: validated, reversible game-file patching")
    parser.add_argument("--find", nargs="+", metavar="TERM", help="search extracted JavaScript and save excerpts to mods/logs/SourceSearch.txt (read-only)")
    parser.add_argument("--dry-run", action="store_true", help="validate and preview without writing game files")
    parser.add_argument("--fresh", action="store_true", help="regenerate from saved baselines; clear obsolete NestPatcher runtime files (also default)")
    parser.add_argument("--skip-validation", action="store_true", help="dangerous: skip Node.js syntax validation")
    args = parser.parse_args()
    if args.find:
        return find_sources(args.find)
    return apply(args.dry_run, args.fresh, not args.skip_validation)


if __name__ == "__main__":
    raise SystemExit(main())
