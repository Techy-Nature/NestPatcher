# Virine - KittyPatcher custom item mod (TiTS 0.9.167)
# A blue TamaniCorp medipen that raises male virility (how likely your cum is to get
# someone pregnant). It's the virility half of Fertite+, only stronger, and it never
# touches female fertility.
#   - Each pen adds to your base virility (cumQualityRaw):
#       below 2.0: +0.5    2.0 to 4.99: +0.25    5.0 and up: +0.1
#     Fertite+ gives +0.2 / +0.1 for comparison. There is no cap.
#   - It also cures the Firing Blanks perk and the temporary Infertile status, like
#     Fertite+ does. The permanent Infertile perk can't be fixed.
#   - It needs a cock (or a tail cock). Without one, you don't inject it and you keep
#     the pen.
# Sold by Lerris in the TamaniCorp shop on Tavros, next to Fertite+.
# To sell it somewhere else, change SHOPKEEPER_CLASS below (e.g. "Jade").
# Toggle: Options -> Android Mods -> "Virine". Off = not stocked and the pen does
# nothing; virility you already gained stays.
# No game-file patches. Uses the 0.9.167 module IDs: 95164 (item base), 54014
# (registry), 18366 (tooltips), 69289 (text utils). If a game update renames these,
# the item just won't appear.
# In-game author: Techy-Nest.

