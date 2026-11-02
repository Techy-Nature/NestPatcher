/* TN Feruze Crew v2.8 (Techy-Nest, 2026-11-02)
   Feruze Vraqquis, the suula merc your cousin hired for Zheng Shi and Dhaal, shows up in the
   Crash Landing (the underground milk bar off the Mean Streets on Dhaal) once the Farrow job
   is over (flags.DHAAL_PROBE === 1). Canon says your cousin fired her after Dhaal; here she is
   drinking off her last paycheck. Talk to her, buy a round, hook up, or hire her for your crew.

   Needs TN_FeruzeCrew_v2.8.mod (adds her to the Crash Landing bar room, button slot 6).
   Flags: TN_FERUZE_BAR_MET, TN_FERUZE_CREW (1 = aboard, 0 = sent back to the bar),
          TN_FERUZE_PAID (retainer paid once), TN_FERUZE_CREAMPIES (our own counter).
   Also bumps the game's FERUZE_SEXED. It never touches FERUZE_CAME_INSIDE, so the game's own
   MaxCorp/Briget pregnancy event is left alone.
   Sex: Fuck Her Puss, Scissor, Titfuck, Shark Seat. Each has taur and naga versions.
   Other mods: window.tnFeruzeAboard() returns true while she is crew. */
(function () {
    var MOD_ID = "tn-feruze-crew";
    var FEE = 5000;
    var FEE_FRIEND = 2500;

    function modOn() {
        try {
            return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID);
        } catch (err) { return true; }
    }

    function ready() { return typeof flags !== "undefined" && typeof pc !== "undefined" && pc; }

    function showHer(nude) {
        try {
            if (typeof feruze !== "undefined" && feruze && typeof feruze.showAll === "function") { feruze.showAll(!!nude); return; }
        } catch (err) {}
        if (typeof clearBust === "function") clearBust();
        if (typeof showBust === "function") showBust("FERUZE");
        if (typeof showName === "function") showName("Feruze");
    }

    function writer() { if (typeof author === "function") author("Techy-Nest"); }

    function say(paragraphs) {
        for (var i = 0; i < paragraphs.length; i++) output((i === 0 ? "" : "\n\n") + paragraphs[i]);
    }

    /* "taur", "naga", or "biped". */
    function body() {
        try {
            if (pc.isTaur && pc.isTaur()) return "taur";
            if (pc.isNaga && pc.isNaga()) return "naga";
        } catch (err) {}
        return "biped";
    }

    /* overrides = { taur: {index: text}, naga: {index: text} } */
    function bodySay(paragraphs, overrides) {
        var o = (overrides && overrides[body()]) || {};
        var out = [];
        for (var i = 0; i < paragraphs.length; i++) out.push(o.hasOwnProperty(i) ? o[i] : paragraphs[i]);
        say(out);
    }

    function her() { return (typeof feruze !== "undefined" && feruze) ? feruze : null; }

    function capacity() {
        try { var f = her(); if (f && typeof f.vaginalCapacity === "function") return f.vaginalCapacity(0); } catch (err) {}
        return 1200;
    }

    function fitIdx() {
        try { return pc.cockThatFits(capacity()); } catch (err) { return -1; }
    }

    function aboard() { return ready() && flags.TN_FERUZE_CREW === 1; }
    window.tnFeruzeAboard = function () { return aboard(); };

    function atBar() { return ready() && modOn() && flags.DHAAL_PROBE === 1 && flags.TN_FERUZE_CREW !== 1; }
    window.tnFeruzeAtBar = function () { return atBar(); };

    function sexed() { return ready() && !!flags.FERUZE_SEXED; }

    function daneAboard() {
        try {
            if (typeof window.tnDaneAboard === "function") return !!window.tnDaneAboard();
            return flags.TN_DANE_CREW === 1;
        } catch (err) { return false; }
    }

    function paidCrew() {
        if (typeof crew === "function") { try { return crew(true, false); } catch (err) {} }
        var n = 0;
        if (typeof chars === "undefined") return 0;
        for (var id in chars) {
            var p = chars[id];
            if (p && p.isCrew && p.isCrew() && !p.freeRent) n++;
        }
        return n;
    }

    function roomForHer() {
        if (typeof flags !== "undefined" && typeof flags.INFINITE_CREW !== "undefined") return true;
        if (typeof pc_ship === "undefined" || !pc_ship || typeof pc_ship.crewCapacity !== "function") return true;
        return paidCrew() < pc_ship.crewCapacity();
    }

    function bumpSexed() {
        if (typeof IncrementFlag === "function") IncrementFlag("FERUZE_SEXED");
        else flags.FERUZE_SEXED = (flags.FERUZE_SEXED || 0) + 1;
    }

    /* ---------------- Crash Landing ---------------- */

    /* Called from the bar room (TN_FeruzeCrew_v2.8.mod). */
    window.tnFeruzeBar = function () {
        if (!atBar()) return;
        if (flags.TN_FERUZE_BAR_MET === undefined) {
            output("\n\nIn the booth farthest from the door, a set of broad, dark wings is folded up against the wall like a pair of drawn curtains. You know those wings. <b>Feruze</b> is hunched over a drink, glaring into it like it owes her money.");
        } else {
            var lines = [
                "\n\nFeruze has her usual back booth, wings tucked in tight, nursing something thick and pink and glaring at anyone who looks at her too long.",
                "\n\nFeruze is in her back booth again, boots up on the opposite bench, slowly working through a glass the size of your head.",
                "\n\nOver in the back booth, Feruze is picking at the label on a bottle with one claw. She lifts it a little when she catches you looking."
            ];
            output(lines[Math.floor(Math.random() * lines.length)]);
        }
        addButton(6, "Feruze", window.tnFeruzeApproach, "Feruze", flags.TN_FERUZE_BAR_MET === undefined ? "Go see why your cousin’s bodyguard is drinking alone." : "Join the suula in her booth.");
    };

    window.tnFeruzeApproach = function () {
        clearOutput();
        showHer();
        writer();
        if (flags.TN_FERUZE_BAR_MET !== undefined) {
            var greet = [
                "Feruze kicks the opposite bench out for you with one boot. <i>“[pc.name]. Sit. You’re blocking my light.”</i>",
                "Feruze lifts her glass at you without getting up. <i>“Look who it is. Come to buy the help a drink?”</i>",
                "Feruze’s wings rustle as you slide in. <i>“Hey, Steele.”</i> Her teeth show. <i>“Was hoping you’d come by.”</i>"
            ];
            output(greet[Math.floor(Math.random() * greet.length)]);
            window.tnFeruzeBarMenu();
            return;
        }
        flags.TN_FERUZE_BAR_MET = 1;
        var p = [];
        p.push("You weave between the booths of milk-drunk zaika and stop at the back table. Up close, Feruze is just as big as you remember: better than eight feet of shark-toothed suula wedged into a booth meant for three, wings folded so tight the feathers creak. Her armor is unzipped to the sternum and her pistols are lying on the table in a neat row, which the bouncer must have <i>loved</i>.");
        p.push("She doesn’t look up. <i>“Booth’s taken. Fuck off.”</i>");
        p.push("<i>“Nice to see you too, Feruze.”</i>");
        if (sexed()) p.push("That gets her head up. Her orange eyes go wide, then narrow, then do something complicated. <i>“Oh. Oh, it’s <b>you</b>.”</i> She shoves the far bench out with her boot. <i>“Sit down before I change my mind. Or before I don’t.”</i>");
        else if (flags.FERUZE_ZHENG_OUTCOME === 1 || flags.FERUZE_DHAAL_FIGHT_OUTCOME === 1) p.push("That gets her head up. She looks you over, and her lip curls back from a lot of teeth. <i>“Great. The one person on this rock who’s kicked my ass. Twice, if you’re counting, and I bet you are.”</i> She shoves the far bench out with her boot anyway. <i>“Sit. You’re buying.”</i>");
        else p.push("That gets her head up. She looks you over, then sighs through her teeth and shoves the far bench out with her boot. <i>“Steele. Course it’s you. Sit, you’re buying.”</i>");
        p.push("You sit. <i>“Where’s [rival.name]?”</i>");
        p.push("Feruze laughs, and it isn’t a nice sound. <i>“Gone. Off-world. And I’m off the payroll.”</i> She pulls a battered Codex out of a thigh pouch and slaps it on the table hard enough to rattle the pistols. The screen shows a message two lines long. <i>“That’s it. That’s my severance. ‘Your services are no longer required. Final payment attached.’ After I flew into the frakking Farrow for that little shit. After I got shot at by every corp on this planet.”</i>");
        p.push("She drains half her glass in one go. <i>“Guild’s gonna hear I lost a Steele and then got canned by the same Steele. Nobody’s hiring me for a while. So I’m here. Only bar in the Gyre that won’t water the drinks or sell my face to a zaibatsu.”</i>");
        if (flags.FERUZE_TOTAL_KIDS > 0) p.push("She goes quiet for a moment, then glances at you sidelong. <i>“...Briget sent me a picture, by the way. Of the kid. She’s got your eyes.”</i> She clears her throat and looks back into her glass. <i>“Don’t make it weird.”</i>");
        else if (flags.FERUZE_DHAAL_LEFT_HER_PINING) p.push("She tips the glass at you. <i>“And you. You left me hanging on that bus roof, all worked up. Don’t think I forgot.”</i>");
        if (typeof window.mhorgennAtBar === "function") {
            try { if (window.mhorgennAtBar()) p.push("Across the room, a familiar orc laughs at something, loud enough to rattle glasses. Feruze’s eyes flick that way and her tail thumps the bench once. <i>“Yeah, she’s here too. Don’t ask.”</i>"); } catch (err) {}
        }
        p.push("She leans back, wings shifting against the wall. <i>“So. What do you want, Steele?”</i>");
        say(p);
        processTime(10);
        window.tnFeruzeBarMenu();
    };

    window.tnFeruzeBarMenu = function () {
        clearMenu();
        addButton(0, "Talk", window.tnFeruzeTalkMenu, "Talk", "Ask her about things.");
        addButton(1, "Buy A Round", window.tnFeruzeDrink, "Buy A Round", "20 credits. Drink with her.");
        if (pc.lust() >= 33 || sexed()) addButton(2, "Hook Up", window.tnFeruzeHookUp, "Hook Up", "Take her somewhere a bit more private.");
        else addDisabledButton(2, "Hook Up", "Hook Up", "You aren’t really in the mood.");
        addButton(3, "Hire Her", window.tnFeruzeRecruit, "Hire Her", "Offer her a job on your ship.");
        addButton(14, "Leave", mainGameMenu, "Leave", "Leave her to her drink.");
    };

    window.tnFeruzeDrink = function () {
        clearOutput();
        showHer();
        writer();
        if (pc.credits < 20) {
            output("You pat your pockets. Feruze watches you do it, unimpressed. <i>“You came all the way down here to <b>not</b> buy me a drink? Rusher, you are a piece of work.”</i>");
            window.tnFeruzeBarMenu();
            return;
        }
        pc.credits -= 20;
        var p = [];
        p.push("You flag down the cowgirl behind the bar and point at Feruze’s glass, then at yourself. Two drinks come back on a tray: something that smells like a distillery for you, and another tall glass of thick, faintly pink milk for Feruze.");
        var r = Math.floor(Math.random() * 3);
        if (r === 0) p.push("<i>“Zaika milk,”</i> she says, catching your look. <i>“Don’t knock it. Best painkiller in the system, and it doesn’t make me want to shoot anybody.”</i> She considers. <i>“Less. Doesn’t make me want to shoot anybody <b>less</b>.”</i>");
        else if (r === 1) p.push("She clinks her glass against yours hard enough to slop it. <i>“To being unemployed.”</i> She drinks. <i>“And to you, I guess. You’re the only Steele who’s ever bought me anything.”</i>");
        else p.push("Feruze spends most of the round telling you, in loving detail, every way she has considered hurting your cousin since getting fired. Some of them need drawings. She draws them on a napkin. They’re pretty good.");
        p.push("By the bottom of the glass her wings have loosened up and the feathers on her head are fluffed out, and she’s leaning on the table toward you instead of the wall.");
        say(p);
        if (typeof pc.imbibeAlcohol === "function") pc.imbibeAlcohol(16);
        processTime(20);
        window.tnFeruzeBarMenu();
    };

    /* ---------------- Talk ---------------- */

    function talkBack() { return aboard() ? window.tnFeruzeShipMenu : window.tnFeruzeBarMenu; }

    window.tnFeruzeTalkMenu = function () {
        clearMenu();
        addButton(0, "Getting Fired", window.tnFeruzeTalkFired, "Getting Fired", "Ask about [rival.name] letting her go.");
        addButton(1, "Zheng Shi", window.tnFeruzeTalkZheng, "Zheng Shi", "Bring up how you met, on that pirate asteroid.");
        addButton(2, "Dhaal", window.tnFeruzeTalkDhaal, "Dhaal", "Talk about the taxi, the Farrow, all of it.");
        addButton(3, "Suula Stuff", window.tnFeruzeTalkSuula, "Suula Stuff", "Wings, feathers, venom. Ask about being a suula.");
        if (flags.FERUZE_TOTAL_KIDS > 0) addButton(4, "The Kid", window.tnFeruzeTalkKid, "The Kid", "Ask about your daughter.");
        if (aboard()) addButton(5, "Ship Life", window.tnFeruzeTalkShip, "Ship Life", "Ask how she likes it aboard.");
        addButton(14, "Back", function () { clearOutput(); showHer(); writer(); output("Feruze shrugs a wing. <i>“Sure.”</i>"); talkBack()(); });
    };

    window.tnFeruzeTalkFired = function () {
        clearOutput();
        showHer();
        writer();
        say([
            "<i>“Why’d [rival.name] fire you, really?”</i>",
            "Feruze rolls her glass between her palms. <i>“Officially? ‘Repeated failure to protect the principal.’ Which, okay. I lost [rival.himHer] once on Dhaal. One time. And in my defence, [rival.heShe] snuck off to meet a spy without telling me.”</i>",
            "<i>“Unofficially?”</i>",
            "Her mouth twists. <i>“Unofficially, I think [rival.heShe] hated that I had to call <b>you</b> to bail us out. And that I kept calling you a better Steele while I did it. Out loud. Where [rival.heShe] could hear.”</i> She snorts. <i>“Worth it.”</i>",
            "<i>“Do you miss the job?”</i>",
            "<i>“I miss the pay.”</i> She thinks about it longer than you expect. <i>“And having somebody to stand in front of. That’s the whole job, Steele. You stand in front of someone, and you make sure whatever comes at them hits you first. [rival.name] never once said thanks. Not one time.”</i>"
        ]);
        processTime(10);
        window.tnFeruzeTalkMenu();
    };

    window.tnFeruzeTalkZheng = function () {
        clearOutput();
        showHer();
        writer();
        var p = ["<i>“Remember Zheng Shi?”</i>"];
        if (flags.FERUZE_ZHENG_OUTCOME === 1) p.push("<i>“Remember it? You put me on my ass on a gantry in front of my boss on my first week.”</i> Feruze bares her teeth, but she’s grinning. <i>“Took me a month to stop getting ribbed about it on the guild boards. Then you went and fucked me so hard I forgot my own name for a bit, and the ribbing got worse.”</i>");
        else if (flags.FERUZE_ZHENG_OUTCOME !== undefined && flags.FERUZE_ZHENG_OUTCOME < 0) p.push("Feruze’s grin goes slow and wide. <i>“Oh, I remember. I remember you on your back, full of my venom, begging.”</i> She licks a fang. <i>“Best day of that whole contract. Don’t look at me like that, you had fun. You had <b>so</b> much fun.”</i>");
        else p.push("<i>“The pirate rock? Barely. I spent most of that job standing at a ship door being glared at by Jumper mercs.”</i> She shrugs. <i>“[rival.name] got what [rival.heShe] came for, we left. Boring. Boring is good, in my line of work.”</i>");
        p.push("She tips back her glass. <i>“Zheng Shi’s where I figured out [rival.name] was gonna get me killed someday. Should’ve quit then.”</i>");
        say(p);
        processTime(10);
        window.tnFeruzeTalkMenu();
    };

    window.tnFeruzeTalkDhaal = function () {
        clearOutput();
        showHer();
        writer();
        var p = ["<i>“About that taxi...”</i>"];
        if (flags.FERUZE_DHAAL_FIGHT_OUTCOME === 4) p.push("<i>“Best taxi ride of my life,”</i> Feruze says immediately. <i>“I still owe that driver a tip. Or an apology. Maybe both.”</i>");
        else if (flags.FERUZE_DHAAL_FIGHT_OUTCOME === 1) p.push("Feruze groans and puts her face in one hand. <i>“I jumped you on a moving bus. With a whole gang of motor-zaika on our tail. And you <b>still</b> won. You have no idea how embarrassing that is for a professional.”</i>");
        else p.push("<i>“I was desperate, okay?”</i> Feruze says. <i>“Boss was gone, I had no leads, and you were the only one on the planet with a reason to care. Jumping you seemed smart at the time.”</i>");
        p.push("<i>“And the Farrow?”</i>");
        p.push("Her eyes go a little distant. <i>“Riots, spies, a crane, that hazmat bitch. A whole factory trying to kill us.”</i> She shakes her head, and the feathers on her scalp rustle. <i>“That was the best job I’ve ever worked, Steele. And it wasn’t even mine. It was yours. I was just along for the ride.”</i>");
        say(p);
        processTime(10);
        window.tnFeruzeTalkMenu();
    };

    window.tnFeruzeTalkSuula = function () {
        clearOutput();
        showHer();
        writer();
        say([
            "<i>“Can I ask about the suula stuff?”</i>",
            "<i>“Like what? The wings?”</i> Feruze unfolds one partway, and the zaika in the next booth flinch. The feathers are glossy and dark, each one longer than your forearm. <i>“They work. Not great in a city full of power lines, but they work. Most suula girls have ‘em for show. Mine are for coming in fast and landing on somebody.”</i>",
            "<i>“And the venom?”</i>",
            "She grins. Lots of teeth. <i>“Every suula’s got some. It’s in the feathers.”</i> She tips her head so the fluffy crest on her scalp brushes the light. <i>“Normal dose keeps your mate hard and happy. Mine’s about four times that. Had some work done, years back, when I thought it’d be a good weapon.”</i>",
            "<i>“Is it?”</i>",
            "<i>“Fuck yeah it is. Nobody wants to keep shooting at you when they’re too busy cumming.”</i> She shrugs a wing. <i>“It’s a lousy thing for dating, though. Hard to tell who likes you and who’s just high.”</i> She looks at you for a beat too long, then away."
        ]);
        processTime(10);
        window.tnFeruzeTalkMenu();
    };

    window.tnFeruzeTalkKid = function () {
        clearOutput();
        showHer();
        writer();
        say([
            "<i>“How do you feel about our daughter?”</i>",
            "Feruze is quiet long enough that you wonder if she heard you. <i>“Weird,”</i> she says at last. <i>“MaxCorp pulled her out of me before I even really knew. Next thing I know there’s a robot nanny on Tavros sending me baby pictures.”</i>",
            "She pulls out her Codex and scrolls without looking at it, like her thumb knows the way. The picture she stops on is a tiny, scowling, gold-scaled thing with a fluff of purple feathers on her head.",
            "<i>“She bit Briget,”</i> Feruze says, and there’s pride in it. <i>“Didn’t even have teeth yet. Just went for it.”</i> She puts the Codex away. <i>“I’m not the mom type, Steele. But if anybody ever comes for that kid, they’ll have to come through me first.”</i>"
        ]);
        processTime(10);
        window.tnFeruzeTalkMenu();
    };

    window.tnFeruzeTalkShip = function () {
        clearOutput();
        showHer();
        writer();
        var p = [
            "<i>“How are you liking the ship?”</i>",
            "<i>“Ceilings are too low.”</i> Feruze ducks under a conduit to prove it. <i>“I’ve hit my head eleven times. I’m counting.”</i>",
            "She settles against the bulkhead, wings half spread to take up as much room as possible. <i>“Otherwise? It’s good. Bed’s decent. Food’s better than the guild hall. And nobody’s shooting at me, which makes me twitchy, but I’m getting used to it.”</i>"
        ];
        if (daneAboard()) p.push("Her tail flicks. <i>“Didn’t think I’d be bunking with Dane again, though. Big lunk still eats like he’s got four mouths. Which he kinda does.”</i> Her teeth show. <i>“Least he’s on the right side this time.”</i>");
        p.push("<i>“And, uh.”</i> She doesn’t quite look at you. <i>“It’s nice. Standing in front of somebody who says thanks.”</i>");
        say(p);
        processTime(10);
        window.tnFeruzeTalkMenu();
    };

    /* ---------------- Recruit ---------------- */

    function fee() {
        if (flags.TN_FERUZE_PAID) return 0;
        return sexed() ? FEE_FRIEND : FEE;
    }

    window.tnFeruzeRecruit = function () {
        clearOutput();
        showHer();
        writer();
        if (!roomForHer()) {
            say([
                "<i>“Want a job?”</i>",
                "Feruze looks interested for half a second, then squints at you. <i>“On that ship of yours? You don’t have a free bunk, Steele. I’m not sleeping in a cargo hold. Make room, then ask me again.”</i>"
            ]);
            window.tnFeruzeBarMenu();
            return;
        }
        var cost = fee();
        var p = [
            "<i>“Want a job?”</i>",
            "Feruze sets her glass down very carefully. <i>“Doing what?”</i>",
            "<i>“Same thing you did for [rival.name]. Stand in front of me. Hit things. I’m hunting my father’s probes, and it keeps getting more dangerous.”</i>",
            "Her wings rustle against the wall. For a moment she looks like she wants to say yes very badly and is trying not to show it. Then the professional comes back."
        ];
        if (cost > 0) {
            if (cost === FEE_FRIEND) p.push("<i>“Guild rate’s " + FEE + " up front,”</i> she says. Then her eyes drop to your mouth, and back up. <i>“But I like you. Call it " + FEE_FRIEND + ". Retainer. Then room, board, and you don’t fire me by text.”</i>");
            else p.push("<i>“Guild rate’s " + FEE + " up front,”</i> she says. <i>“Retainer. After that it’s room, board, and you don’t fire me by text. Deal?”</i>");
        } else {
            p.push("<i>“You already paid me once,”</i> she says. <i>“Retainer still counts. Just don’t make me hike back down here again.”</i>");
        }
        say(p);
        clearMenu();
        if (cost === 0) addButton(0, "Deal", window.tnFeruzeHire, "Deal", "Bring her aboard.");
        else if (pc.credits >= cost) addButton(0, "Pay " + cost, window.tnFeruzeHire, "Pay " + cost, "Pay her retainer and bring her aboard.");
        else addDisabledButton(0, "Pay " + cost, "Pay " + cost, "You don’t have " + cost + " credits.");
        addButton(1, "Not Yet", function () {
            clearOutput(); showHer(); writer();
            output("<i>“Not yet.”</i>\n\nFeruze shrugs, a little too fast. <i>“Your loss. I’ll be here. Drinking.”</i>");
            window.tnFeruzeBarMenu();
        }, "Not Yet", "Maybe later.");
    };

    window.tnFeruzeHire = function () {
        clearOutput();
        showHer();
        writer();
        var cost = fee();
        if (cost > 0) pc.credits -= cost;
        flags.TN_FERUZE_PAID = 1;
        flags.TN_FERUZE_CREW = 1;
        var p = [];
        if (cost > 0) p.push("You transfer the credits. Feruze’s Codex pings, she checks it, and then she grins so wide you can count every one of her teeth.");
        p.push("<i>“Fuck yes.”</i> She sweeps her pistols off the table and into their holsters in one move, the magnetic harnesses on her thighs clacking as each one lands. She stands up and hits her head on the light. She doesn’t seem to care. <i>“Alright, boss. Lead the way.”</i>");
        p.push("Half the bar watches eight feet of suula follow you out, wings tucked tight, a dufflebag that was apparently under the table the whole time slung over one shoulder. The thraggen bouncer’s projection flickers up as you pass and gives Feruze a look. Feruze gives her the finger. The projection grins back.");
        p.push("By the time you’re back aboard, Feruze has claimed a bunk, dumped the bag on it, and hit her head on the ceiling twice. <b>Feruze is now part of your crew.</b>");
        say(p);
        processTime(30);
        clearMenu();
        addButton(0, "Next", mainGameMenu);
    };

    /* ---------------- Ship ---------------- */

    window.tnFeruzeCabin = function () {
        clearOutput();
        showHer();
        writer();
        var lines = [
            "Feruze is sprawled across her bunk with her wings hanging off both sides, cleaning one of her pistols. <i>“Boss.”</i> She doesn’t get up. <i>“Need something shot?”</i>",
            "You find Feruze in the cargo area, beating the stuffing out of a hanging bag with her bare fists. She stops when she sees you, panting. <i>“Hey. What’s up?”</i>",
            "Feruze is hanging upside down from a ceiling conduit by her knees, wings folded, doing sit-ups. <i>“Ninety-eight... ninety-nine... yo, Steele.”</i> She drops, flips, and lands with a thud. <i>“What’s up?”</i>"
        ];
        output(lines[Math.floor(Math.random() * lines.length)]);
        window.tnFeruzeShipMenu();
    };

    window.tnFeruzeShipMenu = function () {
        clearMenu();
        addButton(0, "Talk", window.tnFeruzeTalkMenu, "Talk", "Chat with your bodyguard.");
        if (pc.lust() >= 33) addButton(1, "Sex", function () { window.tnFeruzeSexMenu("ship"); }, "Sex", "See if she’s up for some fun.");
        else addDisabledButton(1, "Sex", "Sex", "You aren’t really in the mood.");
        addButton(13, "Send Away", window.tnFeruzeSendAway, "Send Away", "Send her back to the Crash Landing on Dhaal.");
        addButton(14, "Back", (typeof crew === "function") ? function () { crew(); } : mainGameMenu, "Back", "Go back.");
    };

    window.tnFeruzeSendAway = function () {
        clearOutput();
        showHer();
        writer();
        say([
            "You tell Feruze you need the bunk, and that she should head back to Dhaal for a while.",
            "Her face does something complicated. <i>“By text would’ve been worse, I guess.”</i> She starts stuffing things into her dufflebag. <i>“Fine. I’ll be at the Crash Landing. Same booth. Your retainer’s still good, so if you want me back, just come get me.”</i>",
            "She hits her head on the door frame on the way out."
        ]);
        flags.TN_FERUZE_CREW = 0;
        clearMenu();
        addButton(0, "Next", mainGameMenu);
    };

    function crewBlurb(slot, showText) {
        if (!aboard()) return "";
        addButton(slot, "Feruze", window.tnFeruzeCabin, "Feruze", "Your eight-foot suula bodyguard.");
        if (showText === false) return "";
        var lines = [
            "\n\nFeruze is somewhere aboard, most likely sprawled on her bunk or hitting something in the cargo hold.",
            "\n\nYou can hear Feruze swearing at the ceiling. She’s hit her head on it again.",
            "\n\nFeruze is doing a slow patrol of the corridors, wings tucked, like someone might board at any second."
        ];
        if (daneAboard()) lines.push("\n\nFeruze and Dane are arguing in the galley over whose turn it is to clean the stove. It sounds like it might come to blows. It sounds like they’d both enjoy that.");
        return lines[Math.floor(Math.random() * lines.length)];
    }

    function install() {
        try {
            if (typeof chars === "undefined" || !chars.FERUZE) return;
            var proto = Object.getPrototypeOf(chars.FERUZE);
            if (!proto || proto.__tnFeruzeCrew) return;
            proto.__tnFeruzeCrew = true;
            var oldIsCrew = proto.isCrew, oldRecruited = proto.isRecruited, oldBlurb = proto.crewBlurb;
            proto.isCrew = function () {
                if (typeof flags !== "undefined" && flags.TN_FERUZE_CREW === 1) return true;
                return oldIsCrew ? oldIsCrew.apply(this, arguments) : false;
            };
            proto.isRecruited = function () {
                if (typeof flags !== "undefined" && flags.TN_FERUZE_PAID === 1) return true;
                return oldRecruited ? oldRecruited.apply(this, arguments) : false;
            };
            proto.crewBlurb = function (slot, showText) {
                if (typeof flags !== "undefined" && flags.TN_FERUZE_CREW === 1) return crewBlurb(slot, showText);
                return oldBlurb ? oldBlurb.apply(this, arguments) : "";
            };
        } catch (err) {
            if (window.console) console.log("[TN Feruze] install failed: " + err);
        }
    }

    /* ---------------- Sex ---------------- */

    var WHERE = "ship";

    function after() {
        clearMenu();
        if (WHERE === "ship") addButton(0, "Next", window.tnFeruzeCabinQuiet, "Next", "Back to Feruze.");
        else addButton(0, "Next", mainGameMenu, "Next", "Head back inside.");
    }

    window.tnFeruzeCabinQuiet = function () {
        clearOutput();
        showHer();
        writer();
        output("Feruze stretches until her spine pops, wings brushing both walls of the cabin. <i>“Mm. Anything else, boss?”</i>");
        window.tnFeruzeShipMenu();
    };

    window.tnFeruzeHookUp = function () {
        clearOutput();
        showHer();
        writer();
        say([
            "You lean across the table and tell her you’d rather be somewhere with fewer zaika watching.",
            "Feruze is out of the booth so fast she knocks over her glass. <i>“Thought you’d never ask.”</i> She grabs your wrist and hauls you toward the door. <i>“Station platform. Nobody goes up there but junkies and the rats, and the rats are scared of me.”</i>",
            "The bouncer’s projection flickers up as you pass, takes one look at the two of you, and flickers back off."
        ]);
        processTime(5);
        window.tnFeruzeSexMenu("hookup");
    };

    window.tnFeruzeSexMenu = function (where) {
        WHERE = where || "ship";
        clearMenu();
        var idx = fitIdx();
        if (pc.hasCock() && idx >= 0) addButton(0, "Fuck Her Puss", window.tnFeruzeFuck, "Fuck Her Puss", "Bury yourself in the suula’s pussy.");
        else if (pc.hasCock()) addDisabledButton(0, "Fuck Her Puss", "Fuck Her Puss", "Even Feruze can’t take a dick that big.");
        else addDisabledButton(0, "Fuck Her Puss", "Fuck Her Puss", "You need a penis for this.");
        if (pc.hasVagina()) addButton(1, "Scissor", window.tnFeruzeScissor, "Scissor", "Grind your pussy against hers.");
        else addDisabledButton(1, "Scissor", "Scissor", "You need a vagina for this.");
        if (pc.hasCock()) addButton(2, "Titfuck", window.tnFeruzeTitfuck, "Titfuck", "Those tits are big enough to lose yourself in.");
        else addDisabledButton(2, "Titfuck", "Titfuck", "You need a penis for this.");
        addButton(3, "Shark Seat", window.tnFeruzeSeat, "Shark Seat", "Lie back and let her sit on your face. She will. Happily.");
        if (WHERE === "ship") addButton(14, "Back", window.tnFeruzeShipMenu, "Back", "Not now.");
        else addButton(14, "Back", function () { clearOutput(); showHer(); writer(); output("You change your mind. Feruze groans, loud and long, and stomps back to her booth."); window.tnFeruzeBarMenu(); }, "Back", "Not now.");
    };

    function place() {
        return WHERE === "ship" ? "your cabin" : "the abandoned station platform";
    }

    window.tnFeruzeFuck = function () {
        clearOutput();
        showHer(true);
        writer();
        var x = fitIdx();
        if (x < 0) x = 0;
        var C = "[pc.cock " + x + "]", H = "[pc.cockHead " + x + "]";
        var start = WHERE === "ship"
            ? "Feruze strips the second the cabin door shuts, peeling her armor down and kicking it off one leg at a time. Every inch of her is gold scales and hard muscle wrapped in curves, and her breasts swing free, black nipples already stiff. She flops back on your bunk, which groans in protest, and spreads her wings until they cover the whole thing like a dark blanket."
            : "On the empty platform, Feruze shoves you against a graffiti-covered pillar and peels her armor down to her knees in one rough motion, then kicks it the rest of the way off. Gold scales, hard muscle, and a lot of curves. She drops back onto a stack of old shipping pallets and spreads her wings over them like a dark blanket.";
        bodySay([
            start,
            "<i>“C’mere,”</i> she growls, and hooks you in with one long leg before you’ve even finished getting your gear off. She drags you down and kisses you, all teeth and tongue, and the feathers of her crest fall across your face. Your skin tingles where they touch. A rush of heat goes straight to your groin, and " + C + " stands up so hard it aches.",
            "<i>“That’s the venom,”</i> she purrs against your mouth. <i>“Little dose. Just enough to keep you going.”</i> She reaches down, wraps a clawed hand around you, and guides " + H + " to her lips. She’s soaking wet. <i>“Now fuck me like you mean it, Steele.”</i>",
            "You push in. She is hot and tight and grips you like a fist, and she throws her head back and howls loud enough to echo around " + place() + ". Her other leg locks around you, heels digging into your [pc.butt], and she pulls you all the way in.",
            "There’s no slow start with Feruze. She bucks up to meet every thrust, wings beating against the " + (WHERE === "ship" ? "bunk" : "pallets") + " so hard the air gusts around you both. Her claws rake your back. Her tail lashes. She’s yelling things that might be words in a language you don’t know, and might just be noise.",
            "The venom keeps you rock-hard no matter how close you get. Every time you think you’re about to cum, her pussy ripples around you and pulls you right back from the edge, and you realize she’s doing it on purpose. <i>“Not yet,”</i> she pants, grinning up at you. <i>“I’m not done.”</i>",
            "She cums first, twice, back to back, clamping down so hard you see stars. On the third she finally lets you go, and you slam in to the hilt and empty yourself into her with a groan, " + C + " jerking with every rope of [pc.cum].",
            "When it’s over you’re collapsed on her chest, which is as soft as a pillow and twice as big, and her wings have folded around you both like a tent. She’s laughing quietly, chest shaking under your cheek. <i>“Fuck. Yeah. That’s what I needed.”</i>"
        ], {
            taur: {
                1: "<i>“C’mere,”</i> she growls, and then blinks as she remembers how you’re built. She grins. <i>“Oh, this’ll be fun.”</i> She rolls off and plants her hands on the " + (WHERE === "ship" ? "end of the bunk" : "top pallet") + ", bending over with her ass up and her wings flared wide, looking back over her shoulder. She shakes her crest at you, and the feathers brush your chest as you step up. Your skin tingles where they touch. A rush of heat goes straight to your groin, and " + C + " stands up so hard it aches.",
                2: "<i>“That’s the venom,”</i> she purrs. <i>“Little dose. Just enough to keep you going.”</i> She’s tall enough that you barely have to adjust; when you rear up and bring your forelegs down on either side of her, " + H + " slides right between her thighs. She reaches back and guides you to her lips. She’s soaking wet. <i>“Now fuck me like you mean it, Steele.”</i>",
                3: "You push in. She is hot and tight and grips you like a fist, and she throws her head back and howls loud enough to echo around " + place() + ". Her wings beat once, hard, against your chest, and then she shoves her hips back and takes you all the way in.",
                4: "There’s no slow start with Feruze. She slams back against every thrust, wings beating under your belly so hard the air gusts around you both. Her tail lashes against your flank. She’s yelling things that might be words in a language you don’t know, and might just be noise.",
                7: "When it’s over you’re standing over her, flanks heaving, with your forelegs trembling and her wings folded up against your belly. She’s laughing quietly, still bent over, her whole body shaking with it. <i>“Fuck. Yeah. That’s what I needed. You’re built like a frakking freight hauler, Steele.”</i>"
            },
            naga: {
                1: "<i>“C’mere,”</i> she growls, reaching for you, and you oblige by coiling right up around her legs and hips and lifting her off the " + (WHERE === "ship" ? "bunk" : "pallets") + " until you’re face to face. Feruze laughs, delighted, and kisses you, all teeth and tongue, and the feathers of her crest fall across your face. Your skin tingles where they touch. A rush of heat goes straight to your groin, and " + C + " stands up so hard it aches.",
                3: "You lower her onto you. She is hot and tight and grips you like a fist, and she throws her head back and howls loud enough to echo around " + place() + ". Her arms lock around your shoulders and she squirms in your coils until she’s taken you all the way in.",
                4: "There’s no slow start with Feruze. Held up in your coils, she can’t buck, so she grinds instead, rolling her hips in tight circles, wings beating the air so hard it gusts around you both. Her claws rake your back. You squeeze, and she yells something that might be a word in a language you don’t know, and might just be noise.",
                7: "When it’s over you sag down into a heap of your own coils with her still wrapped up in them, her wings folded over you both like a tent. She’s laughing quietly, chest shaking against yours. <i>“Fuck. Yeah. That’s what I needed. And I didn’t even have to stand up.”</i>"
            }
        });
        bumpSexed();
        flags.TN_FERUZE_CREAMPIES = (flags.TN_FERUZE_CREAMPIES || 0) + 1;
        processTime(30);
        pc.orgasm();
        after();
    };

    window.tnFeruzeScissor = function () {
        clearOutput();
        showHer(true);
        writer();
        var start = WHERE === "ship"
            ? "You barely have the door shut before Feruze has you on the bunk, peeling your gear off with more enthusiasm than care. Her own armor hits the floor a second later."
            : "Up on the empty platform, Feruze has your gear off before you’ve decided where to put it. Her own armor hits the dusty floor a second later, and she drags you down onto a spread of old tarps behind the rubble.";
        bodySay([
            start,
            "<i>“Oh, you want <b>that</b>,”</i> she purrs when you hook a leg over hers. <i>“Good. I like that.”</i> She scoots in, lifting one thick gold thigh over your hip and fitting herself against you until her pussy kisses yours, hot and slick and already swollen.",
            "Then she grinds. Feruze is strong, and she uses all of it, rolling her hips in long, hard strokes that drag her lips over your [pc.clit] and back again. Her crest falls forward as she moves, and the feathers brush your stomach. Everywhere they touch, your skin starts to tingle and burn.",
            "<i>“Feel that?”</i> she says. <i>“That’s me. Gonna make you so sensitive you scream.”</i> She grabs your leg and pulls, mashing your [pc.vagina] even harder against her, and you do scream, a little.",
            "Her wings flare out and start beating, each stroke rocking her hips into you harder. The sound of wet skin on wet skin fills " + place() + ". She’s growling now, teeth bared, staring down at you with her orange eyes half shut.",
            "You cum first. The venom makes it hit like a wave, and you can’t stop bucking, grinding back against her helplessly while she rides you right through it. She cums a second later with a roar, her pussy pulsing against yours, juices running down both your thighs.",
            "She doesn’t stop. She slows down, but she keeps grinding, and the second orgasm creeps up on you so fast you barely catch your breath before it takes you. She laughs. <i>“See? Told you.”</i>",
            "Eventually she flops down next to you, tangled up in your legs, one wing draped over you like a blanket. <i>“Fuck, that’s good,”</i> she mumbles. <i>“Gonna need a nap. And then I’m gonna need that again.”</i>"
        ], {
            taur: {
                1: "<i>“Oh, you want <b>that</b>,”</i> she purrs, looking you over and working out the angles. <i>“Okay. Okay, hold still.”</i> She lies back on the " + (WHERE === "ship" ? "deck" : "tarps") + " and slides under your hindquarters, gold thighs spreading wide. <i>“Back up. Little more. Down.”</i> You lower your hind end until your [pc.vagina] meets her pussy, hot and slick and already swollen.",
                2: "Then she grinds. Feruze is strong, and she uses all of it, hooking her legs around your hind legs and rolling her hips up against you in long, hard strokes that drag her lips over your [pc.clit] and back again. She reaches up and runs her crest along your belly. Everywhere the feathers touch, your skin starts to tingle and burn.",
                3: "<i>“Feel that?”</i> she says from somewhere under you. <i>“That’s me. Gonna make you so sensitive you scream.”</i> She grabs your hind legs and pulls, mashing your [pc.vagina] even harder against her, and you do scream, a little.",
                4: "Her wings spread out on the floor under you and start beating, each stroke pushing her hips up into you harder. You can’t see her, only feel her, and that somehow makes it worse. The sound of wet skin on wet skin fills " + place() + ".",
                7: "Eventually she crawls out from under you, slick from the waist down, and leans against your flank with one wing draped over your back. <i>“Fuck, that’s good,”</i> she mumbles. <i>“Hardest workout I’ve had all week. Gonna need a nap. And then I’m gonna need that again.”</i>"
            },
            naga: {
                1: "<i>“Oh, you want <b>that</b>,”</i> she purrs as you wind your tail around her. <i>“Good. I like that.”</i> You lift her in your coils until her hips line up with your slit, and she wraps her legs around your tail to hold herself there, her pussy kissing your [pc.vagina], hot and slick and already swollen.",
                2: "Then she grinds. Feruze is strong, and she uses all of it, hauling herself along your tail in long, hard strokes that drag her lips over your [pc.clit] and back again. Her crest falls forward against your chest as she moves, and everywhere the feathers touch, your skin starts to tingle and burn.",
                4: "Her wings flare out and start beating, each stroke rocking her hips into you harder, and your coils tighten around her without you meaning them to. The sound of wet skin on wet scales fills " + place() + ". She’s growling now, teeth bared, staring at you with her orange eyes half shut.",
                7: "Eventually you both slump down into a pile of your coils, one of her wings draped over you like a blanket. <i>“Fuck, that’s good,”</i> she mumbles into your shoulder. <i>“You’re like a big warm hug that fucks. Gonna need a nap. And then I’m gonna need that again.”</i>"
            }
        });
        bumpSexed();
        processTime(30);
        pc.orgasm();
        after();
    };

    window.tnFeruzeTitfuck = function () {
        clearOutput();
        showHer(true);
        writer();
        var start = WHERE === "ship"
            ? "Feruze catches you staring at her chest and laughs. <i>“Yeah? These?”</i> She unzips her armor to the waist, and her breasts spill out, each one bigger than your head, gold-scaled and heavy with black nipples. She drops to her knees on the cabin floor and squeezes them together. <i>“Come on, then.”</i>"
            : "Feruze catches you staring at her chest and laughs. <i>“Yeah? These?”</i> She unzips her armor to the waist right there on the platform, and her breasts spill out, each one bigger than your head, gold-scaled and heavy with black nipples. She drops to her knees in the dust and squeezes them together. <i>“Come on, then.”</i>";
        bodySay([
            start,
            "You step up and she pulls your gear down herself, eager, then lets out a low whistle at [pc.cockBiggest]. <i>“Oh, I can work with that.”</i> She shakes her crest, and the feathers swish across your hips. Heat floods your groin, and you go from hard to aching in seconds.",
            "She leans in and wraps those tits around you. It’s like being swallowed by something warm and soft that happens to have a heartbeat. Her scales are smooth and slick on one side, ridged on the other, and when she starts moving them up and down, you have to grab her shoulders to stay upright.",
            "<i>“Fuck my tits, Steele,”</i> she growls. <i>“Don’t be shy.”</i> So you don’t. You thrust between them, and she presses them tighter, and each time your [pc.cockHeadBiggest] pokes out the top, she licks it with a long, flat tongue that’s rougher than you expected.",
            "She spits between her breasts to slick you up, and then the noise gets truly obscene, wet slaps echoing around " + place() + ". She’s grinning up at you the whole time, teeth flashing, enjoying every second of you losing control.",
            "When you cum, she’s ready. She smothers you between her tits and holds you there while you pump [pc.cum] all over her chest and chin. Some hits her in the face. She doesn’t care, just laughs, and keeps squeezing until you’re totally spent.",
            "<i>“Messy,”</i> she says, admiring herself. She drags a finger through the mess and licks it off, eyes on yours. <i>“I like messy.”</i>"
        ], {
            taur: {
                0: "Feruze catches you staring at her chest and laughs. <i>“Yeah? These?”</i> She unzips her armor to the waist, and her breasts spill out, each one bigger than your head, gold-scaled and heavy with black nipples. She ducks under your barrel and kneels between your forelegs, then squeezes them together right under you. <i>“Come on, then.”</i>",
                1: "She reaches up and pulls your gear free herself, eager, then lets out a low whistle at [pc.cockBiggest]. <i>“Oh, I can work with that.”</i> She shakes her crest, and the feathers swish across your belly. Heat floods your groin, and you go from hard to aching in seconds.",
                2: "She wraps those tits around you. It’s like being swallowed by something warm and soft that happens to have a heartbeat. Her scales are smooth and slick on one side, ridged on the other, and when she starts moving them up and down, your forelegs nearly buckle.",
                3: "<i>“Fuck my tits, Steele,”</i> she growls from somewhere beneath you. <i>“Don’t be shy.”</i> So you don’t. You rock your hips, and she presses tighter, and each time your [pc.cockHeadBiggest] pokes out the top, she licks it with a long, flat tongue that’s rougher than you expected.",
                5: "When you cum, she’s ready. She hugs your cock between her tits and holds it there while you pump [pc.cum] all over her chest and chin. You can’t see any of it, but you can hear her laughing, and she keeps squeezing until you’re totally spent.",
                6: "She crawls out from under you, dripping, and shows off the results. <i>“Messy,”</i> she says, admiring herself. She drags a finger through the mess and licks it off, eyes on yours. <i>“I like messy.”</i>"
            },
            naga: {
                0: "Feruze catches you staring at her chest and laughs. <i>“Yeah? These?”</i> She unzips her armor to the waist, and her breasts spill out, each one bigger than your head, gold-scaled and heavy with black nipples. You rise up on your coils, and she kneels in front of you, right in their loops, and squeezes them together. <i>“Come on, then.”</i>",
                2: "She leans in and wraps those tits around you. It’s like being swallowed by something warm and soft that happens to have a heartbeat. Her scales slide against yours, smooth and slick, and when she starts moving them up and down, your coils clench tight around her knees.",
                5: "When you cum, she’s ready. She smothers you between her tits and holds you there while you pump [pc.cum] all over her chest and chin. Some hits her in the face. She doesn’t care, just laughs, and keeps squeezing until you’re totally spent and slumping down into your own coils."
            }
        });
        bumpSexed();
        processTime(25);
        pc.orgasm();
        after();
    };

    window.tnFeruzeSeat = function () {
        clearOutput();
        showHer(true);
        writer();
        var start = WHERE === "ship"
            ? "<i>“Lie down,”</i> Feruze says, already stripping. She points at the cabin floor. <i>“There. Flat. Good.”</i>"
            : "<i>“Lie down,”</i> Feruze says, already stripping. She points at a stretch of old tarp behind the rubble on the platform. <i>“There. Flat. Good.”</i>";
        var gen = pc.hasCock() ? "[pc.cocks]" : (pc.hasVagina() ? "[pc.vagina]" : "your bare crotch");
        bodySay([
            start,
            "You get down on your back, and she stands over you for a second, admiring the view, eight feet of naked suula blotting out the light. Then she turns around, plants a foot on either side of your head, and sits.",
            "It’s a lot of woman. Her thighs close around your ears and her ass settles on your chest, and her pussy is right there, hot and wet and pressed over your [pc.lips]. She wiggles until she’s comfortable. <i>“Mmm. Perfect.”</i>",
            "You get to work. She tastes like salt and something sweet, and the more you lick, the more she drips. She rewards you by rocking her hips, grinding her clit against your [pc.tongue], and leaning forward to run her crest across " + gen + ". The venom hits you like a shot of something strong, and every nerve below your waist lights up.",
            "Feruze talks the whole time. <i>“Good. Deeper. Yeah, right there, don’t you dare stop.”</i> Her tail lashes, slapping the floor. Her wings spread and beat, pinning you even harder. You couldn’t get up if you wanted to. You don’t want to.",
            "She cums with a scream that echoes around " + place() + ", thighs clamping on your head, flooding your mouth. You barely get a breath before she starts grinding again. Somewhere in there, " + (pc.hasGenitals() ? "her hand finds " + gen + ", and" : "the venom and the heat and the weight of her get to be too much, and") + " you cum too, writhing helplessly under her while she rides your face through it.",
            "When she finally climbs off, your face is soaked and your jaw aches. She flops down next to you and pats your cheek. <i>“Best seat on the ship,”</i> she says. <i>“Reserving it.”</i>"
        ], {
            taur: {
                0: "<i>“Lie down,”</i> Feruze says, already stripping. Then she looks at you properly and frowns. <i>“Uh. Can you lie down? On your side, then. Head on the " + (WHERE === "ship" ? "floor" : "tarp") + ".”</i>",
                1: "You fold your legs and lean over until your human half is lying on its back, propped against your own barrel. She stands over you for a second, admiring the view, eight feet of naked suula blotting out the light. Then she plants a foot on either side of your head and sits.",
                2: "It’s a lot of woman. Her thighs close around your ears and her ass settles on your chest, and her pussy is right there, hot and wet and pressed over your [pc.lips]. She wiggles until she’s comfortable, one hand braced on your flank. <i>“Mmm. Perfect. Like a sofa.”</i>",
                3: "You get to work. She tastes like salt and something sweet, and the more you lick, the more she drips. She rewards you by rocking her hips, grinding her clit against your [pc.tongue], and reaching back along your lower body to run her feathers over your flanks. The venom hits you like a shot of something strong, and your whole lower body lights up.",
                6: "When she finally climbs off, your face is soaked and your jaw aches and your hind legs are still twitching. She flops against your barrel and pats your cheek. <i>“Best seat on the ship,”</i> she says. <i>“Reserving it.”</i>"
            },
            naga: {
                1: "You lie back across your own coils, and she stands over you for a second, admiring the view, eight feet of naked suula blotting out the light. Then she turns around, plants a foot on either side of your head, and sits.",
                4: "Feruze talks the whole time. <i>“Good. Deeper. Yeah, right there, don’t you dare stop.”</i> Her tail lashes. Your tail lashes back, and coils up around her legs on instinct, holding her down on your face. <i>“Oh, fuck, yes, do that,”</i> she gasps. You couldn’t get up if you wanted to. You don’t want to.",
                6: "When she finally climbs off, your face is soaked and your jaw aches and your tail is still tangled around her ankle. She flops down on your coils and pats your cheek. <i>“Best seat on the ship,”</i> she says. <i>“Reserving it.”</i>"
            }
        });
        bumpSexed();
        processTime(25);
        if (typeof pc.girlCumInMouth === "function") { try { if (her()) pc.girlCumInMouth(her()); } catch (err) {} }
        pc.orgasm();
        after();
    };

    /* ---------------- Mod menu + boot ---------------- */

    function register(tries) {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") {
            if (tries < 120) setTimeout(function () { register(tries + 1); }, 500);
            return;
        }
        window.registerModMenu({
            id: MOD_ID,
            name: "Feruze Crew",
            author: "Techy-Nest",
            description: "After the Farrow job on Dhaal, Feruze drinks in the Crash Landing (underground milk bar off the Mean Streets). Talk, drink, hook up, or hire her for your crew. Off = she is not at the bar (a crew Feruze stays aboard).",
            supportsToggle: true,
            defaultEnabled: true,
            getHtml: function () {
                var s = "Where: Crash Landing bar room, Dhaal (button slot 6).\nUnlock: finish the Farrow quest (probe found).\nRetainer: " + FEE + " credits, " + FEE_FRIEND + " if you've slept with her.";
                try {
                    if (typeof flags !== "undefined") {
                        if (flags.TN_FERUZE_CREW === 1) s += "\n\nStatus: aboard your ship.";
                        else if (flags.DHAAL_PROBE === 1) s += "\n\nStatus: at the Crash Landing.";
                        else s += "\n\nStatus: still busy with your cousin's mess (Farrow quest not done).";
                    }
                } catch (err) {}
                return s;
            },
            onAct: function () { return true; }
        });
    }

    function boot() {
        if (typeof flags === "undefined" || typeof addButton !== "function") {
            setTimeout(boot, 400);
            return;
        }
        install();
        if (!window.tnFeruzeWatch) window.tnFeruzeWatch = setInterval(install, 1000);
        setTimeout(function () { register(0); }, 3000);
    }
    boot();
})();
