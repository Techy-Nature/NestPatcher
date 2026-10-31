# NestPatcher Android app v0.1 — step by step

The NestPatcher app runs the NestPatcher patcher on your phone without Termux. It is **not KittyPatcher**. It is based on KittyPatcher by LibraKitty.

You still need the game unpacked into a folder, the same as with Termux. The app patches that unpacked game. It doesn't rebuild or sign the TiTS APK for you.

## What you need

- A 64-bit Android phone or tablet with Android 7 or newer. Almost every phone from the last several years is 64-bit.
- Your TITS-Modding folder, laid out like this:

```
TITS-Modding/
├── extracted/apk/assets/www/   ← the unpacked game (index.html is in here)
└── mods/
    ├── enabled.txt             ← your load order
    └── *.mod / *.js            ← your mods
```

## 1. Get the APK

1. Open the repo's **Actions** tab on GitHub, open the newest green **Test and build** run, and download **nestpatcher-android-apk**. If you'd rather use a tagged version, use **Releases** instead.
2. Unzip it if your phone downloaded a `.zip`. Inside is `NestPatcher_Android_App_v0.1.apk`.

## 2. Install it

1. Tap the APK.
2. If Android says it can't install apps from this source, tap **Settings**, turn on **Allow from this source**, then go back and tap **Install**.
3. If Play Protect warns about an unknown app, tap **More details**, then **Install anyway**. This happens because the app isn't from the Play Store.

## 3. Allow file access (step 1 in the app)

1. Open NestPatcher and tap **Allow file access**.
2. On Android 11 or newer, a settings page opens. Turn on **Allow access to manage all files**, then go back to the app.
3. On older Android, tap **Allow** on the pop-up.
4. Step 1 now says **✓ NestPatcher can read and change your files.**

The app needs this because the patcher reads and writes ordinary files in your TITS-Modding folder.

## 4. Tell it where your files are (step 2)

1. The box starts as `/storage/emulated/0/git.gay-repos/TITS-Modding`. That's the same folder Termux calls `~/storage/shared/git.gay-repos/TITS-Modding`.
2. If yours is somewhere else, tap **Choose folder…** and pick your **TITS-Modding** folder. You can also type the path.
3. Tap **Check folder**. Every line should start with `OK`. A `MISSING` line names the folder or file it couldn't find.

## 5. Pick a patcher (step 3)

**Android (default): NestPatcher_TiTS_Android** is already chosen, and that's the one to use. You can change it:

- **Linux / Windows command-line:** These are the newer engine. They run on the same folder.
- **GUI, opens inside the app:** This opens the full NestPatcher panel in the app, with tabs, mod tick boxes, search and bug reports. Tap **◀ Back to the app** to leave it.
- **Load a .py from my files…:** This adds your own patcher script. It shows up as **Your file: …** in the list.

The app remembers your choice. The **Extra options** box passes options to the patcher, for example `--find shellyTalk`.

## 6. Test, then patch (step 4)

1. Tap **Test my mods**. This changes nothing. Read **What happened** at the bottom.
2. If you see **STOP**, **MISS** or **INVALID**, nothing was changed. Fix that mod, or turn it off in `enabled.txt`.
3. When the test is clean, tap **Patch the game**.
4. Rebuild and sign the TiTS APK the way you usually do, then install it.

Tap **Copy log** to paste the log into a bug report.

## Comfort settings

- **A− / A+** change the text size from 80% to 250%.
- **Theme** switches between Auto, Dark and Light.
- The page scrolls, and its scrollbar always shows.

## How it works

- Python runs inside the app (Chaquopy), so you don't need Termux.
- On a PC, NestPatcher uses Node.js to check every mod's JavaScript for mistakes. In the app, the phone's own browser engine does that check, without running the code.

## Signing (for whoever looks after the repo)

Without secrets, GitHub signs the APK with a throwaway debug key. That works, but each build has a different key, so Android may make you uninstall the old app before installing a new one. Your settings are lost when you do. To keep one key:

1. Make a **new** keystore just for this app. Don't reuse the TiTS signing key.
   `keytool -genkeypair -v -keystore nestpatcher.jks -alias nestpatcher -keyalg RSA -keysize 2048 -validity 10000`
2. Turn it into text: `base64 -w0 nestpatcher.jks > nestpatcher.jks.txt`
3. On GitHub, open **Settings → Secrets and variables → Actions** and add:
   - `NEST_KEYSTORE_BASE64`: the contents of `nestpatcher.jks.txt`
   - `NEST_KEYSTORE_PASSWORD`
   - `NEST_KEY_ALIAS`: `nestpatcher`
   - `NEST_KEY_PASSWORD`
4. Delete `nestpatcher.jks.txt`, and keep `nestpatcher.jks` somewhere safe. Never commit it.
