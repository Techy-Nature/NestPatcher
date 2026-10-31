/* Pregnancy controls. Lists live pregnancies with a progress bar, and can pause, advance, finish, or clear one. */
(function () {
    var SLOTS = ["Pregnancy 1", "Pregnancy 2", "Pregnancy 3", "Pregnancy 4"];

    // The game's pregnancy manager (webpack module 5262, export f in 0.9.167).
    // The original mod looked for window.SC, which the game never defines, so
    // progress bars stayed at 0% and Pause did nothing.
    var pregManager = null;
    function PM() {
        if (pregManager) return pregManager;
        try {
            var chunks = self.webpackChunktits_html, req = null;
            if (!chunks || typeof chunks.push !== "function") return null;
            chunks.push([["tn-pregnancy-" + Date.now()], {}, function (r) { req = r; }]);
            var mod = req && req(5262);
            if (mod && mod.f && typeof mod.f.findHandler === "function") pregManager = mod.f;
        } catch (err) { console.warn("[TN] Pregnancy manager not found", err); }
        return pregManager;
    }

    function pauseKey(id, slot) {
        return id + ":" + slot;
    }

    function pauseSet() {
        var raw = "";
        try { raw = String(flags && flags.TN_PREG_PAUSE || ""); } catch (err) {}
        var set = {};
        raw.split(",").forEach(function (part) {
            if (part) set[part] = true;
        });
        return set;
    }

    function isPaused(id, slot) {
        return !!pauseSet()[pauseKey(id, slot)];
    }

    function setPaused(id, slot, on) {
        var set = pauseSet();
        var key = pauseKey(id, slot);
        if (on) set[key] = true;
        else delete set[key];
        if (typeof flags !== "undefined") flags.TN_PREG_PAUSE = Object.keys(set).join(",");
    }

    function personId(person) {
        if (person === pc) return "Player";
        if (typeof chars === "undefined") return "";
        for (var id in chars) if (chars[id] === person) return id;
        return "";
    }

    function personLabel(entry) {
        if (entry.id === "Player") return "You";
        try {
            if (entry.person.nameDisplay) return entry.person.nameDisplay();
            if (entry.person.short) return entry.person.short;
        } catch (err) {}
        return entry.id;
    }

    function pregnantPeople() {
        var list = [];
        function add(id, person) {
            if (!person || !person.pregnancyData || !person.isPregnant || !person.isPregnant()) return;
            list.push({ id: id, person: person });
        }
        if (typeof pc !== "undefined") add("Player", pc);
        if (typeof chars !== "undefined") {
            Object.keys(chars).sort().forEach(function (id) { add(id, chars[id]); });
        }
        return list;
    }

    function activeSlots(person) {
        var slots = [];
        if (!person || !person.pregnancyData) return slots;
        for (var i = 0; i < person.pregnancyData.length; i++) {
            var preg = person.pregnancyData[i];
            if (preg && preg.pregnancyType) slots.push(i);
        }
        return slots;
    }

    function selected() {
        var people = pregnantPeople();
        if (!people.length) return null;
        var index = window.tnPregPerson || 0;
        if (index < 0 || index >= people.length) index = 0;
        window.tnPregPerson = index;
        var entry = people[index];
        var slots = activeSlots(entry.person);
        var slotAt = window.tnPregSlot || 0;
        if (!slots.length) slotAt = 0;
        else if (slotAt < 0 || slotAt >= slots.length) slotAt = 0;
        window.tnPregSlot = slotAt;
        return { people: people, entry: entry, slots: slots, slot: slots[slotAt] };
    }

    function prettyType(type) {
        return String(type || "Unknown").replace(/Pregnancy$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
    }

    function baseTime(preg) {
        try {
            if (PM()) {
                var handler = PM().findHandler(preg.pregnancyType);
                if (handler && handler.basePregnancyIncubationTime > 0) return handler.basePregnancyIncubationTime;
            }
        } catch (err) {}
        return 0;
    }

    function timeLeft(preg) {
        var left = Number(preg.pregnancyIncubation);
        if (!(left >= 0)) return "Due now.";
        var multi = Number(preg.pregnancyIncubationMulti) || 1;
        var minutes = left / multi;
        var days = Math.floor(minutes / 1440);
        var hours = Math.floor((minutes % 1440) / 60);
        if (days > 0) return days + " day" + (days === 1 ? "" : "s") + " and " + hours + " hour" + (hours === 1 ? "" : "s") + " left.";
        if (hours > 0) return hours + " hour" + (hours === 1 ? "" : "s") + " left.";
        return Math.max(1, Math.ceil(minutes)) + " minutes left.";
    }

    function percent(preg) {
        if (!(Number(preg.pregnancyIncubation) >= 0)) return 100;
        var base = baseTime(preg);
        if (!(base > 0)) return 0;
        var done = 1 - (Number(preg.pregnancyIncubation) / base);
        if (done < 0) done = 0;
        if (done > 1) done = 1;
        return Math.round(done * 100);
    }

    function bar(pct, paused) {
        var color = paused ? "#53677B" : "#8D31B0";
        return '<div style="max-width:460px;height:16px;margin:6px 0;background:#2C3649;border:1px solid #53677B;border-radius:4px;overflow:hidden;">'
            + '<div style="width:' + pct + '%;height:100%;background:' + color + ';"></div></div>';
    }

    function advance(person, slot, minutes) {
        var preg = person.pregnancyData[slot];
        if (!preg || !preg.pregnancyType) return;
        var handler = PM() ? PM().findHandler(preg.pregnancyType) : null;
        if (handler && typeof handler.updatePregnancyStage === "function") handler.updatePregnancyStage(person, minutes, slot);
        else {
            var multi = Number(preg.pregnancyIncubationMulti) || 1;
            preg.pregnancyIncubation = Number(preg.pregnancyIncubation) - Math.round(minutes * multi);
        }
    }

    function finish(person, slot) {
        var preg = person.pregnancyData[slot];
        if (!preg) return;
        var multi = Number(preg.pregnancyIncubationMulti) || 1;
        var left = Number(preg.pregnancyIncubation);
        if (!(left >= 0)) left = 0;
        advance(person, slot, Math.ceil((left + 1) / multi));
    }

    function clearPreg(person, slot) {
        var preg = person.pregnancyData[slot];
        if (!preg) return;
        if (typeof preg.reset === "function") preg.reset();
        else {
            preg.pregnancyIncubation = 0;
            preg.pregnancyType = "";
            preg.pregnancyQuantity = 0;
            preg.pregnancyIncubationMulti = 1;
            preg.pregnancyBellyRatingContribution = 0;
        }
        setPaused(personId(person), slot, false);
    }

    function holdClock() {
        var pm = PM();
        if (!pm || typeof pm.updateStageForCreature !== "function") return;
        if (pm.updateStageForCreature.__tnPreg) return;
        var original = pm.updateStageForCreature;
        var wrapped = function (creature) {
            var saved = [];
            var id = personId(creature);
            if (creature && creature.pregnancyData) {
                for (var i = 0; i < creature.pregnancyData.length; i++) {
                    if (isPaused(id, i) && creature.pregnancyData[i] && creature.pregnancyData[i].pregnancyType) {
                        saved.push(i, creature.pregnancyData[i].pregnancyIncubation);
                    }
                }
            }
            var result = original.apply(this, arguments);
            for (var s = 0; s < saved.length; s += 2) {
                var preg = creature.pregnancyData[saved[s]];
                if (preg && preg.pregnancyType) preg.pregnancyIncubation = saved[s + 1];
            }
            return result;
        };
        wrapped.__tnPreg = true;
        pm.updateStageForCreature = wrapped;
    }

    function pageHtml() {
        var pick = selected();
        if (!pick) return "Nobody is pregnant right now. When a pregnancy starts, it will show up here with a progress bar.";
        var entry = pick.entry;
        var html = personLabel(entry) + " (" + ((window.tnPregPerson || 0) + 1) + " of " + pick.people.length + ").";
        pick.slots.forEach(function (slot, index) {
            var preg = entry.person.pregnancyData[slot];
            var pct = percent(preg);
            var paused = isPaused(entry.id, slot);
            var chosen = index === window.tnPregSlot;
            html += "\n\n<b>" + (SLOTS[slot] || ("Slot " + (slot + 1))) + "</b>";
            if (chosen) html += " (selected)";
            html += "\n" + prettyType(preg.pregnancyType);
            if (preg.pregnancyQuantity > 0) html += ", quantity " + preg.pregnancyQuantity;
            html += "\n" + bar(pct, paused) + pct + "%. " + timeLeft(preg);
            if (paused) html += " Paused.";
        });
        html += "\n\nThe buttons change the selected pregnancy. Pause holds it while time passes. Birth runs it to the end. Clear removes it.";
        html += '<button type="button" data-mod-act="hour">+1 Hour</button>';
        html += '<button type="button" data-mod-act="day">+1 Day</button>';
        html += '<button type="button" data-mod-act="threeday">+3 Days</button>';
        html += '<button type="button" data-mod-act="birth">Birth</button>';
        html += '<button type="button" data-mod-act="pause">' + (isPaused(entry.id, pick.slot) ? "Resume" : "Pause") + "</button>";
        html += '<button type="button" data-mod-act="clear">Clear</button>';
        if (pick.slots.length > 1) {
            html += '<button type="button" data-mod-act="prevs">Prev</button>';
            html += '<button type="button" data-mod-act="nexts">Next</button>';
        }
        if (pick.people.length > 1) {
            html += '<button type="button" data-mod-act="prevp">Person -</button>';
            html += '<button type="button" data-mod-act="nextp">Person +</button>';
        }
        return html;
    }

    function onAct(act) {
        var pick = selected();
        if (!pick) return true;
        var person = pick.entry.person;
        var slot = pick.slot;
        if (act === "hour") advance(person, slot, 60);
        else if (act === "day") advance(person, slot, 1440);
        else if (act === "threeday") advance(person, slot, 4320);
        else if (act === "birth") finish(person, slot);
        else if (act === "pause") setPaused(pick.entry.id, slot, !isPaused(pick.entry.id, slot));
        else if (act === "clear") clearPreg(person, slot);
        else if (act === "prevs") window.tnPregSlot = (window.tnPregSlot || 0) - 1;
        else if (act === "nexts") window.tnPregSlot = (window.tnPregSlot || 0) + 1;
        else if (act === "prevp") window.tnPregPerson = (window.tnPregPerson || 0) - 1;
        else if (act === "nextp") window.tnPregPerson = (window.tnPregPerson || 0) + 1;
        return true;
    }

    function register() {
        if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return;
        if (window.registerModMenu.__tnPregnancy) return;
        window.registerModMenu({
            id: "Pregnancy",
            name: "Pregnancy",
            author: "Kitty",
            description: "Progress bars and controls for live pregnancies.",
            getHtml: pageHtml,
            onAct: onAct
        });
        window.registerModMenu.__tnPregnancy = true;
    }

    function tick() {
        try {
            register();
            holdClock();
        } catch (err) {}
    }

    setInterval(tick, 1000);
    tick();
})();
