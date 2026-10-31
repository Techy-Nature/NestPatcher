Name: Azra's Family
Author: Techy-Nest
# TN_AzraFamily.mod - written 2026-10-25 for TiTS 0.9.167 (KittyPatcher, Android)
# Azra agrees to have Steele's children. Her "Children?" answer (when you talk about
# being her stud) now says yes, as long as Steele doesn't mind her visiting the kids
# whenever the ship docks at Tavros. Being her stud then switches her contraception off,
# which turns on the pregnancy lines Fenoxo already wrote into her sex scenes.
#
# Pregnancy: she can conceive from Rawdogging, the morning-after scene when she joins you
# in bed, and her expedition creampie scenes. She tells you at about two weeks. Default
# length 120 days (change it in the mod menu). Once she shows, she gets pregnant busts:
# armor, SteeleTech jumpsuit and nude (edited Adjatha art, in TN_AzraFamilyBusts.js).
# Without that file she falls back to the game's own unused nude pregnant bust. Birth happens at the Tavros nursery; the
# kids are added to your nursery children, and she spends two days there recovering.
#
# Tavros: once she has kids and the ship is docked at Tavros, her crew button is greyed
# out. Every 15 game minutes she's in the Milking Station, the Nursery Cafeteria or the
# Educational Center (milking only in the first year after a birth). From 22:00 to 06:00
# she sleeps in your nursery Bedroom, and you can sleep with her.
#
# Already her stud? A "Children?" button replaces the greyed-out "Be Her Stud" button in
# her menu. After she agrees it becomes "Family" (status, pause or resume trying).
# Toggle and settings: Options -> Android Mods -> "Azra's Family".
# 2026-10-26: works with TN_ShellyFamily.mod. When Shelly is in the same nursery room, the
# Shelly mod shows one shared line for both moms, and the bed scene becomes Sleep With Them.

# 1/12 main.js: Azra pregnancy hooks (the game has stubs that always say "not pregnant").
Replace [main.js]:
{key:"pregnancyEnabled",value:function(){return 2===flags.AZRA_STUD}},{key:"isPregnant",value:function(){return!1}},{key:"knowsShePregnant",value:function(){return!1}},{key:"kidCount",value:function(){return 0}}
With:
{key:"pregnancyEnabled",value:function(){return 2===flags.AZRA_STUD}},{key:"isPregnant",value:function(){return!(!window.tnAzraPreg||!window.tnAzraPreg.isPregnant())}},{key:"knowsShePregnant",value:function(){return!(!window.tnAzraPreg||!window.tnAzraPreg.knows())}},{key:"kidCount",value:function(){return window.tnAzraPreg?window.tnAzraPreg.kids():0}},{key:"bellyRating",value:function(){var b=window.tnAzraPreg?window.tnAzraPreg.belly():null;return"number"==typeof b?b:l.jL.prototype.bellyRating.call(this)}},{key:"loadInCunt",value:function(){var r=l.jL.prototype.loadInCunt.apply(this,arguments);try{window.tnAzraPreg&&window.tnAzraPreg.creampie(arguments[0],arguments[1])}catch(x){}return r}}

# 2/12 main.js: pregnant busts: armor / jumpsuit / nude (TN_AzraFamilyBusts.js), or her big bust (mod menu setting).
Replace [main.js]:
this.isPregnant()&&this.bellyRating()>=10?t+="_PREG_NUDE"
With:
this.isPregnant()&&this.bellyRating()>=10&&window.tnAzraPreg&&window.tnAzraPreg.pregBust(e,this.isCrew()&&this.inSteelesuit())?t+=window.tnAzraPreg.pregBust(e,this.isCrew()&&this.inSteelesuit()):this.isPregnant()&&this.bellyRating()>=10&&(e||!window.tnAzraPreg||!window.tnAzraPreg.clothedBig())?t+="_PREG_NUDE"

# 3/12 main.js: crew menu, Azra greyed out while she is at the Tavros nursery.
Replace [main.js]:
o="";if(pc.hasStatusEffect("Azra Plant CD"))
With:
o="";if(window.tnAzraPreg&&window.tnAzraPreg.away())return o+=window.tnAzraPreg.awayBlurb(),addDisabledButton(e,"Azra","Azra",window.tnAzraPreg.awayTip()),o;if(pc.hasStatusEffect("Azra Plant CD"))

# 4/12 main.js: crew menu blurb + pregnancy news / birth scene when you approach her.
Replace [main.js]:
return addButton(e,"Azra",this.approachCrew),t?o:""
With:
return window.tnAzraPreg&&(o+=window.tnAzraPreg.blurbExtra()),addButton(e,"Azra",window.tnAzraPreg?window.tnAzraPreg.approach(this.approachCrew):this.approachCrew),t?o:""

