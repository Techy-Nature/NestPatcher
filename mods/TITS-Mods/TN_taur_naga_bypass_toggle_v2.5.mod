Add Javascript
// Taur / Naga gate bypass for Trials in Tainted Space - runtime half.
//
// This file no longer changes what the game answers for isTaur(), isNaga() or
// isBiped(), so scene text and scenes that already support taurs behave exactly
// as the game wrote them. It only provides:
//   - the on/off switch (Options > Android Mods > Taur/Naga Scene Bypass)
//   - window.tnBB(pc), which the generated gate patches call. It answers true
//     only when the switch is on AND the player has 1 leg (naga) or 4 legs (taur).
//
// The gate patches themselves live in mods/taur_naga_gates.mod, which you create
// by running taur_gate_scan.js (see its header). Without that file this mod does
// nothing visible. Console fallback: tnTaurNaga(false) / tnTaurNaga(true).
(function () {
  var MOD_ID = "taur-naga-bypass";
  var SHOW_STATUS = true;    // start-up note, shown only while Debug Mode is on
  var fallbackOn = true;     // used when no TN menu is running

  // The Mod Menu is the single source of truth for the switch, so it survives
  // restarts. Every gate re-checks it, so toggling takes effect on the next menu.
  function bypassOn() {
    try {
      if ((window.tnModMenuActive===true&&typeof window.isTnModEnabled==="function") && (window.tnModMenuActive===true&&typeof window.getModMenu==="function") && window.getModMenu(MOD_ID)) {
        return !!window.isTnModEnabled(MOD_ID);
      }
    } catch (e) {}
    return fallbackOn;
  }

  window.tnTaurNaga = function (on) {
    if (on === undefined) return bypassOn();
    try {
      if ((window.tnModMenuActive===true&&typeof window.setTnModEnabled==="function") && (window.tnModMenuActive===true&&typeof window.getModMenu==="function") && window.getModMenu(MOD_ID)) {
        window.setTnModEnabled(MOD_ID, !!on);
        return bypassOn();
      }
    } catch (e) {}
    fallbackOn = !!on;
    return fallbackOn;
  };

  // Called from the patched gates with the game's own player object.
  window.tnBB = function (p) {
    try {
      return bypassOn() && !!p && (p.legCount === 1 || p.legCount === 4);
    } catch (e) {
      return false;
    }
  };

  function gateCount() {
    var n = window.tnTaurNagaGateCount;
    return typeof n === "number" ? n : 0;
  }

  // Debug Mode is the Android Mods setting (Options > Android Mods > Debug Mode).
  // It only counts while that menu is running (Android); otherwise it's off.
  function debugOn() {
    try {
      if ((window.tnModMenuActive===true&&typeof window.isTnDebugEnabled==="function")) return !!window.isTnDebugEnabled();
      return false;
    } catch (e) {
      return false;
    }
  }

  function registerWithMenu() {
    window.registerModMenu({
      id: MOD_ID,
      name: "Taur/Naga Scene Bypass",
      author: "KittyPatcher",
      description: "Lets taur and naga bodies use scene options the game switches off for them. Only those blocked buttons change; scene text is left as written.",
      supportsToggle: true,
      getHtml: function () {
        var n = gateCount();
        var status = n > 0
          ? (debugOn() ? "<p>Gate patches installed: " + n + ".</p>" : "")
          : "<p>No gate patches installed. Run taur_gate_scan.js, then rebuild with KittyPatcher.</p>";
        return status +
          "<p>Turning this off or on applies the next time a menu is drawn. " +
          "Text already on screen is not changed. Options that were already open to " +
          "taurs, and anything written for taurs, are not affected either way.</p>";
      }
    });
  }

  function tryRegister() {
    if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return false;
    try { registerWithMenu(); } catch (e) { console.error("[TN] Taur/Naga menu registration failed", e); }
    return true;
  }
  // Register straight away when the Mod Menu is already loaded, so the saved
  // on/off choice applies from the start; otherwise keep looking for a while.
  if (!tryRegister()) {
    var regTries = 0;
    var regTimer = setInterval(function () {
      regTries++;
      if (tryRegister() || regTries >= 80 || (window.tnModMenuActive === false && regTries >= 12)) clearInterval(regTimer);
    }, 250);
  }

  function note(text) {
    if ((window.tnModMenuActive===true&&typeof window.tnDebugLog==="function")) window.tnDebugLog(text);
    if (!SHOW_STATUS || !debugOn()) return;
    try {
      var el = document.createElement("div");
      el.textContent = text;
      el.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;padding:6px 10px;" +
        "border-radius:6px;background:rgba(0,0,0,.8);color:#fff;font:12px sans-serif;pointer-events:none";
      document.body.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 6000);
    } catch (e) {}
  }

  // Wait a moment so the gate-count line (added by the generated mod) has run.
  setTimeout(function () {
    var n = gateCount();
    note(n > 0
      ? "TN: taur/naga bypass " + (bypassOn() ? "on" : "switched off") + " (" + n + " gates patched)"
      : "TN: taur/naga bypass has no gate patches yet (run taur_gate_scan.js)");
  }, 1500);
})();
