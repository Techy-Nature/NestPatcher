Name: Holo-Lock Chastity
Author: Kitty
# TN_HoloChastity - NestPatcher mod (TiTS 0.9.167), v2.6
# Needs NestPatcher 1.4 / Android 1.3 or newer: @@name@@ stands for a minified function name,
# which is different in the PC and Android builds.
# Two locking lower undergarments sold by Aliss at Mi Amour on Tavros:
#   - Holo-Lock Chastity Belt (female). Locked, it gives the game's own Vaginal Chastity
#     effect, the same flag the engine checks for chastity underwear (pc.isChastityBlocked).
#     An optional rear shield adds Anal Chastity too.
#   - Holo-Lock Chastity Cage (male). The engine has no penis-chastity flag, so this mod
#     mirrors the vaginal one for cocks. While it's locked:
#       * penisRouter (the game's "which cock do you use?" picker) marks every caged cock
#         "LOCKED IN CHASTITY", the same way it marks a chastity-blocked pussy "HOLE BLOCKED".
#       * cockThatFits / cockThatFits2 find no cock, so scenes gated on "a cock that fits"
#         are greyed out like they are for someone without one.
#       * A scene checker greys out any remaining scene button that uses your cock (its
#         tooltip talks about your cock, or the scene goes through penisRouter). It never
#         greys out the last open button, so you can't get stuck mid-scene.
#       * Cock options leave the Masturbate menu.
#     Tail cocks and cockvines aren't caged: their scenes stay open. With the "tail cock
#     stands in" setting on (default), a tail cock or cockvine also keeps the generic
#     "your cock" scenes open.
# Both:
#   - Locked = can't be taken off or swapped out (the game's own "no remove" flag).
#   - Lock methods: a digital key in your Codex with a 4-8 digit PIN, a physical key in
#     Key Items, or both (then either one unlocks it). Set them up from Inventory -> the
#     worn device -> Interact.
#   - Holopaint: recolor at will from the same Interact menu (the game's own color picker).
#   - Forgot the PIN or lost the key? Aliss can release it for free if you visit Mi Amour.
#   - Emergency release: Options -> Android Mods -> "Holo-Lock Chastity".
# Toggle off = not stocked and the masturbation lock stops; worn devices stay as they are
# (use the emergency release first if you want them off).
# Four patches on main.js (Masturbate menu list, penis sorter, penis router, cocksThatFit). Uses the 0.9.167 module IDs 95164 (item
# base), 54014 (registry), 18366 (tooltips), 69289 (text utils).
# In-game author: Techy-Nest.

Rep [main.js]:
function @@fapList@@(){var e,t=arguments.length>0&&void 0!==arguments[0]&&arguments[0],o=arguments.length>1&&void 0!==arguments[1]&&arguments[1],a={simple:[],crew:[],toys:[],installed:[]};
W:
function @@fapList@@(){var tnR=tnFapsOrig.apply(this,arguments);try{"function"==typeof window.tnChastityFilterFaps&&(tnR=window.tnChastityFilterFaps(tnR))}catch(tnE){console.warn("[TN] chastity fap filter",tnE)}return tnR}function tnFapsOrig(){var e,t=arguments.length>0&&void 0!==arguments[0]&&arguments[0],o=arguments.length>1&&void 0!==arguments[1]&&arguments[1],a={simple:[],crew:[],toys:[],installed:[]};

Rep [main.js]:
O.length>0?(B.push(O),N.push(R)):I.push(R)}return{choices:I,ineligibles:N,reasons:B}
W:
x===pc&&"function"==typeof window.tnChastityCockLocked&&window.tnChastityCockLocked()&&O.push("LOCKED IN CHASTITY"),O.length>0?(B.push(O),N.push(R)):I.push(R)}return{choices:I,ineligibles:N,reasons:B}

Rep [main.js]:
var u=@@penisSort@@(arguments[0]),l=u.choices,h=u.ineligibles,c=u.reasons,d=[0];
W:
var u=@@penisSort@@(arguments[0]),l=u.choices,h=u.ineligibles,c=u.reasons,d=[0];if(0===l.length&&r===pc&&"function"==typeof window.tnChastityRouterBlock&&window.tnChastityRouterBlock())return;

