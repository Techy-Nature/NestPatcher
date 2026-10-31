# Quad-Wing Pop - KittyPatcher custom item mod (TiTS 0.9.167)
# A chocolate lollipop shaped like a plus sign: you hold it by the middle, and each of
# the four tips is a little chocolate lollipop shaped like a wing. Eating it always
# leaves you with two pairs (four) of large avian wings, one pair under the other:
#   - No wings: you grow two pairs of avian wings at once.
#   - Avian wings, one pair: a second pair grows in under the first.
#   - Any other wings: they turn into avian wings and, if you had only one pair (or a
#     single fin), a second pair grows in under them.
#   - Three or more pairs already: they stay that many and just turn avian.
#   - Already two or more pairs of avian wings: no change, it's just a tasty treat.
# Unlike Dove Balm there is no dice roll: it always works.
# Feather color: avian or dove wings keep their color. Other wings come out in your
# fur/feather color, the same as Amber Seed's wings.
# Back tentacles (cockvine, tentacle, Janeria) and shark fins count as "other wings"
# and are replaced, the same way Amber Seed replaces them.
#
# Sold by Jade on Tavros, next to Amber Seed. It is added to her stock at runtime, so it
# doesn't clash with DragoHornitol's, Gryphonix's or Draconilum's Jade changes.
# To sell it somewhere else, change SHOPKEEPER_CLASS below (e.g. "DrLessau" for Uveto).
# Toggle: Options -> Android Mods -> "Quad-Wing Pop". Off = not stocked and the
# lollipop does nothing; wings you already grew stay.
# No game-file patches. Uses the 0.9.167 module IDs: 95164 (item base), 54014
# (registry), 18366 (tooltips), 69289 (text utils). If a game update renames these,
# the item just won't appear.
# In-game author: Techy-Nest.

