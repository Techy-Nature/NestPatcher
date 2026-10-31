/* Zheniya, the zil call girl north of Anon's bar, without Fools Rush In, and as crew. */
(function () {
    function showHer() {
        if (typeof clearBust === "function") clearBust();
        if (typeof showBust === "function") showBust("CALLGIRL");
        if (typeof showName === "function") showName("Zheniya");
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

    window.tnZheniyaRecruitButton = function () {
        if (typeof flags === "undefined" || flags.TN_ZHENIYA_CREW === 1) return;
        addButton(1, "Recruit", window.tnZheniyaRecruit, "Recruit", "Offer Zheniya a bunk on your ship.");
    };

    window.tnZheniyaRecruit = function () {
        clearOutput();
        showHer();
        author("Savin");
        if (!roomForHer()) {
            output("Zheniya tips her head, black hair sliding over one shoulder.\n\n<i>“Sugar, I’d love a quieter bed than this hall. You don’t have a bunk free, though. Make room, and ask me again.”</i>");
            clearMenu();
            addButton(0, "Next", window.tnZheniyaMenu || mainGameMenu);
            return;
        }
        output("You tell Zheniya the hall above Anon’s is a poor place to keep working, and that the ship has a bunk with a door that locks.\n\nShe laughs, low and warm. <i>“Mmm. You want to take the call girl home, sweet thing?”</i> She stands, pink leggings whispering, and taps your chest. <i>“I’ll come. I still expect to be appreciated. And if you get bored of me, say so. I know the way back.”</i>\n\nShe gathers a small bag and follows you out.");
        flags.TN_ZHENIYA_CREW = 1;
        flags.ZIL_CALLGIRL_NAME_KNOWN = 1;
        if (flags.ZIL_CALLGIRL_SEXED === undefined) flags.ZIL_CALLGIRL_SEXED = 0;
        window.tnZheniyaInstall();
        clearMenu();
        addButton(0, "Next", window.tnZheniyaCabin, "Next", "Zheniya comes aboard.");
    };

    window.tnZheniyaCabin = function () {
        clearOutput();
        showHer();
        author("Savin");
        output("Zheniya has claimed a bunk and a mirror. The pink leggings are folded on the bed, and she is very much not wearing them when you walk in.\n\n<i>“Hey there, sweet thing. You need something, or did you just come to look?”</i>");
        clearMenu();
        if (typeof window.tnZheniyaMenu === "function") addButton(0, "Her Menu", window.tnZheniyaMenu, "Her Menu", "Rent her, or use whatever she is offering now.");
        else addDisabledButton(0, "Her Menu", "Her Menu", "Visit her in the hall above Anon’s once so her scenes can load.");
        addButton(1, "Unrecruit", window.tnZheniyaUnrecruit, "Unrecruit", "Send her back to the hall above Anon’s.");
        addButton(14, "Back", mainGameMenu, "Back", "Leave her to the bunk.");
    };

    window.tnZheniyaUnrecruit = function () {
        clearOutput();
        showHer();
        author("Savin");
        output("You tell her the bunk is hers only while she wants it.\n\nShe smiles, not offended. <i>“Then I’ll go back to my room above the bar, sugar. Come knock if you want me again.”</i>\n\nShe picks up her bag and is gone from the ship.");
        flags.TN_ZHENIYA_CREW = 0;
        if (typeof chars !== "undefined" && chars.ZHENIYA) delete chars.ZHENIYA;
        clearMenu();
        addButton(0, "Next", mainGameMenu, "Next", "Zheniya has left the ship.");
    };

    window.tnZheniyaInstall = function () {
        if (typeof chars === "undefined" || typeof flags === "undefined") return;
        if (flags.TN_ZHENIYA_CREW !== 1) return;
        if (chars.ZHENIYA && typeof chars.ZHENIYA.isCrew === "function") return;
        var no = function () { return false; };
        chars.ZHENIYA = {
            a: "Zheniya",
            short: "Zheniya",
            nameDisplay: function () { return "Zheniya"; },
            getClassName: function () { return "Zheniya"; },
            isCrew: function () { return flags.TN_ZHENIYA_CREW === 1; },
            isRecruited: function () { return flags.TN_ZHENIYA_CREW === 1; },
            freeRent: false,
            processTime: function () {},
            hasPerk: no,
            hasVagina: function () { return true; },
            isPregnant: no,
            hasWombPregnancy: no,
            fertility: function () { return 0; },
            bustString: function () { return "CALLGIRL"; },
            crewBlurb: function (slot) {
                if (!this.isCrew()) return "";
                addButton(slot, "Zheniya", window.tnZheniyaCabin, "Zheniya", "The zil call girl is aboard.");
                return "\n\nZheniya is aboard, taking up a crew slot and most of the perfume in that corridor.";
            }
        };
    };

    function boot() {
        if (typeof flags === "undefined" || typeof addButton !== "function") {
            setTimeout(boot, 400);
            return;
        }
        window.tnZheniyaInstall();
        if (!window.tnZheniyaWatch) window.tnZheniyaWatch = setInterval(window.tnZheniyaInstall, 1000);
    }
    boot();
})();
