# TN_ImplantSlots v1.0 - NestPatcher mod (TiTS 0.9.169). Desktop and Android.
# Lets Sabrae on Dhaal install up to three combat implants and three utility (sex)
# implants at once, instead of one of each. Needs TN_ImplantSlots_v1.0.js (the slot
# logic and the on/off switch). Without the .js file the game keeps one of each.
# @@x@@ is a NestPatcher wildcard, so each block matches the PC and Android builds.
#
# How it works:
#   - The implant holder gets slots 2 and 3 of each type. They save with your game.
#     Old saves load as they are; the new slots start empty.
#   - Sabrae fills the first free slot. When all three of a type are full, that
#     implant is greyed out in her list until she removes one. You can't install two
#     of the same implant, or both tail implants (Combat Tail and Armored Tail).
#   - Her removal menu has a button for every installed implant, plus All.
#   - Every place the game checks "is this implant installed?" now looks at all six
#     slots, so each implant works from any slot. Values the game reads off the
#     implant (MedImplants' threshold, Busty Bulwark's breast size, the Phallus
#     Tuner's length and so on) come from that implant, wherever it sits.
#   - Cybernetic Synchronization and the cyborg check count every implant you have.
#   - The stats page and the equipment screen show slots 2 and 3 when they're used.
#   - With the switch off (TN Mod Settings > Implant Slots), Sabrae goes back to one
#     of each and swaps like the base game. Extra implants you already have keep
#     working until she removes them.
#   - If you remove this mod, implants in slots 2 and 3 are lost from your save.
#     Have Sabrae take them out first if you want them back in slot 1.
# Written by Claude at TechyNest's behest. Checked against the 0.9.169 desktop files.

# ===== Core: three slots of each type =====

# ImplantSlots part 1 of 142: the extra slots on the implant holder
Rep [main.js]:
(@@e@@=@@t@@.call(this)).combatImplant=null,@@e@@.utilityImplant=null,@@e@@}
W:
(@@e@@=@@t@@.call(this)).combatImplant=null,@@e@@.utilityImplant=null,@@e@@.combatImplant2=null,@@e@@.combatImplant3=null,@@e@@.utilityImplant2=null,@@e@@.utilityImplant3=null,@@e@@}

# ImplantSlots part 2 of 142: the list of installed implants
Rep [main.js]:
{key:"asList",get:function(){return[this.combatImplant,this.utilityImplant]}}
W:
{key:"asList",get:function(){return[this.combatImplant,this.utilityImplant,this.combatImplant2,this.combatImplant3,this.utilityImplant2,this.utilityImplant3]}}

# ImplantSlots part 3 of 142: installing goes into the first free slot
Rep [main.js]:
{key:"equipImplant",value:function(@@e@@){var @@t@@=@@O@@[@@e@@.type];
W:
{key:"equipImplant",value:function(@@e@@){var @@t@@=window.tnISlot?window.tnISlot(this.equippedImplants,@@O@@[@@e@@.type]):@@O@@[@@e@@.type];

# ImplantSlots part 4 of 142: removing takes the implant out of the slot it is in
Rep [main.js]:
,@@o@@=@@O@@[null!==@@t@@?@@t@@:@@e@@.type];return @@e@@.quantity<=0&&(@@e@@.quantity=1),@@e@@.onUninstall(this.owner),this.equippedImplants[@@o@@]=null,@@e@@}
W:
,@@o@@=window.tnIFind?window.tnIFind(this.equippedImplants,@@e@@,@@O@@[null!==@@t@@?@@t@@:@@e@@.type]):@@O@@[null!==@@t@@?@@t@@:@@e@@.type];return @@e@@.quantity<=0&&(@@e@@.quantity=1),@@e@@.onUninstall(this.owner),this.equippedImplants[@@o@@]=null,window.tnICompact&&window.tnICompact(this.equippedImplants),@@e@@}

# ImplantSlots part 5 of 142: owning an implant counts every slot
Rep [main.js]:
.concat([this.equippedImplants.utilityImplant,this.equippedImplants.combatImplant]).find((function(@@t@@){return(null==@@t@@?void 0:@@t@@.type)===@@e@@.type}))
W:
.concat(this.equippedImplants.asList).find((function(@@t@@){return(null==@@t@@?void 0:@@t@@.type)===@@e@@.type&&@@t@@.getClassName()===@@e@@.getClassName()}))

# ImplantSlots part 6 of 142: an implant in any slot counts as installed
Rep [main.js]:
case GLOBAL.COMBAT_IMPLANT:return @@e@@.inventory.combatImplant===this;case GLOBAL.UTILITY_IMPLANT:return @@e@@.inventory.utilityImplant===this;
W:
case GLOBAL.COMBAT_IMPLANT:case GLOBAL.UTILITY_IMPLANT:return @@e@@.inventory.equippedImplants.asList.indexOf(this)>=0;

# ===== Effects that read a value from the implant =====

# ImplantSlots part 7 of 142: Ballistic Breast Liners defense
Rep [main.js]:
"BallisticBreastLiners"===this.inventory.combatImplant.getClassName()&&(@@e@@+=this.inventory.combatImplant.defense)
W:
(this.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="BallisticBreastLiners"}))&&(@@e@@+=(this.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="BallisticBreastLiners"})||this.inventory["combatImplant"]).defense)

# ImplantSlots part 8 of 142: Power Boner comes out with the last cock
Rep [main.js]:
@@e@@.length<=@@o@@&&"PowerBoner"===this.inventory.combatImplant.getClassName()&&this.inventory.unequipImplant(this.inventory.combatImplant)}
W:
@@e@@.length<=@@o@@&&(this.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="PowerBoner"}))&&this.inventory.unequipImplant((this.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="PowerBoner"})||this.inventory["combatImplant"]))}

