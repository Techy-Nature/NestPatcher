/*
 * TN_ShekkaGeneTalk_v2.9.js - "Shekka's Gene Talk" (NestPatcher runtime mod, TiTS 0.9.168), Modv2.9
 * Author: Neston
 *
 * Needs TN_ShekkaGeneTalk_v2.9.mod (adds the button to Shekka's crew Talk menu).
 * The Dr. Rewell visit needs Bianca's Clinic (TN_BiancaClinic_v2.9.mod + .js) and Bianca Extras.
 *
 * Once Bianca's clinic is open on Tavros and Dr. Rewell has told you about his work on sterile
 * gene lines (the "Your Kids" talk in his office), crew Shekka gets a new Talk topic, "Gene Plans".
 *   - You tell her about Dr. Rewell. She pulls up the plans for the new generation of raskvel, the
 *     Cure you helped fund, and asks whether he would change her the same way: fertile, but with
 *     the kids' calmer egg drive and their longer lives, so having eggs is a choice and not a need.
 *   - "Let's Ask Him" unlocks a "Shekka" button in Dr. Rewell's office. She comes along, he reads
 *     the plans, scans her and tells her what he can and can't do. He'll fix her body and give her
 *     the kids' body chemistry, but he won't rewrite her mind. He needs a few weeks to work up a plan.
 *   - Three weeks after the consult Dr. Rewell emails that her plan is ready. The treatment is
 *     three sessions in his office, at least a week apart: The Mend (her inherited sterility),
 *     The Quiet (the kids' egg drive, turned down at the receptor; her mind is left alone) and
 *     The Years (the kids' long-life genes, plus a final scan). No charge.
 *   - After the last session Shekka is fertile: her "Sterile" perk is removed and her fertility
 *     set to 1. Her Infertility talk becomes "Fertility". She isn't ready for eggs yet, and the
 *     game has no pregnancy for Shekka herself, so nothing else changes.
 *   - Shekka talks about each step on the ship ("Gene Plans"), and Dr. Rewell gives her a
 *     check-up afterwards.
 * Flags (in your save): TN_SKG_STAGE (1 = agreed to ask Rewell, 2 = consulted, 3/4 = sessions
 *   1/2 done, 5 = treatment done), TN_SKG_TALKS, TN_SKG_CONSULT_TS, TN_SKG_SESSION_TS,
 *   TN_SKG_CHECK_DAY, TN_SKG_FERTILE.
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
            description: "Once Bianca's clinic is open and Dr. Rewell has told you about his work on sterile gene lines, crew Shekka can talk to you about the gene plans for the new generation of raskvel, and whether Dr. Rewell would change her the same way. Then take her through his three-session treatment until she's fertile, on her own terms. Needs Bianca's Clinic.",
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
            var t = "Dear [pc.name],\n\nI said three weeks, and for once in my life I'm on time. Shekka's plan is ready.\n\nThree sessions in my office, a week or more apart, so her body has time to settle between each one. Nothing that needs a hospital bed, and nothing she can't walk out of on her own two feet. I'll walk you both through all of it before we start, and if she changes her mind at any point, even halfway through, we stop. That's not a formality.\n\nAnd before either of you asks: no, there's no bill. I've been waiting forty years for someone to bring me a sterile gene line I could actually mend. I should be paying her.\n\nBring her by whenever you're on Tavros. Office hours as always, eight to six. Nest has already cleared my afternoons, apparently without asking me.\n\nWarmly,\nCharles Rewell\n\nP.S. Please tell her I read all forty pages. And the attachments. Twice.";
            return typeof ParseText === "function" ? ParseText(t) : t;
        },
        subject: "Shekka's plan",
        from: "Dr. Charles Rewell",
        fromAddress: "c_rewell@ketriaclinic.net",
        test: function () { return on() && stage() >= 2 && now() - num("TN_SKG_CONSULT_TS") >= PLAN_WAIT; }
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

    // Bianca's questline is done once her clinic has opened, and Dr. Rewell has told Steele
    // about his work on sterile gene lines ("Your Kids" in his office).
    function clinicReady() {
        if (window.tnBiancaClinicEnabled && !window.tnBiancaClinicEnabled()) return false;
        if (window.tnBiancaExtrasEnabled && !window.tnBiancaExtrasEnabled()) return false;
        return safe(function () { return !!(window.tnBiancaClinic && window.tnBiancaClinic.opened()); }, false);
    }
    function unlocked() { return on() && clinicReady() && num("TN_BXC_RW_MET") >= 1 && num("TN_BXC_RW_KIDS") >= 1; }

    /* ---------- Shekka's Talk menu button (slot 3, from the .mod hook) ---------- */
    window.tnShekkaGeneButton = function (slot, talkMenu) {
        try {
            if (!unlocked()) return;
            var tip = stage() === 0 ? "Tell Shekka about Dr. Rewell, the geneticist at Bianca’s clinic, and his work on sterile gene lines."
                : stage() === 1 ? "Talk with Shekka about seeing Dr. Rewell. She’s waiting for you to take her to his office in Bianca’s clinic, on Tavros."
                : stage() === 2 ? "Talk with Shekka about what Dr. Rewell said."
                : stage() < 5 ? "Ask Shekka how the treatment is going."
                : "Ask Shekka how she feels now that the treatment is done.";
            addButton(slot, "Gene Plans", function () { geneTalk(talkMenu); }, "Gene Plans", tip);
            // Once she's fertile, her old Infertility talk (slot 2) no longer fits.
            if (fertile()) addButton(2, "Fertility", function () { fertilityTalk(talkMenu); }, "Fertility", "Talk to Shekka about being fertile again.");
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
        if (again) {
            say([
                "You bring up Dr. Rewell again.",
                "Shekka’s ears go still, and for once there isn’t a single jingle out of them. She’s already reaching for her battered old datapad before you’ve finished the sentence. " + q("Yeah. I’ve been thinking about it too. Kinda a lot, honestly."),
                "She swipes it open to the same gene maps as last time and sets it in your lap. " + q("Still can’t get past it. They’re <i>my</i> kids, [pc.name]. Not mine-mine. But I helped make them. And every time I look at this, I keep wondering what it’d be like to be one of them.")
            ]);
        } else {
            say([
                "You tell Shekka about the little clinic Bianca opened on Tavros, and the old man who works there with her. Dr. Charles Rewell, the geneticist who sat down with your father and built you, base pair by base pair. And what he told you, quietly, when you asked about kids: that sterile gene lines have been his obsession for decades. That sometimes it’s fixable. More often than people think.",
                "Shekka stops fiddling with the coupling in her hands.",
                "Her ears, for once, go completely still. No jingle, no jangle. She stares at you long enough that you start to wonder if you broke her, and then she sets the coupling down, very carefully, like it might go off.",
                q("More often than people think,") + " she repeats. " + q("He said that? Those words?"),
                "You nod.",
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
            q("So. Your doctor. The one who built you.") + " Her voice wobbles, just a little. " + q("You think he’d look at this? You think he’d be willing to change me the same way? Not the brain stuff, if he can’t. Just... the rest. The eggs. The years. The part where it’s a choice."),
            q("You think he’d even want to?")
        ]);
        flags.TN_SKG_TALKS = num("TN_SKG_TALKS") + 1;
        safe(function () { processTime(25); });
        clearMenu();
        addButton(0, "Ask Him", function () { askHim(talkMenu); }, "Let’s Ask Him", "Tell Shekka you’ll take her to see Dr. Rewell the next time you’re on Tavros.");
        addButton(1, "Think On It", function () { thinkOnIt(talkMenu); }, "Think On It", "Tell Shekka there’s no rush, and she should be sure before she asks him for anything.");
    }

    function askHim(talkMenu) {
        startShekka();
        say([
            "You take the datapad from her and tell her the truth: you don’t know what Dr. Rewell will say. But you know he spent eighty years making sure your father never got anything unsafe put in him, and you know how his face lit up when he talked about helping families nobody else would bother with. If anyone in the galaxy is going to take her seriously, it’s him.",
            "And then you tell her that the next time the ship sets down on Tavros, the two of you are going to go ask him.",
            "Shekka makes a noise that’s half laugh and half something wetter, and throws her arms around you so hard her ear-rings clang against your " + body({ biped: "shoulder", taur: "side", naga: "shoulder" }) + ". " + q("Okay. Okay! Rust-in-rain, okay.") + " She lets go just long enough to scrub at her eyes with the back of one wrist. " + q("I’m not crying. It’s engine grease. Shut up."),
            q("I’m gonna make copies of everything,") + " she says, already scrolling. " + q("The whole Cure. The clinical trial notes. My own scans from Novahome. Oh, and the first batch of test results, he’s gonna want those...") + " She trails off into happy, muttering lists, and you leave her to it.",
            "<b>Dr. Rewell keeps office hours at Ketria Clinic on Tavros, from 8 AM to 6 PM. Bring Shekka by his office.</b>"
        ]);
        flags.TN_SKG_STAGE = 1;
        safe(function () { processTime(5); });
        backTo(talkMenu);
    }
    function thinkOnIt(talkMenu) {
        startShekka();
        say([
            "You tell her there’s no rush. Whatever Dr. Rewell might be able to do, it’s her body, and it isn’t the sort of thing anyone should walk into on a whim. She should be sure first.",
            "Shekka nods slowly and tucks the datapad against her chest. " + q("Yeah. Yeah, you’re right. That’s fair.") + " Her ears give a small, thoughtful jingle. " + q("I’ve been not-sure about this my whole life, I guess another few days won’t kill me. I’ll let you know."),
            "She gives you a crooked smile. " + q("Thanks for telling me about him, [pc.name]. Really. Even just knowing someone out there thinks it’s fixable... that’s more than I had this morning.")
        ]);
        safe(function () { processTime(3); });
        backTo(talkMenu);
    }
    function waitingTalk(talkMenu) {
        startShekka();
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
            if (!unlocked() || stage() < 1) return;
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
            q("Three sessions. A week or more apart, so your body can settle between each one.") + " He touches the first branch. " + q("<b>The Mend.</b> This is your family’s broken gene set. I send in a carrier, a harmless little virus that does exactly one thing: it carries a working copy of those genes in, and swaps it for the broken one. You’ll sleep a lot that day. You may run warm for a few days after. That’s normal."),
            q("<b>The Quiet.</b>") + " The second branch. " + q("This is the receptor work from your own Cure. Your egg drive will still be there. It’s yours, and I’m not taking it. But it’ll be a whisper instead of a shout, like the children’s. Your mind stays your own. I’m changing what your body says to it, not how you listen."),
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
                "When the drip runs out, she wakes just long enough to be carried back to the ship. She mumbles something about the coolant pumps the whole way, and falls asleep again before you’ve even put her down on her bunk.",
                "<b>The Mend is done. Shekka’s next session can be in a week.</b>"
            ]);
            safe(function () { processTime(120); });
        } else if (idx === 1) {
            say([
                "Shekka is a lot calmer this time. She hops up onto the recliner by herself, kicks her feet and tells Dr. Rewell all about her week: she ran hot for three days, slept for one, and then felt better than she has in years. She even shows him a chart she made of her own temperature, which he studies with great seriousness and pronounces <i>exemplary.</i>",
                "The Quiet takes longer. It’s a slow drip, then a second one, and Dr. Rewell watches the monitors closely the whole time, adjusting a dial here and there. " + sitBeside() + ", and Shekka leans her head against you and talks about engines until she runs out of engines.",
                "And then, about an hour in, she stops talking mid-sentence.",
                q("Shekka?") + " Dr. Rewell leans in. " + q("How are you feeling?"),
                q("It’s...") + " Her eyes are wide. " + q("It’s quieter. Already. Is that... is that supposed to happen already?"),
                q("It’s the first of it.") + " He checks a reading and nods. " + q("It’ll settle in over the next week or so. Tell me what you notice."),
                "Shekka is quiet for a long time. When she talks again, her voice wobbles. " + q("There’s this... noise. In the back of my head. My whole life. Like an engine idling. And I always thought, that’s just me, that’s just being a raskvel, everybody hears it.") + " She lets out a breath. " + q("It’s still there. But I can hear the room over it now. I can hear <i>you.</i>"),
                "She cries a bit, then, very quietly. Dr. Rewell passes over a box of tissues without a word and goes back to watching his monitors, so she can do it in peace.",
                "<b>The Quiet is done. Shekka’s last session can be in a week.</b>"
            ]);
            safe(function () { processTime(150); });
        } else {
            var biancaHere = safe(function () { return !!(window.tnBiancaClinic && window.tnBiancaClinic.isOpen()); }, false);
            say([
                "Shekka marches into the office for her last session like she owns it. She climbs onto the recliner, pulls the blanket up herself, and holds out her arm for the line. " + q("Hit me, doc."),
                "Dr. Rewell laughs. " + q("Yes, ma’am."),
                "The Years is the easiest of the three. One drip, an hour long, and Shekka spends the whole of it telling Dr. Rewell, in great detail, everything wrong with his gene sequencer. By the end of the hour she has the side panel off and is elbow-deep in it. He looks delighted.",
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
        flags.TN_SKG_STAGE = idx + 3;
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

    function betweenSessionsTalk(talkMenu) {
        startShekka();
        if (stage() === 3) {
            say([
                "You ask Shekka how she’s feeling after The Mend.",
                q("Hot!") + " she says at once, fanning herself with a wrench. " + q("Like, I ran a fever for three days, which doc said was normal, and then I slept for a whole day, which doc <i>also</i> said was normal. And now I feel...") + " She pauses, considering. " + q("Good? Really good. Like I had a cold my whole life and it just went away."),
                "She sets the wrench down. " + q("It’s weird, knowing it’s in there. The genes. Fixed. I keep putting my hand on my belly like I’m gonna feel it.") + " She laughs at herself. " + q("I won’t, I know. Doesn’t stop me."),
                q("Next one’s The Quiet.") + " Her ears jingle, a little nervous. " + q("That’s the one I’m scared of. Not because of doc. Just... I’ve had that noise in my head my whole life. I don’t know who I am without it. Guess I’ll find out.")
            ]);
        } else {
            say([
                "You ask Shekka how she’s feeling after The Quiet.",
                "She doesn’t answer right away. She’s sitting at her workbench with a half-built drone in front of her, and you realize she’s been working on the same panel, carefully and steadily, for the entire time you’ve been standing there. No wandering off. No fidgeting. Just work.",
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

    window.tnShekkaGeneTalk = { unlocked: unlocked, stage: stage, talk: geneTalk, consult: rewellConsult, plan: rewellPlan, session: sessionScene, fertile: fertile };
})();
