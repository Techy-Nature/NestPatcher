

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
