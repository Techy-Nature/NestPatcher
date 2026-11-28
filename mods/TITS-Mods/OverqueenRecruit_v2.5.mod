Name: Overqueen Recruit
Author: Kitty
Description: Split Mel’Ysolte’s farewell, let you recruit her to the ship, and talk with her there.
# v2.1 (2026-10-25): every sex ending (both Mouth scenes and both Body scenes) now offers Continue + Recruit, so taurs (who only get the Mouth scenes without the gates mod) can recruit her too.
# v2.6 (2026-11-28): Talk menu in her cabin (clan, crews, FIRST-14, why she stays, the crew), ship-mode openings and endings for all four sex scenes, typo and double-space fixes.
# Crew flag, Crew button, and slot count are real. Ship sex is not: it replays the FIRST-14 victory scenes by putting a temporary, unsaved Overqueen in enemy so loadInCunt and the other combat calls have someone to use. She is not a crew creature like Anno. YSOLTE_ON_SHIP only swaps a few station lines while a scene runs.

Replace [content_first14.js]:
\n\n\t<i>“I will ensure that you have safe passage to your vessel, savior [pc.name],”</i> she says clearly, donning her gear. <i>“It is my wish that we meet again, on a better foot... so to speak.”</i>\n\n\tShe’d see you struggling not to laugh, but she’s already gone, vanished into the guts of the station. Rested and extremely satisfied, you pocket the [silly|macguffin you need|ship component], excitement running through you. [rival.name] can’t have gotten far.\n\n\t(<b>Key Item Gained:</b> Plasma Conduit)\n\t"])),e,e)),processTime(20),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,output("\n\n"),O.V.genericVictory()
With:
[flags.YSOLTE_ON_SHIP|\n\n\tAfterward she draws you up into her coils on the bunk and lets the ship’s hum fill the quiet. <i>“Rest, sssavior. The stars will keep for an hour.”</i>\n\n\tYou doze against her warm scales until she nudges you with her snout, a gentle reminder that a captain has a ship to run. She doesn’t let go until you promise to come back.|]"])),e,e)),clearMenu(),1===flags.YSOLTE_CREWMEMBER?addButton(0,"Continue",(function(){flags.YSOLTE_SEXED=(flags.YSOLTE_SEXED||0)+1,1!==flags.YSOLTE_ON_SHIP&&(processTime(20),pc.hasKeyItem("Plasma Conduit")||pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.MET_YSOLTE=1,O.V.genericVictory()),window.tnYsolteCabin()}),"Continue","Back to Mel’Ysolte."):addButton(0,"Continue",(function(){t(!0),output(textify((0,x.Z)(["\n\n\t<i>“I will ensure that you have safe passage to your vessel, savior [pc.name],”</i> she says clearly, donning her gear. <i>“It is my wish that we meet again, on a better foot... so to speak.”</i>\n\n\tShe’d see you struggling not to laugh, but she’s already gone, vanished into the guts of the station. Rested and extremely satisfied, you pocket the [silly|macguffin you need|ship component], excitement running through you. [rival.name] can’t have gotten far.\n\t"]))),processTime(20),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,flags.YSOLTE_RECRUIT_ASK=GetGameTimestamp()+15,output("\n\n"),O.V.genericVictory()}),"Continue","She promises you safe passage, then leaves."),(typeof window.tnYsolteEnabled!=="function"||window.tnYsolteEnabled())&&1!==flags.YSOLTE_CREWMEMBER&&addButton(1,"Recruit",(function(){t(!0),output(textify((0,x.Z)(["\n\n\tYou catch her wrist before the gear goes on. <i>“Come with me. There is room on my ship, and I don’t want this to be a goodbye.”</i>\n\n\tMel’Ysolte goes still. The hood lifts a fraction. <i>“Savior [pc.name]. You would berth an Overqueen?”</i>\n\n\t<i>“I would.”</i>\n\n\tHer smile is slow and very pleased. <i>“Then I will not vanish into the station. I will walk you to your vessel, and I will stay. Safe passage is simpler when I am the one beside you.”</i>\n\n\tShe dresses without letting go of your hand. You pocket the [silly|macguffin you need|ship component], excitement running through you. [rival.name] can’t have gotten far, and the Overqueen is no longer a meeting you have to hope for.\n\n\t(<b>Mel’Ysolte will be aboard your ship.</b>)\n\t"]))),processTime(20),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,flags.YSOLTE_CREWMEMBER=1,output("\n\n"),O.V.genericVictory()}),"Recruit","Ask Mel’Ysolte to come aboard your ship.")

