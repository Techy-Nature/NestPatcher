# DragoHornitol — standalone dragon-horn transformative for KittyPatcher TiTS.
# Updated for TiTS 0.9.166: main.45162d27.js and content_uveto.2c153e40.js.
# Only affects horns; does not check race or modify other body parts.
# Uses its own module ID (9912348). Drakongaru uses 9912346 and DrakoHornitol 9912347.

Rep [main.js]:
16969:(e,t,o)=>{
W:
9912348:(e,t,o)=>{"use strict";
o.d(t,{D:()=>DragoHornitol});
const BaseItem=o(95164).Jo;
const names=o(18366).g;
const registry=o(54014).yq;
class DragoHornitol extends BaseItem {
  constructor(){
    super();
    this.stackSize=10;
    this.type=GLOBAL.PILL;
    this.shortName="DragoHornucopia";
    this.longName="chocolate pudding cup of DragoHornucopia";
    this.description="a chocolate pudding cup of micro-surgeon enhanced DragoHornucopia";
    this.tooltip="A targeted transformative serum-laced chocolate pudding that gives you a pair of dragon horns, regardless of your other traits. Further servings lengthen existing dragon horns, up to 16 inches. Does not change anything else- just the horns you have.";
    this.basePrice=350;
    names.addFullName(this.shortName,this.longName);
    names.addTooltip(this.shortName,this.tooltip);
  }
  static getClassName(){return "DragoHornitol";}
  getClassName(){return DragoHornitol.getClassName();}
  useFunction(target){
    if(!target || typeof target.getClassName!=="function" || target.getClassName()!=="PlayerCharacter"){
      clearOutput();output("DragoHornitol is meant for " + [pc.name] + ".");return false;
    }
    if((window.tnModMenuActive===true&&typeof window.isTnModEnabled==="function") && !window.isTnModEnabled("tn.dragohornitol")){
      clearOutput();output("DragoHornitol is disabled in Android Mods. Enable it to use this chcolate pudding serum.");return false;
    }
    clearOutput();showBust("");showName("DragoHornitol");author("TechyNest");
    const p=target, G=GLOBAL;
    const MAX_LENGTH=16;
    const count=Number(p.horns)||0;
    const length=Number(p.hornLength)||0;
    // No racial restriction: does not inspect p.race or other transformations.
    // Dragon horns replace the current horn shape, if any; other traits remain unchanged.
    if(p.hornType!==G.TYPE_DRACONIC || count===0){
      p.hornType=G.TYPE_DRACONIC;
      p.horns=Math.max(2,count);
      p.hornLength=Math.max(2,length);
      output("A warm pressure builds along your forehead. Two pronounced, draconic horns emerge, curving proudly from your head. The rest of your body remains unchanged.");
    } else if(count<2){
      p.horns=2;
      p.hornLength=Math.max(2,length);
      output("A warm pressure builds on the bare side of your forehead. A second draconic horn pushes free to match the first, curving proudly from your head.");
    } else if(length>=MAX_LENGTH){
      output("You scarf down the DragoHornitol chocolate pudding serum. A pleasant warmth hums through your dragon horns, but they're already as long as this serum can make them. Nothing changes.");
      return false;
    } else {
      const next=Math.min(MAX_LENGTH,length+1+rand(3));
      const grown=next-length;
      p.hornLength=next;
      output("You scarf down the DragoHornitol pudding serum. Heat gathers at the base of your dragon horns as the microsurgeons layer on dense new material. <b>Your draconic horns lengthen by "+grown+" inch"+(grown===1?"":"es")+", reaching "+next+" inches!</b>");
    }
    return false;
  }
}
registry.registerClass(DragoHornitol.getClassName(),DragoHornitol);},16969:(e,t,o)=>{

Rep [content_uveto.js]:
window.showShop({items:e,shopkeeper:new vi.d})
W:
((window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled("tn.dragohornitol")) && e.push(o(9912348).D),window.showShop({items:e,shopkeeper:new vi.d})

Add Javascript:
(function(){
  "use strict";
  if(window.__tnDragoHornitolRegistered) return;
  window.__tnDragoHornitolRegistered=true;
  // Retry for up to 2 minutes; stop after 3 seconds if no TN menu is running.
  function register(tries){
    tries=tries||0;
    if((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")){
      if(!(window.tnModMenuActive===false && tries>=6) && tries<240) setTimeout(function(){ register(tries+1); },500);
      return;
    }
    window.registerModMenu({
      id:"tn.dragohornitol",
      name:"DragoHornitol",
      author:"KittyPatcher custom mod by TechyNest",
      description:"Dragon horns for player Steeles of any race. Disabling hides future Lessau shop stock and prevents the use of this microsurgeon, serum-laced pudding; existing horns are not reversed.",
      supportsToggle:true
    });
  }
  register();
})();
