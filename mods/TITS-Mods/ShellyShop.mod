# Shelly Ovilium + Sterilex shop: use alongside ShellyRecruit.mod and ShellyRecruit-ship-talk.js.
# Ovilium is the game's original item class (main.js Webpack module 7424, export F).
# Install this mod AFTER ShellyRecruit.mod so the bar-menu anchor is available.

Rep [content_tavros.js]:
window.tnShellyRecruitButton&&window.tnShellyRecruitButton(),addButton(14,"Leave",mainGameMenu)
W:
window.tnShellyRecruitButton&&window.tnShellyRecruitButton(),window.tnShellyShopButton&&(!window.tnShellyModEnabled||window.tnShellyModEnabled())&&addButton(5,"Shop",window.tnShellyShop,"Shop","Buy Ovilium and Sterilex from Shelly."),addButton(14,"Leave",mainGameMenu)

Add JS:
(function () {
  "use strict";
  var itemConstructor = null;
  var captureId = 9912459;

  function getOviliumClass() {
    if (itemConstructor) return itemConstructor;
    var chunks = window.webpackChunktits_html || self.webpackChunktits_html;
    if (!chunks || typeof chunks.push !== "function") return null;
    var requireFunction = null;
    // Webpack's runtime invokes the third entry of this artificial chunk with __webpack_require__.
    chunks.push([[captureId], {}, function (require) { requireFunction = require; }]);
    if (typeof requireFunction !== "function") return null;
    var exports = requireFunction(7424);
    if (!exports || typeof exports.F !== "function") return null;
    itemConstructor = exports.F;
    return itemConstructor;
  }

  // Built-in Sterilex pill: main.js Webpack module 24393, export d.
  var sterilexConstructor = null;
  function getSterilexClass() {
    if (sterilexConstructor) return sterilexConstructor;
    var chunks = window.webpackChunktits_html || self.webpackChunktits_html;
    if (!chunks || typeof chunks.push !== "function") return null;
    var requireFunction = null;
    chunks.push([[captureId + 1], {}, function (require) { requireFunction = require; }]);
    if (typeof requireFunction !== "function") return null;
    var exports = requireFunction(24393);
    if (!exports || typeof exports.d !== "function") return null;
    sterilexConstructor = exports.d;
    return sterilexConstructor;
  }

  window.tnShellyShopButton = true;
  window.tnShellyShop = function () {
    if (window.tnShellyModEnabled && !window.tnShellyModEnabled()) return;
    var onShip = typeof flags !== "undefined" && flags.TN_SHELLY_CREW === 1;
    var returnToShelly = function () {
      if (typeof window.closeShop === "function") window.closeShop();
      if (onShip && typeof window.tnShellyCabin === "function") window.tnShellyCabin();
      else if (typeof window.tnShellyOpen === "function") window.tnShellyOpen();
      else mainGameMenu();
    };
    var cls, sterilexCls;
    try { cls = getOviliumClass(); }
    catch (err) { console.error("[TN Shelly Shop] Cannot load Ovilium:", err); }
    try { sterilexCls = getSterilexClass(); }
    catch (err) { console.error("[TN Shelly Shop] Cannot load Sterilex:", err); }
    if (!sterilexCls) console.warn("[TN Shelly Shop] Sterilex unavailable; showing Ovilium only.");
    if (!cls || typeof window.showShop !== "function" ||
        typeof chars === "undefined" || !chars.SHELLY) {
      clearOutput();
      showName("Shelly");
      output("Shelly's Ovilium stock isn't available yet. Try visiting again once the game finishes loading.");
      clearMenu();
      addButton(14,"Back",returnToShelly);
      return;
    }
    // Reuse Shelly's complete native Creature object as shopkeeper.
    var seller = chars.SHELLY;
    seller.sellMarkup = 1.0;
    seller.buyMarkdown = 0.5;
    seller.typesBought = [GLOBAL.PILL];
    try {
      window.showShop({
        items: sterilexCls ? [cls, sterilexCls] : [cls],
        shopkeeper: seller,
        shopReturn: returnToShelly
      });
    } catch (err) {
      console.error("[TN Shelly Shop] Unable to open:",err);
      clearOutput();showName("Shelly");
      output("Shelly cannot open her stock just yet. Check the console for details.");
      clearMenu();addButton(14,"Back",returnToShelly);
    }
  };
})();
