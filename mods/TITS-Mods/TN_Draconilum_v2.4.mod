# Draconilum - KittyPatcher custom item mod
# A general dragon transformative: all of Reptilum's effects, plus Drakongaru-style
# large draconic wings and a pair of pearly white dragon horns. Sold by Jade on Tavros.
#  - Ears: frilled draconic ears (fan-shaped, scale-edged). Reptilum would turn these
#    back into lizard ears, so Draconilum hides them from it while it runs.
#  - Horns: two 10" draconic horns colored "pearly white" (the game's Horn Style color).
#    Other horns are replaced. Reptilum normally removes horns; Draconilum hides the
#    dragon horns from it while it runs, so they're never taken away.
#
# How it works:
#  - It is built on the game's own Reptilum item, so every Reptilum change (scales,
#    lizan face/eyes/ears/arms/legs, long scaled tail, tongue, genital slit, etc.) works
#    exactly like Reptilum, with the same 0-3 random changes per bottle.
#  - After Reptilum's changes, if you don't have two large draconic wings yet, they
#    grow in, colored to match your scales. Reptilum only dissolves wings that aren't
#    scaly, so it never removes these.
#  - If Reptilum dissolves old feathered or insect wings that same bottle, the dragon
#    wings replace them right after.
#
# No game-file patches: the item is created at startup and added to Jade's stock at
# runtime, so it doesn't clash with DragoHornitol's or Gryphonix's Jade changes.
# Toggle: Options -> Android Mods -> "Draconilum". Off = not stocked and does nothing.
# Uses 0.9.166 module IDs: 54326 (Reptilum), 54014 (registry), 18366 (tooltips),
# 69289 (text utils). If a game update renames these, the item just won't appear.

