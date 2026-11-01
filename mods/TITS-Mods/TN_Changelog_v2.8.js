/*
 * TN_Changelog_v2.8.js — in-game changelog for the TN mod pack (TiTS Android build)
 * ---------------------------------------------------------------------------
 * Adds a "Changelog" button to the Info section of the main menu sidebar (the same
 * section as Wiki), showing the installed mod version as Modv#.# and what changed.
 *
 * HOW TO UPDATE IT
 *  1. Bundled changelog (needs a rebuild): edit MOD_VERSION and CHANGELOG just below.
 *     Newest version goes first.
 *  2. Online changelog (no rebuild): set REMOTE_URL to a Markdown (.md) or JSON
 *     file you host, for example a raw GitHub link. The game downloads it at
 *     startup, keeps a copy for offline use, shows those notes, and tells players
 *     when the latest version is newer than their installed build. If the download
 *     fails, the last downloaded copy is used, then the bundled CHANGELOG.
 *
 *     Markdown layout (changelog_v2.5.md is a full example):
 *        Latest: 2.3                       <- optional; else the first version
 *        ## Modv2.3 - Title (2026-10-31)   <- one ## heading per version
 *        - **Mod name:** what changed      <- one bullet per change
 *          indented lines continue the bullet; "  - " makes a sub-point
 *        ### Mod name                      <- optional: tags the untagged bullets under it
 *     Plain paragraphs under a version heading show above its bullets.
 *     Keep a Changelog style headings ("## [2.3] - 2026-10-31") work too.
 *
 *     JSON still works: { "latest": "2.3", "versions": [ { "version": "2.3", ... } ] }
 *
 * Each entry: { version, date, title (optional), changes: [ { mod, text }, ... ] }
 * Text (bundled, JSON or Markdown) can use basic Markdown: **bold**, *italics*,
 * ~~strikethrough~~, `code` and [links](https://...). Line breaks are kept.
 * Raw HTML is shown as plain text, never run.
 *
 * INSTALL: this file must be listed in mods/enabled.txt (after WikiBrowser_v2.8.js is
 * fine; load order doesn't matter). If it isn't listed, the patcher skips it and
 * the Changelog button never appears in the Info section.
 */
