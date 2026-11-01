# Which version to use: Neston's TN pack or Librakitty's pack

Short version: **use Neston's TN pack (Modv2.5) for everything.** It already has the useful
parts of Librakitty's pack built in. Don't load files from both packs at the same time:
they share file names and the same mod menu function, and whichever loads last wins.

Game version: **TiTS 0.9.168** (Modv2.7). Librakitty's pack was made for 0.9.166.

## Mod by mod

| Mod | Use | File(s) | Why |
|---|---|---|---|
| Mod menu | **Neston** | `AndroidModMenu_v2.5.js` | Same menu functions as Librakitty's `KittyModMenu.js`, plus on/off switches, a debug log, and moving old saves over. Settings are in Options > Android Mods. **Android only:** since Modv2.4 it switches itself off on desktop. On desktop, `TN_Desktop_Menu_v2.5.js` (Options > TN Mod Settings) gives the same settings pages, without on/off switches. **Don't load `KittyModMenu.js` as well.** |
| Shelly crew | **Neston** | `ShellyRecruit.mod`, `Shelly-Custom-Talk-Menu_v2.4.js`, `ShellyShop.mod` | Same recruit, plus her own talk menu, shop, cure quest and family. Replaces Librakitty's `ShellyRecruit.mod` + `ShellyRecruit.js`. |
| Stella | **Neston** | `Stella_v2.7.mod`, `Stella_v2.5.js` | Updated for 0.9.168. Librakitty's version misses on 0.9.167 and 0.9.168. |
| Steph Irson | **Neston** | `StephIrson_v2.7.mod`, `StephIrson.js` | Steph's scenes are Librakitty's, with the patches fixed for 0.9.168. |
| Overqueen Recruit | **Neston** | `OverqueenRecruit_v2.5.mod` | v2.1: Recruit after every ending, works for taurs. Replaces `OverqueenRecruit.mod`. |
| Crew Size | **Neston** | `CrewSize_v2.4.js` | Has Librakitty's Bypass crew limit checkbox merged in. |
| No Dick Limits | **Neston** | `NoDickLimits_v2.4.js` | Newer, with an on/off switch. |
| Wiki Browser | **Neston** | `WikiBrowser_v2.5.js` | Newer. It lives in the sidebar's Info section, not on the main menu. |
| Zheniya | **Librakitty's, via Neston's pack** | `Zheniya_v2.7.mod`, `Zheniya.js` | Librakitty's mod with TN names, patches fixed for 0.9.168. |
| Pregnancy | **Librakitty's, fixed in Neston's pack** | `Pregnancy_v2.4.js` | Librakitty's original never found the game's pregnancy system, so the bars stayed at 0% and Pause did nothing. Fixed. |
| Editor | **Librakitty's, via Neston's pack** | `TitsEditor.js` | Main-menu Editor button, with a Debug Mode checkbox under Game. |
| Save Editor (web) | **Neston** | `TN_Save_Editor_v2.5.js` | A different tool from the Editor: it opens the online save editor. Fine to keep both. |
| Everything starting with `TN_` | **Neston** | | Neston's own mods. Librakitty's pack has no versions of these. |

## Files from Librakitty's pack to remove

`KittyModMenu.js`, `ShellyRecruit.js`, and Librakitty's copies of `ShellyRecruit.mod`,
`Stella.mod`, `Stella.js`, `StephIrson.mod`, `StephIrson.js`, `OverqueenRecruit.mod`,
`CrewSize.js`, `NoDickLimits.js`, `WikiBrowser.js`, `Zheniya.mod`, `Zheniya.js`,
`Pregnancy.js` and `TitsEditor.js`. The TN pack has a replacement for every one of them.

The simplest way is to empty `nestmods` (or `kitty-mods`) (keep the `backup` folder), unzip the TN pack into
it, and use its `enabled.txt`. Step-by-step instructions are in `KITTY-PACK.md`.

## Saves

Saves from Librakitty's pack keep working. The first time a save loads, the TN pack copies
the old Shelly, Stella, Steph, Zheniya, pregnancy-pause and crew-size flags to the new
names. Nothing is deleted.