Add Javascript:
(function(){
  "use strict";
  if(window.__tnDraconilumRegistered) return;
  window.__tnDraconilumRegistered=true;

  var MOD_ID="tn.draconilum";
  var CLASS_NAME="Draconilum";
  var SHOPKEEPER_CLASS="Jade";   // change to "DrLessau" to sell it on Uveto instead
  var PRICE=1500;
  var HORN_COLOR="pearly white";
  var HORN_LENGTH=10;   // inches, for newly grown horns

  function modOn(){
    try{
      return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID);
    }catch(err){ return true; }
  }

  function needsWings(pc, G){
    return pc.wingType!==G.TYPE_DRACONIC || pc.wingCount<2;
  }

  function growWings(pc, G){
    var had=pc.wingType && pc.wingType!==G.TYPE_HUMAN && pc.wingCount>0;
    var color=pc.scaleColor || "dark";
    pc.shiftWings(G.TYPE_DRACONIC,2);
    var t="\n\nJust as you think the serum has finished with you, a deep, grinding ache blooms between your shoulder blades.";
    if(had) t+=" Your old wings shrivel and draw back into your body as something far heavier forces its way out.";
    else t+=" The skin there splits as two heavy, bony limbs force their way out of your back.";
    t+=" They unfold with a leathery snap: long, clawed fingers of bone strung with taut membrane, the leading edges armored in "+color+" scales. You give them an experimental beat and the wind they kick up nearly knocks over everything around you. <b>You now have large dragon wings!</b>";
    return t;
  }

  function needsEars(pc, G){
    return pc.earType!==G.TYPE_DRACONIC;
  }

  function growEars(pc, G){
    var had=pc.earType===G.TYPE_LIZAN;
    pc.earType=G.TYPE_DRACONIC;
    if(typeof pc.clearEarFlags==="function") pc.clearEarFlags(); else pc.earFlags=[];
    var color=pc.scaleColor || "dark";
    var t="\n\n";
    t+= had ? "The shallow divots at the sides of your head prickle, then stretch" : "Your [pc.ears] burn and fold back against your head, then stretch";
    t+=" outward into a pair of swept-back, fan-shaped frills: thin, webbed membrane strung between long spines, edged in "+color+" scales. They flare out when you're startled and lie flat when you're calm. <b>You now have frilled dragon ears!</b>";
    return t;
  }

  function hasDragonHorns(pc, G){
    var color="";
    try{ color=pc.hasStatusEffect("Horn Style") ? pc.getStatusTooltip("Horn Style") : ""; }catch(err){}
    return pc.hornType===G.TYPE_DRACONIC && pc.horns>=2 && color===HORN_COLOR;
  }

  function growHorns(pc, G){
    var had=pc.horns>0 && pc.hornType!==0;
    var wasDragon=pc.hornType===G.TYPE_DRACONIC && pc.horns>=2;
    var len=Math.max(HORN_LENGTH, wasDragon ? pc.hornLength : 0);
    pc.removeHorns();
    pc.hornType=G.TYPE_DRACONIC;
    pc.horns=2;
    pc.hornLength=len;
    pc.createStatusEffect("Horn Style");
    pc.setStatusTooltip("Horn Style",HORN_COLOR);
    if(wasDragon) return "\n\nA cool shimmer washes over your horns, and the color bleeds out of them until they gleam like polished nacre. <b>Your dragon horns are now "+HORN_COLOR+"!</b>";
    var t="\n\nPressure builds behind your brow";
    t+= had ? " as your old horns loosen and fall away, leaving two throbbing spots in their place." : ", two hard knots pushing up beneath your skin.";
    t+=" They break through and sweep back over your head in long, ridged curves, gleaming a lustrous, pearly white like polished nacre. <b>You now have a pair of "+HORN_COLOR+" dragon horns!</b>";
    return t;
  }

  function defineItem(req){
    var Reptilum=req(54326).p, registry=req(54014).yq, names=req(18366).g, text=req(69289).m;
    var G=window.GLOBAL;

    class Draconilum extends Reptilum{
      constructor(){
        super();
        this.shortName=CLASS_NAME;
        this.longName="Draconilum";
        names.addFullName(this.shortName,text.toTitleCase(this.longName));
        this.description="a black-and-gold bottle of smoky liquid labeled ‘Draconilum’";
        this.tooltip="A premium spin on Reptilum, sold in a sleek black bottle stamped with a gold dragon. It carries every effect of the original, granting a sleek, scaled reptilian form, and it also grows a pair of great draconic wings, frilled dragon ears and gleaming, pearly white dragon horns. Like Reptilum, it changes only a few things per bottle.";
        names.addTooltip(this.shortName,this.tooltip);
        this.basePrice=PRICE;
      }
      getClassName(){ return CLASS_NAME; }
      static getClassName(){ return CLASS_NAME; }
      useFunction(target){
        if(!target || target.getClassName()!=="PlayerCharacter"){
          clearOutput();
          output((target?target.capitalA+target.short:"They")+" drinks the Draconilum to no effect.");
          return false;
        }
        if(!modOn()){
          clearOutput();
          showName("Draconilum");
          output("You uncap the bottle, but the smoky liquid has gone flat and lifeless. (Draconilum is switched off in Options → Android Mods.)");
          return false;
        }
        // Reptilum removes any horns. Hide dragon horns from it while it runs, then put them back.
        var saved=null;
        if(target.hornType===G.TYPE_DRACONIC && target.horns>0){
          saved={horns:target.horns, hornType:target.hornType, hornLength:target.hornLength};
          target.horns=0; target.hornType=0;
        }
        // Reptilum also turns any non-lizard ears into lizard ears. Show dragon-frill ears
        // to it as lizard ears so it leaves them alone, then put them back.
        var savedEars=null;
        if(target.earType===G.TYPE_DRACONIC){
          savedEars={earType:target.earType, earFlags:(target.earFlags||[]).slice(), earLength:target.earLength};
          target.earType=G.TYPE_LIZAN;
        }
        var result;
        try{
          // All of Reptilum's own changes, text and checks.
          result=super.useFunction(target);
        }finally{
          if(saved){ target.horns=saved.horns; target.hornType=saved.hornType; target.hornLength=saved.hornLength; }
          if(savedEars){ target.earType=savedEars.earType; target.earFlags=savedEars.earFlags; target.earLength=savedEars.earLength; }
        }
        showName("Draconilum");
        var extra="";
        try{ if(needsWings(target,G)) extra+=growWings(target,G); }catch(err){ console.warn("[TN] Draconilum wings failed",err); }
        try{ if(!hasDragonHorns(target,G)) extra+=growHorns(target,G); }catch(err){ console.warn("[TN] Draconilum horns failed",err); }
        try{ if(needsEars(target,G)) extra+=growEars(target,G); }catch(err){ console.warn("[TN] Draconilum ears failed",err); }
        if(extra) output(typeof ParseText==="function"?ParseText(extra):extra);
        return result;
      }
    }
    registry.registerClass(CLASS_NAME,Draconilum);
    window.TnDraconilum=Draconilum;
  }

  // ---- Register the item at startup (also makes it show up in Cheats -> Items).
  function registerItem(tries){
    var chunks=self.webpackChunktits_html;
    if(!chunks || typeof chunks.push!=="function" || !window.GLOBAL){
      if(tries<120) setTimeout(function(){ registerItem(tries+1); },500);
      return;
    }
    chunks.push([["tn-draconilum-"+tries],{},function(req){
      try{ defineItem(req); }
      catch(err){
        console.warn("[TN] Draconilum couldn't register",err);
        if(tries<20) setTimeout(function(){ registerItem(tries+1); },1000);
      }
    }]);
  }
  registerItem(0);

  // ---- Add to the shopkeeper's stock whenever their shop opens.
  function wrapShop(tries){
    if(typeof window.showShop!=="function"){
      if(tries<240) setTimeout(function(){ wrapShop(tries+1); },500);
      return;
    }
    if(window.showShop.__tnDraconilum) return;
    var orig=window.showShop;
    var wrapped=function(opts){
      try{
        var k=opts && opts.shopkeeper;
        if(modOn() && window.TnDraconilum && k && typeof k.getClassName==="function"
           && k.getClassName()===SHOPKEEPER_CLASS && Array.isArray(opts.items)){
          var have=opts.items.some(function(it){ return it && typeof it.getClassName==="function" && it.getClassName()===CLASS_NAME; });
          if(!have) opts.items.push(window.TnDraconilum);   // the shop expects the item class; it calls "new" itself
        }
      }catch(err){ console.warn("[TN] Draconilum stock failed",err); }
      return orig.apply(this,arguments);
    };
    wrapped.__tnDraconilum=true;
    // Keep flags other mods (like Gryphonix) put on showShop.
    Object.keys(orig).forEach(function(key){ try{ wrapped[key]=orig[key]; }catch(e){} });
    window.showShop=wrapped;
  }
  wrapShop(0);

  // ---- Mod Menu entry
  function register(tries){
    if((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")){
      if(tries<120) setTimeout(function(){ register(tries+1); },500);
      return;
    }
    window.registerModMenu({
      id:MOD_ID,
      name:"Draconilum",
      author:"Nova (KittyPatcher custom mod)",
      description:"General dragon transformative sold by Jade on Tavros: every Reptilum effect, plus large draconic wings colored to match your scales, frilled dragon ears and pearly white dragon horns. Off = not stocked and the serum does nothing; existing changes stay.",
      supportsToggle:true,
      defaultEnabled:true
    });
  }
  register(0);
})();
