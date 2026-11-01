# TN Mod Pack Changelog

Latest: 2.7

<!--
  How this file works (this comment is not shown in the game):
  - One "## Modv#.# — Title (YYYY-MM-DD)" heading per version, newest first.
  - One "- **Mod name:** what changed" bullet per change.
  - Indent a line by two spaces to continue the bullet above it.
  - "  - " (indented dash) adds a sub-point under a bullet.
  - Text under the heading that isn't a bullet shows above the list.
  - You can use **bold**, *italics*, ~~strike~~, `code` and [links](https://example.com).
  - Bump "Latest:" when you release; players on an older build see "Modv#.# is available".
-->

## Modv2.7 — TiTS 0.9.168 and a Codex wiki button (2026-11-01)

The pack now works on TiTS 0.9.168 (508 of 508 patches). Delete the `backup` folder in your mods folder before the first patch on the new game, because it holds 0.9.167 copies.

- **Stella D'Amore:** Updated for 0.9.168, which renamed her scene functions. Now `Stella_v2.7.mod`.
- **Steph Irson:** Updated for 0.9.168. Now `StephIrson_v2.7.mod`.
- **Zheniya:** Updated for 0.9.168. Now `Zheniya_v2.7.mod`.
- **Codex Wiki Button:** New. The Codex sidebar has a **Wiki** button under the Codex header. It opens the TiTS wiki. While you read an entry, like Gabilani, a **Look up: Gabilani** button searches the wiki for it. It opens in the Wiki Browser over the game. Without the Wiki Browser, Android opens it in your web browser and desktop opens a small wiki window. It has its own switch in Android Mods. File: `TN_CodexWiki_v2.7.js`.
- **Wiki Browser:** Other mods can now open it on a search or a page, which the Codex button uses. Now `WikiBrowser_v2.7.js`.
- **Changelog:** Shows Modv2.7 as installed. Now `TN_Changelog_v2.7.js`.
- **All other mods:** Work on 0.9.168 as they are. The three new `.mod` files don't work on 0.9.167.

## Modv2.6 — Tattoos and chastity on PC (2026-10-31)

- **Treetop Tattoo Clarity:** Now patches the Windows, Linux and Mac game too. Before, two of its patches only matched the Android game, so patching on PC stopped with MISS.
- **Holo-Lock Chastity:** Same fix: it now patches the PC game as well as Android.
- **Changelog:** `TN_Changelog_v2.6.js` shows Modv2.6 as installed (the old `TN_Changelog_v2.5.js` still said Modv2.5). Replace it in `enabled.txt`.
- **NestPatcher (1.7 PC, 1.5 Android/Mac, GUI 0.8, app 0.5):** Every patcher now lists the folders it needs (`NEST_NEEDS`), so the Android app asks for the right ones for any of them, the Mac patcher included, even after renaming the file.
- **NestPatcher (1.5 PC, 1.4 Android/Mac, GUI 0.6, app 0.4):** If two versions of one mod are both in `enabled.txt` (for example `TN_TattooParlor.mod` and `TN_TattooParlor_v2.6.mod`), patching now stops right away and names them, instead of applying the mod twice and ending in MISS. Keep only the newest one.
- **NestPatcher:** These two mods need NestPatcher 1.4 (PC), Android patcher 1.3, GUI 0.5 or the Android app 0.3 or newer. Older patchers report MISS for them.

## Modv2.5 — Desktop settings menu (2026-10-31)

- **TN Desktop Menu:** New, for Windows, Linux and Mac: **Options > TN Mod Settings** opens every TN mod's settings page (Crew Size, Clock Format, Bust Gender Filter, Shelly's cure quest and more). It has no on/off switches: on desktop every mod in `enabled.txt` is on. It does nothing on Android, where Android Mods is still the menu.
- **All mods:** Settings changed in either menu are the same settings, so they carry over between the two.

## Modv2.4 — Android menu stays on Android (2026-10-31)

