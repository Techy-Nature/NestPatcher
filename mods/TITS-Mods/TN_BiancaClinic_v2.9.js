/*
 * TN_BiancaClinic_v2.9.js - "Bianca's Clinic" (NestPatcher runtime mod, TiTS 0.9.168), Modv2.9
 * Author: Neston
 *
 * Needs Bianca Extras (TN_BiancaExtras_v2.9.mod + .js) and TN_BiancaClinic_v2.9.mod (hooks).
 * After your talk with Bianca on Tavros (the start of her love track), she rents a small office
 * next to her apartment, off the South-East Plaza on the Residential Deck, and opens a part-time
 * practice there. It gives her steady work close to home without running herself ragged.
 *   - Three days after your Tavros talk she emails you that the clinic is open.
 *   - Open 9 AM to 2 PM, every third day. On clinic days she skips her rounds in the wilds;
 *     her booth and the bars keep their usual hours.
 *   - Checkup (once a day; heals HP and soreness; lovers are never charged), Chat (six topics
 *     about the practice, then random small talk), Lunch (noon or later, once a day, an hour
 *     together), Help Out (once a day, an hour assisting her; she pays you a little) and Leave.
 *   - No sex at the clinic: Bianca keeps her practice strictly professional (lovers get a kiss).
 * Flags (in your save): TN_BXC_TS, TN_BXC_VISITS, TN_BXC_CHECK_DAY, TN_BXC_LUNCH_DAY,
 *   TN_BXC_HELP_DAY, TN_BXC_CHAT.
 * Toggle: Options -> Android Mods -> "Bianca's Clinic".
 */
