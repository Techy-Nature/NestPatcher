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
| Windows 10/11, no installing | `NestPatcher_GUI_v0.10_Windows.zip` from [Releases](../../releases) | [Guide_GUI_v0.10.md](docs/Guide_GUI_v0.10.md) |
| Linux, no installing | `NestPatcher_GUI_v0.10-x86_64.AppImage` from [Releases](../../releases) | [Guide_GUI_v0.10.md](docs/Guide_GUI_v0.10.md) |
| Windows, command line | [`patchers/NestPatcher_TiTS_Windows_v1.9.py`](patchers/) + `NestPatcher_Windows_v1.9.bat` | [Guide_Windows_v1.9.md](docs/Guide_Windows_v1.9.md) |
| Debian, Ubuntu, Mint, Fedora, Nobara | [`patchers/NestPatcher_TiTS_Linux_v1.9.py`](patchers/) + `nestpatcher_linux_v1.9.sh` | [Guide_Linux_v1.9.md](docs/Guide_Linux_v1.9.md) |
| macOS, with only the Windows game (TiTS.exe) | [`patchers/NestPatcher_TiTS_Mac_v1.7.py`](patchers/) `--app` the Windows game folder: it patches it and makes TiTS.app | [NestPatcher_Mac_Guide_v1.7.md](docs/NestPatcher_Mac_Guide_v1.7.md) |
| macOS | [`patchers/NestPatcher_TiTS_Mac_v1.7.py`](patchers/) | [NestPatcher_Mac_Guide_v1.7.md](docs/NestPatcher_Mac_Guide_v1.7.md) |
| Make a **Mac app** or **Linux AppImage** of the patched game | GUI 0.10 (**Make Mac app** / **Make AppImage**) or `--export-mac` / `--export-appimage` | [Guide_Export_Mac_AppImage_v1.9.md](docs/Guide_Export_Mac_AppImage_v1.9.md) |
| Android, no Termux (app) | `NestPatcher_Android_App_v0.7.apk` from [Actions](../../actions) or [Releases](../../releases) | [Guide_Android_App_v0.7.md](docs/Guide_Android_App_v0.7.md) |
| Android (Termux, extracted APK) | [`patchers/NestPatcher_TiTS_Android_v1.5.py`](patchers/), or the GUI script in Termux | [Guide_GUI_v0.10.md](docs/Guide_GUI_v0.10.md) |

The GUI bundles include Python and Node.js. The command-line versions need Python 3 and Node.js installed (Node.js checks every mod for mistakes before the game is touched).

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
- After a TiTS update, install the fresh game, delete `nestmods/backup`, then patch again.

## The TN mods

The newest TN mod pack (Modv2.5, for TiTS 0.9.167) is in [`mods/`](mods/): the mods and `enabled.txt` are in [`mods/TITS-Mods/`](mods/TITS-Mods/), and the install guides are in [`mods/guides/`](mods/guides/). See [`mods/README.md`](mods/README.md) for a quick install.

## For developers

- `src/engine.py` is the shared patch engine. `src/cli.py` and `src/gui.py` are the front ends. `python src/build.py` glues them into the single-file scripts in `patchers/`. **Edit `src/`, not `patchers/`.** CI fails if `patchers/` is out of date.
- The Mac patcher is built from `src/mac.py` plus `src/export.py`. `patchers/NestPatcher_TiTS_Android_v1.5.py` is standalone and edited directly.
- `tests/smoke_test.py` patches a tiny fake game, so no TiTS files are needed: `python tests/smoke_test.py patchers/NestPatcher_TiTS_Linux_v1.9.py`.
- `src/export.py` packs the patched game as a Mac app or AppImage (built into the same single-file scripts). `tests/test_export.py` checks it with fake Electron zips, so no download is needed.
- `packaging/build_bundles.sh` builds the AppImage and the Windows zip on Linux. It downloads pinned, checksum-verified Python ([python-build-standalone](https://github.com/astral-sh/python-build-standalone)) and Node.js. The Windows `.exe` is a small launcher from `src/launcher/`, compiled with MinGW.
- GitHub Actions runs the smoke test on Windows, Linux and macOS for every push. It builds the bundles, checks the Windows bundle on a real Windows machine, builds the Android APK, and publishes a release by itself (tag `v<version>`, named `Patchers_v<version>`, with the bundles, APK and patchers attached) the first time a new version from `src/build.py` reaches main.
- `android/` is the Android app (Kotlin + [Chaquopy](https://chaquo.com/chaquopy/) Python). It carries every script in `patchers/`, runs the Android one by default, asks for the folders each patcher needs (a custom .py can list its own with `NEST_NEEDS`), and checks JavaScript with the phone's WebView instead of Node.js. `android/app/src/main/python/nest_android.py` is the glue, tested on a PC by `tests/test_android_harness.py`. CI builds the APK with `gradle assembleRelease`.
- Version numbers go in file names (for example `_v1.9`), so it's always clear which copy is newer.

## Credits

- **LibraKitty:** the original KittyPatcher and the `.mod` format.
- **Neston (TechyNest):** NestPatcher, the TN mods, and the Android, Linux, macOS and GUI versions.
