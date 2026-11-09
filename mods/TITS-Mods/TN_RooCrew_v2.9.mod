Name: Roo Crew
Author: William (text), Techy-Nest (port, sex scenes)
# v2.9 (2026-11-09): hooks for TN_RooCrew_v2.9.js. Roo's blackjack table on Zheng Shi, Roo in the
#   crew list, her Ship button, travel blurbs, Sleep With, mornings, ship-return events, Fetina B in
#   the Fly menu and Reunite in Anno's crew menu. Codex > Extra > Roo uses TN_DaneCrew_v2.8.mod's hook.
#   @@x@@ names stand for minified names, so these should match on PC and Android builds of 0.9.168.

Replace [content_zhengshi.js]:
function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;hours>=12?(void 0===flags.MET_ROO?
With:
function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;if(window.tnRooFloor&&window.tnRooFloor(e))return;hours>=12?(void 0===flags.MET_ROO?

Replace [main.js]:
@@h@@.freeRent?@@r@@++:@@s@@++,@@u@@.push(@@l@@))}if(!diz.isCrew()
With:
@@h@@.freeRent?@@r@@++:@@s@@++,@@u@@.push(@@l@@))}window.tnRooCrewCount&&(@@s@@+=window.tnRooCrewCount());if(!diz.isCrew()

Replace [main.js]:
@@i@@+=@@r@@.crewBlurb(@@o@@++,@@n@@.includes(@@s@@))}}catch(@@e@@){@@a@@.e(@@e@@)}finally{@@a@@.f()}
With:
@@i@@+=@@r@@.crewBlurb(@@o@@++,@@n@@.includes(@@s@@))}}catch(@@e@@){@@a@@.e(@@e@@)}finally{@@a@@.f()}@@o@@<14&&window.tnRooCrewCount&&window.tnRooCrewCount()&&(@@i@@+=window.tnRooCrewBlurb(@@o@@++));

Replace [main.js]:
var r=!1;clearOutput();var u=function(){output(textify(
With:
var r=!1;clearOutput();window.tnRooTravel&&window.tnRooTravel(e);var u=function(){output(textify(

Replace [main.js]:
switch(getCrewSleepWith()){case"KIRO_BIMBO":
With:
if(window.tnRooSleep&&window.tnRooSleep())return;switch(getCrewSleepWith()){case"KIRO_BIMBO":

Replace [main.js]:
1===flags.ANNO_SLEEPWITH_DOMORNING&&(@@n@@=[window.annoMorningRouter]),
With:
window.tnRooMorning&&window.tnRooMorning(@@n@@),1===flags.ANNO_SLEEPWITH_DOMORNING&&(@@n@@=[window.annoMorningRouter]),

Replace [main.js]:
window.insideShipEvents=function(){var e;if(olympia.isRecruited()){
With:
window.insideShipEvents=function(){var e;if(window.tnRooShipEvent&&window.tnRooShipEvent())return!0;if(olympia.isRecruited()){

Replace [main.js]:
addButton(4,"Hunt",@@pC@@,"Hunt","Hunt for encounters with pirate vessels near ".concat(flags.HUNT_REGION_STORAGE||getPlanetName(),".")),addButton(14,"Back",@@HT@@)}
With:
addButton(4,"Hunt",@@pC@@,"Hunt","Hunt for encounters with pirate vessels near ".concat(flags.HUNT_REGION_STORAGE||getPlanetName(),".")),window.tnRooFlyButton&&window.tnRooFlyButton(5),addButton(14,"Back",@@HT@@)}

Replace [content_follower.js]:
"You can’t bring yourself to kick Anno off your ship here. Head back to a mainline planet or station first."),addButton(14,"Back",mainGameMenu)}
With:
"You can’t bring yourself to kick Anno off your ship here. Head back to a mainline planet or station first."),window.tnRooAnnoButton&&window.tnRooAnnoButton(11),addButton(14,"Back",mainGameMenu)}
