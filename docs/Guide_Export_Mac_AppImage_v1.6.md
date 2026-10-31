# Making a Mac app or a Linux AppImage from the patched game: step by step

> Needs NestPatcher **1.6** (Windows or Linux command line) or the **GUI 0.7**. Based on KittyPatcher by LibraKitty.

Normally NestPatcher changes the game where it sits. **Export** goes one step further: it takes the patched game and packs it into something you can copy to another computer and just open:

| You get | File | Opens on |
|---|---|---|
| **Mac app** | `TiTS_v0.9.167_NestPatched_macOS-x64.zip` (with `TiTS.app` inside) | macOS 10.15 or newer |
| **Linux AppImage** | `TiTS_v0.9.167_NestPatched-x86_64.AppImage` (one file) | Most Linux systems (Debian, Ubuntu, Mint, Fedora, Nobara, Steam Deck) |

The TiTS version in the name comes from the game itself, so you can always tell which game a file has in it.

## How it works (short version)

TiTS is a web game inside a program called **Electron**. The part NestPatcher patches (`resources/app`) is the same on every system. Only Electron is different on Windows, Mac and Linux. So an export:

1. takes your patched `resources/app` folder,
2. puts it inside an Electron for the system you picked,
3. renames everything to TiTS and packs it.

If your game already is that system's version (a `TiTS.app`, or a Linux game folder or unpacked AppImage), its own Electron is kept. Otherwise NestPatcher reads which Electron your game uses (from `TiTS.exe`) and downloads that same one from Electron's official GitHub page. The download is about 100 MB, is checked against Electron's own checksum list, and is saved in `nestmods/downloads`, so the next export doesn't download it again.

Your mods are inside the export, exactly as they were when you made it. **Patch first, then export.** If you change your mods later, patch and export again.

---

## Which one can I make where?

| Made on | Mac app | AppImage |
|---|---|---|
| Windows | ✅ | ❌ (needs Linux) |
| Linux | ✅ | ✅ (needs `squashfs-tools`) |
| Mac (GUI) | ✅ (unpacked and signed for you) | ✅ only with `brew install squashfs` |

---

## Using the GUI (easiest)

1. Start NestPatcher GUI 0.7 and check the **Setup** tab: game found, mods found.
2. Go to **2. Patch** and press **Patch the game**. Wait for `DONE`.
3. In the card **Make an app to play on another computer**, choose **Computer it is for**:
   - **Intel or AMD (x64)**: works on every Mac (Apple Silicon runs it through Rosetta) and on normal Linux PCs.
   - **Apple Silicon M1–M4 / ARM Linux (arm64)**: faster on newer Macs, but won't open on an Intel Mac.
4. Press **Make Mac app** or **Make AppImage**.
5. When the log says `DONE`, press **Open NestExports folder**. Your file is there.

## Using the command line

Open a terminal in your NestPatcher folder (where `nestmods` is).

**Linux:**
```bash
# 1. Patch
python3 NestPatcher_TiTS_Linux_v1.6.py
# 2a. Make the AppImage
python3 NestPatcher_TiTS_Linux_v1.6.py --export-appimage
# 2b. Make the Mac app
python3 NestPatcher_TiTS_Linux_v1.6.py --export-mac
```

**Windows:**
```bat
py NestPatcher_TiTS_Windows_v1.6.py
py NestPatcher_TiTS_Windows_v1.6.py --export-mac
```

Or use the menu (`./nestpatcher_linux_v1.6.sh` or `NestPatcher_Windows_v1.6.bat`): option **7** makes the Mac app, option **8** the AppImage.

The file goes into `NestExports` next to the patcher. Extra options:

| Option | What it does |
|---|---|
| `--arch arm64` | Build for Apple Silicon Macs or ARM Linux instead of x64. |
| `--out FOLDER` | Save somewhere else. |
| `--electron 28.3.3` | Use this Electron version instead of the game's own. |
| `--electron-zip FILE` | Use an Electron zip you downloaded yourself (no internet needed). |
| `--appimage-runtime FILE` | Use an AppImage runtime file you downloaded yourself. |
| `--icon FILE` | Use your own icon (`.png` square, `.icns` or `.svg`). Normally the icon is taken from `TiTS.exe`. |
| `--simple-shell` | Start the game with NestPatcher's small starter instead of the game's own. Try this if the export opens to a blank window. |

---

## Linux: one-time setup for the AppImage

The AppImage is packed with `mksquashfs`. Install it once:

**Debian / Ubuntu / Mint / Pop!_OS**
```bash
sudo apt install squashfs-tools
```

**Fedora / Nobara**
```bash
sudo dnf install squashfs-tools
```

## Opening the AppImage

1. Copy `TiTS_v..._NestPatched-x86_64.AppImage` wherever you like, e.g. `~/Games`.
2. Make it runnable: right-click > **Properties** > **Permissions** > tick **Allow executing file as program**. Or in a terminal:
   ```bash
   chmod +x ~/Games/TiTS_v*_NestPatched-x86_64.AppImage
   ```
3. Double-click it.

If nothing happens, run it from a terminal to see why:

| You see | Do this |
|---|---|
| `FUSE` / `fusermount` errors | `sudo apt install fuse3` (or `sudo dnf install fuse3`), or run it with `--appimage-extract-and-run`. |
| `The SUID sandbox helper binary was found, but is not configured correctly` | Start it with `NEST_NO_SANDBOX=1 ./TiTS_...AppImage`. (The AppImage already does this by itself on Ubuntu 24.04 and other systems that need it.) |
| Blank white window | Export again with `--simple-shell`. |

## Opening the Mac app

**If you made it on a Mac (GUI):** it's already unpacked and signed in `NestExports/TiTS_v..._NestPatched_macOS-.../TiTS.app`. Drag it to **Applications** and double-click it.

**If you made it on Windows or Linux:**

1. Copy the zip to the Mac (USB stick, AirDrop, cloud drive...).
2. Double-click the zip on the Mac to unzip it. **Unzip on the Mac, not on Windows**: Windows loses the links inside the app and it won't open.
3. Open **Terminal** (Applications > Utilities > Terminal).
4. Type `cd ` (with a space), drag the unzipped folder into the Terminal window, and press **Enter**.
5. Type these two lines, pressing **Enter** after each:
   ```bash
   xattr -cr TiTS.app
   codesign --force --deep --sign - TiTS.app
   ```
   If `codesign` is missing, run `xcode-select --install` once, then try again.
6. Double-click **TiTS.app**. If macOS still says it can't check it, right-click it > **Open** > **Open**.

Why step 5: NestPatcher changed the game files, so the app no longer matches the signature it came with. Those two lines remove the "downloaded from the internet" flag and give it a fresh local signature. The same note is inside the zip as `HOW-TO-OPEN.txt`.

---

## Saves

Each copy of the game keeps its saves inside itself, so the Mac app and the AppImage start with no saves. To move a save across, use the game's own **Save to File** on the old computer and **Load from File** on the new one. Exporting again with the same name keeps the saves of the copy you already use.

## Licenses

Electron is MIT licensed. The Mac zip carries Electron's license files in `licenses/`; the AppImage has them next to the program inside it.
