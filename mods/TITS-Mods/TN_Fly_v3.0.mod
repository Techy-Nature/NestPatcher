# TN_Fly v3.0 - NestPatcher mod (TiTS 0.9.168), Modv3.0. Desktop and Android.
# Fast travel by air: a Fly button above Steele's picture in the left sidebar opens the
# game's own map in Fly mode. Needs TN_Fly_v3.0.js (the button, the rules and the scenes).
# @@x@@ is a NestPatcher wildcard, so each block matches the PC and Android builds.
#   1-2. The Fly button above Steele's picture (normal sidebar and the classic sidebar).
#   3.   The map's title reads "Fly" in Fly mode.
#   4.   Use Wings / Use Hoverboard under the map in Fly mode.
#   5.   The map's Teleport button becomes Fly in Fly mode (without cheats on).
#   6.   In Fly mode, tapping a room only picks it (no walking there).
#   7.   Opening the map normally always leaves Fly mode.

# Fly part 1 of 7
Rep [main.js]:
),@@l@@.createElement("div",{className:"d-flex justify-content-between sidebarBustContainer"},@@P@@?@@l@@.createElement(@@vc@@,{inputType:this.props.inputType,key:"mss",
W:
),window.tnFly?window.tnFly.sidebarButton(@@l@@):null,@@l@@.createElement("div",{className:"d-flex justify-content-between sidebarBustContainer"},@@P@@?@@l@@.createElement(@@vc@@,{inputType:this.props.inputType,key:"mss",

# Fly part 2 of 7
Rep [main.js]:
),@@l@@.createElement("div",{className:"d-flex justify-content-between sidebarBustContainer"},@@S@@||@@k@@?@@l@@.createElement(@@l@@.Fragment,null,this.props.gameOptions.preLegacySidebarStyleBustFlip&&
W:
),window.tnFly?window.tnFly.sidebarButton(@@l@@):null,@@l@@.createElement("div",{className:"d-flex justify-content-between sidebarBustContainer"},@@S@@||@@k@@?@@l@@.createElement(@@l@@.Fragment,null,this.props.gameOptions.preLegacySidebarStyleBustFlip&&

# Fly part 3 of 7
Rep [main.js]:
id:"promptHeader",dangerouslySetInnerHTML:{__html:"Map Viewer"}
W:
id:"promptHeader",dangerouslySetInnerHTML:{__html:window.tnFlyMapOpen&&window.tnFly?"Fly":"Map Viewer"}

# Fly part 4 of 7
Rep [main.js]:
@@l@@.createElement("div",{className:"mapNotesContainer"},
W:
@@l@@.createElement("div",{className:"mapNotesContainer"},window.tnFlyMapOpen&&window.tnFly?window.tnFly.mapChoice(@@l@@):null,

# Fly part 5 of 7
Rep [main.js]:
flags.CHEATS_ENABLED&&this.createButton("Teleport",(function(){[@@Wl@@.gO.MAIN_TEXT].includes(ui.state.mainElement)?moveToRoom(@@z@@,!0):skipToRoom(@@z@@),ui.render()}),null,!(@@z@@&&!@@te@@&&@@oe@@),"Teleport","".concat(flags.CHEATS_ENABLED?"Cheat":"Debug"," Teleport"),
W:
(flags.CHEATS_ENABLED||window.tnFlyMapOpen&&window.tnFly)&&this.createButton(window.tnFlyMapOpen&&window.tnFly?"Fly":"Teleport",(function(){if(window.tnFlyMapOpen&&window.tnFly)return window.tnFly.flyTo(@@z@@);[@@Wl@@.gO.MAIN_TEXT].includes(ui.state.mainElement)?moveToRoom(@@z@@,!0):skipToRoom(@@z@@),ui.render()}),null,window.tnFlyMapOpen&&window.tnFly?!window.tnFly.canLand(@@z@@):!(@@z@@&&!@@te@@&&@@oe@@),"Teleport",window.tnFlyMapOpen&&window.tnFly?window.tnFly.landTip(@@z@@):"".concat(flags.CHEATS_ENABLED?"Cheat":"Debug"," Teleport"),

# Fly part 6 of 7
Rep [main.js]:
@@e@@.stopPropagation(),@@lh@@.L.handlePathRoutingRequest(@@e@@.target.dataset.roomindex)
W:
@@e@@.stopPropagation(),window.tnFlyMapOpen||@@lh@@.L.handlePathRoutingRequest(@@e@@.target.dataset.roomindex)

# Fly part 7 of 7
Rep [main.js]:
key:"showFullMap",value:function(){var @@e@@=this;
W:
key:"showFullMap",value:function(){var @@e@@=this;window.tnFlyMapOpen=!1;
