# Modv2.7: TiTS 0.9.168

The pack now works on **TiTS 0.9.168**. Almost every mod already did. Only three needed
fixing, because the game update renamed some of its internal functions on Tavros.

## What changed

| New name | Old name | Why |
|---|---|---|
| `Stella_v2.7.mod` | `Stella_v2.4.mod` | Her beach and menu patches pointed at 0.9.167 names (2 MISS). |
| `StephIrson_v2.7.mod` | `StephIrson_v2.4.mod` | The Merchant Deck patches pointed at 0.9.167 names (2 MISS). |
| `Zheniya_v2.7.mod` | `Zheniya.mod` | Her call-girl hall patches pointed at 0.9.167 names (2 MISS). |
| `TN_Changelog_v2.7.js` | `TN_Changelog_v2.6.js` | Shows Modv2.7 as installed. |
| `enabled.txt` | | Uses the four new names. |

Everything else is unchanged. The `.js` halves (`Stella_v2.5.js`, `StephIrson.js`,
`Zheniya.js`) didn't need changes.

**The new `.mod` files only work on 0.9.168.** On 0.9.167 they MISS, so update the game
first.

## Important: clear the old backups

NestPatcher keeps clean copies of the game in `backup` inside your mods folder. Those
copies are from 0.9.167, including its `index.html`, which points at the old game files.
If you leave them there, the patched game will be broken. Delete the `backup` folder once
before the first patch on 0.9.168. NestPatcher makes a fresh one from the new game.

## Install (Android, Termux)

1. **Extract the new APK.** Put the unpacked 0.9.168 game in
   `~/storage/shared/git.gay-repos/TITS-Modding/extracted/apk` the way you did for 0.9.167,
   so `extracted/apk/assets/www` has `main.53b34714.js` in it.
2. **Back up your mods folder:**
   ```
   cd ~/storage/shared/git.gay-repos/TITS-Modding
   cp -r mods mods-2.6-backup
   ```
3. **Delete the old game backups:**
   ```
   rm -rf mods/backup
   ```
4. **Swap in the new files.** Delete these from `mods`:
   `Stella_v2.4.mod`, `StephIrson_v2.4.mod`, `Zheniya.mod`, `TN_Changelog_v2.6.js`,
   `enabled.txt`. Then copy in `Stella_v2.7.mod`, `StephIrson_v2.7.mod`,
   `Zheniya_v2.7.mod`, `TN_Changelog_v2.7.js` and the new `enabled.txt`.
   (Or empty the folder, keeping `logs`, and unzip `TN-Mods-Modv2.7.zip` into it.)
5. **If you had turned mods off** with `#` in your old `enabled.txt`, do that again in the
   new one.
6. **Test first:**
   ```
   cd TITS-Patcher
   python NestPatcher_TiTS_Android_v1.5.py --dry-run
   ```
   The last line should say `DRY RUN: 508 replacements, 19 runtime files; no changes made.`
7. **Patch for real:**
   ```
   python NestPatcher_TiTS_Android_v1.5.py
   ```
8. **Rebuild, sign and install the APK** as usual.
9. **Check it worked.** Open the Info sidebar and tap **Changelog**. It should say
   **Installed: Modv2.7**.

The NestPatcher Android app works the same way: delete `backup` in the mods folder, copy
the new files in, then Test my mods and Patch.

## Install (Windows, Linux, Mac)

1. Install the 0.9.168 game.
2. Back up the `nestmods` folder next to NestPatcher.
3. Delete `nestmods/backup`.
4. Delete `Stella_v2.4.mod`, `StephIrson_v2.4.mod`, `Zheniya.mod`, `TN_Changelog_v2.6.js`
   and `enabled.txt` from `nestmods`, and copy the five new files in.
5. GUI: **Test my mods**, then **Patch the game**. Command line:
   `NestPatcher_Windows_v1.9.bat --dry-run` or `./nestpatcher_linux_v1.9.sh --dry-run`, then
   again without `--dry-run`.

## If something goes wrong

- **MISS on Stella, Steph or Zheniya:** you still have the old `.mod` file, or the game is
  still 0.9.167. Check that `enabled.txt` lists the `_v2.7` names.
- **STOP about two versions of one mod:** an old and a new copy are both in `enabled.txt`.
  Remove the old line.
- **Game shows a black screen after patching:** the old `backup` folder was still there.
  Delete it, reinstall or re-extract the game, and patch again.
- **Go back to 2.6:** restore `mods-2.6-backup` (and the 0.9.167 game). Your saves are fine.

## Checked

- NestPatcher (Linux 1.9) dry run on the real TiTS 0.9.168 files, before the fix:
  502 of 508, with 6 MISS (Stella 2, Steph Irson 2, Zheniya 2).
- After the fix: 508 of 508 on the Linux patcher 1.9 and the Android patcher 1.5, and every
  patched bundle and runtime file passes `node --check`.
- Every webpack module the mods use (Pregnancy, Shelly Shop, items, crew, perks) has the
  same id and exports in 0.9.168.
- Patches whose replacement text calls game functions by name were checked against
  0.9.168. Only the three mods above used names that moved.
- Not yet tested in the real game.
