# Extracting a TiTS Android APK for NestPatcher

For **NestPatcher Android patcher 1.6** and the **NestPatcher Android app 0.10**. NestPatcher is based on KittyPatcher by LibraKitty, but it is not KittyPatcher: don't use both on the same game.

This guide covers only the **extraction stage**: turning your own copy of the *Trials in Tainted Space* APK into a normal folder that NestPatcher can patch. The next stage (patching, packing, signing and installing) is in [BUILDING_TITS_ANDROID_MODDED_v1.6.md](BUILDING_TITS_ANDROID_MODDED_v1.6.md).

You start with:

```text
TiTS.apk
```

and end with the game's web files in:

```text
TITS-Modding/extracted/apk/assets/www/
```

which holds files such as `index.html`, `main.<hash>.js`, `content_tavros.<hash>.js` and `content_first14.<hash>.js`.

---

## 1. Install Termux

Install **Termux from F-Droid** (the Play Store copy is outdated). It's dark by default.

---

## 2. Give Termux access to shared storage

1. Open Termux and run:

   ```bash
   termux-setup-storage
   ```

2. Tap **Allow** when Android asks.
3. Check it worked:

   ```bash
   ls -la ~/storage
   ```

   You should see a `shared` entry. `~/storage/shared` is the same place your Files app calls internal storage (`/storage/emulated/0`).

---

## 3. Make the project folder

Everything lives in one project folder:

```text
~/storage/shared/git.gay-repos/TITS-Modding
```

