# Chimerune - KittyPatcher custom item mod (TiTS 0.9.167)
# Dr. Lessau's own chimera blend, sold in his shop on Uveto. It turns Steele into the
# same chimera Lessau is (from his Appearance text and his character data in main.js):
#   white fur, a lion's head and ears, a long orange mane with a mantle of orange fur
#   around the shoulders, lion arms with sharp claws, a second pair of arms, a naga's
#   black-scaled serpent tail instead of legs, massive black bull horns, white feathered
#   wings, slitted glowing amber eyes, a long flexible tongue, and a flared, barb-ringed
#   horse cock hidden in a genital slit. Vaginas become naleen (naga) ones, since Lessau
#   says the naleen are what made this blend able to breed.
# Each pill applies up to 3 of these changes, in this order:
#   1. White fur                     8. Two massive black bull horns
#   2. Lion face (muzzle)            9. Two white feathered wings
#   3. Lion ears                    10. Slitted, glowing amber feline eyes
#   4. Long orange mane + mantle    11. Long, prehensile tongue
#   5. Lion arms with claws         12. Flared, barb-ringed horse cock(s), if you have any
#   6. A second pair of arms        13. Genital slit, if you have a cock
#   7. Black-scaled naga tail       14. Naleen pussy/pussies, if you have any
# A fully changed character is named a "chimera" by the game's species check (new
# "chimera" entry in the race table), and new cocks grown later come in equine.
#
# Four arms: the game has no arm-count stat, so the second pair is the "Four-Armed"
# perk. With TN_UpperBodyFix.mod on, the Appearance screen says "four ... arms".
# Android Mods -> Chimerune has a setting to skip the extra arms and a button to lose them.
#
# Game patch: one main.js line, so a furred Regal Mane can have its own color (Lessau's
# mantle is orange while his fur is white). Without the patch the mane is fur-colored.
# The item itself is created at startup and added to Lessau's stock at runtime, so it
# doesn't clash with the Drakongaru, DragoHornitol or Ember Seed shop changes.
# Toggle: Options -> Android Mods -> "Chimerune". Off = not stocked and the pill does
# nothing; changes already made stay.
# Uses the 0.9.167 module IDs: 95164 (item base), 54014 (registry), 18366 (tooltips),
# 69289 (text utils). If a game update renames these, the item just won't appear.
# In-game author: Techy-Nest.

Rep [main.js]:
t+=" mane of fluffy, "+e.furColor+" fur"
W:
t+=" mane of fluffy, "+((window.tnManeColor&&window.tnManeColor(e))||e.furColor)+" fur"