# ImplantSlots part 9 of 142: Busty Bulwark and Medical Milkers breast size (1 of 2)
Rep [main.js]:
"BustyBulwark"===this.inventory.combatImplant.getClassName()&&(@@a@@+=this.inventory.combatImplant.breastRatingChanges),"MedicalMilkers"===this.inventory.combatImplant.getClassName()&&(@@a@@+=this.inventory.combatImplant.breastRatingChanges)
W:
(this.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="BustyBulwark"}))&&(@@a@@+=(this.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="BustyBulwark"})||this.inventory["combatImplant"]).breastRatingChanges),(this.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))&&(@@a@@+=(this.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"})||this.inventory["combatImplant"]).breastRatingChanges)

# ImplantSlots part 10 of 142: Busty Bulwark and Medical Milkers breast size (2 of 2)
Rep [main.js]:
"BustyBulwark"===this.inventory.combatImplant.getClassName()&&(@@a@@+=this.inventory.combatImplant.breastRatingChanges),"MedicalMilkers"===this.inventory.combatImplant.getClassName()&&(@@a@@+=this.inventory.combatImplant.breastRatingChanges)
W:
(this.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="BustyBulwark"}))&&(@@a@@+=(this.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="BustyBulwark"})||this.inventory["combatImplant"]).breastRatingChanges),(this.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))&&(@@a@@+=(this.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"})||this.inventory["combatImplant"]).breastRatingChanges)

# ImplantSlots part 11 of 142: MedImplants heal threshold in combat
Rep [main.js]:
@@e@@.HPQ()<=@@e@@.inventory.combatImplant.HPQThreshold
W:
@@e@@.HPQ()<=(@@e@@.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="MedImplants"})||@@e@@.inventory["combatImplant"]).HPQThreshold

# ImplantSlots part 12 of 142: MedImplants threshold page (1 of 2)
Rep [main.js]:
pc.inventory.combatImplant.HPQThreshold
W:
(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="MedImplants"})||pc.inventory["combatImplant"]).HPQThreshold

# ImplantSlots part 13 of 142: MedImplants threshold page (2 of 2)
Rep [main.js]:
pc.inventory.combatImplant.HPQThreshold
W:
(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="MedImplants"})||pc.inventory["combatImplant"]).HPQThreshold

# ImplantSlots part 14 of 142: Combat Tail drone attack
Rep [main.js]:
"CombatTail"===@@e@@.inventory.combatImplant.getClassName()){var @@o@@=@@e@@.droneTarget;@@o@@.isDefeated()||@@e@@.inventory.combatImplant.droneAttack(@@e@@,@@o@@)}
W:
(@@e@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="CombatTail"}))){var @@o@@=@@e@@.droneTarget;@@o@@.isDefeated()||(@@e@@.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="CombatTail"})||@@e@@.inventory["combatImplant"]).droneAttack(@@e@@,@@o@@)}

# ImplantSlots part 15 of 142: Seed Soaker style effects that check the implant's class
Rep [main.js]:
this.inventory.combatImplant instanceof @@N@@.@@v@@&&@@N@@.@@v@@.activateEffect(
W:
this.inventory.equippedImplants.asList.some(function(tnI){return tnI instanceof @@N@@.@@v@@})&&@@N@@.@@v@@.activateEffect(

# ImplantSlots part 16 of 142: resistances from every combat implant
Rep [main.js]:
this.inventory.hasCombatImplant&&@@t@@.push(this.inventory.combatImplant),
W:
[this.inventory.equippedImplants.combatImplant,this.inventory.equippedImplants.combatImplant2,this.inventory.equippedImplants.combatImplant3].forEach(function(tnI){tnI&&@@t@@.push(tnI)}),

# ImplantSlots part 17 of 142: Cybernetic Synchronization counts every implant (1 of 2)
Rep [main.js]:
this.inventory.hasCombatImplant&&(@@t@@+=@@o@@),this.inventory.hasUtilityImplant&&(@@t@@+=@@o@@)
W:
@@t@@+=@@o@@*this.inventory.equippedImplants.asList.filter(Boolean).length

# ImplantSlots part 18 of 142: Cybernetic Synchronization counts every implant (2 of 2)
Rep [main.js]:
this.inventory.hasCombatImplant&&(@@t@@+=@@o@@),this.inventory.hasUtilityImplant&&(@@t@@+=@@o@@)
W:
@@t@@+=@@o@@*this.inventory.equippedImplants.asList.filter(Boolean).length

# ImplantSlots part 19 of 142: cyborg check counts every implant
Rep [main.js]:
this.inventory.hasCombatImplant&&@@t@@++,this.inventory.hasUtilityImplant&&@@t@@++
W:
@@t@@+=this.inventory.equippedImplants.asList.filter(Boolean).length

# ImplantSlots part 20 of 142: stats page drone damage (1 of 9)
Rep [main.js]:
pc.inventory.accessory.droneAttack||pc.inventory.combatImplant.droneAttack
W:
pc.inventory.accessory.droneAttack||(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&!!tnI.droneAttack})||pc.inventory["combatImplant"]).droneAttack

# ImplantSlots part 21 of 142: stats page drone damage (2 of 9)
Rep [main.js]:
pc.inventory.combatImplant.drone
W:
(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&!!tnI.droneAttack})||pc.inventory["combatImplant"]).drone

# ImplantSlots part 22 of 142: stats page drone damage (3 of 9)
Rep [main.js]:
pc.inventory.combatImplant.drone
W:
(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&!!tnI.droneAttack})||pc.inventory["combatImplant"]).drone

