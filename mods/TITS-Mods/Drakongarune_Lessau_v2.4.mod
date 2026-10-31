# Drakongaru v3 - Lessau shop + inventory item + "drakongaru" species name
# Canon target form: wolf-based dragon hybrid (a dragon werewolf).
# Checked against TiTS 0.9.167: main.d3448d52.js and content_uveto.feeb5a00.js (Lessau's shop is still vi.d).
# v3: the game now names a PC with the pill's form a "drakongaru" (see the Add Javascript block),
#     optional: Android Mods > Drakongaru > Species name "drakongaru" (on by default),
#     and the pill gives a pair of wings (wingCount 2) like the game's own dragon wings.
# Works alongside DrakoHornitol.mod, TN_PhoenixThunderbird.js and TN_Chimerune.mod in any order.
# This is still an exact-text KittyPatcher mod and should be tested on a backup save first.

Rep [main.js]:
16969:(e,t,o)=>{
W:
9912346:(e,t,o)=>{"use strict";
o.d(t,{D:()=>Drakongaru});
const BaseItem=o(95164).Jo;
const names=o(18366).g;
const registry=o(54014).yq;

class Drakongaru extends BaseItem {
  constructor(){
    super();
    this.stackSize=10;
    this.type=GLOBAL.PILL;
    this.shortName="Drakongaru";
    this.longName="Drakongarune pill";
    this.description="a Drakongarune grey pill";
    this.tooltip="A Lessau-designed dragon-wolf chimera pill, grey in color, that pushes the body toward a wolf-based dragon hybrid: furred body, lupine head, digitigrade hind legs, huge claws, draconic wings, and an exceptionally long wolf tail. It also sheds head hair in favor of fur and, like Lupinol, leaves an alpha's scent. The pill is tastefully designed, with black scales and fur patterns indented and lined on its surface.";
    this.basePrice=950;
    names.addFullName(this.shortName,this.longName);
    names.addTooltip(this.shortName,this.tooltip);
  }

  static getClassName(){return "Drakongaru";}
  getClassName(){return Drakongaru.getClassName();}

  useFunction(target){
    // An existing pill may still be in inventory after this mod is disabled.
    // Keep the class registered for save compatibility, but block its effects.
    if ((window.tnModMenuActive===true&&typeof window.isTnModEnabled==="function") && !window.isTnModEnabled("drakongaru")) {
      clearOutput();
      output("Drakongaru is disabled in Android Mods. Re-enable it in Options to use this pill.");
      return false;
    }
    if(!target || target.getClassName()!=="PlayerCharacter"){
      clearOutput();
      output("The serum has no effect.");
      return false;
    }

    clearOutput();
    showBust("");
    showName("Drakongaru");
    author("KittyPatcher custom mod");
    output("You pop Lessau's fur- and scale-indented grey pill. Heat rolls through your body, followed by an odd mix of predatory sharpness and draconic power as the chimera brew starts rewriting you.");

    const p = target;
    const G = GLOBAL;
    const tasks = [];
    const allowedFur = ["white","grey","gray","dark grey","dark gray","black","tan","brown"]; // both spellings: the pill itself sets "dark gray"
    const currentFur = (p.furColor || "").toLowerCase();

    function setOutput(txt){ output("\n\n" + txt); }

    // 1) Keep / establish a furred wolf body first.
    if(p.skinType !== G.SKIN_TYPE_FUR){
      tasks.push(()=>{
        p.skinType = G.SKIN_TYPE_FUR;
        if(!allowedFur.includes(currentFur) || !p.furColor) p.furColor = "dark gray";
        setOutput("A furred pelt spreads over your body, leaving you covered in soft, healthy fluff");
      });
    }

    // 2) Wolf muzzle / head.
    if(p.faceType !== G.TYPE_LUPINE){
      tasks.push(()=>{
        p.faceType = G.TYPE_LUPINE;
        if(p.faceFlags) p.faceFlags = [];
        if(typeof p.addFaceFlag === "function") p.addFaceFlag(G.FLAG_MUZZLED);
        setOutput("Your features pull forward into a lupine muzzle, your face settling into a distinctly wolfish mold.");
      });
    }

    // 3) Wolf ears.
    if(p.earType !== G.TYPE_LUPINE){
      tasks.push(()=>{
        p.earType = G.TYPE_LUPINE;
        if(typeof p.clearEarFlags === "function") p.clearEarFlags();
        if(typeof p.addEarFlag === "function"){
          p.addEarFlag(G.FLAG_TAPERED);
          p.addEarFlag(G.FLAG_FURRED);
        }
        setOutput("Your ears crawl upward and sharpen into perked lupine points.");
      });
    }

    // 4) No hair: the pelt covers the scalp (and any beard) instead.
    const hasHeadHair = typeof p.hasHair === "function" ? p.hasHair() : Number(p.hairLength) > 0;
    if(hasHeadHair || Number(p.beardLength) > 0){
      tasks.push(()=>{
        if(hasHeadHair){
          if(typeof p.hairLengthUnlocked === "function" && !p.hairLengthUnlocked(0)){
            setOutput(p.hairLengthLockedMessage());
            return;
          }
          p.hairLength = 0;
        }
        if(Number(p.beardLength) > 0) p.beardLength = 0;
        setOutput("Your scalp prickles, then itches fiercely. Your [pc.hairNoun] comes away in loose clumps at the lightest touch until nothing is left but the same short, sleek fur that covers the rest of you. <b>You no longer have any hair.</b>");
      });
    }

    // 5) Digitigrade hind legs / paws.
    if(p.legType !== G.TYPE_LUPINE){
      tasks.push(()=>{
        p.legType = G.TYPE_LUPINE;
        p.legFlags = [G.FLAG_DIGITIGRADE, G.FLAG_FURRED,G.FLAG_BIPEDAL];
        setOutput("Your lower body reshapes into powerful digitigrade wolf-legs, leaving you with springy hind paws built for prowling.");
      });
    }

    // 6) Front paws / arms with very large claws.
    // Paw pads (FLAG_PAWS) make the appearance screen mention them (and TN_UpperBodyFix.mod
    // uses them to describe forepaws instead of "the usual hands"). Earlier versions
    // of this pill left them out, so wolf arms without pads are finished too.
    const pawed = typeof p.hasArmFlag === "function" && p.hasArmFlag(G.FLAG_PAWS);
    if(p.armType !== G.TYPE_LUPINE || !pawed){
      tasks.push(()=>{
        p.armType = G.TYPE_LUPINE;
        p.armFlags = [];
        if(typeof p.addArmFlag === "function"){
          p.addArmFlag(G.FLAG_FURRED);
          p.addArmFlag(G.FLAG_PAWS);
        }
        setOutput("Your arms and forepaws take on a more lupine form. Soft, dark pads swell across your palms and fingertips, and heavy claws slide from your digits, long and vicious, with it being likely that they could tuck away when relaxed. You relax your paws after the transformation finishes, and it seems they've done just that.");
      });
    }

    // 7) Large draconic wings, a pair (the game's own dragon wings are wingCount 2).
    //    Wings from older versions of this pill may have no count; that is fixed for free.
    if(p.wingType === G.TYPE_DRACONIC && !(Number(p.wingCount) >= 2)) p.wingCount = 2;
    if(p.wingType !== G.TYPE_DRACONIC){
      tasks.push(()=>{
        p.wingType = G.TYPE_DRACONIC;
        if(!(Number(p.wingCount) >= 2)) p.wingCount = 2;
        setOutput("A hot pressure builds between your shoulders making you cry out in surprise, before leathery draconic wings burst forth, broad and powerful.");
      });
    }

    // 8) One exceptionally long wolf tail. The game has no tail-length stat; its
    //    wolf tail is already flagged long, furred and fluffy, so the length is in the text.
    if(!p.hasTail || !p.hasTail() || p.tailType !== G.TYPE_LUPINE || p.tailCount !== 1){
      tasks.push(()=>{
        if(typeof p.tailTypeUnlocked === "function" && !p.tailTypeUnlocked(G.TYPE_LUPINE)){
          setOutput(typeof p.tailTypeLockedMessage === "function" ? p.tailTypeLockedMessage() : "Your tail twitches painfully, but some quirk of your locked biology keeps it from fully changing.");
          return;
        }
        if(typeof p.tailCountUnlocked === "function" && !p.tailCountUnlocked(1)){
          setOutput(typeof p.tailCountLockedMessage === "function" ? p.tailCountLockedMessage() : "Your tails twitch, but refuse to merge into one.");
          return;
        }
        if(typeof p.shiftTail === "function") p.shiftTail(G.TYPE_LUPINE,1);
        else { p.tailType = G.TYPE_LUPINE; p.tailCount = 1; }
        setOutput("The base of your spine prickles, then aches as something pours out of it and keeps on coming. A wolf tail unfurls behind you, thick with fur, and it doesn't stop until it nearly brushes the floor, far longer than any ausar's. It sways heavily with every step. <b>You now have an exceptionally long wolf tail.</b>");
      });
    }

    // 9) Palette normalization only if needed.
    if(!allowedFur.includes(currentFur)){
      tasks.push(()=>{
        p.furColor = "dark gray";
        setOutput("The color in your coat settles into a dark natural hue, somewhere between charcoal and storm-cloud gray.");
      });
    }

    // 10) Alpha Scent, the same perk Lupinol grants (same name, values and description),
    //     so anything in the game that checks for it treats both pills alike.
    if(typeof p.hasPerk === "function" && !p.hasPerk("Alpha Scent")){
      tasks.push(()=>{
        setOutput("You notice an odd scent in the air, before realizing it's coming from your own body. It's a mixture of " + p.mf("masculine musk","feminine fragrance") + " with something like honey, and a third piece you can't quite describe. It makes you feel confident and commanding, like you're an alpha wolf, master of your pack. Oh, you could definitely get used to smelling like this.");
        output("\n\n(<b>Perk Gained: Alpha Scent</b> - Your body exudes pheromones that give you a distinctively commanding scent.)");
        p.createPerk("Alpha Scent",0,0,0,0,"Your body produces pheromones that give you a distinctively commanding scent.");
      });
    }

    // Deterministic progression: first 3 missing traits per dose.
    if(tasks.length === 0){
      setOutput("The microsurgeons course through you, but find little to improve. You already match Lessau's intended wolf-dragon chimera form: <b>you are a drakongaru.</b>");
   }
    else {
      for(const job of tasks.slice(0,3)) job();
      setOutput("Whatever Lessau brewed into this pill, it feels markedly more focused than juggling separate wolf and dragon transformatives.");
    }

    return false;
  }
}

registry.registerClass(Drakongaru.getClassName(),Drakongaru);},16969:(e,t,o)=>{

Rep [content_uveto.js]:
window.showShop({items:e,shopkeeper:new vi.d})
W:
((window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function")||window.isTnModEnabled("drakongaru"))&&e.push(o(9912346).D),window.showShop({items:e,shopkeeper:new vi.d})

# Registers the item in Android Mods. The actual disable checks live in
# the two patched game locations above, not just in the menu display.
Add Javascript:
(function registerDrakongaruMenu(){
  // The "drakongaru" species name can be switched off on its own; the species block
  // below reads the same setting. Stored per device, default on.
  var NAME_SETTING="tn.drakongaru.speciesName";
  function nameOn(){
    try{ return localStorage.getItem(NAME_SETTING)!=="off"; }catch(err){ return true; }
  }
  function setNameOn(on){
    try{ localStorage.setItem(NAME_SETTING,on?"on":"off"); }catch(err){}
  }
  function register(){
    if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return false;
    window.registerModMenu({
      id: "drakongaru",
      name: "Drakongaru",
      author: "KittyPatcher custom mod",
      description: "Lessau's wolf-dragon chimera pill. Disabling hides it from future visits to Lessau's shop, blocks use of existing pills and turns off the \"drakongaru\" species name. Already-applied transformations remain.",
      supportsToggle: true,
      getHtml: function(){
        var on=nameOn();
        return "<b>Species name \"drakongaru\":</b> "+(on?"On":"Off")+
          "\nWith the pill's form (fur, wolf head and ears, no hair, digitigrade wolf legs, furred wolf arms, draconic wings, a wolf tail and Alpha Scent) the game calls you a <b>drakongaru</b>, a dragon werewolf. Draconic wings are required for the name. When off, the game names you as it would without this mod (usually lupine); the pill still works." +
          "<button data-mod-act=\"toggle-name\">"+(on?"Turn Off":"Turn On")+"</button>\n\n" +
          "Drakongaru is a wolf-dragon transformative sold by Dr. Lessau. Enabling the mod again makes the pill available on your next visit to his shop. Turning it off does not reverse changes already applied to your character.";
      },
      onAct: function(act){
        if(act==="toggle-name") setNameOn(!nameOn());
        return true;
      }
    });
    return true;
  }
  if (!register()) {
    // Handles installations where the menu's script is loaded later.
    var attempts = 0;
    var retry = setInterval(function(){
      attempts++;
      if (register() || attempts >= 30) clearInterval(retry);
    }, 500);
  }
})();

# Species name "drakongaru". The game names you after the best match in
# window.raceScoreObject. The table is frozen, so this copies it, adds "drakongaru"
# and swaps the copy in (TN_PhoenixThunderbird.js and TN_Chimerune.mod do the same,
# and each keeps the others' entries, so the load order doesn't matter).
Add Javascript:
(function drakongaruSpecies(){
  // Needs the mod on and the "Species name" setting from its Android Mods page on.
  function enabled(){
    var on=true;
    try{ on=localStorage.getItem("tn.drakongaru.speciesName")!=="off"; }catch(err){}
    return on && ((window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled("drakongaru"));
  }
  function findOwner(proto, method){
    while(proto && !Object.prototype.hasOwnProperty.call(proto,method)) proto=Object.getPrototypeOf(proto);
    return proto;
  }
  // Draconic wings are what make a drakongaru rather than a wolf, so every check needs
  // them. Without them the entry scores 0 and the game keeps calling you lupine.
  function hasDragonWings(G,c){
    return typeof c.hasWings === "function" && c.hasWings() && c.wingType === G.TYPE_DRACONIC;
  }
  function item(G, fn, score){
    return { score:score||1, func:function(c){
      try{ return !!(enabled() && hasDragonWings(G,c) && fn(c)); }catch(e){ return false; }
    }};
  }
  function bonus(G, fn, points){
    return { score:0, func:function(c){
      try{ return enabled() && hasDragonWings(G,c) && fn(c) ? points : 0; }catch(e){ return 0; }
    }};
  }
  function hookRace(){
    var table=window.raceScoreObject, G=window.GLOBAL, Reg=window.Serialization;
    if(!table || !G || !Reg || !Reg.RegisteredClasses || !Reg.RegisteredClasses.PlayerCharacter) return false;
    if(!table._tnDrakongaru){
      var descs=Object.getOwnPropertyDescriptors(table);
      descs.drakongaru={
        enumerable:true, configurable:true,
        get:function(){
          return {
            "Fur":item(G,function(c){ return c.skinType===G.SKIN_TYPE_FUR; }),
            "Lupine face":item(G,function(c){ return c.faceType===G.TYPE_LUPINE || c.faceType===G.TYPE_WORG; }),
            "Lupine ears":item(G,function(c){ return c.earType===G.TYPE_LUPINE; }),
            "No head hair":item(G,function(c){ return typeof c.hasHair==="function" ? !c.hasHair() : !(Number(c.hairLength)>0); }),
            "Lupine arms, furred":item(G,function(c){ return c.armType===G.TYPE_LUPINE && c.hasArmFlag(G.FLAG_FURRED); }),
            "Lupine legs, digitigrade":item(G,function(c){ return c.legType===G.TYPE_LUPINE && c.hasLegFlag(G.FLAG_DIGITIGRADE); }),
            "Lupine tail":item(G,function(c){ return c.hasTail(G.TYPE_LUPINE); }),
            "“Alpha Scent” perk":item(G,function(c){ return c.hasPerk("Alpha Scent"); }),
            // Worth 2, plus a tiny extra (0.001) so a drakongaru wins a tie with plain lupine.
            "Draconic wings":{ score:2, func:function(c){
              try{ return enabled() && hasDragonWings(G,c) ? 2.001 : 0; }catch(e){ return 0; }
            }},
            // Bonuses (worth nothing when missing), so a full wolf with dragon wings is still
            // a drakongaru even if they kept their hair. Horns come from DrakoHornitol.
            "(Bonus) Lupine or canine eyes":bonus(G,function(c){ return [G.TYPE_LUPINE,G.TYPE_WORG,G.TYPE_CANINE].includes(c.eyeType); },1),
            "(Bonus) Canine tongue":bonus(G,function(c){ return c.tongueType===G.TYPE_CANINE; },1),
            "(Bonus) Draconic horns":bonus(G,function(c){ return Number(c.horns)>0 && c.hornType===G.TYPE_DRACONIC; },0.5)
          };
        }
      };
      var copy=Object.defineProperties({},descs);
      Object.defineProperty(copy,"_tnDrakongaru",{ value:true }); // not enumerable, so it isn't scored as a race
      window.raceScoreObject=Object.freeze(copy);
    }
    // New cocks grown later follow the species name; the game doesn't know
    // "drakongaru", so treat it like lupine (canine).
    var owner=findOwner(Reg.RegisteredClasses.PlayerCharacter.prototype,"getCockTypeForRace");
    if(owner && !owner.getCockTypeForRace._tnDrakongaru){
      var origCockType=owner.getCockTypeForRace;
      var newCockType=function(){
        try{ if(enabled() && typeof this.raceShort==="function" && this.raceShort()==="drakongaru") return G.TYPE_CANINE; }catch(e){}
        return origCockType.apply(this,arguments);
      };
      Object.keys(origCockType).forEach(function(key){ try{ newCockType[key]=origCockType[key]; }catch(e){} });
      newCockType._tnDrakongaru=true;
      owner.getCockTypeForRace=newCockType;
    }
    return true;
  }
  (function raceTick(tries){
    var done=false;
    try{ done=hookRace(); }catch(err){ console.warn("[TN] Drakongaru species hook failed",err); }
    if(!done && tries<720) setTimeout(function(){ raceTick(tries+1); },250);
  })(0);
})();