Add Javascript:
(function(){
  "use strict";
  if(window.__tnChimeruneRegistered) return;
  window.__tnChimeruneRegistered=true;

  var MOD_ID="tn.chimerune";
  var CLASS_NAME="Chimerune";
  var SHOPKEEPER_CLASS="DrLessau";
  var PRICE=1800;
  var CHANGES_PER_DOSE=3;

  // Lessau's colors.
  var FUR_COLOR="white";
  var MANE_COLOR="orange";
  var SCALE_COLOR="black";
  var HORN_COLOR="black";
  var WING_COLOR="white";
  var EYE_COLOR="glowing amber";
  var HAIR_LENGTH=24;     // inches; his mane "cascades down his back"
  var HORN_LENGTH=14;     // inches; "massive" bull horns
  var ARMS_PERK="Four-Armed";
  var ARMS_PERK_DESC="You have a second pair of arms just below the first, on their own shoulders. They work independently, though now and then they mimic each other.";
  var MANE_STATUS="Mane Style";   // tooltip = mane color, read by the main.js patch
  var ARMS_SETTING="tn.chimerune.extraArms";

  function modOn(){
    try{
      return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID);
    }catch(err){ return true; }
  }

  // Grow the second pair of arms? Default on. Stored per device.
  function extraArmsOn(){
    try{ return localStorage.getItem(ARMS_SETTING)!=="off"; }catch(err){ return true; }
  }
  function setExtraArms(on){
    try{ localStorage.setItem(ARMS_SETTING,on?"on":"off"); }catch(err){}
  }

  // Returns true unless the game says that part is locked (some perks and states lock parts).
  function unlocked(pc, fnName){
    var args=Array.prototype.slice.call(arguments,2);
    try{ return typeof pc[fnName]!=="function" || pc[fnName].apply(pc,args); }
    catch(err){ return true; }
  }
  function lockedMsg(pc, fnName, fallback){
    try{ if(typeof pc[fnName]==="function") return pc[fnName](); }catch(err){}
    return fallback;
  }
  function tooltipOf(pc, status){
    try{ return pc.hasStatusEffect(status) ? pc.getStatusTooltip(status) : ""; }catch(err){ return ""; }
  }
  function setStyle(pc, status, value){
    if(!pc.hasStatusEffect(status)) pc.createStatusEffect(status);
    pc.setStatusTooltip(status,value);
  }

  // ---- Checks shared by the pill and the species table.
  function isLionHead(G,c){ return c.faceType===G.TYPE_LION || c.faceType===G.TYPE_FELINE; }
  function isLionEars(G,c){ return c.earType===G.TYPE_LION || c.earType===G.TYPE_FELINE; }
  function isLionArms(G,c){ return (c.armType===G.TYPE_LION || c.armType===G.TYPE_FELINE) && c.hasArmFlag(G.FLAG_FURRED); }
  function hasBullHorns(G,c){ return c.hornType===G.TYPE_BOVINE && c.horns>=2; }
  function hasFeatherWings(G,c){ return (c.wingType===G.TYPE_AVIAN || c.wingType===G.TYPE_DOVE) && c.wingCount>=2; }
  function hasManeOn(G,c){
    return c.hasPerk("Regal Mane") && c.perkv1("Regal Mane")===G.FLAG_FURRED;
  }
  function isChimeraCock(G,k){ return k.cType===G.TYPE_EQUINE && k.hasFlag(G.FLAG_FLARED) && k.hasFlag(G.FLAG_NUBBY); }

  // ---- The changes, in order. Each has: needed(pc) and apply(pc) -> text.
  function buildSteps(G){
    return [
      { name:"fur",
        needed:function(pc){ return pc.skinType!==G.SKIN_TYPE_FUR || pc.furColor!==FUR_COLOR; },
        apply:function(pc){
          if(pc.skinType===G.SKIN_TYPE_FUR){
            if(!unlocked(pc,"furColorUnlocked",FUR_COLOR)) return lockedMsg(pc,"furColorLockedMessage","Your fur ripples, but its color holds.");
            pc.furColor=FUR_COLOR;
            return "The color drains out of your fur from root to tip, leaving it a clean, snowy white. <b>Your fur is now "+FUR_COLOR+"!</b>";
          }
          if(!unlocked(pc,"skinTypeUnlocked",G.SKIN_TYPE_FUR)) return lockedMsg(pc,"skinTypeLockedMessage","Your skin prickles, but nothing comes of it.");
          var lead="";
          if(pc.skinType===G.SKIN_TYPE_SCALES || pc.skinType===G.SKIN_TYPE_CHITIN) lead="Your "+(pc.skinType===G.SKIN_TYPE_SCALES?"scales":"chitin")+" loosen and flake away, leaving bare skin underneath for a moment. ";
          else if(pc.skinType===G.SKIN_TYPE_FEATHERS) lead="Your feathers shed in drifts, leaving bare skin underneath for a moment. ";
          pc.skinType=G.SKIN_TYPE_FUR;
          if(typeof pc.clearSkinFlags==="function") pc.clearSkinFlags(); else pc.skinFlags=[];
          pc.furColor=FUR_COLOR;
          return lead+"A warm itch spreads across your whole body as a thin, sleek coat of fur sprouts everywhere at once, short over your muscles and soft to the touch. <b>You're now covered in "+FUR_COLOR+" fur!</b>";
        }},
      { name:"face",
        needed:function(pc){ return pc.faceType!==G.TYPE_LION; },
        apply:function(pc){
          pc.faceType=G.TYPE_LION;
          if(typeof pc.clearFaceFlags==="function") pc.clearFaceFlags();
          pc.faceFlags=[G.FLAG_FURRED,G.FLAG_MUZZLED];
          return "Your jaw aches, then pushes forward. Your nose flattens and darkens at the tip as a broad, short muzzle forms, and a row of long fangs settles in behind your lips. A reflection shows a proud, leonine face looking back. <b>You now have a lion's face!</b>";
        }},
      { name:"ears",
        needed:function(pc){ return pc.earType!==G.TYPE_LION; },
        apply:function(pc){
          if(typeof pc.clearEarFlags==="function") pc.clearEarFlags();
          pc.earType=G.TYPE_LION;
          pc.earFlags=[G.FLAG_FURRED];
          return "Your ears burn and slide up your head, rounding off into short, furry, rounded ears that swivel toward every sound. <b>You now have lion ears!</b>";
        }},
      { name:"mane",
        needed:function(pc){
          return pc.hairType!==G.HAIR_TYPE_REGULAR || pc.hairColor!==MANE_COLOR || pc.hairLength<HAIR_LENGTH
            || !hasManeOn(G,pc) || tooltipOf(pc,MANE_STATUS)!==MANE_COLOR;
        },
        apply:function(pc){
          var t="";
          var hairOk=pc.hairType===G.HAIR_TYPE_REGULAR && pc.hairColor===MANE_COLOR && pc.hairLength>=HAIR_LENGTH;
          if(!hairOk){
            if(!unlocked(pc,"hairTypeUnlocked",G.HAIR_TYPE_REGULAR) || !unlocked(pc,"hairLengthUnlocked",Math.max(HAIR_LENGTH,pc.hairLength))){
              t+=lockedMsg(pc,"hairTypeLockedMessage","Your scalp itches, but your hair refuses to change.");
            } else {
              pc.hairType=G.HAIR_TYPE_REGULAR;
              pc.hairColor=MANE_COLOR;
              if(pc.hairLength<HAIR_LENGTH) pc.hairLength=HAIR_LENGTH;
              t+="Your scalp tingles, then floods with heat as thick, coarse hair pours out of it, fiery orange and parted at your forehead. It doesn't stop until it cascades in a heavy mane down the center of your back.";
            }
          }
          if(!hasManeOn(G,pc) || tooltipOf(pc,MANE_STATUS)!==MANE_COLOR){
            pc.createRegalMane(G.FLAG_FURRED,"You have a thick mantle of orange fur around your shoulders and collar.");
            setStyle(pc,MANE_STATUS,MANE_COLOR);
            t+=(t?" ":"")+"The fur on your shoulders and collar thickens into a dense, fluffy mantle of orange, and matching bands of orange fur ring your wrists.";
          }
          return t+(t?" <b>You now have Lessau's orange mane!</b>":"");
        }},
      { name:"arms",
        needed:function(pc){ return pc.armType!==G.TYPE_LION || !pc.hasArmFlag(G.FLAG_FURRED) || pc.hasArmFlag(G.FLAG_PAWS); },
        apply:function(pc){
          if(typeof pc.clearArmFlags==="function") pc.clearArmFlags();
          pc.armType=G.TYPE_LION;
          pc.armFlags=[G.FLAG_FURRED];
          return "Your arms thicken with dense muscle under a layer of fur, while your hands stay lean and nimble. Your nails darken and curve into sharp, feline claws at every fingertip. <b>You now have a lion's arms and clawed hands!</b>";
        }},
      { name:"extra arms",
        needed:function(pc){ return extraArmsOn() && !pc.hasPerk(ARMS_PERK); },
        apply:function(pc){
          pc.createPerk(ARMS_PERK,0,0,0,0,ARMS_PERK_DESC);
          return "A deep, grinding ache spreads beneath your shoulder blades and down your sides. Your ribs flex and something pushes out from under your existing shoulders: a second set of shoulders, then a second pair of arms, unfolding until they hang just below the first, already furred and clawed to match. They twitch, flex, and then copy your other hands for a moment before you get them under control.\n\n(<b>Perk Gained: "+ARMS_PERK+"</b> - "+ARMS_PERK_DESC+")";
        }},
      { name:"naga tail",
        needed:function(pc){
          return !pc.isNaga() || pc.legType!==G.TYPE_NAGA
            || (pc.scaleColor!==SCALE_COLOR && unlocked(pc,"scaleColorUnlocked",SCALE_COLOR))
            || (pc.tailCount>0 && unlocked(pc,"tailCountUnlocked",0));
        },
        apply:function(pc){
          if(pc.legType===G.TYPE_NAGA && pc.isNaga()){
            var t="";
            if(pc.scaleColor!==SCALE_COLOR && unlocked(pc,"scaleColorUnlocked",SCALE_COLOR)){
              pc.scaleColor=SCALE_COLOR;
              t+="The scales of your serpent's tail darken to pitch black, save for a strip of white running down the front. <b>Your scales are now "+SCALE_COLOR+"!</b>";
            }
            if(pc.tailCount>0 && unlocked(pc,"tailCountUnlocked",0)){
              pc.tailCount=0; pc.tailType=0; pc.tailFlags=[];
              t+=(t?" ":"")+"Your other tail withers and draws back into your coils, leaving only the serpent's length behind you.";
            }
            return t;
          }
          if(!unlocked(pc,"legTypeUnlocked",G.TYPE_NAGA)) return lockedMsg(pc,"legTypeLockedMessage","Your legs twitch, but nothing changes.");
          if(!unlocked(pc,"legCountUnlocked",1)) return lockedMsg(pc,"legCountLockedMessage","Your legs twitch, but refuse to fuse.");
          var start=pc.legCount===1 ? "Your [pc.leg] abruptly goes weak, dropping you flat on your [pc.butt]. It twists and writhes" :
            "Your [pc.legs] abruptly go weak, dropping you flat on your [pc.butt] as they knot together into one fused mass of writhing flesh";
          pc.legCount=1;
          pc.legType=G.TYPE_NAGA;
          if(typeof pc.clearLegFlags==="function") pc.clearLegFlags();
          pc.legFlags=[G.FLAG_PREHENSILE,G.FLAG_TAPERED,G.FLAG_SMOOTH,G.FLAG_TENDRIL,G.FLAG_SCALED];
          if(unlocked(pc,"scaleColorUnlocked",SCALE_COLOR)) pc.scaleColor=SCALE_COLOR;
          // A naga's tail is its lower body, so any other tail goes, as on Lessau.
          var lostTail="";
          if(pc.tailCount>0 && unlocked(pc,"tailCountUnlocked",0)){
            pc.tailCount=0; pc.tailType=0; pc.tailFlags=[];
            lostTail=" Your old tail shrinks away into the new length.";
          }
          if(typeof pc.resetGenitalLocation==="function") pc.resetGenitalLocation(); else pc.genitalSpot=1;
          return start+", stretching longer and longer until it tapers to a point several yards away. Pitch black scales ripple across it, with a strip of white down the front."+lostTail+" You coil it beneath you without even thinking about it. <b>You now have a chimera's massive serpent tail instead of legs!</b>";
        }},
      { name:"horns",
        needed:function(pc){ return !hasBullHorns(G,pc) || pc.hornLength<HORN_LENGTH || tooltipOf(pc,"Horn Style")!==HORN_COLOR; },
        apply:function(pc){
          var had=hasBullHorns(G,pc);
          var hadOther=!had && pc.hornType && pc.horns>0;
          pc.hornType=G.TYPE_BOVINE;
          pc.horns=2;
          if(pc.hornLength<HORN_LENGTH) pc.hornLength=HORN_LENGTH;
          setStyle(pc,"Horn Style",HORN_COLOR);
          if(had) return "Your horns throb as they thicken, lengthen and darken to a glossy black, angling up and forward. <b>You now have a pair of massive, black bull horns!</b>";
          return (hadOther ? "Your old horns crack and fall away, and in their place " : "Two hard knots push up from under your [pc.hair], and ")+"a pair of massive black horns grow out from your head, angling up and forward like a bull's. <b>You now have a pair of massive, black bull horns!</b>";
        }},
      { name:"wings",
        needed:function(pc){ return pc.wingType!==G.TYPE_AVIAN || pc.wingCount<2 || tooltipOf(pc,"Wing Style")!==WING_COLOR; },
        apply:function(pc){
          var had=pc.wingType===G.TYPE_AVIAN && pc.wingCount>=2;
          var hadOther=!had && pc.wingType && pc.wingType!==G.TYPE_HUMAN && pc.wingCount>0;
          pc.shiftWings(G.TYPE_AVIAN,2,false,G.FLAG_FEATHERED,WING_COLOR);
          if(had) return "Your feathers molt in a sudden flurry and grow back a pristine white. <b>Your wings are now "+WING_COLOR+"!</b>";
          return (hadOther?"Your old wings wither and shrink away into your back, and before you can mourn them, ":"A deep ache settles between your shoulder blades, and ")+"two heavy limbs burst out behind you. They unfold into broad, powerful wings, layered with clean white flight feathers. <b>You now have white feathered wings!</b>";
        }},
      { name:"eyes",
        needed:function(pc){ return pc.eyeType!==G.TYPE_FELINE || pc.eyeColor!==EYE_COLOR; },
        apply:function(pc){
          if(!unlocked(pc,"eyeTypeUnlocked",G.TYPE_FELINE)) return lockedMsg(pc,"eyeTypeLockedMessage","Your eyes sting for a moment, but nothing changes.");
          pc.eyeType=G.TYPE_FELINE;
          if(unlocked(pc,"eyeColorUnlocked",EYE_COLOR)) pc.eyeColor=EYE_COLOR;
          return "Your vision blurs, then snaps into razor focus. Your pupils narrow into slits, and when you catch your reflection, your irises are lit from within with a soft amber glow. <b>You now have slitted, glowing feline eyes!</b>";
        }},
      { name:"tongue",
        needed:function(pc){ return !pc.hasTongueFlag(G.FLAG_LONG) || !pc.hasTongueFlag(G.FLAG_PREHENSILE); },
        apply:function(pc){
          pc.addTongueFlag(G.FLAG_LONG);
          pc.addTongueFlag(G.FLAG_PREHENSILE);
          return "Your tongue tingles and stretches, growing longer and more muscular until you can curl it around your fingers and squeeze. <b>You now have a long, flexible tongue!</b>";
        }},
      { name:"cocks",
        needed:function(pc){ return pc.hasCock() && pc.cocks.some(function(k){ return !isChimeraCock(G,k); }); },
        apply:function(pc){
          var changed=0;
          for(var i=0;i<pc.cocks.length;i++){
            var k=pc.cocks[i];
            if(isChimeraCock(G,k)) continue;
            if(!pc.cockTypeUnlocked(i,G.TYPE_EQUINE)) continue;
            if(k.cType!==G.TYPE_EQUINE) pc.shiftCock(i,G.TYPE_EQUINE);
            k.addFlag(G.FLAG_FLARED);
            k.addFlag(G.FLAG_BLUNT);
            k.addFlag(G.FLAG_NUBBY);
            // The game's horse cock comes sheathed; a slit replaces the sheath.
            if(pc.hasCrotchFlag(G.FLAG_GENITAL_SLIT) && k.hasFlag(G.FLAG_SHEATHED)) k.removeFlag(G.FLAG_SHEATHED);
            changed++;
          }
          if(!changed) return lockedMsg(pc,"cockTypeLockedMessage","Your groin tingles, but nothing changes.");
          var one=pc.cocks.length===1;
          return "A hot throb runs through your "+(one?"cock":"cocks")+" as "+(one?"it swells":"they swell")+" and reshape"+(one?"s":"")+". The head flattens and flares out like a stallion's, and a ring of soft, rubbery barbs rises around the flare. <b>You now have "+(one?"a chimera's flared, barbed horse cock":"chimera's flared, barbed horse cocks")+"!</b>";
        }},
      { name:"slit",
        needed:function(pc){ return pc.hasCock() && !pc.hasCrotchFlag(G.FLAG_GENITAL_SLIT); },
        apply:function(pc){
          pc.addCrotchFlag(G.FLAG_GENITAL_SLIT);
          // A slit replaces a sheath.
          pc.cocks.forEach(function(k){ if(k.hasFlag(G.FLAG_SHEATHED)) k.removeFlag(G.FLAG_SHEATHED); });
          var many=pc.cocks.length>1;
          return "There's a stirring in your loins. Your [pc.cocks] "+(many?"pulse":"pulses")+", then slowly "+(many?"withdraw":"withdraws")+" inward, inch by inch, as folds of skin close over "+(many?"them":"it")+" until nothing shows but a discreet seam. <b>You now have a genital slit!</b> It'll keep you well hidden, just like Lessau.";
        }},
      { name:"vaginas",
        needed:function(pc){ return pc.hasVagina() && pc.vaginas.some(function(v){ return v.type!==G.TYPE_NAGA; }); },
        apply:function(pc){
          var changed=0;
          for(var i=0;i<pc.vaginas.length;i++){
            var v=pc.vaginas[i];
            if(v.type===G.TYPE_NAGA || !pc.vaginaTypeUnlocked(i,G.TYPE_NAGA)) continue;
            // The game's change resets wetness and tightness; keep the player's own values.
            var wet=v.wetnessRaw, minLoose=v.minLooseness;
            pc.shiftVagina(i,G.TYPE_NAGA);
            if(wet>v.wetnessRaw) v.wetnessRaw=wet;
            if(minLoose>v.minLooseness) v.minLooseness=minLoose;
            changed++;
          }
          if(!changed) return lockedMsg(pc,"vaginaTypeLockedMessage","Your groin tingles, but nothing changes.");
          var one=pc.vaginas.length===1;
          return "A slow, pulsing heat settles in your groin as your "+(one?"pussy reshapes itself":"pussies reshape themselves")+", growing deeper and more flexible inside, just like a naleen's. <b>You now have "+(one?"a naleen pussy":"naleen pussies")+"!</b>";
        }}
    ];
  }

  function defineItem(req){
    var Base=req(95164).Jo, registry=req(54014).yq, names=req(18366).g, text=req(69289).m;
    var G=window.GLOBAL;

    class Chimerune extends Base{
      constructor(){
        super();
        this.stackSize=10;
        this.type=G.PILL;
        this.shortName=CLASS_NAME;
        this.longName="Chimerune pill";
        names.addFullName(this.shortName,text.toTitleCase(this.longName));
        this.description="a Chimerune pill";
        this.tooltip="Dr. Lessau's personal chimera blend, pressed into a white and orange pill etched with a lion's head, a serpent's coil and a feather. It remakes its user in the doctor's own image: white fur, a lion's head and orange mane, massive black bull horns, white feathered wings, clawed lion arms with a second pair below them, and a black-scaled serpent's tail in place of legs. It works a few changes at a time, so it may take several pills.";
        names.addTooltip(this.shortName,this.tooltip);
        this.basePrice=PRICE;
      }
      getClassName(){ return CLASS_NAME; }
      static getClassName(){ return CLASS_NAME; }
      useFunction(target){
        clearOutput();
        if(!target || target.getClassName()!=="PlayerCharacter"){
          output((target?target.capitalA+target.short:"They")+" swallows the Chimerune to no effect.");
          return false;
        }
        showBust(""); showName("Chimerune"); author("Techy-Nest");
        if(!modOn()){
          output("You turn the pill over in your fingers, but it's gone inert. (Chimerune is switched off in Options → Android Mods.)");
          return false;
        }
        output("You swallow Lessau's Chimerune. It goes down warm and leaves a taste of copper and spice, and a moment later the heat spreads out through every limb at once.");
        var steps=buildSteps(G).filter(function(s){ return s.needed(target); });
        if(!steps.length){
          output("\n\nThe warmth settles comfortably and fades. You're already as much of Lessau's chimera as Chimerune can make you.");
          return false;
        }
        steps.slice(0,CHANGES_PER_DOSE).forEach(function(s){
          var t="";
          try{ t=s.apply(target); }catch(err){ console.warn("[TN] Chimerune step failed: "+s.name, err); }
          if(t) output("\n\n"+(typeof ParseText==="function"?ParseText(t):t));
        });
        return false;
      }
    }
    registry.registerClass(CLASS_NAME,Chimerune);
    window.TnChimerune=Chimerune;
  }

  // ---- Register the item at startup (also makes it show up in Cheats -> Items).
  function registerItem(tries){
    var chunks=self.webpackChunktits_html;
    if(!chunks || typeof chunks.push!=="function" || !window.GLOBAL){
      if(tries<120) setTimeout(function(){ registerItem(tries+1); },500);
      return;
    }
    chunks.push([["tn-chimerune-"+tries],{},function(req){
      try{ defineItem(req); }
      catch(err){
        console.warn("[TN] Chimerune couldn't register",err);
        if(tries<20) setTimeout(function(){ registerItem(tries+1); },1000);
      }
    }]);
  }
  registerItem(0);

  // ---- Add to Lessau's stock whenever his shop opens.
  function wrapShop(tries){
    if(typeof window.showShop!=="function"){
      if(tries<240) setTimeout(function(){ wrapShop(tries+1); },500);
      return;
    }
    if(window.showShop.__tnChimerune) return;
    var orig=window.showShop;
    var wrapped=function(opts){
      try{
        var k=opts && opts.shopkeeper;
        if(modOn() && window.TnChimerune && k && typeof k.getClassName==="function"
           && k.getClassName()===SHOPKEEPER_CLASS && Array.isArray(opts.items)){
          var have=opts.items.some(function(it){ return it && typeof it.getClassName==="function" && it.getClassName()===CLASS_NAME; });
          if(!have) opts.items.push(window.TnChimerune);   // the shop expects the item class; it calls "new" itself
        }
      }catch(err){ console.warn("[TN] Chimerune stock failed",err); }
      return orig.apply(this,arguments);
    };
    wrapped.__tnChimerune=true;
    // Keep any flags other mods put on showShop.
    Object.keys(orig).forEach(function(key){ try{ wrapped[key]=orig[key]; }catch(e){} });
    window.showShop=wrapped;
  }
  wrapShop(0);

  // ---- Mane color for the Appearance screen (used by the main.js patch above).
  window.tnManeColor=function(c){
    try{
      if(c && typeof c.hasStatusEffect==="function" && c.hasStatusEffect(MANE_STATUS)) return c.getStatusTooltip(MANE_STATUS) || null;
    }catch(err){}
    return null;
  };

  // ---- Species name "chimera": the game names you after the best match in
  // window.raceScoreObject. The table is frozen, so copy it, add "chimera" and swap the
  // copy in (the Phoenix & Thunderbird mod does the same; either can load first).
  function findOwner(proto, method){
    while(proto && !Object.prototype.hasOwnProperty.call(proto,method)) proto=Object.getPrototypeOf(proto);
    return proto;
  }
  function hookRace(){
    var table=window.raceScoreObject, G=window.GLOBAL, Reg=window.Serialization;
    if(!table || !G || !Reg || !Reg.RegisteredClasses || !Reg.RegisteredClasses.PlayerCharacter) return false;
    if(!table._tnChimera){
      var descs=Object.getOwnPropertyDescriptors(table);
      function item(fn, score){ return { score:score||1, func:fn }; }
      descs.chimera={
        enumerable:true, configurable:true,
        get:function(){
          return {
            "Is a naga":item(function(c){ return c.isNaga(); },2),
            "Lion or feline face":item(function(c){ return isLionHead(G,c); }),
            "Lion or feline ears":item(function(c){ return isLionEars(G,c); }),
            "Fur":item(function(c){ return c.skinType===G.SKIN_TYPE_FUR; }),
            "Lion or feline arms, furred":item(function(c){ return isLionArms(G,c); }),
            "“Four-Armed” perk":item(function(c){ return c.hasPerk(ARMS_PERK); }),
            "Bovine horns, 2":item(function(c){ return hasBullHorns(G,c); }),
            "Feathered wings, 2":item(function(c){ return hasFeatherWings(G,c); }),
            "Feline eyes":item(function(c){ return c.eyeType===G.TYPE_FELINE; }),
            "Furred “Regal Mane”":item(function(c){ return hasManeOn(G,c); }),
            "Equine penis in a genital slit, or no penis":item(function(c){
              return !c.hasCock() || (c.cockTotal(G.TYPE_EQUINE)>0 && c.hasCrotchFlag(G.FLAG_GENITAL_SLIT));
            })
          };
        }
      };
      var copy=Object.defineProperties({},descs);
      Object.defineProperty(copy,"_tnChimera",{ value:true }); // not enumerable, so it isn't scored as a race
      window.raceScoreObject=Object.freeze(copy);
    }
    // New cocks grown later follow the species name; the game doesn't know "chimera".
    var owner=findOwner(Reg.RegisteredClasses.PlayerCharacter.prototype,"getCockTypeForRace");
    if(owner && !owner.getCockTypeForRace._tnChimera){
      var origCockType=owner.getCockTypeForRace;
      var newCockType=function(){
        try{ if(typeof this.raceShort==="function" && this.raceShort()==="chimera") return G.TYPE_EQUINE; }catch(e){}
        return origCockType.apply(this,arguments);
      };
      newCockType._tnChimera=true;
      Object.keys(origCockType).forEach(function(key){ try{ newCockType[key]=origCockType[key]; }catch(e){} });
      owner.getCockTypeForRace=newCockType;
    }
    return true;
  }
  (function raceTick(tries){
    var done=false;
    try{ done=hookRace(); }catch(err){ console.warn("[TN] Chimerune species hook failed",err); }
    if(!done && tries<720) setTimeout(function(){ raceTick(tries+1); },250);
  })(0);

  // ---- Four arms on the Appearance screen, through TN_UpperBodyFix's hook.
  (function armsTick(tries){
    var orig=window.tnUpperBody;
    if(typeof orig!=="function"){
      if(tries<240) setTimeout(function(){ armsTick(tries+1); },500);
      return;
    }
    if(orig._tnChimerune) return;
    var wrapped=function(c, you){
      var r=orig.apply(this,arguments);
      try{
        if(!c || typeof c.hasPerk!=="function" || !c.hasPerk(ARMS_PERK)) return r;
        if(!r) r=you ? " humanoid upper body with the usual torso, arms, hands, and fingers" : "your typical humanoid upper body: torso, arms, hands, and fingers";
        return r.replace("the usual torso","a torso").replace("your typical humanoid","a humanoid")
                .replace(/(torso, )(.*?)\barms\b/,"$1four $2arms");
      }catch(err){ return r; }
    };
    wrapped._tnChimerune=true;
    window.tnUpperBody=wrapped;
  })(0);

  // ---- Mod Menu entry
  function register(tries){
    if((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")){
      if(tries<120) setTimeout(function(){ register(tries+1); },500);
      return;
    }
    window.registerModMenu({
      id:MOD_ID,
      name:"Chimerune",
      author:"Techy-Nest (KittyPatcher custom mod)",
      description:"Dr. Lessau's chimera pill, sold in his shop on Uveto: white fur, lion head and arms, orange mane, four arms, black naga tail, black bull horns, white wings, glowing feline eyes, long tongue, barbed horse cock in a slit and naleen pussies. Off = not stocked and the pill does nothing; existing changes stay.",
      supportsToggle:true,
      defaultEnabled:true,
      getHtml:function(){
        var on=extraArmsOn();
        var has=false;
        try{ has=!!(window.pc && window.pc.hasPerk && window.pc.hasPerk(ARMS_PERK)); }catch(err){}
        var html="<b>Grow a second pair of arms:</b> "+(on?"On":"Off")+
          "\nWhen off, Chimerune skips the extra arms and makes every other change." +
          "<button data-mod-act=\"toggle-arms\">"+(on?"Turn Off":"Turn On")+"</button>\n\n";
        if(has) html+="Your Steele has four arms (the “"+ARMS_PERK+"” perk).<button data-mod-act=\"lose-arms\">Lose Extra Arms</button>";
        return html;
      },
      onAct:function(act){
        if(act==="toggle-arms") setExtraArms(!extraArmsOn());
        if(act==="lose-arms"){
          try{ if(window.pc && window.pc.hasPerk(ARMS_PERK)) window.pc.removePerk(ARMS_PERK); }catch(err){}
        }
        return true;
      }
    });
  }
  register(0);
})();