# ImplantSlots part 23 of 142: stats page drone damage (4 of 9)
Rep [main.js]:
pc.inventory.combatImplant.drone
W:
(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&!!tnI.droneAttack})||pc.inventory["combatImplant"]).drone

# ImplantSlots part 24 of 142: stats page drone damage (5 of 9)
Rep [main.js]:
pc.inventory.combatImplant.drone
W:
(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&!!tnI.droneAttack})||pc.inventory["combatImplant"]).drone

# ImplantSlots part 25 of 142: stats page drone damage (6 of 9)
Rep [main.js]:
pc.inventory.combatImplant.drone
W:
(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&!!tnI.droneAttack})||pc.inventory["combatImplant"]).drone

# ImplantSlots part 26 of 142: stats page drone damage (7 of 9)
Rep [main.js]:
pc.inventory.combatImplant.drone
W:
(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&!!tnI.droneAttack})||pc.inventory["combatImplant"]).drone

# ImplantSlots part 27 of 142: stats page drone damage (8 of 9)
Rep [main.js]:
pc.inventory.combatImplant.drone
W:
(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&!!tnI.droneAttack})||pc.inventory["combatImplant"]).drone

# ImplantSlots part 28 of 142: stats page drone damage (9 of 9)
Rep [main.js]:
pc.inventory.combatImplant.drone
W:
(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&!!tnI.droneAttack})||pc.inventory["combatImplant"]).drone

# ImplantSlots part 29 of 142: milk tank check (Medical Milkers)
Rep [main.js]:
{key:"isMilkTank",value:function(){var @@e@@=this;return"MedicalMilkers"===this.inventory.combatImplant.getClassName()||
W:
{key:"isMilkTank",value:function(){var @@e@@=this;return(this.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))||

# ImplantSlots part 30 of 142: Phallus Tuner app (1 of 5)
Rep [main.js]:
var @@o@@=pc.inventory.utilityImplant,@@a@@="";
W:
var @@o@@=(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="PhallusTuner"})||pc.inventory["utilityImplant"]),@@a@@="";

# ImplantSlots part 31 of 142: Phallus Tuner app (2 of 5)
Rep [main.js]:
0!==pc.inventory.utilityImplant.lengthOffset?
W:
0!==(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="PhallusTuner"})||pc.inventory["utilityImplant"]).lengthOffset?

# ImplantSlots part 32 of 142: Phallus Tuner app (3 of 5)
Rep [main.js]:
(-pc.inventory.utilityImplant.lengthOffset,!0)
W:
(-(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="PhallusTuner"})||pc.inventory["utilityImplant"]).lengthOffset,!0)

# ImplantSlots part 33 of 142: Phallus Tuner app (4 of 5)
Rep [main.js]:
var @@e@@=pc.inventory.utilityImplant,@@t@@=pc.cocks[0]
W:
var @@e@@=(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="PhallusTuner"})||pc.inventory["utilityImplant"]),@@t@@=pc.cocks[0]

# ImplantSlots part 34 of 142: Phallus Tuner app (5 of 5)
Rep [main.js]:
var @@o@@=pc.inventory.utilityImplant;@@o@@.cockIdx=0
W:
var @@o@@=(pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="PhallusTuner"})||pc.inventory["utilityImplant"]);@@o@@.cockIdx=0

# ImplantSlots part 35 of 142: Prostitute Pro name in the Breedwell menu (1 of 2)
Rep [content_tavros.js]:
.concat(pc.inventory.utilityImplant.longName,
W:
.concat((pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="ProstitutePro"})||pc.inventory["utilityImplant"]).longName,

