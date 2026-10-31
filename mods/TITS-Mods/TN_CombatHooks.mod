# TN_CombatHooks.mod - turns on Phoenix Flare and Thunderclap from TN_PhoenixThunderbird.js.
# Replaces the missing patch_main_combat_exposure.py. Instead of editing main.js, it finds the game's
# combat attack list and single-attack class through Webpack at runtime and exposes them as:
#   window.TnCombatAttacks       (the attack list holder; .a is the attack array, plus applyParalyze)
#   window.TnSingleCombatAttack  (the class each attack is made from; has ATF_RANGED / ATF_SPECIAL)
#   window.TnTypeCollection      (the damage-type class, when it can be found; Phoenix has a fallback)
# No Replace blocks, so it can't miss when the game updates; it only logs a warning if nothing is found.
# Written for TiTS 0.9.166. Untested in-game: check the browser console for "[TN CombatHooks]".
# Written by Claude at TechyNest's behest.

Add Javascript:
(function () {
  "use strict";
  if (window.TnCombatHooks) return;
  var TAG = "[TN CombatHooks]";
  var state = { attacks: null, single: null, types: null, tries: 0, error: null };
  window.TnCombatHooks = state;

  function getRequire(tries) {
    var chunks = window.webpackChunktits_html || self.webpackChunktits_html;
    if (!chunks || typeof chunks.push !== "function") return null;
    var req = null;
    chunks.push([["tn-combat-hooks-" + tries], {}, function (r) { req = r; }]);
    return typeof req === "function" ? req : null;
  }

  // Only look inside modules whose source mentions these words, so unrelated
  // modules are never run.
  function candidates(req, words) {
    var ids = [];
    var mods = req.m || {};
    Object.keys(mods).forEach(function (id) {
      var src;
      try { src = Function.prototype.toString.call(mods[id]); } catch (e) { return; }
      for (var i = 0; i < words.length; i++) if (src.indexOf(words[i]) === -1) return;
      ids.push(id);
    });
    return ids;
  }

  function values(exp) {
    var out = [];
    if (!exp) return out;
    if (typeof exp === "function" || typeof exp === "object") out.push(exp);
    try {
      Object.keys(exp).forEach(function (k) {
        try { var v = exp[k]; if (v && (typeof v === "function" || typeof v === "object")) out.push(v); } catch (e) {}
      });
    } catch (e) {}
    return out;
  }

  function isAttack(x) {
    return x && typeof x === "object" && "ButtonName" in x && "Implementor" in x;
  }

  function attackArray(holder) {
    if (Array.isArray(holder.a) && holder.a.some(isAttack)) return "a";
    var names = Object.getOwnPropertyNames(holder);
    for (var i = 0; i < names.length; i++) {
      var v;
      try { v = holder[names[i]]; } catch (e) { continue; }
      if (Array.isArray(v) && v.length > 3 && v.every(isAttack)) return names[i];
    }
    return null;
  }

  function findAttacks(req) {
    var ids = candidates(req, ["applyParalyze"]);
    for (var i = 0; i < ids.length; i++) {
      var list = values(req(ids[i]));
      for (var j = 0; j < list.length; j++) {
        var h = list[j];
        if (typeof h.applyParalyze !== "function") continue;
        var key = attackArray(h);
        if (!key) continue;
        if (key !== "a") {
          var arrayKey = key;
          Object.defineProperty(h, "a", { configurable: true, get: function () { return h[arrayKey]; } });
        }
        return h;
      }
    }
    return null;
  }

  function findSingle(req, attacks) {
    // Best source: the constructor of an attack the game already made.
    var arr = attacks && attacks.a;
    if (arr && arr.length && arr[0].constructor && "ATF_RANGED" in arr[0].constructor) return arr[0].constructor;
    var ids = candidates(req, ["ATF_RANGED"]);
    for (var i = 0; i < ids.length; i++) {
      var list = values(req(ids[i]));
      for (var j = 0; j < list.length; j++) {
        var c = list[j];
        if (typeof c === "function" && "ATF_RANGED" in c && "ATF_SPECIAL" in c) return c;
      }
    }
    return null;
  }

  function findTypes() {
    try {
      if (window.pc && typeof pc.getHPResistances === "function") return pc.getHPResistances().constructor;
    } catch (e) {}
    return null;
  }

  function tick() {
    state.tries++;
    try {
      var req = getRequire(state.tries);
      if (req && window.GLOBAL) {
        if (!state.attacks) state.attacks = findAttacks(req);
        if (state.attacks && !state.single) state.single = findSingle(req, state.attacks);
        if (!state.types) state.types = findTypes();
        if (state.attacks && state.single) {
          window.TnCombatAttacks = state.attacks;
          window.TnSingleCombatAttack = state.single;
          if (state.types && !window.TnTypeCollection) window.TnTypeCollection = state.types;
          console.log(TAG, "combat list exposed (" + state.attacks.a.length + " attacks)");
          if (!state.types) setTimeout(lateTypes, 2000);
          return;
        }
      }
    } catch (e) {
      if (String(e) !== String(state.error)) { state.error = e; console.warn(TAG, e); }
    }
    if (state.tries < 360) { setTimeout(tick, 500); return; }
    console.warn(TAG, "couldn't find the game's combat attack list; Phoenix Flare and Thunderclap stay off.",
      { attacks: !!state.attacks, singleAttackClass: !!state.single });
  }

  // The damage-type class needs a loaded player; keep trying quietly after a save loads.
  function lateTypes() {
    if (window.TnTypeCollection) return;
    var t = findTypes();
    if (t) { window.TnTypeCollection = t; return; }
    setTimeout(lateTypes, 5000);
  }

  tick();
})();
