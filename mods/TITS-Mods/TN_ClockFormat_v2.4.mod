# TN_ClockFormat - KittyPatcher mod (TiTS 0.9.167)
# Switch the in-game clock between 24-hour (15:05) and 12-hour AM/PM (3:05 PM).
# Pick the format in Options -> Android Mods -> Clock Format.
# It uses the game's own "12-Hour Time Format" option, so the choice is saved with your
# game settings and the switch in the game's Options screen stays in sync.
# Covers: sidebar clock, calendar, Stats "Current Time", save slot times,
# event log timestamps, and codex/email dates.
# Also fixes a base-game bug where noon showed as "12 AM" in 12-hour mode.
# Story text that writes times into the prose (like "18:00") is not changed.
# Target: main.d3448d52.js

Rep [main.js]:
u?(0===e?(e=12,s=!0):e>12?(e-=12,s=!1):s=!0,r=
W:
u?(0===e?(e=12,s=!0):e>=12?(e>12&&(e-=12),s=!1):s=!0,r=

Rep [main.js]:
window.timeAsText=function(e,t){return Z(0,e,t)}
W:
window.timeAsText=function(e,t){return"function"==typeof window.tnClockText?window.tnClockText(e,t):Z(0,e,t)}

Rep [main.js]:
return t?(o+="Day "+s+", ",o+=a<10?"0".concat(a):"".concat(a),o+=":",o+=e<10?"0".concat(e):e):
W:
return t?(o+="Day "+s+", ",o+="function"==typeof window.tnClockText?window.tnClockText(a,e):(a<10?"0".concat(a):"".concat(a))+":"+(e<10?"0".concat(e):e)):

Rep [main.js]:
.concat(r," T: ").concat(u<10?"0".concat(u):u,":").concat(l<10?"0".concat(l):l,
W:
.concat(r," T: ").concat("function"==typeof window.tnClockText?window.tnClockText(u,l):(u<10?"0".concat(u):u)+":"+(l<10?"0".concat(l):l),

Add Javascript:
(function(){
  "use strict";
  if(window.__tnClockFormatRegistered) return;
  window.__tnClockFormatRegistered=true;

  var MOD_ID="tn.clockformat";

  function options(){
    try{ return window.game && window.game.gameOptions ? window.game.gameOptions : null; }
    catch(err){ return null; }
  }

  function use12(){
    var o=options();
    return !!(o && o.formatTimeToAM);
  }

  function pad(n){ return n<10 ? "0"+n : String(n); }

  // Plain-text time for one hour/minute pair, in whichever format is chosen.
  window.tnClockText=function(hours,minutes){
    var h=Math.floor(Number(hours))||0;
    var m=Math.floor(Number(minutes))||0;
    if(!use12()) return pad(h)+":"+pad(m);
    var pm=h>=12;
    var h12=h%12;
    if(h12===0) h12=12;
    return h12+":"+pad(m)+(pm?" PM":" AM");
  };

  function setFormat(want12){
    var o=options();
    if(!o) return false;
    o.formatTimeToAM=!!want12;
    try{ if(typeof o.SaveChanges==="function") o.SaveChanges(); }
    catch(err){ console.warn("[TN] Clock format could not be saved",err); }
    return true;
  }

  function nowText(){
    try{
      var gs=window.game && window.game.gamestate;
      if(gs && typeof gs.hours==="number") return window.tnClockText(gs.hours,gs.minutes);
    }catch(err){}
    return "";
  }

  function register(){
    if((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return false;
    window.registerModMenu({
      id:MOD_ID,
      name:"Clock Format",
      author:"Kitty",
      description:"Switch the clock between 24-hour and 12-hour AM/PM.",
      getHtml:function(){
        var html="Choose how the game shows the time. This changes the sidebar clock, the calendar, the Stats page, save slot times, event log timestamps and codex/email dates. Times written into story text stay as they are.";
        html+="\n\nThis is the same setting as <b>Options → 12-Hour Time Format</b>, so either place works.";
        if(!options()){
          html+="\n\n<b>The game settings have not loaded yet. Try again in a moment.</b>";
          return html;
        }
        html+="\n\nCurrent format: <b>"+(use12()?"12-hour (AM/PM)":"24-hour")+"</b>";
        var t=nowText();
        if(t) html+="\nIt is now: <b>"+t+"</b>";
        html+='<button type="button" data-mod-act="12">12-hour AM/PM</button>';
        html+='<button type="button" data-mod-act="24">24-hour</button>';
        return html;
      },
      onAct:function(act){
        if(act==="12") return setFormat(true);
        if(act==="24") return setFormat(false);
        return false;
      }
    });
    return true;
  }

  // Runtime scripts may load in any order, so retry until the menu exists.
  var tries=0;
  (function wait(){
    if(register()) return;
    if(++tries<180) setTimeout(wait,1000);
  })();
})();