# ImplantSlots part 36 of 142: Prostitute Pro name in the Breedwell menu (2 of 2)
Rep [content_tavros.js]:
.concat(pc.inventory.utilityImplant.longName,
W:
.concat((pc.inventory.equippedImplants.asList.find(function(tnI){return!!tnI&&tnI.getClassName()==="ProstitutePro"})||pc.inventory["utilityImplant"]).longName,

# ===== Screens: stats page and equipment =====

# ImplantSlots part 37 of 142: stats page lists every implant
Rep [main.js]:
pc.inventory.hasCombatImplant&&(@@z@@+=@@P@@("Combat",@@re@@.@@m@@.toDisplayCase(pc.inventory.combatImplant.longName))),pc.inventory.hasUtilityImplant&&(@@z@@+=@@P@@("Utility",@@re@@.@@m@@.toDisplayCase(pc.inventory.utilityImplant.longName)))
W:
[["Combat","combatImplant"],["Combat 2","combatImplant2"],["Combat 3","combatImplant3"],["Utility","utilityImplant"],["Utility 2","utilityImplant2"],["Utility 3","utilityImplant3"]].forEach(function(tnK){var tnX=pc.inventory.equippedImplants[tnK[1]];tnX&&(@@z@@+=@@P@@(tnK[0],@@re@@.@@m@@.toDisplayCase(tnX.longName)))})

# ImplantSlots part 38 of 142: equipment screen shows implant slots 2 and 3
Rep [main.js]:
className:"equipmentRow".concat(@@a@@?"":" hide")},@@l@@.createElement("div",{onClick:function(){return @@t@@.onEquipmentSelected(@@t@@.combatImplant,"combatImplant")},className:this.slotClasses(this.combatImplant,"combatImplant"),title:"Combat Implant"},@@l@@.createElement("div",{className:"box"},@@l@@.createElement("div",{className:"content"},@@l@@.createElement("span",{className:"svgContainer",dangerouslySetInnerHTML:{__html:window.svgIcon(this.combatImplant.iconDisplay)}}))),@@l@@.createElement("span",{className:"focusBorder",tabIndex:"-1"})),@@l@@.createElement("div",{onClick:function(){return @@t@@.onEquipmentSelected(@@t@@.utilityImplant,"utilityImplant")},className:this.slotClasses(this.utilityImplant,"utilityImplant"),title:"Utility Implant"},@@l@@.createElement("div",{className:"box"},@@l@@.createElement("div",{className:"content"},@@l@@.createElement("span",{className:"svgContainer",dangerouslySetInnerHTML:{__html:window.svgIcon(this.utilityImplant.iconDisplay)}}))),@@l@@.createElement("span",{className:"focusBorder",tabIndex:"-1"}))))
W:
className:"equipmentRow".concat(@@a@@?"":" hide")},@@l@@.createElement("div",{onClick:function(){return @@t@@.onEquipmentSelected(@@t@@.combatImplant,"combatImplant")},className:this.slotClasses(this.combatImplant,"combatImplant"),title:"Combat Implant"},@@l@@.createElement("div",{className:"box"},@@l@@.createElement("div",{className:"content"},@@l@@.createElement("span",{className:"svgContainer",dangerouslySetInnerHTML:{__html:window.svgIcon(this.combatImplant.iconDisplay)}}))),@@l@@.createElement("span",{className:"focusBorder",tabIndex:"-1"})),@@l@@.createElement("div",{onClick:function(){return @@t@@.onEquipmentSelected(@@t@@.utilityImplant,"utilityImplant")},className:this.slotClasses(this.utilityImplant,"utilityImplant"),title:"Utility Implant"},@@l@@.createElement("div",{className:"box"},@@l@@.createElement("div",{className:"content"},@@l@@.createElement("span",{className:"svgContainer",dangerouslySetInnerHTML:{__html:window.svgIcon(this.utilityImplant.iconDisplay)}}))),@@l@@.createElement("span",{className:"focusBorder",tabIndex:"-1"}))),function(){var tnQ=@@t@@.character.inventory.equippedImplants,tnH=function(tnK,tnT){var tnX=tnQ[tnK];return tnX?@@l@@.createElement("div",{key:tnK,onClick:function(){return @@t@@.onEquipmentSelected(tnX,tnK)},className:@@t@@.slotClasses(tnX,tnK),title:tnT},@@l@@.createElement("div",{className:"box"},@@l@@.createElement("div",{className:"content"},@@l@@.createElement("span",{className:"svgContainer",dangerouslySetInnerHTML:{__html:window.svgIcon(tnX.iconDisplay)}}))),@@l@@.createElement("span",{className:"focusBorder",tabIndex:"-1"})):@@l@@.createElement("div",{key:tnK,className:"equipmentSlot hidden",title:""},@@l@@.createElement("div",{className:"box"},@@l@@.createElement("div",{className:"content"},@@l@@.createElement("span",{className:"svgContainer",dangerouslySetInnerHTML:{__html:""}}))),@@l@@.createElement("span",{className:"focusBorder",tabIndex:"-1"}))};return[2,3].map(function(tnN){return tnQ["combatImplant"+tnN]||tnQ["utilityImplant"+tnN]?@@l@@.createElement("div",{key:"tnImplantRow"+tnN,className:"equipmentRow".concat(@@a@@?"":" hide")},tnH("combatImplant"+tnN,"Combat Implant "+tnN),tnH("utilityImplant"+tnN,"Utility Implant "+tnN)):null})}())

# ===== Sabrae's shop on Dhaal =====

# ImplantSlots part 39 of 142: her explanation of the slots
Rep [content_dhaal.js]:
<b>you can only implant one of each type at a time.</b>
W:
<b>"+(window.tnImplantOn&&window.tnImplantOn()?"you can implant up to three of each type at a time":"you can only implant one of each type at a time")+".</b>

# ImplantSlots part 40 of 142: installed implants table, combat slots 2 and 3
Rep [content_dhaal.js]:
"".concat(@@Ot@@.@@m@@.capitalize(@@t@@.description,!1),".")])}else @@e@@.push([null,GLOBAL.ITEM_TYPE_NAMES[GLOBAL.COMBAT_IMPLANT],"<i>No implant installed.</i>"]);
W:
"".concat(@@Ot@@.@@m@@.capitalize(@@t@@.description,!1),".")])}else @@e@@.push([null,GLOBAL.ITEM_TYPE_NAMES[GLOBAL.COMBAT_IMPLANT],"<i>No implant installed.</i>"]);["combatImplant2","combatImplant3"].forEach(function(tnK){var tnX=pc.inventory.equippedImplants[tnK];tnX&&@@e@@.push([@@Ot@@.@@m@@.toDisplayCase(tnX.longName),GLOBAL.ITEM_TYPE_NAMES[tnX.type],"".concat(@@Ot@@.@@m@@.capitalize(tnX.description,!1),".")])});

