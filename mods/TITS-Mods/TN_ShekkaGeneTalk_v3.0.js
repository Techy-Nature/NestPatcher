/*
 * TN_ShekkaGeneTalk_v3.0.js - "Shekka's Gene Talk" (NestPatcher runtime mod, TiTS 0.9.168), Modv3.0
 * Author: Neston
 *
 * Needs TN_ShekkaGeneTalk_v3.0.mod (adds the buttons to Shekka's crew Talk menu and to
 * Dr. McAllister's menu on Myrellion).
 * The Dr. Rewell route needs Bianca's Clinic (TN_BiancaClinic_v2.9.mod + .js) and Bianca Extras.
 * The Dr. McAllister route only needs the base game (you've met him in the Xenogen lab on Myrellion).
 *
 * Crew Shekka gets a new Talk topic, "Gene Plans", once Steele knows a geneticist who could help:
 *   - Dr. Charles Rewell: Bianca's clinic is open on Tavros and he has told you about his work on
 *     sterile gene lines (the "Your Kids" talk in his office).
 *   - Dr. Byron McAllister: you've met him in the Xenogen Biotech lab in Gildenmere, on Myrellion.
 *   - You tell her about the doctor (or both). She pulls up the plans for the new generation of
 *     raskvel, the Cure you helped fund, and asks whether he would change her the same way: fertile,
 *     but with the kids' calmer egg drive and their longer lives, so having eggs is a choice.
 *   - "Ask Him" (or "Rewell" / "McAllister" when you know both) unlocks a "Shekka" button in that
 *     doctor's office. Either doctor will see her until one of them has done the consult; after that
 *     she stays with that doctor.
 *     Rewell: he'll fix her body and give her the kids' body chemistry, but won't rewrite her mind.
 *     He needs three weeks to plan. Treatment: The Mend + The Quiet the same visit, The Years a week+ later.
 *     McAllister: ethical science takes time, but her Cure's trial data does his tests for him. He
 *     won't touch her mind either (Xenogen changes bodies, never wants). Three weeks for Xenogen's
 *     ethics board, which covers the cost as a case study. Treatment: Phase One + Phase Two the same
 *     visit, Phase Three a week+ later, in his lab's clean room.
 *   - After the last session Shekka is fertile, whichever doctor did it: her "Sterile" perk is removed
 *     and her fertility set to 1. Her Infertility talk becomes "Fertility". Shekka's Eggs picks up
 *     from there.
 *   - Shekka talks about each step on the ship ("Gene Plans"), and her doctor gives her a
 *     check-up afterwards.
 * Flags (in your save): TN_SKG_STAGE (1 = agreed to ask a doctor, 2 = consulted, 3/4 = sessions
 *   1/2 done, 5 = treatment done), TN_SKG_ROUTE (1 = Rewell, 2 = McAllister; older saves = Rewell),
 *   TN_SKG_TALKS, TN_SKG_CONSULT_TS, TN_SKG_SESSION_TS, TN_SKG_CHECK_DAY, TN_SKG_FERTILE.
 * Toggle: Options -> Android Mods -> "Shekka's Gene Talk".
 */
