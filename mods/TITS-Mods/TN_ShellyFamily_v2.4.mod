Name: Shelly's Family
Author: Techy-Nest
# TN_ShellyFamily.mod - written 2026-10-26 for TiTS 0.9.167 (KittyPatcher, Android)
# Cured Shelly (pink, red or blue cure from Dr. Lessau) can have Steele's children.
# Ask her from the new "Kids?" button in her Talk menu (10 trust, 7+ affection). She only
# says yes if Steele lets her visit the kids in the Tavros nursery whenever the ship docks
# there. Then she stops taking Sterilex, and Make Love / She Rides can get her pregnant.
# Dr. Lash's cure leaves her sterile, so the Lash route can't have kids.
#
# She tells you at about two weeks, the next time you open her cabin. Default length
# 120 days (mod menu). Birth at the Tavros nursery, two days recovering there.
# Tavros: once she has kids and the ship is docked at Tavros, her crew button is greyed
# out. Every 15 game minutes she's in the Milking Station (first year after a birth), the
# Nursery Cafeteria or the Educational Center. 22:00-06:00 she sleeps in your nursery
# Bedroom, and you can sleep with her.
#
# With Azra's Family: if both have kids and are in the same room, you get shared text,
# and at night they share your bed ("Sleep With Them").
#
# Needs: Shelly-Custom-Talk-Menu.js, TN_ShellyCureQuest.mod (2026-10-26 version with the
# family hooks). List this mod after TN_ShellyCureQuest.mod and TN_AzraFamily.mod.
# No game bundles are patched: everything hooks the Shelly mods' window functions and the
# Tavros nursery rooms at runtime.
# Toggle and settings: Options -> Android Mods -> "Shelly's Family".

