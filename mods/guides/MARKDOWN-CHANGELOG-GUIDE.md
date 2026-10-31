# Markdown changelog (Modv2.3)

The in-game Changelog can now read its online notes from a plain **Markdown** file.
JSON still works too, so nothing old breaks.

## What's in this folder

| File | What it is |
|---|---|
| `TN_Changelog_v2.3.js` | The changelog mod. Replaces `TN_Changelog.js`. |
| `enabled.txt` | The Modv2.3 load list (the only change: `TN_Changelog.js` is now `TN_Changelog_v2.3.js`). |
| `changelog_v2.3.md` | The full changelog (2.3 back to 1.4) as Markdown. Host this one. |
| `changelog_v2.3.json` | The same notes as JSON, in case you'd rather keep a JSON copy. |
| `TN-Mods-Modv2.3.zip` | The whole pack with these changes, flat like the 2.2 zip. |
| `old/TN_Changelog_v1.6.1_fixed.js` | Your uploaded file with the broken 1.6.1 entry fixed. For reference only (see the note at the end). |

## Step 1: Install the new changelog mod

1. Open your mods folder (`nestmods`, or `TITS-Mods` if you still use that one).
2. Delete or rename the old `TN_Changelog.js` (for example to `TN_Changelog.js.2.2.bak`).
3. Copy in `TN_Changelog_v2.3.js`.
4. Copy in the new `enabled.txt`, or open your own and change the line
   `TN_Changelog.js` to `TN_Changelog_v2.3.js`.
   The file **must** stay listed, or the Changelog button won't appear.
5. Run NestPatcher as usual.
6. In the game, open the main menu: the Info section should say **Changelog (Modv2.3)**.

## Step 2: Host the Markdown file

Any public link that returns the raw file works. GitHub is easiest:

1. Put `changelog_v2.3.md` in a **public** GitHub repo. Renaming it to `changelog.md` is a good idea,
   so the link never has to change when you release a new version.
2. Open the file on github.com and copy the address bar link, for example
   `https://github.com/Techy-Nature/NestPatcher/blob/main/changelog.md`.
   (The mod turns a `blob` link into the raw link by itself, so either works.)

## Step 3: Point the mod at it

1. Open `TN_Changelog_v2.3.js` in a text editor.
2. Find this line near the top:
   ```js
   var REMOTE_URL = "";
   ```
3. Paste your link between the quotes:
   ```js
   var REMOTE_URL = "https://github.com/Techy-Nature/NestPatcher/blob/main/changelog.md";
   ```
4. Save, re-run NestPatcher, and start the game. Open the Changelog: the notes now come from your file.

After that, you only edit the `.md` file. Players see the new notes next time the game starts, without a re-patch.

## Step 4: Writing a new version

Add a new section **at the top**, under the `Latest:` line, and bump `Latest:`:

```markdown
Latest: 2.4

## Modv2.4 — Short title (2026-11-02)

Optional sentence that shows above the list.

- **Mod name:** What changed. You can use **bold**, *italics*, `code` and [links](https://example.com).
  A line indented by two spaces continues the same bullet.
  - An indented dash adds a sub-point.
- **Another mod:** Next change.

### Azra's Family
- Bullets under a ### heading get that mod name automatically.
```

Rules the mod follows:

- **One `##` heading per version.** It needs the version number; `Modv`, `v` and a title are optional.
  `## Modv2.4 — Title (2026-11-02)`, `## 2.4 - Title` and `## [2.4] - 2026-11-02` all work.
- **Date:** in brackets on the heading, or alone on the line under it.
- **`Latest: 2.4`** is optional. Without it, the top version counts as the latest.
  Players whose installed build is older see "Modv2.4 is available".
- **Mod name:** start a bullet with `**Name:**`.
- Anything above the first `##` heading, and anything inside `<!-- ... -->`, is not shown in the game.
- HTML in the file shows as plain text, and only `https://` links become clickable, so a typo can't break the game.

## If something looks wrong

- **The notes didn't change:** the game shows the last good copy it downloaded when it can't reach the link.
  Check the link opens in a browser, and that the repo is public.
- **Old notes show instead:** the file needs at least one `## <version>` heading. If none are found,
  the debug log (TN DEBUG button) says `no versions found (check the ## version headings)`.
- **Want to check a file without patching?** In the game's console (desktop F12), run
  `TnChangelog.parseMarkdown(text)` with the file's text to see what the mod reads.

## About the file you uploaded

It's an older **1.6.1** copy that still uses the Kitty names (`kittyInfo`, `KittyChangelog`).
The current pack's `WikiBrowser.js` uses the TN names, so that copy wouldn't show its button even once fixed.
Its 1.6.1 "TN Code Patch" notes are the same as the 1.9 "TN Rename" notes already in the pack.
Two lines from it aren't in the pack's version: the "please don't use Kitty's mods directly with NestPatcher"
warning and "NEST DEBUG" (the pack says TN DEBUG). Add those to the `.md` file if you want them.
