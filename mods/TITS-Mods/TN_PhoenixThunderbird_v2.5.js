/*
 * PhoenixThunderbird.js — Kitty mod for Trials in Tainted Space (Android build)
 * ---------------------------------------------------------------------------
 * Adds two avian transformatives built on the Amber Seed base:
 *
 *   Both seeds also give feathered avian ears, a beak, and avian wings/arms/legs.
 *
 *   Ember Seed  (Phoenix)     — fiery feathers, glowing ember markings, long
 *                               flowing tail plumes, red avian genitals, flat
 *                               chest with pink nipples. Grants the perk
 *                               "Pyre Veins": immune to Uveto's cold, +25%
 *                               burning resistance, the "Phoenix Flare"
 *                               combat ability, and Phoenix Rebirth (once per
 *                               fight, revive at 50% HP when HP hits 0).
 *
 *   Storm Seed  (Thunderbird) — storm-dark feathers, crackling blue
 *                               markings, broad wings, blue avian genitals,
 *                               flat chest with blue nipples. Grants the perk
 *                               "Stormborn": +25% electric resistance and the
 *                               "Thunderclap" combat ability (paralysis chance
 *                               plus electric damage).
 *
 * Secret species names: with Pyre Veins (or Foxfire fur) and enough avian traits
 * the game calls you a "phoenix"; with Stormborn, a "thunderbird".
 *
 * Both are sold in Jade's shop on Tavros; Ember Seed is also sold by Dr. Lessau on Uveto.
 *
 * Requirements:
 *   - The items, perks and cold immunity work with NO other changes.
 *   - The two combat abilities need the one-line main.js patch
 *     (patch_main_combat_exposure.py), which exposes the game's combat attack
 *     list as window.TnCombatAttacks. Without it, the perks still work and
 *     the abilities are simply skipped (a console warning is logged).
 *
 * Safe to load more than once: a second copy exits immediately.
 */
