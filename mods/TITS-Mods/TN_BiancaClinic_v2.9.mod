Name: Bianca's Clinic
Author: Neston
# TN_BiancaClinic - NestPatcher mod (TiTS 0.9.168), Modv2.9
# Bianca opens a small shared practice on Tavros after your talk with her there.
# Needs TN_BiancaClinic_v2.9.js, and Bianca Extras (TN_BiancaExtras_v2.9.mod + .js) loaded first.
#   - Ketria Clinic: two new rooms on the Merchant Deck, west of the Merchant's Thoroughfare room
#     between Anon's corner and the Treetop Tattoo street ("110"). Front desk (Nest) to the west,
#     exam hall (Dr. Ketria, Dr. Rewell) north of the front desk.
#   - The west door is locked until the clinic opens, and outside 8 AM to 6 PM.
#   - Bianca works 9 AM to 2 PM every third day; on those days she skips her rounds in the wilds.
# Needles use @@name@@ wildcards for minified names so they match PC and Android builds.

# The two clinic rooms, and the locked west door from the thoroughfare
Replace [content_tavros.js]:
var @@R@@=new @@Ij@@.du;@@R@@.index="110",@@R@@.name="Merchant’s Thoroughfare",@@R@@.south=@@k@@,@@k@@.north=@@R@@,@@R@@.moveMinutes=1,@@R@@.addFlags(@@se@@.tb.INDOOR,@@se@@.tb.PUBLIC,@@se@@.tb.NUDITY_ILLEGAL),
With:
var tnKcF=new @@Ij@@.du;tnKcF.index="KETRIA CLINIC",tnKcF.name="Ketria Clinic",tnKcF.moveMinutes=1,tnKcF.addFlags(@@se@@.tb.INDOOR,@@se@@.tb.PUBLIC,@@se@@.tb.NUDITY_ILLEGAL,@@se@@.tb.NPC),tnKcF.runOnEnter=function(){return window.tnKetriaFrontDesk?window.tnKetriaFrontDesk():(output("A small, empty waiting room."),!1)};var tnKcE=new @@Ij@@.du;tnKcE.index="KETRIA CLINIC HALL",tnKcE.name="Ketria Clinic",tnKcE.moveMinutes=1,tnKcE.addFlags(@@se@@.tb.INDOOR,@@se@@.tb.PUBLIC,@@se@@.tb.NUDITY_ILLEGAL,@@se@@.tb.MEDICAL),tnKcE.south=tnKcF,tnKcF.north=tnKcE,tnKcE.runOnEnter=function(){return window.tnKetriaExamHall?window.tnKetriaExamHall():(output("An empty hallway."),!1)};var @@R@@=new @@Ij@@.du;@@R@@.index="110",@@R@@.name="Merchant’s Thoroughfare",@@R@@.south=@@k@@,@@k@@.north=@@R@@,@@R@@.west=tnKcF,tnKcF.east=@@R@@,@@R@@.westLockedCondition=function(){return!(window.tnKetriaClinicDoor&&window.tnKetriaClinicDoor())},@@R@@.moveMinutes=1,@@R@@.addFlags(@@se@@.tb.INDOOR,@@se@@.tb.PUBLIC,@@se@@.tb.NUDITY_ILLEGAL),

# Add the clinic rooms to Tavros, right after the thoroughfare room they hang off
Replace [content_tavros.js]:
tavrosMerchantEncounters()},@@o@@.addRoom(@@R@@);var @@L@@=new @@Ij@@.du;@@L@@.index="TREETOP TATTOO"
With:
tavrosMerchantEncounters()},@@o@@.addRoom(@@R@@),@@o@@.addRoom(tnKcF),@@o@@.addRoom(tnKcE);var @@L@@=new @@Ij@@.du;@@L@@.index="TREETOP TATTOO"

# Thoroughfare text: the clinic sign (or the storefront being fitted out before it opens)
Replace [content_tavros.js]:
!!window.akaneCeleritasVeritasTheLegitimateBusinessBonus()||
With:
(window.tnKetriaStreetBonus&&window.tnKetriaStreetBonus()),!!window.akaneCeleritasVeritasTheLegitimateBusinessBonus()||

# No wild rounds on clinic days
Replace [main.js]:
window.biancaInTheWilderness=function(){var @@e@@=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null;return!pc.hasStatusEffect("Bianca Gone")
With:
window.biancaInTheWilderness=function(){var @@e@@=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null;return!(window.tnBiancaClinicDay&&window.tnBiancaClinicDay())&&!pc.hasStatusEffect("Bianca Gone")
