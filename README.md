# NestPatcher

NestPatcher puts mods (`.mod` patch files and `.js` scripts) into **Trials in Tainted Space**. It runs on Windows, Linux, macOS and Android (Termux), and it has a browser-based GUI for people who'd rather not use the command line.

> **NestPatcher is not KittyPatcher.** It is based on **KittyPatcher by LibraKitty**, the original Windows patcher. The `.mod` format is hers, and the way mods are found and applied comes from her patcher. Don't use both patchers on the same game, because each one undoes the other's changes. To keep them apart, NestPatcher uses different names for everything:
>
> | | KittyPatcher (LibraKitty) | NestPatcher |
> |---|---|---|
> | Mods folder | `kitty-mods` | `nestmods` |
> | Files it puts in the game | `mods/kitty/`, `kitty-inline.js` | `mods/nest/`, `nest-inline.js` |
> | Systems | Windows | Windows, Linux, macOS, Android (Termux), GUI |
>
> If NestPatcher finds an old `kitty-mods` folder, it renames it to `nestmods` for you, and your clean backups move with it. It also removes anything KittyPatcher left in the game, and warns you if KittyPatcher is sitting in the same folder.

## Which one do I use?

| You are on | Use | Guide |
|---|---|---|
| Windows 10/11, no installing | `NestPatcher_GUI_v0.4_Windows.zip` from [Releases](../../releases) | [Guide_GUI_v0.4.md](docs/Guide_GUI_v0.4.md) |
| Linux, no installing | `NestPatcher_GUI_v0.4-x86_64.AppImage` from [Releases](../../releases) | [Guide_GUI_v0.4.md](docs/Guide_GUI_v0.4.md) |
| Windows, command line | [`patchers/NestPatcher_TiTS_Windows_v1.3.py`](patchers/) + `NestPatcher_Windows_v1.3.bat` | [Guide_Windows_v1.3.md](docs/Guide_Windows_v1.3.md) |
| Debian, Ubuntu, Mint, Fedora, Nobara | [`patchers/NestPatcher_TiTS_Linux_v1.3.py`](patchers/) + `nestpatcher_linux_v1.3.sh` | [Guide_Linux_v1.3.md](docs/Guide_Linux_v1.3.md) |
| macOS | [`patchers/NestPatcher_TiTS_Mac_v1.2.py`](patchers/) | [NestPatcher_Mac_Guide_v1.2.md](docs/NestPatcher_Mac_Guide_v1.2.md) |
| Android (Termux, extracted APK) | [`patchers/NestPatcher_TiTS_Android_v1.2.py`](patchers/), or the GUI script in Termux | [Guide_GUI_v0.4.md](docs/Guide_GUI_v0.4.md) |

The GUI bundles include Python and Node.js. The command-line versions need Python 3 and Node.js installed (Node.js checks every mod for mistakes before the game is touched).

## What the GUI has

- **Setup:** finds your game by itself, or you pick the folder.
- **Patch:** *Test my mods* (changes nothing), *Patch the game*, and *Turn all mods off*.
- **Mods on/off:** tick boxes instead of editing `enabled.txt` by hand.
- **Search game code:** for people writing mods.
- **Report a bug:** makes a zip with the patch log and system info. Your user name and home folder are blanked out.
- **Comfort settings:** A−/A+ text size (80–250%), Auto/Dark/Light theme, and large scrollbars.

## Safety rules (every version)

- **Test first.** If anything says STOP, MISS or INVALID, nothing in the game was changed.
- The first real patch saves clean copies of the game files in `nestmods/backup`. Every later patch starts from those clean copies, so turning a mod off really removes it.
- If a write fails partway through, the game files are put back the way they were.
- After a TiTS update, install the fresh game, delete `nestmods/backup`, then patch again.

## For developers

- `src/engine.py` is the shared patch engine. `src/cli.py` and `src/gui.py` are the front ends. `python src/build.py` glues them into the single-file scripts in `patchers/`. **Edit `src/`, not `patchers/`.** CI fails if `patchers/` is out of date.
- `patchers/NestPatcher_TiTS_Mac_v1.2.py` and `patchers/NestPatcher_TiTS_Android_v1.2.py` are standalone and edited directly.
- `tests/smoke_test.py` patches a tiny fake game, so no TiTS files are needed: `python tests/smoke_test.py patchers/NestPatcher_TiTS_Linux_v1.3.py`.
- `packaging/build_bundles.sh` builds the AppImage and the Windows zip on Linux. It downloads pinned, checksum-verified Python ([python-build-standalone](https://github.com/astral-sh/python-build-standalone)) and Node.js. The Windows `.exe` is a small launcher from `src/launcher/`, compiled with MinGW.
- GitHub Actions runs the smoke test on Windows, Linux and macOS for every push. It builds the bundles, checks the Windows bundle on a real Windows machine, and attaches the bundles to a release when you push a `v*` tag.
- Version numbers go in file names (for example `_v1.3`), so it's always clear which copy is newer.

## Credits

- **LibraKitty:** the original KittyPatcher and the `.mod` format.
- **Neston (TechyNest):** NestPatcher, the TN mods, and the Android, Linux, macOS and GUI versions.