(function () {
    "use strict";
    if (window.__tnBiancaClinicLoaded) return;
    window.__tnBiancaClinicLoaded = true;

    var MOD_ID = "tn.bianca-clinic";
    var OPEN_AFTER = 4320; // 3 days after the Tavros talk

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
            description: "After your talk with Bianca on Tavros, she opens a small part-time practice off the Residential Deck's South-East Plaza: 9 AM to 2 PM every third day. Checkups, chats, lunch together, and helping out. Needs Bianca Extras.",
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

    /* ---------- Schedule ---------- */
    function noteReunion() {
        try {
            if (typeof flags === "undefined" || !flags) return;
            if (loveTrack() && flags.TN_BXC_TS === undefined) flags.TN_BXC_TS = now();
        } catch (err) {}
    }
    setInterval(noteReunion, 3000);
    function opened() { noteReunion(); return loveTrack() && flags.TN_BXC_TS !== undefined && now() - num("TN_BXC_TS") >= OPEN_AFTER; }
    function clinicDay() { return opened() && today() % 3 === 0; }
    function isOpen() { return clinicDay() && hours >= 9 && hours < 14; }
    function nextOpenText() {
        var d = today();
        if (clinicDay() && hours < 9) return "today at 9 AM";
        var add = 3 - (d % 3);
        if (add === 0) add = 3;
        return add === 1 ? "tomorrow at 9 AM" : "in " + add + " days, at 9 AM";
    }
    // Called by the patched biancaInTheWilderness: no wild rounds on clinic days.
    window.tnBiancaClinicDay = function () { return on() && extrasOn() && safe(clinicDay, false) && !safe(function () { return pc.hasStatusEffect("Bianca Gone"); }, false); };

    /* ---------- Email ---------- */
    var MAIL_ID = "tn_bianca_clinic_open";
    var mailEntry = {
        content: function () {
            var t = "Hello again, [pc.name]!\n\nI promised you I would go back to work without running myself into the ground, and I've found a way to do exactly that. I've rented the little office next to my apartment, just off the South-East Plaza on the Residential Deck, and as of today it's a clinic. A very small one. One doctor, one exam table, and a waiting room with three chairs and a plant I'm determined not to kill.\n\nI'll be open from nine in the morning until two in the afternoon, every third day. Yes, only every third day. I've decided that a doctor who sleeps is a better doctor, and I'd like to test that theory for a while. On clinic days I won't be out in the wilds, but my booth and my evenings are the same as always.\n\nCome by if you need anything. Come by if you don't, too.\n\n-Bianca\n\nP.S. Please don't tell anyone how nervous I was hanging up the sign.";
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

    /* ---------- The plaza (called from the patched South-East Plaza room) ---------- */
    window.tnBiancaClinicBonus = function () {
        if (!on() || !extrasOn() || !safe(opened, false)) return;
        try {
            if (isOpen()) {
                output("\n\n" + rnd([
                    "Between two apartment doors, a small sign reads <b>Ketria Clinic - General Medicine</b>. The door is propped open, and you can see a couple of patients waiting inside on mismatched chairs.",
                    "The little clinic beside Bianca’s apartment is open. Through the window you spot her golden tails swishing behind the reception desk as she chats with a patient.",
                    "A hand-painted sign beside the door of <b>Ketria Clinic</b> says <i>Open today, 9 to 2. Please don’t bleed on the plant.</i>"
                ]));
                var e = Math.max(0, lastButtonIndex() + 1);
                if (e > 4) e = 4;
                addButton(e, "Clinic", enterClinic, "Ketria Clinic", "Drop in on Bianca at her practice.");
            } else {
                output("\n\nBetween two apartment doors is the small, dark window of <b>Ketria Clinic</b>. The sign on the door says it opens again " + nextOpenText() + ".");
            }
        } catch (err) { if (window.console) console.error("[Bianca's Clinic] plaza", err); }
    };

    /* ---------- Clinic ---------- */
    function enterClinic() {
        start("CLOTHED");
        safe(function () { processTime(2); });
        if (!num("TN_BXC_VISITS")) {
            say([
                "You step inside, and the first thing that hits you is the smell: antiseptic, fresh paint, and, faintly, the perfume you’d know anywhere. The waiting room is exactly as small as promised. Three chairs, a rack of pamphlets about everything from Sydian rust allergies to safe mod dosages, and a leafy potted plant that looks like it’s being watered with great care and a slight amount of anxiety.",
                "Bianca pokes her head out of the back room at the sound of the door. When she sees it’s you, her ears shoot straight up and her tails start swishing so hard they knock a pamphlet off the rack.",
                q("[pc.name]! You came!") + " She hurries over, then catches herself and smooths down the front of her coat. It’s a fresh one, crisp and white, with <i>Dr. B. Ketria</i> stitched over the pocket. " + q("Welcome to my clinic. Such as it is. Would you like the tour? It will take about nine seconds."),
                "It takes closer to fifteen, because she stops to show you everything. The exam room, with its single table and a cabinet she organized by color. The tiny office with a desk, a terminal and a framed holo of the two of you from the park. The kettle. She is <i>very</i> proud of the kettle.",
                q("It isn’t much,") + " she admits when you’re back in the waiting room, " + q("but it’s mine. I see who comes in, I close at two, and then I go home and eat a proper lunch. Every third day. That’s the rule.") + " She taps the sign on the inside of the door, where the hours are written in her neat, slanted handwriting. " + q("If I start breaking it, you have my permission to drag me out by the tails."),
                "You promise to hold her to that. She beams at you."
            ]);
        } else if (isLover() && rand(2) === 0) {
            say([
                rnd([
                    "Bianca is writing up a chart when you come in. She glances up, and her whole face changes. She checks the waiting room is empty, then leans over the desk and kisses you, quick and warm. " + q("Don’t tell my patients,") + " she whispers. " + q("I have a reputation for professionalism."),
                    "The bell over the door jingles and Bianca looks up from the kettle. " + q("Oh, it’s my favorite patient.") + " She crosses the room and kisses your cheek, then straightens your collar like she can’t help herself. " + q("What can I do for you, love?")
                ])
            ]);
        } else {
            say([rnd([
                "The waiting room is empty for once, and Bianca is sitting behind the little reception desk with a cup of tea and a datapad. " + q("[pc.name]! Good timing. My last patient just left with a very sprained ankle and a very good attitude.") + " She sets the tea down. " + q("What brings you in?"),
                "A kaithrit mother is on her way out with a sniffling kitten bundled in her arms, thanking Bianca over and over. Bianca waves them off with a gentle smile, then turns to you, tails wagging. " + q("Hello, you. Here as a patient, or here to keep me company?"),
                "Bianca is on her knees in the waiting room, talking to the potted plant. She jumps when the door opens. " + q("I was... checking its soil moisture,") + " she says with enormous dignity. " + q("Hello, [pc.name]. What can I do for you?"),
                "A burly dockworker is sitting on the exam table in the back, getting a bandage wrapped around his forearm while Bianca lectures him about safety harnesses. She catches your eye through the door and holds up one finger. A few minutes later he shuffles out, chastened, and she comes to greet you. " + q("Sorry about that. What can I do for you?")
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
        else if (hours < 12) addDisabledButton(2, "Lunch", "Lunch", "It’s a little early for lunch. Bianca takes her break at noon.");
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
            "Bianca leads you into the exam room and pats the table. " + body({
                biped: "You hop up onto it, the paper crinkling under you.",
                taur: "You eye the table, then her. She laughs and pulls a padded stool over instead, motioning for you to stand beside it so she can reach your human half.",
                naga: "You coil up beside it instead, which puts you at a very convenient height. Bianca nods approvingly."
            }),
            hurt ? "She works quickly and carefully, cleaning your cuts and scrapes with something that stings for half a second and then goes cool, wrapping what needs wrapping, and checking each bruise with a light press of her fingers. " + q("You,") + " she says, " + q("are a menace to your own skin.") : "",
            sore ? "Next she works a warm, sharp-smelling gel into your aching muscles, kneading the knots out with her thumbs until you’re practically melting off the " + body({ biped: "table", taur: "floor", naga: "floor" }) + ". " + q("Stretch before you go running into fights. I know you won’t. But I said it.") : "",
            q("There,") + " she says at last, peeling off her gloves. " + q("Good as new. Or as close to new as you let yourself get."),
            cost > 0 ? "She rings you up at the little terminal on her desk, " + cost + " credits, the same as her booth. " + q("I would give you a discount,") + " she says apologetically, " + q("but the rent on this place is criminal.") : (isLover() ? "When you reach for your credit chit, she gives you a look so withering you put it right back. " + q("Absolutely not. I am not billing my own partner.") : ""),
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
                q("It was your idea, you know,") + " she says. " + q("Not in so many words. But you’re the one who made me notice I was running myself into the ground. So now I have a rule, and I’m keeping it.")
            ]);
        },
        function () {
            say([
                "You ask about the plant.",
                "Bianca’s ears go flat. " + q("Her name is Doctor Fern,") + " she says, very seriously, " + q("and she is a Mhen’gan creeping vine that the florist on the Merchant Deck promised me was impossible to kill.") + " She glances at it. One of its leaves droops. She glares at the leaf. " + q("I think he lied."),
                "You suggest maybe she’s overwatering it.",
                q("I’m a doctor,") + " Bianca says, " + q("I know how to keep things alive.") + " There is a long pause. " + q("...How much water is too much water?")
            ]);
        },
        function () {
            say([
                "You ask if she misses working on the frontier full-time.",
                "She thinks about it for a long moment, stirring her tea. " + q("Sometimes. There’s something about being the only help for a hundred kilometers. It makes you feel needed.") + " She sets the spoon down. " + q("But I think I needed to be needed a little too much. I was using it to fill something. Here...") + " She looks around the little waiting room, at the chairs and the pamphlets and Doctor Fern. " + q("Here I’m just a doctor with a clinic. It’s enough. It’s actually enough."),
                "She smiles at you. It reaches her eyes."
            ]);
        },
        function () {
            say([
                "You ask what her neighbors think of having a doctor next door.",
                q("Oh, they love it,") + " Bianca says. " + q("Too much. Mrs. Okonkwo from across the plaza knocks on my door at all hours with her grandchildren’s scraped knees, and the ausar couple upstairs keep bringing me casseroles.") + " She sighs, but her tails are wagging. " + q("I’ve eaten more home cooking in the last few weeks than in the last three years. I think the whole deck has decided I’m too thin."),
                q("They might be right,") + " she admits, after a moment. " + q("Don’t tell them I said that.")
            ]);
        },
        function () {
            say([
                "You ask what she’d need to make the clinic bigger someday.",
                q("A second exam room. A proper surgical suite, so I don’t have to send people to the station hospital for every little procedure. A nurse, maybe two.") + " Bianca ticks them off on her fingers, then stops and laughs at herself. " + q("Listen to me. I promised myself small. And small is what I’m doing, for now."),
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
                "You chat with Bianca about nothing in particular while she restocks the bandage drawer. She tells you about a laquine who came in with a carrot stuck somewhere she won’t specify, and you laugh until she has to shush you because a patient is coming in.",
                "Bianca makes you a cup of tea from her beloved kettle and the two of you talk about your travels. She listens to every word, asks a dozen questions, and makes you promise to wear a helmet more often.",
                "You spend a while talking with Bianca in the empty waiting room. At some point her head ends up on your shoulder, and neither of you mentions it.",
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
            "You tell Bianca it’s lunchtime. She opens her mouth, probably to say she has charts to finish, then catches your look and closes it again. With a sigh she flips the sign on the door to <i>Back in one hour</i> and hangs up her coat.",
            rnd([
                "You take her to a little noodle place on the Merchant Deck. Bianca orders a bowl nearly as big as her head and then eats the whole thing with an intensity that would frighten a lesser companion. " + q("I forgot breakfast,") + " she admits between bites. You decide not to tell her you could tell.",
                "The two of you sit on a bench under the plaza trees with sandwiches from the deli by the elevators. Bianca tilts her face up toward the artificial sunlight and closes her eyes, her tails curled contentedly around her legs. For a little while, she doesn’t look like a doctor at all. Just a woman enjoying her lunch.",
                "Bianca insists on cooking, so the two of you end up in her apartment next door, where she makes an enormous omelet and splits it down the middle. It’s actually very good. She looks so pleased when you say so that you have a second helping you don’t really have room for."
            ]),
            isLover() ? "On the way back she holds your hand the whole time, and when you reach the clinic door she kisses you before she flips the sign back. " + q("Thank you for making me stop,") + " she murmurs." : q("Thank you, [pc.name],") + " she says as she unlocks the clinic again. " + q("I would have worked right through it. I always do.")
        ]);
        safe(function () { processTime(60); });
        safe(function () { pc.energy(30); });
        safe(function () { bianca.familiarity(1); });
        flags.TN_BXC_LUNCH_DAY = today() + 1;
        if (hours >= 14) { addButton(0, "Next", function () { start("CLOTHED"); say(["By the time you’re back it’s two o’clock. Bianca looks at the sign, then at the clock, then at you, and flips it to <i>Closed</i> with only a tiny, wistful sigh.", q("Rules are rules,") + " she says. " + q("See you soon, [pc.name].")]); clearMenu(); addButton(0, "Next", mainGameMenu); }); return; }
        back();
    }
    function helpOut() {
        start("CLOTHED");
        var pay = 20 + rand(21);
        say([
            "You offer to lend a hand. Bianca hesitates, clearly torn between her pride and her paperwork, and then hands you a box of supplies with a grateful smile. " + q("Everything in here goes in the cabinet by color. The cabinet. By <i>color,</i> [pc.name]."),
            rnd([
                "For the next hour you restock shelves, wipe down the exam table between patients and keep a pair of bored kaithrit twins entertained in the waiting room while their father gets his stitches. By the end, one of them is braiding your " + safe(function () { return pc.hasHair() ? "hair" : "sleeve"; }, "sleeve") + " and the other has fallen asleep against your " + body({ biped: "leg", taur: "foreleg", naga: "coils" }) + ".",
                "You spend the hour on the front desk, checking people in, finding chairs, and fetching cups of water. A very old rodenian gentleman decides you are Bianca’s receptionist and tells you his entire medical history, twice. You nod in all the right places.",
                "The clinic gets a rush of three patients at once, which is apparently a crisis. You hold a squirming puppy-ausar boy still for his vaccine shot, fetch gauze for a sliced palm, and help a heavily pregnant woman into a chair. Bianca moves between all of them like a calm, golden whirlwind."
            ]),
            "When the hour is up, Bianca presses " + pay + " credits into your hand and refuses to take them back. " + q("You did real work, you get real pay,") + " she says firmly. " + q("Besides, if I don’t pay you, I’ll feel like I’m taking advantage. And I’m not doing that anymore. Not to anyone. Including me.")
        ]);
        safe(function () { pc.credits += pay; });
        safe(function () { processTime(60); });
        safe(function () { bianca.familiarity(1); });
        flags.TN_BXC_HELP_DAY = today() + 1;
        if (hours >= 14) { clearMenu(); addButton(0, "Next", mainGameMenu); return; }
        back();
    }
    function leave() {
        start("CLOTHED");
        say([isLover()
            ? "You tell Bianca you need to get going. She walks you to the door and kisses you goodbye, then lingers in the doorway watching you go, one hand resting on the frame. " + q("Be careful out there, love.")
            : "You tell Bianca you need to get going. She walks you to the door, her tails swaying behind her. " + q("Be careful out there, [pc.name]. And if you get hurt, you know where to find me.")]);
        safe(function () { processTime(1); });
        clearMenu();
        addButton(0, "Next", mainGameMenu);
    }

    window.tnBiancaClinic = { isOpen: isOpen, opened: opened, clinicDay: clinicDay, enter: enterClinic, menu: clinicMenu, chats: CHATS.length };
})();
