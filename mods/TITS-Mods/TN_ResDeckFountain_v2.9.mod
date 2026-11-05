Name: Residential Deck Wishing Fountain
Author: Neston
# TN_ResDeckFountain - NestPatcher mod (TiTS 0.9.168), Modv2.9
# Adds a small rock wishing fountain to Tavros' residential deck, in the North-East Plaza
# (Fisianna's corner, by the benches farthest from the elevators).
#   - Stacked river rock, a bubbling spring, koi fish and dwarf banana plants. It bubbles
#     along while people sit on the benches talking (random flavor each visit).
#   - "Make a Wish" button: toss a credit in.
#   - Amber (crew) has a new "Geocaching" talk: she hides little caches on every station she
#     visits, and she's the one who put the koi and banana plants in the fountain (a cutting
#     from her greenhouse). She feeds the fish every other day. Afterwards you can check her
#     cache at the fountain.
#   - Hand So's Redemption mentions it in the moth scene when this mod is on.
# Toggle: Options -> Android Mods -> "Wishing Fountain". In-game author: Neston.

Replace [content_tavros.js]:
window.fisiAtResDeckAddendum(0),!1}
With:
window.tnFountainRoom&&window.tnFountainRoom(),window.fisiAtResDeckAddendum(0),!1}

Replace [content_follower.js]:
,addButton(14,"Back",window.amberInTheHold)}function @@g@@(){if(clearOutput(),amber.header(),output("<i>“Do you wanna talk about your past, Amber?”</i>
With:
,window.tnAmberGeoButton&&window.tnAmberGeoButton(7),addButton(14,"Back",window.amberInTheHold)}function @@g@@(){if(clearOutput(),amber.header(),output("<i>“Do you wanna talk about your past, Amber?”</i>

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
            description: "A little rock wishing fountain with koi and banana plants on Tavros' residential deck (North-East Plaza), plus Amber's Geocaching talk about how it got its fish.",
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
            ? " The koi are crowding the near edge today, mouths popping at the surface. A little hand-painted sign wedged between two rocks reads: <i>PLEASE DON’T FEED THE FISH, I DO IT! (every other day) - Amber</i>"
            : " A little hand-painted sign wedged between two rocks reads: <i>PLEASE DON’T FEED THE FISH, I DO IT! (every other day) - Amber</i>";
        if (flags.TN_AMBER_GEO === 1) t += " You know there’s a geocache tucked under the flattest rock on the far side.";
        return t;
    };
    window.tnFountainRoom = function () {
        if (!on() || typeof flags === "undefined") return;
        try {
            output(F.describe());
            addButton(1, "Make a Wish", F.wish, "Make a Wish", "Toss a credit into the fountain.");
            if (flags.TN_AMBER_GEO === 1) addButton(2, "Amber’s Cache", F.cache, "Amber’s Cache", "Check the geocache Amber hid under the rocks.");
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
            }) + " and tip up the flattest rock. Underneath, sealed in a little waterproof capsule, is Amber’s geocache: a tiny logbook, a stub of pencil, and a handful of trinkets people have swapped in and out."
        ];
        if (n === 0) lines.push("The first page has a doodle of a koi and Amber’s loopy handwriting: <i>You found it!! Sign the log and leave something nice. Take something nice. Don’t feed my fish.</i> You sign your name under a dozen others and swap in a spare button for a polished bit of sea glass.");
        else lines.push(rnd([
            "There are three new names in the log since you were last here. One of them has drawn a very detailed fish.",
            "Someone has left a tiny folded paper crane in the capsule. You leave it where it is.",
            "The log has a new entry in Amber’s handwriting: <i>fed the fish. they were SO hungry. (they were not hungry)</i>",
            "Someone has swapped in a glittery sticker of a moth. You smile and put it back."
        ]));
        say(lines);
        flags.TN_FOUNTAIN_CACHE = n + 1;
        processTime(5);
        clearMenu();
        addButton(0, "Next", mainGameMenu);
    };

    /* ---------- Amber: Geocaching ---------- */
    window.tnAmberGeoButton = function (slot) {
        if (!on() || typeof flags === "undefined") return;
        try {
            if (window.amber && typeof amber.dumbfuckDoses === "function" && amber.dumbfuckDoses() >= 3) {
                addDisabledButton(slot, "Geocaching", "Geocaching", "Amber’s head isn’t really in a hobby-talking place right now.");
                return;
            }
        } catch (err) {}
        addButton(slot, "Geocaching", F.amberGeo, "Geocaching", "Ask Amber about the little hidden caches she keeps mentioning.");
    };
    F.amberGeo = function () {
        clearOutput();
        try { amber.header(); } catch (err) { try { showName("AMBER"); } catch (e2) {} }
        author("Neston");
        var first = flags.TN_AMBER_GEO !== 1;
        var lines = [
            "You ask Amber about the geocaches she keeps mentioning.",
            "Her ears shoot straight up and her tail starts flicking. " + q("Oh! Okay, so, geocaching is like... a treasure hunt that never ends,") + " she gushes. " + q("You hide a little waterproof box somewhere neat, with a logbook and some trinkets, and you post where it is, kinda. Not exactly. Just a hint. Then people find it, sign the log, swap a trinket, and hide it again for the next person!") + " She bounces a little on all four hooves. " + q("I’ve got one on almost every station we’ve docked at."),
            q("Okay, but my favorite one is on Tavros,") + " she goes on, lowering her voice like she’s sharing a secret. " + q("On the residential deck, in the corner past the palm trees, way past the elevators. There was this sad little rock fountain there by the benches. Like, it bubbled and everything, but there was nothing <i>in</i> it."),
            q("So I took a cutting off one of the banana plants in my greenhouse,") + " she says proudly, " + q("and I planted it right in the rocks, and it took! It’s two now. And then I thought, a pond needs fish, so I got some koi.") + " She giggles. " + q("Nobody ever asked me who put them there. I think everybody figures the station did it."),
            q("I feed them every other day,") + " she adds, very seriously. " + q("Not every day. They’ll tell you they’re starving. They are lying. They are <b>so</b> fat, [pc.name]."),
            q("Oh, and my cache is under the flattest rock on the far side,") + " she whispers, nudging you. " + q("Go sign the log next time you’re there, okay? And don’t feed my fish.")
        ];
        if (!first) lines = [
            "You ask Amber how her geocaches are doing.",
            q("The Tavros one’s super popular now!") + " she beams. " + q("Somebody left a little paper crane in it. And somebody else drew one of my koi in the logbook, and honestly? It looked just like Biscuit. That’s the fat orange one.") + " She sighs happily. " + q("I fed them yesterday. Or the day before. Every other day, [pc.name]. It’s a whole system.")
        ];
        say(lines);
        flags.TN_AMBER_GEO = 1;
        processTime(10);
        clearMenu();
        addButton(0, "Next", function () { if (typeof window.amberInTheHold === "function") window.amberInTheHold(); else mainGameMenu(); });
    };
})();
