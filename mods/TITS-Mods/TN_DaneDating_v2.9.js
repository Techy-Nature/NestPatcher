/*
 * TN_DaneDating_v2.9.js - "Dane's Wingman" (NestPatcher runtime mod, TiTS 0.9.168), Modv2.9
 * Author: Neston
 *
 * Needs TN_DaneCrew_v2.8.mod (Dane on your crew). Adds a talk topic to Dane's crew Talk menu:
 *   "Asking Out" - ask Dane what's holding him back from asking Syri and Anno out.
 *   He admits it's nerves and fear of rejection (his old harem walked out on him).
 *   Go with him as his wingman to ask Syri and/or Anno. Each one has to be aboard your ship.
 *
 * Odds: 10% for every full month since he last saw his old harem, capped at 120% at a year.
 *   His harem left while he was working for your cousin, before your quest began, so the clock
 *   is the game's day counter (30 days = 1 month). Anything at 100% or more is a sure yes.
 *   A "no" can be tried again after 7 days.
 * Also: "Pep Talk" (dating in general) and "How's Dating?" once someone says yes.
 * No sex scenes. Taur and naga Steele get their own lines where your body shows up.
 *
 * Flags (stay in your save): TN_DDATE_STAGE (1 = he told you), TN_DDATE_SYRI / TN_DDATE_ANNO
 *   (1 = dating him, 2 = said no), TN_DDATE_SYRI_DAY / TN_DDATE_ANNO_DAY (day of last ask),
 *   TN_DDATE_PEP (pep talk heard).
 * Toggle: Options -> Android Mods -> "Dane's Wingman".
 */
