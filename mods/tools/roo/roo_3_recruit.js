    /* ================= 3. Treasure Nova: Roo is fired, Plutus' back office, buying her ================= */
    function eligible() {
        try {
            if (flags.MET_ROO === undefined) return false;
            if ((flags.ROO_CREDIT_OVERALL || 0) < UNLOCK_CREDITS) return false;
            return pc.hasKeyItem(PantyData.get("Roo").panty);
        } catch (e) { return false; }
    }
    H.eligible = eligible;
    function gameDay() { return Math.floor(now() / 1440); }

    /* Called from the blackjack room (TN_RooCrew_v2.9.mod). Return true = we handled Roo's table. */
    window.tnRooFloor = function (slot) {
        if (!ready() || !modOn()) return false;
        var st = flags.TN_ROO_STATE;
        if (st === undefined) {
            if (!eligible()) return false;
            if (flags.TN_ROO_ELIG_DAY === undefined) { flags.TN_ROO_ELIG_DAY = gameDay(); return false; }
            if (gameDay() <= flags.TN_ROO_ELIG_DAY || hours < 12) return false;
            flags.TN_ROO_STATE = st = 1;
            flags.TN_ROO_HELD_TS = now();
        }
        if (st === 1 && now() > flags.TN_ROO_HELD_TS + HOLD_MIN) flags.TN_ROO_STATE = st = 4;
        if (st === 1) {
            if (flags.TN_ROO_PROMPTED === undefined) {
                output("\n\n" + para(359));
                addButton(slot, "Roo?", promptScene, "Roo?", "Where is she?");
            } else {
                output("\n\nRoo’s table at the middle of the floor is still dark, her chair pushed in. One of the silver-suited guards catches your eye and gives you the smallest nod toward the back of the hall.");
                if (flags.TN_ROO_OFFICE_SEEN === undefined) addButton(slot, "Meet Boss", function () { meetBoss(false); }, "Meet Boss", "Hit up a member of security to escort you into the back office for that meeting with the boss.");
                else addButton(slot, "Back Office", officeAgain, "Back Office", "Head back to Plutus’ office. Roo is waiting there.");
            }
            return true;
        }
        if (st === 4) output("\n\nA new dealer runs the table at the center of the room now, an eager young ausar with too much hair gel. <b>Roo is gone</b>, and nobody on the floor will say where.");
        else output("\n\nA sylvan-eared man deals at the table that used to be Roo’s. He’s good at it, but the seat beside him doesn’t feel half as inviting without a bunny-eared kaithrit grinning at you over the cards.");
        addButton(slot, "Back Office", officeEmpty, "Back Office", "Peek at the old back office.");
        return true;
    };

    function promptScene() {
        clearOutput(); showPlutus(); byWilliam(); CTX = {};
        if (typeof showName === "function") showName("Casino\nSecurity");
        flags.TN_ROO_PROMPTED = 1;
        doc(361, 365);
        clearMenu();
        addButton(0, "Meet Boss", function () { meetBoss(true); }, "Meet Boss", "Couldn’t hurt. Maybe you’ll find out something about Roo at any rate?");
        addButton(1, "Later", function () {
            clearOutput(); byWilliam(); doc(377, 379); next(mainGameMenu);
        }, "Later", "Maybe not just this second...");
    }

    function meetBoss(firstOffer) {
        clearOutput(); showPlutus(); byWilliam(); CTX = { firstOffer: firstOffer };
        doc(391, 405);
        next(function () {
            clearOutput(); showPlutus(); byWilliam();
            doc(413, 447);
            showRoo();
            doc(449, 475, null, true);
            flags.TN_ROO_OFFICE_SEEN = 1;
            officeButtons();
        });
    }

    function officeAgain() {
        clearOutput(); showRoo(); byWilliam(); CTX = {};
        output(para(345));
        output("\n\nPlutus waves a hand at you without looking away from his game. <i>“Back already, " + (isFem() ? "sweetie" : "buddy") + "? Clock’s tickin’.”</i> Roo straightens on the couch and gives you a small, hopeful smile.");
        var left = Math.max(1, Math.ceil((flags.TN_ROO_HELD_TS + HOLD_MIN - now()) / 1440));
        output("\n\n<b>(Plutus will hold her for about " + left + " more day" + (left === 1 ? "" : "s") + ". Price: " + PRICE.toLocaleString() + " credits.)</b>");
        officeButtons();
    }

    function officeEmpty() {
        clearOutput(); byWilliam(); CTX = {};
        if (typeof clearBust === "function") clearBust();
        output(para(349));
        next(mainGameMenu, "Back");
    }

    function officeButtons() {
        clearMenu();
        var room = crewSpace(), cash = credits() >= PRICE;
        var why = !room ? "You don’t have any available space on your ship for another person. See to that issue first." : "You can’t afford her. Plutus wants " + PRICE.toLocaleString() + " credits.";
        btn(0, "Buy: Slave", buySlave, room && cash, "Purchase Roo - as your slave. (" + PRICE.toLocaleString() + " credits)", why);
        btn(1, "Buy: Free", buyFree, room && cash, "Purchase Roo, and make her a free woman again. (" + PRICE.toLocaleString() + " credits)", why);
        addButton(2, "Not Now", notNow, "Not Now", "You can’t make this decision yet.");
    }

    function notNow() {
        clearOutput(); showPlutus(); byWilliam();
        CTX = { first: flags.TN_ROO_NOTNOW === undefined };
        inc("TN_ROO_NOTNOW");
        doc(489, 501);
        next(mainGameMenu);
    }

    function buyCommon(asSlave) {
        pc.credits -= PRICE;
        flags.TN_ROO_STATE = 2;
        flags.TN_ROO_SLAVE = asSlave ? 1 : 0;
        flags.TN_ROO_COLLAR = 1;
        flags.TN_ROO_BOUGHT_FREE = asSlave ? undefined : 1;
        flags.TN_ROO_RECRUIT_TS = now();
        flags.TN_ROO_TICK_TS = now();
        flags.TN_ROO_LUST = 20;
        flags.TN_ROO_VIBES_IN = 1;
        flags.TN_ROO_VIBES = 0;
        flags.TN_ROO_CLOTHES = 0;
        flags.TN_ROO_EARS = "bunny";
        flags.ROO_STRIP_LEVEL = 0;
    }

    function buySlave() {
        clearOutput(); showRoo(); byWilliam(); CTX = {};
        buyCommon(true);
        doc(521, 541);
        next(function () {
            clearOutput(); showRoo(); byWilliam();
            doc(549, 565);
            clearMenu();
            addButton(0, "Order: Undress", function () {
                clearOutput(); showRoo(); byWilliam();
                doc(583, 609);
                pcLust(10 + rnd(10)); addLust(10 + rnd(10));
                next(welcome);
            }, "Order: Undress", "Make her show her chest.");
            addButton(1, "Order: Kneel", function () {
                clearOutput(); showRoo(); byWilliam();
                doc(627, 639);
                pcLust(15 + rnd(15)); addLust(15 + rnd(15));
                next(welcome);
            }, "Order: Kneel", "Get her to assume a position.");
            addButton(2, "Move On", function () {
                clearOutput(); showRoo(); byWilliam();
                doc(657, 657);
                next(welcome);
            }, "Move On", "There’ll be <i>plenty</i> of time for this later...");
        });
    }

    function buyFree() {
        clearOutput(); showRoo(); byWilliam(); CTX = {};
        buyCommon(false);
        doc(677, 697);
        next(function () {
            clearOutput(); showRoo(); byWilliam();
            doc(705, 719);
            clearMenu();
            addButton(0, "Hug Her", function () {
                clearOutput(); showRoo(); byWilliam();
                doc(737, 745);
                pcLust(5); addLust(5);
                next(welcome);
            }, "Hug Her", "If she’s offering, why not?");
            addButton(1, "Pet Her", function () {
                clearOutput(); showRoo(); byWilliam();
                doc(761, 771);
                next(welcome);
            }, "Pet Her", "If she’s that happy, give her a reason to be happier!");
            addButton(2, "Move On", function () {
                clearOutput(); showRoo(); byWilliam();
                doc(785, 789);
                next(welcome);
            }, "Move On", "This can wait.");
        });
    }

    COND[589] = function () { return lib() < 33; };
    COND[593] = function () { return lib() >= 33 && lib() < 67; };
    COND[597] = function () { return lib() >= 67; };
    COND[601] = M;
    COND[391] = function () { return !!CTX.firstOffer; };
    COND[395] = function () { return !CTX.firstOffer; };
    COND[399] = M;
    COND[489] = function () { return !!CTX.first; };
    COND[497] = function () { return !CTX.first; };
    COND[808] = slave; COND[824] = free; COND[844] = M;

    function welcome() {
        clearOutput(); showRoo(); byWilliam(); CTX = {};
        doc(804, 846);
        next(function () {
            clearOutput(); byWilliam();
            if (typeof clearBust === "function") clearBust();
            if (typeof showName === "function") showName("RGB\nDatasticks");
            doc(854, 870);
            clearMenu();
            var opts = [
                ["Turn On - Low", 1, 886, 888, "Put it on low. You’ll turn it off after a while. Won’t you?"],
                ["Turn On - Med", 2, 906, 908, "Medium for now. That’ll get her ready for... something!"],
                ["Turn On - High", 3, 926, 928, "Maximum power! Couldn’t hurt, right?"],
                ["Overcharge!", 4, 948, 950, "Let’s be honest, you just want to hear a catgirl cum."],
                ["Nah...", 0, 970, 970, "There’ll be time to play with these later!"]
            ];
            opts.forEach(function (o, i) {
                addButton(i, o[0], function () {
                    clearOutput(); byWilliam();
                    doc(o[2], o[3]);
                    if (o[1] === 4) { overchargeEffects(); }
                    else flags.TN_ROO_VIBES = o[1];
                    timePass(24, 55);
                    output("\n\n" + para(980));
                    next(function () {
                        if (typeof window.enterPCShip === "function") { try { window.enterPCShip(true, true); return; } catch (e) {} }
                        mainGameMenu();
                    });
                }, o[0], o[4]);
            });
        });
    }

    function overchargeEffects() {
        flags.TN_ROO_VIBES = 0;
        flags.TN_ROO_OC_TS = now();
        flags.TN_ROO_OC_BLURB = 1;
        rooCums(1);
        setLust(5);
    }