(function () {
  "use strict";
  // Loaded twice (e.g. via Add JS and a script tag)? Keep the first copy only.
  if (window.TnPhoenixThunderbird) return;

  var TAG = "[PhoenixThunderbird]";
  var CONFIG = {
    // getClassName() of the shopkeepers who sell each item.
    // "Jade" = Jade's shop on Tavros, "DrLessau" = Dr. Lessau on Uveto.
    sellers: {
      EmberSeed: ["Jade", "DrLessau"],
      StormSeed: ["Jade"],
    },
    price: 1500,
    // How many perk-qualifying traits are needed to earn the perk (max 8).
    perkThreshold: 5,
    // false = leave breasts, nipples and lactation alone.
    flattenChest: true,
    // Phoenix Rebirth: fraction of max HP restored, once per fight.
    rebirthHP: 0.5,
    // Base fire damage of the Rebirth explosion (plus level and willpower / 4).
    rebirthBlastDamage: 5,
    // Phoenix Rebirth on/off (also switchable from the mod menu).
    rebirth: true,
  };

  // Logs go to the console AND the mod menu's TN DEBUG overlay (when Debug Mode is on).
  function toDebug(args) {
    try {
      if ((window.tnModMenuActive===true&&typeof window.tnDebugLog==="function")) {
        window.tnDebugLog(TAG + " " + [].slice.call(args).map(function (a) {
          return a && a.stack ? a.stack.split("\n").slice(0, 2).join(" | ") : String(a);
        }).join(" "));
      }
    } catch (e) {}
  }
  function log() {
    try { console.log.apply(console, [TAG].concat([].slice.call(arguments))); } catch (e) {}
    toDebug(arguments);
  }
  function warn() {
    try { console.warn.apply(console, [TAG].concat([].slice.call(arguments))); } catch (e) {}
    toDebug(arguments);
  }

  // -------------------------------------------------------------------------
  // Android Mod Menu integration
  // -------------------------------------------------------------------------
  var MOD_ID = "tn.phoenixThunderbird";
  var SETTINGS_KEY = "tn.phoenixThunderbird.settings.v1";

  // Same guard pattern as Drakongaru: on unless the mod menu says it's off.
  function enabled() {
    try {
      return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID) !== false;
    } catch (e) { return true; }
  }

  // Device-wide settings saved by the mod menu page (same storage style as the menu itself).
  function loadSettings() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}");
      if (saved && typeof saved === "object") {
        if (typeof saved.flattenChest === "boolean") CONFIG.flattenChest = saved.flattenChest;
        if (typeof saved.rebirth === "boolean") CONFIG.rebirth = saved.rebirth;
        if (typeof saved.lessauSellsEmber === "boolean") setLessauSellsEmber(saved.lessauSellsEmber);
      }
    } catch (e) { warn("could not load settings", e); }
  }
  function saveSettings() {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        flattenChest: CONFIG.flattenChest,
        rebirth: CONFIG.rebirth,
        lessauSellsEmber: lessauSellsEmber(),
      }));
    } catch (e) { warn("could not save settings", e); }
  }
  function lessauSellsEmber() {
    return CONFIG.sellers.EmberSeed.indexOf("DrLessau") !== -1;
  }
  function setLessauSellsEmber(on) {
    var list = CONFIG.sellers.EmberSeed.filter(function (n) { return n !== "DrLessau"; });
    if (on) list.push("DrLessau");
    CONFIG.sellers.EmberSeed = list;
  }

  function onOff(v) { return v ? "<b>On</b>" : "<b>Off</b>"; }

  function registerWithModMenu() {
    if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return false;
    window.registerModMenu({
      id: MOD_ID,
      name: "Phoenix & Thunderbird",
      author: "Techy-Nature",
      description: "Ember Seed (phoenix) and Storm Seed (thunderbird) transformatives, with the Pyre Veins and Stormborn perks, Phoenix Flare, Thunderclap and Phoenix Rebirth.",
      supportsToggle: true,
      getHtml: function () {
        return "When disabled: the seeds leave the shops, using one does nothing, and the perks, combat abilities and Rebirth go dormant. Your transformations stay as they are." +
          "<br><br>Chest changes (flat chest, colored nipples, lactation stops): " + onOff(CONFIG.flattenChest) +
          "<br>Phoenix Rebirth (once per fight, with explosion): " + onOff(CONFIG.rebirth) +
          "<br>Dr. Lessau sells Ember Seed on Uveto: " + onOff(lessauSellsEmber()) +
          '<br><br><button data-mod-act="chest">Chest Changes</button>' +
          '<button data-mod-act="rebirth">Rebirth</button>' +
          '<button data-mod-act="lessau">Lessau Shop</button>';
      },
      onAct: function (act) {
        if (act === "chest") CONFIG.flattenChest = !CONFIG.flattenChest;
        else if (act === "rebirth") CONFIG.rebirth = !CONFIG.rebirth;
        else if (act === "lessau") setLessauSellsEmber(!lessauSellsEmber());
        else return false;
        saveSettings();
        return true; // redraw the page
      },
    });
    return true;
  }

  // Calls a creature's "xxxUnlocked" check if it exists; otherwise assumes unlocked.
  function unlocked(c, fn) {
    var args = [].slice.call(arguments, 2);
    return typeof c[fn] !== "function" || c[fn].apply(c, args) !== false;
  }
  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
  function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }
  function G() {
    return window.GLOBAL;
  }

  // -------------------------------------------------------------------------
  // Shared avian body changes (each returns a closure, or null if not needed)
  // -------------------------------------------------------------------------
  function changeFeathers(pc, palette, hides, flavor) {
    var g = G();
    var already = pc.skinType === g.SKIN_TYPE_FEATHERS && palette.indexOf(pc.furColor) !== -1;
    if (already || pc.hasStatusEffect("Gel Body")) return null;
    if (!unlocked(pc, "skinTypeUnlocked", g.SKIN_TYPE_FEATHERS)) return null;
    return function () {
      var color = pick(palette);
      var wasFeathered = pc.skinType === g.SKIN_TYPE_FEATHERS;
      pc.skinType = g.SKIN_TYPE_FEATHERS;
      if (!pc.hasSkinFlag(g.FLAG_FLUFFY)) pc.skinFlags = [];
      pc.furColor = color;
      if (unlocked(pc, "skinToneUnlocked", hides[0])) pc.skinTone = pick(hides);
      output("\n\n" + (wasFeathered ? flavor.recolor : flavor.grow).replace(/%COLOR%/g, color));
      output(" <b>You now have " + color + " feathers!</b>");
    };
  }

  function changeMarkings(pc, accentColor, flavor) {
    if (pc.skinAccent === accentColor && pc.hasStatusEffect("Body Markings")) return null;
    return function () {
      if (typeof pc.clearAccentMarkings === "function") pc.clearAccentMarkings(true);
      // Pattern 8 = "marked with <accent> patterns, which tend to glow and pulse emotively."
      pc.createStatusEffect("Body Markings", 8, 0, 0, 0);
      pc.skinAccent = accentColor;
      output("\n\n" + flavor.replace(/%COLOR%/g, accentColor));
      output(" <b>You now have " + accentColor + " body markings!</b>");
    };
  }

  function changeWings(pc, flavor) {
    var g = G();
    if (pc.hasWings(g.TYPE_AVIAN) && pc.wingCount >= 2) return null;
    return function () {
      var had = pc.wingType !== 0 && pc.wingCount > 0;
      output("\n\n" + (had ? flavor.reshape : flavor.grow));
      pc.shiftWings(g.TYPE_AVIAN, 2);
      output(" <b>You now have large avian wings!</b>");
    };
  }

  function changeTail(pc, longPlumes, flavor) {
    var g = G();
    if (pc.isNaga && pc.isNaga()) return null;
    var hasIt = pc.hasTail(g.TYPE_AVIAN) && (!longPlumes || pc.hasTailFlag(g.FLAG_LONG));
    if (hasIt) return null;
    if (!unlocked(pc, "tailTypeUnlocked", g.TYPE_AVIAN)) return null;
    return function () {
      output("\n\n" + (pc.hasTail() ? flavor.reshape : flavor.grow));
      pc.shiftTail(g.TYPE_AVIAN, 1);
      pc.tailFlags = longPlumes ? [g.FLAG_FEATHERED, g.FLAG_LONG] : [g.FLAG_FEATHERED];
      output(longPlumes
        ? " <b>You now have a long, trailing avian tail!</b>"
        : " <b>You now have a fanned avian tail!</b>");
    };
  }

  function changeLegs(pc) {
    var g = G();
    if (pc.isNaga && pc.isNaga()) return null;
    if (pc.legType === g.TYPE_AVIAN) return null;
    if (!unlocked(pc, "legTypeUnlocked", g.TYPE_AVIAN)) return null;
    if (pc.legCount === 1 && !unlocked(pc, "legCountUnlocked", 2)) return null;
    return function () {
      output("\n\nYour [pc.legs] soften like warm wax, then firm up again into lean, bird-like legs, ending in long, padded toes tipped with short, sharp talons. A fringe of feathers covers them down to your knees. <b>You now have bird-like legs!</b>");
      if (pc.legCount === 1) { pc.legCount = 2; pc.genitalSpot = 0; }
      pc.legType = g.TYPE_AVIAN;
      pc.legFlags = [g.FLAG_DIGITIGRADE, g.FLAG_PREHENSILE, g.FLAG_PAWS, g.FLAG_FEATHERED];
    };
  }

  function changeArms(pc) {
    var g = G();
    if (pc.armType === g.TYPE_AVIAN) return null;
    return function () {
      output("\n\nA rippling, shifting sensation runs down your arms. When it settles, you’re left with lean, surprisingly strong arms and long, clawed, padded fingers, with a fringe of feathers down to your elbows. <b>You now have bird-like arms!</b>");
      pc.armType = g.TYPE_AVIAN;
      pc.armFlags = [g.FLAG_PAWS, g.FLAG_FEATHERED];
    };
  }

  function changeHair(pc) {
    var g = G();
    if (pc.hairType === g.HAIR_TYPE_FEATHERS) return null;
    if (!unlocked(pc, "hairTypeUnlocked", g.HAIR_TYPE_FEATHERS)) return null;
    return function () {
      output("\n\nYour scalp prickles. Running a hand over your head, you find a crest of feathers where your [pc.hairNoun] used to be. <b>You now have a feathery plume on your head!</b>");
      pc.hairType = g.HAIR_TYPE_FEATHERS;
      pc.hairStyle = "null";
    };
  }

  function changeEyes(pc, colors, flavor) {
    var g = G();
    if (pc.eyeType === g.TYPE_AVIAN && colors.indexOf(pc.eyeColor) !== -1) return null;
    if (!unlocked(pc, "eyeTypeUnlocked", g.TYPE_AVIAN)) return null;
    return function () {
      pc.eyeType = g.TYPE_AVIAN;
      var c = pick(colors);
      if (unlocked(pc, "eyeColorUnlocked", c)) pc.eyeColor = c;
      output("\n\n" + flavor);
      output(" <b>You now have [pc.eyeColor] avian eyes, complete with nictitating membranes!</b>");
    };
  }

  // --- Genitals & chest -----------------------------------------------------
  function changeGenitalSlit(pc) {
    var g = G();
    if (!pc.hasCock() || pc.hasCrotchFlag(g.FLAG_GENITAL_SLIT)) return null;
    if (pc.isNaga && pc.isNaga()) return null;
    return function () {
      var one = pc.cockTotal() === 1;
      output("\n\nIn a single sucking motion, your [pc.cocks] " + (one ? "is" : "are") + " drawn up into your body! A bit of poking around reveals that your dick" + (one ? " now rests" : "s now rest") + " inside a smooth genital slit, only emerging when you’re aroused. <b>You now have a genital slit!</b>");
      pc.addCrotchFlag(g.FLAG_GENITAL_SLIT);
    };
  }

  function changeInternalBalls(pc) {
    var g = G();
    if (!(pc.balls > 0) || !pc.hasCrotchFlag(g.FLAG_GENITAL_SLIT)) return null;
    return function () {
      if (!unlocked(pc, "ballsUnlocked", 0)) {
        output("\n\n" + pc.ballsLockedMessage());
        return;
      }
      var one = pc.balls === 1;
      output("\n\nYour [pc.balls] draw" + (one ? "s" : "") + " up tight against your body, as if right before a climax, then keep going until " + (one ? "it’s" : "they’re") + " tucked away inside you entirely. <b>You now have internal testicles!</b>");
      pc.makeBallsInternal();
    };
  }

  function changeCocks(pc, color, flavor) {
    var g = G();
    if (!pc.hasCock()) return null;
    var targets = [];
    for (var i = 0; i < pc.cockTotal(); i++) {
      var c = pc.cocks[i];
      if ((c.cType !== g.TYPE_AVIAN || c.cockColor !== color) && unlocked(pc, "cockTypeUnlocked", i, g.TYPE_AVIAN)) targets.push(i);
    }
    if (!targets.length) return null;
    return function () {
      var one = targets.length === 1;
      output("\n\n" + flavor.replace(/%S%/g, one ? "" : "s").replace(/%A%/g, one ? "a " : "").replace(/%COLOR%/g, color));
      targets.forEach(function (i) {
        if (pc.cocks[i].cType !== g.TYPE_AVIAN) pc.shiftCock(i, g.TYPE_AVIAN);
        pc.cocks[i].cockColor = color;
      });
      output(" <b>You now have " + (one ? "a " : "") + color + " avian cock" + (one ? "" : "s") + "!</b>");
      if (typeof pc.orgasm === "function") pc.orgasm();
    };
  }

  function changeVaginas(pc, color, flavor) {
    var g = G();
    if (!pc.hasVagina()) return null;
    var targets = [];
    for (var i = 0; i < pc.vaginaTotal(); i++) {
      var v = pc.vaginas[i];
      if ((v.type !== g.TYPE_AVIAN || v.vaginaColor !== color) && unlocked(pc, "vaginaTypeUnlocked", i, g.TYPE_AVIAN)) targets.push(i);
    }
    if (!targets.length) return null;
    return function () {
      var one = targets.length === 1;
      output("\n\n" + flavor.replace(/%S%/g, one ? "" : "s").replace(/%A%/g, one ? "a " : "").replace(/%COLOR%/g, color));
      targets.forEach(function (i) {
        if (pc.vaginas[i].type !== g.TYPE_AVIAN) pc.shiftVagina(i, g.TYPE_AVIAN);
        pc.vaginas[i].vaginaColor = color;
      });
      output(" <b>You now have " + (one ? "a " : "") + color + " avian vagina" + (one ? "" : "s") + "!</b>");
      var minElastic = pc.hasPerk("Elasticity") ? 3 : 2;
      if (pc.elasticity < minElastic) {
        pc.elasticity = minElastic;
        output("\n\nYour new " + (one ? "opening seems" : "openings seem") + " built for laying eggs: tight and stretchy all at once. <b>Your elasticity has considerably increased!</b>");
      }
      if (typeof pc.orgasm === "function") pc.orgasm();
    };
  }

  function changeChest(pc, nippleColor) {
    var g = G();
    if (!CONFIG.flattenChest) return null;
    if (!pc.breastRows || !pc.breastRows.length) return null;
    var row = pc.breastRows[0];
    var needsFlat = pc.breastRows.length > 1 || row.breastRatingRaw > 0;
    var needsNipples = pc.nippleColor !== nippleColor || (row.nippleType !== g.NIPPLE_TYPE_FLAT && unlocked(pc, "nippleTypeUnlocked", 0, g.NIPPLE_TYPE_FLAT));
    if (!needsFlat && !needsNipples) return null;
    if (pc.skinType !== g.SKIN_TYPE_FEATHERS) return null; // feathers first, like Amber Seed
    if (pc.canLactate && pc.canLactate()) return null; // lactation is dried up by its own change first
    return function () {
      if (needsFlat && !unlocked(pc, "breastRatingUnlocked", 0, 0)) {
        output("\n\n" + pc.breastRatingLockedMessage());
        return;
      }
      var big = typeof pc.biggestTitSize === "function" ? pc.biggestTitSize() : 0;
      pc.breastRows = [row];
      row.breastRatingRaw = 0;
      if (unlocked(pc, "nippleTypeUnlocked", 0, g.NIPPLE_TYPE_FLAT)) row.nippleType = g.NIPPLE_TYPE_FLAT;
      if (unlocked(pc, "nippleLengthRatioUnlocked", 1) && pc.nippleLengthRatio > 1) pc.nippleLengthRatio = 1;
      if (unlocked(pc, "nipplesPerBreastUnlocked", 1) && pc.nipplesPerBreast > 1) pc.nipplesPerBreast = 1;
      pc.nippleColor = nippleColor;
      if (needsFlat) {
        output("\n\nA sloshing, shifting sensation fills your [pc.fullChest] as your mass is pulled away and redistributed into a sleek, aerodynamic frame. In moments, all that’s left are a pair of flat, still-sensitive " + nippleColor + " nipples.");
        if (big >= 8) output(" You feel like Atlas with the sky finally lifted off his shoulders.");
        output(" <b>Your chest is now completely flat, with " + nippleColor + " nipples!</b>");
      } else {
        output("\n\nYour nipples tingle and darken into a vivid " + nippleColor + ". <b>You now have flat " + nippleColor + " nipples!</b>");
      }
    };
  }

  function changeLactation(pc) {
    if (!CONFIG.flattenChest) return null;
    if (!(pc.canLactate && pc.canLactate())) return null;
    return function () {
      var big = ["Mega Milk", "Milk Fountain", "Honeypot"];
      var stubborn = big.some(function (p) { return pc.hasPerk(p); }) || (pc.hasPerk("Milky") && pc.hasPerk("Treated Milk"));
      if (stubborn) {
        output("\n\nYou’d thought nothing could stop your lactation, but you were wrong! You’ve finally dried up.");
        big.forEach(function (p) { if (pc.hasPerk(p)) pc.removePerk(p); });
        if (pc.hasPerk("Milky") && pc.hasPerk("Treated Milk")) pc.removePerk("Treated Milk");
      } else {
        output("\n\nAn experimental squeeze of your [pc.nipples] reveals that you’ve dried up completely. Birds don’t really lactate, after all.");
      }
      pc.milkMultiplier = 0;
      pc.milkFullness = 0;
    };
  }

  function changeEars(pc, flavor) {
    var g = G();
    var done = pc.earType === g.TYPE_AVIAN && pc.earFlags && pc.earFlags.indexOf(g.FLAG_FEATHERED) !== -1;
    if (done) return null;
    return function () {
      output("\n\n" + flavor);
      pc.earType = g.TYPE_AVIAN;
      if (typeof pc.clearEarFlags === "function") pc.clearEarFlags(); else pc.earFlags = [];
      pc.addEarFlag(g.FLAG_FEATHERED);
      output(" <b>You now have feathered avian ears!</b>");
    };
  }

  function changeFace(pc) {
    var g = G();
    if (pc.faceType === g.TYPE_AVIAN) return null;
    return function () {
      output("\n\nSomething tugs at your [pc.face], and your nose and mouth flow forward together into a single smooth, hooked shape. It looks like a proper beak, but it moves like lips, and your teeth are still there, tucked out of sight. <b>You now have a beak-like muzzle!</b>");
      pc.faceType = g.TYPE_AVIAN;
      pc.faceFlags = [g.FLAG_MUZZLED, g.FLAG_BEAK];
    };
  }

  // -------------------------------------------------------------------------
  // Species definitions
  // -------------------------------------------------------------------------
  var SPECIES = {
    phoenix: {
      perk: "Pyre Veins",
      perkDesc: "Living fire runs through your veins. You are immune to Uveto’s cold, resist burning damage, can unleash Phoenix Flare in combat, and once per fight you rise from the ashes when defeated by damage.",
      genitalColor: "red",
      nippleColor: "pink",
      palette: ["crimson", "scarlet", "flame-orange", "golden", "crimson and gold", "fiery red"],
      hides: ["black", "dark red", "gold"],
      accent: "glowing ember-gold",
      eyes: ["glowing amber", "ember-gold", "molten orange"],
      longTail: true,
      flavor: {
        feathersGrow: "Heat blooms beneath your [pc.skinFurScales], building until you could swear you’re about to catch fire. Instead, a rush of soft down pushes out all over your body, followed by sleek %COLOR% plumage that shimmers like coals.",
        feathersRecolor: "A wave of warmth washes over your feathers, and they flush from root to tip into a brilliant %COLOR%, as if lit from within.",
        markings: "Thin lines of light trace themselves across your body, spreading in flame-like swirls that brighten when your heart races. The %COLOR% patterns pulse softly, like embers in a breeze.",
        wingsGrow: "Your shoulder blades burn, a hot, insistent itch, until a pair of wings bursts free in a shower of harmless sparks. They unfurl wide, every flight feather tipped with a flicker of light.",
        wingsReshape: "Your [pc.wings] go hot and limp, then reshape themselves into broad, feathered wings, each flight feather tipped with a flicker of light.",
        tailGrow: "Something warm and heavy sprouts from your tailbone, growing longer and longer into a trailing train of long, flame-like plumes that sweep behind you as you move.",
        tailReshape: "Your old tail melts away like candle wax, and in its place grows a long, trailing train of flame-like plumes that sweep behind you as you move.",
        eyes: "Your vision flares bright, then settles. In your Codex’s reflection, your eyes now burn like banked coals.",
        ears: "A warm itch builds at your ears until you reach up to scratch it, and find them shrinking away beneath your fingers. All that’s left are small, sleek openings framed by soft tufts of flame-tipped feathers that flutter at every sound.",
        cock: "Heat pools in your groin, setting your [pc.cocks] throbbing and leaking pre as the flesh twists and reshapes. When the fever breaks, you’re left with %A%long, slender, smoothly tapered avian shaft%S%, flushed a deep %COLOR% like the heart of a fire.",
        vagina: "A wave of heat rolls through your nethers, and you clench your thighs together with a moan as fluid gushes from your [pc.vaginas]. Reaching down, you find %A%smooth, bird-like cloacal opening%S% with thin, %COLOR% lips, warm as a banked coal.",
      },
      ability: "Phoenix Flare",
    },
    thunderbird: {
      perk: "Stormborn",
      perkDesc: "Storms answer to you. You resist electric damage and can call down Thunderclap in combat.",
      genitalColor: "blue",
      nippleColor: "blue",
      palette: ["storm-grey", "slate", "indigo", "charcoal", "midnight blue", "black and silver"],
      hides: ["black", "dark grey", "slate"],
      accent: "glowing electric-blue",
      eyes: ["electric blue", "crackling blue", "storm-silver"],
      longTail: false,
      flavor: {
        feathersGrow: "Every hair on your body stands on end as static crackles across your [pc.skinFurScales]. With a sharp snap of ozone, %COLOR% feathers burst out all over you, sleek and dense as thunderclouds.",
        feathersRecolor: "Static ripples through your feathers, and they darken from root to tip into a deep %COLOR%, like a gathering storm.",
        markings: "Jagged lines of light branch across your body like lightning frozen mid-strike. The %COLOR% patterns flicker whenever you move quickly, and they crackle faintly when you’re worked up.",
        wingsGrow: "Thunder rumbles inside your chest, and your back splits open into a pair of enormous, broad wings. When you flex them, the air hums with static.",
        wingsReshape: "Your [pc.wings] twitch with static, then reshape themselves into enormous, broad, storm-feathered wings that hum when you flex them.",
        tailGrow: "A sharp jolt at your tailbone heralds a short, broad fan of stiff flight feathers, perfect for steering through a gale.",
        tailReshape: "Static crackles through your old tail until it dissolves entirely, leaving behind a short, broad fan of stiff flight feathers, perfect for steering through a gale.",
        eyes: "Lightning flashes behind your eyes, leaving you blinking away afterimages. Your Codex’s reflection shows irises that flicker like distant storms.",
        ears: "Static crackles in your ears, louder and louder, until they fold down and shrink away beneath your fingers. In their place are small, sleek openings framed by stiff tufts of storm-dark feathers that bristle whenever thunder rolls.",
        cock: "A jolt of static arcs straight through your groin, leaving your [pc.cocks] jerking and throbbing, spurting pre as the flesh twists and reshapes. When the tingling fades, you’re left with %A%long, slender, smoothly tapered avian shaft%S% in a vivid electric %COLOR%.",
        vagina: "Static crackles across your nethers, and you clench your thighs together with a gasp as fluid gushes from your [pc.vaginas]. Reaching down, you find %A%smooth, bird-like cloacal opening%S% with thin, %COLOR% lips that still tingle faintly with charge.",
      },
      ability: "Thunderclap",
    },
  };

  function speciesScore(pc, sp) {
    var g = G();
    var s = 0;
    if (pc.skinType === g.SKIN_TYPE_FEATHERS && sp.palette.indexOf(pc.furColor) !== -1) s++;
    if (pc.skinAccent === sp.accent) s++;
    if (pc.hasWings(g.TYPE_AVIAN)) s++;
    if (pc.hasTail(g.TYPE_AVIAN)) s++;
    if (pc.legType === g.TYPE_AVIAN) s++;
    if (pc.armType === g.TYPE_AVIAN) s++;
    if (pc.eyeType === g.TYPE_AVIAN && sp.eyes.indexOf(pc.eyeColor) !== -1) s++;
    if (pc.hairType === g.HAIR_TYPE_FEATHERS) s++;
    return s;
  }

  function buildChanges(pc, sp) {
    var f = sp.flavor;
    return [
      changeFeathers(pc, sp.palette, sp.hides, { grow: f.feathersGrow, recolor: f.feathersRecolor }),
      changeMarkings(pc, sp.accent, f.markings),
      changeWings(pc, { grow: f.wingsGrow, reshape: f.wingsReshape }),
      changeTail(pc, sp.longTail, { grow: f.tailGrow, reshape: f.tailReshape }),
      changeLegs(pc),
      changeArms(pc),
      changeHair(pc),
      changeEyes(pc, sp.eyes, f.eyes),
      changeFace(pc),
      changeEars(pc, f.ears),
      changeGenitalSlit(pc),
      changeInternalBalls(pc),
      changeCocks(pc, sp.genitalColor, f.cock),
      changeVaginas(pc, sp.genitalColor, f.vagina),
      changeLactation(pc),
      changeChest(pc, sp.nippleColor),
    ].filter(Boolean);
  }

  function applySpeciesTF(pc, key) {
    var sp = SPECIES[key];
    // Same dose pattern as Amber Seed: 1 change, with chances for up to 3 more.
    var doses = 1;
    if (Math.random() < 1 / 2) doses++;
    if (Math.random() < 1 / 3) doses++;
    if (Math.random() < 1 / 4) doses++;
    var changed = 0;
    while (doses-- > 0) {
      var options = buildChanges(pc, sp);
      if (!options.length) break;
      pick(options)();
      changed++;
    }
    var gotPerk = false;
    if (!pc.hasPerk(sp.perk) && speciesScore(pc, sp) >= CONFIG.perkThreshold) {
      pc.createPerk(sp.perk, 1, 0, 0, 0, sp.perkDesc);
      output("\n\n(<b>Perk Gained: " + sp.perk + "</b> - " + sp.perkDesc + ")");
      gotPerk = true;
    }
    if (!changed && !gotPerk) {
      output("\n\nNothing else happens. It seems you’re as much of a " + (key === "phoenix" ? "phoenix" : "thunderbird") + " as this seed can make you.");
    }
    if (typeof window.clearBust === "function") window.clearBust();
  }

  // -------------------------------------------------------------------------
  // Item classes (subclassing the same base class Amber Seed uses)
  // -------------------------------------------------------------------------
  function registerItems(Reg) {
    var Amber = Reg.RegisteredClasses.AmberSeed;
    var Base = Object.getPrototypeOf(Amber);
    var g = G();

    function makeItem(className, longName, description, tooltip, speciesKey, introText) {
      if (Reg.RegisteredClasses[className]) return Reg.RegisteredClasses[className];
      var Item = class extends Base {
        constructor() {
          super();
          this.stackSize = 10;
          this.type = g.PILL;
          this.shortName = className;
          this.longName = longName;
          this.description = description;
          this.tooltip = tooltip;
          this.basePrice = CONFIG.price;
          this.combatUsable = false;
          this.targetsSelf = true;
        }
        static getClassName() { return className; }
        getClassName() { return className; }
        useFunction(target) {
          clearOutput();
          if (!enabled()) {
            output("The seed sits in your palm, cold and inert. (The Phoenix & Thunderbird mod is disabled in the mod menu.)");
            return false;
          }
          if (target.getClassName() === "PlayerCharacter") {
            output(introText);
            applySpeciesTF(target, speciesKey);
          } else {
            output(target.capitalA + target.short + " doesn’t seem interested in using this item...");
          }
          return false;
        }
      };
      Object.defineProperty(Item, "name", { value: className });
      if (typeof Reg.registerClass === "function") Reg.registerClass(className, Item);
      else Reg.RegisteredClasses[className] = Item;
      return Item;
    }

    var Ember = makeItem(
      "EmberSeed", "Ember Seed",
      "a blister pack of “Ember Seed”",
      "An avian transformative based on the Amber Seed, this one glowing a faint orange through its shell and warm to the touch. The label reads “Rise from the ashes! Phoenix-grade FluidShift technology.” The fine print warns: “Not responsible for spontaneous sparks.”",
      "phoenix",
      "You pop the ember seed into your mouth. It’s hot, like a cinnamon candy that’s been sitting in the sun, and it dissolves almost instantly, leaving a pleasant warmth spreading out from your belly."
    );
    var Storm = makeItem(
      "StormSeed", "Storm Seed",
      "a blister pack of “Storm Seed”",
      "An avian transformative based on the Amber Seed, this one a deep slate color with a faint blue spark trapped inside. The label reads “Ride the lightning! Thunderbird-grade FluidShift technology.” The fine print warns: “Ground yourself before use.”",
      "thunderbird",
      "You bite down on the storm seed and feel a sharp little zap across your tongue. It dissolves instantly, and the taste of ozone lingers as a tingle spreads through your whole body."
    );
    return [Ember, Storm];
  }

  // -------------------------------------------------------------------------
  // Creature hooks: cold immunity + resistances
  // -------------------------------------------------------------------------
  function findOwner(proto, method) {
    while (proto && !Object.prototype.hasOwnProperty.call(proto, method)) proto = Object.getPrototypeOf(proto);
    return proto;
  }

  var REBIRTH_STATUS = "Phoenix Rebirth Used";

  function tryPhoenixRebirth(c) {
    if (!enabled() || !CONFIG.rebirth) return;
    if (c.getClassName() !== "PlayerCharacter") return;
    if (!c.hasPerk("Pyre Veins")) return;
    if (typeof window.inCombat !== "function" || !window.inCombat()) return;
    if (c.HP() > 0 || c.hasStatusEffect(REBIRTH_STATUS)) return;
    if (c.lust() >= c.lustMax()) return; // lust defeats aren't a death, so no rebirth
    // name, v1-v4, hidden, icon, tooltip, combatOnly (cleared when the fight ends)
    c.createStatusEffect(REBIRTH_STATUS, 0, 0, 0, 0, true, "", "", true);
    var hp = Math.max(1, Math.round(c.HPMax() * CONFIG.rebirthHP));
    c.HPRaw = hp;
    if (c.hasStatusEffect("Burning")) c.removeStatusEffect("Burning");
    var msg = "\n\nYou crumple, and for a moment everything goes dark... then fire roars up from inside you. Your body is swallowed in a pillar of golden flame that burns away every wound, and you rise from the ashes, wings spread wide and blazing! <b>Phoenix Rebirth! You recover " + hp + " HP.</b>";
    if (typeof window.combatAppend === "function") window.combatAppend(msg);
    else output(msg);
    rebirthExplosion(c);
  }

  // The flames of rebirth explode outward: small fire damage + Burning on every enemy.
  function rebirthExplosion(c) {
    var foes = typeof window.getHostileActors === "function" ? window.getHostileActors() : [];
    foes = (foes || []).filter(function (f) { return f && !(f.isDefeated && f.isDefeated()); });
    if (!foes.length) return;
    var say = typeof window.combatAppend === "function" ? window.combatAppend : output;
    say("\n\nThe pillar of fire bursts outward in a roaring shockwave, washing over every foe around you!");
    var base = CONFIG.rebirthBlastDamage + c.level + Math.round(c.willpower() / 4);
    foes.forEach(function (f) {
      var dmg = variance(base);
      say("\n");
      applyDamage({ baseDamage: damageCollection({ burning: dmg }), attacker: c, target: f, outputMinimal: true });
      if (f.isDefeated && f.isDefeated()) return;
      window.StaticCombatAttacks.applyBurning(f, 3, Math.max(3, Math.ceil(dmg / 3)));
      say(" <b>" + cap(nameOf(f)) + (f.isPlural ? " are" : " is") + " set ablaze!</b>");
    });
  }

  function hookCreature(Reg) {
    var PC = Reg.RegisteredClasses.PlayerCharacter;
    if (!PC) { warn("PlayerCharacter class not found; perks inactive."); return false; }

    var coldOwner = findOwner(PC.prototype, "willTakeColdDamage");
    if (coldOwner && !coldOwner.willTakeColdDamage._tnPT) {
      var origCold = coldOwner.willTakeColdDamage;
      var newCold = function () {
        if (enabled() && this.hasPerk && this.hasPerk("Pyre Veins")) return false;
        return origCold.apply(this, arguments);
      };
      newCold._tnPT = true;
      coldOwner.willTakeColdDamage = newCold;
    }

    var resOwner = findOwner(PC.prototype, "getHPResistances");
    if (resOwner && !resOwner.getHPResistances._tnPT) {
      var origRes = resOwner.getHPResistances;
      var newRes = function () {
        var r = origRes.apply(this, arguments);
        try {
          if (enabled() && this.hasPerk && r) {
            if (this.hasPerk("Pyre Veins") && r.burning) r.burning.resistanceValue += 25;
            if (this.hasPerk("Stormborn") && r.electric) r.electric.resistanceValue += 25;
          }
        } catch (e) { warn("resistance hook error", e); }
        return r;
      };
      newRes._tnPT = true;
      resOwner.getHPResistances = newRes;
    }

    // Phoenix Rebirth: once per fight, a Pyre Veins PC who drops to 0 HP rises again.
    var defOwner = findOwner(PC.prototype, "isDefeated");
    if (defOwner && !defOwner.isDefeated._tnPT) {
      var origDef = defOwner.isDefeated;
      var newDef = function () {
        try { tryPhoenixRebirth(this); } catch (e) { warn("rebirth error", e); }
        return origDef.apply(this, arguments);
      };
      newDef._tnPT = true;
      defOwner.isDefeated = newDef;
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // Secret species names: "phoenix" and "thunderbird"
  // -------------------------------------------------------------------------
  // The game scores your body against every entry in window.raceScoreObject and
  // names you after the best match. "griffin" and "phoenix" are modifier races:
  // the avian checklist plus one extra requirement, so they beat plain "avian"
  // when that requirement is met. The table is frozen, so this copies it, widens
  // phoenix (Foxfire fur OR Pyre Veins) and adds thunderbird (Stormborn), then
  // swaps the copy in. Every game lookup goes through window.raceScoreObject.
  function hookRaceNames(Reg) {
    var table = window.raceScoreObject;
    if (!table) return false;
    if (table._tnPT) return true;
    var descs = Object.getOwnPropertyDescriptors(table);
    if (!descs.avian || !descs.avian.get) { warn("race table has no avian entry; species names unchanged"); return true; }
    var origPhoenix = descs.phoenix && descs.phoenix.get;

    descs.phoenix = {
      enumerable: true, configurable: true,
      get: function () {
        var base = origPhoenix ? origPhoenix.call(this) : Object.assign(this.avian, { isModifier: "avian" });
        var foxfire = base["Foxfire fur color"];
        delete base["Foxfire fur color"];
        base["Foxfire fur color or “Pyre Veins” perk"] = {
          score: foxfire ? foxfire.score : 1,
          func: function (c) {
            return !!((foxfire && foxfire.func(c)) || (enabled() && c.hasPerk && c.hasPerk("Pyre Veins")));
          },
        };
        return base;
      },
    };
    descs.thunderbird = {
      enumerable: true, configurable: true,
      get: function () {
        return Object.assign(this.avian, {
          "“Stormborn” perk": { score: 1, func: function (c) { return !!(enabled() && c.hasPerk && c.hasPerk("Stormborn")); } },
          isModifier: "avian",
        });
      },
    };
    var copy = Object.defineProperties({}, descs);
    Object.defineProperty(copy, "_tnPT", { value: true }); // not enumerable, so it isn't scored as a race
    window.raceScoreObject = Object.freeze(copy);

    // New genitals grown later follow the species name; the game doesn't know
    // "thunderbird" there, so map it to avian like phoenix and griffin.
    var PC = Reg.RegisteredClasses.PlayerCharacter;
    var owner = PC && findOwner(PC.prototype, "getCockTypeForRace");
    if (owner && !owner.getCockTypeForRace._tnPT) {
      var origCockType = owner.getCockTypeForRace;
      var newCockType = function () {
        try {
          if (enabled() && typeof this.raceShort === "function" && this.raceShort() === "thunderbird") return G().TYPE_AVIAN;
        } catch (e) {}
        return origCockType.apply(this, arguments);
      };
      newCockType._tnPT = true;
      owner.getCockTypeForRace = newCockType;
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // Shop hook: add the seeds to Jade's stock
  // -------------------------------------------------------------------------
  function hookShop(itemClasses) {
    if (typeof window.showShop !== "function" || window.showShop._tnPT) return !!window.showShop;
    var origShow = window.showShop;
    var newShow = function (opts) {
      try {
        var keeper = opts && opts.shopkeeper;
        var name = keeper && typeof keeper.getClassName === "function" ? keeper.getClassName() : "";
        if (name && enabled() && Array.isArray(opts.items)) {
          itemClasses.forEach(function (C) {
            var who = CONFIG.sellers[C.getClassName()] || [];
            if (who.indexOf(name) !== -1 && opts.items.indexOf(C) === -1) opts.items.push(C);
          });
        }
      } catch (e) { warn("shop hook error", e); }
      return origShow.apply(this, arguments);
    };
    newShow._tnPT = true;
    window.showShop = newShow;
    return true;
  }

  // -------------------------------------------------------------------------
  // Combat abilities (needs the main.js patch)
  // -------------------------------------------------------------------------
  function damageCollection(values) {
    var TC = window.TnTypeCollection;
    if (!TC && window.pc && typeof pc.getHPResistances === "function") {
      TC = pc.getHPResistances().constructor;
    }
    return new TC(values);
  }

  function variance(n) {
    return Math.max(1, Math.round(n * (0.85 + Math.random() * 0.3)));
  }

  function nameOf(c) {
    return c.getCombatName ? c.getCombatName() : c.short;
  }

  function phoenixFlareImpl(allies, hostiles, attacker, target) {
    var isPC = attacker.getClassName() === "PlayerCharacter";
    var tName = nameOf(target);
    combatOutput(isPC
      ? "You spread your blazing wings and sweep them forward, unleashing a roaring wave of phoenix fire at " + tName + "!"
      : cap(nameOf(attacker)) + " unleashes a wave of phoenix fire!", null, attacker);
    var dmg = variance(10 + 2 * attacker.level + attacker.willpower() / 1.5);
    applyDamage({ baseDamage: damageCollection({ burning: dmg }), attacker: attacker, target: target, outputMinimal: true });
    if (target.isDefeated && target.isDefeated()) return;
    var resist = target.getHPResistances().burning.resistanceValue / 10;
    if (attacker.willpower() / 2 + rand(20) + 1 >= target.reflexes() / 2 + 10 + resist) {
      window.StaticCombatAttacks.applyBurning(target, 3, Math.max(3, Math.ceil(dmg / 3)));
      combatAppend(" <b>" + cap(tName) + (target.isPlural ? " are" : " is") + " set ablaze!</b>");
    }
  }

  function thunderclapImpl(allies, hostiles, attacker, target) {
    var isPC = attacker.getClassName() === "PlayerCharacter";
    var tName = nameOf(target);
    combatOutput(isPC
      ? "You beat your great wings once, hard, and a bolt of lightning cracks down onto " + tName + " with a deafening boom!"
      : cap(nameOf(attacker)) + " calls down a crack of thunder!", null, attacker);
    var dmg = variance(8 + 2 * attacker.level + attacker.bimboIntelligence() / 1.5);
    applyDamage({ baseDamage: damageCollection({ electric: dmg }), attacker: attacker, target: target, outputMinimal: true });
    if (target.isDefeated && target.isDefeated()) return;
    if (target.isParalyzed && target.isParalyzed()) {
      combatAppend("\n" + cap(tName) + (target.isPlural ? " are" : " is") + " already paralyzed!");
      return;
    }
    if (attacker.bimboIntelligence() / 2 + rand(20) + 1 >= target.physique() / 2 + 10) {
      var CA = window.TnCombatAttacks;
      if (CA && typeof CA.applyParalyze === "function") CA.applyParalyze(target, 1 + rand(2));
      else window.StaticCombatAttacks.applyStun(target, 1 + rand(2));
      combatAppend("\n" + cap(tName) + " seize" + (target.isPlural ? "" : "s") + " up as the current locks every muscle. <b>Paralyzed!</b>");
    } else {
      combatAppend("\n" + cap(tName) + " shake" + (target.isPlural ? "" : "s") + " off the shock!");
    }
  }

  function registerAbilities() {
    var CA = window.TnCombatAttacks;
    var SCA = window.TnSingleCombatAttack;
    if (!CA || !SCA || !Array.isArray(CA.a)) return false;
    if (CA._tnPT) return true;

    var flare = new SCA();
    flare.ButtonName = "P. Flare";
    flare.TooltipTitle = "Phoenix Flare";
    flare.TooltipBody = "Unleash a wave of phoenix fire that deals willpower-based burning damage and may set the target ablaze. Requires the Pyre Veins perk.";
    flare.EnergyCost = 20;
    flare.RequiresPerk = "Pyre Veins";
    flare.IsRangedBased = true;
    flare.SetAttackTypeFlags(SCA.ATF_RANGED, SCA.ATF_SPECIAL);
    flare.Implementor = phoenixFlareImpl;
    flare.ExtendedDisplayabilityCheck = enabled;

    var clap = new SCA();
    clap.ButtonName = "Thunderclap";
    clap.TooltipTitle = "Thunderclap";
    clap.TooltipBody = "Call down a bolt of lightning that deals intelligence-based electric damage, with a chance to paralyze. Enemies with higher physique are more likely to resist. Requires the Stormborn perk.";
    clap.EnergyCost = 25;
    clap.RequiresPerk = "Stormborn";
    clap.IsRangedBased = true;
    clap.SetAttackTypeFlags(SCA.ATF_RANGED, SCA.ATF_SPECIAL);
    clap.Implementor = thunderclapImpl;
    clap.ExtendedDisplayabilityCheck = enabled;

    CA.PhoenixFlare = flare;
    CA.Thunderclap = clap;
    CA.a.push(flare, clap);
    CA._tnPT = true;
    return true;
  }

  // -------------------------------------------------------------------------
  // Init (waits for the game to finish loading)
  // -------------------------------------------------------------------------
  var coreDone = false;
  var abilitiesDone = false;
  var menuDone = false;
  var raceDone = false;
  var tries = 0;

  var lastError = {};
  function once(step, e) {
    // Report each distinct failure once, so a retry loop doesn't flood the log.
    var msg = String(e && e.message || e);
    if (lastError[step] === msg) return;
    lastError[step] = msg;
    warn(step + " failed:", e);
  }

  // Each step is tried separately, so one failing never blocks the others.
  function tick() {
    tries++;
    // No TN menu running 3 seconds in (every script has loaded by then): nothing to register with.
    if (!menuDone && window.tnModMenuActive === false && tries > 12) menuDone = true;
    if (!menuDone) {
      try {
        if (registerWithModMenu()) { menuDone = true; log("registered with the mod menu"); }
      } catch (e) { once("mod menu", e); }
    }
    if (!coreDone) {
      try {
        var Reg = window.Serialization;
        if (Reg && Reg.RegisteredClasses && Reg.RegisteredClasses.AmberSeed &&
            Reg.RegisteredClasses.PlayerCharacter && window.GLOBAL && typeof window.showShop === "function") {
          var items = registerItems(Reg);
          hookCreature(Reg);
          hookShop(items);
          coreDone = true;
          log("items, perks and shop hook ready");
        }
      } catch (e) { once("items/perks", e); }
    }
    if (!raceDone) {
      try {
        var R = window.Serialization;
        if (R && R.RegisteredClasses && R.RegisteredClasses.PlayerCharacter && window.GLOBAL &&
            hookRaceNames(R)) { raceDone = true; log("species names ready (phoenix, thunderbird)"); }
      } catch (e) { once("species names", e); }
    }
    if (!abilitiesDone) {
      try {
        if (registerAbilities()) { abilitiesDone = true; log("combat abilities ready"); }
      } catch (e) { once("combat abilities", e); }
    }
    if (coreDone && abilitiesDone && menuDone && raceDone) return;
    // Retry for up to 3 minutes (slow devices with many mods can take a while to load).
    if (tries < 720) { setTimeout(tick, 250); return; }
    if (!menuDone) log("mod menu not running (desktop, or AndroidModMenu not enabled); using default settings.");
    if (!coreDone) warn("gave up waiting for the game to load; seeds and perks inactive.");
    if (!abilitiesDone) warn("window.TnCombatAttacks not found. Apply patch_main_combat_exposure.py for Phoenix Flare / Thunderclap. Perks still work.");
  }

  window.TnPhoenixThunderbird = {
    id: MOD_ID, config: CONFIG, species: SPECIES, applySpeciesTF: applySpeciesTF, isEnabled: enabled,
    status: function () { return { menu: menuDone, itemsAndPerks: coreDone, abilities: abilitiesDone, speciesNames: raceDone, errors: lastError }; },
  };
  log("loaded");
  try { loadSettings(); } catch (e) { once("settings", e); }
  tick();
})();
