Name: Shekka's Gene Talk
Author: Neston
# TN_ShekkaGeneTalk - NestPatcher mod (TiTS 0.9.168), Modv2.9
# Adds a "Gene Plans" topic to crew Shekka's Talk menu, once Bianca's clinic is open and
# Dr. Rewell has told you about his work on sterile gene lines ("Your Kids" in his office).
# Needs TN_ShekkaGeneTalk_v2.9.js. The Dr. Rewell follow-up needs Bianca's Clinic
# (TN_BiancaClinic_v2.9.mod + .js) and Bianca Extras.
# Needles use @@name@@ wildcards for minified names so they match PC and Android builds.

# Shekka's crew Talk menu: add "Gene Plans" in the empty slot 3, next to Infertility
Replace [content_follower.js]:
function @@T@@(){clearOutput(),shekka.showAll(),author("SomeKindofWizard"),output("You let her know that you’re just down for a chat, and she puts down some miscellaneous machined-piece down on the floor–hopefully that didn’t come from your engine."),processTime(2),clearMenu(),addButton(14,"Back",(function(){return @@RN@@(!0)})),addButton(0,"Places",@@t@@,"Places","Talk to Shekka about some of the places you’ve been."),addButton(1,"People",@@o@@,"People","Talk to Shekka about some of the people you know."),addButton(2,"Infertility",@@a@@,"Infertility","Talk to Shekka about her infertility and potentially repairing it."),
With:
function @@T@@(){clearOutput(),shekka.showAll(),author("SomeKindofWizard"),output("You let her know that you’re just down for a chat, and she puts down some miscellaneous machined-piece down on the floor–hopefully that didn’t come from your engine."),processTime(2),clearMenu(),addButton(14,"Back",(function(){return @@RN@@(!0)})),addButton(0,"Places",@@t@@,"Places","Talk to Shekka about some of the places you’ve been."),addButton(1,"People",@@o@@,"People","Talk to Shekka about some of the people you know."),addButton(2,"Infertility",@@a@@,"Infertility","Talk to Shekka about her infertility and potentially repairing it."),window.tnShekkaGeneButton&&window.tnShekkaGeneButton(3,@@T@@),
