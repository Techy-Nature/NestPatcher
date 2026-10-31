/* Stella D'Amore. Beach recruit, ship crew, her own scenes with the shore swapped for the ship. */

function tnStellaOnCrew() {
    try { return typeof flags !== "undefined" && flags.TN_STELLA_CREW === 1; }
    catch (err) { return false; }
}
function tnStellaReconcileToggle() {
    if (!tnStellaOnCrew()) return;
    if ((window.tnModMenuActive===true&&typeof window.isTnModEnabled==="function") &&
        !window.isTnModEnabled("tn.stella") &&
        (window.tnModMenuActive===true&&typeof window.setTnModEnabled==="function")) {
        window.setTnModEnabled("tn.stella", true);
        console.warn("[TN Stella] Auto-enabled: loaded a save with Stella aboard.");
    }
}
window.tnStellaEnabled = function () {
    if (tnStellaOnCrew()) {
        tnStellaReconcileToggle();
        return true;
    }
    return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled("tn.stella");
};
setInterval(tnStellaReconcileToggle, 500);
// Retry for up to 2 minutes; stop after 3 seconds if no TN menu is running.
(function tnStellaRegister(tries) {
    tries = tries || 0;
    if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) {
        if (!(window.tnModMenuActive === false && tries >= 6) && tries < 240) setTimeout(function () { tnStellaRegister(tries + 1); }, 500);
        return;
    }
    window.registerModMenu({id:"tn.stella", name:"Stella D'Amore", author:"Kitty",
        description:"Recruitment, ship cabin and crew interaction. WARNING: Unrecruit Stella before disabling. Loading a save with Stella aboard automatically enables this mod.", supportsToggle:true,
        getHtml:function () { return tnStellaOnCrew() ? "<b>WARNING:</b> Stella is currently on your crew. Unrecruit her before disabling." : "Stella is not currently aboard; disabling is allowed."; },
        onEnabledChange:function(next) {
            if (!next && tnStellaOnCrew()) {
                if (typeof window.alert === "function") window.alert("Unrecruit Stella before disabling this mod.");
                return false;
            }
            return true;
        }});
})();

window.tnStellaPlace = function () {
    var bits = "";
    try { if (typeof getFullCurrentLocation === "function") bits += " " + getFullCurrentLocation(); } catch (e) {}
    try { if (typeof getCurrentLocation === "function") bits += " " + getCurrentLocation(); } catch (e2) {}
    try { if (typeof getShipLocation === "function") bits += " " + getShipLocation(); } catch (e3) {}
    bits = String(bits).toUpperCase();
    var planet = "deep space";
    if (bits.indexOf("TAVROS") >= 0) planet = "Tavros Station";
    else if (bits.indexOf("MHEN") >= 0) planet = "Mhen'ga";
    else if (bits.indexOf("TARKUS") >= 0) planet = "Tarkus";
    else if (bits.indexOf("TEXAS") >= 0) planet = "New Texas";
    else if (bits.indexOf("MYRELLION") >= 0) planet = "Myrellion";
    else if (bits.indexOf("UVETO") >= 0) planet = "Uveto";
    else if (bits.indexOf("DHAAL") >= 0) planet = "Dhaal";
    else if (bits.indexOf("CANAD") >= 0) planet = "Canadia Station";
    return "while the ship is at " + planet;
};

window.tnStellaShipOn = function () {
    if (!window.tnStellaEnabled()) return;
    flags.TN_STELLA_ON_SHIP = 1;
};

window.tnStellaRun = function (fn) {
    if (typeof fn !== "function") {
        clearOutput();
        output("Stella tilts her head. Her scenes have not loaded yet. Step onto the beach once so the game can arm them, then come back.");
        clearMenu();
        addButton(0, "Back", window.tnStellaCabin);
        return;
    }
    window.tnStellaShipOn();
    fn();
};

