Name: Residential Deck Wishing Fountain
Author: Neston
# TN_ResDeckFountain - NestPatcher mod (TiTS 0.9.168), Modv2.9
# Adds a small rock wishing fountain to Tavros' residential deck, in the North-East Plaza
# (Fisianna's corner, by the benches farthest from the elevators).
#   - Stacked river rock, a bubbling spring, koi fish and dwarf banana plants. It bubbles
#     along while people sit on the benches talking (random flavor each visit).
#   - "Make a Wish" button: toss a credit in.
#   - Aina (the centaur mare on the residential deck): her "Astrocaching" talk gets a new
#     ending. She's the one who put the koi and banana plants in the fountain (a cutting from
#     one of her own plants), feeds the fish every other day, and hid her own astrocache
#     there, which you can then check at the fountain.
#   - Hand So's Redemption mentions it in the moth scene when this mod is on.
# Toggle: Options -> Android Mods -> "Wishing Fountain". In-game author: Neston.

Replace [content_tavros.js]:
window.fisiAtResDeckAddendum(0),!1}
With:
window.tnFountainRoom&&window.tnFountainRoom(),window.fisiAtResDeckAddendum(0),!1}

Replace [content_tavros.js]:
you could sort of say that,”</i> you cough."),processTime(5),@@e@@(@@s@@)}
With:
you could sort of say that,”</i> you cough."),window.tnAinaFountain&&window.tnAinaFountain(),processTime(5),@@e@@(@@s@@)}

