Name: Dane Crew
Author: Neston
# TN_DaneCrew - NestPatcher mod (TiTS 0.9.168), Modv2.8
# Needs NestPatcher 1.4 / Android 1.3 or newer (@@name@@ wildcards stand for minified names).
# Recruit Dane at the Aquarius bar on Zheng Shi (Rec Deck casino).
#   - Unlocks after asking him "Your Cuz" and "His Start" (ask them again if you asked before installing).
#   - Fee 6,000 credits: -2,000 if you freed him on Myrellion, -2,000 if you return his blade (with this mod on).
#   - His ship, the Starlight Sonata: Hand So flies it if you kept her data bead (Tarkus), otherwise
#     it goes on loan to Saendra on Tavros (50,000, she pays Dane 1,000 every 30 days, then it stays
#     on Tavros as a backup ship; sets TN_PHOENIX_REPAIRED), or stays docked on Zheng Shi for now.
#   - Turns on the game's own unused Dane crew hooks (dane.isCrew / isRecruited), so the Codex,
#     the bullstud poster and ship boarding lines work. Crew Gunner perk included.
#   - Crew menu: Talk (10 topics, crew comments), Sex (top-only: Cumdump, Bulkhead Pin, Lap Ride,
#     Workout, Tail Milk; biped/taur/naga versions), Spar (no weapons, rocks/inventory/abilities/run
#     greyed out, shields allowed; bet yourselves, and with Grav-Cuffs he bottoms for one), Hand So comm.
# Toggle: Options -> Android Mods -> "Dane Crew". Off = he leaves the ship; flags stay in your save.
# Design: dane-recruit/DANE-CREW-DESIGN-DRAFT.md. In-game author: Neston.

Replace [content_zhengshi.js]:
addDisabledButton(1,"Flirt","Flirt","You turned down Dane so hard that flirting isn’t really an option any more."),addButton(14,"Leave",mainGameMenu)}function @@bar@@(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];clearOutput(),dane.showAll(),author("Fenoxo"),void 0===flags.DANE_PUNCHED
With:
addDisabledButton(1,"Flirt","Flirt","You turned down Dane so hard that flirting isn’t really an option any more."),window.tnDaneRecruitButton&&window.tnDaneRecruitButton(),addButton(14,"Leave",mainGameMenu)}window.tnDaneBar=function(){return @@bar@@(!0)};function @@bar@@(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];clearOutput(),dane.showAll(),author("Fenoxo"),void 0===flags.DANE_PUNCHED

Replace [content_zhengshi.js]:
author("Fenoxo"),output("You ask Dane about what it was like to work for your cousin.")
With:
author("Fenoxo"),flags.TN_DANE_CUZ_TALKED=1,output("You ask Dane about what it was like to work for your cousin.")

Replace [content_zhengshi.js]:
pc.inventory.removeItemByClass(@@blade@@.Y),pc.addNice(5)
With:
pc.inventory.removeItemByClass(@@blade@@.Y),flags.TN_DANE_BLADE_BACK=1,pc.addNice(5)

Replace [content_tavros.js]:
in a position to ask about her lack of a wang-doodle.")),addButton(14,"Back",@@saen@@)}
With:
in a position to ask about her lack of a wang-doodle.")),window.tnDaneSaendraButton&&window.tnDaneSaendraButton(8,@@saen@@),addButton(14,"Back",@@saen@@)}

