<img src="src/launcher/nestpatcher-icon.svg" width="96" alt="NestPatcher logo: a nest with a barred brown feather">

# NestPatcher

NestPatcher puts mods (`.mod` patch files and `.js` scripts) into **Trials in Tainted Space**. It runs on Windows, Linux, macOS and Android (as an app or in Termux), and it has a browser-based GUI for people who'd rather not use the command line.

> **NestPatcher is not KittyPatcher.** It is based on **KittyPatcher by LibraKitty**, the original Windows patcher. The `.mod` format is hers, and the way mods are found and applied comes from her patcher. Don't use both patchers on the same game, because each one undoes the other's changes. To keep them apart, NestPatcher uses different names for everything:
>
> | | KittyPatcher (LibraKitty) | NestPatcher |
> |---|---|---|
> | Mods folder | `kitty-mods` | `nestmods` |
> | Files it puts in the game | `mods/kitty/`, `kitty-inline.js` | `mods/nest/`, `nest-inline.js` |
> | Systems | Windows | Windows, Linux, macOS, Android (app or Termux), GUI |
>
> If NestPatcher finds an old `kitty-mods` folder, it renames it to `nestmods` for you, and your clean backups move with it. It also removes anything KittyPatcher left in the game, and warns you if KittyPatcher is sitting in the same folder.

## Which one do I use?

| You are on | Use | Guide |
|---|---|---|
| Windows 10/11, no installing | `NestPatcher_GUI_v0.14_Windows.zip` from [Releases](../../releases) | [Guide_GUI_v0.14.md](docs/Guide_GUI_v0.14.md) |
| Linux, no installing | `NestPatcher_GUI_v0.14-x86_64.AppImage` from [Releases](../../releases) | [Guide_GUI_v0.14.md](docs/Guide_GUI_v0.14.md) |
| Windows, command line | [`patchers/NestPatcher_TiTS_Windows_v1.12.py`](patchers/) + `NestPatcher_Windows_v1.12.bat` | [Guide_Windows_v1.12.md](docs/Guide_Windows_v1.12.md) |
| Debian, Ubuntu, Mint, Fedora, Nobara | [`patchers/NestPatcher_TiTS_Linux_v1.12.py`](patchers/) + `nestpatcher_linux_v1.12.sh` | [Guide_Linux_v1.12.md](docs/Guide_Linux_v1.12.md) |
| macOS, with only the Windows game (TiTS.exe) | [`patchers/NestPatcher_TiTS_Mac_v1.9.py`](patchers/) `--app` the Windows game folder: it patches it and makes TiTS.app | [NestPatcher_Mac_Guide_v1.9.md](docs/NestPatcher_Mac_Guide_v1.9.md) |
| macOS | [`patchers/NestPatcher_TiTS_Mac_v1.9.py`](patchers/) | [NestPatcher_Mac_Guide_v1.9.md](docs/NestPatcher_Mac_Guide_v1.9.md) |
| Make a **Mac app** or **Linux AppImage** of the patched game | GUI 0.14 (**Make Mac app** / **Make AppImage**) or `--export-mac` / `--export-appimage` | [Guide_Export_Mac_AppImage_v1.12.md](docs/Guide_Export_Mac_AppImage_v1.12.md) |
| Android, no Termux (app) | `NestPatcher_Android_App_v0.9.apk` from [Actions](../../actions) or [Releases](../../releases) | [Guide_Android_App_v0.9.md](docs/Guide_Android_App_v0.9.md) |
| Android (Termux, extracted APK) | [`patchers/NestPatcher_TiTS_Android_v1.5.py`](patchers/), or the GUI script in Termux | [Guide_GUI_v0.14.md](docs/Guide_GUI_v0.14.md) |

