# KittyItemRegistry.mod - registers Kitty custom items at start-up so they appear in
# Options > Cheats > Items and load correctly from saves, without visiting Lessau first.
# Checked against TiTS 0.9.166 (runtime.eae5fa3d.js, main.45162d27.js).
# When you add another item mod, add its class name and module ID to IDS below.
# Written by Claude at TechyNest's behest.
Add Javascript:
(function () {
  var IDS = { Drakongaru: 9912346, DrakoHornitol: 9912347, DragoHornitol: 9912348 };
  var chunks = self.webpackChunktits_html;
  if (!chunks || typeof chunks.push !== "function") return;
  // Webpack calls the third entry with its own require(); requiring each item module
  // runs its registry.registerClass(...) line.
  chunks.push([["tn-item-registry"], {}, function (require) {
    Object.keys(IDS).forEach(function (name) {
      try { require(IDS[name]); }
      catch (e) { console.warn("[TN] " + name + " is not in this build", e); }
    });
  }]);
})();
