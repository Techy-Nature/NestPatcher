# Modv3.0: Bianca's lover, haptics and full scene text

Modv3.0 adds four new mods and updates six. It's for **TiTS 0.9.168**, the same game version as
Modv2.9, so you don't need to delete `backup`. All notes are in the in-game **Changelog**.

## New mods

| File | What it is |
|---|---|
| `TN_HapticsPlus_v3.0.js` | More control over the game's buttplug.io haptics. See `HAPTICS-PLUS.md`. |
| `TN_SexGalleryText_v3.0.js` | Optional: a **Read scene** button with the whole scene in the Sex Gallery. Leave it out for a lite pack. See `SEX-GALLERY-FULL-TEXT.md`. |
| `TN_GameFixes_v1.0.mod` | Fixes six bugs in the game itself. |
| `TN_LauncherFixes_v1.0.mod` | Desktop only, off by default. Fixes the desktop launcher's Reset game data and image pack downloads. |

## Renamed (delete the old copy)

| New name | Old name |
|---|---|
| `TN_Changelog_v3.0.js` | `TN_Changelog_v2.9.js` |
| `TN_BiancaExtras_v3.0.mod` | `TN_BiancaExtras_v2.9.mod` |
| `TN_BiancaExtras_v3.0.js` | `TN_BiancaExtras_v2.9.js` |
| `TN_SiegwulfeSub_v3.0.mod` | `TN_SiegwulfeSub_v2.9.mod` |
| `TN_ShekkaGeneTalk_v3.0.mod` | `TN_ShekkaGeneTalk_v2.9.mod` |
| `TN_ShekkaGeneTalk_v3.0.js` | `TN_ShekkaGeneTalk_v2.9.js` |
| `TN_ShekkaEggs_v3.0.js` | `TN_ShekkaEggs_v2.9.js` |
| `TN_BustGenderFilter_v3.0.js` | `TN_BustGenderFilter_v2.9.js` |

Bianca's Clinic changed too, but kept its file names (`TN_BiancaClinic_v2.9.mod` + `.js`).

NestPatcher stops if it finds an old and a new copy of the same mod in `enabled.txt`, so the
easiest update is a clean copy:

## Updating

1. Back up your `nestmods` folder.
2. Delete every `.mod` and `.js` file and `enabled.txt` in it. Keep `logs` and `backup`.
3. Unzip `TN-Mods-Modv3.0.zip` straight into `nestmods` (the files go in the folder itself, not a
   subfolder).
4. **Windows, Linux and Mac only:** open `enabled.txt` and remove the `#` at the start of the
   `TN_LauncherFixes_v1.0.mod` line if you want the launcher fixes. Leave it as it is on Android.
5. Run NestPatcher: **Test my mods**, then **Patch the game**. The test should end with
   `640 replacements` and no `MISS` lines (a few more on desktop with the launcher fixes on).
6. Restart TiTS. On desktop, the launcher fixes only take effect after a restart.
