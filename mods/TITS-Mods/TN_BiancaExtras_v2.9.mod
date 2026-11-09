Name: Bianca Extras
Author: Neston
# TN_BiancaExtras - NestPatcher mod (TiTS 0.9.168), Modv2.9
# Fills in what's missing from William's two Dr. Bianca Ketria docs (Part 1 Core, Part 2 Love &
# Sexpac). Needs TN_BiancaExtras_v2.9.js (scenes, menus and story; it holds the details).
#   - Familiarity is no longer stuck at 49: 50 until you confront her, then up to 100.
#   - Spend Time: Cuddle (3 times, then Confront / Back Off), Hug, Kiss (Ambush / Mutual).
#   - After the confrontation she's gone a week, emails you, and waits on Tavros'
#     Residential Deck (South-East Plaza). Then the love track opens.
#   - Tile approach at 51%+: Direct / Playful / Lewd. Bar: Cuddle, Booth Tease, Your Ship.
#   - Encounter menu: Confess (100% and 20 nights aboard).
#   - Intro 12 + the cold booth, Ditzy to Normalcy, her own You OK? check-ins, the Treatment
#     talk, the missing "Four teams" Stories paragraph, and the ring comes off after Confront.
#   - Taur/naga get their own lines when the taur/naga bypass switch is on.
# Needles use @@name@@ wildcards for minified names so they match PC and Android builds.

# Familiarity cap (49 when the mod is off, 50 before Confront, 100 after)
Replace [main.js]:
{key:"familiarityMax",value:function(){return 49}}
With:
{key:"familiarityMax",value:function(){return window.tnBiancaFamMax?window.tnBiancaFamMax():49}}

# Spend Time menu gets Cuddle / Hug / Kiss; encounter end resets once-per-encounter choices
Replace [main.js]:
a doctor’s not going to have much luck treating you!")}function @@g@@(){void 0===flags.BIANCA_ANNOYED&&bianca.familiarity(3),
With:
a doctor’s not going to have much luck treating you!"),window.tnBiancaSpendTime&&window.tnBiancaSpendTime()}function @@g@@(){window.tnBiancaEncEnd&&window.tnBiancaEncEnd(),void 0===flags.BIANCA_ANNOYED&&bianca.familiarity(3),