(the Files app shows it as `Internal storage/git.gay-repos/TITS-Modding`, and the NestPatcher app's default folder is `/storage/emulated/0/git.gay-repos/TITS-Modding`: all three are the same folder).

1. Create it and its sub-folders:

   ```bash
   mkdir -p ~/storage/shared/git.gay-repos/TITS-Modding/{TITS-Patcher,original,extracted,mods,output,notes}
   ```

2. Go into it:

   ```bash
   cd ~/storage/shared/git.gay-repos/TITS-Modding
   ```

It should look like this:

```text
TITS-Modding/              ← the project folder (run commands from here)
├── TITS-Patcher/          ← the patcher script, apksigner.jar and your signing key
├── original/              ← your untouched TiTS APK
├── extracted/             ← the unpacked game (made in step 9)
├── mods/                  ← enabled.txt and your .mod / .js files
├── output/                ← the built APKs
└── notes/
```

> **The patcher must sit one folder below the project.** NestPatcher's Android patcher treats the folder *above* its own folder as the project, so it has to be in `TITS-Modding/TITS-Patcher/`, not straight in `TITS-Modding/`.

> **Mods folder name on Android:** the Android patcher reads `TITS-Modding/mods`. The `nestmods` name is only for the PC patchers (Windows, Linux, Mac, GUI).

> **Coming from the old KittyPatcher layout** (`Download/modding/TiTS-Kitty` or `Download/modding/TITS-Patcher`, with a `patcher/` sub-folder)? Move your things over instead of starting again:
>
> ```bash
> cd ~/storage/shared/Download/modding/TITS-Patcher
> mv original/* ~/storage/shared/git.gay-repos/TITS-Modding/original/
> mv mods/* ~/storage/shared/git.gay-repos/TITS-Modding/mods/
> mv patcher/kitty-android.jks ~/storage/shared/git.gay-repos/TITS-Modding/TITS-Patcher/nest-android.jks
> mv patcher/apksigner.jar ~/storage/shared/git.gay-repos/TITS-Modding/TITS-Patcher/
> cd ~/storage/shared/git.gay-repos/TITS-Modding
> ```
>
> If your old folder is called `TiTS-Kitty`, change the first line to `cd ~/storage/shared/Download/modding/TiTS-Kitty`. Renaming `kitty-android.jks` to `nest-android.jks` only changes the file name: the key inside is the same, so builds still install as updates over your current modded TiTS. `mods/backup` comes along with the mods.

---

## 4. Put the original APK in `original/`

1. In Android's Files app, copy your TiTS APK into `Internal storage/git.gay-repos/TITS-Modding/original/`.
2. Never change this copy. It's your clean source for every build.

> Don't copy the APK through **Acode**. Acode loads the whole file into memory and can crash on a 300+ MB APK. Use the Files app or Termux.

---

## 5. Check Termux can see the APK

```bash
cd ~/storage/shared/git.gay-repos/TITS-Modding
ls -lh original
```

You should see something like:

```text
-rw-rw---- 1 u0_a123 media_rw 338M TiTS.apk
```

Spaces in the file name are fine.

---

## 6. Install the tools

```bash
pkg update
pkg install unzip
unzip -v
```

(The build guide installs the rest: Python, Node.js, zip, zipalign and apksigner.)

---

## 7. Look inside the APK first (optional)

An APK is a ZIP file. This lists the game's web files without changing anything:

```bash
unzip -l original/*.apk | grep -Ei 'index\.html|content_.*\.js|main\..*\.js|runtime\..*\.js|vendors\..*\.js'
```

You should see lines like:

```text
assets/www/content_dhaal.55257bf3.js
assets/www/content_first14.5f8cdd31.js
assets/www/content_tavros.49ed0284.js
assets/www/index.html
assets/www/main.0a12358c.js
assets/www/runtime.0aead0b3.js
assets/www/vendors.7c8d3722.js
```

---

## 8. Clear out any old extraction

```bash
rm -rf extracted/apk
mkdir -p extracted/apk
```

This stops files from an older build mixing with the new one.

---

## 9. Extract the APK

From `TITS-Modding`:

```bash
unzip -q original/*.apk -d extracted/apk
```

Leave out `-q` if you want to see every file as it unpacks.

**More than one APK in `original/`?** Don't use `*.apk`. List them with `ls -lh original` and use the exact name, in quotes:

```bash
unzip -q "original/Trials in Tainted Space.apk" -d extracted/apk
```

---

## 10. Check the extraction

```bash
ls -lh extracted/apk/assets/www/index.html
ls -lh extracted/apk/assets/www/content_tavros*.js
ls -lh extracted/apk/assets/www/*.js
```

If those work, the extraction is good. A healthy folder looks like:

```text
extracted/apk/
└── assets/
    └── www/
        ├── index.html
        ├── cordova.js
        ├── cordova_plugins.js
        ├── main.<hash>.js
        ├── runtime.<hash>.js
        ├── vendors.<hash>.js
        ├── content_first14.<hash>.js
        ├── content_tavros.<hash>.js
        └── ...
```

The hashes change with every TiTS build. That's normal: a mod can name `content_tavros.js` and NestPatcher finds `content_tavros.49ed0284.js` by itself.

---

## 11. You're done with extraction

The game is ready for NestPatcher in `extracted/apk/assets/www/`. Go on to [BUILDING_TITS_ANDROID_MODDED_v1.6.md](BUILDING_TITS_ANDROID_MODDED_v1.6.md), which:

1. installs the patcher,
2. tests and patches your mods (in Termux, or with the NestPatcher app),
3. packs the patched files back into an APK, aligns it and signs it,
4. installs it.

---

## 12. When do I extract again?

**Changed, added or turned off a mod?** Don't extract again. Every patch starts from the clean copies in `mods/backup`, so turning a mod off really removes it.

**Files in `extracted/apk` got messed up?** Extract again (steps 8 and 9). Your `mods/backup` stays, and it's still right as long as it's the same TiTS version.

**New TiTS version?**

1. Put the new APK in `original/` and move or delete the old one.
2. Extract again (steps 8 and 9).
3. Test and patch as usual. Since Android patcher 1.6 / app 0.10, NestPatcher notices `mods/backup` belongs to the old TiTS. It moves it to `mods/backup-old-<date>` and makes fresh clean copies by itself. Delete that old folder once the game works. (On patcher 1.5 / app 0.9 or older, move `mods/backup` out of the way yourself first.)
4. A `MISS` line means that mod doesn't fit the new TiTS yet. Turn it off or get a newer version.

> **If `mods/backup` was ever made from an already-modded game,** no patch can fix it. Move `mods/backup` aside, extract a fresh copy from the untouched APK, and patch again so it makes new clean copies.

---

## 13. Common problems

### `cannot find or open original/*.apk`

You're in the wrong folder, or the APK isn't in `original/`:

```bash
cd ~/storage/shared/git.gay-repos/TITS-Modding
ls -lh original
```

### `Permission denied`

Run `termux-setup-storage` again and tap **Allow**. Then check `ls ~/storage/shared`. Work through `~/storage/shared/...`, not `/storage/...`, inside Termux.

### `unzip` asks whether to replace files

`extracted/apk` wasn't empty. Press `N` (or `Ctrl+C`), then:

```bash
rm -rf extracted/apk
mkdir -p extracted/apk
unzip -q original/*.apk -d extracted/apk
```

### `No such file or directory`

Check where you are with `pwd`. Every command here expects:

```bash
cd ~/storage/shared/git.gay-repos/TITS-Modding
```

---

## 14. Quick checklist

```bash
termux-setup-storage
pkg update
pkg install unzip

mkdir -p ~/storage/shared/git.gay-repos/TITS-Modding/{TITS-Patcher,original,extracted,mods,output,notes}
cd ~/storage/shared/git.gay-repos/TITS-Modding
```

Copy the APK into `original/` with the Files app, then:

```bash
ls -lh original
rm -rf extracted/apk
mkdir -p extracted/apk
unzip -q original/*.apk -d extracted/apk
ls -lh extracted/apk/assets/www/index.html
ls -lh extracted/apk/assets/www/content_tavros*.js
```

If both last commands work, the APK is extracted. Next: [BUILDING_TITS_ANDROID_MODDED_v1.6.md](BUILDING_TITS_ANDROID_MODDED_v1.6.md).
