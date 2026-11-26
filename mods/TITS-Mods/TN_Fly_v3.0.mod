# TN_Fly v3.0 - NestPatcher mod (TiTS 0.9.168), Modv3.0. Desktop and Android.
# Fast travel by air: a Fly button above Steele's picture in the left sidebar opens the
# game's own map in Fly mode. Needs TN_Fly_v3.0.js (the button, the rules and the scenes).
# @@x@@ is a NestPatcher wildcard, so each block matches the PC and Android builds.
#   1-2. The Fly button above Steele's picture (normal sidebar and the classic sidebar).
#   3.   The map's title reads "Fly" in Fly mode.
#   4.   Use Wings / Use Hoverboard under the map in Fly mode.
#   5.   In Fly mode, tapping a room only picks it (no walking there).
#   6.   Opening the map normally always leaves Fly mode.
#   7.   In Fly mode, a floating wings button over the map takes off for the picked spot.

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
@@e@@.stopPropagation(),@@lh@@.L.handlePathRoutingRequest(@@e@@.target.dataset.roomindex)
W:
@@e@@.stopPropagation(),window.tnFlyMapOpen||@@lh@@.L.handlePathRoutingRequest(@@e@@.target.dataset.roomindex)

# Fly part 6 of 7
Rep [main.js]:
key:"showFullMap",value:function(){var @@e@@=this;
W:
key:"showFullMap",value:function(){var @@e@@=this;window.tnFlyMapOpen=!1;

# Fly part 7 of 7
Rep [main.js]:
@@l@@.createElement("div",{className:"dialogBody".concat(@@X@@?" flip_sides":"")},
W:
@@l@@.createElement("div",{className:"dialogBody".concat(@@X@@?" flip_sides":"").concat(window.tnFlyMapOpen&&window.tnFly?" tnFlyBody":"")},window.tnFlyMapOpen&&window.tnFly?window.tnFly.wingsButton(@@l@@):null,
