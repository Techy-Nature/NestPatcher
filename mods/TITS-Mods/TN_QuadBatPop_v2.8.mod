# Quad-Bat Pop - KittyPatcher custom item mod (TiTS 0.9.168), Modv2.8
# A sister treat to the Quad-Wing Pop. A black cherry lollipop shaped like a plus sign:
# you hold it by the middle, and each of the four tips is a little candy bat wing with a
# thin red sugar-glass membrane. Eating it always leaves you with two pairs (four) of
# large bat wings, one pair under the other:
#   - No wings: you grow two pairs of bat wings at once.
#   - Bat wings (small or large), one pair: they grow to full size and a second pair
#     grows in under the first.
#   - Any other wings: they turn into bat wings and, if you had only one pair (or a
#     single fin), a second pair grows in under them.
#   - Three or more pairs already: they stay that many and just turn into bat wings.
#   - Already two or more pairs of large bat wings: no change, it's just a tasty treat.
# Membrane color: bat wings you already had keep their look (furred backs stay furred).
# New bat wings use your skin tone, the same as the game's own bat wings.
# Back tentacles (cockvine, tentacle, Janeria) and shark fins count as "other wings"
# and are replaced, the same way Quad-Wing Pop and Amber Seed replace them.
# Taurs and nagas get their own lines about what the new wings can lift.
#
# Sold by Jade on Tavros, next to Amber Seed and the Quad-Wing Pop. It is added to her
# stock at runtime, so it doesn't clash with any other Jade changes.
# To sell it somewhere else, change SHOPKEEPER_CLASS below (e.g. "DrLessau" for Uveto).
# Toggle: Options -> Android Mods -> "Quad-Bat Pop". Off = not stocked and the
# lollipop does nothing; wings you already grew stay.
# No game-file patches. Uses the module IDs: 95164 (item base), 54014 (registry),
# 18366 (tooltips), 69289 (text utils), unchanged in 0.9.168. If a game update renames
# these, the item just won't appear.
# In-game author: Techy-Nest.

