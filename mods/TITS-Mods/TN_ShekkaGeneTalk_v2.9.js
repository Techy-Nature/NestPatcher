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
 *   - The procedure itself is NOT in this mod yet (waiting on Neston). After the consult the
 *     button stays greyed out with a note that he's still working on it.
 * Flags (in your save): TN_SKG_STAGE (1 = agreed to ask Rewell, 2 = Rewell consulted),
 *   TN_SKG_TALKS (times you've talked about it), TN_SKG_CONSULT_TS (when Rewell saw her).
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
            description: "Once Bianca's clinic is open and Dr. Rewell has told you about his work on sterile gene lines, crew Shekka can talk to you about the gene plans for the new generation of raskvel, and whether Dr. Rewell would change her the same way. Includes a consult with him. Needs Bianca's Clinic.",
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
                : "Talk with Shekka about what Dr. Rewell said.";
            addButton(slot, "Gene Plans", function () { geneTalk(talkMenu); }, "Gene Plans", tip);
        } catch (err) {}
    };

    function geneTalk(talkMenu) {
        if (stage() === 0) firstTalk(talkMenu);
        else if (stage() === 1) waitingTalk(talkMenu);
        else afterConsultTalk(talkMenu);
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
            else addDisabledButton(slot, "Shekka", "Shekka", "Dr. Rewell is still working up a plan for Shekka. (Not written yet.)");
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
            "Dr. Rewell smiles. " + q("It won’t be quick, mind you. A sequence like this has to be built for you specifically, and then given in stages. Months, not days. And you’ll be laying eggs at the end of it, if you want to. That’s a big thing to walk into. I want you to be sure.") + " He taps the datapad and copies her whole forty pages, plus attachments, onto his own terminal. " + q("Give me a few weeks to work up a plan. Then come back, both of you, and we’ll talk about doing it properly."),
            "Shekka nods, and nods, and then slides off the recliner and wraps her arms around as much of the old doctor as she can reach, which is mostly his knees. He pats her feathers, looking a little misty himself.",
            "When the two of you step back out into the hall, she grabs your hand and doesn’t let go of it all the way back to the ship."
        ]);
        flags.TN_SKG_STAGE = 2;
        flags.TN_SKG_CONSULT_TS = now();
        safe(function () { processTime(60); });
        clearMenu();
        addButton(0, "Next", function () { if (typeof back === "function") back(); else mainGameMenu(); });
    }

    window.tnShekkaGeneTalk = { unlocked: unlocked, stage: stage, talk: geneTalk, consult: rewellConsult };
})();