(function tnStellaWrapOutput() {
    if (window.tnStellaOutputWrapped || typeof output !== "function") return;
    window.tnStellaOutputWrapped = true;
    var orig = output;
    output = window.output = function (s) {
        if (window.tnStellaEnabled() && typeof flags !== "undefined" && flags.TN_STELLA_ON_SHIP === 1 && typeof s === "string") {
            var place = window.tnStellaPlace();
            s = s.replace(/back to the beach/g, "back to your cabin");
            s = s.replace(/further up the beach/g, "further down the corridor");
            s = s.replace(/up the beach/g, "down the corridor");
            s = s.replace(/on the beach/g, "on your ship, " + place);
            s = s.replace(/at the beach/g, "on your ship, " + place);
            s = s.replace(/to the beach/g, "through your ship");
            s = s.replace(/on your ship, while the ship is at/g, "on your ship, while you are at");
            s = s.replace(/beachside vendor/g, "vendor by the airlock");
            s = s.replace(/life at the beach/g, "life in a bikini");
        }
        var args = [s];
        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
        return orig.apply(this, args);
    };
})();

window.tnStellaBeachEmpty = function () {
    if (!window.tnStellaEnabled()) { if (typeof mainGameMenu === "function") mainGameMenu(); return; }
    clearOutput();
    clearBust();
    clearName();
    author("Wsan");
    output(blockHeader("The Beach"));
    output("Your mouth drops open momentarily. It’s like you’ve really set your foot on another world entirely, transported in an instant across the universe to a serene beach. A clear blue sky with wisps of white clouds floating through it stretches endlessly before you, and as you descend the stairs onto the beach proper you find your [pc.feet] met with the soft, warm crunch of golden sand shifting beneath you. Seagulls cry out in the distance, the sounds of waves crashing and people playing on the shore ring in your ears. For just a moment... it’s like you’re back on Earth.");
    output("\n\nYou walk the waterline for a while. A group of guys and girls your age calls you over for volleyball, and you leave with sand in your clothes and a couple of decent saves. The upper deck is quiet. The chair there is empty. Stella isn’t in it. She’s on your ship.");
    processTime(15);
    clearMenu();
    addButton(0, "Back", mainGameMenu, "Back", "Leave the beach.");
};

window.tnStellaRecruit = function () {
    if (!window.tnStellaEnabled()) { if (typeof mainGameMenu === "function") mainGameMenu(); return; }
    clearOutput();
    author("Wsan");
    if (typeof mN === "function") mN();
    else { showBust("STELLA"); showName("Stella"); }
    output("<i>“Oooh, for real?”</i> Stella’s ears shoot up and her fluffy tail whips the chair. <i>“You want your little doggie on your ship? Like, not just when you buy a beach pass and come play?”</i>");
    output("\n\n<i>“That’s the idea.”</i>");
    output("\n\nShe bounces, and the leopard-print bikini puts up a losing fight. <i>“Then yeah! Stella’s totally coming with you, " + pc.mf("big boy", "hottie") + ". Lemme grab my stuff, this bikini’s not gonna walk itself.”</i> She hooks her arm through yours, crystal blue eyes bright. <i>“Beach is fun, but a whole ship? That’s, like, so much more room to be a good girl.”</i>");
    flags.TN_STELLA_CREW = 1;
    flags.MET_STELLA = 1;
    window.tnStellaInstall();
    processTime(15);
    clearMenu();
    addButton(0, "Next", mainGameMenu, "Next", "Stella is coming aboard.");
};