# ImplantSlots part 41 of 142: installed implants table, utility slots 2 and 3
Rep [content_dhaal.js]:
else @@e@@.push([null,GLOBAL.ITEM_TYPE_NAMES[GLOBAL.UTILITY_IMPLANT],"<i>No implant installed.</i>"])}return @@Ot@@.@@m@@.createTable(@@e@@,["Name","Slot","Description"]
W:
else @@e@@.push([null,GLOBAL.ITEM_TYPE_NAMES[GLOBAL.UTILITY_IMPLANT],"<i>No implant installed.</i>"]);["utilityImplant2","utilityImplant3"].forEach(function(tnK){var tnX=pc.inventory.equippedImplants[tnK];tnX&&@@e@@.push([@@Ot@@.@@m@@.toDisplayCase(tnX.longName),GLOBAL.ITEM_TYPE_NAMES[tnX.type],"".concat(@@Ot@@.@@m@@.capitalize(tnX.description,!1),".")])})}return @@Ot@@.@@m@@.createTable(@@e@@,["Name","Slot","Description"]

# ImplantSlots part 42 of 142: removal menu: a button for every installed implant
Rep [content_dhaal.js]:
pc.inventory.hasCombatImplant?addItemButton(0,pc.inventory.combatImplant,(function(){return @@Up@@(GLOBAL.COMBAT_IMPLANT)})):addDisabledButton(0,"Combat Slot","Combat Slot","You don’t have an implant installed there."),pc.inventory.hasUtilityImplant?addItemButton(1,pc.inventory.utilityImplant,(function(){return @@Up@@(GLOBAL.UTILITY_IMPLANT)})):addDisabledButton(1,"Utility Slot","Utility Slot","You don’t have an implant installed there."),pc.inventory.hasCombatImplant&&pc.inventory.hasUtilityImplant&&addButton(4,"All",(function(){return @@Up@@(GLOBAL.ALL)}),"Remove All Implants","Remove all your implants at once."),
W:
function(){var tnQ=pc.inventory.equippedImplants,tnW=!!(tnQ.combatImplant2||tnQ.combatImplant3||tnQ.utilityImplant2||tnQ.utilityImplant3),tnC=0;[["combatImplant",0,"Combat Slot"],["utilityImplant",tnW?5:1,"Utility Slot"]].forEach(function(tnR){for(var tnJ=0;tnJ<3;tnJ++){var tnX=tnQ[tnR[0]+(tnJ?tnJ+1:"")];tnX?(tnC++,function(tnY){addItemButton(tnR[1]+tnJ,tnY,(function(){return @@Up@@(tnY)}))}(tnX)):0===tnJ&&addDisabledButton(tnR[1],tnR[2],tnR[2],"You don’t have an implant installed there.")}}),tnC>1&&addButton(4,"All",(function(){return @@Up@@(GLOBAL.ALL)}),"Remove All Implants","Remove all your implants at once.")}(),

# ImplantSlots part 43 of 142: removal: take out one implant, or all of them
Rep [content_dhaal.js]:
[GLOBAL.ALL,GLOBAL.COMBAT_IMPLANT].includes(@@e@@)&&@@t@@.push(pc.inventory.unequipImplant(pc.inventory.combatImplant)),[GLOBAL.ALL,GLOBAL.UTILITY_IMPLANT].includes(@@e@@)&&@@t@@.push(pc.inventory.unequipImplant(pc.inventory.utilityImplant))
W:
(@@e@@===GLOBAL.ALL?pc.inventory.equippedImplants.asList.filter(Boolean).forEach(function(tnX){@@t@@.push(pc.inventory.unequipImplant(tnX))}):@@e@@&&"object"==typeof @@e@@?@@t@@.push(pc.inventory.unequipImplant(@@e@@)):(@@e@@===GLOBAL.COMBAT_IMPLANT&&@@t@@.push(pc.inventory.unequipImplant(pc.inventory["combatImplant"])),@@e@@===GLOBAL.UTILITY_IMPLANT&&@@t@@.push(pc.inventory.unequipImplant(pc.inventory["utilityImplant"]))))

# ImplantSlots part 44 of 142: install list: no duplicates, and a note when the slots are full
Rep [content_dhaal.js]:
""!==@@i@@?addItemDisabledButton(@@e@@,@@n@@,null,@@i@@):addItemButton(@@e@@,@@n@@,(function(){return @@cm@@(@@n@@,@@t@@,@@o@@)}))
W:
(""===@@i@@&&window.tnImplantBlock&&(@@i@@=window.tnImplantBlock(pc.inventory,@@n@@)),""!==@@i@@?addItemDisabledButton(@@e@@,@@n@@,null,@@i@@):addItemButton(@@e@@,@@n@@,(function(){return @@cm@@(@@n@@,@@t@@,@@o@@)})))

# ImplantSlots part 45 of 142: installing uses a free slot instead of swapping
Rep [content_dhaal.js]:
@@e@@.type===GLOBAL.COMBAT_IMPLANT?(pc.inventory.hasCombatImplant&&(@@a@@=pc.inventory.unequipImplant(pc.inventory.combatImplant)),pc.inventory.equipImplant(@@e@@.clone())):(pc.inventory.hasUtilityImplant&&(@@a@@=pc.inventory.unequipImplant(pc.inventory.utilityImplant)),pc.inventory.equipImplant(@@e@@.clone()))
W:
@@e@@.type===GLOBAL.COMBAT_IMPLANT?(pc.inventory.hasCombatImplant&&!(window.tnImplantRoom&&window.tnImplantRoom(pc.inventory,@@e@@))&&(@@a@@=pc.inventory.unequipImplant(pc.inventory["combatImplant"])),pc.inventory.equipImplant(@@e@@.clone())):(pc.inventory.hasUtilityImplant&&!(window.tnImplantRoom&&window.tnImplantRoom(pc.inventory,@@e@@))&&(@@a@@=pc.inventory.unequipImplant(pc.inventory["utilityImplant"])),pc.inventory.equipImplant(@@e@@.clone()))

# ImplantSlots part 46 of 142: a sparring partner notices a tail implant in any slot
Rep [content_dhaal.js]:
pc.inventory.combatImplant instanceof @@wy@@.@@e@@?output(
W:
pc.inventory.equippedImplants.asList.some(function(tnI){return tnI instanceof @@wy@@.@@e@@})?output(

# ===== Implant checks in main.js =====

# ImplantSlots part 47 of 142: SteroidalMuscleAugment (1 of 6)
Rep [main.js]:
"SteroidalMuscleAugment"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SteroidalMuscleAugment"}))

# ImplantSlots part 48 of 142: SteroidalMuscleAugment (2 of 6)
Rep [main.js]:
"SteroidalMuscleAugment"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SteroidalMuscleAugment"}))

# ImplantSlots part 49 of 142: SteroidalMuscleAugment (3 of 6)
Rep [main.js]:
"SteroidalMuscleAugment"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SteroidalMuscleAugment"}))

# ImplantSlots part 50 of 142: SteroidalMuscleAugment (4 of 6)
Rep [main.js]:
"SteroidalMuscleAugment"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SteroidalMuscleAugment"}))

# ImplantSlots part 51 of 142: SteroidalMuscleAugment (5 of 6)
Rep [main.js]:
"SteroidalMuscleAugment"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SteroidalMuscleAugment"}))

# ImplantSlots part 52 of 142: SteroidalMuscleAugment (6 of 6)
Rep [main.js]:
"SteroidalMuscleAugment"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SteroidalMuscleAugment"}))

# ImplantSlots part 53 of 142: MuscularStabilizationSystem (1 of 5)
Rep [main.js]:
"MuscularStabilizationSystem"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MuscularStabilizationSystem"}))

# ImplantSlots part 54 of 142: MuscularStabilizationSystem (2 of 5)
Rep [main.js]:
"MuscularStabilizationSystem"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MuscularStabilizationSystem"}))

# ImplantSlots part 55 of 142: MuscularStabilizationSystem (3 of 5)
Rep [main.js]:
"MuscularStabilizationSystem"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MuscularStabilizationSystem"}))

# ImplantSlots part 56 of 142: MuscularStabilizationSystem (4 of 5)
Rep [main.js]:
"MuscularStabilizationSystem"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MuscularStabilizationSystem"}))

# ImplantSlots part 57 of 142: MuscularStabilizationSystem (5 of 5)
Rep [main.js]:
"MuscularStabilizationSystem"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MuscularStabilizationSystem"}))

# ImplantSlots part 58 of 142: ReflexTuner (1 of 6)
Rep [main.js]:
"ReflexTuner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ReflexTuner"}))

