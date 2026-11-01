Name: Shelly cabin returns
Author: Kitty
# Updated for TiTS 0.9.168 (2026-11-01): the egg reward is function _b (followed by zb).
#   It was Cb (followed by _b) in 0.9.166 and 0.9.167.


Replace [content_tavros.js]:
function _b(){var e=[];
With:
function _b(){var tnReturn=arguments.length>1&&typeof arguments[1]==="function"?arguments[1]:mainGameMenu,e=[];

Replace [content_tavros.js]:
itemCollect(mainGameMenu,[e[rand(e.length)]]):(clearMenu(),addButton(0,"Next",mainGameMenu))}function zb
With:
itemCollect(tnReturn,[e[rand(e.length)]]):(clearMenu(),addButton(0,"Next",tnReturn))}function zb

Replace [content_tavros.js]:
window.oviliumEggReward()}function a(){
With:
window.oviliumEggReward(!1,1===flags.TN_SHELLY_CREW&&typeof window.tnShellyCabin==="function"?window.tnShellyCabin:mainGameMenu)}function a(){

Replace [content_tavros.js]:
flags.KNOW_SHELLYS_NAME=1,processTime(30),clearMenu(),addButton(0,"Next",mainGameMenu)}function n()
With:
flags.KNOW_SHELLYS_NAME=1,processTime(30),clearMenu(),addButton(0,"Next",1===flags.TN_SHELLY_CREW&&typeof window.tnShellyCabin==="function"?window.tnShellyCabin:mainGameMenu)}function n()

Replace [content_tavros.js]:
void 0!==flags.CAME_INSIDE_SHELLY&&(flags.CAME_INSIDE_SHELLY=void 0,pc.clearRut()),processTime(5),clearMenu(),addButton(0,"Next",mainGameMenu)}function l()
With:
void 0!==flags.CAME_INSIDE_SHELLY&&(flags.CAME_INSIDE_SHELLY=void 0,pc.clearRut()),processTime(5),clearMenu(),addButton(0,"Next",1===flags.TN_SHELLY_CREW&&typeof window.tnShellyCabin==="function"?window.tnShellyCabin:mainGameMenu)}function l()

Replace [content_tavros.js]:
pc.createStatusEffect("Shelly Assist Cooldown",0,0,0,0,!0,"","",!1,30+rand(16)),restHeal()),clearMenu(),void addButton(0,"Next",mainGameMenu))}function d()
With:
pc.createStatusEffect("Shelly Assist Cooldown",0,0,0,0,!0,"","",!1,30+rand(16)),restHeal()),clearMenu(),void addButton(0,"Next",1===flags.TN_SHELLY_CREW&&typeof window.tnShellyCabin==="function"?window.tnShellyCabin:mainGameMenu))}function d()

Replace [content_tavros.js]:
processTime(3),clearMenu(),addButton(0,"Next",mainGameMenu)}function y()
With:
processTime(3),clearMenu(),addButton(0,"Next",1===flags.TN_SHELLY_CREW&&typeof window.tnShellyCabin==="function"?window.tnShellyCabin:mainGameMenu)}function y()

Replace [content_tavros.js]:
pc.orgasm(),clearMenu(),addButton(0,"Next",mainGameMenu)):(output("\n\nYour [pc.cockNounSimple
With:
pc.orgasm(),clearMenu(),addButton(0,"Next",1===flags.TN_SHELLY_CREW&&typeof window.tnShellyCabin==="function"?window.tnShellyCabin:mainGameMenu)):(output("\n\nYour [pc.cockNounSimple

