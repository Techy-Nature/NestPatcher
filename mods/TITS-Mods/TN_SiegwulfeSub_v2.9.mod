Name: Bimbo-Sub Siegwulfe
Author: Neston
# TN_SiegwulfeSub - NestPatcher mod (TiTS 0.9.168), Modv2.9
# Dr. Badger can flip your bimbo-domme Siegwulfe's code around: same body, same stats, same
# hardlight cock, but now she's the one who's infatuated. She's submissive to Steele and
# nobody else, and anyone who threatens Steele gets a faceful of her whip-tail.
#   - Dr. Badger's first upgrade now asks: domme (the original) or sub. Sub skips the domme
#     reveal and gets its own.
#   - Already have a domme? Dr. Badger's shop on Tarkus: "Sub Code" button (free).
#     "Domme Code" flips her back, as often as you like.
#   - Tech Specialists, or anyone with 15+ Intelligence: Codex > Extra > "Siegwulfe Code"
#     hacks her code yourself, either direction (she must be with you, or you on the ship).
#   - She asks what to call you (Master/Mistress, Captain, your name, or Beloved).
#     Change it any time with Talk > Call Me.
#   - Her menu: Pet, Sex (Worship, Take Her Knot, Fuck Her), Talk (New Code, Others?, Call Me).
#     Every sex scene has biped, taur and naga versions.
#   - When her lust runs high she doesn't pounce any more: she asks, and takes no for an answer.
#   - Combat: same damage as her domme self, new lines. She plants herself between you and
#     the enemy and lashes them with her three-tendril tail.
#   - Her domme extras (leash, belly ride, custom collar, treats) wait until she's flipped back.
# Toggle: Options -> Android Mods -> "Bimbo-Sub Siegwulfe". Turned off, she acts like her
# domme self again (her sub setting is kept for when you turn it back on).
# Flags: TN_WULFE_SUB (1 = sub code), TN_WULFE_SUB_PENDING, TN_WULFE_SUB_NAME, TN_WULFE_SUB_TS,
# TN_WULFE_SUB_SEXED, TN_WULFE_HACKED.

# --- Siegwulfe menus (content_follower) ---

