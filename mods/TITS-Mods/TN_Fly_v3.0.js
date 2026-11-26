/* TN Fly for Trials in Tainted Space (Modv3.0, checked against 0.9.168).
   Fast travel by air for a Steele with wings and/or any hoverboard (the pink one, Anno's Holoboard or a modded board).

   - Whenever Steele has wings (any kind) or carries any hoverboard, a tiny wings button
     sits on the left edge of the minimap, halfway down. Tap it to open the big map
     in Fly mode, pick an outdoor spot you've already found on this planet, then tap the
     round wings button floating over the map ("Take off"). On a map opened the usual way,
     the floating button reads "Fly" and switches it into Fly mode.
   - Steele takes off with a short scene, then lands there (the move itself works like
     the game's own Teleport cheat, so arrival events still happen).
   - Wings: 5 energy per flight. Hoverboard only: no energy.
   - With wings AND a hoverboard, the map has Use Wings / Use Hoverboard under it.
     Use Wings jumps off the hoverboard like a springboard (5 energy); Use Hoverboard
     rides it the whole way (no energy). Saved in the TN_FLY_WITH flag ("wings" or
     "hoverboard", default "wings").
   - Greyed out (with the reason as a tooltip, or a note when tapped on Android):
     indoors, caves, in a scene or fight, on a screen other than the main one, too
     tired, and on no-fly planets (Dhaal's air traffic, Phaedra's anti-air guns).

   Needs TN_Fly_v3.0.mod (it adds the button and the Fly mode to the game's map).
   Toggle: Android Mods / TN Mod Settings > "Fly". */
