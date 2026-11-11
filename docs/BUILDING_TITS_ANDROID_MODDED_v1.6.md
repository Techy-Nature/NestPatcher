# Building a Modded TiTS Android APK with NestPatcher

For **NestPatcher Android patcher 1.6** and the **NestPatcher Android app 0.10** (part of the Patchers_v1.12 release). NestPatcher is based on KittyPatcher by LibraKitty, but it is not KittyPatcher: don't use both on the same game.

This guide takes the game you extracted with [EXTRACTING_TITS_ANDROID_APK_v1.6.md](EXTRACTING_TITS_ANDROID_APK_v1.6.md), patches your mods into it, packs it back into an APK, signs it, and installs it. Everything happens on the phone, in **Termux**. Signing runs in **Debian through `proot-distro`**, because Termux's own Java crashes on some Android 16 phones.

Keep your TiTS APK private. This is for patching your own copy.

**One folder everywhere.** Every command in this guide uses the same project folder:

| Where | The project folder is |
|---|---|
| Termux | `~/storage/shared/git.gay-repos/TITS-Modding` |
| Files app / NestPatcher app | `/storage/emulated/0/git.gay-repos/TITS-Modding` |
| Debian (after the bind login in step 11) | `/work` |

---

## 1. Project layout

```text
TITS-Modding/
├── TITS-Patcher/
│   ├── NestPatcher_TiTS_Android_v1.6.py
│   ├── apksigner.jar
│   └── nest-android.jks        ← your signing key. Never share or upload it.
├── original/
│   └── TiTS.apk                ← untouched
├── extracted/
│   └── apk/assets/www/         ← the unpacked game NestPatcher edits
├── mods/
│   ├── enabled.txt             ← load order
│   ├── *.mod, *.js             ← your mods
│   ├── backup/                 ← clean copies of the game files (made by the patcher)
│   └── logs/                   ← ModPatchLog.txt, SourceSearch.txt
├── output/                     ← built APKs
└── notes/
```

