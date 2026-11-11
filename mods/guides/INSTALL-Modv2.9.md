# Modv2.9: crew stories and new faces

Modv2.9 adds 12 new mods and updates five. It's for **TiTS 0.9.168**, the same game version as
Modv2.8, so you don't need to delete `backup`. All notes are in the in-game **Changelog**.

## New mods

| File | What it is |
|---|---|
| `TN_HandSoRedemption_v2.9.mod` | Hand So's question about making new life, ending with her building her own body. |
| `TN_ResDeckFountain_v2.9.mod` | Aina's wishing fountain on Tavros Residential Deck 5. |
| `TN_SiegwulfeSub_v2.9.mod` | Choose a bimbo domme or bimbo sub Siegwulfe at Dr. Badger's. |
| `TN_FlashbackVisor_v2.9.mod` | VR visor (Zenn on Dhaal, Luca on Canadia) that replays sex scenes and fights. |
| `TN_DaneDating_v2.9.js` | Be Dane's wingman when he asks Syri and Anno out. |
| `TN_BiancaExtras_v2.9.mod` + `.js` | Bianca's love story (William's Part 2) and missing Part 1 scenes. |
| `TN_BiancaClinic_v2.9.mod` + `.js` | Bianca's clinic on the Merchant Deck, with Nest and Dr. Rewell. |
| `TN_SteelePronouns_v2.9.js` | Steele is he, they or she by femininity. |
| `TN_ShekkaGeneTalk_v2.9.mod` + `.js` | Dr. Rewell makes Shekka fertile again. |
| `TN_ShekkaEggs_v2.9.js` | Shekka carries and lays Steele's egg; it goes to the nursery. |
| `TN_RooCrew_v2.9.mod` + `.js` | Recruit Roo the blackjack dealer, with a full Sex menu. |
| `TN_SteeleBody_v2.9.js` | Steele's body in sex scenes: a prehensile cock finds her g-spot and clits, and a tentacle-lined cock on a suula Steele pumps in venom that doubles her pleasure. Our scenes and the game's own. |

## Renamed (delete the old copy)

| New name | Old name |
|---|---|
| `TN_Changelog_v2.9.js` | `TN_Changelog_v2.8.js` |
| `ShellyCabinReturns_v2.9.mod` | `ShellyCabinReturns_v2.8.mod` |
| `TN_SexGallery_v2.9.js` | `TN_SexGallery_v2.8.js` |
| `TN_ShellyCureQuest_v2.9.mod` | `TN_ShellyCureQuest_v2.8.mod` |
| `StephIrson_v2.9.js` | `StephIrson_v2.7.js` |

NestPatcher stops if it finds an old and a new copy of the same mod in `enabled.txt`, so the
easiest update is a clean copy:

## Updating

1. Back up your `nestmods` folder.
2. Delete every `.mod` and `.js` file and `enabled.txt` in it. Keep `logs` and `backup`.
3. Unzip `TN-Mods-Modv2.9.zip` straight into `nestmods` (the files go in the folder itself, not a
   subfolder).
4. Run NestPatcher: **Test my mods**, then **Patch the game**. The test should end with
   `612 replacements` and no `MISS` lines.

Several 2.9 mods (Hand So's Redemption, Flashback Visor, Roo Crew) use buttons from
`TN_DaneCrew_v2.8.mod`, so keep it in `enabled.txt`.
