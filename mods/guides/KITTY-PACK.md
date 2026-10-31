# Kitty's other pack, merged into ours (Modv2.2)

The reporter (Windows, TiTS 0.9.167 backer) was running Kitty's own mod pack. Ours started
from the same mods, so the two packs share file names, save flags and the
`registerModMenu` function, and running both at once breaks things. This update takes what
their pack had that ours didn't and folds it into ours, using TN names.

## What came over

| Their file | What we did |
|---|---|
| `Zheniya.mod` + `Zheniya.js` | Added. Renamed to TN (`TN_ZHENIYA_CREW`). All 5 patches apply to 0.9.167 as they are. |
| `Pregnancy.js` | Added and **fixed**. It looked for `window.SC`, which the game never defines, so the bars always said 0% and Pause did nothing. It now finds the game's pregnancy manager directly. Flag is now `TN_PREG_PAUSE`. |
| `TitsEditor.js` | Added, renamed to TN. Main menu **Editor** button, including a Debug Mode checkbox under Game. |
| `StephIrson.js` | Added. Our `StephIrson.mod` called functions that only existed in this file, so Steph never appeared before. Also fixed our `StephIrson.mod` patches, which matched neither 0.9.166 nor 0.9.167. |
| `CrewSize.js` | Their **Bypass crew limit** checkbox merged into ours (it uses the game's own `INFINITE_CREW` flag). |

## What we left out, and why

| Their file | Why it's not needed |
|---|---|
| `KittyModMenu.js` | Ours (`AndroidModMenu.js`) gives the same `registerModMenu`, under Options > Android Mods. Loading both means whichever loads last wins and the other's mods vanish. |
| `ShellyRecruit.mod` / `.js` | Our Shelly mods replace it (crew, talk menu, shop, cure quest, family). |
| `Stella.mod` / `.js` | Ours is the same mod, updated for 0.9.167. Theirs targets 0.9.166 and misses on 0.9.167. |
| `StephIrson.mod` | Same reason; ours is the 0.9.167 version. |
| `OverqueenRecruit.mod` | Ours is v2.1 (Recruit after every ending, taur fixes). |
| `NoDickLimits.js`, `WikiBrowser.js` | Ours are newer versions of the same mods. |

Their pack's `README` says it was built for 0.9.166. On 0.9.167, several of its patches miss
(Stella, Steph), and their patcher carries on anyway, leaving buttons that point at nothing.
That's the most likely cause of the reporter's broken scenes.

## Old saves carry over

The migration in `AndroidModMenu.js` now also copies `KITTY_ZHENIYA_…` and `KITTY_PREG_…`
flags to TN names, as well as Shelly, Stella, Steph and Crew Size. So the reporter's crew
(Shelly, Stella, Steph, Zheniya) stays aboard after switching. Flags from mods neither pack
has (`KITTY_COURTESANS`, `KITTY_EXTRA_IMPLANTS`, `PAULETTE_KITTY`) are left alone.

## Switching from Kitty's pack (Windows), step by step

1. **Save in game**, then close TiTS.
2. **Back up** the `kitty-mods` folder next to the game (copy it to `kitty-mods-old`).
3. **Empty** `kitty-mods`, but keep its `backup` folder. That holds the clean game files.
4. **Copy in** everything from `tn-rename/TITS-Mods/` (unzip `TN-Mods-Modv2.2.zip`), including
   `enabled.txt`.
5. **Copy** `KittyPatcher_TiTS_Desktop.py` into the game folder, next to `resources`. You
   need Python 3 and Node.js installed.
6. Open a terminal in the game folder and run:
   ```
   python KittyPatcher_TiTS_Desktop.py --dry-run
   python KittyPatcher_TiTS_Desktop.py
   ```
   The dry run should end with `DRY RUN: 508 replacements`, and the real run with `DONE`.
   If a line says `MISS`, stop and send `kitty-mods\logs\ModPatchLog.txt`.
7. **Start the game** and load the save. Mod settings are now under **Options > Android Mods**
   rather than a main-menu Mods button. The Editor button stays on the main menu, and the
   Wiki moves to the Info section of the sidebar.
8. **Check:** turn on Debug Mode in Options > Android Mods, tap **TN DEBUG**, and look for
   `[TN] Copied … old KITTY_ save flags to TN_`. The crew should all still be there.

Kitty's own `KittyPatcher.exe` reads the same `.mod` format, so it can apply this pack too.
Ours is safer, because it stops on any missed patch instead of half-patching the game.

## Checked

- With every file in the load list (44 entries) on TiTS 0.9.167, the patcher applies
  **508 of 508** replacements and every patched file passes Node's syntax check.
- The Pregnancy fix uses the game's own pregnancy manager (module 5262 in 0.9.167).
- Not yet tested in the real game.