window.tnStellaCabin = function () {
    if (!window.tnStellaEnabled()) { if (typeof mainGameMenu === "function") mainGameMenu(); return; }
    flags.TN_STELLA_ON_SHIP = 0;
    clearOutput();
    clearBust();
    author("Wsan");
    showBust(flags.STELLA_PREGNANT ? "STELLA_PREG" : "STELLA");
    showName("Stella");
    output("Stella is sprawled on the bunk, leopard print losing the fight against her tits, tail thumping the mattress.");
    output("\n\n<i>“Yoohoo! Come play, baby!”</i>");
    clearMenu();
    var preg = typeof window.tnStellaPregnant === "function" && window.tnStellaPregnant();
    addButton(0, "Appearance", function () { window.tnStellaRun(window.tnStellaLook); }, "Appearance", "Look at your beach puppy.");
    addButton(1, "Talk", function () { window.tnStellaRun(window.tnStellaTalk); }, "Talk", "Let her chatter.");
    if (pc.cockThatFits && pc.cockThatFits(550) >= 0) {
        addButton(5, "Pussy Fuck", function () { window.tnStellaRun(window.tnStellaPussy); }, "Pussy Fuck", "Take her on the bunk.");
        addButton(6, "Ass Fuck", function () { window.tnStellaRun(window.tnStellaAss); }, "Ass Fuck", "Use her ass.");
        if (preg) addButton(9, "Preg Sex", function () { window.tnStellaRun(window.tnStellaPreg); }, "Preg Sex", "She’s pregnant.");
        else if (void 0 === flags.STELLA_FUCKED) addDisabledButton(9, "Breed", "Breed", "Maybe start with a regular fuck before moving up to breeding.");
        else if (void 0 === flags.STELLA_GAVE_ORAL) addDisabledButton(9, "Breed", "Breed", "How can you knock up a girl when you haven’t even done oral?");
        else if (void 0 === flags.STELLA_BUTTFUCKED) addDisabledButton(9, "Breed", "Breed", "You could at least try out her butt first...");
        else addButton(9, "Breed", function () { window.tnStellaRun(window.tnStellaBreed); }, "Breed", "Fuck Stella until she’s probably pregnant.");
    } else if (pc.hasCock()) {
        addDisabledButton(5, "Pussy", "Pussy", "You’re too big to fit into the puppy-bimbo!");
        addDisabledButton(6, "Ass Fuck", "Ass Fuck", "You’re too big to fit into the puppy-bimbo!");
    } else {
        addDisabledButton(5, "Pussy", "Pussy", "You need a penis for this.");
        addDisabledButton(6, "Ass Fuck", "Ass Fuck", "You need a penis for this.");
    }
    if (pc.hasCock()) addButton(7, "Blowjob", function () { window.tnStellaRun(window.tnStellaBlow); }, "Blowjob", "Put that doggy tongue to work.");
    else addDisabledButton(7, "Blowjob", "Blowjob", "She can’t suck your dick if you don’t have one!");
    if (pc.hasVagina()) addButton(8, "Get Licked", function () { window.tnStellaShipOn(); if (typeof window.tnStellaBlow === "function") window.tnStellaBlow(true); else window.tnStellaRun(); }, "Get Licked", "Let her munch.");
    else addDisabledButton(8, "Get Licked", "Get Licked", "She can’t munch your rug if you’ve got hardwood flooring.");
    if (pc.hasVagina() || (pc.cockThatFits && pc.cockThatFits(550) >= 0)) addButton(10, "Walk", function () { window.tnStellaRun(window.tnStellaWalk); }, "Walk", "Walkies. The route changes with whatever planet the ship is at.");
    else addDisabledButton(10, "Walk", "Walk", "You need genitals for this.");
    addButton(14, "Back", mainGameMenu, "Back", "Leave Stella to the bunk.");
};

window.tnStellaInstall = function () {
    if (typeof chars === "undefined" || typeof flags === "undefined") return;
    if (flags.TN_STELLA_CREW !== 1 || !window.tnStellaEnabled()) return;
    if (chars.STELLA && typeof chars.STELLA.isCrew === "function") return;
    var no = function () { return false; };
    chars.STELLA = {
        a: "Stella",
        short: "Stella",
        nameDisplay: function () { return "Stella"; },
        getClassName: function () { return "StellaDAmore"; },
        isCrew: function () { return flags.TN_STELLA_CREW === 1 && window.tnStellaEnabled(); },
        isRecruited: function () { return flags.TN_STELLA_CREW === 1 && window.tnStellaEnabled(); },
        freeRent: false,
        processTime: function () {},
        hasPerk: no,
        hasVagina: function () { return true; },
        isPregnant: no,
        hasWombPregnancy: no,
        fertility: function () { return 0; },
        crewBlurb: function (slot) {
            if (!this.isCrew()) return "";
            addButton(slot, "Stella", window.tnStellaCabin, "Stella", "Your beach puppy is aboard.");
            return "\n\nStella D’Amore has a bunk and a pile of bikinis. She counts toward your crew.";
        }
    };
};

(function tnStellaBoot() {
    if (typeof flags === "undefined" || typeof addButton !== "function") {
        setTimeout(tnStellaBoot, 400);
        return;
    }
    window.tnStellaInstall();
    if (!window.tnStellaWatch) window.tnStellaWatch = setInterval(window.tnStellaInstall, 1000);
})();
