    /* ================= 5. Order (slave) / Request (free) ================= */
    FIX[2608] = [["{crewCount<1, or, Roo alone on crew:", "{rooAlone:"]];
    K.rooAlone = function () { return crewOthers() === 0; };

    COND[2355] = function () { return slave() && CTX.first && !highLust(); };
    COND[2363] = function () { return slave() && !CTX.first && !highLust(); };
    COND[2369] = function () { return slave() && highLust(); };
    COND[2377] = function () { return free() && CTX.first && !highLust(); };
    function freeFirstP(p) { return function () { return free() && CTX.first && !highLust() && persona() === p; }; }
    COND[2379] = freeFirstP("bimbo"); COND[2387] = freeFirstP("bro"); COND[2393] = freeFirstP("kind");
    COND[2403] = freeFirstP("misch"); COND[2411] = freeFirstP("hard"); COND[2417] = function () { return false; };
    COND[2421] = function () { return free() && !CTX.first && !highLust(); };
    COND[2429] = function () { return free() && highLust(); };
    function orderIntro() {
        scene();
        var k = slave() ? "TN_ROO_ORDERED" : "TN_ROO_REQUESTED";
        CTX.first = !flags[k]; flags[k] = 1;
        doc(2355, 2435);
        pcLust(3);
        orderMenu();
    }
    function orderBack() { scene(); output(slave() ? "Roo waits at attention for your next instruction." : "Roo swings her legs off the edge of the bed. <i>“Anything else?”</i>"); orderMenu(); }
    function orderMenu() {
        clearMenu();
        var cl = function (slot) {
            if (!flags.TN_ROO_TALK_SLAVERY) addDisabledButton(slot, "???", "???", "Talk to Roo about her past a bit more first.");
            else if (milky() && flags.TN_ROO_CLOTHES_MILKSEEN) addDisabledButton(slot, "Clothing", "Clothing", "While Roo is lactating, she won’t be wearing any clothes. Therefore, you can’t adjust them!");
            else addButton(slot, "Clothing", clothing, "Clothing", slave() ? "Decide what your slave is to wear while she remains on the ship." : "Roo would be willing to get scantily clad for you, if you asked nicely. Or lewdly." + (hired() ? " You could also see about her uniform." : ""));
        };
        var er = function (slot) {
            if (flags.TN_ROO_TALK_HERSELF) addButton(slot, "Ears", earsMenu, "Ears", ears() === "bunny" ? "Decide on what to do with Roo’s ears - perhaps she’d look better with her cat ears again?" : "Decide on what to do with Roo’s ears - giving her bunny ears again sounds nice...");
            else addDisabledButton(slot, "???", "???", "Ask Roo about herself first.");
        };
        var pn = function (slot) {
            if (flags.TN_ROO_TALK_SIBS) addButton(slot, "Pet Names", petNames, "Pet Names", "Set a special name for her to use on you during sex, and perhaps for her, too.");
            else addDisabledButton(slot, "???", "???", "Talk to Roo about her brother and sister first.");
        };
        var mk = function (slot) {
            if (!flags.TN_ROO_TALK_PLUTUS) addDisabledButton(slot, "???", "???", "Ask Roo about Plutus first.");
            else btn(slot, "Milkies", milkies, !milky(), slave() ? "See about giving Roo’s boobs a milkier quality." : "Roo’s breasts would look so much better if she had any milk. Would she be willing to take some lactaid for you?", slave() ? "Your kaithrit is already gushing like a dairy slave. Extra doses of lactaid would be completely superfluous." : "Roo is already lactating - any further dose right now would be pointless. Gotta get her milked, first!");
        };
        if (slave()) {
            addButton(0, "Masturbation", masturbation, "Masturbation", "Decide if you’ll allow your slave to masturbate or not.");
            addButton(1, "The Crew", theCrew, "The Crew", "Set a rule that will determine if Roo can mingle with the other members of your crew.");
            addButton(2, "Beg 4 Relief", function () { relief(true); }, "Beg for Relief", "Instruct your slave on how to properly ask you for relief.");
            addButton(3, "OutsideFrdm", outside, "Outside Freedom", "Decide whether your kaithrit is allowed any outside freedom.");
            cl(5); er(6); pn(7); mk(8);
        } else {
            addButton(0, "Ask 4 Relief", function () { relief(false); }, "Ask for Relief", "It’s only natural that Roo is going to get aroused over time and need relief same as anyone. This would make it a bit more fun...");
            mk(1);
            addButton(2, "Vibrators", vibratorsReq, "Vibrators", "Roo’s vibrators were a badge of office whilst a slave. Does she really need to wear them <i>all</i> the time?");
            cl(5);
            addButton(6, "Collar", collarReq, "Collar", collar() ? "Roo is wearing her collar at the moment. Maybe it’s time to change that..." : "Although Roo is no longer a slave, she made it clear she’d be happy to wear the collar again. If it pleases you. Does it?");
            er(7); pn(8);
        }
        addButton(14, "Back", function () { backToRoo(); });
    }

    /* ---------- Masturbation (slave) ---------- */
    COND[2471] = function () { return CTX.first && !highLust(); };
    COND[2483] = function () { return !CTX.first && !highLust(); };
    COND[2491] = highLust;
    function masturbation() {
        scene(); CTX.first = !flags.TN_ROO_MASTURB_ASKED; flags.TN_ROO_MASTURB_ASKED = 1;
        doc(2471, 2495);
        clearMenu();
        addButton(0, "Allow Mstrbtn", function () {
            scene();
            doc(2507, 2507);
            var wasBanned = !canMasturbate();
            flags.TN_ROO_NO_MASTURBATE = 0;
            if (highLust() && wasBanned) { next(masturbateShow); return; }
            if (highLust()) { next(masturbateShow); return; }
            pcLust(3); orderMenu();
        }, "Allow Masturbation", "Let her take care of herself.");
        addButton(1, "No Mstrbation", function () {
            scene();
            doc(2515, 2515);
            flags.TN_ROO_NO_MASTURBATE = 1;
            pcLust(3); orderMenu();
        }, "No Masturbation", "Her pleasure is yours to give.");
    }
    function bodyIs(b) { return function () { return body() === b; }; }
    COND[2539] = function () { return hasCock() && body() !== "taur"; };
    COND[2545] = function () { return P.pussOnly() && body() !== "taur"; };
    COND[2549] = function () { return hasCock() && body() === "taur"; };
    COND[2553] = function () { return P.pussOnly() && body() === "taur"; };
    COND[2557] = M;
    COND[2563] = COND[2539]; COND[2567] = COND[2545]; COND[2571] = COND[2549]; COND[2575] = COND[2553]; COND[2579] = M;
    function masturbateShow() {
        scene(true);
        doc(2523, 2583);
        timePass(20, 30);
        rooCums(2);
        if (hasGenitals()) pcCum(); else pcLust(20);
        next(mainGameMenu);
    }

    /* ---------- The Crew (slave) ---------- */
    COND[2606] = function () { return !!CTX.first; }; COND[2614] = function () { return !CTX.first; };
    function theCrew() {
        scene(); CTX.first = !flags.TN_ROO_CREW_ASKED; flags.TN_ROO_CREW_ASKED = 1;
        doc(2606, 2618);
        clearMenu();
        addButton(0, "Allow Crew", function () { scene(); doc(2629, 2629); flags.TN_ROO_NO_CREW = 0; pcLust(2); orderMenu(); }, "Allow Crew", "She can socialize with your crew.");
        addButton(1, "No Crew", function () { scene(); doc(2636, 2636); flags.TN_ROO_NO_CREW = 1; pcLust(2); orderMenu(); }, "No Crew", "She keeps to herself unless you’re around.");
    }

    /* ---------- Outside freedom (slave) ---------- */
    COND[2684] = function () { return !!CTX.first; }; COND[2692] = function () { return !CTX.first; };
    function outside() {
        scene(); CTX.first = !flags.TN_ROO_OUT_ASKED; flags.TN_ROO_OUT_ASKED = 1;
        doc(2684, 2694);
        clearMenu();
        addButton(0, "Allow Outside", function () { scene(); doc(2705, 2705); flags.TN_ROO_NO_OUTSIDE = 0; orderMenu(); }, "Allow Outside", "She can stretch her legs in port.");
        addButton(1, "No Outside", function () { scene(); doc(2713, 2713); flags.TN_ROO_NO_OUTSIDE = 1; orderMenu(); }, "No Outside", "She stays aboard.");
    }

    /* ---------- Clothing ---------- */
    COND[2756] = function () { return !!CTX.first; }; COND[2766] = function () { return !CTX.first; };
    COND[3480] = COND[2756]; COND[3490] = COND[2766];
    function clothing() {
        scene();
        if (milky()) {
            flags.TN_ROO_CLOTHES_MILKSEEN = 1;
            if (slave()) doc(2737, 2739); else doc(3461, 3463);
            next(function () { scene(); if (slave()) doc(2749, 2751); else doc(3473, 3475); orderMenu(); });
            return;
        }
        CTX.first = !flags.TN_ROO_CLOTHES_ASKED; flags.TN_ROO_CLOTHES_ASKED = 1;
        if (slave()) doc(2756, 2770); else doc(3480, 3494);
        CLOTHES_CHANGED = false;
        dressMenu();
    }
    var CLOTHES_CHANGED = false;
    var DRESS = [ // [label, from-state, to-state, textA, textB, tooltip]
        ["Jacket", 0, 1, 2802, 2806, "Make her take off her jacket.", 2812, 2818, "Make her put on her jacket.", "Roo must be wearing her skirt before she can wear her jacket again."],
        ["Skirt", 1, 2, 2826, 2832, "Have Roo take off that silly skirt.", 2840, 2846, "Have Roo put her skirt back on.", "Roo will need to be wearing her shirt before she can wear her skirt again."],
        ["Shirt", 2, 3, 2854, 2862, "That shirt’s in the way of her boobs. Maybe get it off?", 2870, 2876, "Roo should cover up a little, as strange as that sounds. Have her wear that sleeveless shirt again!", "Roo cannot put her shirt on without first having her panties back on."],
        ["Panties", 3, 4, 2884, 2894, "Roo is only wearing her panties now - those need to go, eventually.", 2902, 2910, "Have Roo put on some underwear. It’s probably so cold without them!", ""]
    ];
    function dressMenu() {
        clearMenu();
        var c = clothes();
        DRESS.forEach(function (d, i) {
            if (c === 5) { addDisabledButton(i, "UN.E: " + d[0], "UN.E: " + d[0], "She’s zipped into her Steele Tech uniform. Have her change out of it first."); return; }
            if (c === d[1]) addButton(i, "UN.E: " + d[0], function () { dressDo(d[3], d[4], d[2]); }, "Unequip: " + d[0], d[5]);
            else if (c === d[2]) addButton(i, "E: " + d[0], function () { dressDo(d[6], d[7], d[1]); }, "Equip: " + d[0], d[8]);
            else if (c < d[1]) addDisabledButton(i, "UN.E: " + d[0], "Unequip: " + d[0], "Roo needs to take off the layers above it first.");
            else addDisabledButton(i, "E: " + d[0], "Equip: " + d[0], d[9] || "Not yet.");
        });
        btn(5, "Wear All", wearAll, c !== 0, "Roo needs to look <i>really</i> erotic. Have her get all her normal clothes back on.", "She’s already fully dressed.");
        btn(6, "Wear Nothing", wearNothing, c !== 4, "Everything off!", "She’s already naked.");
        if (free() && hired()) btn(7, "W. Steele", wearSteele, c !== 5, "Have Roo put on her Steele Tech uniform.", "She’s already wearing it.");
        addButton(14, "Back", dressBack, "Back", "Roo is the way you want her right now.");
    }
    function dressDo(a, b, to) {
        scene();
        doc(a, b);
        flags.TN_ROO_CLOTHES = to; CLOTHES_CHANGED = true;
        showRoo();
        pcLust(4 + rnd(4));
        dressMenu();
    }
    COND[2920] = function () { return CTX.from === 1; }; COND[2924] = function () { return CTX.from === 2; };
    COND[2928] = function () { return CTX.from === 3; }; COND[2932] = function () { return CTX.from === 4 || CTX.from === 5; };
    COND[2936] = M;
    function wearAll() {
        scene(); CTX.from = clothes();
        doc(2918, 2940);
        flags.TN_ROO_CLOTHES = 0; CLOTHES_CHANGED = true; showRoo();
        pcLust(6);
        dressMenu();
    }
    COND[2953] = function () { return CTX.from === 0; }; COND[2965] = function () { return CTX.from === 1; };
    COND[2975] = function () { return CTX.from === 2; }; COND[2985] = function () { return CTX.from === 3; };
    COND[3001] = function () { return CTX.from === 5; }; COND[3002] = M;
    function wearNothing() {
        scene(); CTX.from = clothes();
        doc(2951, 3008);
        if (CTX.from === 5) {
            byUs();
            output("\n\n" + txt("(Roo’s uniform zipper rasps all the way down to her tailbone, and the black-and-gold catsuit peels off her like a banana skin. She kicks it off one foot and flings it at the dresser with a whoop.)"));
        }
        flags.TN_ROO_CLOTHES = 4; CLOTHES_CHANGED = true; showRoo(true);
        pcLust(10);
        dressMenu();
    }
    function wearSteele() {
        ourScene();
        say(["You tell Roo to suit up. Company uniform. She lights up like you’ve handed her a medal.",
            "<i>“Ooh, the work clothes!”</i> She hops off the bed and digs the black-and-gold catsuit out of her dresser, shaking it out with a snap. {rooNude: She’s already naked, so it’s a matter of stepping in one foot at a time, wiggling the tight fabric up over her hips with a series of little bounces that do incredible things to her chest. / else: Her other clothes come off in a careless heap first, and then she steps into the suit one foot at a time, wiggling the tight fabric up over her hips with a series of little bounces that do incredible things to her chest.}",
            "The zipper is the real show. Roo drags it up from her navel slowly, and you watch the slick material close over her chest, packing her breasts in until they sit high and proud under the Steele Tech logo. Her nipples still dent the fabric. The suit hides <i>nothing.</i>",
            "<i>“Ta-da! Roo Caci, trainee, reporting for duty!”</i> She salutes you, then ruins it by giggling. <i>“Anno says it breathes really well. She’s right. It also squeaks when I sit down, so I’m going to need you to pretend you don’t hear that.”</i>"]);
        flags.TN_ROO_CLOTHES = 5; CLOTHES_CHANGED = true; showRoo();
        pcLust(6);
        dressMenu();
    }
    COND[3022] = function () { return CLOTHES_CHANGED; }; COND[3028] = function () { return !CLOTHES_CHANGED; };
    COND[3580] = COND[3022]; COND[3586] = COND[3028];
    function dressBack() {
        scene();
        if (slave()) doc(3022, 3030); else doc(3580, 3588);
        orderMenu();
    }

    /* ---------- Ears ---------- */
    COND[3047] = function () { return !!CTX.first; }; COND[3061] = function () { return !CTX.first; };
    COND[3079] = function () { return ears() === "cat"; }; COND[3085] = function () { return ears() === "bunny"; };
    COND[3109] = function () { return ears() === "bunny"; }; COND[3115] = function () { return ears() === "cat"; };
    function earsMenu() {
        scene(); CTX.first = !flags.TN_ROO_EARS_ASKED; flags.TN_ROO_EARS_ASKED = 1;
        doc(3047, 3069);
        clearMenu();
        var nep = invFind("Nepeta") >= 0;
        if (ears() === "cat") addButton(0, "Cat Ears", function () { earsDo("cat"); }, "Cat Ears", "Keep her cat ears.");
        else btn(0, "Cat Ears", function () { earsDo("cat"); }, nep || credits() >= EAR_PRICE, nep ? "Feed her your Nepeta." : "Order some Nepeta for her. (" + EAR_PRICE + " credits)", "You need " + EAR_PRICE + " credits or some Nepeta.");
        if (ears() === "bunny") addButton(1, "Bunny Ears", function () { earsDo("bunny"); }, "Bunny Ears", "Keep her bunny ears.");
        else btn(1, "Bunny Ears", function () { earsDo("bunny"); }, credits() >= EAR_PRICE, "Order a Laquine Ears medipen. (" + EAR_PRICE + " credits)", "You need " + EAR_PRICE + " credits.");
        addButton(14, "Back", orderBack);
    }
    function earsDo(which) {
        scene();
        if (which === "cat") doc(3079, 3101); else doc(3109, 3131);
        if (which !== ears()) {
            if (which === "cat") { if (!invTake("Nepeta")) pc.credits -= EAR_PRICE; }
            else pc.credits -= EAR_PRICE;
            flags.TN_ROO_EARS = which;
            timePass(30, 60);
            next(mainGameMenu);
        } else { timePass(2); next(orderBack); }
    }

    /* ---------- Pet names ---------- */
    COND[3157] = function () { return !!CTX.first; }; COND[3173] = function () { return !CTX.first; };
    COND[3644] = COND[3157]; COND[3656] = COND[3173];
    function petNames() {
        scene(); CTX.first = !flags.TN_ROO_PETNAMES_ASKED; flags.TN_ROO_PETNAMES_ASKED = 1;
        if (slave()) doc(3157, 3177);
        else {
            doc(3644, 3660);
            byUs();
            var a = flags.TN_ROO_PCTITLE, b = flags.TN_ROO_ROOTITLE;
            if (!a && !b) output("\n\nThere are no pet names set for you or Roo.");
            else {
                if (a) output("\n\nCurrently, Roo is calling you <b>" + a + "</b> " + (b ? "and you are referring to her as <b>" + b + "</b>." : "and you are not referring to her with any name."));
                else output("\n\nCurrently, you are calling Roo <b>" + b + "</b> and she is not referring to you with any name.");
            }
        }
        petMenu();
    }
    function petMenu() {
        clearMenu();
        addButton(0, "Give Name", function () { petInput("roo"); }, "Give Name", "Set a pet name to call Roo by.");
        addButton(1, "Set Name", function () { petInput("pc"); }, "Set Name", "Set a pet name for Roo to call you by.");
        btn(2, "Clear Names", function () {
            scene();
            flags.TN_ROO_PCTITLE = undefined; flags.TN_ROO_ROOTITLE = undefined;
            if (slave()) doc(3226, 3230); else doc(3711, 3715);
            orderMenu();
        }, !!(flags.TN_ROO_PCTITLE || flags.TN_ROO_ROOTITLE), "Go back to plain names.", "No pet names are set.");
        addButton(14, "Back", function () { scene(); if (slave()) doc(3236, 3238); else doc(3721, 3723); orderMenu(); });
    }
    function petInput(who) {
        clearOutput(); showRoo(); byUs();
        output(who === "roo" ? "Type in your pet name for Roo. (16 characters at most)" : "Type in a pet name for Roo to call you by. (16 characters at most)");
        if (typeof displayInput === "function") displayInput();
        clearMenu();
        addButton(0, "Next", function () {
            var v = (typeof getInputText === "function" ? String(getInputText() || "") : "").trim();
            var bad = !v || v.length > 16 || (typeof hasIllegalInput === "function" && hasIllegalInput(v));
            if (bad) {
                clearOutput(); byUs();
                output("<b>That name won’t work.</b> Use 1 to 16 letters, and nothing the game doesn’t allow.");
                if (typeof removeInput === "function") removeInput();
                next(function () { petInput(who); }, "Try Again");
                return;
            }
            if (typeof removeInput === "function") removeInput();
            scene();
            CTX.petName = v;
            if (who === "roo") { flags.TN_ROO_ROOTITLE = v; if (slave()) doc(3193, 3199); else doc(3682, 3688); }
            else { flags.TN_ROO_PCTITLE = v; if (slave()) doc(3210, 3218); else doc(3697, 3705); }
            CTX.petName = undefined;
            orderMenu();
        });
        addButton(14, "Back", function () { if (typeof removeInput === "function") removeInput(); petNames(); });
    }

    /* ---------- Milkies ---------- */
    COND[3261] = function () { return !!CTX.first; }; COND[3279] = function () { return !CTX.first; };
    function milkies() {
        scene(); CTX.first = !flags.TN_ROO_MILK_ASKED; flags.TN_ROO_MILK_ASKED = 1;
        doc(3261, 3287);
        clearMenu();
        btn(0, "Give Lactaid", giveLactaid, credits() >= LACTAID_PRICE, "Order a dose of Tresorvoir. (" + LACTAID_PRICE + " credits)", "You need " + LACTAID_PRICE + " credits for the Tresorvoir.");
        addButton(1, "Maybe Later", function () { scene(); doc(3340, 3340); orderMenu(); }, "Maybe Later", "Not right now.");
    }
    function giveLactaid() {
        scene(); CTX.repeat = (flags.TN_ROO_LACTAIDS || 0) > 0;
        doc(3298, 3314);
        pc.credits -= LACTAID_PRICE;
        flags.TN_ROO_MILK = 100; flags.TN_ROO_MILK_EMPTY_TS = undefined;
        inc("TN_ROO_LACTAIDS");
        showRoo(true);
        pcLust(15);
        timePass(30, 45);
        milkyChoices();
    }
    function milkyChoices() {
        clearMenu();
        btn(0, "Milky Titfuck", function () { window.tnRooSex("milkytitfuck"); }, hasCock(), "Mount Roo and screw her boobs to another spectacular titgasm.", "You need a cock for this.");
        btn(1, "Nursing HJ", function () { window.tnRooSex("nursing"); }, hasGenitals(), "Lie in her lap and nurse while she gets you off.", "You need something for her to play with down there.");
        addButton(2, "Boob Play", function () { window.tnRooSex("boobplay"); }, "Boob Play", "Those swollen tits need attention.");
        addButton(3, "Drink Milk", function () { window.tnRooSex("drinkmilk"); }, "Drink Milk", "Straight from the tap.");
        addButton(4, "Not Now...", function () { scene(true); doc(3326, 3330); next(mainGameMenu); }, "Not Now", "Leave her sloshing.");
    }
    H.milkyChoices = milkyChoices;

    /* ---------- Collar (free) ---------- */
    COND[3392] = function () { return CTX.first && flags.TN_ROO_BOUGHT_FREE === 1; };
    COND[3406] = function () { return CTX.first && flags.TN_ROO_BOUGHT_FREE !== 1; };
    COND[3416] = function () { return !CTX.first; };
    function collarReq() {
        scene(); CTX.first = !flags.TN_ROO_COLLAR_ASKED; flags.TN_ROO_COLLAR_ASKED = 1;
        doc(3392, 3420);
        clearMenu();
        addButton(0, "Wear Collar", function () { scene(); doc(3430, 3430); flags.TN_ROO_COLLAR = 1; orderMenu(); }, "Wear Collar", "She looks good in silver.");
        addButton(1, "No Collar", function () { scene(); doc(3438, 3438); flags.TN_ROO_COLLAR = 0; orderMenu(); }, "No Collar", "Leave her neck bare.");
    }

    /* ---------- Vibrators (free) ---------- */
    COND[3783] = function () { return !!CTX.first; }; COND[3801] = function () { return !CTX.first; };
    function vibratorsReq() {
        scene(); CTX.first = !flags.TN_ROO_VIBES_ASKED; flags.TN_ROO_VIBES_ASKED = 1;
        doc(3783, 3805);
        if (!CTX.first && silly()) output("\n\n" + para(3806).replace(/^\{silly:\s*/, "") + "\n\n" + para(3808));
        clearMenu();
        addButton(0, "Take Vibes Out", function () { scene(); doc(3820, 3822); flags.TN_ROO_VIBES_IN = 0; flags.TN_ROO_VIBES = 0; orderMenu(); }, "Take Vibes Out", "She doesn’t need to wear them all the time.");
        addButton(1, "Put Vibes In", function () { scene(); doc(3830, 3832); flags.TN_ROO_VIBES_IN = 1; pcLust(5); orderMenu(); }, "Put Vibes In", "Keep the fun close at hand.");
    }
