# TN_taur-naga_text.mod — written 2026-10-15, Tavros merged in 2026-10-24, checked for TiTS 0.9.167 on 2026-10-25
# Companion to TN_taur-naga_gates.mod. Adds taur/naga wording to the scenes those gates open, on every planet
# including Tavros (the old TN_taur-naga_tavros_text.mod is merged in below, so don't enable both). Bipeds see the original text: every change wraps the
# original words in [pc.isTaur|…|…], [pc.isNaga|…|…] or [pc.isBiped|…|…] tags.
# 0.9.167 check: all 269 blocks match the 0.9.167 bundles (same counts as 0.9.166), and the patched bundles pass node --check.
# Load order doesn't matter: no needle overlaps the gates mod (tested both orders against the 134-gate gates mod generated 2026-10-25).
# Numbers (#1…) match the gate numbers in the old audit, not the order of the gates mod.
# Sections marked "gate closed" are harmless: the 2026-10-25 gates mod leaves that button closed, so only bipeds reach the scene.
# Blocks marked [x2] are identical on purpose: each one patches the next copy of that line.

# ----- Tavros section (formerly TN_taur-naga_tavros_text.mod) -----
# Companion to TN_taur-naga_gates.mod. Adds taur/naga wording to the Tavros scenes those gates open,
# and opens the second, in-scene taur check in Riya's Sex scene (#111) through the same bypass switch.
# Bipeds see the original text: every change wraps the original words in [pc.isTaur|…|…] / [pc.isNaga|…|…] tags.
# Needs TN_taur_naga_bypass_toggle.mod (for tnBB). Works before or after TN_taur-naga_gates.mod — no needles overlap. Numbers (#98…) match the gate numbers in the audit.

