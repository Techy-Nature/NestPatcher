/* Shelly crew recruitment with ship-specific Talk options; vanilla bar scenes remain separate. */
(function () {
    // One toggle controls Shelly recruitment, ship interactions, and her shop.
    var SHELLY_MOD_ID = "tn-shelly-expansion";
    function shellyOnCrew() {
        try { return typeof flags !== "undefined" && flags.TN_SHELLY_CREW === 1; }
        catch (err) { return false; }
    }
    function reconcileShellyToggle() {
        if (!shellyOnCrew()) return;
        if ((window.tnModMenuActive===true&&typeof window.isTnModEnabled==="function") &&
            !window.isTnModEnabled(SHELLY_MOD_ID) &&
            (window.tnModMenuActive===true&&typeof window.setTnModEnabled==="function")) {
            window.setTnModEnabled(SHELLY_MOD_ID, true);
            console.warn("[TN Shelly] Auto-enabled: loaded a save with Shelly aboard.");
        }
    }
    window.tnShellyModEnabled = function () {
        if (shellyOnCrew()) {
            reconcileShellyToggle();
            return true;
        }
        return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") ||
            window.isTnModEnabled(SHELLY_MOD_ID);
    };
    function isRecruited() {
        try { return shellyOnCrew(); }
        catch (err) { return false; }
    }
    function registerShellyMenu() {
        if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return false;
        window.registerModMenu({
            id: SHELLY_MOD_ID,
            name: "Shelly Expansion",
            author: "Kitty / Neston",
            description: "Shelly recruitment, ship conversations, and Ovilium/Sterilex shop. WARNING: Unrecruit Shelly from your ship BEFORE disabling this mod. Disabling is blocked while she is recruited; loading a save with Shelly aboard automatically re-enables the mod. Existing save flags and relationship progress are not erased.",
            supportsToggle: true,
            getHtml: function () {
                return isRecruited()
                    ? "<b>WARNING: Shelly is currently a crew member.</b>\n\nGo to her cabin and choose Unrecruit before disabling the Shelly Expansion. Disabling is blocked to protect your save."
                    : "<b>Safe to disable:</b> Shelly is not currently recruited.\n\nDisabling hides the custom recruitment and shop options, but does not remove existing save flags or items.";
            },
            onEnabledChange: function (next) {
                if (!next && isRecruited()) {
                    var message = "Remove Shelly as a crew member first: visit her cabin and choose Unrecruit before disabling Shelly Expansion.";
                    if (typeof window.alert === "function") window.alert(message);
                    console.warn("[TN Shelly] " + message);
                    return false;
                }
                return true;
            }
        });
        return true;
    }
    if (!registerShellyMenu()) {
        var attempts = 0;
        var registrationTimer = setInterval(function () {
            if (registerShellyMenu() || ++attempts >= 150) clearInterval(registrationTimer);
        }, 200);
    }
    // Detect flags becoming available after loading a save, even if no Shelly UI is opened.
    var shellySafetyWatch = setInterval(reconcileShellyToggle, 500);
    function bustName(nude) {
        var name = "SHELLY";
        try {
            if (typeof flags !== "undefined" && (flags.CAME_INSIDE_SHELLY || (typeof pc !== "undefined" && pc.hasStatusEffect && pc.hasStatusEffect("Shelly Leave Egg CD")))) {
                name += "_HUGE";
            }
        } catch (err) {}
        if (nude) name += "_NUDE";
        return name;
    }

    function showHer(nude) {
        if (typeof clearBust === "function") clearBust();
        if (typeof showBust === "function") showBust(bustName(nude));
        if (typeof showName === "function") showName("Shelly");
    }

    function paidCrew() {
        if (typeof crew === "function") return crew(true, false);
        var n = 0;
        if (typeof chars === "undefined") return 0;
        for (var id in chars) {
            var person = chars[id];
            if (person && person.isCrew && person.isCrew() && !person.freeRent) n++;
        }
        return n;
    }

    function roomForHer() {
        if (typeof flags !== "undefined" && typeof flags.INFINITE_CREW !== "undefined") return true;
        if (typeof pc_ship === "undefined" || !pc_ship || typeof pc_ship.crewCapacity !== "function") return false;
        return paidCrew() < pc_ship.crewCapacity();
    }


    function defineRuntimeProperty(obj, name, value) {
        try {
            Object.defineProperty(obj, name, {
                value: value,
                writable: true,
                configurable: true,
                enumerable: false
            });
        } catch (err) {
            obj[name] = value;
        }
    }

    function patchRealShelly(person) {
        if (!person || (typeof person !== "object" && typeof person !== "function")) return false;
        if (person.__tnShellyCrewPatched === true) return true;

        defineRuntimeProperty(person, "isCrew", function () {
            return shellyOnCrew();
        });
        defineRuntimeProperty(person, "isRecruited", function () {
            return shellyOnCrew();
        });

        try {
            person.freeRent = false;
        } catch (err) {
            defineRuntimeProperty(person, "freeRent", false);
        }

        defineRuntimeProperty(person, "crewBlurb", function (slot) {
            if (!this.isCrew()) return "";
            addButton(slot, "Shelly", window.tnShellyCabin, "Shelly", "The Xenogen bunny is aboard.");
            return "\n\nShelly is aboard, taking up a crew slot, a bunk, and standing at the doorway talking about Ovilium to anyone who will listen.";
        });

        defineRuntimeProperty(person, "__tnShellyCrewPatched", true);
        return true;
    }

    window.tnShellyBustName = bustName;

    window.tnShellyRecruitButton = function () {
        if (!window.tnShellyModEnabled() || typeof flags === "undefined" || flags.TN_SHELLY_CREW === 1) return;
        if (flags.TALKED_TO_SHELLY === 1) {
            addButton(4, "Recruit", window.tnShellyRecruit, "Recruit", "Offer Shelly a bunk on your ship.");
        } else {
            addDisabledButton(4, "Recruit", "Recruit", "Talk to her before you ask her to leave the bar.");
        }
    };

    window.tnShellyRecruit = function () {
        if (!window.tnShellyModEnabled()) return;
        clearOutput();
        showHer(false);
        author("Gardeford");
        if (!roomForHer()) {
            output("Shelly’s ears tip toward you. She hugs the Ovilium sign a little tighter.\n\n<i>“I would love somewhere quieter than this bar. There isn’t a bunk left on your ship, though. Make room, and ask me again.”</i>");
            clearMenu();
            addButton(0, "Next", window.tnShellyOpen || mainGameMenu, "Next", "She stays at the back of the bar.");
            return;
        }
        output("You tell Shelly the back wall of Anon’s is a poor place to keep laying eggs, and that the ship has a bunk with room for her and her sign.\n\nShe goes pink in that baker’s-chocolate skin. <i>“Really? You want me to come with you?”</i> The cotton puffs on her ears bob. <i>“Everyone else has just been rude. If there’s room, I’ll come. I can still tell people about Xenogen. And if the eggs get to be too much, you’ll help. Right?”</i>\n\nYou tell her you will. She folds the sign under one arm and follows you out.");
        flags.TN_SHELLY_CREW = 1;
        flags.KNOW_SHELLYS_NAME = 1;
        window.tnShellyInstall();
        clearMenu();
        addButton(0, "Next", window.tnShellyCabin, "Next", "Shelly comes aboard.");
    };

    // Kitty Shelly relationship data is stored in game flags and survives saves.
    // Levels begin at zero; text milestones in this mod are 3, 5, 7, and 10.
    function rel(name) { return Math.max(0, Math.min(10, Number(flags["TN_SHELLY_" + name]) || 0)); }
    function addRel(name, amount) { flags["TN_SHELLY_" + name] = Math.max(0, Math.min(10, rel(name) + amount)); }
    function kind() { return pc.isNice && pc.isNice(); }
    function mischievous() { return pc.isMischievous && pc.isMischievous(); }
    function hard() { return pc.isAss && pc.isAss(); }
    function say(text, minutes) {
        clearOutput(); showHer(false); author("Neston"); output(text);
        if (minutes && typeof processTime === "function") processTime(minutes);
        clearMenu(); addButton(14,"Back",window.tnShellyTalkMenu,"Back","Choose another conversation topic.");
    }
    function chatGreeting() {
        var activities = [
            "organizing her shop stock",
            "reading Xenogen promotional material while reclining on her bunk",
            "watching a telenovella on her small bedroom holo-projector",
            "reading about transformatives on her Xenogen-manufactured Codex"
        ];
        var hour = typeof hours === "number" ? hours : 12;
        var daypart = hour >= 4 && hour < 10 ? "morning" : hour < 12 ? "day" : hour < 15 ? "afternoon" : hour < 18 ? "evening" : "night";
        return 'Shelly looks up from ' + activities[typeof rand === "function" ? rand(activities.length) : 0] +
          '. <i>“Hey there, [pc.name]! Hope your ' + daypart + ' is going well. What did you want to talk about with me?”</i>\n\nWhat <b>did</b> you want to talk about?';
    }
    window.tnShellyTalkMenu = function () {
        clearOutput(); showHer(false); author("Neston"); output(chatGreeting()); clearMenu();
        addButton(0,"Adjusting?",window.tnShellyTalkAdjusting,"Adjusting Well?","Ask how Shelly is adjusting to the ship.");
        addButton(1,"Check In",window.tnShellyTalkCheckIn,"Checking In","Ask about Shelly's well-being.");
        if (rel("TRUST") >= 5) addButton(2,"Cure?",window.tnShellyTalkCure,"Cure?","Discuss finding a permanent way to stop the eggs.");
        else addDisabledButton(2,"Cure?","Cure?","Requires at least 5 trust with Shelly.");
        addButton(3,"Just Chat",window.tnShellyTalkJustChat,"Just Chat","Spend an hour chatting with Shelly; increases trust.");
        if (hard()) addButton(4,"Degrade",window.tnShellyTalkDegrade,"Degrade","Be cruel to Shelly; harms trust and affection.");
        if (kind()) addButton(5,"Cuddle",window.tnShellyTalkCuddle,"Cuddle Her","Spend an hour cuddling; increases affection and trust.");
        if (kind() || mischievous()) addButton(6,"Reassure",window.tnShellyTalkReassure,"Reassure Her","Offer Shelly a comforting hug.");
        addButton(14,"Back",window.tnShellyCabin,"Back","Return to Shelly's cabin.");
    };
    window.tnShellyTalkAdjusting = function () {
        var text = "Asking if Shelly is adjusting well, she responds, <i>“Yeah! Thanks to having my own bunk and room with metal walls that are covered over with noise-cancelling pads besides, I can actually sleep in peace! It’s so nice, [pc.name]! Thank you for inviting me here, did I ever say that? I appreciate all the work you’ve put into helping me feel at home, too.”</i>\n\nShe then turns and looks at her shop inventory. <i>“I was able to set up my shop fairly quickly, too! Thanks for all the help, in any case.”</i>";
        if (rel("DEGRADED") > 0) text = text.replace('I appreciate all the work you’ve put into helping me feel at home, too.', 'I appreciate it, even if you have been a handful.');
        if (kind()) text += "\n\nYou nod, smiling genuinely, and tell her she’s very welcome here, as always.";
        else if (mischievous()) text += "\n\nYou smirk, nodding in return, but say nothing.";
        else if (hard()) text += "\n\nYou huff mockingly. <i>“Yeeah, yeah. I know I’m great. But I don’t mind the reminder for sure.”</i> You grin. Shelly rolls her eyes at your audacity.";
        say(text, 0);
    };
    window.tnShellyTalkCheckIn = function () {
        var text = "<i>“Oh? You want to know how I’m doing?”</i> Shelly asks. You nod.\n\n<i>“Just making sure, anyway. I’m doing a lot better than before, that’s for sure. This bedroom is just the right size for me and my shop, it’s all just perfect!”</i> She smiles hopefully at the ceiling.\n\nShe looks back at you and rests a hand on your shoulder. <i>“Thank you again for giving me this opportunity, [pc.name].”</i>";
        if (mischievous() || hard()) text = text.replace('You nod.', 'You nod impatiently, pointing out that you did just ask. Shelly rolls her eyes.');
        if (kind()) text += "\n\nHer hopeful smile makes you smile in empathy.";
        else if (mischievous()) text += "\n\nYou laugh nervously, hoping life out in the black won’t crush that hope.";
        else if (hard()) text += "\n\nYou resist the urge to roll your eyes.";
        var d = rel("DEGRADED");
        if (d >= 7) text += ' <i>“Despite how much you thought I was only here to be a receptacle for your own lusts.”</i>';
        else if (d >= 5) text += ' <i>“Even when you made me feel lesser in your eyes.”</i>';
        else if (d >= 3) text += ' <i>“Even when I worried I didn’t deserve it.”</i>';
        var t = rel("TRUST");
        if (t >= 10) text += ' <i>“I love you, and I feel I always will. My trust in you is complete.”</i>';
        else if (t >= 7) text += ' <i>“I genuinely think you’re the best thing to ever happen to me.”</i>';
        else if (t >= 5) text += ' <i>“I trust you quite a bit more now, [pc.name]. I hope you don’t break it.”</i>';
        else if (t >= 3) text += ' <i>“I really do trust and enjoy you. Genuinely!”</i>';
        var a = rel("AFFECTION");
        if (a >= 10) text += ' <i>“I love cuddling with you, and I can’t get enough of it!”</i>';
        else if (a >= 7) text += '\n\nShelly leans toward you unconsciously, then retreats to her bunk. <i>“Mind giving me some more cuddles?”</i>';
        else if (a >= 5) text += ' <i>“I hope you can sleep and cuddle with me soon. I like it a lot.”</i>';
        else if (a >= 3) text += ' <i>“I enjoy being close with you. I hope you do too!”</i>';
        text += "\n\nSeems that’s your cue.";
        say(text, 0);
    };
    window.tnShellyTalkCure = function () {
        if (rel("TRUST") < 5) { window.tnShellyTalkMenu(); return; }
        var text = "You bring up the subject of removing the eggs.\n\n<i>“You want to assist me?”</i> Shelly asks, moving toward the bunk, but you stand fast. <i>“Wait, you don’t—?”</i>\n\nYou explain you mean removing the eggs <b>permanently</b>. With all the advances in medicine, surely someone could help her return to normal.\n\n<i>“Oh.”</i> She seems thoughtful. <i>“Well, I guess it wouldn’t hurt. Maybe you can find someone who’d be willing to help? And with the wealth and connections of a Steele, maybe you’d have better luck than me.”</i>\n\n<i>“But then... you’d need some kind of geneticist, probably? Do you have any contacts like that?”</i>\n\nYou smile and tell her you’re sure you do, or will if you don’t at the moment.";
        flags.TN_SHELLY_CURE_DISCUSSION = 1;
        text += "\n\n<i>(Quest lead unlocked: consult a qualified geneticist. The treatment itself is not yet implemented.)</i>";
        say(text, 0);
    };
    window.tnShellyTalkJustChat = function () {
        var text = "You say you just wanted to talk to Shelly in general and update her on your plans. You two talk about everything from the last gravball match you watched to favorite foods and the things you both enjoy.";
        if (typeof chars !== "undefined" && chars.YAMMI && chars.YAMMI.isCrew && chars.YAMMI.isCrew()) {
            text += " You mention the meals Yammi has been making aboard the ship, and Shelly perks up at the thought of trying more of them.";
        }
        if (typeof flags !== "undefined" && flags.MET_LOVE_STARZ !== undefined) {
            text += "\n\nYou mention that you've even met the Love Starz in person. Shelly looks at you in wonder. <i>“How'd that happen?”</i> You explain that your father bought a controlling stake in the group, and that should you win your inheritance, you'll be in charge of those shares. <i>“Wow! That's... incredible! I really hope you're able to beat your cousin, in that case!”</i> You sigh and nod.";
        }
        text += "\n\nShelly talks about the holonovellas and ebooks she's read, and explains in considerable detail what Xenogen does. She also admits to loving farming games set on agricultural planets: there's something relaxing about simply tending crops and living simply and quietly. You trade stories about games you've played and videos you've seen on the extranet, until the conversation comes to a natural close.\n\n<i>“Anything else, [pc.name]?”</i> You shake your head and shrug.";
        addRel("TRUST",1);
        say(text, 60);
    };
    window.tnShellyTalkDegrade = function () {
        if (!hard()) { window.tnShellyTalkMenu(); return; }
        var text = "You spend some time asking Shelly questions that seem innocuous at first, but hide cruel intentions. Eventually she stops answering and asks one of her own. <i>“Did you just want to make me feel worse about myself?”</i>\n\nYou grin without replying. Shelly rolls her eyes. <i>“If you keep doing that I might just kick you out of my room. You better be careful.”</i>\n\nYou shrug, still grinning, and ask whether she can even do that on <b>your</b> ship. She falls silent, glaring at you.";
        addRel("DEGRADED",1); addRel("TRUST",-1); addRel("AFFECTION",-1);
        // No forced personality change: hard personality is the prerequisite itself.
        say(text, 0);
    };
    window.tnShellyTalkCuddle = function () {
        if (!kind()) { window.tnShellyTalkMenu(); return; }
        var text = "You gently pull Shelly over to the bed. She willingly goes with you, smiling. You lie down first so you can be the big spoon, then settle into a comfortable cuddle. You stroke her hair and gently rub her shoulders and arms, staying together for a little over an hour.";
        addRel("AFFECTION",2); addRel("TRUST",1);
        say(text, 60);
    };
    window.tnShellyTalkReassure = function () {
        if (!(kind() || mischievous())) { window.tnShellyTalkMenu(); return; }
        var text = "You step over to Shelly and give her a warm hug, whispering reassurance into her ear. She melts into your arms, smiling and hugging you just as tightly. You stay like that for a few minutes before letting go.\n\n<i>“Thanks for that,”</i> she says with a genuine smile.";
        addRel("TRUST",1); addRel("AFFECTION",1);
        if (typeof pc.addNice === "function") pc.addNice(3);
        text += kind() ? "\n\nYou nod just as genuinely, saying she’s always welcome." : "\n\nYou smirk and nod in response.";
        say(text, 5);
    };

    window.tnShellyCabin = function () {
        if (!window.tnShellyModEnabled()) { if (typeof mainGameMenu === "function") mainGameMenu(); return; }
        clearOutput();
        showHer(false);
        author("Gardeford");
        output("Shelly has the spare bunk nearest the shower. The Ovilium sign leans on the wall, and a sugary smell hangs over the sheets. She waves when she sees you.\n\n<i>“Hey [pc.name], you need anything?”</i>");
        clearMenu();
        addButton(0, "Talk", window.tnShellyTalkMenu, "Talk", "Have a conversation with Shelly aboard the ship.");
        if (typeof window.tnShellyAssist === "function") addButton(1, "Assist", window.tnShellyAssist, "Assist", "Help Shelly lay some eggs.");
        if (pc.hasCock() && typeof window.tnShellySex === "function") addButton(2, "Sex", window.tnShellySex, "Sex", "More than egg-laying assistance.");
        else addDisabledButton(2, "Sex", "Sex", "Sex with Shelly requires a phallus.");
        if (typeof window.tnShellyShop === "function") addButton(4, "Shop", window.tnShellyShop, "Shop", "Browse Shelly’s Ovilium stock.");
        addButton(3, "Unrecruit", window.tnShellyUnrecruit, "Unrecruit", "Send her back to Anon’s bar.");
        addButton(14, "Back", mainGameMenu, "Back", "Leave her to the bunk.");
    };

    window.tnShellyUnrecruit = function () {
        clearOutput();
        showHer(false);
        author("Gardeford");
        output("You tell her the bunk is hers only while you want her to have it.\n\nShe nods, ears dipping. <i>“Then I’ll go back to the bar. Come find me if you want your bunny again. I’ll be the one with the sign.”</i>\n\nShe tucks the sign under her arm, walks out of the room and is gone from the ship.");
        flags.TN_SHELLY_CREW = 0;
        /* Keep the game\'s real Shelly object. Vanilla scenes still need its full Creature API. */
        clearMenu();
        addButton(0, "Next", mainGameMenu, "Next", "Shelly has left the ship.");
    };

    window.tnShellyInstall = function () {
        if (typeof chars === "undefined" || typeof flags === "undefined") return false;
        if (!window.tnShellyModEnabled() || flags.TN_SHELLY_CREW !== 1) return false;

        /*
         * Preserve the game's real Shelly Creature object. The vanilla Assist/Sex
         * scenes pass Shelly into helpers such as pc.milkInMouth(), which require
         * Creature methods including lactationQ(), girlCumQ(), milkType, etc.
         *
         * If Shelly's content object is not registered yet, the existing watcher
         * will retry once per second instead of fabricating an incomplete object.
         */
        if (!chars.SHELLY) return false;
        return patchRealShelly(chars.SHELLY);
    };

    function boot() {
        if (typeof flags === "undefined" || typeof addButton !== "function") {
            setTimeout(boot, 400);
            return;
        }
        window.tnShellyInstall();
        if (!window.tnShellyWatch) window.tnShellyWatch = setInterval(window.tnShellyInstall, 1000);
    }
    boot();
})();
