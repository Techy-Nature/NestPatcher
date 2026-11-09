/*
 * TN_BiancaClinic_v2.9.js - "Bianca's Clinic" (NestPatcher runtime mod, TiTS 0.9.168), Modv2.9
 * Author: Neston
 *
 * Needs Bianca Extras (TN_BiancaExtras_v2.9.mod + .js) and TN_BiancaClinic_v2.9.mod (hooks).
 * After your talk with Bianca on Tavros (the start of her love track), she opens Ketria Clinic,
 * a small shared practice on Tavros' Merchant Deck, just west of the Merchant's Thoroughfare
 * corner between Anon's Bar and the Treetop Tattoo street. It gives her steady work without
 * running herself ragged.
 *   - Three days after your Tavros talk she emails you that the clinic is open.
 *   - The clinic itself is open 8 AM to 6 PM every day. Two rooms: the front desk / waiting room
 *     (west of the thoroughfare) and the exam hall behind it (north).
 *   - Front desk: Nestan "Nest" Toftwyn (they/them), the receptionist. Book an appointment with
 *     Dr. Ketria or Dr. Rewell, ask where to find them, or look at Nest. (Draft scenes: Neston
 *     will write Nest's full scenes.)
 *   - Dr. Bianca Ketria: 9 AM to 2 PM, every third day. On those days she skips her rounds in the
 *     wilds; her booth and the bars keep their usual hours. Checkup, Chat, Lunch, Help Out.
 *     No sex at the clinic (lovers get a kiss).
 *   - Dr. Charles Rewell: the geneticist from the very start of the game, who sat with Victor and
 *     designed Steele. Retired from Steele Tech, he now shares the clinic with Bianca and helps
 *     Steele with their own children the way he once helped Victor: talks, a children's consult,
 *     and a free prenatal scan once a day while Steele is pregnant.
 * Flags (in your save): TN_BXC_TS, TN_BXC_VISITS, TN_BXC_CHECK_DAY, TN_BXC_LUNCH_DAY,
 *   TN_BXC_HELP_DAY, TN_BXC_CHAT, TN_BXC_NEST_MET, TN_BXC_APPT_K, TN_BXC_APPT_R, TN_BXC_RW_MET,
 *   TN_BXC_RW_TALKS, TN_BXC_RW_SCAN_DAY, TN_BXC_RW_KIDS.
 * Toggle: Options -> Android Mods -> "Bianca's Clinic".
 */