# ImplantSlots part 59 of 142: ReflexTuner (2 of 6)
Rep [main.js]:
"ReflexTuner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ReflexTuner"}))

# ImplantSlots part 60 of 142: ReflexTuner (3 of 6)
Rep [main.js]:
"ReflexTuner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ReflexTuner"}))

# ImplantSlots part 61 of 142: ReflexTuner (4 of 6)
Rep [main.js]:
"ReflexTuner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ReflexTuner"}))

# ImplantSlots part 62 of 142: ReflexTuner (5 of 6)
Rep [main.js]:
"ReflexTuner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ReflexTuner"}))

# ImplantSlots part 63 of 142: ReflexTuner (6 of 6)
Rep [main.js]:
"ReflexTuner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ReflexTuner"}))

# ImplantSlots part 64 of 142: Subprocessor (1 of 4)
Rep [main.js]:
"Subprocessor"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="Subprocessor"}))

# ImplantSlots part 65 of 142: Subprocessor (2 of 4)
Rep [main.js]:
"Subprocessor"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="Subprocessor"}))

# ImplantSlots part 66 of 142: Subprocessor (3 of 4)
Rep [main.js]:
"Subprocessor"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="Subprocessor"}))

# ImplantSlots part 67 of 142: Subprocessor (4 of 4)
Rep [main.js]:
"Subprocessor"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="Subprocessor"}))

# ImplantSlots part 68 of 142: MedicalMilkers (1 of 8)
Rep [main.js]:
"MedicalMilkers"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))

# ImplantSlots part 69 of 142: MedicalMilkers (2 of 8)
Rep [main.js]:
"MedicalMilkers"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))

# ImplantSlots part 70 of 142: MedicalMilkers (3 of 8)
Rep [main.js]:
"MedicalMilkers"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))

# ImplantSlots part 71 of 142: MedicalMilkers (4 of 8)
Rep [main.js]:
"MedicalMilkers"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))

# ImplantSlots part 72 of 142: MedicalMilkers (5 of 8)
Rep [main.js]:
"MedicalMilkers"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))

# ImplantSlots part 73 of 142: MedicalMilkers (6 of 8)
Rep [main.js]:
"MedicalMilkers"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))

# ImplantSlots part 74 of 142: MedicalMilkers (7 of 8)
Rep [main.js]:
"MedicalMilkers"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))

# ImplantSlots part 75 of 142: MedicalMilkers (8 of 8)
Rep [main.js]:
"MedicalMilkers"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))

# ImplantSlots part 76 of 142: SensoryDampener (1 of 6)
Rep [main.js]:
"SensoryDampener"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SensoryDampener"}))

# ImplantSlots part 77 of 142: SensoryDampener (2 of 6)
Rep [main.js]:
"SensoryDampener"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SensoryDampener"}))

# ImplantSlots part 78 of 142: SensoryDampener (3 of 6)
Rep [main.js]:
"SensoryDampener"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SensoryDampener"}))

# ImplantSlots part 79 of 142: SensoryDampener (4 of 6)
Rep [main.js]:
"SensoryDampener"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SensoryDampener"}))

# ImplantSlots part 80 of 142: SensoryDampener (5 of 6)
Rep [main.js]:
"SensoryDampener"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SensoryDampener"}))

# ImplantSlots part 81 of 142: SensoryDampener (6 of 6)
Rep [main.js]:
"SensoryDampener"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SensoryDampener"}))

# ImplantSlots part 82 of 142: PowerBoner (1 of 7)
Rep [main.js]:
"PowerBoner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="PowerBoner"}))

# ImplantSlots part 83 of 142: PowerBoner (2 of 7)
Rep [main.js]:
"PowerBoner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="PowerBoner"}))