(function () {
    "use strict";
    if (window.__tnShekkaGeneTalkLoaded) return;
    window.__tnShekkaGeneTalkLoaded = true;

    var MOD_ID = "tn.shekka-gene-talk";

    /* ---------- Mod menu switch ---------- */
    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    window.tnShekkaGeneTalkEnabled = on;
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Shekka's Gene Talk",
            author: "Neston",
            description: "Once you know a geneticist who could help (Dr. Rewell at Bianca's clinic on Tavros, or Dr. McAllister in the Xenogen lab on Myrellion), crew Shekka can talk to you about the gene plans for the new generation of raskvel, and whether he would change her the same way. Then take her through his three-part treatment until she's fertile, on her own terms. The Rewell route needs Bianca's Clinic; the McAllister route only needs the base game.",
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
    function body(o) {
        var b = safe(function () { return pc.isTaur() ? "taur" : pc.isNaga() ? "naga" : "biped"; }, "biped");
        return o.hasOwnProperty(b) ? o[b] : o.biped;
    }
    function now() { return safe(function () { return GetGameTimestamp(); }, 0); }
    function startShekka() {
        clearMenu(); clearOutput();
        safe(function () { shekka.showAll(); });
        author("Neston");
    }
    function shekkaCrew() { return safe(function () { return shekka.isCrew(); }, false); }
    function shekkaCock() { return safe(function () { return shekka.hasCock(); }, false); }
    function stage() { return num("TN_SKG_STAGE"); }
    function today() { return safe(function () { return days; }, 0); }
    function fertile() { return on() && num("TN_SKG_FERTILE") >= 1; }

    /* ---------- Which doctor ---------- */
    var REWELL = 1, MCA = 2;
    // Saves from before the McAllister route only ever saw Dr. Rewell.
    function route() { var r = num("TN_SKG_ROUTE"); return r === MCA ? MCA : REWELL; }
    function docName(r) { return r === MCA ? "Dr. McAllister" : "Dr. Rewell"; }
    function startMca() {
        clearMenu(); clearOutput();
        safe(function () { shekka.showAll(); });
        safe(function () { showBust("BYRON", shekka.bustDisplay); });
        safe(function () { showName("Doctor McAllister"); });
        author("Neston");
    }
    function boyGirl() { return safe(function () { return pc.mf("boy", "girl"); }, "friend"); }

    /* ---------- Treatment timing ---------- */
    var PLAN_WAIT = 30240;   // three weeks after the consult, Rewell's plan is ready
    var SESSION_GAP = 10080; // at least a week between treatments
    function planReady() { return stage() === 2 && now() - num("TN_SKG_CONSULT_TS") >= PLAN_WAIT; }
    function sessionReady() { return stage() >= 3 && stage() < 5 && now() - num("TN_SKG_SESSION_TS") >= SESSION_GAP; }
    function waitText(ts) {
        var left = ts - now();
        if (left <= 1440) return "less than a day";
        var d = Math.ceil(left / 1440);
        return d + " days";
    }
    var SESSIONS = [
        { l: "The Mend", tip: "the first session, mending the gene set that made her sterile." },
        { l: "The Quiet", tip: "the second session, turning her egg drive down to a whisper, like the kids’." },
        { l: "The Years", tip: "the last session, the kids’ long-life genes and a final scan." }
    ];

    // Keep Shekka fertile after the treatment, even if a save reload rebuilds her.
    function applyFertility() {
        try {
            if (!fertile() || typeof shekka === "undefined" || !shekka) return;
            if (shekka.hasPerk && shekka.hasPerk("Sterile")) shekka.removePerk("Sterile");
            if (!(shekka.fertilityRaw > 0)) shekka.fertilityRaw = 1;
        } catch (err) {}
    }
    setInterval(applyFertility, 3000);

    /* ---------- Email: Dr. Rewell's plan is ready ---------- */
    var MAIL_ID = "tn_shekka_gene_plan";
    var mailEntry = {
        content: function () {
            var t = "Dear [pc.name],\n\nI said three weeks, and for once in my life I'm on time. Shekka's plan is ready.\n\nThree treatments over two visits to my office. The first two go in together, the same afternoon; the last one a week or more later, once her body has settled. Nothing that needs a hospital bed, and nothing she can't walk out of on her own two feet. I'll walk you both through all of it before we start, and if she changes her mind at any point, even halfway through, we stop. That's not a formality.\n\nAnd before either of you asks: no, there's no bill. I've been waiting forty years for someone to bring me a sterile gene line I could actually mend. I should be paying her.\n\nBring her by whenever you're on Tavros. Office hours as always, eight to six. Nest has already cleared my afternoons, apparently without asking me.\n\nWarmly,\nCharles Rewell\n\nP.S. Please tell her I read all forty pages. And the attachments. Twice.";
            return typeof ParseText === "function" ? ParseText(t) : t;
        },
        subject: "Shekka's plan",
        from: "Dr. Charles Rewell",
        fromAddress: "c_rewell@ketriaclinic.net",
        test: function () { return on() && route() === REWELL && stage() >= 2 && now() - num("TN_SKG_CONSULT_TS") >= PLAN_WAIT; }
    };
    /* ---------- Email: Dr. McAllister, the board signed off ---------- */
    var MCA_MAIL_ID = "tn_shekka_gene_plan_mca";
    var mcaMailEntry = {
        content: function () {
            var t = "Steele!\n\nGood news, and I'll not bury it: the board's signed off. Unanimous, which I'm told hasn't happened since before I had grey in my beard. One of the old hands on the ethics panel read your little engineer's forty pages and asked, in all seriousness, whether Xenogen could hire her. I told him to get in line behind me.\n\nThe plan's three phases over two visits. The first two go in together, the same afternoon; the third a week or more later, once her body's settled. The clean room's booked and the girls have already fought over who gets to run her scans.\n\nThe company's covering everything as a clinical case study, so not a credit from either of you. And I meant what I said about the paper. Her name goes first.\n\nBring her by the lab whenever you're on Myrellion. Nevrie will wave you through. If she's awake.\n\nYours in science,\nByron McAllister\nSenior Researcher, Xenogen Biotech, Myrellion Division";
            return typeof ParseText === "function" ? ParseText(t) : t;
        },
        subject: "Shekka: signed off!",
        from: "Dr. Byron McAllister",
        fromAddress: "b.mcallister@xenogen.myr",
        test: function () { return on() && route() === MCA && stage() >= 2 && now() - num("TN_SKG_CONSULT_TS") >= PLAN_WAIT; }
    };
    function addMail(id, entry) {
        if (!window.tnMailHx[id]) {
            window.tnMailHx[id] = entry;
            if (!window.tnMailMgr.hasEntry || !window.tnMailMgr.hasEntry(id)) window.tnMailMgr.addMailEntry(id, entry);
        }
    }
    function registerMail() {
        try {
            if (!window.tnMailHx || !window.tnMailMgr) return false;
            addMail(MAIL_ID, mailEntry);
            addMail(MCA_MAIL_ID, mcaMailEntry);
            return true;
        } catch (err) { return true; }
    }
    if (!registerMail()) {
        var mailTries = 0;
        var mailTimer = setInterval(function () { if (registerMail() || ++mailTries >= 300) clearInterval(mailTimer); }, 200);
    }

    // Bianca's questline is done once her clinic has opened, and Dr. Rewell has told Steele
    // about his work on sterile gene lines ("Your Kids" in his office).
    function clinicReady() {
        if (window.tnBiancaClinicEnabled && !window.tnBiancaClinicEnabled()) return false;
        if (window.tnBiancaExtrasEnabled && !window.tnBiancaExtrasEnabled()) return false;
        return safe(function () { return !!(window.tnBiancaClinic && window.tnBiancaClinic.opened()); }, false);
    }
    function rewellKnown() { return on() && clinicReady() && num("TN_BXC_RW_MET") >= 1 && num("TN_BXC_RW_KIDS") >= 1; }
    // Dr. McAllister: met him in the Xenogen lab on Myrellion (the game sets MET_MCALLISTER).
    function mcaKnown() { return on() && num("MET_MCALLISTER") >= 1; }
    function unlocked() { return rewellKnown() || mcaKnown(); }
    // Before the consult, Shekka will see whichever doctor you know; after it she stays with hers.
    function docOpen(r) {
        if (r === REWELL ? !rewellKnown() : !mcaKnown()) return false;
        return stage() < 2 || route() === r;
    }

    /* ---------- Shekka's Talk menu button (slot 3, from the .mod hook) ---------- */
    window.tnShekkaGeneButton = function (slot, talkMenu) {
        try {
            if (!unlocked()) return;
            var both = rewellKnown() && mcaKnown();
            var tip = stage() === 0 ? (both ? "Tell Shekka about the geneticists you know: Dr. Rewell at Bianca’s clinic, and Dr. McAllister at Xenogen on Myrellion."
                    : mcaKnown() ? "Tell Shekka about Dr. McAllister, the Xenogen geneticist on Myrellion."
                    : "Tell Shekka about Dr. Rewell, the geneticist at Bianca’s clinic, and his work on sterile gene lines.")
                : stage() === 1 ? (route() === MCA ? "Talk with Shekka about seeing Dr. McAllister. She’s waiting for you to take her to his lab in Gildenmere, on Myrellion."
                    : "Talk with Shekka about seeing Dr. Rewell. She’s waiting for you to take her to his office in Bianca’s clinic, on Tavros.")
                : stage() === 2 ? "Talk with Shekka about what " + docName(route()) + " said."
                : stage() < 5 ? "Ask Shekka how the treatment is going."
                : "Ask Shekka how she feels now that the treatment is done.";
            addButton(slot, "Gene Plans", function () { geneTalk(talkMenu); }, "Gene Plans", tip);
            // Once she's fertile, her old Infertility talk (slot 2) no longer fits.
            if (fertile()) addButton(2, "Fertility", function () { fertilityTalk(talkMenu); }, "Fertility", "Talk to Shekka about being fertile again.");
            // Other mods can add to Shekka's Talk menu from slot 6 (e.g. Shekka's Eggs).
            if (typeof window.tnShekkaTalkExtra === "function") window.tnShekkaTalkExtra(6, talkMenu);
        } catch (err) {}
    };

    function geneTalk(talkMenu) {
        if (stage() === 0) firstTalk(talkMenu);
        else if (stage() === 1) waitingTalk(talkMenu);
        else if (stage() === 2) afterConsultTalk(talkMenu);
        else if (stage() < 5) betweenSessionsTalk(talkMenu);
        else afterTreatmentTalk(talkMenu);
    }
    function backTo(talkMenu) {
        clearMenu();
        addButton(0, "Next", function () { if (typeof talkMenu === "function") talkMenu(); else mainGameMenu(); });
    }

    function firstTalk(talkMenu) {
        startShekka();
        var again = num("TN_SKG_TALKS") > 0;
        var rw = rewellKnown(), mc = mcaKnown(), both = rw && mc;
        if (again) {
            say([
                "You bring up " + (both ? "the gene plans, and the doctors who might help with them," : mc && !rw ? "Dr. McAllister" : "Dr. Rewell") + " again.",
                "Shekka’s ears go still, and for once there isn’t a single jingle out of them. She’s already reaching for her battered old datapad before you’ve finished the sentence. " + q("Yeah. I’ve been thinking about it too. Kinda a lot, honestly."),
                "She swipes it open to the same gene maps as last time and sets it in your lap. " + q("Still can’t get past it. They’re <i>my</i> kids, [pc.name]. Not mine-mine. But I helped make them. And every time I look at this, I keep wondering what it’d be like to be one of them.")
            ]);
        } else {
            if (rw) {
                say([
                    "You tell Shekka about the little clinic Bianca opened on Tavros, and the old man who works there with her. Dr. Charles Rewell, the geneticist who sat down with your father and built you, base pair by base pair. And what he told you, quietly, when you asked about kids: that sterile gene lines have been his obsession for decades. That sometimes it’s fixable. More often than people think.",
                    "Shekka stops fiddling with the coupling in her hands.",
                    "Her ears, for once, go completely still. No jingle, no jangle. She stares at you long enough that you start to wonder if you broke her, and then she sets the coupling down, very carefully, like it might go off.",
                    q("More often than people think,") + " she repeats. " + q("He said that? Those words?"),
                    "You nod.",
                    both ? "And then, because it only seems fair, you tell her about the other doctor you know: Dr. Byron McAllister, the big bearded Xenogen geneticist running the lab in Gildenmere, on Myrellion. A man who builds gene therapies for a living, and still talks about ethics like he means it. Two doctors. Two very different ways to go about it." : ""
                ]);
            } else {
                say([
                    "You tell Shekka about Dr. Byron McAllister: the big, bearded, booming Xenogen geneticist who runs the research lab in Gildenmere, on Myrellion. The man who designed the gene therapy that helped talk a whole megacorp into parking a fleet over a planet on the brink of nuclear war. Somebody who rewrites bodies for a living: cosmetic mods, sure, but cures too, and treatments that help colonists fit worlds that weren’t built for them.",
                    "Shekka stops fiddling with the coupling in her hands.",
                    q("Xenogen,") + " she repeats slowly. " + q("<i>The</i> Xenogen? Their lab people wrote half the papers I read when I was building the Cure. I used to fall asleep on their journals.") + " Her ears, for once, go completely still. No jingle, no jangle. " + q("And you know a guy there. And he’d... talk to someone like me?"),
                    "You tell her he’s about as approachable as a big, friendly bear, and that you suspect he’d be fascinated."
                ]);
            }
            output("\n\n");
            say([
                "She hops off her stool without another word and digs through the bag under her bunk, tossing out wrenches, wire spools and at least one thing you decide not to look at too closely, until she comes up with a thin, beaten-up datapad. You recognize it. It’s the same one she shoved into your hands back in Novahome, half-dead from no sleep, with your name and your money and a whole species’ future riding on it.",
                "She thumbs it on and pats the deck beside her stool. " + body({
                    biped: "You sit down next to her, close enough that her hip bumps yours.",
                    taur: "You fold your legs and settle onto the deck beside her, and she leans her shoulder against your flank like it’s the most natural thing in the world.",
                    naga: "You coil down beside her, and she props herself against a loop of your tail like it’s the most natural thing in the world."
                }),
                q("These,") + " she says, " + q("are the plans for the new generation.")
            ]);
        }
        output("\n\n");
        say([
            "The screen fills with gene maps. Hundreds of them, color-coded and annotated in Shekka’s cramped, cheerful handwriting, all of it stamped with the Steele Tech funding seal you signed your name to. She swipes through them faster than you can follow, stopping at last on one big, branching chart.",
            q("This is what the kids hatched with. Every egg laid on Tarkus since the Cure went out.") + " She taps one branch, then another. " + q("The egg drive’s still in there, see? We didn’t cut it out. We just turned it way, <i>way</i> down. Enough that they can hear themselves think over it. Enough that they can say <i>no</i> and mean it. These ones are the brains. Concentration. Memory. The bits that let them sit through a whole lesson without wandering off to go hump something."),
            "She swipes again. " + q("And these are the bodies. Bodies built to last. Old-age genes, proper ones. Joints and hearts that don’t wear out at forty from popping out clutches every few weeks. They’re gonna live to see their grandkids, [pc.name]. Most of us never do."),
            "She swipes one last time, and there’s a photo: a crowded creche in Novahome, a dozen raskvel hatchlings sprawled on a rug around a holo-reader. Every single one of them is looking at the screen. Nobody is fighting, or squirming off, or trying to climb anybody.",
            q("They’re fertile, too,") + " Shekka says softly. " + q("Every one of them. But it’s not a need for them like it is for us. It’s a choice. They’ll get to pick when, and who with, and whether they even want to at all. That’s all I ever wanted for us."),
            "She’s quiet for a moment, staring at the photo.",
            q("If you’d asked me a while back about getting fixed, I’d have told you no.") + " She rubs at one of her ears, setting the rings to a nervous little jangle. " + q("And I’d have meant it, I swear. I didn’t want to turn around and make myself into another baby-factory, not after I worked so hard to get the rest of us out of being one. But that’s not what these kids are, is it? Look at them. They’re not baby-factories. They’re just... people. People who get to choose."),
            q("And me? I’m stuck with the old wiring, and no eggs to show for it. All of the itch and none of the payoff. Worst of both worlds.") + " She laughs, but there isn’t much in it. " + q("Everyone back home told me adults can’t get the Cure. Not the real one. The brain stuff’s set by the time you’re grown, and messing with it means messing with who you are. I believed them. I still kinda do."),
            shekkaCock()
                ? q("And it’s not like I can’t have kids at all. This thing you got me fires live rounds, and I love it to bits.") + " She gives her crotch a fond pat. " + q("But I want both, [pc.name]. Someday, when I’m ready, I want to lay a clutch of my own. And I want it to be because I picked it.")
                : q("And yeah, I know, I could slap a dick on and sire a whole village. But that’s not the same. Someday, when I’m ready, I want to lay a clutch of my own. And I want it to be because I picked it."),
            "Shekka turns the datapad around in her hands, then holds it out to you, screen first.",
            both
                ? q("So. Your doctors. The one who built you, and the one who saved the gold myr.") + " Her voice wobbles, just a little. " + q("You think either of them would look at this? You think they’d be willing to change me the same way? Not the brain stuff, if they can’t. Just... the rest. The eggs. The years. The part where it’s a choice.")
                : mc && !rw
                    ? q("So. Your Xenogen guy.") + " Her voice wobbles, just a little. " + q("You think he’d look at this? You think he’d be willing to change me the same way? Not the brain stuff, if he can’t. Just... the rest. The eggs. The years. The part where it’s a choice.")
                    : q("So. Your doctor. The one who built you.") + " Her voice wobbles, just a little. " + q("You think he’d look at this? You think he’d be willing to change me the same way? Not the brain stuff, if he can’t. Just... the rest. The eggs. The years. The part where it’s a choice."),
            both ? q("You think either of them would even want to?") : q("You think he’d even want to?")
        ]);
        flags.TN_SKG_TALKS = num("TN_SKG_TALKS") + 1;
        safe(function () { processTime(25); });
        clearMenu();
        if (both) {
            addButton(0, "Rewell", function () { askHim(talkMenu, REWELL); }, "Ask Dr. Rewell", "Tell Shekka you’ll take her to see Dr. Rewell at Bianca’s clinic the next time you’re on Tavros.");
            addButton(2, "McAllister", function () { askHim(talkMenu, MCA); }, "Ask Dr. McAllister", "Tell Shekka you’ll take her to see Dr. McAllister in the Xenogen lab the next time you’re on Myrellion.");
        } else if (mc) addButton(0, "Ask Him", function () { askHim(talkMenu, MCA); }, "Let’s Ask Him", "Tell Shekka you’ll take her to see Dr. McAllister in the Xenogen lab the next time you’re on Myrellion.");
        else addButton(0, "Ask Him", function () { askHim(talkMenu, REWELL); }, "Let’s Ask Him", "Tell Shekka you’ll take her to see Dr. Rewell the next time you’re on Tavros.");
        addButton(1, "Think On It", function () { thinkOnIt(talkMenu); }, "Think On It", "Tell Shekka there’s no rush, and she should be sure before she asks him for anything.");
    }

    function askHim(talkMenu, r) {
        startShekka();
        if (r === MCA) {
            say([
                "You take the datapad from her and tell her the truth: you don’t know what Dr. McAllister will say. For all his booming, he’s careful. He talks about tests and colleagues and ethics like he means every word. But he spends his days rebuilding bodies so people can live the lives they want, and if anyone’s going to look at her work and see it for what it is, it’s a man who does this for a living.",
                "And then you tell her that the next time the ship sets down on Myrellion, the two of you are going to go ask him.",
                "Shekka makes a noise that’s half laugh and half something wetter, and throws her arms around you so hard her ear-rings clang against your " + body({ biped: "shoulder", taur: "side", naga: "shoulder" }) + ". " + q("Okay. Okay! Rust-in-rain, okay.") + " She lets go just long enough to scrub at her eyes with the back of one wrist. " + q("I’m not crying. It’s engine grease. Shut up."),
                q("I’m gonna make copies of everything,") + " she says, already scrolling. " + q("The whole Cure. The clinical trial notes. My own scans from Novahome. Oh, and the first batch of test results. A Xenogen guy is gonna want <i>citations</i>...") + " She trails off into happy, muttering lists, and you leave her to it.",
                "<b>Dr. McAllister works in the Xenogen Biotech lab in Gildenmere, on Myrellion. Bring Shekka by and talk to him.</b>"
            ]);
        } else say([
            "You take the datapad from her and tell her the truth: you don’t know what Dr. Rewell will say. But you know he spent eighty years making sure your father never got anything unsafe put in him, and you know how his face lit up when he talked about helping families nobody else would bother with. If anyone in the galaxy is going to take her seriously, it’s him.",
            "And then you tell her that the next time the ship sets down on Tavros, the two of you are going to go ask him.",
            "Shekka makes a noise that’s half laugh and half something wetter, and throws her arms around you so hard her ear-rings clang against your " + body({ biped: "shoulder", taur: "side", naga: "shoulder" }) + ". " + q("Okay. Okay! Rust-in-rain, okay.") + " She lets go just long enough to scrub at her eyes with the back of one wrist. " + q("I’m not crying. It’s engine grease. Shut up."),
            q("I’m gonna make copies of everything,") + " she says, already scrolling. " + q("The whole Cure. The clinical trial notes. My own scans from Novahome. Oh, and the first batch of test results, he’s gonna want those...") + " She trails off into happy, muttering lists, and you leave her to it.",
            "<b>Dr. Rewell keeps office hours at Ketria Clinic on Tavros, from 8 AM to 6 PM. Bring Shekka by his office.</b>"
        ]);
        flags.TN_SKG_STAGE = 1;
        flags.TN_SKG_ROUTE = r === MCA ? MCA : REWELL;
        safe(function () { processTime(5); });
        backTo(talkMenu);
    }
    function thinkOnIt(talkMenu) {
        startShekka();
        say([
            "You tell her there’s no rush. Whatever " + (rewellKnown() && mcaKnown() ? "either doctor" : mcaKnown() && !rewellKnown() ? "Dr. McAllister" : "Dr. Rewell") + " might be able to do, it’s her body, and it isn’t the sort of thing anyone should walk into on a whim. She should be sure first.",
            "Shekka nods slowly and tucks the datapad against her chest. " + q("Yeah. Yeah, you’re right. That’s fair.") + " Her ears give a small, thoughtful jingle. " + q("I’ve been not-sure about this my whole life, I guess another few days won’t kill me. I’ll let you know."),
            "She gives you a crooked smile. " + q("Thanks for telling me about " + (rewellKnown() && mcaKnown() ? "them" : "him") + ", [pc.name]. Really. Even just knowing someone out there thinks it’s fixable... that’s more than I had this morning.")
        ]);
        safe(function () { processTime(3); });
        backTo(talkMenu);
    }
    function waitingTalk(talkMenu) {
        startShekka();
        if (route() === MCA) {
            say([
                "You bring up Dr. McAllister, and Shekka holds up her datapad before you’ve even finished: it’s bulging with so many attached files that the battery icon has gone red.",
                q("All packed! Every scan, every chart, every trial note from the Cure. Footnotes! I did footnotes! I even wrote him a summary. It’s only forty pages.") + " She hugs it to her chest. " + q("So, uh. Whenever you’re on Myrellion. No pressure. I’m just gonna be thinking about it every single minute until then, that’s all."),
                "<b>Dr. McAllister works in the Xenogen Biotech lab in Gildenmere, on Myrellion. Bring Shekka by and talk to him.</b>"
            ]);
            safe(function () { processTime(3); });
            backTo(talkMenu);
            return;
        }
        say([
            "You bring up Dr. Rewell, and Shekka holds up her datapad before you’ve even finished: it’s bulging with so many attached files that the battery icon has gone red.",
            q("All packed! Every scan, every chart, every trial note from the Cure. I even wrote him a summary. It’s only forty pages.") + " She hugs it to her chest. " + q("So, uh. Whenever you’re on Tavros. No pressure. I’m just gonna be thinking about it every single minute until then, that’s all."),
            "<b>Dr. Rewell keeps office hours at Ketria Clinic on Tavros, from 8 AM to 6 PM. Bring Shekka by his office.</b>"
        ]);
        safe(function () { processTime(3); });
        backTo(talkMenu);
    }
    function afterConsultTalk(talkMenu) {
        startShekka();
        if (route() === MCA) {
            say([
                "You ask Shekka how she’s feeling about what Dr. McAllister said.",
                "She’s sitting cross-legged on her bunk with the datapad, which now has a new folder on it labeled <i>XENOGEN!!!</i> in big pink letters. " + q("Honestly? Terrified. Excited. Mostly both at once.") + " Her ears jingle as she shakes her head. " + q("He actually thinks it can work. He called my Cure <i>elegant.</i> A Xenogen guy! And he wants my name on a paper. First! I don’t even know what you wear to a paper."),
                q("And the part where he won’t touch my head...") + " She taps her temple. " + q("I kinda figured a company like that would want to fix everything they could get their hands on. But he said they change bodies, never wants. That if I want something, that’s mine, and nobody gets to sell me a different one.") + " She smiles down at the screen. " + q("Kinda nice, hearing that from the guys who make all the mods."),
                q("Three weeks for his board, though.") + " She flops backwards. " + q("Three whole weeks. Ethical science takes time, he says. Ethical science is <i>slow</i>, is what it is."),
                "She bumps her shoulder against you. " + q("Whatever happens next, thanks for this, Captain.")
            ]);
            safe(function () { processTime(5); });
            backTo(talkMenu);
            return;
        }
        say([
            "You ask Shekka how she’s feeling about what Dr. Rewell said.",
            "She’s sitting cross-legged on her bunk with the datapad, which now has a new folder on it labeled <i>REWELL!!!</i> in big pink letters. " + q("Honestly? Terrified. Excited. Mostly both at once.") + " Her ears jingle as she shakes her head. " + q("He actually thinks it can work. He didn’t even blink. Just said <i>give me a few weeks</i> like I asked him to fix a leaky valve."),
            q("And the part where he won’t touch my head...") + " She taps her temple. " + q("I was scared he’d say he had to. That it was all or nothing. But he said it’s mine. That I spent my whole life learning to steer around that itch, and I’m good at it, and nobody gets to go in there and do it for me.") + " She smiles down at the screen. " + q("Kinda nice, being told I’m good at something that isn’t a wrench."),
            "She bumps her shoulder against you. " + q("Whatever happens next, thanks for this, Captain.")
        ]);
        safe(function () { processTime(5); });
        backTo(talkMenu);
    }

    /* ---------- Dr. Rewell's office (slot 3, from the TN_BiancaClinic hook) ---------- */
    window.tnRewellMenuExtra = function (slot, back) {
        try {
            if (!rewellKnown() || stage() < 1) return;
            if (!docOpen(REWELL)) { addDisabledButton(slot, "Shekka", "Shekka", "Shekka is being treated by Dr. McAllister, on Myrellion."); return; }
            if (!shekkaCrew()) { addDisabledButton(slot, "Shekka", "Shekka", "Shekka needs to be on your crew to come along."); return; }
            if (stage() === 1) addButton(slot, "Shekka", function () { rewellConsult(back); }, "Shekka", "Bring Shekka in to show Dr. Rewell the gene plans for the new raskvel generation.");
            else if (stage() === 2) {
                if (planReady()) addButton(slot, "Shekka", function () { rewellPlan(back); }, "Shekka’s Plan", "Bring Shekka in to hear the plan Dr. Rewell has worked up for her.");
                else addDisabledButton(slot, "Shekka", "Shekka", "Dr. Rewell is still working up a plan for Shekka. Give him " + waitText(num("TN_SKG_CONSULT_TS") + PLAN_WAIT) + ".");
            } else if (stage() < 5) {
                var nm = SESSIONS[stage() - 2].l;
                if (sessionReady()) addButton(slot, nm, function () { rewellSession(back); }, nm, "Bring Shekka in for her next treatment: " + SESSIONS[stage() - 2].tip);
                else addDisabledButton(slot, nm, nm, "Shekka needs time between treatments. Her next one is in " + waitText(num("TN_SKG_SESSION_TS") + SESSION_GAP) + ".");
            } else {
                if (num("TN_SKG_CHECK_DAY") === today() + 1) addDisabledButton(slot, "Shekka", "Shekka’s Check-up", "Dr. Rewell already checked on Shekka today.");
                else addButton(slot, "Shekka", function () { rewellCheckup(back); }, "Shekka’s Check-up", "Bring Shekka in so Dr. Rewell can see how she’s doing.");
            }
        } catch (err) {}
    };

    function rewellConsult(back) {
        clearMenu(); clearOutput();
        safe(function () { shekka.showAll(); });
        safe(function () { showName("Dr. Rewell"); });
        author("Neston");
        say([
            "You tell Dr. Rewell you’ve brought someone who’d like to meet him, and duck back out to the waiting room. Shekka is perched on the very edge of a chair, datapad clutched in both hands, ears trembling with the faintest nervous jingle. Nest looks up from the front desk long enough to give her an encouraging little wave.",
            "Dr. Rewell rises when she comes in, and doesn’t seem to notice that he has to look a long, long way down to meet her eyes. " + q("Hello there. Charles Rewell. You must be Shekka. [pc.name] mentioned you might stop by.") + " He takes her small, clawed hand in both of his, the way he did with you. " + q("Sit down, please. Can I get you some tea?"),
            "Shekka shakes her head, then nods, then shakes her head again, and finally just holds out the datapad. " + q("I, um. I brought some stuff. For you to look at. If that’s okay. It’s about forty pages.") + " Her ears clink. " + q("Plus attachments."),
            "He puts on his holo-glasses at last and starts to read.",
            "At first he hums. Then he stops humming. Then, very slowly, he sits back in his chair, flicking through the gene maps with one long finger, his eyebrows climbing higher with every swipe.",
            q("Where did you get this?") + " he says quietly.",
            "Shekka shrinks a little. " + q("I... wrote most of it? With a team. [pc.name] paid for it. It’s the Cure. For the raskvel, I mean. For the egg drive. It’s been in every egg on Tarkus for a while now.") + " She swallows. " + q("Is it bad?"),
            q("Bad?") + " Dr. Rewell laughs, a startled, delighted sound. " + q("My dear, this is beautiful work. Look at this, the way you damped the drive at the receptor instead of cutting the gene outright. That’s the elegant way. That’s the way I’d have done it.") + " He taps a corner of one chart. " + q("And some of these base sequences, I know these. They’re from the uplift research Victor had us doing in his last few years. I wrote half of them myself.") + " He shakes his head. " + q("I always wondered if that work would ever go anywhere."),
            "Shekka looks at you, wide-eyed, and you just shrug. Small galaxy.",
            q("So,") + " Dr. Rewell says, folding his hands on the desk. " + q("You want to know if I can give it to you."),
            q("Yeah,") + " Shekka whispers.",
            q("Then let me take a look at you, and I’ll tell you honestly.") + " He pulls the scanner arm down from the ceiling. Shekka has to stand on the recliner to reach it, which earns her a fond chuckle. The scanner hums and glows blue over her, and a second holo blooms up beside the first: Shekka’s own genome, turning slowly in the air. Dr. Rewell studies the two of them side by side for a long, quiet time.",
            q("Alright,") + " he says at last. " + q("Here’s the truth, all of it."),
            q("Your sterility isn’t an injury. It’s inherited. A whole gene set that switched itself off somewhere back in your family line, a few generations before you. Probably from whatever’s been leaking into Tarkus’ groundwater since before the UGC ever turned up. It isn’t gone, just broken. And broken things can be mended.") + " He glances at her over his glasses. " + q("That part I can fix. I’d stake my license on it."),
            q("The body part of your Cure? The longer life, the joints and the heart, the drive turned down at the receptor? That’s chemistry, not the mind. Hormones and glands and how your body listens to them. That I can give you, too. You’d still feel the drive, but it would be a whisper instead of a shout. Like the children."),
            "Shekka makes a tiny sound. He holds up one hand, gently.",
            q("But I won’t touch your mind. And I want you to understand it isn’t because I can’t.") + " He nods at the turning holo of her genome. " + q("It’s because it’s yours. You’ve spent your whole life learning to steer around that drive. And you’re clearly very good at it, because you went and wrote <i>that</i>.") + " He nods at the datapad. " + q("If I go in there and rewire who you are, then it’s not you that’s free of it any more. It’s me deciding what you should be. I did enough of that for other people, back at Steele Tech. I don’t do it any more."),
            q("I...") + " Shekka’s voice cracks. She tries again. " + q("No. That’s good. That’s exactly what I wanted. I just didn’t think anyone would say it."),
            "Dr. Rewell smiles. " + q("It won’t be quick, mind you. A sequence like this has to be built for you specifically, and then given in stages. Months, not days. And you’ll be laying eggs at the end of it, if you want to. That’s a big thing to walk into. I want you to be sure.") + " He taps the datapad and copies her whole forty pages, plus attachments, onto his own terminal. " + q("Give me three weeks to work up a plan. I’ll send word when it’s ready. Then come back, both of you, and we’ll talk about doing it properly."),
            "Shekka nods, and nods, and then slides off the recliner and wraps her arms around as much of the old doctor as she can reach, which is mostly his knees. He pats her feathers, looking a little misty himself.",
            "When the two of you step back out into the hall, she grabs your hand and doesn’t let go of it all the way back to the ship."
        ]);
        flags.TN_SKG_STAGE = 2;
        flags.TN_SKG_ROUTE = REWELL;
        flags.TN_SKG_CONSULT_TS = now();
        safe(function () { processTime(60); });
        clearMenu();
        addButton(0, "Next", function () { if (typeof back === "function") back(); else mainGameMenu(); });
    }

    /* ---------- The treatment ---------- */
    function startRewell() {
        clearMenu(); clearOutput();
        safe(function () { shekka.showAll(); });
        safe(function () { showName("Dr. Rewell"); });
        author("Neston");
    }
    function backBtn(back) {
        clearMenu();
        addButton(0, "Next", function () { if (typeof back === "function") back(); else mainGameMenu(); });
    }
    function sitBeside() {
        return body({
            biped: "You pull a chair up beside the recliner",
            taur: "You fold your legs and settle onto the floor beside the recliner",
            naga: "You coil up beside the recliner"
        });
    }

    function rewellPlan(back) {
        startRewell();
        say([
            "Shekka has been bouncing in her seat since the lift. When Nest waves the two of you through, she nearly runs down the hall.",
            "Dr. Rewell already has the holos up: Shekka’s genome on one side, the Cure’s gene map on the other, and between them a third chart you haven’t seen before, tidy and branching, labeled in his small, careful hand: <i>SHEKKA - PLAN A.</i>",
            q("Sit, sit,") + " he says, beaming. " + q("Plan A. There was a plan B, but it was worse. And a plan C, but Nest read it and made a face, so we’re not talking about plan C."),
            "He walks you both through it, one branch at a time.",
            q("Three treatments, two visits. The first two go in together, one right after the other. The last one waits a week or more, so your body can settle.") + " He touches the first branch. " + q("<b>The Mend.</b> This is your family’s broken gene set. I send in a carrier, a harmless little virus that does exactly one thing: it carries a working copy of those genes in, and swaps it for the broken one. You’ll sleep a lot that day. You may run warm for a few days after. That’s normal."),
            q("<b>The Quiet.</b>") + " The second branch. " + q("Straight after the Mend, while the carrier’s still working; the receptors take best that way. This is the receptor work from your own Cure. Your egg drive will still be there. It’s yours, and I’m not taking it. But it’ll be a whisper instead of a shout, like the children’s. Your mind stays your own. I’m changing what your body says to it, not how you listen."),
            q("<b>The Years.</b>") + " The last branch. " + q("The children’s long-life genes. Joints, heart, the slow repair work that keeps a body going. And a full scan afterwards, so we can see whether it all took.") + " He folds his hands. " + q("At the end of it, if all goes well, you’ll be fertile. Whether you ever do anything about that is entirely up to you."),
            "Shekka has been very quiet. She looks at the chart for a long moment, then at you.",
            q("If I change my mind,") + " she says slowly. " + q("Halfway through. What then?"),
            q("Then we stop,") + " Dr. Rewell says. " + q("Whatever’s done stays done, and none of it hurts you. But we stop. You don’t owe me a single session, Shekka. Not one."),
            "Her ears give a small, shaky jingle. She reaches over and finds your hand without looking."
        ]);
        safe(function () { processTime(30); });
        clearMenu();
        addButton(0, "Begin", function () { sessionScene(0, back); }, "Begin", "Shekka’s ready to start with the first session, The Mend.");
        addButton(1, "Not Yet", function () {
            startRewell();
            say([
                "Shekka swallows and shakes her head. " + q("Not today. I want to... I want to sit with it a bit first. Is that okay?"),
                q("It’s more than okay.") + " Dr. Rewell copies Plan A onto her datapad. " + q("Take it home. Read it until it bores you. I’ll be here."),
                "<b>You can bring Shekka back to start whenever she’s ready.</b>"
            ]);
            backBtn(back);
        }, "Not Yet", "Give Shekka more time to think it over.");
    }

    function rewellSession(back) { sessionScene(stage() - 2, back); }

    function sessionScene(idx, back) {
        startRewell();
        if (idx === 0) {
            say([
                q("Okay,") + " Shekka says, very quietly. Then, louder: " + q("Okay. Let’s do it."),
                "Dr. Rewell lowers the recliner as far as it goes, so she can climb up without a step stool, and tucks a blanket around her legs. " + sitBeside() + ", and she grabs your hand and holds on.",
                "The carrier comes in a small glass vial, clear as water. It doesn’t look like anything. Dr. Rewell sets up the drip with steady, unhurried hands, talking the whole time: what it’s doing, where it’s going, how long it will take. Shekka asks about a hundred questions, and he answers every one of them as if it’s the first.",
                q("Does it feel like anything?") + " you ask.",
                q("Kinda cold.") + " Shekka watches the line. " + q("Kinda like... nothing. That’s weird, right? I thought it’d feel like something. Like this is the biggest thing anyone’s ever done to me, and it feels like a drink of water."),
                q("The big things usually do,") + " Dr. Rewell says.",
                "About twenty minutes in, she yawns. Ten minutes after that she’s fast asleep, still holding your hand, snoring very softly. Dr. Rewell pulls the blanket up to her chin and keeps a quiet eye on the monitors, humming.",
                q("She’ll be tired today and tomorrow,") + " he murmurs to you. " + q("Warm, maybe a little achy. Plenty of water, plenty of rest. If she runs a fever over forty, call me. She won’t.") + " He watches her sleep for a moment. " + q("Victor slept through his first gene mod, too. Drooled on my good chair."),
                "When the drip runs dry, he unhooks it and hangs a second bag in its place. " + q("The Mend’s in,") + " he tells you quietly. " + q("Now The Quiet, while the carrier’s still awake to take it.")
            ]);
            safe(function () { processTime(60); });
            clearMenu();
            addButton(0, "Next", function () { sessionScene(1, back); }, "The Quiet", "Stay with Shekka for The Quiet.");
            return;
        } else if (idx === 1) {
            say([
                "Shekka stirs as the new line starts, blinking up at the ceiling. " + q("Did I fall asleep? I fell asleep.") + " She yawns hugely. " + q("Is it done? Am I fixed?"),
                q("The first part is,") + " Dr. Rewell says. " + q("This is the second. Stay put."),
                "The Quiet takes longer. It’s a slow drip, then a second one, and Dr. Rewell watches the monitors closely the whole time, adjusting a dial here and there. " + sitBeside() + ", and Shekka leans her head against you and talks about engines until she runs out of engines.",
                "And then, about an hour in, she stops talking mid-sentence.",
                q("Shekka?") + " Dr. Rewell leans in. " + q("How are you feeling?"),
                q("It’s...") + " Her eyes are wide. " + q("It’s quieter. Already. Is that... is that supposed to happen already?"),
                q("It’s the first of it.") + " He checks a reading and nods. " + q("It’ll settle in over the next week or so. Tell me what you notice."),
                "Shekka is quiet for a long time. When she talks again, her voice wobbles. " + q("There’s this... noise. In the back of my head. My whole life. Like an engine idling. And I always thought, that’s just me, that’s just being a raskvel, everybody hears it.") + " She lets out a breath. " + q("It’s still there. But I can hear the room over it now. I can hear <i>you.</i>"),
                "She cries a bit, then, very quietly. Dr. Rewell passes over a box of tissues without a word and goes back to watching his monitors, so she can do it in peace.",
                "When the second drip runs out, she’s asleep again. You carry her back to the ship. She mumbles something about the coolant pumps the whole way, and doesn’t wake up when you put her down on her bunk.",
                "<b>The Mend and The Quiet are done. Shekka’s last session, The Years, can be in a week.</b>"
            ]);
            safe(function () { processTime(150); });
        } else {
            var biancaHere = safe(function () { return !!(window.tnBiancaClinic && window.tnBiancaClinic.isOpen()); }, false);
            say([
                "Shekka marches into the office for her last session like she owns it. She climbs onto the recliner, pulls the blanket up herself, and holds out her arm for the line. " + q("Hit me, doc."),
                "Dr. Rewell laughs. " + q("Yes, ma’am."),
                "The Years is the easiest of the three treatments. One drip, an hour long, and Shekka spends the whole of it telling Dr. Rewell, in great detail, everything wrong with his gene sequencer. By the end of the hour she has the side panel off and is elbow-deep in it. He looks delighted.",
                "Then comes the scan. The arm hums down from the ceiling and passes over her, slow and blue, and her genome blooms up in the air again, turning.",
                "Dr. Rewell doesn’t say anything for a while. He just looks. Then he reaches up and turns the holo, very gently, to a small cluster of new light near the bottom of it.",
                q("There,") + " he says softly. " + q("See that? That’s you, working."),
                "Shekka stares at it. " + q("That’s...?"),
                q("Your ovaries, waking up.") + " He takes his glasses off. " + q("The Mend took. The Quiet took. The Years took. You’re fertile, Shekka. As of today, you can lay eggs of your own. If you want to. When you want to. And with whoever you want to."),
                "For a moment, Shekka doesn’t move at all. Then she slides off the recliner, sidesteps the sequencer parts, and walks straight into you. She hugs you so hard the breath goes out of you, her face buried in your " + body({ biped: "chest", taur: "flank", naga: "chest" }) + " and her ears jingling like a whole wind chime.",
                q("Thank you,") + " she says, muffled, over and over. " + q("Thank you. Thank you."),
                biancaHere ? "There’s a knock at the doorframe. Bianca is standing there with Nest peeking over her shoulder, both of them pretending very hard that they haven’t been listening. " + q("I’m so sorry to intrude,") + " Bianca says, not sorry at all, her tails swishing. " + q("We just... wanted to say congratulations.") + " Nest holds up a slightly squashed cupcake with a single candle in it. Shekka laughs so hard she has to sit down." : "",
                "Afterwards, Dr. Rewell puts the sequencer back together under Shekka’s strict supervision. When you leave, it’s running quieter than it ever has.",
                "<b>Shekka’s treatment is complete. She’s fertile.</b>"
            ]);
            safe(function () { processTime(120); });
            flags.TN_SKG_FERTILE = 1;
            applyFertility();
        }
        flags.TN_SKG_STAGE = idx + 3; // the Mend runs straight into the Quiet, so this lands on 4 or 5
        flags.TN_SKG_SESSION_TS = now();
        backBtn(back);
    }

    function rewellCheckup(back) {
        startRewell();
        say([
            "Dr. Rewell runs the scanner over Shekka while she chatters at him about the ship’s plumbing. The holo turns above the desk, and he studies it with a little satisfied hum.",
            q("Everything’s holding,") + " he says. " + q("Steady as a rock. How’s the quiet?"),
            q("Still quiet.") + " Shekka grins. " + q("I read a whole manual last week. Cover to cover. In one sitting!") + " She leans in, conspiratorial. " + q("It was really boring. It was amazing."),
            "Dr. Rewell laughs, and won’t take a credit for the visit. He never does."
        ]);
        flags.TN_SKG_CHECK_DAY = today() + 1;
        safe(function () { processTime(20); });
        backBtn(back);
    }


    /* ================= Dr. McAllister's route (Xenogen lab, Myrellion) ================= */
    var MCA_SESSIONS = [
        { l: "Phase One", tip: "the first phase, repairing the gene cluster that made her sterile." },
        { l: "Phase Two", tip: "the second phase, damping her egg drive at the receptor, like the kids’." },
        { l: "Phase Three", tip: "the last phase, the kids’ long-life genes and a full scan." }
    ];
    function mcaBack(back) {
        clearMenu();
        addButton(0, "Next", function () { if (typeof back === "function") back(); else mainGameMenu(); });
    }
    function bedSide() {
        return body({
            biped: "You drag a lab stool over beside the bed",
            taur: "You fold your legs and settle onto the spotless floor beside the bed",
            naga: "You coil up on the floor beside the bed"
        });
    }

    // Dr. McAllister's menu, slot 2 (from the .mod hook in content_myrellion).
    window.tnMcAllisterMenuExtra = function (slot, back) {
        try {
            if (!mcaKnown() || stage() < 1) return;
            if (!docOpen(MCA)) { addDisabledButton(slot, "Shekka", "Shekka", "Shekka is being treated by Dr. Rewell, at Bianca’s clinic on Tavros."); return; }
            if (!shekkaCrew()) { addDisabledButton(slot, "Shekka", "Shekka", "Shekka needs to be on your crew to come along."); return; }
            if (stage() === 1) addButton(slot, "Shekka", function () { mcaConsult(back); }, "Shekka", "Bring Shekka in to show Dr. McAllister the gene plans for the new raskvel generation.");
            else if (stage() === 2) {
                if (planReady()) addButton(slot, "Shekka", function () { mcaPlan(back); }, "Shekka’s Plan", "Bring Shekka in to hear the plan Xenogen’s board signed off on.");
                else addDisabledButton(slot, "Shekka", "Shekka", "Xenogen’s ethics board is still reviewing Shekka’s case. Give them " + waitText(num("TN_SKG_CONSULT_TS") + PLAN_WAIT) + ".");
            } else if (stage() < 5) {
                var ses = MCA_SESSIONS[stage() - 2];
                if (sessionReady()) addButton(slot, ses.l, function () { mcaSession(stage() - 2, back); }, ses.l, "Bring Shekka in for her next treatment: " + ses.tip);
                else addDisabledButton(slot, ses.l, ses.l, "Shekka needs time between phases. Her next one is in " + waitText(num("TN_SKG_SESSION_TS") + SESSION_GAP) + ".");
            } else {
                if (num("TN_SKG_CHECK_DAY") === today() + 1) addDisabledButton(slot, "Shekka", "Shekka’s Check-up", "Dr. McAllister already checked on Shekka today.");
                else addButton(slot, "Shekka", function () { mcaCheckup(back); }, "Shekka’s Check-up", "Bring Shekka in so Dr. McAllister can see how she’s doing.");
            }
        } catch (err) {}
    };

    function mcaConsult(back) {
        startMca();
        say([
            "You tell Dr. McAllister you’ve brought someone who’d like a word with him, and wave Shekka in from the corridor. She comes out of the decontamination chamber looking slightly fluffed and very nervous, her datapad clutched to her chest in both hands.",
            q("Well now!") + " McAllister booms, and half his research assistants jump. " + q("A raskvel! Haven’t had one of you in my lab before. Byron McAllister, my dear. A pleasure, a pleasure.") + " He shakes her hand, and most of her arm goes along for the ride. One of his assistants quietly fetches a lab stool tall enough for Shekka to see over the bench.",
            "Shekka climbs up onto it and holds out the datapad. " + q("I, um. I brought some stuff. For you to look at. If that’s okay. It’s about forty pages.") + " Her ears clink. " + q("Plus attachments. Plus footnotes."),
            q("Footnotes! A woman after my own heart.") + " He takes it and starts to read.",
            "At first he hums along to himself. Then he stops humming. Then he pulls up a chair, sits down heavily, and scrolls back to the beginning to start again, one big finger tracing down the gene maps while his other hand works slowly through his beard.",
            q("Who did this?") + " he says, in a voice you’ve never heard out of him. Quiet.",
            "Shekka shrinks a little. " + q("I... did? Most of it? With a team. [pc.name] paid for it. It’s the Cure. For the raskvel, I mean. For the egg drive. It’s been in every egg on Tarkus for a while now.") + " She swallows. " + q("Is it bad?"),
            q("Bad?") + " McAllister twists around in his chair. " + q("Ladies! Come and look at this.") + " His assistants crowd in around the bench. " + q("A reproductive drive, damped at the receptor instead of cut out. Carried in the egg. Rolled out across an entire planet. With trial data!") + " He jabs the screen. " + q("Do you know how many grant committees I’d have to sit in front of to try something like this? And this young lady just... went and did it."),
            "One of the assistants actually whistles. Shekka goes pink to the tips of her ears. " + q("Well, the matrons signed off. And the chief. Mostly ’cause the kids kept eating the wiring."),
            McAllisterLaugh(),
            q("Now then.") + " He sets the datapad down on the bench between them. " + q("What can I do for you, eh?"),
            "Shekka takes a breath. " + q("I want to be like them. The kids. Fertile, with the drive turned down so it’s a choice. The long-life stuff. Not the brain stuff, if you can’t. I know that part’s supposed to be impossible for grown-ups. Just... the rest. Can you do it?"),
            "McAllister’s smile fades into something more thoughtful. He scratches at his beard for a long moment.",
            q("I’ll tell you what I tell everyone who walks in here hoping for a miracle, my dear. Ethical science takes time. I don’t treat a living person on a hunch. Tests first. Then my colleagues pick the whole thing apart. Then my superiors sign off on it. Then, and only then, do we talk about needles.") + " Shekka’s ears droop. He taps the datapad. " + q("But it seems you’ve already done the first part of that for me. Trial data from a whole planet’s worth of eggs. So let’s have a look at you, and see what’s what."),
            "He leads the two of you through the shutter into the clean white room beyond, the one where you first met his myr volunteers. Shekka hops up onto the scanning bed, a little wide-eyed. " + body({
                biped: "You stand at her shoulder,",
                taur: "You fold yourself into the corner by her bed,",
                naga: "You coil up beside the bed,"
            }) + " and she grabs your hand as the scanner array hums to life above her and sweeps down her body in slow bands of light. Her genome blooms up in the air beside the Cure’s gene map, turning slowly.",
            "McAllister studies the two of them side by side for a long, quiet time. Then he nods to himself.",
            q("Right. Here’s the truth, all of it, and you can hold me to every word."),
            q("Your sterility’s not an injury. It’s inherited. A whole cluster of fertility genes switched off, somewhere back in your family line. Generations old. Something in the water on Tarkus, I’d wager; that planet was leaking strange chemistry long before anybody found it.") + " He points at a dim knot of the holo. " + q("Switched off isn’t gone. We repair clusters like that every week, for colonists whose bodies don’t like their new worlds. That part I can fix."),
            q("The body side of your Cure? The drive damped at the receptor, the longevity work, the joints and the heart? That’s chemistry. Glands and hormones and how your body listens to them. Xenogen already has a delivery for that, the same one we use for the myr mods. A course of treatments, not surgery. You’d still feel the drive. It’s yours. It’d just be a whisper instead of a shout."),
            "Shekka makes a tiny sound. He holds up one huge hand, gently.",
            q("But I won’t touch your head. And I’ll tell you why, because you deserve the why.") + " He nods at the turning holo. " + q("First, the practical reason: in a grown woman, that wiring’s set. Rewriting it means risking <i>you</i>, and I won’t. Second, the principle. My company sells people the bodies they’ve always pictured themselves in. The day we start selling them different <i>wants</i>, every pretty little cosmetic mod in the core turns into something much uglier. So we change bodies. Never minds. Not yours. Not anyone’s."),
            q("That’s...") + " Shekka’s voice cracks. She tries again. " + q("No. That’s good. That’s exactly what I wanted. I just didn’t think a company would say it."),
            q("The company didn’t. I did.") + " He winks. " + q("Now, the dull part. I want to put your case before Xenogen’s medical ethics board. With your permission, of course: your scans with your name off them, as a clinical case study. A raskvel fertility repair is exactly the sort of thing the board loves, which means the company pays for all of it. Not a credit from either of you.") + " He picks up the datapad again and turns it over in his hands. " + q("And in exchange, I might ask to cite your Cure in a paper. With your name on it, if you’ll allow it. First author. The work’s yours."),
            "Shekka squeaks. Actually squeaks. " + q("My name? On a <i>Xenogen</i> paper?"),
            q("If you’ll have it.") + " He copies the whole forty pages, plus attachments, plus footnotes, onto his terminal. " + q("Give the board three weeks. I’ll send word the moment they sign off. Then come back, both of you, and we’ll talk about doing this properly."),
            "Shekka slides off the bed and hugs him, which mostly means hugging his belly. McAllister laughs, a huge, delighted boom, and pats her feathers. Behind him, one of his assistants is very discreetly dabbing at her eyes.",
            "All the way back through decontamination, and all the way back to the ship, Shekka holds your hand and mutters <i>first author</i> under her breath like she’s afraid she’ll forget it."
        ]);
        flags.TN_SKG_STAGE = 2;
        flags.TN_SKG_ROUTE = MCA;
        flags.TN_SKG_CONSULT_TS = now();
        safe(function () { processTime(75); });
        mcaBack(back);
    }
    function McAllisterLaugh() {
        return "McAllister throws back his head and laughs, loud enough to rattle the sample racks. " + q("Ha! That’s how all the best science starts, my " + boyGirl() + ". Somebody gets fed up.");
    }

    function mcaPlan(back) {
        startMca();
        say([
            "Nevrie barely looks up from her bag of snacks when the two of you come in. She just points down the hall with a pretzel. " + q("He’s been waiting. Go on, before he comes out here and booms at me again."),
            "McAllister is waiting in the clean room with the holos already up: Shekka’s genome, the Cure’s gene map, and a third chart between them, stamped across the top with the Xenogen seal and a smaller one underneath: <i>APPROVED, MEDICAL ETHICS BOARD.</i>",
            q("There she is! The first author herself.") + " He beams. " + q("Sit, sit. Let me walk you through it."),
            "He goes through it one branch at a time, the big man suddenly careful and precise.",
            q("Three phases, two visits. The first two go in together, one straight after the other. The third waits a week or more, so your body can settle.") + " He touches the first branch. " + q("<b>Phase One.</b> Repair. A carrier, a harmless little delivery virus of ours, takes a working copy of that sleeping gene cluster in and swaps it for the broken one. You’ll be drowsy. You may run warm for a few days after. That’s normal."),
            q("<b>Phase Two.</b>") + " The second branch. " + q("Straight after the first, while the carrier’s still active; the receptors take best that way. This is your own receptor work, from the Cure, built for an adult body. The drive stays. It’s yours. It’ll just be quieter. Your mind’s your own. I’m changing what your body says to it, not how you listen."),
            q("<b>Phase Three.</b>") + " The last branch. " + q("The children’s longevity genes. Joints, heart, cell repair. Then a full scan, so we can all see whether it took.") + " He folds his big hands on the bench. " + q("At the end of it, if all goes well, you’ll be fertile. Whether you ever do anything about that is your business, and nobody else’s."),
            "Shekka looks at the chart for a long moment. Then at you.",
            q("If I change my mind,") + " she says slowly. " + q("Halfway through. What then?"),
            q("Then we stop,") + " McAllister says, without a heartbeat’s pause. " + q("Consent isn’t a form you sign once, my dear. It’s something you keep giving, or don’t. Whatever’s done stays done, and none of it will hurt you. But you can stop me at any point, and I’ll thank you for telling me."),
            "Her ears give a small, shaky jingle. She reaches over and finds your hand without looking."
        ]);
        safe(function () { processTime(30); });
        clearMenu();
        addButton(0, "Begin", function () { mcaSession(0, back); }, "Begin", "Shekka’s ready to start with Phase One.");
        addButton(1, "Not Yet", function () {
            startMca();
            say([
                "Shekka swallows and shakes her head. " + q("Not today. I want to... I want to sit with it a bit first. Is that okay?"),
                q("More than okay.") + " McAllister copies the whole plan onto her datapad. " + q("Take it home. Pick holes in it. If you find any, I want to hear about them. The lab’s not going anywhere."),
                "<b>You can bring Shekka back to start whenever she’s ready.</b>"
            ]);
            mcaBack(back);
        }, "Not Yet", "Give Shekka more time to think it over.");
    }

    function mcaSession(idx, back) {
        startMca();
        if (idx === 0) {
            say([
                q("Okay,") + " Shekka says, very quietly. Then, louder: " + q("Okay. Let’s do it."),
                "The clean room has been made over for her. Someone has swapped the scanning bed for a padded recliner sized for a myr, which leaves Shekka plenty of room, and someone else has found her a blanket printed with little cartoon wrenches. Nobody will admit to which assistant it was. " + bedSide() + ", and Shekka grabs your hand and holds on.",
                "Phase One comes in a small sealed cartridge, clear as water. It doesn’t look like anything. McAllister sets up the line himself with his big, surprisingly delicate hands, talking the whole time: what it’s doing, where it’s going, how long it will take. Shekka asks him about a hundred questions, most of them about the lab’s centrifuges, and he answers every one.",
                q("Does it feel like anything?") + " you ask her.",
                q("Kinda cold.") + " She watches the line. " + q("Kinda like... nothing. That’s weird, right? This is the biggest thing anyone’s ever done to me, and it feels like a drink of water."),
                q("The big ones usually do,") + " McAllister says. " + q("It’s the little cosmetic jobs that make a fuss. Tails, mostly. Never let anyone tell you a new tail doesn’t itch."),
                "About twenty minutes in, she yawns. Ten minutes after that she’s asleep, still holding your hand, snoring very softly. McAllister waves his assistants out of the room and dims the lights himself, and for a while it’s just the three of you and the quiet hum of the monitors.",
                q("She’ll be drowsy today and tomorrow,") + " he murmurs. " + q("Warm, perhaps a little achy. Plenty of water. Plenty of rest. If anything worries you, you call me, day or night. I mean that.") + " He watches her sleep a moment, then chuckles under his breath. " + q("First author. Ha. She’ll be running this place in ten years."),
                "When the cartridge runs dry, he swaps in a second one. " + q("Phase One’s in,") + " he tells you softly. " + q("Now Phase Two, while the carrier’s still awake to take it.")
            ]);
            safe(function () { processTime(60); });
            clearMenu();
            addButton(0, "Next", function () { mcaSession(1, back); }, "Phase Two", "Stay with Shekka for Phase Two.");
            return;
        } else if (idx === 1) {
            say([
                "Shekka stirs as the new line starts, blinking at the white ceiling. " + q("Did I fall asleep? I fell asleep.") + " She yawns hugely. " + q("Is it done? Am I fixed?"),
                q("The first part is,") + " McAllister says. " + q("This is the second. Stay put, my dear."),
                "Phase Two is slower. McAllister stays at the monitors the whole time, nudging a setting here, a dose there, his usual boom down to a low rumble. " + bedSide() + ", and Shekka leans her head against you and explains how she’d rebuild his centrifuges until she runs out of centrifuges.",
                "And then, about an hour in, she stops talking in the middle of a word.",
                q("Shekka?") + " McAllister leans in. " + q("Talk to me. How are you feeling?"),
                q("It’s...") + " Her eyes have gone very wide. " + q("It’s quieter. Already. Is that... is that supposed to happen already?"),
                q("That’s the first of it.") + " He checks a reading, and his beard twitches into a smile. " + q("It’ll settle over the next week or so. Tell me what you notice. All of it. You’re my best source."),
                "Shekka is quiet for a long time. When she does talk, her voice wobbles. " + q("It’s like... you know when you’ve been in the engine room all day? And you walk out and your ears are ringing, and you didn’t even know it was loud till it stopped?") + " She lets out a long breath. " + q("I’ve been in the engine room my whole life. It’s still there. I can just hear the room over it now. I can hear <i>you.</i>"),
                "She cries a little, then, very quietly. McAllister hands over a box of lab wipes without a word, sends the last of his assistants out with one look, and goes back to his monitors so she can do it in peace.",
                "When the second cartridge runs dry, she’s asleep again. You carry her out past Nevrie, who for once puts down her snacks and holds the door, and all the way back to the ship. Shekka mumbles about centrifuges the whole way, and doesn’t wake up when you tuck her into her bunk.",
                "<b>Phases One and Two are done. Shekka’s last treatment, Phase Three, can be in a week.</b>"
            ]);
            safe(function () { processTime(150); });
        } else {
            say([
                "Shekka marches into the clean room for her last phase like she owns the place. She climbs onto the recliner, pulls the wrench blanket up herself, and holds out her arm for the line. " + q("Hit me, doc."),
                "McAllister roars with laughter. " + q("Yes, ma’am!"),
                "Phase Three is the easiest of the three. One cartridge, an hour long, and Shekka spends the whole of it telling McAllister, in loving and merciless detail, everything that is wrong with Xenogen’s gene sequencers. By the end of the hour two of his assistants are taking notes.",
                "Then comes the scan. The array hums down from the ceiling and sweeps over her in slow bands of light, and her genome blooms up in the air again, turning.",
                "McAllister doesn’t say anything for a while. He just looks. Then he reaches up with one big finger and turns the holo, very gently, to a small cluster of new light near the bottom of it.",
                q("There,") + " he says, and his voice is rough. " + q("See that? That’s you. Working."),
                "Shekka stares at it. " + q("That’s...?"),
                q("Your ovaries, waking up.") + " He clears his throat, hard. " + q("Phase One took. Phase Two took. Phase Three took. You’re fertile, Shekka. As of today, you can lay eggs of your own. If you want to. When you want to. With whoever you like."),
                "For a moment Shekka doesn’t move at all. Then she slides off the recliner and walks straight into you. She hugs you so hard the breath goes out of you, her face buried in your " + body({ biped: "chest", taur: "flank", naga: "chest" }) + " and her ears jingling like a whole wind chime.",
                q("Thank you,") + " she says, muffled, over and over. " + q("Thank you. Thank you."),
                "When she finally lets go, the shutter is up and every assistant in the lab is crowded against the glass, along with Nevrie, who has a bag of gummy candies in one hand. She comes in, holds it out to Shekka without a word, and when Shekka takes one, gives her a single solemn nod. " + q("Congrats, shortstack."),
                "McAllister blows his nose loudly into a lab wipe, and pretends it’s allergies.",
                "<b>Shekka’s treatment is complete. She’s fertile.</b>"
            ]);
            safe(function () { processTime(120); });
            flags.TN_SKG_FERTILE = 1;
            applyFertility();
        }
        flags.TN_SKG_STAGE = idx + 3; // Phase One runs straight into Phase Two, so this lands on 4 or 5
        flags.TN_SKG_SESSION_TS = now();
        mcaBack(back);
    }

    function mcaCheckup(back) {
        startMca();
        say([
            "McAllister runs the scanner over Shekka while she tells him exactly how far behind his sequencer’s firmware is. The holo turns in the air above the bench, and he studies it with a deep, satisfied rumble.",
            q("Everything’s holding,") + " he says. " + q("Steady as bedrock. How’s the quiet?"),
            q("Still quiet.") + " Shekka grins up at him. " + q("I read your whole board report. Cover to cover, in one sitting! All two hundred pages.") + " She leans in, conspiratorial. " + q("It was so boring. It was amazing."),
            "McAllister laughs loud enough to make an assistant drop her datapad, and won’t hear a word about paying for the visit. " + q("Case study, my dear. You’re doing <i>me</i> a favor.")
        ]);
        flags.TN_SKG_CHECK_DAY = today() + 1;
        safe(function () { processTime(20); });
        mcaBack(back);
    }

    function betweenSessionsTalk(talkMenu) {
        startShekka();
        var mc = route() === MCA;
        var n0 = mc ? "Phase One" : "The Mend", n1 = mc ? "Phase Two" : "The Quiet";
        if (stage() === 3) {
            say([
                "You ask Shekka how she’s feeling after " + n0 + ".",
                q("Hot!") + " she says at once, fanning herself with a wrench. " + q("Like, I ran a fever for three days, which doc said was normal, and then I slept for a whole day, which doc <i>also</i> said was normal. And now I feel...") + " She pauses, considering. " + q("Good? Really good. Like I had a cold my whole life and it just went away."),
                "She sets the wrench down. " + q("It’s weird, knowing it’s in there. The genes. Fixed. I keep putting my hand on my belly like I’m gonna feel it.") + " She laughs at herself. " + q("I won’t, I know. Doesn’t stop me."),
                q("Next one’s " + n1 + ".") + " Her ears jingle, a little nervous. " + q("That’s the one I’m scared of. Not because of doc. Just... I’ve had that noise in my head my whole life. I don’t know who I am without it. Guess I’ll find out.")
            ]);
        } else {
            say([
                "You ask Shekka how she’s feeling after " + n0 + " and " + n1 + ".",
                q("Well, I ran a fever for three days, which doc said was normal, and slept for a whole one, which doc <i>also</i> said was normal.") + " She fans herself with a wrench. " + q("But that’s not the part you’re asking about, is it?"),
                "She doesn’t say anything else for a moment. She’s sitting at her workbench with a half-built drone in front of her, and you realize she’s been working on the same panel, carefully and steadily, for the entire time you’ve been standing there. No wandering off. No fidgeting. Just work.",
                q("It’s still there,") + " she says at last. " + q("The itch. I still want things. I still want <i>you,</i> trust me.") + " She grins over her shoulder. " + q("But I get to decide when. It doesn’t just grab the wheel any more."),
                q("I finished three projects this week. Three! I haven’t finished three projects in a <i>row</i> since I was a kid.") + " She sets down her tools and looks at her hands. " + q("Is this what it’s like for everybody? The whole time? Is this what my kids get?"),
                "She doesn’t seem to want an answer. She just smiles, and goes back to work."
            ]);
        }
        safe(function () { processTime(10); });
        backTo(talkMenu);
    }

    function afterTreatmentTalk(talkMenu) {
        startShekka();
        if (route() === MCA) {
            say([
                "You ask Shekka how she’s feeling now that it’s all done.",
                "She pulls up her datapad. The <i>XENOGEN!!!</i> folder has a new file in it: a still from her last scan, that small cluster of light turning in the air. She’s set it as her wallpaper. Next to it is a draft paper with her name at the top, and Dr. McAllister’s under it.",
                q("Like me,") + " she says. " + q("Just... more. Like I’ve been running on half my engines and somebody finally fixed the other half."),
                q("I emailed home. Told the matrons in Novahome. Told the kids’ teachers.") + " Her ears jingle happily. " + q("One of the old matrons cried. She said she’s been sterile since she was twenty and nobody ever told her it might be fixable. So I sent her the lab’s address. Doc McAllister wrote back in about five minutes. He says he’ll see her himself, and the board can put it on his tab.") + " She grins. " + q("He’s gonna end up with a whole waiting room full of raskvel grannies."),
                "You suspect he’d love that."
            ]);
            safe(function () { processTime(10); });
            backTo(talkMenu);
            return;
        }
        say([
            "You ask Shekka how she’s feeling now that it’s all done.",
            "She pulls up her datapad. The <i>REWELL!!!</i> folder has a new file in it: a still from her last scan, that small cluster of light turning in the air. She’s set it as her wallpaper.",
            q("Like me,") + " she says. " + q("Just... more. Like I’ve been running on half my engines and somebody finally fixed the other half."),
            q("I emailed home. Told the matrons in Novahome. Told the kids’ teachers.") + " Her ears jingle happily. " + q("One of the old matrons cried. She said she’s been sterile since she was twenty and nobody ever told her it might be fixable. So I sent her doc’s address.") + " She bites her lip. " + q("I hope that’s okay. I think he’d want me to."),
            "You think he would too."
        ]);
        safe(function () { processTime(10); });
        backTo(talkMenu);
    }

    function fertilityTalk(talkMenu) {
        startShekka();
        say([
            "You ask Shekka how she feels about being fertile now.",
            "She laughs and flops back on her bunk, arms spread wide. " + q("Honestly? It’s the best thing that never happened to me."),
            q("Because here’s the thing. I can. If I want to. Some day I’ll want to, I think. A little clutch of my own, with you, or... well. We’ll see.") + " She waggles her eyebrows at you. " + q("But not yet. Right now I just like knowing I could. I like it being mine to pick. That’s the whole point, right?"),
            shekkaCock() ? q("Besides, this beast still works fine for the other direction.") + " She pats her crotch fondly. " + q("So if you want eggs in this crew before I’m ready, Captain, you know who to ask.") : "",
            "She rolls over onto her belly and props her chin in her hands, ears jangling. " + q("Some day. When the ship’s quiet and I’m done with the engines. But on my schedule, not my cunt’s.") + " She grins. " + q("Never thought I’d get to say that.")
        ]);
        safe(function () { processTime(10); });
        backTo(talkMenu);
    }

    window.tnShekkaGeneTalk = {
        unlocked: unlocked, stage: stage, talk: geneTalk, fertile: fertile,
        route: function () { return route() === MCA ? "mcallister" : "rewell"; },
        consult: rewellConsult, plan: rewellPlan, session: sessionScene,
        mcaConsult: mcaConsult, mcaPlan: mcaPlan, mcaSession: mcaSession
    };
})();
