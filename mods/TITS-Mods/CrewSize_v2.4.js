/* Multiplies the current ship's crew capacity. Pick x2, x5, or x10 in the Mod Menu,
   or tick Bypass crew limit (from Kitty's pack, merged 2026-10-30). */
(function () {
    function multiplier() {
        var n = 1;
        try { n = Number(flags && flags.TN_CREW_MULT); } catch (err) {}
        if (n === 2 || n === 5 || n === 10) return n;
        return 1;
    }

    window.tnCrewMultiplier = multiplier;

    function bypassOn() {
        try { return typeof flags !== "undefined" && flags.INFINITE_CREW !== undefined; }
        catch (err) { return false; }
    }

    function setBypass(on) {
        if (typeof flags === "undefined") return;
        if (on) flags.INFINITE_CREW = 1;
        else {
            try { delete flags.INFINITE_CREW; } catch (err) {}
            flags.INFINITE_CREW = undefined;
        }
    }

    function ensureStyle() {
        if (document.getElementById("tnCrewStyle")) return;
        var style = document.createElement("style");
        style.id = "tnCrewStyle";
        style.textContent = ".tnCrewCheck{display:flex;align-items:center;gap:0.7em;margin:0.9em 0 0.4em;max-width:520px;font-weight:bold;cursor:pointer;}"
            + ".tnCrewCheck input{appearance:none;-webkit-appearance:none;width:1.2em;height:1.2em;margin:0;flex:0 0 auto;border:0.12em solid var(--paleColor,#53677B);border-radius:0.2em;background:var(--foregroundColorB,#2C3649);box-shadow:0 0.15em 0.3em 0 var(--shadowColor,#202735);}"
            + ".tnCrewCheck input:hover{border-color:var(--focusColor,#00F5EF);}"
            + ".tnCrewCheck input:checked{background:var(--highlightColor,#8D31B0);border-color:var(--focusColor,#00F5EF);box-shadow:inset 0 0 0 0.22em var(--foregroundColorB,#2C3649);}";
        document.head.appendChild(style);
    }

    function register() {
        if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return;
        if (window.registerModMenu.__tnCrewSize) return;
        window.registerModMenu({
            id: "CrewSize",
            name: "Crew Size",
            author: "Kitty",
            description: "Multiply ship crew capacity by 2, 5, or 10, or bypass the limit.",
            getHtml: function () {
                ensureStyle();
                var current = multiplier();
                var choices = [1, 2, 5, 10];
                var html = "Scales the crew limit of whatever ship you are flying. x1 leaves the ship as it is. Free-rent crew still do not take a bunk. The ship screen’s Current Crew Capacity uses the new number. Save the game after you change it.\n\nCurrent multiplier: x" + current + ".";
                html += '<label class="tnCrewCheck"><input type="checkbox" data-tn-bypass="1"' + (bypassOn() ? " checked" : "") + '><span>Bypass crew limit</span></label>';
                html += "\nWhen this is on, Fly stays available even if the crew does not fit. The ship screen will say crew space is unlimited.";
                for (var i = 0; i < choices.length; i++) {
                    var n = choices[i];
                    html += '<button type="button" data-mod-act="' + n + '">' + (n === 1 ? "x1" : "x" + n) + "</button>";
                }
                return html;
            },
            onBind: function (root) {
                if (!root || !root.querySelector) return;
                var box = root.querySelector("[data-tn-bypass]");
                if (!box) return;
                box.checked = bypassOn();
                box.addEventListener("change", function () { setBypass(box.checked); });
            },
            onAct: function (act) {
                if (typeof flags === "undefined") return false;
                var n = Number(act);
                flags.TN_CREW_MULT = (n === 2 || n === 5 || n === 10) ? n : 1;
                return true;
            }
        });
        window.registerModMenu.__tnCrewSize = true;
    }

    function findProto(obj) {
        var p = Object.getPrototypeOf(obj);
        while (p && p !== Object.prototype) {
            if (Object.prototype.hasOwnProperty.call(p, "crewCapacity")) return p;
            p = Object.getPrototypeOf(p);
        }
        return null;
    }

    function scale(base) {
        var mult = multiplier();
        var n = Number(base);
        if (!isFinite(n) || !(mult > 1)) return base;
        return Math.floor(n * mult);
    }

    function patchProto(proto) {
        if (!proto || proto.crewCapacity.__tnCrew) return;
        var orig = proto.crewCapacity;
        var wrapped = function () {
            return scale(orig.apply(this, arguments));
        };
        wrapped.__tnCrew = true;
        proto.crewCapacity = wrapped;
    }

    function wrapShip(ship) {
        if (!ship || typeof ship.crewCapacity !== "function") return;
        if (ship.crewCapacity.__tnCrew) return;
        var orig = ship.crewCapacity;
        var wrapped = function () {
            return scale(orig.apply(ship, arguments));
        };
        wrapped.__tnCrew = true;
        ship.crewCapacity = wrapped;
    }

    function tick() {
        try {
            register();
            if (typeof pc_ship !== "undefined" && pc_ship && typeof pc_ship.crewCapacity === "function") {
                var proto = findProto(pc_ship);
                if (proto) patchProto(proto);
                wrapShip(pc_ship);
            }
        } catch (err) {}
    }

    setInterval(tick, 1000);
    tick();
})();