# ImplantSlots part 84 of 142: PowerBoner (3 of 7)
Rep [main.js]:
"PowerBoner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="PowerBoner"}))

# ImplantSlots part 85 of 142: PowerBoner (4 of 7)
Rep [main.js]:
"PowerBoner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="PowerBoner"}))

# ImplantSlots part 86 of 142: PowerBoner (5 of 7)
Rep [main.js]:
"PowerBoner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="PowerBoner"}))

# ImplantSlots part 87 of 142: PowerBoner (6 of 7)
Rep [main.js]:
"PowerBoner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="PowerBoner"}))

# ImplantSlots part 88 of 142: PowerBoner (7 of 7)
Rep [main.js]:
"PowerBoner"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="PowerBoner"}))

# ImplantSlots part 89 of 142: SeedSoaker (1 of 4)
Rep [main.js]:
"SeedSoaker"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SeedSoaker"}))

# ImplantSlots part 90 of 142: SeedSoaker (2 of 4)
Rep [main.js]:
"SeedSoaker"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SeedSoaker"}))

# ImplantSlots part 91 of 142: SeedSoaker (3 of 4)
Rep [main.js]:
"SeedSoaker"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SeedSoaker"}))

# ImplantSlots part 92 of 142: SeedSoaker (4 of 4)
Rep [main.js]:
"SeedSoaker"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SeedSoaker"}))

# ImplantSlots part 93 of 142: MuskMagnifier (1 of 2)
Rep [main.js]:
"MuskMagnifier"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MuskMagnifier"}))

# ImplantSlots part 94 of 142: MuskMagnifier (2 of 2)
Rep [main.js]:
"MuskMagnifier"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MuskMagnifier"}))

# ImplantSlots part 95 of 142: BustyBulwark (1 of 2)
Rep [main.js]:
"BustyBulwark"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="BustyBulwark"}))

# ImplantSlots part 96 of 142: BustyBulwark (2 of 2)
Rep [main.js]:
"BustyBulwark"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="BustyBulwark"}))

# ImplantSlots part 97 of 142: SynthWomb (1 of 5)
Rep [main.js]:
"SynthWomb"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SynthWomb"}))

# ImplantSlots part 98 of 142: SynthWomb (2 of 5)
Rep [main.js]:
"SynthWomb"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SynthWomb"}))

# ImplantSlots part 99 of 142: SynthWomb (3 of 5)
Rep [main.js]:
"SynthWomb"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SynthWomb"}))

# ImplantSlots part 100 of 142: SynthWomb (4 of 5)
Rep [main.js]:
"SynthWomb"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SynthWomb"}))

# ImplantSlots part 101 of 142: SynthWomb (5 of 5)
Rep [main.js]:
"SynthWomb"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SynthWomb"}))

# ImplantSlots part 102 of 142: EcstasyEnlargers
Rep [main.js]:
"EcstasyEnlargers"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="EcstasyEnlargers"}))

# ImplantSlots part 103 of 142: BallisticBreastLiners (1 of 2)
Rep [main.js]:
"BallisticBreastLiners"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="BallisticBreastLiners"}))

# ImplantSlots part 104 of 142: BallisticBreastLiners (2 of 2)
Rep [main.js]:
"BallisticBreastLiners"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="BallisticBreastLiners"}))

# ImplantSlots part 105 of 142: MedImplants (1 of 4)
Rep [main.js]:
"MedImplants"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedImplants"}))

# ImplantSlots part 106 of 142: MedImplants (2 of 4)
Rep [main.js]:
"MedImplants"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedImplants"}))

# ImplantSlots part 107 of 142: MedImplants (3 of 4)
Rep [main.js]:
"MedImplants"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedImplants"}))

# ImplantSlots part 108 of 142: MedImplants (4 of 4)
Rep [main.js]:
"MedImplants"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedImplants"}))

# ImplantSlots part 109 of 142: ProstitutePro (1 of 2)
Rep [main.js]:
"ProstitutePro"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ProstitutePro"}))

# ImplantSlots part 110 of 142: ProstitutePro (2 of 2)
Rep [main.js]:
"ProstitutePro"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ProstitutePro"}))

# ImplantSlots part 111 of 142: BreedNBrute
Rep [main.js]:
"BreedNBrute"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="BreedNBrute"}))

# ImplantSlots part 112 of 142: LactaidDispensers (1 of 2)
Rep [main.js]:
"LactaidDispensers"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="LactaidDispensers"}))

# ImplantSlots part 113 of 142: LactaidDispensers (2 of 2)
Rep [main.js]:
"LactaidDispensers"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="LactaidDispensers"}))

# ImplantSlots part 114 of 142: ProteinPower
Rep [main.js]:
"ProteinPower"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ProteinPower"}))

# ImplantSlots part 115 of 142: DongDoctor
Rep [main.js]:
"DongDoctor"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="DongDoctor"}))

# ImplantSlots part 116 of 142: CombatTail (1 of 3)
Rep [main.js]:
"CombatTail"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="CombatTail"}))

# ImplantSlots part 117 of 142: CombatTail (2 of 3)
Rep [main.js]:
"CombatTail"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="CombatTail"}))

# ImplantSlots part 118 of 142: CombatTail (3 of 3)
Rep [main.js]:
"CombatTail"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="CombatTail"}))

# ImplantSlots part 119 of 142: SlutSight (1 of 2)
Rep [main.js]:
"SlutSight"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SlutSight"}))

# ImplantSlots part 120 of 142: SlutSight (2 of 2)
Rep [main.js]:
"SlutSight"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SlutSight"}))

