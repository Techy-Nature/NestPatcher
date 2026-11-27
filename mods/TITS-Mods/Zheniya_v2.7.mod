Name: Zheniya
Author: Kitty
# Zheniya stands in the hall north of Anon's bar without Fools Rush In. Recruit hides that spot.
# Updated for TiTS 0.9.168 (2026-11-01): visit bS, menu vS, available check uS, leave ES, next function IS
#   (0.9.167 had wS, kS, rS, BS, vS). Needs Zheniya.js.
# Modv3.1: the names are @@wildcards@@ now, so it works on 0.9.168 and 0.9.169.

Replace [content_tavros.js]:
window.zilCallGirlAddendum=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;@@zhenAvailable@@()&&flags.SAENDRA_XPACK1_STATUS>=8&&(
With:
window.zilCallGirlAddendum=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;@@zhenAvailable@@()&&1!==flags.TN_ZHENIYA_CREW&&(

Rep [content_tavros.js]:
# Modv3.1: shares the visit scene and the menu as window.tnZheniyaVisit / window.tnZheniyaMenu when Tavros loads.
function @@zhenVisit@@(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(clearOutput(),@@zhenBust@@(),author("Savin"),e){if(zilCallGirlPregnant()
W:
window.tnZheniyaVisit=@@zhenVisit@@;function @@zhenVisit@@(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(clearOutput(),@@zhenBust@@(),author("Savin"),e){if(zilCallGirlPregnant()

Rep [content_tavros.js]:
function @@zhenMenu@@(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];clearMenu(),2!==flags.ZIL_CALLGIRL_PREGNANCY_MONEY?
W:
window.tnZheniyaMenu=@@zhenMenu@@;function @@zhenMenu@@(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];clearMenu(),2!==flags.ZIL_CALLGIRL_PREGNANCY_MONEY?

Replace [content_tavros.js]:
flags.SAENDRA_XPACK1_STATUS>=8&&window.zilCallgirlAvailable()
With:
1!==flags.TN_ZHENIYA_CREW&&window.zilCallgirlAvailable()

Replace [content_tavros.js]:
One of the rooms is familiar to you and most likely houses the call girl Saendra mentioned.
With:
One of the rooms up here belongs to a call girl.

Replace [content_tavros.js]:
You head over to the door Saendra had pointed out earlier: the call girl’s place of business
With:
You head over to the call girl’s door

Replace [content_tavros.js]:
addButton(14,"Never Mind",(function(){return @@zhenRent@@(!1,e)}),"Never Mind","Maybe this was a bad idea.")}function @@zhenNext@@()
With:
window.tnZheniyaRecruitButton&&window.tnZheniyaRecruitButton(),addButton(14,"Never Mind",(function(){return @@zhenRent@@(!1,e)}),"Never Mind","Maybe this was a bad idea.")}function @@zhenNext@@()