(function () {
    "use strict";
    if (window.__tnBiancaClinicLoaded) return;
    window.__tnBiancaClinicLoaded = true;

    var MOD_ID = "tn.bianca-clinic";
    var OPEN_AFTER = 4320; // 3 days after the Tavros talk
    var CLINIC_OPEN = 8, CLINIC_CLOSE = 18; // the clinic's own hours (Nest and Dr. Rewell)
    var BIANCA_OPEN = 9, BIANCA_CLOSE = 14; // Bianca's hours, every third day

    /* ---------- Mod menu switch ---------- */
    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    window.tnBiancaClinicEnabled = on;
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Bianca's Clinic",
            author: "Neston",
            description: "After your talk with Bianca on Tavros, she opens Ketria Clinic on the Merchant Deck (west of the thoroughfare by Anon's). Open 8 AM to 6 PM daily with Dr. Rewell, the geneticist who designed Steele, and Nest at the front desk; Bianca works 9 AM to 2 PM every third day. Needs Bianca Extras.",
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
    function rnd(list) { return list[rand(list.length)]; }
    function now() { return safe(function () { return GetGameTimestamp(); }, 0); }
    function today() { return safe(function () { return days; }, 0); }
    function extrasOn() { return !window.tnBiancaExtrasEnabled || window.tnBiancaExtrasEnabled(); }
    function loveTrack() { return num("TN_BX_STATE") >= 4; }
    function isLover() { return safe(function () { return bianca.isLover(); }, false); }
    function body(o) {
        var b = safe(function () { return pc.isTaur() ? "taur" : pc.isNaga() ? "naga" : "biped"; }, "biped");
        return o.hasOwnProperty(b) ? o[b] : o.biped;
    }
    function start(bust) {
        clearMenu(); clearOutput();
        safe(function () { showBianca(bust || "CLOTHED"); });
        author("Neston");
    }
    // Scenes with Nest or Dr. Rewell: no bust art for them yet, so just a name plate.
    function startNpc(name) {
        clearMenu(); clearOutput();
        safe(function () { clearBust(); });
        safe(function () { showName(name); });
        author("Neston");
    }
    function pregnant() { return safe(function () { return pc.isPregnant(); }, false); }
    function hrs() { return safe(function () { return hours; }, 12); }

    /* ---------- Schedule ---------- */
    function noteReunion() {
        try {
            if (typeof flags === "undefined" || !flags) return;
            if (loveTrack() && flags.TN_BXC_TS === undefined) flags.TN_BXC_TS = now();
        } catch (err) {}
    }
    setInterval(noteReunion, 3000);
    function opened() { noteReunion(); return loveTrack() && flags.TN_BXC_TS !== undefined && now() - num("TN_BXC_TS") >= OPEN_AFTER; }
    function clinicOpen() { return opened() && hrs() >= CLINIC_OPEN && hrs() < CLINIC_CLOSE; }
    function clinicDay() { return opened() && today() % 3 === 0; }
    function biancaGone() { return safe(function () { return pc.hasStatusEffect("Bianca Gone"); }, false); }
    function isOpen() { return clinicDay() && hrs() >= BIANCA_OPEN && hrs() < BIANCA_CLOSE && !biancaGone(); }
    function nextOpenText() {
        var d = today();
        if (clinicDay() && hrs() < BIANCA_OPEN) return "today at 9 AM";
        var add = 3 - (d % 3);
        if (add === 0) add = 3;
        return add === 1 ? "tomorrow at 9 AM" : "in " + add + " days, at 9 AM";
    }
    function live() { return on() && extrasOn() && safe(opened, false); }
    // Called by the patched biancaInTheWilderness: no wild rounds on clinic days.
    window.tnBiancaClinicDay = function () { return on() && extrasOn() && safe(clinicDay, false) && !biancaGone(); };
    // Called by the patched Merchant's Thoroughfare room: the west door is locked unless this is true.
    window.tnKetriaClinicDoor = function () { return live() && safe(clinicOpen, false); };

    /* ---------- Email ---------- */
    var MAIL_ID = "tn_bianca_clinic_open";
    var mailEntry = {
        content: function () {
            var t = "Hello again, [pc.name]!\n\nI promised you I would go back to work without running myself into the ground, and I've found a way to do exactly that. As of today I have a clinic. A small one, on the Merchant Deck: from the lift, head up the thoroughfare past Anon's, and it's the door on the west side, the one with the sign I was far too nervous hanging up.\n\nI'm not running it alone, either. I'm sharing it with Dr. Charles Rewell, a geneticist who retired from your father's company. He says he's known you since before you were born, and he means that very literally. He'll explain. He's there every day, and so is our receptionist, Nest Toftwyn, who has already reorganized my entire schedule and is somehow always right about it.\n\nThe clinic is open from eight in the morning until six in the evening. I'm there from nine until two, every third day. Yes, only every third day. I've decided that a doctor who sleeps is a better doctor, and I'd like to test that theory for a while. On my clinic days I won't be out in the wilds, but my booth and my evenings are the same as always.\n\nCome by if you need anything. Come by if you don't, too. Nest can book you in with either of us.\n\n-Bianca";
            return typeof ParseText === "function" ? ParseText(t) : t;
        },
        subject: "My door is open",
        from: "Dr. Bianca Ketria",
        fromAddress: "bianca_ketria@UGCMed.net",
        test: function () { return on() && extrasOn() && opened(); }
    };
    function registerMail() {
        try {
            if (!window.tnMailHx || !window.tnMailMgr) return false;
            if (!window.tnMailHx[MAIL_ID]) {
                window.tnMailHx[MAIL_ID] = mailEntry;
                if (!window.tnMailMgr.hasEntry || !window.tnMailMgr.hasEntry(MAIL_ID)) window.tnMailMgr.addMailEntry(MAIL_ID, mailEntry);
            }
            return true;
        } catch (err) { return true; }
    }
    if (!registerMail()) {
        var mailTries = 0;
        var mailTimer = setInterval(function () { if (registerMail() || ++mailTries >= 300) clearInterval(mailTimer); }, 200);
    }

    /* ---------- The thoroughfare (called from the patched Merchant's Thoroughfare room) ---------- */
    window.tnKetriaStreetBonus = function () {
        if (!on() || !extrasOn()) return;
        try {
            if (!opened()) {
                if (loveTrack()) output("\n\nOn the west side of the thoroughfare, a pair of workers are fitting a new door to an empty storefront. A crate beside them is stenciled <i>MEDICAL SUPPLIES - THIS SIDE UP</i>.");
                return;
            }
            if (clinicOpen()) {
                output("\n\n" + rnd([
                    "To the west, a clean white sign hangs over a glass door: <b>Ketria Clinic - General Medicine &amp; Clinical Genetics</b>. Through the glass you can see a bright little waiting room and someone with folded green wings working the front desk.",
                    "The door of <b>Ketria Clinic</b> stands to the west, propped open with a doorstop shaped like a cartoon ausar. A hand-lettered card in the window says <i>Walk-ins welcome. Please don’t bleed on the plant.</i>",
                    "West of the thoroughfare, <b>Ketria Clinic</b> is open. A patient on their way out holds the door for another on their way in."
                ]));
            } else {
                output("\n\nTo the west, the glass door of <b>Ketria Clinic</b> is locked and the lights inside are dimmed. The hours stenciled on the door read <i>8 AM - 6 PM, every day.</i>");
            }
        } catch (err) { if (window.console) console.error("[Bianca's Clinic] street", err); }
    };

    /* ---------- Front desk: Nest ---------- */
    function nestEyes() { return "hazel"; } // the waiting room is brightly lit; their eyes go green in dim light
    window.tnKetriaFrontDesk = function () {
        if (!live()) { output("An empty, half-finished waiting room. Nobody is here."); return false; }
        try {
            output("Ketria Clinic’s waiting room is bright and a little cramped: a handful of mismatched chairs, a rack of pamphlets about everything from Sydian rust allergies to safe mod dosages, and a leafy potted vine in the corner that someone is clearly trying very hard to keep alive. A door at the back, to the north, leads to the exam rooms. The thoroughfare’s bustle is muffled to a murmur behind the glass door to the east.");
            if (!num("TN_BXC_NEST_MET")) {
                output("\n\nBehind the front desk sits someone you haven’t met: an androgynous half-ausar with four green-scaled, tan-webbed wings folded neatly against their back and brown hair cut at the ears. A nameplate on the desk reads <b>Nest Toftwyn</b>, and under it, in smaller letters, <i>they/them</i>.");
                addButton(0, "Front Desk", nestFirst, "Front Desk", "Introduce yourself to the receptionist.");
            } else {
                output("\n\n" + rnd([
                    "Nest is behind the front desk, typing with quick, claw-tipped fingers. They glance up and give you a little wave without breaking their rhythm.",
                    "Nest is on a call at the front desk, wings shifting as they juggle a datapad and a stylus. They hold up one furred finger at you: <i>one moment</i>.",
                    "Nest is sorting the day’s files at the front desk. Under the bright waiting room lights, their eyes are a warm " + nestEyes() + "."
                ]));
                addButton(0, "Nest", nestMenuIntro, "Nest", "Talk to Nest at the front desk.");
            }
        } catch (err) { if (window.console) console.error("[Bianca's Clinic] front desk", err); }
        return false;
    };
    function nestFirst() {
        startNpc("Nest");
        say([
            "You walk up to the front desk. The receptionist finishes a line of typing, then looks up at you with a polite, practiced smile. Under the bright waiting room lights, their eyes are hazel.",
            q("Welcome to Ketria Clinic. I’m Nest. Do you have an appointment, or...") + " They pause, and their head tilts a little. " + q("Oh. You’re Steele, aren’t you? Dr. Ketria described you. In <i>detail.</i> And Dr. Rewell has a picture of you in his office, but you were about a day old in it, so that one was less helpful."),
            "They stand and offer you a hand across the desk. Their hand is furred in soft brown, the fingers tipped with neat little claws, and their grip is warm and firm. Standing, they’re about five foot eight, slim, with an easy, unhurried way of moving, their folded wings rustling as they settle back into their chair.",
            q("I keep the schedules for both doctors, so if you want to see either of them, I’m who you talk to,") + " Nest says. " + q("Dr. Ketria is in every third day, nine to two. Dr. Rewell is here whenever the clinic is open, which is eight to six. Both of their rooms are through the door behind me.") + " They nod at the door to the north. " + q("Anything you need, just ask.")
        ]);
        flags.TN_BXC_NEST_MET = 1;
        safe(function () { processTime(3); });
        nestMenu();
    }
    function nestMenuIntro() {
        startNpc("Nest");
        output(rnd([
            "Nest looks up from their terminal. " + q("Hey, Steele. What can I do for you?"),
            "Nest sets down their stylus and folds their furred hands on the desk. " + q("Back again? What do you need?"),
            "Nest finishes their call, taps the earpiece off, and gives you their full attention. " + q("Sorry about that. How can I help?")
        ]));
        nestMenu();
    }
    function nestMenu() {
        clearMenu();
        addButton(0, "Appointment", appointment, "Appointment", "Ask Nest to book you in with one of the doctors.");
        addButton(1, "Directions", directions, "Directions", "Ask Nest where to find Dr. Ketria and Dr. Rewell.");
        addButton(2, "Appearance", nestAppearance, "Appearance", "Take a look at Nest.");
        addButton(14, "Back", mainGameMenu);
    }
    function nestBack() { addButton(0, "Next", function () { startNpc("Nest"); output("Nest straightens a stack of files. " + q("Anything else?")); nestMenu(); }); }

    function appointment() {
        startNpc("Nest");
        output("You ask Nest about an appointment. They pull up the schedule on their terminal, wings shifting as they lean in. " + q("Sure. Who would you like to see?"));
        clearMenu();
        addButton(0, "Dr. Ketria", bookKetria, "Dr. Ketria", "Book in with Bianca.");
        addButton(1, "Dr. Rewell", bookRewell, "Dr. Rewell", "Book in with the geneticist.");
        addButton(14, "Back", nestMenuIntro);
    }
    function bookKetria() {
        startNpc("Nest");
        var d = today();
        if (num("TN_BXC_APPT_K") === d + 1) {
            say([q("You’re already on her list for today,") + " Nest says, tapping the screen. " + q("First door on the left, through the back. She knows you’re coming.")]);
        } else if (isOpen()) {
            say([
                "Nest taps a few keys. " + q("You’re in luck. She’s in today, and she has a gap right now.") + " They type your name into the slot, then pause. " + q("She asked me to put you through whenever you show up, by the way. Even if she’s booked. Those were her exact words. I’m choosing to respect them."),
                q("Through the door behind me, first door on the left. Her name’s on it, and there’s usually a smell of tea coming out from under it.")
            ]);
            flags.TN_BXC_APPT_K = d + 1;
        } else {
            say([
                "Nest checks the schedule and shakes their head. " + q("Dr. Ketria isn’t in right now. She works nine to two, every third day. The rest of the time she’s out in the wilds or, if I have any say in it, resting.") + " They make a note. " + q("Her next shift starts " + nextOpenText() + ". I’ll pencil you in for then."),
                q("If it’s urgent, Dr. Rewell can see you, or you can catch her at her booth out on the frontier. And if you happen to see her before then...") + " They lower their voice. " + q("Remind her to eat something. She won’t listen to me.")
            ]);
        }
        safe(function () { processTime(2); });
        nestBack();
    }
    function bookRewell() {
        startNpc("Nest");
        var d = today();
        if (num("TN_BXC_APPT_R") === d + 1) {
            say([q("He’s already expecting you,") + " Nest says. " + q("End of the hall, the door with the double helix on it.")]);
        } else {
            say([
                "Nest checks Dr. Rewell’s schedule. " + q("He’s free. He usually is, between his patients. He spends most of it reading and humming to himself.") + " They fill in the slot. " + q("All set."),
                q("Through the door behind me and all the way down the hall. His door is the one at the end with the double helix painted on it. He painted it himself. Don’t tell him it’s a little crooked."),
                !num("TN_BXC_RW_MET") ? q("And, um, fair warning.") + " Nest’s mouth twitches. " + q("He’s been waiting for you to come by since the day we opened. He might get a little emotional.") : ""
            ]);
            flags.TN_BXC_APPT_R = d + 1;
        }
        safe(function () { processTime(2); });
        nestBack();
    }
    function directions() {
        startNpc("Nest");
        say([
            "You ask Nest where the doctors are.",
            "They swivel their chair and point to the door behind the desk. As they lean back out of the glare of the desk lamp and into the shade of their wings, their eyes shift from hazel to a clear, bright green. It’s a little startling, the first time you notice it.",
            q("Through there, to the north. It’s one hallway. Dr. Ketria’s exam room is the first door on the left, with her name on it.") + (isOpen() ? q(" She’s in today, until two.") : q(" She’s not in right now. Next shift is " + nextOpenText() + ".")) + " " + q("Dr. Rewell’s office is at the end, the door with the double helix. He’s in whenever we’re open."),
            q("If Dr. Ketria isn’t here, she’s usually at her booth out on the frontier, or doing her rounds in the wilds, or at home on the Residential Deck,") + " Nest adds. " + q("Not that I keep track of my boss. I just keep track of everything."),
            "They lean forward again, back into the light, and their eyes settle back to hazel."
        ]);
        safe(function () { processTime(2); });
        nestBack();
    }
    function nestAppearance() {
        startNpc("Nest");
        say([
            "<b>Nestan “Nest” Toftwyn</b> is the clinic’s receptionist, and uses <i>they/them</i>. They’re about five foot eight and androgynous, neither soft nor sharp, with a calm, easygoing face.",
            "They’re half ausar and half gryvain, and the ausar side mostly wins: their skin is light, their brown hair is cut just at the ears, and their hands are furred in brown, the fingers tipped with short claws. Their feet are furred and clawed too, tapping idly under the desk. The gryvain side shows in four big wings folded against their back, covered in green scales with tan webbing between the struts, and in a patch of the same green scales on their back around where the wings meet it.",
            "Their eyes are the strangest thing about them: they change with the light. Under the bright lamps of the waiting room they’re a warm hazel, but whenever Nest leans back into shadow, they turn a vivid green.",
            "They’re dressed for the front desk in a soft, oversized sweater with slits cut in the back for their wings, and their chest is small under it. A clinic badge is clipped to the collar."
        ]);
        nestBack();
    }

    /* ---------- Exam hall (north of the front desk) ---------- */
    window.tnKetriaExamHall = function () {
        if (!live()) { output("An empty hallway. Nobody is here."); return false; }
        try {
            output("The back hallway of Ketria Clinic is narrower and dimmer than the waiting room, lit by soft panels along the ceiling. The first door on the left has a neat little plate: <b>Dr. B. Ketria</b>. The door at the end of the hall has a double helix painted on it, slightly crooked, and the words <b>Dr. C. Rewell - Clinical Genetics</b>. A tiny break room, barely big enough for a kettle and two chairs, is tucked in between. The front desk is back to the south.");
            if (isOpen()) {
                output("\n\nBianca’s door is open, and you can hear her humming inside.");
                addButton(0, "Dr. Ketria", enterClinic, "Dr. Ketria", "Drop in on Bianca at her practice.");
            } else {
                output("\n\nBianca’s door is closed, with a little card tucked in the frame: <i>Back " + nextOpenText() + ".</i>");
                addDisabledButton(0, "Dr. Ketria", "Dr. Ketria", "Bianca isn’t in right now. She works 9 AM to 2 PM, every third day.");
            }
            output("\n\nLight spills from under Dr. Rewell’s door, along with the faint sound of someone humming an old song badly.");
            addButton(1, "Dr. Rewell", rewellEnter, "Dr. Rewell", "Knock on the geneticist’s door.");
        } catch (err) { if (window.console) console.error("[Bianca's Clinic] hall", err); }
        return false;
    };

    /* ---------- Dr. Bianca Ketria ---------- */
    function enterClinic() {
        start("CLOTHED");
        safe(function () { processTime(2); });
        if (!num("TN_BXC_VISITS")) {
            say([
                "You knock on the door with Bianca’s name on it, and the first thing that hits you when it opens is the smell: antiseptic, fresh paint, and, faintly, the perfume you’d know anywhere.",
                "Bianca’s ears shoot straight up when she sees it’s you, and her tails start swishing so hard they knock a chart off the counter.",
                q("[pc.name]! You came!") + " She hurries over, then catches herself and smooths down the front of her coat. It’s a fresh one, crisp and white, with <i>Dr. B. Ketria</i> stitched over the pocket. " + q("Welcome to my clinic. Well. Half of it. Would you like the tour? It will take about nine seconds."),
                "It takes closer to fifteen, because she stops to show you everything. The exam room, with its single table and a cabinet she organized by color. The tiny desk with a terminal and a framed holo of the two of you from the park. The break room. The kettle. She is <i>very</i> proud of the kettle.",
                q("You’ve met Nest, I hope. I don’t know what I did before Nest. Suffered, mostly.") + " She nods down the hall. " + q("And Charles has the office at the end. He’ll want to see you. He’s been unbearable about it."),
                q("It isn’t much,") + " she admits when you’re back in her exam room, " + q("but it’s mine. I see who comes in, I leave at two, and then I go home and eat a proper lunch. Every third day. That’s the rule.") + " She taps a card on the inside of the door, where the hours are written in her neat, slanted handwriting. " + q("If I start breaking it, you have my permission to drag me out by the tails."),
                "You promise to hold her to that. She beams at you."
            ]);
        } else if (num("TN_BXC_APPT_K") === today() + 1 && rand(2) === 0) {
            say([q("Nest said you were coming,") + " Bianca says before you’re even through the door, already reaching for her stethoscope. " + q("They put you down as <i>‘VIP, do not make wait, she means it.’</i> I did not say that.") + " A pause. " + q("I did say that.")]);
        } else if (isLover() && rand(2) === 0) {
            say([
                rnd([
                    "Bianca is writing up a chart when you come in. She glances up, and her whole face changes. She checks that the hallway is empty, then leans in and kisses you, quick and warm. " + q("Don’t tell my patients,") + " she whispers. " + q("I have a reputation for professionalism."),
                    "Bianca looks up from the kettle in the break room as you pass. " + q("Oh, it’s my favorite patient.") + " She crosses to you and kisses your cheek, then straightens your collar like she can’t help herself. " + q("What can I do for you, love?")
                ])
            ]);
        } else {
            say([rnd([
                "Bianca is sitting at her little desk with a cup of tea and a datapad. " + q("[pc.name]! Good timing. My last patient just left with a very sprained ankle and a very good attitude.") + " She sets the tea down. " + q("What brings you in?"),
                "A kaithrit mother is on her way out of Bianca’s room with a sniffling kitten bundled in her arms, thanking her over and over. Bianca waves them off with a gentle smile, then turns to you, tails wagging. " + q("Hello, you. Here as a patient, or here to keep me company?"),
                "Bianca is in the break room, talking to the potted vine that has somehow migrated in from the waiting room. She jumps when you come in. " + q("I was... checking its soil moisture,") + " she says with enormous dignity. " + q("Hello, [pc.name]. What can I do for you?"),
                "A burly dockworker is sitting on Bianca’s exam table, getting a bandage wrapped around his forearm while she lectures him about safety harnesses. She catches your eye through the door and holds up one finger. A few minutes later he shuffles out, chastened, and she comes to greet you. " + q("Sorry about that. What can I do for you?")
            ])]);
        }
        IncrementFlag("TN_BXC_VISITS");
        clinicMenu();
    }
    function clinicMenu() {
        clearMenu();
        var d = today();
        var needs = safe(function () { return pc.HPQ() < 100 || pc.statusEffectv1("Sore Counter") > 0; }, false);
        if (num("TN_BXC_CHECK_DAY") === d + 1) addDisabledButton(0, "Checkup", "Checkup", "Bianca already looked you over today.");
        else if (!needs) addDisabledButton(0, "Checkup", "Checkup", "You’re in perfect health. Bianca would only tell you to drink more water.");
        else addButton(0, "Checkup", checkup, "Checkup", "Have Bianca patch you up. " + (isLover() ? "She’d never charge you." : "She charges the same as at her booth."));
        addButton(1, "Chat", chat, "Chat", "Talk with Bianca about her practice.");
        if (num("TN_BXC_LUNCH_DAY") === d + 1) addDisabledButton(2, "Lunch", "Lunch", "You already had lunch together today.");
        else if (hrs() < 12) addDisabledButton(2, "Lunch", "Lunch", "It’s a little early for lunch. Bianca takes her break at noon.");
        else addButton(2, "Lunch", lunch, "Lunch", "Take Bianca out for lunch. She needs reminding to eat.");
        if (num("TN_BXC_HELP_DAY") === d + 1) addDisabledButton(3, "Help Out", "Help Out", "You already helped out today.");
        else addButton(3, "Help Out", helpOut, "Help Out", "Spend an hour helping Bianca around the clinic.");
        addButton(14, "Leave", leave);
    }
    function back() { addButton(0, "Next", function () { start("CLOTHED"); output("Bianca smooths down her coat. " + q("Anything else?")); clinicMenu(); }); }

    function checkup() {
        start("CLOTHED");
        var hurt = safe(function () { return pc.HPQ() < 100; }, false);
        var sore = safe(function () { return pc.statusEffectv1("Sore Counter") > 0; }, false);
        var cost = (hurt ? 50 : 0) + (sore ? 50 : 0);
        if (isLover()) cost = 0;
        say([
            "Bianca pats her exam table. " + body({
                biped: "You hop up onto it, the paper crinkling under you.",
                taur: "You eye the table, then her. She laughs and pulls a padded stool over instead, motioning for you to stand beside it so she can reach your human half.",
                naga: "You coil up beside it instead, which puts you at a very convenient height. Bianca nods approvingly."
            }),
            hurt ? "She works quickly and carefully, cleaning your cuts and scrapes with something that stings for half a second and then goes cool, wrapping what needs wrapping, and checking each bruise with a light press of her fingers. " + q("You,") + " she says, " + q("are a menace to your own skin.") : "",
            sore ? "Next she works a warm, sharp-smelling gel into your aching muscles, kneading the knots out with her thumbs until you’re practically melting off the " + body({ biped: "table", taur: "floor", naga: "floor" }) + ". " + q("Stretch before you go running into fights. I know you won’t. But I said it.") : "",
            q("There,") + " she says at last, peeling off her gloves. " + q("Good as new. Or as close to new as you let yourself get."),
            cost > 0 ? "Nest rings you up at the front desk on your way past, " + cost + " credits, the same as her booth. " + q("She wanted to give you a discount,") + " they say, " + q("but I’ve seen what the rent on this place is.") : (isLover() ? "When you reach for your credit chit, she gives you a look so withering you put it right back. " + q("Absolutely not. I am not billing my own partner. Nest already knows.") : ""),
            safe(function () { return pc.hasSSTD(); }, false) ? q("One more thing.") + " Her ears dip. " + q("You’re carrying something I can’t treat here. I don’t have the equipment yet. Come see me at my booth and I’ll take care of it, alright?") : ""
        ]);
        safe(function () { if (cost > 0) pc.credits = Math.max(0, pc.credits - cost); });
        safe(function () { pc.maxOutHP(); });
        safe(function () { var s = pc.statusEffectv1("Sore Counter"); if (s > 0) soreDebuff(-s); });
        safe(function () { processTime(15 + rand(10)); });
        flags.TN_BXC_CHECK_DAY = today() + 1;
        back();
    }

    var CHATS = [
        function () {
            say([
                "You ask how the clinic is going so far.",
                q("Slowly,") + " Bianca says, and she sounds delighted about it. " + q("I see maybe ten people on a busy day. A child with a fever. Someone who fell off a ladder. An old gryvain who comes in every time just to have his blood pressure checked, because he likes to talk.") + " She smiles. " + q("In the Corps, I had ten people in the first hour. Out in the wilds, the rushers line up from sunrise. Here, I can take twenty minutes with someone and actually listen to them."),
                q("I didn’t know how much I missed that,") + " she adds quietly. " + q("Listening.")
            ]);
        },
        function () {
            say([
                "You ask why only every third day.",
                "Bianca holds up three fingers. " + q("One day here. One day out in the wilds, because those rushers need someone and I won’t abandon them. And one day for <i>me.</i>") + " She folds the last finger down with a determined little nod. " + q("Sleeping in. Eating breakfast. Reading something that isn’t a medical journal. Seeing you."),
                q("It was your idea, you know,") + " she says. " + q("Not in so many words. But you’re the one who made me notice I was running myself into the ground. So now I have a rule, and I’m keeping it. And Charles is here every day, so nobody gets turned away when I’m not.")
            ]);
        },
        function () {
            say([
                "You ask about the plant in the waiting room.",
                "Bianca’s ears go flat. " + q("Her name is Doctor Fern,") + " she says, very seriously, " + q("and she is a Mhen’gan creeping vine that the florist down the thoroughfare promised me was impossible to kill.") + " She glances toward the waiting room. " + q("One of her leaves is drooping. I think he lied."),
                "You suggest maybe she’s overwatering it.",
                q("I’m a doctor,") + " Bianca says, " + q("I know how to keep things alive.") + " There is a long pause. " + q("...Nest says I’m overwatering it. How much water is too much water?")
            ]);
        },
        function () {
            say([
                "You ask if she misses working on the frontier full-time.",
                "She thinks about it for a long moment, stirring her tea. " + q("Sometimes. There’s something about being the only help for a hundred kilometers. It makes you feel needed.") + " She sets the spoon down. " + q("But I think I needed to be needed a little too much. I was using it to fill something. Here...") + " She looks around her little exam room, at the color-sorted cabinet and the framed holo. " + q("Here I’m just a doctor with a clinic. It’s enough. It’s actually enough."),
                "She smiles at you. It reaches her eyes."
            ]);
        },
        function () {
            say([
                "You ask how she ended up sharing a clinic with Dr. Rewell.",
                q("I put up a listing looking for an office share. Something small, somewhere busy, someone who wouldn’t mind me only being in every third day.") + " Bianca laughs softly. " + q("He answered within the hour. He said he’d just retired from Steele Tech, he was bored out of his mind, and he’d like to be useful to someone who actually needed him. Then he saw your name in my references and nearly dropped his glasses."),
                q("He’s a sweet old man. Brilliant, too. He knows more about genetics than everyone I trained with put together, and he still asks me to check his blood pressure because he says I have kind hands.") + " Her tails swish. " + q("He talks about you like you’re his grandchild. I think, in a way, you are.")
            ]);
        },
        function () {
            say([
                "You ask about Nest.",
                q("Nest is a gift,") + " Bianca says immediately. " + q("They answered Charles’ ad for a receptionist and rebuilt my whole schedule on the first day. They remember every patient’s name, every allergy, every child’s birthday. They know when I’ve skipped lunch before I do.") + " She shakes her head. " + q("I keep trying to give them a raise and they keep telling me to fix my sleep first."),
                q("They’re very private,") + " she adds, more gently. " + q("I don’t pry. If they want to tell you about themselves, they will. But they’re good people. The best kind.")
            ]);
        },
        function () {
            say([
                "You ask what she’d need to make the clinic bigger someday.",
                q("Let’s see. A second doctor.") + " Bianca ticks it off on her fingers. " + q("Done. A receptionist. Done. A proper surgical suite, so I don’t have to send people to the station hospital for every little procedure. A nurse, maybe two.") + " She stops and laughs at herself. " + q("Listen to me. I promised myself small. And small is what I’m doing, for now."),
                q("But someday,") + " she says, a little wistfully, " + q("when you’ve claimed your inheritance and the galaxy is a little calmer... I wouldn’t mind something bigger. With you around to keep me honest about the hours.")
            ]);
        }
    ];
    function chat() {
        start("CLOTHED");
        var i = num("TN_BXC_CHAT");
        if (i < CHATS.length) { CHATS[i](); flags.TN_BXC_CHAT = i + 1; }
        else {
            say([rnd([
                "You chat with Bianca about nothing in particular while she restocks the bandage drawer. She tells you about a laquine who came in with a carrot stuck somewhere she won’t specify, and you laugh until Nest knocks on the wall to shush you.",
                "Bianca makes you a cup of tea from her beloved kettle and the two of you talk about your travels. She listens to every word, asks a dozen questions, and makes you promise to wear a helmet more often.",
                "You spend a while talking with Bianca in the little break room. At some point her head ends up on your shoulder, and neither of you mentions it.",
                "Bianca catches you up on all her patients, careful never to use a single name. The gryvain with the blood pressure is doing better. The dockworker is wearing his harness now. Doctor Fern has a new leaf. She is very proud of all of them."
            ])]);
        }
        safe(function () { processTime(15 + rand(16)); });
        safe(function () { bianca.familiarity(1); });
        back();
    }
    function lunch() {
        start("CASUAL");
        say([
            "You tell Bianca it’s lunchtime. She opens her mouth, probably to say she has charts to finish, then catches your look and closes it again. With a sigh she tells Nest she’ll be back in an hour and hangs up her coat. Nest gives you a silent thumbs-up behind her back.",
            rnd([
                "You take her to a little noodle place a few doors down the thoroughfare. Bianca orders a bowl nearly as big as her head and then eats the whole thing with an intensity that would frighten a lesser companion. " + q("I forgot breakfast,") + " she admits between bites. You decide not to tell her you could tell.",
                "The two of you sit on a bench along the Merchant Deck with sandwiches from a deli stall, watching the crowds of rushers go by. Bianca leans back and closes her eyes, her tails curled contentedly around her legs. For a little while, she doesn’t look like a doctor at all. Just a woman enjoying her lunch.",
                "Bianca insists on cooking, so the two of you end up crammed into the clinic’s tiny break room, where she makes an enormous omelet on a hot plate and splits it down the middle. It’s actually very good. She looks so pleased when you say so that you have a second helping you don’t really have room for."
            ]),
            isLover() ? "On the way back she holds your hand the whole time, and when you reach the clinic door she kisses you before she goes in. " + q("Thank you for making me stop,") + " she murmurs." : q("Thank you, [pc.name],") + " she says as you head back in. " + q("I would have worked right through it. I always do.")
        ]);
        safe(function () { processTime(60); });
        safe(function () { pc.energy(30); });
        safe(function () { bianca.familiarity(1); });
        flags.TN_BXC_LUNCH_DAY = today() + 1;
        if (hrs() >= BIANCA_CLOSE) { addButton(0, "Next", function () { start("CLOTHED"); say(["By the time you’re back it’s two o’clock. Bianca looks at the clock, then at you, and hangs her coat back on its hook with only a tiny, wistful sigh.", q("Rules are rules,") + " she says. " + q("See you soon, [pc.name].")]); clearMenu(); addButton(0, "Next", mainGameMenu); }); return; }
        back();
    }
    function helpOut() {
        start("CLOTHED");
        var pay = 20 + rand(21);
        say([
            "You offer to lend a hand. Bianca hesitates, clearly torn between her pride and her paperwork, and then hands you a box of supplies with a grateful smile. " + q("Everything in here goes in the cabinet by color. The cabinet. By <i>color,</i> [pc.name]."),
            rnd([
                "For the next hour you restock shelves, wipe down the exam table between patients and keep a pair of bored kaithrit twins entertained in the waiting room while their father gets his stitches. By the end, one of them is braiding your " + safe(function () { return pc.hasHair() ? "hair" : "sleeve"; }, "sleeve") + " and the other has fallen asleep against your " + body({ biped: "leg", taur: "foreleg", naga: "coils" }) + ".",
                "You spend the hour helping Nest out front, finding chairs and fetching cups of water. A very old rodenian gentleman decides you are Bianca’s receptionist and tells you his entire medical history, twice. Nest doesn’t correct him. They just smile into their terminal.",
                "The clinic gets a rush of three patients at once, which is apparently a crisis. You hold a squirming puppy-ausar boy still for his vaccine shot, fetch gauze for a sliced palm, and help a heavily pregnant woman down the hall to Dr. Rewell’s office. Bianca moves between all of them like a calm, golden whirlwind."
            ]),
            "When the hour is up, Bianca presses " + pay + " credits into your hand and refuses to take them back. " + q("You did real work, you get real pay,") + " she says firmly. " + q("Besides, if I don’t pay you, I’ll feel like I’m taking advantage. And I’m not doing that anymore. Not to anyone. Including me.")
        ]);
        safe(function () { pc.credits += pay; });
        safe(function () { processTime(60); });
        safe(function () { bianca.familiarity(1); });
        flags.TN_BXC_HELP_DAY = today() + 1;
        if (hrs() >= BIANCA_CLOSE) { clearMenu(); addButton(0, "Next", mainGameMenu); return; }
        back();
    }
    function leave() {
        start("CLOTHED");
        say([isLover()
            ? "You tell Bianca you need to get going. She walks you to her door and kisses you goodbye, then lingers in the doorway watching you go, one hand resting on the frame. " + q("Be careful out there, love.")
            : "You tell Bianca you need to get going. She walks you to her door, her tails swaying behind her. " + q("Be careful out there, [pc.name]. And if you get hurt, you know where to find me.")]);
        safe(function () { processTime(1); });
        clearMenu();
        addButton(0, "Next", mainGameMenu);
    }

    /* ---------- Dr. Charles Rewell ---------- */
    function rewellEnter() {
        startNpc("Dr. Rewell");
        safe(function () { processTime(1); });
        if (!num("TN_BXC_RW_MET")) {
            say([
                "You knock on the door with the crooked double helix. The humming stops. " + q("It’s open!") + " a warm, papery voice calls.",
                "The office beyond is small and cluttered in a comfortable way: shelves of real paper books, a gene sequencer humming on a side table, a window-sized holo of a slowly rotating chromosome. At the desk sits a tall, thin, very old human in a long white coat, his silver hair swept back, a pair of holo-glasses tucked into his coat pocket.",
                "He looks up, and goes completely still.",
                q("Well,") + " he says softly. " + q("Well, well. Look at you.") + " He takes off the glasses he isn’t wearing, realizes they’re still in his pocket, and laughs at himself. " + q("Forgive an old man. I’m Charles Rewell. Doctor, technically, though I’ve been retired for all of three months, so I’m still deciding what I want to be called.") + " He comes around the desk and takes your hand in both of his. " + q("You won’t remember me. The last time I saw you, you were about a day old, and you screamed the whole time."),
                q("I was your father’s doctor, [pc.name]. For eighty years. When he decided he wanted an heir, he came to me, and he sat in a chair just like that one, grinning like an idiot, and we built you together.") + " His eyes are bright. " + q("Every choice. Your sex, your height, the color of your eyes. Victor fussed over every one of them. And now here you are, walking around the galaxy, chasing his probes.") + " He squeezes your hand. " + q("He’d be so proud. I’m sure of it."),
                "He lets go at last and waves you into the chair across from his desk. " + q("Sit, sit. I’ve been waiting to meet you properly since the day Bianca put up her listing. Nest says I’ve been insufferable about it. They’re right, as usual.")
            ]);
            flags.TN_BXC_RW_MET = 1;
            safe(function () { processTime(10); });
        } else if (num("TN_BXC_APPT_R") === today() + 1 && rand(2) === 0) {
            output(q("Nest told me you were on your way.") + " Dr. Rewell is already pouring a second cup of tea when you come in. " + q("Sit down, [pc.name]. What can an old man do for you?"));
        } else {
            output(rnd([
                "Dr. Rewell is hunched over his gene sequencer, humming. He brightens when he sees you. " + q("[pc.name]! Come in, come in. What can I do for you?"),
                "Dr. Rewell is reading an actual paper book with his feet up on the desk. He doesn’t even pretend to be embarrassed. " + q("Retirement,") + " he says happily. " + q("Sit down. What brings you in?"),
                "Dr. Rewell is finishing up with a nervous young couple who are clutching a printout of their baby’s genome like a winning lottery ticket. He sees them out with a pat on the shoulder, then turns to you. " + q("Ah, my favorite former project. What can I do for you?")
            ]));
        }
        rewellMenu();
    }
    function rewellMenu() {
        clearMenu();
        addButton(0, "Talk", rewellTalkMenu, "Talk", "Talk with Dr. Rewell.");
        addButton(1, "Your Kids", rewellKids, "Your Kids", "Ask Dr. Rewell how he can help with your children.");
        if (!pregnant()) addDisabledButton(2, "Prenatal", "Prenatal Scan", "You aren’t pregnant right now.");
        else if (num("TN_BXC_RW_SCAN_DAY") === today() + 1) addDisabledButton(2, "Prenatal", "Prenatal Scan", "Dr. Rewell already scanned you today.");
        else addButton(2, "Prenatal", rewellScan, "Prenatal Scan", "Have Dr. Rewell look over your pregnancy. He won’t take a credit for it.");
        addButton(14, "Leave", rewellLeave);
    }
    function rewellBack() { addButton(0, "Next", function () { startNpc("Dr. Rewell"); output("Dr. Rewell refills his tea. " + q("Now, what else?")); rewellMenu(); }); }

    var RW_TOPICS = [
        { l: "Victor", tip: "Ask about your father.", f: function () {
            say([
                "You ask what your father was like, back then.",
                "Dr. Rewell leans back in his chair and laughs. " + q("Impossible. Wonderful. Impossible. I met him when he was a young prospector with more ambition than sense, and I was a young med tech with more sense than money. He broke his arm in three places on some airless rock and I set it with a strut off his own ship."),
                q("He never forgot it. When he struck it rich, he hired me before he hired a lawyer. For eighty years, every time he was sick, every time he was hurt, every time he wanted to try some ridiculous new gene mod, he came to me.") + " He smiles at something far away. " + q("He called me <i>Charlie,</i> just to annoy me. No one else ever got away with that."),
                q("He was a hard man to know, sometimes. But he loved you before you existed, [pc.name]. I watched him do it.")
            ]);
        } },
        { l: "Your Birth", tip: "Ask about the day you were designed.", f: function () {
            say([
                "You ask him about the day your father designed you.",
                q("Ah.") + " His eyes crinkle. " + q("He came in with a bottle of something very old and very expensive and refused to open it until we were done. I asked him what sex he wanted his child to be, and he already had a name picked out. Of course he did."),
                q("He insisted on doing your height in inches. I told him it wasn’t the twentieth century. He said he knew, he just liked to watch me twitch.") + " Dr. Rewell chuckles. " + q("Then the special treatments, at the end. I told him to pick only one, and he agonized over that list for an hour. Kept asking me, <i>‘Is it safe? Charlie, is it safe?’</i> As if I would ever have let him put anything unsafe in you."),
                q("When we finished, he finally opened that bottle. He poured two glasses and didn’t drink either of them. He just sat there, looking at the scan of you, smiling.") + " The old doctor clears his throat and looks away. " + q("Well. You asked.")
            ]);
        } },
        { l: "Why Here", tip: "Ask why a famous geneticist is working in a little clinic.", f: function () {
            say([
                "You ask why someone like him is working in a little clinic on the Merchant Deck.",
                q("Because nobody is making me,") + " he says simply. " + q("I spent a hundred and some years at Steele Tech. The work was fascinating, and the pay was obscene, and every single day there was someone above me deciding what was worth doing. When Victor died, it stopped feeling like home. So I retired."),
                q("Did you know my name means <i>a free, happy man?</i> My mother told me that when I was little. It took me over a century to live up to it.") + " He spreads his hands at the cluttered office, the crooked helix on the door. " + q("Now I see whoever walks in. Expecting parents, mostly. Families with a gene problem nobody else would bother with. I help them, and then I go home, and nobody owns my time but me."),
                q("And then a lovely young doctor put up a listing, and she needed someone who could cover the days she shouldn’t be working.") + " He winks. " + q("Seemed like fate.")
            ]);
        } },
        { l: "Bianca", tip: "Ask what he thinks of Bianca.", f: function () {
            say([
                "You ask what he thinks of Bianca.",
                q("She’s a better doctor than I ever was,") + " he says without hesitation. " + q("I know the code of life down to the base pair. She knows <i>people.</i> She can tell what’s wrong with someone before they’ve finished sitting down.") + " He taps the desk. " + q("And she would work herself into the grave if nobody stopped her."),
                q("So I stop her. Nest and I both do. If she tries to stay past two, Nest locks her terminal, and I come down the hall and tell her my back hurts and I need her to walk me to the lift.") + " He grins. " + q("My back is fine. She knows it’s fine. She walks me to the lift anyway."),
                isLover() ? q("She talks about you constantly, you know. Constantly. It’s very sweet. Please don’t break her heart, I’m too old to fight you.") : q("She talks about you a great deal, you know. Whatever you said to her, out there, it mattered.")
            ]);
        } },
        { l: "Nest", tip: "Ask about the receptionist.", f: function () {
            say([
                "You ask him about Nest.",
                q("Best hire I ever made, and I hired half of Steele Tech’s medical division at one time or another.") + " Dr. Rewell smiles. " + q("Nest answered my ad on the first day. They walked in, looked at my filing system, and very politely asked if anyone had died because of it yet."),
                q("They keep the whole place running. Both our schedules, the supply orders, the patients who are scared or angry or lonely and need someone to sit with them for a minute. They’re kind in a way that doesn’t make a fuss about itself."),
                q("I won’t tell you their business,") + " he adds. " + q("That’s theirs to share. But if you want to get to know them, try asking. They’re easier to talk to than they think they are.")
            ]);
        } }
    ];
    function rewellTalkMenu() {
        startNpc("Dr. Rewell");
        output("Dr. Rewell sets down his tea and folds his hands. " + q("What would you like to talk about?"));
        clearMenu();
        var seen = num("TN_BXC_RW_TALKS");
        for (var i = 0; i < RW_TOPICS.length; i++) {
            (function (i) {
                var t = RW_TOPICS[i];
                addButton(i, t.l, function () {
                    startNpc("Dr. Rewell");
                    t.f();
                    flags.TN_BXC_RW_TALKS = num("TN_BXC_RW_TALKS") | (1 << i);
                    safe(function () { processTime(10 + rand(10)); });
                    clearMenu();
                    addButton(0, "Next", rewellTalkMenu);
                }, t.l, t.tip + ((seen & (1 << i)) ? " (You’ve heard this one.)" : ""));
            })(i);
        }
        addButton(14, "Back", function () { startNpc("Dr. Rewell"); output("Dr. Rewell smiles. " + q("Anything else?")); rewellMenu(); });
    }
    function rewellKids() {
        startNpc("Dr. Rewell");
        if (!num("TN_BXC_RW_KIDS")) {
            say([
                "You ask him how he can help with your own children.",
                "Dr. Rewell’s face lights up like you’ve handed him a present. " + q("I was hoping you’d ask. I didn’t want to presume.") + " He pulls a datapad from a drawer, then a second one, then a third, and lines them up on the desk. " + q("The same thing I did for your father, [pc.name]. Whatever you want from me, for as many children as you have."),
                q("At the simplest, I can look after them before they’re born. Every pregnancy you bring through that door, I’ll scan, free of charge. I’ll tell you if they’re healthy, and if they’re not, I’ll tell you what we can do about it. There is almost always something we can do about it."),
                q("Past that... I can read a child’s genome the way Bianca reads a patient. I can tell you what they’ll likely look like, what they might struggle with, what they might be good at. If you want a say in any of it, the way Victor did, we can sit down together and talk it through. And if you don’t, if you’d rather let them be whoever they’ll be, I’ll respect that too. Plenty of good people are made by accident."),
                q("And the hard cases,") + " he says, more quietly. " + q("Fertility that’s been damaged, or bred out. Gene lines that have gone sterile. That’s been my little obsession for the last few decades. I won’t promise miracles. But if you ever meet someone who thinks they can’t have children, send them to me. Sometimes that’s fixable. More often than people think."),
                "He taps the datapads into a neat stack. " + q("Your father trusted me with you. I’d be honored if you trusted me with yours.")
            ]);
            flags.TN_BXC_RW_KIDS = 1;
            safe(function () { processTime(15); });
        } else {
            say([
                "You ask him about your children again.",
                q("Same offer as always,") + " Dr. Rewell says warmly. " + q("Bring me any pregnancy and I’ll scan it, no charge. If you want to plan around a child’s genes, we’ll sit down and do it properly. And if you know anyone who’s been told they can’t have children...") + " He taps the side of his nose. " + q("Send them my way."),
                pregnant() ? q("Speaking of which, you’re expecting right now, aren’t you? Let me take a look before you go.") : ""
            ]);
            safe(function () { processTime(5); });
        }
        rewellBack();
    }
    function rewellScan() {
        startNpc("Dr. Rewell");
        var count = safe(function () { return pc.totalPregnancies(); }, 1) || 1;
        say([
            "Dr. Rewell pulls the scanner arm down from the ceiling and has you " + body({ biped: "lie back on the padded recliner in the corner", taur: "stand still beside the recliner while he angles the scanner along your lower body", naga: "settle your coils beside the recliner while he angles the scanner along your belly" }) + ". The device hums and glows a soft blue as it passes over your belly. A holo blooms to life above the desk: a slowly turning map of everything going on inside you.",
            q("Let’s see what we have.") + " He puts his holo-glasses on at last and peers at the display, humming. " + (count > 1 ? q("More than one womb occupied, I see. Busy, busy. ") : "") + q("Good. Good. Development is right where it should be. No markers for anything worrying. Strong little heartbeat" + (count > 1 ? "s" : "") + "."),
            q("You’re doing fine, [pc.name]. So are they.") + " He takes the glasses off and smiles at you over them. " + q("Your father used to come in every week when your mother was carrying you, you know. Every week. I told him it wasn’t necessary. He came anyway. Just to see."),
            "When you reach for your credit chit, he waves it away. " + q("Victor paid me enough for three lifetimes. This one’s on him.")
        ]);
        safe(function () { processTime(20); });
        flags.TN_BXC_RW_SCAN_DAY = today() + 1;
        rewellBack();
    }
    function rewellLeave() {
        startNpc("Dr. Rewell");
        output("You tell Dr. Rewell you need to get going. He stands, a little stiffly, and walks you to his door. " + q("Come back any time. And [pc.name]?") + " He rests a hand on your shoulder for just a moment. " + q("Look after yourself. I put a lot of work into you."));
        safe(function () { processTime(1); });
        clearMenu();
        addButton(0, "Next", mainGameMenu);
    }

    window.tnBiancaClinic = { isOpen: isOpen, opened: opened, clinicDay: clinicDay, clinicOpen: clinicOpen, enter: enterClinic, menu: clinicMenu, chats: CHATS.length, rewell: rewellEnter, nest: nestMenuIntro };
})();
