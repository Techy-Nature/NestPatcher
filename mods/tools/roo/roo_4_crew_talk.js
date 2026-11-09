    /* ================= 4. Crew list, Roo's menu, Appearance, Talk ================= */
    window.tnRooCrewCount = function () { return aboard() ? 1 : 0; };

    var BASE_SLAVE = [996, 1000, 1004, 1008, 1012], BASE_FREE = [1016, 1019, 1023, 1027, 1031], BASE_BOTH = [1035];
    function crewInteractions() {
        var out = [];
        if (flags.TN_ROO_NO_CREW === 1) return out;
        if (crewHas("ANNO")) out.push(hired() ? 1069 : 1065);
        if (crewHas("KASE")) out.push(1073);
        if (crewHas("YAMMI")) out.push(1077);
        if (crewHas("SHEKKA")) out.push(1081);
        if (crewHas("AZRA")) out.push(1085);
        if (crewHas("LEILA")) out.push(1089);
        if (crewHas("PENNY")) { var bim = false; try { bim = penny.isBimbo(); } catch (e) {} out.push(bim ? 1097 : 1093); }
        if (crewHas("OLYMPIA")) out.push(1101);
        if (crewHas("ARDIA")) out.push(1105);
        if (crewHas("RAMIS")) out.push(1109);
        return out;
    }
    function crewBlurbText() {
        tick();
        if (flags.TN_ROO_OC_TS !== undefined && now() - flags.TN_ROO_OC_TS < 180) return para(1047);
        if (highLust() && rnd(2) === 0) return para(1055);
        if (milky() && rnd(2) === 0) return para(1051);
        if (days() < 3 && rnd(2) === 0) return para(1043);
        var inter = crewInteractions();
        if (inter.length && rnd(10) < 4) return para(pick(inter));
        return para(pick((slave() ? BASE_SLAVE : BASE_FREE).concat(BASE_BOTH)));
    }
    window.tnRooCrewBlurb = function (slot) {
        if (!aboard()) return "";
        var tip = slave() ? "Visit your kaithrit slave, Roo." : "Check in on Roo and see how the kaithrit’s doing.";
        if (flags.TN_ROO_OC_TS !== undefined && now() - flags.TN_ROO_OC_TS < 180) tip = "Well. After flipping the vibrators on that hard, Roo’s probably not going to be in her normal mood. Might as well check on her!";
        addButton(slot, "Roo", rooApproach, "Roo", tip);
        return "\n\n" + crewBlurbText();
    };

    /* ---------- Approach + menu ---------- */
    COND[1366] = M;
    function rooApproach() {
        clearOutput(); showRoo(); byWilliam(); CTX = {};
        tick();
        var ocRecent = flags.TN_ROO_OC_TS !== undefined && now() - flags.TN_ROO_OC_TS < 240;
        var milkGone = flags.TN_ROO_MILK_EMPTY_TS !== undefined && now() - flags.TN_ROO_MILK_EMPTY_TS < 720 && !milky();
        if (ocRecent && flags.TN_ROO_OC_BLURB === 1) {
            flags.TN_ROO_OC_BLURB = 0; byUs();
            say(["Roo’s door is open a crack, and the smell hits you before you see her: hot, sweet, and unmistakably kaithrit. She’s sprawled across her bed with one arm thrown over her eyes, legs still twitching every few seconds. Both tails are limp as wet rope.",
                "<i>“{slave: [pc.Master]... / free: [pc.name]...}”</i> she croaks without lifting the arm. <i>“That button. That stupid, <b>wonderful</b> button.”</i> A weak giggle. <i>“I think I saw colors. I think I saw <b>sounds.</b>”</i> She peeks out at you from under her elbow, cheeks flushed scarlet. <i>“Did you need something? I can probably stand up in... ten minutes? Twenty?”</i>"]);
        } else if (milkGone) {
            flags.TN_ROO_MILK_EMPTY_TS = undefined; byUs();
            say(["Roo is sitting on her bed with her hands cupped under her chest, frowning down at herself like she’s misplaced something. Her breasts are back to their usual (still enormous) size, and the last of the Tresorvoir has finally run its course.",
                "<i>“All gone,”</i> she sighs, giving them a bounce. <i>“It’s so <b>quiet</b> without all the sloshing. And I can wear clothes again!”</i> She brightens a little at that, then looks up at you. <i>“{slave: Is there something you need, [pc.Master]? / free: So! What’s up, [pc.name]?}”</i>"]);
        } else if (highLust()) {
            doc(slave() ? 1382 : 1396, slave() ? 1384 : 1400);
        } else {
            var opts = [[1368, 1372], slave() ? [1376, 1378] : [1388, 1392]];
            var o = pick(opts);
            doc(o[0], o[1]);
        }
        rooMenu();
    }
    H.approach = rooApproach;

    var COOLDOWN = 60;
    function justDid(k) { return flags[k] !== undefined && now() - flags[k] < COOLDOWN; }
    function rooMenu() {
        clearMenu();
        var talkBlock = highLust() ? "when she’s this obviously aroused. Give her a hand with that!" : (vibesOn() ? "with her sex toys active. Turn them off, first!" : "");
        addButton(0, "Appearance", appearance, "Appearance", slave() ? "Look over Roo. She can make it fun for you, too!" : "Inspect the cat. Respect the cat.");
        btn(1, "Talk", talkMenuIntro, !talkBlock, "Now that Roo’s on board, she has no reason not to be candid!", "Roo won’t be able to hold a conversation " + talkBlock);
        addButton(2, slave() ? "Order" : "Request", orderIntro, slave() ? "Order" : "Request", slave() ? "Give your slave an instruction." : "Ask Roo to do something for you. Something like... take all her clothes off. Maybe. It’d be hot.");
        addButton(3, "Sex", sexMenuIntro, "Sex", slave() ? "All you need do is utter a command, and your slave will obey." : "Roo will tend your needs should you ask. Perhaps you can do the same for her?");
        btn(4, "Pet", petScene, !justDid("TN_ROO_PET_TS"), slave() ? "Give the slave-kitty some rewarding scritches" : "She makes the best sounds when you pet her ears.", "You just did this! Are you trying to start a fire?");
        btn(5, "Hug", hugScene, !justDid("TN_ROO_HUG_TS"), slave() ? "Every so often, a [pc.Master] should show their slave some affection." : "You’re Roo’s light in the dark. A little reassurance would be good both ways.", "You just did this!");
        btn(6, "Kiss", kissScene, !justDid("TN_ROO_KISS_TS"), slave() ? "A kiss from [pc.Master] to slave can mean any number of things." : "Roo’s lips are a wonderland of softness, and she’s no stranger to being affectionate!", "You just did this!");
        var gl = silly() ? "Hold Hands" : "Grope";
        btn(7, gl, gropeScene, !justDid("TN_ROO_GROPE_TS"), silly() ? "It says ’Hold Hands’ but, really, you’re just groping her. Have at it, horndog!" : (slave() ? "Your kaithrit slave is a flaw-free creature with perfect tits, a round bubble-shaped ass, squeezable, heavenly legs... and it all belongs to you." : "Roo wouldn’t mind if you got touchy-feely, though you can certainly expect her to return the favor!"), "You just did this!");
        if (settled()) {
            var sleeping = K.sleepWithRoo();
            var sTip = slave() ? (sleeping ? "Tell Roo to vacate your bed. She has her own, after all." : "Tell your slave to warm your bed.") : (sleeping ? "Tell Roo she should stay in her own bed for now." : "Ask Roo to sleep in your bed. With you.");
            btn(8, "Sleep With", sleepWithToggle, !talkBlock || sleeping, sTip, "Roo can’t settle down for sleep " + talkBlock);
            if (slave()) addButton(9, "Free Her", freeHerSanity, "Free Her", "You can free Roo of her servitude and give her her life back. <b>She will never be your slave again.</b>");
            else if (!hired()) btn(9, "Hire Her", hireHer, crewHas("ANNO"), "With Anno’s help, you can have Roo set up with Steele Tech as a trainee.", "You’re not exactly the CEO of dad’s company yet. <b>Perhaps there’s a friendly, snowy-white ausar out there who can facilitate this?</b>");
            btn(10, "Evict Her", evictHer, coreStation(), "Send Roo away. You can always pick her up later.", "You can’t send Roo away whilst on the frontier. Make your way to a Core station so that she can get to safety.");
        } else {
            addDisabledButton(8, "Sleep With", "Sleep With", "Give Roo some time to settle in aboard first.");
        }
        addButton(14, "Back", function () { mainGameMenu(); });
    }
    H.menu = rooMenu;
    function backToRoo(line) {
        clearOutput(); showRoo(); byUs(); CTX = {};
        say([line || pick(["Roo tilts her head at you, [roo.ears] flopping. <i>“Anything else?”</i>", "Roo smooths out her bedsheets and looks up at you expectantly.", "<i>“{slave: What else can I do for you, [pc.Master]? / free: So, what else is on your mind, [pc.name]?}”</i> Roo asks."])]);
        rooMenu();
    }
    H.back = backToRoo;
    function coreStation() {
        try { var p = getPlanetName(); return p === "Tavros Station" || p === "Canadia Station" || p === "Uveto Station"; } catch (e) { return false; }
    }

    /* ---------- Seventh Day Event (fires from the ship-return hook) ---------- */
    COND[1444] = function () { return persona() === "bimbo"; };
    COND[1448] = function () { return persona() === "bro"; };
    COND[1452] = function () { return persona() === "kind"; };
    COND[1456] = function () { return persona() === "misch"; };
    COND[1460] = function () { return persona() === "hard"; };
    COND[1464] = M;
    function seventhDay() {
        scene();
        flags.TN_ROO_7DAY = 1;
        doc(1430, 1480);
        timePass(20);
        output("\n\n<b>Roo has settled in. You can now Chat with her, ask her to share your bed, and " + (slave() ? "free her" : "ask Anno about hiring her") + ". She may also email you while you’re away from the ship.</b>");
        next(mainGameMenu);
    }

    /* ---------- Appearance ---------- */
    COND[1521] = slave; COND[1527] = free; COND[1533] = M;
    function appearance() {
        scene();
        doc(1521, 1565);
        pcLust(15 + rnd(10));
        next(function () {
            scene();
            doc(1575, 1577);
            rooMenu();
        });
    }

    /* ---------- Talk ---------- */
    COND[1593] = slave; COND[1599] = free; COND[1609] = M;
    function talkMenuIntro() {
        scene();
        var kmh = ["kind", "misch", "hard"].indexOf(persona()) >= 0;
        doc(1593, 1607, kmh ? [1607] : [1605, 1607]);
        talkMenu();
    }
    function talkMenu() {
        clearMenu();
        btn(0, "Chat", chatIntro, settled(), "See what Roo’s learned in her time on the ship, or see if she has anything to say about your crew!", "You’ll need to give Roo time to settle before you can start having idle chit chat with her.");
        addButton(1, "Slavery", talkSlavery, "Slavery", "How did Roo become a slave, and what brought her to Zheng Shi?");
        if (flags.TN_ROO_TALK_SLAVERY) {
            addButton(2, "Herself", talkHerself, "Herself", "Roo had a life before one of slavery. What was it like?");
            addButton(3, "Plutus", talkPlutus, "Plutus", "Her boss, Plutus... why is she so fond of him?");
        } else {
            addDisabledButton(2, "???", "???", "You’ll need a good starting point for this. Try another talk option.");
            addDisabledButton(3, "???", "???", "You’ll need a good starting point for this. Try another talk option.");
        }
        if (flags.TN_ROO_TALK_SLAVERY && flags.TN_ROO_TALK_HERSELF) addButton(4, "Bro & Sis", talkSibs, "Bro & Sis", "Cezary and Cosette are Roo’s siblings... how close were they?");
        else addDisabledButton(4, "???", "???", "Broach some other topics first.");
        if (flags.TN_ROO_TALK_HERSELF && flags.TN_ROO_TALK_SIBS) {
            var lbl = flags.TN_ROO_REUNITED ? "Parents" : "Family";
            var can = !flags.TN_ROO_TALK_FAMILY || flags.TN_ROO_REUNITED;
            btn(5, lbl, talkFamily, can, flags.TN_ROO_REUNITED ? "See how things are going between Roo and her parents." : "Ask Roo if she’s still thinking about her family and wants to see them again.",
                slave() ? "You’ve already asked this of Roo. While she would like to see them again, her continued slavery is not something she wants them to know about." : "You’ve already asked her about this. There may be a day that comes when you can help her reestablish a connection with her family, but 12 years is a long time." + (crewHas("ANNO") && hired() ? " <b>Anno might be able to help.</b>" : ""));
        } else addDisabledButton(5, "???", "???", "This is a topic that’ll take some digging to get to.");
        addButton(14, "Back", function () { backToRoo(); });
    }
    function talkDone(a, b) { timePass(a, b); next(function () { scene(); output("Roo shifts on the bed, waiting to see if you have anything else to ask."); talkMenu(); }); }

    /* Chat */
    COND[1630] = function () { return !!CTX.first && slave(); };
    COND[1634] = function () { return !!CTX.first && free(); };
    COND[1638] = function () { return !CTX.first; };
    function chatIntro() {
        scene();
        CTX.first = !flags.TN_ROO_CHATTED; flags.TN_ROO_CHATTED = 1;
        doc(1630, 1640);
        chatMenu();
    }
    function chatMenu() {
        clearMenu();
        addButton(0, "What’s New?", chatNew, "What’s New?", "Roo must have had some time to read up things online, catch up on the galaxy. Lend an ear.");
        var hasPump = invFind("SukMastr") >= 0;
        if (!flags.TN_ROO_TOYS_TALKED) addButton(1, "Toys", chatToys, "Toys", "Roo doesn’t attempt to hide a few of the toys sitting around her bed. If anything you could get her in the mood with a little lewd talk...");
        else if (!flags.TN_ROO_PUMP_GIVEN) btn(1, "Give Pump", givePump, hasPump, "If you want to talk further about this, then you’ll need to share your Pussy Pump with Roo.", "You don’t have a pussy pump. Woe is you. (Roo wants a SukMastr 2000.)");
        else addButton(1, "Toys", chatToys, "Toys", flags.TN_ROO_PUMP_USED ? "Ask Roo how she liked that little toy." : "Maybe it’s time to try that Pump out...");
        addButton(2, "Zheng Shi", chatZheng, "Zheng Shi", "Roo was a dealer on Zheng Shi for quite a while. What can she tell you about her time there, particularly about the big five gangs?");
        btn(3, "Crew", chatCrew, crewOthers() > 0, "Roo must have gotten to know your crew. What does she think about them?", "You don’t have anyone else on board besides Roo, so she can’t exactly tell you her feelings about them!");
        addButton(14, "Back", function () { scene(); output("Roo folds her hands in her lap. <i>“Something else?”</i>"); talkMenu(); });
    }
    function chatDone() { timePass(5, 10); next(function () { scene(); doc(1640, 1640); chatMenu(); }); }

    var NEWS = [[1658, 1670], [1674, 1694], [1698, 1706], [1710, 1739]];
    COND[1656] = M; COND[1672] = M; COND[1696] = M; COND[1708] = M;
    COND[1721] = function () { return credits() < 100000000; };
    COND[1725] = function () { return credits() >= 100000000; };
    COND[1729] = function () { return false; };
    COND[1733] = M;
    function chatNew() {
        scene();
        var i = (flags.TN_ROO_NEWS || 0) % NEWS.length; flags.TN_ROO_NEWS = (flags.TN_ROO_NEWS || 0) + 1;
        doc(1654, 1654);
        doc(NEWS[i][0], NEWS[i][1], null, true);
        chatDone();
    }
    COND[1785] = function () { return !flags.TN_ROO_PUMP_USED; };
    COND[1799] = function () { return false; };
    COND[1803] = function () { return false; };
    COND[1815] = function () { return !!flags.TN_ROO_PUMP_USED; };
    function chatToys() {
        scene();
        if (!flags.TN_ROO_TOYS_TALKED) {
            flags.TN_ROO_TOYS_TALKED = 1;
            doc(1759, 1773);
            pcLust(5);
            timePass(5);
            next(function () { scene(); doc(1640, 1640); chatMenu(); });
            return;
        }
        if (!flags.TN_ROO_PUMP_USED) {
            doc(1785, 1791);
            clearMenu();
            addButton(0, "Use Puss.Pump", function () { window.tnRooSex("pump"); }, "Use Puss.Pump", "Strap the SukMastr 2000 onto her and see what happens.");
            addButton(1, "Later", function () { scene(); doc(1805, 1807); chatDone(); }, "Later", "Not now.");
            return;
        }
        doc(1815, 1830);
        pcLust(10);
        clearMenu();
        addButton(0, "Sex", sexMenuIntro, "Sex", "Answer the call.");
        addButton(1, "Back", function () { scene(); doc(1846, 1848); chatDone(); }, "Back", "Not now.");
    }
    function givePump() {
        ourScene();
        invTake("SukMastr");
        flags.TN_ROO_PUMP_GIVEN = 1;
        say(["You dig the SukMastr 2000 out of your pack and hold it up between two fingers. The pink cup catches the light, its little pump bulb dangling from the hose like a tail.",
            "Roo’s eyes go perfectly round. <i>“Is that... for me?”</i> She takes it in both hands like you’ve given her jewelry, turning it over and over, already reading the settings printed on the base. <i>“The 2000! Not even the cheap one!”</i> Her tails twist together into a happy knot. <i>“{slave: Thank you, [pc.Master]! I’ll take such good care of it! / free: [pc.name], you’re the best! I’m going to take such good care of it!}”</i>",
            "<b>You gave Roo your SukMastr 2000.</b> Ask her about her Toys again, or find <b>Use Puss.Pump</b> in her Sex menu."]);
        chatDone();
    }
    var ZS = [[1862, 1870], [1874, 1882], [1886, 1906], [1910, 1915]];
    COND[1860] = M; COND[1872] = M; COND[1884] = M; COND[1908] = M;
    function chatZheng() {
        scene();
        var i = (flags.TN_ROO_ZS || 0) % ZS.length; flags.TN_ROO_ZS = (flags.TN_ROO_ZS || 0) + 1;
        doc(1858, 1858);
        doc(ZS[i][0], ZS[i][1], null, true);
        chatDone();
    }
    var CREWTALK = { ANNO: [1933, 1937], AZRA: [1941, 1945], KASE: [1949, 1955], PENNY: [1959, 1965], PENNY_BIMBO: [1969, 1973], RAMIS: [1977, 1981], SHEKKA: [1985, 1988], ARDIA: [1992, 2006], LEILA: [2010, 2016] };
    COND[1994] = function () { try { return ardia.domLevel() <= 3; } catch (e) { return true; } };
    COND[2000] = function () { try { return ardia.domLevel() > 3; } catch (e) { return false; } };
    function chatCrew() {
        scene();
        CTX.first = !flags.TN_ROO_CREWTALKED; flags.TN_ROO_CREWTALKED = 1;
        doc(1927, 1929);
        var ids = [];
        for (var id in CREWTALK) {
            if (id === "PENNY_BIMBO") continue;
            if (!crewHas(id)) continue;
            if (id === "PENNY") { var bim = false; try { bim = penny.isBimbo(); } catch (e) {} ids.push(bim ? "PENNY_BIMBO" : "PENNY"); }
            else ids.push(id);
        }
        ids.sort(function () { return Math.random() - 0.5; });
        if (!ids.length) output("\n\n<i>“...But it’s mostly just us, isn’t it?”</i> Roo laughs. <i>“I don’t mind. More of you for me.”</i>");
        ids.slice(0, 3).forEach(function (id) { doc(CREWTALK[id][0], CREWTALK[id][1], null, true); });
        chatDone();
    }

    /* Slavery / Herself / Plutus / Bro & Sis / Family */
    COND[2027] = function () { return !!CTX.first; }; COND[2033] = function () { return !CTX.first; }; COND[2037] = M;
    function talkSlavery() {
        scene(); CTX.first = !flags.TN_ROO_TALK_SLAVERY;
        doc(2027, 2069);
        next(function () {
            scene(); CTX.first = !flags.TN_ROO_TALK_SLAVERY;
            doc(2078, 2096);
            if (!flags.TN_ROO_TALK_SLAVERY) output("\n\n<b>You can now set what Roo wears with " + (slave() ? "Order" : "Request") + " &gt; Clothing.</b>");
            flags.TN_ROO_TALK_SLAVERY = 1;
            talkDone(6, 11);
        });
    }
    COND[2116] = function () { return !!CTX.first; }; COND[2120] = function () { return !CTX.first; }; COND[2124] = M;
    COND[2156] = function () { return free() && !hired() && crewHas("ANNO"); };
    function talkHerself() {
        scene(); CTX.first = !flags.TN_ROO_TALK_HERSELF; CTX.firstTime = CTX.first;
        doc(2116, 2158);
        if (!flags.TN_ROO_TALK_HERSELF) output("\n\n<b>You can now ask Roo about her Ears.</b>");
        flags.TN_ROO_TALK_HERSELF = 1;
        talkDone(3, 8);
    }
    COND[2180] = function () { return !!CTX.first; }; COND[2184] = function () { return !CTX.first; }; COND[2188] = M;
    function talkPlutus() {
        scene(); CTX.first = !flags.TN_ROO_TALK_PLUTUS;
        doc(2180, 2218);
        if (!flags.TN_ROO_TALK_PLUTUS) output("\n\n<b>You can now ask Roo about her Milkies.</b>");
        flags.TN_ROO_TALK_PLUTUS = 1;
        talkDone(3, 8);
    }
    COND[2242] = function () { return !!CTX.first; }; COND[2246] = function () { return !CTX.first; }; COND[2250] = M;
    COND[2274] = function () { return false; };
    function talkSibs() {
        scene(); CTX.first = !flags.TN_ROO_TALK_SIBS;
        doc(2242, 2276);
        if (flags.TN_ROO_REUNITED) {
            byUs();
            output("\n\n" + txt("Roo’s smile goes soft at the edges. <i>“Cosey messages me every single day now. Mostly memes. Chezzy calls once a week and pretends he isn’t checking up on me.”</i> She hugs a pillow to her chest. <i>“He’s still a dork. I love him so much.”</i>"));
        }
        if (!flags.TN_ROO_TALK_SIBS) output("\n\n<b>You can now set Pet Names with Roo.</b>");
        flags.TN_ROO_TALK_SIBS = 1;
        talkDone(4, 8);
    }
    COND[2304] = function () { return !CTX.reunited; };
    COND[2310] = function () { return !CTX.reunited && slave(); };
    COND[2316] = function () { return !CTX.reunited && free(); };
    COND[2322] = function () { return !CTX.reunited; };
    COND[2328] = function () { return false; };
    var PARENT_TALKS = [
        "<i>“Mom sent me a care package,”</i> Roo announces, pointing at a box on her desk big enough to hide in. <i>“Clothes, snacks, three books about financial planning, and a very long letter about wearing a jacket on cold stations.”</i> She giggles. <i>“I’m thirty. She doesn’t care.”</i>",
        "Roo rolls onto her back, ears flopping over the edge of the bed. <i>“Dad calls me Ellie on the comm and then catches himself and says Roo. Every time. I told him he can call me whatever he wants.”</i> She smiles up at the ceiling. <i>“I think he likes having the choice.”</i>",
        "<i>“They want to visit,”</i> Roo says, chewing on her lip. <i>“Mom asked if your ship has a guest room. I said no. She said she’d bring one.”</i> A pause. <i>“I don’t know what that means and I’m scared to ask.”</i>",
        "<i>“I talked to Mom for two hours yesterday,”</i> Roo says, flopping back on the bed. <i>“We didn’t even talk about anything! Just... stuff. What we ate. What the weather’s like on Fetina B. She laughed at one of my jokes.”</i> Her tails curl happily. <i>“Twelve years, and it’s like I never left. Except for all the parts where it isn’t.”</i>"
    ];
    function talkFamily() {
        scene(); CTX.reunited = !!flags.TN_ROO_REUNITED;
        if (CTX.reunited) {
            byUs();
            say(["You ask how things are going with her parents.", pick(PARENT_TALKS)]);
        } else doc(2304, 2324);
        flags.TN_ROO_TALK_FAMILY = 1;
        talkDone(10, 20);
    }