Add Javascript:
(function () {
    "use strict";
    if (window.__tnFountainLoaded) return;
    window.__tnFountainLoaded = true;

    var MOD_ID = "tn.resdeck-fountain";
    var F = {};
    window.tnFountain = F;

    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    window.tnFountainOn = on;
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Wishing Fountain",
            author: "Neston",
            description: "A little rock wishing fountain with koi and banana plants on Tavros' residential deck (North-East Plaza), plus a new part of Aina's Astrocaching talk about how it got its fish.",
            supportsToggle: true
        });
        return true;
    }
    if (!register()) {
        var regTries = 0;
        var regTimer = setInterval(function () { if (register() || ++regTries >= 150) clearInterval(regTimer); }, 200);
    }

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
    function dayNow() { return typeof days === "number" ? days : 0; }
    function feedingDay() { return dayNow() % 2 === 0; }
    function body(o) {
        try { if (pc.isTaur && pc.isTaur()) return o.taur; if (pc.isNaga && pc.isNaga()) return o.naga; } catch (err) {}
        return o.biped;
    }

    var BUBBLES = [
        "Two residents on the bench beside it are deep in conversation, and the fountain bubbles along under their voices like it’s trying to join in.",
        "An old couple shares a bench by the water, talking quietly about nothing much. Every time one of them laughs, the fountain seems to burble a little louder.",
        "A pair of teenagers sit on the back of a bench arguing about a holo-show, while the spring gurgles up between the stones in steady little bursts.",
        "Someone on the nearest bench is on a call, murmuring into their Codex. The fountain bubbles politely in the pauses.",
        "A few office workers on their break crowd one bench, trading gossip over coffee, and the water chuckles over the rocks beside them.",
        "The benches are nearly empty for once, and without any talk to compete with, you can hear every soft bubble and plink of the spring."
    ];
    F.describe = function () {
        var t = "\n\nPast the palms, beside the benches farthest from the elevators, sits a small wishing fountain built from rough, stacked river rock. A spring bubbles up through the stones at its center and spills over the lip into a shallow pool, where a handful of fat koi, orange and white and ink-spotted, drift lazily in the shade of a pair of dwarf banana plants growing right up out of the rocks. Coins glint on the bottom.";
        t += " " + rnd(BUBBLES);
        t += feedingDay()
            ? " The koi are crowding the near edge today, mouths popping at the surface. A little hand-painted sign wedged between two rocks reads: <i>PLEASE DON’T FEED THE FISH, I DO IT! (every other day) - Aina</i>"
            : " A little hand-painted sign wedged between two rocks reads: <i>PLEASE DON’T FEED THE FISH, I DO IT! (every other day) - Aina</i>";
        if (flags.TN_AINA_FOUNTAIN === 1) t += " You know Aina’s astrocache is tucked under the flattest rock on the far side.";
        return t;
    };
    window.tnFountainRoom = function () {
        if (!on() || typeof flags === "undefined") return;
        try {
            output(F.describe());
            addButton(1, "Make a Wish", F.wish, "Make a Wish", "Toss a credit into the fountain.");
            if (flags.TN_AINA_FOUNTAIN === 1) addButton(2, "Aina’s Cache", F.cache, "Aina’s Cache", "Check the astrocache Aina hid under the rocks.");
        } catch (err) { console.warn("[TN] Wishing fountain", err); }
    };
    F.wish = function () {
        clearOutput();
        author("Neston");
        var lines = [];
        if (pc.credits < 1) {
            lines.push("You pat your pockets. Not a single credit. The koi look at you with what you’re pretty sure is pity.");
        } else {
            pc.credits -= 1;
            lines.push(body({
                biped: "You fish a credit chit out of your pocket, close your eyes, and flick it into the fountain.",
                taur: "You fish a credit chit out of your pack, lean over the low rock wall on your forelegs, close your eyes, and flick it into the fountain.",
                naga: "You fish a credit chit out of your pack, coil up beside the low rock wall, close your eyes, and flick it into the fountain."
            }) + " It lands with a soft <i>plink</i>.");
            lines.push(rnd([
                "A koi noses at it, decides it isn’t food, and drifts off, deeply unimpressed. You’re choosing to take that as a good sign.",
                "The spring burbles up right where it sank, like the fountain is thinking it over.",
                "On the nearest bench, someone breaks off their conversation to give you a little thumbs-up.",
                "A banana leaf dips in the air from the vents and drops a single bead of water onto the spot where your chit sank. Seems official."
            ]));
            IncrementFlag("TN_FOUNTAIN_WISHES");
        }
        processTime(2);
        clearMenu();
        addButton(0, "Next", mainGameMenu);
    };
    F.cache = function () {
        clearOutput();
        author("Neston");
        var n = Number(flags.TN_FOUNTAIN_CACHE) || 0;
        var lines = [
            body({
                biped: "You crouch down by the far side of the fountain",
                taur: "You fold your forelegs and kneel down by the far side of the fountain",
                naga: "You lower your coils beside the far side of the fountain"
            }) + " and tip up the flattest rock. Underneath, sealed in a little waterproof capsule, is Aina’s astrocache: a little digital logbook and a handful of swag people have traded in and out."
        ];
        if (n === 0) lines.push("The logbook’s first entry is from Aina, with a little koi doodle: <i>One star! Welcome, treasure hunter! Take some swag, leave some swag of equal value. Please don’t feed my fish!</i> You sign your name under a dozen others and swap in a spare button for a polished bit of sea glass.");
        else lines.push(rnd([
            "There are three new names in the log since you were last here. One of them has drawn a very detailed fish.",
            "Someone has left a tiny folded paper crane in the capsule. You leave it where it is.",
            "The log has a new entry from Aina: <i>fed the fish!! they acted SO hungry. (they were not hungry)</i>",
            "Someone has swapped in a glittery sticker of a moth. You smile and put it back."
        ]));
        say(lines);
        flags.TN_FOUNTAIN_CACHE = n + 1;
        processTime(5);
        clearMenu();
        addButton(0, "Next", mainGameMenu);
    };

    /* ---------- Aina: Astrocaching talk, new ending ---------- */
    window.tnAinaFountain = function () {
        if (!on() || typeof flags === "undefined") return;
        try {
            var lines = [];
            if (flags.TN_AINA_FOUNTAIN !== 1) {
                lines.push("Aina’s tail swishes, and she taps another blue dot on her CPS, this one just around the corner from her apartment. " + q("Oh! A-and this one’s mine. My very first one. It’s only one star, but I’m really proud of it."));
                lines.push(q("You know the little rock fountain in the north-east plaza? By the benches way past the elevators?") + " She shifts her weight between her forehooves, a little shy. " + q("When I moved in, it was just... bubbling away with nothing in it. It seemed so sad. So I took a cutting from one of my own banana plants and planted it right between the rocks, and it took! There are two of them now."));
                lines.push(q("And a pond needs fish, right? So I added some koi.") + " She giggles, cheeks pink. " + q("Nobody ever asked who put them there. I think everyone just figures the station did it. I-I feed them every other day. Not every day! They’ll act like they’re starving, but they are <i>so</i> fat, [pc.name]."));
                lines.push(q("My cache is under the flattest rock on the far side,") + " she whispers, like it’s a state secret. " + q("Go sign the log sometime, okay? Leave some swag. And please don’t feed my fish."));
            } else {
                lines.push("Aina swipes back to the dot by the fountain and beams. " + q("My cache is getting so popular! Somebody left a little paper crane in it. And somebody drew one of my koi in the log, and it looked just like Biscuit. That’s the fat orange one.") + " She sighs happily. " + q("Every other day, [pc.name]. It’s a whole system."));
            }
            for (var i = 0; i < lines.length; i++) output("\n\n" + lines[i]);
            flags.TN_AINA_FOUNTAIN = 1;
        } catch (err) { console.warn("[TN] Wishing fountain (Aina)", err); }
    };
})();