(function () {
    "use strict";
    if (window.tnFly) return;

    var MOD_ID = "TN_Fly";
    var ENERGY_COST = 5;
    // The game's room flags (0.9.168).
    var OUTDOOR = 1, CAVE = 19, SHIPINTERIOR = 27, LOW_GRAVITY = 31;
    var MAIN_TEXT = 1;          // ui.state.mainElement on the normal game screen

    // Planets you can't fly on. "test" matches the planet name the game shows.
    var NO_FLY = [
        { test: /^dhaal/i, tip: "Dhaal’s skies are packed with air traffic, and flying outside the lanes isn’t allowed." },
        { test: /^phaedra/i, tip: "The Evermind’s anti-air guns cover Phaedra’s sky. Anything that flies gets shot down." }
    ];

    // ---------------------------------------------------------------------------
    // Small helpers
    // ---------------------------------------------------------------------------
    function active() {
        return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") ||
            window.isTnModEnabled(MOD_ID);
    }
    function P(fn, dflt) { try { var v = fn(); return v === undefined ? dflt : v; } catch (err) { return dflt; } }
    function player() { return P(function () { return window.pc; }, null); }
    function hasWings() { var pc = player(); return !!(pc && P(function () { return pc.hasWings(); }, false)); }
    // Any hoverboard counts: the game's pink one, Anno's Holoboard, or any modded board that
    // says it is a hoverboard (is("Hoverboard")) or has "hoverboard"/"holoboard" in its class name.
    function isBoard(it) {
        if (!it || typeof it.getClassName !== "function") return false;
        if (P(function () { return typeof it.is === "function" && it.is("Hoverboard"); }, false)) return true;
        return /hover ?board|holo ?board/i.test(P(function () { return it.getClassName(); }, ""));
    }
    function boards() {
        var pc = player();
        return pc ? P(function () { return pc.inventory.storage.filter(isBoard); }, []) : [];
    }
    function hasHoverboard() { return boards().length > 0; }
    // With two or more boards, each flight takes a random one.
    function pickBoard() {
        var all = boards();
        return all.length ? all[Math.floor(Math.random() * all.length)] : null;
    }
    // What the scenes call it: "pink hoverboard", "teal holoboard", "bare steel holoboard"...
    function boardName(it) {
        if (it === undefined) it = pickBoard();
        if (!it) return "hoverboard";
        if (P(function () { return it.getClassName() === "TnHoloboard"; }, false)) {
            if (it.tnBare) return "bare steel holoboard";
            var c = P(function () { return it.coloration(); }, "");
            return (c && c !== "factory pink" ? c + " " : "") + "holoboard";
        }
        var n = String(P(function () { return it.longName; }, "") || "").replace(/^(an?|the)\s+/i, "");
        n = n.replace(/^[^ ]+[’']s\s+/, "");   // drop an owner's name ("Anno's ...")
        return /board/i.test(n) ? n.toLowerCase() : "hoverboard";
    }
    function canUse() { return hasWings() || hasHoverboard(); }

    // "wings" (flap, with the hoverboard as a springboard if you have one) or "hoverboard".
    function mode() {
        var w = hasWings(), h = hasHoverboard();
        if (w && !h) return "wings";
        if (h && !w) return "hoverboard";
        var f = P(function () { return window.flags.TN_FLY_WITH; }, undefined);
        return f === "hoverboard" ? "hoverboard" : "wings";
    }
    function setMode(m) {
        try {
            if (window.flags) window.flags.TN_FLY_WITH = m === "hoverboard" ? "hoverboard" : "wings";
        } catch (err) { /* no save loaded */ }
    }
    function cost() { return mode() === "hoverboard" ? 0 : ENERGY_COST; }

    function hasFlag(room, f) { return !!(room && P(function () { return room.hasFlag(f); }, false)); }
    function isOutdoorSpot(room) {
        if (!room) return false;
        if (!hasFlag(room, OUTDOOR) || hasFlag(room, CAVE) || hasFlag(room, SHIPINTERIOR)) return false;
        var idx = String(room.index || "");
        if (idx.indexOf("SPACE") !== -1) return false;          // space walks and the like
        if (hasFlag(room, LOW_GRAVITY)) return false;           // the game treats these as space too
        return true;
    }
    function planetName(room) { return String(P(function () { return room.planet; }, "") || ""); }
    function noFly(room) {
        var name = planetName(room);
        for (var i = 0; i < NO_FLY.length; i++) if (NO_FLY[i].test.test(name)) return NO_FLY[i].tip;
        return "";
    }
    function currentRoom() { return P(function () { return window.getCurrentRoom(); }, null); }

    // Why Steele can't take off right now, or "" when they can.
    function blockReason() {
        var pc = player();
        if (!pc || !canUse()) return "You need wings or a hoverboard to fly.";
        if (P(function () { return window.InShipInterior(); }, false)) return "You’re inside your ship.";
        if (P(function () { return window.inCombat(); }, false)) return "You’re in a fight!";
        if (P(function () { return window.getGameState().inSceneBlockSaving; }, false)) return "You can’t fly in the middle of something.";
        if (P(function () { return window.ui.state.mainElement; }, MAIN_TEXT) !== MAIN_TEXT) return "Go back to the main screen to fly.";
        var room = currentRoom();
        if (!room || room.commonNavigateRequirements === false) return "You can’t leave here right now.";
        if (!isOutdoorSpot(room)) return "You need to be outdoors to take off.";
        var nf = noFly(room);
        if (nf) return nf;
        if (P(function () { return pc.hasStatusEffect("Web"); }, false)) return "You’re stuck in a web!";
        if (P(function () { return pc.hasStatusEffect("Endowment Immobilized"); }, false) && mode() !== "hoverboard")
            return "You’re far too heavy to get off the ground.";
        if (cost() > 0 && P(function () { return pc.energy(); }, 0) < cost())
            return "You’re too tired to fly. You need " + cost() + " energy.";
        return "";
    }

    function canLandReason(room) {
        var why = blockReason();
        if (why) return why;
        var here = currentRoom();
        if (!room) return "Pick an outdoor spot on the map first.";
        if (room === here) return "You’re already here.";
        if (!here || room.parentLocation !== here.parentLocation) return "You can only fly around this planet.";
        if (!P(function () { return room.isDiscovered; }, false) || room.hiddenIfNotOccupied) return "You haven’t found that place yet.";
        if (!isOutdoorSpot(room)) return "You can only land somewhere outdoors.";
        if (noFly(room)) return noFly(room);
        return "";
    }

    function titleCase(s) {
        s = String(s || "");
        if (s !== s.toUpperCase()) return s;
        return s.toLowerCase().replace(/(^|[\s\-\/(])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
    }
    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; });
    }

    // ---------------------------------------------------------------------------
    // Look
    // ---------------------------------------------------------------------------
    function ensureStyle() {
        if (document.getElementById("tnFlyStyle")) return;
        var st = document.createElement("style");
        st.id = "tnFlyStyle";
        st.textContent =
            ".tnFlyNote{position:fixed;left:50%;bottom:12%;transform:translateX(-50%);z-index:2147483000;max-width:80vw;" +
            "padding:.7em 1em;border-radius:.4em;background:var(--foregroundColorB,#2C3649);color:var(--textColor,#fff);" +
            "border-left:.3em solid var(--highlightColor,#8D31B0);box-shadow:0 .3em 1em rgba(0,0,0,.5);font:1em Lato,sans-serif;}" +
            ".tnFlyChoice{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.5em;margin:.4em 0;font:1em Lato,sans-serif;}" +
            ".tnFlyChoice .tnFlyOpt{padding:.35em .9em;border-radius:.3125em;border:.1em solid var(--paleColor,#53677B);" +
            "background:var(--foregroundColorA,#333E52);color:var(--textColor,#fff);cursor:pointer;}" +
            ".tnFlyChoice .tnFlyOpt.on{background:var(--highlightColor,#8D31B0);color:#fff;font-weight:bold;}" +
            ".dialogBody.tnFlyBody{position:relative;}" +
            ".tnFlyWings{position:absolute;left:50%;bottom:1.2em;transform:translateX(-50%);z-index:20;width:5em;height:5em;" +
            "border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.05em;" +
            "border:.15em solid #fff;background:var(--highlightColor,#8D31B0);color:#fff;cursor:pointer;user-select:none;" +
            "box-shadow:0 .25em .9em rgba(0,0,0,.55);font:bold .85em Lato,sans-serif;text-align:center;line-height:1.1;}" +
            ".tnFlyWings.ready{animation:tnFlyBob 2.4s ease-in-out infinite;}" +
            ".tnFlyWings svg{width:2.4em;height:2.4em;fill:currentColor;}" +
            ".tnFlyWings:hover{filter:brightness(1.15);}" +
            ".tnFlyWings.disabled{background:var(--foregroundColorA,#333E52);border-color:var(--paleColor,#53677B);opacity:.6;" +
            "cursor:not-allowed;animation:none;filter:none;}" +
            // Same class as the game's minimap button strip, so each layout's top/height rules
            // line it up; pinned to the left edge with the button halfway down (mirrors the compass).
            ".sm_btn_container.tnFlyMini{left:0 !important;right:auto !important;" +
            "justify-content:center !important;padding-left:.25em;z-index:4;}" +
            ".sm_btn_container.tnFlyMini .btn.tnFlyOff .image{opacity:.45;}" +
            "@keyframes tnFlyBob{0%,100%{transform:translate(-50%,0);}50%{transform:translate(-50%,-.3em);}}";
        (document.head || document.documentElement).appendChild(st);
    }

    function note(text) {
        ensureStyle();
        var old = document.getElementById("tnFlyNote");
        if (old) old.remove();
        var el = document.createElement("div");
        el.id = "tnFlyNote";
        el.className = "tnFlyNote";
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.remove(); }, 3500);
    }

    function wingIcon() { return P(function () { return window.svgIcon("wings"); }, ""); }

    // Opens the map (if it isn't open yet) and switches it into Fly mode.
    function openMap() {
        var why = blockReason();
        if (why) { note(why); return; }
        try {
            if (!mapIsOpen()) window.ui.showFullMap();   // the .mod resets Fly mode here...
            window.ui.state.fullMapSelectedRoom = null;  // a tap on the normal map walks, so start fresh
            flyModal = window.ui.state.modalType;
            window.tnFlyMapOpen = true;       // ...so turn it on after
            window.ui.render();
        } catch (err) {
            window.tnFlyMapOpen = false;
            console.warn("[TN Fly] couldn't open the map", err);
        }
    }

    // ---------------------------------------------------------------------------
    // Map (Fly mode)
    // ---------------------------------------------------------------------------
    function mapChoice(R) {
        if (!R) return null;
        ensureStyle();
        var kids = [];
        var both = hasWings() && hasHoverboard();
        if (both) {
            var m = mode();
            ["wings", "hoverboard"].forEach(function (opt) {
                kids.push(R.createElement("div", {
                    key: "tnFly_" + opt,
                    className: "tnFlyOpt" + (m === opt ? " on" : ""),
                    role: "button",
                    tabIndex: 0,
                    title: opt === "wings" ? "Spring off your hoverboard and fly with your wings (" + ENERGY_COST + " energy)."
                        : "Ride your hoverboard the whole way (no energy).",
                    onClick: function (e) { if (e && e.stopPropagation) e.stopPropagation(); setMode(opt); try { window.ui.render(); } catch (err) {} }
                }, opt === "wings" ? "Use Wings" : "Use Hoverboard"));
            });
        }
        if (!kids.length) return null;
        return R.createElement("div", { key: "tnFlyChoice", className: "tnFlyChoice" }, kids);
    }

    // The floating wings button over the Fly map (the .mod puts it in the map's body).
    function mapIsOpen() {
        return P(function () { return !!document.querySelector(".full_map_viewer"); }, false);
    }
    function picked() { return P(function () { return window.ui.state.fullMapSelectedRoom; }, null); }
    // On the normal map it switches the map into Fly mode; in Fly mode it takes off.
    function wingsButton(R) {
        if (!R || !active() || !canUse()) return null;
        ensureStyle();
        var flying = !!window.tnFlyMapOpen;
        var stop = function (e) { if (e && e.stopPropagation) e.stopPropagation(); };
        if (!flying) {
            var blocked = blockReason();
            var tip = blocked || ("Fly somewhere outdoors on this planet" +
                (cost() ? " (" + cost() + " energy)." : " on your hoverboard (no energy)."));
            var start = function (e) { stop(e); openMap(); };
            return R.createElement("div", {
                key: "tnFlyWings",
                id: "tnFlyWings",
                className: "tnFlyWings" + (blocked ? " disabled" : ""),
                role: "button",
                tabIndex: 0,
                title: tip,
                "aria-label": tip,
                "aria-disabled": blocked ? "true" : "false",
                onClick: start,
                onPointerDown: stop,
                onDoubleClick: stop,
                onKeyDown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(e); } },
                dangerouslySetInnerHTML: { __html: wingIcon() + "<span>Fly</span>" }
            });
        }
        var room = picked();
        var why = canLandReason(room);
        var go = function (e) {
            stop(e);
            var r = picked();
            var w = canLandReason(r);
            if (w) { note(w); return; }
            flyTo(r);
        };
        return R.createElement("div", {
            key: "tnFlyWings",
            id: "tnFlyWings",
            className: "tnFlyWings" + (why ? " disabled" : " ready"),
            role: "button",
            tabIndex: 0,
            title: why || landTip(room),
            "aria-label": why || landTip(room),
            "aria-disabled": why ? "true" : "false",
            onClick: go,
            onPointerDown: stop,
            onDoubleClick: stop,
            onKeyDown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(e); } },
            dangerouslySetInnerHTML: { __html: wingIcon() + "<span>Take off</span>" }
        });
    }

    // The tiny button on the minimap: opens the big map straight into Fly mode.
    function minimapButton(R, mapOpen) {
        if (!R || !active() || !canUse()) return null;
        ensureStyle();
        var blocked = blockReason();
        var tip = blocked || ("Fly" + (cost() ? " (" + cost() + " energy)" : " on your hoverboard"));
        var go = function (e) { if (e && e.stopPropagation) e.stopPropagation(); openMap(); };
        var op = P(function () { return window.game.gameOptions.bustControlOpacity; }, undefined);
        return R.createElement("div", { key: "tnFlyMini", className: "sm_btn_container tnFlyMini" },
            R.createElement("div", {
                id: "tnFlyMiniBtn",
                title: tip,
                "aria-label": tip,
                role: "button",
                tabIndex: 0,
                className: "btn tnFlyMini_btn" + (mapOpen ? " hidden" : "") + (blocked ? " tnFlyOff" : ""),
                style: { opacity: op },
                onClick: go,
                onDoubleClick: function (e) { if (e && e.stopPropagation) e.stopPropagation(); },
                onKeyDown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(e); } }
            },
                R.createElement("span", { className: "image shade", dangerouslySetInnerHTML: { __html: wingIcon() } }),
                R.createElement("span", { className: "image", dangerouslySetInnerHTML: { __html: wingIcon() } })));
    }

    function canLand(room) { return !canLandReason(room); }
    function landTip(room) {
        var why = canLandReason(room);
        if (why) return why;
        return "Fly to " + titleCase(room.name) + (cost() ? " (" + cost() + " energy)" : "");
    }

    // ---------------------------------------------------------------------------
    // Take-off scene
    // ---------------------------------------------------------------------------
    function takeOffText(m, dest) {
        var pc = player();
        var taur = P(function () { return pc.isTaur(); }, false);
        var naga = P(function () { return pc.isNaga(); }, false);
        var where = "<b>" + esc(titleCase(dest.name)) + "</b>";
        var t;
        var ride = boardName(pickBoard());   // one board per flight, picked at random
        if (m === "hoverboard") {
            t = "You pull your " + ride + " out of your pack and drop it on the ground. It hums to life and bobs a hand’s width up, waiting for you. ";
            if (taur) t += "Getting all of your [pc.legsNoun] on it takes some careful shuffling, but once you’re balanced, you lean forward";
            else if (naga) t += "You coil your [pc.tail] onto the deck, settle your weight and lean forward";
            else t += "You hop on, plant your [pc.feet] and lean forward";
            t += ", and the board shoots off, skimming over the ground faster than you could ever run.";
            t += "\n\nThe land rushes past beneath you as you weave your way across the planet. Before long, " + where +
                " comes into view, and you lean back to slow down and climb off as the board settles. You tuck it under your arm and stow it back in your pack.";
            return t;
        }
        if (hasHoverboard()) {
            t = "You drop your " + ride + " and hop on, letting it carry you into a running start. As it picks up speed, you ";
            t += taur ? "gather your [pc.legsNoun] under you" : naga ? "wind your [pc.tail] tight" : "crouch low";
            t += " and kick off its deck, springing high into the air. The board bobs up after you, and you snag it and stow it in your pack as your [pc.wings] snap open.";
            t += " A few hard flaps and you’re climbing, the ground falling away below you.";
        } else {
            t = "You spread your [pc.wings] wide and give them a few test flaps, feeling the air catch beneath them. Then you ";
            t += taur ? "rear up on your hind [pc.legsNoun] and leap" : naga ? "coil your [pc.tail] and launch yourself" : "crouch and spring";
            t += " into the air, beating hard until the ground drops away below you.";
        }
        t += "\n\nYou bank toward " + where + ", riding the winds until you spot it, then circle down and land";
        t += taur ? " on all your [pc.legsNoun], folding your wings back against your sides." :
            naga ? ", coiling your [pc.tail] beneath you as you fold your wings back." :
            " lightly on your [pc.feet], folding your wings back.";
        return t;
    }

    function flyTo(room) {
        var why = canLandReason(room);
        if (why) { note(why); return; }
        var m = mode();
        var c = cost();
        window.tnFlyMapOpen = false;
        try { window.removeDialog(); } catch (err) {}
        try {
            setMode(m);
            var pc = player();
            if (c > 0) pc.energy(-c);
            window.clearOutput();
            window.output(takeOffText(m, room));
            if (c > 0) window.output("\n\n<i>(" + c + " energy)</i>");
            window.clearMenu();
            window.addButton(0, "Next", function () { window.moveToRoom(room, true); });
        } catch (err) {
            console.warn("[TN Fly] take-off failed, moving straight there", err);
            try { window.moveToRoom(room, true); } catch (err2) {}
        }
    }

    // The map can be closed many ways (Close, Escape, Android Back); drop Fly mode when it is.
    var flyModal = null;
    setInterval(function () {
        if (!window.tnFlyMapOpen) return;
        var now = P(function () { return window.ui.state.modalType; }, null);
        if (flyModal === null || now !== flyModal) window.tnFlyMapOpen = false;
    }, 400);

    // ---------------------------------------------------------------------------
    // Mod menu
    // ---------------------------------------------------------------------------
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Fly",
            author: "TN",
            description: "A tiny wings button on the minimap opens the map in Fly mode: fly to any outdoor spot you've found on this planet with wings (5 energy) or a hoverboard (free).",
            supportsToggle: true,
            onEnabledChange: function () { try { window.ui.render(); } catch (err) {} return true; }
        });
        return true;
    }
    (function waitForModMenu(tries) {
        if (register()) return;
        if (window.tnModMenuActive === false && tries >= 6) return;
        if (tries < 240) setTimeout(function () { waitForModMenu(tries + 1); }, 500);
    })(0);

    window.tnFly = {
        mapChoice: mapChoice,
        wingsButton: wingsButton,
        minimapButton: minimapButton,
        canLand: canLand,
        landTip: landTip,
        flyTo: flyTo,
        open: openMap,
        // for testing from the console
        why: blockReason,
        landWhy: canLandReason,
        mode: mode,
        setMode: setMode,
        _text: takeOffText,
        _boardName: boardName,
        _boards: boards
    };
})();
