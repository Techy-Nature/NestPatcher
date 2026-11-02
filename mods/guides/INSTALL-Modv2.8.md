# Modv2.8: taurs and nagas in the 0.9.168 scenes

TiTS 0.9.168 added scenes that taurs and nagas can reach but that were only written for two
legs. Modv2.8 updates the Taur/Naga Text mod so those scenes describe your real body. Bipeds
still see the original text. It also adds two new mods, Dane Crew and Feruze Crew. Everything else is the same as Modv2.7.

## What changed

| New name | Old name | Why |
|---|---|---|
| `TN_taur-naga_text_v2.8.mod` | `TN_taur-naga_text.mod` | Taur and naga wording for the new scenes (list below). The older wording all still applies. |
| `TN_Changelog_v2.8.js` | `TN_Changelog_v2.7.js` | Shows Modv2.8 as installed. |
| `TN_DaneCrew_v2.8.mod` | | New: recruit Dane on Zheng Shi (see below). |
| `enabled.txt` | | Uses the two new names and adds `TN_DaneCrew_v2.8.mod`. |

Scenes with new taur and naga wording:

- **Dulcie**, the zil baker in Esbeth (Mhen'ga): Domme Me, Sub Me, Cunnilingus and Food Play.
- **Giallo** on New Texas: Paizuri.
- **Mags** in Bay 12b (Canadia): the dildo and facefuck scene.
- **Gray goo** bad end on Tarkus.

## Dane Crew (new in Modv2.8)

Dane, your cousin's old four-armed bodyguard, can join your crew. Find him at the Aquarius bar in
the Rec Deck casino on Zheng Shi.

- **Unlock:** ask him **Your Cuz** and **His Start**. If you asked before you installed this mod,
  ask again. Then a **Recruit** button shows up. You need a free crew slot.
- **Fee:** 6,000 credits. 2,000 off if you freed him on Myrellion, and 2,000 off if you gave his
  shock blade back (only counts if you return it with this mod on).
- **His ship, the Starlight Sonata:** if you kept Hand So's data bead on Tarkus, she flies it. If
  not, it goes on loan to Saendra on Tavros (she pays Dane 1,000 credits every 30 days, 50,000 in
  all, then it stays on Tavros as a backup ship). If you haven't met Saendra, it stays docked on
  Zheng Shi until you ask Dane about it again.
- **Hand So comm:** when she flies the Sonata, a **Hand So** button shows at your pilot's chair
  (next to Fly) and in **Codex > Extra** as "Sonata Comm".
- **Saendra at work:** while she has the Sonata on loan, she flies jobs during the day (8 AM to
  6 PM game time). Her button in Anon's bar is greyed out then, with a tooltip saying when to come
  back, and her **How's Work** talk is about the jobs and paying Dane back.
- **On the ship:** Talk, Sex (he's always on top), Spar (no weapons; bet yourselves, and with
  Grav-Cuffs in your pack he bottoms if you win), Appearance, and Leave Ship (he goes back to the
  bar, and coming back is free).
- **Switch:** Options > Android Mods > Dane Crew. Turning it off sends him off the ship, and your
  save keeps everything.

The new zil stud bad end in Mhen'ga's deep jungle is left alone: the game only lets bipeds
get it.

## Updating from Modv2.7

You don't need to delete `backup` this time; the game didn't change.

1. In your mods folder (`nestmods`, or `mods` on Android), delete `TN_taur-naga_text.mod`,
   `TN_Changelog_v2.7.js` and `enabled.txt`.
2. Copy in `TN_taur-naga_text_v2.8.mod`, `TN_Changelog_v2.8.js`, `TN_DaneCrew_v2.8.mod` and the new `enabled.txt`.
   (Or empty the folder, keeping `logs` and `backup`, and copy in all of `TITS-Mods/`.)
3. If you had turned mods off with `#` in your old `enabled.txt`, do that again in the new one.
4. Run **Test my mods** (dry run). It should finish with no MISS (553 replacements with the
   pack's own `enabled.txt`).
5. **Patch the game.**

Coming from Modv2.6 or older? Follow [`INSTALL-Modv2.7.md`](INSTALL-Modv2.7.md) first (it
covers the 0.9.168 update and deleting `backup`), but copy in the 2.8 files above instead of
`TN_Changelog_v2.7.js` and `TN_taur-naga_text.mod`.

## Added later in Modv2.8: Feruze Crew

A new mod, so the pack version stays 2.8 (a new pack version comes every 10 new mods).

1. Copy `TN_FeruzeCrew_v2.8.mod` and `TN_FeruzeCrew_v2.8.js` into your mods folder.
2. Add both names to `enabled.txt` (the pack's `enabled.txt` already has them at the end).
3. Run **Test my mods**. With the pack's `enabled.txt` it should finish with no MISS
   (553 replacements, with Dane Crew included).
4. **Patch the game.**

Where to find her: finish the Farrow quest on Dhaal (the one where you rescue your cousin
and get the probe). Then go to the Crash Landing, the underground milk bar off the Mean
Streets, and look in the Bar Room. Feruze is in the back booth (button **Feruze**).
- **Talk:** getting fired, Zheng Shi, Dhaal, suula stuff, and your daughter if you have one.
- **Buy A Round:** 20 credits.
- **Hook Up:** sex on the old station platform outside. She stays at the bar after.
- **Hire Her:** 5000 credit retainer, or 2500 if you've slept with her. Needs a free crew slot.
- On the ship: Talk, Sex and **Send Away** (she goes back to her booth and rejoins for free).
- Sex scenes: Fuck Her Puss, Scissor, Titfuck, Shark Seat. Each has taur and naga versions.
- Android Mods has a switch for her. Off = she isn't at the bar (if she's already crew, she stays).

## Added later in Modv2.8: Sex Scene Gallery

A new mod, so the pack version stays 2.8 (three new mods so far in 2.8; a new pack version comes every 10).

1. Copy `TN_SexGallery_v2.8.js` and `TN_SexGalleryScenes_v2.8.js` into your mods folder.
2. Add both names to `enabled.txt` (the pack's `enabled.txt` already has them at the end).
3. Run **Test my mods**, then **Patch the game**. These are `.js` files, so the number of
   replacements doesn't change.

Using it:

- **Open it:** main menu sidebar > **Info** > **Sex Gallery** (the button shows how much of this
  save's gallery you've filled). It's also in the mod menu (Options > Android Mods, or Options >
  TN Mod Settings on desktop) as **Sex Scene Gallery** > **Open the gallery**.
- **How scenes get marked:** when anyone in a scene climaxes, the mod checks the text on that page
  against the scene list and marks that scene as seen. Every save has its own gallery and
  achievements. Scenes you saw before installing the mod aren't known, so replay favourites to
  add them.
- **Spoilers:** scenes you haven't seen show their name, partner, place, writer and tags, but the
  summary stays hidden until you tap **Show summary**. The mod menu can show them all.
- **Achievements:** Sex Hound (25%), The Law of Sexual Exchange (50%), Nymphomaniac (75%) and
  Sexy Salacious Steele (100%). They pop up when you earn them and stay in the gallery's header.
  Some scenes rule each other out (for example, different endings), so 100% takes more than one
  save's worth of choices.
- **Settings** (mod menu): achievement pop-ups, new scene pop-ups, and showing unseen summaries.

### After a game update: make a new scene list

The scene list comes from the game files, so a new TiTS version needs a new list. Old lists keep
working for scenes that didn't change.

1. Put `acorn.js` next to `sex_scene_scan_v2.8.js` (the same file the taur gate scanner uses).
2. In Termux (or a terminal on PC), go to the `tools` folder and run:

   ```
   node sex_scene_scan_v2.8.js
   ```

3. The first time, it asks where acorn.js, the game's `www` folder, the `backup` folder, the mods
   folder and the logs folder are. Press Enter to keep a suggested answer. It remembers them.
4. It writes `TN_SexGalleryScenes_v2.8.js` into your mods folder and a full list of the scenes it
   found to `logs/SexSceneScan.txt`. Then patch again.
5. If it runs out of memory on `main.js`, run `node --max-old-space-size=3072 sex_scene_scan_v2.8.js`.

Your saves keep their progress: scenes keep the same ID as long as their text doesn't change.

## Added later in Modv2.8: Quad-Bat Pop and Quad-Draco Pop

Two new mods, sister treats to the Quad-Wing Pop. That makes five new mods in 2.8 (Dane Crew,
Feruze Crew, Sex Scene Gallery and these two), so the pack version stays 2.8.

1. Copy `TN_QuadBatPop_v2.8.mod` and `TN_QuadDracoPop_v2.8.mod` into your mods folder.
2. Add both names to `enabled.txt` (the pack's `enabled.txt` already has them at the end).
3. Run **Test my mods**, then **Patch the game**. They don't patch game files (they add the items
   at startup), so the number of replacements doesn't change.

Using them:

- **Where:** Jade on Tavros sells both, next to Amber Seed and the Quad-Wing Pop, for 1200 credits
  each. They're also in Cheats > Items.
- **Quad-Bat Pop:** always leaves you with two pairs of large bat wings. No wings: you grow four.
  Small or large bat wings: they grow to full size and a second pair grows in under them. Other
  wings, back tentacles or a shark fin: they become bat wings (four, or more if you already had
  more). Old bat wings keep their look (furred stays furred); new ones match your skin tone.
- **Quad-Draco Pop:** the same, with large draconic wings. Small draconic, frostwyrm and gryvain
  wings count as dragon wings: they become large draconic wings and keep their look. New ones
  match your scale color.
- **Taurs and nagas:** the text after the change describes what four wings can lift for your body
  shape (hooves off the ground for taurs, coils off the floor for nagas).
- Eating one when you already have four or more of that wing type does nothing (it's just candy).
- **Toggles:** Options > Android Mods > **Quad-Bat Pop** / **Quad-Draco Pop**. Off = not stocked and
  the lollipop does nothing. Wings you already grew stay.
- Eating a different pop later swaps your wings to that type (Quad-Wing Pop for avian, Quad-Bat Pop
  for bat, Quad-Draco Pop for dragon).

## Added later in Modv2.8: Anno's Holoboard is back

The holoboard from Modv1.4 had dropped out of the pack: its file was missing, so Anno never
stocked it and the cheat menu never listed it. It's rebuilt for TiTS 0.9.168.

1. Copy `TN_Holoboard_v2.8.mod` into your mods folder.
2. Add it to `enabled.txt` (the pack's `enabled.txt` already has it).
3. Run **Test my mods**, then **Patch the game**. It doesn't patch game files (it adds the item at
   startup), so the number of replacements doesn't change.

Using it:

- **Where:** Anno's shop, at the Steele Tech outpost on Tarkus or on your ship once she's crew. It
  costs what Shekka charges for a pink hoverboard. It's also in Cheats > Items (search "holo").
- **Anno's showcase:** the next time you talk to Anno, she shows it off, even if you met her long
  ago. It plays once per save; the mod menu has a button to see it again.
- **It's a real hoverboard:** everything that checks for the pink hoverboard counts it.
- **Holopaint:** Inventory > Anno's Holoboard > Interact to recolor it, or turn the projector off
  for bare steel.
- **Toggle:** Options > Android Mods > **Anno's Holoboard**. Off = not stocked and no showcase.

## Fixed in Modv2.8: Wiki button in the Codex

The Codex **Wiki** button from 2.7 never showed, because it was a separate file
(`TN_CodexWiki_v2.7.js`) that often didn't get loaded. It's now built into the Wiki Browser,
so there's only one file.

1. In your mods folder, delete `WikiBrowser_v2.7.js` and `TN_CodexWiki_v2.7.js` (if you have
   them; also any `WikiBrowser_v2.5.js`).
2. Copy in `WikiBrowser_v2.8.js`, the new `TN_Changelog_v2.8.js` and the new `enabled.txt`
   (or change the `WikiBrowser_v2.7.js` line to `WikiBrowser_v2.8.js` and delete the
   `TN_CodexWiki_v2.7.js` line yourself).
3. Run **Test my mods**, then **Patch the game**. On Android, rebuild and install the APK.
4. Check: load a game and open the **Codex**. **Wiki** sits under the "Codex" header in the left
   sidebar. Open an entry and a **Look up:** button with its name appears under it. The main
   menu's Info > Wiki is still there too.

- **Android:** the **Wiki Browser** switch in Options > Android Mods turns the Info and Codex
  buttons on and off together.
- If the game isn't showing the sidebar, the Wiki button goes in the empty spot of the Codex's
  bottom menu (next to **Appearance**) instead.
- If it still doesn't show, turn on the debug log in Android Mods, open the Codex, and look for
  `[Wiki] Loaded v2.8 (Info and Codex buttons)`. If that line is missing, the file isn't being
  loaded: check `enabled.txt`.