# ImplantSlots part 121 of 142: ProstitutePro
Rep [main.js]:
"ProstitutePro"!==@@r@@.inventory.utilityImplant.getClassName()
W:
!(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ProstitutePro"}))

# ImplantSlots part 122 of 142: InseminatorPro (1 of 2)
Rep [main.js]:
"InseminatorPro"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="InseminatorPro"}))

# ImplantSlots part 123 of 142: InseminatorPro (2 of 2)
Rep [main.js]:
"InseminatorPro"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="InseminatorPro"}))

# ImplantSlots part 124 of 142: PhallusTuner
Rep [main.js]:
"PhallusTuner"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="PhallusTuner"}))

# ImplantSlots part 125 of 142: EmergencyGasmVent
Rep [main.js]:
"EmergencyGasmVent"===(null===(@@a@@=@@r@@.inventory)||void 0===@@a@@||null===(@@o@@=@@a@@.combatImplant)||void 0===@@o@@?void 0:@@o@@.getClassName())
W:
(!!@@r@@.inventory&&(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="EmergencyGasmVent"})))

# ImplantSlots part 126 of 142: SeedSoaker (1 of 3)
Rep [main.js]:
"SeedSoaker"===(null===(@@a@@=@@r@@.inventory)||void 0===@@a@@||null===(@@o@@=@@a@@.combatImplant)||void 0===@@o@@?void 0:@@o@@.getClassName())
W:
(!!@@r@@.inventory&&(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SeedSoaker"})))

# ImplantSlots part 127 of 142: SeedSoaker (2 of 3)
Rep [main.js]:
"SeedSoaker"===(null===(@@a@@=@@r@@.inventory)||void 0===@@a@@||null===(@@o@@=@@a@@.combatImplant)||void 0===@@o@@?void 0:@@o@@.getClassName())
W:
(!!@@r@@.inventory&&(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SeedSoaker"})))

# ImplantSlots part 128 of 142: SeedSoaker (3 of 3)
Rep [main.js]:
"SeedSoaker"===(null===(@@a@@=@@r@@.inventory)||void 0===@@a@@||null===(@@o@@=@@a@@.combatImplant)||void 0===@@o@@?void 0:@@o@@.getClassName())
W:
(!!@@r@@.inventory&&(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SeedSoaker"})))

# ImplantSlots part 129 of 142: ArmoredTail
Rep [main.js]:
"ArmoredTail"===(null===(@@a@@=@@r@@.inventory)||void 0===@@a@@||null===(@@o@@=@@a@@.combatImplant)||void 0===@@o@@?void 0:@@o@@.getClassName())
W:
(!!@@r@@.inventory&&(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ArmoredTail"})))

# ImplantSlots part 130 of 142: EmergencyGasmVent
Rep [main.js]:
"EmergencyGasmVent"===(null===(@@a@@=@@r@@.inventory.combatImplant)||void 0===@@a@@?void 0:@@a@@.getClassName())
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="EmergencyGasmVent"}))

# ImplantSlots part 131 of 142: CombatTail or ArmoredTail (1 of 3)
Rep [main.js]:
["CombatTail","ArmoredTail"].includes(@@r@@.inventory.combatImplant.getClassName())
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&["CombatTail","ArmoredTail"].includes(tnI.getClassName())}))

# ImplantSlots part 132 of 142: CombatTail or ArmoredTail (2 of 3)
Rep [main.js]:
["CombatTail","ArmoredTail"].includes(@@r@@.inventory.combatImplant.getClassName())
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&["CombatTail","ArmoredTail"].includes(tnI.getClassName())}))

# ImplantSlots part 133 of 142: CombatTail or ArmoredTail (3 of 3)
Rep [main.js]:
["CombatTail","ArmoredTail"].includes(@@r@@.inventory.combatImplant.getClassName())
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&["CombatTail","ArmoredTail"].includes(tnI.getClassName())}))

# ImplantSlots part 134 of 142: DongDoctor or EmergencyGasmVent
Rep [main.js]:
["DongDoctor","EmergencyGasmVent"].includes(@@r@@.inventory.combatImplant.getClassName())
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&["DongDoctor","EmergencyGasmVent"].includes(tnI.getClassName())}))

# ===== Implant checks in content_tarkus.js =====

# ImplantSlots part 135 of 142: MedicalMilkers (1 of 2)
Rep [content_tarkus.js]:
"MedicalMilkers"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))

# ImplantSlots part 136 of 142: MedicalMilkers (2 of 2)
Rep [content_tarkus.js]:
"MedicalMilkers"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="MedicalMilkers"}))

# ImplantSlots part 137 of 142: BustyBulwark (1 of 2)
Rep [content_tarkus.js]:
"BustyBulwark"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="BustyBulwark"}))

# ImplantSlots part 138 of 142: BustyBulwark (2 of 2)
Rep [content_tarkus.js]:
"BustyBulwark"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="BustyBulwark"}))

# ImplantSlots part 139 of 142: SeedSoaker (1 of 2)
Rep [content_tarkus.js]:
"SeedSoaker"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SeedSoaker"}))

# ImplantSlots part 140 of 142: SeedSoaker (2 of 2)
Rep [content_tarkus.js]:
"SeedSoaker"===@@r@@.inventory.combatImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="SeedSoaker"}))

# ===== Implant checks in content_tavros.js =====

# ImplantSlots part 141 of 142: ProstitutePro (1 of 2)
Rep [content_tavros.js]:
"ProstitutePro"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ProstitutePro"}))

# ImplantSlots part 142 of 142: ProstitutePro (2 of 2)
Rep [content_tavros.js]:
"ProstitutePro"===@@r@@.inventory.utilityImplant.getClassName()
W:
(@@r@@.inventory.equippedImplants.asList.some(function(tnI){return!!tnI&&tnI.getClassName()==="ProstitutePro"}))
