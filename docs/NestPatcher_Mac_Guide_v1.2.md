# NestPatcher for Mac: step-by-step guide

> Based on KittyPatcher by LibraKitty (the original Windows patcher). Renamed to NestPatcher in v1.2; your saved settings carry over.

`NestPatcher_TiTS_Mac_v1.2.py` does the same job as the Desktop and Android patchers. It uses the same `.mod` format, the same `enabled.txt` load list, the same clean backups, the same `node --check` validation and the same flags. On top of that it handles the Mac-only parts:

- It finds `TiTS.app` for you (in `/Applications`, `~/Applications`, `~/Downloads`, `~/Desktop`, or next to the script) and remembers it.
- If the game is packed as `app.asar`, it can unpack it so it can be patched.
- After a real build it clears the quarantine flag and ad-hoc re-signs the app, so macOS still opens it.
- Your mods live **outside** the app, so a game update can't wipe them.

---

## 1. Install the tools (one time)

1. Open **Terminal** (Applications > Utilities > Terminal). For a dark look: *Terminal > Settings > Profiles > Pro*, then click **Default**.
2. Install Apple's command line tools (gives you `python3` and `codesign`):

   ```bash
   xcode-select --install
   ```

   Click **Install** in the pop-up. If it says they're already installed, that's fine.
3. Install **Homebrew** if you don't have it, following the one-line command on <https://brew.sh>.
4. Install Node.js (needed for the JavaScript syntax check):

   ```bash
   brew install node
   ```

   (The macOS installer from nodejs.org works too.)
5. Check both:

   ```bash
   python3 --version
   node --version
   ```

---

## 2. Set up the folders

Make a modding folder anywhere you like. This guide uses `~/TITS-Modding`:

```text
~/TITS-Modding/
├── NestPatcher_TiTS_Mac_v1.2.py
├── NestPatcher_TiTS_Mac.settings.json   ← made automatically, remembers your paths
└── nestmods/                           ← your mods (same contents as Drive TITS-Mods)
    ├── enabled.txt
    ├── *.mod, *.js
    ├── changelog.json
    ├── backup/                           ← clean originals, made on first build. Protect these.
    └── logs/                             ← ModPatchLog.txt, SourceSearch.txt
```

1. Create the folders:

   ```bash
   mkdir -p ~/TITS-Modding/nestmods
   ```

2. Put `NestPatcher_TiTS_Mac_v1.2.py` in `~/TITS-Modding/`.
3. Copy everything from your Drive **TITS-Mods** folder into `~/TITS-Modding/nestmods/` (your `.mod` files, `.js` files, `enabled.txt`, `changelog.json`). **Don't** copy an old `backup/` folder from Android: those backups are of the Android bundles, and the Mac game needs its own.

The game itself stays wherever it is, for example `/Applications/TiTS.app`. Inside it, the patcher edits `TiTS.app/Contents/Resources/app/`.

---

## 3. First run: point it at the game

1. Go to the folder:

   ```bash
   cd ~/TITS-Modding
   ```

2. Tell it where the game is. Type `python3 NestPatcher_TiTS_Mac_v1.2.py --show --app ` (with a space at the end), then **drag TiTS.app from Finder into the Terminal window** and press Return:

   ```bash
   python3 NestPatcher_TiTS_Mac_v1.2.py --show --app /Applications/TiTS.app
   ```

   It saves the path, so you never need `--app` again. Check the output: `Game folder` and `Mods folder` must not say `(missing)`, and `Node.js` must show a path.

   If you skip `--app`, the patcher searches the usual places by itself and asks you to pick if it finds more than one.

3. **If `Game folder` says `(missing)`**, the game is packed as `app.asar`. Unpack it once:

   ```bash
   python3 NestPatcher_TiTS_Mac_v1.2.py --unpack-asar
   ```

   This extracts `app.asar` into `app/` and renames the original to `app.asar.nest-original` (and `app.asar.unpacked` to `app.asar.unpacked.nest-original` if there is one). Electron then loads the `app/` folder instead.

---

## 4. Build

