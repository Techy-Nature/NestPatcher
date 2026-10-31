# TN_UpperBodyFix - Appearance screen fix for TiTS (checked against 0.9.166, main.45162d27.js).
# The game describes everyone's upper body as having "the usual torso, arms, hands, and
# fingers", then later in the same paragraph describes claws, paws or scales. This mod makes
# that opening sentence match the body: e.g. "the usual torso, furred arms, and clawed,
# pad-tipped paws". Ordinary human arms keep the game's original wording.
# Applies to the player and to NPC appearance screens. Can be switched off in Android Mods.

Rep [main.js]:
t+=" humanoid upper body with the usual torso, arms, hands, and fingers"
W:
t+=(window.tnUpperBody&&window.tnUpperBody(e,!0))||" humanoid upper body with the usual torso, arms, hands, and fingers"

Rep [main.js]:
t+="\n\nFrom the waist up, [creature.name] has your typical humanoid upper body: torso, arms, hands, and fingers"
W:
t+="\n\nFrom the waist up, [creature.name] has "+((window.tnUpperBody&&window.tnUpperBody(e,!1))||"your typical humanoid upper body: torso, arms, hands, and fingers")

Add Javascript:
(function () {
  var MOD_ID = "tn.upperbodyfix";

  function enabled() {
    return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID);
  }

  function has(c, flag) {
    try { return typeof c.hasArmFlag === "function" && flag !== undefined && c.hasArmFlag(flag); }
    catch (err) { return false; }
  }

  // Returns the replacement wording, or null to keep the game's original sentence.
  // you=true: "...you have a" + result. you=false: "[creature.name] has " + result.
  window.tnUpperBody = function (c, you) {
    try {
      if (!enabled() || !c || typeof GLOBAL === "undefined") return null;
      var G = GLOBAL;
      var armWords = [];
      if (has(c, G.FLAG_FURRED)) armWords.push("furred");
      if (has(c, G.FLAG_SCALED)) armWords.push("scaled");
      if (has(c, G.FLAG_CHITINOUS)) armWords.push("chitinous");
      if (has(c, G.FLAG_FEATHERED)) armWords.push("feathered");
      if (has(c, G.FLAG_GOOEY) || has(c, G.FLAG_AMORPHOUS)) armWords.push("gooey");

      var paws = has(c, G.FLAG_PAWS);
      var handWords = [];
      if (typeof c.hasClawedHands === "function" && c.hasClawedHands()) handWords.push("clawed");
      if (typeof c.hasPaddedHands === "function" && c.hasPaddedHands() && !paws) handWords.push("padded");
      if (paws) handWords.push("pad-tipped");
      if (c.armType === G.TYPE_FROG || c.armType === G.TYPE_SHARK) handWords.push("webbed");

      // Nothing about these arms or hands is unusual: keep the original sentence.
      if (!armWords.length && !handWords.length && !paws) return null;

      var arms = (armWords.length ? armWords.join(", ") + " " : "") + "arms";
      // Same shape as the game's sentence: "torso, arms, hands, and fingers".
      var rest = paws
        ? (handWords.length ? handWords.join(", ") + " " : "") + (c.armType === G.TYPE_AVIAN ? "talons" : "paws")
        : (handWords.length ? handWords.join(", ") + " hands, and fingers" : "hands, and fingers");
      return you
        ? " humanoid upper body with the usual torso, " + arms + ", " + (paws ? "and " : "") + rest
        : "a humanoid upper body: torso, " + arms + ", " + (paws ? "and " : "") + rest;
    } catch (err) {
      console.warn("[TN] Upper body fix fell back to the original text", err);
      return null;
    }
  };

  function register() {
    if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return false;
    window.registerModMenu({
      id: MOD_ID,
      name: "Upper Body Description Fix",
      author: "TechyNest",
      description: "Stops the Appearance screen calling clawed, pawed, scaled or furred arms \"the usual arms, hands, and fingers\". Ordinary arms keep the original text.",
      supportsToggle: true
    });
    return true;
  }
  if (!register()) {
    var tries = 0, timer = setInterval(function () { if (register() || ++tries >= 60) clearInterval(timer); }, 500);
  }
})();
