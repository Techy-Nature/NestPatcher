/*
 * TN_ShekkaEggs_v2.9.js - "Shekka's Eggs" (NestPatcher runtime mod, TiTS 0.9.168), Modv2.9
 * Author: Neston
 *
 * The happy ending for Shekka's Gene Talk (TN_ShekkaGeneTalk_v2.9.mod + .js, needed).
 * A week after Dr. Rewell's last treatment, Shekka is ready: she asks Steele to give her eggs.
 *   - "Eggs" in crew Shekka's Talk menu (slot 6). Steele needs a cock that fits her and some
 *     virility. Sex scene with biped, taur and naga versions. It always takes.
 *   - Two weeks of pregnancy. Shekka stays on the ship and keeps working, and you can check on
 *     her any time ("Eggs").
 *   - When she's due she emails you. Come to her and you're there when she lays her egg ("Laying!").
 *     If you don't come within a day, she lays it on her own, and tells you about it later.
 *   - The egg goes to Steele's nursery on Tavros. Briget emails when it arrives (with the best care
 *     and then some), and again two weeks later when it hatches. The child joins the nursery like
 *     any other.
 *   - After a week, you can try again.
 *   - Shekka's own sex scenes from the game can get her pregnant too: whenever you cum in her
 *     pussy (the game's shekka.loadInCunt), there's a chance it takes (25% x your virility, max 80%),
 *     once she's ready and isn't already carrying or recovering. She tells you next time you talk.
 * Flags (in your save): TN_SKE_ASKED, TN_SKE_PREG_TS, TN_SKE_SOLO, TN_SKE_LAID, TN_SKE_LAY_TS,
 *   TN_SKE_EGG_TS, TN_SKE_HATCHED, TN_SKE_SEX_<n> (1 boy, 2 girl, 3 herm), TN_SKE_SURPRISE.
 * Toggle: Options -> Android Mods -> "Shekka's Eggs".
 */