1. **Quit TiTS first** (Cmd+Q). The patcher refuses to write while the game is running.
2. Dry run (checks everything, writes nothing):

   ```bash
   python3 NestPatcher_TiTS_Mac_v1.2.py --fresh --dry-run
   ```

3. If it ends with `DRY RUN` and every file shows `VALID`, build for real:

   ```bash
   python3 NestPatcher_TiTS_Mac_v1.2.py --fresh
   ```

4. The end of the output should look like:

   ```text
   Cleared quarantine flag on TiTS.app
   Ad-hoc re-signed TiTS.app
   DONE: 191 replacements; 9 runtime scripts; validation passed
   ```

5. Open TiTS normally. There's no APK step on Mac.

---

## 5. All flags

| Flag | What it does |
|---|---|
| `--fresh` | Rebuild from the clean backups (also the default) |
| `--dry-run` | Check and preview, write nothing |
| `--find TERM [TERM...]` | Read-only search of the game code; report in `nestmods/logs/SourceSearch.txt` |
| `--skip-validation` | Skip `node --check`. Emergencies only |
| `--app PATH` | Use this TiTS.app (remembered) |
| `--mods PATH` | Use this mods folder instead of `nestmods/` next to the script (remembered) |
| `--unpack-asar` | Turn `app.asar` into a patchable `app/` folder |
| `--no-resign` | Don't clear quarantine or re-sign after building |
| `--show` | Print the paths in use and exit |
| `--forget` | Clear the remembered paths |

All the safety rules match the other patchers: a missing file in `enabled.txt`, a missed replacement, a needle that matches more than 8 times, or invalid JavaScript all **stop the build with nothing changed**. Disabling a mod and rebuilding removes its old edits.

---

## 6. Troubleshooting

**"PERMISSION DENIED" / "Operation not permitted"**
macOS protects apps in `/Applications`. Do one of these, then run again:
1. *System Settings > Privacy & Security > App Management*, turn on **Terminal**.
2. Or move TiTS.app somewhere else (for example `~/Games/TiTS.app`) and run once with `--app ~/Games/TiTS.app`.
3. If the app is owned by another account: `sudo chown -R $(whoami) /Applications/TiTS.app`

**"TiTS is damaged and can't be opened" or "can't be opened because Apple cannot check it"**
Run these, then open the game again:

```bash
xattr -dr com.apple.quarantine /Applications/TiTS.app
codesign --force --deep --sign - /Applications/TiTS.app
```

If it still won't open, right-click TiTS.app > **Open** > **Open**, or go to *System Settings > Privacy & Security* and click **Open Anyway**.

**The game opens but no mods show up**
- Run `--show`. If both `app/` and `app.asar` exist, the patcher stops and says so, because Electron would load the packed copy. Run `--unpack-asar` or rename `app.asar` yourself.
- Open the game's DevTools (Cmd+Option+I, if the game allows it) and check the **Console** for `[NestPatcher runtime]` errors.

**"Node.js is required"**
Run `brew install node`. The patcher also looks in `/opt/homebrew/bin` and `/usr/local/bin`, so it works even when Terminal's PATH misses them.

**After a game update**
The update replaces the app, so the old backups no longer match.
1. Move `nestmods/backup` aside (rename it to `backup-old-version`).
2. If the new version ships `app.asar`, run `--unpack-asar` again.
3. Run `--fresh --dry-run`. Any `MISS` lines are mods whose anchors changed in the new version.

**Undo everything**
Restore an untouched copy of TiTS.app (re-download it), or copy the files in `nestmods/backup/` back into `TiTS.app/Contents/Resources/app/` and delete `app/mods/nest/`.

---

## 7. Notes

- Files starting with `._` (macOS metadata from USB drives and zips) are ignored.
- The ad-hoc signature is local to your Mac. That's normal for a modded app.
- Very new Electron builds can have an "ASAR integrity" setting that refuses an unpacked `app/` folder. If the game quits instantly after `--unpack-asar`, restore the original (`app.asar.nest-original` back to `app.asar`, delete `app/`) and send me the error.
