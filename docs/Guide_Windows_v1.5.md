# NestPatcher on Windows 10 / 11: step by step

> **NestPatcher is not KittyPatcher.** Don't use both on one game. NestPatcher reads only a `nestmods` folder; if it finds an old `kitty-mods` folder it renames it for you (backups included) and cleans KittyPatcher's leftovers out of the game. Based on KittyPatcher by LibraKitty.

## What you need

- Trials in Tainted Space for Windows (the folder with `TiTS.exe` and a `resources` folder inside)
- Python 3 (free)
- Node.js (free; the patcher uses it to check mods for mistakes before it touches the game)
- Your mods folder (for example `TITS-Mods` from the TN pack)

## Step 1: install Python and Node.js (one time)

1. Press the **Start** button, type **PowerShell**, and open it.
2. Copy this line in and press **Enter**:
   ```
   winget install Python.Python.3.12
   ```
3. Then this one:
   ```
   winget install OpenJS.NodeJS.LTS
   ```
4. Close PowerShell.

> No winget? Download the installers from https://www.python.org/downloads/ (tick **"Add python.exe to PATH"**) and https://nodejs.org (the LTS one).

## Step 2: put the game somewhere Windows lets you change it

If TiTS is inside `C:\Program Files`, Windows will block the patcher. Move or copy the whole game folder to somewhere like:

```
C:\Games\TiTS
```

Your Desktop, Documents or Downloads also work.

## Step 3: set up the NestPatcher folder

1. Make a folder, for example `C:\Games\NestPatcher`.
2. Put these two files in it:
   - `NestPatcher_TiTS_Windows_v1.5.py`
   - `NestPatcher_Windows_v1.5.bat`
3. Copy your mods folder in next to them and **rename it to `nestmods`**. Inside it you should see `enabled.txt` and lots of `.mod` and `.js` files.

It should look like this:

```
C:\Games\NestPatcher\
    NestPatcher_TiTS_Windows_v1.5.py
    NestPatcher_Windows_v1.5.bat
    nestmods\
        enabled.txt
        AndroidModMenu.js
        TN_Changelog.js
        ...
```

> Tip: you can also put the patcher files straight into the game folder (next to `TiTS.exe`). Then it finds the game by itself.

## Step 4: test your mods

1. **Close TiTS** if it is open.
2. Double-click **`NestPatcher_Windows_v1.5.bat`**.
3. Type **1** (Test my mods) and press **Enter**.
4. The first time it looks for the game in the usual places. If it asks which one, type its number.
   - If it says *Could not find the game*, see "Pointing it at the game" below.
5. Wait. The last line should say **`DRY RUN: ... no changes made.`**

If you see **STOP**, **MISS** or **INVALID**, nothing was changed. Read the line just above it, or make a bug report (menu option 4).

## Step 5: patch for real

1. Double-click the `.bat` again.
2. Type **2** (Patch the game) and press **Enter**.
3. The last line should say **`DONE: ... validation passed`**.
4. Start TiTS as usual.

## Turning mods on and off

1. Open `nestmods\enabled.txt` in Notepad.
2. Put a `#` at the start of a line to turn that mod off. Remove the `#` to turn it back on.
3. Save, then run option **2** again.

To turn **every** mod off, run option **3**. It copies the clean game files back.

## Pointing it at the game

If it can't find the game by itself:

1. Click in the address bar of File Explorer while you're in the game folder and copy the path.
2. Open PowerShell in the NestPatcher folder (in File Explorer: **File > Open Windows PowerShell**, or Shift + right-click > **Open PowerShell window here**).
3. Run (paste your own path between the quotes):
   ```
   py NestPatcher_TiTS_Windows_v1.5.py --game "C:\Games\TiTS" --dry-run
   ```
4. It remembers that path. From now on the `.bat` just works.

Use `--mods "D:\somewhere\TITS-Mods"` the same way if your mods live somewhere else. `--forget` clears both.

## Problems

| You see | Do this |
|---|---|
| `Python 3 is not installed` | Step 1, then reopen the `.bat`. |
| `Node.js is required` | `winget install OpenJS.NodeJS.LTS`, then close and reopen the window. |
| `PERMISSION DENIED` | Step 2: move the game out of Program Files. |
| `TiTS is running` | Close the game, also check the taskbar tray. |
| `packed as app.asar` | Run option **6** once, then patch. |
| `Missing enabled files` | A name in `enabled.txt` has no file. Fix the spelling or put a `#` in front. |
| `MISS SomeMod.mod` | That mod doesn't fit this TiTS version, or needs another mod that is turned off. |
| Windows Defender pops up | Python is allowed to edit the game. Click **Allow**. |

## After a TiTS update

1. Install the new TiTS (into the same folder, or a new one).
2. Delete `nestmods\backup` (it holds the old version's files).
3. Run option **1**, then **2**.

## Full command list

```
py NestPatcher_TiTS_Windows_v1.5.py --help
```