(function () {
    "use strict";
    if (window.__tnDaneDatingLoaded) return;
    window.__tnDaneDatingLoaded = true;

    var MOD_ID = "tn.dane-dating";
    var RETRY_DAYS = 7;
    var W = {};
    window.tnDaneDating = W;

    /* ---------- Mod menu switch ---------- */
    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    window.tnDaneDatingEnabled = on;
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Dane's Wingman",
            author: "Neston",
            description: "Ask Dane what's stopping him from asking Syri and Anno out, then go with him as his wingman. His odds go up 10% a month since his old harem left (120% at a year). Needs the Dane Crew mod.",
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
        var first = true;
        for (var i = 0; i < list.length; i++) {
            if (list[i] === null || list[i] === undefined || list[i] === "") continue;
            output((first ? "" : "\n\n") + list[i]);
            first = false;
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
    function nextTo(fn, tip) { clearMenu(); addButton(0, "Next", fn, "Next", tip || ""); }
    function dayNow() {
        try { if (typeof days === "number") return days; } catch (err) {}
        try { return Math.floor(GetGameTimestamp() / 1440); } catch (err) { return 0; }
    }
    function daneOn() {
        try { return typeof window.tnDaneAboard === "function" ? !!window.tnDaneAboard() : flags.TN_DANE_CREW === 1; }
        catch (err) { return false; }
    }
    function girl(id) { try { return window[id]; } catch (err) { return null; } }
    function aboard(id) {
        try { var c = girl(id); return !!(c && typeof c.isCrew === "function" && c.isCrew()); }
        catch (err) { return false; }
    }
    function syriLover() { try { return !!(window.syri && window.syri.isLover && window.syri.isLover()); } catch (err) { return false; } }
    function showDane() {
        clearOutput();
        try { dane.showAll(); } catch (err) { try { showBust("DANE"); showName("DANE"); } catch (e2) {} }
        author("Neston");
    }
    function showPair(id) {
        clearOutput();
        var g = girl(id);
        try { showBust("DANE", g.bustString()); } catch (err) { try { showBust("DANE"); } catch (e2) {} }
        try { showName("DANE &\n" + (id === "syri" ? "SYRI" : "ANNO")); } catch (err) {}
        author("Neston");
    }
    function backToTalk() {
        if (typeof window.tnDaneTalkMenu === "function") window.tnDaneTalkMenu();
        else mainGameMenu();
    }

    /* ---------- Odds ---------- */
    function months() { return Math.max(0, Math.floor(dayNow() / 30)); }
    function chance() { return Math.min(120, months() * 10); }
    W.months = months;
    W.chance = chance;
    function monthsText() {
        var m = months();
        if (m >= 12) return "over a year";
        if (m === 0) return "less than a month";
        return m + (m === 1 ? " month" : " months");
    }
    function oddsTip() {
        var c = chance();
        return "Dane’s odds: " + c + "%" + (c > 100 ? " (a sure thing)" : "") + ". It’s been " + monthsText() + " since he last saw his old harem; every month adds 10%, up to 120% at a year.";
    }
    function flagKey(id) { return id === "syri" ? "TN_DDATE_SYRI" : "TN_DDATE_ANNO"; }
    function status(id) { return Number(flags[flagKey(id)]) || 0; }
    function dating(id) { return status(id) === 1; }
    function waitLeft(id) {
        if (status(id) !== 2) return 0;
        var last = Number(flags[flagKey(id) + "_DAY"]);
        if (isNaN(last)) return 0;
        return Math.max(0, RETRY_DAYS - (dayNow() - last));
    }

    /* ---------- Talk topic ---------- */
    function topicButton(slot) {
        if (!on() || typeof flags === "undefined" || !daneOn()) return;
        var any = aboard("syri") || aboard("anno") || dating("syri") || dating("anno");
        if (!any) {
            addDisabledButton(slot, "Asking Out", "Asking Out", "Dane only has eyes for two of your crew. Bring Syri or Anno aboard first.");
            return;
        }
        if (Number(flags.TN_DDATE_STAGE) !== 1) addButton(slot, "Asking Out", W.holdingBack, "Asking Out", "Ask Dane what’s stopping him from asking Syri and Anno out.");
        else addButton(slot, "Asking Out", W.wingMenu, "Asking Out", "Help Dane with Syri and Anno.");
    }
    W.topicButton = topicButton;

    W.holdingBack = function () {
        showDane();
        var sy = aboard("syri"), an = aboard("anno");
        var who = sy && an ? "Syri and Anno" : sy ? "Syri" : "Anno";
        var m = months();
        var lines = [
            "You pull up a seat across from Dane and ask him, flat out, what’s stopping him from asking " + who + " out.",
            "He freezes halfway through a sip of whiskey. Then he sets the glass down very carefully, the way you’d set down a live grenade. " + q("Don’t know what you’re talking about."),
            q("You stare at " + (sy && an ? "them" : "her") + " every time " + (sy && an ? "they walk" : "she walks") + " through the galley.") + " " + persona({
                bimbo: q("Like, you totally drool. It’s cute!"),
                bro: q("Dude. Everyone’s noticed."),
                nice: q("It’s sweet, honestly. But it’s obvious."),
                mis: q("You nearly walked into a bulkhead yesterday. Twice."),
                hard: q("You’re not subtle, Dane.")
            }),
            "Dane opens his mouth, closes it, and rubs a hand down his muzzle with a long, gusty sigh. All four of his shoulders sag. " + q("...Fine. Yeah. I noticed " + (sy && an ? "’em" : "her") + ". Hard not to.") + (sy && an ? " " + q("Two ausar sisters. Smart, mouthy, built like trouble. Last time I fell for a pair of sisters, I ended up with a harem.") : ""),
            q("So ask."),
            q("It ain’t that easy, Steele.") + " He stares into his glass. " + q("Back in the day, sure. I’d just walk up, grin, flex a little, done. But the last time I let anybody in, I came home after a job for your cuz and the place was empty. All three of ‘em. Gone. Off to Astrokat’s dressing room. Didn’t even leave a note.") + " His lower hands curl into fists on the table. " + q("Just... nerves, I guess. I walk up to " + (sy && an ? "one of ‘em" : "her") + " and all I can think is, what if I get the same look Chydi gave me on the way out the door? What if I’m just the big dumb merc who’s fun to look at and not worth keeping?"),
            m <= 2 ? q("And it’s fresh, you know? Still smell ‘em on my old jacket some days.") :
                m <= 8 ? q("It’s been " + monthsText() + ". Thought I’d be over it by now. Mostly am. Mostly.") :
                q("It’s been " + monthsText() + ". I’m over them. It’s not about them anymore. It’s about getting shot down.") ,
            "He snorts at himself. " + q("Eight feet of muscle, four arms, and I’m scared of a ‘no.’ Real tough guy.")
        ];
        say(lines);
        processTime(10);
        flags.TN_DDATE_STAGE = 1;
        clearMenu();
        addButton(0, "Go With Him", W.goWithHim, "Go With Him", "Offer to come along and be his wingman.");
        addButton(1, "Give It Time", W.giveTime, "Give It Time", "Tell him there’s no rush.");
    };

    W.goWithHim = function () {
        showDane();
        say([
            persona({
                bimbo: q("Okay, so, what if I come with you? I’m like, super good at this. I’ll be your hype girl!") + " You bounce on your heels for emphasis.",
                bro: q("So I’ll come with,") + " you tell him, clapping him on one of his many shoulders. " + q("Wingman. Easy."),
                nice: q("What if I came with you?") + " you offer. " + q("Not to do the talking. Just so you’re not walking in alone."),
                mis: q("Tell you what. I’ll come along. If you choke, I’ll make a bigger fool of myself so nobody notices."),
                hard: q("Then I’ll come with you,") + " you say. " + q("You’ve covered my back in a fight. I can cover yours for one conversation.")
            }),
            "Dane blinks at you. His tail gives one slow, uncertain wag against the bench. " + q("You’d do that?"),
            q("You’re my crew."),
            "He looks at you for a long moment, and then the corner of his muzzle twitches up into something almost like his usual grin. " + q("...Yeah. Okay. Wingman Steele.") + " He knocks back the rest of his whiskey for courage. " + q("Just say when, boss. And if this goes sideways, we never speak of it again."),
            "<b>(“Asking Out” in Dane’s Talk menu now lets you go with him to ask Syri or Anno.)</b>"
        ]);
        processTime(5);
        nextTo(W.wingMenu, "Plan your approach.");
    };

    W.giveTime = function () {
        showDane();
        say([
            "You tell him there’s no rush. Nobody’s timing him.",
            q("Yeah,") + " he rumbles, and he sounds relieved. " + q("Yeah. I’ll... figure it out.") + " He taps the table with one knuckle. " + q("But if I come knocking for backup, you don’t laugh."),
            q("Deal."),
            "<b>(You can go with him later from “Asking Out” in his Talk menu.)</b>"
        ]);
        processTime(3);
        nextTo(backToTalk, "Talk about something else.");
    };

    /* ---------- Wingman menu ---------- */
    W.wingMenu = function () {
        showDane();
        var sy = status("syri"), an = status("anno");
        var opener;
        if (sy === 1 && an === 1) opener = "Dane’s grinning like an idiot before you even sit down. " + q("Boss. Two dates. Two Dorna sisters. I’m gonna need a bigger calendar.");
        else if (sy === 1 || an === 1) opener = "Dane leans back with his upper arms folded behind his head, looking very pleased with life. " + q("Wingman Steele. What’s the plan?");
        else opener = rnd([
            "Dane cracks his knuckles, one set at a time, and doesn’t quite meet your eye. " + q("So. We doing this?"),
            "Dane is pacing the galley. He stops when he sees you. " + q("I’ve been practicing. Out loud. Your ship’s VI told me I sound ‘very sincere.’ I can’t tell if that’s good."),
            "Dane is pretending to read a datapad. It’s upside down. " + q("Oh. Steele. Hey. Is it... time?")
        ]);
        output(opener);
        clearMenu();
        askButton(0, "syri", "Syri");
        askButton(1, "anno", "Anno");
        addButton(2, "Pep Talk", W.pepTalk, "Pep Talk", "Give him some general advice on dating.");
        if (dating("syri") || dating("anno")) addButton(3, "How’s Dating?", W.howsDating, "How’s Dating?", "Ask how things are going.");
        else addDisabledButton(3, "How’s Dating?", "How’s Dating?", "He’s not seeing anyone yet.");
        addButton(14, "Back", backToTalk, "Back", "Talk about something else.");
    };

    function askButton(slot, id, name) {
        var st = status(id);
        if (st === 1) { addDisabledButton(slot, "Ask " + name, "Ask " + name, name + " already said yes."); return; }
        if (!aboard(id)) { addDisabledButton(slot, "Ask " + name, "Ask " + name, name + " needs to be aboard your ship."); return; }
        var wait = waitLeft(id);
        if (wait > 0) { addDisabledButton(slot, "Ask " + name, "Ask " + name, name + " turned him down. Give it " + wait + (wait === 1 ? " more day" : " more days") + " before he tries again."); return; }
        addButton(slot, "Ask " + name, function () { W.approach(id); }, "Ask " + name, (st === 2 ? "Try again. " : "") + oddsTip());
    }

    /* ---------- The approach ---------- */
    var WALK = {
        biped: "You lead the way, Dane a looming, nervous shadow at your back.",
        taur: "Your hooves ring on the deck plating as you lead the way, Dane a looming, nervous shadow at your flank.",
        naga: "You slither ahead down the corridor, Dane a looming, nervous shadow following your coils."
    };
    W.approach = function (id) {
        showPair(id);
        var again = status(id) === 2;
        var lines = [pick(WALK)];
        if (id === "syri") {
            lines.push("Syri’s door is cracked open, and the sounds of a firefight and a lot of creative swearing are spilling out of it. You knock. " + q("Yeah, yeah, it’s open!"));
            lines.push("She’s sprawled across her bunk with a controller in both hands and a headset slung around her neck, tail flicking with every shot. She spares you a glance, then a longer one for the eight-foot wall of ausar wedged in the doorway behind you. " + (again ? q("Oh, hey, round two. What’s up, big guy?") : q("Steele! And... the big guy. What’s up? You two look like you’re here to repo my console.")));
        } else {
            lines.push("You find Anno in the cargo hold, half under a crate of salvage with only her fluffy tail and a pair of legs sticking out. Something sparks. She swears cheerfully and rolls out, pushing her goggles up into her hair.");
            lines.push(again ? q("Oh! Hey, boss. Hey, Dane.") + " Her ears perk with curiosity. " + q("Back again, huh?") : q("Hey, boss! Oh, and Dane.") + " She squints up at him. " + q("Did you break the shower again? Because I <i>just</i> fixed the shower."));
        }
        lines.push("Dane makes a noise like a cargo lift with a bad bearing. Nothing else comes out.");
        say(lines);
        processTime(5);
        clearMenu();
        addButton(0, "Break the Ice", function () { W.ask(id, "ice"); }, "Break the Ice", "Get the conversation started for him.");
        addButton(1, "Nudge Him", function () { W.ask(id, "nudge"); }, "Nudge Him", "Give him a little push, and let him say it himself.");
    };

    W.ask = function (id, how) {
        showPair(id);
        var name = id === "syri" ? "Syri" : "Anno";
        var lines = [];
        if (how === "ice") {
            lines.push(persona({
                bimbo: q("Sooo, " + name + ", Dane has a super important question, and he’s been, like, practicing!") + " Dane looks like he wants to be swallowed by the deck.",
                bro: q("Big guy’s got something to ask you,") + " you announce, and step aside like you’re introducing a prize fighter.",
                nice: q("Dane wanted to ask you something,") + " you say gently, " + q("if you’ve got a minute."),
                mis: q("Dane here has a very important question about " + (id === "syri" ? "your gaming setup" : "the shower") + ",") + " you say. " + q("Just kidding. It’s about you."),
                hard: q("Dane has a question for you,") + " you tell " + name + ". " + q("Hear him out.")
            }));
            lines.push(pick({
                biped: "You give Dane a firm pat on the back.",
                taur: "You give Dane a nudge with your shoulder, which with your tauric bulk behind it nearly sends him through the doorway.",
                naga: "Your tail curls around behind him and gives him a firm shove forward."
            }) + " He clears his throat. Twice.");
        } else {
            lines.push(pick({
                biped: "You don’t say a word. You just plant a hand between Dane’s shoulder blades and lean on it until he takes a step forward.",
                taur: "You don’t say a word. You just lean your weight against him, hooves planted, until he takes a step forward.",
                naga: "You don’t say a word. You just slide your tail up behind his knees and nudge until he takes a step forward."
            }) + " He shoots you a betrayed look over his shoulder. You give him an encouraging nod.");
            lines.push("He takes a breath that swells his whole barrel chest.");
        }
        if (id === "syri") {
            lines.push(q("You, uh.") + " Dane rubs the back of his neck with one hand, then two, then gives up and crosses all four arms. " + q("You wanna get dinner. With me. Like a date.") + " A pause. " + q("Or a rematch. A rematch date. Loser buys.") + " Another pause. " + q("I’m bad at this. Is what I’m saying."));
        } else {
            lines.push(q("Anno.") + " Dane’s voice comes out a little too loud, and he winces and tries again. " + q("Anno. You’re... real smart. And you always smell like engine grease and coffee, and I like it, which is weird, I know it’s weird.") + " He scrubs a hand over his face. " + q("Wanna go out with me? Dinner? Next port we hit? I’ll even let you lecture me about shower pressure."));
        }
        var c = chance();
        var yes = c >= 100 || rand(100) < c;
        flags[flagKey(id) + "_DAY"] = dayNow();
        say(lines);
        output("\n\n");
        if (yes) {
            flags[flagKey(id)] = 1;
            if (id === "syri") syriYes(); else annoYes();
        } else {
            flags[flagKey(id)] = 2;
            if (id === "syri") syriNo(); else annoNo();
        }
        processTime(10);
    };

    /* ---------- Syri ---------- */
    function syriYes() {
        var lines = ["Syri pauses her game. Actually pauses it, which you’re pretty sure you’ve never seen her do mid-match. She looks Dane up and down, all eight feet of him, slowly, with a crooked little grin creeping up her muzzle."];
        if (syriLover()) {
            lines.push("Then she looks past him at you, one ear cocked. " + q("You cool with this, Steele? ‘Cause you’re still my number one, but I’m not gonna say no to a guy built like a cargo loader.") + " You tell her to go for it. " + q("Good. ‘Cause I was gonna say yes anyway."));
        }
        if (dating("anno")) {
            lines.push(q("Wait.") + " Her ears go straight up. " + q("Aren’t you already seeing my sister?") + " Dane opens his mouth. " + q("Nope, don’t care. Anno doesn’t get to call dibs on everything. She got the good hair. I get the four-armed guy."));
        }
        lines.push(q("A rematch date? Hell yeah.") + " She tosses her controller onto the bunk. " + q("Loser buys dinner. And fair warning, big guy, I’m not losing to you twice. You can have all the arms you want."));
        lines.push("Dane’s tail starts going so hard it thumps the doorframe. " + q("...Yeah?"));
        lines.push(q("Yeah, dumbass. Pick me up at eight. Or whatever passes for eight on this tub.") + " She puts her headset back on, then pulls one side away again to add, " + q("And wear something that isn’t cargo pants."));
        lines.push("Dane backs out of the room very carefully, like he’s afraid sudden movement might make her change her mind. Out in the corridor, he grabs you by both shoulders with his upper hands and shakes you a little. " + q("She said yes. Steele. <i>She said yes.</i>"));
        lines.push("<b>(Syri and Dane are dating.)</b>");
        say(lines);
        nextTo(function () { W.dateAfter("syri"); }, "Later that night...");
    }
    function syriNo() {
        var m = months();
        var reason = m < 3 ?
            q("You’re hot. I’m not blind. But you still talk like a guy who just got dumped, and I don’t wanna be the girl you date to feel better about the last ones.") :
            q("You’re hot, I’m not blind, but... you’re still carrying all that baggage around with you. I can see it. I know what it’s like being hung up on something you can’t have back.");
        say([
            "Syri pauses her game. She looks at Dane for a long moment, then sighs and pulls her headset off the rest of the way.",
            q("Look, big guy...") + " She scratches behind one ear. " + reason,
            q("Ask me again when you’ve had some time, yeah? And I mean it. That’s not a polite ‘no.’ I don’t do polite."),
            "Dane nods. His ears are flat, but he manages a gruff " + q("Yeah. Fair.") + " before he backs out of the room.",
            "In the corridor, he leans against the bulkhead with a heavy breath. You brace yourself for the worst, but he just huffs out a laugh. " + q("Huh. That wasn’t so bad. Didn’t die. Didn’t even get the ‘you’re just a hunk of muscle’ speech."),
            persona({
                bimbo: "You give him a big hug around as much of his middle as you can reach. " + q("You did super good!"),
                bro: "You bump his fist. " + q("Took a swing. That’s what counts."),
                nice: "You squeeze his arm. " + q("She said ‘later,’ not ‘never.’ That’s a real thing."),
                mis: q("For the record,") + " you say, " + q("you only made the cargo-lift noise once. Progress."),
                hard: q("You asked. That was the hard part."),
            }),
            "<b>(Syri said no for now. Dane can try again in " + RETRY_DAYS + " days.)</b>"
        ]);
        nextTo(backToTalk, "Back to Dane.");
    }

    /* ---------- Anno ---------- */
    function annoYes() {
        var lines = ["Anno’s ears shoot straight up. Her tail starts wagging before the rest of her has caught up. " + q("A date? Like, a <i>date</i> date? With food and stuff?")];
        lines.push("Dane nods, very seriously.");
        lines.push(q("Sure!") + " she chirps, then catches herself and holds up a grease-stained finger. " + q("Okay, fair warning: I don’t do the exclusive thing. I like who I like, and I’m not giving any of ‘em up. That’s not gonna make you weird, is it?"));
        lines.push("Dane actually laughs, a big surprised bark. " + q("Sweetheart, I used to run a harem. Weird’s not on the table."));
        if (dating("syri")) {
            lines.push("Anno’s eyes narrow. " + q("Hold on. You’re seeing Syri too, aren’t you? I can smell her on you.") + " Dane goes very still. Then Anno snickers. " + q("Oh, she is going to <i>hate</i> that I said yes. This is the best day of my life."));
        }
        lines.push(q("Next port, then. I know a noodle place in pretty much every system, and you’re buying.") + " She pulls her goggles back down and points a wrench at him. " + q("And if you so much as <i>look</i> at the shower valve, it’s off."));
        lines.push("Dane makes it all the way to the end of the corridor before he stops, turns around, and lifts you clean off " + pick({ biped: "your feet", taur: "your forehooves, which takes all four of his arms", naga: "the deck, coils dangling" }) + " in a crushing hug. " + q("She said yes!"));
        lines.push("<b>(Anno and Dane are dating.)</b>");
        say(lines);
        nextTo(function () { W.dateAfter("anno"); }, "Later that night...");
    }
    function annoNo() {
        var m = months();
        var reason = m < 3 ?
            q("You’re really sweet. And huge. Like, wow. But that’s rebound energy, big guy. I’ve been somebody’s rebound before, and it sucked for both of us.") :
            q("You’re really sweet. But you still flinch every time somebody says the word ‘concert.’ I noticed. I think you’re not quite done being sad yet, and that’s okay!");
        say([
            "Anno’s ears tip sideways. She chews her lip for a second, wiping her hands off on a rag while she thinks.",
            reason,
            q("Give it a little more time? Ask me again later. I’d like that, actually.") + " She gives him a small, honest smile, and pats one of his forearms with her clean hand. " + q("Really."),
            "Dane manages a nod and a gruff " + q("Yeah. Okay.") + " He doesn’t break anything on the way out, which you count as a win.",
            "Back in the corridor, he lets out a long, slow breath. " + q("She patted my arm, Steele. Like a puppy."),
            persona({
                bimbo: q("Aww! That’s like, a good pat though! Totally a good pat!"),
                bro: q("Good pat or bad pat?") + " He thinks about it. " + q("...Good pat."),
                nice: q("She said she’d like it if you asked again. She meant it."),
                mis: q("You’re eight feet tall. Everything you do looks like a puppy."),
                hard: q("She said ‘later.’ Take the win.")
            }),
            "<b>(Anno said no for now. Dane can try again in " + RETRY_DAYS + " days.)</b>"
        ]);
        nextTo(backToTalk, "Back to Dane.");
    }

    /* ---------- After the first date ---------- */
    W.dateAfter = function (id) {
        showDane();
        processTime(240);
        var lines = [];
        if (id === "syri") {
            lines.push("Late that night, you hear heavy footsteps stop outside your door, followed by a very gentle knock for a guy who could punch through it.");
            lines.push("Dane is standing in the corridor in an actual button-up shirt. Most of the buttons have given up. He has a takeout box in one hand, a drink in another, and he looks completely dazed.");
            lines.push(q("She beat me,") + " he says. " + q("Five rounds to two. I bought dinner. She ate half of mine.") + " A slow, stupid grin spreads across his whole face. " + q("Best date I’ve had in years. She trash-talked the whole time, Steele. It was <i>perfect</i>."));
        } else {
            lines.push("Late that night, Dane catches you on your way past the galley. He’s sitting alone with a cup of coffee, which you’ve never once seen him drink, and he’s smiling into it.");
            lines.push(q("We got noodles,") + " he tells you, without being asked. " + q("She talked about warp coil harmonics for forty minutes. I didn’t understand a word. Could’ve listened all night.") + " He turns the cup in his big hands. " + q("Then she drew a schematic on a napkin for how to fix my shoulder holster. It works better now. Look."));
            lines.push("He demonstrates. It does work better.");
        }
        lines.push("He sets the cup aside and looks at you, ears soft. " + q("Hey. Thanks, boss. For coming with me. I wouldn’t have done it alone."));
        lines.push(persona({
            bimbo: q("Aww, Dane! Group hug!") + " He lets you have one.",
            bro: "You bump his fist. He bumps back hard enough to rattle your teeth.",
            nice: "You tell him you’re really happy for him, and you mean it.",
            mis: q("I expect to be best man at the wedding."),
            hard: "You tell him anytime. He nods, once, and that’s all that needs to be said."
        }));
        say(lines);
        nextTo(mainGameMenu, "Leave him to it.");
    };

    /* ---------- Pep talk: dating in general ---------- */
    W.pepTalk = function () {
        showDane();
        var first = flags.TN_DDATE_PEP !== 1;
        flags.TN_DDATE_PEP = 1;
        var lines = [first ? "You sit Dane down for a talk. Not about Syri or Anno. About dating. In general." : "You give Dane another round of dating advice. He listens like it’s a mission briefing."];
        lines.push(persona({
            bimbo: q("Okay so, like, rule one: smile! You have a really great smile when you’re not doing the scary face. Rule two: compliments! Rule three... um, I forgot rule three, but it was about butts."),
            bro: q("Look. You’re you. That’s the move. Don’t try to be some smooth guy. Just be the big lug who shows up and means it."),
            nice: q("You don’t have to be perfect. You just have to be honest. If you’re nervous, say you’re nervous. Most people find that more charming than fake confidence."),
            mis: q("Step one: don’t make the cargo-lift noise. Step two: if you make the cargo-lift noise, commit to it. Make it a bit. Own it."),
            hard: q("A ‘no’ isn’t a wound, Dane. It’s information. Take it, adjust, and move on. You do it in every fight.")
        }));
        lines.push(rnd([
            "Dane rubs his jaw. " + q("Huh. That’s... actually not bad advice.") + " He squints at you. " + q("Don’t let it go to your head."),
            q("Back with the harem, I never had to try,") + " he admits. " + q("Chydi picked me. Kythi came with Chydi. The go’rahn picked Kythi. I just kinda... got collected.") + " He snorts. " + q("Guess I never learned the asking part."),
            q("What if they say yes and then figure out I’m just a big dumb merc?") + " He waves off your answer before you can give it. " + q("Yeah, yeah. ‘You’re not dumb, Dane.’ I know. I’m just saying it out loud so it stops rattling around in there.")
        ]));
        lines.push(dating("syri") || dating("anno") ?
            "He grins, slow and smug. " + q("Besides, I’ve already got a yes under my belt. I’m practically an expert now.") :
            "He blows out a long breath and squares all four shoulders. " + q("Alright. One of these days, boss. Just say when."));
        say(lines);
        processTime(10);
        nextTo(W.wingMenu, "Back to the plan.");
    };

    /* ---------- How's dating ---------- */
    W.howsDating = function () {
        showDane();
        var sy = dating("syri"), an = dating("anno");
        var lines = ["You ask Dane how dating’s going."];
        if (sy && an) {
            lines.push(rnd([
                q("Two Dorna sisters, Steele.") + " He spreads all four arms wide. " + q("Two. Syri wants to spar and play games until four in the morning. Anno wants to fix everything I own and fall asleep on my chest. I haven’t slept a full night in a week and I have never been happier."),
                q("They keep trying to one-up each other,") + " he says, sounding delighted about it. " + q("Syri took me to a shooting range, so Anno took me to a swap meet. Syri bought me a drink, so Anno <i>built me a drink dispenser</i>. I’m just along for the ride."),
                "He drops his voice. " + q("Between you and me, I think they like the competition more than they like me.") + " Then he grins. " + q("I’m fine with that. Heh. It’s like the old days. Better, maybe. These two actually talk to each other.")
            ]));
        } else if (sy) {
            lines.push(rnd([
                q("She cheats,") + " he growls. " + q("At every game. Every single one. And when I call her out on it, she just grins and says ‘prove it.’") + " His tail is wagging. " + q("I love it. Don’t tell her."),
                q("Took her to a bar on the last stop. She started three fights and won two. I finished the third one.") + " He looks extremely satisfied. " + q("Best night of my life."),
                q("She steals my jacket. Every time. Says it’s warm.") + " He shrugs, a little sheepish. " + q("I’ve stopped taking it back.")
            ]));
            if (aboard("anno") && status("anno") !== 1) lines.push("He glances toward the cargo hold. " + q("Still thinking about her sister, though. When the time’s right."));
        } else if (an) {
            lines.push(rnd([
                q("She fixed my pistols. Both of ‘em. Then she fixed my blade, my armor, my bunk, and my shower.") + " He pauses. " + q("I didn’t ask her to fix any of it. I think it’s how she says she likes you."),
                q("We did a movie night. She fell asleep on me fifteen minutes in. I sat there for two hours so I wouldn’t wake her up.") + " He rolls his shoulders. " + q("Totally worth the cramp."),
                q("She’s seeing other folks too, and I don’t mind. Feels good, being one of the people someone chooses on purpose.") + " He shrugs. " + q("Easier than trying to be the only one.")
            ]));
            if (aboard("syri") && status("syri") !== 1) lines.push("He glances toward Syri’s quarters. " + q("Still working up to asking her sister, though. One Dorna at a time."));
        }
        if ((sy && !aboard("syri")) || (an && !aboard("anno"))) lines.push(q("Long distance is rough,") + " he admits. " + q("But we call. Keeps me honest."));
        say(lines);
        processTime(10);
        nextTo(W.wingMenu, "Back to the plan.");
    };

    /* ---------- Hook into Dane's Talk menu ---------- */
    function wrapDane() {
        var orig = window.tnDaneTalkMenu;
        if (typeof orig !== "function") return false;
        if (orig.__tnDdate) return true;
        window.tnDaneTalkMenu = function () {
            var r = orig.apply(this, arguments);
            try { topicButton(10); } catch (err) { console.warn("[TN] Dane's Wingman topic", err); }
            return r;
        };
        window.tnDaneTalkMenu.__tnDdate = true;
        return true;
    }
    W.wrapDane = wrapDane;
    (function boot(tries) {
        var done = false;
        try { done = wrapDane(); } catch (err) { console.warn("[TN] Dane's Wingman hook", err); }
        if (!done && tries < 300) setTimeout(function () { boot(tries + 1); }, 400);
    })(0);
})();