(function () {
  "use strict";
  if (window.TnChangelog) return;

  // ===========================================================================
  //  EDIT HERE
  // ===========================================================================
  var MOD_VERSION = "2.8";   // the version of THIS build (shown as Modv2.8)

  // Optional: a hosted Markdown (or JSON) changelog, e.g.
  //   "https://raw.githubusercontent.com/<you>/<repo>/main/changelog.md"
  // A normal github.com/<you>/<repo>/blob/... link works too (it's turned into
  // the raw link). Leave empty to use only the bundled list below.
  var REMOTE_URL = "https://raw.githubusercontent.com/Techy-Nature/NestPatcher/main/changelog.md";

  var CHANGELOG = [
    {
      version: "2.8",
      date: "2026-11-01",
      title: "Wiki button in the Codex",
      changes: [
        { mod: "Codex Wiki Button", text: "New: the Codex sidebar has a **Wiki** button under the Codex header. It opens the TiTS wiki, and while you read an entry (like Gabilani) a **Look up: Gabilani** button searches the wiki for it. It opens in the Wiki Browser over the game; without the Wiki Browser it opens in your browser, or in a small wiki window. Works on Android and desktop, and has its own switch in Android Mods. File: `TN_CodexWiki_v2.8.js`." },
        { mod: "Wiki Browser", text: "Other mods can now open it on a search or a page (the Codex button uses this). Now `WikiBrowser_v2.8.js`." },
        { mod: "Changelog", text: "Shows Modv2.8 as installed. Now `TN_Changelog_v2.8.js`." }
      ]
    },
    {
      version: "2.7",
      date: "2026-11-01",
      title: "TiTS 0.9.168",
      changes: [
        { mod: "All mods", text: "Checked against TiTS 0.9.168: 508 of 508 patches apply. Every other mod works on 0.9.168 as it is." },
        { mod: "Stella D'Amore", text: "Updated for 0.9.168 (the game renamed her scene functions). Now `Stella_v2.7.mod`." },
        { mod: "Steph Irson", text: "Updated for 0.9.168. Now `StephIrson_v2.7.mod`." },
        { mod: "Zheniya", text: "Updated for 0.9.168. Now `Zheniya_v2.7.mod`." },
        { mod: "Changelog", text: "Shows Modv2.7 as installed. Now `TN_Changelog_v2.7.js`." }
      ]
    },
    {
      version: "2.6",
      date: "2026-10-31",
      title: "Tattoos and chastity on PC",
      changes: [
        { mod: "Treetop Tattoo Clarity", text: "Now patches the Windows, Linux and Mac game too. Before, two of its patches only matched the Android game, so patching on PC stopped with MISS." },
        { mod: "Holo-Lock Chastity", text: "Same fix: it now patches the PC game as well as Android." },
        { mod: "Changelog", text: "Shows Modv2.6 as installed (it still said Modv2.5)." }
      ]
    },
    {
      version: "2.5",
      date: "2026-10-31",
      title: "Desktop settings menu",
      changes: [
        { mod: "TN Desktop Menu", text: "New, for Windows, Linux and Mac: **Options > TN Mod Settings** opens every TN mod's settings page (Crew Size, Clock Format, Bust Gender Filter, Shelly's cure quest and more). It has no on/off switches: on desktop every mod in `enabled.txt` is on. It does nothing on Android, where Android Mods is still the menu." },
        { mod: "All mods", text: "Settings changed in either menu are the same settings, so they carry over between the two." }
      ]
    },
    {
      version: "2.4",
      date: "2026-10-31",
      title: "Android menu stays on Android",
      changes: [
        { mod: "Android Mods", text: "The Android mod menu now only starts on Android. On Windows, Linux and Mac it switches itself off instead of adding its Options panel and TN DEBUG button, which could mess up desktop installs. Old save flags still carry over on every system." },
        { mod: "All mods", text: "Every TN mod now uses the Android mod menu only when it's installed **and** the game is running on Android. On desktop, or without the menu, they work with their default settings and don't error." },
        { mod: "All mods", text: "Changed files now have the pack version in their name (for example `AndroidModMenu_v2.4.js`), and `enabled.txt` lists the new names." }
      ]
    },
    {
      version: "2.3",
      date: "2026-10-31",
      title: "Markdown changelog",
      changes: [
        { mod: "Changelog", text: "The online changelog can now be a plain **Markdown** file (JSON still works), and every note can use **bold**, *italics*, `code` and links." }
      ]
    },
    {
      version: "2.2",
      date: "2026-10-30",
      title: "Kitty\'s pack",
      changes: [
        { mod: "Zheniya", text: "New, from Kitty\'s other pack: the zil call girl waits in the hall north of Anon\'s bar without Saendra\'s mission, and you can recruit her onto the ship." },
        { mod: "Pregnancy", text: "New, from Kitty\'s other pack: the mod menu shows a progress bar for each pregnancy, with +1 Hour, +1 Day, +3 Days, Birth, Pause and Clear. Fixed so the bars and Pause actually work on 0.9.167." },
        { mod: "Editor", text: "New, from Kitty\'s other pack: an Editor button on the main menu (after a game is loaded) for your character, stats, body, ships, perks, flags, the clock and Debug Mode." },
        { mod: "Steph Irson", text: "Steph now actually shows up east of the Merchant Deck lift, with her talk menu, recruiting and ship scenes (her scenes come from Kitty\'s other pack)." },
        { mod: "Crew Size", text: "New Bypass crew limit checkbox, so Fly stays available even when the crew doesn\'t fit." }
      ]
    },
    {
      version: "2.1",
      date: "2026-10-30",
      title: "Holo-Lock Chastity",
      changes: [
        { mod: "Holo-Lock Chastity", text: "New: Holo-Lock chastity belt and Holo-Lock chastity cage, sold by Aliss at Mi Amour on Tavros (3500 credits each). Wear one, then Inventory -> the device -> Interact to recolor it with holopaint, set a Codex PIN, cut a physical key (Key Items), or both." },
        { mod: "Holo-Lock Chastity", text: "Locked, the belt gives the game\'s own Vaginal Chastity effect (plus Anal Chastity with the optional rear shield), and the cage takes cock options out of the Masturbate menu. Locked devices can\'t be taken off. Forgot the PIN or lost the key? Aliss can release it, and the mod menu has an emergency release." },
        { mod: "Holo-Lock Chastity", text: "Cage update: while it\'s locked, the game\'s cock picker marks caged cocks as LOCKED IN CHASTITY (like a chastity-blocked pussy), \"a cock that fits\" checks find none, and a scene checker greys out other scene buttons that use your cock. Tail cocks and cockvines aren\'t caged, and a setting lets them stand in for generic cock scenes." }
      ]
    },
    {
      version: "2.0",
      date: "2026-10-30",
      title: "Virine",
      changes: [
        { mod: "Virine", text: "New: Virine medipen, a TamaniCorp virility booster sold by Lerris on Tavros next to Fertite+ (500 credits). Each shot raises your base virility by +0.5 (below 2.0), +0.25 (up to 5.0) or +0.1 (after that). It doesn\'t touch female fertility." },
        { mod: "Virine", text: "It also cures Firing Blanks and temporary infertility, like Fertite+. It needs a cock or tail cock; without one you keep the pen. Your current virility shows on its page in the mod menu." }
      ]
    },
    {
      version: "1.9",
      date: "2026-10-29",
      title: "TN Rename",
      changes: [
        { mod: "All mods", text: "Our mods now use TN names instead of KITTY ones (save flags, settings and hooks), so they no longer share save flag and setting names with Kitty\'s other mod pack." },
        { mod: "All mods", text: "Your existing saves and mod settings carry over automatically: old KITTY_ save flags and kitty settings are copied to the new names the first time they load. Nothing old is deleted." },
        { mod: "Android Mods", text: "The floating debug button is now called TN DEBUG." }
      ]
    },
    {
      version: "1.8",
      date: "2026-10-27",
      title: "Treetop Tattoo",
      changes: [
        { mod: "Treetop Tattoo Clarity", text: "Every button in Catalina's tattoo shop on Tavros now has a tooltip saying what it does, what it costs and why it's greyed out. Tattoo and Removal are now Get Tattoo and Remove Ink, and the design screen explains how to type a design and Preview it." },
        { mod: "Treetop Tattoo Clarity", text: "30 new tattoo spots (43 total): Shoulder, Right/Left Upper Arm, Right/Left Lower Arm, Right/Left Wrist, Arm Sleeves (both arms), Right/Left Arm Sleeve, Right/Left Palm, Ribs, Upper Back, Lower Back, Right/Left Thigh, Right/Left Knee, Right/Left Calf, Right/Left Ankle, Right/Left Foot, Wings, Tail, Flank (taurs), Cock and Balls. The old Arm spot is now Middle Arm (a ring around the elbow). The old Hand, Thigh, Leg and Foot spots stay, so each side can have its own design. Spots your body doesn\'t have are greyed out with the reason." },
        { mod: "Treetop Tattoo Clarity", text: "Your tattoos are now described at the end of the main Appearance text, not just in the Tattoos tab." },
        { mod: "Treetop Tattoo Clarity", text: "The spot list shows 12 spots per page with Prev Page and Next Page buttons, and the removal list does too. Feathered spots (body, arms, legs, tail, wings or balls) can't be inked, matching Catalina's own explanation that her nanobots only color skin, fur and scales. Avian legs are scaled below the knee, so their calves, ankles and feet can still be inked." },
        { mod: "Treetop Tattoo Clarity", text: "Fixes: the pubic spot no longer shows as a second Belly button (it's now Pubic Area, or Womb with a vagina), and New Ink after a removal works with exactly 1000 credits." }
      ]
    },
    {
      version: "1.7",
      date: "2026-10-26",
      title: "Shelly's family",
      changes: [
        { mod: "Shelly's Family", text: "New: once Shelly is cured (pink, red or blue), a Kids? button appears in her Talk menu (trust 10, affection 7+). She says yes as long as she can visit the kids in the Tavros nursery whenever the ship docks there, then stops taking Sterilex." },
        { mod: "Shelly's Family", text: "Make Love and She Rides can get her pregnant. She tells you at about two weeks, her sex scenes notice the bump, and she gets new pregnant busts (Lash/red and blue cures, in TN_ShellyFamilyBusts.js; pink keeps her egg-belly bust for now). Length (default 120 days) is in the mod menu." },
        { mod: "Shelly's Family", text: "She gives birth at the Tavros nursery. At Tavros her crew button is greyed out: Milking Station, Nursery Cafeteria or Educational Center every 15 minutes, and your nursery Bedroom from 22:00 to 06:00, where you can sleep with her." },
        { mod: "Azra's Family", text: "When Azra and Shelly both have kids and are in the same nursery room, you get shared scenes for the two moms, and at night they share your bed (Sleep With Them)." }
      ]
    },
    {
      version: "1.6",
      date: "2026-10-25",
      title: "Azra's family",
      changes: [
        { mod: "Azra's Family", text: "New: Azra's Children? answer (when you talk about being her stud) now says yes, as long as she can visit the kids in the Tavros nursery whenever the ship docks there. Already her stud? Ask her from the new Children? button in her menu." },
        { mod: "Azra's Family", text: "Azra can get pregnant from Rawdogging, the morning-after bed scene and her expedition creampies. She tells you at about two weeks, and her sex scenes switch to the pregnancy lines Fenoxo already wrote." },
        { mod: "Azra's Family", text: "New pregnant Azra busts in TN_AzraFamilyBusts.js: armor, SteeleTech jumpsuit and nude (edited Adjatha art). Pregnancy length (default 120 days) and a bust option are in the mod menu." },
        { mod: "Azra's Family", text: "She gives birth at the Tavros nursery and your children appear there. Her Family button shows the pregnancy, and lets you pause or resume trying." },
        { mod: "Azra's Family", text: "While the ship is docked at Tavros, her crew button is greyed out. Every 15 minutes she's in the Milking Station, the Nursery Cafeteria or the Educational Center, and from 22:00 to 06:00 she sleeps in your nursery Bedroom, where you can sleep with her." }
      ]
    },
    {
      version: "1.5",
      date: "2026-10-25",
      title: "Shelly's cure and Lessau's chimera",
      changes: [
        { mod: "Shelly Cure Quest", text: "New: cure Shelly of her endless Ovilium eggs. Start from her Cure? talk option (5+ trust), then pick a doctor: Dr. Lash on Tarkus or Dr. Lessau on Uveto." },
        { mod: "Shelly Cure Quest", text: "Dr. Lash route: convince Shelly with the right reasons (save first, you can fail), then pay 50k for a permanent cure. She may ask Steele to be sterilized too, which gives the Perma-Sterile perk." },
        { mod: "Shelly Cure Quest", text: "Dr. Lessau route: collect one of each small egg colour from Shelly's Assist (brightly-colored, pink, blue and white), gather her samples, and let her choose the pink, red or blue cure." },
        { mod: "Shelly Cure Quest", text: "New setting in the mod menu: whether Dr. Lash's sterilization also removes Steele's genitals (on by default)." },
        { mod: "Shelly Cure Quest", text: "Once she's cured, her cabin Sex menu opens: First Time, then Make Love (affection 5+), She Rides, Eat Her Out, Her Mouth and Grind, each followed by a short nap together." },
        { mod: "Shelly Cure Quest", text: "Every scene has bipedal, taur and naga versions, supports herms, cockvines and cunt-snakes, and changes with the cure she took." },
        { mod: "Shelly Cure Quest", text: "New cured busts for Shelly, normal and nude, in TN_ShellyCureBusts.js. Red uses the Lash art. Your own custom bust art for Shelly is left alone." },
        { mod: "Chimerune", text: "New: Chimerune pill, sold by Dr. Lessau on Uveto. It turns Steele into Lessau's own chimera: white fur, lion head, ears and clawed arms, a long orange mane and mantle, a second pair of arms, a black-scaled naga tail, black bull horns, white feathered wings and glowing amber feline eyes." },
        { mod: "Chimerune", text: "Below the waist: a long, flexible tongue, a flared, barb-ringed horse cock in a genital slit, and naleen pussies. Up to 3 changes per pill." },
        { mod: "Chimerune", text: "A fully changed Steele is now called a chimera, and new cocks grown later come in equine. The extra arms are the Four-Armed perk and can be skipped or removed from the mod menu." }
      ]
    },
    {
      version: "1.4",
      date: "2026-10-21",
      title: "Birds, boards and quality of life",
      changes: [
        { mod: "Phoenix & Thunderbird", text: "New: Ember Seed (phoenix) and Storm Seed (thunderbird) avian transformatives. Both are sold by Jade on Tavros; Dr. Lessau on Uveto also sells the Ember Seed." },
        { mod: "Phoenix & Thunderbird", text: "New perks: Pyre Veins (immune to Uveto's cold, +25% burning resistance) and Stormborn (+25% electric resistance)." },
        { mod: "Phoenix & Thunderbird", text: "New combat abilities: Phoenix Flare (fire damage, can set foes ablaze) and Thunderclap (electric damage, can paralyze). These need the main.js combat patch." },
        { mod: "Phoenix & Thunderbird", text: "Phoenix Rebirth: once per fight, rise from the ashes at 50% HP when your HP hits 0, in an explosion that sets every enemy ablaze." },
        { mod: "Phoenix & Thunderbird", text: "Both seeds give feathered avian ears, avian genitals (red for phoenix, blue for thunderbird) and a flat chest (pink or blue nipples). Chest changes can be switched off in the mod menu." },
        { mod: "Phoenix & Thunderbird", text: "Secret species names: with enough avian traits, the game calls you a phoenix (Pyre Veins) or a thunderbird (Stormborn), like it does for griffins." },
        { mod: "Holoboard", text: "New: Anno's Holoboard, a refurbished hoverboard coated in her own invention, holopaint. Recolor it any time with Interact; turn the projector off for bare steel. Works as a real hoverboard." },
        { mod: "Holoboard", text: "Sold in Anno's shop (outpost or crew) for the same price Shekka charges for a pink board, thanks to Steele's permanent half-off discount. Anno shows it off the first time you visit." },
        { mod: "Draconilum", text: "Now grows frilled dragon ears, and Reptilum's changes no longer turn them back into lizard ears." },
        { mod: "Gryphonix", text: "Gryphon ears are now properly feathered." },
        { mod: "Draconilum / Gryphonix", text: "Fixed: opening Jade's shop crashed with \"e is not a constructor\"." },
        { mod: "Draconilum / Gryphonix / Lane Detox Weights", text: "Fixed: their on/off switches in the mod menu now work." },
        { mod: "Android Mod Menu", text: "The mods panel can always be closed: tap outside it, tap Android Mods again, or press Back. The Close button stays visible while scrolling." },
        { mod: "Wiki Browser", text: "The Wiki button moved to a new Info section in the main menu sidebar. Android Back now closes the wiki." },
        { mod: "Changelog", text: "New: this changelog, with the mod version shown in the Info section." }
      ]
    }
  ];
  // ===========================================================================

  var TAG = "[Changelog]";
  var CACHE_KEY = "tn.changelog.remote.v1";
  var SEEN_KEY = "tn.changelog.seen.v1";
  var remote = null;   // { latest, versions } once downloaded (or from cache)

  function debug(msg) {
    try { console.log(TAG, msg); } catch (e) {}
    try { if (window.tnModMenuActive === true && typeof window.tnDebugLog === "function") window.tnDebugLog(TAG + " " + msg); } catch (e) {}
  }
  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  // Compares "1.4" vs "1.10" numerically. Returns >0 if a is newer.
  function compareVersions(a, b) {
    var pa = String(a).split(/[.\-]/), pb = String(b).split(/[.\-]/);
    for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
      var x = parseInt(pa[i] || "0", 10) || 0, y = parseInt(pb[i] || "0", 10) || 0;
      if (x !== y) return x - y;
    }
    return 0;
  }
  function label(v) { return "Modv" + v; }

  function versions() {
    return remote && Array.isArray(remote.versions) && remote.versions.length ? remote.versions : CHANGELOG;
  }
  function latestVersion() {
    var v = remote && remote.latest ? remote.latest : (versions()[0] && versions()[0].version);
    return v || MOD_VERSION;
  }
  function updateAvailable() {
    return compareVersions(latestVersion(), MOD_VERSION) > 0;
  }
  function unseen() {
    return load(SEEN_KEY) !== latestVersion();
  }

  // ---------------------------------------------------------------------------
  // Remote changelog (optional)
  // ---------------------------------------------------------------------------
  function validRemote(data) {
    return data && Array.isArray(data.versions) && data.versions.length > 0 && data.versions.every(function (v) {
      return v && v.version && Array.isArray(v.changes);
    });
  }

  // github.com/<you>/<repo>/blob/<branch>/<path> -> raw.githubusercontent.com/...
  function rawUrl(url) {
    var m = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+)$/i.exec(url);
    return m ? "https://raw.githubusercontent.com/" + m[1] + "/" + m[2] + "/" + m[3] : url;
  }

  // Strips Markdown marks from short labels (version headings, mod tags).
  function plain(s) {
    return String(s).replace(/\\([\\`*_~\[\]()#])/g, "$1").replace(/[*_`~]/g, "").replace(/\s+/g, " ").trim();
  }

  // Reads a Markdown changelog into the same shape as CHANGELOG:
  //   { latest, versions: [ { version, date, title, notes, changes: [ { mod, text } ] } ] }
  function parseMarkdown(md) {
    var VERSION_RE = /^(?:modv|version\s*|v)?\s*\[?\s*(\d+(?:\.\d+)*[a-z]?)\s*\]?(?=$|[\s\-\u2013\u2014:(|])\s*(.*)$/i;
    var DATE_RE = /\(?\s*(\d{4}-\d{2}-\d{2})\s*\)?/;
    var out = { latest: "", versions: [] };
    var cur = null, item = null, para = null, group = "", inComment = false;
    String(md).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").forEach(function (line) {
      // HTML comments: <!-- latest: 2.3 --> sets the latest version; the rest is ignored.
      if (inComment) {
        if (line.indexOf("-->") === -1) return;
        line = line.slice(line.indexOf("-->") + 3);
        inComment = false;
      }
      line = line.replace(/<!--([\s\S]*?)-->/g, function (m, body) {
        var lm = /^\s*latest\s*:\s*(?:modv|v)?\s*([\w.\-]+)\s*$/i.exec(body);
        if (lm) out.latest = lm[1];
        return "";
      });
      if (line.indexOf("<!--") !== -1) { line = line.slice(0, line.indexOf("<!--")); inComment = true; }

      var blank = /^\s*$/.test(line);
      if (blank) { item = null; para = null; return; }

      var lm = /^\s*[*_]*\s*latest\s*[*_]*\s*:\s*[*_]*\s*(?:modv|v)?\s*(\d+(?:\.\d+)*[a-z]?)[*_]*\s*$/i.exec(line);
      if (lm) { out.latest = lm[1]; return; }

      var h = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
      if (h) {
        item = null; para = null;
        var level = h[1].length, text = plain(h[2]);
        var vm = level >= 2 && level <= 3 ? VERSION_RE.exec(text) : null;
        if (vm) {
          var rest = vm[2], dm = DATE_RE.exec(rest), date = "";
          if (dm) { date = dm[1]; rest = rest.replace(dm[0], " "); }
          cur = { version: vm[1], date: date, title: rest.replace(/^[\s\-\u2013\u2014:|]+|[\s\-\u2013\u2014:|]+$/g, ""), notes: [], changes: [] };
          out.versions.push(cur);
          group = "";
        } else if (cur && level >= 3) {
          group = text;
        }
        return;
      }
      if (!cur) return;   // intro text above the first version is not shown

      if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) { item = null; para = null; return; }   // --- rule

      if (!cur.date && !cur.changes.length && !cur.notes.length) {
        var dl = /^\s*[*_]*(?:date\s*:\s*)?[*_]*\s*(\d{4}-\d{2}-\d{2})\s*[*_]*\s*$/i.exec(line);
        if (dl) { cur.date = dl[1]; return; }
      }

      var b = /^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
      if (b) {
        para = null;
        if (b[1].replace(/\t/g, "    ").length >= 2 && item) {   // sub-point of the current bullet
          item.text += "\n\u2022 " + b[2].trim();
          return;
        }
        var text2 = b[2].trim(), mod = group;
        var tag = /^(?:\*\*|__)([^*_\n]+?)(?::(?:\*\*|__)|(?:\*\*|__):)\s*(.*)$/.exec(text2);
        if (tag) { mod = plain(tag[1]); text2 = tag[2]; }
        item = { mod: mod, text: text2 };
        cur.changes.push(item);
        return;
      }

      var t = line.trim().replace(/^>\s?/, "");
      if (item) { item.text += "\n" + t; return; }   // continues the bullet above
      if (para !== null) { cur.notes[cur.notes.length - 1] += "\n" + t; return; }
      cur.notes.push(t);
      para = t;
    });
    out.versions.forEach(function (v) { if (!v.notes.length) delete v.notes; if (!v.title) delete v.title; if (!v.date) delete v.date; });
    if (!out.latest && out.versions[0]) out.latest = out.versions[0].version;
    return out;
  }

  // JSON if it looks like JSON, otherwise Markdown.
  function parseRemote(body) {
    var text = String(body).replace(/^\uFEFF/, "");
    if (/^\s*[{\[]/.test(text)) return JSON.parse(text);
    return parseMarkdown(text);
  }
  function loadCachedRemote() {
    try {
      var cached = JSON.parse(load(CACHE_KEY) || "null");
      if (validRemote(cached)) { remote = cached; debug("using cached online changelog"); }
    } catch (e) {}
  }
  function fetchRemote() {
    if (!REMOTE_URL || typeof fetch !== "function") return;
    var base = rawUrl(REMOTE_URL.trim());
    var url = base + (base.indexOf("?") === -1 ? "?" : "&") + "t=" + Date.now();
    fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).then(function (body) {
      var data = parseRemote(body);
      if (!validRemote(data)) throw new Error("no versions found (check the ## version headings)");
      remote = data;
      store(CACHE_KEY, JSON.stringify(data));
      debug("online changelog loaded (latest " + latestVersion() + ")");
      refreshButton();
    }).catch(function (e) {
      debug("online changelog unavailable (" + e.message + "); using " + (remote ? "cached" : "bundled") + " notes");
    });
  }

  // ---------------------------------------------------------------------------
  // Inline Markdown -> safe HTML
  // ---------------------------------------------------------------------------
  // Everything is escaped first, so HTML in the notes shows as text. Only the
  // marks below become tags, and links must be http(s).
  function emphasis(s) {
    return s
      .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, "$1<strong>$2</strong>")
      .replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>")
      .replace(/(^|[^\w*])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![\w*])/g, "$1<em>$2</em>")
      .replace(/(^|[^\w])_(?=[^\s_])([^_\n]*?[^\s_])_(?!\w)/g, "$1<em>$2</em>");
  }
  function linkTag(href, inner) {
    href = String(href).replace(/&amp;/g, "&");
    if (!/^https?:\/\//i.test(href)) return null;
    return '<a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + inner + "</a>";
  }
  function md(text) {
    var tokens = [];
    function keep(html) { tokens.push(html); return "\u0000" + (tokens.length - 1) + "\u0000"; }
    var s = esc(text);
    s = s.replace(/\\([\\`*_~\[\]()#+\-.!>])/g, function (m, c) { return keep(c); });      // \* etc.
    s = s.replace(/`([^`\n]+)`/g, function (m, c) { return keep("<code>" + c + "</code>"); });
    s = s.replace(/\[([^\]\n]+)\]\(\s*([^)\s]+)\s*\)/g, function (m, t, u) {
      var a = linkTag(u, emphasis(t));
      return a ? keep(a) : m;
    });
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<()]*[^\s<().,;:!?'"])/g, function (m, pre, u) {   // bare links
      var a = linkTag(u, u);
      return a ? pre + keep(a) : m;
    });
    s = emphasis(s);
    for (var i = 0; i < 4 && s.indexOf("\u0000") !== -1; i++) {
      s = s.replace(/\u0000(\d+)\u0000/g, function (m, n) { return tokens[+n]; });
    }
    return s;
  }

  // ---------------------------------------------------------------------------
  // Viewer
  // ---------------------------------------------------------------------------
  function ensureStyle() {
    if (document.getElementById("tnChangelogStyle")) return;
    var st = document.createElement("style");
    st.id = "tnChangelogStyle";
    st.textContent =
      "#tnChangelog{position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;background:rgba(10,14,22,.55);}" +
      "#tnChangelogPanel{width:min(92vw,760px);max-height:86vh;overflow:auto;background:var(--backgroundColor,#3D5174);color:var(--textColor,#fff);" +
      "border-radius:.5em;box-shadow:0 .4em 1.2em rgba(0,0,0,.45);font-family:Lato,sans-serif;}" +
      "#tnChangelogHead{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:.8em;" +
      "padding:.8em 1em;background:var(--foregroundColorB,#2C3649);border-bottom:.15em solid var(--highlightColor,#8D31B0);}" +
      "#tnChangelogHead h2{margin:0;font-size:1.3em;}" +
      "#tnChangelogHead .ver{font-size:.85em;opacity:.85;font-weight:normal;margin-left:.5em;}" +
      "#tnChangelogHead button{border:0;border-radius:.3125em;padding:.55em 1em;background:var(--highlightColor,#8D31B0);color:#fff;font:inherit;font-weight:bold;cursor:pointer;}" +
      "#tnChangelogBody{padding:.4em 1.1em 1.2em;}" +
      ".kcl-update{margin:.8em 0 0;padding:.7em .9em;border-radius:.35em;background:var(--foregroundColorA,#333E52);border-left:.3em solid var(--focusColor,#00F5EF);}" +
      ".kcl-version{margin-top:1.1em;}" +
      ".kcl-version h3{margin:0 0 .2em;font-size:1.1em;}" +
      ".kcl-version .meta{font-size:.85em;opacity:.8;margin-bottom:.5em;}" +
      ".kcl-version ul{margin:.3em 0 0;padding-left:1.2em;}" +
      ".kcl-version li{margin:.35em 0;line-height:1.35;white-space:pre-line;}" +
      ".kcl-notes{margin:.3em 0 .5em;line-height:1.4;white-space:pre-line;}" +
      "#tnChangelogBody a{color:var(--focusColor,#9fe8ff);text-decoration:underline;}" +
      "#tnChangelogBody code{font-family:monospace;font-size:.92em;padding:.05em .3em;border-radius:.25em;background:rgba(0,0,0,.25);}" +
      ".kcl-mod{font-weight:bold;color:var(--focusColor,#9fe8ff);}" +
      ".kcl-installed{font-size:.75em;padding:.1em .45em;margin-left:.4em;border-radius:.3em;background:var(--highlightColor,#8D31B0);vertical-align:middle;}" +
      ".kcl-new{color:#ffd166;font-weight:bold;}";
    document.head.appendChild(st);
  }

  function closeViewer() {
    var el = document.getElementById("tnChangelog");
    if (el) el.remove();
  }

  function openViewer() {
    ensureStyle();
    closeViewer();
    var html = '<div id="tnChangelogPanel" role="dialog" aria-label="Changelog">' +
      '<div id="tnChangelogHead"><h2>Changelog<span class="ver">Installed: ' + esc(label(MOD_VERSION)) + '</span></h2>' +
      '<button type="button" data-kcl="close">Close ✕</button></div><div id="tnChangelogBody">';
    if (updateAvailable()) {
      html += '<div class="kcl-update"><b>' + esc(label(latestVersion())) + ' is available.</b> You have ' + esc(label(MOD_VERSION)) +
        '. The notes below include changes that aren’t in your build yet.</div>';
    }
    versions().forEach(function (v) {
      var isInstalled = compareVersions(v.version, MOD_VERSION) === 0;
      html += '<section class="kcl-version"><h3>' + esc(label(v.version)) + (v.title ? " — " + esc(v.title) : "") +
        (isInstalled ? '<span class="kcl-installed">Installed</span>' : "") + "</h3>";
      if (v.date) html += '<div class="meta">' + esc(v.date) + "</div>";
      (Array.isArray(v.notes) ? v.notes : v.notes ? [v.notes] : []).forEach(function (p) {
        html += '<p class="kcl-notes">' + md(p) + "</p>";
      });
      if (v.changes && v.changes.length) {
        html += "<ul>";
        v.changes.forEach(function (c) {
          if (typeof c === "string") c = { text: c };
          html += "<li>" + (c.mod ? '<span class="kcl-mod">' + esc(c.mod) + ":</span> " : "") + md(c.text) + "</li>";
        });
        html += "</ul>";
      }
      html += "</section>";
    });
    html += "</div></div>";
    var root = document.createElement("div");
    root.id = "tnChangelog";
    root.innerHTML = html;
    // Close: button, tap outside the panel, Escape (Android Back handled below).
    root.addEventListener("click", function (e) {
      if (e.target === root || (e.target.getAttribute && e.target.getAttribute("data-kcl") === "close")) closeViewer();
    });
    root.addEventListener("keydown", function (e) { if (e.key === "Escape") closeViewer(); });
    document.body.appendChild(root);
    store(SEEN_KEY, latestVersion());
    refreshButton();
  }

  document.addEventListener("backbutton", function (e) {
    if (!document.getElementById("tnChangelog")) return;
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
    closeViewer();
  }, true);

  // ---------------------------------------------------------------------------
  // Info section button (shared with the Wiki Browser)
  // ---------------------------------------------------------------------------
  var BUTTON = {
    id: "changelog",
    order: 20,
    title: "See what changed in this mod version.",
    label: function () {
      var text = "Changelog <span style=\"opacity:.8;font-weight:normal\">(" + esc(label(MOD_VERSION)) + ")</span>";
      if (updateAvailable()) text += ' <span class="kcl-new">⬆</span>';
      else if (unseen()) text += ' <span class="kcl-new">NEW</span>';
      return text;
    },
    onClick: openViewer
  };
  function refreshButton() {
    ensureStyle();
    if (window.tnInfo && typeof window.tnInfo.refresh === "function") window.tnInfo.refresh();
  }
  function registerButton() {
    ensureStyle();
    if (window.tnInfo && typeof window.tnInfo.addButton === "function") {
      window.tnInfo.addButton(BUTTON);
    } else {
      // The Wiki Browser (which owns the Info section) hasn't loaded yet: queue it.
      window.tnInfo = window.tnInfo || {};
      (window.tnInfo.pending = window.tnInfo.pending || []).push(BUTTON);
    }
  }

  window.TnChangelog = {
    version: MOD_VERSION,
    label: label(MOD_VERSION),
    open: openViewer,
    latest: latestVersion,
    updateAvailable: updateAvailable,
    parseMarkdown: parseMarkdown,   // for testing a .md file from the console
    refreshOnline: fetchRemote
  };

  loadCachedRemote();
  registerButton();
  fetchRemote();
  debug("loaded (" + label(MOD_VERSION) + ")");
})();