Rep [main.js]:
key:"cocksThatFit",value:function(){for(var e=this,
W:
key:"cocksThatFit",value:function(){if(this===window.pc&&"function"==typeof window.tnChastityCockLocked&&window.tnChastityCockLocked())return[];for(var e=this,

Add Javascript:
(function(){
  "use strict";
  if(window.__tnHoloChastityRegistered) return;
  window.__tnHoloChastityRegistered=true;

  var MOD_ID="tn.holochastity";
  var SHOPKEEPER_CLASS="Aliss";
  var SHOP_ROOM="MI AMOUR";
  var BELT_CLASS="TnHoloChastityBelt";
  var CAGE_CLASS="TnHoloChastityCage";
  var BELT_PRICE=3500;
  var CAGE_PRICE=3500;
  var BELT_KEY="Holo-Belt Key";
  var CAGE_KEY="Holo-Cage Key";

  // Masturbate menu options that need your cock (blocked by a locked cage) or your
  // vagina (blocked by a locked belt). Matched on the button text the game gives them.
  var COCK_FAPS=["Penis","Autofellatio","Penises","HoverHole","Penis Feed","TailFuck","GooSleeve",
    "F.Laquine","Panty Fap","NivasB.Hole","NivasTutorial","Tamani B.H.","Mitzi B.H.","SyriB.Hole",
    "Tamani Tut.","BubbleBuddy","Taur-Milker"];
  var VAG_FAPS=["Vaginal","Vaginal Feed","PantySchlick","SukMastr","Gem Vag","M.Laquine"];

  function modOn(){
    try{
      return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID);
    }catch(err){ return true; }
  }
  function G(){ return window.GLOBAL; }
  function P(t){ return typeof ParseText==="function"?ParseText(t):t; }
  function worn(){
    try{ return window.pc && window.pc.inventory ? window.pc.inventory.lowerUndergarment : null; }
    catch(err){ return null; }
  }
  function isOurs(it){
    try{ var c=it && it.getClassName && it.getClassName(); return c===BELT_CLASS || c===CAGE_CLASS; }
    catch(err){ return false; }
  }
  function wornLocked(){
    var it=worn();
    return isOurs(it) && it.tnLocked ? it : null;
  }
  function atAliss(){
    try{ return typeof getCurrentLocation==="function" && getCurrentLocation()===SHOP_ROOM; }
    catch(err){ return false; }
  }
  function colorName(it){
    var c="";
    try{ c=it.coloration(); }catch(err){}
    return c ? c : "factory chrome";
  }
  function safeRemoveInput(){ try{ removeInput(); }catch(err){} }

  // ---- Locked state -> game flags. Called whenever the lock or the shield changes, and on
  // load (the flags are saved with the item anyway, this just keeps them in step).
  function applyFlags(it){
    var g=G();
    var want={};
    want[g.ITEM_FLAG_NO_REMOVE]=!!it.tnLocked;
    want[g.ITEM_FLAG_VAGINAL_CHASTITY]=!!it.tnLocked && it.tnKind==="belt";
    want[g.ITEM_FLAG_ANAL_CHASTITY]=!!it.tnLocked && it.tnKind==="belt" && !!it.tnShield;
    Object.keys(want).forEach(function(k){
      var f=Number(k);
      if(want[k]){ if(!it.hasFlag(f)) it.itemFlags.push(f); }
      else{ while(it.hasFlag(f)) it.deleteFlag(f); }
    });
  }

  // ---- Masturbate menu filter (hooked into the game's availableFaps list by the patch).
  window.tnChastityFilterFaps=function(lists){
    if(!lists || !modOn()) return lists;
    var it=wornLocked();
    if(!it) return lists;
    var block=it.tnKind==="cage"?COCK_FAPS:VAG_FAPS;
    ["simple","crew","toys","installed"].forEach(function(k){
      if(Array.isArray(lists[k])) lists[k]=lists[k].filter(function(f){ return !(f && block.indexOf(f.text)>=0); });
    });
    return lists;
  };
  // ---- Cock chastity: the engine side (called from the main.js patches).
  // True while a locked cage is on a Steele who has a cock. Tail cocks don't count.
  window.tnChastityCockLocked=function(){
    try{
      if(!modOn()) return false;
      var it=wornLocked();
      return !!(it && it.tnKind==="cage" && pc.hasCock());
    }catch(err){ return false; }
  };
  // penisRouter found no usable cock (all caged, no strap-on): say so instead of running
  // the scene with no cock.
  window.tnChastityRouterBlock=function(){
    if(!window.tnChastityCockLocked()) return false;
    clearOutput(); clearMenu();
    output(P("You reach for your [pc.cocksLight], and your fingers meet the smooth, unyielding shell of your Holo-Lock cage instead. <b>Your "+(pc.cockTotal()>1?"cocks are":"cock is")+" locked away</b>, so that’s not happening right now."));
    addButton(0,"Next",function(){ mainGameMenu(); });
    return true;
  };

  // ---- Cock chastity: the scene checker. Looks at every button on screen while the cage
  // is locked and greys out the ones that would use your cock.
  var STAND_IN_KEY="tn.holochastity.tailStandIn";
  function standIn(){
    try{ return window.localStorage.getItem(STAND_IN_KEY)!=="false"; }catch(err){ return true; }
  }
  function setStandIn(v){
    try{ window.localStorage.setItem(STAND_IN_KEY,v?"true":"false"); }catch(err){}
  }
  function hasTailCockOrVine(){
    try{
      if(pc.hasTailCock()) return true;
      var g=G();
      return g.TYPE_COCKVINE!==undefined && pc.wingType===g.TYPE_COCKVINE && pc.wingCount>0;
    }catch(err){ return false; }
  }
  function strapOnReady(){
    try{ return pc.hasHardLightEquipped() || (typeof pc.hasHardLightStrapAvailable==="function" && pc.hasHardLightStrapAvailable()); }
    catch(err){ return false; }
  }

  // Never greyed out: moving on from a scene must always work.
  var NAV=/^(next|back|leave|finish|continue|done|ok|okay|cancel|nevermind|never mind|sleep|wait|rest|return|exit|go back|stop|no|nope|decline|refuse|walk away|appearance|talk|step back|pass|no thanks|not now|turn away|skip)$/i;
  // Things that sound like a cock but aren't the caged one.
  var NOT_CAGED=/tail[\s-]?cocks?|cock[\s-]?tails?|cock[\s-]?vines?|tail[\s-]?dicks?|dick[\s-]?tails?|tail[\s-]?(prick|penis)|nipple[\s-]?(cocks?|dicks?)|(cocks?|dicks?)[\s-]?nipples?|tentacle[\s-]?(cocks?|dicks?)|cock[\s-]?socks?|cock[\s-]?rings?|cockOrStrapon|strap[\s-]?on|hard[\s-]?light/ig;
  var TAIL_SCENE=/\[pc\.tail(Cock|cock|Dick)|tailCock|tailcock|tail cock|tail-cock|cockvine|cock-vine|COCKVINE|dicktail|dick-tail/;
  // [pc.cock], [pc.cocksLight 0], [pc.knot]... the parser tags for the player's own cock.
  var PC_TAG=/\[pc\.(cocks?|dicks?|cockNoun|cocksNoun|cockNounSimple|cockHead|cockHeads|eachCock|oneCock|cocksLight|cockLight|cockBiggest|cockSmallest|biggestCock|smallestCock|cockColor|cocksDescript|cockDescript|cocksDescriptLight|cockDescriptLight|knot|knots|sheath|cockShape|cockType|cocksIsAre|cockIsAre|multiCocks)\b[^\]]*\]/;
  var YOUR_COCK=/\byour\s+(?:own\s+)?(?:(?!(?:her|his|their|its|them|him|in|into|on|with|and|or|to|the)\b)[\w’'-]+\s+){0,3}?(cocks?|dicks?|penis(?:es)?|dongs?|pricks?|manhood|erections?|boners?|members?|shafts?|cockheads?|knots?|rods?|wangs?|peckers?|willy)\b/i;
  var NEEDS_COCK=/\b(requires?|needs?)\s+(?:a\s+|an\s+|your\s+)?(?:[\w-]+\s+)?(cock|penis|dick)\b/i;
  var BRANCHES=/hasCock\(|hasVagina\(|hasGenitals\(|cockTotal\(|isHerm\(|hasTailCock\(|isMale\(|isFemale\(|vaginaTotal\(|hasCocks\(/;
  function usesPcCock(text){
    if(!text) return false;
    var t=String(text).replace(NOT_CAGED," NOTCAGED ");
    return PC_TAG.test(t) || YOUR_COCK.test(t) || NEEDS_COCK.test(t);
  }
  var srcCache=typeof WeakMap==="function"?new WeakMap():null;
  function srcInfo(fn){
    if(typeof fn!=="function") return {router:false,tail:false,cock:false};
    if(srcCache && srcCache.has(fn)) return srcCache.get(fn);
    var s="";
    try{ s=Function.prototype.toString.call(fn); }catch(err){}
    if(s.length>60000) s=s.slice(0,60000);
    var info={
      router:/penisRouter(Obj)?\(/.test(s),
      tail:TAIL_SCENE.test(s),
      // Only counts when the scene uses your cock without first checking what you have.
      cock:!BRANCHES.test(s) && usesPcCock(s)
    };
    if(srcCache) srcCache.set(fn,info);
    return info;
  }
  function shouldBlock(b){
    if(!b || b.disabled || typeof b.func!=="function") return false;
    var title=String(b.title||"").trim();
    if(NAV.test(title)) return false;
    var text=[b.title,b.ttH,b.ttB].join(" ");
    var src=srcInfo(b.func);
    var tail=hasTailCockOrVine();
    if(tail && (TAIL_SCENE.test(text) || /tail/i.test(title) || src.tail)) return false;
    if(src.router) return !strapOnReady();
    if(usesPcCock(text) || src.cock) return !(tail && standIn());
    return false;
  }
  function lockedTip(){
    return P("Your [pc.cocksLight] "+(pc.cockTotal()>1?"are":"is")+" locked in your Holo-Lock cage.");
  }
  function checkerActive(){
    if(!window.tnChastityCockLocked()) return false;
    try{ if(typeof inCombat==="function" && inCombat()) return false; }catch(err){}
    return true;
  }
  function scanButtons(uiObj){
    var st=uiObj && uiObj.state;
    if(!st || !Array.isArray(st.buttons)) return;
    var list=st.buttons;
    var origs=list.map(function(b){ return b && b.__tnOrig ? b.__tnOrig : b; });
    var out=origs;
    if(checkerActive()){
      var block=origs.map(function(b){ try{ return shouldBlock(b); }catch(err){ return false; } });
      var open=origs.filter(function(b,i){ return b && !b.disabled && typeof b.func==="function" && !block[i]; }).length;
      // Nothing else to press? Leave the menu alone rather than trap you mid-scene.
      if(open>0 && block.indexOf(true)>=0){
        var tip=lockedTip();
        out=origs.map(function(b,i){
          if(!block[i]) return b;
          return {idx:b.idx,title:b.title,func:function(){},ttH:b.ttH||b.title,ttB:tip,ttF:b.ttF,ttItem:b.ttItem,disabled:true,__tnOrig:b};
        });
      }
    }
    var same=out.length===list.length && out.every(function(b,i){ return b===list[i]; });
    if(!same) st.buttons=out;
  }
  function hookUI(tries){
    var u=window.ui;
    if(!u || typeof u.render!=="function" || !u.state){
      if(tries<240) setTimeout(function(){ hookUI(tries+1); },500);
      return;
    }
    if(u.render.__tnHolo) return;
    var orig=u.render;
    var wrapped=function(){
      try{ scanButtons(this); }catch(err){ console.warn("[TN] chastity scene checker",err); }
      return orig.apply(this,arguments);
    };
    wrapped.__tnHolo=true;
    u.render=wrapped;
  }
  hookUI(0);
  window.tnChastityShouldBlockButton=shouldBlock;   // for testing / other mods

  // For other mods: true while a Holo-Lock device is locked on the player.
  window.tnChastityCaged=function(){ var it=wornLocked(); return !!(it && it.tnKind==="cage"); };
  window.tnChastityBelted=function(){ var it=wornLocked(); return !!(it && it.tnKind==="belt"); };

  // ---- Interact menu
  function header(t){ return typeof blockHeader==="function"?blockHeader(t):"<b>"+t+"</b>\n\n"; }
  function methodsText(it){
    var m=[];
    if(it.tnPin) m.push("Codex digital key (PIN set)");
    if(it.tnUseKey) m.push("physical key ("+it.tnKeyName+")");
    return m.length?m.join(" and "):"none yet";
  }
  function deviceName(it){ return it.tnKind==="cage"?"cage":"belt"; }

  function mainMenu(it){
    safeRemoveInput();
    clearOutput(); clearMenu();
    showName("HOLO-LOCK\n"+(it.tnKind==="cage"?"CAGE":"BELT"));
    output(header("Holo-Lock "+(it.tnKind==="cage"?"Chastity Cage":"Chastity Belt")));
    output("Your Codex pairs with the "+deviceName(it)+"’s lock housing and pulls up its control panel.");
    output("\n\n<b>Status:</b> "+(it.tnLocked?"<b>Locked</b>":"Unlocked"));
    output("\n<b>Holopaint:</b> "+colorName(it));
    output("\n<b>Lock methods:</b> "+methodsText(it));
    if(it.tnKind==="belt") output("\n<b>Rear shield:</b> "+(it.tnShield?"on (also blocks anal)":"off"));
    if(it.tnLocked && it.tnUseKey && !pc.hasKeyItem(it.tnKeyName)) output("\n\n<i>You don’t have the "+it.tnKeyName+" on you.</i>");
    if(!modOn()) output("\n\n<i>(Holo-Lock Chastity is switched off in Options → Android Mods, so the lock no longer limits masturbation.)</i>");

    addButton(0,"Holopaint",function(){ paintMenu(it); },"Holopaint","Recolor the "+deviceName(it)+". Holopaint can change to any color, as often as you like.");

    if(it.tnLocked){
      addButton(1,"Unlock",function(){ unlockMenu(it); },"Unlock","Use your digital key or your physical key to open the lock.");
      addDisabledButton(2,"Set PIN","Set PIN","Unlock the "+deviceName(it)+" before changing its PIN.");
      addDisabledButton(3,"Phys. Key","Physical Key","Unlock the "+deviceName(it)+" before changing its key.");
      if(it.tnKind==="belt") addDisabledButton(4,"Rear Shield","Rear Shield","Unlock the belt before changing the shield.");
    }else{
      if(it.tnKind==="cage" && !pc.hasCock()) addDisabledButton(1,"Lock","Lock","The cage needs a cock to lock around.");
      else if(!it.tnPin && !it.tnUseKey) addDisabledButton(1,"Lock","Lock","Set a PIN or cut a physical key first, so you have some way to open it again.");
      else addButton(1,"Lock",function(){ doLock(it); },"Lock","Lock the "+deviceName(it)+" on. You won’t be able to take it off until you unlock it.");
      addButton(2,it.tnPin?"Change PIN":"Set PIN",function(){ pinSetMenu(it); },"Digital Key","Store a digital key in your Codex, opened with a 4-8 digit PIN.");
      if(it.tnUseKey) addButton(3,"Drop Key",function(){ keyOff(it); },"Retire Physical Key","Stop the lock from accepting the "+it.tnKeyName+".");
      else addButton(3,"Cut Key",function(){ keyOn(it); },"Physical Key","Have the lock housing print a physical key. It goes into your Key Items.");
      if(it.tnPin) addButton(5,"Clear PIN",function(){ pinClear(it); },"Clear PIN","Delete the digital key from your Codex.");
      if(it.tnKind==="belt") addButton(4,"Rear Shield",function(){ it.tnShield=!it.tnShield; mainMenu(it); },"Rear Shield",it.tnShield?"Retract the rear shield. Locked, the belt will only block your pussy.":"Extend a rear shield. Locked, the belt will block your ass too.");
    }
    if(it.tnLocked && atAliss()) addButton(6,"Ask Aliss",function(){ alissRelease(it); },"Ask Aliss","Forgot the PIN or lost the key? Aliss has a master override.");
    addButton(14,"Back",function(){ it.returnToInventory(it); },"Back","Go back to your inventory.");
  }

  function paintMenu(it){
    clearOutput(); clearMenu();
    output(header("Holopaint"));
    output("The "+deviceName(it)+"’s holopaint coat shimmers as your Codex wakes it up. Pick a palette, then a color.\n\n");
    it.colorOptionsDisplay(0,false,function(){ mainMenu(it); });
    addButton(14,"Back",function(){ mainMenu(it); },"Back","Keep the current color.");
  }

  function doLock(it){
    clearOutput(); clearMenu();
    it.tnLocked=true;
    applyFlags(it);
    if(it.tnKind==="cage") output("You settle the cage snugly around [pc.cocksLight] and press the lock home. It closes with a soft, final click, and the holopaint ripples once as the seal engages. <b>Your [pc.cocksLight] "+(pc.cockTotal()>1?"are":"is")+" locked away.</b>");
    else output("You fasten the belt around your hips and press the lock home. The shield seals over your [pc.vaginasLight] with a soft, final click"+(it.tnShield?", and the rear shield slides into place behind you":"")+". <b>You’re locked in.</b>");
    output("\n\nYou can open it with: "+methodsText(it)+".");
    addButton(0,"Next",function(){ mainMenu(it); });
  }

  function release(it,how){
    clearOutput(); clearMenu();
    it.tnLocked=false;
    applyFlags(it);
    output(how+" The lock releases with a quiet hiss. <b>The "+deviceName(it)+" is unlocked</b>, and you can take it off whenever you like.");
    addButton(0,"Next",function(){ mainMenu(it); });
  }

  function unlockMenu(it){
    clearOutput(); clearMenu();
    output(header("Unlock"));
    output("How do you want to open it?");
    var any=false;
    if(it.tnPin){ any=true; addButton(0,"Enter PIN",function(){ pinEntry(it,"unlock"); },"Digital Key","Type the PIN into your Codex."); }
    else addDisabledButton(0,"Enter PIN","Digital Key","No PIN has been set for this "+deviceName(it)+".");
    if(it.tnUseKey){
      if(pc.hasKeyItem(it.tnKeyName)){ any=true; addButton(1,"Use Key",function(){ release(it,"You fit the "+it.tnKeyName+" into the lock and give it a twist."); },"Physical Key","Unlock it with the "+it.tnKeyName+"."); }
      else addDisabledButton(1,"Use Key","Physical Key","You don’t have the "+it.tnKeyName+".");
    }else addDisabledButton(1,"Use Key","Physical Key","This "+deviceName(it)+" isn’t set up for a physical key.");
    if(!any) output("\n\n<b>You have no way to open it yourself right now.</b> Aliss can release it at Mi Amour, or use the emergency release in Options → Android Mods.");
    addButton(14,"Back",function(){ mainMenu(it); });
  }

  // mode: "unlock" (check against stored PIN), "set" (first entry), "confirm" (repeat)
  function pinEntry(it,mode,first,msg){
    clearOutput(); clearMenu();
    output(header(mode==="unlock"?"Enter PIN":"Set PIN"));
    if(msg) output(msg+"\n\n");
    if(mode==="unlock") output("Your Codex shows a keypad. Enter the PIN:");
    else if(mode==="set") output("Choose a PIN of 4 to 8 digits. Your Codex will hold the digital key; the PIN opens it.");
    else output("Enter the same PIN again to confirm:");
    displayInput();
    addButton(0,"Confirm",function(){
      var v=String(getInputText()||"").trim();
      safeRemoveInput();
      if(mode==="unlock"){
        if(v===it.tnPin) return release(it,"You tap in the PIN and your Codex chirps.");
        it.tnBadPins=(it.tnBadPins||0)+1;
        return pinEntry(it,"unlock",null,"<b>Wrong PIN.</b> The holopaint flashes red."+(it.tnBadPins>=3?" (Forgot it? Aliss can release it at Mi Amour, or use the emergency release in Options → Android Mods.)":""));
      }
      if(!/^\d{4,8}$/.test(v)) return pinEntry(it,mode,first,"<b>Please use 4 to 8 digits, numbers only.</b>");
      if(mode==="set") return pinEntry(it,"confirm",v);
      if(v!==first) return pinEntry(it,"set",null,"<b>Those didn’t match.</b> Let’s try again.");
      it.tnPin=v; it.tnBadPins=0;
      clearOutput(); clearMenu();
      output("Your Codex stores the new digital key. <b>PIN set.</b>");
      addButton(0,"Next",function(){ mainMenu(it); });
    });
    addButton(14,"Back",function(){ safeRemoveInput(); mode==="unlock"?unlockMenu(it):mainMenu(it); });
  }
  function pinSetMenu(it){ pinEntry(it,"set"); }
  function pinClear(it){
    it.tnPin="";
    clearOutput(); clearMenu();
    output("You delete the digital key from your Codex.");
    if(!it.tnUseKey) output(" With no key of any kind, the "+deviceName(it)+" can’t be locked until you set one up again.");
    addButton(0,"Next",function(){ mainMenu(it); });
  }
  function keyOn(it){
    it.tnUseKey=true;
    clearOutput(); clearMenu();
    if(!pc.hasKeyItem(it.tnKeyName)){
      pc.createKeyItem(it.tnKeyName,0,0,0,0,"A small, old-fashioned metal key printed by a Holo-Lock "+deviceName(it)+"’s lock housing. Every Holo-Lock "+deviceName(it)+" you own takes the same key.");
      output("A slot on the lock housing hums and pushes out a small, warm metal key. <b>You got the "+it.tnKeyName+"!</b> (Key Items)");
    }else output("You touch your "+it.tnKeyName+" to the lock and it learns the cut. <b>It now accepts your key.</b>");
    addButton(0,"Next",function(){ mainMenu(it); });
  }
  function keyOff(it){
    it.tnUseKey=false;
    clearOutput(); clearMenu();
    output("The lock forgets the key’s cut. ");
    var other=false;
    try{
      var all=[worn()].concat(pc.inventory.storage||[]);
      other=all.some(function(x){ return x && x!==it && isOurs(x) && x.tnKind===it.tnKind && x.tnUseKey; });
    }catch(err){}
    if(!other && pc.hasKeyItem(it.tnKeyName)){ pc.removeKeyItem(it.tnKeyName); output("You drop the now-useless "+it.tnKeyName+" into a recycler slot. <b>Removed from Key Items.</b>"); }
    else output("You keep the "+it.tnKeyName+", since another "+deviceName(it)+" of yours still uses it.");
    if(!it.tnPin) output("\n\nWith no key of any kind, the "+deviceName(it)+" can’t be locked until you set one up again.");
    addButton(0,"Next",function(){ mainMenu(it); });
  }
  function alissRelease(it){
    clearOutput(); clearMenu();
    try{ if(window.aliss){ aliss.showAll ? aliss.showAll() : showBust("ALISS"); showName("\nALISS"); } }catch(err){}
    output("You sheepishly explain your little problem to Aliss. She covers her mouth to hide a giggle, then fishes a slim override wand out from under the counter.");
    output("\n\n<i>“It happens more than you would think, </i>mi amour<i>. Hold still.”</i> She waves the wand over the lock housing, and it gives a polite chime.");
    if(it.tnUseKey && !pc.hasKeyItem(it.tnKeyName)){
      pc.createKeyItem(it.tnKeyName,0,0,0,0,"A small, old-fashioned metal key printed by a Holo-Lock "+deviceName(it)+"’s lock housing. Every Holo-Lock "+deviceName(it)+" you own takes the same key.");
      output(" <i>“And here, a fresh key. Try not to lose this one.”</i> <b>You got the "+it.tnKeyName+"!</b>");
    }
    it.tnPin=""; it.tnBadPins=0;
    it.tnLocked=false; applyFlags(it);
    output("\n\n<b>The "+deviceName(it)+" is unlocked and its PIN is cleared.</b> Set a new one whenever you like.");
    addButton(0,"Next",function(){ mainMenu(it); });
  }

  // ---- Items
  function defineItems(req){
    var Base=req(95164).Jo, registry=req(54014).yq, names=req(18366).g, text=req(69289).m;
    var g=window.GLOBAL;

    function setup(it,kind){
      it.stackSize=1;
      it.type=g.LOWER_UNDERGARMENT;
      it.tnKind=kind;
      it.tnLocked=false;
      it.tnPin="";
      it.tnBadPins=0;
      it.tnUseKey=false;
      it.tnShield=false;
      it.tnKeyName=kind==="cage"?CAGE_KEY:BELT_KEY;
      it.attack=0; it.defense=0; it.shieldDefense=0; it.shields=0;
      it.sexiness=2; it.resolve=1; it.critBonus=0; it.evasion=0; it.fortification=0;
      it.isUsable=false;
      it.chameleon=true;
      it.hasDynamicProperties=true;
      it._isInteractable=true;
    }
    var shared={
      interactAvailable:function(){
        if(typeof inCombat==="function" && inCombat()) return {enabled:false,title:"Interact",tooltip:"You can’t fiddle with the lock in the middle of a fight."};
        if(!this.isEquippedOn(pc)) return {enabled:false,title:"Interact",tooltip:"Wear it first. The lock panel only pairs with a worn device."};
        return {enabled:true,title:"Interact",tooltip:"Holopaint, PIN, key and lock controls."};
      },
      interactFunction:function(){
        try{ window.setMainElement && window.setMainElement(1,true); }catch(err){}
        mainMenu(this);
      },
      canMergeWith:function(o){ return o===this; },
      loadSaveObject:function(o){
        Base.prototype.loadSaveObject.call(this,o);
        try{ applyFlags(this); }catch(err){}
      }
    };

    class TnHoloChastityBelt extends Base{
      constructor(){
        super();
        setup(this,"belt");
        this.shortName="HoloBelt";
        this.longName="Holo-Lock chastity belt";
        names.addFullName(this.shortName,text.toTitleCase(this.longName));
        names.addTooltip(this.shortName,"A sleek chastity belt with a Holo-Lock housing.");
        this.basePrice=BELT_PRICE;
      }
      getClassName(){ return BELT_CLASS; }
      static getClassName(){ return BELT_CLASS; }
      get description(){ var c=this.coloration(); return text.indefiniteArticle((c?c+" ":"")+"Holo-Lock chastity belt"); }
      set description(v){}
      get tooltip(){
        return "A sleek, body-contoured chastity belt from a boutique lock-maker, sold at Mi Amour. A smooth shield curves over the wearer’s sex, with a discreet slit for urinating, and an optional rear shield slides out to guard the back door too. The whole thing is coated in holopaint, so it can change color as often as you like.\n\nThe Holo-Lock housing takes a digital key stored in your Codex (opened with a PIN), a physical key, or both. Interact with it while wearing it to set it up.\n\n<b>Locked:</b> blocks vaginal penetration"+(this.tnShield?" and anal penetration":"")+", and it can’t be removed."
          +"\n\n<b>Status:</b> "+(this.tnLocked?"Locked":"Unlocked")+"\n<b>Color Setting:</b> "+text.toDisplayCase(colorName(this));
      }
      set tooltip(v){}
    }
    class TnHoloChastityCage extends Base{
      constructor(){
        super();
        setup(this,"cage");
        this.shortName="HoloCage";
        this.longName="Holo-Lock chastity cage";
        names.addFullName(this.shortName,text.toTitleCase(this.longName));
        names.addTooltip(this.shortName,"A sleek chastity cage with a Holo-Lock housing.");
        this.basePrice=CAGE_PRICE;
      }
      getClassName(){ return CAGE_CLASS; }
      static getClassName(){ return CAGE_CLASS; }
      get description(){ var c=this.coloration(); return text.indefiniteArticle((c?c+" ":"")+"Holo-Lock chastity cage"); }
      set description(v){}
      get tooltip(){
        return "A smooth, curved chastity cage from a boutique lock-maker, sold at Mi Amour. Ultralastic rings size themselves to any cock and any number of them, and the shell keeps everything snug, soft and very much out of reach. The whole thing is coated in holopaint, so it can change color as often as you like.\n\nThe Holo-Lock housing takes a digital key stored in your Codex (opened with a PIN), a physical key, or both. Interact with it while wearing it to set it up.\n\n<b>Locked:</b> your cock can’t be used to masturbate, and the cage can’t be removed."
          +"\n\n<b>Status:</b> "+(this.tnLocked?"Locked":"Unlocked")+"\n<b>Color Setting:</b> "+text.toDisplayCase(colorName(this));
      }
      set tooltip(v){}
    }
    [TnHoloChastityBelt,TnHoloChastityCage].forEach(function(C){
      Object.keys(shared).forEach(function(k){
        Object.defineProperty(C.prototype,k,{value:shared[k],writable:true,configurable:true});
      });
    });
    registry.registerClass(BELT_CLASS,TnHoloChastityBelt);
    registry.registerClass(CAGE_CLASS,TnHoloChastityCage);
    window.TnHoloChastityBelt=TnHoloChastityBelt;
    window.TnHoloChastityCage=TnHoloChastityCage;
  }

  function registerItems(tries){
    var chunks=self.webpackChunktits_html;
    if(!chunks || typeof chunks.push!=="function" || !window.GLOBAL){
      if(tries<120) setTimeout(function(){ registerItems(tries+1); },500);
      return;
    }
    chunks.push([["tn-holochastity-"+tries],{},function(req){
      try{ defineItems(req); }
      catch(err){
        console.warn("[TN] Holo-Lock Chastity couldn't register",err);
        if(tries<20) setTimeout(function(){ registerItems(tries+1); },1000);
      }
    }]);
  }
  registerItems(0);

  // ---- Add both to Aliss's stock whenever her shop opens.
  function wrapShop(tries){
    if(typeof window.showShop!=="function"){
      if(tries<240) setTimeout(function(){ wrapShop(tries+1); },500);
      return;
    }
    if(window.showShop.__tnHoloChastity) return;
    var orig=window.showShop;
    var wrapped=function(opts){
      try{
        var k=opts && opts.shopkeeper;
        if(modOn() && window.TnHoloChastityBelt && k && typeof k.getClassName==="function"
           && k.getClassName()===SHOPKEEPER_CLASS && Array.isArray(opts.items)){
          [window.TnHoloChastityBelt,window.TnHoloChastityCage].forEach(function(C){
            if(opts.items.indexOf(C)<0) opts.items.push(C);   // the shop calls "new" itself
          });
          // Aliss's "Try On" only knows her own stock; give ours a short scene instead.
          if(typeof opts.onInspect==="function" && !opts.onInspect.__tnHolo){
            var inspect=opts.onInspect;
            opts.onInspect=function(item){
              var r=inspect.apply(this,arguments);
              try{
                if(isOurs(item)) addButton(0,"Try On",function(){ alissModel(item); },"Try On","Ask Aliss to show it off.");
              }catch(err){}
              return r;
            };
            opts.onInspect.__tnHolo=true;
          }
        }
      }catch(err){ console.warn("[TN] Holo-Lock stock failed",err); }
      return orig.apply(this,arguments);
    };
    wrapped.__tnHoloChastity=true;
    Object.keys(orig).forEach(function(key){ try{ wrapped[key]=orig[key]; }catch(e){} });
    window.showShop=wrapped;
  }
  wrapShop(0);

  function alissModel(item){
    try{ window.setMainElement && window.setMainElement(1,true); }catch(err){}
    clearOutput(); clearMenu();
    try{ aliss.showAll(); }catch(err){}
    author("Techy-Nest");
    var cage=item.tnKind==="cage";
    output("Aliss lifts the "+(cage?"cage":"belt")+" from its display stand and turns it in the light, letting the holopaint ripple from silver to rose to midnight blue under her clawed fingertips.");
    output("\n\n<i>“These are not something I model, </i>mi amour<i>,”</i> she purrs with a wink, <i>“but I can tell you all about them.”</i> She taps the little lock housing. <i>“Digital key in your Codex with a PIN, or a real metal key, or both if you like to be careful. And the paint changes whenever you ask it to.”</i>");
    output("\n\nShe leans over the counter, lowering her voice. <i>“And if you ever forget your PIN or lose that key, come and see me. I keep an override wand. No judgment.”</i>");
    addDisabledButton(1,"Try On");
    addButton(14,"Back",function(){ if(typeof window.popUIState==="function") window.popUIState(); else mainGameMenu(); });
  }

  // ---- Mod Menu entry
  function register(tries){
    if((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")){
      if(tries<120) setTimeout(function(){ register(tries+1); },500);
      return;
    }
    window.registerModMenu({
      id:MOD_ID,
      name:"Holo-Lock Chastity",
      author:"Techy-Nest",
      description:"A chastity belt and a chastity cage sold by Aliss at Mi Amour (Tavros). Lock with a Codex PIN, a physical key, or both; recolor with holopaint. Off = not stocked and the masturbation lock stops.",
      supportsToggle:true,
      defaultEnabled:true,
      getHtml:function(){
        var html="<b>Sold by:</b> Aliss (Mi Amour, Tavros).\n<b>Price:</b> "+BELT_PRICE+" credits each.\n<b>Set up:</b> wear it, then Inventory → the device → Interact.";
        var it=worn();
        if(isOurs(it)){
          html+="\n\nYour Steele is wearing the <b>"+it.longName+"</b> ("+colorName(it)+"), currently <b>"+(it.tnLocked?"locked":"unlocked")+"</b>.";
          if(it.tnLocked) html+='<button type="button" data-mod-act="release">Emergency release</button>';
        }else html+="\n\nYour Steele isn’t wearing a Holo-Lock device right now.";
        html+="\n\n<b>Tail cock stands in:</b> "+(standIn()?"On":"Off")+". When on, a Steele with a tail cock or cockvine can still pick the usual \"your cock\" scenes while caged. Scenes that go through the game's cock picker, and the Masturbate menu, stay locked either way. Tail-cock scenes are always open.";
        html+='<button type="button" data-mod-act="standin">'+(standIn()?"Turn stand-in off":"Turn stand-in on")+'</button>';
        return html;
      },
      onAct:function(act){
        if(act==="standin"){ setStandIn(!standIn()); return true; }
        if(act==="release"){
          var it=worn();
          if(isOurs(it)){ it.tnLocked=false; applyFlags(it); }
          return true;
        }
        return false;
      }
    });
  }
  register(0);
})();
