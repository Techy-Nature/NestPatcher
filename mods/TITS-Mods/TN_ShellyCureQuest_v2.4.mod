Name: Shelly Cure Quest
Author: Neston
# Two routes to cure Shelly of her endless Ovilium eggs: Dr. Lash (Tarkus) or Dr. Lessau (Uveto).
# Needs Shelly-Custom-Talk-Menu.js (and ShellyShop.mod) loaded first. List this mod after them in enabled.txt.
# Starts from Shelly's existing "Cure?" talk option (5+ trust), which sets flags.TN_SHELLY_CURE_DISCUSSION.
# Dr. Lash and Dr. Lessau get their buttons from two small anchors below (TiTS 0.9.166 bundles). Test on a backup save first.
# Lessau's egg step needs one of each small egg colour from Shelly's Assist: brightly-colored, pink, blue and white.
# All progress is stored in flags.TN_SCQ_* and survives saving and loading.
# Android Mods > Shelly Cure Quest has a setting for whether Dr. Lash's sterilization also removes Steele's genitals.
# Once she's cured, her cabin Sex menu opens: First Time, then Make Love (affection 5+), She Rides, Eat Her Out, Her Mouth and Grind.
# Scenes support bipedal, taur and naga Steele, herms, cockvines and cunt-snakes. Sex scenes written by Techy-Nest.
# Cured busts come from TN_ShellyCureBusts.js. List it before this mod in enabled.txt. Without it she keeps her old busts.
# 2026-10-26: hooks for TN_ShellyFamily.mod (pill line, conception, pregnant text and busts). Harmless without it.

# Dr. Lash's lab menu (Novahome): quest buttons go in free slots from 7 up.
Replace [content_tarkus.js]:
window.bothriocQuestActive()&&window.bothriocQuestDoctorButton(4,"Lash"),addButton(14,"Back",mainGameMenu)}
With:
window.bothriocQuestActive()&&window.bothriocQuestDoctorButton(4,"Lash"),window.tnShellyCureDoctorButtons&&window.tnShellyCureDoctorButtons("lash",7),addButton(14,"Back",mainGameMenu)}

