Name: Zheniya
Author: Kitty
# Zheniya stands in the hall north of Anon's bar without Fools Rush In. Recruit hides that spot.

Replace [content_tavros.js]:
window.zilCallGirlAddendum=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;rS()&&flags.SAENDRA_XPACK1_STATUS>=8&&(
With:
window.zilCallGirlAddendum=function(){window.tnZheniyaVisit=wS,window.tnZheniyaMenu=kS;var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;rS()&&1!==flags.TN_ZHENIYA_CREW&&(

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
addButton(14,"Never Mind",(function(){return BS(!1,e)}),"Never Mind","Maybe this was a bad idea.")}function vS()
With:
window.tnZheniyaRecruitButton&&window.tnZheniyaRecruitButton(),addButton(14,"Never Mind",(function(){return BS(!1,e)}),"Never Mind","Maybe this was a bad idea.")}function vS()
