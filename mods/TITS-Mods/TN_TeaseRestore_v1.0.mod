# TN_TeaseRestore v1.0 - NestPatcher mod (TiTS 0.9.169). Desktop and Android.
# Gives the player's Tease attacks back the strength they had in the older (Flash)
# TiTS, on top of the current game's tease rules. Needs TN_TeaseRestore_v1.0.js
# (the settings and the maths). Without the .js file these blocks change nothing.
# @@x@@ is a NestPatcher wildcard, so each block matches the PC and Android builds.
#
# What changed since the Flash game (0.9.168 and 0.9.169 have the same tease code):
#   - Hit chance: the old roll added your level x 2.5, your sexiness and your tease
#     practice to your side. Now only half your libido (capped by level) counts.
#   - Practice: every body-part tease you've done (up to 100 each) added up to +10
#     damage and +10 to hit. The game still counts them but no longer uses them.
#   - Lust defense: the old game had the enemy's lust defense switched off for
#     teases. Now it's taken off every tease, and it grows with the enemy's level.
#
#   1. The tease hit roll can use the old formula when the new one misses.
#   2. Tease practice adds back to the base damage.
#   3. The enemy's lust defense can be skipped for your teases.
# Written by Claude at TechyNest's behest. Checked against the 0.9.169 desktop files.

# TeaseRestore part 1 of 3: the hit roll
Rep [main.js]:
window.toplessEnthusiastChestTease(@@e@@),@@A@@(@@e@@,@@t@@,@@c@@,@@m@@))
W:
window.toplessEnthusiastChestTease(@@e@@),window.tnTeaseMiss?window.tnTeaseMiss(@@A@@,@@e@@,@@t@@,@@c@@,@@m@@):@@A@@(@@e@@,@@t@@,@@c@@,@@m@@))

# TeaseRestore part 2 of 3: base damage
Rep [main.js]:
var @@f@@=10+@@e@@.level+@@e@@.sexiness()/2;
W:
var @@f@@=10+@@e@@.level+@@e@@.sexiness()/2;window.tnTeaseBase&&(@@f@@=window.tnTeaseBase(@@f@@,@@e@@));

# TeaseRestore part 3 of 3: the enemy's lust defense
Rep [main.js]:
var @@s@@=@@n@@.getTotal(),@@r@@=@@e@@.lustDef();
W:
var @@s@@=@@n@@.getTotal(),@@r@@=@@e@@.lustDef();window.tnTeaseLustDef&&(@@r@@=window.tnTeaseLustDef(@@r@@,@@e@@));
