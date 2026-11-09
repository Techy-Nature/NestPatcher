    /* ================= 9. Mod menu + boot ================= */
    function register(tries) {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") {
            if (tries < 120) setTimeout(function () { register(tries + 1); }, 500);
            return;
        }
        window.registerModMenu({
            id: MOD_ID,
            name: "Roo Crew",
            author: "William (text), Techy-Nest (port, sex scenes)",
            description: "Buy Roo, the bunny-eared kaithrit blackjack dealer, from Plutus on Zheng Shi and bring her aboard as your slave or a free woman. Talk, orders, affection, sex, sleeping together, vibrator control, travel visits, emails, and a trip to meet her family. Off = she does nothing new (a crew Roo stays aboard, quietly).",
            supportsToggle: true,
            defaultEnabled: true,
            getHtml: function () {
                var s = "Unlock: " + UNLOCK_CREDITS.toLocaleString() + " credits won overall at Roo’s table, plus her panties. The next day (from noon) her table is empty.\nPrice: " + PRICE.toLocaleString() + " credits. Plutus holds her for two weeks.\nControls: Codex > Extra > Roo (needs the Dane Crew mod for the Extra list).";
                try {
                    if (ready()) {
                        var st = flags.TN_ROO_STATE;
                        s += "\n\nStatus: " + ({ 1: "waiting in Plutus’ back office.", 2: "aboard your ship" + (slave() ? " (slave)." : (hired() ? " (free, Steele Tech trainee)." : " (free).")), 3: "in her Tavros apartment.", 4: "sold to someone else.", 5: "living with her family on Fetina B." }[st] || (eligible() ? "about to go missing from her table." : "still dealing blackjack."));
                    }
                } catch (err) {}
                return s;
            },
            onAct: function () { return true; }
        });
    }

    var started = false;
    function boot() {
        if (typeof flags === "undefined" || typeof addButton !== "function" || typeof output !== "function") {
            setTimeout(boot, 400);
            return;
        }
        if (started) return;
        started = true;
        try { registerMail(); } catch (e) {}
        try { wrapCodex(); } catch (e) {}
        if (!window.tnRooWatch) window.tnRooWatch = setInterval(function () {
            try { wrapCodex(); } catch (e) {}
            try { poll(); } catch (e) {}
        }, 3000);
        setTimeout(function () { register(0); }, 3000);
    }
    boot();
    /* debugging handle (console: tnRoo.debug) */
    H.debug = { txt: function (s, l) { return txt(s, l || 0); }, docText: docText, rows: ROWS, lines: LINES, ctx: function (o) { CTX = o || {}; }, sex: window.tnRooSex };