# 5/12 main.js: no "Azra sneaks into your bed" ship event while she is off the ship.
Replace [main.js]:
if(azra.isCrew()&&!azra.professional()&&void 0!==flags.AZRA_SEXED&&!hasCrewSleepWith()
With:
if(!(window.tnAzraPreg&&window.tnAzraPreg.away())&&azra.isCrew()&&!azra.professional()&&void 0!==flags.AZRA_SEXED&&!hasCrewSleepWith()

# 6/12 content_follower.js: new Children? answer.
Replace [content_follower.js]:
function Er(){clearOutput(),azra.showAll(),author("Fenoxo"),output("You ask Azra if that means you can have children with her?
With:
function Er(){if(window.tnAzraPreg&&window.tnAzraPreg.childrenTalk(Yr))return;clearOutput(),azra.showAll(),author("Fenoxo"),output("You ask Azra if that means you can have children with her?

# 7/12 content_follower.js: Children? can be asked again if you heard the old answer.
Replace [content_follower.js]:
void 0===flags.AZRA_CHILDREN_TALK?addButton(2,"Children?",Er,
With:
void 0===flags.AZRA_CHILDREN_TALK||window.tnAzraPreg&&window.tnAzraPreg.askAgain()?addButton(2,"Children?",Er,

# 8/12 content_follower.js: new tooltip once you have talked about it.
Replace [content_follower.js]:
"You already spoke about this. Azra does want children, but not until the Rush is over. She wants to raise them herself, without the risk of abduction or death at the hands of pirates."
With:
(window.tnAzraPreg?window.tnAzraPreg.kidsTip():"You already spoke about this. Azra does want children, but not until the Rush is over. She wants to raise them herself, without the risk of abduction or death at the hands of pirates.")

# 9/12 content_follower.js: Be Her Stud scene no longer says "as soon as we get done on the Rush".
Replace [content_follower.js]:
<i>“And then as soon as we get done on the Rush, you "))
With:
<i>“And then "+(window.tnAzraPreg&&window.tnAzraPreg.breedOk()?"":"as soon as we get done on the Rush, ")+"you "))

# 10/12 content_follower.js: becoming her stud switches contraception off if she agreed.
Replace [content_follower.js]:
flags.AZRA_STUD=1,ri()}
With:
flags.AZRA_STUD=window.tnAzraPreg&&window.tnAzraPreg.breedOk()?2:1,ri()}

# 11/12 content_follower.js: Children?/Family button for players who are already her stud.
Replace [content_follower.js]:
azra.stud()?addDisabledButton(5,"Be Her Stud","Be Her Stud","You have already chosen to be her stud!")
With:
azra.stud()?window.tnAzraPreg&&window.tnAzraPreg.studSlot(5,Na)||addDisabledButton(5,"Be Her Stud","Be Her Stud","You have already chosen to be her stud!")

# 12/12 content_follower.js: the morning-after bed scene can get her pregnant.
Replace [content_follower.js]:
processTime(25),pc.orgasm(),clearMenu(),addButton(0,"Next",pi)
With:
processTime(25),azra.loadInCunt(pc,0),pc.orgasm(),clearMenu(),addButton(0,"Next",pi)

# Runtime part: pregnancy, birth, Tavros schedule, nursery scenes and the mod menu page.
Add Javascript:
// ===========================================================================
//  TN_AzraFamily: runtime part (merged into kitty-inline.js by the patcher)
//  Azra can have Steele's children. They live in the Tavros nursery, and she
//  visits them whenever the ship is docked at Tavros.
// ===========================================================================
(function () {
  "use strict";
  if (window.tnAzraPreg) return;

  var MOD_ID = "tn.azraFamily";
  var TAG = "[AzraFamily]";
  var DAY = 1440;

  // Webpack modules in main.js (same ids in 0.9.166 and 0.9.167):
  // 36956 = ChildManager (kd), 66376 = Child (U), 31317 = StatTracking (s).
  var gameModules = {};
  function gameModule(id) {
    if (gameModules[id]) return gameModules[id];
    var chunks = window.webpackChunktits_html || self.webpackChunktits_html;
    if (!chunks || typeof chunks.push !== "function") return null;
    var req = null;
    chunks.push([[9913600 + (id % 1000)], {}, function (r) { req = r; }]);
    if (typeof req !== "function") return null;
    try { gameModules[id] = req(id); } catch (err) { return null; }
    return gameModules[id];
  }

  function log(msg) { try { console.log(TAG + " " + msg); } catch (err) {} }
  function enabled() { return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID); }
  function f(name) { return window.flags ? flags[name] : undefined; }
  function setF(name, value) { if (window.flags) flags[name] = value; }
  function now() { try { return GetGameTimestamp(); } catch (err) { return 0; } }
  function hour() { try { return window.game.gamestate.hours; } catch (err) { return 12; } }
  function rnd(n) { return typeof rand === "function" ? rand(n) : Math.floor(Math.random() * n); }
  function pick(list) { return list[rnd(list.length)]; }
  function say(text) { return "<i>“" + text + "”</i>"; }
  function p() { return Array.prototype.slice.call(arguments).join("\n\n"); }
  function azraOk() { try { return !!window.azra && azra.isCrew(); } catch (err) { return false; } }
  function hasCock() { try { return pc.hasCock(); } catch (err) { return false; } }
  function shipAtTavros() { try { return getShipLocation() === "TAVROS HANGAR"; } catch (err) { return false; } }

  // ---- Settings (per device)
  function store(key, fallback) {
    try { var v = localStorage.getItem(key); return v === null ? fallback : v; } catch (err) { return fallback; }
  }
  function save(key, value) { try { localStorage.setItem(key, String(value)); } catch (err) {} }
  var TERMS = [30, 60, 120, 180, 270];
  function termDays() { var d = parseInt(store("tn.azraFamily.termDays", "120"), 10); return TERMS.indexOf(d) >= 0 ? d : 120; }
  function clothedBig() { return store("tn.azraFamily.clothedBust", "preg") === "big"; }

  // ---- Pregnancy state (saved in flags)
  //  TN_AZRA_BREED_OK        1 once Azra agreed to have children (new Children? talk)
  //  TN_AZRA_PREG_START      conception timestamp (minutes), undefined when not pregnant
  //  TN_AZRA_PREG_TERM       gestation length in minutes, fixed at conception
  //  TN_AZRA_PREG_COUNT      babies on the way
  //  TN_AZRA_PREG_ANNOUNCED  1 after she told Steele
  //  TN_AZRA_KIDS            children born so far
  //  TN_AZRA_LAST_BIRTH      timestamp of the latest birth
  //  TN_AZRA_LAST_COUNT      babies in the latest birth
  //  TN_AZRA_BIRTH_SCENE     1 = show the "they're here" scene next time you approach her
  function pregnant() { return f("TN_AZRA_PREG_START") !== undefined; }
  function term() { return Number(f("TN_AZRA_PREG_TERM")) || termDays() * DAY; }
  function progress() {
    if (!pregnant()) return 0;
    return Math.max(0, Math.min(1, (now() - Number(f("TN_AZRA_PREG_START"))) / term()));
  }
  function pregDay() { return pregnant() ? Math.floor((now() - Number(f("TN_AZRA_PREG_START"))) / DAY) + 1 : 0; }
  function knows() { return pregnant() && now() - Number(f("TN_AZRA_PREG_START")) >= 14 * DAY; }
  function belly() { return Math.round(progress() * 40); }
  function kids() { return Number(f("TN_AZRA_KIDS")) || 0; }
  function babyWord(n) { return n === 1 ? "baby" : (n === 2 ? "twins" : "babies"); }
  function lastCount() { return Number(f("TN_AZRA_LAST_COUNT")) || 1; }
  function breedOk() { return enabled() && f("TN_AZRA_BREED_OK") === 1; }

  function conceive(count) {
    setF("TN_AZRA_PREG_START", now());
    setF("TN_AZRA_PREG_TERM", termDays() * DAY);
    setF("TN_AZRA_PREG_COUNT", count || (rnd(100) < 15 ? 2 : 1));
    setF("TN_AZRA_PREG_ANNOUNCED", undefined);
    log("Azra conceived (" + f("TN_AZRA_PREG_COUNT") + ").");
  }

  function creampie(from) {
    if (!enabled() || !breedOk() || pregnant()) return false;
    try {
      if (!from || typeof from.isPlayer !== "function" || !from.isPlayer() || !from.hasCock()) return false;
      if (!azra.pregnancyEnabled()) return false;
      if (f("TN_AZRA_LAST_BIRTH") !== undefined && now() - Number(f("TN_AZRA_LAST_BIRTH")) < 14 * DAY) return false;
      var q = Number(from.cumQuality()) || 0;
      if (q <= 0) return false;
      var chance = Math.min(0.85, 0.2 + 0.15 * q);
      if (Math.random() < chance) { conceive(); return true; }
    } catch (err) { log("creampie check failed: " + err); }
    return false;
  }

  function addNurseryKids(count, born) {
    var added = false;
    try {
      var cm = gameModule(36956), cl = gameModule(66376);
      if (cm && cm.kd && cl && cl.U && typeof cl.U.NewChild === "function") {
        var race = (window.GLOBAL && GLOBAL.TYPE_SUULA !== undefined) ? GLOBAL.TYPE_SUULA : 0;
        // Suula are mostly herms: 50% intersex, 35% female, 15% male.
        var c = cl.U.NewChild(race, 1, count, 15, 35, 50, 0);
        c.BornTimestamp = born;
        try {
          if ("skinTone" in c) c.skinTone = azra.skinTone || "gold";
          if ("hairColor" in c) c.hairColor = rnd(2) === 0 ? (azra.hairColor || "pink") : (pc.hairColor || azra.hairColor);
          if ("eyeColor" in c) c.eyeColor = rnd(2) === 0 ? (azra.eyeColor || "green") : (pc.eyeColor || azra.eyeColor);
        } catch (err) {}
        cm.kd.addChild(c);
        added = true;
      }
    } catch (err) { log("could not add nursery kids: " + err); }
    try {
      var st = gameModule(31317);
      if (st && st.s && typeof st.s.track === "function") {
        st.s.track("pregnancy/azra sired", count);
        st.s.track("pregnancy/total sired", count);
        st.s.track("pregnancy/total day care", count);
      }
    } catch (err) {}
    return added;
  }

  function giveBirth() {
    if (!pregnant()) return;
    var count = Number(f("TN_AZRA_PREG_COUNT")) || 1;
    var born = Math.min(now(), Number(f("TN_AZRA_PREG_START")) + term());
    var added = addNurseryKids(count, born);
    setF("TN_AZRA_KIDS", kids() + count);
    setF("TN_AZRA_LAST_BIRTH", born);
    setF("TN_AZRA_LAST_COUNT", count);
    setF("TN_AZRA_PREG_START", undefined);
    setF("TN_AZRA_PREG_TERM", undefined);
    setF("TN_AZRA_PREG_COUNT", undefined);
    setF("TN_AZRA_PREG_ANNOUNCED", undefined);
    setF("TN_AZRA_BIRTH_SCENE", 1);
    try {
      if (typeof AddLogEvent === "function") AddLogEvent("Azra has given birth to your " + babyWord(count) + " in the Tavros nursery!", "good");
    } catch (err) {}
    log("Azra gave birth to " + count + (added ? "" : " (nursery add failed)") + ".");
  }

  // Birth happens off-screen at term. Checked every second, never during combat.
  function tick() {
    try {
      if (!enabled() || !window.flags || !pregnant()) return;
      if (typeof inCombat === "function" && inCombat()) return;
      if (now() >= Number(f("TN_AZRA_PREG_START")) + term()) giveBirth();
    } catch (err) {}
  }

  // ---- Where Azra is
  // Right after a birth she spends two days recovering in the nursery.
  function recovering() { return f("TN_AZRA_LAST_BIRTH") !== undefined && now() < Number(f("TN_AZRA_LAST_BIRTH")) + 2 * DAY; }
  function visiting() { return enabled() && azraOk() && kids() > 0 && shipAtTavros(); }
  function away() { return enabled() && azraOk() && kids() > 0 && (shipAtTavros() || recovering()); }
  function night() { var h = hour(); return h >= 22 || h < 6; }
  function lactating() { return f("TN_AZRA_LAST_BIRTH") !== undefined && now() - Number(f("TN_AZRA_LAST_BIRTH")) < 365 * DAY; }
  // Rerolled every 15 game minutes; stable inside each 15-minute block.
  function spot() {
    if (night()) return "NURSERYG4";
    var spots = ["NURSERYG12", "NURSERYK14"];
    if (lactating()) spots.unshift("NURSERYE4");
    var x = (Math.floor(now() / 15) * 2654435761) >>> 0;
    x = (x ^ (x >>> 13)) >>> 0;
    return spots[x % spots.length];
  }
  function here(room) { return visiting() && spot() === room; }

  function awayBlurb() {
    if (!shipAtTavros()) return "\n\nAzra isn’t aboard. She’s recovering in the Tavros nursery with your newborn " + babyWord(lastCount()) + " and will catch a shuttle back to the ship soon.";
    return "\n\nAzra isn’t aboard. While the ship is docked at Tavros, she’s in the nursery with your children" + (night() ? ", probably asleep in your old bedroom." : ".");
  }
  function awayTip() {
    if (!shipAtTavros()) return "Azra is recovering in the Tavros nursery with your newborn " + babyWord(lastCount()) + ".";
    return "Azra is visiting your children in the Tavros nursery while the ship is docked. Look for her there.";
  }
  function blurbExtra() {
    if (!enabled() || !pregnant()) return "";
    if (belly() >= 30) return " Her heavily pregnant belly rests against the edge of her workstation, and she pauses now and then to rub it.";
    if (belly() >= 10) return " Every so often her hand drifts to the growing curve of her belly.";
    return "";
  }

  // ---- Pregnant busts from TN_AzraFamilyBusts.js (window.tnAzraBustData)
  // Shown through the game's custom-bust feature (flags.artistOverrides /
  // flags.pathOverrides) with blob URLs, like the Shelly cure busts.
  //   azra_preg         clothed, armor
  //   azra_preg_steele  clothed, SteeleTech jumpsuit
  //   azra_preg_nude    replaces the game's own pregnant nude bust
  var BUSTS = ["azra_preg", "azra_preg_steele", "azra_preg_nude"];
  var bustUrls = {};
  function bustUrl(key) {
    if (bustUrls[key]) return bustUrls[key];
    var data = window.tnAzraBustData && window.tnAzraBustData[key];
    if (!data) return null;
    try {
      var bin = atob(data.slice(data.indexOf(",") + 1)), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      bustUrls[key] = URL.createObjectURL(new Blob([bytes], { type: "image/webp" }));
    } catch (err) {
      bustUrls[key] = data;
    }
    return bustUrls[key];
  }
  function setOverride(name, url) {
    if (!flags.artistOverrides) flags.artistOverrides = {};
    if (!flags.pathOverrides) flags.pathOverrides = {};
    var cur = flags.pathOverrides[name];
    if (cur && !cur.tnAzra) return; // the player's own custom art wins
    if (cur && cur.x1 === url && flags.artistOverrides[name] === "custom") return;
    flags.artistOverrides[name] = "custom";
    flags.pathOverrides[name] = { tnAzra: true, x1: url, x2: url, x4: url, originalWidth: 1550, originalHeight: 1500, artist: "Adjatha (edit: Techy-Nest)", title: "Azra (Pregnant)", description: "" };
  }
  function clearOverride(name) {
    if (flags.pathOverrides && flags.pathOverrides[name] && flags.pathOverrides[name].tnAzra) {
      delete flags.pathOverrides[name];
      if (flags.artistOverrides && flags.artistOverrides[name] === "custom") delete flags.artistOverrides[name];
    }
  }
  function syncBusts() {
    if (!window.flags) return;
    var on = enabled();
    BUSTS.forEach(function (k) {
      var url = on ? bustUrl(k) : null;
      if (url) setOverride(k, url); else clearOverride(k);
    });
  }
  function hasClothedArt() { return !!(window.tnAzraBustData && window.tnAzraBustData.azra_preg); }
  // Called from bustString once she is visibly pregnant. Returns the bust suffix,
  // or null to fall back to the game's own choice.
  function pregBust(nude, steele) {
    if (!enabled()) return null;
    if (nude) return "_PREG_NUDE";
    if (clothedBig()) return null;
    if (hasClothedArt()) { try { syncBusts(); } catch (err) {} return steele && window.tnAzraBustData.azra_preg_steele ? "_PREG_STEELE" : "_PREG"; }
    return null;
  }

  // ---- Approach hooks (pregnancy news and the birth)
  function approach(orig) {
    return function () {
      if (!enabled()) return orig.apply(this, arguments);
      if (f("TN_AZRA_BIRTH_SCENE") === 1) return birthScene(orig);
      if (knows() && f("TN_AZRA_PREG_ANNOUNCED") !== 1) return announceScene(orig);
      return orig.apply(this, arguments);
    };
  }

  function announceScene(orig) {
    clearOutput(); azra.showAll(); author("Techy-Nest");
    setF("TN_AZRA_PREG_ANNOUNCED", 1);
    setF("AZRA_VISITED", now());
    var twins = Number(f("TN_AZRA_PREG_COUNT")) === 2;
    output(p(
      "Azra doesn’t greet you so much as pounce. The giant suula crosses her lab in three strides and sweeps you up into a hug that lifts your [pc.feet] clear off the deck, wings flared wide behind her.",
      say("I ran the test three times,") + " she blurts into your hair. " + say("Then I ran it on the good scanner. Then I made the Codex run it, because I didn’t trust myself.") + " She sets you down, but keeps both hands on your shoulders, golden cheeks flushed rosy. " + say("[pc.name]... I’m pregnant. You’re going to be a parent."),
      twins
        ? "She pulls up a hardlight scan before you can answer, and her voice wobbles. " + say("And that’s... that’s two heartbeats. Twins, stud. You don’t do anything halfway, do you?")
        : "She pulls up a hardlight scan before you can answer: a tiny, flickering shape with a heartbeat strong enough to see. " + say("That’s ours. That little speck is ours."),
      "You barely get a word out before she kisses you, long and deep, her tail thumping happily against the floor.",
      say("I’ll keep working, don’t you worry. Suula carry well, and I’m no stranger to this.") + " Her hand settles on her still-flat stomach. " + say("When it’s time, I’ll have the baby at the nursery on Tavros. And then, every time we dock there...") + " She smiles. " + say("Well. You know the deal.")
    ));
    try { processTime(10); } catch (err) {}
    clearMenu();
    addButton(0, "Next", function () { orig.call(azra); });
  }

  function birthScene(orig) {
    clearOutput(); azra.showAll(); author("Techy-Nest");
    setF("TN_AZRA_BIRTH_SCENE", undefined);
    setF("AZRA_VISITED", now());
    var n = lastCount();
    output(p(
      "Azra looks tired, but it’s the happiest kind of tired you’ve ever seen on her. The suula wraps you in a careful hug, then pulls out her Codex to show you picture after picture from the Tavros nursery.",
      say(n === 1 ? "Here’s your little one," : "Here they are, both of them,") + " she says softly, flicking through images of " + (n === 1 ? "a tiny, golden-skinned bundle" : "two tiny, golden-skinned bundles") + " with stubby little fins and a fierce grip on a nurse droid’s finger. " + say("Healthy, loud, and hungry. They take after both of us."),
      say("The staff there are wonderful. I won’t pretend I didn’t cry when I left.") + " She sniffs, then laughs. " + say("But I meant what I said. Every time we dock at Tavros, I’m going straight to the nursery, and at night I’ll be sleeping in your old room so I can hear them if they wake up. You’re welcome to join me.") + " Her eyes twinkle. " + say("Your bed is big enough. Barely."),
      "<b>Your " + babyWord(n) + " with Azra " + (n === 1 ? "is" : "are") + " now in the Tavros nursery.</b>"
    ));
    try { processTime(15); } catch (err) {}
    clearMenu();
    addButton(0, "Next", function () { orig.call(azra); });
  }

  // ---- Children? talk (replaces the old "not until the Rush is over" answer)
  function childrenText(again) {
    var parts = [];
    if (again) {
      parts.push("You bring up children again. Has anything changed since the last time you talked about it?");
      parts.push("Azra’s fins flick, and she sets aside the sample she was labelling. " + say("Funny you should ask. I’ve been thinking about it. A lot, actually."));
    } else {
      parts.push("You ask Azra if that means you can have children with her?");
      parts.push(say("We-well... actually, yes.") + " For a moment she’s at a loss for words, her cheeks darkening to a rosy gold. " + say("If you’re my stud, then I’d want to have children with you. More than one, if the stars are kind" + (hasCock() ? "" : (pc.hasVagina() ? ", even if it means handling the reproductive role of stud myself" : ", even if it means some temporary modifications to our biology to make it happen")) + "."));
      parts.push(say("Even now? During the Rush?") + " You cock your head. You’d half expected her to ask you to wait.");
    }
    parts.push("Azra brings your hands closer and squeezes them tightly. " + say("I won’t bring a baby aboard this vessel. Every time we hop between planets, we risk interception by pirates, slavers, or worse. But...") + " She worries her lower lip with a fang.");
    parts.push("You bring up the nursery back on Tavros. It’s top-of-the-line, with " + (pc.isBimbo() ? "like, really good caretakers and education stuff!" : "child rearing facilities and education to rival some of the most luxurious preschool facilities in the core."));
    parts.push(say("I’ve read the reports. Your father built something remarkable there.") + " She nods slowly. " + say("Staff, security, schooling. It’s safer than anywhere I could raise them out here. So I’ll agree to it, on one condition."));
    parts.push(say("Whenever we dock at Tavros, I go see them. I’ll feed them, read to them, sit in on their lessons, and at night I’ll sleep in the nursery instead of on the ship, so I’m there if they wake up. I want my children to know their mother’s face and their stud’s voice, not just a companion android’s.") + " Her grip tightens. " + say("You wouldn’t mind that... would you?"));
    parts.push("You shake your head. If anything, it’s hard to picture her any other way.");
    parts.push("Her whole body seems to sigh with relief, wings loosening behind her. " + say(again ? "Then no more suppressants. Starting today." : "Then the second you’re registered as my stud, I stop suppressing my ovulation.") + " " + (hasCock() ? say("So you’d better be ready to keep up.") : say("And if you decide to grow a dick, well... I’ll be ready.")) + " Her knees rub together excitedly.");
    parts.push(say("A baby,") + " she breathes, bringing your hands up to her lips and kissing them. " + say("With my stud. I never thought I’d get to say that again."));
    if (!again) parts.push("So being her stud means a family, and unprotected sex as often as you like, as long as she gets to visit the little ones whenever the ship is at Tavros. Assuming you still want to be her stud. What do you say?");
    else parts.push("<b>Azra is no longer using contraception. She can get pregnant from now on.</b>");
    return p.apply(null, parts);
  }

  // Called from the start of the game's Children? scene. Returns true if handled.
  function childrenTalk(next) {
    if (!enabled()) return false;
    clearOutput(); azra.showAll(); author("Techy-Nest");
    output(childrenText(false));
    try { processTime(3); } catch (err) {}
    setF("AZRA_CHILDREN_TALK", 1);
    setF("TN_AZRA_BREED_OK", 1);
    next();
    return true;
  }
  function askAgain() { return enabled() && f("TN_AZRA_BREED_OK") !== 1; }
  function kidsTip() { return "You already spoke about this. Azra wants children with you. She’ll raise them in the Tavros nursery, as long as she can visit them whenever the ship docks there."; }

  // Replaces the greyed-out "Be Her Stud" button for studs. Returns true if it added a button.
  function studSlot(slot, back) {
    if (!enabled()) return false;
    if (f("TN_AZRA_BREED_OK") !== 1) {
      addButton(slot, "Children?", function () { studAskAgain(back); }, "Children?", "Ask Azra again about having children together.");
      return true;
    }
    addButton(slot, "Family", function () { familyMenu(back); }, "Family", pregnant() ? "Talk to Azra about her pregnancy." : "Talk about your family with Azra.");
    return true;
  }
  function studAskAgain(back) {
    clearOutput(); azra.showAll(); author("Techy-Nest");
    output(childrenText(true));
    setF("AZRA_CHILDREN_TALK", 1);
    setF("TN_AZRA_BREED_OK", 1);
    setF("AZRA_STUD", 2);
    try { processTime(5); } catch (err) {}
    clearMenu();
    addButton(0, "Next", back);
  }
  function familyMenu(back) {
    clearOutput(); azra.showAll(); author("Techy-Nest");
    var lines = [];
    if (pregnant() && knows()) {
      var d = pregDay(), left = Math.max(0, Math.ceil((Number(f("TN_AZRA_PREG_START")) + term() - now()) / DAY));
      lines.push("Azra laces her fingers over her " + (belly() >= 10 ? "rounded belly" : "stomach") + " when you ask how she’s doing. " + say(belly() >= 30 ? "Big. Heavy. Hungry all the time. And happy, [pc.name]. Very happy." : belly() >= 10 ? "Showing, finally. My daughters would laugh at how often I check the mirror." : "Tired in the mornings, starving in the evenings. Perfectly normal."));
      lines.push("<b>Azra is on day " + d + " of her pregnancy, with about " + left + " day" + (left === 1 ? "" : "s") + " to go.</b>");
    } else if (pregnant()) {
      lines.push("Azra hums thoughtfully. " + say("Nothing to report yet. Give it a little time... or a little more effort.") + " She winks.");
    } else {
      lines.push(say("Our family?") + " Azra smiles. " + (kids() > 0 ? say("I miss our little ones every time we leave Tavros. Seeing them grow up between visits is strange, but wonderful.") : say("Not yet. But I’m ready whenever you are, stud.")));
    }
    if (kids() > 0) lines.push("You have " + kids() + " child" + (kids() === 1 ? "" : "ren") + " with Azra in the Tavros nursery.");
    lines.push(azra.pregnancyEnabled() ? "Azra isn’t using contraception." : "Azra is back on contraception for now.");
    output(p.apply(null, lines));
    clearMenu();
    if (!pregnant()) {
      if (azra.pregnancyEnabled()) addButton(0, "Wait A While", function () { setPause(true, back); }, "Wait A While", "Ask Azra to go back on contraception for a while.");
      else addButton(0, "Try Again", function () { setPause(false, back); }, "Try Again", "Tell Azra you’re ready to try for children again.");
    }
    addButton(14, "Back", back);
  }
  function setPause(pause, back) {
    clearOutput(); azra.showAll(); author("Techy-Nest");
    setF("AZRA_STUD", pause ? 1 : 2);
    output(pause
      ? "Azra nods without a trace of hurt. " + say("Of course. I’ll start the suppressants again tonight. Just say the word when you’re ready.")
      : "Azra’s tail swishes. " + say("Then I’m stopping the suppressants. Consider yourself warned, stud."));
    clearMenu();
    addButton(0, "Next", back);
  }

  // ---- Azra in the Tavros nursery
  var ROOMS = ["NURSERYE4", "NURSERYG12", "NURSERYK14", "NURSERYG4"];
  function roomBlurb(room) {
    var n = kids();
    var little = n === 1 ? "your child" : "your children";
    switch (room) {
      case "NURSERYE4": return pick([
        "\n\nAzra is reclining in one of the oversized milking chairs, a pump humming quietly at her chest while she reads a datapad. She gives you a sleepy, contented wave.",
        "\n\nAzra is here, settled into a milking chair big enough for her nine-foot frame, bottling milk for " + little + ". She brightens when she spots you."
      ]);
      case "NURSERYG12": return pick([
        "\n\nAzra is sitting at a low table in the cafeteria, knees practically up to her chin, helping " + little + " with lunch. There’s more food on her than in anyone’s mouth.",
        "\n\nAzra is in the cafeteria, laughing as she wipes a smear of mashed fruit off " + (n === 1 ? "a tiny" : "one tiny") + " golden cheek. She waves you over."
      ]);
      case "NURSERYK14": return pick([
        "\n\nAzra is perched on a stool far too small for her in the education center, listening to the lesson with " + little + " as attentively as any student.",
        "\n\nAzra is in the education center, showing " + little + " a hardlight model of a Mhen’gan vine and explaining, in great detail, why it’s fascinating."
      ]);
      case "NURSERYG4": return "\n\nAzra is asleep in your bed, curled on her side with her wings folded around her like a blanket. A baby monitor glows softly on the nightstand.";
    }
    return "";
  }

  function freeSlot() {
    var order = [0, 1, 2, 3, 4, 5, 9, 14];
    for (var i = 0; i < order.length; i++) {
      try { if (!hasButton(order[i])) return order[i]; } catch (err) { return 4; }
    }
    return 4;
  }

  function roomHook(room) {
    if (!here(room)) return;
    var withShelly = !!(window.tnShellyFamily && window.tnShellyFamily.withAzra(room));
    if (!withShelly) output(roomBlurb(room));
    var slot = freeSlot();
    if (room === "NURSERYG4") {
      addButton(slot, "Azra", sleepingAzra, "Azra", withShelly ? "Azra and Shelly are asleep in your bed." : "Azra is asleep in your bed.");
    } else {
      addButton(slot, "Azra", function () { meetAzra(room); }, "Azra", "Spend some time with Azra and your children.");
    }
  }

  function meetAzra(room) {
    clearOutput(); azra.showAll(); author("Techy-Nest");
    setF("AZRA_VISITED", now());
    var text;
    if (room === "NURSERYE4") {
      text = p(
        "You pull up a chair next to Azra. She reaches over to squeeze your hand without looking up from her datapad.",
        say("Don’t mind the machine. Our little " + (kids() === 1 ? "one" : "ones") + " drink more than I thought possible, and I’d rather they had their mother’s milk than formula, even when I’m off-station.") + " She taps a row of neatly labelled bottles. " + say("The staff freeze it for when we’re gone.")
      );
    } else if (room === "NURSERYG12") {
      text = p(
        "You squeeze in beside Azra at the tiny table. She hands you a spoon without a word, and for a little while you both take turns coaxing bites into " + (kids() === 1 ? "a stubborn little mouth" : "stubborn little mouths") + ".",
        say("They’re getting so big,") + " she murmurs, leaning her head against your shoulder. " + say("Every time we come back, I notice something new.")
      );
    } else {
      text = p(
        "You join Azra at the back of the class. She beams with pride as " + (kids() === 1 ? "your child answers" : "one of your children answers") + " a question, then leans over to whisper in your ear.",
        say("Smart, just like their stud. And stubborn, just like me.") + " Her fins flick happily. " + say("Thank you for this, [pc.name]. I mean it.")
      );
    }
    if (window.tnShellyFamily && window.tnShellyFamily.withAzra(room)) text = p(text, window.tnShellyFamily.jointLine("azra", room));
    output(text);
    try { processTime(15 + rnd(10)); } catch (err) {}
    clearMenu();
    addButton(0, "Talk", function () { kidsTalk(room); }, "Talk", "Talk with Azra about your children.");
    addButton(14, "Leave", mainGameMenu);
  }

  function kidsTalk(room) {
    clearOutput(); azra.showAll(); author("Techy-Nest");
    var shellyKids = window.tnShellyFamily ? window.tnShellyFamily.kids() : 0;
    output(pick((shellyKids > 0 ? ["You ask how the kids get along with Shelly’s. Azra laughs. " + say("Like a litter. Mine carry hers around everywhere, and hers have taught mine to steal snacks. Shelly says that’s my fault.")] : []).concat([
      "You ask how the kids have been. Azra lights up and spends the next while recounting every new word, every wobbly step, and one incident involving a nurse droid and a bowl of noodles that she clearly thinks is the funniest thing that has ever happened.",
      "You ask Azra what she thinks the kids will be when they grow up. " + say("Botanists, obviously,") + " she says, completely seriously. Then she laughs. " + say("Whatever they want. As long as they come visit their mother."),
      "You talk about her daughters back home. " + say("They’re thrilled, you know. They keep asking when they get to meet their new siblings... and their mother’s stud.") + " She grins. " + say("I told them they’ll have to wait until after the Rush."),
      "Azra tells you about the nursery staff, the lessons, and which of the other children yours have made friends with. She has opinions about all of them."
    ])));
    try { processTime(10); } catch (err) {}
    clearMenu();
    addButton(14, "Back", function () { meetAzra(room); });
  }

  function sleepingAzra() {
    if (window.tnShellyFamily && window.tnShellyFamily.withAzra("NURSERYG4")) return window.tnShellyFamily.bedBoth();
    clearOutput(); azra.showAll(true); author("Techy-Nest");
    output(p(
      "Azra is fast asleep, her golden skin rising and falling with slow, even breaths. One wing has slipped off the edge of the mattress, and her tail is curled possessively around the foot of the bed.",
      "When you sit down on the edge, she stirs just enough to crack one eye open. " + say("Mmh... [pc.name]?") + " She lifts her wing in invitation. " + say("Come to bed, stud. The kids are asleep. For once.")
    ));
    clearMenu();
    addButton(0, "Sleep With Her", sleepWithAzra, "Sleep With Her", "Climb into bed with Azra and sleep until morning.");
    addButton(14, "Let Her Sleep", mainGameMenu, "Let Her Sleep", "Leave Azra to her rest.");
  }

  function sleepWithAzra() {
    clearOutput(); azra.showAll(true); author("Techy-Nest");
    setF("AZRA_VISITED", now());
    output(p(
      "You " + (pc.isNude() ? "slip" : "strip down and slip") + " under the covers. Azra pulls you in immediately, wrapping you in nine feet of warm suula and folding her wing over the both of you like a second blanket.",
      "Her chin settles on top of your head. " + say("Just like the old days on the ship,") + " she mumbles, already drifting off again, " + say("except now there’s a baby monitor.") + " Her hand finds yours and squeezes once. " + (pregnant() && belly() >= 10 ? "You can feel the curve of her belly pressed against your back, and every so often, something inside it kicks. " : "") + "Her slow heartbeat lulls you to sleep before you know it.",
      ""
    ));
    var hadNext = false;
    try { window.sleep(false); } catch (err) { log("sleep failed: " + err); }
    try { var b = getButtonData(0); hadNext = !!(b && b.title === "Next"); } catch (err) {}
    if (hadNext) addButton(0, "Next", wakeWithAzra);
  }

  function wakeWithAzra() {
    clearOutput(); azra.showAll(true); author("Techy-Nest");
    output(p(
      "You wake to the smell of tea and the sound of Azra humming. She’s already up, sitting on the edge of the bed with a steaming mug in each hand, one of which she presses into yours.",
      say("Morning, stud.") + " She kisses your forehead. " + say("The little " + (kids() === 1 ? "one is" : "ones are") + " up and asking for breakfast. Come find me in the cafeteria once you’re dressed.") + " With a last squeeze of your hand, she pads out of the room, tail swaying."
    ));
    clearMenu();
    addButton(0, "Next", mainGameMenu);
  }

  // Hook the four nursery rooms through runAfterEnter (called after the room's own
  // buttons and the travel buttons are drawn). Rooms are found by name, so no
  // content_tavros.js patches are needed.
  function hookRooms() {
    if (typeof window.findRoomByName !== "function") return;
    ROOMS.forEach(function (id) {
      var room = null;
      try { room = window.findRoomByName("KALAS.TAVROS." + id); } catch (err) { room = null; }
      if (!room || room._tnAzraFamily) return;
      var prior = room.runAfterEnter;
      room.runAfterEnter = function () {
        var r;
        if (typeof prior === "function") r = prior.apply(this, arguments);
        try { roomHook(id); } catch (err) { log("room hook " + id + " failed: " + err); }
        return r;
      };
      room._tnAzraFamily = true;
    });
  }

  // ---- Mod Menu
  function statusHtml() {
    var lines = [];
    if (!window.flags || !window.azra) return "Load a save to see Azra’s status.";
    lines.push("<b>Agreed to children:</b> " + (f("TN_AZRA_BREED_OK") === 1 ? "Yes" : "No (ask her Children? when talking about being her stud, or Children? in her menu if you already are)"));
    lines.push("<b>Contraception:</b> " + (azra.pregnancyEnabled() ? "Off" : "On"));
    lines.push("<b>Pregnant:</b> " + (pregnant() ? "Yes, day " + pregDay() + " of " + Math.round(term() / DAY) + (knows() ? "" : " (she doesn’t know yet)") : "No"));
    lines.push("<b>Children with Azra:</b> " + kids());
    if (kids() > 0) lines.push("<b>Right now on Tavros:</b> " + ({ NURSERYE4: "Milking Station", NURSERYG12: "Nursery Cafeteria", NURSERYK14: "Educational Center", NURSERYG4: "your Bedroom (asleep)" })[spot()] + (visiting() ? "" : " (only while the ship is docked at Tavros)"));
    return lines.join("\n");
  }
  function register(tries) {
    if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) {
      if (tries < 120) setTimeout(function () { register(tries + 1); }, 500);
      return;
    }
    window.registerModMenu({
      id: MOD_ID,
      name: "Azra’s Family",
      author: "Techy-Nest (KittyPatcher custom mod)",
      description: "Azra agrees to have Steele’s children. They live in the Tavros nursery, and she visits them whenever the ship docks there: milking station, cafeteria or classroom by day, your nursery bedroom at night. Off = no new pregnancies, no visits, and her crew button works as normal.",
      supportsToggle: true,
      defaultEnabled: true,
      getHtml: function () {
        var html = statusHtml() + "\n\n";
        html += "<b>Pregnancy length:</b> " + termDays() + " days (applies to the next pregnancy)" +
          "<button data-mod-act=\"term\">Change Length</button>\n";
        html += "<b>Pregnant bust while clothed:</b> " + (clothedBig() ? "Big (her normal clothed bust, bigger breasts)" : (hasClothedArt() ? "Pregnant (armor or jumpsuit art)" : "Pregnant (nude art)")) +
          (hasClothedArt() ? "\nPregnant busts from TN_AzraFamilyBusts.js are loaded." : "\nTN_AzraFamilyBusts.js isn’t loaded, so only the game’s own nude pregnant bust is available. Pick Big if it shows up blank.") +
          "<button data-mod-act=\"bust\">Switch Bust</button>\n\n";
        html += "<b>Testing</b> (changes your save):" +
          "<button data-mod-act=\"agree\">Skip Talk: She Agrees</button>" +
          "<button data-mod-act=\"conceive\">Make Her Pregnant</button>" +
          "<button data-mod-act=\"skip\">Skip 30 Days</button>" +
          "<button data-mod-act=\"birth\">Give Birth Now</button>";
        return html;
      },
      onAct: function (act) {
        if (!window.flags) return true;
        if (act === "term") { var i = TERMS.indexOf(termDays()); save("tn.azraFamily.termDays", TERMS[(i + 1) % TERMS.length]); }
        if (act === "bust") save("tn.azraFamily.clothedBust", clothedBig() ? "preg" : "big");
        if (act === "agree") { setF("TN_AZRA_BREED_OK", 1); setF("AZRA_CHILDREN_TALK", 1); if (azra.stud()) setF("AZRA_STUD", 2); }
        if (act === "conceive" && !pregnant()) conceive();
        if (act === "skip" && pregnant()) setF("TN_AZRA_PREG_START", Number(f("TN_AZRA_PREG_START")) - 30 * DAY);
        if (act === "birth" && pregnant()) giveBirth();
        return true;
      }
    });
  }

  window.tnAzraPreg = {
    isPregnant: function () { return enabled() && pregnant(); },
    knows: function () { return enabled() && knows(); },
    kids: function () { return kids(); },
    belly: function () { return enabled() && pregnant() ? belly() : null; },
    clothedBig: clothedBig,
    pregBust: pregBust,
    creampie: creampie,
    away: away,
    awayBlurb: awayBlurb,
    awayTip: awayTip,
    blurbExtra: blurbExtra,
    approach: approach,
    childrenTalk: childrenTalk,
    askAgain: askAgain,
    kidsTip: kidsTip,
    breedOk: function () { return breedOk(); },
    studSlot: studSlot,
    spot: spot,
    _test: { giveBirth: giveBirth, conceive: conceive, roomHook: roomHook, hookRooms: hookRooms, tick: tick, syncBusts: syncBusts, sleepWithAzra: sleepWithAzra, meetAzra: meetAzra, sleepingAzra: sleepingAzra, familyMenu: familyMenu, studAskAgain: studAskAgain }
  };

  setInterval(function () { hookRooms(); tick(); try { syncBusts(); } catch (err) {} }, 1000);
  register(0);
  log("loaded");
})();
