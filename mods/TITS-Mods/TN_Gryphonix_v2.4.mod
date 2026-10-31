# Gryphonix - KittyPatcher custom item mod
# A gryphon transformative sold by Jade on Tavros.
# Each dose applies up to 3 of these changes, in this order:
#   1. Avian face with a beak            6. Avian (feathered, taloned) arms
#   2. Feathered skin (eagle colors)     7. Lion legs (digitigrade paws, fur)
#   3. Brown feathers for hair           8. Tufted lion tail
#   4. Large avian wings                 9. Feathered feline ears
#   5. Golden feline eyes               10. Barbed feline tongue
#  11. Lion cock(s), if you have any    12. Lion pussy/pussies, if you have any
# This matches the game's own built-in "griffin" race check, so a fully changed
# character is recognized as a griffin.
#
# No game-file patches: the item is created at startup and added to Jade's stock at
# runtime, so it doesn't clash with DragoHornitol's Jade patch.
# Toggle: Options -> Android Mods -> "Gryphonix". Off = not stocked and does nothing.
# Uses the 0.9.166 module IDs: 95164 (item base), 54014 (registry), 18366 (tooltips),
# 69289 (text utils). If a game update renames these, the item just won't appear.

Add Javascript:
(function(){
  "use strict";
  if(window.__tnGryphonixRegistered) return;
  window.__tnGryphonixRegistered=true;

  var MOD_ID="tn.gryphonix";
  var CLASS_NAME="Gryphonix";
  var SHOPKEEPER_CLASS="Jade";
  var PRICE=750;
  var CHANGES_PER_DOSE=3;

  // Eagle-style plumage. Feathers and lion fur share the game's fur color.
  var FEATHER_COLORS=["golden brown","tawny","chestnut","dark brown","bronze","white","black"];
  var EYE_COLORS=["gold","amber","golden"];
  var HAIR_COLOR="brown";   // color of the feather crest

  function modOn(){
    try{
      return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID);
    }catch(err){ return true; }
  }

  function pick(list){ return list[Math.floor(Math.random()*list.length)]; }

  // Returns true unless the game says that part is locked (some perks and states lock parts).
  function unlocked(pc, fnName, value){
    try{ return typeof pc[fnName]!=="function" || pc[fnName](value); }
    catch(err){ return true; }
  }
  function lockedMsg(pc, fnName, fallback){
    try{ if(typeof pc[fnName]==="function") return pc[fnName](); }catch(err){}
    return fallback;
  }

  // ---- The changes, in order. Each has: needed(pc) and apply(pc) -> text.
  function buildSteps(G){
    return [
      { name:"face",
        needed:function(pc){ return pc.faceType!==G.TYPE_AVIAN || !pc.hasFaceFlag(G.FLAG_BEAK); },
        apply:function(pc){
          pc.faceType=G.TYPE_AVIAN;
          pc.faceFlags=[G.FLAG_MUZZLED,G.FLAG_BEAK];
          pc.lipColor="gold";
          return "Your jaw aches, then stretches forward as your lips and nose harden together into a single hooked shape. Running your fingers over it, you find a sharp, glossy beak, curved like a raptor's, though it still lets you talk and eat easily. <b>You now have a gryphon's beaked face!</b>";
        }},
      { name:"feathers",
        needed:function(pc){ return pc.skinType!==G.SKIN_TYPE_FEATHERS || FEATHER_COLORS.indexOf(pc.furColor)===-1; },
        apply:function(pc){
          if(pc.skinType===G.SKIN_TYPE_FEATHERS){
            if(!unlocked(pc,"furColorUnlocked","golden brown")) return lockedMsg(pc,"furColorLockedMessage","Your feathers ripple, but their color holds.");
            var c0=pick(FEATHER_COLORS); pc.furColor=c0;
            return "Your feathers shiver and darken at the roots, the new color spreading to every tip like ink. <b>Your plumage is now "+c0+".</b>";
          }
          if(!unlocked(pc,"skinTypeUnlocked",G.SKIN_TYPE_FEATHERS)) return lockedMsg(pc,"skinTypeLockedMessage","Your skin prickles, but nothing comes of it.");
          var lead="";
          if(typeof pc.hasScales==="function" && (pc.hasScales() || pc.hasChitin())) lead="Your "+(pc.hasScales()?"scales":"chitin")+" loosen and flake away, leaving bare skin underneath for a moment. ";
          else if(pc.skinType===G.SKIN_TYPE_FUR) lead="Your fur sheds in great clumps, leaving bare skin underneath for a moment. ";
          var c=FEATHER_COLORS.indexOf(pc.furColor)!==-1 ? pc.furColor : pick(FEATHER_COLORS);
          pc.skinType=G.SKIN_TYPE_FEATHERS;
          if(typeof pc.clearSkinFlags==="function") pc.clearSkinFlags(); else pc.skinFlags=[];
          pc.furColor=c;
          return lead+"Tiny quills push up all over your body and unfurl into soft down, then sleek, overlapping "+c+" feathers, layered like an eagle's. <b>You're now covered in "+c+" feathers!</b>";
        }},
      { name:"hair",
        needed:function(pc){ return pc.hairType!==G.HAIR_TYPE_FEATHERS || pc.hairLength<=0 || pc.hairColor!==HAIR_COLOR; },
        apply:function(pc){
          if(pc.hairType===G.HAIR_TYPE_FEATHERS && pc.hairLength>0){
            pc.hairColor=HAIR_COLOR;
            return "Your head feathers ripple, the color draining from their roots and flooding back in a warm, earthy shade. <b>Your feather crest is now "+HAIR_COLOR+".</b>";
          }
          if(!unlocked(pc,"hairTypeUnlocked",G.HAIR_TYPE_FEATHERS)) return lockedMsg(pc,"hairTypeLockedMessage","Your scalp itches, but nothing changes.");
          pc.hairType=G.HAIR_TYPE_FEATHERS;
          pc.hairColor=HAIR_COLOR;
          if(pc.hairLength<4) pc.hairLength=4;
          return "Your scalp tingles as your hair stiffens, each strand splitting into vanes until a crest of proud, swept-back "+HAIR_COLOR+" feathers crowns your head. <b>You now have "+HAIR_COLOR+" feathers for hair!</b>";
        }},
      { name:"wings",
        needed:function(pc){ return pc.wingType!==G.TYPE_AVIAN || pc.wingCount<2; },
        apply:function(pc){
          var had=pc.wingType && pc.wingType!==G.TYPE_HUMAN && pc.wingCount>0;
          pc.shiftWings(G.TYPE_AVIAN,2);
          return (had?"Your old wings wither and shrink away into your back, and before you can mourn them, ":"A deep ache settles between your shoulder blades, and ")+"two heavy limbs burst out behind you. They unfold into broad, powerful wings, layered with long flight feathers like a great eagle's. <b>You now have large gryphon wings!</b>";
        }},
      { name:"eyes",
        needed:function(pc){ return pc.eyeType!==G.TYPE_FELINE && pc.eyeType!==G.TYPE_LION; },
        apply:function(pc){
          if(!unlocked(pc,"eyeTypeUnlocked",G.TYPE_FELINE)) return lockedMsg(pc,"eyeTypeLockedMessage","Your eyes sting for a moment, but nothing changes.");
          pc.eyeType=G.TYPE_FELINE;
          var c=pick(EYE_COLORS); pc.eyeColor=c;
          return "Your vision blurs, then snaps into razor focus. Distant details stand out sharply, and in a reflection you see slitted, "+c+" predator's eyes looking back. <b>You now have a gryphon's keen eyes!</b>";
        }},
      { name:"arms",
        needed:function(pc){ return pc.armType!==G.TYPE_AVIAN; },
        apply:function(pc){
          pc.armType=G.TYPE_AVIAN;
          pc.armFlags=[G.FLAG_PAWS,G.FLAG_FEATHERED];
          return "Your forearms tighten as the skin over your hands roughens into tough, scale-like plating. Your fingers stretch and curl into hooked, eagle-like talons, while feathers fringe your arms down to the wrists. <b>You now have a gryphon's taloned forelimbs!</b>";
        }},
      { name:"legs",
        needed:function(pc){ return pc.legType!==G.TYPE_LION; },
        apply:function(pc){
          if(!unlocked(pc,"legTypeUnlocked",G.TYPE_LION)) return lockedMsg(pc,"legTypeLockedMessage","Your legs twitch, but nothing changes.");
          if(pc.legCount<2){ pc.legCount=2; pc.genitalSpot=0; }
          pc.legType=G.TYPE_LION;
          pc.legFlags=[G.FLAG_DIGITIGRADE,G.FLAG_FURRED,G.FLAG_PAWS];
          return "Your legs buckle as the bones reshape, drawing up onto the balls of your feet. Short, sleek [pc.furColor] fur spreads over them, and your feet broaden into heavy, padded paws with retractable claws. <b>You now have a lion's hind legs!</b>";
        }},
      { name:"tail",
        needed:function(pc){ return pc.tailType!==G.TYPE_LION || pc.tailCount<1 || !pc.hasTailFlag(G.FLAG_TUFTED); },
        apply:function(pc){
          if(!unlocked(pc,"tailTypeUnlocked",G.TYPE_LION)) return lockedMsg(pc,"tailTypeLockedMessage","Your tailbone tingles, but nothing changes.");
          var had=typeof pc.hasTail==="function" && pc.hasTail();
          pc.shiftTail(G.TYPE_LION,1);
          pc.addTailFlag(G.FLAG_TUFTED);
          return (had?"Your tail"+(pc.tailCount>1?"s merge into one that":"")+" reshapes, stretching":"A pressure builds above your rear until a new tail pushes out, stretching")+" into a long, sleek lion's tail capped with a thick tuft. <b>You now have a tufted lion tail!</b>";
        }},
      { name:"ears",
        needed:function(pc){
          var catEars=pc.earType===G.TYPE_FELINE || pc.earType===G.TYPE_LION;
          return !catEars || !(pc.earFlags && pc.earFlags.indexOf(G.FLAG_FEATHERED)!==-1);
        },
        apply:function(pc){
          var catEars=pc.earType===G.TYPE_FELINE || pc.earType===G.TYPE_LION;
          if(catEars){
            // Already cat-eared: just fringe them with feathers.
            if(typeof pc.addEarFlag==="function") pc.addEarFlag(G.FLAG_FEATHERED); else pc.earFlags.push(G.FLAG_FEATHERED);
            return "Your ears prickle as fine feathers sprout along their edges, fringing them like a gryphon's. <b>Your ears are now feathered!</b>";
          }
          pc.earType=G.TYPE_FELINE;
          pc.earFlags=[G.FLAG_FEATHERED];
          return "Your ears burn and slide up your head, stretching into tall, pointed, catlike ears fringed with small feathers. <b>You now have a gryphon's feathered ears!</b>";
        }},
      { name:"tongue",
        needed:function(pc){ return pc.tongueType!==G.TYPE_FELINE; },
        apply:function(pc){
          // Same as the game's own feline tongue change: barbed, keeping length/dexterity.
          var wasLong=pc.hasTongueFlag(G.FLAG_LONG), wasPre=pc.hasTongueFlag(G.FLAG_PREHENSILE);
          pc.tongueType=G.TYPE_FELINE;
          pc.clearTongueFlags();
          pc.addTongueFlag(G.FLAG_NUBBY);
          if(wasLong) pc.addTongueFlag(G.FLAG_LONG);
          if(wasPre) pc.addTongueFlag(G.FLAG_PREHENSILE);
          return "Your tongue tingles and flattens, its surface prickling as tiny backward-facing barbs rise along it, rough as a big cat's. <b>You now have a bristly feline tongue!</b>";
        }},
      { name:"cocks",
        needed:function(pc){ return pc.hasCock() && pc.cocks.some(function(c){ return c.cType!==G.TYPE_LION; }); },
        apply:function(pc){
          var changed=0;
          for(var i=0;i<pc.cocks.length;i++){
            if(pc.cocks[i].cType===G.TYPE_LION || !pc.cockTypeUnlocked(i,G.TYPE_LION)) continue;
            pc.shiftCock(i,G.TYPE_LION); changed++;
          }
          if(!changed) return lockedMsg(pc,"cockTypeLockedMessage","Your groin tingles, but nothing changes.");
          var one=pc.cocks.length===1;
          return "A hot throb runs through your "+(one?"cock":"cocks")+" as "+(one?"it draws":"they draw")+" back into a new furred sheath. When "+(one?"it slides":"they slide")+" out again, "+(one?"it's":"they're")+" pink and lined with soft, fleshy barbs. <b>You now have "+(one?"a lion cock":"lion cocks")+"!</b>";
        }},
      { name:"vaginas",
        needed:function(pc){ return pc.hasVagina() && pc.vaginas.some(function(v){ return v.type!==G.TYPE_LION; }); },
        apply:function(pc){
          var changed=0;
          for(var i=0;i<pc.vaginas.length;i++){
            var v=pc.vaginas[i];
            if(v.type===G.TYPE_LION || !pc.vaginaTypeUnlocked(i,G.TYPE_LION)) continue;
            // The game's change resets wetness and tightness; keep the player's own values.
            var wet=v.wetnessRaw, minLoose=v.minLooseness;
            pc.shiftVagina(i,G.TYPE_LION);
            if(wet>v.wetnessRaw) v.wetnessRaw=wet;
            if(minLoose>v.minLooseness) v.minLooseness=minLoose;
            changed++;
          }
          if(!changed) return lockedMsg(pc,"vaginaTypeLockedMessage","Your groin tingles, but nothing changes.");
          var one=pc.vaginas.length===1;
          return "A slow, pulsing heat settles between your legs as your "+(one?"pussy reshapes itself":"pussies reshape themselves")+", the lips turning a soft pink and the inside growing feline-sensitive. <b>You now have "+(one?"a lion pussy":"lion pussies")+"!</b>";
        }}
    ];
  }

  function defineItem(req){
    var Base=req(95164).Jo, registry=req(54014).yq, names=req(18366).g, text=req(69289).m;
    var G=window.GLOBAL;

    class Gryphonix extends Base{
      constructor(){
        super();
        this.stackSize=10;
        this.type=G.PILL;
        this.shortName=CLASS_NAME;
        this.longName="Gryphonix";
        names.addFullName(this.shortName,text.toTitleCase(this.longName));
        this.description="a vial of Gryphonix";
        this.tooltip="A shimmering amber serum stamped with a stylized eagle-headed lion. Gryphonix rewrites its user into a classic gryphon: beak, feathers, eagle wings and taloned forelimbs up front, with a lion's powerful hind legs, tufted tail, barbed tongue and lion genitals behind. Changes come a few at a time, so it may take several doses.";
        names.addTooltip(this.shortName,this.tooltip);
        this.basePrice=PRICE;
      }
      getClassName(){ return CLASS_NAME; }
      static getClassName(){ return CLASS_NAME; }
      useFunction(target){
        clearOutput();
        if(!target || target.getClassName()!=="PlayerCharacter"){
          output((target?target.capitalA+target.short:"They")+" drinks the Gryphonix to no effect.");
          return false;
        }
        showBust(""); showName("Gryphonix"); author("Kitty mod");
        if(!modOn()){
          output("You uncap the vial, but the serum has gone inert. (Gryphonix is switched off in Options → Android Mods.)");
          return false;
        }
        output("You down the vial of Gryphonix. It tastes of honey and ozone, and a feverish warmth spreads out from your stomach.");
        var steps=buildSteps(G).filter(function(s){ return s.needed(target); });
        if(!steps.length){
          output("\n\nThe warmth settles comfortably and fades. You're already as much of a gryphon as Gryphonix can make you.");
          return false;
        }
        steps.slice(0,CHANGES_PER_DOSE).forEach(function(s){
          var t="";
          try{ t=s.apply(target); }catch(err){ console.warn("[TN] Gryphonix step failed: "+s.name, err); }
          if(t) output("\n\n"+(typeof ParseText==="function"?ParseText(t):t));
        });
        return false;
      }
    }
    registry.registerClass(CLASS_NAME,Gryphonix);
    window.TnGryphonix=Gryphonix;
  }

  // ---- Register the item at startup (also makes it show up in Cheats -> Items).
  function registerItem(tries){
    var chunks=self.webpackChunktits_html;
    if(!chunks || typeof chunks.push!=="function" || !window.GLOBAL){
      if(tries<120) setTimeout(function(){ registerItem(tries+1); },500);
      return;
    }
    chunks.push([["tn-gryphonix-"+tries],{},function(req){
      try{ defineItem(req); }
      catch(err){
        console.warn("[TN] Gryphonix couldn't register",err);
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
    if(window.showShop.__tnGryphonix) return;
    var orig=window.showShop;
    var wrapped=function(opts){
      try{
        var k=opts && opts.shopkeeper;
        if(modOn() && window.TnGryphonix && k && typeof k.getClassName==="function"
           && k.getClassName()===SHOPKEEPER_CLASS && Array.isArray(opts.items)){
          var have=opts.items.some(function(it){ return it && typeof it.getClassName==="function" && it.getClassName()===CLASS_NAME; });
          if(!have) opts.items.push(window.TnGryphonix);   // the shop expects the item class; it calls "new" itself
        }
      }catch(err){ console.warn("[TN] Gryphonix stock failed",err); }
      return orig.apply(this,arguments);
    };
    wrapped.__tnGryphonix=true;
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
      name:"Gryphonix",
      author:"Nova (KittyPatcher custom mod)",
      description:"Gryphon transformative sold by Jade on Tavros: beak, feathers, brown feather crest, eagle wings, talons, lion legs, tufted lion tail, feline tongue and lion genitals. Off = not stocked and the serum does nothing; existing changes stay.",
      supportsToggle:true,
      defaultEnabled:true
    });
  }
  register(0);
})();