Add Javascript:
(function(){
  "use strict";
  if(window.__tnQuadBatPopRegistered) return;
  window.__tnQuadBatPopRegistered=true;

  var MOD_ID="tn.quadbatpop";
  var CLASS_NAME="QuadBatPop";
  var SHOPKEEPER_CLASS="Jade";   // change to "DrLessau" to sell it on Uveto instead
  var PRICE=1200;
  var WING_TARGET=4;             // two pairs

  function modOn(){
    try{
      return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID);
    }catch(err){ return true; }
  }

  function numWord(n){
    return ({1:"one",2:"two",3:"three",4:"four",5:"five",6:"six",7:"seven",8:"eight"})[n] || String(n);
  }
  function styleOf(pc){
    try{
      if(pc.hasStatusEffect("Wing Style")) return { v1:pc.statusEffectv1("Wing Style")||0, tip:pc.getStatusTooltip("Wing Style")||"" };
    }catch(err){}
    return { v1:0, tip:"" };
  }
  function wingColor(pc){
    try{ return pc.wingColor() || pc.skinTone || "dusky"; }catch(err){ return "dusky"; }
  }
  function isTaur(pc){ try{ return !!pc.isTaur(); }catch(err){ return false; } }
  function isNaga(pc){ try{ return !!pc.isNaga(); }catch(err){ return false; } }

  // A closing line about what the wings can do, for bipeds, taurs and nagas.
  function liftLine(pc){
    if(isTaur(pc)) return " You spread all four and give a hard downstroke. Your forelegs come clean off the ground, and with the second pair pulling a heartbeat behind the first, even your heavy hindquarters get a little lighter. With some practice, two pairs might be enough to get your whole tauric body airborne.";
    if(isNaga(pc)) return " You spread all four and give a hard downstroke. Your upper body lifts, and coil after coil of your long tail peels up off the floor until only the tip is still touching. With some practice, two pairs might be enough to carry all of you through the air.";
    return " You spread all four and give a hard downstroke, and your feet leave the ground for a moment. The lower pair follows the upper one a heartbeat behind, like they already know how to fly together.";
  }

  // ---- The transformation. Returns the text to show.
  function transform(G, pc){
    var type=pc.wingType||0, count=pc.wingCount||0;
    var batKin=(type===G.TYPE_BAT || type===G.TYPE_SMALLBAT);
    var none=(type===0 || count<=0);
    var backTentacles=[G.TYPE_COCKVINE,G.TYPE_TENTACLE,G.TYPE_JANERIA].indexOf(type)>=0;

    if(type===G.TYPE_BAT && count>=WING_TARGET){
      return "A pleasant warmth spreads between your shoulder blades, and your [pc.wings] give a happy little twitch, stretching out and folding back up, but nothing else happens. You already have all the wings this treat can give you. At least it was delicious.";
    }

    var newCount=Math.max(WING_TARGET,count);
    if(none){
      pc.shiftWings(G.TYPE_BAT,newCount);
      var c1=wingColor(pc);
      return "Heat gathers along your spine, then blooms into an ache across your whole back. Four lumps push out of your [pc.skinFurScalesNoun] at once, two up by your shoulder blades and two just below them, and stretch out into long, thin finger-bones. Skin spreads between them as they grow, until "+c1+" membranes are pulled taut across every span and you're carrying <b>two pairs of large bat wings, one pair above the other!</b>"+liftLine(pc);
    }

    if(batKin){
      var st=styleOf(pc);
      var wasSmall=(type===G.TYPE_SMALLBAT);
      pc.shiftWings(G.TYPE_BAT,newCount,false,st.v1,st.tip);
      var c2=wingColor(pc);
      var out2="";
      if(wasSmall) out2="With a sound like a dozen knuckles cracking, the little bones of your wings stretch out to full size, the "+c2+" membranes growing with them. Before you can get used to the new wingspan, a hot, stretching pressure builds just beneath them. ";
      else out2="Your wings tingle at the roots, and a hot, stretching pressure builds just beneath them. ";
      if(count<WING_TARGET){
        out2+="With a sudden pop, a second pair of limbs pushes free under your first and unfolds, thin skin spreading between the new finger-bones to match. <b>You now have two pairs of large bat wings, one pair under the other!</b>";
      }
      else{
        out2+="It fades without anything new growing, and your "+numWord(newCount)+" wings settle against your back. <b>Your "+numWord(newCount)+" wings are now large bat wings!</b>";
      }
      return out2+liftLine(pc);
    }

    // Other wings: turn them into bat wings and add a pair if needed.
    var oldDesc="";
    try{ oldDesc=pc.wingsDescript ? pc.wingsDescript() : ""; }catch(err){}
    if(!oldDesc) oldDesc=(count===1?"[pc.wing]":"[pc.wings]");
    var grewPair=(count<WING_TARGET);
    var out="";
    if(backTentacles) out="Your "+oldDesc+" shiver and draw back into your body, and before you can feel their absence, ";
    else if(type===G.TYPE_SHARK) out="Your fin softens and sinks back into your body, and before you can feel its absence, ";
    else out="Your "+oldDesc+(count===1?" goes hot and soft, then reshapes itself":" go hot and soft, then reshape themselves")+" bone by bone: ";
    pc.shiftWings(G.TYPE_BAT,newCount);   // plain bat wings, no old feather or scale style
    var c3=wingColor(pc);
    if(backTentacles || type===G.TYPE_SHARK){
      out+="four lumps push out of your back, two at your shoulder blades and two below them, and stretch into long finger-bones webbed with "+c3+" skin. <b>You now have two pairs of large bat wings, one pair above the other!</b>";
    }
    else if(grewPair){
      out+="the joints stretch into long, thin fingers, everything between them sheds away into smooth "+c3+" membrane, and as they settle, a fresh pair of limbs pushes out just beneath them and grows in to match. <b>You now have two pairs of large bat wings, one pair under the other!</b>";
    }
    else{
      out+="the joints stretch into long, thin fingers and everything between them sheds away into smooth "+c3+" membrane. <b>Your "+numWord(newCount)+" wings are now large bat wings!</b>";
    }
    return out+liftLine(pc);
  }

  function defineItem(req){
    var Base=req(95164).Jo, registry=req(54014).yq, names=req(18366).g, text=req(69289).m;
    var G=window.GLOBAL;

    class QuadBatPop extends Base{
      constructor(){
        super();
        this.stackSize=10;
        this.type=G.FOOD;
        this.shortName="BatPop";
        this.longName="Quad-Bat Pop";
        names.addFullName(this.shortName,text.toTitleCase(this.longName));
        this.description="a Quad-Bat Pop";
        this.tooltip="A black cherry lollipop shaped like a plus sign. You hold it by the bare middle, and at each of the four tips sits a little candy bat wing, its thin membrane made of red sugar glass. The wrapper promises “Two pairs of bat wings, every time! Fangs not included!” and in smaller print: “Turns existing wings into bat wings. Adds a second pair under the first.”";
        names.addTooltip(this.shortName,this.tooltip);
        this.basePrice=PRICE;
        this.combatUsable=false;
        this.targetsSelf=true;
        this.customIcon="lollipop";
      }
      getClassName(){ return CLASS_NAME; }
      static getClassName(){ return CLASS_NAME; }
      useFunction(target){
        clearOutput();
        if(!target || target.getClassName()!=="PlayerCharacter"){
          output((target?target.capitalA+target.short:"They")+" eats the Quad-Bat Pop to no effect.");
          return false;
        }
        showBust(""); showName("QUAD-BAT\nPOP"); author("Techy-Nest");
        if(!modOn()){
          output("You crunch the tip off one of the candy bat wings. It's sweet and tart, but nothing else happens. (Quad-Bat Pop is switched off in Options → Android Mods.)");
          return false;
        }
        output("You unwrap the Quad-Bat Pop and hold it by the middle of the cross. One by one, you work through the four bat wings at its tips, the red sugar-glass membranes cracking between your teeth and the black cherry candy melting tart and sweet on your tongue, until only the bare stick is left.");
        var t="";
        try{ t=transform(G,target); }
        catch(err){ console.warn("[TN] Quad-Bat Pop failed",err); t="The candy settles warmly in your stomach, but nothing else happens."; }
        output("\n\n"+(typeof ParseText==="function"?ParseText(t):t));
        return false;
      }
    }
    registry.registerClass(CLASS_NAME,QuadBatPop);
    window.TnQuadBatPop=QuadBatPop;
  }

  // ---- Register the item at startup (also makes it show up in Cheats -> Items and
  // load from saves).
  function registerItem(tries){
    var chunks=self.webpackChunktits_html;
    if(!chunks || typeof chunks.push!=="function" || !window.GLOBAL){
      if(tries<120) setTimeout(function(){ registerItem(tries+1); },500);
      return;
    }
    chunks.push([["tn-quadbatpop-"+tries],{},function(req){
      try{ defineItem(req); }
      catch(err){
        console.warn("[TN] Quad-Bat Pop couldn't register",err);
        if(tries<20) setTimeout(function(){ registerItem(tries+1); },1000);
      }
    }]);
  }
  registerItem(0);

  // ---- Add to Jade's stock whenever her shop opens.
  function wrapShop(tries){
    if(typeof window.showShop!=="function"){
      if(tries<240) setTimeout(function(){ wrapShop(tries+1); },500);
      return;
    }
    if(window.showShop.__tnQuadBatPop) return;
    var orig=window.showShop;
    var wrapped=function(opts){
      try{
        var k=opts && opts.shopkeeper;
        if(modOn() && window.TnQuadBatPop && k && typeof k.getClassName==="function"
           && k.getClassName()===SHOPKEEPER_CLASS && Array.isArray(opts.items)){
          var have=opts.items.some(function(it){ return it && typeof it.getClassName==="function" && it.getClassName()===CLASS_NAME; });
          if(!have) opts.items.push(window.TnQuadBatPop);   // the shop expects the item class; it calls "new" itself
        }
      }catch(err){ console.warn("[TN] Quad-Bat Pop stock failed",err); }
      return orig.apply(this,arguments);
    };
    wrapped.__tnQuadBatPop=true;
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
      name:"Quad-Bat Pop",
      author:"Techy-Nest (KittyPatcher custom mod)",
      description:"A plus-shaped black cherry lollipop with four candy bat wings at the tips, sold by Jade on Tavros. It always gives you two pairs of large bat wings, one under the other, and turns any wings you already have into bat wings. Off = not stocked and the lollipop does nothing; wings you already grew stay.",
      supportsToggle:true,
      defaultEnabled:true,
      getHtml:function(){
        var line="";
        try{
          var pc=window.pc, G=window.GLOBAL;
          if(pc && G){
            if(!pc.wingType || !pc.wingCount) line="Your Steele has no wings right now.";
            else line="Your Steele has "+numWord(pc.wingCount)+" "+(pc.wingType===G.TYPE_BAT?"large bat ":(pc.wingType===G.TYPE_SMALLBAT?"small bat ":""))+"wing"+(pc.wingCount===1?"":"s")+".";
          }
        }catch(err){}
        return "<b>Sold by:</b> Jade (Tavros), next to Amber Seed.\n<b>Price:</b> "+PRICE+" credits."+(line?"\n\n"+line:"");
      },
      onAct:function(){ return true; }
    });
  }
  register(0);
})();