(function () {
    "use strict";
    if (window.__tnShekkaEggsLoaded) return;
    window.__tnShekkaEggsLoaded = true;

    var MOD_ID = "tn.shekka-eggs";
    var DAY = 1440;
    var READY_AFTER = 7 * DAY;  // a week after her last treatment
    var GESTATION = 14 * DAY;   // same as Shekka's own eggs in the game
    var INCUBATION = 14 * DAY;  // in the nursery, until it hatches
    var COOLDOWN = 7 * DAY;     // after laying, before trying again
    var LATE = DAY;             // she lays on her own if you're not there a day after she's due

    /* ---------- Mod menu switch ---------- */
    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Shekka's Eggs",
            author: "Neston",
            description: "The happy ending for Shekka's Gene Talk: once Dr. Rewell's treatment is done, Shekka asks you for eggs of her own. She carries on the ship, lays her egg, and sends it to your nursery on Tavros, where Briget gives it the best care and then some. Needs Shekka's Gene Talk.",
            supportsToggle: true
        });
        return true;
    }
    if (!register()) {
        var regTries = 0;
        var regTimer = setInterval(function () { if (register() || ++regTries >= 150) clearInterval(regTimer); }, 200);
    }

    /* ---------- Helpers ---------- */
    function safe(f, d) { try { return f(); } catch (err) { return d; } }
    function hasFlags() { return typeof flags !== "undefined" && !!flags; }
    function num(k) { var v = Number(flags[k]); return isNaN(v) ? 0 : v; }
    function q(t) { return "<i>“" + t + "”</i>"; }
    function say(list) {
        var first = true;
        for (var i = 0; i < list.length; i++) {
            if (list[i] === null || list[i] === undefined || list[i] === "") continue;
            output((first ? "" : "\n\n") + list[i]);
            first = false;
        }
    }
    function rnd(list) { return list[safe(function () { return rand(list.length); }, Math.floor(Math.random() * list.length))]; }
    function bodyType() { return safe(function () { return pc.isTaur() ? "taur" : pc.isNaga() ? "naga" : "biped"; }, "biped"); }
    function body(o) { var b = bodyType(); return o.hasOwnProperty(b) ? o[b] : o.biped; }
    function now() { return safe(function () { return GetGameTimestamp(); }, 0); }
    function start() {
        clearMenu(); clearOutput();
        safe(function () { shekka.showAll(); });
        author("Neston");
    }
    function backTo(talkMenu) {
        clearMenu();
        addButton(0, "Next", function () { if (typeof talkMenu === "function") talkMenu(); else mainGameMenu(); });
    }
    function shekkaCrew() { return safe(function () { return shekka.isCrew(); }, false); }
    function shekkaCock() { return safe(function () { return shekka.hasCock(); }, false); }

    // Webpack modules in main.js (0.9.168): 36956 = ChildManager (kd), 66376 = Child (U), 31317 = StatTracking (s).
    var gameModules = {};
    function gameModule(id) {
        if (gameModules[id]) return gameModules[id];
        var chunks = window.webpackChunktits_html || self.webpackChunktits_html;
        if (!chunks || typeof chunks.push !== "function") return null;
        var req = null;
        chunks.push([["tn-shekka-eggs-" + id + "-" + Date.now()], {}, function (r) { req = r; }]);
        if (typeof req !== "function") return null;
        try { gameModules[id] = req(id); } catch (err) { return null; }
        return gameModules[id];
    }

    /* ---------- State ---------- */
    function gene() { return window.tnShekkaGeneTalk || null; }
    function fertile() { return safe(function () { return !!(gene() && gene().fertile()); }, false); }
    function treatedAt() { return num("TN_SKG_SESSION_TS"); }
    function live() { return on() && hasFlags() && fertile() && shekkaCrew(); }
    function ready() { return live() && now() - treatedAt() >= READY_AFTER; }
    function pregnant() { return hasFlags() && flags.TN_SKE_PREG_TS !== undefined; }
    function due() { return pregnant() && now() - num("TN_SKE_PREG_TS") >= GESTATION; }
    function pregDay() { return pregnant() ? Math.floor((now() - num("TN_SKE_PREG_TS")) / DAY) + 1 : 0; }
    function cooling() { return num("TN_SKE_LAID") > 0 && now() - num("TN_SKE_LAY_TS") < COOLDOWN; }
    function eggIncubating() { return hasFlags() && flags.TN_SKE_EGG_TS !== undefined; }
    function cockIdx() {
        return safe(function () {
            if (!pc.hasCock()) return -1;
            var cap = shekka.vaginalCapacity(0);
            var i = pc.cockThatFits(cap);
            return typeof i === "number" ? i : -1;
        }, -1);
    }
    function virile() { return safe(function () { return pc.virility() > 0; }, true); }
    function kidWord(n) { var s = num("TN_SKE_SEX_" + n); return s === 1 ? "son" : s === 2 ? "daughter" : "child"; }

    /* ---------- Shekka's Talk menu (slot 6, from Shekka's Gene Talk) ---------- */
    window.tnShekkaTalkExtra = function (slot, talkMenu) {
        try {
            if (!live()) return;
            if (num("TN_SKE_SURPRISE") === 1 && pregnant()) { addButton(slot, "Eggs", function () { surpriseScene(talkMenu); }, "Eggs", "Shekka has something to tell you."); return; }
            if (num("TN_SKE_SOLO") === 1) { addButton(slot, "Eggs", function () { soloLaidScene(talkMenu); }, "Eggs", "Shekka has something to tell you."); return; }
            if (due()) { addButton(slot, "Laying!", function () { layScene(talkMenu); }, "Laying!", "Shekka’s egg is coming. Be there with her."); return; }
            if (pregnant()) { addButton(slot, "Eggs", function () { pregScene(talkMenu); }, "Eggs", "Check on Shekka and the egg she’s carrying."); return; }
            if (!ready()) return;
            if (cooling()) { addDisabledButton(slot, "Eggs", "Eggs", "Shekka just laid. Give her a week before you try again."); return; }
            var tip = num("TN_SKE_ASKED") ? "Try for another egg with Shekka." : "Shekka’s been giving you looks all day. Ask what’s on her mind.";
            if (!num("TN_SKE_ASKED")) { addButton(slot, "Eggs?", function () { askScene(talkMenu); }, "Eggs?", tip); return; }
            var why = needWhy();
            if (why) addDisabledButton(slot, "Try for Eggs", "Try for Eggs", why);
            else addButton(slot, "Try for Eggs", function () { breedScene(talkMenu); }, "Try for Eggs", tip);
        } catch (err) {}
    };
    function needWhy() {
        if (!safe(function () { return pc.hasCock(); }, false)) return "You’ll need a cock to give Shekka eggs.";
        if (cockIdx() < 0) return "Your cock is too big for Shekka to take.";
        if (!virile()) return "You aren’t virile right now. Fix that first.";
        return "";
    }

    /* ---------- She asks ---------- */
    function askScene(talkMenu) {
        start();
        var why = needWhy();
        say([
            "You ask Shekka what’s on her mind. She’s been finding reasons to be wherever you are all day: fixing a light panel that wasn’t broken, recalibrating a door that was fine, reorganizing a tool cabinet three times.",
            "She turns pink right up to the ears. " + q("Oh, you noticed. Great. Rust.") + " She sets down her wrench, wipes her hands on her jumpsuit, and then wipes them again. " + q("Okay. Okay. So. You know how I told you I wasn’t ready yet? For eggs?"),
            q("I think I’m ready.") + " She says it fast, like ripping off a bandage. " + q("It’s been a week since doc’s last session, and I’ve been thinking about it every single day, and it’s not the itch talking. I checked. I sat with it, and it’s quiet, and it’s still there. I want to. I really, really want to."),
            q("And I want them to be yours, [pc.name].") + " Her ears give a soft, nervous jingle. " + q("You funded the Cure. You found doc. You held my hand through all of it. Who else would I want?"),
            q("I’ll keep working the whole time, I swear. Raskvel don’t slow down much till the end. And when it comes, it’s going to your nursery on Tavros. Steele Tech’s best care, real teachers, the works. Our kid’s going to be the best-educated raskvel in the galaxy.") + " She grins, a little wobbly. " + q("So? What do you say, Captain?"),
            why ? "<b>" + why + "</b>" : ""
        ]);
        flags.TN_SKE_ASKED = 1;
        safe(function () { processTime(10); });
        clearMenu();
        if (why) addDisabledButton(0, "Yes", "Yes", why);
        else addButton(0, "Yes", function () { breedScene(talkMenu); }, "Yes", "Give Shekka the egg she wants.");
        addButton(1, "Not Yet", function () {
            start();
            say([
                "You tell her you’d love to, but not quite yet.",
                "Shekka nods, a little disappointed but mostly relieved you didn’t laugh. " + q("Yeah. Okay. That’s fair. It’s a big thing.") + " She picks her wrench back up and points it at you. " + q("But I’m holding you to that <i>love to,</i> Steele."),
                "<b>You can try for eggs with Shekka from her Talk menu whenever you’re ready.</b>"
            ]);
            backTo(talkMenu);
        }, "Not Yet", "Tell Shekka you’d like to wait a little.");
    }

    /* ---------- Conception ---------- */
    function breedScene(talkMenu) {
        start();
        var x = cockIdx();
        if (x < 0) x = 0;
        var ck = "[pc.cock " + x + "]";
        var first = num("TN_SKE_LAID") === 0 && !pregnant();
        var t = bodyType();
        var lines = [
            first
                ? "Shekka doesn’t say a word. She just takes your hand and leads you to her bunk, and halfway there she starts unzipping her jumpsuit, peeling it down her shoulders and over those broad, egg-laying hips until it pools around her clawed feet. Her ears are jingling the whole way, a nervous, happy little song."
                : "Shekka’s grin is all the answer you need. She has her jumpsuit unzipped and kicked off before you’ve even reached her bunk. " + q("Round two!") + " she announces, and drags you down with her.",
            "Undressing yourself takes about a third as long as usual, because Shekka is helping, mostly with her teeth. By the time you’re bare, " + ck + " is already hard and aching, and Shekka is staring at it like it’s the answer to every problem she’s ever had." + (shekkaCock() ? " Her own horsecock bobs against her belly, flared and eager, but for once she doesn’t even glance at it." : "")
        ];
        if (t === "taur") {
            lines.push(
                "There’s no fitting your tauric bulk onto her tiny bunk, so Shekka improvises: she drags a padded crate under the bunk’s edge, climbs onto it, and bends forward over the mattress with her ass high in the air and her tail flagged up out of the way. " + q("Engineering!") + " she declares, wiggling her hips at you.",
                "You step up over her, your forelegs planted either side of her crate and your barrel blotting out the light above her. She vanishes beneath you completely, nothing but the warm press of her hips against your underside and her excited jingling from somewhere below. It takes a little shuffling and a lot of giggling before your " + ck + " finds the slick, puffy lips of her pussy, and then she reaches back between her legs, takes hold of you, and guides you home.",
                "You sink into her slowly. She’s hot and impossibly wet, her twin clits throbbing against you as she stretches, and she moans so loudly that something rattles in the bulkhead. " + q("Oh, <i>stars,</i> that’s... yeah. Yeah. Don’t stop."),
                "You don’t. You rock into her with long, deep, careful strokes, your whole body moving above her, and she pushes back against every one of them, little claws scrabbling at the sheets. It doesn’t feel like the rough, greedy fucks the two of you usually share. It feels like something you’re building together."
            );
        } else if (t === "naga") {
            lines.push(
                "You pull her down onto the bunk with you and wrap her up in your coils, loop after loop of your long tail curling around her legs and hips until she’s cradled in a warm, scaly nest. " + q("Ooh,") + " she purrs, wiggling happily in your grip. " + q("Nest. That’s fitting."),
                "Your coils lift her hips just so, holding her exactly where you want her. You guide your " + ck + " between her thick thighs to the slick, puffy lips of her pussy and slowly squeeze her down onto it, your coils tightening by degrees until she’s taken every inch.",
                "She’s hot and impossibly wet, her twin clits throbbing against you as she stretches, and she moans so loudly that something rattles in the bulkhead. " + q("Oh, <i>stars,</i> that’s... yeah. Yeah. Don’t stop."),
                "You don’t. Your coils rock her up and down your length in long, slow, rolling waves, and she wraps her arms around the loop across her chest and hangs on, gasping. It doesn’t feel like the rough, greedy fucks the two of you usually share. It feels like something you’re building together."
            );
        } else {
            lines.push(
                "She lies back on her bunk and pulls you down on top of her, her thick thighs locking around your hips, her little hands finding your face. " + q("Like this,") + " she whispers. " + q("I want to see you."),
                "You line your " + ck + " up with the slick, puffy lips of her pussy and push in slowly. She’s hot and impossibly wet, her twin clits throbbing against you as she stretches around you, and she moans so loudly that something rattles in the bulkhead. " + q("Oh, <i>stars,</i> that’s... yeah. Yeah. Don’t stop."),
                "You don’t. You rock into her with long, deep, careful strokes, and she meets every one of them, her heels digging into your back, her ears jingling with every thrust. She kisses you between gasps. It doesn’t feel like the rough, greedy fucks the two of you usually share. It feels like something you’re building together."
            );
        }
        // Steele's own body (TN_SteeleBody_v2.9.js): prehensile cock, suula venom. Shekka is raskvel: two clits.
        lines.push(safe(function () { return window.tnSteeleSex ? window.tnSteeleSex.vag({ who: "Shekka", npc: shekka, clits: safe(function () { return shekka.vaginas[0].clits; }, 2), cock: x }) : ""; }, ""));
        lines.push(
            "You can feel the difference in her, too. She wants this, achingly, but she’s <i>here</i> with you, not lost somewhere behind her eyes. She talks to you the whole time: telling you how good you feel, asking you to go slower, then faster, laughing when her ears tangle in " + body({ biped: "your hair", taur: "the sheets", naga: "the sheets" }) + ".",
            "When she cums, she cums hard, clamping down around you, her whole body shaking. " + q("Now,") + " she gasps. " + q("Please, [pc.name]. Fill me up. Give me our egg."),
            "That does it. You bury yourself in her as deep as you can go and let go, flooding her with [pc.cum], pulse after pulse of it, until she’s overflowing and you can feel it slicking both of you. Shekka holds onto you through every throb, eyes squeezed shut, murmuring something too quiet to hear.",
            "Afterwards, the two of you lie tangled together in the damp sheets. Shekka rests a hand low on her belly and keeps it there.",
            q("I think it took,") + " she whispers. " + q("I don’t know how I know. But I think it did."),
            "<b>Shekka is pregnant with your egg.</b>"
        );
        say(lines);
        flags.TN_SKE_PREG_TS = now();
        flags.TN_SKE_ASKED = 1;
        safe(function () { pc.orgasm(); });
        safe(function () { shekka.orgasm(); });
        safe(function () { processTime(45 + rand(15)); });
        safe(function () { flags.TIMES_SEXED_SHEKKA = (Number(flags.TIMES_SEXED_SHEKKA) || 0) + 1; });
        backTo(talkMenu);
    }

    /* ---------- Any of the game's own Shekka sex scenes can take ---------- */
    function canCatch() { return ready() && !pregnant() && !cooling(); }
    function catchChance() { return Math.min(0.8, 0.25 * Math.max(0, safe(function () { return pc.virility(); }, 1))); }
    function wrapShekka() {
        try {
            if (typeof shekka === "undefined" || !shekka || typeof shekka.loadInCunt !== "function" || shekka.loadInCunt.__tnShekkaEggs) return;
            var orig = shekka.loadInCunt;
            var wrapped = function (from) {
                var r = orig.apply(this, arguments);
                try {
                    var isPc = from && (from === pc || (typeof from.getClassName === "function" && from.getClassName() === "PlayerCharacter"));
                    if (isPc && canCatch() && safe(function () { return from.hasCock(); }, false) && virile() && Math.random() < catchChance()) {
                        flags.TN_SKE_PREG_TS = now();
                        flags.TN_SKE_SURPRISE = 1;
                    }
                } catch (err) {}
                return r;
            };
            wrapped.__tnShekkaEggs = true;
            shekka.loadInCunt = wrapped;
        } catch (err) {}
    }
    setInterval(wrapShekka, 2000);

    function surpriseScene(talkMenu) {
        start();
        var asked = num("TN_SKE_ASKED") === 1;
        say([
            "Before you can say a word, Shekka grabs your wrist and drags you into her bunk, shutting the door behind you. Her ears are jingling like an alarm.",
            q("Okay. So. Don’t freak out.") + " She takes a breath. " + q("Doc gave me one of those little home scanners, for after the treatment. I ran it this morning just to check it was calibrated right.") + " She holds it up. The tiny screen shows a soft, pulsing dot of light. " + q("It’s calibrated right."),
            asked
                ? q("We weren’t even trying that time! I mean, we were <i>trying,</i> just not... <i>trying</i> trying.") + " She starts to laugh, a little hysterically. " + q("Guess your stuff didn’t get the memo.")
                : q("I was gonna ask you. I swear I was gonna ask you first, properly, with a speech and everything. I had notes!") + " She starts to laugh, a little hysterically. " + q("Guess your stuff didn’t wait for the speech."),
            "She presses the scanner into your hand and then wraps both of hers around it, around yours. Her eyes are shining.",
            q("I’m happy, [pc.name]. I’m really, really happy. Are you?"),
            "You tell her yes. She hugs you so hard her ears clang against the bulkhead.",
            "<b>Shekka is pregnant with your egg.</b>"
        ]);
        flags.TN_SKE_SURPRISE = 0;
        flags.TN_SKE_ASKED = 1;
        safe(function () { processTime(10); });
        backTo(talkMenu);
    }

    /* ---------- Pregnancy ---------- */
    function pregScene(talkMenu) {
        start();
        var d = pregDay();
        var lines = ["You ask Shekka how she and the egg are doing."];
        if (d <= 4) {
            lines.push(
                q("Can’t tell a thing yet!") + " She pats her flat belly. " + q("Doc says it’ll be a few days before I start showing. I’ve been eating like a krem-hog, though. Don’t tell Anno I finished the cereal."),
                q("Mostly I just keep thinking about it.") + " She smiles down at her stomach. " + q("Little you-and-me, in there. It’s so weird. It’s so good.")
            );
        } else if (d <= 10) {
            lines.push(
                "Shekka’s jumpsuit has started to strain over a round, firm little bump between her wide hips. She’s working on a power coupling and doesn’t stop, just turns so you can see her profile. " + q("Look at that! I’m <i>showing!</i>"),
                q("It’s already got a shell, doc says. That’s why it’s so firm.") + " She takes your hand and presses it to her belly. " + q("I keep catching myself talking to it. Explaining what I’m fixing. It’s an egg, it can’t hear me. Doesn’t matter. It’s getting an education."),
                q("And no, before you ask, I’m not slowing down. I can still fit in the ducts. Mostly.")
            );
        } else {
            lines.push(
                "Shekka is round and heavy now, her belly jutting proudly out between her broad hips, the jumpsuit unzipped halfway down because it just won’t close any more. She’s moved her whole workbench next to her bunk so she can keep tinkering without walking far.",
                q("Any day now.") + " She rubs her belly in slow circles. " + q("It’s sitting real low. I can feel it shift when I stand up. Doc sent me a whole checklist. Water, rest, don’t go in the ducts.") + " She sighs. " + q("I miss the ducts."),
                q("I’ll email you the second it starts, okay? You better be here.") + " She pokes your " + body({ biped: "chest", taur: "flank", naga: "chest" }) + ". " + q("I mean it, Captain.")
            );
        }
        if (eggIncubating()) lines.push(q("And Briget sent another holo of our first one today. Still in the incubator, still perfect.") + " She beams. " + q("Big sibling energy."));
        say(lines);
        safe(function () { processTime(10); });
        clearMenu();
        addButton(0, "Rub Belly", function () {
            start();
            say([
                "You " + body({ biped: "kneel down beside her", taur: "fold your legs and settle down beside her", naga: "lower yourself on your coils beside her" }) + " and rest both hands on her belly. Shekka sighs happily and leans back, ears jingling softly as you rub slow, warm circles over the round curve of it.",
                d > 4 ? "Under your palms you can feel the firm, smooth shape of the egg inside her. It’s strange, and wonderful, and Shekka watches your face the whole time with a soft, silly little smile." : "There’s nothing to feel yet, but Shekka doesn’t care. She closes her eyes and hums, and for a while the two of you just sit there.",
                q("Best captain,") + " she murmurs. " + q("Best everything.")
            ]);
            safe(function () { processTime(15); });
            safe(function () { pc.changeLust(5); });
            backTo(talkMenu);
        }, "Rub Belly", "Spend a little time with Shekka and the egg.");
        addButton(14, "Back", function () { if (typeof talkMenu === "function") talkMenu(); else mainGameMenu(); });
    }

    /* ---------- Laying ---------- */
    function sendToNursery() {
        if (eggIncubating()) hatch(); // never more than one egg in the incubator
        flags.TN_SKE_PREG_TS = undefined;
        flags.TN_SKE_LAID = num("TN_SKE_LAID") + 1;
        flags.TN_SKE_LAY_TS = now();
        flags.TN_SKE_EGG_TS = now();
        ensureMail();
    }
    function layScene(talkMenu) {
        start();
        var n = num("TN_SKE_LAID") + 1;
        say([
            "You find Shekka in her bunk, propped up on every pillow she owns plus a few you’re pretty sure are yours. Her belly is huge and low and tight, and she’s breathing in long, careful puffs, one hand braced on the bulkhead.",
            q("There you are!") + " She grabs for your hand and squeezes it hard enough to hurt. " + q("Good. Great. You’re here. It’s coming. It’s really coming."),
            body({
                biped: "You climb up onto the bunk behind her and let her lean back against your chest,",
                taur: "You fold your legs and settle down beside the bunk, your flank against the edge of it, and she leans back against you,",
                naga: "You coil up around the bunk and let her lean back against a thick loop of your tail,"
            }) + " her ears jingling with every shaky breath. She’s strong, and so focused it’s almost frightening. Each time the next push takes her, she grits her teeth and bears down, and each time she sags back against you after, panting, laughing a little.",
            q("Doc said,") + " she gasps, " + q("doc said the new genes make it easier. Not a big clutch. Just one. Just one big, beautiful...") + " She bears down again, hard, with a long low groan. " + q("...big. Really big. Why is it <i>so big,</i> [pc.name]?"),
            "And then, with one last push, it’s there.",
            "Shekka reaches down between her thighs and lifts it up into the light with shaking hands: a smooth, heavy egg, a little bigger than both your fists together, its pale shell speckled with pink. Exactly the pink of her feathers.",
            "She doesn’t say anything at all for a long time. She just holds it against her chest and looks at it, and her ears are completely, perfectly still.",
            q("Hi,") + " she whispers to it, finally. " + q("Hi. I’m your mom. That’s your [pc.daddyMommy]. We’ve been waiting for you.") + " She looks up at you with tears running down her face and the biggest smile you’ve ever seen on her. " + q("We did it. [pc.name], we <i>did</i> it."),
            "The two of you stay like that for a long time, wrapped around each other and the egg, while the ship hums quietly around you.",
            "Later, once Shekka has washed up and changed into a clean jumpsuit and checked the egg over approximately forty times, she lets you call the Steele Tech nursery on Tavros. A courier drone is waiting in the airlock within the hour: a padded, heated travel cradle with a Steele Tech logo on the lid. Shekka spends twenty minutes inspecting it before she’ll let the egg anywhere near it, and attaches a twelve-page document of handling instructions to the side.",
            q("It’s gonna get the best of everything there,") + " she says, watching the drone go, her hand tight in yours. " + q("Real teachers. Real doctors. Grandma Briget.") + " She sniffs. " + q("Best-educated raskvel in the galaxy."),
            "<b>Shekka laid your egg" + (n > 1 ? " (egg #" + n + ")" : "") + ", and it’s on its way to the nursery on Tavros.</b>"
        ]);
        sendToNursery();
        safe(function () { processTime(180); });
        backTo(talkMenu);
    }
    function soloLaidScene(talkMenu) {
        start();
        say([
            "Shekka is sitting on her bunk with a datapad in her lap, much flatter than when you saw her last. She looks up when you come in, and you can’t tell if she’s about to hug you or throw a wrench at you.",
            q("You missed it,") + " she says. Then she sighs, and her ears droop. " + q("I know, I know. Captain stuff. Things blow up, people need saving. I get it.") + " She holds out the datapad. " + q("It came anyway. It didn’t want to wait for you. Stubborn. Wonder where it got that."),
            "On the screen is a photo: Shekka in her bunk, exhausted and grinning, holding a smooth, heavy egg speckled with the exact pink of her feathers.",
            q("I wasn’t alone, don’t worry. Half the crew crammed into my bunk to hold my hand. I wasn’t really paying attention to whose.") + " She leans against you. " + q("It’s already at the nursery. Briget says it’s perfect. Of course it is."),
            q("You’re gonna be there for the next one, though.") + " She pokes you. " + q("Right?"),
            "You promise."
        ]);
        flags.TN_SKE_SOLO = 0;
        safe(function () { processTime(10); });
        backTo(talkMenu);
    }

    /* ---------- The nursery ---------- */
    function hatch() {
        if (!eggIncubating()) return;
        var n = num("TN_SKE_HATCHED") + 1;
        var born = num("TN_SKE_EGG_TS") + INCUBATION;
        var sex = 3;
        try {
            var cm = gameModule(36956), cl = gameModule(66376);
            if (cm && cm.kd && cl && cl.U && typeof cl.U.NewChild === "function") {
                var race = (window.GLOBAL && GLOBAL.TYPE_RASKVEL !== undefined) ? GLOBAL.TYPE_RASKVEL : 0;
                var c = cl.U.NewChild(race, 1, 1, 45, 45, 10, 0);
                c.BornTimestamp = Math.min(born, now());
                cm.kd.addChild(c);
                sex = c.NumIntersex > 0 ? 3 : c.NumMale > 0 ? 1 : c.NumFemale > 0 ? 2 : 3;
            }
        } catch (err) { try { console.warn("[Shekka's Eggs] could not add the child to the nursery", err); } catch (e2) {} }
        try {
            var st = gameModule(31317);
            if (st && st.s && typeof st.s.track === "function") {
                st.s.track("pregnancy/shekka sired", 1);
                st.s.track("pregnancy/total sired", 1);
                st.s.track("pregnancy/total day care", 1);
            }
        } catch (err) {}
        flags["TN_SKE_SEX_" + n] = sex;
        flags.TN_SKE_HATCHED = n;
        flags.TN_SKE_EGG_TS = undefined;
        ensureMail();
    }

    /* ---------- Clock: late laying and hatching ---------- */
    function tick() {
        try {
            if (!on() || !hasFlags()) return;
            if (pregnant() && now() - num("TN_SKE_PREG_TS") >= GESTATION + LATE) {
                sendToNursery();
                flags.TN_SKE_SOLO = 1;
            }
            if (eggIncubating() && now() - num("TN_SKE_EGG_TS") >= INCUBATION) hatch();
            ensureMail();
        } catch (err) {}
    }
    setInterval(tick, 3000);

    /* ---------- Email ---------- */
    function parse(t) { return typeof ParseText === "function" ? ParseText(t) : t; }
    function dueMail(n) { return {
        content: function () {
            return parse("[pc.name]!!!\n\nIt's happening. Like, right now. The egg is coming and I'm in my bunk and I am NOT going in the ducts, I promise.\n\nCome. Please. I want you here.\n\n-Shekka\n\nP.S. I'm fine. Doc's checklist says breathing is good, so I'm doing a LOT of breathing.");
        },
        subject: "IT'S TIME",
        from: "Shekka",
        fromAddress: "shekka_mail@GalLink.org",
        test: function () { return on() && hasFlags() && (num("TN_SKE_LAID") >= n || (num("TN_SKE_LAID") === n - 1 && due())); }
    }; }
    function arriveMail(n) {
        return {
            content: function () {
                var first = n === 1;
                var t = "Dear [pc.name],\n\n" + (first
                    ? "Your egg has arrived safely at the nursery, along with a twelve-page set of handling instructions from its mother. I have read all twelve pages. I have also implemented all twelve pages. And then some.\n\nThe incubator has been retuned to the exact temperature and humidity of a Tarkus sand nest in the warm season, per page three. It has been padded with a blanket that smells of its mother, per page five. Its shell is turned by hand every four hours, per page seven, and I sing to it while I do it, which is not on any page but which I did for you, too.\n\nDr. Rewell came by from Ketria Clinic this morning to scan it, free of charge, and pronounced it, quote, \"Perfect. Absolutely perfect. Look at that heartbeat.\" He stayed for two hours. A receptionist from the same clinic sent over a little knitted cozy for the incubator. It has wings on it.\n\nWe have also hired a raskvel tutor, a soil-chemistry engineer and a children's mechanic for when the little one is ready. I believe its mother will approve.\n\nI will write again the moment it hatches. Expect about two weeks."
                    : "Another egg from Shekka has arrived safely, along with an updated set of handling instructions. Fourteen pages this time. I have implemented all fourteen, the old incubator has been warmed back up, and its older sibling's knitted cozy has been passed down with great ceremony. Dr. Rewell scanned it this morning and says it is perfect.\n\nI will write again when it hatches.") + "\n\nWith love,\n\nBriget";
                return parse(t);
            },
            subject: n === 1 ? "Your egg has arrived" : "Another egg has arrived",
            from: "Briget",
            fromAddress: "Briget@SteeleTech.corp",
            test: function () { return on() && hasFlags() && num("TN_SKE_LAID") >= n; }
        };
    }
    function hatchMail(n) {
        return {
            content: function () {
                var k = kidWord(n);
                var pro = k === "son" ? ["He", "his"] : k === "daughter" ? ["She", "her"] : ["They", "their"];
                var verb = k === "child" ? "have" : "has";
                var t = "Dear [pc.name],\n\nShekka's egg has hatched! You and Shekka have a beautiful, healthy baby raskvel " + (k === "child" ? "child" : k === "son" ? "boy" : "girl") + ". " + pro[0] + " " + verb + " " + pro[1] + " mother's pink feathers, " + pro[1] + " mother's very loud voice, and, I am told, " + pro[1] + " [pc.daddyMommy]'s stubborn streak.\n\n" + (n === 1
                    ? "The first thing " + pro[1] + " little hands did, about ten minutes after hatching, was take apart a feeding bottle. The tutor wept with joy. So did I, a little, in whatever way an old nurse-droid can.\n\n"
                    : "" + pro[0] + " " + (k === "child" ? "were" : "was") + " greeted by an older sibling, who announced to the entire nursery that the new arrival was \"mine to teach.\" We are monitoring the situation.\n\n") + "Hologram technology was used to emulate you and Shekka so the little one knows their parents' faces, but please do visit when you can. And please tell Shekka the incubator met every one of her specifications. Every one.\n\nWith love,\n\nBriget";
                return parse(t);
            },
            subject: n === 1 ? "Shekka's egg has hatched!" : "Another hatchling!",
            from: "Briget",
            fromAddress: "Briget@SteeleTech.corp",
            test: function () { return on() && hasFlags() && num("TN_SKE_HATCHED") >= n; }
        };
    }
    function addMail(id, entry) {
        if (window.tnMailHx[id]) return;
        window.tnMailHx[id] = entry;
        if (!window.tnMailMgr.hasEntry || !window.tnMailMgr.hasEntry(id)) window.tnMailMgr.addMailEntry(id, entry);
    }
    function ensureMail() {
        try {
            if (!window.tnMailHx || !window.tnMailMgr) return false;
            var laid = hasFlags() ? num("TN_SKE_LAID") : 0, hatched = hasFlags() ? num("TN_SKE_HATCHED") : 0;
            for (var d = 1; d <= laid + 1; d++) addMail("tn_shekka_eggs_due_" + d, dueMail(d));
            for (var i = 1; i <= Math.max(1, laid); i++) addMail("tn_shekka_eggs_arrive_" + i, arriveMail(i));
            for (var j = 1; j <= Math.max(1, hatched); j++) addMail("tn_shekka_eggs_hatch_" + j, hatchMail(j));
            return true;
        } catch (err) { return true; }
    }
    if (!ensureMail()) {
        var mailTries = 0;
        var mailTimer = setInterval(function () { if (ensureMail() || ++mailTries >= 300) clearInterval(mailTimer); }, 200);
    }

    window.tnShekkaEggs = { ready: ready, pregnant: pregnant, due: due, hatch: hatch, tick: tick, wrap: wrapShekka };
})();