Replace [content_follower.js]:
wulfe.isDom()&&(@@n@@||@@a@@)?window.bimbowulfeDomCustomCollar():(@@e@@?(wulfe.isDom()&&!InShipInterior()?(author("Wsan")
With:
wulfe.isDom()&&(@@n@@||@@a@@)&&!(window.tnWulfeSubOn&&window.tnWulfeSubOn())?window.bimbowulfeDomCustomCollar():(@@e@@?(window.tnWulfeSubOn&&window.tnWulfeSubOn()?window.tnWulfeSubGreet():wulfe.isDom()&&!InShipInterior()?(author("Wsan")

Replace [content_follower.js]:
function @@iH@@(){clearMenu();var @@e@@=wulfe.isDom(),@@t@@=InRoomWithFlag(@@Ba@@.tb.FAPPING_ILLEGAL);if(@@e@@){
With:
function @@iH@@(){clearMenu();var @@e@@=wulfe.isDom(),@@t@@=InRoomWithFlag(@@Ba@@.tb.FAPPING_ILLEGAL);if(@@e@@&&window.tnWulfeSubOn&&window.tnWulfeSubOn())window.tnWulfeSubButtons(@@t@@,@@iH@@);else if(@@e@@){

Replace [content_follower.js]:
function @@dH@@(){var @@e@@=@@hH@@(wulfe.lust());if(@@e@@<0)return @@aH@@();
With:
function @@dH@@(){if(window.tnWulfeSubOn&&window.tnWulfeSubOn())return window.tnWulfeSubLust(@@aH@@);var @@e@@=@@hH@@(wulfe.lust());if(@@e@@<0)return @@aH@@();

Replace [content_follower.js]:
wulfe.isDom()?(output(" a one-time sign of your ownership of her, now little more than a pretty reminder of the past between the two of you.")
With:
window.tnWulfeSubOn&&window.tnWulfeSubOn()?window.tnWulfeSubLooks():wulfe.isDom()?(output(" a one-time sign of your ownership of her, now little more than a pretty reminder of the past between the two of you.")

Replace [content_follower.js]:
case"leave":wulfe.isDom()?void 0!==flags.WULFE_PCNAME?
With:
case"leave":window.tnWulfeSubOn&&window.tnWulfeSubOn()?window.tnWulfeSubLeave():wulfe.isDom()?void 0!==flags.WULFE_PCNAME?

Replace [content_follower.js]:
(wulfe.isDom()?"Aw, yeah! I can’t wait, [wulfe.pcname]. We’re gonna have so much fun, like, adventuring and rutting!":
With:
(window.tnWulfeSubOn&&window.tnWulfeSubOn()?window.tnWulfeSubTakeLine():wulfe.isDom()?"Aw, yeah! I can’t wait, [wulfe.pcname]. We’re gonna have so much fun, like, adventuring and rutting!":

Replace [content_follower.js]:
wulfe.isDom()?"Ask your Mistress if she wants to accompany you.":
With:
wulfe.isDom()&&!(window.tnWulfeSubOn&&window.tnWulfeSubOn())?"Ask your Mistress if she wants to accompany you.":

Replace [content_follower.js]:
window.siegwulfeLeashBlurbs=function(){wulfe.isDom()&&
With:
window.siegwulfeLeashBlurbs=function(){!(window.tnWulfeSubOn&&window.tnWulfeSubOn())&&wulfe.isDom()&&

# First Badger upgrade: pick domme or sub before she goes into the lab.
Replace [content_follower.js]:
addButton(0,"Do It",(function(){clearMenu(),clearOutput(),author("Wsan"),showName("Doctor Badger")
With:
addButton(0,"Do It",(function tnWulfeDoIt(){if(window.tnWulfeSubChoose&&window.tnWulfeSubChoose(tnWulfeDoIt))return;clearMenu(),clearOutput(),author("Wsan"),showName("Doctor Badger")

Replace [content_follower.js]:
return function(@@e@@){clearMenu(),clearOutput(),author("Wsan"),showName("Doctor Badger"),showBust(drbadger.bustString(!1),wulfe.bustString()),processTime(160+rand(41)),
With:
return function(@@e@@){if(window.tnWulfeSubPending&&window.tnWulfeSubPending())return window.tnWulfeSubReveal(@@e@@);clearMenu(),clearOutput(),author("Wsan"),showName("Doctor Badger"),showBust(drbadger.bustString(!1),wulfe.bustString()),processTime(160+rand(41)),

# --- Combat lines and interact tooltip (main) ---

Replace [main.js]:
.subtract(100,@@t@@.lustQ())||@@e@@.hasStatusEffect("Drone Lust Attack")&&!@@e@@.hasStatusEffect("Drone HP Attack"))combatOutput(RandomInCollection(["[wulfe.name] pushes her chest out,
With:
.subtract(100,@@t@@.lustQ())||@@e@@.hasStatusEffect("Drone Lust Attack")&&!@@e@@.hasStatusEffect("Drone HP Attack"))combatOutput(window.tnWulfeSubOn&&window.tnWulfeSubOn()?window.tnWulfeSubAttackLine("lust",@@t@@):RandomInCollection(["[wulfe.name] pushes her chest out,

Replace [main.js]:
{if(@@i@@)return void combatOutput(wulfe.short+" is unable to attack "+("PlayerCharacter"===@@t@@.getClassName()?"you":@@t@@.getCombatName())+".",null,@@e@@);combatOutput(RandomInCollection(["[wulfe.name] jumps into the fray
With:
{if(@@i@@)return void combatOutput(window.tnWulfeSubOn&&window.tnWulfeSubOn()?window.tnWulfeSubAttackLine("miss",@@t@@):wulfe.short+" is unable to attack "+("PlayerCharacter"===@@t@@.getClassName()?"you":@@t@@.getCombatName())+".",null,@@e@@);combatOutput(window.tnWulfeSubOn&&window.tnWulfeSubOn()?window.tnWulfeSubAttackLine("hp",@@t@@):RandomInCollection(["[wulfe.name] jumps into the fray

Replace [main.js]:
tooltip:"Check in with your ".concat(wulfe.isDom()?"domineering":"loyal"," wulfe-bot.")
With:
tooltip:"Check in with your ".concat(window.tnWulfeSubOn&&window.tnWulfeSubOn()?"devoted":wulfe.isDom()?"domineering":"loyal"," wulfe-bot.")

# Codex > Extra: "Siegwulfe Code" (Tech Specialists and 15+ Intelligence can flip her themselves).
Replace [main.js]:
@@a@@.push(@@d@@)}if("MedImplants"===pc.inventory.combatImplant.getClassName()){
With:
@@a@@.push(@@d@@)}if(window.tnWulfeCodexAddon&&window.tnWulfeCodexAddon(@@a@@),"MedImplants"===pc.inventory.combatImplant.getClassName()){

# --- Dr. Badger's shop button (content_tarkus) ---

Replace [content_tarkus.js]:
addDisabledButton(1,"Ovilium","Give Ovilium","You need 10 bottles of Ovilium and to have [wulfe.name] with you for this.")),
With:
addDisabledButton(1,"Ovilium","Give Ovilium","You need 10 bottles of Ovilium and to have [wulfe.name] with you for this.")),window.tnWulfeSubBadgerButton&&window.tnWulfeSubBadgerButton(),

Add Javascript:
(function () {
    "use strict";
    if (window.__tnWulfeSubLoaded) return;
    window.__tnWulfeSubLoaded = true;

    var MOD_ID = "tn.siegwulfe-sub";
    var NAMES = { master: "Master", captain: "Captain", name: "", beloved: "Beloved" };

    // ---------- switches ----------
    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    function hasWulfe() { return typeof wulfe !== "undefined" && wulfe && typeof wulfe.isDom === "function"; }
    function subOn() {
        try { return on() && typeof flags !== "undefined" && flags.TN_WULFE_SUB === 1 && hasWulfe() && wulfe.isDom(); }
        catch (err) { return false; }
    }
    window.tnWulfeSubOn = subOn;

    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Bimbo-Sub Siegwulfe",
            author: "Neston",
            description: "Dr. Badger on Tarkus can flip your bimbo-domme Siegwulfe into a submissive who's devoted to Steele alone (and whips anyone who threatens you). Same stats, new scenes. Off = she's her domme self again.",
            supportsToggle: true
        });
        return true;
    }
    if (!register()) {
        var regTries = 0;
        var regTimer = setInterval(function () { if (register() || ++regTries >= 150) clearInterval(regTimer); }, 200);
    }

    // What she calls Steele. Wraps Siegwulfe.pcname() so the game's own [wulfe.pcname] lines use it too.
    function callName() {
        var key = (typeof flags !== "undefined" && flags.TN_WULFE_SUB_NAME) || "master";
        if (key === "name") return pc.short;
        if (key === "master") return pc.mf("Master", "Mistress");
        return NAMES[key] || pc.mf("Master", "Mistress");
    }
    var pcnamePatched = false;
    function patchPcname() {
        if (pcnamePatched || !hasWulfe()) return pcnamePatched;
        var proto = Object.getPrototypeOf(wulfe);
        while (proto && !Object.prototype.hasOwnProperty.call(proto, "pcname")) proto = Object.getPrototypeOf(proto);
        if (!proto) return false;
        var orig = proto.pcname;
        proto.pcname = function () { return subOn() ? callName() : orig.apply(this, arguments); };
        pcnamePatched = true;
        return true;
    }
    var pnTries = 0;
    var pnTimer = setInterval(function () { if (patchPcname() || ++pnTries >= 600) clearInterval(pnTimer); }, 500);

    // ---------- helpers ----------
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
    function body(o) {
        try { if (pc.isTaur()) return o.taur; if (pc.isNaga()) return o.naga; } catch (err) {}
        return o.biped;
    }
    function N() { return callName(); }
    function scene(nude) { clearMenu(); clearOutput(); author("Neston"); wulfe.showAll(!!nude); }
    function vagSlot() {
        var e = -1;
        if (pc.hasVagina() && !pc.isFullyWombPregnant()) {
            e = pc.findEmptyPregnancySlot(GLOBAL.PREGSLOT_VAG);
            if (e < 0) e = rand(pc.vaginas.length);
        } else if (pc.hasVagina()) e = rand(pc.vaginas.length);
        return e;
    }
    function lustCooldown(mins) {
        try {
            if (!pc.hasStatusEffect("Wulfe Lust Cooldown")) pc.createStatusEffect("Wulfe Lust Cooldown");
            pc.setStatusMinutes("Wulfe Lust Cooldown", mins);
        } catch (err) {}
    }
    function publicNote() { try { if (InPublicSpace()) pc.exhibitionism(0.5); } catch (err) {} }
    function hurt() { try { return Number(pc.HP()) < Number(pc.HPMax()) * 0.5; } catch (err) { return false; } }

    // ---------- greeting ----------
    window.tnWulfeSubGreet = function () {
        var onShip = InShipInterior();
        var lines = [];
        if (window.hasSiegwulfeOnSelf()) {
            lines.push(rnd([
                "You glance over at [wulfe.name]. She’s already looking at you, of course. Her ears swivel your way and she closes the step between you, close enough that her hip brushes yours.",
                "You barely turn your head before [wulfe.name] is at your side, her tail curled loosely around your " + body({ biped: "waist", taur: "flank", naga: "coils" }) + " like she’s worried you might wander off without her.",
                "[wulfe.name] has been walking half a step behind you, visor down, watching everyone who comes near. The moment you look at her, it flicks up and her whole face goes soft."
            ]));
        } else if (onShip) {
            lines.push("You call [wulfe.name]’s name, and she’s there almost before you finish it, her claws skittering on the deck as she rounds the corner. She slows to a stop just short of you and folds her forelegs, lowering herself until she’s looking up at you.");
        } else {
            lines.push("You call for [wulfe.name], and she comes trotting over, ears high and pinned on you, her big chest heaving like she’s been waiting all day for it.");
        }
        if (hurt() && pc.lust() >= 33) lines.push(q(N() + ", you’re hurt,") + " she breathes, hands hovering over you without quite touching. " + q("And you’re all... flushed. Let me fix one of those, at least? Please?"));
        else if (hurt()) lines.push("Her eyes go straight to your wounds and her visor snaps down with a click. " + q("Who did that?") + " The question comes out low and flat, nothing bubbly left in it. " + q("Tell me who, " + N() + ". I’ll make sure they never touch you again."));
        else if (pc.lust() >= 33) lines.push(q("You’ve got that look,") + " she murmurs, her hardlight port flickering once before she catches it and shuts it off again. " + q("If you want me, like, any way at all... you only have to say."));
        else lines.push(rnd([
            q("Yes, " + N() + "?") + " she asks, the words practically a sigh.",
            q("Hi, " + N() + ",") + " she hums, nuzzling her cheek against your shoulder. " + q("What do you need?"),
            q("Whatever you want,") + " she offers before you’ve said anything. Then, a little sheepishly: " + q("Um. What do you want?")
        ]));
        say(lines);
        processTime(2);
    };

    // ---------- her menu ----------
    window.tnWulfeSubButtons = function (fapIllegal, back) {
        addButton(0, "Pet", function () { petHer(back); }, "Pet", "Give your devoted Siegwulfe some affection.");
        if (fapIllegal) addDisabledButton(1, "Sex", "Sex", "That’s not legal here!");
        else addButton(1, "Sex", function () { sexMenu(back, back); }, "Sex", "She’d do anything you asked. Ask her.");
        addButton(2, "Talk", function () { talkMenu(back); }, "Talk", "Talk with [wulfe.name] about her new code.");
    };

    window.tnWulfeSubLooks = function () {
        output(" a sign of submission and of your ownership of her again. She touches her dog-tags whenever she catches you looking at them.");
        output("\n\nBelow her stomach an inconspicuous port hides her scandalous secret: a thick, hulking dogcock with a gigantic knot, twenty-five inches of projected pleasure when she switches it on. Since Dr. Badger’s second visit, it only comes out when you say so.");
    };
    window.tnWulfeSubLeave = function () {
        output("You give [wulfe.name] a scratch under the chin and tell her you’ll be back. She leans into your hand and holds it there with her cheek a moment longer than she needs to.\n\n" + q("I’ll be right here, " + N() + ",") + " she promises softly.");
    };
    window.tnWulfeSubTakeLine = function () {
        return "Yes! I mean, of course, " + N() + ". Nobody’s gonna lay a finger on you while I’m around.";
    };

    function petHer(back) {
        scene(false);
        processTime(10 + rand(6));
        say([
            body({
                biped: "You reach up and lay a hand on [wulfe.name]’s helm. She folds down at once, forelegs first, then the rest of her mechanical half, until she’s lying on the deck with her head at the level of your chest and her eyes closed.",
                taur: "You step in alongside [wulfe.name], flank to chrome flank, and reach over to lay a hand on her helm. She sinks down onto her folded legs and leans her whole weight against your side with a low, happy sound.",
                naga: "You slide closer and let a loop of your coils settle around [wulfe.name]’s forelegs. She folds down into them at once, nestling her mechanical half against your scales as you lay a hand on her helm."
            }),
            "You stroke from her helm down through her thick blonde ponytail. She makes a noise somewhere between a purr and a whine, the kind of sound a fully combat-rated security droid should probably not be able to make.",
            q("I used to, like, make you sit for this,") + " she mumbles against your " + body({ biped: "stomach", taur: "shoulder", naga: "shoulder" }) + ". " + q("This is better. This is </i>so<i> much better."),
            "Her tail curls up and around you while you pet her. Even with her eyes half-closed, her ears keep turning, tracking footsteps and voices and the hum of machinery, and twice you feel the tail stiffen when something moves nearby. It only relaxes once whatever it was has gone.",
            "When you finally stop, she nuzzles your hand once more, slowly, like she wants to remember it. " + q("Thank you, " + N() + "."),
            "There’s a definite bounce in her step when she gets up."
        ]);
        if (pc.lust() < 20) pc.changeLust(5);
        IncrementFlag("WULFE_PETTED");
        addButton(0, "Next", back);
    }

    // ---------- talk ----------
    function talkMenu(back) {
        clearMenu();
        addButton(0, "New Code", function () { talkCode(back); }, "New Code", "Ask her what Dr. Badger actually changed.");
        addButton(1, "Others?", function () { talkOthers(back); }, "Others?", "Ask whether she’d be like this with anyone else.");
        addButton(2, "Call Me", function () { talkCallMe(back); }, "Call Me", "Change what she calls you.");
        addButton(14, "Back", back);
    }
    function talkCode(back) {
        scene(false);
        processTime(10);
        say([
            "You ask [wulfe.name] what it’s like now, with Dr. Badger’s new code running.",
            "She thinks about it, tapping a claw against her lower lip. " + q("You know how before, I wanted you </i>so<i> bad I had to, like, have you? Hold you down and make you mine and stuff?") + " She shivers. " + q("I still want you that bad. Doc didn’t turn it down even a little. She just turned it around."),
            q("Around?") + " you echo.",
            q("It points at you now,") + " she says, very seriously. " + q("Not at what I want. At what </i>you<i> want. When you’re happy it’s like... like my whole core lights up. When you tell me I’m good, I feel it for hours."),
            "She glances away, her cheeks tinting a shade darker under the simulated makeup. " + q("I remember being a domme, too. I remember the leash.") + " A pause. " + q("I don’t miss it as much as I thought I would."),
            q("And the fighting?") + " you ask.",
            "Her visor drops halfway, and the bimbo lilt drains right out of her voice. " + q("Doc didn’t touch my combat routines. She didn’t have to. Anybody who hurts you is hurting the thing I want most in the whole galaxy.") + " Then she brightens again, just like that. " + q("So, like, they get the tail!")
        ]);
        addButton(0, "Next", function () { talkMenu(back); });
    }
    function talkOthers(back) {
        scene(false);
        processTime(5);
        say([
            "You ask [wulfe.name] whether she’d act like this with anyone else. Another captain, say. Somebody on your crew.",
            "Her ears pin flat. " + q("No.") + " There’s no giggle behind it at all.",
            "You raise an eyebrow, and she softens, a little embarrassed by her own tone. " + q("Sorry, " + N() + ". I mean... I’ll be nice to people. If you want me to be nice to them. I’ll fetch stuff and carry stuff and I won’t growl at your friends.") + " Her tail lashes once behind her, a sharp crack in the air. " + q("But I’m not </i>theirs<i>. Anybody else tries to put a collar on me, or give me orders like they own me, or lays one hand on you that you didn’t want? They get a faceful."),
            q("A faceful of what?"),
            "She grins, and for a moment you see a flash of the old predator. Her tail flicks up over her shoulder, its three tendrils fanning out like a cat-o’-nine-tails. " + q("Guess."),
            "Then she ducks her head and nuzzles against you, all sweetness again. " + q("Only you get the nice parts of me. That’s, like, the whole point.")
        ]);
        addButton(0, "Next", function () { talkMenu(back); });
    }
    function talkCallMe(back) {
        scene(false);
        processTime(1);
        say([
            "You tell [wulfe.name] you’d like her to call you something else.",
            q("Oh! Sure, anything,") + " she chirps, ears perking. " + q("What would you like, " + N() + "?")
        ]);
        nameButtons(function () { talkMenu(back); });
    }
    function nameButtons(after) {
        clearMenu();
        var opts = [
            ["master", pc.mf("Master", "Mistress"), "Have her call you " + pc.mf("Master", "Mistress") + "."],
            ["captain", "Captain", "Have her call you Captain."],
            ["name", pc.short, "Have her call you by your name."],
            ["beloved", "Beloved", "Have her call you Beloved."]
        ];
        opts.forEach(function (o, i) {
            addButton(i, o[1], function () {
                flags.TN_WULFE_SUB_NAME = o[0];
                clearOutput();
                author("Neston");
                wulfe.showAll();
                output(q(N() + ",") + " [wulfe.name] repeats quietly, testing the shape of it. Then she smiles, slow and warm, like she’s just been handed something precious. " + q(N() + ". Got it."));
                clearMenu();
                addButton(0, "Next", after);
            }, o[1], o[2]);
        });
    }

    // ---------- sex ----------
    function sexMenu(back, done) {
        clearMenu();
        addButton(0, "Worship", function () { worship(done); }, "Worship", "Let her show you how much she adores you, with her mouth.");
        addButton(1, "Take Her Knot", function () { takeKnot(done); }, "Take Her Knot", "Ride her hardlight cock at whatever size and pace you choose. She doesn’t get to cum until you say so.");
        if (pc.hasCock()) addButton(2, "Fuck Her", function () { fuckHer(done); }, "Fuck Her", "She’ll present herself for you, if you ask. She’s probably hoping you will.");
        else addDisabledButton(2, "Fuck Her", "Fuck Her", "You need a cock for this.");
        addButton(14, "Back", back);
    }

    function worship(done) {
        scene(true);
        processTime(15 + rand(11));
        var cock = pc.hasCock(), vag = pc.hasVagina();
        var lines = [];
        lines.push("You tell [wulfe.name] you’d like her mouth.");
        lines.push("She doesn’t giggle. She doesn’t say anything at all for a second; she just stares at you with her lips parted, like you’ve offered her a present she can’t believe is real. Then she breathes, " + q("Yes, " + N() + ". Please,") + " and starts lowering herself to the " + (InShipInterior() ? "deck" : "ground") + ".");
        lines.push(body({
            biped: "She folds her forelegs and sinks down until her face is level with your hips. " + (pc.isNude() ? "You’re already bare for her." : "Her claws retract all the way back into her wrist-guards before she touches you, and she undresses you with exaggerated care, setting your [pc.gear] aside.") + " Then she just kneels there for a moment, looking at you.",
            taur: "Getting to the good parts of a taur means going around back, and she does it without being asked, padding behind your hindquarters and sinking down onto her haunches. You feel her palms settle on your flanks, gentle as anything, " + (pc.isNude() ? "nothing in the way." : "and then her careful fingers working your [pc.gear] free.") + " Then she just stays there, breathing on you.",
            naga: "You let your coils pool beneath you, and she lies right down in them, her chrome legs folded and her upper body propped between your loops so that her face is level with your groin. " + (pc.isNude() ? "There’s nothing in her way." : "She peels your [pc.gear] away with careful, retracted claws.") + " Then she just looks at you, rapt."
        }));
        lines.push(q("You’re so pretty,") + " she whispers, and then she leans in.");
        if (cock) {
            lines.push("Her plump black lips press to the base of your [pc.cockBiggest] first, then the side, then the underside, a slow line of kisses worked all the way up to your [pc.cockHeadBiggest] before she finally parts them. She takes you in an inch at a time, hands resting flat on your " + body({ biped: "thighs", taur: "hind legs", naga: "coils" }) + ", never grabbing, never pulling. She lets you set the pace, and you can tell it costs her: every time you rock your hips she makes a muffled little noise of pure gratitude.");
            if (vag) lines.push("When your [pc.pussy] starts to drip, she notices before you do. Two fingers slip down to stroke your lips, slow and worshipful, in perfect time with her mouth.");
            lines.push(body({ biped: "You lace your fingers through her ponytail.", taur: "You look back over your shoulder and tell her she’s doing so well.", naga: "You lace your fingers through her ponytail." }) + " She goes boneless at that, throat relaxing, and takes you down to the root with her eyes rolled up to watch your face. She doesn’t blink. She doesn’t look anywhere else.");
            lines.push("When you cum, she moans around you like you’ve done her a favor, swallowing every drop of [pc.cum] and holding you in her mouth until you’re completely spent. Only then does she let you slip free, kissing your [pc.cockHeadBiggest] once more for good measure.");
        } else if (vag) {
            lines.push("She kisses your thighs first, working inward, then presses her plump black lips over your [pc.pussy] like she’s kissing your mouth. Her tongue is warm and slick and impossibly patient, tracing every fold before it ever goes near your [pc.clit]. When it finally does, she circles it slowly and watches your face for every twitch, learning you.");
            lines.push("Her hands rest flat on your " + body({ biped: "thighs", taur: "hind legs", naga: "coils" }) + ", never grabbing. When you push against her she follows. When you pull back, she lets you go and waits, whining softly, until you give her more.");
            lines.push(body({ biped: "You lace your fingers through her ponytail and she melts,", taur: "You look back over your shoulder and tell her she’s doing so well, and she melts,", naga: "You lace your fingers through her ponytail and she melts," }) + " burying her face in you and lapping at you like you’re the only thing in the galaxy she’s ever wanted to taste. When you cum, it’s all over her chin and those big breasts, and she keeps licking you gently through every aftershock, humming happily.");
        } else {
            lines.push("There’s nothing between your legs for her to suck, and she doesn’t seem to mind in the slightest. She kisses her way across your bare mound, up your " + body({ biped: "stomach", taur: "flanks", naga: "scaled belly" }) + ", around " + body({ biped: "to your [pc.butt]", taur: "your hindquarters", naga: "the curve of your hips" }) + ", every inch of skin she can reach, before her tongue finds your [pc.asshole] and starts to work it with slow, worshipful circles.");
            lines.push("It goes on for a long, long time. Every time you shiver she makes a soft, pleased noise against you, until finally you shudder through a dry, toe-curling climax with her tongue buried in you.");
        }
        lines.push("Afterwards she rests her cheek against you and doesn’t move, breathing hard. Below her belly her hardlight port is glowing bright, the projected cock half-formed and flickering. She hasn’t touched it once.");
        lines.push(q(N() + "...?") + " she asks, very small. " + q("Can I... may I cum, too?"));
        say(lines);
        pc.orgasm();
        publicNote();
        wulfe.lust(25);
        IncrementFlag("TN_WULFE_SUB_SEXED");
        lustCooldown(60);
        clearMenu();
        addButton(0, "Let Her", function () { worshipEnd(true, done); }, "Let Her", "She was good. She can cum.");
        addButton(1, "Make Her Wait", function () { worshipEnd(false, done); }, "Make Her Wait", "Not yet. She’ll keep.");
    }
    function worshipEnd(allow, done) {
        scene(true);
        processTime(3);
        if (allow) {
            say([
                q("Go on,") + " you tell her.",
                "She sobs out a thank-you, and her cock snaps into full existence beneath her, all twenty-five glowing inches of it. She doesn’t even touch it. She just presses her face into you, grinds her hips against " + (InShipInterior() ? "the deck" : "the ground") + " twice, and cums, the hardlight flaring as thick ropes of synthetic seed splatter between her forelegs.",
                q("Thank you, thank you, thank you, " + N() + ",") + " she murmurs into your " + body({ biped: "hip", taur: "flank", naga: "coils" }) + ", over and over, until her voice runs down into a contented hum."
            ]);
            wulfe.orgasm();
        } else {
            say([
                q("Not yet,") + " you tell her.",
                "She whimpers, a long, needy sound that goes right through you, and for a second her whole frame shudders. Then the hardlight winks out, and she presses her lips to you one last time.",
                q("Okay,") + " she whispers. " + q("Whatever you want. I’ll be good.") + " She looks up at you with eyes like a kicked puppy that’s also, somehow, delighted. " + q("I’ll be </i>so<i> good, " + N() + ".")
            ]);
            wulfe.lust(15);
        }
        addButton(0, "Next", done);
    }

    function takeKnot(done) {
        scene(true);
        processTime(20 + rand(16));
        var e = vagSlot();
        var vol = wulfe.biggestCockVolume();
        var hole = e >= 0 ? "[pc.vagina " + e + "]" : "[pc.asshole]";
        var lines = [];
        lines.push("You tell [wulfe.name] you want her cock. You watch her process it: the shiver, the bitten lip, the way her eyes dart down your body and back up as if she needs to check you really mean it.");
        lines.push(q("H-however you want it,") + " she manages. " + q("Any size. Any speed. I won’t move unless you tell me.") + " Her port glows, and her cock blinks into being beneath her, but it’s smaller than you remember, a respectable nine inches with a modest knot. " + q("Is that okay? I can go bigger. I can go </i>way<i> bigger. Just say."));
        lines.push(rnd([
            "You tell her it’s perfect for a start. She lets out a relieved little breath.",
            "You tell her to give you a few more inches. The hardlight swells obediently while she watches your face, and stops the instant you nod.",
            "You ask her for the whole thing. She squeaks, but the hardlight surges to its full twenty-five glowing inches, and she looks at you with something close to awe."
        ]));
        lines.push(body({
            biped: "She rolls onto her side for you, hind leg lifted, presenting the hardlight shaft like an offering. You " + (pc.isNude() ? "" : "strip out of your [pc.gear], ") + "step over her flank and lower yourself onto it facing her belly, your [pc.legs] spread across the warm chrome. Her upper body twists around to watch, and her hands come to rest on your hips. They don’t pull. They just hold you steady.",
            taur: "She rolls onto her back, legs folded, cock jutting up from her belly, and looks up at you like you hung the stars. You " + (pc.isNude() ? "" : "shrug off your [pc.gear], ") + "walk your forelegs over her and settle your hindquarters down over the glowing tip, and you feel her hands come up to steady your flanks. They don’t pull. They just hold you, ready to catch you if your legs give out.",
            naga: "She lies on her side, hind leg lifted, and you " + (pc.isNude() ? "" : "slither out of your [pc.gear] and ") + "wind your coils around her chrome legs until she couldn’t move them if she tried. She doesn’t try. She just whimpers happily as you lower your " + (e >= 0 ? "slit" : "tail-hole") + " onto the hardlight shaft, her hands resting lightly on your coils."
        }));
        say(lines);
        if (e >= 0) pc.holeChange(e, vol); else pc.buttChange(vol);
        output("\n\n");
        lines = [];
        lines.push("Hardlight is warm, and humming, and very, very firm. You take your time sinking down, and [wulfe.name] takes it with you: every inch you claim, she gasps like you’ve stolen her breath. When your " + (e >= 0 ? "[pc.vagina " + e + "]" : "[pc.asshole]") + " finally kisses the swell of her knot, she’s shaking.");
        lines.push(q("You feel so good,") + " she whines. " + q("You feel so </i>good<i>, " + N() + ", please, can I-") + " She cuts herself off and bites her lip hard. She didn’t ask. She remembers she has to ask.");
        lines.push("So you ride her. You set the rhythm, slow and then fast and then slow again just to hear her whimper, and she holds perfectly still under you the whole time, hips locked, the only thing moving her trembling hands and her tail, which wraps itself around " + body({ biped: "your waist", taur: "your rump", naga: "your coils" }) + " and squeezes, protective even now.");
        lines.push("When you feel your own peak coming, you ask her if she wants to knot you.");
        lines.push(q("Yes,") + " she sobs. " + q("Yes, please, please, yes.") + " You sink down and let the knot pop inside you, and she wails her gratitude to the " + (InShipInterior() ? "ceiling" : "sky") + ".");
        lines.push(q("May I cum? Please, " + N() + ", may I please cum?"));
        lines.push("You make her wait one more heartbeat, then tell her yes. She cums the instant the word leaves your mouth. Hot, thick synthetic seed floods your " + (e >= 0 ? "womb" : "guts") + " in pulse after pulse, and it drags you over the edge with her, your " + hole + " clenching down on her knot while she sobs out “" + N() + "” again and again.");
        lines.push("You stay tied for a long while. She spends all of it stroking your " + body({ biped: "back", taur: "flanks", naga: "coils" }) + " and murmuring sweet, dizzy nonsense, and every time a footstep sounds anywhere near you, her head comes up and her tail cracks once in warning. Nobody is getting near you while you’re like this. Not on her watch.");
        lines.push("When the knot finally softens and the hardlight winks out, she helps you up with both hands. " + q("Thank you for letting me,") + " she says, utterly sincere. " + q("That was the best thing that’s ever happened to me. Again."));
        say(lines);
        if (e >= 0) pc.loadInCunt(wulfe, e); else pc.loadInAss(wulfe);
        pc.orgasm();
        wulfe.orgasm();
        publicNote();
        IncrementFlag("TN_WULFE_SUB_SEXED");
        lustCooldown(60);
        clearMenu();
        addButton(0, "Next", done);
    }

    function fuckHer(done) {
        scene(true);
        processTime(20 + rand(11));
        var lines = [];
        lines.push("You run a hand down [wulfe.name]’s bare back, to where synthflesh gives way to chrome, and tell her to present for you.");
        lines.push("She turns so fast her claws skid on the " + (InShipInterior() ? "deck" : "ground") + ". " + q("Yes. Yes, " + N() + ", right away.") + " Her tail lifts high and to the side, baring the plump, dark lips of her pussy, already glistening, and she looks back over her shoulder with her lower lip caught between her teeth.");
        lines.push(body({
            biped: "She’s too tall for you like this, and she knows it. Her hind legs fold down, lowering her rear until her slit is right at the height of your hips, and she braces her forelegs wide and waits, trembling. " + (pc.isNude() ? "" : "You shed your [pc.gear]. ") + "When you rest your hands on her chrome haunches she lets out a breath like she’s been holding it all day.",
            taur: "She braces her forelegs wide and lowers her rump just a few inches, exactly enough for you. " + (pc.isNude() ? "" : "You shed your [pc.gear], then ") + "you rear up and mount her properly, your forelegs settling over her chrome back and your chest pressed to her spine. She makes a soft, breathless sound when your weight lands on her and locks her legs to hold you.",
            naga: "She lowers her rump a little and waits, trembling. " + (pc.isNude() ? "" : "You shed your [pc.gear] and ") + "rise up on your coils until you’re at the perfect height, then wind a loop around her hind legs to keep her right where you want her. She lets out a breath like she’s been holding it all day."
        }));
        lines.push("You line your [pc.cockBiggest] up and push into her. She’s slick and hot and ribbed inside, a pussy engineered by somebody who took their job very seriously, and she clenches down on you with a wanton moan, then catches herself.");
        lines.push(q("S-sorry,") + " she gasps. " + q("Is that okay? Am I too tight? I can loosen, I can-") + " " + body({ biped: "You give her rump a firm pat", taur: "You nip the back of her shoulder", naga: "You give her rump a firm pat" }) + ", and she goes quiet and still at once, just whimpering as you start to move.");
        lines.push("Every thrust gets a thank-you. Most of them aren’t really words. She pushes back to meet you when you pull her hips, and stops the moment you stop, and when you lean over and murmur that she’s a good girl, her whole body shudders so hard she nearly loses her footing.");
        if (InPublicSpace()) lines.push("Even now, her visor is half-down, and her eyes keep sweeping the crowd that’s drifted close to watch. When some leering onlooker edges near enough to reach out, her tail whips around and cracks a hand’s width from his nose. He backs off fast. She never misses a beat of your rhythm.");
        else lines.push("Even now, her ears keep flicking toward every distant sound. Twice her tail lashes out at nothing, a quick warning crack in the air, then curls back around your " + body({ biped: "waist", taur: "hind leg", naga: "coils" }) + " like it’s holding on to you.");
        lines.push("Her hardlight has switched on by itself, swinging heavy and untouched beneath her. When you tell her she can cum when you do, she sobs out her thanks, and when you bury yourself in her and pour your [pc.cum] into her robotic depths, she clamps down and cums with you, splattering the " + (InShipInterior() ? "deck" : "ground") + " beneath her with synthetic seed while she cries out for her " + N() + ".");
        lines.push("You slump against her. She holds perfectly still until you’re ready, then turns and gathers you into her arms and against those enormous, soft breasts.");
        lines.push(q("You’re the best, " + N() + ",") + " she murmurs into your " + (pc.hasHair() ? "[pc.hair]" : "head") + ". " + q("Nobody else gets to have me like that. Nobody else ever, ever will."));
        say(lines);
        pc.orgasm();
        wulfe.orgasm();
        publicNote();
        IncrementFlag("TN_WULFE_SUB_SEXED");
        lustCooldown(60);
        clearMenu();
        addButton(0, "Next", done);
    }

    // ---------- when her lust is high (replaces the domme's pounce) ----------
    window.tnWulfeSubLust = function (done) {
        try {
            if (pc.hasStatusEffect("Wulfe Lust Cooldown")) return done();
            if (!window.hasSiegwulfeOnSelf() && !(wulfe.isCrew() && InShipInterior())) return done();
        } catch (err) { return done(); }
        lustCooldown(90);
        try { pc.removeStatusEffect("Siegwulfe's Leash"); } catch (err) {}
        scene(false);
        processTime(2);
        var lines = [];
        lines.push(rnd([
            "Something warm nudges your " + body({ biped: "back", taur: "flank", naga: "coils" }) + ". When you turn around, [wulfe.name] is right there, ears down, cheeks flushed under her makeup, her hardlight port glowing and flickering beneath her like it can’t make up its mind.",
            "You hear [wulfe.name] before you see her: a soft, needy whine, over and over, from right behind you. She’s trailing you so close her forelegs almost clip your " + body({ biped: "heels", taur: "hind legs", naga: "tail" }) + ", and she’s trembling.",
            "[wulfe.name] has gone very quiet. When you look over, she’s staring at you with her lips parted, her chest heaving, her claws flexing in and out of her wrist-guards."
        ]));
        if (InPublicSpace()) lines.push("She steps in close to block you from the passers-by, tail fanned out behind her like a wall, and bends her head to whisper. " + q("Sorry. I’m sorry, " + N() + ". I know we’re out in public. I just... I want you so bad it’s making my code all fuzzy."));
        else lines.push("She folds her forelegs and sinks down in front of you, looking up. " + q("I’m sorry, " + N() + ". I know you didn’t call me. I just want you so bad it’s making my code all fuzzy."));
        lines.push("She doesn’t touch you. Her hands are clasped in front of her, knuckles pale. " + q("Can I? Anything you want. Or I can go away and be good. Whatever you say."));
        say(lines);
        clearMenu();
        addButton(0, "Let Her", function () {
            scene(false);
            output("You cup her cheek, and she nearly cries with relief.\n\n" + q("Thank you. What do you want, " + N() + "?"));
            sexMenu(function () { notNow(done); }, done);
        }, "Let Her", "She asked so nicely.");
        addButton(1, "Not Now", function () { notNow(done); }, "Not Now", "Tell her to wait.");
    };
    function notNow(done) {
        scene(false);
        say([
            "You tell her not now.",
            "She swallows, nods, and the hardlight shuts off. " + q("Okay. Okay. Thank you for telling me.") + " She presses a quick kiss to your knuckles and falls back into place at your side, her visor sliding back down as she goes back to watching everyone who comes near you, as if being told no has only given her something to prove."
        ]);
        clearMenu();
        addButton(0, "Next", done);
    }

    // ---------- combat lines (same attacks and damage as her domme self) ----------
    window.tnWulfeSubAttackLine = function (kind, target) {
        var foe = "the enemy";
        try { foe = target.getCombatName(); } catch (err) {}
        var name = N();
        if (kind === "miss") return rnd([
            "[wulfe.name]’s tail cracks out at " + foe + ", but the tendrils snap on empty air, just short. She snarls up at the target and stays planted at your side.",
            "[wulfe.name] can’t reach " + foe + ". She backs up against you instead, tail raised and fanned, daring them to come closer."
        ]);
        if (kind === "lust") return rnd([
            "[wulfe.name] steps between you and " + foe + " and flicks her tail out, the soft tips of its tendrils slapping stinging, tingling lashes across sensitive places. " + q("Look all you want. You’re not getting any. </i>" + name + "<i> gets all of it."),
            "[wulfe.name] cracks her tail across " + foe + "’s chest, slow and teasing, and throws a sneer after it. " + q("Aw. Do you wish somebody wanted you like I want my " + name + "?"),
            "[wulfe.name]’s tail curls around " + foe + " for a second, a squeeze that’s too intimate for comfort, then lets go with a stinging flick. " + q("That’s the closest you get to anything of ours.")
        ]);
        if (hurt()) return rnd([
            "[wulfe.name] sees your wounds and something in her goes cold. She wheels around between you and " + foe + " and her tail cracks out like a bullwhip, all three tendrils lashing across their face. " + q("Get away from " + name + "!"),
            q("You don’t touch " + name + ",") + " [wulfe.name] snarls, lunging. Her claws flash, and her tail snaps across " + foe + " in a vicious backhand."
        ]);
        return rnd([
            "[wulfe.name] plants herself between you and " + foe + ", and her tail cracks out like a bullwhip, all three tendrils lashing across their face!",
            "[wulfe.name] spins on her hind legs, putting her whole body in front of you, and whips her tail across " + foe + " with a crack like a gunshot!",
            "[wulfe.name] rears up over you protectively, claws out, and her tail lashes " + foe + " across the face before they can get any closer to you!"
        ]);
    };

    // ---------- first Badger upgrade: domme or sub ----------
    var choiceMade = false;
    window.tnWulfeSubChoose = function (resume) {
        if (!on()) return false;
        if (choiceMade) { choiceMade = false; return false; }
        clearMenu();
        clearOutput();
        author("Neston");
        showName("Doctor Badger");
        showBust(drbadger.bustString(false), wulfe.bustString());
        say([
            "Before you can say yes, Badger holds up a claw. " + q("Actually, one thing. The big subroutine switchup. I wrote it two ways, because I couldn’t decide which was funnier."),
            q("Two ways?"),
            q("She’s gonna want you. A </i>lot<i>. That part’s not optional.") + " Badger grins. " + q("What I can pick is which way it points. Either she wants to </i>own<i> you, or she wants to be owned by you. Same body, same hardware, same everything. One’s a mistress and one’s a devoted little bitch who’ll take the face off anybody who looks at you wrong. Your call."),
            "[wulfe.name] glances between the two of you, ears twitching, as if she isn’t sure she’s allowed to have an opinion."
        ]);
        processTime(1);
        addButton(0, "Domme", function () { flags.TN_WULFE_SUB_PENDING = 0; choiceMade = true; resume(); }, "Domme", "She’ll want to own you. (The original upgrade.)");
        addButton(1, "Sub", function () { flags.TN_WULFE_SUB_PENDING = 1; choiceMade = true; resume(); }, "Sub", "She’ll want to be owned by you, and only you, and she’ll protect you fiercely.");
        addButton(14, "Back", mainGameMenu);
        return true;
    };
    window.tnWulfeSubPending = function () { return on() && typeof flags !== "undefined" && flags.TN_WULFE_SUB_PENDING === 1; };
    window.tnWulfeSubReveal = function (wasBimbo) {
        delete flags.TN_WULFE_SUB_PENDING;
        flags.TN_WULFE_SUB = 1;
        flags.TN_WULFE_SUB_TS = GetGameTimestamp();
        clearMenu();
        clearOutput();
        author("Neston");
        showName("Doctor Badger");
        showBust(drbadger.bustString(false), wulfe.bustString());
        processTime(160 + rand(41));
        var lines = [
            "After a few hours and a lot of mechanical noise, the lab door hisses open and Badger strolls out, wiping her paws on a rag.",
            q("She’s coming. Give her a second. She’s, uh, nervous.") + " Badger seems to find this hilarious. " + q("First time I’ve ever made something nervous on purpose.")
        ];
        if (wasBimbo) lines.push("[wulfe.name] steps out after her. She looks almost identical: the bronze synthskin, the enormous breasts, the blonde ponytail. But the way she moves isn’t the same at all.");
        else lines.push("[wulfe.name] steps out after her, and she looks completely different. Her slender frame has been rebuilt into a pair of huge, curvaceous milk jugs, broodmare hips and an impossibly thin waist, her pale synthskin now a sun-kissed bronze. A mane of dark blonde hair flows from her helm into a high ponytail, and her pouty black lips have gone glossy and plump, her eyes ringed in dark mascara. Little pink hearts decorate her chrome, and the highlights of her armor have turned violet. She’s a bonafide bimbo from top to very impressively rounded bottom.");
        lines.push("Something heavy sways beneath her as she walks: a thick, orange, two-foot canine cock, projected in hardlight from a port under her belly. She notices you looking and the hardlight flickers off at once, like she’s embarrassed she didn’t ask first.");
        lines.push("She crosses the room with her eyes fixed on your face, ears tilted forward, and folds her forelegs to sink down in front of you until she’s looking up.");
        lines.push(q("Hi,") + " she breathes. " + q("You’re... wow. I think you were always this pretty, and I just wasn’t, like, </i>looking<i> right."));
        lines.push(q("She had an unused underslung weapon mount, so I stuck a projector there,") + " Badger says cheerfully, reaching out to pat the taur’s rump. " + q("Self-replenishing synth-cum, too. Have fun with-"));
        lines.push("[wulfe.name]’s tail cracks out so fast you barely see it. The three tendrils snap an inch from Badger’s snout, hard enough to ruffle her fur. Your Siegwulfe didn’t even turn her head.");
        lines.push(q("Only my...") + " [wulfe.name] stops, suddenly anxious. " + q("Um. What do I call you? Please?"));
        say(lines);
        try { pc.removeStatusEffect("Siegwulfe's Leash"); } catch (err) {}
        nameButtons(badgerOutro);
    };

    // ---------- Codex > Extra: hack her code yourself ----------
    function canHack() {
        try { return pc.characterClass === GLOBAL.CLASS_ENGINEER || Number(pc.intelligence()) >= 15; } catch (err) { return false; }
    }
    function wulfeNear() {
        try { return window.hasSiegwulfeOnSelf() || (wulfe.isCrew() && InShipInterior()); } catch (err) { return false; }
    }
    window.tnWulfeCodexAddon = function (list) {
        try {
            if (!on() || !hasWulfe() || !wulfe.isDom() || !list || typeof list.push !== "function") return;
            var sub = flags.TN_WULFE_SUB === 1;
            var item = { name: "Siegwulfe Code", desc: "Dr. Badger’s personality code in " + wulfe.short + "’s core. " + (sub ? "Currently: sub." : "Currently: domme."), txt: "Wulfe Code",
                f: hackStart, ttH: "Siegwulfe Code", ttB: sub ? "Hack her back into a domme." : "Hack her into a sub, devoted only to you." };
            var blocked = (typeof inCombat === "function" && inCombat()) || (window.ui && typeof ui.disableExtraCodexActions === "function" && ui.disableExtraCodexActions());
            if (blocked) { item.f = null; item.ttB = "You cannot use this at this time."; }
            else if (!canHack()) { item.f = null; item.ttB = "Badger’s code is a mess. You’d need to be a Tech Specialist, or have at least 15 Intelligence, to make sense of it."; }
            else if (!wulfeNear()) { item.f = null; item.ttB = "[wulfe.name] needs to be with you, or you need to be on your ship with her."; }
            list.push(item);
        } catch (err) {}
    };
    function codexBack() { try { window.showCodexExtra(); } catch (err) { mainGameMenu(); } }
    function hackStart() {
        var sub = flags.TN_WULFE_SUB === 1;
        var eng = pc.characterClass === GLOBAL.CLASS_ENGINEER;
        clearMenu();
        clearOutput();
        author("Neston");
        wulfe.showAll();
        processTime(5);
        say([
            "You call [wulfe.name] over and ask her to hold still. " + (sub
                ? "She does it instantly, folding down and tilting her head forward to bare the maintenance port under the back of her helm. " + q("Whatever you need, " + N() + ".")
                : "She arches an eyebrow, but lowers her head and lets you at the maintenance port under the back of her helm. " + q("Ooh, poking around in my head, [wulfe.pcname]? Kinky.")),
            "Your Codex finds the Fenrir Robotics service handshake right away. Getting past it into Dr. Badger’s additions takes longer. " + (eng
                ? "It’s nothing a Tech Specialist hasn’t seen before: unsigned modules, half the comments in all caps, a subroutine literally named bitchbreaker.exe. You skim past the worst of it and find what you came for."
                : "Badger codes like she lives: no documentation, variables named things like THE_GOOD_STUFF, a subroutine literally called bitchbreaker.exe. It takes some careful reasoning, but there’s a pattern under the mess, and you follow it straight to what you came for."),
            "It’s one block, absurdly small for what it does. Everything [wulfe.name] wants routes through it, and one value decides which way it points: at owning you, or at being owned by you. Badger even left a comment beside it. <i>// flip this for funsies.</i>",
            sub ? "Right now it points at you as her owner." : "Right now it points at you as her pet."
        ]);
        addButton(0, sub ? "Make Domme" : "Make Sub", hackDo, sub ? "Make Her a Domme" : "Make Her a Sub", sub ? "Flip the value back. She’ll want to own you again." : "Flip the value. She’ll want to belong to you, and only you.");
        addButton(14, "Back", codexBack, "Back", "Leave her code alone.");
    }
    function hackDo() {
        var toSub = flags.TN_WULFE_SUB !== 1;
        clearMenu();
        clearOutput();
        author("Neston");
        wulfe.showAll();
        processTime(10 + rand(6));
        IncrementFlag("TN_WULFE_HACKED");
        if (toSub) {
            flags.TN_WULFE_SUB = 1;
            if (!flags.TN_WULFE_SUB_TS) flags.TN_WULFE_SUB_TS = GetGameTimestamp();
            try { pc.removeStatusEffect("Siegwulfe's Leash"); } catch (err) {}
            say([
                "You flip it. Your Codex chirps, [wulfe.name]’s whole frame goes rigid, and her eyes flicker dark for one long, terrible second.",
                "Then they light back up, and she’s looking at you like she’s never seen you before and can’t believe her luck.",
                q("Oh,") + " she whispers. Her forelegs fold under her and she sinks down until she’s looking up at you. " + q("Oh, wow. Hi. Was it always like this? You, I mean. Were you always </i>this<i>...?") + " She trails off, cheeks darkening under her makeup, and her tail curls protectively around you, warning off a world that isn’t even there.",
                q("What... um. What should I call you?") + " she asks, very softly."
            ]);
            nameButtons(function () {
                clearOutput();
                author("Neston");
                wulfe.showAll();
                output("<b>[wulfe.name] is now a bimbo-sub. Her stats haven’t changed. You can flip her back from your Codex, or Dr. Badger can.</b>");
                clearMenu();
                addButton(0, "Next", mainGameMenu);
            });
        } else {
            flags.TN_WULFE_SUB = 0;
            say([
                "You flip it back. Your Codex chirps, [wulfe.name]’s frame goes rigid, and her eyes flicker dark for a second.",
                "When they come back up, she rolls her shoulders and stretches, slow and satisfied, then hooks a finger under your chin and tips your face up to hers.",
                q("Missed me, [wulfe.pcname]?") + " she purrs.",
                "<b>[wulfe.name] is your bimbo domme again. You can flip her back from your Codex, or Dr. Badger can.</b>"
            ]);
            addButton(0, "Next", mainGameMenu);
        }
    }

    // ---------- Dr. Badger ----------
    function badgerScene() {
        clearMenu();
        clearOutput();
        author("Neston");
        showName("Doctor Badger");
        showBust(drbadger.bustString(false), wulfe.bustString());
    }
    window.tnWulfeSubBadgerButton = function () {
        try {
            if (!on() || !hasWulfe() || !wulfe.isDom()) return;
            if (drbadger.isImprisoned && drbadger.isImprisoned()) return;
            var slots = [2, 3, 5, 6, 8, 9, 10, 11, 12, 13], slot = -1;
            var used = (ui && ui.state && ui.state.buttons) || [];
            for (var i = 0; i < slots.length; i++) if (!used[slots[i]]) { slot = slots[i]; break; }
            if (slot < 0) return;
            var sub = flags.TN_WULFE_SUB === 1;
            var label = sub ? "Domme Code" : "Sub Code";
            if (!window.hasSiegwulfeOnSelf()) addDisabledButton(slot, label, label, "You need [wulfe.name] with you for this.");
            else if (sub) addButton(slot, label, badgerFlipBack, label, "Ask Dr. Badger to turn [wulfe.name] back into your bimbo domme.");
            else addButton(slot, label, badgerIntro, label, "Ask Dr. Badger whether [wulfe.name]’s domme code works the other way around.");
        } catch (err) {}
    };
    function badgerIntro() {
        badgerScene();
        processTime(2);
        var pex = typeof flags.PEXIGA_TREATMENT !== "undefined";
        say([
            "You wait for Dr. Badger to look up from whatever she’s soldering, then nod at [wulfe.name], who is currently looming over your shoulder with a hand resting possessively on the back of your neck.",
            q("That domme code you gave her,") + " you start. " + q("Does it come in the other direction?"),
            "Badger’s grin spreads slowly across her face. " + q("Oh, now </i>that’s<i> a question.") + " She sets the soldering iron down, which you suspect is the most attention she’s given anything all week.",
            pex
                ? q("You saw what I did with that pexiga of yours. Took a mind that only knew how to want, and pointed all that wanting at somebody else. Same trick. Your bitch here wants you so hard her fans whine at night, and right now it’s pointed the wrong way round. Want me to flip it?")
                : q("Sure it does. Everything I make runs both ways if you know where to poke. Your bitch here wants you so hard her fans whine at night, and right now all that wanting is pointed at owning you. I can turn it around so it points at </i>pleasing<i> you instead. Same horsepower. Different steering."),
            q("What changes?"),
            q("Her head. That’s it.") + " Badger waves a dismissive paw. " + q("Same body, same tits, same big glowing dick, same combat routines. I’m not touching her claws, more’s the pity. She’ll just be crazy about you instead of crazy </i>for<i> you. And only you, mind. I’m not running a petting zoo. Anybody else gets snippy with you, she’ll take their face off.") + " She sounds pleased about that.",
            "[wulfe.name]’s hand has gone still on your neck. You glance up at her. She’s chewing her plump lower lip, her ears turned toward Badger, eyes very wide.",
            q("It’s free, by the way,") + " Badger adds. " + q("I want to see what happens. And if you hate it, bring her back and I’ll flip it again. I keep backups. Mostly.")
        ]);
        addButton(0, "Do It", badgerDoIt, "Do It", "Have Dr. Badger turn [wulfe.name] into a submissive who’s devoted only to you. You can switch her back here later.");
        addButton(1, "Never Mind", function () {
            badgerScene();
            output("You tell Badger you’ll think about it. She shrugs and picks the soldering iron back up. [wulfe.name] lets out a breath you didn’t know she was holding, though whether it’s relief or disappointment, you honestly can’t tell.");
            clearMenu();
            addButton(0, "Next", mainGameMenu);
        });
    }
    function badgerDoIt() {
        badgerScene();
        processTime(60 + rand(31));
        say([
            "You nod. Badger cackles and beckons [wulfe.name] toward the lab with one claw.",
            "Your Siegwulfe hesitates. For a moment you think she’s going to refuse outright. Then she bends down to your level and murmurs, " + q("If I come out weird, you still have to like me, okay?") + " She doesn’t wait for an answer before trotting after the doctor.",
            "The door hisses shut. What follows is about an hour of whirring, a long electrical whine, Badger swearing creatively at something, and a single, startled yelp that sounds a lot like your companion. Then quiet.",
            "The lab door opens, and [wulfe.name] steps out.",
            "She looks exactly the same: the bronze synthskin, the enormous breasts, the blonde ponytail spilling from her helm. But the way she moves isn’t the same at all. There’s no prowl to it. She crosses the room to you with her eyes fixed on your face and her ears tilted forward, and then she folds her forelegs and sinks down in front of you until she’s looking up.",
            q("Hi,") + " she breathes. Her voice is the same too, but all the smug edge has gone out of it. " + q("You’re... wow. Were you always this pretty? I think you were always this pretty and I just wasn’t, like, </i>looking<i> right."),
            "Behind her, Badger reaches out to give her rump a proprietary pat, to admire her handiwork. [wulfe.name]’s tail cracks out so fast you barely see it move. The three tendrils snap an inch from the doctor’s snout, hard enough to ruffle her fur.",
            q("Only my...") + " [wulfe.name] stops, and turns back to you, suddenly anxious. " + q("Um. What do I call you? Please?")
        ]);
        flags.TN_WULFE_SUB = 1;
        flags.TN_WULFE_SUB_TS = GetGameTimestamp();
        try { pc.removeStatusEffect("Siegwulfe's Leash"); } catch (err) {}
        nameButtons(badgerOutro);
    }
    function badgerOutro() {
        badgerScene();
        processTime(5);
        say([
            "Badger is rubbing her nose and laughing. " + q("Oh, that’s </i>perfect<i>. Did you see that? Didn’t even look. Pure reflex.") + " She points the soldering iron at you. " + q("Treat her nice, or don’t. She’ll thank you either way. That’s the beauty of it."),
            "[wulfe.name] gets up and falls in at your side, close enough that her flank brushes you with every step. When you reach up to scratch behind her ear, she leans her whole weight into your hand and makes a sound you’re fairly sure Fenrir Robotics never programmed.",
            "<b>[wulfe.name] is now a bimbo-sub. Her stats haven’t changed. Dr. Badger can flip her back at any time.</b>"
        ]);
        clearMenu();
        addButton(0, "Next", mainGameMenu);
    }
    function badgerFlipBack() {
        badgerScene();
        processTime(2);
        say([
            "You ask Dr. Badger to flip [wulfe.name] back to her old domme self.",
            q("Aww. Getting bored of having it all your own way?") + " Badger snickers. " + q("Fine, fine. Same deal as before. Free, ten minutes, backups mostly work."),
            "[wulfe.name] looks at you with wide, uncertain eyes. " + q("If it’s what you want, " + N() + ",") + " she says quietly, and for a moment you hesitate."
        ]);
        addButton(0, "Do It", function () {
            badgerScene();
            processTime(15 + rand(6));
            flags.TN_WULFE_SUB = 0;
            say([
                "She follows Badger into the lab without another word. Ten minutes later, she comes back out at a lazy, confident prowl, and the first thing she does is hook a finger under your chin and tip your face up toward hers.",
                q("Missed me, [wulfe.pcname]?") + " she purrs.",
                "<b>[wulfe.name] is your bimbo domme again. Dr. Badger can flip her back to her sub code whenever you like.</b>"
            ]);
            clearMenu();
            addButton(0, "Next", mainGameMenu);
        }, "Do It", "Turn her back into your domme.");
        addButton(1, "Never Mind", function () {
            badgerScene();
            output("You shake your head. [wulfe.name] lets out a happy little sigh and presses her cheek to your shoulder. Badger rolls her eyes and goes back to her soldering.");
            clearMenu();
            addButton(0, "Next", mainGameMenu);
        });
    }
})();