- The patcher must be **one folder below** the project (`TITS-Modding/TITS-Patcher/`). It treats the folder above its own as the project.
- On Android the mods folder is `mods`. (`nestmods` is the PC patchers' name.)
- Inside the game, NestPatcher writes its files to `assets/www/mods/nest/` (`nest-inline.js` plus your `.js` mods). If it finds KittyPatcher's old `mods/kitty/` folder, it removes it.

Go to the project folder in Termux:

```bash
cd ~/storage/shared/git.gay-repos/TITS-Modding
```

If `~/storage/shared` doesn't exist yet, run `termux-setup-storage` and tap **Allow**.

---

## 2. Install the Termux tools (one time)

In normal Termux:

```bash
pkg update
pkg install python nodejs unzip zip aapt apksigner proot-distro
```

Check them:

```bash
python --version
node --version
which zipalign
```

- `python` runs NestPatcher.
- `nodejs` is **required**. NestPatcher checks every patched file for JavaScript mistakes with Node.js before it writes anything.
- `aapt` brings `zipalign`. `apksigner` brings `apksigner.jar`.

Copy `apksigner.jar` into the patcher folder so Debian can see it later:

```bash
cp $PREFIX/share/java/apksigner.jar TITS-Patcher/apksigner.jar
ls -lh TITS-Patcher/apksigner.jar
```

If `cp` says the file isn't there, find it with `find $PREFIX -name apksigner.jar` and copy that path instead.

---

## 3. Extract the original APK

Follow [EXTRACTING_TITS_ANDROID_APK_v1.6.md](EXTRACTING_TITS_ANDROID_APK_v1.6.md). The short version:

```bash
rm -rf extracted/apk
mkdir -p extracted/apk
unzip -q original/*.apk -d extracted/apk
ls -lh extracted/apk/assets/www/index.html
```

---

## 4. Get NestPatcher

1. On GitHub, open **Techy-Nature/NestPatcher → Releases** and open the newest **Patchers_v…** release (Patchers_v1.12 right now).
2. Download `NestPatcher_TiTS_Android_v1.6.py`.
3. Move it into `TITS-Modding/TITS-Patcher/` with the Files app.
4. Delete any older patcher from that folder (`KittyPatcher_TiTS_Android.py`, `NestPatcher_TiTS_Android_v1.5.py`, …) so you can't run the wrong one.
5. Check:

   ```bash
   ls TITS-Patcher/
   ```

**Prefer an app to Termux for this part?** The **NestPatcher Android app** (`NestPatcher_Android_App_v0.10.apk`, same release) runs this exact patcher with buttons instead of commands. See step 6B. You still need Termux for packing and signing (steps 9 to 15).

---

## 5. Add mods

1. Put your `.mod` and `.js` files in `mods/`.
2. Put the pack's `enabled.txt` in `mods/` too. It lists which mods load, in order. Put `#` in front of a line to turn that mod off.

Rules the patcher enforces:

- Every name in `enabled.txt` must exist in `mods/`, or it **stops** and names the missing file. (Since 1.6, a name whose capital letters differ from the file still works.)
- Two versions of the same mod turned on at once (for example `TN_Holoboard_v2.8.mod` and `TN_Holoboard_v2.9.mod`) also **stops** it. Keep only the newest.
- No `enabled.txt` at all means every `.mod` and `.js` in `mods/` loads.
- `.mod` files hold patch blocks (`Replace [main.js]:` / `With:`, or `Rep` / `W:`, and `Add Javascript:`). Lines starting with `#` are notes. `.js` files are plain JavaScript only.

---

## 6A. Test, then patch (Termux)

From `TITS-Modding`:

1. **Test** (changes nothing in the game):

   ```bash
   python TITS-Patcher/NestPatcher_TiTS_Android_v1.6.py --dry-run
   ```

   A good test ends like:

   ```text
   VALID content_tavros.<hash>.js
   VALID runtime/TN_Changelog_v2.9.js
   ...
   DRY RUN: <number> replacements, <number> runtime files; no changes made.
   ```

2. If you see **STOP**, **MISS** or **INVALID JavaScript**, nothing was changed. Fix or turn off that mod and test again. (See step 18.)
3. When the test is clean, **patch**:

   ```bash
   python TITS-Patcher/NestPatcher_TiTS_Android_v1.6.py
   ```

   It ends with:

   ```text
   DONE: <number> replacements; <number> runtime scripts; validation passed
   ```

4. Check the game loads NestPatcher's files:

   ```bash
   grep -n "mods/nest" extracted/apk/assets/www/index.html
   ls extracted/apk/assets/www/mods/nest/
   ```

`--fresh` is still accepted, but it's the default now, so you don't need to type it.

## 6B. Test, then patch (NestPatcher app)

1. Install `NestPatcher_Android_App_v0.10.apk` and allow file access (full steps in [Guide_Android_App_v0.10.md](Guide_Android_App_v0.10.md)).
2. Step 2: leave **Android (default): NestPatcher_TiTS_Android** picked.
3. Step 3: the folder is already `/storage/emulated/0/git.gay-repos/TITS-Modding`. Tap **Check folders**. Every line should say `OK`.
4. Step 4: tap **Test my mods**. If it's clean, tap **Patch the game**.
5. Go back to Termux for step 9.

---

## 7. How backups work

- The first real patch saves clean copies of the game files it touches (and `index.html`) in `mods/backup/`. Every later patch starts from those clean copies, so turning a mod off really removes it, and you don't need to extract again after changing mods.
- If a write fails partway, the game files are put back.
- **After a TiTS update** (new APK, extracted again), patcher 1.6 sees that `mods/backup` belongs to the old version. It moves it to `mods/backup-old-<date>`, keeps the clean copies of files the update didn't change, and makes fresh ones. Delete the old folder once the game works. You don't need to move `mods/backup` yourself any more.
- If `mods/backup` was ever made from an already-modded game, no patch can fix it: move it aside, extract the untouched APK again, and patch.
- There is no `--rebackup` option. It was removed so clean copies can't be overwritten with modded ones.

---

## 8. Search the game code (for writing mods)

Read-only:

```bash
python TITS-Patcher/NestPatcher_TiTS_Android_v1.6.py --find "author(\"Wsan\")" "flags.MET_STELLA"
```

Results go to `mods/logs/SourceSearch.txt`.

---

## 9. Build an unsigned APK

Start from a fresh copy of the original APK, then put the patched `assets/www` into it:

```bash
rm -f output/TiTS-Nest-unsigned.apk
cp original/*.apk output/TiTS-Nest-unsigned.apk

cd extracted/apk
zip -q -r -u ../../output/TiTS-Nest-unsigned.apk assets/www
cd ../..
```

Check the patched files are inside:

```bash
unzip -p output/TiTS-Nest-unsigned.apk assets/www/index.html | grep "mods/nest"
unzip -l output/TiTS-Nest-unsigned.apk | grep "assets/www/mods/nest"
```

---

## 10. Align the APK

Termux's `zipalign` doesn't need `-p`/`-P`:

```bash
rm -f output/TiTS-Nest-aligned.apk
zipalign -f -v 4 output/TiTS-Nest-unsigned.apk output/TiTS-Nest-aligned.apk
zipalign -c -v 4 output/TiTS-Nest-aligned.apk
```

Never change an APK after it's signed. That breaks the signature.

---

## 11. Enter Debian with the project at `/work`

### Install Debian (one time)

In normal Termux:

```bash
proot-distro install debian
```

### Log in with the project bound to `/work`

Run this in **normal Termux** (not inside Debian: if your prompt says `root@localhost`, type `exit` first):

```bash
cd ~/storage/shared/git.gay-repos/TITS-Modding
ls -lh TITS-Patcher/apksigner.jar output/TiTS-Nest-aligned.apk
proot-distro login debian --bind /storage/emulated/0/git.gay-repos/TITS-Modding:/work --work-dir /work
```

Inside Debian, check the bind worked **before signing**:

```bash
pwd
ls -lh TITS-Patcher/apksigner.jar output/TiTS-Nest-aligned.apk
```

`pwd` **must print `/work`**, and `ls` must find both files. If not, type `exit` and run the login again from Termux.

Why the bind line looks like that:

- It uses the folder's **real path** (`/storage/emulated/0/...`). `~/storage/shared` is only a Termux shortcut, and proot often can't bind a shortcut: that's the `can't sanitize binding` error.
- It has **no `$`**. Some Markdown viewers add a `\` before `$` when you copy, which breaks the command.
- If you ever move the project folder, change the path after `--bind` to match.

### Reinstalling Debian from scratch

Your key and `apksigner.jar` live in `TITS-Modding/TITS-Patcher/`, not inside Debian, so a reinstall doesn't touch them. In normal Termux:

```bash
ls -lh ~/storage/shared/git.gay-repos/TITS-Modding/TITS-Patcher/nest-android.jks
pkg update
pkg upgrade proot-distro
proot-distro reset debian
```

(If Debian isn't installed, use `proot-distro install debian` instead of `reset`.) Test a plain `proot-distro login debian`, type `exit`, then do the bind login above and step 12 again: a new Debian has no Java.

---

## 12. Install Java inside Debian (one time)

Inside Debian:

```bash
apt update
apt install -y default-jdk-headless
java -version
```

`default-jdk-headless` installs whatever Java your Debian ships. Naming a version (like `openjdk-21-jdk-headless`) can fail with `Unable to locate package`. Java 17 or newer works.

---

## 13. Your signing key

**Already have `kitty-android.jks` from the KittyPatcher days?** Keep using that key, or Android won't accept the new build as an update. Just rename the file once (in normal Termux):

```bash
mv ~/storage/shared/git.gay-repos/TITS-Modding/TITS-Patcher/kitty-android.jks ~/storage/shared/git.gay-repos/TITS-Modding/TITS-Patcher/nest-android.jks
```

The key inside doesn't change, so nothing else does. (If you moved it with the extraction guide, it's already renamed.)

**No key yet?** Make one, **once**, inside Debian at `/work`:

```bash
keytool -genkeypair -keystore TITS-Patcher/nest-android.jks -alias nest -keyalg RSA -keysize 2048 -validity 10000
```

Pick a password and remember it. Back up `nest-android.jks` somewhere private. Don't make a new key for each build, and don't use the NestPatcher app's own key for TiTS.

---

## 14. Sign the APK

Inside Debian, at `/work`:

```bash
rm -f output/TiTS-Nest-Modded.apk
java -jar TITS-Patcher/apksigner.jar sign --ks TITS-Patcher/nest-android.jks --out output/TiTS-Nest-Modded.apk output/TiTS-Nest-aligned.apk
```

Type the keystore password when asked. Your keystore holds one key, so `apksigner` picks it by itself (old key alias `kitty`, new one `nest`). If it ever asks which key, add `--ks-key-alias kitty` (or `nest`).

---

## 15. Check the signature

Still in Debian:

```bash
java -jar TITS-Patcher/apksigner.jar verify --verbose --print-certs output/TiTS-Nest-Modded.apk
```

It should say `Verifies`. Then leave Debian:

```bash
exit
```

---

## 16. Install it

The finished APK is `TITS-Modding/output/TiTS-Nest-Modded.apk`.

**Updating a modded TiTS you signed with the same key before:** just tap the APK and **Update**. Saves stay.

**First modded install (over the official TiTS):** your key isn't the TiTS developer's, so Android won't install over the official app.

1. Export every save you care about, and check the files are outside the app (for example in Downloads).
2. Keep the original APK backed up (it's in `original/`).
3. Uninstall the official TiTS.
4. Install `TiTS-Nest-Modded.apk`.
5. Import your saves.

---

## 17. Short rebuild loop (after changing mods)

Same TiTS version, mods changed. **Normal Termux:**

```bash
cd ~/storage/shared/git.gay-repos/TITS-Modding

python TITS-Patcher/NestPatcher_TiTS_Android_v1.6.py --dry-run
python TITS-Patcher/NestPatcher_TiTS_Android_v1.6.py

rm -f output/TiTS-Nest-unsigned.apk output/TiTS-Nest-aligned.apk output/TiTS-Nest-Modded.apk
cp original/*.apk output/TiTS-Nest-unsigned.apk

cd extracted/apk
zip -q -r -u ../../output/TiTS-Nest-unsigned.apk assets/www
cd ../..

zipalign -f -v 4 output/TiTS-Nest-unsigned.apk output/TiTS-Nest-aligned.apk
zipalign -c -v 4 output/TiTS-Nest-aligned.apk

proot-distro login debian --bind /storage/emulated/0/git.gay-repos/TITS-Modding:/work --work-dir /work
```

(Only run the second `python` line if the first one is clean. Using the app? Do its Test and Patch instead of the two `python` lines.)

**Debian** (your prompt now says `root@localhost`):

```bash
pwd
ls -lh TITS-Patcher/apksigner.jar TITS-Patcher/nest-android.jks output/TiTS-Nest-aligned.apk

java -jar TITS-Patcher/apksigner.jar sign --ks TITS-Patcher/nest-android.jks --out output/TiTS-Nest-Modded.apk output/TiTS-Nest-aligned.apk
java -jar TITS-Patcher/apksigner.jar verify --verbose --print-certs output/TiTS-Nest-Modded.apk

exit
```

If `pwd` isn't `/work` or a file is missing, stop and fix that first. Then install `output/TiTS-Nest-Modded.apk`.

---

## 18. Common problems

| Message or problem | Fix |
|---|---|
| `Game folder not found: .../extracted/apk/assets/www` | The patcher isn't one folder below the project, or the game isn't extracted. It must be `TITS-Modding/TITS-Patcher/NestPatcher_TiTS_Android_v1.6.py`, and `TITS-Modding/extracted/apk/assets/www/index.html` must exist. |
| `STOP: Missing enabled files: …` | A name in `enabled.txt` isn't in `mods/`. Fix the spelling, add the file, or put `#` in front of the line. |
| `STOP: two versions of the same mod are turned on` | Keep only the newest version in `enabled.txt`. |
| `MISS <mod> -> content_x.js` then `STOP` | That mod's find text isn't in this TiTS version (usually after a TiTS update). Turn it off or get a newer version. |
| `STOP: unsafe needle (N)` | The find text is in the game more than 8 times. Make it longer. |
| `INVALID JavaScript in …` | The patched result has a syntax error. Nothing was written. Send `mods/logs/ModPatchLog.txt` and the mod. Don't use `--skip-validation` to hide it. |
| `STOP: Node.js is required` | `pkg install nodejs` in Termux, then `node --version`. |
| `NOTE: the backups … are from a different TiTS version` | Normal after a TiTS update. A real patch moves them to `mods/backup-old-<date>` and makes new ones. |
| `unrecognized arguments: --rebackup` | That option was removed on purpose. See step 7. |
| `can't sanitize binding`, `can't chdir("/work")` or `Unable to access jarfile` | The Debian bind failed. `exit` to Termux, `cd ~/storage/shared/git.gay-repos/TITS-Modding`, and run the exact login line from step 11. |
| `apksigner.jar: No such file or directory` | In Termux: `cp $PREFIX/share/java/apksigner.jar ~/storage/shared/git.gay-repos/TITS-Modding/TITS-Patcher/`. Inside Debian, `$PREFIX` doesn't exist, so don't copy from there. |
| Java aborts mentioning `PerfettoTrace` | Termux's Java crashes on some Android 16 phones. Sign inside Debian (steps 11 to 15). |
| `zipalign` rejects `-P` or `-p` | Use `zipalign -f -v 4 in.apk out.apk` and check with `zipalign -c -v 4 out.apk`. |
| Android says the app conflicts with the installed one | It's signed with a different key. Use the same `nest-android.jks` every time. For the first switch from official TiTS, export saves, uninstall, install, import. |
| A vanilla scene crashes after recruiting a modded character | Don't assume the save is broken. A mod may have swapped a real game character for a plain object that lacks methods like `lactationQ()`. Mods should wrap the game's real character instead. |

---

## 19. Final checklist

```text
[ ] Original APK in original/, saves exported
[ ] Patcher is TITS-Modding/TITS-Patcher/NestPatcher_TiTS_Android_v1.6.py (no old KittyPatcher next to it)
[ ] Test (--dry-run or the app's Test my mods) has no STOP / MISS / INVALID
[ ] Real patch ends with DONE … validation passed
[ ] extracted/apk/assets/www/index.html loads mods/nest
[ ] output/TiTS-Nest-unsigned.apk contains assets/www/mods/nest
[ ] zipalign -c passes
[ ] Signed with your same nest-android.jks (ex kitty-android.jks) inside Debian at /work
[ ] apksigner verify passes
[ ] Installed output/TiTS-Nest-Modded.apk
```