Add Javascript:
(function(){
  "use strict";
  if(window.__tnQuadWingPopRegistered) return;
  window.__tnQuadWingPopRegistered=true;

  var MOD_ID="tn.quadwingpop";
  var CLASS_NAME="QuadWingPop";
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
    try{ return pc.wingColor() || pc.furColor || "soft"; }catch(err){ return "soft"; }
  }

  // ---- The transformation. Returns the text to show.
  function transform(G, pc){
    var type=pc.wingType||0, count=pc.wingCount||0;
    var feathered=(type===G.TYPE_AVIAN || type===G.TYPE_DOVE);
    var none=(type===0 || count<=0);
    var backTentacles=[G.TYPE_COCKVINE,G.TYPE_TENTACLE,G.TYPE_JANERIA].indexOf(type)>=0;

    if(type===G.TYPE_AVIAN && count>=WING_TARGET){
      return "A pleasant warmth spreads between your shoulder blades, and your [pc.wings] give a happy little ruffle, but nothing else happens. You already have all the wings this treat can give you. At least it was delicious.";
    }

    var newCount=Math.max(WING_TARGET,count);
    if(none){
      pc.shiftWings(G.TYPE_AVIAN,newCount);
      var c1=wingColor(pc);
      return "Heat gathers along your spine, then blooms into an ache across your whole back. Four lumps push out of your [pc.skinFurScalesNoun] at once, two up by your shoulder blades and two just below them, and burst open into wet, folded limbs. They stretch, dry and fluff out with layer after layer of "+c1+" feathers until you're carrying <b>two pairs of large avian wings, one pair above the other!</b> You give them an experimental flap. The lower pair follows the upper one a heartbeat behind, like they already know how to fly together.";
    }

    if(type===G.TYPE_AVIAN){
      pc.shiftWings(G.TYPE_AVIAN,newCount);
      var c2=wingColor(pc);
      return "Your wings tingle at the roots, and a hot, stretching pressure builds just beneath them. With a sudden pop, a second pair of limbs pushes free under your first and unfolds, sprouting "+c2+" feathers to match. <b>You now have two pairs of large avian wings, one pair under the other!</b> You flex both sets, and the new pair falls into rhythm with the old one right away.";
    }

    // Other wings: turn them avian (keeping a feathered wing's own color) and add a pair if needed.
    var oldDesc="";
    try{ oldDesc=pc.wingsDescript ? pc.wingsDescript() : ""; }catch(err){}
    if(!oldDesc) oldDesc=(count===1?"[pc.wing]":"[pc.wings]");
    var st=feathered ? styleOf(pc) : { v1:0, tip:"" };
    var grewPair=(count<WING_TARGET);
    var out="";
    if(backTentacles) out="Your "+oldDesc+" shiver and draw back into your body, and before you can feel their absence, ";
    else if(type===G.TYPE_SHARK) out="Your fin softens and sinks back into your body, and before you can feel its absence, ";
    else out="Your "+oldDesc+(count===1?" goes hot and soft, then reshapes itself":" go hot and soft, then reshape themselves")+" bone by bone: ";
    pc.shiftWings(G.TYPE_AVIAN,newCount,false,st.v1,st.tip);
    var c3=wingColor(pc);
    if(backTentacles || type===G.TYPE_SHARK){
      out+="four lumps push out of your back, two at your shoulder blades and two below them, and unfold into wings covered in "+c3+" feathers. <b>You now have two pairs of large avian wings, one pair above the other!</b>";
    }
    else if(grewPair){
      out+="the joints lengthen, the surfaces shed and fill in with "+c3+" feathers, and as they settle, a fresh pair of limbs pushes out just beneath them and grows in to match. <b>You now have two pairs of large avian wings, one pair under the other!</b>";
    }
    else{
      out+="the joints lengthen and every surface fills in with "+c3+" feathers. <b>Your "+numWord(newCount)+" wings are now large avian wings!</b>";
    }
    return out;
  }

  function defineItem(req){
    var Base=req(95164).Jo, registry=req(54014).yq, names=req(18366).g, text=req(69289).m;
    var G=window.GLOBAL;

    class QuadWingPop extends Base{
      constructor(){
        super();
        this.stackSize=10;
        this.type=G.FOOD;
        this.shortName="WingPop";
        this.longName="Quad-Wing Pop";
        names.addFullName(this.shortName,text.toTitleCase(this.longName));
        this.description="a Quad-Wing Pop";
        this.tooltip="A chocolate lollipop shaped like a plus sign. You hold it by the bare middle, and at each of the four tips sits a little chocolate lollipop shaped like a feathered wing. The wrapper promises “Two pairs of wings, every time! No balm, no luck required!” and in smaller print: “Turns existing wings avian. Adds a second pair under the first.”";
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
          output((target?target.capitalA+target.short:"They")+" eats the Quad-Wing Pop to no effect.");
          return false;
        }
        showBust(""); showName("QUAD-WING\nPOP"); author("Techy-Nest");
        if(!modOn()){
          output("You lick one of the chocolate wings. It's sweet, but nothing else happens. (Quad-Wing Pop is switched off in Options → Android Mods.)");
          return false;
        }
        output("You unwrap the Quad-Wing Pop and hold it by the middle of the cross. One by one, you work through the four wing-shaped chocolate lollipops at its tips, letting each one melt rich and creamy on your tongue until only the bare stick is left.");
        var t="";
        try{ t=transform(G,target); }
        catch(err){ console.warn("[TN] Quad-Wing Pop failed",err); t="The chocolate settles warmly in your stomach, but nothing else happens."; }
        output("\n\n"+(typeof ParseText==="function"?ParseText(t):t));
        return false;
      }
    }
    registry.registerClass(CLASS_NAME,QuadWingPop);
    window.TnQuadWingPop=QuadWingPop;
  }

  // ---- Register the item at startup (also makes it show up in Cheats -> Items and
  // load from saves).
  function registerItem(tries){
    var chunks=self.webpackChunktits_html;
    if(!chunks || typeof chunks.push!=="function" || !window.GLOBAL){
      if(tries<120) setTimeout(function(){ registerItem(tries+1); },500);
      return;
    }
    chunks.push([["tn-quadwingpop-"+tries],{},function(req){
      try{ defineItem(req); }
      catch(err){
        console.warn("[TN] Quad-Wing Pop couldn't register",err);
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
    if(window.showShop.__tnQuadWingPop) return;
    var orig=window.showShop;
    var wrapped=function(opts){
      try{
        var k=opts && opts.shopkeeper;
        if(modOn() && window.TnQuadWingPop && k && typeof k.getClassName==="function"
           && k.getClassName()===SHOPKEEPER_CLASS && Array.isArray(opts.items)){
          var have=opts.items.some(function(it){ return it && typeof it.getClassName==="function" && it.getClassName()===CLASS_NAME; });
          if(!have) opts.items.push(window.TnQuadWingPop);   // the shop expects the item class; it calls "new" itself
        }
      }catch(err){ console.warn("[TN] Quad-Wing Pop stock failed",err); }
      return orig.apply(this,arguments);
    };
    wrapped.__tnQuadWingPop=true;
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
      name:"Quad-Wing Pop",
      author:"Techy-Nest (KittyPatcher custom mod)",
      description:"A plus-shaped chocolate lollipop with four wing-shaped pops at the tips, sold by Jade on Tavros. It always gives you two pairs of large avian wings, one under the other, and turns any wings you already have avian. Off = not stocked and the lollipop does nothing; wings you already grew stay.",
      supportsToggle:true,
      defaultEnabled:true,
      getHtml:function(){
        var line="";
        try{
          var pc=window.pc, G=window.GLOBAL;
          if(pc && G){
            if(!pc.wingType || !pc.wingCount) line="Your Steele has no wings right now.";
            else line="Your Steele has "+numWord(pc.wingCount)+" "+(pc.wingType===G.TYPE_AVIAN?"avian ":"")+"wing"+(pc.wingCount===1?"":"s")+".";
          }
        }catch(err){}
        return "<b>Sold by:</b> Jade (Tavros), next to Amber Seed.\n<b>Price:</b> "+PRICE+" credits."+(line?"\n\n"+line:"");
      },
      onAct:function(){ return true; }
    });
  }
  register(0);
})();