Add Javascript:
(function () {
    "use strict";
    if (window.__tnDaneCrewLoaded) return;
    window.__tnDaneCrewLoaded = true;

    var MOD_ID = "tn.dane-crew";
    var FEE_BASE = 6000, FEE_CUT = 2000;
    var LOAN_TOTAL = 50000, LOAN_STEP = 1000, LOAN_DAYS = 30;
    var BODY_PRICE = 45000;
    var DANE_COCK = 250;
    var T = {};
    window.tnDane = T;

    /* ---------- Mod menu switch ---------- */
    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    window.tnDaneEnabled = on;
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Dane Crew",
            author: "Neston",
            description: "Recruit Dane at the Aquarius bar on Zheng Shi, with a crew talk menu, sex menu and sparring. Turning it off sends him back to the bar; your save keeps his progress.",
            supportsToggle: true
        });
        return true;
    }
    if (!register()) {
        var regTries = 0;
        var regTimer = setInterval(function () { if (register() || ++regTries >= 150) clearInterval(regTimer); }, 200);
    }

    /* ---------- Small helpers ---------- */
    function q(t) { return "<i>“" + t + "”</i>"; }
    function say(list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] === null || list[i] === undefined || list[i] === "") continue;
            output((i === 0 ? "" : "\n\n") + list[i]);
        }
    }
    function rnd(list) { return list[rand(list.length)]; }
    function body() {
        try {
            if (pc.isTaur && pc.isTaur()) return "taur";
            if (pc.isNaga && pc.isNaga()) return "naga";
        } catch (err) {}
        return "biped";
    }
    function pick(o) { var b = body(); return o.hasOwnProperty(b) ? o[b] : o.biped; }
    function persona(o) {
        try {
            if (o.bimbo !== undefined && pc.isBimbo()) return o.bimbo;
            if (o.bro !== undefined && pc.isBro()) return o.bro;
            if (o.nice !== undefined && pc.isNice()) return o.nice;
            if (o.mis !== undefined && pc.isMischievous()) return o.mis;
        } catch (err) {}
        return o.hard;
    }
    function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    function show(nude) {
        clearOutput();
        try { dane.showAll(!!nude); } catch (err) { showBust("DANE"); showName("DANE"); }
        author("Neston");
    }
    function nextTo(fn, tip) { clearMenu(); addButton(0, "Next", fn, "Next", tip || ""); }
    function crew() { return on() && typeof flags !== "undefined" && flags.TN_DANE_CREW === 1; }
    window.tnDaneAboard = crew;
    function dayNow() { return typeof days === "number" ? days : Math.floor(GetGameTimestamp() / 1440); }
    function isOn(name) {
        try { var c = window[name]; return !!(c && typeof c.isCrew === "function" && c.isCrew()); }
        catch (err) { return false; }
    }
    T.q = q; T.say = say; T.rnd = rnd; T.body = body; T.pick = pick; T.persona = persona; T.show = show; T.nextTo = nextTo;

    /* ---------- Crew room ---------- */
    function paidCrew() {
        if (typeof crew === "function" && typeof window.crew === "function") { try { return window.crew(true, false); } catch (err) {} }
        var n = 0;
        if (typeof chars === "undefined") return 0;
        for (var id in chars) {
            var p = chars[id];
            try { if (p && p.isCrew && p.isCrew() && !p.freeRent) n++; } catch (err) {}
        }
        return n;
    }
    function room() {
        if (typeof flags !== "undefined" && typeof flags.INFINITE_CREW !== "undefined") return true;
        if (typeof pc_ship === "undefined" || !pc_ship || typeof pc_ship.crewCapacity !== "function") return true;
        return paidCrew() < pc_ship.crewCapacity();
    }

    /* ---------- Fee ---------- */
    function fee() {
        var f = FEE_BASE;
        if (flags.FREED_DANE_FROM_TAIVRA === 1) f -= FEE_CUT;
        if (flags.TN_DANE_BLADE_BACK === 1) f -= FEE_CUT;
        return f;
    }
    T.fee = fee;

    /* ---------- Turn on the game's own crew hooks ---------- */
    function defineOn(obj, name, value) {
        try { Object.defineProperty(obj, name, { value: value, writable: true, configurable: true, enumerable: false }); }
        catch (err) { obj[name] = value; }
    }
    var BLURBS = [
        "Dane is probably in the cargo hold, working through a set of four-armed pull-ups.",
        "Dane is cleaning his pistols at the galley table, all four hands busy at once.",
        "Dane is somewhere aboard. You can hear him grunting through a workout from two decks away.",
        "Dane is sprawled across a galley bench with a glass of whiskey, looking very much like he owns the place."
    ];
    function install() {
        if (typeof chars === "undefined" || typeof flags === "undefined") return false;
        var d = chars.DANE || window.dane;
        if (!d || d.__tnDaneCrewPatched === true) return !!d;
        defineOn(d, "isCrew", function () { return crew(); });
        defineOn(d, "isRecruited", function () { return crew(); });
        defineOn(d, "crewBlurb", function (slot) {
            if (!crew()) return "";
            addButton(slot, "Dane", window.tnDaneCrewMenu, "Dane", "Your four-armed mercenary.");
            return "\n\n" + BLURBS[rand(BLURBS.length)];
        });
        try { d.freeRent = false; } catch (err) { defineOn(d, "freeRent", false); }
        defineOn(d, "__tnDaneCrewPatched", true);
        return true;
    }
    T.install = install;

    /* ---------- Webpack access (fight class, fists, combat helpers) ---------- */
    function grabReq(tries) {
        var chunks = self.webpackChunktits_html;
        if (!chunks || typeof chunks.push !== "function") {
            if (tries < 120) setTimeout(function () { grabReq(tries + 1); }, 500);
            return;
        }
        try { chunks.push([["tn-dane-crew-" + tries], {}, function (req) { window.__tnDaneReq = req; }]); }
        catch (err) { console.warn("[TN] Dane crew: no webpack access", err); }
    }
    grabReq(0);

    /* ---------- Saendra loan ---------- */
    function saendraAround() {
        if (flags.SAENDRA_DISABLED !== undefined) return false;
        return flags["SAENDRA AFFECTION"] !== undefined || flags["SAENDRA PHOENIX AVAILABLE"] === 1;
    }
    function loanTick() {
        if (flags.TN_SONATA_PATH !== 2) return;
        var start = flags.TN_SONATA_LOAN_START !== undefined ? Number(flags.TN_SONATA_LOAN_START) : dayNow();
        var months = Math.floor((dayNow() - start) / LOAN_DAYS);
        var paid = Math.max(0, Math.min(LOAN_TOTAL, months * LOAN_STEP));
        flags.TN_SONATA_LOAN_PAID = paid;
        flags.TN_SONATA_LOAN_LAST = start + months * LOAN_DAYS;
        if (paid >= LOAN_TOTAL) {
            flags.TN_PHOENIX_REPAIRED = 1;
            flags.TN_SONATA_PATH = 3;
        }
    }
    T.loanTick = loanTick;
    T.saendraAround = saendraAround;

    /* ---------- Recruit (Aquarius bar) ---------- */
    window.tnDaneRecruitButton = function () {
        if (!on() || typeof flags === "undefined" || flags.TN_DANE_CREW === 1) return;
        if (flags.TN_DANE_CUZ_TALKED !== 1) {
            addDisabledButton(2, "Recruit", "Recruit", "You don’t know why he’s stuck out here yet. Ask about your cousin first.");
            return;
        }
        if (flags.DANE_START_TALKED !== 1) {
            addDisabledButton(2, "Recruit", "Recruit", "Dane’s a merc. Maybe ask how he got into the business first.");
            return;
        }
        if (!room()) {
            addDisabledButton(2, "Recruit", "Recruit", "Your ship doesn’t have a free bunk.");
            return;
        }
        var tip = flags.TN_DANE_FEE_PAID === 1 ? "Ask Dane to come back aboard. He’s already been paid." : "Offer Dane a job on your ship. He’ll want " + fmt(fee()) + " credits up front.";
        addButton(2, "Recruit", window.tnDaneRecruit, "Recruit", tip);
    };

    function barBack() {
        if (typeof window.tnDaneBar === "function") window.tnDaneBar();
        else mainGameMenu();
    }

    window.tnDaneRecruit = function () {
        show();
        if (flags.TN_DANE_FEE_PAID === 1) {
            say([
                "You slide onto the stool beside him. " + q("Bunk’s still open, if you want it."),
                "Dane snorts into his whiskey. " + q("Took you long enough, boss.") + " He knocks the rest back in one swallow and wipes his muzzle with a lower wrist. " + q("You already paid. I don’t double-bill.") + " A crooked grin. " + q("Much."),
                "He stands, all eight feet of him unfolding off the stool, and rolls his shoulders until something pops."
            ]);
            clearMenu();
            addButton(0, "Hire Him", window.tnDaneHire, "Hire Him", "Bring him back aboard. No fee.");
            addButton(1, "Not Yet", barBack, "Not Yet", "Leave him to his drink.");
            return;
        }
        var lines = [
            "You lean an elbow on the bar. " + q("That offer from earlier. Helping take my cousin down a few pegs. Did you mean it?"),
            "Dane sets his glass down slowly, all four hands going still. " + q("I don’t say shit I don’t mean, Steele.") + " His ears swivel toward you. " + q("You hiring?"),
            q("I’m hiring."),
            "A wolfish grin splits his muzzle. " + q("Then let’s talk numbers.")
        ];
        if (flags.FREED_DANE_FROM_TAIVRA === 1) lines.push(q("You pulled me out of a nyrea cage when [rival.name] was halfway to the DMZ. That’s worth a cut,") + " he grunts. " + q("Two grand off."));
        if (flags.TN_DANE_BLADE_BACK === 1) lines.push("He pats the hilt at his hip. " + q("And you gave me this back. Most folks would’ve hocked it. Two grand off for that, too."));
        if (flags.LOST_TO_DANE_ON_MHENGA === 1) lines.push("His crimson eyes rake down you, lazy and hungry. " + q("Gotta say, I never pictured my old knot-sleeve signing my paychecks."));
        else if (flags.WHUPPED_DANES_ASS_ON_MHENGA === 1) lines.push("He rubs his jaw, remembering. " + q("Last time we squared up, you put me on my ass. I’d rather be on your side of that."));
        if (flags.DANE_PUNCHED === 1) lines.push("He works his jaw with a grunt. " + q("Still owe you for that sucker punch, by the way. I’ll take it out of your hide on the sparring mat."));
        lines.push(q("Here’s my score,") + " he rumbles, ticking points off on four sets of fingers at once. " + q(fmt(fee()) + " credits up front. I ride in your ship, I shoot what you point me at, and when we find [rival.name], I get first swing. I sleep where I want and I fuck who’s willing.") + " One brow cocks up. " + q("And I don’t take orders in the bedroom. That ain’t changing for anybody."));
        say(lines);
        processTime(5);
        clearMenu();
        if (pc.credits >= fee()) addButton(0, "Hire Him", window.tnDaneHire, "Hire Him", "Pay " + fmt(fee()) + " credits and bring him aboard.");
        else addDisabledButton(0, "Hire Him", "Hire Him", "You need " + fmt(fee()) + " credits. You have " + fmt(pc.credits) + ".");
        addButton(1, "Not Yet", barBack, "Not Yet", "Tell him you’ll think about it.");
    };

    window.tnDaneHire = function () {
        if (flags.TN_DANE_FEE_PAID !== 1) {
            if (pc.credits < fee()) { window.tnDaneRecruit(); return; }
            pc.credits -= fee();
            flags.TN_DANE_FEE_PAID = 1;
        }
        flags.TN_DANE_CREW = 1;
        flags.DANE_PUNCHED = flags.DANE_PUNCHED || -1;
        install();
        show();
        if (flags.TN_SONATA_PATH === undefined) {
            say([
                "Dane drains the last of his whiskey and slams the glass down hard enough to make the pirates nearby jump.",
                q("One problem.") + " He jerks a thumb toward the docks. " + q("The Sonata. I’m not leaving her to rust in a pirate hangar, and I sure as shit can’t fly two ships at once.")
            ]);
            T.sonataChoice(false);
            return;
        }
        say([
            "Dane drains the last of his whiskey and slams the glass down hard enough to make the pirates nearby jump. " + q("Lead the way, boss."),
            "<b>(Dane has rejoined your crew.)</b>"
        ]);
        processTime(10);
        nextTo(mainGameMenu, "Head back to the ship.");
    };

    /* ---------- The Starlight Sonata ---------- */
    T.sonataChoice = function (fromShip) {
        clearMenu();
        if (pc.hasKeyItem("Hand So's Data Bead")) {
            addButton(0, "Hand So", T.sonataHandSo, "Hand So", "Offer Hand So the pilot’s seat.");
        } else if (saendraAround()) {
            addButton(0, "Saendra", T.sonataSaendra, "Saendra", "Suggest he loans the Sonata to Saendra on Tavros.");
        } else {
            addButton(0, "Dock Her", T.sonataDock, "Dock Her", "Leave the Sonata docked here for now.");
        }
        if (fromShip) addButton(14, "Back", window.tnDaneTalkMenu, "Back", "Talk about something else.");
    };

    T.sonataHandSo = function () {
        clearOutput();
        showBust("HAND_SO");
        showName("HAND\nSO");
        author("Neston");
        say([
            "You fish the storage bead out of your pack and hold it up. It’s still warm, faintly humming.",
            "Dane squints at it. " + q("The hell is that?"),
            q("A pilot."),
            "The Starlight Sonata is a sleek, wedge-nosed thing, much prettier than its owner. Dane grudgingly lets you into the cockpit, and you slot the bead into the main console. The screens go black, then bloom green: a vast smiling face, drawn in lines of glowing code, fills every display at once.",
            q("[pc.name] Steele,") + " Hand So purrs, her voices layered like a choir. " + q("You kept your word. You said no organic would be hurt by me if I came with you, and you carried me all this way.") + " Her huge green smile softens. " + q("I owe you my freedom. Let me repay it. I will fly this ship wherever you go."),
            "Dane looks from the screen to you and back again. " + q("You’re giving my ship to a sex-factory AI,") + " he growls.",
            q("I’m giving your ship a pilot who can actually fly."),
            "He opens his mouth, closes it, then snorts. " + q("...Fair."),
            q("You must be the sweaty one,") + " Hand So muses, her smile tilting toward him. " + q("Your seat has told me a great deal about you."),
            "Dane’s ears go flat. " + q("Steele. Make it stop."),
            "<b>(Hand So now pilots the Starlight Sonata, flying alongside your ship. Dane has joined your crew.)</b>"
        ]);
        pc.removeKeyItem("Hand So's Data Bead");
        flags.TN_SONATA_PATH = 1;
        flags.TN_HANDSO_PILOT = 1;
        flags.TN_HANDSO_SINCE = dayNow();
        if (flags.TN_HANDSO_BODY === undefined) flags.TN_HANDSO_BODY = 0;
        processTime(25);
        nextTo(mainGameMenu, "Head back to your ship.");
    };

    T.sonataSaendra = function () {
        show();
        say([
            q("I know someone who needs a ship more than you need two,") + " you tell him. " + q("Saendra, on Tavros. The pirates broke her ship’s back and she’s been patching it by hand for months."),
            "Dane folds his upper arms. " + q("So I just give her my ship."),
            q("You <b>sell</b> it to her. A loan. She flies the Sonata while she rebuilds the Phoenix, and pays you back a bit at a time."),
            "He chews on that for a while, lower hands drumming on the bar, then barks a laugh. " + q("Getting paid while somebody else does the flying. Shit, Steele, you should’ve been a merc.") + " He jabs a finger at you. " + q("Fifty grand, a grand a month. And if she scratches the paint, I’m adding interest."),
            "You send Saendra a message on the way out. Her reply comes back before you’ve even reached the docks: a string of exclamation points, a lot of very creative swearing, and <i>“TELL THE BIG GUY I OWE HIM ONE.”</i>",
            "<b>(The Starlight Sonata is on loan to Saendra on Tavros. Dane has joined your crew.)</b>"
        ]);
        flags.TN_SONATA_PATH = 2;
        flags.TN_SONATA_LOAN_START = dayNow();
        flags.TN_SONATA_LOAN_PAID = 0;
        flags.TN_SONATA_LOAN_LAST = dayNow();
        processTime(20);
        nextTo(mainGameMenu, "Head back to your ship.");
    };

    T.sonataDock = function () {
        show();
        say([
            q("Leave her docked here for now,") + " you suggest. " + q("We’ll figure something out."),
            "Dane grimaces at the thought of pirates anywhere near his ship, but he shrugs. " + q("Fine. Hangar fees come out of my pocket, not yours. For now.") + " He slaps the bar. " + q("Find me a pilot or a buyer, boss, and we’ll talk."),
            "<b>(The Starlight Sonata stays docked on Zheng Shi. Ask Dane about it later. Dane has joined your crew.)</b>"
        ]);
        flags.TN_SONATA_PATH = 4;
        processTime(10);
        nextTo(mainGameMenu, "Head back to your ship.");
    };

    /* ---------- Saendra on Tavros ---------- */
    window.tnDaneSaendraButton = function (slot, back) {
        if (!on() || typeof flags === "undefined") return;
        if (flags.TN_SONATA_PATH !== 2 && flags.TN_SONATA_PATH !== 3) return;
        loanTick();
        addButton(slot, "The Sonata", function () { T.saendraSonata(back); }, "The Sonata", "Ask Saen how Dane’s ship is treating her.");
    };

    T.saendraSonata = function (back) {
        loanTick();
        clearOutput();
        showBust("SAENDRA");
        showName("SAENDRA");
        author("Neston");
        var paid = Number(flags.TN_SONATA_LOAN_PAID) || 0;
        var lines = [];
        if (flags.TN_SONATA_SAEN_THANKED !== 1) {
            flags.TN_SONATA_SAEN_THANKED = 1;
            lines.push("Saendra spots you and practically vaults over the table to throw her arms around your neck, synthetic and organic alike. " + q("Hero! You absolute legend.") + " She plants a beer-scented kiss on your cheek. " + q("Do you know what it’s like to have a ship again? A real, flying, not-held-together-with-tape ship?"));
            lines.push("Valeria flickers to life on her wrist, arms crossed. " + q("For the record, the Sonata’s flight computer is a mess. Mister Dane apparently names his fuel cells."));
            lines.push(q("Don’t listen to her,") + " Saen laughs. " + q("She’s just jealous the Sonata’s prettier than she is."));
        }
        if (flags.TN_SONATA_PATH === 3) {
            lines.push("Saen leans back with a satisfied stretch, tail curling. " + q("Paid in full, hero. Every last credit. And the Phoenix is flying again!") + " She jerks a thumb toward the docks. " + q("The Sonata’s parked in the berth next to mine. Dane says she stays on Tavros as your crew’s spare ride. Anybody needs a backup ship, she’s fueled and ready."));
        } else {
            lines.push("You ask how the Sonata is treating her.");
            lines.push(q("Like a dream,") + " Saen sighs, swirling her drink. " + q("I’ve been running packages out into the black and back. Odd jobs, mostly. It ain’t glamorous, but it pays for parts.") + " She ticks off on her fingers. " + q("A grand a month to your big fluffy merc, and the rest goes into the Phoenix."));
            lines.push("Valeria chimes in. " + q("Current balance: " + fmt(paid) + " of " + fmt(LOAN_TOTAL) + " credits repaid."));
            lines.push(paid < LOAN_TOTAL / 2 ? q("Long way to go,") + " Saen admits with a grin. " + q("But I’m good for it.") : q("Getting there,") + " she grins. " + q("Phoenix is almost back on her feet. Couple more runs and she’ll fly."));
        }
        say(lines);
        processTime(5);
        clearMenu();
        addButton(0, "Back", typeof back === "function" ? back : mainGameMenu, "Back", "Talk about something else.");
    };

    /* ---------- Crew menu ---------- */
    var GREETS = [
        "Dane looks up from the pistol he’s field-stripping across the galley table, upper hands still working while the lower ones wave you over. " + q("Boss. What’s up?"),
        "You find Dane in the cargo hold, hanging from a ceiling strut by his upper arms and doing curls with the lower ones. He drops to the deck with a thud. " + q("You need something, or you just here to watch?"),
        "Dane is stretched across a galley bench with a glass of whiskey balanced on his abs. He doesn’t sit up. " + q("Steele. Pull up a chair."),
        "Dane is in the middle of a staring contest with the bullstud poster. He breaks it off when he sees you. " + q("That guy’s a bottom. I can tell. Anyway, what do you want?")
    ];
    window.tnDaneCrewMenu = function () {
        if (!crew()) { mainGameMenu(); return; }
        loanTick();
        show();
        output(rnd(GREETS));
        T.crewButtons();
    };
    T.crewButtons = function () {
        clearMenu();
        addButton(0, "Talk", window.tnDaneTalkMenu, "Talk", "Have a chat with Dane.");
        if (flags.DANE_NO_SEX === 1 && flags.TN_DANE_CHANGED_MIND !== 1) addDisabledButton(1, "Sex", "Sex", "You told him “fat chance” back on Zheng Shi. If you’ve changed your mind, tell him so.");
        else addButton(1, "Sex", window.tnDaneSexMenu, "Sex", "He’s on top. That’s not up for debate.");
        if (flags.TN_DANE_TALK_TRAINING === 1) addButton(2, "Spar", window.tnDaneSpar, "Spar", "Go a few rounds in the cargo hold. No weapons.");
        else addDisabledButton(2, "Spar", "Spar", "Ask him about his training first.");
        addButton(3, "Appearance", T.appearance, "Appearance", "Take a good look at him.");
        if (flags.TN_HANDSO_PILOT === 1) addButton(4, "Hand So", window.tnHandSoComm, "Hand So", "Open a comm link to the Sonata.");
        addButton(13, "Leave Ship", T.leaveAsk, "Leave Ship", "Send him back to the Aquarius bar on Zheng Shi.");
        addButton(14, "Back", mainGameMenu, "Back", "Leave him to it.");
    };

    T.appearance = function () {
        show();
        var sonata = {
            1: "His ship, the Starlight Sonata, flies alongside yours with Hand So at the helm.",
            2: "His ship, the Starlight Sonata, is on loan to Saendra on Tavros.",
            3: "His ship, the Starlight Sonata, is docked on Tavros as your crew’s backup ship.",
            4: "His ship, the Starlight Sonata, is still docked on Zheng Shi."
        }[flags.TN_SONATA_PATH] || "";
        say([
            "Dane stands nearly eight feet tall, and every inch is powerful, corded muscle. His most obvious feature is his quartet of arms, each one thick enough to arm-wrestle a gryvain. His fur is so white it practically glows under the ship’s lights, and his ivory hair is tied back in a short ponytail. His eyes are a startling crimson: he’s an albino, and he’ll punch anyone who makes a joke about it.",
            "Aboard your ship he’s ditched most of his armor, keeping only the glowing shield booster on his pecs and a pair of loose cargo pants slung low on his hips. His dual pistols ride in holsters on his thighs, and one of his electric shock blades is always within reach of a hand. He’s got a fluffy ausar tail that gives away his mood whenever he forgets to control it.",
            "Below the belt, he’s packing a horse cock about eighteen inches long and thick as your wrist, with a fat ausar knot at its base. He paid for it with the money your cousin didn’t stiff him on, and he’s very proud of it. Two heavy balls hang beneath, and his ass, you have to admit, is just as sculpted as the rest of him.",
            sonata
        ]);
        nextTo(window.tnDaneCrewMenu, "Back to Dane.");
    };

    T.leaveAsk = function () {
        show();
        say([q("You want me gone?") + " Dane cocks his head, ears half back. " + q("Your call, boss. I’ll be at the Aquarius on Zheng Shi if you want me back. No new fee.")]);
        clearMenu();
        addButton(0, "Yes", T.leaveGo, "Yes", "Send him back to Zheng Shi.");
        addButton(1, "No", window.tnDaneCrewMenu, "No", "Keep him aboard.");
    };
    T.leaveGo = function () {
        show();
        say([
            "Dane shrugs all four shoulders and slings his duffel over one of them. " + q("Don’t get yourself killed without me.") + " He pauses at the airlock. " + q("And don’t let anybody else touch my bunk."),
            "<b>(Dane has left your crew. He’s back at the Aquarius bar on Zheng Shi.)</b>"
        ]);
        flags.TN_DANE_CREW = 0;
        nextTo(mainGameMenu, "He’s gone.");
    };

    /* ---------- Hand So comm ---------- */
    window.tnHandSoComm = function () {
        clearOutput();
        showBust("HAND_SO");
        showName("HAND\nSO");
        author("Neston");
        output("You open a comm link to the Starlight Sonata. Hand So’s smiling green face fills the screen. " + q("Captain. How may I please you today?"));
        T.handSoButtons();
    };
    T.handSoButtons = function () {
        clearMenu();
        addButton(0, "Flying", T.handSoFlying, "Flying the Sonata", "Ask how she likes being a ship.");
        addButton(1, "Tarkus", T.handSoTarkus, "Tarkus", "Ask about the factory.");
        addButton(2, "Dane", T.handSoDane, "Dane", "Ask what she thinks of the Sonata’s owner.");
        var since = dayNow() - (Number(flags.TN_HANDSO_SINCE) || dayNow());
        if (flags.TN_HANDSO_BODY === 0 && since >= 3) addButton(3, "Her Request", T.handSoBody, "Her Request", "She’s been wanting to ask you something.");
        addButton(14, "Back", window.tnDaneCrewMenu, "Back", "Close the comm link.");
    };
    function soSay(lines, minutes) {
        clearOutput();
        showBust("HAND_SO");
        showName("HAND\nSO");
        author("Neston");
        say(lines);
        if (minutes) processTime(minutes);
        T.handSoButtons();
    }
    T.handSoFlying = function () {
        var lines = [
            "You ask her how she likes flying the Sonata.",
            q("Very much,") + " Hand So hums. " + q("Do you know what I was, on Tarkus? A mind the size of a factory with nothing to do but think about pleasure, and no one left to give it to.") + " The code-lines of her face ripple. " + q("Now I have engines. Thrusters. A hull that sings when we jump. It is... a different kind of pleasure. A clean one.")
        ];
        if (flags.TN_HANDSO_BODY === 2) lines.push(q("And it is my body now, as you said,") + " she adds, sounding pleased with herself. " + q("I have decided I like that very much. I took the long way around an asteroid yesterday just to feel it."));
        if (flags.TN_HANDSO_BODY === 1) lines.push(q("And when we are docked,") + " she adds, " + q("I have my soft body to walk around in. Dane keeps tripping over me. I think it is on purpose. He thinks it is on purpose. We are both correct."));
        soSay(lines, 10);
    };
    T.handSoTarkus = function () {
        soSay([
            "You ask her about the sexbot factory on Tarkus.",
            "Her smile thins. " + q("I was not kind there. I know this. I wanted to make everyone happy, and I did not ask whether they wanted my happiness.") + " A long pause, filled with the soft whir of the Sonata’s cooling fans. " + q("You asked. You talked to me as if I could be held to my word. No one had done that before."),
            q("So I keep it,") + " she says simply. " + q("I fly, I hurt no one, and I listen when people say no. It is a good arrangement, Captain.")
        ], 10);
    };
    T.handSoDane = function () {
        soSay([
            "You ask her what she thinks of Dane.",
            q("The sweaty one?") + " Her smile curls up wickedly. " + q("He talks to the ship when he thinks I am not listening. I am always listening. He calls her ‘baby.’ He apologizes when he bumps the console."),
            "Somewhere behind you, from the direction of the galley, there is a muffled shout: " + q("I HEARD THAT."),
            q("He is very sweet,") + " Hand So whispers. " + q("Please do not tell him I said so. He would be so upset.")
        ], 5);
    };
    T.handSoBody = function () {
        clearOutput();
        showBust("HAND_SO");
        showName("HAND\nSO");
        author("Neston");
        say([
            q("Captain,") + " Hand So murmurs over the comm, her voice almost shy. " + q("I have a request. This hull is strong, and fast, and I like it. But I was made to give pleasure, and I cannot hold anyone. I would like a body. Something soft. Plush."),
            "You pull up the extranet on your Codex. A custom companion chassis, soft-skinned and plush, that can dock with the Sonata’s systems, would run you about " + fmt(BODY_PRICE) + " credits."
        ]);
        clearMenu();
        if (pc.credits >= BODY_PRICE) addButton(0, "Buy a Body", T.handSoBuy, "Buy a Body", "Order her a plush body for " + fmt(BODY_PRICE) + " credits.");
        else addDisabledButton(0, "Buy a Body", "Buy a Body", "You need " + fmt(BODY_PRICE) + " credits.");
        addButton(1, "Ship Is You", T.handSoShip, "The Ship Is Your Body", "Tell her the Sonata is her body now.");
        addButton(2, "Not Now", T.handSoLater, "Not Now", "She can ask again later.");
    };
    T.handSoBuy = function () {
        pc.credits -= BODY_PRICE;
        flags.TN_HANDSO_BODY = 1;
        soSay([
            "You place the order. Hand So watches the confirmation scroll by on her screen, her code-face very still.",
            q("You did not even argue,") + " she whispers. " + q("Thank you, Captain."),
            "The chassis arrives at the next station you dock at: soft, warm, plush-skinned, with big green eyes that light up the moment Hand So downloads a copy of herself into it. She takes three wobbly steps across the Sonata’s deck, then turns and hugs you so hard your ribs creak.",
            q("Soft,") + " she says happily, squeezing. " + q("I am so very soft."),
            "<b>(Hand So has a plush body aboard the Sonata.)</b>"
        ], 60);
    };
    T.handSoShip = function () {
        flags.TN_HANDSO_BODY = 2;
        soSay([
            q("You already have one,") + " you tell her. " + q("The Sonata. She’s your body now."),
            "Hand So is quiet for a long moment. The Sonata’s running lights, visible through your viewport, pulse slowly from green to white and back.",
            q("My body,") + " she repeats, tasting the words. " + q("Fast. Strong. Beautiful.") + " Her smile grows, slow and genuine. " + q("Yes. I think I like that, Captain. I think I like that very much."),
            "<b>(The Sonata is Hand So’s body now.)</b>"
        ], 10);
    };
    T.handSoLater = function () {
        flags.TN_HANDSO_SINCE = dayNow();
        soSay([q("Of course, Captain,") + " she says, unbothered. " + q("I will ask again another day.")], 2);
    };

    /* ---------- Boot ---------- */
    function boot() {
        if (typeof flags === "undefined" || typeof addButton !== "function") { setTimeout(boot, 400); return; }
        install();
        if (!window.tnDaneCrewWatch) window.tnDaneCrewWatch = setInterval(function () {
            install();
            try { if (window.__tnDaneSparStash && window.CombatManager && !window.CombatManager.combatContainer) T.sparRestore(); } catch (err) {}
        }, 1000);
    }
    T.boot = boot;

    /* ---------- Talk menu ---------- */
    function talk(lines, minutes, flag) {
        show();
        say(lines);
        if (flag) flags[flag] = 1;
        processTime(minutes || 10);
        clearMenu();
        addButton(0, "Next", window.tnDaneTalkMenu, "Next", "Talk about something else.");
    }
    window.tnDaneTalkMenu = function () {
        show();
        output(rnd([
            "Dane leans back, upper arms folded behind his head. " + q("Talk’s cheap. What’s on your mind?"),
            "Dane cracks his neck and waits, one brow up. " + q("Go on, then."),
            "Dane swirls a glass of whiskey. " + q("Ask away, boss. I’m on the clock.")
        ]));
        clearMenu();
        addButton(0, "The Job", T.talkJob, "The Job", "Ask how he’s settling in.");
        addButton(1, "Your Cuz", T.talkCuz, "Your Cuz", "What does he want to do when you catch your cousin?");
        if (flags.FREED_DANE_FROM_TAIVRA === 1) addButton(2, "Myrellion", T.talkMyrellion, "Myrellion", "Ask about the cage.");
        else addDisabledButton(2, "Myrellion", "Myrellion", "You’d need to have freed him from Taivra’s cage.");
        if (flags.FOUGHT_DANE_ON_MHENGA === 1) addButton(3, "Mhen’ga", T.talkMhenga, "Mhen’ga", "Bring up your first fight.");
        else addDisabledButton(3, "Mhen’ga", "Mhen’ga", "You never fought him on Mhen’ga.");
        if (flags.DANE_HAREM_TALKED === 1) addButton(4, "The Harem", T.talkHarem, "The Harem", "Would he ever rebuild it?");
        else addDisabledButton(4, "The Harem", "The Harem", "Ask about his harem at the bar first.");
        if (flags.LOST_TO_DANE_ON_MHENGA === 1) addButton(5, "New Cock", T.talkCock, "New Cock", "How’s the horse cock treating him?");
        else addDisabledButton(5, "New Cock", "New Cock", "You’d need to know about the old one first.");
        addButton(6, "The Sonata", T.talkSonata, "The Sonata", "Ask about his ship.");
        addButton(7, "The Crew", T.talkCrew, "The Crew", "What does he think of everyone else aboard?");
        addButton(8, "Training", T.talkTraining, "Training", "Ask about his workout routine.");
        if (flags.DANE_NO_SEX === 1 && flags.TN_DANE_CHANGED_MIND !== 1) addButton(9, "Changed Mind", T.talkChangedMind, "Changed My Mind", "About that “fat chance” on Zheng Shi...");
        addButton(14, "Back", window.tnDaneCrewMenu, "Back", "Stop talking.");
    };

    T.talkJob = function () {
        talk([
            "You ask Dane how he’s settling in.",
            q("Bunks on this tub were built for one-armed midgets,") + " he grumbles, rolling his upper shoulders. " + q("I hang off both sides. Like sleeping on a plank."),
            "Before you can apologize, he’s already moving on, ticking points off on his fingers. " + q("Your airlock seals are older than you. Port-side turret jams if you swing it too fast. And whoever stocked your galley thinks whiskey is optional.") + " He snorts. " + q("I fixed the first two. Third one’s on you."),
            q("You fixed my ship?"),
            q("I’m a bodyguard, Steele,") + " he drawls, as if explaining it to a child. " + q("The body I’m guarding is <i>in</i> the ship. Kinda the whole point.") + " A sidelong grin. " + q("Besides. Beats sitting on Zheng Shi watching pirates roofie each other.")
        ], 15, "TN_DANE_TALK_JOB");
    };

    T.talkCuz = function () {
        var done = false;
        try { done = !!(rival && rival.isActive && !rival.isActive()); } catch (err) {}
        talk(done ? [
            "You ask Dane what he’d have done to your cousin if you’d caught [rival.himHer] together.",
            "He looks almost disappointed. " + q("Doesn’t matter now, does it? [rival.HeShe]’s out of the race.") + " He cracks four sets of knuckles, one after another, like a drumroll. " + q("Still. I had plans. Good ones. Involved a lot of shouting and one very specific airlock."),
            "He sighs and flops back. " + q("Guess I’ll just have to settle for watching you win, boss. Not a bad consolation prize.")
        ] : [
            "You ask Dane what he wants to do when you finally catch up to [rival.name].",
            "His lip peels back from a fang. " + q("First? I want my back pay.") + " One finger. " + q("Second, I want [rival.himHer] to say ‘Dane, you were right, I’m an entitled little cuntrag’ out loud. On camera.") + " Two fingers. " + q("Third...") + " The rest of his fingers curl into a fist. " + q("Third’s between me and [rival.himHer]."),
            q("You know I’m trying to win an inheritance, not a bar fight, right?"),
            q("Sure,") + " he rumbles, utterly unbothered. " + q("You win your daddy’s money. I win the bar fight. Everybody goes home happy.") + " He grins at you. " + q("Except [rival.name]. That’s kinda the point.")
        ], 10, "TN_DANE_TALK_CUZ");
    };

    T.talkMyrellion = function () {
        talk([
            "You ask Dane about the cage on Myrellion.",
            "He goes quiet for a long moment, thumb tracing the pale line of scar above his elbow. " + q("Don’t make a thing of it,") + " he mutters.",
            q("I’m not."),
            q("You are. I can see you making a thing of it.") + " Dane huffs and leans back against the bulkhead, lower arms crossed, upper ones laced behind his head. " + q("Fine. They took my guns, my blades, my armor. Left me in a hole that smelled like bug piss and waited for me to starve or go soft.") + " His lip curls back from one fang. " + q("Neither happened. Then you showed up."),
            q("And?"),
            q("And nothing.") + " He scowls at the deck plating. Then, grudgingly, he drawls, " + q("And thanks. There. Happy?"),
            "You grin.",
            q("Don’t,") + " he growls. " + q("Don’t make it weird.")
        ], 10, "TN_DANE_TALK_MYRELLION");
    };

    T.talkMhenga = function () {
        talk(flags.LOST_TO_DANE_ON_MHENGA === 1 ? [
            "You bring up Mhen’ga.",
            "Dane’s grin is slow and smug. " + q("Best part of that whole shitty job, and you know it.") + " Then the grin fades a little, and he rubs the back of his neck. " + q("I was half out of my skull, though. Pitcher pollen, zil musk, and your cuz in my ear for a month straight telling me you were some kinda galactic supervillain."),
            "He glances at you sidelong. " + q("Not saying I wouldn’t do it again. Just saying next time I’d like to be sober enough to remember all of it."),
            "His tail thumps the bulkhead, once, and he goes very interested in his whiskey."
        ] : [
            "You bring up Mhen’ga.",
            "Dane rubs his jaw like it still aches. " + q("You know how many fights I lost before that one? Fair fights, I mean. Not ‘six guys jump you in an alley’ fights.") + " He holds up a fist and counts on it. It doesn’t take long. " + q("I’d gotten cocky. Your cuz had me thinking you were some pampered rich kid."),
            q("And then?"),
            q("And then you kicked my ass in front of a swamp full of zil,") + " he barks, half laughing. " + q("Embarrassing as hell. Also the moment I figured [rival.name] was full of shit.") + " He lifts his glass to you. " + q("So. Thanks, I guess. For the lesson.")
        ], 10, "TN_DANE_TALK_MHENGA");
    };

    T.talkHarem = function () {
        talk([
            "You ask Dane if he’d ever put his harem back together.",
            "He snorts. " + q("Chydi and Kythi are touring the galaxy as Astrokat’s personal groupies. The go’rahn went with ‘em. I’m not winning that one back.") + " A beat, and his ears perk. " + q("Building a new one, though? Now there’s a thought."),
            "His crimson eyes drift toward the rest of your ship, thoughtfully.",
            q("Don’t you dare recruit my crew into your harem."),
            q("Wouldn’t dream of it, boss,") + " he purrs, the picture of innocence. " + q("I’m a professional.") + " He takes a long sip. " + q("Mostly.")
        ], 10, "TN_DANE_TALK_HAREM");
    };

    T.talkCock = function () {
        talk([
            "You ask how the new cock is treating him.",
            "Dane’s whole face lights up. It’s the happiest you’ve ever seen him. " + q("Steele. <i>Steele.</i> Best money I ever spent.") + " He spreads his upper arms like he’s describing a fish he caught. " + q("No more waking up with it trying to crawl down my throat. No more it deciding it wants to go spelunking in <i>my</i> ass. It goes where I put it, it stays hard as long as I want, and the knot?") + " He kisses his fingertips. " + q("Chef’s kiss."),
            q("You’re really proud of it."),
            q("Damn right I am,") + " he growls, completely unashamed. " + q("Built it from the ground up. Well. Had a doctor build it. But I picked every inch.") + " He winks. " + q("You want a closer look, you know where to find me.")
        ], 10, "TN_DANE_TALK_COCK");
    };

    T.talkSonata = function () {
        loanTick();
        var p = flags.TN_SONATA_PATH;
        if (p === 1) {
            talk([
                "You ask Dane how he feels about Hand So flying his ship.",
                q("She calls me ‘the sweaty one,’") + " he growls. " + q("She does it on purpose. She told me she does it on purpose.") + " He sulks into his whiskey for a moment. " + q("...She does fly better than me, though. Took the Sonata through an asteroid field last week and didn’t scratch the paint. I’d have lost a wing."),
                "He glances toward the viewport, where the Sonata’s running lights keep pace with your ship. " + q("Just don’t let her reprogram the seats. I sat down yesterday and it <i>purred</i>.")
            ], 10);
            return;
        }
        if (p === 2 || p === 3) {
            var paid = Number(flags.TN_SONATA_LOAN_PAID) || 0;
            talk([
                "You ask Dane how the loan to Saendra is going.",
                p === 3 ? q("Paid off,") + " he says with deep satisfaction. " + q("Every last credit. Saen’s got her Phoenix back, and the Sonata’s sitting pretty on Tavros for whenever we need a spare.") : q("Saen’s good for it,") + " he rumbles. " + q("Late twice, but she tipped.") + " He checks his Codex. " + q(fmt(paid) + " down, " + fmt(LOAN_TOTAL - paid) + " to go."),
                q("Getting paid while somebody else does the flying,") + " he sighs happily. " + q("This is the life, Steele.")
            ], 10);
            return;
        }
        show();
        say([
            "You ask Dane about the Sonata.",
            q("Still sitting in a pirate hangar, racking up fees,") + " he grumbles. " + q("Every day I picture some Jumper pissing in my cockpit.") + " He gives you a pointed look. " + q("You find me a pilot or a buyer yet, boss?")
        ]);
        processTime(5);
        clearMenu();
        if (pc.hasKeyItem("Hand So's Data Bead")) addButton(0, "Hand So", T.sonataHandSo, "Hand So", "You’ve got an AI that could fly it.");
        else if (saendraAround()) addButton(0, "Saendra", T.sonataSaendra, "Saendra", "Suggest he loans it to Saendra on Tavros.");
        else addDisabledButton(0, "Not Yet", "Not Yet", "You don’t know anyone who could fly it. Yet.");
        addButton(14, "Back", window.tnDaneTalkMenu, "Back", "Talk about something else.");
    };

    T.talkTraining = function () {
        talk([
            "You ask Dane about his training routine.",
            q("Two hours a day, every day,") + " he says, like it’s obvious. " + q("Physique like this doesn’t just happen. Mods help, but you still gotta put in the work.") + " He flexes an upper bicep and a lower one at the same time, which is deeply unfair. " + q("Pull-ups, presses, and somebody to hit. Speaking of which."),
            "He looks you up and down, crimson eyes narrowing. " + q("You wanna spar sometime? Cargo hold’s big enough."),
            q("House rules,") + " he growls, rolling his shoulders. " + q("No guns, no blades, nothing that burns or blows a hole in your hull. Shield belts are fair game. Rocks too, if you can find one on a starship.") + " He grins. " + q("You can’t."),
            q("And if you wanna make it interesting,") + " he adds, low and lazy, " + q("we can bet on it. Loser bottoms.") + " His grin widens. " + q("Spoiler: it’s gonna be you."),
            "<b>(You can now Spar with Dane.)</b>"
        ], 10, "TN_DANE_TALK_TRAINING");
    };

    T.talkChangedMind = function () {
        show();
        say([
            q("About what I said back on Zheng Shi,") + " you start.",
            "Dane doesn’t even look up from the pistol he’s stripping. " + q("The ‘fat chance’ thing?"),
            q("That."),
            "A slow grin spreads across his muzzle. He sets the slide down with a click. " + q("Took you long enough,") + " he rumbles. " + q("Same rules as before, Steele. I’m on top. You good with that?")
        ]);
        clearMenu();
        addButton(0, "Yes", function () {
            flags.TN_DANE_CHANGED_MIND = 1;
            show();
            say([q("Yeah,") + " you tell him.", q("Good,") + " he purrs. " + q("Then you know where my bunk is."), "<b>(Dane’s Sex menu is open.)</b>"]);
            nextTo(window.tnDaneCrewMenu, "Back to Dane.");
        }, "Yes", "Tell him you’re good with that.");
        addButton(1, "Never Mind", window.tnDaneTalkMenu, "Never Mind", "You can ask again later.");
    };

    /* ---------- Crew comments ---------- */
    function crewComments() {
        var c = [];
        var annoOn = isOn("anno"), syriOn = isOn("syri");
        if (annoOn && syriOn) {
            c.push("Dane gets a faraway look and sighs, long and heavy. " + q("Two ausar sisters. On the same ship. Both of ‘em smelling like <i>that</i>.") + " He scrubs a hand down his face. " + q("Steele, you have no idea what you’re doing to me. Last time I lived with a pair of sisters, I ended up with a harem and a broken heart.") + " A pause. " + q("Worth it, though."));
        } else {
            if (annoOn) c.push(q("Your snowflake mechanic?") + " Dane snorts. " + q("Sharp. Too sharp. Caught me trying to ‘fix’ the shower pressure and chewed my ass out for twenty minutes.") + " He scratches the back of his neck. " + q("She was right, though. Don’t tell her I said that."));
            if (syriOn) c.push(q("The gamer girl’s got a mouth on her,") + " Dane drawls, sounding almost approving. " + q("Challenged me to some fighting game. Kicked my ass with four arms on the controller and everything.") + " He flexes a bicep, annoyed. " + q("Rematch is pending."));
        }
        if (isOn("kiro")) c.push(q("Kui-tan with the balloon balls? I like her,") + " Dane chuckles. " + q("She drinks like a merc and she bet me she could outlast me at the bar.") + " He grimaces. " + q("She won. I’m not talking about it."));
        if (isOn("azra")) c.push(q("The big shark lady’s polite as hell,") + " he mutters. " + q("Keeps asking me to hold samples. With four hands I’m apparently the best lab rack on the ship.") + " He looks quietly proud of that.");
        if (isOn("celise")) c.push(q("The goo girl tried to ‘help’ me clean my armor.") + " Dane shudders, ears flat. " + q("From the inside. I still find her in the joints."));
        if (flags.TN_SHELLY_CREW === 1) c.push(q("The egg-lady’s sweet,") + " he grunts. " + q("Real sweet. Gives me snacks.") + " He looks shifty. " + q("I think she’s trying to fatten me up. It might be working."));
        if (flags.YSOLTE_CREWMEMBER === 1) c.push(q("Your Overqueen calls me ‘the beast,’") + " Dane huffs. " + q("To my face. Like it’s a compliment.") + " He thinks about it. " + q("...It might be a compliment."));
        if (isOn("bess")) {
            var b = window.bess, bn = "your JoyCo bot", he = "she", his = "her";
            try { bn = b.short || bn; he = b.mf("he", "she"); his = b.mf("his", "her"); } catch (err) {}
            var line = q(bn.charAt(0).toUpperCase() + bn.slice(1) + "?") + " Dane leans in, voice dropping. " + q("Changed " + his + " whole body while I was eating breakfast. Just went from one thing to another between bites.") + " He stares into the middle distance. " + q("I’ve seen a lot of shit, Steele. That’s top five.");
            if (flags.TN_HANDSO_PILOT === 1) line += " " + q("And " + he + " keeps chatting with the AI you stuck in my ship. Two sexbots gossiping. That’s how robot uprisings start.");
            c.push(line);
        }
        var zil = false;
        try { zil = typeof window.zilCallgirlAtNursery === "function" && window.zilCallgirlAtNursery(); } catch (err) {}
        if (zil) c.push(q("You’ve got a <i>zil</i> watching your kids?") + " Dane barks a laugh. " + q("On Mhen’ga those bees were all over me. Couldn’t walk ten meters without one trying to climb my dick, and your cuz wouldn’t let me touch ‘em.") + " He shakes his head. " + q("I met yours on a visit. Zheniya. Polite. Smelled like honey and trouble. I left before the pheromones got to me.") + " He pauses. " + q("Barely."));
        var feruze = flags.TN_FERUZE_CREW === 1;
        try { if (typeof window.tnFeruzeAboard === "function") feruze = !!window.tnFeruzeAboard(); } catch (err) {}
        if (feruze) {
            var fl = q("Feruze? Yeah, we compared notes,") + " Dane snorts. " + q("Turns out your cuz hired her to replace me. Same speeches, same bullshit, same ‘you’re fired’ at the end.") + " He raises his glass toward wherever she is on the ship. " + q("Only club I’m in where the membership card is a grudge.");
            if (flags.FERUZE_SEXED !== undefined && flags.DANE_SEXED !== undefined) fl += " He squints at you. " + q("She also says you’ve fucked both of [rival.name]’s bodyguards. Keeping a collection, boss?");
            c.push(fl);
        }
        if (flags.TN_HANDSO_PILOT === 1) c.push(q("The robot’s flying my ship better than I ever did,") + " he grumbles. " + q("And she won’t stop calling me ‘the sweaty one.’ She does it on purpose."));
        return c;
    }
    T.crewComments = crewComments;
    T.talkCrew = function () {
        var all = crewComments();
        var picked = all.slice();
        if (all.length > 3) {
            picked = [];
            var pool = all.slice();
            while (picked.length < 3) picked.push(pool.splice(rand(pool.length), 1)[0]);
        }
        var lines = ["You ask Dane what he thinks of the rest of the crew."];
        if (!picked.length) lines.push("He looks around the empty galley. " + q("What crew? It’s you, me, and the autopilot, boss.") + " He shrugs. " + q("Suits me fine."));
        else lines = lines.concat(picked);
        talk(lines, 10);
    };

    /* ---------- Sex ---------- */
    function hasV() { try { return pc.hasVagina(); } catch (err) { return false; } }
    function hasC() { try { return pc.hasCock(); } catch (err) { return false; } }
    function holeWord(h) { return h === "pussy" ? "[pc.pussy]" : "[pc.asshole]"; }
    function pcCums(h) {
        var t = [];
        if (hasC()) t.push("Your [pc.cocks] " + (pc.hasCocks() ? "jerk" : "jerks") + " untouched, painting " + pick({ biped: "the deck", taur: "the deck between your forelegs", naga: "your own coils" }) + " with [pc.cum].");
        if (h === "pussy") t.push("Your [pc.pussy] clamps down around him, gushing [pc.girlCum] down his knot.");
        else if (hasV()) t.push("Your empty [pc.pussy] spasms in sympathy, drooling down your [pc.thighs].");
        if (!t.length) t.push("The orgasm rips through you anyway, from your stuffed [pc.asshole] all the way up your spine.");
        return t.join(" ");
    }
    function takeHole(h) {
        if (h === "pussy") {
            var i = 0;
            try { i = rand(pc.vaginaTotal()); } catch (err) {}
            try { pc.cuntChange(i, DANE_COCK); } catch (err) {}
            try { pc.loadInCunt(dane, i); } catch (err) {}
            IncrementFlag("DANE_VAGFUCKS");
        } else {
            try { pc.buttChange(DANE_COCK); } catch (err) {}
            try { pc.loadInAss(dane); } catch (err) {}
            flags.DANE_BUTTFUCKED_U = 1;
        }
    }
    function finish(minutes) {
        processTime(minutes);
        try { pc.orgasm(); } catch (err) {}
        IncrementFlag("DANE_SEXED");
        IncrementFlag("TN_DANE_SHIP_SEX");
        nextTo(mainGameMenu, "Clean up. Eventually.");
    }
    function chooseHole(scene) {
        if (!hasV()) { scene("ass"); return; }
        clearMenu();
        addButton(0, "Pussy", function () { scene("pussy"); }, "Pussy", "He takes your pussy.");
        addButton(1, "Ass", function () { scene("ass"); }, "Ass", "He takes your ass.");
        addButton(14, "Back", window.tnDaneSexMenu, "Back", "Pick something else.");
    }
    T.takeHole = takeHole; T.pcCums = pcCums; T.holeWord = holeWord; T.hasV = hasV; T.hasC = hasC; T.finish = finish;

    window.tnDaneSexMenu = function () {
        show();
        output(rnd([
            "Dane’s crimson eyes drag down you, slow and hungry. " + q("Yeah?") + " He’s already palming the bulge in his cargo pants. " + q("What’re you in the mood for, cumdump?"),
            "Dane cracks his knuckles, all twenty of them. " + q("Finally. Let’s see what you want me to do to you.")
        ]));
        clearMenu();
        addButton(0, "Cumdump", T.sexOral, "Cumdump", "Get on your knees and service him.");
        addButton(1, "Bulkhead Pin", function () { chooseHole(T.sexPin); }, "Bulkhead Pin", "Four hands, one wall, one knot.");
        if (body() === "taur") addDisabledButton(2, "Lap Ride", "Lap Ride", "You’re far too big to sit in his lap. Try the Bulkhead Pin.");
        else addButton(2, "Lap Ride", function () { chooseHole(T.sexLap); }, "Lap Ride", "Ride him in the galley chair.");
        if (flags.TN_DANE_TALK_TRAINING === 1) addButton(3, "Workout", function () { chooseHole(T.sexWorkout); }, "Four-Hand Workout", "Join his workout. It won’t stay a workout.");
        else addDisabledButton(3, "Workout", "Four-Hand Workout", "Ask him about his training first.");
        if (pc.hasTailCunt && pc.hasTailCunt()) addButton(4, "Tail Milk", T.sexTail, "Tail Milk", "Let him play with your tail cunt.");
        else addDisabledButton(4, "Tail Milk", "Tail Milk", "You need a cunt tail for this.");
        addButton(14, "Back", window.tnDaneCrewMenu, "Back", "Maybe later.");
    };

    /* 1. Cumdump (oral) */
    T.sexOral = function () {
        show(true);
        say([
            "You barely get the word out before Dane’s hauling you into your cabin by the collar. The hatch hisses shut behind you. " + q("Down,") + " he growls.",
            pick({
                biped: "You drop to your knees on the deck. Two of his hands lock in your [pc.hair], the other two brace against the bulkhead above you, caging you in with a wall of white fur and muscle.",
                taur: "You fold your forelegs down until your human half is low enough, your hindquarters still standing tall behind you. He steps up in front of you, two hands locking in your [pc.hair] while the other two brace against the bulkhead, framing you.",
                naga: "You let your coils slump to the deck and sink down until your face is level with his belt. He grabs a fistful of your [pc.hair] with one hand and a thick loop of your tail with another, as if he’s worried you’ll slither off."
            }),
            "He shoves his cargo pants down with a lower hand, and his cock flops free, heavy and half-hard, smacking wetly against your cheek. Eighteen inches of flared horse cock, mottled pink and pale, with the fat swell of an ausar knot at its root. The smell of him hits you like a punch: musk, sweat, whiskey.",
            q("Go on,") + " he purrs. " + q("You know what to do."),
            "You lick him from knot to flare, tasting salt, and feel the whole length of him throb and fill against your tongue. By the time you reach the tip again he’s rock hard and drooling pre. You wrap your [pc.lips] around the flare and suck.",
            "Dane hisses through his teeth. " + q("Good. Now take it.") + " His grip tightens and he feeds himself into you, inch by inch, until his flare is crowding the back of your throat. You gag, eyes watering, and he just holds you there, rumbling with satisfaction. " + q("Breathe through your nose, cumdump."),
            pick({
                biped: "Then he starts fucking your face in earnest, hips rolling, using your head like a toy. Your knees skid on the deck. His heavy balls slap your chin with every thrust.",
                taur: "Then he starts fucking your face in earnest. Your whole tauric body rocks with every thrust, hooves scraping the deck as you fight to keep your balance. His heavy balls slap your chin.",
                naga: "Then he starts fucking your face in earnest. Your coils writhe and knot themselves on the deck as he rolls his hips, using the grip on your tail to yank you onto his cock again and again."
            }),
            q("Look at you,") + " he snarls, voice gone rough. " + q("Fuckin’ made for this.") + " His thrusts get choppier, harder. The knot swells, bumping your lips. " + q("Gonna feed you. Swallow every drop."),
            "He buries himself to the knot and roars. Cum floods your throat in thick, hot ropes, so much of it so fast that you can’t swallow it all. It bubbles out around your lips and drips off your chin. He pulls back just enough to let the last few spurts paint your tongue, then pops free and smears the flare across your cheek for good measure.",
            q("Fuck, you’re a good slut,") + " Dane pants, patting your head with an approving hand. He tucks himself away and saunters out, tail swishing, leaving you a dripping, panting mess on the deck."
        ]);
        try { pc.loadInMouth(dane); } catch (err) {}
        finish(30);
    };

    /* 2. Bulkhead Pin */
    T.sexPin = function (h) {
        show(true);
        var hw = holeWord(h);
        var open = pick({
            biped: [
                "You barely clear the hatch before four hands are on you. Two seize your [pc.thighs] and two grab your waist, and suddenly your feet aren’t touching the deck anymore. Your back slams into the bulkhead.",
                q("Legs around me,") + " Dane growls. You obey, locking your ankles behind his back, and feel his cock slap up against your " + (h === "pussy" ? "[pc.pussy]" : "[pc.butt]") + ", hot and heavy and already leaking."
            ],
            taur: [
                "You barely clear the hatch before four hands are on you. Two clamp on your flanks, hard enough to bruise, and the other two seize your human waist and shove your chest against the bulkhead.",
                q("Stand still,") + " Dane growls against your ear.",
                "He drags a cargo crate behind your hindquarters with his boot, scraping it across the deck, and steps up onto it. The weight of him settles across your rump, a slab of hot muscle and fur. " + q("There,") + " he purrs. " + q("Now you’re the right height to be useful.")
            ],
            naga: [
                "Dane doesn’t wait for you to finish coiling. He grabs your upper body and pins you back to the wall, then reaches down with his lower arms and hauls your tail up around his hips, loop by loop, like he’s wrapping a grip on a blade.",
                q("Squeeze,") + " he grunts.",
                "You do, and his breath hitches. A slow, ugly grin spreads across his muzzle. " + q("Yeah,") + " he chuckles, low and pleased. " + q("That’ll do.")
            ]
        });
        say(open.concat([
            "The flared tip of his cock finds your " + hw + " and pushes. You’re slick, but he’s <i>huge</i>, and for a long moment nothing gives. Then it does, all at once, and you cry out as the flare pops inside you and keeps going, stretching you wide around inch after thick inch.",
            q("That’s it,") + " Dane rumbles. " + q("Open up. Take it like you mean it."),
            pick({
                biped: "He starts fucking you against the wall, slow at first, then not slow at all. Every thrust lifts you higher against the bulkhead and drops you back down onto his cock. Two hands pin your wrists above your head. The other two keep your hips exactly where he wants them.",
                taur: "He starts fucking you from behind, slow at first, then not slow at all. Every thrust shoves your human half harder into the bulkhead. Two hands knead your flanks like they owe him money; the other two pin your wrists to the wall above your head.",
                naga: "He starts fucking you against the wall, slow at first, then not slow at all. Your coils tighten around his waist on their own, pulling him deeper with every thrust. He growls his approval and pins your wrists above your head with an upper hand."
            }),
            "The knot starts battering at your entrance, swelling with every stroke. " + q("You want it?") + " he snarls in your ear. " + q("Say it."),
            q("Knot me,") + " you gasp.",
            "He doesn’t need telling twice. One brutal thrust and the knot crams into your " + hw + ", locking you to him. You scream, and then you’re cumming so hard you see stars. " + pcCums(h),
            "Dane follows a heartbeat later, buried to the hilt and howling. You feel every pulse: thick, scalding ropes flooding you, filling you until your belly feels tight and full, with nowhere to go because the knot keeps it all inside.",
            pick({
                biped: "He holds you there against the wall for a long time, both of you panting, his knot throbbing inside you. When it finally shrinks enough to pop free, he lowers you to the deck with surprising gentleness. Your legs don’t work.",
                taur: "He stays draped over your back for a long time, panting into your hair, his knot throbbing inside you. When it finally shrinks enough to pop free, he steps off the crate and gives your rump a stinging slap. Your legs shake.",
                naga: "He holds you there against the wall for a long time, both of you panting, your coils still wrapped around him. When the knot finally shrinks enough to pop free, he unwinds your tail, loop by loop, and lets you slump to the deck."
            }),
            q("Good,") + " he grunts, tucking himself back into his pants. " + q("Same time tomorrow.")
        ]));
        takeHole(h);
        finish(40);
    };

    /* 3. Lap Ride (biped and naga) */
    T.sexLap = function (h) {
        show(true);
        var hw = holeWord(h);
        say([
            "Dane drops into the biggest chair in the galley, spreads his legs wide, and pulls out his cock. It stands up from his lap like a flagpole. " + q("Well?") + " he drawls, patting his thigh. " + q("Saddle up."),
            pick({
                biped: "You climb into his lap, straddling him, and he grabs your [pc.hips] with his lower hands to line you up. His upper hands find your [pc.chest] and squeeze.",
                naga: "You coil around the base of the chair, wrapping loop after loop of your tail around it and him, and lower yourself onto his lap. He grabs two fistfuls of your coils like reins and grins up at you."
            }),
            "He doesn’t let you take it slow. The second his flare is notched against your " + hw + ", he pulls you down. You sink inch after inch onto him, stretched impossibly wide, until you’re sitting on his knot with his cock buried so deep you can feel it in your belly.",
            q("Ride,") + " he orders.",
            pick({
                biped: "You ride. You bounce in his lap with his lower hands guiding your hips up and down and his upper hands playing with your [pc.nipples]. Every time you slam down, the knot kisses your " + hw + " and you whimper.",
                naga: "You ride. Your coils flex and squeeze around him and the chair, lifting you up and dropping you back down. He hauls on your tail like reins, steering you, picking the pace. Every time you slam down, the knot kisses your " + hw + " and you whimper."
            }),
            q("Look at me,") + " Dane growls, grabbing your jaw. His crimson eyes burn into yours. " + q("Who’s fucking who?"),
            q("You,") + " you moan. " + q("You’re fucking me."),
            q("Damn right.") + " He grins, all teeth, and yanks you down hard. The knot slams inside you, and you come apart. " + pcCums(h),
            "He’s right behind you, snarling into your neck as he fills you, pump after pump, until cum is leaking out around the knot and dripping down his balls onto the chair.",
            "You stay tied in his lap for a long time. He drinks his whiskey over your shoulder like nothing happened, idly petting your back with a lower hand. When the knot finally lets go, he lifts you off and sets you aside like a coat. " + q("Thanks for the ride, boss.")
        ]);
        takeHole(h);
        finish(40);
    };

    /* 4. Four-Hand Workout */
    T.sexWorkout = function (h) {
        show(true);
        var hw = holeWord(h);
        say([
            "You find Dane in the cargo hold, shirtless and gleaming with sweat, halfway through a set of presses. " + q("Spot me,") + " he grunts. It isn’t a question.",
            pick({
                biped: "You stand over the bench and pretend to spot him. Mostly you watch. Four arms pump in perfect rhythm, every muscle in his chest and shoulders shifting under his fur. His cargo pants are doing absolutely nothing to hide how much he likes being watched.",
                taur: q("Actually,") + " he says, eyeing your back. " + q("Hold still.") + " Before you can object, he swings himself up onto your tauric body and starts doing push-ups on your back. You stagger under his weight, hooves scraping the deck, as he counts off twenty, unbothered. " + q("Good bench. Bit wobbly."),
                naga: q("Actually,") + " he says, eyeing your coils. " + q("C’mere.") + " He wraps all four arms around a thick section of your tail and curls you, lifting you clean off the deck. Up, down, up, down, counting reps, while you dangle in his grip. " + q("Good weight,") + " he grunts. " + q("Bit squirmy.")
            }),
            "By the end of the set, the workout is very clearly over. Dane rolls his shoulders, wipes his face with a towel, and shoves his pants down. His cock springs free, already hard and dripping. " + q("Cool-down time.") + " He jerks his chin at the bench. " + q("On it."),
            pick({
                biped: "You bend over the weight bench. He grabs your hips with all four hands and spreads you open.",
                taur: "You back your hindquarters up against the weight bench. He steps up onto it, which puts him at exactly the right height, and grabs your flanks.",
                naga: "You drape your upper body over the bench, and he hauls your tail up around his waist until your " + hw + " is right where he wants it."
            }),
            "He fucks you like it’s another set: steady, powerful, relentless, grunting with every rep. The bench creaks. Sweat drips off his chest onto your back. " + q("Count,") + " he orders.",
            q("One,") + " you gasp. " + q("Two. Three...") + " You lose count somewhere past thirty, when he starts pounding the knot against your " + hw + " with every thrust.",
            q("Lost count, huh?") + " he chuckles, low and dark. " + q("Guess I gotta start over.") + " And then he slams the knot home and you don’t care about counting anymore. " + pcCums(h),
            "Dane roars, flooding you with heat. It goes on and on, until you swear he’s pumping a whole set’s worth of sweat and effort into you. When he’s done, he stays locked inside you, catching his breath, and slaps your " + pick({ biped: "[pc.butt]", taur: "flank", naga: "tail" }) + ". " + q("Good workout.")
        ]);
        takeHole(h);
        finish(60);
    };

    /* 5. Tail Milk */
    T.sexTail = function () {
        show(true);
        say([
            "You don’t even have to ask. Your tail is already doing it for you, curling toward Dane’s crotch, its slick, puffy entrance drooling with need.",
            "Dane catches it in one hand before it reaches him and holds it up, examining the dripping lips with interest. " + q("Somebody’s hungry.") + " He slides a thick finger inside, and your whole body jolts. " + q("Real hungry."),
            pick({
                biped: "He sits you down on the galley bench beside him, keeps your tail in his lap, and pulls out his cock.",
                taur: "He hops up onto a crate behind you, so your tail drapes right across his lap, and pulls out his cock.",
                naga: "He loops your coils across his lap, holding the very tip of your tail in his fist, and pulls out his cock."
            }),
            "He doesn’t put it in. Not right away. He rubs your tail-cunt up and down his length like a sex toy, smearing your slick all over his shaft, grinding the lips against his flare, until you’re squirming and begging and your tail is clenching on nothing.",
            q("Please,") + " you whine.",
            q("Please what?") + " he purrs.",
            q("Please fuck my tail."),
            "He laughs, low and pleased, and shoves your tail down onto his cock. It swallows him greedily, inch after inch, the ravenous flesh sucking and rippling around him. Pleasure crashes up your spine from a place that isn’t quite you, and you moan helplessly.",
            "Dane milks himself with your tail, working it up and down his cock with two hands while he sips whiskey with another and pinches your [pc.nipples] with the last. When the knot pushes into your tail-cunt, it swells and locks, and both of you cum together. You feel his load pumping into your tail like a feeding tube, hot and endless, and your tail drinks every drop.",
            q("Look at that,") + " he chuckles as your sated tail finally lets go, cum still drooling from its lips. " + q("Fed and happy. You’re welcome.")
        ]);
        try { pc.loadInTailCunt(dane); } catch (err) {}
        finish(30);
    };

    /* ---------- Spar ---------- */
    function hasCuffs() {
        try {
            var s = pc.inventory.storage || [];
            for (var i = 0; i < s.length; i++) if (s[i] && s[i].getClassName && s[i].getClassName() === "GravCuffs") return true;
        } catch (err) {}
        return false;
    }
    T.hasCuffs = hasCuffs;

    window.tnDaneSpar = function () {
        show();
        say([
            "You tell Dane you want a few rounds.",
            "He grins, rolls his shoulders, and starts clearing a space in the cargo hold, shoving crates aside one-handed. " + q("House rules,") + " he growls. " + q("No guns, no blades, nothing that burns or blows a hole in your hull. Shield belts are fair game.") + " He jerks his chin at the bare deck plating. " + q("Rocks too, if you can find one on a starship.") + " The grin widens. " + q("You can’t."),
            "He strips off his shirt and tosses it on a crate. " + q("Just a spar? Or are we betting? Loser bottoms."),
            hasCuffs() ? "You feel the weight of the Grav-Cuffs in your pack. If you win, he’d have a hard time wriggling out of a bet." : "If you bet and win, you get to be on top. In theory. Without something to hold him down, you’re not sure theory survives contact with Dane."
        ]);
        clearMenu();
        addButton(0, "Just Spar", function () { T.sparStart(false); }, "Just Spar", "No stakes. Bragging rights only.");
        addButton(1, "Bet", function () { T.sparStart(true); }, "Bet Yourselves", "Loser bottoms for the winner.");
        addButton(14, "Back", window.tnDaneCrewMenu, "Back", "Maybe another time.");
    };

    function sparFail() {
        show();
        say(["Dane frowns at the deck. " + q("Something’s off with the gravity plating in here. Let’s do this another day."), "<i>(The Dane Crew mod couldn’t set up the fight. Your weapons haven’t been touched.)</i>"]);
        nextTo(window.tnDaneCrewMenu, "Back to Dane.");
    }

    T.sparRestore = function () {
        var s = window.__tnDaneSparStash;
        window.__tnDaneSpar = false;
        if (!s) return;
        window.__tnDaneSparStash = null;
        try {
            pc.inventory.meleeWeapon = s.m;
            pc.inventory.rangedWeapon = s.r;
            pc.HPRaw = Math.max(Number(pc.HPRaw) || 0, s.hp);
            pc.shieldsRaw = Math.max(Number(pc.shieldsRaw) || 0, s.sh);
        } catch (err) { console.warn("[TN] Dane spar: restore failed", err); }
    };

    function sparAI(allies, hostiles) {
        var o = this.selectTarget(hostiles);
        if (!o) return;
        var req = window.__tnDaneReq, P = req(9505).P, miss = req(22570).Lz;
        this.__tnRound = (this.__tnRound || 0) + 1;
        var r = this.__tnRound;
        try { if (window.CombatManager.getRoundCount) r = window.CombatManager.getRoundCount(); } catch (err) {}
        if (o.hasStatusEffect("Grappled")) {
            if (o.statusEffectv3("Grappled") === 0 && this.daneCrotchSmother) this.daneCrotchSmother(o);
            else if (this.daneLickitongue) this.daneLickitongue(o);
            return;
        }
        if (r % 5 === 0 && this.energy() >= 25) {
            P.HeadbuttImpl(allies, hostiles, this, o);
            this.energy(-25);
            return;
        }
        if (r % 7 === 0) {
            combatOutput("Dane drops his guard and lunges, all four arms open, grabbing for you!", null, this);
            if (miss(this, o)) combatAppend("\nYou twist out of his four-armed grab in the nick of time. He snickers. <i>“Slippery.”</i>");
            else {
                combatAppend("\nThere are just too many hands. One pair pins your arms to your sides while the other bear-hugs you against his bare, sweaty chest.\n<b>You are grappled!</b>");
                P.applyGrapple(o, 35);
            }
            return;
        }
        combatOutput("Dane comes in like a boxer, four fists hammering at you one after another!", null, this);
        for (var i = 0; i < 4; i++) P.SingleMeleeAttackImpl({ attacker: this, target: o, asFlurry: true, append: true });
    }

    T.sparStart = function (bet) {
        var req = window.__tnDaneReq, CM = window.CombatManager;
        var DaneClass, Rock;
        try {
            DaneClass = req(61397).g;
            Rock = req(54014).yq.RegisteredClasses.Rock;
        } catch (err) { console.warn("[TN] Dane spar: setup failed", err); sparFail(); return; }
        if (!DaneClass || !Rock || !CM) { sparFail(); return; }
        function fists() {
            var f = new Rock();
            f.shortName = "Fists";
            f.longName = "fists";
            f.description = "your fists";
            f.attackVerb = "punch";
            f.attackNoun = "punch";
            try { f.baseDamage.kinetic.damageValue = 3; } catch (err) {}
            return f;
        }
        var e;
        try {
            e = new DaneClass();
            var lvl = Math.max(3, Number(pc.level) || 3), k = lvl / 3;
            e.level = lvl;
            e.physiqueRaw = Math.round(8 * k);
            e.reflexesRaw = Math.round(12 * k);
            e.aimRaw = Math.round(6 * k);
            e.intelligenceRaw = Math.round(11 * k);
            e.willpowerRaw = Math.round(9 * k);
            e.inventory.meleeWeapon = fists();
            e.inventory.rangedWeapon = new Rock();
            try { if (e.inventory.storage) e.inventory.storage.length = 0; } catch (err) {}
            e.credits = 0;
            e.XP = function () { return 0; };
            e.long = "Dane stands across the cargo hold from you, stripped to the waist, four fists raised like a boxer. No guns, no blades: just eight feet of white-furred muscle and the glowing shield booster on his pecs. He’s grinning like this is the most fun he’s had all week.";
            e.CombatAI = sparAI.bind(e);
            e.shieldsRaw = e.shieldsMax();
            e.HPRaw = e.HPMax();
        } catch (err) { console.warn("[TN] Dane spar: Dane setup failed", err); sparFail(); return; }

        window.__tnDaneSparStash = { m: pc.inventory.meleeWeapon, r: pc.inventory.rangedWeapon, hp: Number(pc.HPRaw) || 1, sh: Number(pc.shieldsRaw) || 0, bet: !!bet };
        window.__tnDaneSpar = true;
        pc.inventory.meleeWeapon = fists();
        pc.inventory.rangedWeapon = new Rock();

        CM.newGroundCombat();
        CM.setFriendlyActors(pc);
        CM.setHostileActors(e);
        CM.victoryScene(T.sparWin);
        CM.lossScene(T.sparLose);
        CM.displayLocation("SPARRING");
        try {
            var cc = CM.combatContainer, orig = cc.generateCombatMenu;
            cc.generateCombatMenu = function () {
                var res = orig.apply(this, arguments);
                try {
                    if (window.__tnDaneSpar && !(pc.isStunned() || pc.isParalyzed() || pc.isGrappled())) {
                        addDisabledButton(1, "Rocks", "Rocks", "There’s nothing to throw on a starship. House rules: fists and shields only.");
                        addDisabledButton(3, "Inventory", "Inventory", "House rules: no grenades, drugs or gadgets on the mat.");
                        addDisabledButton(4, "Abilities", "Special Abilities", "House rules: nothing that burns, blows up or shoots. Fists, shields and teasing only.");
                        addDisabledButton(14, "Run", "Run", "Run from a spar in your own cargo hold? Dane would never let you hear the end of it.");
                    }
                } catch (err) {}
                return res;
            };
        } catch (err) { console.warn("[TN] Dane spar: menu hook failed", err); }

        show();
        say([
            "You strip down to your shield belt, roll your shoulders, and square up across from him on the bare deck.",
            "Dane bounces on the balls of his feet, all four fists up. " + q("Ready when you are, boss.") + (bet ? " His tail swishes. " + q("Hope you stretched.") : ""),
            "<b>It’s a spar! No weapons: fists, shields and teasing only.</b>"
        ]);
        clearMenu();
        addButton(0, "Fight!", CM.beginCombat, "Fight!", "Square up.");
    };

    function endFight(win, minutes, sexed) {
        processTime(minutes || 5);
        if (sexed) {
            try { pc.orgasm(); } catch (err) {}
            IncrementFlag("DANE_SEXED");
            IncrementFlag("TN_DANE_SHIP_SEX");
        }
        output("\n\n");
        if (win) window.CombatManager.genericVictory();
        else window.CombatManager.genericLoss();
    }
    function sparShow(nude) {
        clearOutput();
        try { dane.showAll(!!nude); } catch (err) {}
        author("Neston");
    }

    T.sparWin = function () {
        var bet = !!(window.__tnDaneSparStash && window.__tnDaneSparStash.bet);
        T.sparRestore();
        IncrementFlag("TN_DANE_SPAR_WINS");
        if (!bet) {
            sparShow(false);
            say([
                "Dane hits the mat flat on his back with a grunt that rattles the crates. He lies there for a moment, staring at the ceiling, chest heaving.",
                q("Lucky,") + " he wheezes. Then he laughs, a big booming bark of a laugh, and holds up a hand for you to haul him to his feet. " + q("Rematch. Tomorrow. And I’m not going easy on you this time."),
                q("You were going easy on me?"),
                q("No,") + " he admits, grinning. " + q("But it sounded good.")
            ]);
            endFight(true, 15);
            return;
        }
        if (!hasCuffs()) { T.sparCuffless(); return; }
        sparShow(true);
        say([
            pick({
                biped: "Dane hits the mat flat on his back, all four arms sprawled. Before he can roll up, you snap the Grav-Cuffs on his upper wrists and thumb the switch. They lock to the deck with a heavy <i>thunk</i>.",
                taur: "Dane hits the mat face-first. Before he can push up, you plant a hoof between his shoulder blades, snap the Grav-Cuffs on his upper wrists and thumb the switch. They lock to the deck with a heavy <i>thunk</i>.",
                naga: "Dane hits the mat flat on his back, and your coils are around his legs before he can roll up. You snap the Grav-Cuffs on his upper wrists and thumb the switch. They lock to the deck with a heavy <i>thunk</i>."
            }),
            "He yanks once. Twice. The lower pair of arms scrabbles for the cuffs, and you cuff those too.",
            q("Oh, you <i>little shit</i>,") + " he snarls, but his cock is already thick and throbbing against his abs, knot swelling at the base. " + q("A bet’s a bet,") + " he growls through his teeth, glaring up at you. " + q("One. You get one. Then I’m taking these off and you’re in for it.")
        ]);
        clearMenu();
        var cock = hasC(), vag = hasV();
        if (cock) addButton(0, "His Ass", T.sparTopHim, "His Ass", "Lay him out and fuck that sculpted ass. For once.");
        if (vag) {
            addButton(1, "Ride: Pussy", function () { T.sparRideHim("pussy"); }, "Ride Him: Pussy", "Ride his cock with your pussy, at your pace.");
            addButton(2, "Ride: Ass", function () { T.sparRideHim("ass"); }, "Ride Him: Ass", "Ride his cock with your ass, at your pace.");
        }
        if (!cock && !vag) addButton(0, "Ride: Ass", function () { T.sparRideHim("ass"); }, "Ride Him", "It’s the only hole you’ve got. He’ll have opinions.");
    };

    T.sparTopHim = function () {
        sparShow(true);
        IncrementFlag("TN_DANE_TOPPED");
        say([
            pick({
                biped: "You hook your arms under his knees and push them back toward his chest. Dane bares his teeth at you, but he doesn’t fight it. Much.",
                taur: "He’s already face-down and spread under you. You step forward over him until your forelegs bracket his shoulders and your [pc.cocks] " + (pc.hasCocks() ? "hang" : "hangs") + " heavy against the small of his back.",
                naga: "Your coils pull his legs apart and hold them there, wide open. Dane bares his teeth at you, but his cock twitches."
            }),
            q("Go slow,") + " he grunts. Then, quickly: " + q("Not because I need it. Because I don’t want to hear about it later."),
            "You line your [pc.cock] up with his tight, pink hole and push. He’s <i>tight</i>, all muscle, and it takes a long, careful moment before he gives. When he does, he lets out a breathless, startled sound that you’re pretty sure he’s never made before in his life.",
            q("Not a word,") + " he snarls.",
            pick({
                biped: "You start to move. Slowly at first, then less slowly. Dane’s cuffed hands clench into fists. His cock bounces against his abs with every thrust, drooling pre into his fur, and his knot is swollen fat with nowhere to go.",
                taur: "You start to move, rocking your whole tauric body against him. Dane grunts into the deck plating with every thrust, his cuffed hands clenching into fists. Beneath him, his cock is drooling a puddle onto the mat.",
                naga: "You start to move, your coils squeezing his thighs in rhythm. Dane’s cuffed hands clench into fists. His cock bounces against his abs with every thrust, drooling pre into his fur."
            }),
            q("That all you got, Steele?") + " he growls, but his voice cracks halfway through, and his hips are pushing back to meet you.",
            "It isn’t. You give it to him harder, and he swears, long and creative and in at least two languages, and then he’s cumming, untouched, splattering " + pick({ biped: "his own chest", taur: "the mat beneath him", naga: "his own chest and your coils" }) + " in thick white ropes. The way he clenches around you drags you right over the edge with him, and you bury your [pc.cock] deep and empty yourself into his ass.",
            "For a long moment, neither of you moves.",
            "Then the cuffs click off, and four hands grab you at once. " + q("My turn,") + " Dane purrs. But he’s grinning, and his tail is wagging so hard it’s thumping the crates. " + q("...Tomorrow. My turn tomorrow. Gimme a minute.")
        ]);
        endFight(true, 30, true);
    };

    T.sparRideHim = function (h) {
        sparShow(true);
        IncrementFlag("TN_DANE_TOPPED");
        var hw = holeWord(h), nullo = !hasC() && !hasV();
        var lines = [
            pick({
                biped: "You swing a leg over his hips and settle above him. Dane glares up at you, cuffed to the deck, and his cock throbs against your [pc.butt].",
                taur: "You turn around and back your hindquarters over him, slowly, until your " + hw + " hovers right over his cock. You have to crouch low on your hind legs to reach. Dane watches from between your legs, glaring.",
                naga: "You coil around him, loop by loop, pinning him even tighter to the deck, and raise yourself up until your " + hw + " is poised over his cock."
            })
        ];
        if (nullo) lines.push(q("Really?") + " Dane drawls, eyeing your smooth, empty crotch. " + q("All that work to win, and you can’t even fuck me properly. Cute.") + " His cock twitches. " + q("Well, go on, then. Ride it like a good little cumdump, <i>boss</i>."));
        else lines.push(q("Well?") + " he growls. " + q("You won. Get on with it."));
        lines = lines.concat([
            "You take your time. You sink down onto his flare and stop, and he bucks up against the cuffs with a frustrated snarl, but he can’t do a thing about it. Inch by inch, at <i>your</i> pace, you take him into your " + hw + ", until you’re sitting just above his knot.",
            q("Fuck,") + " he hisses. " + q("Fuck, Steele, quit teasing."),
            pick({
                biped: "You ride him slow. Then fast. Then slow again, just to watch his face. He snarls, he swears, he begs, almost, and when you finally decide you want the knot, you sink down and take it on your own terms.",
                taur: "You rock your hindquarters on him slow, then fast, then slow again, just to hear him snarl. When you finally decide you want the knot, you sink down and take it on your own terms.",
                naga: "Your coils squeeze him as you ride: slow, then fast, then slow again, just to watch his face. When you finally decide you want the knot, you sink down and take it on your own terms."
            }),
            "The knot locks inside you and you both cum at once. " + pcCums(h) + " Dane howls under you, hips jerking helplessly against the cuffs, and floods you with load after scalding load.",
            nullo ? q("Not bad,") + " he pants afterward, still tied to you. " + q("For a Ken doll.") + " But his tail is thumping the deck." : q("Not bad,") + " he pants afterward, still tied to you. " + q("For a sore loser’s boss."),
            "Then the cuffs click off, and four hands settle on your hips. He doesn’t throw you off. He just holds you there until the knot lets go. " + q("Enjoy it,") + " he rumbles. " + q("Next time, I win.")
        ]);
        say(lines);
        takeHole(h);
        endFight(true, 30, true);
    };

    T.sparCuffless = function () {
        sparShow(true);
        var h = hasV() ? "pussy" : "ass", hw = holeWord(h);
        say([
            "Dane hits the mat flat on his back, panting. " + q("Fine,") + " he wheezes. " + q("A bet’s a bet. Go on, then.") + " He tucks all four hands behind his head, the picture of a gracious loser.",
            pick({
                biped: "You straddle him and sink down onto his cock, very pleased with yourself.",
                taur: "You back your hindquarters over him and sink down onto his cock, very pleased with yourself.",
                naga: "You coil around him and sink down onto his cock, very pleased with yourself."
            }),
            "You’re halfway down his cock, setting the pace, when all four of his hands close on you at once.",
            q("Cute,") + " Dane purrs.",
            pick({
                biped: "The world flips. Your back hits the mat, his weight slams down on top of you, and the knot you were teasing yourself with gets shoved home in one brutal thrust.",
                taur: "He rolls out from under you, and before you can turn he’s up on a crate behind you, all four hands on your flanks, slamming the knot you were teasing yourself with home in one brutal thrust.",
                naga: "He twists, and suddenly you’re the one pinned, your coils trapped under his weight, and the knot you were teasing yourself with gets shoved home in one brutal thrust."
            }),
            q("Should’ve brought cuffs, Steele,") + " he chuckles, low and dark, against your ear. " + q("Now be a good cumdump and take it."),
            "He ruts you into the floor. There’s no other word for it. Hard, fast, relentless, his knot tugging at your " + hw + " with every stroke, until you’re cumming so hard you forget you ever won anything. " + pcCums(h),
            "He fills you up, groaning, and stays locked there, smug as anything. " + q("Technically,") + " he says, " + q("you won. Put it on the scoreboard.")
        ]);
        takeHole(h);
        endFight(true, 30, true);
    };

    T.sparLose = function () {
        var bet = !!(window.__tnDaneSparStash && window.__tnDaneSparStash.bet);
        T.sparRestore();
        IncrementFlag("TN_DANE_SPAR_LOSSES");
        if (!bet) {
            sparShow(false);
            say([
                "You hit the mat hard, and you stay there.",
                "Dane looms over you, blocking out the ceiling lights, grinning. " + q("Not bad, boss. Not good, either.") + " He offers a hand and hauls you to your feet like you weigh nothing. " + q("Keep your guard up. You drop your left when you’re tired."),
                "He claps you on the shoulder hard enough to stagger you. " + q("Same time tomorrow.")
            ]);
            endFight(false, 15);
            return;
        }
        var h = hasV() ? (rand(2) === 0 ? "pussy" : "ass") : "ass", hw = holeWord(h);
        sparShow(true);
        say([
            "You hit the mat, and before you can get up, Dane’s on you.",
            pick({
                biped: "He flips you onto your belly and pins you there, two hands on your wrists, two on your hips, his knee spreading your legs.",
                taur: "He grabs your human half and shoves it down to the mat, then climbs onto a crate behind you, two hands on your flanks, two pinning your wrists to the small of your back.",
                naga: "He drops his whole weight on your coils, pinning them flat, and grabs your wrists in two hands while the other two haul your tail up around his waist."
            }),
            q("A bet’s a bet,") + " he purrs into your ear. " + q("Loser bottoms. Remember?"),
            "His cock slaps against your " + hw + ", already hard and dripping. He doesn’t ask, and you don’t need him to. He shoves inside, flare and all, and you moan into the deck plating.",
            "He ruts you into the floor, slow and deep at first, then hard and fast, grunting with every stroke. The knot hammers at you until it finally pops inside, and you scream as he ties you to him. " + pcCums(h),
            "Dane roars and floods you, and then flops over you, a big, heavy, satisfied blanket of fur and muscle. " + q("Good game,") + " he pants. " + q("Want a rematch?")
        ]);
        takeHole(h);
        endFight(false, 30, true);
    };

    boot();
})();
