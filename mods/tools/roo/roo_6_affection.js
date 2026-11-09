    /* ================= 6. Pet / Hug / Kiss / Grope, their ambushes, Sleep With, Free / Hire / Evict ================= */
    FIX[4491] = [["{lust > = 33:", "{pcLust33:"]];
    K.pcLust33 = function () { try { return pc.lust() >= 33; } catch (e) { return false; } };
    function raceNow() { try { return String(pc.race()).toLowerCase(); } catch (e) { return pcRace(); } }

    /* ---------- Pet ---------- */
    COND[3905] = slave; COND[3913] = free; COND[3919] = M;
    function petScene() {
        scene();
        flags.TN_ROO_PET_TS = now();
        doc(3905, 3937);
        timePass(10, 15); pcLust(3); addLust(3);
        if (free()) flags.TN_ROO_AMB_PET = 1;
        next(function () { scene(); doc(3951, 3951); rooMenu(); });
    }
    COND[3983] = function () { return emoteEars() && /ausar|canine|huskar|lupine|wolf|dog|vulpine|fox/.test(raceNow()); };
    COND[3991] = function () { return emoteEars() && !COND[3983]() && /kaithrit|feline|cat|lion|tiger|panther/.test(raceNow()); };
    COND[3997] = function () { return emoteEars() && !COND[3983]() && !COND[3991]() && /mouse|rodenian|rat/.test(raceNow()); };
    COND[4003] = function () { return emoteEars() && !COND[3983]() && !COND[3991]() && !COND[3997](); };
    COND[4007] = function () { return !emoteEars(); };
    COND[4011] = M;
    COND[4033] = function () { return !!CTX.facesit; }; COND[4043] = M;
    function headpatAmbush() {
        scene(); flags.TN_ROO_AMB_PET = undefined;
        doc(3960, 3962);
        next(function () {
            scene(); CTX.facesit = highLust();
            doc(3970, 4045);
            timePass(30, 45);
            if (CTX.facesit) { pcLust(25); rooCums(8); try { pc.applyPussyDrenched(); } catch (e) {} }
            else pcLust(-40);
            next(mainGameMenu);
        });
    }

    /* ---------- Hug ---------- */
    COND[4076] = slave; COND[4082] = free; COND[4088] = M;
    function hugScene() {
        scene();
        flags.TN_ROO_HUG_TS = now();
        doc(4076, 4112);
        timePass(30);
        if (milky()) { try { pc.applyMilkBathed(); } catch (e) {} drainMilk(5); }
        pcLust(-15); addLust(-10);
        try { pc.HP(Math.round(pc.HPMax() * 0.25)); pc.energy(Math.round(pc.energyMax() * 0.25)); } catch (e) {}
        flags.TN_ROO_AMB_HUG = 1;
        next(function () { scene(); doc(4127, 4135); rooMenu(); });
    }
    function snuggleAmbush() {
        scene(); flags.TN_ROO_AMB_HUG = undefined;
        doc(4145, 4147);
        next(function () {
            scene();
            doc(4155, 4171);
            clearMenu();
            addButton(0, "Sleep W/ Roo", function () {
                scene(); doc(4181, 4185);
                next(function () {
                    processTime(240); pcLustMin();
                    try { window.sleepHeal(); } catch (e) {}
                    scene(); doc(4199, 4211);
                    try { pc.shower(); } catch (e) {}
                    timePass(20);
                    next(mainGameMenu);
                });
            }, "Sleep W/ Roo", "Let her take you to bed");
            addButton(1, "All Better", function () { scene(); doc(4227, 4231); timePass(5); pcLust(-5); next(mainGameMenu); }, "All Better", "Yeah, you’re fine.");
        });
    }

    /* ---------- Kiss ---------- */
    COND[4260] = slave; COND[4266] = free; COND[4272] = M;
    function kissScene() {
        scene(); CTX.first = !flags.TN_ROO_KISSED;
        flags.TN_ROO_KISS_TS = now(); flags.TN_ROO_KISSED = 1;
        doc(4258, 4278);
        if (slave()) doc(4284, 4294, null, true); else doc(4309, 4329, null, true);
        pcLust(15); addLust(10);
        flags.TN_ROO_AMB_KISS = 1;
        clearMenu();
        addButton(0, "Oral", function () { window.tnRooSex("69top"); }, "Oral", "Go down on her - and let her return the favor.");
        addButton(1, "Later", kissLater, "Later", "Not now, but you will. Soon" + (silly() ? "™" : "") + ".");
    }
    COND[4355] = function () { return free() && highLust(); };
    COND[4374] = function () { return !(free() && highLust()); };
    function kissLater() {
        scene();
        addLust(33);
        doc(4351, 4361);
        timePass(5); pcLust(10);
        if (free() && highLust()) { next(function () { window.tnRooSex("69bottom"); }); return; }
        doc(4376, 4376, null, true);
        rooMenu();
    }
    COND[4403] = slave; COND[4427] = free;
    function kissAmbush() {
        scene(); flags.TN_ROO_AMB_KISS = undefined;
        pcLust(15);
        doc(4397, 4447);
        clearMenu();
        addButton(0, "Against Wall", function () { window.tnRooSex("wallsex"); }, "Against Wall", "Right here. Who cares who sees?");
        if (free()) addButton(1, "Oral", function () { window.tnRooSex("walloral"); }, "Oral", "Give her some love. Right here. Let others watch, if they must!");
        addButton(free() ? 2 : 1, "Later", function () { scene(); doc(4485, 4491); timePass(3); pcLust(5); next(mainGameMenu); }, "Later", "A kiss is good for now. You’ll see to her later.");
    }

    /* ---------- Grope ---------- */
    COND[4525] = slave; COND[4531] = free; COND[4537] = M;
    COND[4543] = milky; COND[4555] = function () { return milky() && vibesIn(); }; COND[4559] = milky;
    COND[4615] = function () { return !milky(); };
    function gropeScene() {
        scene(milky());
        flags.TN_ROO_GROPE_TS = now();
        if (free()) flags.TN_ROO_AMB_GROPE = 1;
        if (milky()) {
            doc(4525, 4565);
            try { pc.applyMilkBathed(); } catch (e) {}
            rooCums(1); drainMilk(25); pcLust(30); timePass(15);
            flags.TN_ROO_SHOWER_OK = 1;
            clearMenu();
            addButton(0, "Shower Sex", function () { window.tnRooSex("shower"); }, "Shower Sex", "Get squeaky clean. And also laid. You can do a lot in a shower.");
            btn(1, "Milky Titfuck", function () { window.tnRooSex("milkytitfuck"); }, hasCock(), "Mount Roo and screw her boobs to another spectacular titgasm.", "You need a cock for this.");
            addButton(2, "Not Now", function () { scene(true); doc(4593, 4597); next(mainGameMenu); }, "Not Now", "Nah. You’re one of those people who likes to be messy. For some reason.");
            return;
        }
        doc(4525, 4541);
        doc(4617, 4635, null, true);
        rooCums(1); pcLust(30); timePass(15);
        clearMenu();
        btn(0, "Quickie BJ", function () { window.tnRooSex("quickie"); }, hasGenitals(), "Yes, she can.", "You don’t have anything for her to put her mouth on down there.");
        addButton(1, "Later", function () { scene(); doc(4659, 4663); next(mainGameMenu); }, "Later", "No... you’ll save it for later. Come at her harder, perhaps.");
    }
    COND[4687] = P.taur; COND[4699] = function () { return !P.taur(); }; COND[4711] = M;
    function teaseAmbush() {
        scene(); flags.TN_ROO_AMB_GROPE = undefined;
        doc(4679, 4711);
        timePass(5); pcLust(35); addLust(20);
        next(mainGameMenu);
    }

    /* ---------- Sleep With ---------- */
    COND[4746] = slave; COND[4754] = free; COND[4764] = M;
    function sleepWithToggle() {
        scene();
        if (K.sleepWithRoo()) {
            doc(4790, 4792);
            try { clearCrewSleepWith("ROO"); } catch (e) {}
            next(function () { scene(); doc(4800, 4800); rooMenu(); });
            return;
        }
        doc(4746, 4762);
        try { setCrewSleepWith("ROO"); } catch (e) { flags.CREWMEMBER_SLEEP_WITH = "ROO"; }
        next(function () { scene(); doc(4774, 4778); rooMenu(); });
    }
    COND[4870] = slave; COND[4874] = free; COND[4878] = M;
    COND[4947] = function () { return persona() === "bimbo"; }; COND[4951] = function () { return persona() === "bro"; };
    COND[4955] = function () { return persona() === "kind"; }; COND[4959] = function () { return persona() === "misch"; };
    COND[4965] = function () { return persona() === "hard"; }; COND[4969] = M;
    COND[4983] = function () { return hasCock() && !P.taur(); }; COND[4987] = function () { return !(hasCock() && !P.taur()); }; COND[4991] = M;
    var NAPS = { 1: [4816, 4828], 2: [4840, 4854], 3: [4866, 4892], 4: [4904, 4930], 5: [4943, 4993] };
    window.tnRooSleep = function () {
        if (!aboard()) return false;
        var sw; try { sw = getCrewSleepWith(); } catch (e) { return false; }
        if (sw !== "ROO") return false;
        if (window.__tnRooSleepPass) { window.__tnRooSleepPass = false; return false; }
        var opts = [1, 2, 5];
        if (free()) opts.push(4);
        if (highLust()) opts.push(3, 3, 3);
        opts = opts.filter(function (o) { return o !== flags.TN_ROO_NAP_LAST; });
        var nap = pick(opts);
        flags.TN_ROO_NAP_LAST = nap;
        scene(); CTX.first = !flags.TN_ROO_SLEPT_WITH;
        flags.TN_ROO_SLEPT_WITH = 1;
        doc(NAPS[nap][0], NAPS[nap][1]);
        if (nap === 3) { rooCums(2); pcLust(30); }
        flags.TN_ROO_NAPPED = nap;
        clearMenu();
        addButton(0, "Next", function () { window.__tnRooSleepPass = true; window.sleep(true, false); });
        return true;
    };

    COND[5083] = function () { return vagCount() > 1; }; COND[5089] = function () { return vagCount() <= 1; }; COND[5095] = M;
    function origRace() {
        var r = pcRace();
        var map = [["ausar", "ausar"], ["kaithrit", "kaithrit"], ["leithan", "leithan"], ["kui", "kui-tan"], ["gryvain", "gryvain"], ["suula", "suula"]];
        for (var i = 0; i < map.length; i++) if (r.indexOf(map[i][0]) >= 0) return map[i][1];
        return "human";
    }
    [[5285, "human"], [5291, "ausar"], [5295, "kaithrit"], [5301, "leithan"], [5307, "kui-tan"], [5313, "gryvain"], [5317, "suula"],
     [5329, "human"], [5335, "ausar"], [5341, "kaithrit"], [5349, "leithan"], [5355, "kui-tan"], [5361, "gryvain"], [5367, "suula"]]
        .forEach(function (p) { COND[p[0]] = function () { return origRace() === p[1]; }; });
    COND[5323] = M; COND[5373] = M;
    var MORNINGS = {
        bj: [5015, 5051, function () { pcCum(); addLust(20); drainMilk(5); }],
        cunni: [5071, 5119, function () { pcCum(); addLust(20); drainMilk(5); }],
        titfuck: [5138, 5176, function () { pcCum(); addLust(20); drainMilk(5); }],
        face: [5196, 5260, function () { pcLust(20); rooCums(1); drainMilk(5); }],
        calm: [5279, 5383, function () { pcLust(-10); }]
    };
    function morningScene() {
        var nap = flags.TN_ROO_NAPPED; flags.TN_ROO_NAPPED = undefined;
        var opts = [];
        if (nap === 3) opts = hasCock() ? ["bj"] : (hasPussy() ? ["cunni"] : ["calm"]);
        else {
            if (hasCock()) opts.push("bj", "bj", "titfuck", "titfuck");
            if (hasPussy()) opts.push("cunni");
            if (hasPussy() && !hasCock()) opts.push("cunni", "cunni");
            if (free() && lustLvl() >= 1) opts.push("face");
            opts.push("calm");
            var f = opts.filter(function (o) { return o !== flags.TN_ROO_MORNING_LAST; });
            if (f.length) opts = f;
        }
        var m = pick(opts);
        flags.TN_ROO_MORNING_LAST = m;
        scene(m !== "calm");
        if (m !== "calm") doc(5011, 5011);
        doc(MORNINGS[m][0], MORNINGS[m][1], null, m !== "calm");
        MORNINGS[m][2]();
        timePass(30, 50);
        next(mainGameMenu);
    }
    window.tnRooMorning = function (list) {
        if (!aboard() || !flags.TN_ROO_NAPPED || !list || typeof list.push !== "function") return;
        list.length = 0;
        list.push(morningScene);
    };

    /* ---------- Free Her ---------- */
    function freeHerSanity() {
        scene();
        doc(5409, 5409);
        clearMenu();
        addButton(0, "Free Roo", function () {
            scene();
            doc(5425, 5445);
            next(function () {
                scene();
                flags.TN_ROO_SLAVE = 0; flags.TN_ROO_COLLAR = 0; flags.TN_ROO_FREED_LATER = 1;
                flags.TN_ROO_NO_MASTURBATE = 0; flags.TN_ROO_NO_CREW = 0; flags.TN_ROO_NO_OUTSIDE = 0;
                doc(5453, 5495);
                timePass(20);
                next(mainGameMenu);
            });
        }, "Free Roo", "Do it.");
        addButton(1, "No", function () { scene(); doc(5509, 5515); timePass(2); next(function () { backToRoo(); }); }, "No", "Forget it. Keep her as she is.");
    }

    /* ---------- Hire Her ---------- */
    COND[5573] = function () { return flags.ANNO_MISSION_OFFER === 3; };
    COND[5579] = function () { return flags.ANNO_MISSION_OFFER !== 3; };
    COND[5585] = M; COND[5619] = milky; COND[5643] = function () { return !milky(); }; COND[5653] = M;
    function showAnno() {
        try { showBust(anno.bustDisplay, bust()); showName("Anno\n& Roo"); } catch (e) { showRoo(); }
    }
    function hireHer() {
        scene();
        doc(5539, 5557);
        next(function () {
            clearOutput(); showAnno(); byWilliam(); CTX = {};
            doc(5565, 5653);
            flags.TN_ROO_HIRED = 1;
            if (milky()) { drainMilk(20); }
            else flags.TN_ROO_CLOTHES = 5;
            timePass(60, 90);
            output("\n\n<b>Roo is now a Steele Tech trainee. She has a uniform, and her email address is RCS1@SteeleTech.corp.</b>");
            next(mainGameMenu);
        });
    }

    /* ---------- Evict Her ---------- */
    COND[5679] = slave; COND[5687] = free; COND[5699] = M;
    function evictHer() {
        scene(); CTX.firstTime = CTX.first = !flags.TN_ROO_EVICTED;
        flags.TN_ROO_EVICTED = 1;
        doc(5679, 5699);
        flags.TN_ROO_STATE = 3;
        try { if (getCrewSleepWith() === "ROO") clearCrewSleepWith("ROO"); } catch (e) {}
        timePass(30);
        output("\n\n<b>Roo is staying in an apartment at the Tavros Nursery. Call her (or bring her back while you’re on Tavros) from Codex &gt; Extra &gt; Roo.</b>");
        next(mainGameMenu);
    }
