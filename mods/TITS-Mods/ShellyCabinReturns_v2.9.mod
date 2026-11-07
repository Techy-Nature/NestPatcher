Name: Shelly cabin returns
Author: Kitty
# v2.9 (2026-11-07, Modv2.9): when Shelly is on your crew, her Assist (egg-laying) scene
#   happens on her bunk aboard your ship instead of a back room at Anon's bar. The bar
#   version is unchanged. Crew version also has taur and naga lines for kneeling by the bunk.
# Updated for TiTS 0.9.168 (2026-11-02, Modv2.8): the egg reward is function _b (followed by zb).
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

Replace [content_tavros.js]:
output("You tell Shelly if she wants some assistance with her egg laying, you’re available now. She nods, grinning and gripping your hand tightly as she pulls you to one of the back rooms. The room is well lit and surprisingly comfortable-looking for what you would expect from a bar like this.")
With:
output((window.tnShellyCrewAssist||function(n,t){return t})(0,"You tell Shelly if she wants some assistance with her egg laying, you’re available now. She nods, grinning and gripping your hand tightly as she pulls you to one of the back rooms. The room is well lit and surprisingly comfortable-looking for what you would expect from a bar like this."))

Replace [content_tavros.js]:
output("\n\n<i>“The company gave me this room in case I needed to use it for emergencies. They refurbished it to be a little more inviting than it originally was,”</i> she says as she continues in and stands by the bed. <i>“Okay, so all you need to do is stimulate me... down there.”</i>")
With:
output((window.tnShellyCrewAssist||function(n,t){return t})(1,"\n\n<i>“The company gave me this room in case I needed to use it for emergencies. They refurbished it to be a little more inviting than it originally was,”</i> she says as she continues in and stands by the bed. <i>“Okay, so all you need to do is stimulate me... down there.”</i>"))

Replace [content_tavros.js]:
output("\n\nA blush begins running up her ears, but you tell her not to worry; you’ll have the excess eggs out of her in no time. This calms her down a bit, and she sits on the edge of the bed, reaching behind her back to undo her bra. You take that time to kneel at the foot of the bed next to her, unbuttoning the fastener on her shorts and pulling them down to reveal a pair of gray lace underwear. Not exactly the sexiest you’ve ever seen, but by no means a mood dampener.")
With:
output((window.tnShellyCrewAssist||function(n,t){return t})(2,"\n\nA blush begins running up her ears, but you tell her not to worry; you’ll have the excess eggs out of her in no time. This calms her down a bit, and she sits on the edge of the bed, reaching behind her back to undo her bra. You take that time to kneel at the foot of the bed next to her, unbuttoning the fastener on her shorts and pulling them down to reveal a pair of gray lace underwear. Not exactly the sexiest you’ve ever seen, but by no means a mood dampener."))

Replace [content_tavros.js]:
output("\n\nYou tell her you’d be happy to take one and give her another kiss for good measure. She laughs warmly and tells you she’ll lie here for a half hour or so to recover before she goes back to her job.")
With:
output((window.tnShellyCrewAssist||function(n,t){return t})(12,"\n\nYou tell her you’d be happy to take one and give her another kiss for good measure. She laughs warmly and tells you she’ll lie here for a half hour or so to recover before she goes back to her job."))

Replace [content_tavros.js]:
output("\n\nYou tell her you’ll be sure to come back to help again some time, and leave with one of the smaller eggs in your hand.")
With:
output((window.tnShellyCrewAssist||function(n,t){return t})(13,"\n\nYou tell her you’ll be sure to come back to help again some time, and leave with one of the smaller eggs in your hand."))

Add Javascript:
(function(){
  "use strict";
  // Crew-only text for Shelly's Assist scene (content_tavros.js, author Gardeford).
  // Paragraph numbers match the Replace blocks above. Anything not listed keeps the bar text.
  function onCrew(){ try { return typeof flags!=="undefined" && flags.TN_SHELLY_CREW===1; } catch(e){ return false; } }
  function body(){
    try { if (pc.isTaur && pc.isTaur()) return "taur"; } catch(e){}
    try { if (pc.isNaga && pc.isNaga()) return "naga"; } catch(e){}
    return "biped";
  }
  var CREW={
    0:function(){ return "You tell Shelly if she wants some assistance with her egg laying, you’re available now. She nods, grinning and gripping your hand tightly as she pulls you over to her bunk. Her quarters are small but cozy, smelling faintly of candy, and the bunk is made up with a soft pastel blanket and far more pillows than any one bunny could need."; },
    1:function(){ return "\n\n<i>“I made sure my bunk would be comfy for this when I moved aboard. Way nicer than that old back room at the bar,”</i> she says, patting the mattress as she stands beside it. <i>“Okay, so all you need to do is stimulate me... down there.”</i>"; },
    2:function(){
      var kneel;
      switch(body()){
        case "taur": kneel="You take that time to fold your legs beneath your tauric body at the foot of the bunk, settling in next to her as best your size allows in the cramped cabin, and unbutton the fastener on her shorts, pulling them down to reveal a pair of gray lace underwear."; break;
        case "naga": kneel="You take that time to sink down onto your coils at the foot of the bunk, your long tail looping across the cabin floor beside her, and unbutton the fastener on her shorts, pulling them down to reveal a pair of gray lace underwear."; break;
        default: kneel="You take that time to kneel at the foot of the bunk next to her, unbuttoning the fastener on her shorts and pulling them down to reveal a pair of gray lace underwear.";
      }
      return "\n\nA blush begins running up her ears, but you tell her not to worry; you’ll have the excess eggs out of her in no time. This calms her down a bit, and she sits on the edge of the bunk, reaching behind her back to undo her bra. "+kneel+" Not exactly the sexiest you’ve ever seen, but by no means a mood dampener.";
    },
    12:function(){ return "\n\nYou tell her you’d be happy to take one and give her another kiss for good measure. She laughs warmly and tells you she’ll curl up here for a half hour or so to recover before she gets back to her day."; },
    13:function(){ return "\n\nYou tell her you’ll be sure to help again some time and pick up one of the smaller eggs, leaving her to snuggle into her nest of pillows."; }
  };
  window.tnShellyCrewAssist=function(n,text){
    if(!onCrew() || !CREW[n]) return text;
    try { return CREW[n](); } catch(e){ console.error("[Shelly crew assist]", e); return text; }
  };
})();
