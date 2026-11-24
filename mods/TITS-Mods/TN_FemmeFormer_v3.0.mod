# TN_FemmeFormer v3.0 - NestPatcher mod (TiTS 0.9.168), Modv3.0. Desktop and Android.
# Femme Former: a TamaniCorp machine that reshapes breasts AND pussies in one session.
# Found on Tarkus (Oil Sea Beach, three rooms south of the Polluted Beach), like the Dong Designer,
# or bought at a booth in the TamaniCorp shop on Tavros (Lerris's shop) for 50,500 credits.
# Install it from your inventory on your ship, then use it from Masturbate > Installed.
# Needs TN_FemmeFormer_v3.0.js (the item, the Tarkus find, the booth, the machine, menus and scenes).
# @@x@@ is a NestPatcher wildcard, so each block matches the PC and Android builds.
#   1. The booth button next to the Muff Modeler stand in the TamaniCorp shop.
#   2. Femme Former in the ship's Installed list.
#   3. Its idle line in the Installed Devices menu.
#   4-5. A "TamaniCorp, Femme Former" line in Stats > Miscellaneous.
#   6. The Femme Former lying on Tarkus's Oil Sea Beach (room 230).

# Femme Former part 1 of 6
Rep [main.js]:
addButton(@@e@@,"Stand",@@OO@@,"Stand","A nearby stand calls your attention. You could go check it out."))},window.muffModelerDelivery=
W:
addButton(@@e@@,"Stand",@@OO@@,"Stand","A nearby stand calls your attention. You could go check it out.")),window.tnFemmeFormer&&window.tnFemmeFormer.boothButton(@@e@@+1)},window.muffModelerDelivery=

# Femme Former part 2 of 6
Rep [main.js]:
InShipInterior()&&window.muffModelerInstalled()&&((@@e@@=new @@UB@@).text="Muff Modeler",@@e@@.ttHeader="Muff Modeler",@@e@@.ttBody="Make use of your Muff Modeler.",@@e@@.func=window.muffModelerMenu,@@a@@.installed.push(@@e@@)),
W:
InShipInterior()&&window.muffModelerInstalled()&&((@@e@@=new @@UB@@).text="Muff Modeler",@@e@@.ttHeader="Muff Modeler",@@e@@.ttBody="Make use of your Muff Modeler.",@@e@@.func=window.muffModelerMenu,@@a@@.installed.push(@@e@@)),InShipInterior()&&window.tnFemmeFormer&&window.tnFemmeFormer.installed()&&((@@e@@=new @@UB@@).text="Femme Former",@@e@@.ttHeader="Femme Former",@@e@@.ttBody="Lie down on your Femme Former and reshape your chest and pussy.",@@e@@.func=window.tnFemmeFormer.menu,@@a@@.installed.push(@@e@@)),

# Femme Former part 3 of 6
Rep [main.js]:
window.muffModelerInstalled()&&window.muffModelerInstalledBlurb();
W:
window.muffModelerInstalled()&&window.muffModelerInstalledBlurb();window.tnFemmeFormer&&window.tnFemmeFormer.installedBlurb();

# Femme Former part 4 of 6
Rep [main.js]:
void 0!==flags.MUFF_MODELER||void 0!==flags.ZODEE_GALOQUEST||
W:
void 0!==flags.MUFF_MODELER||void 0!==flags.TN_FEMME_FORMER||void 0!==flags.TN_FEMME_FORMER_FOUND||void 0!==flags.TN_FEMME_FORMER_BOUGHT||void 0!==flags.ZODEE_GALOQUEST||

# Femme Former part 5 of 6
Rep [main.js]:
@@hS@@("TamaniCorp, Muff Modeler",@@Ul@@)}
W:
@@hS@@("TamaniCorp, Muff Modeler",@@Ul@@)}if(window.tnFemmeFormer&&window.tnFemmeFormer.statsLine()){@@hS@@("TamaniCorp, Femme Former",window.tnFemmeFormer.statsLine())}

# Femme Former part 6 of 6
Rep [content_tarkus.js]:
the only passable directions."])))),window.rustCoastEncounters()},@@R@@.moveMinutes=1,@@R@@.addFlags(@@nn@@.tb.OUTDOOR,@@nn@@.tb.HAZARD,@@nn@@.tb.BEACH),@@t@@.addRoom(@@R@@);var @@G@@=new @@ab@@.du;@@G@@.index="231"
W:
the only passable directions."])))),window.tnFemmeFormer&&window.tnFemmeFormer.tarkusBox(0),window.rustCoastEncounters()},@@R@@.moveMinutes=1,@@R@@.addFlags(@@nn@@.tb.OUTDOOR,@@nn@@.tb.HAZARD,@@nn@@.tb.BEACH),@@t@@.addRoom(@@R@@);var @@G@@=new @@ab@@.du;@@G@@.index="231"