Newest versions: **CLI 1.12, GUI 0.14, Mac 1.9** (Android patcher 1.5, Android app 0.9). See [What's new](#whats-new) and [Updating](#updating).

The GUI bundles include Python and Node.js. The command-line versions need Python 3 and Node.js installed (Node.js checks every mod for mistakes before the game is touched).

## Updating

### To a new NestPatcher version

Your mods and settings are kept. You don't have to patch again after updating NestPatcher, but patching again with the new version is safe.

1. **Windows GUI (zip):** unzip the new zip next to the old folder. Move the `nestmods` folder from the old folder into the new one (replace the empty `nestmods` that came with it). To keep your saved folders and text size, also move `NestPatcher_TiTS_GUI.settings.json`. Then delete the old folder, so you don't start the old version by mistake.
2. **Linux GUI (AppImage):** put the new `.AppImage` in the same folder as the old one, make it runnable (`chmod +x`), and delete the old one. `nestmods` and the settings file sit next to it, so nothing else moves.
3. **Command line (Windows, Linux, Mac):** put the new `.py` (and the `.bat` / `.sh` that goes with it) in the same folder as the old one, then delete the old ones. Settings file names have no version number, so they carry over.
4. **Android app:** install the new APK over the old one. Your folder choices stay.

If you used the Windows zip **through Wine/Proton on Linux**, switch to the Linux AppImage. It patches the Windows copy of TiTS (the `-win` folder) too.

### After a TiTS update

1. Install the new TiTS (into the same folder, or a new one). If you use a new folder, pick it on the Setup tab (or with `--game`).
2. **Test my mods**, then **Patch the game** (CLI: options 1 then 2).
3. Since CLI 1.12 / GUI 0.14 / Mac 1.9, the patcher notices that `nestmods/backup` belongs to the old TiTS. It moves it to `nestmods/backup-old-<date>` and makes fresh backups by itself. Delete that old folder once the game works. (On older versions, delete `nestmods/backup` yourself before patching.)
4. A `MISS` line after an update means that mod doesn't fit the new TiTS yet. Turn it off, or get a newer version of it.

### To a new mod pack

1. Copy the new pack's `.mod` / `.js` files and its `enabled.txt` into `nestmods`, replacing what is there.
2. Delete the older versions of each mod (for example `TN_Holoboard_v2.8.mod` once you have `_v2.9`). If two versions of one mod are both turned on, the patcher stops and names them.
3. **Test my mods**, then **Patch the game**. `nestmods/backup` stays as it is: it holds the game's clean files, not the mods.

## What's new

**CLI 1.12, GUI 0.14, Mac 1.9:**
- The Windows GUI no longer crashes with `[WinError 1168] Element not found` when it runs through Wine/Proton, and it suggests the Linux AppImage when it sees Wine.
- "TiTS is running" no longer shows up by mistake when the AppImage sits inside the game folder (Linux), or for a TiTS.app in another folder (Mac). It now also notices TiTS.exe running through Wine, and it names the program it found.
- After a TiTS update, old backups are moved aside by themselves (see above). Restore won't put an old version's files back.
- An `enabled.txt` or `.mod` saved by Notepad with a hidden BOM mark works. Mod names whose capital letters differ from the file name work on Linux and Android too.
- GUI: a quick double click can't start two jobs. A crash can't leave the panel stuck, and it goes into the bug report. A mistyped game folder doesn't replace the saved one. On a Mac, Browse... uses Finder's chooser.
- CLI menu: shows again after each job (type 0 to quit), and says so when a number isn't on the list.

## What the GUI has

- **Setup:** finds your game by itself, or you pick the folder.
- **Patch:** *Test my mods* (changes nothing), *Patch the game*, and *Turn all mods off*.
- **Mods on/off:** tick boxes instead of editing `enabled.txt` by hand.
- **Search game code:** for people writing mods.
- **Report a bug:** makes a zip with the patch log and system info. Your user name and home folder are blanked out.
- **Make an app:** packs the patched game as a macOS `TiTS.app` (zip) or a single Linux `.AppImage`, to play on another computer.
- **Comfort settings:** A−/A+ text size (80–250%), Auto/Dark/Light theme, and large scrollbars.

## Writing mods

A `.mod` file is a list of blocks. `Replace [file.js]:` (or `Rep`) is followed by the exact game text to find, then `With:` (or `W:`) and the new text. `Add Javascript:` adds code that runs in the game. Lines starting with `#` are notes. The file name in brackets can leave out the hash: `[main.js]` finds `main.0077a16c.js`.

The PC and Android builds of TiTS give the same minified function different short names (for example `mN` on Android and something else on PC). To match both, write `@@name@@` in place of the function name. It matches any one JavaScript name, and the same `@@name@@` in the `With:` text puts the game's own name back:

```
Rep [main.js]:
function @@fapList@@(){var e,t=arguments.length>0
W:
function @@fapList@@(){var tnR=tnFapsOrig.apply(this,arguments);return tnR}function tnFapsOrig(){var e,t=arguments.length>0
```

Using the same `@@name@@` twice in one needle means the same function both times. Wildcards need NestPatcher 1.4, the Android patcher 1.3, GUI 0.5 or the Android app 0.3, or newer.

## Safety rules (every version)

- **Test first.** If anything says STOP, MISS or INVALID, nothing in the game was changed.
- The first real patch saves clean copies of the game files in `nestmods/backup`. Every later patch starts from those clean copies, so turning a mod off really removes it.
- If a write fails partway through, the game files are put back the way they were.
- After a TiTS update, install the fresh game and patch again. The patcher moves the old backups aside by itself (CLI 1.12, GUI 0.14, Mac 1.9 or newer; on older versions delete `nestmods/backup` first).
- Always patch a fresh, unmodded game. A game folder someone already patched (and shared or copied) has no clean copies, so the patcher stops and says so instead of piling mods on top of mods. Unzip a fresh TiTS and patch that.

## The TN mods

The newest TN mod pack (Modv2.8, for TiTS 0.9.168) is in [`mods/`](mods/): the mods and `enabled.txt` are in [`mods/TITS-Mods/`](mods/TITS-Mods/), and the install guides are in [`mods/guides/`](mods/guides/). See [`mods/README.md`](mods/README.md) for a quick install.

## For developers

- `src/engine.py` is the shared patch engine. `src/cli.py` and `src/gui.py` are the front ends. `python src/build.py` glues them into the single-file scripts in `patchers/`. **Edit `src/`, not `patchers/`.** CI fails if `patchers/` is out of date.
- The Mac patcher is built from `src/mac.py` plus `src/export.py`. `patchers/NestPatcher_TiTS_Android_v1.5.py` is standalone and edited directly.
- `tests/smoke_test.py` patches a tiny fake game, so no TiTS files are needed: `python tests/smoke_test.py patchers/NestPatcher_TiTS_Linux_v1.12.py`. More tests on the same fake game: `test_cli_extras.py` (BOM, capital letters, TiTS update, menu), `test_gui.py` (the GUI's web server, including two clicks at once), and `test_windows_running.py` / `test_linux_running.py` / `test_mac_running.py` (the "TiTS is running" check, with fake process lists).
- `src/export.py` packs the patched game as a Mac app or AppImage (built into the same single-file scripts). `tests/test_export.py` checks it with fake Electron zips, so no download is needed. The Mac app is signed by a built-in ad-hoc signer; `tests/macsign_check.py` re-checks those signatures anywhere, and `tests/mac_real_check.sh` (CI, macOS) checks them with `codesign` and launches the app.
- `packaging/build_bundles.sh` builds the AppImage and the Windows zip on Linux. It downloads pinned, checksum-verified Python ([python-build-standalone](https://github.com/astral-sh/python-build-standalone)) and Node.js. The Windows `.exe` is a small launcher from `src/launcher/`, compiled with MinGW.
- GitHub Actions runs the smoke test on Windows, Linux and macOS for every push. It builds the bundles, checks the Windows bundle on a real Windows machine, builds the Android APK, and publishes a release by itself (tag `v<version>`, named `Patchers_v<version>`, with the bundles, APK and patchers attached) the first time a new version from `src/build.py` reaches main.
- `android/` is the Android app (Kotlin + [Chaquopy](https://chaquo.com/chaquopy/) Python). It carries every script in `patchers/`, runs the Android one by default, asks for the folders each patcher needs (a custom .py can list its own with `NEST_NEEDS`), and checks JavaScript with the phone's WebView instead of Node.js. `android/app/src/main/python/nest_android.py` is the glue, tested on a PC by `tests/test_android_harness.py`. CI builds the APK with `gradle assembleRelease`.
- Version numbers go in file names (for example `_v1.12`), so it's always clear which copy is newer.

### Making a new NestPatcher version

1. Change the code in `src/`.
2. Bump the version in `src/build.py`: `CLI_VERSION` for any change to the shared engine or the CLI (this is the number the release is named after), `GUI_VERSION` for the GUI, `MAC_VERSION` for `src/mac.py`. A change to `src/engine.py` reaches the GUI and Mac builds too, so bump those as well.
3. Run `python src/build.py`. It writes the new `patchers/*_v<version>.py`. Delete the old-version `.py` files from `patchers/` (`git rm`).
4. The helper scripts in `patchers/` are hand-made, not built: rename `NestPatcher_Windows_v*.bat`, `nestpatcher_linux_v*.sh`, `install_deps_linux_v*.sh` (CLI version) and `NestPatcher_GUI_Windows_v*.bat`, `nestpatcher_gui_linux_v*.sh` (GUI version), and update the file names inside them.
5. Rename the guides in `docs/` to the new version numbers and update the versions and file names inside them. Update this README: the table in "Which one do I use?", "Newest versions", "What's new", and the example commands.
6. Update the version in the tests' usage lines (`tests/*.py`), then run them all (the commands are in `.github/workflows/build.yml`).
7. Open a pull request. When it is merged, CI publishes the release `Patchers_v<CLI_VERSION>` by itself. A GUI-only or Mac-only bump doesn't make a new release, because releases follow `CLI_VERSION`.
8. The Android patcher (`patchers/NestPatcher_TiTS_Android_v*.py`) is edited by hand. The Android app has its own version in `android/app/build.gradle.kts`.

## Credits

- **LibraKitty:** the original KittyPatcher and the `.mod` format.
- **Neston (TechyNest):** NestPatcher, the TN mods, and the Android, Linux, macOS and GUI versions.
