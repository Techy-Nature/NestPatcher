Name: Shekka's Gene Talk
Author: Neston
# TN_ShekkaGeneTalk - NestPatcher mod (TiTS 0.9.168), Modv3.0
# Adds a "Gene Plans" topic to crew Shekka's Talk menu, once Steele knows a geneticist who could
# help: Dr. Rewell (Bianca's clinic open + his "Your Kids" talk) or Dr. McAllister (met him in
# the Xenogen lab on Myrellion). Also adds a "Shekka" button to Dr. McAllister's menu.
# Needs TN_ShekkaGeneTalk_v3.0.js. The Dr. Rewell route needs Bianca's Clinic
# (TN_BiancaClinic_v2.9.mod + .js) and Bianca Extras; the McAllister route needs nothing else.
# Needles use @@name@@ wildcards for minified names so they match PC and Android builds.

# Shekka's crew Talk menu: add "Gene Plans" in the empty slot 3, next to Infertility
Replace [content_follower.js]:
function @@T@@(){clearOutput(),shekka.showAll(),author("SomeKindofWizard"),output("You let her know that you’re just down for a chat, and she puts down some miscellaneous machined-piece down on the floor–hopefully that didn’t come from your engine."),processTime(2),clearMenu(),addButton(14,"Back",(function(){return @@RN@@(!0)})),addButton(0,"Places",@@t@@,"Places","Talk to Shekka about some of the places you’ve been."),addButton(1,"People",@@o@@,"People","Talk to Shekka about some of the people you know."),addButton(2,"Infertility",@@a@@,"Infertility","Talk to Shekka about her infertility and potentially repairing it."),
With:
function @@T@@(){clearOutput(),shekka.showAll(),author("SomeKindofWizard"),output("You let her know that you’re just down for a chat, and she puts down some miscellaneous machined-piece down on the floor–hopefully that didn’t come from your engine."),processTime(2),clearMenu(),addButton(14,"Back",(function(){return @@RN@@(!0)})),addButton(0,"Places",@@t@@,"Places","Talk to Shekka about some of the places you’ve been."),addButton(1,"People",@@o@@,"People","Talk to Shekka about some of the people you know."),addButton(2,"Infertility",@@a@@,"Infertility","Talk to Shekka about her infertility and potentially repairing it."),window.tnShekkaGeneButton&&window.tnShekkaGeneButton(3,@@T@@),

# Dr. McAllister's menu in the Xenogen lab (Myrellion): add "Shekka" in the empty slot 2
Replace [content_myrellion.js]:
window.bothriocQuestActive()&&window.bothriocQuestDoctorButton(4,"McAllister"),
With:
window.bothriocQuestActive()&&window.bothriocQuestDoctorButton(4,"McAllister"),window.tnMcAllisterMenuExtra&&window.tnMcAllisterMenuExtra(2,mainGameMenu),
