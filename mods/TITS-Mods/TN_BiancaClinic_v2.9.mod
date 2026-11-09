Name: Bianca's Clinic
Author: Neston
# TN_BiancaClinic - NestPatcher mod (TiTS 0.9.168), Modv2.9
# Bianca opens a small part-time practice on Tavros after your talk with her there.
# Needs TN_BiancaClinic_v2.9.js, and Bianca Extras (TN_BiancaExtras_v2.9.mod + .js) loaded
# BEFORE this file in enabled.txt: the plaza hook below builds on the Bianca Extras one.
#   - Ketria Clinic, off the South-East Plaza on Tavros' Residential Deck.
#   - Open 9 AM to 2 PM every third day; on those days she skips her rounds in the wilds.
# Needles use @@name@@ wildcards for minified names so they match PC and Android builds.

# South-East Plaza: the clinic door (after Bianca Extras' plaza hook)
Replace [content_tavros.js]:
window.tnBiancaPlazaBonus&&window.tnBiancaPlazaBonus()},@@o@@.addRoom(@@ee@@);
With:
window.tnBiancaPlazaBonus&&window.tnBiancaPlazaBonus(),window.tnBiancaClinicBonus&&window.tnBiancaClinicBonus()},@@o@@.addRoom(@@ee@@);

# No wild rounds on clinic days
Replace [main.js]:
window.biancaInTheWilderness=function(){var @@e@@=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null;return!pc.hasStatusEffect("Bianca Gone")
With:
window.biancaInTheWilderness=function(){var @@e@@=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null;return!(window.tnBiancaClinicDay&&window.tnBiancaClinicDay())&&!pc.hasStatusEffect("Bianca Gone")
