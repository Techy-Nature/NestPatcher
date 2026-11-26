# TN_Fly v3.0 - NestPatcher mod (TiTS 0.9.168), Modv3.0. Desktop and Android.
# Fast travel by air: a tiny wings button on the minimap opens the big map in Fly mode.
# Pick a spot, then tap the floating wings button over the map to take off. Needs
# TN_Fly_v3.0.js (the buttons, the rules and the scenes).
# @@x@@ is a NestPatcher wildcard, so each block matches the PC and Android builds.
#   1. The map's title reads "Fly" in Fly mode.
#   2. Use Wings / Use Hoverboard under the map in Fly mode.
#   3. In Fly mode, tapping a room only picks it (no walking there).
#   4. Opening the map always starts outside Fly mode.
#   5. The floating wings button over the map.
#   6. The tiny wings button on the minimap (opposite corner to Show Full Map).

# Fly part 1 of 6
Rep [main.js]:
id:"promptHeader",dangerouslySetInnerHTML:{__html:"Map Viewer"}
W:
id:"promptHeader",dangerouslySetInnerHTML:{__html:window.tnFlyMapOpen&&window.tnFly?"Fly":"Map Viewer"}

# Fly part 2 of 6
Rep [main.js]:
@@l@@.createElement("div",{className:"mapNotesContainer"},
W:
@@l@@.createElement("div",{className:"mapNotesContainer"},window.tnFlyMapOpen&&window.tnFly?window.tnFly.mapChoice(@@l@@):null,

# Fly part 3 of 6
Rep [main.js]:
@@e@@.stopPropagation(),@@lh@@.L.handlePathRoutingRequest(@@e@@.target.dataset.roomindex)
W:
@@e@@.stopPropagation(),window.tnFlyMapOpen||@@lh@@.L.handlePathRoutingRequest(@@e@@.target.dataset.roomindex)

# Fly part 4 of 6
Rep [main.js]:
key:"showFullMap",value:function(){var @@e@@=this;
W:
key:"showFullMap",value:function(){var @@e@@=this;window.tnFlyMapOpen=!1;

# Fly part 5 of 6
Rep [main.js]:
@@l@@.createElement("div",{className:"dialogBody".concat(@@X@@?" flip_sides":"")},
W:
@@l@@.createElement("div",{className:"dialogBody".concat(@@X@@?" flip_sides":"").concat(window.tnFly?" tnFlyBody":"")},window.tnFly?window.tnFly.wingsButton(@@l@@):null,

# Fly part 6 of 6
Rep [main.js]:
@@l@@.createElement("div",{className:"sm_btn_container"},@@M@@&&!@@d@@&&(@@F@@||@@i@@)?@@l@@.createElement("div",{title:"Show Full Map",className:"btn full_map_btn".concat(ui.state.modalType===@@W@@.iM.FULL_MAP_VIEWER?" hidden":""),
W:
@@M@@&&!@@d@@&&(@@F@@||@@i@@)&&window.tnFly&&window.tnFly.minimapButton?window.tnFly.minimapButton(@@l@@,ui.state.modalType===@@W@@.iM.FULL_MAP_VIEWER):null,@@l@@.createElement("div",{className:"sm_btn_container"},@@M@@&&!@@d@@&&(@@F@@||@@i@@)?@@l@@.createElement("div",{title:"Show Full Map",className:"btn full_map_btn".concat(ui.state.modalType===@@W@@.iM.FULL_MAP_VIEWER?" hidden":""),
