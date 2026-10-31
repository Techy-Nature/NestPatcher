# Modv2.5: TN Desktop Menu

Desktop players can now change mod settings again, without the on/off switches.

## What's new

- **`TN_Desktop_Menu_v2.5.js`** (new, Windows / Linux / Mac only). It adds **TN Mod Settings**
  to the game's Options sidebar. Click it to see every mod that has settings, then
  **Settings →** to open one. Press Escape or click outside the panel to close it.
- **No on/off switches.** On desktop, every mod listed in `enabled.txt` is on. To turn one
  off, put `#` in front of it in `enabled.txt` and patch again.
- **Same settings as Android.** Each mod saves its own settings, so the desktop menu and
  Android Mods change the same values.
- **Android is unchanged.** On Android, `TN_Desktop_Menu` does nothing and Android Mods is
  the menu, with its switches, like before. You can leave both files in `enabled.txt` on
  every system: each one only starts on its own system.

16 mods have settings pages: Azra's Family, Bust Gender Filter, Chimerune, Clock Format, Crew
Size, Drakongaru, Holo-Lock Chastity, Phoenix & Thunderbird, Pregnancy, Quad-Wing Pop, Shelly
Cure Quest, Shelly Expansion, Shelly's Family, Stella D'Amore, Taur/Naga Scene Bypass and
Virine. Mods with nothing to set aren't listed.

## Files changed since 2.4

| New name | Why |
|---|---|
| `TN_Desktop_Menu_v2.5.js` | New. |
| `AndroidModMenu_v2.5.js` | Leaves the desktop menu alone when it says no on desktop. |
| `Stella_v2.5.js`, `WikiBrowser_v2.5.js`, `TN_Save_Editor_v2.5.js`, `TN_PhoenixThunderbird_v2.5.js`, `DragoHornitol_v2.5.mod`, `OverqueenRecruit_v2.5.mod`, `TN_taur_naga_bypass_toggle_v2.5.mod` | They used to stop looking for a menu as soon as Android Mods said no. The game loads files in alphabetical order, so on desktop Android Mods says no just before TN Desktop Menu starts. Now they wait 3 seconds before giving up. |
| `TN_Changelog_v2.5.js` | Shows Modv2.5. |
| `enabled.txt` | New names, plus `TN_Desktop_Menu_v2.5.js` right after `AndroidModMenu_v2.5.js`. |

## Install (desktop: Windows, Linux, Mac)

1. **Back up** the `nestmods` folder next to NestPatcher.
2. **Empty it.** Delete every `.mod` and `.js` file and `enabled.txt`. Keep the `backup` and
   `logs` folders.
3. **Unzip** `TN-Mods-Modv2.5.zip` into `nestmods`.
4. **Check `enabled.txt`.** The first two lines under the comment should be
   `AndroidModMenu_v2.5.js` and `TN_Desktop_Menu_v2.5.js`. If you had turned mods off with
   `#`, do that again here.
5. **Patch** with NestPatcher (GUI: Test my mods, then Patch the game. Command line:
   `NestPatcher_Windows_v1.3.bat` or `./nestpatcher_linux_v1.3.sh`).
6. **Check it worked.** Start the game and open Options. **TN Mod Settings** should be under
   the other categories. Open Crew Size, click x2, then check the ship screen.

## Install (Android)

1. Back up your mods folder.
2. Empty it (keep `backup` and `logs`) and unzip `TN-Mods-Modv2.5.zip` into it.
3. Patch with the NestPatcher app (Test my mods, then Patch), or in Termux:
   ```
   cd ~/storage/shared/git.gay-repos/TITS-Modding/TITS-Patcher
   python NestPatcher_TiTS_Android_v1.2.py
   ```
4. Sign and install the APK as usual. Options > **Android Mods** works as before. There
   is no TN Mod Settings entry on Android.

## If something goes wrong

- **No TN Mod Settings on desktop:** check that `enabled.txt` lists `TN_Desktop_Menu_v2.5.js`
  with no `#`, then patch again.
- **A mod is missing from the list:** it only shows up if it has settings. Check that the mod
  is in `enabled.txt` and that the patch log has no MISS lines.
- **Go back to 2.4:** restore your backup and patch again. Nothing in your saves changed.

## Checked

- Every `.js` file passes `node --check`.
- NestPatcher dry run on TiTS 0.9.167 (Android build): 508 of 508 replacements, and every
  patched bundle passes validation.
- Headless browser, desktop (Electron): the desktop menu starts, all 27 mods register, the
  panel lists the 16 with settings, there are no on/off buttons, Crew Size x5 sets the
  multiplier, and Escape closes the panel.
- Headless browser, Android: Android Mods starts as before, and the desktop menu stays off.
- No errors in either.
- Not yet tested in the real game.
