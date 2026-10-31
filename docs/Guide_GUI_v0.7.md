# NestPatcher GUI v0.7 (draft): step by step

> **NestPatcher is not KittyPatcher.** Don't use both on one game. NestPatcher reads only a `nestmods` folder; if it finds an old `kitty-mods` folder it renames it for you (backups included) and cleans KittyPatcher's leftovers out of the game. Based on KittyPatcher by LibraKitty.

The GUI is the same patcher with buttons. It opens a **dark control panel in your web browser**. Nothing goes online: the panel only answers this computer, and it uses a secret key made fresh every time it starts.

It works on Windows 10/11, Linux (Debian, Fedora, Nobara...), macOS, and Android through Termux.

## The easy way: ready-made downloads (nothing to install)

Both have Python and Node.js built in, so players don't install anything.

**Windows 10/11:** `NestPatcher_GUI_v0.4_Windows.zip` (from the Releases page)
1. Right-click the zip > **Extract All...** and pick a folder you own, e.g. `C:\Games\NestPatcher`.
2. Put your mods into the `nestmods` folder inside it.
3. Double-click **`NestPatcher_GUI_v0.7.exe`**. Keep the black window open; the panel opens in your browser.
4. If SmartScreen says "Windows protected your PC": **More info > Run anyway** (the .exe isn't code-signed).

**Linux (Debian 10+, Ubuntu, Mint, Fedora, Nobara, Steam Deck):** `NestPatcher_GUI_v0.7-x86_64.AppImage` (from the Releases page)
1. Put the AppImage in a folder, e.g. `~/Games/NestPatcher`, with your `nestmods` folder next to it.
2. Make it runnable: right-click > Properties > Permissions > "Allow executing", or `chmod +x NestPatcher_GUI_v0.7-x86_64.AppImage`.
3. Double-click it (or run it from a terminal to see its messages).
4. If it says FUSE is missing (some Ubuntu/Debian installs): `sudo apt install libfuse2`, or run it with `--appimage-extract-and-run`.

**Android:** there's no APK. See "Running it on Android (Termux)" below.

## Seeing it comfortably

At the top of the panel:
- **A− / A+** make all the text smaller or bigger (80% to 250%). **Reset** goes back to 100%. Keyboard: **Alt + =** and **Alt + -**.
- **Theme:** Auto (follows your system), Dark or Light.
- Both are remembered for next time.
- Long lists and the log have big, visible scrollbars. You can drag the log box's bottom corner to make it taller.

## The tabs

| Tab | What it does |
|---|---|
| **1. Setup** | Pick the game folder (it lists the ones it found; click one) and the mods folder. Shows a checklist: game found, TiTS version, mods found, Node.js found. |
| **2. Patch** | **Test my mods** (changes nothing), **Patch the game**, **Turn all mods off**. Shows the log live, green for OK and red for problems. |
| **Mods on/off** | Tick boxes for every mod. **Save** rewrites `enabled.txt` in the same order and keeps the old one as `enabled.txt.bak`. |
| **Search game code** | Read-only search of the game's JavaScript, for people writing mods. |
| **Report a bug** | Type what went wrong. It makes a zip with the log, `enabled.txt`, the mod list and system info. Your user name and home folder are blanked out, and no save files are included. **Copy report text** puts the summary on your clipboard. |

## Making a Mac app or an AppImage

On the **2. Patch** tab, after patching, the card **Make an app to play on another computer** packs the patched game as a **Mac app** (zip with `TiTS.app`) or, on Linux, a single **AppImage** file. Pick **Intel or AMD (x64)** or **Apple Silicon / ARM (arm64)** first. Files go into `NestExports` next to NestPatcher (**Open NestExports folder** button). Full steps: [Guide_Export_Mac_AppImage_v1.6.md](Guide_Export_Mac_AppImage_v1.6.md).

## Running it on Windows

1. Install Python and Node.js (steps in [Guide_Windows_v1.6.md](Guide_Windows_v1.6.md), Step 1).
2. Put `NestPatcher_TiTS_GUI_v0.7.py` and `NestPatcher_GUI_Windows_v0.7.bat` in a folder, with your `nestmods` folder next to them.
3. Double-click **`NestPatcher_GUI_Windows_v0.7.bat`**.
4. Your browser opens the panel. Keep the black window open while you use it.
5. Setup tab: click your game folder (or **Browse...**), then **Save folders**.
6. Patch tab: **Test my mods**, then **Patch the game**.
7. To stop: the **Close** button, or close the black window.

## Running it on Linux

1. Install Python and Node.js ([Guide_Linux_v1.6.md](Guide_Linux_v1.6.md), Step 1).
2. Same folder layout as above, then:
   ```bash
   chmod +x nestpatcher_gui_linux_v0.7.sh
   ./nestpatcher_gui_linux_v0.7.sh
   ```
3. If the **Browse...** button says there's no folder picker, either paste the path into the box, or install Tk: `sudo apt install python3-tk` (Debian/Ubuntu) or `sudo dnf install python3-tkinter` (Fedora/Nobara).
4. If your TiTS is a `.AppImage`, press **My game is an .AppImage...** on the Setup tab.

## Running it on Android (Termux)

There's no APK yet (see below), but the GUI runs today in Termux and opens in your phone's browser:

```bash
pkg install python nodejs
cd ~/storage/shared/git.gay-repos/TITS-Modding/TITS-Patcher
python NestPatcher_TiTS_GUI_v0.7.py
```

On the Setup tab:
- **Game folder:** `.../TITS-Modding/extracted/apk/assets/www`
- **Mods folder:** `.../TITS-Modding/mods`

After **Patch the game**, rebuild and sign the APK with apksigner as usual. The patcher doesn't sign APKs.

## Making a .exe (Windows)

Do this on a Windows PC:

1. Put `NestPatcher_TiTS_GUI_v0.7.py` and `build_exe_windows_v0.7.bat` in one folder.
2. Double-click **`build_exe_windows_v0.7.bat`**. It installs PyInstaller and builds.
3. Your program is `dist\NestPatcher_GUI_v0.7.exe`. It needs no Python, but players still need **Node.js** for mod checking.
4. Put the `.exe` next to a `nestmods` folder and share both.

Windows SmartScreen may warn about an unsigned `.exe` from the internet. Players click **More info > Run anyway**.

## Making an AppImage (Linux)

Run this on the **oldest** Linux you want to support (an AppImage built on a new distro won't start on an older one; Debian 12 is a good choice):

```bash
sudo apt install python3-venv curl      # or: sudo dnf install python3 curl
chmod +x build_appimage_linux_v0.7.sh
./build_appimage_linux_v0.7.sh
```

You get `NestPatcher_GUI_v0.7-x86_64.AppImage`. It downloads `appimagetool` from the official AppImage GitHub the first time.

## Where bug reports go

Right now the panel tells players to send the zip to whoever gave them the mods. To give them a button instead, open `NestPatcher_TiTS_GUI_v0.7.py`, find these two lines near the GUI section, and fill one in:

```python
REPORT_URL = ""      # e.g. https://github.com/YOU/REPO/issues/new
REPORT_EMAIL = ""    # e.g. an address you're happy to share publicly
```

With `REPORT_URL` set, **Open the report page** opens it with the title and text filled in. With `REPORT_EMAIL` set, **Email it** opens the player's mail app. Either way they attach the zip themselves.

## About an APK (why there isn't one yet)

A real Android app needs a different toolkit (Python can't open a browser panel from inside a normal APK without bundling an Android Python runtime). It would also have to unpack, patch and re-sign the TiTS APK on the phone. The Termux route above does all of that except signing today. A true APK is a possible next step once the desktop GUI has had some testing.

## Known limits of the draft

- Tested on Linux with the real TiTS 0.9.167 files and the full TN Modv2.2 pack (508 replacements, patch, restore, mods on/off, bug report). **Not yet tried on a real Windows PC, Mac or phone.**
- The ready-made Windows `.exe` was built on Linux and hasn't been run on a real Windows PC yet. The AppImage's Python + Node.js bundle was tested on Linux (508/508), but the packed `.AppImage` file itself wasn't started here.
- The `build_*` scripts (PyInstaller route) are optional and haven't been run.
- It closes itself about 2 minutes after you close the browser tab.
