    /* ================= 2. Text keys used by William's doc ================= */
    function cockLen() { try { return pc.biggestCockLength(); } catch (e) { return 0; } }
    function pcRace() { try { return String(pc.originalRace || pc.race() || "human").toLowerCase(); } catch (e) { return "human"; } }
    function pcExposed(part) {
        try {
            if (part === "crotch") return pc.isCrotchExposed();
            if (part === "chest") return pc.isChestExposed();
            return pc.isNude();
        } catch (e) { return false; }
    }
    function emoteEars() { try { return pc.hasEmoteEars(); } catch (e) { return false; } }
    function petIs(list) {
        var n = String(CTX.petName || "").toLowerCase().replace(/[^a-z]/g, "");
        return list.split(",").some(function (w) { return w.toLowerCase().replace(/^is/, "") === n; });
    }
    function cumQ() { try { return pc.cumQ(); } catch (e) { return 0; } }

    var P = {
        slave: slave, free: free, milky: milky,
        cock: hasCock, pussy: hasPussy,
        herm: function () { return hasCock() && hasPussy(); },
        pussOnly: function () { return hasPussy() && !hasCock(); },
        neuter: function () { return !hasGenitals(); },
        cockNotOut: function () { return hasCock() && !pcExposed("crotch"); },
        taur: function () { return body() === "taur"; },
        naga: function () { return body() === "naga"; }
    };
    function k(names, f) { names.split(" ").forEach(function (n) { K[n] = f; }); }
    k("slave rooSlave slaveRoo", P.slave);
    k("free rooFree freeRoo", P.free);
    k("rooMilky milky milkyRoo milkies", P.milky);
    k("rooNotOnLactaid", function () { return !milky(); });
    k("hasCock pcHasCock dick", P.cock);
    k("hasBalls", function () { try { return pc.balls > 0; } catch (e) { return false; } });
    k("silly", silly);
    k("rooChestNotExposed", function () { return !chestExposed(); });
    k("rooChestExposed", chestExposed);
    k("rooCrotchNotExposed", function () { return !crotchExposed(); });
    k("rooCrotchExposed", crotchExposed);
    k("rooCrotchExposed,orMilky", function () { return crotchExposed() || milky(); });
    k("rooAssNotExposed", function () { return !crotchExposed(); });
    k("rooWearingAnyClothes rooNotNaked", function () { return clothes() !== 4; });
    k("rooNude isNaked", function () { return clothes() === 4; });
    k("rooNotFullyDressed", function () { return clothes() !== 0 && clothes() !== 5; });
    k("rooDealerClothes", function () { return clothes() <= 3; });
    k("rooWearingPanties", function () { return clothes() <= 3; });
    k("steele rooSteeleUniform", steele);
    k("hasPussy hasVagina hasPuss puss pcPussy", P.pussy);
    k("hasPussOnly pussOnly pussyOnly onlyPussy", P.pussOnly);
    k("male", function () { return hasCock() && !hasPussy(); });
    k("femaleOrTrap", function () { return isFem(); });
    k("multiCock multi", function () { return cockCount() > 1; });
    k("multiVag multiVagina", function () { return vagCount() > 1; });
    k("vibratorsOn vibesOn", vibesOn);
    k("vibesOff", function () { return !vibesOn(); });
    k("vibesIn rooWearingVibrators", vibesIn);
    k("rooNotWearingVibrators", function () { return !vibesIn(); });
    k("vibesIn,VibesOff", function () { return vibesIn() && !vibesOn(); });
    k("vibesIn,VibesOn", function () { return vibesIn() && vibesOn(); });
    k("rooSlave,OrVibratorsInserted rooSlave,OrVibesInserted", function () { return slave() || vibesIn(); });
    k("isNaga", P.naga);
    k("taur pcIsTaur", P.taur);
    k("notTaur pcBiped", function () { return body() !== "taur"; });
    k("pcIsTaur,HasGenitals", function () { return P.taur() && hasGenitals(); });
    k("else,HasGenitals", function () { return hasGenitals(); });
    k("longTongue hasLongTongue", function () { try { return pc.hasLongTongue(); } catch (e) { return false; } });
    k("hasPrehensileTail", function () { try { return pc.hasPrehensileTail(); } catch (e) { return false; } });
    k("isNaga,orPrehensileTail", function () { return P.naga() || K.hasPrehensileTail(); });
    k("pcLactating,isMilk isLactating,isMilk", function () { try { return pc.isLactating(); } catch (e) { return false; } });
    k("isOnShip", onShip);
    k("isHermOrHasCock isHermOrCock pcHermOrCock", P.cock);
    k("isHerm herm", P.herm);
    k("neuter elseNeuter", P.neuter);
    k("bunEars bunnyEars rooBunnyEars", function () { return ears() === "bunny"; });
    k("catEars", function () { return ears() === "cat"; });
    k("hasHair", function () { try { return pc.hasHair(); } catch (e) { return true; } });
    k("hasFur", function () { try { return pc.hasFur(); } catch (e) { return false; } });
    k("hasScales", function () { try { return pc.hasScales(); } catch (e) { return false; } });
    k("hasMuzzle", function () { try { return pc.hasMuzzle(); } catch (e) { return false; } });
    k("hasHorns", function () { try { return pc.hasHorns(); } catch (e) { return false; } });
    k("hasTail hasTails pcHasTail", function () { try { return pc.hasTail(); } catch (e) { return false; } });
    k("hasKnot", function () { try { return pc.hasKnot(); } catch (e) { return false; } });
    k("hasHorseCock hasHorsecock", function () { try { return pc.hasHorsecock(); } catch (e) { return false; } });
    k("cockNubby", function () { try { return pc.hasCockFlag(GLOBAL.FLAG_NUBBY); } catch (e) { return false; } });
    k("pumpedOrEquinePussy pumpedOrEquinePuss", function () {
        try { return pc.hasVagina() && (pc.vaginas[0].type === GLOBAL.TYPE_EQUINE || pc.hasVaginaFlag && pc.hasVaginaFlag(GLOBAL.FLAG_PUMPED)); } catch (e) { return false; }
    });
    k("isSquirter", function () { try { return pc.isSquirter(); } catch (e) { return false; } });
    k("elseSquirter", function () { return true; });
    k("highCum", function () { return cumQ() >= 1000; });
    k("lowCum", function () { return cumQ() < 250; });
    k("bigCum", function () { return cumQ() >= 5000; });
    k("hyper", function () { return cumQ() >= 15000; });
    k("noMasturbation masturbationOff rooCantMasturbate", function () { return !canMasturbate(); });
    k("masturbationOn rooCanMasturbate", canMasturbate);
    k("collar rooCollar rooIsWearingCollar rooWearingCollar rooCollared", collar);
    k("rooNotWearingCollar noCollar", function () { return !collar(); });
    k("rooNotHired freeNotHired rooFreeNotHired", function () { return free() && !hired(); });
    k("rooHired freeHired rooFreeHired", hired);
    k("rooAllowedCrew", function () { return flags.TN_ROO_NO_CREW !== 1; });
    k("rooNotAllowedCrew", function () { return flags.TN_ROO_NO_CREW === 1; });
    k("rooIsAllowedOutsideAlready", function () { return flags.TN_ROO_NO_OUTSIDE !== 1; });
    k("rooIsNotAllowedOutside rooNotAllowedOutside", function () { return flags.TN_ROO_NO_OUTSIDE === 1; });
    k("rooHighLust rooLustHigh high", highLust);
    k("med medium", function () { return lustLvl() === 1; });
    k("isHuskar husk", function () { try { return anno.isHuskar(); } catch (e) { return false; } });
    k("pcHasHadKids", function () { try { return (pc.totalBirths ? pc.totalBirths() : 0) > 0 || (StatTracking && StatTracking.getStat && StatTracking.getStat("pregnancy/total births") > 0); } catch (e) { return false; } });
    k("rooNotRecruited", function () { return flags.TN_ROO_STATE === 4; });
    k("hasCrew has2Crew", function () { return crewOthers() > 0; });
    k("hasCelise", function () { return crewHas("CELISE"); });
    k("hasNova", function () { try { return chars.GOO && chars.GOO.isCrew && chars.GOO.isCrew(); } catch (e) { return false; } });
    k("hasYammi", function () { return crewHas("YAMMI"); });
    k("annoCrew annoIsCrew", function () { return crewHas("ANNO"); });
    k("wonFight", function () { return flags.PENNY_BADGER_WON !== undefined || flags.ZIL_PROBLEM_DEALT_WITH === 1 || flags.FUCKED_PENNY !== undefined; });
    k("ardiaDom>6", function () { try { return ardia.domLevel() > 6; } catch (e) { return false; } });
    k("pcNotExposed hasCock,NotExposed crotchNotExposed pcCrotchNotExposed notExposed", function () { return !pcExposed("crotch"); });
    k("exposed else,hasCock,Exposed", function () { return pcExposed("crotch"); });
    k("pcChestNotExposed", function () { return !pcExposed("chest"); });
    k("cockSize<8", function () { return cockLen() < 8; });
    k("cockSize<9", function () { return cockLen() < 9; });
    k("cockSize>10", function () { return cockLen() > 10; });
    k("cockSize>12", function () { return cockLen() > 12; });
    k("cockSize<20", function () { return cockLen() < 20; });
    k("size<18", function () { return cockLen() < 18; });
    k("hasKnot,cockSize<18", function () { return K.hasKnot() && cockLen() < 18; });
    k("cockSizeSmall", function () { return cockLen() < 7; });
    k("tallness<60", function () { return (pc.tallness || 66) < 60; });
    k("tallness<75", function () { return (pc.tallness || 66) < 75; });
    k("pcTallness>72", function () { return (pc.tallness || 66) > 72; });
    k("wetness<2", function () { try { return pc.wetness() < 2; } catch (e) { return true; } });
    k("wetness<4", function () { try { return pc.wetness() < 4; } catch (e) { return true; } });
    k("hasSukMastr2000", function () { return invFind("SukMastr") >= 0; });
    k("doesNotHave", function () { return invFind("SukMastr") < 0; });
    k("hasNepeta", function () { return invFind("Nepeta") >= 0; });
    k("pcDoesNotHaveNepetaInInventory", function () { return invFind("Nepeta") < 0; });
    k("hasVarmint", function () { try { return varmint.isCrew() || flags.VARMINT_IS_CREW === 1; } catch (e) { return false; } });
    k("metMikhail", function () { return flags.MET_MIKHAIL !== undefined || flags.MIKHAIL_MET !== undefined; });
    k("metShockHopperAgain", function () { return flags.MET_VANIKA !== undefined || flags.SHOCK_HOPPER_DEFEATED !== undefined; });
    k("pcKaithrit isKaithritorHalfKaithrit", function () { return /kaithrit/.test(pcRace()); });
    k("humanOrSylvan", function () { return /human|sylvan/.test(pcRace()); });
    k("isMouseOrRodenian", function () { return /mouse|rodenian|rat/.test(pcRace()); });
    k("pcHasEmoteEars hasEmoteEars", emoteEars);
    k("pcTableFuckedRooAndSawLactaid", function () { return (flags.ROO_TABLEFUCKED || 0) > 0; });
    k("firstAndTableFuckedLactaid", function () { return !!CTX.first && (flags.ROO_TABLEFUCKED || 0) > 0; });
    k("hasCock,LibidoHigh", function () { return hasCock() && lib() >= 67; });
    k("pcLibidoLow", function () { return lib() < 33; });
    k("libidoElse", function () { return true; });
    k("pcLustOrLib33", function () { try { return pc.lust() >= 33 || lib() >= 33; } catch (e) { return false; } });
    k("hasMyrVenomOrAphroSaliva myrVenomOrAphroSpit hasMyrVenomOrAphroSpit", function () {
        try { return pc.hasPerk("Myr Venom") || pc.hasTongueFlag(GLOBAL.FLAG_APHRODISIAC_LACED); } catch (e) { return false; }
    });
    k("notBimbo", function () { return persona() !== "bimbo"; });
    k("isBimbo pcBimbo", function () { return persona() === "bimbo"; });
    k("pcKind", function () { return persona() === "kind"; });
    k("isHardOrBro isBroOrHard", function () { return persona() === "hard" || persona() === "bro"; });
    k("time8", function () { return hours >= 8 && hours < 16; });
    k("pcHasBreasts", function () { try { return pc.biggestTitSize() >= 1; } catch (e) { return false; } });
    k("rooWasIsPregnant", function () { return false; });
    k("kaseSteeletech", function () { return flags.KASE_STEELETECH !== undefined || flags.KASE_HIRED !== undefined; });
    k("leilaSteeletech", function () { return flags.LEILA_STEELETECH !== undefined || flags.LEILA_HIRED !== undefined; });
    k("sleepWithRoo", function () { try { return getCrewSleepWith() === "ROO"; } catch (e) { return false; } });
    k("rooNotSleepingWith", function () { try { return getCrewSleepWith() !== "ROO"; } catch (e) { return true; } });
    k("pcIsTech", function () { try { return pc.characterClass === GLOBAL.CLASS_ENGINEER; } catch (e) { return false; } });
    k("isMerc", function () { try { return pc.characterClass === GLOBAL.CLASS_MERCENARY; } catch (e) { return false; } });
    k("isPCsFirstName", function () { return String(CTX.petName || "").toLowerCase() === String(pc.short || "").toLowerCase(); });
    k("both", function () { return true; });
    k("pcLibido>=67", function () { return lib() >= 67; });
    k("pcTallness<=64", function () { return (pc.tallness || 66) <= 64; });
    k("repeat", function () { return CTX.repeat !== undefined ? !!CTX.repeat : !CTX.first; });
    k("usedPussy", function () { return CTX.usedPussy !== undefined ? !!CTX.usedPussy : (!hasCock() && hasPussy()); });
    k("gotFacesitting", function () { return (flags.TN_ROO_RIDDEN || 0) > 0; });
    NK["lifting her skirt and tugging on her bright red panties"] = function () { var c = clothes(); return c === 5 ? 2 : (c <= 1 ? 0 : 1); };
    k("neverSaw", function () { return !CTX.sawBefore; });
    // pet-name keys (only meaningful while naming): isKittycat,Kitten etc. fall through to petIs()
    var keyTrueBase = keyTrue;
    keyTrue = function (key) {
        var kk = key.replace(/\s+/g, "");
        if (CTX.petName !== undefined && !K.hasOwnProperty(kk) && /^is[A-Z]/.test(kk)) return petIs(kk.replace(/^is/, ""));
        return keyTrueBase(key);
    };

    /* Positional keys: {pcMF: man / woman} */
    var pickAltBase = pickAlt;
    pickAlt = function (alts, line) {
        var k0 = (alts[0].k || "").replace(/\s+/g, "");
        if (/^(pcMF|maleFemale)$/.test(k0)) return isFem() ? 1 : 0;
        return pickAltBase(alts, line);
    };

    /* ---------- {a/b} without keys ---------- */
    function cocks() { return cockCount() > 1 ? 1 : 0; }
    function nkOne(f) { return function () { return f() ? 0 : -1; }; }
    NK["s"] = function () { return cockCount() > 1 ? 0 : -1; };
    NK["es"] = NK["s"];
    NK["1286|s"] = function () { return vagCount() > 1 ? 0 : -1; };
    NK["5097|s"] = NK["1286|s"];
    NK["1543|s"] = function () { return clothes() === 0 ? 0 : -1; };
    NK["ess"] = function () { return isFem() ? 0 : -1; };
    NK["re"] = function () { return 0; };
    NK["bud"] = function () { return isFem() ? 1 : 0; };
    NK["50,000"] = function () { return 0; };
    NK["or anyone else"] = function () { return crewOthers() > 0 ? 0 : -1; };
    NK["and your crew"] = NK["or anyone else"];
    NK["it"] = function (a) { return a.length === 2 ? cocks() : cocks(); };
    NK["it’s"] = function () { return cocks(); };
    NK["one of your poles whilst her hands tend the other{s}"] = function () { return cockCount() > 1 ? 0 : 1; };
    NK["your shaft"] = function () { var c = cockCount(); return c <= 1 ? 0 : (c === 2 ? 1 : 2); };
    NK["her skirt"] = function () { return steele() ? 1 : 0; };
    NK["former"] = function () { return free() ? 0 : -1; };
    NK[", milky"] = nkOne(milky);
    NK["milky"] = nkOne(milky);
    NK["milk-dribbling"] = nkOne(milky);
    NK["and milk is flowing into messy wastedness"] = nkOne(milky);
    NK["milkies"] = function () { return milky() ? 0 : 1; };
    NK["dual"] = function () { return vagCount() > 2 ? 1 : 0; };
    NK["one of your holes"] = function () { return vagCount() > 1 ? 0 : 1; };
    NK["standing"] = function () { return P.taur() ? 0 : 1; };
    NK["even without bunny ears"] = function () { return ears() === "bunny" ? -1 : 0; };
    NK["lifting her skirt and tugging on her bright red panties"] = function () {
        var c = clothes(); if (c === 5) return 2; if (c === 2 || c === 3) return 1; if (c <= 1) return 0; return -1;
    };
    NK["hasCock and sexedRoo: more to hug your cock with"] = function () { return -1; };
    NK[", and fortunately, that snowy pup’s just a few doors away..."] = function () {
        if (crewHas("ANNO")) return 0; return flags.ANNO_CREWMEMBER === 2 ? 2 : 1;
    };
    NK["would be"] = function () { return canMasturbate() ? 0 : 1; };
    NK["Will you stop her from masturbating, or allow her to retain that important personal freedom?"] = function () { return canMasturbate() ? 0 : 1; };
    NK["prospect of being made to ignore her body’s needs seizing her by the [roo.ears] and twisting hard"] = function () { return canMasturbate() ? 0 : 1; };
    NK["I-I’ll do anything to be able to masturbate. Please..."] = function () { return canMasturbate() ? 1 : 0; };
    NK["shucked your [pc.crotchCovers] and"] = function () { return pcExposed("crotch") ? -1 : 0; };
    NK["and the sweaty [pc.skinFurScalesNoun] of your ballsack"] = function () { return K.hasBalls() ? 0 : -1; };
    NK["groaning"] = function () { return isFem() ? 1 : 0; };
    NK["orbs’ve"] = function () { try { return pc.balls > 1 ? 0 : 1; } catch (e) { return 0; } };
    NK["a"] = function () { return P.taur() ? 0 : 1; };
    NK["she is able to leave the ship on her own time and engage with the locals"] = function () { return flags.TN_ROO_NO_OUTSIDE === 1 ? 1 : 0; };
    NK["at the metal cage firmly attached to her throat"] = function () { return collar() ? 0 : 1; };
    NK["and you are not referring to her with any name"] = function () { return flags.TN_ROO_ROOTITLE ? 1 : 0; };
    NK["and she is not referring to you with any name"] = function () { return flags.TN_ROO_PCTITLE ? 1 : 0; };
    NK["it"] = function (a) { return cocks(); };
    NK["3989|it"] = function () { try { return pc.tailCount > 1 ? 2 : 0; } catch (e) { return 0; } };
    NK["mixed girlcum and"] = function () { return CTX.facesit ? 0 : -1; };
    NK["And let you eat them out. But is that a bonus or just fair trade?"] = function () { return CTX.facesit ? 0 : -1; };
    NK["And all that milk you made me fill up on! Naughty [pc.boyGirl]."] = nkOne(milky);
    NK["hops"] = function () { return ears() === "bunny" ? 0 : 1; };
    NK["[pc.leg]"] = function () { try { return pc.hasTail() ? 1 : 0; } catch (e) { return 0; } };
    NK["girls like us do"] = function () { return isFem() ? 0 : 1; };
    NK["cow-"] = nkOne(milky);
    NK["[pc.horns]"] = function () { return K.hasHorns() ? 0 : 1; };
    NK["man"] = function () { if (hasCock() && hasPussy()) return 2; return isFem() ? 1 : 0; };
    NK["your virility"] = function () { return isFem() ? 1 : 0; };
    NK["penis"] = function () { return cocks(); };
    NK["king"] = function () { return isFem() ? 1 : 0; };
    NK["secondary slit"] = function () { return vagCount() > 2 ? 1 : 0; };
    NK["cum just as hard as a hermaphrodite"] = function () { return hasCock() ? 1 : 0; };
    NK["slave-"] = nkOne(slave);
    NK["their shafts"] = function () { return cocks() ? 0 : 1; };
    NK["despite its superior length"] = nkOne(function () { return K.longTongue(); });
    NK["ticklishly loop your [pc.hair] around themselves"] = function () { return K.hasHair() ? 0 : 1; };
    NK["against yours"] = function () { return K.pcHasBreasts() ? 0 : 1; };
    NK["masterly"] = function () { if (slave()) return isFem() ? 1 : 0; return 2; };
    NK["Masterrrrrrrr"] = function () { if (slave()) return isFem() ? 1 : 0; return 2; };
    NK["morning"] = function (a) {
        if (a.length === 3) return hours < 12 ? 0 : (hours < 18 ? 1 : 2);
        return (hours >= 4 && hours < 16) ? 0 : 1;
    };
    NK["day"] = function () { return (hours >= 6 && hours < 19) ? 0 : 1; };
    NK["I’ll make you breakfast"] = function () { return hours < 11 ? 0 : (hours < 16 ? 1 : 2); };
    NK["Meow"] = function () { return rnd(4); };
    NK["when you’ve got a stiff dick"] = function () { return hasCock() ? 0 : 1; };
    NK["Bunny ears lifting"] = function () { return ears() === "bunny" ? 0 : 1; };
    NK["floppy ears lifting"] = NK["Bunny ears lifting"];
    NK["cat-eared"] = function () { return ears() === "cat" ? 0 : 1; };
    NK["floppy"] = NK["Bunny ears lifting"];
    NK["bunny"] = NK["Bunny ears lifting"];

    /* ---------- Small fixes to the doc's markup ---------- */
    var FIX = {
        1338: [["{pcCumVol > = 5000:", "{bigCum:"]],
        1549: [["{, rooAssNotExposed--Skirt,Panties,SteeleSuit: {", "{rooAssNotExposed:, {"], ["down her rolling hinterlands}.", "down her rolling hinterlands}}."]],
        4039: [["{ random if multiple,,hasMuzzle:", "{hasMuzzle:"]],
        3210: [["isPC’sFirstName", "isPCsFirstName"]],
        4100: [["{pcLust > = 33 or Libido > = 33:", "{pcLustOrLib33:"]],
        4106: [["{time8:00-16:00: nap", "{time8: nap"]],
        5154: [["{hyper(addOnToHigh):", "{hyper:"]],
        6631: [["{has > = 2 crew:", "{has2Crew:"]],
        1822: [["{ hasCock and sexedRoo: more to hug your cock with}", ""]],
        635: [["[pc.butts]}, a heavy", "[pc.butts]}}, a heavy"]],
        1146: [["into appealingly-firm readiness/ onlyPussy:", "into appealingly-firm readiness}/ onlyPussy:"]],
        1256: [["jutting and glowing}.", "jutting and glowing."]],
        1326: [["leaking from her folds}.", "leaking from her folds."]],
        1523: [["you order your slave to ’show off’. <i>“Let me see you earn my approval.”</i>", "you order your slave to ’show off’. <i>“Let me see you earn my approval.”</i>}"]],
        1595: [["<i>“I have some things I want to ask you.”</i>", "<i>“I have some things I want to ask you.”</i>}"]],
        1603: [["<i>“Come sit here!”</i>", "<i>“Come sit here!”</i>}"]],
        2138: [["as a result.}", "as a result.}}"]],
        2523: [["{ rooCrotchNotExposed: as she bares", " as she bares"]],
        5049: [["{[pc.Master]/[pc.name]”</i>, let me know, okay?<i>“</i>", "{[pc.Master]/[pc.name]}, let me know, okay?”</i>"]]
    };
    var txtBase = txt;
    txt = function (s, line) {
        var f = FIX[line];
        if (f) for (var i = 0; i < f.length; i++) s = s.split(f[i][0]).join(f[i][1]);
        return txtBase(s, line);
    };
