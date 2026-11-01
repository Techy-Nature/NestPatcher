Name: Anno's Holoboard
Author: Kitty
# TN_Holoboard - NestPatcher mod (TiTS 0.9.168), v2.7
# Anno's Holoboard: a refurbished hoverboard coated in Anno's own invention, holopaint.
#   - Works as a real hoverboard: anything in the game that checks for the pink hoverboard
#     (faster travel, carrying huge endowments, Myrellion's landmines and window, and so
#     on) counts the Holoboard too.
#   - Recolor it any time from Inventory -> Holoboard -> Interact (the game's own color
#     picker). Turn the projector off for bare steel, and back on for your last color.
#   - Sold in Anno's shop, at the Steele Tech outpost on Tarkus or aboard your ship once
#     she's crew. It costs what Shekka charges for a pink board: a holoboard is worth twice
#     that, but Steele gets Anno's permanent half-off.
#   - Anno shows it off the next time you talk to her (once per save), whether you've just
#     met her or met her long ago.
#   - Options -> Cheats -> Items: search "holo" for TnHoloboard.
# No patches on the game files: it registers its item class at start-up and wraps
# window.showShop, window.repeatAnnoApproach and window.annoFollowerApproach.
# Uses the 0.9.168 module IDs 95164 (item base), 54014 (registry), 18366 (tooltips),
# 69289 (text utils) and 75318 (the game's Hoverboard).
# In-game author: Techy-Nest.

