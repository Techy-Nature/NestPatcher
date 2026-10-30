# NestPatcher on Linux (Debian, Ubuntu, Mint, Fedora, Nobara): step by step

> **NestPatcher is not KittyPatcher.** Don't use both on one game. NestPatcher reads only a `nestmods` folder; if it finds an old `kitty-mods` folder it renames it for you (backups included) and cleans KittyPatcher's leftovers out of the game. Based on KittyPatcher by LibraKitty.

One patcher works on all of these. It notices which family you're on and gives the right install command (`apt` for Debian/Ubuntu/Mint, `dnf` for Fedora/Nobara).

## What you need

- Trials in Tainted Space for Linux (a folder with the game program and a `resources` folder, **or** a single `.AppImage` file)
- Python 3 and Node.js
- Your mods folder (for example `TITS-Mods` from the TN pack)

## Step 1: install Python and Node.js (one time)

Open a terminal and run the command for your system:

**Debian / Ubuntu / Mint / Pop!_OS**
```bash
sudo apt update && sudo apt install python3 nodejs
```

**Fedora / Nobara**
```bash
sudo dnf install python3 nodejs
```

Or run the helper that picks the right one:
```bash
bash install_deps_linux_v1.3.sh
```

Check that it worked:
```bash
python3 --version
node --version
```

## Step 2: put the game somewhere you own

`~/Games/TiTS` is a good place. If the game is somewhere like `/opt` that needs root, copy it into your home folder.

**If your TiTS is a single `.AppImage` file**, it can't be patched as it is. Unpack it once:

```bash
python3 NestPatcher_TiTS_Linux_v1.3.py --extract-appimage ~/Games/TiTS.AppImage
```

That makes `~/Games/TiTS-nest/`. From now on start the game with `~/Games/TiTS-nest/AppRun` (you can make a desktop shortcut to it).

## Step 3: set up the NestPatcher folder

```bash
mkdir -p ~/Games/NestPatcher
```

Put in it:
- `NestPatcher_TiTS_Linux_v1.3.py`
- `nestpatcher_linux_v1.3.sh`
- your mods folder, **renamed to `nestmods`** (it holds `enabled.txt` and the `.mod` / `.js` files)

```
~/Games/NestPatcher/
    NestPatcher_TiTS_Linux_v1.3.py
    nestpatcher_linux_v1.3.sh
    nestmods/
        enabled.txt
        AndroidModMenu.js
        ...
```

Make the launcher runnable:
```bash
cd ~/Games/NestPatcher
chmod +x nestpatcher_linux_v1.3.sh
```

## Step 4: test your mods

1. Close TiTS.
2. Run:
   ```bash
   ./nestpatcher_linux_v1.3.sh
   ```
3. Type **1** (Test my mods) and press Enter.
4. The first time it looks in `~/Games`, `~/Downloads`, `~/Desktop` and `/opt`. If it lists several, type the number of the right one.
5. The last line should say **`DRY RUN: ... no changes made.`**

## Step 5: patch for real

```bash
./nestpatcher_linux_v1.3.sh
```
Type **2**. The last line should say **`DONE: ... validation passed`**. Start TiTS as usual.

## Pointing it at the game

If it can't find the game, tell it once (you can drag the folder into the terminal to paste its path):

```bash
python3 NestPatcher_TiTS_Linux_v1.3.py --game ~/Games/TiTS --dry-run
```

It remembers the path. `--mods PATH` works the same way. `--forget` clears both. `--show` prints what it's using, plus your distro, Python, Node.js and TiTS versions.

## Turning mods on and off

Edit `nestmods/enabled.txt`. A `#` at the start of a line turns that mod off. Save, then patch again (menu option 2).

Turn **every** mod off with option **3** (`--restore`).

## Problems

| You see | Do this |
|---|---|
| `Node.js is required` | Run the install line it prints (apt or dnf), then try again. |
| `PERMISSION DENIED` | Copy the game into your home folder, or `sudo chown -R "$USER" /path/to/game`. |
| `TiTS is running` | Close the game. |
| `packed as app.asar` | Menu option **6** (`--unpack-asar`) once, then patch. |
| `Missing enabled files` | A name in `enabled.txt` has no file. Fix it or put `#` in front. |
| `MISS SomeMod.mod` | That mod doesn't fit this TiTS version, or needs another mod that is off. |
| Something else | Menu option **4** makes a bug report zip in `nestmods/logs/`. Send it to the mod author. |

**Nobara / Fedora note:** Flatpak and Steam copies of games live in sandboxed folders. If TiTS came as a Flatpak, copy its game files out to `~/Games/TiTS` and patch that copy.

## After a TiTS update

1. Install the new TiTS.
2. Delete `nestmods/backup`.
3. Run options **1** then **2**.

## Full command list

```bash
python3 NestPatcher_TiTS_Linux_v1.3.py --help
```