Replace [content_first14.js]:
window.n24bonusFunc=function(){return void 0!==flags.YSOLTE_DEFEATED_YA||void 0!==flags.YSOLTE_DEFEATED_TIME?
With:
window.n24bonusFunc=function(){if((typeof window.tnYsolteEnabled!=="function"||window.tnYsolteEnabled())&&1!==flags.YSOLTE_CREWMEMBER&&(void 0!==flags.YSOLTE_RECRUIT_ASK?GetGameTimestamp()>=flags.YSOLTE_RECRUIT_ASK:1===flags.YSOLTE_SAVED)&&(void 0!==flags.YSOLTE_DEFEATED_YA||void 0!==flags.YSOLTE_DEFEATED_TIME))return clearOutput(),author("William"),output(textify((0,x.Z)(["\n\tMel’Ysolte is coiled among the spare parts, gear on, hood low, as if the station never quite took her back. She looks up the moment you step into the maintenance storage.\n\n\t<i>“Savior [pc.name].”</i> Her tongue flicks, amused. <i>“A quarter of an hour, and you are in my room again. The offer stands. Come aboard your ship with me. I would rather travel at your side than wait in these guts for a better meeting.”</i>\n\t"]))),clearMenu(),addButton(0,"Recruit",window.tnYsolteRecruitHere,"Recruit","Take the Overqueen to your ship."),addButton(1,"Not Now",mainGameMenu,"Not Now","Leave her here. She will ask again."),!0;return void 0!==flags.YSOLTE_DEFEATED_YA||void 0!==flags.YSOLTE_DEFEATED_TIME?

Replace [main.js]:
for(var u in i)i[u].processTime(e,t,a,n);
With:
for(var u in i)i[u].processTime&&i[u].processTime(e,t,a,n);

Replace [content_first14.js]:
window.bossGrab=function(){var e=new $.c;function t(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];clearOutput(),clearMenu(),author("William"),e.showAll(t)}
With:
window.bossGrab=function(tnInit){var e=new $.c;function tnAfter(pt){clearMenu(),addButton(0,"Continue",(function(){t(!0),output(textify((0,x.Z)(["\n\n\tShe promises you safe passage and is gone into the guts of the station before you can say more. You pocket the [silly|macguffin you need|ship component]. [rival.name] can’t have gotten far.\n\t"]))),processTime(pt),pc.hasKeyItem("Plasma Conduit")||pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,flags.YSOLTE_RECRUIT_ASK=GetGameTimestamp()+15,output("\n\n"),O.V.genericVictory()}),"Continue","She promises you safe passage, then leaves."),(typeof window.tnYsolteEnabled!=="function"||window.tnYsolteEnabled())&&1!==flags.YSOLTE_CREWMEMBER&&addButton(1,"Recruit",(function(){t(!0),output(textify((0,x.Z)(["\n\n\tBefore she can slip away, you catch her hand. <i>“Come with me. There is room on my ship, and I don’t want this to be a goodbye.”</i>\n\n\tMel’Ysolte goes still, then smiles, slow and very pleased. <i>“Savior [pc.name]. Then I will not vanish into the station. I will walk you to your vessel, and I will stay.”</i>\n\n\tYou pocket the [silly|macguffin you need|ship component]. [rival.name] can’t have gotten far, and the Overqueen is no longer a meeting you have to hope for.\n\n\t(<b>Mel’Ysolte will be aboard your ship.</b>)\n\t"]))),processTime(pt),pc.hasKeyItem("Plasma Conduit")||pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,flags.YSOLTE_CREWMEMBER=1,flags.YSOLTE_RECRUIT_ASK=0,output("\n\n"),O.V.genericVictory()}),"Recruit","Ask Mel’Ysolte to come aboard your ship."),window.tnModMenuActive===true&&window.tnDebugLog&&window.tnDebugLog("[Overqueen] after-scene menu shown")}window.tnNewYsolte=function(){return new $.c};function t(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];clearOutput(),clearMenu(),author("William"),(window.tnYsolteActive||e).showAll(t)}if(tnInit){flags.YSOLTE_SHIP_INIT=1;tnVictory();flags.YSOLTE_SHIP_INIT=0;return;}flags.YSOLTE_ON_SHIP=0;

Replace [content_first14.js]:
,O.V.victoryScene((function(){t(),output(textify(M||
With:
;function tnVictory(){if(1===flags.YSOLTE_SHIP_INIT){tnIntervene();return;}t(),output(textify(M||

Replace [content_first14.js]:
for the goose is good for the gander.")})),O.V.lossScene((function(){enemy.hasS
With:
for the goose is good for the gander.")}O.V.victoryScene(tnVictory),O.V.lossScene((function(){enemy.hasS

Replace [content_first14.js]:
"])),e)),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,O.V.genericVictory()
With:
"])),e)),1===flags.YSOLTE_ON_SHIP?(flags.YSOLTE_SEXED=(flags.YSOLTE_SEXED||0)+1,clearMenu(),addButton(0,"Back",window.tnYsolteCabin,"Back","Back to her cabin on the ship.")):tnAfter(0)

Replace [content_first14.js]:
pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,processTime(5),O.V.genericVictory()
With:
1===flags.YSOLTE_ON_SHIP?(flags.YSOLTE_SEXED=(flags.YSOLTE_SEXED||0)+1,clearMenu(),addButton(0,"Back",window.tnYsolteCabin,"Back","Back to her cabin on the ship.")):tnAfter(5)

Replace [content_first14.js]:
processTime(15),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,O.V.genericVictory()
With:
1===flags.YSOLTE_ON_SHIP?(flags.YSOLTE_SEXED=(flags.YSOLTE_SEXED||0)+1,clearMenu(),addButton(0,"Back",window.tnYsolteCabin,"Back","Back to her cabin on the ship.")):tnAfter(15)

Replace [content_first14.js]:
processTime(20),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,flags.YSOLTE_RECRUIT_ASK=GetGameTimestamp()+15,output("\n\n"),O.V.genericVictory()
With:
1===flags.YSOLTE_ON_SHIP?(flags.YSOLTE_SEXED=(flags.YSOLTE_SEXED||0)+1,clearMenu(),addButton(0,"Back",window.tnYsolteCabin,"Back","Back to her cabin on the ship.")):(processTime(20),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,flags.YSOLTE_RECRUIT_ASK=GetGameTimestamp()+15,output("\n\n"),O.V.genericVictory())

Replace [content_first14.js]:
processTime(20),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,flags.YSOLTE_CREWMEMBER=1,output("\n\n"),O.V.genericVictory()
With:
1===flags.YSOLTE_ON_SHIP?(flags.YSOLTE_SEXED=(flags.YSOLTE_SEXED||0)+1,clearMenu(),addButton(0,"Back",window.tnYsolteCabin,"Back","Back to her cabin on the ship.")):(processTime(20),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,flags.YSOLTE_CREWMEMBER=1,output("\n\n"),O.V.genericVictory())

Replace [content_first14.js]:
addButton(0,"Intervene!",(function(){function e(e){t(!0),output(textify(q||
With:
addButton(0,"Intervene!",tnIntervene,"Intervene!","She may be an enemy, but not even she deserves electrocution.");function tnIntervene(){if(1===flags.YSOLTE_SHIP_INIT){window.tnYsolteMouthCock=e;window.tnYsolteMouthCunt=o;window.tnYsolteBodyCock=n;window.tnYsolteBodyCunt=a;return;}function e(e){t(!0),output(textify(q||

Replace [content_first14.js]:
}),"Intervene!","She may be an enemy, but not even she deserves electrocution."),addButton(1,"Stand Aside"
With:
}addButton(1,"Stand Aside"

# v2.6 (2026-11-28): ship-mode text. On the ship she no longer trades names like a stranger or says goodbye like the station farewell, and the Body(Cock) scene gets its ending back. Typos fixed in both modes. Station text is unchanged otherwise.

# Mouth(Cock): no name swap on the ship
Replace [content_first14.js]:
<i>“[pc.nmh\n\t\t|I think we can come to an arrangement. What’s your name?\n\t\t|You have no idea. So what do they call you? Besides ‘Mistress’, I’m sure.\n\t\t|We’ll see about that. First, your name. Let’s start off right.\n\t]”</i>\n\t\n\t<i>“Mel’Ysolte,”</i> the overqueen says softly. <i>“Overqueen Mel’Ysolte of the Mellifla Clan... but none of that matters here, to either of us.”</i>
With:
[flags.YSOLTE_ON_SHIP|<i>“[pc.nmh\n\t\t|Missed me, Your Majesty?\n\t\t|You know exactly what I came in here for.\n\t\t|Go on, then. Show me why they call you Overqueen.\n\t]”</i>\n\t\n\t<i>“My sssavior,”</i> the overqueen says softly. <i>“Out there I am Overqueen Mel’Ysolte of the Mellifla Clan... but none of that matters in here, to either of us.”</i>|<i>“[pc.nmh\n\t\t|I think we can come to an arrangement. What’s your name?\n\t\t|You have no idea. So what do they call you? Besides ‘Mistress’, I’m sure.\n\t\t|We’ll see about that. First, your name. Let’s start off right.\n\t]”</i>\n\t\n\t<i>“Mel’Ysolte,”</i> the overqueen says softly. <i>“Overqueen Mel’Ysolte of the Mellifla Clan... but none of that matters here, to either of us.”</i>]

# Mouth(Cock): drop the fight line on the ship, one space
Replace [content_first14.js]:
In the moment you feel like a real Casanova. Sure: moments ago she was trying to clobber you into submission, but look what a little understanding can do for a relationship. Lust surges
With:
In the moment you feel like a real Casanova. [flags.YSOLTE_ON_SHIP||Sure: moments ago she was trying to clobber you into submission, but look what a little understanding can do for a relationship. ]Lust surges

# Mouth(Cock): she already knows your name
Replace [content_first14.js]:
Gestures of affection. <i>“And you? Sssavior...”</i>\n\t\n\tThe little bit of cheek in her self-assured tones makes you smile. Well, they’ve always told you never to keep a lady waiting, and to make your first introductions powerful.
With:
[flags.YSOLTE_ON_SHIP|Gestures of affection. <i>“Well? Show me, sssavior...”</i>\n\t\n\tThe little bit of cheek in her self-assured tones makes you smile. You’ve never been one to keep a lady waiting, least of all a queen who has made a nest of your ship.|Gestures of affection. <i>“And you? Sssavior...”</i>\n\t\n\tThe little bit of cheek in her self-assured tones makes you smile. Well, they’ve always told you never to keep a lady waiting, and to make your first introductions powerful.]

# Mouth(Cock): answer on the ship
Replace [content_first14.js]:
<i>“[pc.name],”</i> you answer. <i>“You could say this place technically belongs to me, but that doesn’t matter right now.”</i>
With:
[flags.YSOLTE_ON_SHIP|<i>“All yours, Your Majesty,”</i> you answer.|<i>“[pc.name],”</i> you answer. <i>“You could say this place technically belongs to me, but that doesn’t matter right now.”</i>]

# Mouth(Cock): no name echo on the ship
Replace [content_first14.js]:
<i>“Ssssteele? Mmm... [pc.name] Steele,”</i> she murmurs, slathering your bare meat in velvety strokes. <i>“A powerful name for a savior. And a strong taste.”</i>
With:
[flags.YSOLTE_ON_SHIP|<i>“Mmm... my [pc.name],”</i> she murmurs, slathering your bare meat in velvety strokes. <i>“I never tire of this taste.”</i>|<i>“Ssssteele? Mmm... [pc.name] Steele,”</i> she murmurs, slathering your bare meat in velvety strokes. <i>“A powerful name for a savior. And a strong taste.”</i>]

# Mouth(Cock): typo
Replace [content_first14.js]:
With grit teeth and white-knuckled
With:
With gritted teeth and white-knuckled

# Mouth(Cock): champion line off on the ship, one space
Replace [content_first14.js]:
wayward sisters. And, perhaps, you can think of this as preparation for the future. It doesn’t do well for a champion to be so easily defeated.
With:
wayward sisters.[flags.YSOLTE_ON_SHIP|| And, perhaps, you can think of this as preparation for the future. It doesn’t do well for a champion to be so easily defeated.]

# Mouth(Cock): typo, ship line
Replace [content_first14.js]:
the best thing you’ve done all since landing on this miserable station... and feeding her desperate thirst might just be better than repairing the ship.
With:
the best thing you’ve done [flags.YSOLTE_ON_SHIP|since she came aboard your ship... and feeding her desperate thirst might just beat anything else on today’s list|since landing on this miserable station... and feeding her desperate thirst might just be better than repairing the ship].

# Mouth(Cock): typo
Replace [content_first14.js]:
On the snakely approximate to her knees
With:
On the snakely equivalent of her knees

# Mouth(Cock): typo
Replace [content_first14.js]:
bulbous magnitude of it to the point glows
With:
bulbous magnitude of it to the point it glows

# Mouth(Cock): not a first meeting on the ship
Replace [content_first14.js]:
You’ve just met, and this is crazy, but you think she loves your dick.
With:
[flags.YSOLTE_ON_SHIP|You’ve done this enough times by now to know|You’ve just met, and this is crazy, but you think] she loves your dick.

# Mouth(Cock): typo
Replace [content_first14.js]:
As she availts herself
With:
As she avails herself

# Mouth(Cock): ship line
Replace [content_first14.js]:
the frustrations you’ve bottled up since coming here.
With:
the frustrations you’ve bottled up since [flags.YSOLTE_ON_SHIP|your last visit to her bunk|coming here].

# Mouth(Cock): ship line
Replace [content_first14.js]:
was <b>worth</b> getting waylaid for.
With:
was <b>worth</b> [flags.YSOLTE_ON_SHIP|making room for on your ship|getting waylaid for].

# Mouth(Cock): ship line
Replace [content_first14.js]:
Preferably in an altogether more private, incensing environment than some dingy closet.
With:
Preferably [flags.YSOLTE_ON_SHIP|right here in her cabin, as often as you will let her|in an altogether more private, incensing environment than some dingy closet].

# Mouth(Cock): ship ending, no Key Item line
Replace [content_first14.js]:
<i>“We have an understanding, [pc.name]... you will be able to return to your vessel, untouched. Perhaps we will meet again... and we may pick up where we leave off.”</i>\n\n\tMaybe. The Overqueen departs like a cloth drifting in the wind, the wonder and satisfaction of being awarded such a perfect blowjob still shimmering in your body.\n\n\t(<b>Key Item Gained:</b> Plasma Conduit)\n\t
With:
[flags.YSOLTE_ON_SHIP|<i>“We have an understanding, [pc.name]. You need not go anywhere... lie still, and we may pick up where we leave off.”</i>\n\n\tYou don’t argue. The Overqueen stays coiled against you on the bunk, her hood resting against you, the wonder of that blowjob still shimmering in your body.|<i>“We have an understanding, [pc.name]... you will be able to return to your vessel, untouched. Perhaps we will meet again... and we may pick up where we leave off.”</i>\n\n\tMaybe. The Overqueen departs like a cloth drifting in the wind, the wonder and satisfaction of being awarded such a perfect blowjob still shimmering in your body.]\n\t

# Mouth(Cunt): no name swap on the ship
Replace [content_first14.js]:
[pc.nmh\n\t\t|<i>“Best way to start a friendship is a simple greeting. What’s your name?”</i> you ask coyly.\n\t\t|<i>“Oh we can be plenty more, but I’ll need your name first...”</i> you reply, grinning.\n\t\t|<i>“Yeah, you can be a lot more to me. Tell me your name first,”</i> you answer simply.\n\t]\n\t\n\t<i>“Mel’Ysolte,”</i> the overqueen says softly. <i>“Overqueen Mel’Ysolte of the Mellifla Clan... but none of that matters here, to either of us.”</i>
With:
[flags.YSOLTE_ON_SHIP|[pc.nmh\n\t\t|<i>“I was hoping you’d be in the mood,”</i> you say coyly.\n\t\t|<i>“Your tongue is the best thing on this ship, you know that?”</i> you say, grinning.\n\t\t|<i>“Your Majesty. I came for that tongue,”</i> you say simply.\n\t]\n\t\n\t<i>“Then you shall have it,”</i> the overqueen says softly. <i>“Out there I am Overqueen Mel’Ysolte of the Mellifla Clan... but none of that matters in here, to either of us.”</i>|[pc.nmh\n\t\t|<i>“Best way to start a friendship is a simple greeting. What’s your name?”</i> you ask coyly.\n\t\t|<i>“Oh we can be plenty more, but I’ll need your name first...”</i> you reply, grinning.\n\t\t|<i>“Yeah, you can be a lot more to me. Tell me your name first,”</i> you answer simply.\n\t]\n\t\n\t<i>“Mel’Ysolte,”</i> the overqueen says softly. <i>“Overqueen Mel’Ysolte of the Mellifla Clan... but none of that matters here, to either of us.”</i>]

# Mouth(Cunt): she already knows your name
Replace [content_first14.js]:
faint signals of affection. <i>“And what is your name, sssavior?”</i>\n\t\n\tHearing that title tickles you a bit.
With:
[flags.YSOLTE_ON_SHIP|faint signals of affection. <i>“Well, sssavior? Show your queen what you want.”</i>\n\t\n\tHearing her call you that still tickles you a bit.|faint signals of affection. <i>“And what is your name, sssavior?”</i>\n\t\n\tHearing that title tickles you a bit.]

# Mouth(Cunt): answer on the ship
Replace [content_first14.js]:
<i>“[pc.name]. Technically, this station belongs to me, but that’s not important right now.”</i>
With:
[flags.YSOLTE_ON_SHIP|<i>“This, Your Majesty. Right here.”</i>|<i>“[pc.name]. Technically, this station belongs to me, but that’s not important right now.”</i>]

# Mouth(Cunt): no name echo on the ship
Replace [content_first14.js]:
<i>“Sssteele, then...? [pc.name] Steele, the name of my savior.”</i>
With:
[flags.YSOLTE_ON_SHIP|<i>“Mmm... my [pc.name]. My savior.”</i>|<i>“Sssteele, then...? [pc.name] Steele, the name of my savior.”</i>]

# Mouth(Cunt): ship line
Replace [content_first14.js]:
I might miss this taste, this heat!
With:
I [flags.YSOLTE_ON_SHIP|will never tire of|might miss] this taste, this heat!

# Mouth(Cunt): comma, ship line
Replace [content_first14.js]:
Ysolte employs a number of gryvain and that is the likeliest explanation
With:
Ysolte [flags.YSOLTE_ON_SHIP|has worked beside a great many gryvain|employs a number of gryvain], and that is the likeliest explanation

# Mouth(Cunt): ship line
Replace [content_first14.js]:
Maybe this detour isn’t so bad after all. In the grand scheme of things it sets you back, but you have
With:
[flags.YSOLTE_ON_SHIP|Having a queen aboard has its perks. You have|Maybe this detour isn’t so bad after all. In the grand scheme of things it sets you back, but you have]

# Mouth(Cunt): ship ending, no Key Item line
Replace [content_first14.js]:
<i>“I will ensure that you may reach your ship unharmed. I will remember this meeting. Perhaps, one day, we may have the opportunity to work together, instead of skulk and fight against one another.”</i>\n\n\tYou wouldn’t mind that; Overqueen Mel’Ysolte slithers from the room, disappearing into the guts of her territory once again. For all intents and purposes, that felt like a one-night stand... but you kind of hope you meet her again. That tongue was wild!\n\n\t(<b>Key Item Gained:</b> Plasma Conduit)\n\n\t
With:
[flags.YSOLTE_ON_SHIP|<i>“Stay a while. Your ship can spare its captain for an hour, and your queen is comfortable.”</i>\n\n\tYou don’t mind that at all. Overqueen Mel’Ysolte settles back into her coils on the bunk and drapes a loop of tail over your [pc.legOrLegs], keeping you close. That tongue was wild!|<i>“I will ensure that you may reach your ship unharmed. I will remember this meeting. Perhaps, one day, we may have the opportunity to work together, instead of skulk and fight against one another.”</i>\n\n\tYou wouldn’t mind that; Overqueen Mel’Ysolte slithers from the room, disappearing into the guts of her territory once again. For all intents and purposes, that felt like a one-night stand... but you kind of hope you meet her again. That tongue was wild!]\n\n\t

# Body(Cock): no name swap on the ship
Replace [content_first14.js]:
<i>“[pc.nmh\n\t\t|What should I call my queen?\n\t\t|What else do they call you? Besides ‘Queen’.\n\t\t|Might as well tell me what name to think about.\n\t]”</i>\n\t\n\t<i>“Mel’Ysolte,”</i> the royal viper softly replies. <i>“Overqueen Mel’Ysolte of the Mellifla Clan. But don’t concern yourself with that part.”</i>\n\t\n\t<i>“Note taken,”</i> you reply, restarting the kiss with a bear hug that pushes her to the ground. <i>“[pc.name] Steele...”</i> There’s an erotic headiness to your dominance that goes beyond the thrills of pitching in sex. <i>“Guess it’d be pointless to remind you this place is technically mine...”</i>\n\t\n\t<i>“Sssteele? Mmff, [pc.name] Steele, the name of a sssavior.”</i>
With:
[flags.YSOLTE_ON_SHIP|<i>“[pc.nmh\n\t\t|Do you know how much I missed this?\n\t\t|How does my queen want me today?\n\t\t|Ready for me, Your Majesty?\n\t]”</i>\n\t\n\t<i>“Sssuch questions,”</i> the royal viper softly replies, hood lifting. <i>“You know the answer, [pc.name]. You always do.”</i>\n\t\n\t<i>“Then I’ll show you,”</i> you reply, restarting the kiss with a bear hug that pushes her down onto the bunk. There’s an erotic headiness to your dominance that goes beyond the thrills of pitching in sex. <i>“Guess it’d be pointless to remind you whose cabin this is...”</i>\n\t\n\t<i>“Mmff. Mine, sssavior. And so are you.”</i>|<i>“[pc.nmh\n\t\t|What should I call my queen?\n\t\t|What else do they call you? Besides ‘Queen’.\n\t\t|Might as well tell me what name to think about.\n\t]”</i>\n\t\n\t<i>“Mel’Ysolte,”</i> the royal viper softly replies. <i>“Overqueen Mel’Ysolte of the Mellifla Clan. But don’t concern yourself with that part.”</i>\n\t\n\t<i>“Note taken,”</i> you reply, restarting the kiss with a bear hug that pushes her to the ground. <i>“[pc.name] Steele...”</i> There’s an erotic headiness to your dominance that goes beyond the thrills of pitching in sex. <i>“Guess it’d be pointless to remind you this place is technically mine...”</i>\n\t\n\t<i>“Sssteele? Mmff, [pc.name] Steele, the name of a sssavior.”</i>]

# Body(Cock): enemy line off on the ship, one space
Replace [content_first14.js]:
It’s not that she’s a queen, or that she was your enemy... it’s that
With:
It’s not that she’s a queen,[flags.YSOLTE_ON_SHIP|| or that she was your enemy...] it’s that

# Body(Cock): typo
Replace [content_first14.js]:
your saddle-able halve,
With:
your saddle-able half,

# Body(Cock): stray quote mark
Replace [content_first14.js]:
desire smoldering in hers."
With:
desire smoldering in hers.

# Body(Cock): ship line
Replace [content_first14.js]:
demonstrate your fitness per a newfound alliance.
With:
demonstrate your fitness [flags.YSOLTE_ON_SHIP|to the queen who chose your ship|per a newfound alliance].

# Body(Cock): ship line
Replace [content_first14.js]:
is that I couldn’t have been more foolish in misjudging you.”</i>
With:
is that I [flags.YSOLTE_ON_SHIP|chose well when I came aboard your ship|couldn’t have been more foolish in misjudging you].”</i>

# Body(Cock): ship line
Replace [content_first14.js]:
about being forced into coming here.
With:
about [flags.YSOLTE_ON_SHIP|ever being stranded on FIRST-14|being forced into coming here].

# Body(Cock): ship line
Replace [content_first14.js]:
you spend the time getting to know an Overqueen. You are predictably stonewalled on intimately personal questions, but she’s glad to explain her operations and goals.
With:
[flags.YSOLTE_ON_SHIP|you spend the time getting to know your Overqueen a little better. She still keeps the most personal things to herself, but she’s glad to talk of her clan and her old crews.|you spend the time getting to know an Overqueen. You are predictably stonewalled on intimately personal questions, but she’s glad to explain her operations and goals.]

# Body(Cock): ship line
Replace [content_first14.js]:
Although any intimately personal questions are stonewalled, she talks briefly of her operations and her goals:
With:
[flags.YSOLTE_ON_SHIP|She still keeps the most personal things to herself, but she talks briefly of her clan and her goals:|Although any intimately personal questions are stonewalled, she talks briefly of her operations and her goals:]

# Body(Cock): ship line
Replace [content_first14.js]:
a [pc.cumVisc] going-away present down her throat
With:
a [pc.cumVisc] [flags.YSOLTE_ON_SHIP|reward|going-away present] down her throat

# Body(Cunt): no name swap on the ship, make out
Replace [content_first14.js]:
<i>“Mel’Ysolte,”</i> intones the stately viper. <i>“Overqueen Mel’Ysolte of the Mellifla Clan; but in this room there is only you and I, sssavior.”</i>\n\t\n\tInfatuated by her lips, you seize upon the once-in-a-lifetime invitation to makeout with alien nobility.
With:
[flags.YSOLTE_ON_SHIP|<i>“Sssavior,”</i> intones the stately viper. <i>“Out there I am Overqueen Mel’Ysolte of the Mellifla Clan; but in this cabin there is only you and I.”</i>\n\t\n\tInfatuated by her lips, you seize upon the invitation, as eager as the first time you made out with alien nobility.|<i>“Mel’Ysolte,”</i> intones the stately viper. <i>“Overqueen Mel’Ysolte of the Mellifla Clan; but in this room there is only you and I, sssavior.”</i>\n\t\n\tInfatuated by her lips, you seize upon the once-in-a-lifetime invitation to make out with alien nobility.]

# Body(Cunt): no name swap on the ship
Replace [content_first14.js]:
<i>“[pc.nmh\n\t\t|[pc.name]... that’s my name. And, well... I sort of own this station, but I guess that’s not important.\n\t\t|Guess it’s bad form to kiss a lady and not introduce myself — [pc.name]... and this place is technically mine but nevermind that.\n\t\t|[pc.name] — you keep that name in your head from now on; this room, and this station, belong to me.\n\t]”</i>\n\t\n\tThe Overqueen’s lips purse into a heart-stopping pout, the most delicate tones hissing through them. <i>“[pc.name] Sssteele... I see. I would prefer to see more of your honesty, however.”</i>
With:
[flags.YSOLTE_ON_SHIP|<i>“[pc.nmh\n\t\t|I missed you, you know. The ship’s too quiet when I’m not in here.\n\t\t|Guess most captains don’t get to kiss royalty in their own cabins.\n\t\t|You keep that tongue right where it is from now on, my queen.\n\t]”</i>\n\t\n\tThe Overqueen’s lips purse into a heart-stopping pout, the most delicate tones hissing through them. <i>“Sssweet words, [pc.name]. I would prefer to see more of you, however.”</i>|<i>“[pc.nmh\n\t\t|[pc.name]... that’s my name. And, well... I sort of own this station, but I guess that’s not important.\n\t\t|Guess it’s bad form to kiss a lady and not introduce myself — [pc.name]... and this place is technically mine but nevermind that.\n\t\t|[pc.name] — you keep that name in your head from now on; this room, and this station, belong to me.\n\t]”</i>\n\t\n\tThe Overqueen’s lips purse into a heart-stopping pout, the most delicate tones hissing through them. <i>“[pc.name] Sssteele... I see. I would prefer to see more of your honesty, however.”</i>]

# Body(Cunt): ship line
Replace [content_first14.js]:
driving all lingering memories of your previous fight from you — but this can’t be a second, third, or umpteenth time.\n\t\n\tIt <b>has</b> to be her first time writhing in merry havoc against another.
With:
[flags.YSOLTE_ON_SHIP|driving every other thought from you — but she still writhes as though this were the first time.\n\t\n\tNo one else has ever writhed in merry havoc against her like this.|driving all lingering memories of your previous fight from you — but this can’t be a second, third, or umpteenth time.\n\t\n\tIt <b>has</b> to be her first time writhing in merry havoc against another.]

# Body(Cunt): typo
Replace [content_first14.js]:
you derived unlimited vigor
With:
you derive unlimited vigor

# Body(Cunt): ship ending, no Key Item line
Replace [content_first14.js]:
It’s easy to feel depressed when she unravels. The warmth, gone. The closeness, gone. Space is cold and lonely again. The Overqueen gathers her things, redresses, and inclines her head and hood. <i>“You will find your journey through the station will be much safer. I give my word... and a silly thought. Perhaps you and I will meet again, [pc.name] Sssteele, on better terms.”</i>\n\n\tThat’d be nice. With that, she departs, slithering back into the station’s walls. Whether or not you’ll see her again you can’t be sure, but as you heft [silly|the macguffin|ship component], your mind turns to the Rush, to the inheritance, and your damnable cousin.\n\n\tBut you admit to some amount of excitement. This detour wasn’t a complete waste of time.\n\n\t(<b>Key Item Gained:</b> Plasma Conduit)\n\t
With:
[flags.YSOLTE_ON_SHIP|She doesn’t unravel. Not yet. The Overqueen tightens her coils a little, inclining her head and hood until her snout rests against your cheek. <i>“Stay. Your ship will not fly into trouble in the next hour, and I am comfortable, [pc.name] Sssteele.”</i>\n\n\tThat’s fine by you. You stay wrapped in your queen’s coils on the bunk until the ship’s hum lulls you both into another doze. When you finally slip free, your mind turns to the Rush, to the inheritance, and to your damnable cousin.\n\n\tBut you admit to some amount of excitement. Having a queen aboard has its perks.|It’s easy to feel depressed when she unravels. The warmth, gone. The closeness, gone. Space is cold and lonely again. The Overqueen gathers her things, redresses, and inclines her head and hood. <i>“You will find your journey through the station will be much safer. I give my word... and a silly thought. Perhaps you and I will meet again, [pc.name] Sssteele, on better terms.”</i>\n\n\tThat’d be nice. With that, she departs, slithering back into the station’s walls. Whether or not you’ll see her again you can’t be sure, but as you heft [silly|the macguffin|ship component], your mind turns to the Rush, to the inheritance, and your damnable cousin.\n\n\tBut you admit to some amount of excitement. This detour wasn’t a complete waste of time.]\n\t

# Kept from v2.5
Replace [content_first14.js]:
You lift yourself from the floor
With:
You lift yourself from the [flags.YSOLTE_ON_SHIP|bunk|floor]

# Kept from v2.5
Replace [content_first14.js]:
roster on the rest of the station
With:
roster [flags.YSOLTE_ON_SHIP|from before she came aboard|on the rest of the station]

# Kept from v2.5
Replace [content_first14.js]:
your once-foe’s tongue
With:
your [flags.YSOLTE_ON_SHIP|lover’s|once-foe’s] tongue

# Kept from v2.5
Replace [content_first14.js]:
A little, but I fought you off, didn’t I?
With:
[flags.YSOLTE_ON_SHIP|A little.|A little, but I fought you off, didn’t I?]

Replace [content_first14.js]:
processTime(5),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,O.V.genericVictory()}),"Her Gratitude"
With:
clearMenu(),addButton(0,"Continue",function(){processTime(5),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.MET_YSOLTE=1,flags.YSOLTE_RECRUIT_ASK=GetGameTimestamp()+15,O.V.genericVictory()},"Continue","Leave Mel’Ysolte and return after fifteen minutes."),(typeof window.tnYsolteEnabled!=="function"||window.tnYsolteEnabled())&&1!==flags.YSOLTE_CREWMEMBER&&addButton(1,"Recruit",function(){processTime(5),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.MET_YSOLTE=1,flags.YSOLTE_CREWMEMBER=1,flags.YSOLTE_RECRUIT_ASK=0,O.V.genericVictory()},"Recruit","Invite Mel’Ysolte to join your crew now.")}),"Her Gratitude"

Add Javascript:
window.tnYsolteRecruitHere = function () {
    clearOutput();
    author("William");
    output("She rises, coils gathering, and bows her head just enough to still be a queen.\n\n<i>“Then I am yours to house. Take me to your vessel. I will not vanish this time.”</i>\n\nMel’Ysolte stays at your side. The maintenance storage is just a room again.");
    flags.YSOLTE_CREWMEMBER = 1;
    processTime(5);
    clearMenu();
    addButton(0, "Next", mainGameMenu, "Next", "Back to the station.");
};

window.tnYsolteEnabled = function () {
    return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled("tn.overqueen");
};
// Retry for up to 2 minutes; stop after 3 seconds if no TN menu is running.
(function tnYsolteRegister(tries) {
    tries = tries || 0;
    if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) {
        if (!(window.tnModMenuActive === false && tries >= 6) && tries < 240) setTimeout(function () { tnYsolteRegister(tries + 1); }, 500);
        return;
    }
    window.registerModMenu({ id:"tn.overqueen", name:"Overqueen Recruit", author:"Kitty",
        description:"Recruitment, ship cabin and crew access (existing code changes stay installed).", supportsToggle:true });
})();
window.tnYsolteEnsure = function () {
    if (typeof window.tnYsolteMouthCock === "function") return true;
    if (typeof window.bossGrab !== "function") return false;
    window.bossGrab(true);
    return typeof window.tnYsolteMouthCock === "function";
};

window.tnYsolteRun = function (fn, vagina) {
    if (!window.tnYsolteEnabled()) return;
    flags.YSOLTE_ON_SHIP = 1;
    var queen = typeof window.tnNewYsolte === "function" ? window.tnNewYsolte() : window.tnYsolteActive;
    window.tnYsolteActive = queen;
    window.enemy = queen;
    if (vagina && typeof window.vaginaRouter === "function") window.vaginaRouter(fn, 0, 0, 0);
    else if (!vagina && typeof window.penisRouter === "function") window.penisRouter(fn, 80085, false, 0);
    else fn(0);
};

window.tnYsolteCabin = function () {
    if (!window.tnYsolteEnabled()) { if(typeof mainGameMenu === "function") mainGameMenu(); return; }
    flags.YSOLTE_ON_SHIP = 0;
    if (window.enemy && window.tnYsolteActive && window.enemy === window.tnYsolteActive) window.enemy = null;
    clearOutput();
    clearBust();
    showBust("OVERQUEEN");
    if (typeof showName === "function") showName("Mel’Ysolte");
    author("William");
    output("Mel’Ysolte is coiled on a bunk she has claimed, hood lifted, the ship humming under her scales.\n\n<i>“Savior. You came to me here, aboard your ship. What do you want of your queen?”</i>");
    clearMenu();
    if (!window.tnYsolteEnsure()) {
        output("\n\nHer portrait is here, but the sex scenes have not been armed yet.");
        addButton(0, "Back", mainGameMenu, "Back", "Leave her cabin.");
        addButton(5, "Talk", window.tnYsolteTalk, "Talk", "Talk with her about her clan, how she came to FIRST-14, and the rest of your crew.");
        return;
    }
    if (pc.hasCock()) addButton(0, "Mouth(Cock)", function () { window.tnYsolteRun(window.tnYsolteMouthCock, false); }, "Her Mouth (Cock)", "Her tongue, on your cock, in her cabin.");
    else addDisabledButton(0, "Mouth(Cock)", "Her Mouth (Cock)", "You need a penis for this.");
    if (pc.hasVagina()) addButton(1, "Mouth(Cunt)", function () { window.tnYsolteRun(window.tnYsolteMouthCunt, true); }, "Her Mouth (Cunt)", "Her tongue, on your cunt, in her cabin.");
    else addDisabledButton(1, "Mouth(Cunt)", "Her Mouth (Cunt)", "You need a vagina for this.");
    // Taurs are kept out of the Body scenes, as on the station, unless the taur/naga bypass toggle is on.
    var taurBlock = pc.isTaur() && !(typeof window.tnBB === "function" && window.tnBB(pc));
    if (pc.hasCock() && !taurBlock) addButton(2, "Body(Cock)", function () { window.tnYsolteRun(window.tnYsolteBodyCock, false); }, "Her Body (Cock)", "Take her on the bunk.");
    else addDisabledButton(2, "Body(Cock)", "Her Body (Cock)", taurBlock ? "Your body configuration makes this impossible." : "You need a penis for this.");
    if (pc.hasVagina() && !taurBlock) addButton(3, "Body(Cunt)", function () { window.tnYsolteRun(window.tnYsolteBodyCunt, true); }, "Her Body (Cunt)", "Tribadism, in her cabin.");
    else addDisabledButton(3, "Body(Cunt)", "Her Body (Cunt)", taurBlock ? "Your body configuration makes this impossible." : "You need a vagina for this.");
    addButton(4, "Unrecruit", window.tnYsolteUnrecruit, "Unrecruit", "Send her back to the maintenance storage where you met her.");
    addButton(5, "Talk", window.tnYsolteTalk, "Talk", "Talk with her about her clan, how she came to FIRST-14, and the rest of your crew.");
    addButton(14, "Back", mainGameMenu, "Back", "Leave her to her coils.");
};

// ---------- v2.6 (2026-11-28): Talk. Her clan, her salvage crews, FIRST-14, and the rest of your crew. Written by Neston. ----------
(function () {
    function q(t) { return "<i>“" + t + "”</i>"; }
    function safe(fn, dflt) { try { return fn(); } catch (err) { return dflt; } }
    // A game crew member is a global character object with isCrew(); fall back to the game's own flag.
    function crew(name, flagTest) {
        return safe(function () {
            var c = window[name];
            if (c && typeof c.isCrew === "function") return !!c.isCrew();
            return !!flagTest();
        }, false);
    }
    function snake() { return window.tnSnakeCollar || null; }
    var T = {
        anno: function () { return crew("anno", function () { return flags.ANNO_CREWMEMBER === 1; }); },
        syri: function () { return crew("syri", function () { return flags.SYRI_CREWMEMBER === 1; }); },
        shekka: function () { return crew("shekka", function () { return flags.SHEKKA_ONBOARD !== undefined; }); },
        viper: function () {
            return safe(function () {
                var s = snake();
                if (s && typeof s.crewCount === "function") return s.crewCount() > 0;
                return flags.TN_VIPER_COLLARED === 1 && flags.TN_VIPER_BOUGHT === 1 && flags.TN_VIPER_CREW === 1;
            }, false);
        },
        breaker: function () { return safe(function () { return flags.SLAVEBREAKER_CREW === 1; }, false); },
        dane: function () { return safe(function () { return typeof window.tnDaneAboard === "function" ? !!window.tnDaneAboard() : flags.TN_DANE_CREW === 1; }, false); }
    };
    function viperEgg(m) { return safe(function () { var s = snake(); return !!(s && typeof s.pregnant === "function" && s.pregnant(m)); }, false); }
    function shekkaEgg() { return safe(function () { return !!(window.tnShekkaEggs && window.tnShekkaEggs.pregnant()); }, false); }

    function open() {
        clearOutput();
        clearBust();
        showBust("OVERQUEEN");
        if (typeof showName === "function") showName("Mel’Ysolte");
        author("Neston");
    }
    function done(back) {
        processTime(10);
        clearMenu();
        addButton(0, "Next", back, "Next", "Back to talking with her.");
    }

    window.tnYsolteTalk = function () {
        open();
        output("You settle on the edge of her bunk. Mel’Ysolte unwinds a coil to make room and lifts her hood, curious.\n\n" + q("Talk, then. I am listening, sssavior."));
        clearMenu();
        addButton(0, "Her Clan", window.tnYsolteTalkClan, "Her Clan", "Ask how an Overqueen comes to be, and what the Mellifla Clan is.");
        addButton(1, "Her Crews", window.tnYsolteTalkCrews, "Her Crews", "Ask about the salvage crews she led before she came aboard.");
        addButton(2, "FIRST-14", window.tnYsolteTalkStation, "FIRST-14", "Ask how she ended up on an abandoned Steele Tech station.");
        addButton(3, "Why Stay?", window.tnYsolteTalkStay, "Why Stay?", "Ask why an Overqueen would berth on someone else’s ship.");
        addButton(4, "The Crew", window.tnYsolteTalkCrew, "The Crew", "Ask what she thinks of the others aboard.");
        addButton(14, "Back", window.tnYsolteCabin, "Back", "Back to her cabin.");
    };

    window.tnYsolteTalkClan = function () {
        open();
        output("You ask her about the Mellifla Clan, and where an Overqueen comes from.");
        output("\n\nMel’Ysolte’s hood settles. " + q("You know of overkings and overqueens, I think. Every clan on Drethfoll has one at its head. Most are born to it, the children of a clan’s own over-parents. They inherit the name, the halls, the people. Everything.") + " Her tongue flicks out and back. " + q("I did not. Once in a very long while an overqueen hatches to an ordinary mother and father. One in a million, the elders say. The clan that raised me could not keep me. One clan cannot have two queens, so I was given my name and sent out to build a clan of my own."));
        output("\n\n" + q("So the Mellifla Clan is...?"));
        output("\n\n" + q("Mine. Every soul in it came to me because I asked them, or paid them, or pulled them out of a wreck. There was no inheritance and no court. There was a borrowed ship, a salvage license, and a great many debts.") + " A dry little hiss that might be a laugh. " + q("Our people say an overqueen labors for those beneath her, and not the other way around. Most queens learn that from their tutors. I learned it hauling hull plate beside my first crew."));
        output("\n\nShe tugs the red tie at her throat straight. " + q("When the Rush opened, every young overqueen with a ship went out to the frontier. Mercenaries, salvagers, couriers, hundreds of us. A legacy is easier to build where nobody has staked a claim. I meant to go home with a clan worth the name.") + " Her eyes find yours. " + q("I still do. I am only learning there is more than one way to build one."));
        done(window.tnYsolteTalk);
    };

    window.tnYsolteTalkCrews = function () {
        open();
        output("You ask about the crews you fought your way through on FIRST-14. Her crews.");
        output("\n\n" + q("My plods.") + " She says it fondly. " + q("Gryvain, mostly, for the heavy work. Kaithrit for the tight places, the ducts and the crawlspaces. A gryvain foreman named Ber’uun who could strip a frigate to its frame in a week, and a kaithrit team lead named Veronica who will have a crew of her own someday, if she ever stops arguing with him."));
        output("\n\nHer coils shift. " + q("We worked the debris fields. Pirates and the U.G.C. leave a great deal of wreckage behind them, and wreckage is money if you are quick and careful. We were quick. We were not always careful enough. We were attacked on too many jobs. Claim-jumpers, pirates, rival salvagers with bigger guns. It made us hard. Shoot first, ask nothing.") + " Her hood dips a little. " + q("That is why I came at you the way I did. I told you I would not forget it. I have not."));
        output("\n\n" + q("Do you miss them?"));
        output("\n\n" + q("Every day. They do not need me hovering over their shoulders, though. A good crew runs without its queen. That is how you know you built it well."));
        done(window.tnYsolteTalk);
    };

    window.tnYsolteTalkStation = function () {
        open();
        output("You ask how she ended up on FIRST-14 of all places. An abandoned Steele Tech station is a strange place for a queen to hold court.");
        output("\n\n" + q("Ferro Industrial Reclamation Station T-14,") + " she recites, savoring each word. " + q("A yard your father’s company built to break down old freighters. Somebody in an office, a long time ago, filed it two systems away from where it actually sits. When it was retired, the decommission crews flew to an empty patch of space, found nothing, and went home. And there it stayed, full of everything nobody had come back for."));
        output("\n\n" + q("We found it in an old freight log, a route that ended at a station no registry had ever heard of. Other scavengers had picked at it before us, outlaws and squatters. We drove them out and marked it as ours. Claimed space.") + " Her tongue flickers. " + q("It was the big break. A whole station to strip, and no one to share it with."));
        output("\n\nThen she looks at you, and something wry creeps into the set of her snout. " + q("And then the owner’s heir came through the airlock, looking for a plasma conduit. I have been told the galaxy has a sense of humor. I did not believe it until that day."));
        if (flags.FIRST14_STEELETECH_CALLED !== undefined) {
            output("\n\n" + q("You called your company about it. My plods tell me there is a decommission crew in the queue now. They will be gone with what they can carry long before it arrives.") + " A pause. " + q("I will not ask you to forgive that. Only to understand it."));
        } else {
            output("\n\n" + q("My crews are still at work there. You have never told your company. I have noticed, and I am grateful, though I will not insult you by asking you to keep quiet forever."));
        }
        if (flags.SAVED_TIKA) output("\n\n" + q("You sent for the old nurse droid, too. My crews had stopped seeing her as anything but part of the walls. You did not. I noticed that as well."));
        done(window.tnYsolteTalk);
    };

    window.tnYsolteTalkStay = function () {
        open();
        output("You ask her why she came aboard. An Overqueen with a clan to build, berthing in a cabin on someone else’s ship.");
        output("\n\nShe is quiet for a while, her tail tip drawing slow circles on the deck. " + q("You put yourself between me and a live wire. You did not have to. I had tried to take you apart a minute before.") + " Her hood lifts. " + q("Where I come from, a debt like that is not paid with a thank-you and a shipping crate."));
        output("\n\n" + q("That’s it? A debt?"));
        output("\n\n" + q("That is how it started.") + " Her claws find your wrist and rest there. " + q("A clan built on salvage lives and dies by its luck. Yours is better than mine. You are going places, savior, and I would like to see them. Our people say a queen labors for those beneath her. I find that I would rather labor beside someone, for once."));
        output("\n\nShe lets go, composed again, as if nothing so tender had been said. " + q("Besides. My crews can reach me wherever your ship goes, and your bunks are warmer than the station’s."));
        done(window.tnYsolteTalk);
    };

    window.tnYsolteTalkCrew = function () {
        open();
        output("You ask what she makes of the rest of your crew.\n\n" + q("Who would you like my opinion of? I have one for everyone. I am a queen."));
        clearMenu();
        var rows = [
            ["Anno", T.anno, window.tnYsolteCrewAnno, "Ask what she thinks of Anno."],
            ["Syri", T.syri, window.tnYsolteCrewSyri, "Ask what she thinks of Syri."],
            ["Blue Viper", T.viper, window.tnYsolteCrewViper, "Ask what she thinks of the Blue Viper."],
            ["Slavebreaker", T.breaker, window.tnYsolteCrewBreaker, "Ask what she thinks of your slyveren slavebreaker."],
            ["Shekka", T.shekka, window.tnYsolteCrewShekka, "Ask what she thinks of Shekka."],
            ["Dane", T.dane, window.tnYsolteCrewDane, "Ask what she thinks of Dane."]
        ];
        for (var i = 0; i < rows.length; i++) {
            if (rows[i][1]()) addButton(i, rows[i][0], rows[i][2], rows[i][0], rows[i][3]);
            else addDisabledButton(i, rows[i][0], rows[i][0], rows[i][0] + " isn’t aboard your ship right now.");
        }
        addButton(6, "Everyone Else", window.tnYsolteCrewOthers, "Everyone Else", "Ask about the rest of the crew.");
        addButton(14, "Back", window.tnYsolteTalk, "Back", "Talk about something else.");
    };

    window.tnYsolteCrewAnno = function () {
        open();
        output("You ask about Anno.");
        output("\n\n" + q("The ausar with the white hair and the tablet that never leaves her hand.") + " Mel’Ysolte’s tongue flicks. " + q("She is Steele Tech, as you are. The first day I came aboard she looked me over and asked whether I knew what the reactor shielding on FIRST-14 was worth on the open market."));
        output("\n\n" + q("Did you?"));
        output("\n\n" + q("Of course I did. She did not believe me. We argued prices for two hours, and she was right about the shielding and I was right about everything else.") + " A low, pleased hiss. " + q("She calls me ‘Your Majesty’ in a tone I have not yet decided to forgive. I like her. Do not tell her that."));
        done(window.tnYsolteTalkCrew);
    };

    window.tnYsolteCrewSyri = function () {
        open();
        output("You ask about Syri.");
        output("\n\n" + q("The loud one.") + " There is no heat in it. " + q("She challenged me to wrestle in the cargo hold within an hour of meeting me. She lost. She asked again the next day, and lost again. The third time she brought one of her games instead and beat me so badly I am still considering a formal grievance."));
        output("\n\n" + q("She is crude, and she is honest, and she does not bow. I find all three refreshing."));
        if (T.anno()) output("\n\nHer hood tilts. " + q("When she and Anno argue, it sounds like the house of the clan that raised me. Two sisters, two opinions, and neither willing to lose. I did not think I would miss that noise."));
        done(window.tnYsolteTalkCrew);
    };

    window.tnYsolteCrewViper = function () {
        open();
        output("You ask about the Blue Viper.");
        output("\n\n" + q("One of our wayward sisters, living under your roof.") + " Mel’Ysolte’s hood draws in. " + q("The slyveren and my people come from the same old blood. Somewhere along the way they chose pleasure over duty, and my people have never forgiven them for it. We speak of them the way you would speak of a cousin who ran off with a smuggler."));
        output("\n\n" + q("And her collar?"));
        output("\n\n" + q("Where I come from, that would be a shameful thing. She does not seem ashamed. She seems... settled. As if she has finally been told where she belongs.") + " Her tongue tastes the air. " + q("It is not my place to call it wrong, so long as you treat her as more than a pet. I asked her once what she wanted. She said ‘more.’ I do not think she meant anything but you."));
        if (viperEgg("bv")) output("\n\n" + q("She carries your egg now. She told me so, very proudly, and I found her the warmest corner of the ship to rest in. Do not look so surprised. She is still family, of a sort."));
        if (T.breaker()) output("\n\n" + q("Two wayward sisters under one roof, and neither can stand the other. It is very much like home."));
        done(window.tnYsolteTalkCrew);
    };

    window.tnYsolteCrewBreaker = function () {
        open();
        output("You ask about your slavebreaker.");
        output("\n\nMel’Ysolte’s hood flattens against her neck. " + q("She did to others what she now asks you to do to her. She broke minds for the pirates of Zhèng Shi and sold what was left of them."));
        output("\n\n" + q("I do not trust her, and I have told her so. She laughed at me.") + " Her tail tip twitches. " + q("And yet she obeys you, and she has hurt no one aboard. A queen labors even for those she would rather not. I keep an eye on her. You keep the leash. Between us, I think she is safe enough."));
        if (viperEgg("sb")) output("\n\n" + q("She carries your egg, too. I will admit I did not expect her to be gentle about it. She is. I am still deciding what to make of that."));
        done(window.tnYsolteTalkCrew);
    };

    window.tnYsolteCrewShekka = function () {
        open();
        output("You ask about Shekka.");
        output("\n\n" + q("Shekka!") + " She sounds almost warm. " + q("The first person aboard who looked at my old armor and asked how it was put together, instead of whether it bites. Her people are scavengers, like my plods. She can hear a bad coupling through a bulkhead. I would have hired her in an instant."));
        output("\n\n" + q("She has asked me twice whether caesseli lay eggs. I told her yes. She asked how many. I told her that was a personal question, and she turned the color of a warning light."));
        if (shekkaEgg()) output("\n\n" + q("And now she is carrying one of her own. She is very happy. She told me all about it. In great detail. In very, very great detail.") + " A fond hiss. " + q("I am happy for her."));
        done(window.tnYsolteTalkCrew);
    };

    window.tnYsolteCrewDane = function () {
        open();
        output("You ask about Dane.");
        output("\n\n" + q("The beast.") + " She says it with real approval. " + q("Four arms, a temper, and he once worked for your cousin. I called him that to his face, and he did not know what to do with it."));
        output("\n\n" + q("Among my people it is praise. A beast is strong, and does not waste words. He wastes very few. I think, in his way, he has decided I am acceptable. I have decided the same of him."));
        done(window.tnYsolteTalkCrew);
    };

    window.tnYsolteCrewOthers = function () {
        open();
        output("You ask about everyone else aboard.");
        var lines = [];
        if (crew("celise", function () { return flags.RECRUITED_CELISE > 0 && flags.CELISE_ONBOARD > 0; })) lines.push("Celise tried to taste my scales the day I came aboard. I allowed it once. She has been very polite about it since.");
        if (crew("reaha", function () { return flags.REAHA_IS_CREW !== undefined && flags.REAHA_IS_CREW > 0; })) lines.push("Reaha makes enough milk for a clan. Your galley has never been so well stocked, and she is kinder than she thinks she is.");
        if (crew("kiro", function () { return flags.KIRO_ONBOARD !== undefined; })) lines.push("Kiro offered me a drink and a game of cards. I declined the drink. I should have declined the game.");
        if (crew("azra", function () { return flags.AZRA_ONBOARD !== undefined; })) lines.push("Azra and I compared venoms. Hers is better for science. Mine is better for a quiet night. We agreed to respect each other’s fields.");
        if (crew("paige", function () { return flags.PAIGE_CREW !== undefined; })) lines.push("Paige moves like a fighter, though she cannot see. I spar with her sometimes. I do not always win, and she never lets me pretend I did.");
        if (crew("bess", function () { return flags.BESS_LOCATION === GLOBAL.BESS_ON_CREW; })) {
            var bn = safe(function () { return bess.short || "Bess"; }, "Bess");
            lines.push(bn + " asks me questions about caesselian customs and writes down every answer. I have started inventing a few, to see if anyone notices.");
        }
        if (lines.length === 0) output("\n\n" + q("There are not many others, are there? I find a small crew suits me. Everyone works, and everyone is known."));
        else {
            output("\n\nShe considers, then gives you the rest of the crew one by one, like a queen reviewing her court.");
            for (var i = 0; i < lines.length; i++) output("\n\n" + q(lines[i]));
            output("\n\n" + q("You keep strange company, savior. I count myself among it gladly."));
        }
        done(window.tnYsolteTalkCrew);
    };
})();

window.tnYsolteUnrecruit = function () {
    clearOutput();
    clearBust();
    showBust("OVERQUEEN");
    if (typeof showName === "function") showName("Mel’Ysolte");
    author("William");
    output("You tell her the bunk is hers only while she chooses it.\n\nShe lifts her hood. <i>“Then I return to the station. The maintenance storage, where you found me. Come there when you want your queen again.”</i>\n\nHer coils gather, and she is gone from the ship.");
    flags.YSOLTE_CREWMEMBER = 0;
    flags.YSOLTE_RECRUIT_ASK = 0;
    if (typeof chars !== "undefined" && chars.YSOLTE) delete chars.YSOLTE;
    clearMenu();
    addButton(0, "Next", mainGameMenu, "Next", "She has left the ship.");
};

window.tnYsolteInstall = function () {
    if (typeof chars === "undefined" || typeof flags === "undefined" || typeof addButton !== "function") return;
    if (flags.YSOLTE_CREWMEMBER !== 1 || !window.tnYsolteEnabled()) return;
    if (chars.YSOLTE && typeof chars.YSOLTE.isCrew === "function") return;
    var no = function () { return false; };
    chars.YSOLTE = {
        a: "Ysolte",
        short: "Ysolte",
        nameDisplay: function () { return "Mel’Ysolte"; },
        getClassName: function () { return "OverqueenYsolte"; },
        isCrew: function () { return flags.YSOLTE_CREWMEMBER === 1 && window.tnYsolteEnabled(); },
        isRecruited: function () { return flags.YSOLTE_CREWMEMBER === 1 && window.tnYsolteEnabled(); },
        freeRent: false,
        processTime: function () {},
        hasPerk: no,
        hasVagina: function () { return true; },
        isPregnant: no,
        hasWombPregnancy: no,
        fertility: function () { return 0; },
        vaginalCapacity: function () { return 800; },
        crewBlurb: function (slot) {
            if (!this.isCrew()) return "";
            addButton(slot, "Ysolte", window.tnYsolteCabin, "Mel’Ysolte", "The Overqueen is aboard and takes a crew slot.");
            return "\n\nMel’Ysolte has a bunk of her own. Her coils fill it. She counts toward your crew.";
        }
    };
};
(function tnInstallYsolte() {
    if (typeof chars === "undefined" || typeof flags === "undefined" || typeof addButton !== "function") {
        setTimeout(tnInstallYsolte, 400);
        return;
    }
    window.tnYsolteInstall();
    if (!window.tnYsolteWatch) window.tnYsolteWatch = setInterval(window.tnYsolteInstall, 1000);
})();


