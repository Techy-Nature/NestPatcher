Name: Shelly crew
Author: Kitty
# Shelly at Anon's bar can join the ship. Her talk, assist, and sex scenes change with Neston's mod.

Replace [content_tavros.js]:
window.ShellyBlurb=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:5;pc.hasStatusEffect("Shelly Assist Cooldown")||(
With:
window.tnShellyOpen=t,window.tnShellyTalk=o,window.tnShellySex=a,window.tnShellyAssist=n,window.ShellyBlurb=function(){if(1===flags.TN_SHELLY_CREW)return;var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:5;pc.hasStatusEffect("Shelly Assist Cooldown")||(

Replace [content_tavros.js]:
),addButton(14,"Leave",mainGameMenu)}function o(){clearOutput(),e(),author("Gardeford"),flags.TALKED_TO_SHELLY=1
With:
),window.tnShellyRecruitButton&&window.tnShellyRecruitButton(),addButton(14,"Leave",mainGameMenu)}function o(){clearOutput(),e(),author("Gardeford"),flags.TALKED_TO_SHELLY=1