- **Android Mods:** The Android mod menu now only starts on Android. On Windows, Linux and Mac it switches itself off instead of adding its Options panel and TN DEBUG button, which could mess up desktop installs. Old save flags still carry over on every system.
- **All mods:** Every TN mod now uses the Android mod menu only when it's installed **and** the game is running on Android. On desktop, or without the menu, they work with their default settings and don't error.
- **All mods:** Changed files now have the pack version in their name (for example `AndroidModMenu_v2.4.js`), and `enabled.txt` lists the new names.

## Modv2.3 — Markdown changelog (2026-10-31)

Notes can now be written in Markdown. This paragraph shows how plain text under a version heading appears above its list.

- **Changelog:** The online changelog can now be a plain **Markdown** file (JSON still works), and every note can use **bold**, *italics*, `code` and links.

## Modv2.2 — Kitty's pack (2026-10-30)

- **Zheniya:** New, from Kitty's other pack: the zil call girl waits in the hall north of Anon's bar without Saendra's mission, and you can recruit her onto the ship.
- **Pregnancy:** New, from Kitty's other pack: the mod menu shows a progress bar for each pregnancy, with +1 Hour, +1 Day, +3 Days, Birth, Pause and Clear. Fixed so the bars and Pause actually work on 0.9.167.
- **Editor:** New, from Kitty's other pack: an Editor button on the main menu (after a game is loaded) for your character, stats, body, ships, perks, flags, the clock and Debug Mode.
- **Steph Irson:** Steph now actually shows up east of the Merchant Deck lift, with her talk menu, recruiting and ship scenes (her scenes come from Kitty's other pack).
- **Crew Size:** New Bypass crew limit checkbox, so Fly stays available even when the crew doesn't fit.

## Modv2.1 — Holo-Lock Chastity (2026-10-30)

- **Holo-Lock Chastity:** New: Holo-Lock chastity belt and Holo-Lock chastity cage, sold by Aliss at Mi Amour on Tavros (3500 credits each). Wear one, then Inventory -> the device -> Interact to recolor it with holopaint, set a Codex PIN, cut a physical key (Key Items), or both.
- **Holo-Lock Chastity:** Locked, the belt gives the game's own Vaginal Chastity effect (plus Anal Chastity with the optional rear shield), and the cage takes cock options out of the Masturbate menu. Locked devices can't be taken off. Forgot the PIN or lost the key? Aliss can release it, and the mod menu has an emergency release.
- **Holo-Lock Chastity:** Cage update: while it's locked, the game's cock picker marks caged cocks as LOCKED IN CHASTITY (like a chastity-blocked pussy), "a cock that fits" checks find none, and a scene checker greys out other scene buttons that use your cock. Tail cocks and cockvines aren't caged, and a setting lets them stand in for generic cock scenes.

## Modv2.0 — Virine (2026-10-30)

- **Virine:** New: Virine medipen, a TamaniCorp virility booster sold by Lerris on Tavros next to Fertite+ (500 credits). Each shot raises your base virility by +0.5 (below 2.0), +0.25 (up to 5.0) or +0.1 (after that). It doesn't touch female fertility.
- **Virine:** It also cures Firing Blanks and temporary infertility, like Fertite+. It needs a cock or tail cock; without one you keep the pen. Your current virility shows on its page in the mod menu.

## Modv1.9 — TN Rename (2026-10-29)

- **All mods:** Our mods now use TN names instead of KITTY ones (save flags, settings and hooks), so they no longer share save flag and setting names with Kitty's other mod pack.
- **All mods:** Your existing saves and mod settings carry over automatically: old KITTY_ save flags and kitty settings are copied to the new names the first time they load. Nothing old is deleted.
- **Android Mods:** The floating debug button is now called TN DEBUG.

## Modv1.8 — Treetop Tattoo (2026-10-27)

- **Treetop Tattoo Clarity:** Every button in Catalina's tattoo shop on Tavros now has a tooltip saying what it does, what it costs and why it's greyed out. Tattoo and Removal are now Get Tattoo and Remove Ink, and the design screen explains how to type a design and Preview it.
- **Treetop Tattoo Clarity:** 30 new tattoo spots (43 total): Shoulder, Right/Left Upper Arm, Right/Left Lower Arm, Right/Left Wrist, Arm Sleeves (both arms), Right/Left Arm Sleeve, Right/Left Palm, Ribs, Upper Back, Lower Back, Right/Left Thigh, Right/Left Knee, Right/Left Calf, Right/Left Ankle, Right/Left Foot, Wings, Tail, Flank (taurs), Cock and Balls. The old Arm spot is now Middle Arm (a ring around the elbow). The old Hand, Thigh, Leg and Foot spots stay, so each side can have its own design. Spots your body doesn't have are greyed out with the reason.
- **Treetop Tattoo Clarity:** Your tattoos are now described at the end of the main Appearance text, not just in the Tattoos tab.
- **Treetop Tattoo Clarity:** The spot list shows 12 spots per page with Prev Page and Next Page buttons, and the removal list does too. Feathered spots (body, arms, legs, tail, wings or balls) can't be inked, matching Catalina's own explanation that her nanobots only color skin, fur and scales. Avian legs are scaled below the knee, so their calves, ankles and feet can still be inked.
- **Treetop Tattoo Clarity:** Fixes: the pubic spot no longer shows as a second Belly button (it's now Pubic Area, or Womb with a vagina), and New Ink after a removal works with exactly 1000 credits.

## Modv1.7 — Shelly's family (2026-10-26)

- **Shelly's Family:** New: once Shelly is cured (pink, red or blue), a Kids? button appears in her Talk menu (trust 10, affection 7+). She says yes as long as she can visit the kids in the Tavros nursery whenever the ship docks there, then stops taking Sterilex.
- **Shelly's Family:** Make Love and She Rides can get her pregnant. She tells you at about two weeks, her sex scenes notice the bump, and she gets new pregnant busts (Lash/red and blue cures, in TN_ShellyFamilyBusts.js; pink keeps her egg-belly bust for now). Length (default 120 days) is in the mod menu.
- **Shelly's Family:** She gives birth at the Tavros nursery. At Tavros her crew button is greyed out: Milking Station, Nursery Cafeteria or Educational Center every 15 minutes, and your nursery Bedroom from 22:00 to 06:00, where you can sleep with her.
- **Azra's Family:** When Azra and Shelly both have kids and are in the same nursery room, you get shared scenes for the two moms, and at night they share your bed (Sleep With Them).

## Modv1.6 — Azra's family (2026-10-25)

- **Azra's Family:** New: Azra's Children? answer (when you talk about being her stud) now says yes, as long as she can visit the kids in the Tavros nursery whenever the ship docks there. Already her stud? Ask her from the new Children? button in her menu.
- **Azra's Family:** Azra can get pregnant from Rawdogging, the morning-after bed scene and her expedition creampies. She tells you at about two weeks, and her sex scenes switch to the pregnancy lines Fenoxo already wrote.
- **Azra's Family:** New pregnant Azra busts in TN_AzraFamilyBusts.js: armor, SteeleTech jumpsuit and nude (edited Adjatha art). Pregnancy length (default 120 days) and a bust option are in the mod menu.
- **Azra's Family:** She gives birth at the Tavros nursery and your children appear there. Her Family button shows the pregnancy, and lets you pause or resume trying.
- **Azra's Family:** While the ship is docked at Tavros, her crew button is greyed out. Every 15 minutes she's in the Milking Station, the Nursery Cafeteria or the Educational Center, and from 22:00 to 06:00 she sleeps in your nursery Bedroom, where you can sleep with her.

## Modv1.5 — Shelly's cure and Lessau's chimera (2026-10-25)

- **Shelly Cure Quest:** New: cure Shelly of her endless Ovilium eggs. Start from her Cure? talk option (5+ trust), then pick a doctor: Dr. Lash on Tarkus or Dr. Lessau on Uveto.
- **Shelly Cure Quest:** Dr. Lash route: convince Shelly with the right reasons (save first, you can fail), then pay 50k for a permanent cure. She may ask Steele to be sterilized too, which gives the Perma-Sterile perk.
- **Shelly Cure Quest:** Dr. Lessau route: collect one of each small egg colour from Shelly's Assist (brightly-colored, pink, blue and white), gather her samples, and let her choose the pink, red or blue cure.
- **Shelly Cure Quest:** New setting in the mod menu: whether Dr. Lash's sterilization also removes Steele's genitals (on by default).
- **Shelly Cure Quest:** Once she's cured, her cabin Sex menu opens: First Time, then Make Love (affection 5+), She Rides, Eat Her Out, Her Mouth and Grind, each followed by a short nap together.
- **Shelly Cure Quest:** Every scene has bipedal, taur and naga versions, supports herms, cockvines and cunt-snakes, and changes with the cure she took.
- **Shelly Cure Quest:** New cured busts for Shelly, normal and nude, in TN_ShellyCureBusts.js. Red uses the Lash art. Your own custom bust art for Shelly is left alone.
- **Chimerune:** New: Chimerune pill, sold by Dr. Lessau on Uveto. It turns Steele into Lessau's own chimera: white fur, lion head, ears and clawed arms, a long orange mane and mantle, a second pair of arms, a black-scaled naga tail, black bull horns, white feathered wings and glowing amber feline eyes.
- **Chimerune:** Below the waist: a long, flexible tongue, a flared, barb-ringed horse cock in a genital slit, and naleen pussies. Up to 3 changes per pill.
- **Chimerune:** A fully changed Steele is now called a chimera, and new cocks grown later come in equine. The extra arms are the Four-Armed perk and can be skipped or removed from the mod menu.

## Modv1.4 — Birds, boards and quality of life (2026-10-21)

- **Phoenix & Thunderbird:** New: Ember Seed (phoenix) and Storm Seed (thunderbird) avian transformatives. Both are sold by Jade on Tavros; Dr. Lessau on Uveto also sells the Ember Seed.
- **Phoenix & Thunderbird:** New perks: Pyre Veins (immune to Uveto's cold, +25% burning resistance) and Stormborn (+25% electric resistance).
- **Phoenix & Thunderbird:** New combat abilities: Phoenix Flare (fire damage, can set foes ablaze) and Thunderclap (electric damage, can paralyze). These need the main.js combat patch.
- **Phoenix & Thunderbird:** Phoenix Rebirth: once per fight, rise from the ashes at 50% HP when your HP hits 0, in an explosion that sets every enemy ablaze.
- **Phoenix & Thunderbird:** Both seeds give feathered avian ears, avian genitals (red for phoenix, blue for thunderbird) and a flat chest (pink or blue nipples). Chest changes can be switched off in the mod menu.
- **Phoenix & Thunderbird:** Secret species names: with enough avian traits, the game calls you a phoenix (Pyre Veins) or a thunderbird (Stormborn), like it does for griffins.
- **Holoboard:** New: Anno's Holoboard, a refurbished hoverboard coated in her own invention, holopaint. Recolor it any time with Interact; turn the projector off for bare steel. Works as a real hoverboard.
- **Holoboard:** Sold in Anno's shop (outpost or crew) for the same price Shekka charges for a pink board, thanks to Steele's permanent half-off discount. Anno shows it off the first time you visit.
- **Draconilum:** Now grows frilled dragon ears, and Reptilum's changes no longer turn them back into lizard ears.
- **Gryphonix:** Gryphon ears are now properly feathered.
- **Draconilum / Gryphonix:** Fixed: opening Jade's shop crashed with "e is not a constructor".
- **Draconilum / Gryphonix / Lane Detox Weights:** Fixed: their on/off switches in the mod menu now work.
- **Android Mod Menu:** The mods panel can always be closed: tap outside it, tap Android Mods again, or press Back. The Close button stays visible while scrolling.
- **Wiki Browser:** The Wiki button moved to a new Info section in the main menu sidebar. Android Back now closes the wiki.
- **Changelog:** New: this changelog, with the mod version shown in the Info section.