Add Javascript:
(function(){
  "use strict";
  if(window.__tnVirineRegistered) return;
  window.__tnVirineRegistered=true;

  var MOD_ID="tn.virine";
  var CLASS_NAME="Virine";
  var SHOPKEEPER_CLASS="Lerris";   // change to "Jade" to sell it in her shop instead
  var PRICE=500;

  // Boost per pen, by your base virility before the shot.
  function boostFor(raw){
    if(raw<2) return 0.5;
    if(raw<5) return 0.25;
    return 0.1;
  }

  function modOn(){
    try{
      return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID);
    }catch(err){ return true; }
  }

  function fmt(n){
    n=Number(n)||0;
    return (Math.round(n*100)/100).toFixed(2);
  }
  function hasMaleBits(pc){
    try{ return pc.hasCock() || pc.hasTailCock(); }catch(err){ return false; }
  }

  // ---- The effect. Returns the text to show.
  function inject(pc){
    var out="You uncap the Virine medipen, press the blunt end to your thigh and click the plunger. There's a cool pinch, then nothing at all: the self-numbing tip leaves only a faint chill behind as the dose spreads.";

    if(pc.hasPerk("Infertile")){
      return out+"\n\nA few minutes later your Codex beeps, then gives a short, apologetic buzz: the treatment found nothing to work with. <b>Your permanent infertility is beyond what Virine can fix.</b>";
    }

    var before=pc.cumQualityRaw||0;
    var add=boostFor(before);
    pc.cumQualityRaw=before+add;

    out+="\n\nThe chill sinks down into your groin and turns into a slow, spreading warmth.";
    if(pc.balls>0) out+=" Your [pc.balls] tighten and then hang heavy and full, churning with a deep, satisfied ache.";
    else out+=" Something deep inside you clenches and relaxes, and you feel a faint, eager throb at the base of [pc.eachCock].";
    out+=" Your Codex beeps a moment later: it's detecting a change in your reproductive genes. <b>You're more virile now!</b> (Base virility "+fmt(before)+" → "+fmt(pc.cumQualityRaw)+".)";

    if(pc.hasStatusEffect("Infertile")){
      pc.removeStatusEffect("Infertile");
      out+=" The same readout notes that <b>your temporary infertility has been flushed out</b>.";
    }
    if(pc.hasPerk("Firing Blanks")){
      pc.removePerk("Firing Blanks");
      out+="\n\nThe warmth builds into a scorching, almost feverish heat, deep in the core of your body. When it finally fades, it leaves you with the unmistakable feeling that <b>you won't be firing blanks anymore</b>.";
    }
    return out;
  }

  function defineItem(req){
    var Base=req(95164).Jo, registry=req(54014).yq, names=req(18366).g, text=req(69289).m;
    var G=window.GLOBAL;

    class Virine extends Base{
      constructor(){
        super();
        this.stackSize=10;
        this.type=G.POTION;
        this.shortName="Virine";
        this.longName="Virine medipen";
        names.addFullName(this.shortName,text.toTitleCase(this.longName));
        this.description="a Virine medipen";
        this.tooltip="A slim, cobalt-blue medipen stamped with the TamaniCorp logo. The label reads “Virine: Virility on demand. A TamaniCorp product.” The small print promises a fast, painless boost to male virility for any galactic-core race with the right equipment, and a cure for most cases of “shooting blanks.” A sticker on the side adds: “Does not affect female fertility. For that, ask about Fertite+!”";
        names.addTooltip(this.shortName,this.tooltip);
        this.basePrice=PRICE;
        this.combatUsable=false;
        this.targetsSelf=true;
        this.customIcon="drug-vial";
      }
      getClassName(){ return CLASS_NAME; }
      static getClassName(){ return CLASS_NAME; }
      useFunction(target){
        clearOutput();
        if(!target || target.getClassName()!=="PlayerCharacter"){
          output((target?target.capitalA+target.short:"They")+" uses the Virine medipen to no effect.");
          return false;
        }
        showBust(""); showName("VIRINE\nMEDIPEN"); author("Techy-Nest");
        if(!modOn()){
          output("You turn the medipen over in your hand, but the safety cap won't come off. (Virine is switched off in Options → Android Mods.)");
          try{ if(!infiniteItems()) this.quantity++; }catch(err){}
          return false;
        }
        if(!hasMaleBits(target)){
          output("You read the label again. Virine only works on someone with a cock to go with it, and you don't have one right now. You tuck the pen back into your pack for later.");
          try{ if(!infiniteItems()) this.quantity++; }catch(err){}
          return false;
        }
        var t="";
        try{ t=inject(target); }
        catch(err){ console.warn("[TN] Virine failed",err); t="The shot stings a little, but nothing else happens."; }
        output(typeof ParseText==="function"?ParseText(t):t);
        return false;
      }
    }
    registry.registerClass(CLASS_NAME,Virine);
    window.TnVirine=Virine;
  }

  // ---- Register the item at startup (also makes it show up in Cheats -> Items and
  // load from saves).
  function registerItem(tries){
    var chunks=self.webpackChunktits_html;
    if(!chunks || typeof chunks.push!=="function" || !window.GLOBAL){
      if(tries<120) setTimeout(function(){ registerItem(tries+1); },500);
      return;
    }
    chunks.push([["tn-virine-"+tries],{},function(req){
      try{ defineItem(req); }
      catch(err){
        console.warn("[TN] Virine couldn't register",err);
        if(tries<20) setTimeout(function(){ registerItem(tries+1); },1000);
      }
    }]);
  }
  registerItem(0);

  // ---- Add to Lerris's stock whenever her shop opens.
  function wrapShop(tries){
    if(typeof window.showShop!=="function"){
      if(tries<240) setTimeout(function(){ wrapShop(tries+1); },500);
      return;
    }
    if(window.showShop.__tnVirine) return;
    var orig=window.showShop;
    var wrapped=function(opts){
      try{
        var k=opts && opts.shopkeeper;
        if(modOn() && window.TnVirine && k && typeof k.getClassName==="function"
           && k.getClassName()===SHOPKEEPER_CLASS && Array.isArray(opts.items)){
          var have=opts.items.some(function(it){ return it && typeof it.getClassName==="function" && it.getClassName()===CLASS_NAME; });
          if(!have) opts.items.push(window.TnVirine);   // the shop expects the item class; it calls "new" itself
        }
      }catch(err){ console.warn("[TN] Virine stock failed",err); }
      return orig.apply(this,arguments);
    };
    wrapped.__tnVirine=true;
    // Keep any flags other mods put on showShop.
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
      name:"Virine",
      author:"Techy-Nest",
      description:"A TamaniCorp medipen sold by Lerris on Tavros. Each shot raises male virility (+0.5 below 2.0, +0.25 up to 5.0, +0.1 after that) and cures Firing Blanks. Needs a cock. Off = not stocked and the pen does nothing; virility you already gained stays.",
      supportsToggle:true,
      defaultEnabled:true,
      getHtml:function(){
        var line="";
        try{
          var pc=window.pc;
          if(pc){
            line="Your Steele's base virility: "+fmt(pc.cumQualityRaw)+". Current virility with perks and effects: "+fmt(pc.cumQuality())+".";
            if(!hasMaleBits(pc)) line+="\nYour Steele has no cock right now, so Virine won't work.";
            else line+="\nNext pen adds +"+boostFor(pc.cumQualityRaw||0)+".";
          }
        }catch(err){}
        return "<b>Sold by:</b> Lerris (TamaniCorp shop, Tavros), next to Fertite+.\n<b>Price:</b> "+PRICE+" credits."+(line?"\n\n"+line:"");
      },
      onAct:function(){ return true; }
    });
  }
  register(0);
})();
