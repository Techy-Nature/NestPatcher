# NestPatcher GUI v0.14 (draft): step by step

> **NestPatcher is not KittyPatcher.** Don't use both on one game. NestPatcher reads only a `nestmods` folder; if it finds an old `kitty-mods` folder it renames it for you (backups included) and cleans KittyPatcher's leftovers out of the game. Based on KittyPatcher by LibraKitty.

The GUI is the same patcher with buttons. It opens a **dark control panel in your web browser**. Nothing goes online: the panel only answers this computer, and it uses a secret key made fresh every time it starts.

It works on Windows 10/11, Linux (Debian, Fedora, Nobara...), macOS, and Android through Termux.

## The easy way: ready-made downloads (nothing to install)

Both have Python and Node.js built in, so players don't install anything.

**Windows 10/11:** `NestPatcher_GUI_v0.14_Windows.zip` (from the Releases page)
1. Right-click the zip > **Extract All...** and pick a folder you own, e.g. `C:\Games\NestPatcher`.
2. Put your mods into the `nestmods` folder inside it.
3. Double-click **`NestPatcher_GUI_v0.14.exe`**. Keep the black window open; the panel opens in your browser.
4. If SmartScreen says "Windows protected your PC": **More info > Run anyway** (the .exe isn't code-signed).

**Linux (Debian 10+, Ubuntu, Mint, Fedora, Nobara, Steam Deck):** `NestPatcher_GUI_v0.14-x86_64.AppImage` (from the Releases page)
1. Put the AppImage in a folder, e.g. `~/Games/NestPatcher`, with your `nestmods` folder next to it.
2. Make it runnable: right-click > Properties > Permissions > "Allow executing", or `chmod +x NestPatcher_GUI_v0.14-x86_64.AppImage`.
3. Double-click it (or run it from a terminal to see its messages).
4. If it says FUSE is missing (some Ubuntu/Debian installs): `sudo apt install libfuse2`, or run it with `--appimage-extract-and-run`.

**Android:** use the NestPatcher Android app ([Guide_Android_App_v0.10.md](Guide_Android_App_v0.10.md)), or see "Running it on Android (Termux)" below.

**Linux users with the Windows zip:** use the AppImage instead of running the Windows zip through Wine/Proton. The AppImage patches the Windows copy of TiTS (the `-win` folder) too.

## Updating to a new version

Your mods and settings are kept.

1. **Windows zip:** unzip the new zip next to the old folder. Move the `nestmods` folder from the old folder into the new one (replace the empty one it came with). To keep your saved folders, text size and theme, also move `NestPatcher_TiTS_GUI.settings.json`. Then delete the old folder.
2. **AppImage:** put the new AppImage in the same folder as the old one, `chmod +x` it, and delete the old one. Nothing else moves.
3. **Script (`.py` + `.bat` / `.sh`):** put the new files in the same folder and delete the old ones.

You don't have to patch again after updating NestPatcher, but it's safe to.

## After a TiTS update

1. Install the new TiTS. If it's in a new folder, pick it on the **Setup** tab.
2. **Test my mods**, then **Patch the game**.
3. GUI 0.14 notices that `nestmods/backup` is from the old TiTS, moves it to `nestmods/backup-old-<date>`, and makes fresh backups. Delete that folder once the game works. (GUI 0.13 and older: delete `nestmods/backup` yourself before patching.)
4. **Turn all mods off** won't put an old version's backups back. It says so instead.

## Seeing it comfortably

At the top of the panel:
- **A− / A+** make all the text smaller or bigger (80% to 250%). **Reset** goes back to 100%. Keyboard: **Alt + =** and **Alt + -**.
- **Theme:** Auto (follows your system), Dark or Light.
- Both are remembered for next time.
- Long lists and the log have big, visible scrollbars. You can drag the log box's bottom corner to make it taller.
- **Back to the top:** once you scroll down, a round **▲ Top** button (dark grey in dark mode, white in light mode) shows in the bottom corner. Keyboard: press **Up arrow** (or **Home**). While you're typing in a box, picking from a drop-down, or have the log box selected, Up works as normal there; click on an empty part of the page first to get the jump back.

## The tabs

| Tab | What it does |
|---|---|
| **1. Setup** | Pick the game folder (it lists the ones it found; click one) and the mods folder. Shows a checklist: game found, TiTS version, mods found, Node.js found. |
| **2. Patch** | **Test my mods** (changes nothing), **Patch the game**, **Turn all mods off**. Shows the log live, green for OK and red for problems. |
| **Mods on/off** | Tick boxes for every mod. **Save** rewrites `enabled.txt` in the same order and keeps the old one as `enabled.txt.bak`. |
| **Search game code** | Read-only search of the game's JavaScript, for people writing mods. |
| **Report a bug** | Type what went wrong. It makes a zip with the log, `enabled.txt`, the mod list and system info. Your user name and home folder are blanked out, and no save files are included. **Copy report text** puts the summary on your clipboard. |

## Making a Mac app or an AppImage

On the **2. Patch** tab, after patching, the card **Make an app to play on another computer** packs the patched game as a **Mac app** (zip with `TiTS.app`) or a single **AppImage** file. Pick **Intel or AMD (x64)** or **Apple Silicon / ARM (arm64)** first. Files go into `NestExports` inside your mods folder (**Open NestExports folder** button). The Mac app is already signed; on the Mac, unzip it and double-click **Open TiTS.command**. Full steps: [Guide_Export_Mac_AppImage_v1.12.md](Guide_Export_Mac_AppImage_v1.12.md).

## Running it on Windows

1. Install Python and Node.js (steps in [Guide_Windows_v1.12.md](Guide_Windows_v1.12.md), Step 1).
2. Put `NestPatcher_TiTS_GUI_v0.14.py` and `NestPatcher_GUI_Windows_v0.14.bat` in a folder, with your `nestmods` folder next to them.
3. Double-click **`NestPatcher_GUI_Windows_v0.14.bat`**.
4. Your browser opens the panel. Keep the black window open while you use it.
5. Setup tab: click your game folder (or **Browse...**), then **Save folders**.
6. Patch tab: **Test my mods**, then **Patch the game**.
7. To stop: the **Close** button, or close the black window.

## Running it on Linux

1. Install Python and Node.js ([Guide_Linux_v1.12.md](Guide_Linux_v1.12.md), Step 1).
2. Same folder layout as above, then:
   ```bash
   chmod +x nestpatcher_gui_linux_v0.14.sh
   ./nestpatcher_gui_linux_v0.14.sh
   ```
3. If the **Browse...** button says there's no folder picker, either paste the path into the box, or install Tk: `sudo apt install python3-tk` (Debian/Ubuntu) or `sudo dnf install python3-tkinter` (Fedora/Nobara).
4. If your TiTS is a `.AppImage`, press **My game is an .AppImage...** on the Setup tab.
5. **On Linux, use the Linux AppImage or script, not the Windows zip through Wine/Proton.** The Linux build patches the Windows copy of TiTS (the `-win` folder) just fine. GUI 0.13 under Wine could stop with `CRASH: OSError: [WinError 1168] Element not found`; 0.14 fixes that and shows a note when it sees Wine, but the Linux build is still the better fit.

## Running it on Android (Termux)

There's no APK yet (see below), but the GUI runs today in Termux and opens in your phone's browser:

```bash
pkg install python nodejs
cd ~/storage/shared/git.gay-repos/TITS-Modding/TITS-Patcher
python NestPatcher_TiTS_GUI_v0.14.py
```

On the Setup tab:
- **Game folder:** `.../TITS-Modding/extracted/apk/assets/www`
- **Mods folder:** `.../TITS-Modding/mods`

After **Patch the game**, rebuild and sign the APK with apksigner as usual. The patcher doesn't sign APKs.

## Making a .exe (Windows)

Do this on a Windows PC:

1. Put `NestPatcher_TiTS_GUI_v0.14.py` and `build_exe_windows_v0.14.bat` in one folder.
2. Double-click **`build_exe_windows_v0.14.bat`**. It installs PyInstaller and builds.
3. Your program is `dist\NestPatcher_GUI_v0.14.exe`. It needs no Python, but players still need **Node.js** for mod checking.
4. Put the `.exe` next to a `nestmods` folder and share both.

Windows SmartScreen may warn about an unsigned `.exe` from the internet. Players click **More info > Run anyway**.

## Making an AppImage (Linux)

Run this on the **oldest** Linux you want to support (an AppImage built on a new distro won't start on an older one; Debian 12 is a good choice):

```bash
sudo apt install python3-venv curl      # or: sudo dnf install python3 curl
chmod +x build_appimage_linux_v0.14.sh
./build_appimage_linux_v0.14.sh
```

You get `NestPatcher_GUI_v0.14-x86_64.AppImage`. It downloads `appimagetool` from the official AppImage GitHub the first time.

## Where bug reports go

Right now the panel tells players to send the zip to whoever gave them the mods. To give them a button instead, open `NestPatcher_TiTS_GUI_v0.14.py`, find these two lines near the GUI section, and fill one in:

```python
REPORT_URL = ""      # e.g. https://github.com/YOU/REPO/issues/new
REPORT_EMAIL = ""    # e.g. an address you're happy to share publicly
```

With `REPORT_URL` set, **Open the report page** opens it with the title and text filled in. With `REPORT_EMAIL` set, **Email it** opens the player's mail app. Either way they attach the zip themselves.

## Android app

There is an Android app now: [Guide_Android_App_v0.10.md](Guide_Android_App_v0.10.md). It carries every patcher in this repo, including this GUI's engine, and checks mods with the phone's own browser engine instead of Node.js.

## Known limits of the draft

- Tested on Linux with the real TiTS 0.9.167 files and the full TN Modv2.2 pack (508 replacements, patch, restore, mods on/off, bug report). **Not yet tried on a real Windows PC, Mac or phone.**
- The ready-made Windows `.exe` is started on a real Windows machine by CI for every change (it serves the panel), and the bundled Python passes the smoke test there. The AppImage's Python + Node.js bundle is tested on Linux by CI.
- Running the Windows zip through Wine/Proton works since 0.14, but the Linux AppImage is the supported way on Linux.
- The `build_*` scripts (PyInstaller route) are optional and haven't been run.
- It closes itself about 2 minutes after you close the browser tab.
