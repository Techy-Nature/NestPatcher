# TN_FemmeFormer v3.0 - NestPatcher mod (TiTS 0.9.168), Modv3.0. Desktop and Android.
# Femme Former: a TamaniCorp machine that reshapes breasts AND pussies in one session.
# Bought at a booth in the TamaniCorp shop on Tavros (Lerris's shop) for 125,000 credits, then used
# from Masturbate > Installed (or Installed Devices) on your ship, like the Muff Modeler.
# Needs TN_FemmeFormer_v3.0.js (the booth, the machine, its menus and scenes).
# @@x@@ is a NestPatcher wildcard, so each block matches the PC and Android builds.
#   1. The booth button next to the Muff Modeler stand in the TamaniCorp shop.
#   2. Femme Former in the ship's Installed list.
#   3. Its idle line in the Installed Devices menu.
#   4-5. A "TamaniCorp, Femme Former" line in Stats > Miscellaneous.

# Femme Former part 1 of 5
Rep [main.js]:
addButton(@@e@@,"Stand",@@OO@@,"Stand","A nearby stand calls your attention. You could go check it out."))},window.muffModelerDelivery=
W:
addButton(@@e@@,"Stand",@@OO@@,"Stand","A nearby stand calls your attention. You could go check it out.")),window.tnFemmeFormer&&window.tnFemmeFormer.boothButton(@@e@@+1)},window.muffModelerDelivery=

# Femme Former part 2 of 5
Rep [main.js]:
InShipInterior()&&window.muffModelerInstalled()&&((@@e@@=new @@UB@@).text="Muff Modeler",@@e@@.ttHeader="Muff Modeler",@@e@@.ttBody="Make use of your Muff Modeler.",@@e@@.func=window.muffModelerMenu,@@a@@.installed.push(@@e@@)),
W:
InShipInterior()&&window.muffModelerInstalled()&&((@@e@@=new @@UB@@).text="Muff Modeler",@@e@@.ttHeader="Muff Modeler",@@e@@.ttBody="Make use of your Muff Modeler.",@@e@@.func=window.muffModelerMenu,@@a@@.installed.push(@@e@@)),InShipInterior()&&window.tnFemmeFormer&&window.tnFemmeFormer.installed()&&((@@e@@=new @@UB@@).text="Femme Former",@@e@@.ttHeader="Femme Former",@@e@@.ttBody="Lie down on your Femme Former and reshape your chest and pussy.",@@e@@.func=window.tnFemmeFormer.menu,@@a@@.installed.push(@@e@@)),

# Femme Former part 3 of 5
Rep [main.js]:
window.muffModelerInstalled()&&window.muffModelerInstalledBlurb();
W:
window.muffModelerInstalled()&&window.muffModelerInstalledBlurb();window.tnFemmeFormer&&window.tnFemmeFormer.installedBlurb();

# Femme Former part 4 of 5
Rep [main.js]:
void 0!==flags.MUFF_MODELER||void 0!==flags.ZODEE_GALOQUEST||
W:
void 0!==flags.MUFF_MODELER||void 0!==flags.TN_FEMME_FORMER||void 0!==flags.ZODEE_GALOQUEST||

# Femme Former part 5 of 5
Rep [main.js]:
@@hS@@("TamaniCorp, Muff Modeler",@@Ul@@)}
W:
@@hS@@("TamaniCorp, Muff Modeler",@@Ul@@)}if(window.tnFemmeFormer&&window.tnFemmeFormer.statsLine()){@@hS@@("TamaniCorp, Femme Former",window.tnFemmeFormer.statsLine())}