# ===== content_tavros.js (63 changes) =====
# --- #111 Sex (Riya) ---
# second gate inside the scene
Replace [content_tavros.js]
return!pc.hasVagina()||pc.isTaur()||pc.femininity<=40?(output("<i>“Ah, normally
With:
return!pc.hasVagina()||(window.tnBB&&window.tnBB(pc)?!1:pc.isTaur())||pc.femininity<=40?(output("<i>“Ah, normally

Replace [content_tavros.js]
Get on your knees and beg for this dick
With:
[pc.isTaur|Fold those legs and beg for this dick|Get on your knees and beg for this dick]

Replace [content_tavros.js]
Get on your knees and beg for your bone
With:
[pc.isTaur|Fold those legs and beg for your bone|Get on your knees and beg for your bone]

Replace [content_tavros.js]
Get on your knees and purr for me
With:
[pc.isTaur|Fold those legs and purr for me|Get on your knees and purr for me]

Replace [content_tavros.js]
in a restroom, on your knees with a cock in your mouth
With:
[pc.isTaur|in a restroom, legs folded under you with a cock in your mouth|in a restroom, on your knees with a cock in your mouth]

# --- #98 Slow Ride ---
Replace [content_tavros.js]
willing to have me on your lap again
With:
[pc.isTaur|willing to have me riding you again|willing to have me on your lap again]

Replace [content_tavros.js]
You fall flat on your back and the needy domme is already on top of you
With:
[pc.isTaur|You fold your legs and roll onto your side, and the needy domme is already clambering over your flank|You fall flat on your back and the needy domme is already on top of you]

Replace [content_tavros.js]
She comes to rest on top of your [pc.belly] with her legs spread to either side of you.
With:
[pc.isTaur|She comes to rest against your lower belly, her legs spread to either side of your hindquarters.|She comes to rest on top of your [pc.belly] with her legs spread to either side of you.]

Replace [content_tavros.js]
You lean back on your elbows as you watch her trepidatious movements
With:
[pc.isTaur|You twist your human half around to watch her trepidatious movements|You lean back on your elbows as you watch her trepidatious movements]

Replace [content_tavros.js]
She chuckles as she comes to rest on your lap, her hands resting on your [pc.belly].
With:
[pc.isTaur|She chuckles as she settles against your hindquarters, her hands braced on your flank.|She chuckles as she comes to rest on your lap, her hands resting on your [pc.belly].]

Replace [content_tavros.js]
as she rides your lap.
With:
[pc.isTaur|as she rides your tauric hips.|as she rides your lap.]

# --- #100 Pitch Vaginal ---
Replace [content_tavros.js]
splattering both of your thighs everytime
With:
[pc.isTaur|splattering your tauric underbelly everytime|[pc.isNaga|splattering your coils everytime|splattering both of your thighs everytime]]

# --- #101 Catch ---
Replace [content_tavros.js]
forcing your [pc.legOrLegsNoun] to hike up and your thighs to hug his waistline
With:
[pc.isTaur|forcing your hind [pc.legsNoun] to splay as he braces himself against your hindquarters|[pc.isNaga|forcing your coils to loop up and hug his waistline|forcing your [pc.legOrLegsNoun] to hike up and your thighs to hug his waistline]]

Replace [content_tavros.js]
 sparks pleasure all the way up to your toes!
With:
 sparks pleasure all the way [pc.isTaur|down to your [pc.feet]|[pc.isNaga|down to the tip of your tail|up to your toes]]!

Replace [content_tavros.js]
the dripping of his girl-gash across your thighs
With:
[pc.isTaur|the dripping of his girl-gash across your hindquarters|[pc.isNaga|the dripping of his girl-gash across your scales|the dripping of his girl-gash across your thighs]]

Replace [content_tavros.js]
you stagger to your feet and gather your things
With:
[pc.isNaga|you wobble upright on your coils and gather your things|you stagger to your feet and gather your things]

# --- #102 Girls ---
Replace [content_tavros.js]
you take a seat at the end of the booth
With:
[pc.isTaur|you fold your legs and settle down at the end of the booth|you take a seat at the end of the booth]

Replace [content_tavros.js]
After you sit down, she is quick
With:
[pc.isTaur|After you get comfortable, she is quick|After you sit down, she is quick]

Replace [content_tavros.js]
give you room to sit at the end of the booth
With:
[pc.isTaur|give you room to settle your tauric body at the end of the booth|give you room to sit at the end of the booth]

Replace [content_tavros.js]
when you sit down next to her.
With:
[pc.isTaur|when you fold your legs down next to her.|when you sit down next to her.]

# --- #103 Date ---
Replace [content_tavros.js]
When you sit down next to her, she hands you
With:
[pc.isTaur|When you fold your legs beneath you next to her, she hands you|When you sit down next to her, she hands you]

Replace [content_tavros.js]
You sit down on the blanket and after reclining back, your feline companion sits down next to you
With:
[pc.isTaur|You fold your legs and settle down on the blanket, and your feline companion snuggles up against your flank|You sit down on the blanket and after reclining back, your feline companion sits down next to you]

Replace [content_tavros.js]
approach the fallen interloper and kneel down next to him
With:
[pc.isTaur|approach the fallen interloper and loom over him|approach the fallen interloper and kneel down next to him]

Replace [content_tavros.js]
the catgirl joins you on the couch and opts to sit on your lap sideways while leaning against you to relax
With:
[pc.isTaur|the catgirl joins you where you’ve folded your legs in front of the couch and drapes herself across your tauric back, leaning against your human half to relax|the catgirl joins you on the couch and opts to sit on your lap sideways while leaning against you to relax]

# --- #104 Sex ---
Replace [content_tavros.js]
for my sake.”</i> Fisianna leans down and plants a short, gentle kiss to your lips before sitting up on your lap again.
With:
for my sake.”</i> Fisianna leans down and plants a short, gentle kiss to your lips [pc.isTaur|before settling back astride your haunch again.|before sitting up on your lap again.]

Replace [content_tavros.js]
relax, [pc.name]...”</i> Fisianna leans down and plants a short, gentle kiss to your lips before sitting up on your lap again.
With:
relax, [pc.name]...”</i> Fisianna leans down and plants a short, gentle kiss to your lips [pc.isTaur|before settling back astride your haunch again.|before sitting up on your lap again.]

Replace [content_tavros.js]
rises up from her seat on your lap
With:
[pc.isTaur|rises up from her seat astride your haunch|rises up from her seat on your lap]

Replace [content_tavros.js]
slowly lifts herself up from your lap
With:
[pc.isTaur|slowly lifts herself up off your haunch|slowly lifts herself up from your lap]

Replace [content_tavros.js]
immediately standing up from your lap
With:
[pc.isTaur|immediately scrambling off your haunch|immediately standing up from your lap]

Replace [content_tavros.js]
You lay back on the bed, letting her straddle your hips.
With:
[pc.isTaur|You fold your legs and roll onto your side on the bed, letting her climb astride your hindquarters.|You lay back on the bed, letting her straddle your hips.]

Replace [content_tavros.js]
slowly leans backwards to settle down onto your lap
With:
[pc.isTaur|slowly leans backwards to settle down onto your haunch|slowly leans backwards to settle down onto your lap]

Replace [content_tavros.js]
she is pressing into your lap even harder
With:
[pc.isTaur|she is pressing into your lower belly even harder|she is pressing into your lap even harder]

Replace [content_tavros.js]
You crouch down to tug the jeans off
With:
[pc.isTaur|You lean your human half down to tug the jeans off|You crouch down to tug the jeans off]

# --- #105 Ravish (Fyn) ---
Replace [content_tavros.js]
You’re left on your back, looking up at his fierce yellow eyes
With:
[pc.isTaur|You’re left sprawled on your side, looking up at his fierce yellow eyes|You’re left on your back, looking up at his fierce yellow eyes]

# --- #106 Get Licked ---
Replace [content_tavros.js]
You then hop onto the counter and call the butterfly-winged shopkeeper
With:
[pc.isTaur|You then back your hindquarters up against the counter and call the butterfly-winged shopkeeper|[pc.isNaga|You then pull your coils up onto the counter and call the butterfly-winged shopkeeper|You then hop onto the counter and call the butterfly-winged shopkeeper]]

Replace [content_tavros.js]
making sure to keep your legs crossed and hem patted down
With:
[pc.isTaur|making sure to keep your tail down and hem patted down|[pc.isNaga|making sure to keep your tail coiled tight and hem patted down|making sure to keep your legs crossed and hem patted down]]

Replace [content_tavros.js]
plant your bare buttocks on the counter, pointedly crossing your legs.
With:
[pc.isTaur|back your bare hindquarters up against the counter, pointedly swishing your tail.|[pc.isNaga|drape your bare lower body over the counter, pointedly curling your tail.|plant your bare buttocks on the counter, pointedly crossing your legs.]]

Replace [content_tavros.js]
placing her delicate fingers on your parted thighs. After squatting down, she positions her burning cheeks below them
With:
[pc.isTaur|placing her delicate fingers on your hind legs. After squatting down, she positions her burning cheeks beneath your tail|[pc.isNaga|placing her delicate fingers on your coils. After leaning in, she positions her burning cheeks against your scales|placing her delicate fingers on your parted thighs. After squatting down, she positions her burning cheeks below them]]

Replace [content_tavros.js]
slides her hands affectionately up your still twitching thighs
With:
[pc.isTaur|slides her hands affectionately up your still twitching hind legs|[pc.isNaga|slides her hands affectionately along your still twitching coils|slides her hands affectionately up your still twitching thighs]]

Replace [content_tavros.js]
you sort yourself out and hop off the counter. You’re amused to find there’s a large wet patch on there under where you were sitting
With:
[pc.isTaur|you sort yourself out and step away from the counter. You’re amused to find there’s a large wet patch on there where you were leaning|[pc.isNaga|you sort yourself out and slither off the counter. You’re amused to find there’s a large wet patch on there under where your coils were resting|you sort yourself out and hop off the counter. You’re amused to find there’s a large wet patch on there under where you were sitting]]

# --- #107 Get Eaten ---
Replace [content_tavros.js]
as you fall backwards, laying flat on the bed with Pink still between your [pc.thighsOrLegs]
With:
[pc.isTaur|as you sink down onto your side on the bed with Pink still nestled between your hind [pc.legs]|as you fall backwards, laying flat on the bed with Pink still between your [pc.thighsOrLegs]]

Replace [content_tavros.js]
Settling in, you lay back and enjoy the ride
With:
[pc.isTaur|Settling in, you rest your human half against the pillows and enjoy the ride|Settling in, you lay back and enjoy the ride]

# --- #108 Reward? ---
Replace [content_tavros.js]
With her legs on either side of your lap, she sits down, straddling your waist.
With:
[pc.isTaur|With a hand on your flank, she hops up and sits astride your tauric back, facing you.|With her legs on either side of your lap, she sits down, straddling your waist.]

Replace [content_tavros.js]
Blue takes a seat on your lap
With:
[pc.isTaur|Blue takes a seat astride your tauric back|Blue takes a seat on your lap]

# --- #109 Join ---
Replace [content_tavros.js]
You follow suit, the position easy enough so far.
With:
[pc.isTaur|You lower your human half until your palms rest on the mat, which is easy enough so far.|[pc.isNaga|You follow suit, resting your palms on the mat with your coils stretched out behind you. Easy enough so far.|You follow suit, the position easy enough so far.]]

Replace [content_tavros.js]
You do as Pink asks, walking your feet back until you find yourself in a push up position.
With:
[pc.isTaur|You do your best to follow along, shifting your forelegs back until your human half is braced in something like a push up position.|[pc.isNaga|You do your best to follow along, stretching your tail out behind you until you find yourself in a push up position.|You do as Pink asks, walking your feet back until you find yourself in a push up position.]]

Replace [content_tavros.js]
a lot of time on all fours with your a-
With:
[pc.isNaga|a lot of time bent over with your a-|a lot of time on all fours with your a-]

Replace [content_tavros.js]
lower your knees to the floor, then you bring your forehead down
With:
[pc.isTaur|fold your legs under you, then you bring your forehead down|[pc.isNaga|lower your hips to the floor, then you bring your forehead down|lower your knees to the floor, then you bring your forehead down]]

# --- #113 Her Hands / Her Mouth ---
Replace [content_tavros.js]
her lithe fingers tracing along your inner thigh
With:
[pc.isTaur|her lithe fingers tracing up the inside of your hind leg|[pc.isNaga|her lithe fingers tracing along the scales of your lower body|her lithe fingers tracing along your inner thigh]]

Replace [content_tavros.js]
the seemingly master cocksucker in your lap
With:
[pc.isTaur|the seemingly master cocksucker beneath your tauric belly|the seemingly master cocksucker in your lap]

Replace [content_tavros.js]
You press your thighs to her ears, trapping her face
With:
[pc.isTaur|You clamp your hind legs around her, trapping her face|[pc.isNaga|You curl your tail around her shoulders, trapping her face|You press your thighs to her ears, trapping her face]]

Replace [content_tavros.js]
you release your thighs from around the servant’s head
With:
[pc.isTaur|you release your hind legs from around the servant|[pc.isNaga|you uncoil your tail from around the servant’s shoulders|you release your thighs from around the servant’s head]]

Replace [content_tavros.js]
you lean back in your seat, crossing your arms
With:
[pc.isTaur|you shift your weight back, crossing your arms|you lean back in your seat, crossing your arms]

# taur version needs a longer rewrite (a taur can't reach); left as is
Replace [content_tavros.js]
You move your fingers down, pushing them between your legs, and running them over
With:
[pc.isNaga|You move your fingers down, pushing them past your scales, and running them over|You move your fingers down, pushing them between your legs, and running them over]

# --- #115 Buttfuck ---
Replace [content_tavros.js]
kneel down on the mattress, straddling his shins
With:
[pc.isTaur|climb up onto the mattress behind him, your barrel looming over his back and your forelegs planted to either side of his shoulders|kneel down on the mattress, straddling his shins]

# --- #116 Ride Cock ---
Replace [content_tavros.js]
You join him on the mattress soon after, straddling his body on all fours
With:
[pc.isTaur|You join him on the mattress soon after, looming over him with your forelegs planted to either side of his body|[pc.isNaga|You join him on the mattress soon after, your coils sliding over the sheets as you rise up over him|You join him on the mattress soon after, straddling his body on all fours]]

Replace [content_tavros.js]
Putting yourself back down on all fours, you bring
With:
[pc.isTaur|Lowering your human half down to him, you bring|[pc.isNaga|Lowering yourself back down over him, you bring|Putting yourself back down on all fours, you bring]]

Replace [content_tavros.js]
you slide your way up his body, sitting up straight until you’re straddling his girly hips
With:
[pc.isTaur|you step over his body and settle your hindquarters right above his girly hips|[pc.isNaga|you slide your way up his body, rising up on your coils until you’re poised over his girly hips|you slide your way up his body, sitting up straight until you’re straddling his girly hips]]

Replace [content_tavros.js]
You smile right back down at the femboy
With:
[pc.isTaur|You smile back over your shoulder at the femboy|[pc.isNaga|You smile right back down at the femboy|You smile right back down at the femboy]]

Replace [content_tavros.js]
spreading your nether lips thanks to your lovingly applied lubrication. The ausar boy beneath you is happy to assist you on your ride down, pushing on your thighs
With:
spreading your nether lips thanks to your lovingly applied lubrication. The ausar boy beneath you is happy to assist you on your ride down, [pc.isTaur|pushing on your haunches|[pc.isNaga|pushing on your hips|pushing on your thighs]]

Replace [content_tavros.js]
spreading your pucker thanks to your lovingly applied lubrication. The ausar boy beneath you is happy to assist you on your ride down, pushing on your thighs
With:
spreading your pucker thanks to your lovingly applied lubrication. The ausar boy beneath you is happy to assist you on your ride down, [pc.isTaur|pushing on your haunches|[pc.isNaga|pushing on your hips|pushing on your thighs]]

Replace [content_tavros.js]
his grip on your thighs long lost to pleasure. You can feel the femboy’s cum churning inside your [pc.vagina
With:
[pc.isTaur|his grip on your haunches long lost to pleasure|[pc.isNaga|his grip on your hips long lost to pleasure|his grip on your thighs long lost to pleasure]]. You can feel the femboy’s cum churning inside your [pc.vagina

Replace [content_tavros.js]
his grip on your thighs long lost to pleasure. You can feel the femboy’s cum churning inside your [pc.asshole]
With:
[pc.isTaur|his grip on your haunches long lost to pleasure|[pc.isNaga|his grip on your hips long lost to pleasure|his grip on your thighs long lost to pleasure]]. You can feel the femboy’s cum churning inside your [pc.asshole]


# ===== content_dhaal.js (41 changes) =====
# --- #1 Sex (Evening) ---
Replace [content_dhaal.js]
tosses it at your feet.
With:
tosses it [pc.isBiped|at your feet.|down in front of you.]

Replace [content_dhaal.js]
stroking you with a tender touch before migrating between your legs.
With:
stroking you with a tender touch before migrating [pc.isTaur|back toward your hindquarters.|[pc.isNaga|down along your coils.|between your legs.]]

Replace [content_dhaal.js]
reclining against her plush pillows, while Evening slowly settles between your legs.
With:
[pc.isTaur|folding your legs and rolling onto your side against her plush pillows, while Evening slowly settles in behind your raised hind leg.|[pc.isNaga|reclining against her plush pillows with your coils loosely spread, while Evening slowly settles in against your tail.|reclining against her plush pillows, while Evening slowly settles between your legs.]]

# [x2]
Replace [content_dhaal.js]
had been dragging along the inside of your thighs
With:
had been dragging along the inside of [pc.isTaur|your hind legs|[pc.isNaga|your coils|your thighs]]

# [x2]
Replace [content_dhaal.js]
It doesn’t take long for your thighs to become
With:
It doesn’t take long for [pc.isTaur|your hind legs|[pc.isNaga|your coils|your thighs]] to become

# [x2]
Replace [content_dhaal.js]
had been dragging along the inside of your thighs
With:
had been dragging along the inside of [pc.isTaur|your hind legs|[pc.isNaga|your coils|your thighs]]

# [x2]
Replace [content_dhaal.js]
It doesn’t take long for your thighs to become
With:
It doesn’t take long for [pc.isTaur|your hind legs|[pc.isNaga|your coils|your thighs]] to become

Replace [content_dhaal.js]
She starts by pressing soft kisses along your leg, trailing up your thigh
With:
She starts by pressing soft kisses [pc.isTaur|along your hind leg, trailing up your haunch|[pc.isNaga|along your tail, trailing up your scales|along your leg, trailing up your thigh]]

Replace [content_dhaal.js]
because she crawls onto your lap without bothering
With:
because she [pc.isTaur|clambers up against your flank|crawls onto your lap] without bothering

Replace [content_dhaal.js]
Instead, she settles on top of you, straddling your [pc.hips],
With:
[pc.isTaur|Instead, she settles against your hindquarters, one leg hooked over your haunch,|Instead, she settles on top of you, straddling your [pc.hips],]

Replace [content_dhaal.js]
she wriggles and gyrates in your lap
With:
she wriggles and gyrates [pc.isTaur|against your hindquarters|in your lap]

Replace [content_dhaal.js]
With a groan of relief, you sit up, your arms
With:
With a groan of relief, [pc.isTaur|you twist your human half around|you sit up], your arms

Replace [content_dhaal.js]
Groaning with relief, you sit up, your arms
With:
Groaning with relief, [pc.isTaur|you twist your human half around|you sit up], your arms

Replace [content_dhaal.js]
You sink into the mattress as she clambers on top of you, straddling your [pc.hips].
With:
[pc.isTaur|You fold your legs and sink onto your side on the mattress as she clambers up against you, straddling your hind leg.|You sink into the mattress as she clambers on top of you, straddling your [pc.hips].]

Replace [content_dhaal.js]
Evening’s free hand travels down your body before winding its way between your legs
With:
Evening’s free hand travels down your body before winding its way [pc.isTaur|back to your hindquarters|[pc.isNaga|down along your coils|between your legs]]

Replace [content_dhaal.js]
The inside of your thighs are aching like crazy
With:
[pc.isTaur|The insides of your hind legs are|[pc.isNaga|Your coils are|The inside of your thighs are]] aching like crazy

Replace [content_dhaal.js]
Just as she’s about to get between your legs, Evening stops.
With:
Just as she’s about to get [pc.isTaur|behind your raised hind leg|[pc.isNaga|against your coils|between your legs]], Evening stops.

Replace [content_dhaal.js]
She shuffles forward, holding up your thigh, before interlocking your legs with hers.
With:
She shuffles forward, [pc.isTaur|lifting your hind leg, before pressing herself up against your hindquarters.|[pc.isNaga|lifting a loop of your tail, before pressing her hips flush against yours.|holding up your thigh, before interlocking your legs with hers.]]

Replace [content_dhaal.js]
just high enough to let your toes curl in pleasure
With:
just high enough to let [pc.isTaur|your [pc.feet] twitch|[pc.isNaga|the tip of your tail curl|your toes curl]] in pleasure

Replace [content_dhaal.js]
Evening adjusts her grip on your leg and starts to move again
With:
Evening adjusts her grip [pc.isTaur|on your hind leg|[pc.isNaga|on your tail|on your leg]] and starts to move again

Replace [content_dhaal.js]
as Evening grabs hold of your leg again.
With:
as Evening grabs hold of [pc.isTaur|your hind leg|[pc.isNaga|your tail|your leg]] again.

Replace [content_dhaal.js]
slotting your hips between her legs
With:
[pc.isTaur|rearing up over her, your forelegs planted to either side of her as your hips settle between her legs|slotting your hips between her legs]

Replace [content_dhaal.js]
Between this and the attention Evening is giving you between your legs
With:
Between this and the attention Evening is giving you [pc.isTaur|beneath your tail|[pc.isNaga|at the front of your tail|between your legs]]

Replace [content_dhaal.js]
the heat concentrated between your thighs
With:
the heat concentrated [pc.isTaur|beneath your tail|[pc.isNaga|low on your tail|between your thighs]]

# --- #3 Trib Her (Narc) ---
Replace [content_dhaal.js]
instead shift yourself around, spreading your own legs and scooching in close.
With:
[pc.isTaur|instead turn yourself around, backing your hindquarters toward her.|[pc.isNaga|instead shift yourself around, laying your coils alongside her and scooching in close.|instead shift yourself around, spreading your own legs and scooching in close.]]

Replace [content_dhaal.js]
running down the side of your leg. Your lip
With:
running down the side of [pc.isTaur|your hind leg|[pc.isNaga|your tail|your leg]]. Your lip

Replace [content_dhaal.js]
you know to not be your own running against your leg.
With:
you know to not be your own running against [pc.isTaur|your hind leg|[pc.isNaga|your tail|your leg]].

# --- #4 Get Fucked (Narc) ---
Replace [content_dhaal.js]
You lean back, exposing your waiting
With:
[pc.isTaur|You turn and raise your tail, exposing your waiting|[pc.isNaga|You lean back, uncoiling to expose your waiting|You lean back, exposing your waiting]]

Replace [content_dhaal.js]
You ease yourself back on the bed, keeping yourself propped up on your elbows.
With:
[pc.isTaur|You fold your legs on the bed and twist your human half around to watch.|[pc.isNaga|You ease yourself back on the bed, propped up on your elbows with your coils loosely spread.|You ease yourself back on the bed, keeping yourself propped up on your elbows.]]

Replace [content_dhaal.js]
She moves closer, gliding into the space between your legs, her wide hips bumping them apart a slight bit more.
With:
[pc.isTaur|She moves closer, gliding in behind you, her wide hips bumping against your hindquarters.|[pc.isNaga|She moves closer, gliding in against your coils, her wide hips bumping them apart a slight bit more.|She moves closer, gliding into the space between your legs, her wide hips bumping them apart a slight bit more.]]

Replace [content_dhaal.js]
the small droid moves her hands towards your knees and thighs
With:
the small droid moves her hands towards [pc.isTaur|your haunches|[pc.isNaga|your coils|your knees and thighs]]

Replace [content_dhaal.js]
she takes hold of your legs properly
With:
she takes hold of [pc.isTaur|your haunches|[pc.isNaga|your tail|your legs]] properly

Replace [content_dhaal.js]
Narc fingers tighten on your thighs.
With:
Narc fingers tighten on [pc.isTaur|your haunches|[pc.isNaga|your scales|your thighs]].

Replace [content_dhaal.js]
bumping her hips against the back of your thighs.
With:
bumping her hips against [pc.isTaur|your haunches|[pc.isNaga|your coils|the back of your thighs]].

Replace [content_dhaal.js]
her heavenly soft hips against the back of your thighs. Quick
With:
her heavenly soft hips against [pc.isTaur|your haunches|[pc.isNaga|your coils|the back of your thighs]]. Quick

# --- #5 Deal (Jezzy) ---
Replace [content_dhaal.js]
you move in and straddle the green woman’s hips
With:
[pc.isTaur|you move in and lower your hindquarters over the green woman’s hips|you move in and straddle the green woman’s hips]

Replace [content_dhaal.js]
girlcum paints your thighs
With:
girlcum paints [pc.isTaur|your hind legs|[pc.isNaga|your scales|your thighs]]

Replace [content_dhaal.js]
The weird squatting you’re doing doesn’t matter.
With:
[pc.isTaur|The awkward way you’ve braced your legs doesn’t matter.|[pc.isNaga|The awkward way you’ve coiled yourself doesn’t matter.|The weird squatting you’re doing doesn’t matter.]]

# --- #6 Pussy (droid) ---
Replace [content_dhaal.js]
Dropping to your knees, you reach out
With:
[pc.isTaur|Folding your legs beneath you, you reach out|[pc.isNaga|Lowering yourself on your coils, you reach out|Dropping to your knees, you reach out]]

Replace [content_dhaal.js]
Your legs are quivering, knocking against the droid’s
With:
[pc.isTaur|Your hind legs are quivering, knocking against the droid’s|[pc.isNaga|Your coils are quivering, knocking against the droid’s|Your legs are quivering, knocking against the droid’s]]

Replace [content_dhaal.js]
Trying to keep your legs still
With:
Trying to keep [pc.isTaur|your hind legs|[pc.isNaga|your tail|your legs]] still

# ===== content_follower.js (31 changes) =====
# --- #8 Mount Me (Amber) ---
Replace [content_follower.js]
as you bend over in front of her, reaching back to spread
With:
[pc.isTaur|as you turn your hindquarters toward her, swishing your tail aside to spread|as you bend over in front of her, reaching back to spread]

Replace [content_follower.js]
makes your [pc.legs] quake with the pleasure of it, your knees turning inwards until you give up and let go.
With:
makes your [pc.legs] quake with the pleasure of it, [pc.isTaur|your hind knees buckling until you give up and let go.|[pc.isNaga|your coils twisting until you give up and let go.|your knees turning inwards until you give up and let go.]]

Replace [content_follower.js]
until you get your legs back under you
With:
until you get [pc.isTaur|your hind legs back under you|[pc.isNaga|your coils back under you|your legs back under you]]

Replace [content_follower.js]
you bring your thighs together and squeeze her
With:
[pc.isTaur|you clamp down with your hindquarters and squeeze her|[pc.isNaga|you tighten your coils and squeeze her|you bring your thighs together and squeeze her]]

Replace [content_follower.js]
spraying down your thighs as you reach capacity
With:
spraying down [pc.isTaur|your hind legs|[pc.isNaga|your coils|your thighs]] as you reach capacity

Replace [content_follower.js]
By the time she’s done, your legs are utterly coated
With:
By the time she’s done, [pc.isTaur|your hind legs are|[pc.isNaga|your coils are|your legs are]] utterly coated

Replace [content_follower.js]
idly wonder if the wetness between your legs
With:
idly wonder if the wetness [pc.isTaur|beneath your tail|[pc.isNaga|along your coils|between your legs]]

# --- #9 Anno (Kase threesome) ---
Replace [content_follower.js]
You make your way towards the bed and kneel down on the mattress opposite Anno.
With:
[pc.isTaur|You make your way towards the bed and fold your legs down beside it, opposite Anno.|[pc.isNaga|You make your way towards the bed and coil up on the mattress opposite Anno.|You make your way towards the bed and kneel down on the mattress opposite Anno.]]

Replace [content_follower.js]
You sit back and watch as the alien beauty
With:
[pc.isTaur|You settle back on your haunches and watch as the alien beauty|You sit back and watch as the alien beauty]

Replace [content_follower.js]
You’re on him in seconds, kneeling above his crotch
With:
[pc.isTaur|You’re on him in seconds, standing over his crotch|[pc.isNaga|You’re on him in seconds, coiled above his crotch|You’re on him in seconds, kneeling above his crotch]]

# --- #11 Receive BJ / Get Licked (Kase) ---
Replace [content_follower.js]
hurriedly kneels down, getting comfortable between your thighs.
With:
hurriedly kneels down, [pc.isTaur|getting comfortable between your hind legs.|getting comfortable between your thighs.]

# --- #15 Get H.Fucked (Gianna) ---
Replace [content_follower.js]
properly gripping your ankles
With:
[pc.isTaur|properly gripping your hind legs|[pc.isNaga|properly gripping your tail|properly gripping your ankles]]

Replace [content_follower.js]
nearly yanking one of your ankles out of Gianna’s hand
With:
nearly yanking [pc.isTaur|one of your hind legs|[pc.isNaga|your tail|one of your ankles]] out of Gianna’s hand

Replace [content_follower.js]
across your quivery thighs
With:
[pc.isTaur|across your quivery haunches|[pc.isNaga|across your quivery coils|across your quivery thighs]]

Replace [content_follower.js]
pushing your ankles back again
With:
[pc.isTaur|pushing your hind legs back again|[pc.isNaga|pushing your tail back again|pushing your ankles back again]]

# --- #16 Get Fucked (Kase) (gate closed in the 2026-10-25 gates mod) ---
Replace [content_follower.js]
kneeling down on the bed between your legs
With:
[pc.isTaur|kneeling down on the bed behind your raised hind leg|kneeling down on the bed between your legs]

# --- #17 Frottage (Kase) ---
Replace [content_follower.js]
you follow him onto the bed, kneeling down and straddling his wide hips.
With:
[pc.isTaur|you follow him onto the bed, standing over him with your forelegs to either side of his wide hips.|you follow him onto the bed, kneeling down and straddling his wide hips.]

# --- #19 U.Desk Suck (Penny) (gate closed in the 2026-10-25 gates mod) ---
Replace [content_follower.js]
She lets you get back onto your own two feet
With:
She lets you get [pc.isBiped|back onto your own two feet|back up]

# --- #24 Pussy Fuck (Pippa) ---
Replace [content_follower.js]
Continuing to thrust, you bend over her
With:
Continuing to thrust, [pc.isTaur|you lean your human half down over her|you bend over her]

Replace [content_follower.js]
has you lay down on the bed, facing her.
With:
[pc.isTaur|has you fold your legs and settle on the bed, facing her.|has you lay down on the bed, facing her.]

Replace [content_follower.js]
climbs into bed after you, straddling you, before kissing you down your body.
With:
[pc.isTaur|climbs into bed after you, snuggling up against your flank before kissing you down your body.|climbs into bed after you, straddling you, before kissing you down your body.]

# --- #26 Feed Milk (Pippa) ---
Replace [content_follower.js]
You take a seat on Pippa’s comfy lap, straddling her and bringing your [pc.breasts] level with her face.
With:
[pc.isTaur|You stand over Pippa where she sits, leaning your human half down to bring your [pc.breasts] level with her face.|You take a seat on Pippa’s comfy lap, straddling her and bringing your [pc.breasts] level with her face.]

Replace [content_follower.js]
She straddles your [pc.leg] and,
With:
[pc.isTaur|She straddles one of your forelegs and,|She straddles your [pc.leg] and,]

# --- #28 Nuru Massage (Pippa) ---
Replace [content_follower.js]
You kneel down and reciprocate in full
With:
[pc.isTaur|You lower your human half and reciprocate in full|You kneel down and reciprocate in full]

Replace [content_follower.js]
Pippa has you lay down on the bed face down.
With:
[pc.isTaur|Pippa has you fold your legs and lie down on the bed.|Pippa has you lay down on the bed face down.]

Replace [content_follower.js]
To work on your legs, she flips around, resting her [pippa.pussyNoun] on your back and her breasts on your ass.
With:
[pc.isTaur|To work on your legs, she flips around, straddling your tauric back and leaning down over your hindquarters.|To work on your legs, she flips around, resting her [pippa.pussyNoun] on your back and her breasts on your ass.]

Replace [content_follower.js]
Pippa easily flips you onto your back beneath her.
With:
[pc.isTaur|Pippa easily rolls you onto your side beneath her.|Pippa easily flips you onto your back beneath her.]

Replace [content_follower.js]
she straddles your waist and works on
With:
[pc.isTaur|she leans over your human half and works on|she straddles your waist and works on]

Replace [content_follower.js]
Pippa rights herself and straddles your hips.
With:
[pc.isTaur|Pippa rights herself and straddles your haunch.|Pippa rights herself and straddles your hips.]

# --- #29 Sex (Ramis) ---
Replace [content_follower.js]
to get on your knees and pleasure
With:
[pc.isTaur|to fold your legs and pleasure|to get on your knees and pleasure]

Replace [content_follower.js]
pushing you back onto the floor in a muddle
With:
[pc.isTaur|bowling you over onto your side on the floor in a muddle|pushing you back onto the floor in a muddle]

# ===== content_mhenga.js (24 changes) =====
# --- #35 Fuck N Suck (Flahne) ---
Replace [content_mhenga.js]
You lean back and line your 
With:
[pc.isTaur|You shift your weight back and line your |You lean back and line your ]

# --- #39 Get Stuffed (Flahne) ---
Replace [content_mhenga.js]
The gel girl gasps as you straddle her
With:
[pc.isTaur|The gel girl gasps as you loom over her chair|The gel girl gasps as you straddle her]

Replace [content_mhenga.js]
and you find yourself on your back, lying sprawled out on her desk
With:
[pc.isTaur|and you find yourself sprawled on your side across her desk|and you find yourself on your back, lying sprawled out on her desk]

# --- #42 Sex (Geoff) ---
Replace [content_mhenga.js]
his soft ass bounces against your thighs
With:
[pc.isTaur|his soft ass bounces against your tauric underbelly|[pc.isNaga|his soft ass bounces against your coils|his soft ass bounces against your thighs]]

Replace [content_mhenga.js]
So you sit back as he explores
With:
[pc.isTaur|So you hold still as he explores|[pc.isNaga|So you settle back on your coils as he explores|So you sit back as he explores]]

Replace [content_mhenga.js]
For a moment you sit there, cock softening
With:
[pc.isBiped|For a moment you sit there, cock softening|For a moment you rest there, cock softening]

# --- #43 Bet Petplay (Syri) ---
Replace [content_mhenga.js]
You obey and sit on your knees while your better
With:
[pc.isTaur|You obey and fold your legs beneath you|[pc.isNaga|You obey and settle down on your coils|You obey and sit on your knees]] while your better

Replace [content_mhenga.js]
You obey and sit on your knees while your master
With:
[pc.isTaur|You obey and fold your legs beneath you|[pc.isNaga|You obey and settle down on your coils|You obey and sit on your knees]] while your master

# [x2]
Replace [content_mhenga.js]
Syri smiles down at you as you sit there on your knees
With:
Syri smiles down at you [pc.isTaur|as you wait there with your legs folded|[pc.isNaga|as you wait there coiled up|as you sit there on your knees]]

# [x2]
Replace [content_mhenga.js]
Syri smiles down at you as you sit there on your knees
With:
Syri smiles down at you [pc.isTaur|as you wait there with your legs folded|[pc.isNaga|as you wait there coiled up|as you sit there on your knees]]

Replace [content_mhenga.js]
you do as she says and stand up, practically trembling
With:
[pc.isNaga|you do as she says and rise up on your coils|you do as she says and stand up], practically trembling

Replace [content_mhenga.js]
you do as she says and stand up, rubbing your hands
With:
[pc.isNaga|you do as she says and rise up on your coils|you do as she says and stand up], rubbing your hands

Replace [content_mhenga.js]
bring yourself down onto your hands and knees
With:
[pc.isTaur|bring your forelegs down and lower your human half|[pc.isNaga|lower yourself onto your hands with your coils stretched out behind you|bring yourself down onto your hands and knees]]

# [x2]
Replace [content_mhenga.js]
Your time between reamings and blowjobs is spent curled up on your master’s lap
With:
Your time between reamings and blowjobs is spent [pc.isTaur|curled up at your master’s feet|[pc.isNaga|coiled around your master’s legs|curled up on your master’s lap]]

# [x2]
Replace [content_mhenga.js]
Your time between reamings and blowjobs is spent curled up on your master’s lap
With:
Your time between reamings and blowjobs is spent [pc.isTaur|curled up at your master’s feet|[pc.isNaga|coiled around your master’s legs|curled up on your master’s lap]]

# --- #44 Vaginal / Anal / Tribbing (Yoma) ---
Replace [content_mhenga.js]
reaching down between your legs to stroke
With:
[pc.isTaur|reaching back beneath your tail to stroke|[pc.isNaga|reaching down along your coils to stroke|reaching down between your legs to stroke]]

Replace [content_mhenga.js]
At some point you sit up to wrap your arms
With:
[pc.isTaur|At some point you twist your human half around to wrap your arms|At some point you sit up to wrap your arms]

Replace [content_mhenga.js]
Yoma shuffles to straddle your waist, hovering over your groin
With:
[pc.isTaur|Yoma shuffles up against your hindquarters, hovering over your groin|Yoma shuffles to straddle your waist, hovering over your groin]

Replace [content_mhenga.js]
shifting so you’re lying on your back
With:
[pc.isTaur|shifting so you’re lying on your side|shifting so you’re lying on your back]

Replace [content_mhenga.js]
before sitting back and threading your legs with his
With:
[pc.isTaur|before turning around and backing your hindquarters against his hips|[pc.isNaga|before sitting back and winding your tail around his legs|before sitting back and threading your legs with his]]

Replace [content_mhenga.js]
the sweat trickling down your inner thighs
With:
the sweat trickling [pc.isTaur|down your hind legs|[pc.isNaga|down your coils|down your inner thighs]]

# --- #50 Breastfeed (zil) (gate closed in the 2026-10-25 gates mod) ---
# [x2]
Replace [content_mhenga.js]
resting against it. You drop to your knees and straddle the zil’s legs
With:
resting against it. [pc.isTaur|You fold your legs and settle down beside the zil|You drop to your knees and straddle the zil’s legs]

# [x2]
Replace [content_mhenga.js]
resting against it. You drop to your knees and straddle the zil’s legs
With:
resting against it. [pc.isTaur|You fold your legs and settle down beside the zil|You drop to your knees and straddle the zil’s legs]

Replace [content_mhenga.js]
You carefully sit up and nudge her
With:
[pc.isTaur|You carefully lift your human half and nudge her|You carefully sit up and nudge her]

# ===== content_myrellion.js (6 changes) =====
# --- #51 Cowgirl (Anzhela) ---
Replace [content_myrellion.js]
you realize you’ve been straddled by the scarlet haired doctor
With:
[pc.isTaur|you realize the scarlet haired doctor has climbed astride your tauric back|you realize you’ve been straddled by the scarlet haired doctor]

Replace [content_myrellion.js]
you lie on each other in the hospital bed, your chests rising and falling against each other
With:
[pc.isTaur|you lie tangled together in the hospital bed, her chest rising and falling against your own|you lie on each other in the hospital bed, your chests rising and falling against each other]

# --- #57 TentaDomme ---
Replace [content_myrellion.js]
You’re sitting against the side of a stone wall.
With:
[pc.isTaur|You’re slumped on your side against a stone wall.|You’re sitting against the side of a stone wall.]

# --- #58 LezDomme ---
Replace [content_myrellion.js]
You’re sitting against a wall in the streets of Gildenmere.
With:
[pc.isTaur|You’re slumped on your side against a wall in the streets of Gildenmere.|You’re sitting against a wall in the streets of Gildenmere.]

# --- #59 Cowgirl (Vi) ---
Replace [content_myrellion.js]
you climb into one of the beds and lie back. Instinctively, the blushing nurse droid climbs on and slowly straddles you. Her tiny hands rest sweetly upon your chest, knees to either side of your waist
With:
[pc.isTaur|you fold your legs on one of the beds and roll onto your side. Instinctively, the blushing nurse droid climbs on and slowly straddles your hindquarters. Her tiny hands rest sweetly upon your flank, knees to either side of your haunch|you climb into one of the beds and lie back. Instinctively, the blushing nurse droid climbs on and slowly straddles you. Her tiny hands rest sweetly upon your chest, knees to either side of your waist]

# --- #61 Get Head (Vi) ---
Replace [content_myrellion.js]
you lie back, relaxing into the pillow behind you
With:
[pc.isTaur|you settle onto your side, propping your human half against the pillow behind you|you lie back, relaxing into the pillow behind you]

# ===== content_new_texas.js (18 changes) =====
# --- #12 Vaginal (Gianna) (gate closed in the 2026-10-25 gates mod) ---
Replace [content_new_texas.js]
begs to be bounced on your lap
With:
[pc.isTaur|begs to be bounced against your hindquarters|begs to be bounced on your lap]

# --- #13 Titfuck / Titfuck+ (Gianna) ---
Replace [content_new_texas.js]
and your lap doesn’t fare much better.
With:
[pc.isTaur|and your tauric underbelly doesn’t fare much better.|and your lap doesn’t fare much better.]

Replace [content_new_texas.js]
letting her smother your lap
With:
[pc.isTaur|letting her smother your groin|letting her smother your lap]

Replace [content_new_texas.js]
Gianna bounces her tits in your lap.
With:
[pc.isTaur|Gianna bounces her tits beneath your barrel.|Gianna bounces her tits in your lap.]

Replace [content_new_texas.js]
the mammoth mammaries in your lap
With:
the mammoth mammaries [pc.isTaur|pressed up beneath your barrel|in your lap]

# --- #64 Suckle (Brandy) ---
Replace [content_new_texas.js]
climbing atop the toppled cowgirl and straddling her midsection
With:
[pc.isTaur|standing over the toppled cowgirl, your forelegs to either side of her midsection|climbing atop the toppled cowgirl and straddling her midsection]

# --- #65 Exhibitionism (Brandy) ---
Replace [content_new_texas.js]
You sit there on your knees for a moment
With:
[pc.isTaur|You stand over her for a moment|[pc.isNaga|You rest there on your coils for a moment|You sit there on your knees for a moment]]

Replace [content_new_texas.js]
you bend over and place your lips
With:
[pc.isTaur|you lean your human half down and place your lips|you bend over and place your lips]

# --- #68 S.Motivate ---
Replace [content_new_texas.js]
Now in his lap, resting your head on his shoulder
With:
[pc.isTaur|Now curled up against him, resting your head on his shoulder|Now in his lap, resting your head on his shoulder]

# --- #69 Bench Anal (Busky) ---
Replace [content_new_texas.js]
you slide off of his cock and straddle his chest
With:
[pc.isTaur|you slide off of his cock and step forward until you’re standing over his chest|you slide off of his cock and straddle his chest]

# --- #72 Vanilla (Ciaran) ---
# [x2]
Replace [content_new_texas.js]
even though you’ve simply been lying on your back this whole time
With:
even though you’ve simply been [pc.isTaur|lying on your side|lying on your back] this whole time

# [x2]
Replace [content_new_texas.js]
even though you’ve simply been lying on your back this whole time
With:
even though you’ve simply been [pc.isTaur|lying on your side|lying on your back] this whole time

# --- #73 Lap Fuck (Ciaran) ---
Replace [content_new_texas.js]
You straddle his lap, balancing on your knees as you move into position for penetration
With:
[pc.isTaur|You turn and back your hindquarters over his lap, bracing your [pc.legs] as you move into position for penetration|You straddle his lap, balancing on your knees as you move into position for penetration]

Replace [content_new_texas.js]
he puts both his hands under your ass and hefts you up
With:
[pc.isTaur|he grips your haunches and tugs you down|he puts both his hands under your ass and hefts you up]

# --- #74 Heat Sex (Ciaran) ---
Replace [content_new_texas.js]
a bull’s got your legs on his shoulders
With:
[pc.isNaga|a bull’s got your tail over his shoulders|a bull’s got your legs on his shoulders]

# --- #80 Anal ---
Replace [content_new_texas.js]
She’ll be crying out soon enough. Kneeling behind her, you
With:
She’ll be crying out soon enough. [pc.isTaur|Standing over her, you|Kneeling behind her, you]

# --- #83 Sexercise (Anno) ---
Replace [content_new_texas.js]
so that you can sit face-to-face, with her atop your lap.
With:
[pc.isTaur|so that you’re face-to-face, with her perched atop your tauric back.|so that you can sit face-to-face, with her atop your lap.]

Replace [content_new_texas.js]
making her bounce on your lap
With:
[pc.isTaur|making her bounce against you|making her bounce on your lap]

# ===== content_tarkus.js (13 changes) =====
# --- #86 Get Stuffed (lapinara) ---
Replace [content_tarkus.js]
you plop down on your [pc.butt] and recline comfortably on your back.
With:
[pc.isTaur|you fold your legs and roll onto your side.|you plop down on your [pc.butt] and recline comfortably on your back.]

Replace [content_tarkus.js]
you finally sit up and take a look around
With:
[pc.isTaur|you finally lift your human half and take a look around|you finally sit up and take a look around]

# --- #87 Spank ---
Replace [content_tarkus.js]
You sit beside him and grab him
With:
[pc.isTaur|You settle down beside him and grab him|You sit beside him and grab him]

Replace [content_tarkus.js]
dragging him over your lap
With:
[pc.isTaur|dragging him across your folded forelegs|dragging him over your lap]

# --- #88 Blowjob (Tessa) ---
Replace [content_tarkus.js]
She buries her face as far as she can down into your lap
With:
She buries her face [pc.isTaur|as far as she can beneath your barrel|as far as she can down into your lap]

# --- #89 Get Eaten (Tessa) ---
Replace [content_tarkus.js]
You rise to your feet and sigh.
With:
[pc.isNaga|You rise up on your coils and sigh.|You rise to your feet and sigh.]

Replace [content_tarkus.js]
laying down with your head on the arm rest
With:
[pc.isTaur|folding your legs and settling down beside it with your human half propped on the arm rest|laying down with your head on the arm rest]

Replace [content_tarkus.js]
[pc.skinFurScalesNoun] on your legs, seemingly exploring you
With:
[pc.skinFurScalesNoun] [pc.isTaur|on your hind legs|[pc.isNaga|on your tail|on your legs]], seemingly exploring you

Replace [content_tarkus.js]
while simultaneously spreading your legs apart.
With:
[pc.isTaur|while simultaneously lifting your hind leg aside.|[pc.isNaga|while simultaneously parting your coils.|while simultaneously spreading your legs apart.]]

Replace [content_tarkus.js]
You hear her chuckle from down between your legs
With:
You hear her chuckle [pc.isTaur|from beneath your tail|[pc.isNaga|from down along your coils|from down between your legs]]

Replace [content_tarkus.js]
pushes against your thighs, trying to spread them apart further
With:
[pc.isTaur|pushes against your haunches, trying to spread your hind legs further|[pc.isNaga|pushes against your coils, trying to spread them apart further|pushes against your thighs, trying to spread them apart further]]

Replace [content_tarkus.js]
you can’t seem to stop the shaking in your legs
With:
you can’t seem to stop the shaking [pc.isTaur|in your hind legs|[pc.isNaga|in your tail|in your legs]]

Replace [content_tarkus.js]
You place your feet on the floor and rub your face
With:
[pc.isTaur|You get your [pc.feet] under you and rub your face|[pc.isNaga|You slide your coils off the couch and rub your face|You place your feet on the floor and rub your face]]

# ===== content_uveto.js (27 changes) =====
# --- #117 Myr Venom (Chaurmine) ---
Replace [content_uveto.js]
struggling for breath on hands and knees
With:
[pc.isTaur|struggling for breath, legs folded beneath you|struggling for breath on hands and knees]

Replace [content_uveto.js]
once you’ve risen to your knees
With:
[pc.isTaur|once you’ve got your forelegs back under you|once you’ve risen to your knees]

Replace [content_uveto.js]
Kneeling in between his legs, you grab
With:
[pc.isTaur|Lowering your human half between his legs, you grab|Kneeling in between his legs, you grab]

# --- #118 Sex (Chrissy) ---
Replace [content_uveto.js]
you lean back in your seat, trying your best
With:
[pc.isTaur|you shift your weight back, trying your best|you lean back in your seat, trying your best]

Replace [content_uveto.js]
as you finally sit down across from her at the table
With:
[pc.isTaur|as you finally settle in across from her at the table|as you finally sit down across from her at the table]

Replace [content_uveto.js]
before you sit the two of you down on the bed
With:
[pc.isTaur|before you settle the two of you down on the bed|before you sit the two of you down on the bed]

Replace [content_uveto.js]
almost has her compact, squeezable butt right on your lap, fluffy tail brushing along your thighs.
With:
[pc.isTaur|almost has her compact, squeezable butt right up against your groin, fluffy tail brushing along your forelegs.|[pc.isNaga|almost has her compact, squeezable butt right on your lap, fluffy tail brushing along your coils.|almost has her compact, squeezable butt right on your lap, fluffy tail brushing along your thighs.]]

Replace [content_uveto.js]
leaving the tanuki in your lap to squirm
With:
[pc.isTaur|leaving the tanuki pressed beneath your barrel to squirm|leaving the tanuki in your lap to squirm]

Replace [content_uveto.js]
sitting there in your lap while she adjusts
With:
[pc.isTaur|perched there against you while she adjusts|sitting there in your lap while she adjusts]

Replace [content_uveto.js]
bouncing Chrissy in your lap
With:
[pc.isTaur|bouncing Chrissy against your groin|bouncing Chrissy in your lap]

Replace [content_uveto.js]
you pull back, rising to you knees with your lover’s legs still wrapped around your back
With:
[pc.isTaur|you pull back, rearing up with your lover’s legs still wrapped around your barrel|[pc.isNaga|you pull back, rising up on your coils with your lover’s legs still wrapped around your waist|you pull back, rising to you knees with your lover’s legs still wrapped around your back]]

Replace [content_uveto.js]
you climb atop her, straddling her ample hips
With:
[pc.isTaur|you loom over her, forelegs to either side of her ample hips|[pc.isNaga|you coil over her, pinning her ample hips|you climb atop her, straddling her ample hips]]

Replace [content_uveto.js]
You rise to your knees and take hold of Chrissy’s cock
With:
[pc.isTaur|You rear up and take hold of Chrissy’s cock|[pc.isNaga|You rise up on your coils and take hold of Chrissy’s cock|You rise to your knees and take hold of Chrissy’s cock]]

Replace [content_uveto.js]
backwards onto the bed, getting yourself nice and comfortable as your sit up on your elbows. You spread your legs invitingly for Chrissy,
With:
backwards onto the bed, [pc.isTaur|folding your legs and rolling onto your side as you prop yourself up on your elbows. You lift your hind leg invitingly for Chrissy,|[pc.isNaga|getting yourself nice and comfortable as you prop yourself up on your elbows. You part your coils invitingly for Chrissy,|getting yourself nice and comfortable as your sit up on your elbows. You spread your legs invitingly for Chrissy,]]

Replace [content_uveto.js]
backwards onto your lover’s bed, getting yourself nice and comfortable as your sit up on your elbows. You spread your legs invitingly for Chrissy,
With:
backwards onto your lover’s bed, [pc.isTaur|folding your legs and rolling onto your side as you prop yourself up on your elbows. You lift your hind leg invitingly for Chrissy,|[pc.isNaga|getting yourself nice and comfortable as you prop yourself up on your elbows. You part your coils invitingly for Chrissy,|getting yourself nice and comfortable as your sit up on your elbows. You spread your legs invitingly for Chrissy,]]

Replace [content_uveto.js]
closer to the tanuki’s erect dick while your knees rise to her waist
With:
closer to the tanuki’s erect dick [pc.isTaur|while your hind leg lifts higher|[pc.isNaga|while your coils rise to her waist|while your knees rise to her waist]]

Replace [content_uveto.js]
taking hold of your knee with one hand
With:
[pc.isTaur|taking hold of your haunch|[pc.isNaga|taking hold of your tail|taking hold of your knee]] with one hand

Replace [content_uveto.js]
Almost immediately, you throw your [pc.legOrLegs] around her plush thighs
With:
[pc.isTaur|Almost immediately, you hook a hind leg over her plush thighs|[pc.isNaga|Almost immediately, you coil your tail around her plush thighs|Almost immediately, you throw your [pc.legOrLegs] around her plush thighs]]

Replace [content_uveto.js]
with a gentle push of your legs
With:
with a gentle push [pc.isTaur|of your hind legs|[pc.isNaga|of your tail|of your legs]]

# --- #119 Catch (Dreghan) ---
Replace [content_uveto.js]
You slowly begin to lower yourself to your knees
With:
[pc.isTaur|You slowly fold your forelegs to lower yourself|You slowly begin to lower yourself to your knees]

Replace [content_uveto.js]
you settle on your knees, bringing your face
With:
[pc.isTaur|you settle low, bringing your face|you settle on your knees, bringing your face]

Replace [content_uveto.js]
You sit, watching it grow
With:
[pc.isTaur|You stay low, watching it grow|You sit, watching it grow]

Replace [content_uveto.js]
as you rest on your hands and knees atop the fluffy bedding
With:
[pc.isTaur|as you brace your [pc.legs] atop the fluffy bedding|as you rest on your hands and knees atop the fluffy bedding]

Replace [content_uveto.js]
Dreghan has already flipped you over
With:
Dreghan has already [pc.isTaur|rolled you onto your side|flipped you over]

Replace [content_uveto.js]
you find yourself on your back with your [pc.chest] exposed
With:
[pc.isTaur|you find yourself sprawled on your side with your [pc.chest] exposed|you find yourself on your back with your [pc.chest] exposed]

# --- #121 HJ+RideHer ---
Replace [content_uveto.js]
Lifting up to a squat
With:
[pc.isTaur|Lowering your human half|Lifting up to a squat]

# --- #125 Flork Her ---
Replace [content_uveto.js]
you put her down on your lap
With:
[pc.isTaur|you set her down against your flank|you put her down on your lap]

# ===== content_zhengshi.js (20 changes) =====
# --- #127 Let Her ---
Replace [content_zhengshi.js]
making your toes curl painfully
With:
[pc.isNaga|making the tip of your tail curl painfully|making your toes curl painfully]

# --- #130 Cowgirl (Cherry) ---
Replace [content_zhengshi.js]
you lift the ballooned girl up enough to plop down on your midsection in a cowgirl position
With:
[pc.isTaur|you heave the ballooned girl up onto your tauric back|you lift the ballooned girl up enough to plop down on your midsection in a cowgirl position]

Replace [content_zhengshi.js]
You sit up and adjust your grip
With:
[pc.isTaur|You twist your human half around and adjust your grip|You sit up and adjust your grip]

Replace [content_zhengshi.js]
you raise her off your lap
With:
[pc.isTaur|you raise her off your back|you raise her off your lap]

Replace [content_zhengshi.js]
you lay back to restrain the urge
With:
[pc.isTaur|you go still to restrain the urge|you lay back to restrain the urge]

Replace [content_zhengshi.js]
the bloated pirate squirming in your lap
With:
the bloated pirate [pc.isTaur|squirming on your back|squirming in your lap]

# [x3]
Replace [content_zhengshi.js]
bucking in wild abandon, saddle-bound against your lap
With:
bucking in wild abandon, [pc.isTaur|saddle-bound on your back|saddle-bound against your lap]

# [x3]
Replace [content_zhengshi.js]
bucking in wild abandon, saddle-bound against your lap
With:
bucking in wild abandon, [pc.isTaur|saddle-bound on your back|saddle-bound against your lap]

# [x3]
Replace [content_zhengshi.js]
bucking in wild abandon, saddle-bound against your lap
With:
bucking in wild abandon, [pc.isTaur|saddle-bound on your back|saddle-bound against your lap]

# --- #133 Drain Bunnies ---
Replace [content_zhengshi.js]
you shove the twink-pirate down and straddle him, scything his head between your [pc.thighs],
With:
[pc.isTaur|you shove the twink-pirate down and stand over him, lowering your hindquarters until his head is trapped beneath you,|[pc.isNaga|you shove the twink-pirate down and coil over him, pinning his head against your scales,|you shove the twink-pirate down and straddle him, scything his head between your [pc.thighs],]]

# --- #135 Fuck Her ---
Replace [content_zhengshi.js]
you kneel next to her, running a hand
With:
[pc.isTaur|you lower your human half beside her, running a hand|you kneel next to her, running a hand]

Replace [content_zhengshi.js]
grinning toothily at the whimpering kitten as you kneel down
With:
grinning toothily at the whimpering kitten [pc.isTaur|as you lower your human half|as you kneel down]

Replace [content_zhengshi.js]
You sit up with a deep groan
With:
[pc.isTaur|You lift your human half with a deep groan|You sit up with a deep groan]

Replace [content_zhengshi.js]
she flips you over on your back
With:
[pc.isTaur|she rolls you onto your side|she flips you over on your back]

Replace [content_zhengshi.js]
Leaned back, straddling you from the [pc.chestNoun]-down in cowgirl position
With:
[pc.isTaur|Leaned back, perched astride your tauric back|Leaned back, straddling you from the [pc.chestNoun]-down in cowgirl position]

Replace [content_zhengshi.js]
you lie on your stomach in front of Coco
With:
[pc.isTaur|you fold your legs and settle down in front of Coco|you lie on your stomach in front of Coco]

# --- #136 Catch Anal ---
Replace [content_zhengshi.js]
arms limply fallen to the ground and wrists against your knees
With:
[pc.isTaur|arms limply fallen beside your folded forelegs|[pc.isNaga|arms limply fallen against your coils|arms limply fallen to the ground and wrists against your knees]]

Replace [content_zhengshi.js]
you feel his testicles rising, brushing your thighs
With:
you feel his testicles rising, [pc.isTaur|brushing your haunches|[pc.isNaga|brushing your coils|brushing your thighs]]

Replace [content_zhengshi.js]
his aim at first your back, then your legs,
With:
his aim at first your back, [pc.isTaur|then your hind legs,|[pc.isNaga|then your tail,|then your legs,]]

# --- #139 VIP Service ---
Replace [content_zhengshi.js]
groan awake in your lap
With:
[pc.isTaur|groan awake against your flank|groan awake in your lap]

# ===== main.js (26 changes) =====
# --- #144 Sex (jumper) ---
Replace [main.js]
buck backwards into your lap
With:
[pc.isTaur|buck backwards against you|buck backwards into your lap]

Replace [main.js]
you’re sitting upright against the wall with her
With:
[pc.isTaur|you’re slumped against the wall with her|you’re sitting upright against the wall with her]

Replace [main.js]
When you sit up, the crunch on your gut
With:
[pc.isTaur|When you rise, the crunch on your gut|When you sit up, the crunch on your gut]

# --- #148 Sixty-Nine ---
Replace [main.js]
When you sit up and take stock
With:
[pc.isTaur|When you lift your human half and take stock|When you sit up and take stock]

# --- #150 Enter (the wedding) ---
Replace [main.js]
you get down low onto your knees, your fingers
With:
[pc.isTaur|you fold your legs and get down low, your fingers|[pc.isNaga|you lower yourself on your coils, your fingers|you get down low onto your knees, your fingers]]

Replace [main.js]
You are on your hands and knees, sucking off the Best Man
With:
[pc.isTaur|You are crouched low on folded legs, sucking off the Best Man|[pc.isNaga|You are coiled low on the floor, sucking off the Best Man|You are on your hands and knees, sucking off the Best Man]]

Replace [main.js]
[pc.vagina] quiver between your thighs.
With:
[pc.vagina] quiver [pc.isTaur|beneath your tail.|[pc.isNaga|low on your tail.|between your thighs.]]

Replace [main.js]
[pc.vagina] quivers between your thighs in response.
With:
[pc.vagina] quivers [pc.isTaur|beneath your tail|[pc.isNaga|low on your tail|between your thighs]] in response.

Replace [main.js]
You sit on the ground a minute
With:
[pc.isTaur|You stay down on the floor a minute|You sit on the ground a minute]

Replace [main.js]
You pull yourself up to your feet and head over to the sink
With:
[pc.isNaga|You pull yourself upright on your coils and head over to the sink|You pull yourself up to your feet and head over to the sink]

Replace [main.js]
as fast as your legs can carry you
With:
[pc.isNaga|as fast as your tail can carry you|as fast as your legs can carry you]

Replace [main.js]
makes your knees go weak and you fall to the floor on your [pc.ass] between the two women
With:
[pc.isTaur|makes your legs give out and you collapse onto the floor between the two women|[pc.isNaga|makes your coils go slack and you slump to the floor between the two women|makes your knees go weak and you fall to the floor on your [pc.ass] between the two women]]

Replace [main.js]
letting them both fall to the floor at your feet
With:
[pc.isBiped|letting them both fall to the floor at your feet|letting them both fall to the floor in front of you]

Replace [main.js]
from your head to your thighs.
With:
[pc.isTaur|from your head to your hindquarters.|[pc.isNaga|from your head to your tail.|from your head to your thighs.]]

Replace [main.js]
Tessa plants her hands on your shoulders and pushes you flat on your back. Before you can protest, the ivory seductress drops down on top of you, straddling your waist with her thick thighs.
With:
[pc.isTaur|Tessa plants her hands on your shoulders and pushes you down onto your side. Before you can protest, the ivory seductress climbs up against you, straddling your hind leg with her thick thighs.|Tessa plants her hands on your shoulders and pushes you flat on your back. Before you can protest, the ivory seductress drops down on top of you, straddling your waist with her thick thighs.]

Replace [main.js]
Tessa’s hand flashes between your legs
With:
[pc.isTaur|Tessa’s hand flashes beneath your tail|[pc.isNaga|Tessa’s hand flashes down along your coils|Tessa’s hand flashes between your legs]]

Replace [main.js]
Tessa has buried her face in your lap
With:
[pc.isTaur|Tessa has buried her face beneath your barrel|Tessa has buried her face in your lap]

Replace [main.js]
Adra has buried her face in your lap
With:
[pc.isTaur|Adra has buried her face beneath your barrel|Adra has buried her face in your lap]

Replace [main.js]
scaling back up you into a straddling position once more. Her thick egg-bearing hips are on either side of yours now
With:
[pc.isTaur|scaling back up you into a straddling position once more, astride your hindquarters. Her thick egg-bearing hips are pressed against yours now|scaling back up you into a straddling position once more. Her thick egg-bearing hips are on either side of yours now]

Replace [main.js]
scaling back up you into a straddling position once more. Her wide hips are on either side of yours now
With:
[pc.isTaur|scaling back up you into a straddling position once more, astride your hindquarters. Her wide hips are pressed against yours now|scaling back up you into a straddling position once more. Her wide hips are on either side of yours now]

Replace [main.js]
Tessa ooze all over your lap
With:
[pc.isTaur|Tessa ooze all over your hindquarters|Tessa ooze all over your lap]

Replace [main.js]
Adra burn on your lap
With:
[pc.isTaur|Adra burn against your hindquarters|Adra burn on your lap]

Replace [main.js]
Adra places her hands on your shoulders and guides you down until you’re flat on your back. The ausar swings her leg over you, now straddling your waist with her strong thighs.
With:
[pc.isTaur|Adra places her hands on your shoulders and guides you down until you’re lying on your side. The ausar swings her leg over your hindquarters, now straddling you with her strong thighs.|Adra places her hands on your shoulders and guides you down until you’re flat on your back. The ausar swings her leg over you, now straddling your waist with her strong thighs.]

Replace [main.js]
Slowly, Adra’s hand moves between your legs
With:
Slowly, Adra’s hand [pc.isTaur|moves beneath your tail|[pc.isNaga|moves down along your coils|moves between your legs]]

Replace [main.js]
Pulling yourself to your feet, you ask the ovir
With:
[pc.isNaga|Pulling yourself upright on your coils, you ask the ovir|Pulling yourself to your feet, you ask the ovir]

Replace [main.js]
Karen is jerking around on your lap
With:
[pc.isTaur|Karen is jerking around on your hindquarters|Karen is jerking around on your lap]