Add Javascript:
// ===========================================================================
//  TN_ShellyFamily: runtime part (merged into kitty-inline.js by the patcher)
//  Cured Shelly can have Steele's children. They live in the Tavros nursery,
//  and she visits them whenever the ship is docked at Tavros.
// ===========================================================================
(function () {
  "use strict";
  if (window.tnShellyFamily) return;

  var MOD_ID = "tn.shellyFamily";
  var TAG = "[ShellyFamily]";
  var DAY = 1440;

  // Webpack modules in main.js (same ids in 0.9.166 and 0.9.167):
  // 36956 = ChildManager (kd), 66376 = Child (U), 31317 = StatTracking (s).
  var gameModules = {};
  function gameModule(id) {
    if (gameModules[id]) return gameModules[id];
    var chunks = window.webpackChunktits_html || self.webpackChunktits_html;
    if (!chunks || typeof chunks.push !== "function") return null;
    var req = null;
    chunks.push([[9914600 + (id % 1000)], {}, function (r) { req = r; }]);
    if (typeof req !== "function") return null;
    try { gameModules[id] = req(id); } catch (err) { return null; }
    return gameModules[id];
  }

  function log(msg) { try { console.log(TAG + " " + msg); } catch (err) {} }
  function enabled() {
    if ((window.tnModMenuActive===true&&typeof window.isTnModEnabled==="function") && !window.isTnModEnabled(MOD_ID)) return false;
    if (typeof window.tnShellyModEnabled === "function" && !window.tnShellyModEnabled()) return false;
    return !!window.flags;
  }
  function f(name) { return window.flags ? flags["TN_SHF_" + name] : undefined; }
  function setF(name, value) { if (window.flags) flags["TN_SHF_" + name] = value; }
  function now() { try { return GetGameTimestamp(); } catch (err) { return 0; } }
  function hour() { try { return window.game.gamestate.hours; } catch (err) { return typeof hours === "number" ? hours : 12; } }
  function rnd(n) { return typeof rand === "function" ? rand(n) : Math.floor(Math.random() * n); }
  function pick(list) { return list[rnd(list.length)]; }
  function say(text) { return "<i>“" + text + "”</i>"; }
  function p() { return Array.prototype.slice.call(arguments).join("\n\n"); }
  function shelly() { return window.chars ? chars.SHELLY : null; }
  function onCrew() { return !!window.flags && flags.TN_SHELLY_CREW === 1; }
  function shipAtTavros() { try { return getShipLocation() === "TAVROS HANGAR"; } catch (err) { return false; } }
  function rel(name) { return Math.max(0, Math.min(10, Number(window.flags && flags["TN_SHELLY_" + name]) || 0)); }
  function hasCock() { try { return pc.hasCock() || !!(pc.hasTailCock && pc.hasTailCock()); } catch (err) { return false; } }
  function pcSterile() {
    try { if (pc.hasPerk("Perma-Sterile")) return true; } catch (err) {}
    return false;
  }

  // Cure from TN_ShellyCureQuest.mod: "pink", "red", "blue" or "lash".
  function cure() { return (window.flags && flags.TN_SCQ_CURED) || ""; }
  function fertileCure() { var c = cure(); return c === "pink" || c === "red" || c === "blue"; }
  function bunny() { return cure() === "pink" || cure() === "red"; }
  function byCure(map) { var k = cure(); return map[k] !== undefined ? map[k] : (map.other || ""); }

  // ---- Settings (per device)
  function store(key, fallback) {
    try { var v = localStorage.getItem(key); return v === null ? fallback : v; } catch (err) { return fallback; }
  }
  function save(key, value) { try { localStorage.setItem(key, String(value)); } catch (err) {} }
  var TERMS = [30, 60, 120, 180, 270];
  function termDays() { var d = parseInt(store("tn.shellyFamily.termDays", "120"), 10); return TERMS.indexOf(d) >= 0 ? d : 120; }
  // Bust while pregnant, if there is no custom pregnant art: "egg" = her old egg-belly bust, "cured" = her cured bust.
  function fallbackBust() { return store("tn.shellyFamily.fallbackBust", "egg") === "cured" ? "cured" : "egg"; }

  // ---- Pregnancy state (saved in flags)
  //  TN_SHF_BREED_OK        1 once Shelly agreed to have children
  //  TN_SHF_PAUSED          1 while she's back on Sterilex ("Wait A While")
  //  TN_SHF_PREG_START      conception timestamp (minutes), undefined when not pregnant
  //  TN_SHF_PREG_TERM       gestation length in minutes, fixed at conception
  //  TN_SHF_PREG_COUNT      babies on the way
  //  TN_SHF_PREG_ANNOUNCED  1 after she told Steele
  //  TN_SHF_KIDS            children born so far
  //  TN_SHF_LAST_BIRTH      timestamp of the latest birth
  //  TN_SHF_LAST_COUNT      babies in the latest birth
  //  TN_SHF_BIRTH_SCENE     1 = show the "they're here" scene next time you open her cabin
  function pregnant() { return f("PREG_START") !== undefined; }
  function term() { return Number(f("PREG_TERM")) || termDays() * DAY; }
  function progress() {
    if (!pregnant()) return 0;
    return Math.max(0, Math.min(1, (now() - Number(f("PREG_START"))) / term()));
  }
  function pregDay() { return pregnant() ? Math.floor((now() - Number(f("PREG_START"))) / DAY) + 1 : 0; }
  function knows() { return pregnant() && now() - Number(f("PREG_START")) >= 14 * DAY; }
  function belly() { return Math.round(progress() * 40); }
  function showing() { return enabled() && pregnant() && belly() >= 10; }
  function kids() { return Number(f("KIDS")) || 0; }
  function babyWord(n) { return n === 1 ? "baby" : (n === 2 ? "twins" : "babies"); }
  function lastCount() { return Number(f("LAST_COUNT")) || 1; }
  function breedOk() { return f("BREED_OK") === 1; }
  function offPill() { return enabled() && fertileCure() && breedOk() && f("PAUSED") !== 1; }

  function conceive(count) {
    setF("PREG_START", now());
    setF("PREG_TERM", termDays() * DAY);
    setF("PREG_COUNT", count || (rnd(100) < 10 ? 2 : 1));
    setF("PREG_ANNOUNCED", undefined);
    log("Shelly conceived (" + f("PREG_COUNT") + ").");
  }

  // Called from the cured Make Love and She Rides scenes (TN_ShellyCureQuest.mod).
  function afterCum(g) {
    if (!offPill() || pregnant()) return "";
    try {
      if (g && !g.phallus) return "";
      if (!hasCock() || pcSterile()) return "";
      if (f("LAST_BIRTH") !== undefined && now() - Number(f("LAST_BIRTH")) < 14 * DAY) return "";
      var q = 0;
      try { q = Number(pc.cumQuality()) || 0; } catch (err) { try { q = Number(pc.virility()) || 0; } catch (err2) {} }
      if (q <= 0) return "";
      var chance = Math.min(0.85, 0.2 + 0.15 * q);
      if (Math.random() < chance) conceive();
    } catch (err) { log("conception check failed: " + err); }
    return "";
  }

  function addNurseryKids(count, born) {
    var added = false;
    try {
      var cm = gameModule(36956), cl = gameModule(66376);
      if (cm && cm.kd && cl && cl.U && typeof cl.U.NewChild === "function") {
        var race = (window.GLOBAL && GLOBAL.TYPE_HUMAN !== undefined) ? GLOBAL.TYPE_HUMAN : 0;
        // Human kids: half boys, half girls.
        var c = cl.U.NewChild(race, 1, count, 50, 50, 0, 0);
        c.BornTimestamp = born;
        var s = shelly();
        try {
          if ("skinTone" in c) c.skinTone = rnd(3) === 0 ? (pc.skinTone || "chocolate") : "chocolate";
          if ("hairColor" in c) c.hairColor = rnd(2) === 0 ? "dark brown" : (pc.hairColor || "dark brown");
          if ("eyeColor" in c) c.eyeColor = rnd(2) === 0 ? ((s && s.eyeColor) || "brown") : (pc.eyeColor || "brown");
        } catch (err) {}
        cm.kd.addChild(c);
        added = true;
      }
    } catch (err) { log("could not add nursery kids: " + err); }
    try {
      var st = gameModule(31317);
      if (st && st.s && typeof st.s.track === "function") {
        st.s.track("pregnancy/shelly sired", count);
        st.s.track("pregnancy/total sired", count);
        st.s.track("pregnancy/total day care", count);
      }
    } catch (err) {}
    return added;
  }

  function giveBirth() {
    if (!pregnant()) return;
    var count = Number(f("PREG_COUNT")) || 1;
    var born = Math.min(now(), Number(f("PREG_START")) + term());
    var added = addNurseryKids(count, born);
    setF("KIDS", kids() + count);
    setF("LAST_BIRTH", born);
    setF("LAST_COUNT", count);
    setF("PREG_START", undefined);
    setF("PREG_TERM", undefined);
    setF("PREG_COUNT", undefined);
    setF("PREG_ANNOUNCED", undefined);
    setF("BIRTH_SCENE", 1);
    try {
      if (typeof AddLogEvent === "function") AddLogEvent("Shelly has given birth to your " + babyWord(count) + " in the Tavros nursery!", "good");
    } catch (err) {}
    log("Shelly gave birth to " + count + (added ? "" : " (nursery add failed)") + ".");
  }

  function tick() {
    try {
      if (!enabled() || !pregnant()) return;
      if (typeof inCombat === "function" && inCombat()) return;
      if (now() >= Number(f("PREG_START")) + term()) giveBirth();
    } catch (err) {}
  }

  // ---- Where Shelly is
  function recovering() { return f("LAST_BIRTH") !== undefined && now() < Number(f("LAST_BIRTH")) + 2 * DAY; }
  function visiting() { return enabled() && onCrew() && kids() > 0 && shipAtTavros(); }
  function away() { return enabled() && onCrew() && kids() > 0 && (shipAtTavros() || recovering()); }
  function night() { var h = hour(); return h >= 22 || h < 6; }
  function lactating() { return f("LAST_BIRTH") !== undefined && now() - Number(f("LAST_BIRTH")) < 365 * DAY; }
  function hash(seed) {
    var x = ((Math.floor(now() / 15) + seed) * 2246822519) >>> 0;
    x = (x ^ (x >>> 15)) >>> 0;
    x = Math.imul(x, 3266489917) >>> 0;
    return (x ^ (x >>> 13)) >>> 0;
  }

  // Azra (TN_AzraFamily.mod), when she's in the nursery too.
  function azraVisiting() {
    try { return !!window.tnAzraPreg && window.tnAzraPreg.kids() > 0 && window.tnAzraPreg.away() && shipAtTavros(); } catch (err) { return false; }
  }
  function azraSpot() { try { return azraVisiting() ? window.tnAzraPreg.spot() : null; } catch (err) { return null; } }
  function azraKids() { try { return window.tnAzraPreg ? window.tnAzraPreg.kids() : 0; } catch (err) { return 0; } }

  // Rerolled every 15 game minutes; stable inside each 15-minute block.
  // When Azra is visiting too, Shelly tags along with her about 40% of the time.
  function spot() {
    if (night()) return "NURSERYG4";
    var spots = ["NURSERYG12", "NURSERYK14"];
    if (lactating()) spots.unshift("NURSERYE4");
    var a = azraSpot();
    if (a && spots.indexOf(a) >= 0 && hash(7) % 100 < 40) return a;
    return spots[hash(1) % spots.length];
  }
  function here(room) { return visiting() && spot() === room; }
  function withAzra(room) { return here(room) && azraSpot() === room; }

  function awayBlurb() {
    if (!shipAtTavros()) return "\n\nShelly isn’t aboard. She’s recovering in the Tavros nursery with your newborn " + babyWord(lastCount()) + " and will be back on the ship soon.";
    return "\n\nShelly isn’t aboard. While the ship is docked at Tavros, she’s in the nursery with your children" + (night() ? ", probably asleep in your old bedroom." : ".");
  }
  function awayTip() {
    if (!shipAtTavros()) return "Shelly is recovering in the Tavros nursery with your newborn " + babyWord(lastCount()) + ".";
    return "Shelly is visiting your children in the Tavros nursery while the ship is docked. Look for her there.";
  }
  function bellyLine() {
    if (!enabled() || !pregnant() || !knows()) return "";
    if (belly() >= 30) return " Her heavily pregnant belly sticks out proudly ahead of her, and she keeps a hand on it as she talks.";
    if (belly() >= 10) return " Her belly has a soft, round curve to it now, and she can’t seem to stop touching it.";
    return "";
  }

  // ---- Pregnant busts
  // Custom art can come from TN_ShellyFamilyBusts.js (window.tnShellyFamilyBustData), keys
  // shelly_preg_pink, shelly_preg_lash (red uses the Lash art), shelly_preg_blue, each with _nude.
  // Without it she uses her old egg-belly bust (or her cured bust, mod menu setting).
  var bustUrls = {};
  function bustUrl(key) {
    if (bustUrls[key]) return bustUrls[key];
    var data = window.tnShellyFamilyBustData && window.tnShellyFamilyBustData[key];
    if (!data) return null;
    try {
      var bin = atob(data.slice(data.indexOf(",") + 1)), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      bustUrls[key] = URL.createObjectURL(new Blob([bytes], { type: data.indexOf("image/png") >= 0 ? "image/png" : "image/webp" }));
    } catch (err) {
      bustUrls[key] = data;
    }
    return bustUrls[key];
  }
  function pregKey(nude) {
    var k = cure();
    if (k === "red") k = "lash";
    return "shelly_preg_" + k + (nude ? "_nude" : "");
  }
  function setOverride(name, url) {
    if (!flags.artistOverrides) flags.artistOverrides = {};
    if (!flags.pathOverrides) flags.pathOverrides = {};
    var cur = flags.pathOverrides[name];
    if (cur && !cur.tnShf) return; // the player's own custom art wins
    if (cur && cur.x1 === url && flags.artistOverrides[name] === "custom") return;
    flags.artistOverrides[name] = "custom";
    flags.pathOverrides[name] = { tnShf: true, x1: url, x2: url, x4: url, originalWidth: 704, originalHeight: 1024, artist: "Techy-Nest", title: "Shelly (pregnant)", description: "" };
  }
  function clearOverride(name) {
    if (flags.pathOverrides && flags.pathOverrides[name] && flags.pathOverrides[name].tnShf) {
      delete flags.pathOverrides[name];
      if (flags.artistOverrides && flags.artistOverrides[name] === "custom") delete flags.artistOverrides[name];
    }
  }
  var PREG_KEYS = ["shelly_preg_pink", "shelly_preg_pink_nude", "shelly_preg_lash", "shelly_preg_lash_nude", "shelly_preg_blue", "shelly_preg_blue_nude"];
  function syncBusts() {
    if (!window.flags) return;
    var on = enabled();
    PREG_KEYS.forEach(function (k) { var url = on ? bustUrl(k) : null; if (url) setOverride(k, url); else clearOverride(k); });
  }
  function hasPregArt() { return !!bustUrl(pregKey(false)); }
  // Bust name for cured Shelly while she shows, or null to keep her cured bust.
  function bustName(nude) {
    if (!showing() || !fertileCure()) return null;
    var key = pregKey(nude);
    if (bustUrl(key)) { try { syncBusts(); } catch (err) {} return key.toUpperCase(); }
    if (fallbackBust() === "egg") return "SHELLY_HUGE" + (nude ? "_NUDE" : "");
    return null;
  }
  // Tells TN_ShellyCureQuest.mod to leave the vanilla egg-belly bust visible.
  function eggBelly() { return showing() && fertileCure() && !hasPregArt() && fallbackBust() === "egg"; }
  function showShelly(nude) {
    var name = bustName(nude);
    if (!name) return false;
    try { if (typeof clearBust === "function") clearBust(); showBust(name); showName("Shelly"); } catch (err) { return false; }
    return true;
  }
  function scene(nude) {
    clearOutput();
    if (!showShelly(nude)) {
      try {
        if (typeof clearBust === "function") clearBust();
        var n = window.tnShellyBustName ? window.tnShellyBustName(!!nude) : "SHELLY";
        showBust(n); showName("Shelly");
      } catch (err) {}
    }
    author("Techy-Nest");
  }

  // ---- Lines used by the cure mod's sex scenes
  function pillLine() {
    if (!enabled() || !fertileCure()) return null;
    if (pregnant() && knows()) return say("Can’t get me any more pregnant than this,") + " she giggles, breathless, rubbing her belly.";
    if (offPill()) return say("No pill this time,") + " she reminds you breathlessly, one hand drifting down to her stomach. " + say("So... who knows?");
    return null;
  }
  function sexText(text) {
    if (!showing()) return text;
    return String(text)
      .split("With no swollen, egg-heavy belly between you anymore, you can lie chest to chest with her, close enough").join("Her belly is round with your baby now, a softer, warmer swell than the eggs ever were, and you settle over her carefully, close enough")
      .split("Without the old weight of eggs, she’s light and bouncy and clearly delighted by it").join("Even with your baby rounding out her belly, she’s bouncy and clearly delighted by it")
      .split("spurts across her flat belly").join("spurts across her rounded belly");
  }

  // ---- Talk menu: Kids? / Family
  function talkButton() {
    if (!enabled() || !cure()) return;
    var slot = 9;
    if (!fertileCure()) { addDisabledButton(slot, "Kids?", "Kids?", "Dr. Lash’s cure left Shelly unable to have children."); return; }
    if (breedOk()) { addButton(slot, "Family", familyMenu, "Family", pregnant() && knows() ? "Talk to Shelly about her pregnancy." : "Talk about your family with Shelly."); return; }
    if (rel("TRUST") < 10 || rel("AFFECTION") < 7) { addDisabledButton(slot, "Kids?", "Kids?", "Shelly needs to trust you completely before you bring this up. (Trust 10, affection 7+)"); return; }
    if (pcSterile()) { addDisabledButton(slot, "Kids?", "Kids?", "You’re permanently sterile."); return; }
    addButton(slot, "Kids?", kidsTalk, "Kids?", "Ask Shelly if she’d like to have children with you.");
  }
  function back() { if (typeof window.tnShellyTalkMenu === "function") window.tnShellyTalkMenu(); else mainGameMenu(); }

  function kidsTalk() {
    scene(false);
    var parts = [];
    parts.push("You sit down next to Shelly on her bunk and ask, carefully, whether she’s ever thought about having kids. With you.");
    parts.push(byCure({
      pink: "Her ears shoot straight up. " + say("Kids? Like, real ones? Not eggs?") + " She claps both hands over her mouth, then lowers them, giggling. " + say("Sorry! Sorry. It’s just, for years the only thing coming out of me was candy-coated Ovilium, and now you’re asking about... babies."),
      red: "Her ears perk up, then fold back slowly while she thinks. " + say("Kids,") + " she repeats. " + say("Real ones. Not eggs.") + " A slow grin spreads across her face. " + say("You know, a year ago I’d have laughed. Now I kind of want to cry. The good kind."),
      blue: "Shelly goes very still. Then she tucks her hair behind her ear, a habit she picked up once her bunny ears were gone, and looks at you with wide eyes. " + say("I said I’d keep taking Sterilex until we both wanted kids, didn’t I?") + " She swallows. " + say("Are you saying you want them?")
    }));
    parts.push("You tell her you do. Shelly turns her empty Sterilex blister pack over in her fingers, the way she always does when she’s thinking.");
    parts.push(say("I want them too. I really do. But I’m not raising a baby on a starship, [pc.name]. Not with pirates and slavers and whatever else you keep running into out there.") + " She takes a breath. " + say("I grew up on Tavros. I know the station inside and out. And your nursery there is the safest place in the whole galaxy, probably."));
    if (azraKids() > 0) parts.push(say("Azra does it that way already, right? Every time we dock, she runs off the ship like her tail’s on fire to go see her little ones. I think that’s so sweet.") + " Shelly smiles. " + say("I want that too."));
    parts.push(say("So here’s the deal. If we have kids, they live in the nursery. And every time the ship docks at Tavros, I go see them. I’ll feed them, play with them, sit in on their lessons, and sleep there at night so I can hear them if they wake up. I don’t want them growing up thinking their mom is just a picture on a Codex.") + " She looks up at you" + (bunny() ? ", ears half-lowered" : "") + ". " + say("Would that be okay with you?"));
    output(p.apply(null, parts));
    try { processTime(5); } catch (err) {}
    clearMenu();
    addButton(0, "That’s Fine", kidsAgree, "That’s Fine", "Tell her she can visit the kids on Tavros whenever you dock there.");
    addButton(1, "Not Yet", kidsNotYet, "Not Yet", "Tell her you’d like to wait a while longer.");
  }
  function kidsAgree() {
    scene(false);
    setF("BREED_OK", 1);
    setF("PAUSED", undefined);
    output(p(
      "You tell her that’s exactly how you’d want it.",
      "Shelly launches herself at you so hard you nearly fall off the bunk, " + (bunny() ? "ears flopping everywhere, " : "") + "arms wrapped tight around your neck. " + say("Okay. Okay! Then I’m done with these.") + " She lobs the blister pack across the room. This time it lands in the bin. " + say("Look at that. It’s a sign."),
      say("Fair warning, though,") + " she adds, " + byCure({ pink: "nose wrinkling. " + say("I have no idea how fast this works without Ovilium in the way. Could be the first try. Could take ages."), red: "grinning. " + say("Without the pill, I’m all yours. Every time. So you’d better be ready."), blue: "softer now. " + say("Real babies take real time. Nine months on a planet, though who knows what the nursery doctors can do. I don’t mind. I’ll wait for this.") }),
      "<b>Shelly has stopped taking Sterilex. Make Love and She Rides can get her pregnant now.</b>"
    ));
    try { processTime(5); } catch (err) {}
    if (typeof window.tnShellyTalkMenu === "function") { clearMenu(); addButton(0, "Next", back); } else { clearMenu(); addButton(0, "Next", mainGameMenu); }
  }
  function kidsNotYet() {
    scene(false);
    output("You tell her you’d like to wait a little longer. Shelly nods, smiling, and pops a Sterilex from the box on her shelf. " + say("That’s okay. Just knowing you asked is nice. Ask me again any time."));
    clearMenu();
    addButton(0, "Next", back);
  }

  function familyMenu() {
    scene(false);
    var lines = [];
    if (pregnant() && knows()) {
      var left = Math.max(0, Math.ceil((Number(f("PREG_START")) + term() - now()) / DAY));
      lines.push("Shelly laces her fingers over her " + (belly() >= 10 ? "rounded belly" : "stomach") + " when you ask how she’s feeling. " + say(belly() >= 30 ? "Huge. Achy. Starving. And so happy I could burst, [pc.name]." : belly() >= 10 ? "Showing! Finally! I keep catching myself in the mirror." : "A little queasy in the mornings. Nothing like the egg cramps, though."));
      lines.push("<b>Shelly is on day " + pregDay() + " of her pregnancy, with about " + left + " day" + (left === 1 ? "" : "s") + " to go.</b>");
    } else if (pregnant()) {
      lines.push("Shelly shrugs, grinning. " + say("Nothing yet. Or maybe something, and I just don’t know. We’ll find out!"));
    } else {
      lines.push(say("Our family?") + " Shelly beams. " + (kids() > 0 ? say("I miss our babies the second we undock from Tavros. But then we come back, and they’re a little bigger, and it’s the best feeling in the world.") : say("Not yet. But I’m ready when you are.")));
    }
    if (kids() > 0) lines.push("You have " + kids() + " child" + (kids() === 1 ? "" : "ren") + " with Shelly in the Tavros nursery.");
    if (kids() > 0 && azraKids() > 0) lines.push(say("Ours and Azra’s are getting along great, by the way. The nursery staff say they’re practically a pack."));
    lines.push(offPill() ? "Shelly isn’t taking Sterilex." : "Shelly is back on Sterilex for now.");
    output(p.apply(null, lines));
    clearMenu();
    if (!pregnant()) {
      if (offPill()) addButton(0, "Wait A While", function () { setPause(true); }, "Wait A While", "Ask Shelly to go back on Sterilex for a while.");
      else addButton(0, "Try Again", function () { setPause(false); }, "Try Again", "Tell Shelly you’re ready to try for children again.");
    }
    addButton(14, "Back", back);
  }
  function setPause(pause) {
    scene(false);
    setF("PAUSED", pause ? 1 : undefined);
    output(pause
      ? "Shelly nods and pops a Sterilex from the box on her shelf. " + say("Done. Just tell me when you’re ready again.")
      : "Shelly grins and drops her Sterilex box into the bin. " + say("Then I’m off the pills. You’ve been warned!"));
    clearMenu();
    addButton(0, "Next", back);
  }

  // ---- Cabin hooks (pregnancy news and the birth)
  function announceScene(orig) {
    scene(false);
    setF("PREG_ANNOUNCED", 1);
    var twins = Number(f("PREG_COUNT")) === 2;
    output(p(
      "Shelly is sitting on the edge of her bunk when you come in, holding a little white test strip in both hands like it might bite her. She looks up at you, and her face does about five different things at once.",
      say("So, funny story,") + " she says, voice wobbling. " + say("I kept feeling queasy, and I thought, ha, that’s silly, it can’t be eggs anymore. And then I thought... wait. It can’t be eggs anymore.") + " She holds up the strip. " + say("[pc.name]. I’m pregnant. Like, really, actually pregnant."),
      twins
        ? "She pulls up a scan on her Codex from the medbay, and her laugh comes out half a sob. " + say("And there are two of them. Two! I spent years popping out eggs by the dozen, and now two feels like a miracle.")
        : "She pulls up a scan on her Codex from the medbay: a tiny, flickering shape with a heartbeat. " + say("That’s ours. That little bean is ours."),
      "You don’t get a word out before she’s in your arms" + (bunny() ? ", ears tickling your chin" : "") + ".",
      say("I’m having them at the nursery on Tavros, like we said. And after that, every time we dock...") + " She sniffs, smiling. " + say("You know where I’ll be.")
    ));
    try { processTime(10); } catch (err) {}
    clearMenu();
    addButton(0, "Next", function () { orig.call(window); });
  }
  function birthScene(orig) {
    scene(false);
    setF("BIRTH_SCENE", undefined);
    var n = lastCount();
    output(p(
      "Shelly looks exhausted, but she’s practically glowing. She pulls you down onto the bunk beside her and starts flicking through picture after picture on her Codex, all taken in the Tavros nursery.",
      say(n === 1 ? "Look! Look at them!" : "Look! Both of them!") + " Shelly holds the screen right up to your face. " + (n === 1 ? "A tiny, chocolate-skinned baby" : "Two tiny, chocolate-skinned babies") + " with a fuzz of dark hair " + (n === 1 ? "is" : "are") + " bundled up in a nursery blanket. " + say("Ten fingers, ten toes, and lungs like you wouldn’t believe. The nurse droid said " + (n === 1 ? "it’s" : "they’re") + " the loudest " + (n === 1 ? "newborn" : "newborns") + " she’s had all month."),
      say("I cried when I left. A lot. But I meant it, [pc.name]. Every time we dock at Tavros, I’m going straight to the nursery, and I’ll sleep in your old room at night.") + " She nudges you. " + say("You can come too, you know."),
      "<b>Your " + babyWord(n) + " with Shelly " + (n === 1 ? "is" : "are") + " now in the Tavros nursery.</b>"
    ));
    try { processTime(15); } catch (err) {}
    clearMenu();
    addButton(0, "Next", function () { orig.call(window); });
  }
  function wrapCabin(orig) {
    var w = function () {
      if (enabled() && fertileCure() && onCrew()) {
        if (f("BIRTH_SCENE") === 1) return birthScene(orig);
        if (knows() && f("PREG_ANNOUNCED") !== 1) return announceScene(orig);
      }
      var r = orig.apply(this, arguments);
      try {
        if (enabled() && fertileCure()) { showShelly(false); var b = bellyLine(); if (b) output("\n\n" + b.trim()); }
      } catch (err) { log("cabin extra failed: " + err); }
      return r;
    };
    return w;
  }
  function wrapTalk(orig) {
    return function () {
      var r = orig.apply(this, arguments);
      try { talkButton(); } catch (err) { log("talk button failed: " + err); }
      return r;
    };
  }
  function wrapBlurb(orig) {
    return function (slot) {
      if (enabled() && this.isCrew && this.isCrew() && away()) {
        addDisabledButton(slot, "Shelly", "Shelly", awayTip());
        return awayBlurb();
      }
      var r = orig.apply(this, arguments);
      try { if (typeof r === "string" && r && enabled() && fertileCure()) r += bellyLine(); } catch (err) {}
      return r;
    };
  }

  // Wraps go on top of the cure mod's own wraps. Each wrapper also carries the cure
  // mod's __tnScq mark, so the cure mod doesn't wrap again on top of ours every second.
  function patchShellyMenus() {
    if (typeof window.tnShellyTalkMenu === "function" && window.tnShellyTalkMenu.__tnScq && !window.tnShellyTalkMenu.__tnShf) {
      var t = wrapTalk(window.tnShellyTalkMenu); t.__tnScq = true; t.__tnShf = true; window.tnShellyTalkMenu = t;
    }
    if (typeof window.tnShellyCabin === "function" && window.tnShellyCabin.__tnScq && !window.tnShellyCabin.__tnShf) {
      var c = wrapCabin(window.tnShellyCabin); c.__tnScq = true; c.__tnShf = true; window.tnShellyCabin = c;
    }
    var s = shelly();
    if (s && typeof s.crewBlurb === "function" && s.crewBlurb.__tnScq && !s.crewBlurb.__tnShf) {
      var nb = wrapBlurb(s.crewBlurb); nb.__tnScq = true; nb.__tnShf = true;
      try { Object.defineProperty(s, "crewBlurb", { value: nb, writable: true, configurable: true, enumerable: false }); } catch (err) { s.crewBlurb = nb; }
    }
  }

  // ---- Shelly in the Tavros nursery
  var ROOMS = ["NURSERYE4", "NURSERYG12", "NURSERYK14", "NURSERYG4"];
  function little(n) { return n === 1 ? "your child" : "your children"; }

  function soloBlurb(room) {
    var n = kids();
    switch (room) {
      case "NURSERYE4": return pick([
        "\n\nShelly is curled up in one of the milking chairs, a pump humming softly at her chest, " + (bunny() ? "ears drooping happily" : "humming along with it") + ". She waggles her fingers at you.",
        "\n\nShelly is here, bottling milk for " + little(n) + " and chatting the attendant droid’s audio receptors off. She brightens when she sees you."
      ]);
      case "NURSERYG12": return pick([
        "\n\nShelly is in the cafeteria, perched on a tiny chair with " + little(n) + ", making airplane noises with a spoonful of mush. It isn’t working.",
        "\n\nShelly is sitting at one of the low cafeteria tables, wiping " + (n === 1 ? "a messy little face" : "messy little faces") + " and laughing. She waves you over."
      ]);
      case "NURSERYK14": return pick([
        "\n\nShelly is in the education center, sitting cross-legged on the floor with " + little(n) + " while the teaching droid reads a story. She mouths along with the words.",
        "\n\nShelly is in the education center, helping " + little(n) + " stack hardlight blocks into something that might be a spaceship."
      ]);
      case "NURSERYG4": return "\n\nShelly is asleep in your bed, curled up small under the covers" + (bunny() ? " with one ear flopped over her eyes" : "") + ". A baby monitor glows on the nightstand beside her.";
    }
    return "";
  }
  // Both moms in the same room (TN_AzraFamily.mod skips its own line when this is shown).
  function jointBlurb(room) {
    switch (room) {
      case "NURSERYE4": return pick([
        "\n\nAzra and Shelly have claimed two milking chairs side by side, pumps humming in stereo. Azra’s nine-foot frame makes Shelly look tiny next to her, and they’re deep in conversation about feeding schedules. They both wave when they spot you.",
        "\n\nAzra and Shelly are in the milking station together, comparing bottle counts like it’s a competition. Judging by Azra’s smug fin-flick, she’s winning, and Shelly is pretending not to care."
      ]);
      case "NURSERYG12": return pick([
        "\n\nAzra and Shelly are sharing a low cafeteria table, surrounded by your children. Azra’s little suula and Shelly’s little ones are sitting side by side, and there is far more food on the table, the floor and both mothers than in anyone’s mouth.",
        "\n\nThe cafeteria is loud. Azra is spoon-feeding one of her golden-skinned little ones while Shelly referees a very serious argument between two of the kids over the last fruit cup. Azra catches your eye and mouths <i>help</i>."
      ]);
      case "NURSERYK14": return pick([
        "\n\nAzra and Shelly are sitting together at the back of the education center, Azra hunched on a stool far too small for her, Shelly cross-legged on the floor. All of your kids, suula and human alike, are piled together on the story mat at the front.",
        "\n\nAzra is showing the kids a hardlight model of a Mhen’gan vine, and Shelly is narrating it with sound effects. Your children, finned and unfinned, are hanging on every word."
      ]);
      case "NURSERYG4": return "\n\nYour bed has never been this full. Azra is curled along the far side with her wings folded over her like a blanket, and Shelly is tucked into the curve of the suula’s body" + (bunny() ? ", one ear flopped across Azra’s arm" : "") + ". Two baby monitors glow on the nightstand.";
    }
    return "";
  }
  // One line about the other mom, for the solo meet scenes.
  function jointLine(who, room) {
    if (who === "azra") {
      return pick([
        "Shelly scoots over to make room for you, grinning. " + say("Azra’s been telling me all about suula teething. Fins! They teethe on their fins!"),
        "Across from you, Shelly gives you a little wave. " + say("Don’t let her fool you, she cried at the last lesson too.") + " Azra huffs, but doesn’t deny it."
      ]);
    }
    return pick([
      "Azra leans down to ruffle your hair as you sit. " + say("Our children have decided they’re all siblings, stud. The staff have given up arguing."),
      "Azra rumbles a laugh from beside Shelly. " + say("You have very busy kids, [pc.name]. All of them.")
    ]);
  }

  function freeSlot() {
    var order = [0, 1, 2, 3, 4, 5, 9, 14];
    for (var i = 0; i < order.length; i++) {
      try { if (!hasButton(order[i])) return order[i]; } catch (err) { return 5; }
    }
    return 5;
  }

  function roomHook(room) {
    if (!here(room)) return;
    var both = withAzra(room);
    output(both ? jointBlurb(room) : soloBlurb(room));
    var slot = freeSlot();
    if (room === "NURSERYG4") addButton(slot, "Shelly", both ? bedBoth : sleepingShelly, "Shelly", both ? "Shelly and Azra are asleep in your bed." : "Shelly is asleep in your bed.");
    else addButton(slot, "Shelly", function () { meetShelly(room); }, "Shelly", "Spend some time with Shelly and your children.");
  }

  function meetShelly(room) {
    scene(false);
    var text, n = kids();
    if (room === "NURSERYE4") {
      text = p(
        "You pull up a chair next to Shelly. She grabs your hand and doesn’t let go.",
        say("Turns out I’m actually good at making milk when it’s not candy!") + " She giggles, tapping a neat row of labelled bottles. " + say("The staff freeze it for when we’re away. Our " + (n === 1 ? "little one never goes" : "little ones never go") + " hungry.")
      );
    } else if (room === "NURSERYG12") {
      text = p(
        "You squeeze in next to Shelly at the tiny table. She hands you a spoon, and the two of you tag-team " + (n === 1 ? "one very stubborn eater" : "a table of very stubborn eaters") + ".",
        say("They’re getting so big,") + " she sighs, leaning her head on your shoulder. " + say("I swear they grow an inch every time we leave.")
      );
    } else {
      text = p(
        "You sit down on the floor next to Shelly. She beams as " + (n === 1 ? "your child" : "one of your children") + " toddles over to show you a hardlight drawing.",
        say("That’s you,") + " Shelly whispers, pointing at a lopsided stick figure next to a lopsided spaceship. " + say("They know exactly who you are, [pc.name].")
      );
    }
    if (withAzra(room)) text = p(text, jointLine("shelly", room));
    output(text);
    try { processTime(15 + rnd(10)); } catch (err) {}
    clearMenu();
    addButton(0, "Talk", function () { shellyKidsTalk(room); }, "Talk", "Talk with Shelly about your children.");
    addButton(14, "Leave", mainGameMenu);
  }

  function shellyKidsTalk(room) {
    scene(false);
    var lines = [
      "You ask how the kids have been. Shelly launches into a full report: first words, a tooth coming in, and an incident with a sippy cup and the nursery’s ceiling fan that she is very proud of not having caused.",
      "You ask Shelly what she thinks they’ll be when they grow up. " + say("Anything but a walking egg dispenser,") + " she says, then laughs. " + say("Whatever they want. As long as they visit their mom."),
      "Shelly tells you how strange it is to walk past Anon’s bar with a diaper bag over her shoulder. " + say("The bartender gave me a free drink. A juice. Everyone thought that was hilarious.")
    ];
    if (azraKids() > 0) lines.push("You ask how the kids get on with Azra’s. Shelly grins. " + say("They’re a gang. Azra’s little suula carry ours around like dolls, and ours steal their snacks. It’s perfect."));
    output(pick(lines));
    try { processTime(10); } catch (err) {}
    clearMenu();
    addButton(14, "Back", function () { meetShelly(room); });
  }

  function sleepingShelly() {
    scene(true);
    output(p(
      "Shelly is fast asleep, curled into a little ball in the middle of your big bed" + (bunny() ? ", her ears twitching at a dream" : "") + ".",
      "When you sit on the edge of the mattress, she cracks an eye open and lifts the covers. " + say("Mmh, [pc.name]... get in. The kids are asleep. For now.")
    ));
    clearMenu();
    addButton(0, "Sleep With Her", function () { sleepWith(false); }, "Sleep With Her", "Climb into bed with Shelly and sleep until morning.");
    addButton(14, "Let Her Sleep", mainGameMenu, "Let Her Sleep", "Leave Shelly to her rest.");
  }

  // Both Azra and Shelly in your bed. TN_AzraFamily.mod's sleeping-Azra button also comes here.
  function bedBoth() {
    scene(true);
    output(p(
      "Azra and Shelly are both fast asleep. Azra’s wing is draped over Shelly like a tent, and Shelly is snoring softly into the suula’s arm.",
      "The mattress dips when you sit down, and Azra cracks one eye open. " + say("Mmh... stud.") + " She lifts her wing in invitation, which wakes Shelly, who blinks up at you" + (bunny() ? ", ears perking" : "") + ". " + say("Ooh, there’s room in the middle,") + " Shelly mumbles. " + say("If you don’t mind getting squished.")
    ));
    clearMenu();
    addButton(0, "Sleep With Them", function () { sleepWith(true); }, "Sleep With Them", "Squeeze into bed between Azra and Shelly and sleep until morning.");
    addButton(14, "Let Them Sleep", mainGameMenu, "Let Them Sleep", "Leave them to their rest.");
  }

  function sleepWith(both) {
    scene(true);
    if (both) { try { setF("SLEPT_BOTH", (Number(f("SLEPT_BOTH")) || 0) + 1); flags.AZRA_VISITED = now(); } catch (err) {} }
    var bump = pregnant() && belly() >= 10;
    output(both
      ? p(
        "You " + (pc.isNude() ? "climb" : "strip down and climb") + " in between them. Azra wraps around your back, nine feet of warm suula and one heavy wing, and Shelly snuggles into your front, tucking her head under your chin.",
        say("Best... bed... ever,") + " Shelly sighs. Azra rumbles a sleepy agreement into your hair. " + (bump ? "Shelly’s rounded belly presses against you, and every so often you feel a tiny kick. " : "") + "Between the two of them, you’re asleep in minutes.",
        "")
      : p(
        "You " + (pc.isNude() ? "slip" : "strip down and slip") + " under the covers. Shelly scoots right over and tucks herself against you, cold feet and all.",
        say("Just like on the ship,") + " she mumbles, " + say("except now there’s a baby monitor.") + " " + (bump ? "Her rounded belly presses against you, and every so often you feel a tiny kick. " : "") + "She’s out like a light, and you follow soon after.",
        ""));
    var hadNext = false;
    try { window.sleep(false); } catch (err) { log("sleep failed: " + err); }
    try { var b = getButtonData(0); hadNext = !!(b && b.title === "Next"); } catch (err) {}
    if (hadNext) addButton(0, "Next", function () { wake(both); });
  }

  function wake(both) {
    scene(false);
    output(both
      ? p(
        "You wake up alone in a very rumpled bed, to the smell of tea and the sound of two voices out in the hall.",
        "Azra leans back in through the door with a steaming mug and presses it into your hands. Shelly peeks around her" + (bunny() ? ", ears first" : "") + ". " + say("The kids are up and starving. All of them,") + " Shelly announces. " + say("Come find us in the cafeteria!") + " Azra kisses your forehead, and the two of them head off together, already arguing about breakfast."
      )
      : p(
        "You wake to Shelly bouncing on the edge of the bed, already dressed. " + say("Morning! The " + (kids() === 1 ? "baby is up and wants" : "kids are up and want") + " breakfast. Come find me in the cafeteria!"),
        "She plants a quick kiss on your cheek and scampers out."
      ));
    clearMenu();
    addButton(0, "Next", mainGameMenu);
  }

  // Hook the four nursery rooms through runAfterEnter. Rooms are found by name, so no
  // content_tavros.js patches are needed. TN_AzraFamily.mod hooks the same rooms; both chain.
  function hookRooms() {
    if (typeof window.findRoomByName !== "function") return;
    ROOMS.forEach(function (id) {
      var room = null;
      try { room = window.findRoomByName("KALAS.TAVROS." + id); } catch (err) { room = null; }
      if (!room || room._tnShellyFamily) return;
      var prior = room.runAfterEnter;
      room.runAfterEnter = function () {
        var r;
        if (typeof prior === "function") r = prior.apply(this, arguments);
        try { roomHook(id); } catch (err) { log("room hook " + id + " failed: " + err); }
        return r;
      };
      room._tnShellyFamily = true;
    });
  }

  // ---- Mod Menu
  var SPOTS = { NURSERYE4: "Milking Station", NURSERYG12: "Nursery Cafeteria", NURSERYK14: "Educational Center", NURSERYG4: "your Bedroom (asleep)" };
  function statusHtml() {
    if (!window.flags) return "Load a save to see Shelly’s status.";
    var lines = [];
    if (!cure()) return "Shelly isn’t cured yet. Finish the Shelly Cure Quest (pink, red or blue cure) first.";
    if (!fertileCure()) return "Shelly took Dr. Lash’s cure, which left her sterile. Only the pink, red and blue cures can have children.";
    lines.push("<b>Agreed to children:</b> " + (breedOk() ? "Yes" : "No (Kids? in her Talk menu, needs trust 10 and affection 7+)") + " · trust " + rel("TRUST") + ", affection " + rel("AFFECTION"));
    lines.push("<b>Sterilex:</b> " + (offPill() ? "Off" : "On"));
    lines.push("<b>Pregnant:</b> " + (pregnant() ? "Yes, day " + pregDay() + " of " + Math.round(term() / DAY) + (knows() ? "" : " (she doesn’t know yet)") : "No"));
    lines.push("<b>Children with Shelly:</b> " + kids());
    if (kids() > 0) lines.push("<b>Right now on Tavros:</b> " + SPOTS[spot()] + (visiting() ? "" : " (only while the ship is docked at Tavros)") + (withAzra(spot()) ? ", with Azra" : ""));
    return lines.join("\n");
  }
  function register(tries) {
    if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) {
      if (tries < 120) setTimeout(function () { register(tries + 1); }, 500);
      return;
    }
    window.registerModMenu({
      id: MOD_ID,
      name: "Shelly’s Family",
      author: "Techy-Nest (KittyPatcher custom mod)",
      description: "Cured Shelly (pink, red or blue) can have Steele’s children. They live in the Tavros nursery, and she visits them whenever the ship docks there. With Azra’s Family, the two moms hang out together. Off = no new pregnancies, no visits, and her crew button works as normal.",
      supportsToggle: true,
      defaultEnabled: true,
      getHtml: function () {
        var html = statusHtml() + "\n\n";
        html += "<b>Pregnancy length:</b> " + termDays() + " days (applies to the next pregnancy)<button data-mod-act=\"term\">Change Length</button>\n";
        html += "<b>Pregnant bust:</b> " + (hasPregArt() ? "Custom pregnant art (TN_ShellyFamilyBusts.js)" : (fallbackBust() === "egg" ? "Her old egg-belly bust" : "Her cured bust (no belly)")) +
          (hasPregArt() ? "" : "\nNo pregnant art for cured Shelly is loaded yet.<button data-mod-act=\"bust\">Switch Bust</button>") + "\n\n";
        html += "<b>Testing</b> (changes your save):" +
          "<button data-mod-act=\"agree\">Skip Talk: She Agrees</button>" +
          "<button data-mod-act=\"conceive\">Make Her Pregnant</button>" +
          "<button data-mod-act=\"skip\">Skip 30 Days</button>" +
          "<button data-mod-act=\"birth\">Give Birth Now</button>";
        return html;
      },
      onAct: function (act) {
        if (!window.flags) return true;
        if (act === "term") { var i = TERMS.indexOf(termDays()); save("tn.shellyFamily.termDays", TERMS[(i + 1) % TERMS.length]); }
        if (act === "bust") save("tn.shellyFamily.fallbackBust", fallbackBust() === "egg" ? "cured" : "egg");
        if (act === "agree" && fertileCure()) { setF("BREED_OK", 1); setF("PAUSED", undefined); }
        if (act === "conceive" && fertileCure() && !pregnant()) conceive();
        if (act === "skip" && pregnant()) setF("PREG_START", Number(f("PREG_START")) - 30 * DAY);
        if (act === "birth" && pregnant()) giveBirth();
        return true;
      }
    });
  }

  window.tnShellyFamily = {
    // For TN_ShellyCureQuest.mod
    pillLine: pillLine,
    afterCum: afterCum,
    sexText: sexText,
    bustName: bustName,
    eggBelly: eggBelly,
    // For TN_AzraFamily.mod
    withAzra: withAzra,
    jointLine: jointLine,
    bedBoth: bedBoth,
    kids: kids,
    // General
    isPregnant: function () { return enabled() && pregnant(); },
    knows: function () { return enabled() && knows(); },
    away: away,
    spot: spot,
    _test: { giveBirth: giveBirth, conceive: conceive, roomHook: roomHook, hookRooms: hookRooms, tick: tick, kidsTalk: kidsTalk, kidsAgree: kidsAgree, familyMenu: familyMenu, meetShelly: meetShelly, sleepingShelly: sleepingShelly, sleepWith: sleepWith, wake: wake, patchShellyMenus: patchShellyMenus, statusHtml: statusHtml }
  };

  setInterval(function () { patchShellyMenus(); hookRooms(); tick(); try { syncBusts(); } catch (err) {} }, 1000);
  register(0);
  log("loaded");
})();