# Dr. Lessau's main menu (Steele Tech, Uveto): quest buttons follow his own buttons.
Replace [content_uveto.js]:
addButton(14,"Leave",mainGameMenu)}function Ci(){
With:
window.tnShellyCureDoctorButtons&&(e=window.tnShellyCureDoctorButtons("lessau",e)),addButton(14,"Leave",mainGameMenu)}function Ci(){

Add JS:
(function () {
  "use strict";
  var MOD_ID = "tn-shelly-cure-quest";

  // Player setting (Android Mods > Shelly Cure Quest): does Dr. Lash's sterilization also remove Steele's genitals?
  // On by default, as in the design script. Saved per device, like the mod menu's own toggles.
  var NULLIFY_KEY = "tn.shellyCure.nullifyGenitals";
  function nullifyGenitals() {
    try { return window.localStorage.getItem(NULLIFY_KEY) !== "false"; } catch (err) { return true; }
  }
  function setNullifyGenitals(on) {
    try { window.localStorage.setItem(NULLIFY_KEY, on ? "true" : "false"); } catch (err) {}
  }

  var LASH_PRICE = 50000;
  var LASH_PC_PRICE = 10000;
  var LESSAU_PRICE = 15000;
  var HOUR = 60;
  var DAY = 24 * HOUR;

  // ---------- small helpers ----------

  function enabled() {
    if ((window.tnModMenuActive===true&&typeof window.isTnModEnabled==="function") && !window.isTnModEnabled(MOD_ID)) return false;
    if (typeof window.tnShellyModEnabled === "function" && !window.tnShellyModEnabled()) return false;
    return typeof flags !== "undefined";
  }
  function f(name) { return flags["TN_SCQ_" + name]; }
  function num(name) { return Number(flags["TN_SCQ_" + name]) || 0; }
  function setF(name, value) { flags["TN_SCQ_" + name] = value; }
  function shellyOnCrew() { return typeof flags !== "undefined" && flags.TN_SHELLY_CREW === 1; }
  function questOpen() { return flags.TN_SHELLY_CURE_DISCUSSION === 1 && !f("FAILED") && !f("CURED"); }

  function now() {
    if (typeof GetGameTimestamp === "function") return GetGameTimestamp();
    var d = typeof days === "number" ? days : 0;
    var h = typeof hours === "number" ? hours : 0;
    var m = typeof minutes === "number" ? minutes : 0;
    return d * DAY + h * HOUR + m;
  }
  function hoursLeft(due) { return Math.max(1, Math.ceil((due - now()) / HOUR)); }
  function passTime(mins) { if (mins && typeof processTime === "function") processTime(mins); }
  function roll(percent) { var r = typeof rand === "function" ? rand(100) : Math.floor(Math.random() * 100); return r < percent; }
  function pick(list) { return list[typeof rand === "function" ? rand(list.length) : Math.floor(Math.random() * list.length)]; }
  function p() { return Array.prototype.slice.call(arguments).join("\n\n"); }
  function say(text) { return "<i>“" + text + "”</i>"; }

  // Webpack modules for TiTS 0.9.166 (main.js): 36956 = ChildManager (kd), 31317 = StatTracking (s).
  var gameModules = {};
  function gameModule(id) {
    if (gameModules[id]) return gameModules[id];
    var chunks = window.webpackChunktits_html || self.webpackChunktits_html;
    if (!chunks || typeof chunks.push !== "function") return null;
    var req = null;
    chunks.push([[9912600 + (id % 1000)], {}, function (r) { req = r; }]);
    if (typeof req !== "function") return null;
    try { gameModules[id] = req(id); } catch (err) { return null; }
    return gameModules[id];
  }

  function credits() { return Number(pc.credits) || 0; }
  function spend(amount) { pc.credits = Math.max(0, credits() - amount); }

  function kidCount() {
    try {
      var cm = gameModule(36956);
      if (cm && cm.kd && typeof cm.kd.numChildren === "function") return Number(cm.kd.numChildren()) || 0;
    } catch (err) {}
    try {
      var st = gameModule(31317);
      if (st && st.s && typeof st.s.getStat === "function") {
        return (Number(st.s.getStat("pregnancy/total births")) || 0) + (Number(st.s.getStat("pregnancy/total sired")) || 0);
      }
    } catch (err2) {}
    try {
      if (typeof StatTracking !== "undefined" && typeof StatTracking.getStat === "function") return (Number(StatTracking.getStat("pregnancy/total births")) || 0) + (Number(StatTracking.getStat("pregnancy/total sired")) || 0);
    } catch (err3) {}
    return 0;
  }
  function pcIntelligence() { try { return Number(pc.intelligence()) || 0; } catch (err) { return 0; } }
  function pcInfertile() {
    try { return pc.hasPerk("Perma-Sterile") || (pc.fertility() <= 0 && pc.virility() <= 0); } catch (err) { return false; }
  }

  function onTarkus() {
    try { if (typeof getPlanetName === "function") return /tarkus/i.test(String(getPlanetName())); } catch (err0) {}
    try {
      if (typeof rooms !== "undefined" && typeof shipLocation !== "undefined" && rooms[shipLocation]) {
        return /tarkus/i.test(String(rooms[shipLocation].planet || ""));
      }
    } catch (err) {}
    try { if (typeof getPlanetName === "function") return /tarkus/i.test(String(getPlanetName())); } catch (err2) {}
    return false;
  }
  function shipName() {
    try { if (typeof pc_ship !== "undefined" && pc_ship && (pc_ship.short || pc_ship.name)) return "the " + (pc_ship.short || pc_ship.name); } catch (err) {}
    return "your ship";
  }
  function gearName() {
    try { if (pc.armor && pc.armor.longName && !/nothing/i.test(pc.armor.longName)) return pc.armor.longName; } catch (err) {}
    try { if (pc.upperUndergarment && pc.upperUndergarment.longName && !/nothing/i.test(pc.upperUndergarment.longName)) return pc.upperUndergarment.longName; } catch (err2) {}
    return "clothes";
  }
  function hasWings() { try { return typeof pc.hasWings === "function" ? pc.hasWings() : pc.wingType && pc.wingType !== GLOBAL.TYPE_HUMAN; } catch (err) { return false; } }
  function faceIs(names) {
    try { for (var i = 0; i < names.length; i++) if (GLOBAL[names[i]] !== undefined && pc.faceType === GLOBAL[names[i]]) return true; } catch (err) {}
    return false;
  }
  function yammiAboard() { try { return chars.YAMMI && chars.YAMMI.isCrew && chars.YAMMI.isCrew(); } catch (err) { return false; } }
  function workday() { var h = typeof hours === "number" ? hours : 12; return h >= 9 && h < 17; }

  function giveKey(name, desc) {
    try { if (typeof pc.hasKeyItem === "function" && !pc.hasKeyItem(name)) pc.createKeyItem(name, 0, 0, 0, 0, desc); } catch (err) {}
  }
  function dropKey(name) {
    try { if (typeof pc.hasKeyItem === "function" && pc.hasKeyItem(name)) pc.removeKeyItem(name); } catch (err) {}
  }

  // Healing items for the blood draw. Matched by name so it works whatever the class names are in this build.
  function findItem(pattern) {
    if (!pc.inventory) return -1;
    for (var i = 0; i < pc.inventory.length; i++) {
      var it = pc.inventory[i];
      if (!it) continue;
      var name = (it.shortName || "") + " " + (it.longName || "");
      if (pattern.test(name)) return i;
    }
    return -1;
  }
  // Shelly's Assist gives one random small egg (content_tavros.js oviliumEggReward): four colours to collect.
  var EGG_KINDS = [["SmallEgg", "brightly-colored"], ["EggPinkSmall", "pink"], ["EggBlueSmall", "blue"], ["EggWhiteSmall", "white"]];
  function eggIndex(cls) {
    if (!pc.inventory) return -1;
    for (var i = 0; i < pc.inventory.length; i++) {
      var it = pc.inventory[i];
      if (it && typeof it.getClassName === "function" && it.getClassName() === cls && it.quantity > 0) return i;
    }
    return -1;
  }
  function missingEggs() {
    var out = [];
    for (var i = 0; i < EGG_KINDS.length; i++) if (eggIndex(EGG_KINDS[i][0]) < 0) out.push(EGG_KINDS[i][1]);
    return out;
  }
  function takeEggs() {
    for (var i = 0; i < EGG_KINDS.length; i++) {
      var idx = eggIndex(EGG_KINDS[i][0]);
      if (idx < 0) continue;
      var it = pc.inventory[idx];
      if (it.quantity > 1) it.quantity--; else pc.inventory.splice(idx, 1);
    }
  }
  var POULTICE = /poultice/i;
  var MEDKIT = /med ?kit|medipen|bianca/i;
  function useItem(pattern) {
    var i = findItem(pattern);
    if (i < 0) return;
    var it = pc.inventory[i];
    if (it.quantity > 1) it.quantity--;
    else pc.inventory.splice(i, 1);
  }

  // ---------- shared scene plumbing ----------

  function shellyScene() {
    clearOutput();
    if (typeof clearBust === "function") clearBust();
    if (typeof showBust === "function") showBust(curedBustName(false) || (window.tnShellyBustName ? window.tnShellyBustName(false) : "SHELLY"));
    showName("Shelly");
    author("Neston");
  }
  function lashScene() {
    clearOutput();
    if (typeof doctorlash !== "undefined" && doctorlash && typeof doctorlash.showAll === "function") doctorlash.showAll();
    else showName("Doctor Lash");
    author("Neston");
  }
  function lessauScene() { clearOutput(); if (typeof showBust === "function") showBust("DR_LESSAU"); showName("Doctor Lessau"); author("Neston"); }
  function next(fn, label, tip) { clearMenu(); addButton(0, label || "Next", fn, label || "Next", tip || ""); }
  function toTalk() { if (typeof window.tnShellyTalkMenu === "function") window.tnShellyTalkMenu(); else mainGameMenu(); }
  function toCabin() { if (typeof window.tnShellyCabin === "function") window.tnShellyCabin(); else mainGameMenu(); }
  function toShipDock() {
    // Lab scenes end "back at the ship": put Steele at the ship's docking room when the game exposes it.
    try { if (typeof skipToRoom === "function" && typeof getShipRoom === "function") { skipToRoom(getShipRoom()); return; } } catch (err) {}
    mainGameMenu();
  }
  function recover(minutesFromNow, msg) { setF("RECOVER_UNTIL", now() + minutesFromNow); setF("RECOVER_MSG", msg); }
  function recovering() { return now() < num("RECOVER_UNTIL"); }

  // ---------- Shelly's changes once cured ----------

  function applyShellyCure(kind) {
    setF("CURED", kind);
    var s = typeof chars !== "undefined" ? chars.SHELLY : null;
    if (!s) return;
    try {
      if (kind === "lash") {
        s.hairColor = "dark brown";
        if ("fertilityRaw" in s) s.fertilityRaw = 0;
      } else if (kind === "blue") {
        s.hairColor = "dark brown";
        if (GLOBAL.TYPE_HUMAN !== undefined) { s.earType = GLOBAL.TYPE_HUMAN; s.tailType = GLOBAL.TYPE_HUMAN; }
        s.tailCount = 0;
      }
    } catch (err) { console.warn("[Shelly Cure] Could not update Shelly's body:", err); }
  }

  // Perma-Sterile: fertility and virility always read 0, whatever implants or transformatives do.
  function enforceSterile() {
    if (typeof pc === "undefined" || !pc || typeof pc.hasPerk !== "function" || !pc.hasPerk("Perma-Sterile")) return;
    if (pc.__tnScqSterile) return;
    try {
      Object.defineProperty(pc, "fertility", { value: function () { return 0; }, writable: true, configurable: true, enumerable: false });
      Object.defineProperty(pc, "virility", { value: function () { return 0; }, writable: true, configurable: true, enumerable: false });
      Object.defineProperty(pc, "__tnScqSterile", { value: true, writable: true, configurable: true, enumerable: false });
    } catch (err) { console.warn("[Shelly Cure] Could not lock Perma-Sterile:", err); }
  }
  function sterilizePC() {
    try { if (!pc.hasPerk("Perma-Sterile")) pc.createPerk("Perma-Sterile", 0, 0, 0, 0, "Dr. Lash sterilized you permanently. Fertility and virility transformatives and implants do nothing."); } catch (err) {}
    if (nullifyGenitals()) {
      try {
        if (pc.cocks && pc.cocks.length && typeof pc.removeCock === "function") pc.removeCock(0, pc.cocks.length);
        if (pc.vaginas && pc.vaginas.length && typeof pc.removeVagina === "function") pc.removeVagina(0, pc.vaginas.length);
        if ("balls" in pc) pc.balls = 0;
      } catch (err2) { console.warn("[Shelly Cure] Could not nullify genitals:", err2); }
    }
    enforceSterile();
  }

  // =====================================================================
  //  DR. LASH ROUTE
  //  LASH stage: 1 asked Lash, 2 pitched to Shelly, 3 Shelly thinking, 4 she said no,
  //  5 she said yes but Steele refused sterilization, 6 waiting at airlock for Tarkus,
  //  7 backed out in the lab (pay Lash to continue), 8 done.
  // =====================================================================

  function lashAsk() {
    lashScene();
    var smart = pcIntelligence() >= 15;
    var t = p(
      "You explain about your crewmate, Shelly Brunel, and how you were hoping that he could reverse the effects of some early reproductive-mods that she took quite a while ago.",
      "Dr. Lash looks at you blankly as you speak, seemingly disinterested, until he finally says " + say("It’s not going to be free if I do. And it will depend on the nature of said reproductive mods. What did she take.") + " His visage is hard, and his voice flat, like he’s not expecting anything to come of this- or maybe he is, but he’s not looking forward to what it is. Despite his harshness, you soldier on, figuring you started to ask, you might as well explain.",
      "So you do. You tell him about Shelly’s eggs, and the fact they don’t go away, and he writes down what you’re saying on an electronic tablet. You then explain about the bunny ears, cotton candy blue colored hair, and blue cotton tail.",
      "He blinks. " + say("This sounds... oddly familiar. You do know what you’re explaining is the result of both Ovilium and Laquine ears, correct?"),
      "You shake your head, and blink at him, saying you didn’t know that.",
      say("Yes, well. With that in mind, if I do this, she will be permanently infertile- and I mean that, if she regrows other genitals, she still will be unable to reproduce. The nature of these two mods is to remove the ability to procreate and instead change the body such that it creates eggs from the female ovaries instead of using them for live birth procreation. Laquines have a sterility plague...")
    );
    if (smart) {
      t += " You nod along with his explanation, and continue listening. " + say("If the Ovilium ended up giving her laquine features, she may need more of a fertility treatment to restore her fertility- not that I’d want to anyway. We don’t need more modded humans in this universe, period. If you want to do this, it will be 50k credits- but I will need her here, to see her, gather samples, and then create a cure that will also permanently remove her specific brand of fertility and virility. This is something you should most definitely sit with and make sure you’re actually sure.") + " You nod, and sigh, wondering whether you should leave or ask him something else.";
    } else {
      t += " You... kind of zone out at this point, and ask whether he can do the procedure or not. He scoffs, and says, " + say("Yes. Though it will cost you 50k credits. I don’t do my work for free.");
    }
    output(t);
    setF("LASH", 1);
    next(mainGameMenu);
  }

  function lashPitch() {
    shellyScene();
    output(p(
      "You explain about Dr. Lash’s cure, which includes a removal of the eggs. Unfortunately, you explain, in addition, it also will permanently remove her fertility and virility.",
      "Shelly’s face hardens. " + say("You think I haven’t tried the side-effects of what I sell? Sterilex doesn’t work either, to remove the eggs! I still have ovaries, and they still make eggs, just not at the same rate. I’ve tried that.") + " You explain this isn’t temporary- this is actually permanent. If she regrows other genitals, they will do nothing for her ability to reproduce. She will still be unable to have children.",
      "...Shelly looks- a bit horrified. She blinks at you, shocked. " + say("Since when did you not want kids? You’re a Steele! Unless... you just don’t want ME having kids?")
    ));
    setF("LASH", 2);
    setF("SCORE", 0); setF("WRONG", 0); setF("USED", ""); setF("PC_STERILE_ASKED", 0); setF("ROLL", undefined);
    clearMenu();
    addButton(0, "That’s It", lashThatsIt, "That’s It", "You definitely don’t want her having kids.");
    addButton(1, "That’s Not It", lashNotIt, "That’s Not It", "You want her having kids, you’re just wanting it for a different reason.");
  }

  function used(key) { return String(f("USED") || "").split(",").indexOf(key) >= 0; }
  function markUsed(key) { setF("USED", (f("USED") ? f("USED") + "," : "") + key); }
  function score(delta) { setF("SCORE", num("SCORE") + delta); if (delta < 0) setF("WRONG", num("WRONG") + 1); }

  // --- "That's Not It": softer reasons, she thinks it over for a day ---

  function lashNotIt() {
    shellyScene();
    output(say("Well, then what exactly is your reasoning?") + " she asks, looking a little more mollified, but also confused.");
    notItMenu();
  }
  function notItMenu() {
    clearMenu();
    var any = used("perm") || used("safe1") || used("over1");
    if (!used("perm")) addButton(0, "Permanent", notItPermanent, "Permanent", "Makes sure the eggs can’t come back.");
    else addDisabledButton(0, "Permanent", "Permanent", "You already said that.");
    if (!used("safe1")) addButton(1, "Safety", notItSafety, "Safety", "You are both on the 14th Planet Rush. Kids are likely not in either of your best interests.");
    else addDisabledButton(1, "Safety", "Safety", "You already said that.");
    if (kidCount() >= 15) {
      if (!used("over1")) addButton(2, "Overpopulation", notItOverpop, "Overpopulation", "You don’t want any more kids- you’ve too many as it is.");
      else addDisabledButton(2, "Overpopulation", "Overpopulation", "You already said that.");
    }
    if (any) addButton(14, "Nope, Next", notItDone, "Nope, Next", "You don’t have any other reasons.");
  }
  function notItPermanent() {
    shellyScene();
    markUsed("perm"); score(2);
    output(p(
      "You say this is a much more permanent solution, and you like that it’s very unlikely for any eggs to come back, since her ovaries won’t be making any normal eggs to begin with.",
      say("Well... when you put it like that... I suppose I’ll think about it. Give me a day and overnight to think, okay? Are there any other reasons you might want this for me?")
    ));
    notItMenu();
  }
  function notItSafety() {
    shellyScene();
    markUsed("safe1");
    output(p(
      "You explain that you’re on this planet rush and kids are not really smart to be having on a dangerous adventure like this.",
      "Shelly replies, " + say("I suppose, but I still have a place back on Tavros, and I could easily live in your nursery to stay with our children and raise them... But then, I suppose that would preclude me being there, right? You want me here."),
      "You nod.",
      "She sighs, and nods. " + say("I get it. There are less permanent options for this though- the Sterilex that I sell being one of them. You don’t need the cure to completely remove my ability to reproduce, Sterilex can do that easy for a day at a time. What I need is a cure that doesn’t remove my ability to make kids- or at least has a biological clock or something."),
      "You sigh, knowing Dr. Lash is unlikely to want a clock. You might have to find someone else to figure out a cure.",
      "Shelly looks at your distraught face. " + say("Don’t worry! I’m sure you’ll find someone to help me eventually. Were there any other reasons? If not, I’ll think about it overnight and let you know tomorrow what my choice is.")
    ));
    notItMenu();
  }
  function notItOverpop() {
    shellyScene();
    markUsed("over1");
    var k = kidCount(), line;
    if (k >= 75 && pcInfertile()) line = "You’re infertile, and you want your lovers to be as well. You have too many children in your nursery to count, almost.";
    else if (k >= 50) line = "You have half of a hundred kids. Not only should you be sterilized, but your lovers likely should be too, as a safety precaution.";
    else if (k >= 25) line = "You have a quarter of a hundred kids. You seriously don’t need more Steeles.";
    else line = "You have " + k + " kids. You really don’t want more, if you can help it.";
    setF("PC_STERILE_ASKED", 1);
    output(p(
      line,
      say("That sounds like a you problem, [pc.name].") + " Shelly says, frowning. Then her frown slowly turns back into a cheeky smile. " + say("Honestly, I don’t mind as long as you also get the same treatment.") + " You balk a little, and she laughs, her laugh musical in its cadence. " + say("See! Now you know how I feel! Permanent is forever! Until you die! I want children eventually, [pc.name]. Even if not currently. But if you’re willing to get the same permanent treatment, then I’d be willing."),
      "Guess you have that to think about now."
    ));
    notItMenu();
  }
  function notItDone() {
    setF("LASH", 3);
    setF("LASH_DUE", now() + DAY);
    toTalk();
  }

  // --- "That's It": the risky reasons conversation ---

  function lashThatsIt() {
    shellyScene();
    output(say("...Why? Why don’t you want me having kids?") + " She looks sad, but she’s seemingly willing to hear you out, no doubt hoping your reasoning makes sense.");
    clearMenu();
    addButton(0, "My Reasons", reasonsMenu, "Here’s my Reasons", "You have a reason for wanting her to not have children, and this is it.");
  }
  function reasonsMenu() {
    clearMenu();
    if (num("WRONG") >= 2) {
      addDisabledButton(0, "Overpopulation", "Overpopulation", "Too late for that.");
      addDisabledButton(1, "Safety", "Safety", "Too late for that.");
      addDisabledButton(2, "Love You", "Love You", "Too late for that.");
      addDisabledButton(3, "Expensive", "Expensive", "Too late for that.");
      addButton(5, "Uh oh.", reasonsFail, "Uh oh.", "Seems you’ve angered her too much.");
      return;
    }
    var opts = [
      ["over2", 0, "Overpopulation", reasonOverpop, "You don’t want any more humans, same as Dr. Lash."],
      ["safe2", 1, "Safety", reasonSafety, "You don’t think she can handle being actually pregnant."],
      ["love", 2, "Love You", reasonLove, "You love her too much to want to have children to distract from your love."],
      ["cost", 3, "Expensive", reasonCost, "Babies are expensive."]
    ];
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      if (used(o[0])) addDisabledButton(o[1], o[2], o[2], "You already said that.");
      else addButton(o[1], o[2], o[3], o[2], o[4]);
    }
  }
  function reasonOverpop() {
    shellyScene();
    markUsed("over2");
    var k = kidCount(), t;
    if (k > 5) {
      score(-3);
      t = say("Well, that’s just a blatant lie, [pc.name]! You already have lots of kids, so this is a moot point.") + " Shelly exclaims, crossing her arms angrily.";
    } else if (k > 0) {
      setF("PC_STERILE_ASKED", 1);
      t = p(
        say("You... don’t want any more with me, you mean? You already have a small amount of children, this seems like you’re just not wanting to have kids with me.") + " Shelly looks away disappointedly, crossing her arms just below her bust and above her egg-filled belly.",
        "You try to reassure Shelly that no, it’s not that. It would be the same for anyone- you’ve had enough children as it is, you don’t need more responsibility for after the rush.",
        "Shelly looks at you with an unreadable, somewhat disbelieving glance, then says " + say("Prove it, then. You want me to get sterilized, you might as well get that too. Permanently.") + " You... can’t say you weren’t expecting this, but decide to tell her you’ll think about it."
      );
    } else {
      setF("PC_STERILE_ASKED", 1);
      t = "Shelly looks at you with disbelief. " + say("Really? Then prove it by coming with me and getting the same treatment. Get permanently sterilized.") + " You blink... then say you’ll think about it.";
    }
    output(p(t, say("Do you have any other reasons for not wanting me to have children?") + " Shelly asks."));
    reasonsMenu();
  }
  function reasonSafety() {
    shellyScene();
    markUsed("safe2"); score(-2);
    output("You say you don’t think her being pregnant is very safe, and you make it clear you don’t think she can handle being so. " + say("You want to bet on that, Steele?") + " she says, with a hard expression. " + say("Some of my larger eggs are bigger than a baby, and are very hard to push out. They’re not soft like a baby is- they also don’t have limbs to manipulate into an easier configuration. You sure you want to go that route?") + " You blush, embarrassed, saying you might have another reason.");
    reasonsMenu();
  }
  function reasonCost() {
    shellyScene();
    markUsed("cost"); score(-3);
    output(say("Won’t you have a shipload or three of money and jewels and riches by the time you’re done with the rush?") + " Shelly asks disapprovingly. " + say("It’s not like you’re going to be a pauper by the time you’re all done with this- you’ll be a mining magnate CEO! Not to mention you already have a nursery for our children to go to until they’re old enough to join us, or we finish the rush. This is a point that makes no sense, Steele.") + " She crosses her arms above her chest, glaring at you with no small amount of unamused anger.");
    reasonsMenu();
  }
  function reasonLove() {
    shellyScene();
    markUsed("love"); score(4);
    output(say("R-Really..? You love me that much?") + " She blushes, hard, under that chocolate skin. " + say("I... maybe it might be a good idea, if you think of it that way.") + " She pauses. " + say("I’ll think about it, [pc.name]. Genuinely, I love you too, especially for doing all of this searching for a cure!"));
    clearMenu();
    addButton(0, "Love you too!", reasonsWin, "Love you too!", "You said all the right things! Good job.");
  }
  function reasonsWin() {
    shellyScene();
    output(p(
      "Shelly smiles at you. " + say("I’m... glad you love me so much you want me to yourself, but now I’ve got to think about what you’ve said for your reasons. You can come back two days from now- I’ll even send you an email, if you want."),
      "You two exchange emails. Well. That could have gone much worse, you think. Thankfully it seems Shelly is willing to at least consider all this.",
      say("Anything else you need, [pc.name]?") + " You blink, and..."
    ));
    setF("LASH", 3);
    setF("LASH_DUE", now() + 2 * DAY);
    clearMenu();
    addButton(0, "Nod.", toCabin, "Nod.", "You do have something you’d like to do or say with her.");
    addButton(1, "Shake Head", mainGameMenu, "Shake your head.", "You leave her room and go back to the crew console.");
  }
  function reasonsFail() {
    shellyScene();
    output(p(
      "Shelly shakes her head in disapproval and no small amount of anger. Her face is flushed, not with lust, but with pure rage. " + say("You’re... an absolute asshat, Steele. If you wanted me off the ship, you could have just said so.") + " She growls. " + say("Honestly, your reasoning just angers me. And remember this: you could have gone anywhere else than with a convicted criminal who escaped from jail, but instead you pushed something that I didn’t want for reasons that made no sense. I don’t trust you after this."),
      "She turns away, and says " + say("Either get out of my room, or I’ll leave the ship in an escape pod. Your choice.") + " You sigh, and exit the room, closing the door gently behind yourself. You hear her screaming into a pillow through the door not five seconds after you leave."
    ));
    setF("FAILED", 1);
    flags.TN_SHELLY_TRUST = 0;
    next(mainGameMenu, "Next", "Shelly’s trust in you drops to nothing, and the cure is off the table.");
  }

  // --- Part 3: her decision ---

  function lashDecision() {
    shellyScene();
    var email = p(
      "<b>From: ShellytheBunnyBrunel@galactic.net</b>",
      "<i>Hey there, Captain Steele! I’m done thinking about this Dr. Lash idea, if you want to come talk to me, feel free to! I’ll let you know what I’ve decided once you get here.\n\nThanks!\n\n-Shelly Brunel</i>"
    );
    if (f("ROLL") === undefined) {
      var chance = Math.max(5, Math.min(95, 50 + num("SCORE") * 10));
      setF("ROLL", roll(chance) ? 1 : 0);
    }
    var t = p("Shelly’s email is still sitting on your codex.", email, "You ask Shelly about her decision with Dr. Lash. She tells you, ");
    clearMenu();
    if (num("ROLL") !== 1) {
      t += say("It’s a no, Steele. I’d rather not do this with... this unreputable of a doctor, not to mention such a permanent side effect. If you can find someone else, eventually, I’d be open to trying again with someone else! But not... this person, and not right now.") + " You sigh, but nod and say you understand.";
      setF("LASH", 4);
      output(t);
      addButton(0, "Next", toTalk);
      return;
    }
    if (num("PC_STERILE_ASKED") === 1) {
      t += say("It’s a yes, against my better judgement... But again, only if you’re willing to get the same treatment. I’m definitely not doing this alone. Will you do it?");
      output(t);
      addButton(0, "You’ll do it", lashAgree, "You’ll do it", "You’ll get a permanent perk for sterilization. This is permanent for this save. Implants and transformatives will not affect it whatsoever.");
      addButton(1, "You won’t.", lashRefuse, "You won’t.", "Welp.");
    } else {
      t += say("It’s a yes, against my better judgement...");
      output(t);
      addButton(0, "Bring Her Out", lashBringOut, "Bring Her Out", "Head out to Dr. Lash’s lab with Shelly in tow.");
    }
  }
  function lashRefuse() {
    shellyScene();
    output(p(
      "She blinks. " + say("Then I guess I’m not going either, and we have nothing to talk about on that topic. If you ever change your mind or find someone else to make a cure, feel free to let me know."),
      "You nod, and try to think of what else you could do or say."
    ));
    setF("LASH", 5);
    next(toCabin);
  }
  function lashChangeMind() {
    shellyScene();
    setF("PC_STERILE_AGREED", 1);
    var there = onTarkus();
    output(p(
      "She blinks. " + say("So you came around to it? I guess we better " + (there ? "get to Dr. Lash’s lab, then." : "get to Tarkus, then.")),
      there ? say("Lead the way, [pc.name]!") : say("Feel free to pilot us there. I’ll wait at the door for you.")
    ));
    lashHeadOut(true);
  }
  function lashAgree() { setF("PC_STERILE_AGREED", 1); lashBringOut(); }
  function lashBringOut() {
    shellyScene();
    if (onTarkus()) {
      output("You hold out your [pc.hand], and when she takes it, you bring her outside the ship, leading her back to Novahome and down the stairs, then into Dr. Lash’s laboratory.");
      next(lashEnterLab, "Enter the Lab", "Bring Shelly inside.");
    } else {
      output("You hold out your [pc.hand], and she takes it with a nervous squeeze. Dr. Lash is on Tarkus, so the two of you agree she’ll wait by the airlock while you set course. Once you land on Tarkus, check on her from the crew console.");
      lashHeadOut(false);
    }
  }
  function lashHeadOut(alreadyOutput) {
    if (onTarkus() && alreadyOutput) { next(lashEnterLab, "Enter the Lab", "Bring Shelly inside."); return; }
    setF("LASH", 6);
    next(mainGameMenu, "Next", "Shelly waits by the airlock until you land on Tarkus.");
  }
  function lashReady() {
    shellyScene();
    output("You ask if she’s ready. " + say("Ready as I’ll ever be.") + " She sighs, then takes your proffered [pc.hand] as you two exit the ship, heading down the ramp. It closes behind you both, and you lead her by her hand down to Dr. Lash’s laboratory, entering and pulling her gently in behind you.");
    next(lashEnterLab, "Enter the Lab", "Bring Shelly inside.");
  }

  // --- Part 4: the lab ---

  function lashEnterLab() {
    lashScene();
    output("You look around, and blink when Dr. Lash comes around, looking at your bunny like a bug. " + say("So, this is the one you’ve been speaking of to me, hmm? I expect to have that money before any services rendered, Steele."));
    clearMenu();
    if (credits() >= LASH_PRICE) addButton(0, "Pay Him", function () { lashPay(false); }, "Pay Him", "Pay Dr. Lash 50,000 credits for his service.");
    else addDisabledButton(0, "Pay Him", "Pay Him", "You need 50,000 credits.");
    addButton(1, "Back Out", lashBackOut, "Back Out", "Wait, wait, nevermind!");
  }
  function lashBackOut() {
    lashScene();
    output("You tell Dr. Lash you don’t currently have the money to pay him with. He sniffs, and says " + say("What are you doing around here with her then? Bring her back up to your ship, chop chop! Don’t come back without getting that 50k!") + " You snort and bring Shelly back to your ship, apologizing all the way.\n\n<i>(Shelly waits by the airlock. Pay Dr. Lash when you’re ready; you can’t back out of it now.)</i>");
    setF("LASH", 7);
    next(toShipDock);
  }
  function lashPay(fromHub) {
    lashScene();
    spend(LASH_PRICE);
    var t = "You pay Dr. Lash that 50k that he was asking for, then he gets a hypospray and puts Shelly to sleep" + (fromHub ? " after you bring her back to him" : "") + ", before setting her on a hospital table.";
    clearMenu();
    if (num("PC_STERILE_AGREED") === 1) {
      t += " You tell him you want to be permanently sterilized too, and that’s the last thing you remember before you black out.";
      output(t);
      addButton(0, "Wake up.", lashWake, "Wake up.", "Ugh... stomachache...");
    } else {
      output(t);
      addButton(0, "Stick Around", lashStick, "Stick around", "You stay nearby to make sure Dr. Lash does the procedure correctly.");
    }
  }
  function lashWake() {
    lashScene();
    passTime(2 * HOUR);
    sterilizePC();
    output(p(
      "You wake to a blindingly terrible stomachache, before Dr. Lash applies some healing sprays to you both. You groggily look over to Shelly, who blinks back at you. She still has rabbit ears, but they’re no longer bubble gum blue, and her hair has returned to a dark brown. Her ears fade from dark brown at the base to black at the tips, and, you notice with satisfaction, her egg-filled belly is gone! It’s now flat, and no longer pregnant looking.",
      "When you finally feel like sitting up, it’s about fifteen minutes later, and Dr. Lash has done a bit more than you initially planned.",
      nullifyGenitals()
        ? "You’ve been not just permanently sterilized, but your genitals are nullified! You could grow back your genitals, but they wouldn’t be functional whatsoever, so you suppose-"
        : "<b>You’re now permanently, fully sterilized!</b> You know you can’t make any children anymore, even if you wanted to.",
      say("You owe me now, Steele.") + " Your thoughts are interrupted as Dr. Lash looks over at you, only half turned, from his desk. " + say("Feel free to pay me back. You owe me 10k credits for that sterilization procedure. Less than Shelly’s, but still. Either pay me now, or just pay me 5k for now and pay the rest later. You should be grateful you’re getting a choice after springing this extra procedure on me."),
      "<b>(Perk Gained: Perma-Sterile</b> - You are permanently sterile. Fertility and virility transformatives and implants do nothing.<b>)</b>",
      "You scoff, but decide..."
    ));
    clearMenu();
    if (credits() >= 5000) addButton(0, "5k Credits", function () { lashPayPC(5000); }, "5k credits", "Pay him 5k credits now and owe him the rest.");
    else addDisabledButton(0, "5k Credits", "5k credits", "You don’t have 5,000 credits.");
    if (credits() >= LASH_PC_PRICE) addButton(1, "10k Credits", function () { lashPayPC(LASH_PC_PRICE); }, "10k credits", "Pay him the full 10k credits.");
    else addDisabledButton(1, "10k Credits", "10k credits", "You don’t have 10,000 credits.");
    if (credits() < 5000) addButton(2, "Owe Him", function () { lashPayPC(0); }, "Owe Him", "You can’t pay anything right now. You’ll owe him all 10k.");
  }
  function lashPayPC(amount) {
    lashScene();
    spend(amount);
    setF("LASH_DEBT", LASH_PC_PRICE - amount);
    var full = amount >= LASH_PC_PRICE;
    var opener = full
      ? "You say you have the total amount, so you pay him the ten thousand credits on a chit, throwing it his way."
      : amount > 0 ? "You pay him the five thousand on a chit, throwing it his way." : "You tell him he’ll have to wait for his money.";
    output(p(
      opener + " He catches it out of the air with a hard look in your direction. You tell him he could have warned you that he was going to put her under. It’s not your fault he’s got a terrible bedside manner.",
      "He rolls his eyes. " + say("Your pack and clothes are by the door.") + " Then pointedly looks back at his computer, something bubbling on his desk." + (full ? " " + say("Your services have been rendered and paid for, so there’s no need for you two to be here.") + " He doesn’t bother turning around as he says this." : ""),
      "You sigh, and get up, somewhat stiffly, but your microsurgeons are working overtime to heal your body. Shelly is not so lucky, and you grab some healing food from your pack, getting dressed back into your " + gearName() + " after you grab it. You walk over to give the food and clothes to Shelly, and she sighs, and nibbles a bit on it.",
      "She puts her meager clothes back on, and you let her lean on you as you slowly head back to the ship, the both of you forever changed.",
      "She’ll need to heal for a while after this. Three days should be enough."
    ));
    next(lashFinish, "Continue", "Return to the ship. Let Shelly heal for 72 hours.");
  }
  function lashStick() {
    lashScene();
    var react = faceIs(["TYPE_LUPINE", "TYPE_CANINE", "TYPE_DRACONIC", "TYPE_DRAGON"]) ? ", growling loudly"
      : faceIs(["TYPE_FELINE", "TYPE_SNAKE", "TYPE_NAGA"]) ? ", hissing loudly" : ", glaring at him";
    output(p(
      "You decide to stay nearby to make sure Dr. Lash keeps up his end of the deal. You watch some tv on the extranet while you wait. He doesn’t cut anything with you watching, but he does inject a lot of serums. Then he takes notes on his computer at his desk as he waits.",
      "The color of her hair and ears changes with the first dose. He gives another, and a bunch of POP noises happen, which startles you and you look up at him" + react + ". He stares at the ground, as a bunch of the large eggs come out and pop, making a mess of sweets. " + say("I expect you to clean this up. Might as well make yourself useful.") + " He sniffs pompously, and points to a closet. You put your pack down and your codex back in it, then go over to the closet and open it. There’s a mop bucket and cleaning supplies, as well as an actual mop. Wow. You’d think he’d- oh.",
      "You blink, and a high-tech flying cleaning bot comes out of the closet- then another. They work to automatically clean up the mess. " + say("Do I really need to?"),
      say("They’re not going to get the biggest mess. They’re for the ceiling.") + " You look up, and see candy egg goop dripping down from the eggsplosion. You grin to yourself on that very clever pun as you grab the mop, fill it with water and soap. Then you sigh at the mess, and get to work on the floor with the mop as he works to get a better injection for getting rid of all of the eggs."
    ));
    next(lashCleanup, "Cleanup", "Keep cleaning as Dr. Lash works to refine the egg-vaccine.");
  }
  function lashCleanup() {
    lashScene();
    passTime(HOUR);
    output(p(
      "He finally gets a clue an hour in, and smiles widely, as you finish up cleaning up and emptying out the dirty water bucket outside.",
      "You come back in, to another loud POP, even louder than before, groaning as you hope there’s not any more mess to be had. But when you come in... Shelly is moaning in her sleep as the eggs slowly recede, to the point that her stomach... it almost starts to look normal! Dr. Lash removes the syringe from her stomach, lithely going back over and grabbing a healing spray, before spraying it on her stomach, where the syringe was inserted and the cure payload injected.",
      "You put the rest of the supplies away, and as you come out, you hear a tired feminine voice say, " + say("[pc.name]..? Did I...?") + " You go over to her bedside, and look up at the ceiling, noticing the bots finishing with the ceiling and walls. There’s no more goop in here, thankfully. You explain, " + say("You’re okay. I made sure of it. Dr. Lash cured you and you won’t be able to have any more children, same as we agreed. It looks like you still have your genitals, which is good. He had me working... probably on purpose.") + " You shoot a glare over at Dr. Lash. He’s already ignoring you two, though, and has turned back to his computer. You proceed to tell her you’ll grab her clothing, and something to nibble on for food that you brought " + (yammiAboard() ? "from Yammi’s stock." : "from the kitchen on the ship."),
      "She nibbles on some food, but you can tell she’s in a lot of pain. Whether that’s mental or physical, is yet to be seen. Probably a mix of both. You bring her slowly back to the ship, and hope she can heal well from all this. You rub her back gently, reassuring her as you two head back.",
      "She’ll need to heal for a while after this- probably about three days."
    ));
    next(lashFinish);
  }
  function lashFinish() {
    applyShellyCure("lash");
    setF("LASH", 8);
    recover(3 * DAY, "Shelly is sleeping on her bunk, recovering from receiving the cure.");
    toShipDock();
  }
  function lashPayDebt() {
    lashScene();
    var debt = num("LASH_DEBT");
    spend(debt);
    setF("LASH_DEBT", 0);
    output("You hand Dr. Lash a chit for the " + debt + " credits you still owe him. He pockets it without looking up. " + say("Finally. We’re square, Steele."));
    next(mainGameMenu);
  }

  // =====================================================================
  //  DR. LESSAU ROUTE
  //  LESSAU stage: 1 asked (needs eggs), 2 has sample case, 3 samples delivered (5 days),
  //  4 cures shown (Shelly declined), 5 Shelly thinking (48h), 6 done.
  // =====================================================================

  function lessauAsk() {
    lessauScene();
    output(p(
      "You explain about your crewmate, Shelly Brunel, and about how she took an early Ovilium transformative and was forever changed as a result- you’re hoping he can reverse the changes.",
      say("Changed? How so?") + " Lessau asks, preparing his codex and a stylus to take notes. He’s clearly interested, which you take as a good sign.",
      "You explain about the eggs and how they replace themselves damn near immediately rather than eventually going away like in the normal transformative. You also explain the bunny ears, bunny tail and changed hair color to a cotton candy blue. He types it all down, then asks you a question.",
      say("When you can, I’d like to take a look at her changes for her, see what I can do genetically, but I’ll need samples of each kind of egg she produces and spit, hair, blood and skin samples. Start with the eggs, and then I’ll give you vials to get the samples into afterwards.") + " You nod, showing you understand what you must do."
    ));
    setF("LESSAU", 1);
    next(mainGameMenu);
  }
  function eggProgressAfterAssist() {
    // After Shelly's own Assist scene, remind the player which egg colours Dr. Lessau still needs.
    if (!enabled() || f("FAILED") || f("CURED") || num("LESSAU") !== 1) return;
    var miss = missingEggs();
    if (miss.length) output("\n\n<i>(Dr. Lessau’s egg samples: still missing " + miss.join(", ") + ".)</i>");
    else output("\n\n<i>(You have one of each small egg colour. Take them to Dr. Lessau.)</i>");
  }
  function lessauGiveEggs() {
    lessauScene();
    output(p(
      say("Ah! Wonderful! Thank you, [pc.name]. Now...") + " He turns around, and slithers over to a laboratory desk, then comes back, giving you five vials. " + say("With all these eggs being produced by her, there’s more than likely a candy shop of sweetened fluids also being produced by her body. I’ll need a blood sample, a spit sample, a dead skin sample, a hair or nail clipping sample, and a vaginal secretion sample. Get them however you wish, but I’ll need these to proceed- and they need to be from Shelly, no one else, of course.") + " He hands you a protected case of vials! It’s in your key items now.",
      "You thank Dr. Lessau, and put the case in your pack, then prepare to continue back to what you were doing before."
    ));
    takeEggs();
    giveKey("Lessau’s Sample Case", "Five empty sample vials from Dr. Lessau, for Shelly’s blood, spit, skin, keratin and secretions.");
    setF("LESSAU", 2);
    next(mainGameMenu);
  }
  function lessauSyringe() {
    lessauScene();
    output(say("Oh! I completely forgot! I meant to give you that, I apologize, [pc.name].") + " He slithers back over to another lab workstation in his office, and grabs a capped needle with a syringe stopper and a short tube with an end that pretty well seals to a vial if needed. It has a lever on the side to draw blood up. Then he weaves back over, holding it out in his hands, saying, " + say("Be careful with this. Just pull this lever on the side slowly, and it will withdraw her blood. Make sure you get medical healing supplies before using this. A medical spray is usually enough to close the wound.") + " He smiles as you gently put the capped syringe in a small pocket in your pack, then you nod at him in understanding, saying you’ll get something to use to heal her before gathering that sample. Then you sling your pack onto your back again, and you’re ready to return to what you were doing.");
    setF("SYRINGE", 1);
    giveKey("Lessau’s Blood Syringe", "A capped syringe with a side lever for drawing blood.");
    next(mainGameMenu);
  }
  function shellyGatherSamples() {
    shellyScene();
    var t = p(
      "You tell Shelly that Dr. Lessau needs samples to figure out how to cure her. She blinks at you, then says " + say("Since when have you been working on this?") + " You respond how long it’s been, which is since you talked to her about a cure quite a time ago.",
      say("...Wh- What if I don’t want to be cured?") + " You say it can’t hurt to make the cure, then decide after whether to take it or not. She sighs, and asks " + say("What kind of samples did you need?") + " You tell her- basically all the kinds. Keratin, blood, vaginal secretions, spit, and skin. She looks at you with a somewhat startled look. " + say("Blood? Please tell me you have some kind of tool for that.")
    );
    if (num("SYRINGE") === 1) {
      t = p(t,
        "You pull out Lessau’s syringe and show her the lever. She lets out a relieved breath. " + say("Oh, thank the stars. Okay. Let’s do the easy ones first."),
        "You two start to work on getting the samples. She clips a fingernail for the keratin sample, spits in one of the other sample vials, and clips off some dead heel skin from her foot for the dead skin sample. Only the blood is left."
      );
    } else {
      t = p(t,
        "You open your mouth... only to close it again, and hang your head. You mumble out an apology for not having anything to take out the blood with.",
        say("You should be sorry, [pc.name]. I’m... okay with getting the rest of the samples, but until I don’t have to cut into myself for a blood sample, I’m not comfortable with you taking blood. Okay?"),
        "You nod, raise your head, and you two start to work on getting the rest of the samples. She clips a fingernail for the keratin sample, spits in one of the other sample vials, and clips off some dead heel skin from her foot for the dead skin sample. You now have a partially filled sample case! Maybe get something to help with that blood sample, though. Lessau should have something, right?"
      );
    }
    output(t);
    setF("PARTIAL", 1);
    clearMenu();
    if (num("SYRINGE") === 1) addButton(0, "Blood Sample", shellyBlood, "Blood Sample", "Gather the remaining blood sample from Shelly.");
    else addButton(0, "Next", toTalk);
  }
  function healOptions() {
    var o = [];
    if (findItem(POULTICE) >= 0) o.push("poultice");
    if (findItem(MEDKIT) >= 0) o.push("medkit");
    if (num("BANDAIDS") === 1) o.push("bandaid");
    return o;
  }
  function shellyBlood() {
    shellyScene();
    output("You gently pull out from your pack the syringe from Lessau, and say that it’s an easy-to-use tool for gathering half a vial of blood. You say you’ll try to be gentle and do it from a vein. You’ve seen it done enough times during your childhood and out here on the rush that it shouldn’t be too hard, right? Shelly asks if you have something to heal her with.");
    clearMenu();
    if (healOptions().length) addButton(0, "You do.", healMenu, "You do.", "Give Shelly something to heal her.");
    else addDisabledButton(0, "You do.", "You do.", "You need a Healing Poultice, one of Bianca’s medkits, or a bandaid.");
    addButton(1, "You don’t.", shellyNoHeal, "You don’t.", "You don’t have any healing items. Shame.");
  }
  function healMenu() {
    var o = healOptions();
    clearMenu();
    var slot = 0;
    if (o.indexOf("poultice") >= 0) addButton(slot++, "Poultice", function () { shellyDrawBlood("poultice"); }, "Healing Poultice", "Give Shelly a healing poultice.");
    if (o.indexOf("medkit") >= 0) addButton(slot++, "Medkit", function () { shellyDrawBlood("medkit"); }, "Bianca’s Medkit", "Give Shelly one of Bianca’s healing medkits.");
    if (o.indexOf("bandaid") >= 0) addButton(slot++, "Bandaid", function () { shellyDrawBlood("bandaid"); }, "Bandaid and Cotton Ball", "Give Shelly a bandaid and a cotton ball.");
    addButton(14, "Back", shellyBlood);
  }
  function shellyNoHeal() {
    shellyScene();
    output("Shelly frowns. " + say("You might want to get some cotton balls and a bandaid from the bathroom at the least in that case. I’ll wait, don’t worry.") + "\n\nOff you go! <i>(The shower cabinet is right by her bunk.)</i>");
    setF("NEED_BANDAIDS", 1);
    next(toCabin);
  }
  function showerCabinet() {
    shellyScene();
    output("You open the cabinet in the shower right beside Shelly’s bunk. You grab a box of bandaids and a cotton ball from the plastic jar of them, pocketing them for the time being in your key items. You can go back to Shelly now.");
    setF("BANDAIDS", 1);
    setF("NEED_BANDAIDS", 0);
    giveKey("Bandaids and Cotton Balls", "A box of bandaids and some cotton balls from the ship’s shower cabinet.");
    next(toCabin);
  }
  function shellyDrawBlood(kind) {
    shellyScene();
    var ending;
    if (kind === "bandaid") {
      ending = "holds a cotton ball on her arm, waiting for you to put a bandaid on. You do so once your backpack is safely secured.";
      dropKey("Bandaids and Cotton Balls");
      setF("BANDAIDS", 0);
    } else if (kind === "medkit") {
      ending = "sprays the healing spray you gave her on her wound. It quickly knits up.";
      useItem(MEDKIT);
    } else {
      ending = "holds the poultice on her wound until it heals. A minute or so before you leave, she’s already healed. That stuff is potent!";
      useItem(POULTICE);
    }
    output(p(
      say("Thanks, [pc.name]. I’ll use this once I’m done giving blood.") + " She takes it from you, and you proceed to take blood from Shelly, piercing her right arm’s vein as quickly but gently as possible, giving a warning as you do. She flinches a little, but otherwise doesn’t move. You pull the lever on the side, gently and slowly, then pull the needle out once you have the needed half-vial of blood. You notice that her blood has little flecks of pink and blue in it... interestingly enough.",
      "You now have the blood sample from Shelly you need! You pocket the closed vial, and put the used syringe back into your pack, then sling it back on, as Shelly " + ending
    ));
    setF("BLOOD", 1);
    next(toTalk);
  }
  function lessauGiveBlood() {
    lessauScene();
    output(p(
      say("Aha! Thank you, [pc.name]!") + " he says, as he takes your used syringe and the full sample case. " + say("I’ll see what I can do, but it’s likely to take about five days. Come back then to find out what I’ve made. I’ll send you an email when it’s done. Feel free to peruse my shop or find something else to do in the meantime."),
      "You shrug, and nod."
    ));
    dropKey("Lessau’s Sample Case");
    dropKey("Lessau’s Blood Syringe");
    setF("LESSAU", 3);
    setF("LESSAU_DUE", now() + 5 * DAY);
    next(mainGameMenu);
  }
  function lessauAskCures() {
    lessauScene();
    output(p(
      "<b>Eureka! That cure you’ve wanted? I’ve finished!</b>",
      "<i>[pc.name] Steele,\n\nI’ve finished a few different versions of the cure for your crewmate you’ve been hoping for. Come on by my laboratory to see the results.\n\nBest,\n\n-Dr. Lessau</i>",
      "Dr. Lessau nods, and says, " + say("So you got my email? Very good. I have a few different ways I could go about this, but if you’d rather Shelly be listening for the explanation, she can come down here with you?")
    ));
    clearMenu();
    if (shellyOnCrew()) addButton(0, "Bring Shelly", lessauBringShelly, "Bring Shelly Back", "Go tell Shelly that the cures are ready and bring her back to Lessau’s laboratory. Takes an hour.");
    else addDisabledButton(0, "Bring Shelly", "Bring Shelly Back", "Shelly needs to be aboard your ship.");
    addButton(14, "Later", mainGameMenu, "Later", "Come back with Shelly another time.");
  }
  function lessauBringShelly() {
    lessauScene();
    passTime(HOUR);
    var paw = "[pc.hand]";
    output(p(
      "You go back up the elevator, go back to your ship, and tell Shelly that her cures are ready. She looks a little trepidatious, but takes your " + paw + " and follows you back down to the surface.",
      "The fast elevator spooks her a bit, but once she gets used to it, the novelty wears off. Her rabbit ears flatten for a moment as the elevator’s thrusters go down planetside.",
      "Once you get to the surface again with a “Ding!” from the elevator, you go to the right within the elevator building and enter the Steele Tech Laboratory. Once inside, the workers turn and blink at your new friend, but otherwise wisely don’t comment." + (workday() ? " Walt wags his tail while at his desk, sniffing the air, no doubt smelling the sweetness that she gives off." : ""),
      "You enter Dr. Lessau’s lab, and hold the door for your lover. She smiles a little nervously at you before entering the room.",
      say("So! This is your crewmate, hmm? The way you act around her... Well, let’s just say you’re both more than that now, I would believe.") + " Lessau’s voice comes from around the corner, and as she sees his looming, snake-like form, she involuntarily shivers... shuddering in slight fear. She whisper-shouts " + say("This is who is going to be curing me?!") + " You nod, gently murmuring and reassuring her not to judge a book by the cover.",
      "Lessau smiles, blessedly closed-mouthed, at the rabbit-girl before him. Then, he reaches into his pocket. Three vials come out- one red, one blue, and one pink. " + say("Here are the three cures, Shelly. I will explain, if you want to sit down over there.") + " He points to a reclining chair, table and couch nearby to the lab station. Shelly nods, leaning on you a bit as you walk over. She’s shaking like a leaf, poor thing."
    ));
    next(lessauSitDown, "Sit Down", "Lessau will explain now.");
  }
  function lessauSitDown() {
    lessauScene();
    var trust = Math.max(0, Math.min(10, Number(flags.TN_SHELLY_TRUST) || 0));
    var trustLine = trust >= 10 ? ", trusting you completely," : trust >= 7 ? ", trusting you a lot," : trust >= 5 ? ", trusting you as much as she can," : ",";
    var yes = roll(75); // rerolled every time this scene runs, so it can be save-scummed
    var t = p(
      "As you both sit on the couches, Shelly curls into you" + trustLine + " but still no doubt nervous about what happens next.",
      "Lessau sets the cures on a tray, then brings the tray over to the table and sets it down on it. He then lowers himself down on his haunches in front of the chair, allowing himself to curl up on it. Then he begins explaining.",
      say("Let’s start with the easiest one. Pink will keep all of your rabbit features and your sweet fluids but remove the eggs, keeping your fertility intact.") + " He pauses, pushing that one forward on the tray- doing this for each consecutive cure he explains. Then he continues, " + say("Red will remove the sweet fluids, the eggs, but keep your rabbit ears and tail intact. And finally, Blue will remove everything and return it to normal human proportions, changing your ears back to human and removing your tail.") + " He pauses. " + say("Have you come to a decision on whether you’d like to take the cure at all?"),
      "You glance back at her. She seems less afraid now, and you can see the resolve in her eyes. The shaking stops. " + "<i>“I... want to be able to have children. I... didn’t think I’d ever get the chance. "
    );
    clearMenu();
    if (yes) {
      t += "I would like to have the cure, but can I take them with me now, and think about which I want to take?”</i>\n\nLessau nods. " + say("I’ll put them in a case for you, Shelly. That is fine by me. They’re yours to keep.") + " You ask if you need to pay Lessau anything, for services rendered. " + say("If you wanted to pay me, you can pay me 5k credits for each version of the cure. If you don’t have enough, you can pay me back later.") + " You nod, and...";
      output(t);
      addButton(0, "Pay Later", function () { lessauPay(false); }, "Pay Him Later", "Pay him when you have the chance and funds to.");
      if (credits() >= LESSAU_PRICE) addButton(1, "Pay Now", function () { lessauPay(true); }, "Pay him now", "Pay Dr. Lessau 15,000 credits.");
      else addDisabledButton(1, "Pay Now", "Pay him now", "You need 15,000 credits.");
    } else {
      t += "But I think I like the way I am now. I’ve... gotten used to it, I suppose.”</i> You sigh, somewhat disappointed, but you try to not let it show. You smile, and thank Lessau for what he’s done, but you won’t be needing the cures it seems.\n\n" + say("Very well. It was a fun experiment, in any case!") + " He takes the cures away and you both head back to the ship.";
      output(t);
      setF("LESSAU", 4);
      addButton(0, "Continue", toShipDock, "Continue", "Return to the ship.");
    }
  }
  function lessauPay(now_) {
    lessauScene();
    var advice = say("Choose wisely, young one. If you choose the blue, you won’t be able to choose again. The others you can start with and then later on choose the blue cure if you’d like, but once you choose to take one, there’s no going back.");
    var limb = hasWings() ? "wing" : "arm";
    var t;
    if (now_) {
      spend(LESSAU_PRICE);
      t = p(
        "You pay Dr. Lessau, and thank him profusely. " + say("You’re welcome, [pc.name]. It’s been a pleasure working with you, and I look forward to when you actually become my superior!") + " He smiles widely, then stands up and slithers over to his desk to grab a three-vial case. He puts the cures in, then closes the case and gives them to Shelly.",
        "He gives her some advice about the cures, pressing her hand with his as she holds the case. " + advice + " He smiles, pats her shoulder as she stares at him and then later down at the case, and then goes back to minding the shop."
      );
    } else {
      setF("LESSAU_DEBT", LESSAU_PRICE);
      t = p(
        "You explain you don’t have the funds right this moment, but you’re willing to pay him when you can.",
        "He nods, says " + say("Very well,") + " then slithers over to his desk to grab a three-vial case. He comes back over and puts the cures in, then closes the case and gives them to Shelly. He then gives some sage advice about the cures, pressing onto her hand as she holds the case with his own, " + advice + " He smiles, pats her shoulder as she stares at the case, and then goes back to minding the shop."
      );
    }
    t = p(t, "You and Shelly go back to the ship. She carries it carefully as the elevator goes up, like there isn’t a mold of padding between the vials and the metal of the carrier case. You hold onto her shoulders from the side with one " + limb + ", trying to provide some grounding as you both take the elevator back up and walk back to " + shipName() + ".");
    output(t);
    setF("LESSAU", 5);
    setF("LESSAU_DUE", now() + 2 * DAY);
    recover(2 * DAY, "Shelly is thinking about which cure she wants, and it will likely take 48 hours for her to recover enough from taking the cure to want to do anything with you, not to mention anyone else.");
    next(toShipDock, "Continue", "Return back to the ship console, give Shelly some time to think. It shouldn’t take longer than 48 hours.");
  }
  function lessauPayDebt() {
    lessauScene();
    var debt = num("LESSAU_DEBT");
    spend(debt);
    setF("LESSAU_DEBT", 0);
    output("You transfer the " + debt + " credits you owe Dr. Lessau. He beams. " + say("Much appreciated, [pc.name]! How is Shelly doing?") + " You tell him, and he listens with real interest.");
    next(mainGameMenu);
  }
  function shellyCureReveal() {
    shellyScene();
    var kind = pick(["pink", "red", "blue"]); // even odds, chosen when you walk in
    var t;
    if (kind === "pink") {
      t = p(
        say("Hey there, [pc.name]! I decided to take the pink one for now! I guess that means I can start taking Sterilex the normal way, huh?") + " She giggles, then pops a pill- seemingly one of the very Sterilex pills she was just talking about.",
        say("If you want to have some fun with me, feel free to now!") + " You grin along with her, wondering if you’ll take her up on that offer now or some other time."
      );
    } else if (kind === "red") {
      t = say("Hey, [pc.name]! I got rid of all the sweets in my fluids and chose the red cure! Hope you don’t mind the salt, hehe!") + " She pauses. " + say("I guess that means I can start taking Sterilex the normal way, huh?") + " She giggles, and grabs a Sterilex pill from her shop setup, popping it into her mouth and swallowing. " + say("Feel free to have some fun with me whenever you’d like!") + " You grin with her, and think about what you want to do next.";
    } else {
      t = p(
        say("Hey there, [pc.name]! Welcome back here! It’s been a while, hasn’t it?") + " She gives a little giggle. " + say("I decided to completely go back to normal! No more bunny jokes, or saying ‘oh, you’re so cute!’") + " She rolls her eyes. " + say("Now I’m back to the basics of being human. I guess I can take a Sterilex and keep it going until we both want kids! Taking it the vanilla way, hehee!") + " She steps over to the Sterilex box on her shelf, takes a pill out and swallows it.",
        say("Ready for some fun whenever you are!") + " You grin, laughing with her, and then try to decide what you’d like to do with her, if anything."
      );
    }
    applyShellyCure(kind);
    setF("LESSAU", 6);
    output(t);
    next(toCabin);
  }

  // =====================================================================
  //  HOOKS INTO SHELLY'S SHIP MENUS (Shelly-Custom-Talk-Menu.js)
  // =====================================================================

  function addTalkButtons() {
    if (!enabled()) return;
    if (f("FAILED")) { addDisabledButton(2, "Cure?", "Cure?", "Shelly doesn’t want to hear about cures from you anymore."); return; }
    if (f("CURED")) { addDisabledButton(2, "Cure?", "Cure?", "Shelly is already cured."); return; }
    var lash = num("LASH"), les = num("LESSAU");
    if (lash === 1) addButton(7, "Lash Cure?", lashPitch, "Doctor Lash Cure?", "Explain about Dr. Lash’s cure. This will start something you can fail, so you should save before doing this.");
    else if (lash === 3) {
      if (now() >= num("LASH_DUE")) addButton(7, "Decision?", lashDecision, "Cure Decision?", "Ask Shelly about her decision with Dr. Lash.");
      else addDisabledButton(7, "Decision?", "Cure Decision?", "Shelly is still thinking it over. Give her another " + hoursLeft(num("LASH_DUE")) + " hours.");
    } else if (lash === 5) addButton(7, "Change Mind", lashChangeMind, "Change your Mind", "Tell Shelly you changed your mind and you’ll go get sterilized. This is permanent for this save. Fertility and virility transformatives and implants do nothing.");

    if (les === 2 && num("PARTIAL") !== 1) addButton(8, "Samples", shellyGatherSamples, "Gather Samples", "Gather Dr. Lessau’s samples from Shelly.");
    else if (les === 2 && num("BLOOD") !== 1) {
      if (num("SYRINGE") === 1) addButton(8, "Blood Sample", shellyBlood, "Blood Sample", "Gather the remaining blood sample from Shelly.");
      else addDisabledButton(8, "Blood Sample", "Blood Sample", "Shelly won’t give blood without a proper tool. Ask Dr. Lessau.");
    }
  }

  function patchCabinMenu() {
    // Called right after the original cabin menu is built.
    if (!enabled()) return;
    var cured = f("CURED");
    if (cured) {
      addDisabledButton(1, "Assist", "Assist", "No more eggs to lay!");
      addButton(2, "Sex", window.tnShellyCureSexMenu, "Sex", "Have some fun with Shelly.");
    }
    if (num("NEED_BANDAIDS") === 1 && num("BANDAIDS") !== 1) addButton(5, "Shower Cab.", showerCabinet, "Shower Cabinet", "Grab a bandaid and cotton ball from the shower cabinet.");
  }

  function crewButton(slot) {
    // Replaces Shelly's crew-console button while she's away from her bunk.
    var lash = num("LASH");
    if (lash === 6) {
      if (onTarkus()) {
        addButton(slot, "Shelly", lashReady, "Ready?", "Ask if Shelly is ready to go to Dr. Lash’s lab.");
        return "\n\nShelly is waiting by the airlock, ready to go see Dr. Lash.";
      }
      addDisabledButton(slot, "Shelly", "Shelly", "Shelly is waiting by the airlock. Fly to Tarkus.");
      return "\n\nShelly is waiting by the airlock for you to land on Tarkus.";
    }
    if (lash === 7) {
      addDisabledButton(slot, "Shelly", "Shelly", "Shelly is waiting by the airlock until you’ve paid Dr. Lash.");
      return "\n\nShelly is waiting by the airlock until you’ve paid Dr. Lash.";
    }
    if (recovering()) {
      var msg = f("RECOVER_MSG") + " Wait another " + hoursLeft(num("RECOVER_UNTIL")) + " hours.";
      addDisabledButton(slot, "Shelly", "Shelly", msg);
      return "\n\n" + msg;
    }
    return null;
  }

  // =====================================================================
  //  DOCTOR MENUS: watch the game build Lash's and Lessau's menus and add buttons
  // =====================================================================

  function doctorButtons(npc) {
    var list = [];
    if (npc === "lash") {
      if (questOpen() && num("LASH") === 0) list.push([true, "Shelly Cure?", lashAsk, "Shelly Cure?", "Ask Doctor Lash if he can procure a cure for Shelly."]);
      if (num("LASH") === 7) {
        if (credits() >= LASH_PRICE) list.push([true, "Pay Him", function () { lashPay(true); }, "Pay Him", "Pay Dr. Lash 50,000 credits for his service."]);
        else list.push([false, "Pay Him", null, "Pay Him", "You need 50,000 credits."]);
      }
      if (num("LASH_DEBT") > 0) {
        if (credits() >= num("LASH_DEBT")) list.push([true, "Pay Debt", lashPayDebt, "Pay Debt", "Pay Dr. Lash the " + num("LASH_DEBT") + " credits you owe him."]);
        else list.push([false, "Pay Debt", null, "Pay Debt", "You owe him " + num("LASH_DEBT") + " credits."]);
      }
    } else if (npc === "lessau") {
      var les = num("LESSAU");
      if (questOpen() && les === 0) list.push([true, "Shelly Cure?", lessauAsk, "Shelly Cure?", "Ask Doctor Lessau if curing Shelly of her eggs would be an option with him."]);
      if (!f("CURED") && !f("FAILED") && les === 1) {
        var miss = missingEggs();
        if (!miss.length) list.push([true, "Give Eggs", lessauGiveEggs, "Give Eggs", "Give one of each of Shelly’s small eggs to Dr. Lessau."]);
        else list.push([false, "Give Eggs", null, "Give Eggs", "Assist Shelly to collect one of each small egg colour. Still missing: " + miss.join(", ") + "."]);
      }
      if (!f("CURED") && !f("FAILED") && les === 2 && num("SYRINGE") !== 1) list.push([true, "Syringe?", lessauSyringe, "Blood Syringe?", "Ask about getting a syringe so Shelly doesn’t have to be cut to get the blood sample."]);
      if (!f("CURED") && !f("FAILED") && les === 2 && num("BLOOD") === 1) list.push([true, "Samples", lessauGiveBlood, "Give Samples", "Give Dr. Lessau Shelly’s blood sample and the rest of the case."]);
      if (!f("CURED") && !f("FAILED") && les === 3) {
        if (now() >= num("LESSAU_DUE")) list.push([true, "Ask Cures", lessauAskCures, "Ask about Cures", "Check in on Dr. Lessau’s cures for Shelly."]);
        else list.push([false, "Ask Cures", null, "Ask about Cures", "Dr. Lessau needs another " + hoursLeft(num("LESSAU_DUE")) + " hours."]);
      }
      if (num("LESSAU_DEBT") > 0) {
        if (credits() >= num("LESSAU_DEBT")) list.push([true, "Pay Debt", lessauPayDebt, "Pay Debt", "Pay Dr. Lessau the " + num("LESSAU_DEBT") + " credits you owe him."]);
        else list.push([false, "Pay Debt", null, "Pay Debt", "You owe him " + num("LESSAU_DEBT") + " credits."]);
      }
    }
    return list;
  }
  // Called from the Replace anchors in Dr. Lash's and Dr. Lessau's menus. Returns the next free slot.
  window.tnShellyCureDoctorButtons = function (npc, slot) {
    if (!enabled()) return slot;
    var list = doctorButtons(npc);
    for (var i = 0; i < list.length && slot < 14; i++, slot++) {
      if (npc === "lash" && slot === 4) slot++; // Lash's bothrioc quest button
      var b = list[i];
      if (b[0]) addButton(slot, b[1], b[2], b[3], b[4]);
      else addDisabledButton(slot, b[1], b[3], b[4]);
    }
    return slot;
  };

  // =====================================================================
  //  POST-CURE SEX MENU (author: Techy-Nest)
  //  Six scenes from Shelly-PostCure-Sex-Draft-v2.md. Every scene supports
  //  bipedal, taur and naga Steele, herms, cockvines and cunt-snakes.
  // =====================================================================

  function cureKind() { return f("CURED") || ""; }
  function byCure(map) { var k = cureKind(); return map[k] !== undefined ? map[k] : (map.other || ""); }
  function bunny() { return cureKind() !== "blue"; }
  function affection() { return Math.max(0, Math.min(10, Number(flags.TN_SHELLY_AFFECTION) || 0)); }

  function bodyType() {
    try { if (pc.isTaur && pc.isTaur()) return "taur"; } catch (err) {}
    try { if (pc.isNaga && pc.isNaga()) return "naga"; } catch (err2) {}
    return "biped";
  }
  function gear() {
    var g = { cock: false, vag: false, tailCock: false, tailCunt: false, knot: false };
    try { g.cock = pc.hasCock(); } catch (err) {}
    try { g.vag = pc.hasVagina(); } catch (err) {}
    try { g.tailCock = !!(pc.hasTailCock && pc.hasTailCock()); } catch (err) {}
    try { g.tailCunt = !!(pc.hasTailCunt && pc.hasTailCunt()); } catch (err) {}
    try { g.knot = g.cock && pc.hasKnot && pc.hasKnot(0); } catch (err) {}
    g.herm = g.cock && g.vag;
    g.phallus = g.cock || g.tailCock;
    return g;
  }
  function longTongue() {
    try { if (pc.hasLongTongue && pc.hasLongTongue()) return true; } catch (err) {}
    try { if (pc.hasTongueFlag && GLOBAL.FLAG_LONG !== undefined && pc.hasTongueFlag(GLOBAL.FLAG_LONG)) return true; } catch (err2) {}
    return false;
  }
  function loadSize() {
    var q = 0;
    try { q = Number(pc.cumQ()) || 0; } catch (err) {}
    if (q <= 500) return { size: "small", big: false, huge: false };
    if (q <= 1000) return { size: "fair-sized", big: false, huge: false };
    if (q <= 1500) return { size: "large", big: true, huge: false };
    if (q <= 2000) return { size: "extra-large", big: true, huge: false };
    return { size: "huge", big: true, huge: true };
  }
  // A cockvine stands in for a missing cock.
  function cockSwap(text, g) { return g.cock ? text : text.split("[pc.cock]").join("[pc.tailCock]"); }

  function sexBust() {
    if (typeof showBust === "function") showBust(curedBustName(true) || (window.tnShellyBustName ? window.tnShellyBustName(true) : "SHELLY_NUDE"));
    showName("Shelly");
    author("Techy-Nest");
  }
  function sexScene() { clearOutput(); sexBust(); }

  function firstTimeDone() { return num("SEX_FIRST") === 1; }

  window.tnShellyCureSexMenu = function () {
    if (!enabled() || !cureKind()) { toCabin(); return; }
    clearOutput(); sexBust();
    var g = gear();
    output("Shelly looks up as you sit down beside her on the bunk, and she knows exactly what you have in mind. " + say("Oh? What did you want to do, [pc.name]?"));
    clearMenu();
    if (!firstTimeDone()) {
      addButton(0, "First Time", sexFirstTime, "First Time", "Your first time with Shelly since the cure.");
      addButton(14, "Back", toCabin, "Back", "Return to her cabin.");
      return;
    }
    actButtons(g, false);
  };

  function actButtons(g, first) {
    clearMenu();
    if (!g.phallus) addDisabledButton(0, "Make Love", "Make Love", "Requires a phallus.");
    else if (affection() < 5) addDisabledButton(0, "Make Love", "Make Love", "Shelly needs to feel closer to you first. (Affection 5+)");
    else addButton(0, "Make Love", function () { sexMakeLove(first); }, "Make Love", "Slow, face-to-face lovemaking.");
    if (g.phallus) addButton(1, "She Rides", function () { sexSheRides(first); }, "She Rides", "Let Shelly take the lead on top.");
    else addDisabledButton(1, "She Rides", "She Rides", "Requires a phallus.");
    addButton(2, "Eat Her Out", function () { sexEatOut(first); }, "Eat Her Out", "Go down on Shelly.");
    if (g.cock || g.vag || g.tailCock || g.tailCunt) addButton(3, "Her Mouth", function () { sexHerMouth(first); }, "Her Mouth", "Let Shelly use her mouth on you.");
    else addDisabledButton(3, "Her Mouth", "Her Mouth", "You need something for her to put her mouth on.");
    if (g.vag || g.tailCunt) addButton(4, "Grind", function () { sexGrind(first); }, "Grind", "Grind against Shelly.");
    else addDisabledButton(4, "Grind", "Grind", "Requires a vagina or a tail-cunt.");
    if (!first) addButton(14, "Back", toCabin, "Back", "Return to her cabin.");
  }

  // ---------- 1. First Time ----------
  function sexFirstTime() {
    sexScene();
    var t = p(
      "Shelly is sitting cross-legged on her bunk when you come in. " + byCure({
        lash: "She laughs at herself ruefully, staring down at her hands.",
        other: "She’s turning an empty Sterilex blister pack over and over in her fingers. She tosses it toward the bin, misses, and laughs at herself."
      }),
      say("I keep waiting for the cramps,") + " she admits. " + say("For the pressure. Every few hours, for years, there was always another egg on the way. And now there just… isn’t.") + " She presses a palm to her flat stomach like she still doesn’t quite believe it. " + byCure({
        lash: say("Nothing in there at all, now. Forever. That’s going to take some getting used to.") + " She shivers as her own fingers brush her skin. " + say("Everything’s so much more… sensitive, too. Dr. Lash didn’t mention that part."),
        other: say("Just me in here. And when I want more than me, that’ll be my choice.")
      }),
      "She looks up at you. " + (bunny() ? "Her ears flick forward" : "Where her ears used to flick, she tucks her hair back instead") + ", and her grin turns shy. " + say("I want to know what it feels like now. With you. Without worrying about what happens after. Will you…?"),
      "You don’t need to be asked twice."
    );
    output(t);
    actButtons(gear(), true);
  }
  function firstClosing(first) {
    if (!first) return "";
    setF("SEX_FIRST", 1);
    return "\n\nAfterward she lies tangled with you, unusually quiet. " + say("That was the first time in years I didn’t have to think about my body doing something without me,") + " she murmurs into your shoulder. " + say("Thank you, [pc.name]. For finding a way.");
  }

  // ---------- shared climax afterglow for cock scenes ----------
  function knotAfter(g, how) {
    var load = loadSize();
    if (g.knot) {
      return "\n\n" + (how === "ride" ? "She flops down onto your chest, and you stay tied together" : "You stay tied, spooning her") + ", waiting for your knot to go down. It’s a while before it slips free with a wet pop, and she giggles, then moans as your " + load.size + " load finally has room to " + (load.huge ? "rush out onto the bed." : load.big ? "rush out." : "leak out.");
    }
    return "\n\n" + (how === "ride" ? "She flops down onto your chest with a happy sigh, and you ease" : "You chuckle and spoon her for a bit, easing") + " your [pc.cockLength]-inch " + (g.cock ? "[pc.cock]" : "[pc.tailCock]") + " out and letting part of your " + load.size + " load " + (load.huge ? "flood out onto the bed." : load.big ? "rush out onto the bed." : "leak out.");
  }
  function pillLine() {
    var fam = window.tnShellyFamily && window.tnShellyFamily.pillLine();
    if (fam) return fam;
    return byCure({ lash: "She hums contentedly at the warmth, with nothing to worry about now.", other: say("Good thing I took my pill,") + " she teases, breathless." });
  }

  // ---------- 2. Make Love ----------
  function sexMakeLove(first) {
    sexScene();
    var g = gear(), body = bodyType(), t;
    if (body === "taur") {
      t = "Your tauric body won’t fit on her bunk, so Shelly scoots to the edge of the mattress and lies back with her legs spread, grinning up at you. " + say("Okay, big [pc.raceShort]. Walk forward.") + " You step over her, bracing your forelegs on either side of the bunk while she reaches up beneath your barrel to guide your [pc.cock] into place. You can’t see her face from up here, only hear her, and she is <i>loud</i> as you push into her. She wraps her legs around your flanks as far as they’ll go and uses them to pull you deeper with every thrust." + (g.herm ? " She can just reach your [pc.vagina] beneath you, and she works two fingers into it in time with your thrusts." : "");
    } else if (body === "naga") {
      t = "You coil your long tail beneath her and around her, lifting Shelly into a nest of warm scales so the two of you are face to face, her legs draped over your coils. She runs her hands down your scaled length in wonder as you lower her onto your [pc.cock], letting the coils do the slow work of rocking her up and down. " + say("Oh, this is cheating,") + " she gasps. " + say("I’m never going to want to do it any other way.") + (g.herm ? " Her heel finds your slit as she rocks, pressing and rubbing until you’re as breathless as she is." : "");
    } else {
      t = p(
        "You ease Shelly back onto her bunk. She pulls you down with her, legs looping around your hips, chocolate skin warm under your hands. With no swollen, egg-heavy belly between you anymore, you can lie chest to chest with her, close enough to feel her heartbeat speed up as your [pc.cock] slides along her slick folds." + (g.herm ? " Your own [pc.vagina] is already wet just from the press of her thigh against it, and she notices, sliding a hand down between you to tease it." : ""),
        say("Slowly,") + " she breathes. " + say("I want to feel all of it.")
      );
    }
    t = p(t,
      (body === "biped" ? "You sink into her an inch at a time. " : "") + "She’s tight and wet and shaking, and when you bottom out she lets out a long, shuddering sigh that turns into a giggle. " + byCure({
        pink: "Her arousal smells like spun sugar, sweet enough to make your mouth water.",
        red: "There’s no candy-shop sweetness in the air anymore, just her, warm and musky, and you like it more than you expected to.",
        blue: "Without the bunny ears, every expression shows on her face, and right now that face is pure bliss.",
        lash: "Her dark-tipped ears fold back flat as she arches into you, gasping at every inch. She’s so sensitive now that even your breath on her nipples makes her clench around you."
      }),
      "You find a slow, rolling rhythm together. She kisses you between thrusts, nips your lip, and whispers encouragement until her breath hitches and she clenches around you, cumming with a muffled cry against your neck." + (g.herm ? " Her fingers keep working your [pc.vagina] the whole time, and you cum in both places at once." : "") + " You follow her over soon after" + (g.knot ? ". Your [pc.knot] finally pushes in at the last moment, tying the two of you together intimately as you spill deep inside her." : ", spilling deep inside her.") + " " + pillLine()
    );
    if (g.tailCock && g.cock) t = p(t, "Your [pc.tailCock] isn’t content to stay out of it. It snakes up between you, and Shelly squeaks as it nudges at her. She bites her lip, looks at you, and nods. With a little patience you work it in alongside your [pc.cock], stretching her wonderfully full while she claws at your back.");
    if (g.tailCock && !g.cock) t = p(t, "Shelly takes hold of your [pc.tailCock] in both hands, guides it in herself, and sighs as it squirms deeper, finding every spot that makes her toes curl.");
    if (g.tailCunt) t = p(t, "Your [pc.tailCunt] curls around Shelly’s thigh, hungry and wet. She laughs, catches it, and slides two fingers into it as you move together, pumping in time with your thrusts until you’re both shaking.");
    t = cockSwap(t, g) + knotAfter(g, "spoon") + firstClosing(first);
    if (window.tnShellyFamily) t += window.tnShellyFamily.afterCum(g);
    finishSex(t);
  }

  // ---------- 3. She Rides ----------
  function sexSheRides(first) {
    sexScene();
    var g = gear(), body = bodyType(), t;
    if (body === "taur") {
      t = "Riding a taur takes some creativity. You lie down on the deck on your side, and Shelly climbs over your lower body with a determined look, straddling your hindquarters to reach your [pc.cock]. It’s awkward, then it isn’t, and then she’s grinding against you hard enough to make your hind legs kick." + (g.herm ? " One of her hands slips down to your [pc.vagina] and stays there." : "");
    } else if (body === "naga") {
      t = "You lie back on the floor with your tail stretched out, and Shelly straddles your hips. Your coils curl up around her waist and support her like a living saddle while she rides, and she uses them to brace herself, bouncing faster than she could on her own." + (g.herm ? " She grinds back against your slit with every bounce." : "");
    } else {
      t = "Shelly pushes you flat onto her bunk with surprising strength and swings a leg over your hips. " + say("My turn to drive,") + " she announces. She sinks down onto your [pc.cock] with a long, satisfied groan, then plants her hands on your chest and starts to ride. Without the old weight of eggs, she’s light and bouncy and clearly delighted by it, rising almost all the way off you before dropping back down.";
    }
    var details = [];
    details.push(bunny() ? "Her ears bob with every bounce, and she catches you staring and wiggles them on purpose." : "She tosses her hair back and laughs, enjoying " + (first ? "her newfound lightness and freedom to move." : "how light and free her body feels now."));
    if (cureKind() === "lash") details.push("Every time she comes down she shudders. She’s so sensitive now that she has to stop and catch her breath twice, laughing at herself, before she can keep going.");
    if (g.herm && body === "biped") details.push("She reaches back behind herself and finds your [pc.vagina], rubbing it in rhythm with her bouncing.");
    t = p(t, details.join(" "),
      "She rides you until her thighs shake, then grinds down hard and cums, squeezing you so tightly that you let go at the same moment." + (g.knot ? " She sinks down onto your [pc.knot] as you cum, gasping as it locks her in place on top of you." : "") + (g.herm ? " Your [pc.vagina] clenches as you cum in both places." : "") + " " + pillLine()
    );
    if (g.tailCock && g.cock) t = p(t, "While she rides your [pc.cock], your [pc.tailCock] slides around behind her and teases her " + (bunny() ? "tailhole" : "ass") + " until she begs you to push in.");
    if (g.tailCock && !g.cock) t = p(t, "Shelly sits back against your hips and pulls your [pc.tailCock] forward between her thighs, sinking down onto it and riding it while you watch.");
    if (g.tailCunt) t = p(t, "Your [pc.tailCunt] snakes up her back and latches onto her " + (bunny() ? "fluffy tail" : "shoulder") + ", then slides down to suckle at her fingers. She lets it milk two of her fingers the whole time she rides.");
    t = cockSwap(t, g) + knotAfter(g, "ride") + firstClosing(first);
    if (window.tnShellyFamily) t += window.tnShellyFamily.afterCum(g);
    finishSex(t);
  }

  // ---------- 4. Eat Her Out ----------
  function sexEatOut(first) {
    sexScene();
    var g = gear(), body = bodyType(), t;
    if (body === "taur") t = "Shelly sits at the edge of the bunk, and you lower your forequarters, folding your front legs so your face is level with her lap. She drapes her legs over your shoulders and holds on tightly.";
    else if (body === "naga") t = "You coil low on the deck and lift Shelly on a loop of your tail until she’s sitting at mouth height, supported and spread, with your long tongue free to do its work." + (longTongue() ? " She learns exactly how deep a tongue like yours can reach, and it’s a lesson she won’t soon forget." : "");
    else t = "You kneel at the edge of Shelly’s bunk and pull her hips to the edge. She props herself up on her elbows to watch you, already blushing.";
    t = p(t,
      byCure({
        pink: "She’s as sweet as ever: honeyed, candy-sweet slickness that coats your tongue. You can’t stop. She giggles. " + say("I kept that part for you, you know."),
        red: "She’s salty, musky and real, and she watches you nervously until you groan into her and dive back in. " + (first ? say("Oh thank the stars, you like it.") : say("I’m still glad you like it, for sure.")),
        blue: "She tastes like a woman, simple and clean, and she squirms more than she used to, sensitive in new places.",
        lash: "The candy sweetness has faded to a faint, warm musk. She seems almost shy about it until you show her how much you enjoy it, and then she’s squirming and gasping at every lap of your tongue, far more sensitive than she ever was before."
      }),
      "You lick and suck until she’s tugging at your " + (body === "biped" ? "hair" : "[pc.hair]") + ", thighs clamping around your head, and she cums with a wail that would have embarrassed her back at the bar." + (cureKind() === "lash" ? " She cums twice, the second time almost right after the first, and has to push your head away, laughing and twitching." : "")
    );
    if (g.tailCock) t = p(t, "While you eat her out, your [pc.tailCock] curls up to her lips. Shelly takes it into her mouth gratefully and sucks it in time with your tongue.");
    if (g.tailCunt) t = p(t, "Your [pc.tailCunt] slides up between her breasts, and she plays with it absently, rubbing its lips, sucking on it and dipping her fingers inside, while you work on her.");
    finishSex(t + firstClosing(first), !(g.tailCock || g.tailCunt));
  }

  // ---------- 5. Her Mouth ----------
  function sexHerMouth(first) {
    sexScene();
    var g = gear(), body = bodyType(), t;
    if (body === "taur") {
      t = "Shelly crawls under your barrel and sits on the deck beneath you. You can’t see her, only feel her hands on your flanks and her mouth on your " + (g.herm ? "[pc.cock], then your [pc.vagina], back and forth" : g.cock ? "[pc.cock]" : g.vag ? "[pc.vagina]" : "[pc.tailCock]") + ". Not seeing makes it intensely good, because you can’t predict where she’ll touch next.";
    } else if (body === "naga") {
      t = "You rise up tall on your coils, and Shelly kneels in the curve of your tail, cradled by it, as she works on your " + (g.herm ? "[pc.cock] and the slit beneath it" : g.cock ? "[pc.cock]" : g.vag ? "slit" : "[pc.tailCock]") + ". Your tail tightens around her as you get close.";
    } else {
      t = "Shelly kneels in front of you and looks up with an eager little smile.";
    }
    if (g.herm) {
      t = p(t, "She licks and kisses your thighs, then zeroes in on your [pc.cock], licking it like a lollipop and bobbing up and down on it while she slowly fingers your [pc.vagina]. She gradually picks up speed until you groan into her hair, grasping her head and begging her not to stop. She doesn’t. In fact she speeds up at your moans, and you cum in both places. She swallows your load while her hand is showered with gooey girlcum, then cleans your [pc.cock] dutifully and licks her hand clean as you watch.");
    } else if (g.cock) {
      t = p(t, "She wraps her hand around your [pc.cock], licks a slow stripe up its length, then takes you into her mouth, bobbing and humming until you can’t hold back a groan, and you cum." + (g.knot ? " She wraps both hands around your [pc.knot] and squeezes as you cum, milking every drop." : "") + (cureKind() === "pink" ? " She swallows and licks her lips. " + say("Hmm. Fair trade for all the candy, I think.") : ""));
    } else if (g.vag) {
      t = p(t, "She nuzzles between your [pc.legs] and laps at your [pc.vagina], slow and thorough, until you’re grinding against her face, squealing, and finally cum.");
    }
    if (g.tailCock) t = p(t, g.cock ? "She alternates between your [pc.cock] and your [pc.tailCock], giggling about having “a snack in each hand.”" : "Your [pc.tailCock] snakes around to her, and Shelly takes it in both hands like a prize, sucking and stroking until it floods her mouth.");
    if (g.tailCunt) t = p(t, "Shelly cradles your [pc.tailCunt] in her lap and kisses it, then eats it out as eagerly as she would " + (g.vag ? "your [pc.vagina]" : "anything") + ", until it clenches and drips all over her hands.");
    finishSex(t + firstClosing(first));
  }

  // ---------- 6. Grind ----------
  function sexGrind(first) {
    sexScene();
    var g = gear(), body = bodyType(), t;
    if (!g.vag) {
      t = "Your [pc.tailCunt] slides down between Shelly’s thighs and presses its lips against hers in a slick, sucking kiss. She gasps and grabs your shoulders as it grinds and suckles against her, and she cums riding the strange, wonderful sensation of being kissed there by your tail.";
      finishSex(t + firstClosing(first));
      return;
    }
    if (body === "taur") {
      t = "Scissoring with a taur takes more imagination. Shelly lies back at the edge of the bunk while you straddle her from above, lowering your rear [pc.vagina] until it presses down against her. She grabs your hind legs and grinds up into you until you both find release, shuddering in the afterglow." + (g.cock ? " Your [pc.cock] hangs heavy beneath you, and she wraps a hand around it and strokes it in time." : "");
    } else if (body === "naga") {
      t = "Your coils wrap the two of you together hip to hip, and the slow squeeze of your tail does the grinding for you, pressing your slit against hers in long, rolling waves." + (g.cock ? " Your [pc.cock] slides between her thighs with every squeeze." : "") + " She clings to you and rides the waves until you both cum, one right after the other, held tight in your coils.";
    } else {
      var extra = [];
      if (cureKind() === "pink") extra.push("She’s slick and sweet, and the room starts to smell like a candy store.");
      if (cureKind() === "lash") extra.push("She’s so sensitive now that she’s trembling within a minute, clinging to you.");
      if (g.cock) extra.push("Your [pc.cock] ends up trapped between your bodies, and every roll of her hips strokes it against her stomach.");
      t = p(
        "Shelly pulls you down onto the bunk and hooks a leg over yours, scissoring your hips together until your [pc.vagina] presses against hers. She rocks her hips slowly at first, then faster, both of you gasping as you slide wet against wet." + (extra.length ? " " + extra.join(" ") : ""),
        "She holds your hands and grinds until you both cum, one right after the other." + (g.cock ? " Your [pc.cock] spurts across her flat belly, and she giggles, smearing a finger through it." : "")
      );
    }
    if (g.tailCunt) t = p(t, "Your [pc.tailCunt] slides down between Shelly’s thighs and joins in, its lips pressing against hers in a slick, sucking kiss that leaves her gasping.");
    finishSex(t + firstClosing(first));
  }

  // ---------- Aftercare ----------
  function finishSex(text, noOrgasm) {
    if (window.tnShellyFamily) text = window.tnShellyFamily.sexText(text);
    output(text);
    try { if (!noOrgasm && typeof pc.orgasm === "function") pc.orgasm(); } catch (err) {}
    IncrementFlagSafe("TN_SCQ_SEX_COUNT");
    clearMenu();
    addButton(0, "Next", sexAftercare, "Next", "Rest together for a bit.");
  }
  function IncrementFlagSafe(name) { flags[name] = (Number(flags[name]) || 0) + 1; }
  function sexAftercare() {
    clearOutput();
    if (typeof showBust === "function") showBust(curedBustName(false) || "SHELLY");
    showName("Shelly");
    author("Techy-Nest");
    passTime(20);
    var body = bodyType();
    output(p(
      "You both take a quick twenty-minute nap, " + (body === "taur" ? "with her curled up against your side on the deck" : body === "naga" ? "with her nestled in your coils" : "with you spooning her") + ", to recover. Afterward she insists on doing laundry, so that when she goes to bed later on she won’t " + (cureKind() === "pink" ? "smell sweet sugars quite so much." : "smell sex quite so much."),
      "You smile and leave her to it."
    ));
    clearMenu();
    addButton(0, "Next", mainGameMenu, "Next", "Back to the crew console.");
  }

  // =====================================================================
  //  CURED BUSTS
  //  Images come from TN_ShellyCureBusts.js (window.tnShellyCureBustData).
  //  They're shown through the game's own custom-bust feature
  //  (flags.artistOverrides / flags.pathOverrides), using blob URLs so
  //  the save file only stores a short link.
  // =====================================================================

  var bustUrls = {};
  function bustUrl(key) {
    if (bustUrls[key]) return bustUrls[key];
    var data = window.tnShellyCureBustData && window.tnShellyCureBustData[key];
    if (!data) return null;
    try {
      var b64 = data.slice(data.indexOf(",") + 1), bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      bustUrls[key] = URL.createObjectURL(new Blob([bytes], { type: "image/webp" }));
    } catch (err) {
      bustUrls[key] = data; // fall back to the data URL itself
    }
    return bustUrls[key];
  }
  function bustKey(nude) {
    var k = cureKind();
    if (!k) return null;
    if (k === "red") k = "lash"; // Red uses the Lash art
    return "shelly_cured_" + k + (nude ? "_nude" : "");
  }
  function curedBustName(nude) {
    try { syncBusts(); } catch (err) {}
    var fam = window.tnShellyFamily && window.tnShellyFamily.bustName(nude);
    if (fam) return fam;
    var key = bustKey(nude);
    return key && bustUrl(key) ? key.toUpperCase() : null;
  }
  function setOverride(name, url) {
    if (!flags.artistOverrides) flags.artistOverrides = {};
    if (!flags.pathOverrides) flags.pathOverrides = {};
    var cur = flags.pathOverrides[name];
    if (cur && !cur.tnScq) return; // the player set their own custom art; leave it alone
    if (cur && cur.x1 === url && flags.artistOverrides[name] === "custom") return;
    flags.artistOverrides[name] = "custom";
    flags.pathOverrides[name] = { tnScq: true, x1: url, x2: url, x4: url, originalWidth: 704, originalHeight: 1024, artist: "Techy-Nest", title: "Shelly (cured)", description: "" };
  }
  function clearOverride(name) {
    if (flags.pathOverrides && flags.pathOverrides[name] && flags.pathOverrides[name].tnScq) {
      delete flags.pathOverrides[name];
      if (flags.artistOverrides && flags.artistOverrides[name] === "custom") delete flags.artistOverrides[name];
    }
  }
  var VANILLA_BUSTS = { shelly: false, shelly_huge: false, shelly_nude: true, shelly_huge_nude: true };
  function syncBusts() {
    if (typeof flags === "undefined") return;
    var on = enabled() && !!cureKind() && !!window.tnShellyCureBustData;
    var names = ["pink", "pink_nude", "blue", "blue_nude", "lash", "lash_nude"];
    for (var i = 0; i < names.length; i++) {
      var key = "shelly_cured_" + names[i];
      if (on && bustUrl(key)) setOverride(key, bustUrl(key)); else clearOverride(key);
    }
    for (var v in VANILLA_BUSTS) {
      var k = on ? bustKey(VANILLA_BUSTS[v]) : null;
      if (k && v.indexOf("huge") >= 0 && window.tnShellyFamily && window.tnShellyFamily.eggBelly()) k = null; // pregnant: show her egg-belly bust
      if (k && bustUrl(k)) setOverride(v, bustUrl(k)); else clearOverride(v);
    }
  }

  // =====================================================================
  //  BOOT
  // =====================================================================

  function patchShellyMenus() {
    if (typeof window.tnShellyTalkMenu === "function" && !window.tnShellyTalkMenu.__tnScq) {
      var talk = window.tnShellyTalkMenu;
      var t = function () { var r = talk.apply(this, arguments); try { addTalkButtons(); } catch (err) { console.error("[Shelly Cure]", err); } return r; };
      t.__tnScq = true;
      window.tnShellyTalkMenu = t;
    }
    if (typeof window.tnShellyTalkCure === "function" && !window.tnShellyTalkCure.__tnScq) {
      // The old "Cure?" scene says the treatment isn't implemented; once the quest has begun, drop that line.
      var cureTalk = window.tnShellyTalkCure;
      var c = function () {
        if (f("FAILED")) { window.tnShellyTalkMenu(); return; }
        return cureTalk.apply(this, arguments);
      };
      c.__tnScq = true;
      window.tnShellyTalkCure = c;
    }
    if (typeof window.tnShellyAssist === "function" && !window.tnShellyAssist.__tnScq) {
      var assist = window.tnShellyAssist;
      var as = function () { var r = assist.apply(this, arguments); try { eggProgressAfterAssist(); } catch (err) { console.error("[Shelly Cure]", err); } return r; };
      as.__tnScq = true;
      window.tnShellyAssist = as;
    }
    if (typeof window.tnShellyCabin === "function" && !window.tnShellyCabin.__tnScq) {
      var cabin = window.tnShellyCabin;
      var cb = function () {
        if (enabled() && num("LESSAU") === 5 && now() >= num("LESSAU_DUE")) { shellyCureReveal(); return; }
        var r = cabin.apply(this, arguments);
        try { patchCabinMenu(); } catch (err) { console.error("[Shelly Cure]", err); }
        return r;
      };
      cb.__tnScq = true;
      window.tnShellyCabin = cb;
    }
    var s = typeof chars !== "undefined" ? chars.SHELLY : null;
    if (s && s.__tnShellyCrewPatched === true && typeof s.crewBlurb === "function" && !s.crewBlurb.__tnScq) {
      var blurb = s.crewBlurb;
      var nb = function (slot) {
        if (enabled() && this.isCrew && this.isCrew()) {
          var replaced = crewButton(slot);
          if (replaced !== null) return replaced;
        }
        return blurb.apply(this, arguments);
      };
      nb.__tnScq = true;
      Object.defineProperty(s, "crewBlurb", { value: nb, writable: true, configurable: true, enumerable: false });
    }
  }

  function registerMenu() {
    if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return false;
    window.registerModMenu({
      id: MOD_ID,
      name: "Shelly Cure Quest",
      author: "Neston",
      description: "Cure Shelly of her endless eggs through Dr. Lash (Tarkus) or Dr. Lessau (Uveto). Needs the Shelly Expansion. Starts from Shelly's Cure? talk option at 5+ trust.",
      supportsToggle: true,
      getHtml: function () {
        var on = nullifyGenitals();
        var setting = "<b>Dr. Lash removes Steele’s genitals:</b> " + (on ? "On" : "Off") +
          "\nWhen on, Dr. Lash’s sterilization also removes Steele’s genitals (as written in the quest). When off, Steele is only made permanently sterile." +
          "<button data-mod-act=\"toggle-nullify\">" + (on ? "Turn Off" : "Turn On") + "</button>\n\n";
        return setting + progressHtml();
      },
      onAct: function (act) {
        if (act === "toggle-nullify") setNullifyGenitals(!nullifyGenitals());
      }
    });
    return true;
  }

  function progressHtml() {
        if (typeof flags === "undefined") return "Load a save to see quest progress.";
        if (f("FAILED")) return "<b>Quest failed.</b> Shelly turned Dr. Lash down after your reasons angered her.";
        if (f("CURED")) return "<b>Shelly is cured</b> (" + f("CURED") + "). Her Sex menu is open in her cabin." + (window.tnShellyCureBustData ? "" : " <i>TN_ShellyCureBusts.js isn’t loaded, so she uses her old busts.</i>") + "";
        return "Dr. Lash stage: " + num("LASH") + " · Dr. Lessau stage: " + num("LESSAU") + (flags.TN_SHELLY_CURE_DISCUSSION === 1 ? "" : "<br>Talk to Shelly about a cure first (needs 5 trust).");
  }

  function boot() {
    if (typeof flags === "undefined" || typeof addButton !== "function") { setTimeout(boot, 400); return; }
    patchShellyMenus();
    enforceSterile();
    syncBusts();
    setInterval(function () { patchShellyMenus(); enforceSterile(); try { syncBusts(); } catch (err) { console.error("[Shelly Cure]", err); } }, 1000);
    if (!registerMenu()) {
      var tries = 0;
      var timer = setInterval(function () { if (registerMenu() || ++tries >= 60) clearInterval(timer); }, 500);
    }
  }

  // Exposed for testing with the console or the "impulse" cheat.
  window.tnShellyCure = {
    lashAsk: lashAsk, lashPitch: lashPitch, lashDecision: lashDecision, lashEnterLab: lashEnterLab,
    lessauAsk: lessauAsk, lessauAskCures: lessauAskCures, reveal: shellyCureReveal
  };

  boot();
})();
