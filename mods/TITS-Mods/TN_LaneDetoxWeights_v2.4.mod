# LaneDetoxWeights - KittyPatcher mod
# Changes who on your crew starts Lane's detox intervention.
# The base game picks any eligible crew member with equal odds.
# This mod uses weighted odds instead:
#   Anno   = 3
#   Shekka = 3
#   Reaha  = 2  (she still has to be cured, same as the base game)
#   Everyone else = 1
# Toggle in Options -> Android Mods. When off, the game's original random pick is used.
# Target: content_tarkus.832654a9.js (window.tryFollowerLaneIntervention)

Rep [content_tarkus.js]:
var o=e[rand(e.length)];return getEventQueue().addEvent(Nt._.FollowerLaneInterventionEvent,o),!0
W:
var o=typeof window.tnLaneDetoxPick==="function"?window.tnLaneDetoxPick(e):e[rand(e.length)];return getEventQueue().addEvent(Nt._.FollowerLaneInterventionEvent,o),!0

Add Javascript:
(function(){
  "use strict";
  if(window.__tnLaneDetoxWeightsRegistered) return;
  window.__tnLaneDetoxWeightsRegistered=true;

  var MOD_ID="tn.lanedetoxweights";

  // Edit these numbers to change the odds. Anyone not listed uses DEFAULT_WEIGHT.
  var WEIGHTS={ ANNO:3, SHEKKA:3, REAHA:2 };
  var DEFAULT_WEIGHT=1;

  function modOn(){
    try{
      return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID);
    }catch(err){ return true; }
  }

  function weightOf(id){
    return Object.prototype.hasOwnProperty.call(WEIGHTS,id) ? WEIGHTS[id] : DEFAULT_WEIGHT;
  }

  // Receives the list of eligible crew IDs (already filtered by the game).
  window.tnLaneDetoxPick=function(list){
    if(!list || !list.length) return undefined;
    if(!modOn()) return list[Math.floor(Math.random()*list.length)];
    var total=0, i;
    for(i=0;i<list.length;i++) total+=weightOf(list[i]);
    var roll=Math.random()*total;
    for(i=0;i<list.length;i++){
      roll-=weightOf(list[i]);
      if(roll<0) return list[i];
    }
    return list[list.length-1];
  };
  window.tnLaneDetoxWeights=WEIGHTS;

  function register(tries){
    if((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")){
      if((tries||0)<120) setTimeout(function(){ register((tries||0)+1); },500);
      return;
    }
    window.registerModMenu({
      id:MOD_ID,
      name:"Lane Detox Weights",
      author:"Nova (KittyPatcher custom mod)",
      description:"Changes who starts Lane's detox intervention. Odds: Anno 3, Shekka 3, Reaha 2 (if cured), everyone else 1. Off = the game's equal-odds pick. Only affects interventions that haven't happened yet.",
      supportsToggle:true,
      defaultEnabled:true
    });
  }
  register(0);
})();