# Encounter menu: Confess in slot 3
Replace [main.js]:
addButton(14,"Leave",(function(){return function(@@x@@){clearMenu(),clearOutput(),showBianca("WORK"),author("William"),processTime(1),bianca.familiarity()<50?(output("You’re not in need of her skills
With:
window.tnBiancaEncMenu&&window.tnBiancaEncMenu(),addButton(14,"Leave",(function(){return function(@@x@@){clearMenu(),clearOutput(),showBianca("WORK"),author("William"),processTime(1),bianca.familiarity()<50?(output("You’re not in need of her skills

# Bar menu: Cuddle / Booth Tease / Your Ship in slots 6-8
Replace [main.js]:
See what inconspicuous trouble you two can get into."),addButton(14,"Leave",
With:
See what inconspicuous trouble you two can get into."),window.tnBiancaBarMenu&&window.tnBiancaBarMenu(),addButton(14,"Leave",

# Random encounter: Intro 12 (cold), Ditzy to Normalcy, the Treatment talk
Replace [main.js]:
if(!@@e@@&&rand(10)<4)return function(){clearMenu(),clearOutput(),showBianca("WORK")
With:
if(window.tnBiancaEncounterOverride&&window.tnBiancaEncounterOverride(@@e@@))return!0;if(!@@e@@&&rand(10)<4)return function(){clearMenu(),clearOutput(),showBianca("WORK")

# Tile approach at 51%+: Direct / Playful / Lewd (the game only had a stub here)
Replace [main.js]:
(output("This should never happen. Please report."),addButton(0,"Direct"),addButton(1,"Playful"),addButton(2,"Lewd"),addButton(14,"Back",@@g@@))
With:
(window.tnBiancaApproachMenu?window.tnBiancaApproachMenu(@@g@@):(output("This should never happen. Please report."),addButton(14,"Back",@@g@@)))

# Not at the bars while she's cold or away
Replace [main.js]:
return!(hours<20)&&(!pc.isBimbo()&&!pc.isBro()&&(!pc.hasStatusEffect("Bianca Gone")
With:
return!(hours<20)&&!(window.tnBiancaBarHidden&&window.tnBiancaBarHidden())&&(!pc.isBimbo()&&!pc.isBro()&&(!pc.hasStatusEffect("Bianca Gone")

# The cold booth (after the third cuddle, until you confront her)
Replace [main.js]:
flags.BIANCA_ANNOYED>GetGameTimestamp()?addDisabledButton(@@e@@,"Bianca","Bianca","Bianca is not pleased with you wasting her time.
With:
window.tnBiancaBoothCold&&window.tnBiancaBoothCold(@@e@@)?void 0:flags.BIANCA_ANNOYED>GetGameTimestamp()?addDisabledButton(@@e@@,"Bianca","Bianca","Bianca is not pleased with you wasting her time.

# Mail: lets the runtime add Bianca's "I'm ready to talk" email
Replace [main.js]:
}};for(var @@zx@@ in @@Hx@@)@@E@@.@@sg@@.addMailEntry(@@zx@@,@@Hx@@[@@zx@@]);
With:
}};window.tnMailHx=@@Hx@@,window.tnMailMgr=@@E@@.@@sg@@;for(var @@zx@@ in @@Hx@@)@@E@@.@@sg@@.addMailEntry(@@zx@@,@@Hx@@[@@zx@@]);

# You OK?: at 75%+ Bianca sometimes asks first
Replace [main.js]:
showBianca(@@e@@?"WORK":"CASUAL"),author("William"),processTime(1),bianca.familiarity()>=75&&0===rand(4)?(output("You smile at the doctor
With:
showBianca(@@e@@?"WORK":"CASUAL"),author("William"),processTime(1),window.tnBiancaYouOk&&window.tnBiancaYouOk(@@e@@)?void 0:bianca.familiarity()>=75&&0===rand(4)?(output("You smile at the doctor

# Her wedding ring is gone once you've confronted her
Replace [main.js]:
bianca.familiarity()>=50&&output(" Around her finger is a thin gold band
With:
bianca.familiarity()>=50&&1!==flags.BIANCA_CONFRONTED&&output(" Around her finger is a thin gold band

# Stories: the missing "Four teams" paragraph from the doc
Replace [main.js]:
So, wearing a plaintive, lopsided smile, she begins."),output("\n\nAfter taking another sizeable swig
With:
So, wearing a plaintive, lopsided smile, she begins."),(!window.tnBiancaExtrasEnabled||window.tnBiancaExtrasEnabled())&&output("\n\n<i>“Four teams - Gold, Red, Green, and Blue - were scrambled in standard hazard gear, only bringing what strictly benefited the soldiers. We had no idea what was going on; the power was down, not a single person answered hailings... so it was the standard preparation.”</i> Bianca casts her mournful gaze upward toward the ceiling, doing her best not to trail off like she just did. <i>“I was with Jim behind Captain Zach, the pointman for the operation. Green and Blue were ordered to secure the engineering deck, while Red and Gold - which I was part of - were tasked with securing the operations deck.”</i>"),output("\n\nAfter taking another sizeable swig

# Tavros Residential Deck, South-East Plaza: Bianca waits under the trees after her email
Replace [content_tavros.js]:
elevators are."]))))},@@o@@.addRoom(@@ee@@);
With:
elevators are."])))),window.tnBiancaPlazaBonus&&window.tnBiancaPlazaBonus()},@@o@@.addRoom(@@ee@@);
