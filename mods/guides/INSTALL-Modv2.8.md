# Modv2.8: Wiki button in the Codex

The Codex now has a **Wiki** button in its left sidebar, right under the **Codex** header.

- **Wiki** opens the TiTS wiki. It's there on every Codex screen.
- While you read a Codex entry (for example **Gabilani**), a second button,
  **Look up: Gabilani**, searches the wiki for it. When the name matches a wiki page, it
  goes straight to that page.
- If the game isn't showing the sidebar, the Wiki button goes in the empty spot of the
  Codex's bottom menu instead (next to **Appearance**).
- It opens in the **Wiki Browser** over the game, with Back, Forward, Search and Close.
- Without the Wiki Browser (or with it switched off in Android Mods), Android opens the
  page in your web browser. On Windows, Linux and Mac, or if the Android app can't open a
  browser, a small wiki window opens over the game, with **Close** and **Open in browser**.
  Android Back and Escape close it.
- **Android:** it has its own switch in Options > Android Mods ("Codex Wiki Button").
- **Desktop:** it's always on while it's in `enabled.txt`. To turn it off, put `#` in front
  of its line and patch again.

This needs TiTS 0.9.168 and Modv2.7. If you're still on 0.9.167, follow
[`INSTALL-Modv2.7.md`](INSTALL-Modv2.7.md) first.

## What changed

| New name | Old name | Why |
|---|---|---|
| `TN_CodexWiki_v2.8.js` | (new) | The Codex Wiki button. |
| `WikiBrowser_v2.8.js` | `WikiBrowser_v2.5.js` | Other mods can now open it on a search, so the button can look up the entry you're reading. |
| `TN_Changelog_v2.8.js` | `TN_Changelog_v2.7.js` | Shows Modv2.8 as installed. |
| `enabled.txt` | | Uses the three new names. |

No `.mod` files changed, so the patch count doesn't change (508). Only the runtime file
count goes up by one.

## Install (Android, Termux)

1. **Back up your mods folder:**
   ```
   cd ~/storage/shared/git.gay-repos/TITS-Modding
   cp -r mods mods-2.7-backup
   ```
2. **Remove the old files.** Delete these from `mods`:
   `WikiBrowser_v2.5.js`, `TN_Changelog_v2.7.js` and `enabled.txt`.
   (Both old and new copies in `enabled.txt` makes the patcher stop with a
   "two versions of one mod" message.)
3. **Copy in the new files:** `TN_CodexWiki_v2.8.js`, `WikiBrowser_v2.8.js`,
   `TN_Changelog_v2.8.js` and the new `enabled.txt`.
4. **If you had turned mods off** with `#` in your old `enabled.txt`, do that again in the
   new one.
5. **Test first:**
   ```
   cd TITS-Patcher
   python NestPatcher_TiTS_Android_v1.5.py --dry-run
   ```
   The last line should say `DRY RUN: 508 replacements, 20 runtime files; no changes made.`
6. **Patch for real:**
   ```
   python NestPatcher_TiTS_Android_v1.5.py
   ```
7. **Rebuild, sign and install the APK** as usual.
8. **Check it worked.**
   - Open the Info sidebar and tap **Changelog**. It should say **Installed: Modv2.8**.
   - In a game, open the **Codex**. A **Wiki** button sits in the left sidebar under
     **Codex**. Tap it, then Close.
   - Open **Database** and pick an entry. A **Look up:** button with the entry's name
     appears under **Wiki**. Tap it: the wiki should search for that entry.

The NestPatcher Android app works the same way: copy the new files in, delete the old
ones, then Test my mods and Patch.

## Install (Windows, Linux, Mac)

1. Back up the `nestmods` folder next to NestPatcher.
2. Delete `WikiBrowser_v2.5.js`, `TN_Changelog_v2.7.js` and `enabled.txt` from `nestmods`.
3. Copy `TN_CodexWiki_v2.8.js`, `WikiBrowser_v2.8.js`, `TN_Changelog_v2.8.js` and the new
   `enabled.txt` into `nestmods`.
4. GUI: **Test my mods**, then **Patch the game**. Command line:
   `NestPatcher_Windows_v1.9.bat --dry-run` or `./nestpatcher_linux_v1.9.sh --dry-run`, then
   again without `--dry-run`.
5. Start the game and check the Codex as in step 8 above.

## If something goes wrong

- **No Wiki button in the Codex:** check that `TN_CodexWiki_v2.8.js` is in `enabled.txt`
  without a `#`, and on Android that "Codex Wiki Button" is on in Android Mods. The patcher
  only copies `.js` files that are listed.
- **Look up opens the wiki home instead of the entry:** you still have
  `WikiBrowser_v2.5.js`. Swap it for `WikiBrowser_v2.8.js`.
- **STOP about two versions of one mod:** an old and a new copy are both in `enabled.txt`.
  Remove the old line.
- **A wiki window opens but stays blank:** the wiki may be down or your connection is off.
  Tap **Open in browser**, or Close and try again later.
- **Go back to 2.7:** restore `mods-2.7-backup` and patch again. Your saves are fine.

## Checked

- `node --check` passes on all three files.
- NestPatcher (Linux 1.9) on the real TiTS 0.9.168 files: 508 of 508 patches, 20 runtime
  files, validation passed.
- Built against the real 0.9.168 Codex sidebar code (`main.53b34714.js`): the buttons go
  right after the Codex header, above the entry list, so React's own redraws leave them
  there. The bottom-menu fallback uses slot 3, which the Codex leaves empty, and never
  replaces a button an entry puts there.
- Ran in a test page that copies the Codex sidebar: home, Database list and an entry;
  Wiki Browser on, off and missing; Android browser hand-off; no sidebar; Android switch off;
  leaving the Codex removes the buttons. No errors.
- Not yet tested in the real game.
