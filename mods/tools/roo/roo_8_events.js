    /* ================= 8. Ship events, travel blurbs, emails, Codex panel, reunion with her family ================= */
    k("pcTallness<=78", function () { return (pc.tallness || 66) <= 78; });
    k("rooRecruitedDays<=30", function () { return days() <= 30; });
    FIX[6996] = [["//placeholdersForOtherApplicableCrewHereLATER ", ""]];

    /* ---------- time away from the ship ---------- */
    function consumeAway() {
        var s = flags.TN_ROO_OFF_START;
        flags.TN_ROO_OFF_START = undefined;
        flags.TN_ROO_MAIL_AT = undefined;
        return s === undefined ? 0 : Math.max(0, now() - s);
    }

    /* Called from the game's insideShipEvents(). true = we took over the screen. */
    window.tnRooShipEvent = function () {
        if (!ready() || !modOn()) return false;
        var away = consumeAway();
        if (flags.TN_ROO_STATE !== 2) return false;
        try {
            if (!settled() && days() >= 7) { seventhDay(); return true; }
            if (away < 60) return false;
            var l = lust(), unlocked = flags.TN_ROO_RELIEF_UNLOCK === 1;
            var cool = flags.TN_ROO_RELIEF_TS === undefined || now() - flags.TN_ROO_RELIEF_TS >= 12 * 60;
            if (cool && ((!unlocked && l >= 60) || (unlocked && l >= 67 && rnd(2) === 0))) { lustyEvent(); return true; }
            if (rnd(2) === 0) {
                if (flags.TN_ROO_AMB_KISS === 1) { kissAmbush(); return true; }
                if (flags.TN_ROO_AMB_HUG === 1) { snuggleAmbush(); return true; }
                if (flags.TN_ROO_AMB_PET === 1 && free()) { headpatAmbush(); return true; }
                if (flags.TN_ROO_AMB_GROPE === 1 && free()) { teaseAmbush(); return true; }
            }
        } catch (e) { if (window.console) console.warn("[TN Roo] ship event", e); }
        return false;
    };

    /* ---------- Travel blurbs (William's six, plus a taur one of ours) ---------- */
    COND[1148] = function () { return hasCock(); };
    COND[1154] = function () { return !hasCock(); };
    COND[1160] = M;
    COND[1196] = slave; COND[1208] = free;
    COND[1234] = free; COND[1250] = slave;
    COND[1282] = function () { return hasCock() && hasPussy(); };
    COND[1290] = function () { return hasPussy() && !hasCock(); };
    COND[1298] = function () { return hasCock() && !hasPussy(); };
    COND[1306] = M;
    var TRAVEL = [
        { id: 1, a: 1146, b: 1164, ok: function () { return slave() && hasGenitals(); }, fx: function () { pcCum(); } },
        { id: 2, a: 1174, b: 1184, ok: function () { return slave() && hasCock() && !milky(); }, fx: function () { pcCum(); } },
        { id: 3, a: 1194, b: 1216, ok: function () { return true; }, fx: function () { if (slave() && hasCock()) pcCum(); else pcLust(7); try { pc.imbibeAlcohol(15); } catch (e) {} } },
        { id: 4, a: 1232, b: 1266, ok: function () { return true; }, fx: function () { pcLust(7); addLust(10); } },
        { id: 5, a: 1280, b: 1310, ok: function () { return free() && hasGenitals(); }, fx: function () { pcCum(); pcCum(); } },
        { id: 6, a: 1320, b: 1340, ok: function () { return free() && hasCock(); }, fx: function () { pcCum(); rooCums(1); } }
    ];
    window.tnRooTravel = function (dest) {
        try {
            if (!ready() || !modOn() || flags.TN_ROO_STATE !== 2 || flags.TN_ROO_TRAVEL_OFF === 1) return;
            if (dest === "Fetina B" || rnd(10) >= 4) return;
            if (body() === "taur") { taurTravel(); return; }
            var seen = flags.TN_ROO_TRAVEL_SEEN || 0, last = flags.TN_ROO_TRAVEL_LAST;
            var pool = TRAVEL.filter(function (t) { return t.ok() && t.id !== last; });
            if (!pool.length) return;
            var fresh = pool.filter(function (t) { return !(seen & (1 << t.id)); });
            var v = pick(fresh.length ? fresh : pool);
            CTX = { first: !(seen & (1 << v.id)), usedCock: hasCock() };
            CTX.repeat = !CTX.first;
            flags.TN_ROO_TRAVEL_SEEN = seen | (1 << v.id);
            flags.TN_ROO_TRAVEL_LAST = v.id;
            author("William");
            output(para(1142) + "\n\n");
            doc(v.a, v.b, null, false);
            output("\n\n");
            v.fx();
        } catch (e) { if (window.console) console.warn("[TN Roo] travel", e); }
    };
    function taurTravel() {
        author("Techy-Nest");
        say([para(1142),
            slave() ? "Your pilot’s station was never built for a body like yours, so you stand at the controls instead, hooves planted. Roo pads onto the bridge, bows, and without a word ducks down beneath your barrel. <i>“For the trip, [pc.Master],”</i> she murmurs, already reaching for you."
                : "Your pilot’s station was never built for a body like yours, so you stand at the controls instead, hooves planted. Roo bounces onto the bridge, pats your flank like you’re a prize steed, and ducks down beneath your barrel with a giggle. <i>“Don’t mind me! Just keeping the captain happy.”</i>",
            "{hasCock: Her mouth finds your [pc.cock] and the rest of the trip goes by in a warm, wet blur, her tongue rasping along you while you try very hard to keep your eyes on the nav display. You cum just as the drive spools down, and she drinks every drop. / hasPussy: Her tongue finds your [pc.vagina] and the rest of the trip goes by in a warm, wet blur, her rough licks making your legs shake while you try very hard to keep your eyes on the nav display. You cum just as the drive spools down, splattering her face. / else: There isn’t much down there for her to play with, so she settles for leaning against your forelegs and stroking your flank while you fly, chattering about the stars. It’s nice.}",
            "Roo crawls back out, licks her lips, and pats you twice on the flank. <i>“{slave: Safe landing, [pc.Master]. / free: Good ride. Ha!}”</i>"
        ]);
        output("\n\n");
        if (hasGenitals()) pcCum(); else pcLust(5);
        flags.TN_ROO_TRAVEL_LAST = 7;
    }

    /* ---------- Emails ---------- */
    var MAILS = [
        null,
        [5882, 5886, 5910, 0], [5920, 5924, 5948, 0], [5958, 5962, 5986, 0], [5997, 6001, 6025, 0], [6039, 6043, 6051, 1],
        [6065, 6069, 6077, 1], [6091, 6095, 6095, 1], [6107, 6111, 6115, 1], [6127, 6131, 6135, 1], [6147, 6151, 6159, 2]
    ];
    function mailKey(i) { return "tn_roo_mail_" + i; }
    function mailFrom() { return hired() ? "RCS1@SteeleTech.corp" : "RCS1@GalLink.org"; }
    function mailBody(i) { var m = MAILS[i]; return docText(m[1], m[2]).join("\n\n"); }
    function mailSubject(i) { return para(MAILS[i][0]).replace(/^\s*Subject:\s*/i, ""); }
    function registerMail() {
        try {
            var MM = window.MailManager;
            if (!MM || typeof MM.addMailEntry !== "function") return false;
            for (var i = 1; i < MAILS.length; i++) {
                (function (i) {
                    if (MM.hasEntry && MM.hasEntry(mailKey(i))) return;
                    MM.addMailEntry(mailKey(i), {
                        content: function () { return mailBody(i); },
                        subject: function () { return mailSubject(i); },
                        from: "Roo",
                        fromAddress: function () { return mailFrom(); }
                    });
                })(i);
            }
            return true;
        } catch (e) { if (window.console) console.warn("[TN Roo] mail", e); return false; }
    }
    function sendRooMail() {
        var hist = String(flags.TN_ROO_MAIL_HIST || "").split(",").filter(Boolean).map(Number);
        var lvl = lustLvl(), pool = [];
        for (var i = 1; i < MAILS.length; i++) if (MAILS[i][3] <= lvl && hist.indexOf(i) < 0) pool.push(i);
        if (!pool.length) return;
        var n = pick(pool);
        try {
            var MM = window.MailManager;
            if (MM.isUnlocked && MM.isUnlocked(mailKey(n)) && MM.resendMail) MM.resendMail(mailKey(n));
            else MM.sendMail(mailKey(n));
        } catch (e) { try { window.MailManager.resendMail(mailKey(n)); } catch (e2) { return; } }
        hist.push(n);
        flags.TN_ROO_MAIL_HIST = hist.slice(-4).join(",");
        flags.TN_ROO_MAIL_TS = now();
        inc("TN_ROO_MAILS");
    }
    var mailReady = false;
    function poll() {
        if (!ready()) return;
        if (!mailReady) mailReady = registerMail();
        if (!modOn() || flags.TN_ROO_STATE !== 2) return;
        if (onShip()) return;
        if (flags.TN_ROO_OFF_START === undefined) flags.TN_ROO_OFF_START = now();
        if (!settled() || !mailReady) return;
        if (flags.TN_ROO_MAIL_AT === undefined) flags.TN_ROO_MAIL_AT = (48 + rnd(25)) * 60;
        if (flags.TN_ROO_MAIL_AT < 0) return;   // already wrote this trip
        if (now() - flags.TN_ROO_OFF_START < flags.TN_ROO_MAIL_AT) return;
        if (flags.TN_ROO_MAIL_TS !== undefined && now() - flags.TN_ROO_MAIL_TS < 144 * 60) return;
        sendRooMail();
        flags.TN_ROO_MAIL_AT = -1;
    }

    /* ---------- Codex > Extra: Roo ---------- */
    var LUSTW = ["calm", "warmed up", "very horny"];
    var CLOTHESW = ["her full dealer’s outfit", "her skirt and top", "her top and panties", "just her panties", "nothing at all", "her Steele Tech uniform"];
    function codexItem() {
        var st = flags.TN_ROO_STATE;
        if (st !== 2 && st !== 3 && st !== 5) return null;
        var item = { name: "Roo", desc: st === 2 ? "Roo’s status, her vibrators and more." : (st === 3 ? "Call Roo at her Tavros apartment." : "Call Roo on Fetina B."), txt: "Roo",
            f: function () { rooPanel(); }, ttH: "Roo", ttB: st === 2 ? "Check on Roo and fiddle with her toys." : "Give Roo a call." };
        var blocked = (typeof inCombat === "function" && inCombat()) || (window.ui && typeof ui.disableExtraCodexActions === "function" && ui.disableExtraCodexActions());
        if (blocked) { item.f = null; item.ttB = "You cannot use this at this time."; }
        return item;
    }
    function codexBack() { if (typeof window.showCodexExtra === "function") window.showCodexExtra(); else mainGameMenu(); }
    function rooPanel() {
        clearOutput(); byUs(); CTX = {};
        if (typeof showName === "function") showName("Roo");
        var st = flags.TN_ROO_STATE;
        if (st === 3) return evictedCall();
        if (st === 5) return familyCall();
        tick();
        var lines = [
            "<b>Roo</b> (" + (slave() ? "your slave" : (hired() ? "free, Steele Tech trainee" : "free")) + "), aboard for " + days() + " day" + (days() === 1 ? "" : "s") + ".",
            "<b>Mood:</b> " + LUSTW[lustLvl()] + " (" + lust() + "/100)" + (vibesIn() ? ". <b>Vibrators:</b> " + (vibesOffline() ? "recharging" : ["off", "low", "medium", "high"][flags.TN_ROO_VIBES || 0]) : ". No vibrators in."),
            "<b>Wearing:</b> " + CLOTHESW[clothes()] + (collar() ? ", with her silver collar" : "") + ", and " + (ears() === "cat" ? "cat" : "bunny") + " ears.",
            milky() ? "<b>Milk:</b> about " + Math.round(flags.TN_ROO_MILK) + "% full." : "",
            "<b>She calls you</b> " + pcTitle(false) + "<b>; you call her</b> " + rooTitle() + ".",
            "<b>Orgasms you’ve given her:</b> " + (flags.TN_ROO_ORGASMS || 0) + ". <b>Times together:</b> " + (flags.TN_ROO_SEXED || 0) + ".",
            flags.TN_ROO_RELIEF_UNLOCK === 1 ? "<b>When she needs relief, she will:</b> " + (flags.TN_ROO_RELIEF || "any") + "." : "",
            "<b>Travel blurbs:</b> " + (flags.TN_ROO_TRAVEL_OFF === 1 ? "off" : "on") + "."
        ];
        output(lines.filter(Boolean).join("\n"));
        clearMenu();
        btn(0, "Vibrators", vibesPanel, vibesIn(), "Fiddle with Roo’s vibrators wherever you are! Useful for controlling a girl’s lust...", "Roo’s vibrators are currently unused.");
        if (flags.TN_ROO_REUNITE === 2) addButton(1, "Roo’s Mom", momCall, "Roo’s Mom", "Open a communications channel with Roo’s mother Genevieve. Arrange for a meeting.");
        addButton(2, "Travel Blurbs", function () { flags.TN_ROO_TRAVEL_OFF = flags.TN_ROO_TRAVEL_OFF === 1 ? undefined : 1; rooPanel(); }, "Travel Blurbs", "Turn Roo’s visits to the bridge while you fly " + (flags.TN_ROO_TRAVEL_OFF === 1 ? "on." : "off."));
        addButton(14, "Back", codexBack);
    }
    COND[5789] = function () { return highLust() && onShip(); };
    COND[5797] = function () { return !(highLust() && onShip()); };
    function vibesPanel() {
        clearOutput(); byWilliam(); CTX = {};
        if (typeof showName === "function") showName("RGB\nDatasticks");
        doc(5741, 5743);
        var v = flags.TN_ROO_VIBES || 0, off = vibesOffline();
        if (off) output("\n\n<b>The vibrators are recharging after an overcharge.</b>");
        clearMenu();
        var set = function (n, a, b) { return function () { clearOutput(); byWilliam(); CTX = {}; var hl = highLust() && onShip(); doc(a, b); flags.TN_ROO_VIBES = n; if (n === 3 && hl) rooCums(1); vibesPanelMenu(); }; };
        btn(0, "Low Freq.", set(1, 5759, 5761), !off && v !== 1, "A low setting; gentle, ever-present pleasure chiseling away at the back of her mind...", off ? "They’re recharging." : "It’s already set to Low.");
        btn(1, "Med. Freq.", set(2, 5773, 5775), !off && v !== 2, "Normal; regular. This is the setting every alpha-husband torments their wife with while she’s giving a speech.", off ? "They’re recharging." : "The vibes are currently set to this. Vibe lower or higher, I don’t care!");
        btn(2, "High Freq.", set(3, 5787, 5801), !off && v !== 3, "High; not many people could handle this setting. Roo has been trained on it. It only makes sense to tease her thoroughly, doesn’t it?", off ? "They’re recharging." : "Roo’s currently vibing at max. Lower it, if it pleases you.");
        var ocLeft = flags.TN_ROO_OC_TS === undefined ? 0 : Math.ceil((flags.TN_ROO_OC_TS + OC_COOLDOWN - now()) / 60);
        btn(3, "Overcharge!", function () { clearOutput(); byWilliam(); CTX = {}; doc(5815, 5821); overchargeEffects(); vibesPanelMenu(); }, !off && ocLeft <= 0,
            "The Cum Button. If, for whatever reason, you want Roo to experience a brain-wiping orgasm, you just do it.",
            "The overcharge functionality is currently on cooldown. Seems even those capacitors must recharge. <b>Wait " + Math.max(1, ocLeft) + " more hour" + (ocLeft === 1 ? "" : "s") + "!</b>");
        btn(4, "Deactivate", function () { clearOutput(); byWilliam(); CTX = {}; doc(5833, 5835); flags.TN_ROO_VIBES = 0; vibesPanelMenu(); }, v !== 0 && !off, "Disable the little pink pleasure pills. Roo will appreciate any reprieve, surely.", "Roo’s vibes are inert. There’s no need to do this.");
        addButton(14, "Back", rooPanel);
    }
    function vibesPanelMenu() { clearMenu(); addButton(0, "Next", vibesPanel); addButton(14, "Back", rooPanel); }

    /* Evicted: she lives in a Tavros apartment. */
    function onTavros() { try { return getPlanetName() === "Tavros Station"; } catch (e) { return false; } }
    function evictedCall() {
        say(["Roo picks up on the second ring, [roo.ears] filling half the screen. <i>“{slave: [pc.Master]! / free: [pc.name]! Hi!}”</i> Behind her you can see the little apartment on Tavros: a bed, a window full of station lights, and the purple dildo propped proudly on a shelf like a trophy. <i>“Everything’s fine here. Quiet. {onTavros: Wait, you’re <b>here</b>? On the station? Are you coming to get me?”</i> / else: Too quiet. Are you coming back for me soon?”</i>}"]);
        clearMenu();
        btn(0, "Bring Her Back", function () {
            clearOutput(); showRoo(); byUs();
            flags.TN_ROO_STATE = 2;
            flags.TN_ROO_TICK_TS = now();
            flags.TN_ROO_OFF_START = undefined;
            say(["You tell her to pack her things. Roo squeals so loudly the call audio clips.",
                "Half an hour later she’s jogging up your ship’s ramp with a duffel over each shoulder and her tails held high, and she throws her arms around you at the top. <i>“{slave: I’m home, [pc.Master]. / free: I’m back! Did you miss me? You missed me.}”</i>",
                "<b>Roo has rejoined your crew.</b>"]);
            next(mainGameMenu);
        }, onTavros() && crewSpace(), "Have Roo move back aboard your ship.", !onTavros() ? "You need to be on Tavros Station to pick her up." : "You don’t have room aboard for her right now.");
        addButton(14, "Back", codexBack);
    }
    k("onTavros", onTavros);
    function familyCall() {
        say([pick([
            "The call connects to a bright, sunny room on Fetina B. Roo waves at you with both hands, Ellaroux Caci in a sundress, ears perked. <i>“[pc.name]! Mom says hi. Well, Mom says <b>‘tell your captain to call more often’</b>, which is the same thing.”</i> She talks for twenty minutes about school applications and Cosette’s new boyfriend, and when she hangs up she blows you a kiss.",
            "Roo answers from the Caci family garden, a trowel in one hand and dirt on her nose. <i>“I’m growing things! Real things! In the ground!”</i> She shows you every single plant. When you finally say goodbye, she makes you promise to call again soon.",
            "Cezary picks up instead, then yells for his sister, who barrels into frame and knocks him off his chair. <i>“Hi! Sorry! Hi!”</i> She looks happy. She looks <i>home</i>."])]);
        next(codexBack, "Back");
    }

    /* ---------- Anno: [Reunite] ---------- */
    window.tnRooAnnoButton = function (slot) {
        try {
            if (!ready() || !modOn() || flags.TN_ROO_STATE !== 2 || !free() || !hired()) return;
            if (flags.TN_ROO_REUNITE !== undefined && flags.TN_ROO_REUNITE >= 2) return;
            btn(slot, "Reunite", reuniteAnno, flags.TN_ROO_TALK_FAMILY !== undefined,
                "Roo’s parents must still be looking for her. How overjoyed would they be to finally see their daughter again? And having been employed, no less?",
                "You should talk to Roo about her family before you go digging into it.");
        } catch (e) {}
    };
    function showAnno() {
        if (typeof clearBust === "function") clearBust();
        try { showBust(anno.bustDisplay || "ANNO"); } catch (e) {}
        if (typeof showName === "function") showName("Anno");
    }
    function reuniteAnno() {
        clearOutput(); showAnno(); byWilliam(); CTX = {};
        if (flags.TN_ROO_REUNITE === undefined) {
            doc(6209, 6235);
            flags.TN_ROO_REUNITE = 1;
            flags.TN_ROO_REUNITE_TS = now();
            timePass(20, 30);
            next(mainGameMenu);
            return;
        }
        if (now() - (flags.TN_ROO_REUNITE_TS || 0) < 180) {
            byUs();
            say(["Anno has three windows of search results open and a headset on. She holds up a finger without looking at you. <i>“Still digging, boss. Give me a couple hours, I promise it’ll be worth it.”</i>"]);
            next(mainGameMenu);
            return;
        }
        doc(6254, 6288);
        flags.TN_ROO_REUNITE = 2;
        timePass(30);
        output("\n\n<b>You can now call Roo’s mother from Codex > Extra > Roo.</b>");
        next(mainGameMenu);
    }

    /* ---------- Codex: [Roo's Mom] ---------- */
    COND[6330] = function () { return persona() === "bimbo"; };
    COND[6338] = function () { return persona() === "bro"; };
    COND[6346] = function () { return persona() === "kind"; };
    COND[6354] = function () { return persona() === "misch"; };
    COND[6368] = function () { return persona() === "hard"; };
    COND[6376] = M;
    function momCall() {
        clearOutput(); byWilliam(); CTX = {};
        if (typeof showName === "function") showName("Calling...");
        doc(6306, 6312);
        next(function () {
            clearOutput(); byWilliam();
            if (typeof showName === "function") showName("Genevieve");
            doc(6320, 6404);
            flags.TN_ROO_REUNITE = 3;
            output("\n\n<b>Fetina B has been added to your ship’s Fly menu.</b>");
            next(codexBack, "Back");
        });
    }

    /* ---------- Fly: [Fetina B] ---------- */
    window.tnRooFlyButton = function (slot) {
        try {
            if (!ready() || !modOn() || flags.TN_ROO_STATE !== 2 || flags.TN_ROO_REUNITE !== 3) return;
            var why = milky() ? "Roo is currently... a bit indisposed. <b>Milk her completely before taking her home.</b>"
                : (collar() ? "It’s probably not a good idea for Roo to be wearing her collar still. <b>Have her take it off before flying out.</b>"
                    : (vibesIn() ? "Family reunions twelve years later are not the time for any kinky fun. <b>Have Roo take out those vibrators.</b>" : ""));
            btn(slot, "Fetina B", fetina1, !why, "Take Roo to her family. <b>This will be a lengthy trip.</b>", why);
        } catch (e) {}
    };
    function fetScene(nude) { clearOutput(); showRoo(nude); byWilliam(); CTX = { choice: flags.TN_ROO_FET_CHOICE }; pcLustMin(); }
    function fetina1() {
        fetScene();
        flags.TN_ROO_CLOTHES = 5;
        doc(6428, 6458);
        processTime(113 * 60); pcLustMin();
        next(function () {
            fetScene(); doc(6470, 6498);
            processTime(7 * 60); pcLustMin();
            next(function () {
                fetScene(); doc(6507, 6555);
                next(function () {
                    fetScene(); doc(6563, 6633); timePass(120);
                    next(function () {
                        fetScene(); doc(6641, 6669); timePass(180);
                        try { if (!pc.hasKeyItem("Family Photo with Roo")) pc.createKeyItem("Family Photo with Roo", 0, 0, 0, 0, "This photo of you with Roo’s family was taken on Fetina B. Looking at it gets you a little misty..."); } catch (e) {}
                        output("\n\n<b>Key Item Gained: Family Photo with Roo.</b>");
                        next(function () {
                            fetScene(); doc(6681, 6719); timePass(120);
                            next(function () {
                                fetScene(); doc(6727, 6751);
                                clearMenu();
                                addButton(0, "Stay w/ Me", function () { fetChoice("me"); }, "Stay w/ Me", "It’ll be dangerous, and there’s a chance something bad could happen to you or her... but having her around would do wonders for your morale.");
                                addButton(1, "Stay w/ Fam", function () { fetChoice("fam"); }, "Stay w/ Fam", "It might be for the best. The frontier will only get more dangerous. Roo won’t be totally unreachable - <b>but she will leave your crew.</b>");
                                addButton(2, "Up To You", function () { fetChoice("up"); }, "Up To You", "You will support whatever decision she makes. That is the meaning of freedom... and respect.");
                            });
                        });
                    });
                });
            });
        });
    }
    function fetChoice(c) {
        flags.TN_ROO_FET_CHOICE = c;
        fetScene();
        if (c === "me") doc(6765, 6773);
        else if (c === "fam") doc(6787, 6799);
        else upToYou();
        clearMenu();
        btn(0, "Cowgirl", fetCowgirl, hasCock(), "Let her ride you. She’ll do it very well.", "<b>No penis,</b> no ride. Damn damn damn God damn it!! That fucking sucks!");
        btn(1, "Trib", fetTrib, !hasCock(), hasPussy() ? "Roo will be on top, but mashing girly bits together would be some good pre-sleep exercise." : "Just because you don’t have a pussy doesn’t mean you can’t scissor. Besides, Roo will have fun regardless.",
            "Grinding pussies is going to be frustratingly difficult with a dick in the way, and Roo doesn’t look like she’s gonna bottom here. Let her go for a ride, come oooonnn...");
        addButton(2, "Cuddle", function () { fetScene(); doc(6881, 6885); timePass(30); next(departure); }, "Cuddle", "Mmmmaaybe sex isn’t a good idea in her parents’ home. Maybe being discreet is the better option here.");
    }
    function upToYou() {
        byUs();
        say([
            "You don’t answer right away. You take her hands instead and turn them over in yours, looking at the calluses from twelve years of shuffling cards, and the new soft spots from a few months of not having to.",
            "<i>“It’s your choice, Roo,”</i> you tell her. <i>“Not mine. Not your mom’s. Whatever you pick, I’m on your side. If you stay, I’ll call. If you come, I’ll keep you safe. Either way you win.”</i>",
            "Roo stares at you. Her lip wobbles. Then she laughs, a wet, startled little laugh, and wipes her eyes with the heel of her hand. <i>“Nobody’s ever... just <b>let</b> me pick. Not since I was a kid.”</i> She squeezes your fingers so hard it almost hurts. <i>“Okay. I’ll tell everyone in the morning. Promise.”</i>",
            "She stands, tugs you back inside, and nudges the balcony door shut with her heel. Her eyes have a light in them you haven’t seen before. <i>“But tonight I know <b>exactly</b> what I want.”</i> Her uniform’s zipper goes down slowly, one tooth at a time.",
            "Whatever she decides tomorrow, tonight you decide to..."
        ]);
    }
    function fetCowgirl() {
        clearOutput(); showRoo(true); byUs(); CTX = {};
        say([
            "Roo pushes you down onto the guest bed. It’s enormous, soft and silk-sheeted, a bed for kaithrit nobility, and {taur: even you fit on it, sprawled on your side with your legs folded. / naga: even your coils fit, spread across it in loose loops. / else: you sink into it like a cloud.} She climbs over you, slow and deliberate, her uniform hanging open, her heavy breasts swaying.",
            "<i>“Shh,”</i> she whispers, giggling, one finger to your lips. <i>“Mom’s room is right down the hall.”</i> Then she reaches down and takes your [pc.cock] in her hand, and lowers herself onto it {taur: from where she kneels astride your hind leg, reaching back to hold herself steady on your flank / naga: right where your coils begin, your tail curling up her back to hold her / else: in one long, slow, shuddering slide}.",
            "She rides you the way she did everything in that casino: with total confidence and a showman’s rhythm. Hips rolling. Breasts bouncing. Tails swaying behind her in matching, mesmerizing arcs. But her eyes never leave yours, and there’s nothing professional about the way she looks at you.",
            "It gets harder to stay quiet. Roo clamps a hand over her own mouth, then over yours when you groan, and then gives up and kisses you instead to muffle you both. {taur: The bed creaks under your weight. / naga: Your coils tighten around her, pulling her down harder. / else: You grab her thick hips and pull her down harder.} The silk sheets slide everywhere.",
            "She cums with her face buried in your neck, shaking and biting down on your shoulder to keep from yowling. That squeezing heat drags you right over the edge, and you fill her with [pc.cum], holding her down on you while she trembles.",
            "Afterwards, she lies on top of you, sweaty and purring, and pulls the covers over both of you. <i>“That was the best night of my life,”</i> she mumbles into your chest. <i>“Don’t tell my mom.”</i>"
        ]);
        pcCum(); rooCums(1); inc("TN_ROO_SEXED");
        timePass(40);
        next(departure);
    }
    function fetTrib() {
        clearOutput(); showRoo(true); byUs(); CTX = {};
        say([
            "Roo pushes you onto the enormous guest bed and climbs on top of you, uniform hanging open, cheeks flushed. {taur: You roll onto your side, and she straddles your hind leg. / naga: She straddles the thick, warm length of your tail. / else: She straddles one of your thighs and hooks her leg over the other.} <i>“Shh. Mom’s right down the hall,”</i> she whispers, giggling, and lowers herself onto you.",
            "{hasPussy: Her slick pussy settles right against yours, wet lips kissing wet lips, and when she starts to grind, her clit catches against your [pc.clit] with every roll of her hips. / else: There’s nothing down there for her to kiss with hers, but that doesn’t slow her down in the slightest. She grinds her slick, swollen pussy against your smooth crotch like it was made for her, using you like the corner of a very lucky desk.}",
            "She’s on top, and she makes sure you know it. She sets the pace, rolling her hips in slow, filthy circles, then faster, her tails twisting behind her, her heavy breasts bouncing above you. {hasPussy: Every grind sends a spark straight through you. / else: The friction and the heat and the sight of her are enough on their own.} You grab her hips and grind back.",
            "It gets harder to stay quiet. Roo bites her lip, then the back of her hand, and then she just leans down and kisses you to muffle you both.",
            "{hasPussy: You cum together, shaking against each other, your juices mingling and soaking the silk sheets. / else: She cums first, shuddering and grinding through it, and the sight of her pleasure sends a warm, satisfied glow through you.} Roo collapses on top of you, sweaty and purring.",
            "<i>“Best night of my life,”</i> she mumbles into your chest. <i>“Don’t tell my mom.”</i>"
        ]);
        if (hasPussy()) pcCum(); else pcLust(20);
        rooCums(1); inc("TN_ROO_SEXED");
        timePass(40);
        next(departure);
    }
    COND[6908] = function () { return flags.TN_ROO_FET_CHOICE !== "fam"; };
    COND[6968] = function () { return flags.TN_ROO_FET_CHOICE === "fam"; };
    COND[7006] = M;
    function departure() {
        processTime(8 * 60);
        fetScene();
        doc(6898, 6906);
        next(function () {
            fetScene();
            var stays = flags.TN_ROO_FET_CHOICE !== "fam";
            doc(6908, 7002);
            processTime(120 * 60);
            flags.TN_ROO_REUNITE = 4;
            if (stays) {
                flags.TN_ROO_REUNITED = 1;
                output("\n\n<b>Roo is staying with you. She can call her family any time now, and she’s happier than ever.</b>");
            } else {
                flags.TN_ROO_STATE = 5;
                try { if (getCrewSleepWith() === "ROO") clearCrewSleepWith(); } catch (e) {}
                output("\n\n<b>Roo has left your crew to live with her family. You can still call her from Codex > Extra > Roo.</b>");
            }
            try { skipShipToRoom("KALAS.TAVROS.TAVROS HANGAR"); skipToRoom("KALAS.TAVROS.TAVROS HANGAR"); } catch (e) {}
            next(mainGameMenu);
        });
    }

    /* ---------- boot pieces used by part 9 ---------- */
    var codexHooked = false;
    function wrapCodex() {
        var orig = window.tnCodexExtraAddons;
        if (orig && orig.__tnRoo) return true;
        var w = function (lst) {
            if (typeof orig === "function") orig.apply(this, arguments);
            try {
                if (!ready() || !modOn() || !lst || typeof lst.push !== "function") return;
                for (var i = 0; i < lst.length; i++) if (lst[i] && lst[i].name === "Roo") return;
                var it = codexItem();
                if (it) lst.push(it);
            } catch (e) { if (window.console) console.warn("[TN Roo] codex", e); }
        };
        w.__tnRoo = true;
        for (var p in orig) if (orig && orig.hasOwnProperty(p) && p !== "__tnRoo") w[p] = orig[p];
        window.tnCodexExtraAddons = w;
        codexHooked = true;
        return true;
    }