Add Javascript:
(function(){
  "use strict";
  if(window.__tnHoloboardRegistered) return;
  window.__tnHoloboardRegistered=true;

  var MOD_ID="tn.holoboard";
  var ITEM_CLASS="TnHoloboard";
  var SHOWN_FLAG="TN_HOLOBOARD_SHOWN";
  var PINK_BOARD_PRICE=3999;       // the game's Hoverboard basePrice
  var price=PINK_BOARD_PRICE;      // set again each time Anno's shop opens

  function modOn(){
    try{
      return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID);
    }catch(err){ return true; }
  }
  function header(t){ return typeof blockHeader==="function"?blockHeader(t):"<b>"+t+"</b>\n\n"; }
  function isOurs(it){
    try{ return !!it && typeof it.getClassName==="function" && it.getClassName()===ITEM_CLASS; }
    catch(err){ return false; }
  }
  function colorName(it){
    if(it.tnBare) return "bare steel";
    var c="";
    try{ c=it.coloration(); }catch(err){}
    return c ? c : "factory pink";
  }
  function inFight(){ try{ return typeof inCombat==="function" && inCombat(); }catch(err){ return false; } }

  // ---- Interact menu
  function mainMenu(it){
    clearOutput(); clearMenu();
    showName("ANNO’S\nHOLOBOARD");
    output(header("Anno’s Holoboard"));
    output("You flip the board over and tap the little projector Anno tucked under the deck. It chirps and waits for orders.");
    output("\n\n<b>Projector:</b> "+(it.tnBare?"off":"on"));
    output("\n<b>Holopaint:</b> "+colorName(it));
    if(it.tnBare) addDisabledButton(0,"Holopaint","Holopaint","Turn the projector on first.");
    else addButton(0,"Holopaint",function(){ paintMenu(it); },"Holopaint","Recolor the board. Holopaint can change to any color, as often as you like.");
    if(it.tnBare) addButton(1,"Projector On",function(){ it.tnBare=false; projector(it,true); },"Projector On","Bring the holopaint back"+(it.tnLastColor?" ("+it.tnLastColor+")":"")+".");
    else addButton(1,"Projector Off",function(){ it.tnBare=true; projector(it,false); },"Projector Off","Switch the holopaint off and ride on bare steel.");
    addButton(14,"Back",function(){ try{ it.returnToInventory(it); }catch(err){ mainGameMenu(); } },"Back","Go back to your inventory.");
  }
  function paintMenu(it){
    clearOutput(); clearMenu();
    output(header("Holopaint"));
    output("The board’s holopaint shimmers as your Codex wakes it up. Pick a palette, then a color.\n\n");
    it.colorOptionsDisplay(0,false,function(){ mainMenu(it); });
    addButton(14,"Back",function(){ mainMenu(it); },"Back","Keep the current color.");
  }
  function projector(it,on){
    clearOutput(); clearMenu();
    if(on){
      if(it.tnLastColor) it.color=it.tnLastColor;
      output("The projector hums, and holopaint ripples back across the deck. <b>Your Holoboard is "+colorName(it)+" again.</b>");
    }else{
      try{ var c=it.coloration(); if(c) it.tnLastColor=it.color; }catch(err){}
      output("The holopaint flickers and fades, leaving the board’s brushed steel deck bare. <b>Projector off.</b>");
    }
    addButton(0,"Next",function(){ mainMenu(it); });
  }

  // ---- Item
  function defineItems(req){
    var registry=req(54014).yq, names=req(18366).g, text=req(69289).m;
    var Hover=req(75318).s;   // the game's pink Hoverboard. Extending it keeps "instanceof" checks working.

    class TnHoloboard extends Hover{
      constructor(){
        super();
        this.stackSize=1;
        this.type=window.GLOBAL.GADGET;
        this.tnBare=false;
        this.tnLastColor="";
        this.shortName="Holobrd";
        this.longName="Anno’s Holoboard";
        names.addFullName(this.shortName,"Anno’s Holoboard");
        names.addTooltip(this.shortName,"A refurbished hoverboard coated in Anno’s holopaint.");
        this.basePrice=price;
        this.combatUsable=false;
        this.chameleon=true;
        this.hasDynamicProperties=true;
        this._isInteractable=true;
      }
      getClassName(){ return ITEM_CLASS; }
      static getClassName(){ return ITEM_CLASS; }
      // The game finds a hoverboard with inventory.hasItem(Hoverboard), which asks every item
      // "is(Hoverboard)". Say yes, so the Holoboard does everything the pink board does.
      is(e){
        if(e===Hover || e==="Hoverboard") return true;
        return Hover.prototype.is.call(this,e);
      }
      get description(){
        var c=""; try{ c=colorName(this); }catch(err){}
        return c==="bare steel" ? "a bare steel hoverboard" : text.indefiniteArticle((c&&c!=="factory pink"?c+" ":"")+"holoboard");
      }
      set description(v){}
      get tooltip(){
        var c="factory pink"; try{ c=colorName(this); }catch(err){}
        return "A hoverboard Anno rescued from a scrap bin and rebuilt from the deck up: new thrusters, new gyros and a brushed steel deck. Then she coated it in her own invention, holopaint, so it can change color as often as you like, or show bare steel with the projector off.\n\nSo long as you keep it in your inventory, you use it automatically to speed travel, just like any other hoverboard. Interact with it to recolor it."
          +"\n\n<b>Color Setting:</b> "+(text && text.toDisplayCase ? text.toDisplayCase(c) : c);
      }
      set tooltip(v){}
      interactAvailable(){
        if(inFight()) return {enabled:false,title:"Interact",tooltip:"Not in the middle of a fight."};
        return {enabled:true,title:"Interact",tooltip:"Holopaint and projector controls."};
      }
      interactFunction(){
        try{ window.setMainElement && window.setMainElement(1,true); }catch(err){}
        mainMenu(this);
      }
      canMergeWith(o){ return o===this; }
    }
    registry.registerClass(ITEM_CLASS,TnHoloboard);
    window.TnHoloboard=TnHoloboard;
  }

  function registerItems(tries){
    var chunks=self.webpackChunktits_html;
    if(!chunks || typeof chunks.push!=="function" || !window.GLOBAL){
      if(tries<120) setTimeout(function(){ registerItems(tries+1); },500);
      return;
    }
    chunks.push([["tn-holoboard-"+tries],{},function(req){
      try{ defineItems(req); }
      catch(err){
        console.warn("[TN] Holoboard couldn't register",err);
        if(tries<20) setTimeout(function(){ registerItems(tries+1); },1000);
      }
    }]);
  }
  registerItems(0);

  // ---- Anno's stock. Her shop (outpost and crew) is one function that ends in showShop.
  function isAnno(k){
    try{ return !!k && (k===window.anno || (typeof k.getClassName==="function" && k.getClassName()==="Anno")); }
    catch(err){ return false; }
  }
  function wrapShop(tries){
    if(typeof window.showShop!=="function"){
      if(tries<240) setTimeout(function(){ wrapShop(tries+1); },500);
      return;
    }
    if(window.showShop.__tnHoloboard) return;
    var orig=window.showShop;
    var wrapped=function(opts){
      try{
        if(modOn() && window.TnHoloboard && opts && isAnno(opts.shopkeeper) && Array.isArray(opts.items)){
          // Shekka's price for a pink board, after Anno's markup is applied on top.
          var shekkaMarkup=1.2, annoMarkup=1.2;
          try{ if(window.shekka && window.shekka.sellMarkup>0) shekkaMarkup=window.shekka.sellMarkup; }catch(err){}
          try{ if(opts.shopkeeper.sellMarkup>0) annoMarkup=opts.shopkeeper.sellMarkup; }catch(err){}
          price=Math.max(1,Math.round(PINK_BOARD_PRICE*shekkaMarkup/annoMarkup));
          if(opts.items.indexOf(window.TnHoloboard)<0) opts.items.push(window.TnHoloboard);   // the shop calls "new" itself
        }
      }catch(err){ console.warn("[TN] Holoboard stock failed",err); }
      return orig.apply(this,arguments);
    };
    wrapped.__tnHoloboard=true;
    Object.keys(orig).forEach(function(key){ try{ wrapped[key]=orig[key]; }catch(e){} });
    window.showShop=wrapped;
  }
  wrapShop(0);

  // ---- Showcase: the next time you walk up to Anno (outpost or crew), once per save.
  function shouldShow(){
    try{
      return modOn() && window.TnHoloboard && window.flags && window.flags[SHOWN_FLAG]===undefined && !inFight();
    }catch(err){ return false; }
  }
  function showcase(back){
    window.flags[SHOWN_FLAG]=1;
    var crew=false;
    try{ crew=!!(window.anno && anno.isCrew && anno.isCrew()); }catch(err){}
    clearOutput(); clearMenu();
    try{ anno.showAll(); }catch(err){ try{ showName("\nANNO"); }catch(e){} }
    try{ author("Techy-Nest"); }catch(err){}
    output("Before you can even say hello, Anno pops up with her tail going a mile a minute. <i>“Boss! Perfect timing. C’mere, you have to see this.”</i>");
    output("\n\nShe ducks "+(crew?"into her cabin":"behind the counter")+" and comes back hugging a hoverboard to her chest. It’s one of the old kind, but the thrusters look brand new, and the deck is a smooth, brushed steel. <i>“Found it in a scrap bin, if you can believe it. New gyros, new thrusters, the works. But that’s not the cool part.”</i>");
    output("\n\nShe taps something under the deck. The steel ripples, then floods with color: pink, then electric blue, then a deep, glittering violet that swirls like an oil slick. <i>“Holopaint!”</i> she beams. <i>“My own recipe. A thin projector film over the whole thing, so you can make it any color you like, whenever you like. Or turn it off and show off that gorgeous steel.”</i>");
    output("\n\nShe sets it on the "+(crew?"deck":"counter")+" and gives it a little spin. <i>“I made a few. A holoboard like this oughta go for twice what Shekka gets for one of her pink boards, but for you? Permanent half-off. So same price as hers. Boss’s discount.”</i> She winks. <i>“They’re in my shop whenever you want one.”</i>");
    output("\n\n(<b>Anno’s Holoboard</b> is now in Anno’s shop.)");
    addButton(0,"Shop",function(){
      try{ window.annoShop(crew); }catch(err){ back(); }
    },"Shop","See what Anno has for sale.");
    addButton(1,"Next",back,"Next","Say hi to Anno properly.");
  }
  function wrapApproach(name,tries){
    var fn=window[name];
    if(typeof fn!=="function"){
      if(tries<240) setTimeout(function(){ wrapApproach(name,tries+1); },500);
      return;
    }
    if(fn.__tnHoloboard) return;
    var wrapped=function(){
      var self=this, args=arguments;
      var back=function(){ return fn.apply(self,args); };
      if(shouldShow()){
        try{ return showcase(back); }
        catch(err){ console.warn("[TN] Holoboard showcase failed",err); }
      }
      return back();
    };
    wrapped.__tnHoloboard=true;
    window[name]=wrapped;
  }
  wrapApproach("repeatAnnoApproach",0);    // Steele Tech outpost on Tarkus
  wrapApproach("annoFollowerApproach",0);  // aboard your ship

  // ---- Mod Menu entry
  function register(tries){
    if((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")){
      if(tries<120) setTimeout(function(){ register(tries+1); },500);
      return;
    }
    window.registerModMenu({
      id:MOD_ID,
      name:"Anno's Holoboard",
      author:"Techy-Nest",
      description:"A holopainted hoverboard sold by Anno (Tarkus outpost or crew). Works as a real hoverboard; recolor it with Interact. Off = not stocked and no showcase scene.",
      supportsToggle:true,
      defaultEnabled:true,
      getHtml:function(){
        var shown=false;
        try{ shown=window.flags && window.flags[SHOWN_FLAG]!==undefined; }catch(err){}
        var html="<b>Sold by:</b> Anno (Steele Tech outpost on Tarkus, or your ship once she's crew).\n<b>Price:</b> what Shekka charges for a pink hoverboard.\n<b>Cheats:</b> Options → Cheats → Items, search \"holo\".";
        html+="\n\n<b>Anno's showcase:</b> "+(shown?"seen in this save.":"plays the next time you talk to Anno.");
        if(shown) html+='<button type="button" data-mod-act="replay">Show it again next visit</button>';
        return html;
      },
      onAct:function(act){
        if(act==="replay"){ try{ delete window.flags[SHOWN_FLAG]; }catch(err){} return true; }
        return false;
      }
    });
  }
  register(0);
})();
