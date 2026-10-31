# DrakoHornitol - independent draconic horn-growing pill.
# Install alongside Drakongaru_Lessau_v2.mod (or its horn-free successor).
# Requires the same TiTS main.js and Lessau shop anchor as Drakongaru (updated for 0.9.166).
# Only characters with penis anatomy and without a vagina can use it.
# Repeated doses grow existing draconic horns by 1-3 inches, up to 24 inches.

Replace [main.js]:
16969:(e,t,o)=>
With:
9912347:(e,t,o)=>{"use strict";
o.d(t,{D:()=>DrakoHornitol});
const BaseItem=o(95164).Jo;
const names=o(18366).g;
const registry=o(54014).yq;
class DrakoHornitol extends BaseItem {
  constructor(){
    super();
    this.stackSize=10;
    this.type=GLOBAL.PILL;
    this.shortName="DrakoHornitol";
    this.longName="DrakoHornitol pill";
    this.description="a dark green DrakoHornitol pill";
    this.tooltip="A modified Hornitol capsule that encourages a pair of draconic horns to sprout and grow. Additional doses lengthen existing draconic horns. Formulated for people with a penis and no vagina; it does not modify gender identity or genital anatomy. Does not replace horns of another type.";
    this.basePrice=1500;
    names.addFullName(this.shortName,this.longName);
    names.addTooltip(this.shortName,this.tooltip);
  }
  static getClassName(){return "DrakoHornitol";}
  getClassName(){return DrakoHornitol.getClassName();}
  useFunction(p){
    if((window.tnModMenuActive===true&&typeof window.isTnModEnabled==="function")&&!window.isTnModEnabled("tn.drakoHornitol")){
      clearOutput();showName("DrakoHornitol");output("DrakoHornitol is disabled in the Mod Menu. The pill remains unused.");return false;
    }
    clearOutput();
    showBust("");
    showName("DrakoHornitol");
    author("KittyPatcher custom mod");
    if(!p || p.getClassName()!=="PlayerCharacter"){
      output("The capsule is formulated for Steele, and has no effect on this subject.");
      return false;
    }
    if(typeof p.hasCock!=="function" || !p.hasCock() ||
       typeof p.hasVagina!=="function" || p.hasVagina()){
      output("You inspect the prescription warning: DrakoHornitol's microsurgeons require penile anatomy without a vagina. The capsule remains unused.");
      return false;
    }
    const G=GLOBAL;
    const count=Number(p.horns)||0;
    if(count>0 && p.hornType!==G.TYPE_DRACONIC){
      output("You already have a different kind of horn. DrakoHornitol won't overwrite it, so you put the capsule away.");
      return false;
    }
    if(p.hornType!==G.TYPE_DRACONIC || count===0){
      p.hornType=G.TYPE_DRACONIC;
      p.horns=2;
      p.hornLength=2;
      output("You swallow the dark green capsule. Heat prickles across your brow before two sturdy draconic horns curl upward from your skull. <b>You now have a pair of two-inch dragon horns!</b>");
    } else if(count<2){
      p.horns=2;
      p.hornLength=Math.max(2,Number(p.hornLength)||0);
      output("The capsule's microsurgeons focus on the asymmetry atop your head. A second dragon horn emerges to match its twin! <b>You now have a pair of draconic horns.</b>");
    } else {
      const current=Math.max(0,Number(p.hornLength)||0);
      const maximum=24;
      if(current>=maximum){
        output("A warm pulse runs through your impressive draconic horns, but they're already as long as this formula can safely make them. The capsule remains unused.");
        return false;
      }
      const growth=1+rand(3);
      const next=Math.min(maximum,current+growth);
      p.hornLength=next;
      output("A familiar warmth spreads through your horns as the microsurgeons add dense new material to both of them. <b>Your draconic horns lengthen by "+(next-current)+" inch"+(next-current===1?"":"es")+", reaching "+next+" inches!</b>");
    }
    if(typeof processTime==="function") processTime(5);
    return false;
  }
}
registry.registerClass(DrakoHornitol.getClassName(),DrakoHornitol);
},16969:(e,t,o)=>

Replace [content_uveto.js]:
window.showShop({items:e,shopkeeper:new vi.d})
With:
((window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function")||window.isTnModEnabled("tn.drakoHornitol"))&&e.push(o(9912347).D),window.showShop({items:e,shopkeeper:new vi.d})

Add Javascript:
(function () {
  function register() {
    if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return false;
    window.registerModMenu({ id: "tn.drakoHornitol", name: "DrakoHornitol", author: "Kitty",
      description: "Sell/use the draconic horn-growth pills.", supportsToggle: true });
    return true;
  }
  if (!register()) { var n=0, t=setInterval(function(){if(register()||++n>=60)clearInterval(t);},1000); }
})();
