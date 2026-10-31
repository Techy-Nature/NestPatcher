# Modv2.4: Android mod menu stays on Android

People were loading `AndroidModMenu.js` on desktop, where it adds an Options panel and a
TN DEBUG button that were only built for the Android app. Modv2.4 stops that.

## What changed

- **`AndroidModMenu_v2.4.js`** checks what it's running on. On Android it works exactly as
  before. On Windows, Linux, Mac or a web browser it switches itself off: no Options >
  Android Mods panel, no TN DEBUG button, no shared mod-menu functions. It only does one
  thing everywhere: it copies old `KITTY_` save flags to the new `TN_` names, so older
  saves keep working on every system.
- **Every TN mod that used the menu (28 files)** now talks to it only when the menu is
  installed **and** the game is running on Android. Otherwise the mod just uses its
  default settings (switched on, default options) and doesn't error or wait forever.
- **An old `AndroidModMenu.js` is ignored too.** If someone still loads the 2.3 menu on
  desktop, the 2.4 mods won't hook into it.
- **File names** of every changed file now end in `_v2.4`, and `enabled.txt` uses the new
  names. Files that didn't change keep their old names.
- **Changelog** is `TN_Changelog_v2.4.js` (shows Modv2.4). The online `changelog.md` in
  the NestPatcher repo has the 2.4 entry.

What desktop players lose: the on/off switches and option pages that only exist in
Options > Android Mods. Every mod still works on desktop with its default settings.

## Files

| File | What it is |
|---|---|
| `TN-Mods-Modv2.4.zip` | The whole pack, flat, plus these guides. |
| `TITS-Mods/` | The same files unzipped. |
| `TITS-Mods/enabled.txt` | The Modv2.4 load list. |
| `changelog_v2.4.md` / `changelog_v2.4.json` | The notes, as Markdown and as JSON. |

## Install on Android (NestPatcher app or Termux)

1. **Back up.** Copy your mods folder (`nestmods`, or `TITS-Modding/mods` if you still use
   the Termux layout) to something like `mods-backup-2.3`.
2. **Empty the mods folder.** Delete every `.mod` and `.js` file and `enabled.txt` in it.
   Keep the `backup` and `logs` folders. (This removes the old file names, so you don't end
   up with `CrewSize.js` and `CrewSize_v2.4.js` side by side.)
3. **Unzip** `TN-Mods-Modv2.4.zip` into the mods folder. The `.md` guides can stay or go.
4. **Check `enabled.txt`.** The first line under the comment should be
   `AndroidModMenu_v2.4.js`. If you had turned mods off with `#`, do that again here.
5. **Patch.**
   - App: open NestPatcher, tap Test my mods, then Patch.
   - Termux:
     ```
     cd ~/storage/shared/git.gay-repos/TITS-Modding/TITS-Patcher
     python NestPatcher_TiTS_Android_v1.2.py
     ```
   It should end with `508 replacements` and no STOP, MISS or INVALID lines.
6. **Sign and install** the APK the way you normally do.
7. **Check it worked.** Open Options. **Android Mods** should be there, with every mod listed.
   The main menu's Info section should say **Changelog (Modv2.4)**.

## Install on desktop (Windows, Linux, Mac)

1. **Back up** the `nestmods` folder next to NestPatcher.
2. **Empty it** the same way: delete the `.mod` / `.js` files and `enabled.txt`, keep
   `backup` and `logs`.
3. **Unzip** `TN-Mods-Modv2.4.zip` into `nestmods`.
4. **Optional:** put a `#` in front of `AndroidModMenu_v2.4.js` in `enabled.txt`. You don't
   have to: on desktop it switches itself off anyway. Turning it off just skips loading it.
5. **Patch** with NestPatcher (GUI: Test my mods, then Patch the game; command line:
   `NestPatcher_Windows_v1.3.bat` or `./nestpatcher_linux_v1.3.sh`).
6. **Check it worked.** Start the game. There should be **no** Android Mods entry in Options
   and **no** TN DEBUG button. Your mods (Shelly, Stella, the shops, Wiki, Changelog) should
   all still be there.

## If something goes wrong

- **Android Mods is missing on Android:** make sure `enabled.txt` lists
  `AndroidModMenu_v2.4.js` (not the old `AndroidModMenu.js`) and patch again.
- **The menu shows up but is empty on Android:** an old `AndroidModMenu.js` is loading
  instead of the 2.4 one. Remove it from the folder and from `enabled.txt`, then patch again.
- **A desktop install is still broken:** restore the clean game first. In NestPatcher, use
  Turn all mods off (or `--restore`), then patch again with the 2.4 pack. If it's still
  wrong, send a bug report zip from NestPatcher.
- **Go back to 2.3:** restore `mods-backup-2.3` and patch again. Nothing in your saves
  changed in 2.4.

## Checked

- Every `.js` file passes `node --check`.
- NestPatcher dry run against TiTS 0.9.167 (Android build): **508 of 508** replacements
  with both the 2.3 and 2.4 packs, and every patched bundle passes validation.
- Loaded the whole pack in a headless browser four ways, with no errors in any of them:
  - Android: all 27 mod pages show up in the menu.
  - Desktop (Electron): the menu is off and nothing registers.
  - Desktop with the old 2.3 menu loaded: the 2.4 mods ignore it.
  - No menu at all: the mods use their defaults.
- Not yet tested in the real game on a phone or a PC.
