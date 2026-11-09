    /* ================= 7. Sex menu (William left it "TBW"; written by Techy-Nest from his notes) =================
       Every scene has biped, taur and naga versions through {taur: ... / naga: ... / else: ...}.
       No "/" inside our prose: it splits alternatives. */
    k("naga", P.naga);
    k("hasGenitals", hasGenitals);
    k("canMasturbate", canMasturbate);
    k("first", function () { return !!CTX.first; });
    k("firstTime", function () { return !!(CTX.firstTime !== undefined ? CTX.firstTime : CTX.first); });
    k("biped", function () { return body() === "biped"; });
    k("cockOnly", function () { return hasCock() && !hasPussy(); });
    k("rooPuffy", function () { return (flags.TN_ROO_PUMP_USED || 0) > 0; });
    k("rooVeryPuffy", function () { return (flags.TN_ROO_PUMP_USED || 0) >= 3; });
    k("sexedRoo", function () { return (flags.TN_ROO_SEXED || 0) > 0; });
    k("rooVirginTonight", function () { return !!CTX.rVirgin; });
    k("rooSoaked", function () { return lust() >= 50 || vibesOn(); });

    var RET = null;                        // where Next goes after a scene
    function ret(fn) { RET = fn; }
    function done(o) {
        o = o || {};
        if (o.pcCum === false || !hasGenitals()) pcLust(15 + rnd(15)); else pcCum();
        if (o.roo !== 0) rooCums(o.roo || 1);
        if (o.milk) drainMilk(o.milk);
        inc("TN_ROO_SEXED");
        flags.TN_ROO_LAST_SEX_TS = now();
        if (o.cumIn && hasCock()) inc("TN_ROO_CREAMPIES");
        timePass(o.min || 25, o.max || 45);
        var back = RET || function () { mainGameMenu(); };
        RET = null;
        next(back);
    }
    function sexScene() { clearOutput(); showRoo(true); byUs(); CTX = {}; }

    /* shared lines */
    var STRIP = "{rooNude: She’s already naked, which saves time. / steele: Roo peels out of her black and gold Steele Tech uniform, folding it with exaggerated care before tossing it at the chair and missing. / rooWearingAnyClothes: Roo wriggles out of what she’s wearing, bright red panties last, and kicks them off one ankle with a little flourish.}";
    var VIBE = "{vibesIn: Before anything else you hook a finger through the little loop between her legs and ease her vibrators out. Roo whimpers at the sudden emptiness, then giggles at herself for whimpering. / else: }";
    var MILKY = "{milky: Her swollen breasts sway heavily with every move, nipples beaded white and leaking in slow drips down her belly. / else: }";

    /* ---------- menu ---------- */
    function sexMenuIntro() {
        clearOutput(); showRoo(); byUs(); CTX = {};
        if (slave()) say([pick([
            "You tell your slave you’re in the mood. Roo is on her feet before you’ve finished the sentence, hands folded behind her back, [roo.ears] perked and tails swishing. <i>“How would you like me, [pc.Master]?”</i>",
            "Roo reads it on your face before you say it. She sinks onto the edge of her bed and smooths her hands down her thighs, cherry eyes shining up at you. <i>“Use me however you like, [pc.Master]. I’m all yours.”</i>"])]);
        else say([pick([
            "<i>“Oh?”</i> Roo catches your look and her tails curl into question marks. A slow, fanged grin follows. <i>“Ohhh. Well, [pc.name], what did you have in mind? I have <b>ideas</b> too, you know.”</i>",
            "You don’t have to say much. Roo bites her lip, scoots closer, and lays a hand flat on your {taur: flank / naga: coils / else: thigh}. <i>“Mmm, I was hoping you’d come by. Let’s have some fun!”</i>"])]);
        if (vibesOn()) say(["The faint buzz from between her legs has her squirming already. She’s not going to last long, whatever you choose."], true);
        sexMenu();
    }
    function sexMenu() {
        clearMenu();
        ret(function () { backToRoo(); });
        addButton(0, slave() ? "Orders" : "Direction", ordersMenu, slave() ? "Orders" : "Direction", slave() ? "Tell her exactly what you want." : "Guide her into something specific.");
        addButton(1, "Eat Her Out", eatOut, "Eat Her Out", "Get a taste of kitty.");
        btn(2, "Lap Ride", lapRide, hasGenitals(), "Let her climb on and ride.", "You need something between your legs for her to ride.");
        if (hasCock()) btn(3, "Missionary", missionary, true, flags.TN_ROO_HYMEN === undefined ? "Lay her down and take her the old-fashioned way. She seems to have something on her mind about it..." : "Lay her down and take her the old-fashioned way.");
        if (flags.TN_ROO_PUMP_GIVEN) addButton(4, "Use Puss.Pump", pumpScene, "Use Puss.Pump", "Strap the SukMastr 2000 onto her and see what happens.");
        btn(5, "Shower Sex", showerSex, flags.TN_ROO_SHOWER_OK === 1 || pcMessy(), "Get squeaky clean. And also laid.", "Roo would love to wash you off... but you’re not dirty right now. Come back sweaty or sticky, or grope her when she’s milky.");
        btn(6, "Milky Titfuck", milkyTitfuck, milky() && hasCock(), "Mount Roo and screw her boobs to another spectacular titgasm.", !hasCock() ? "You need a cock for this." : "Her breasts need to be full of milk for this. Lactaid, anyone?");
        addButton(7, "Boob Play", boobPlay, "Boob Play", "Those tits need attention.");
        if (free()) btn(8, silly() ? "Roough Rider" : "Roo Rider", rooRider, highLust(), "She’s horny enough to pounce. Let her.", "Roo would need to be a whole lot hornier for this. Get her lust really high.");
        btn(9, "Quickie BJ", quickie, hasGenitals(), "Yes, she can.", "You don’t have anything for her to put her mouth on down there.");
        addButton(14, "Back", function () { backToRoo(); });
    }
    H.sexMenu = sexMenuIntro;

    function ordersMenu() {
        clearOutput(); showRoo(); byUs();
        say([slave() ? "<i>“Yes, [pc.Master]?”</i> Roo waits, still as a statue except for the twitch of her tails." : "Roo props her chin on her hands. <i>“Ooh, you’ve got something particular in mind. Tell me!”</i>"]);
        clearMenu();
        addButton(0, "Striptease", striptease, "Striptease", "Have her dance for you. Odds are it won’t stay a dance.");
        btn(1, "Oral", function () { oral(false); }, hasGenitals(), "Have her put that mouth to work.", "You don’t have anything for her to put her mouth on down there.");
        btn(2, "Doggy", doggy, hasCock(), "Bend her over and take her from behind.", "You need a cock for this.");
        btn(3, "Bed Doggy", bedDoggy, hasCock(), "Push her down against her bed and use every soft inch of her." + (cockCount() > 1 ? " Her ass and thighs can take care of the extras." : ""), "You need a cock for this.");
        addButton(4, "Lap Pillow", lapPillow, "Lap Pillow", "Rest your head in her lap for a while.");
        addButton(5, "Nursing HJ", nursing, "Nursing HJ", hasGenitals() ? "Lie in her lap and suckle while she gets you off." : "Lie in her lap and suckle. She’ll find something to do with her hands.");
        addButton(14, "Back", function () { sexMenuIntro(); });
    }

    function pcMessy() {
        try {
            var fx = ["Sweaty", "Milk Bathed", "Pussy Drenched", "Cum Soaked", "Sore", "Very Sore", "Extremely Sore"];
            for (var i = 0; i < fx.length; i++) if (pc.hasStatusEffect(fx[i])) return true;
        } catch (e) {}
        return false;
    }
    function washPC() { try { if (typeof pc.shower === "function") pc.shower(); } catch (e) {} }

    /* ---------- Orders: Striptease -> Lapdance -> lap sex ---------- */
    function striptease() {
        sexScene(); showRoo();
        say([
            slave() ? "<i>“Dance for me,”</i> you order. Roo’s [roo.ears] shoot straight up. <i>“Yes, [pc.Master]!”</i> She dives for her terminal, cues up something with a heavy, lazy bassline, and turns back to you already rolling her hips."
                : "<i>“Dance for me?”</i> you ask. Roo gasps like you’ve offered her a holiday. <i>“Oh, you’re gonna regret asking, [pc.name]!”</i> She cues up something slow and thumping on her terminal and turns back to you with her tails swaying in time.",
            "{taur: There’s no chair on the ship that would hold you, so you fold your legs and settle onto the deck in the middle of her room, the bed at your back. / naga: You pile your coils into a thick, comfortable seat in the middle of her room and settle back into them. / else: You take a seat on the edge of her bed, leaning back on your hands.} Roo makes a slow circle around you, close enough that her tails brush you on every pass.",
            "The dealer’s outfit comes off one piece at a time, each one a little show of its own. A shoulder bared, then hidden again. A glance back over her shoulder. A skirt that drops an inch, then another, then pools around her ankles while she bends <i>all</i> the way down to pick it up. " + STRIP,
            "Her breasts bounce free and she doesn’t even pretend to be shy about it, squeezing them together and letting them go, grinning at the way your eyes follow. " + MILKY + " Then the hips. Roo rolls them like the music is pulling her by a string, twin tails curling into a heart around that big, freckled bottom as she backs toward you.",
            "{taur: She dances right up against your forelegs and grinds her backside down against your chest where you’re folded on the deck, rocking side to side, reaching back to pull your hands onto her hips. / naga: She backs right into your coils and sinks into them like a throne, grinding that thick bottom down into your lap while your tail curls up around her ankle. / else: She backs right into your lap and grinds, that soft, heavy bottom rolling over your thighs in slow, deliberate circles while she reaches back to pull your hands onto her hips.} {hasCock: There’s no hiding what it’s doing to you, and she can feel every twitch of it. / hasPussy: The heat building between your legs is impossible to ignore, and from the way she smirks, she knows. / else: Your whole body hums with it.}",
            "<i>“{slave: Does [pc.Master] like it?”</i> she purrs. <i>“I could keep going... or you could have me. Right here.”</i> / free: Having fun?”</i> she purrs over her shoulder. <i>“I can keep dancing... or you can stop being so polite and grab me.”</i>}"
        ]);
        pcLust(15 + rnd(10)); addLust(15);
        clearMenu();
        btn(0, "Take Her", lapSex, hasGenitals(), "The dance is over. Pull her down onto you.", "You don’t have anything down there for this to go anywhere. Enjoy the show!");
        addButton(1, "Just Watch", function () {
            sexScene(); showRoo();
            say(["You let her keep going. Roo dances until the song runs out and then dances through the next one too, laughing when you clap, until she finally flops down {taur: across your back / naga: into your coils / else: in your lap} panting and pink-cheeked.",
                "<i>“{slave: Thank you for watching me, [pc.Master]. / free: That was fun! You’re a good audience.}”</i> She nuzzles you and stays there, tails slowly unwinding, warm and pleased with herself."]);
            pcLust(10); addLust(10);
            timePass(20, 30);
            var back = RET || function () { mainGameMenu(); }; RET = null; next(back);
        }, "Just Watch", "Enjoy the show and nothing more.");
    }
    function lapSex() {
        sexScene();
        say([
            "You catch her by the hips mid-roll and pull. Roo squeaks, then melts. " + VIBE,
            "{taur: She knows exactly what to do with a [pc.race] like you. Roo hops up onto the bed and plants herself on all fours at its edge, twin tails lifted high and out of the way, and looks back at you with her ears flat and her cheeks red. You rise, step forward, and lower your barrel over her until your forelegs bracket the bed on either side. / naga: She settles back into your coils, facing you now, and your tail winds up around her waist and thighs, holding her in place like the arms of a chair. / else: She turns around in your lap to face you, knees sinking into the bed on either side of your [pc.hips], arms looping around your neck.}",
            "{hasCock: {taur: Your [pc.cock] finds her by feel alone, nudging and sliding through soaking folds until Roo reaches back between her legs and guides it home. She sinks back onto you with a long, shuddering mewl. / else: Roo reaches down, wraps her fingers around your [pc.cock], and lines it up with herself. Then she sinks, slowly, until she’s sitting in your lap with every inch of you buried in her, her mouth hanging open in a silent <i>“oh.”</i>} / else: {taur: Roo reaches back between your hind legs and finds your [pc.vagina] by touch, curling two fingers into you while she grinds her own sex back against your sheath of warm flank. / else: Roo slides a hand down between you and cups your [pc.vagina], fingers curling into you while she grinds her own soaked sex against your thigh.}}",
            "Then she dances again. Slower this time, rolling her hips the same way she did for the music, only now every roll {hasCock: drags her up and down your length / else: grinds her clit against you and pushes her fingers deeper}. {rooPuffy: Her pumped, puffy pussy lips cling and drag with every stroke. / else: } {taur: The bed creaks under your combined weight with every thrust you give back. / naga: Your coils tighten and loosen in time with her, rocking her on you. / else: Your hands find that big, soft bottom and squeeze, helping her bounce.} " + MILKY,
            "<i>“{slave: [pc.Master], [pc.Master], please, may I...?”</i> / free: Don’t stop, don’t stop, don’t you <b>dare</b> stop!”</i>} Roo’s tails go rigid. She clamps down {hasCock: around you / else: on your fingers} and cums with a wail that would’ve gotten her kicked off the casino floor, shaking from her ears to her toes.",
            "{hasCock: That squeezing, rippling heat drags you right over the edge after her. You bury yourself as deep as she’ll take you and flood her with [pc.cum]{highCum: until it spills back out around you and runs down her thighs}. / else: Her fingers never stop, and with her wailing in your ear you aren’t far behind. You shudder through your own climax, your [pc.girlCum] slicking her hand.}",
            "Afterwards she stays {taur: sprawled across her bed under you / naga: wrapped in your coils / else: in your lap}, purring so hard you can feel it in your chest. <i>“{slave: Best dance I ever did,”</i> she mumbles. <i>“Thank you, [pc.Master].”</i> / free: Best dance I ever did,”</i> she mumbles. <i>“Encore later?”</i>}"
        ]);
        done({ roo: 1, cumIn: true });
    }

    /* ---------- Orders: Oral (also the Quickie and the Relief kneel) ---------- */
    function oral(fromRelief) {
        sexScene();
        say([
            fromRelief ? "Roo is already on her knees when you come in, mouth open, hands resting on her thighs, exactly the way you told her to wait. Her tails are trembling with how badly she wants this."
                : (slave() ? "<i>“On your knees,”</i> you tell her. Roo drops so fast her ears flop over her eyes. She pushes them back, tongue already peeking out between her fangs. <i>“Yes, [pc.Master].”</i>"
                    : "<i>“Want me to take care of you?”</i> Roo asks before you can, already sinking down in front of you with a wink. <i>“Don’t answer. I’m doing it anyway.”</i>"),
            "{taur: She has to duck almost all the way down to the deck and crawl in under your barrel, giggling about how it’s like a little blanket fort, until she’s kneeling between your forelegs and hind legs with your sex right in front of her face. / naga: You raise yourself up on your coils, and she kneels right in front of where your tail meets your hips, eye level with everything she wants. / else: {pcNotExposed: She makes quick work of your gear, tugging it down and out of the way, and then she’s kneeling between your [pc.legs]. / else: There’s nothing in her way, and she shuffles in between your [pc.legs] with a hungry look.}}",
            "{hasCock: She wraps both hands around your [pc.cock] and gives the [pc.cockHead] a long, slow lick, that rough little kaithrit tongue rasping across it. Then she takes you in, inch by inch, cherry eyes locked on yours the whole time{cockSize>12: until her throat bulges and her eyes water and she <i>keeps going</i>}. / else: She leans in and drags that rough kaithrit tongue all the way up your [pc.vagina] in one slow, rasping lick that makes your whole body jolt. Then she does it again, and again, before closing her lips around your [pc.clit] and sucking.}",
            "Roo is <i>good</i> at this, and she knows it. She hums. She swirls. She pulls back just to grin at you and dives back in deeper. {slave: Every so often she glances up for approval, and every time you give it her tails flick happily. / free: Every so often she glances up with a look that says <i>I know</i>, and pushes you a little harder.} {canMasturbate: One of her hands has disappeared between her own legs, and her muffled moans are starting to buzz against you. / else: Her thighs are pressed tight together and grinding, the only relief she’s allowed.}",
            "{hasCock: When you cum, she takes it all. Roo swallows down every shot of [pc.cum] with her eyes squeezed shut and her throat working{highCum:, cheeks bulging, a little spilling down her chin and onto her breasts}, and then she licks you clean. / else: When you cum, she holds you right there with her hands on your [pc.hips], lapping up every drop of [pc.girlCum] with her eyes squeezed shut, purring against you.}",
            "{canMasturbate: She follows you a moment later, gasping against your {taur: underbelly / naga: scales / else: thigh}, fingers still buried in herself. / else: She hasn’t cum. She looks up at you with a slightly glazed, needy expression and waits to be told whether she can.} <i>“{slave: Thank you, [pc.Master],”</i> she breathes. / free: Mmm. Tasty,”</i> she says, licking her lips.}"
        ]);
        done({ roo: canMasturbate() ? 1 : 0 });
        if (!canMasturbate()) addLust(15);
    }
    function quickie() {
        sexScene();
        say([
            "<i>“Got a minute?”</i> you ask. Roo looks you up and down and grins. <i>“For you? I’ve got a <b>quick</b> minute.”</i>",
            "{taur: She ducks right under you with practised ease and starts fumbling for you before you’ve finished stopping. / naga: She just drops to her knees in front of your coils and gets to work. / else: She doesn’t even bother with the bed. Roo just drops to her knees right where she is and yanks your gear out of the way.}",
            "{hasCock: There’s no teasing this time. She takes your [pc.cock] into her mouth and goes, all bobbing ears and wet, eager sounds, one hand pumping what her lips don’t reach. You don’t last long, and she doesn’t want you to. She swallows every drop of [pc.cum] and pops off with a satisfied gasp. / else: There’s no teasing this time. She buries her face in your [pc.vagina] and goes to work, that rough tongue lashing your [pc.clit] until your knees go weak. You don’t last long, and she doesn’t want you to.}",
            "Roo hops back up and wipes her mouth with the back of her hand. <i>“{slave: All done, [pc.Master]! / free: There. Now you’re in a better mood.}”</i> She bounces off with her tails swishing, very pleased with herself."
        ]);
        addLust(10);
        done({ roo: 0, min: 10, max: 15 });
    }

    /* ---------- Orders: Doggy ---------- */
    function doggy(fromRelief) {
        sexScene();
        say([
            fromRelief === true ? "Roo doesn’t wait to be told. She clings to you, pleading and nuzzling and squirming, hands wandering everywhere, until you finally turn her around and she drops to all fours right there with a grateful little sob."
                : (slave() ? "<i>“All fours,”</i> you tell her. Roo drops to her hands and knees on the bed and arches her back, tails lifting high and out of the way. <i>“Like this, [pc.Master]?”</i>"
                    : "You ask her to get on all fours, and Roo laughs. <i>“Oh, <b>finally</b>.”</i> She crawls onto her bed, presents that big freckled bottom, and gives it a little wiggle over her shoulder."),
            STRIP + " " + VIBE,
            "{taur: You rear up and step forward, bringing your forelegs down onto the bed on either side of her, the frame groaning in protest. Your barrel blots out the light over her back. She can’t see a thing, and from the way she shivers, she loves it. / naga: You slither up behind her and wind your tail around her legs and waist, pulling her back against you, holding her open and in place. / else: You climb up behind her and take hold of her hips, sinking your fingers into soft, giving flesh.}",
            "{rooPuffy: Her pumped pussy is swollen and slick, its plump lips parting around your [pc.cockHead] like they’ve been waiting for it. / else: She’s already soaking wet, her pink lips parting around your [pc.cockHead] without any resistance.} You push in, and Roo lets out a long, rising yowl that would make an alley cat proud.",
            "Then you fuck her. Her ass ripples with every thrust, that soft, heavy weight {taur: slapping back against your underbelly / naga: bouncing against your scales / else: clapping against your hips}. {multiCock: Your other length slides wet and hot along the cleft of her cheeks with every stroke. / else: } Roo’s tails thrash. Her face drops into the sheets. " + MILKY,
            "<i>“{slave: [pc.Master]! [pc.Master], I’m going to - may I - please!”</i> / free: Harder! Oh, stars, just like that, harder!”</i>} You give her permission, or you give her harder, and either way she shatters. Her whole body seizes, clenching around you in long rippling waves.",
            "You follow her over, slamming home one last time and pumping her full of [pc.cum]. {highCum: It doesn’t stop. You keep cumming until she’s overflowing, a hot river of it running down her thighs and puddling on the sheets. / else: She mewls at the warmth of it.}",
            "Roo collapses face-down into her bed, ass still in the air, purring loud enough to rattle the frame. <i>“{slave: Thank you, [pc.Master]...”</i> / free: That was... yeah. Yes. Good.”</i>}"
        ]);
        done({ roo: 2, cumIn: true });
    }
    function bedDoggy() {
        sexScene();
        say([
            slave() ? "You turn Roo around and push her down over the edge of her own bed. She goes willingly, chest flattening against the mattress, feet still on the deck. <i>“Ohhh, [pc.Master]...”</i>"
                : "You turn Roo around and press her down over the edge of her bed. <i>“Mmm, bossy,”</i> she purrs into the mattress, wiggling her rear. <i>“I like bossy.”</i>",
            STRIP + " " + VIBE,
            "{taur: The bed is exactly the right height. You step over her, forelegs braced on the mattress, and lower your barrel until your [pc.cocks] {multiCock: hang / else: hangs} right where you want {multiCock: them / else: it}. / naga: Your coils pile up behind her, raising you to just the right height, and a loop of your tail settles across the backs of her knees to keep her where she is. / else: You step in behind her and press your hips against that big, soft rump.}",
            "Pinned like this, she’s nothing but soft. You sink into her pussy first, and she sighs with her whole body. {multiCock: Then you show her what the rest of you is for. Your second cock slides into the deep valley of her cheeks, and she squeezes them together around it with both hands, giving you a buttjob in time with every stroke. {cockCount>2: Another finds the tight, slick gap between her thighs, and she clamps down on that one too. / else: } / else: When you pull out and slide your [pc.cock] between her thick, sweaty thighs instead, she clamps them together around you, and you fuck the soft gap there for a while just to hear her whine for it back inside.}",
            "<i>“There’s so much of you,”</i> she whimpers, toes curling against the deck. <i>“{slave: Use all of me, [pc.Master], please! / free: You’re gonna wreck my sheets, and I don’t care!}”</i> Her tails twist together over her back in a knot of pure need.",
            "She cums first, with her face in the mattress and her fists in the sheets. You’re right behind her, {multiCock: unloading everywhere at once, filling her pussy, painting the cleft of her ass and glazing her thighs with [pc.cum] / else: burying yourself inside her and filling her up with [pc.cum]}.",
            "Roo doesn’t move for a long while afterwards. She doesn’t want to. <i>“Just leave me here,”</i> she mumbles happily. <i>“This is where I live now.”</i>"
        ]);
        done({ roo: 2, cumIn: true });
    }
    k("cockCount>2", function () { return cockCount() > 2; });

    /* ---------- Orders: Lap Pillow ---------- */
    function lapPillow() {
        sexScene(); showRoo();
        say([
            slave() ? "<i>“Sit,”</i> you tell her, and point at the bed. Roo sits. Then you lie down and put your head in her lap, and she goes completely still, as though you might break if she moves."
                : "You ask if you can borrow her lap for a while. Roo blinks, then pats her thighs with a huge, delighted grin. <i>“Get over here.”</i>",
            "{taur: It takes some arranging. You fold your legs on the deck beside her bed and lay your upper body along the mattress, and Roo scoots over until your head is cradled in her thighs. / naga: You coil up on the deck beside her bed and lay your head and shoulders across her lap. / else: You stretch out on her bed and lay your head across her thighs.} They’re soft. They’re <i>very</i> soft, and warm, and they smell faintly of her.",
            "Roo’s fingers find your [pc.hair] and start combing through it, slow and careful. {milky: Her heavy, milk-laden breasts hang just above your face, swaying with each breath, a single white drop now and then landing on your cheek. She laughs and wipes them away with her thumb. / else: Her breasts block most of your view of the ceiling, which you decide is an improvement.} Her tails curl around your shoulders like a scarf.",
            "She hums something. It might be the song from the casino floor, slowed down to a lullaby. {slave: <i>“Is this all right, [pc.Master]?”</i> she whispers once. You tell her it’s perfect, and she glows. / free: <i>“You work too hard, you know,”</i> she says softly. <i>“Captain. Rusher. Whatever you are today. You can just be here for a bit.”</i>}",
            "You don’t mean to doze off. You do anyway. When you wake up, maybe half an hour later, she hasn’t moved an inch, and her fingers are still in your hair."
        ]);
        try { pc.energy(10); } catch (e) {}
        pcLust(5);
        timePass(30, 45);
        var back = RET || function () { mainGameMenu(); }; RET = null; next(back);
    }

    /* ---------- Orders: Nursing HJ (also from Milkies) ---------- */
    function nursing() {
        sexScene();
        say([
            "Roo pats her lap and lifts {milky: one swollen, leaking breast / else: one heavy breast} in her palm, a soft, almost shy smile on her face. <i>“{slave: Come here, [pc.Master]. Let me take care of you. / free: Come here, you. Let me take care of you for once.}”</i>",
            "{taur: You fold your legs and lie down along her bed, and Roo stretches out on her side against your barrel, cradling your head to her chest while her other arm reaches all the way back along your underbelly. / naga: You curl up in her bed with your coils spilling off the side, and Roo gathers your head and shoulders into her lap, her free hand sliding down to where your tail meets your hips. / else: You lie across her bed with your head in her lap, and Roo leans over you, guiding her nipple to your lips while her free hand slides down your [pc.belly].}",
            "{milky: The moment you latch on, warm, sweet milk floods your mouth. It’s rich and faintly spiced, and she gasps at the first pull, then sighs and holds you closer. / else: There’s no milk, but she doesn’t seem to care, and neither do you. Her nipple stiffens against your tongue and she sighs, holding you closer.} {hasCock: Her fingers wrap around your [pc.cock] and begin to stroke, slow and steady, in rhythm with your suckling. / hasPussy: Her fingers find your [pc.vagina] and slide inside, curling slow and steady in rhythm with your suckling. / else: Her fingers trail lazy circles over your [pc.belly] and hips, slow and steady, in rhythm with your suckling.}",
            "<i>“There you go,”</i> she murmurs, stroking your [pc.hair] with her other hand. <i>“Good. {slave: Good [pc.Master]. / free: That’s it.}”</i> Her tails curl over you. Her purring is a low rumble against your cheek. {milky: Every time you swallow, her hand speeds up a little, as if she’s keeping count. / else: }",
            "{hasGenitals: It builds so slowly you barely notice until it’s already happening. You moan around her nipple and cum in her hand, {hasCock: [pc.cum] spilling over her fingers / else: clenching around her fingers}, and she just keeps stroking you through it, gentle, until you go limp in her lap. / else: You drift on it, warm and full and boneless, until you’re closer to sleep than awake.}",
            "{milky: When you finally let go, her breast is noticeably lighter. Roo kisses your forehead. <i>“Better than the dispensers in the galley, huh?”</i> / else: When you finally let go, Roo kisses your forehead. <i>“Anytime,”</i> she whispers.}"
        ]);
        addLust(15);
        done({ roo: 0, milk: 35 });
    }

    /* ---------- Eat Her Out ---------- */
    function eatOut(fromRelief) {
        sexScene();
        say([
            fromRelief === true ? "Roo is lying back on her bed with her legs spread wide, holding herself open with two fingers, exactly as she was told to wait. <i>“{slave: Please, [pc.Master]...”</i> / free: Please, [pc.name]...”</i>} Her voice cracks on it."
                : (slave() ? "You push Roo back onto her bed and spread her thighs. She looks at you like you’ve lost your mind. <i>“[pc.Master], you don’t have to - oh. <b>Oh.</b>”</i>" : "You tell Roo to lie back. She does, with a curious tilt of her head... and then you kneel, and her ears shoot straight up. <i>“Oh, I’m <b>so</b> glad I asked you to come by.”</i>"),
            STRIP + " " + VIBE,
            "{taur: You lower your forequarters all the way down, forelegs folding, until your head is level with the edge of the bed. Roo scoots to the very edge and hooks her legs over your shoulders. / naga: You lower yourself until you’re level with her, coils piled behind you, and she hooks her legs over your shoulders. / else: You kneel at the edge of the bed and she hooks her legs over your shoulders.}",
            "Her pussy is pink and {rooVeryPuffy: fat and puffy from all that pumping, its plump outer lips swollen and sensitive / rooPuffy: plump from the pump, a little puffier than it used to be / else: neat and pretty}, and {rooSoaked: already dripping / else: glistening}. She smells like heat and sugar. The first slow lick makes her thighs clamp down on your head and her back arch right off the bed.",
            "You take your time. {longTongue: Your long tongue slides deep inside her, curling, exploring, and she makes a sound like she’s been stabbed with pleasure. / else: You lap at her lips, suck on her clit, and slide your tongue in as deep as you can reach.} Roo’s hands go everywhere: your [pc.hair], her own breasts, the sheets, back to your head. " + MILKY + " Her tails thrash so hard one of them knocks a pillow onto the deck.",
            "<i>“{slave: I’m not supposed to - you’re my - [pc.Master], I can’t, I’m...!”</i> / free: Right there, right there, don’t move, don’t you <b>dare</b> move...!”</i>} She cums against your mouth, hips bucking, squirting a little across your chin, and you don’t stop. You keep going, softer, until she cums again, and then a third time, weaker, crying out your name.",
            "When you finally come up for air, Roo is a boneless, gasping heap, staring at the ceiling. <i>“{slave: Nobody has ever... a slave doesn’t... thank you. Thank you, [pc.Master].”</i> / free: You’re gonna spoil me,”</i> she pants. <i>“Don’t stop spoiling me.”</i>}"
        ]);
        done({ pcCum: false, roo: 3, min: 30, max: 40 });
    }

    /* ---------- Lap Ride ---------- */
    function lapRide() {
        sexScene();
        say([
            slave() ? "You {taur: settle down on the deck / naga: coil up / else: sit on the edge of her bed} and tell her to climb on. <i>“Yes, [pc.Master]!”</i> Roo doesn’t need telling twice." : "You {taur: settle down on the deck / naga: coil up / else: sit on the edge of her bed} and pat yourself. <i>“Oh, is that an invitation?”</i> Roo is already climbing on.",
            STRIP + " " + VIBE,
            "{taur: You don’t exactly have a lap, but Roo has a plan for that. You lie on your side across her bed and she straddles your hind legs, reaching between them with a giggle and pulling herself up onto you. / naga: Your coils make a perfect seat, and she straddles them, sinking down where your tail meets your hips. / else: She straddles your lap, knees sinking into the mattress on either side of your [pc.hips], and grinds down against you.}",
            "{hasCock: She takes your [pc.cock] in her hand and guides it to her pussy, then sinks all the way down in one long, slow slide{cockSize>12: , eyes going wide as it keeps going, and going, until it’s bulging her belly}. / else: She grinds her pussy right against yours, slick lips kissing slick lips, her clit catching against your [pc.clit] with each roll of her hips.}",
            "Then she rides. Roo’s a natural; she rides like she dances, hips rolling in smooth, heavy circles, breasts bouncing right in your face. {milky: Every bounce sends a little spray of milk across your chest, and she laughs breathlessly about it. / else: You catch a nipple in your mouth and she gasps and rides harder.} {taur: Every drop of her weight sends a shiver all the way to your hindquarters. / naga: Your coils tighten around her waist, helping her bounce. / else: You grab her hips and help her slam down.}",
            "<i>“{slave: [pc.Master], may I - may I cum on you?”</i> / free: I’m gonna cum all over you, I’m gonna -”</i>} She doesn’t finish. She just does, clamping down {hasCock: hard around your cock / else: against you}, grinding through it with her head thrown back and her tails straight up like antennae.",
            "{hasCock: You follow her, pulling her down hard and emptying yourself inside her, [pc.cum] filling her up until she whimpers. / else: The grinding drags you over the edge right behind her, and you shudder against her as your [pc.girlCum] mixes with hers.} Roo slumps forward against your chest, panting and purring. <i>“That,”</i> she says, <i>“was a <b>ride</b>.”</i>"
        ]);
        done({ roo: 1, cumIn: true });
    }

    /* ---------- Missionary (hymen pill; William's idea) ---------- */
    var HYMEN_PRICE = 500;
    function missionary(fromRelief) {
        var st = flags.TN_ROO_HYMEN;
        if (st === undefined && fromRelief !== true) { hymenAsk(); return; }
        if (st === 1 && now() >= (flags.TN_ROO_HYMEN_TS || 0)) { missionaryScene(true); return; }
        missionaryScene(false, fromRelief === true);
    }
    function hymenAsk() {
        ourScene();
        say([
            "You start to lay her down, and Roo stops you with a hand on your chest. She’s blushing all the way to the tips of her [roo.ears].",
            "<i>“Can I ask you something weird? Before we do it like this?”</i> She fidgets with the sheets. <i>“My first time wasn’t... it wasn’t a person. You know that. It was toys, and it hurt, and nobody cared if I liked it.”</i> She swallows. <i>“There’s a pill. Tamani makes it, it’s on the extranet. It grows your hymen back. Just a cosmetic thing, but...”</i>",
            "<i>“I want to have a first time that’s actually <b>mine</b>. With you. Lying down, looking at you, like in the dramas.”</i> She laughs nervously. <i>“It’s " + HYMEN_PRICE + " credits. {slave: I know I don’t have the right to ask, [pc.Master], but... / free: I’d pay you back, I swear, I just... }”</i>"
        ]);
        clearMenu();
        btn(0, "Buy It", function () {
            ourScene();
            pc.credits -= HYMEN_PRICE;
            flags.TN_ROO_HYMEN = 1;
            flags.TN_ROO_HYMEN_TS = now() + 12 * 60;
            say(["You tell her to order it. Roo throws herself at you so hard you nearly topple over, and then she’s at her terminal, typing fast, ears up.",
                "<i>“It takes a few hours to work,”</i> she says, reading. <i>“So... come back later? Like, tonight? I’ll be ready.”</i> She looks over her shoulder at you with a smile you haven’t seen on her before, shy and bright at once. <i>“Thank you.”</i>",
                "<b>(Roo ordered the pill. Come back for Missionary in about 12 hours.)</b>"]);
            var back = RET || function () { mainGameMenu(); }; RET = null; next(back);
        }, credits() >= HYMEN_PRICE, "Pay " + HYMEN_PRICE + " credits for her pill.", "You don’t have " + HYMEN_PRICE + " credits.");
        addButton(1, "Just Sex", function () { flags.TN_ROO_HYMEN = 0; missionaryScene(false); }, "Just Sex", "You’d rather just get on with it. She’ll understand. (She won’t ask again.)");
        addButton(2, "Later", function () { ourScene(); say(["You tell her you’ll think about it. Roo nods quickly. <i>“Yeah! Sure. No pressure!”</i> There’s a little pressure."]); var back = RET || function () { mainGameMenu(); }; RET = null; next(back); }, "Later", "Think about it.");
    }
    function missionaryScene(firstTime, fromRelief) {
        sexScene(); CTX.rVirgin = firstTime;
        if (firstTime) flags.TN_ROO_HYMEN = 2;
        say([
            firstTime ? "Roo has made an effort. The lights in her room are low and warm, there are fresh sheets on the bed, and she’s sitting on the edge of it in a soft white shift you’ve never seen before, knees together, hands in her lap. <i>“Hi,”</i> she says, very quietly. <i>“It worked. I’m... I’m ready.”</i>"
                : (fromRelief ? "Roo is already lying back on her bed, legs spread, holding herself open with both hands. <i>“{slave: Please, [pc.Master]. Please, I need you.”</i> / free: Please, [pc.name]. Please.”</i>}" : (slave() ? "You lay Roo down on her back. She goes soft and pliant under your hands, legs parting, gazing up at you. <i>“[pc.Master]...”</i>" : "You lay Roo down on her back and she pulls you down with her, legs already wrapping around you, laughing into your mouth.")),
            firstTime ? "You undress her slowly. She lets you. When she’s bare, she doesn’t pose or tease the way she usually does. She just looks at you, breathing fast." : STRIP + " " + VIBE,
            "{taur: Roo lies back right at the edge of the bed, and you step over her with exquisite care, forelegs planted on either side of the mattress, lowering your barrel until your [pc.cock] rests against her. She has to look up past your chest to find your face, and she reaches up to touch it. / naga: You slide over her, coils spilling across the bed, your upper body rising over hers until you’re face to face, your tail curling gently around her legs. / else: You settle between her thighs, propped up on your elbows, face to face with her.}",
            firstTime ? "You go slowly. You feel the moment you break through, a tiny bit of resistance and then none, and Roo gasps and grabs your shoulders hard, eyes shining wet. You stop. She shakes her head, laughing and crying at once. <i>“No, no, it’s - it’s good. It’s <b>good</b>. It’s mine. Keep going. Please.”</i>"
                : "You slide into her, slow and deep, and Roo sighs like she’s been holding her breath for days. {rooPuffy: Her pumped lips hug the base of you. / else: }",
            "You move together. It isn’t fast, and it isn’t a show; it’s just the two of you, foreheads {taur: as close as your bodies allow / else: touching}, her legs {taur: wrapped around your forelegs / naga: wrapped around your coils / else: wrapped around your waist}. " + MILKY + " She whispers your name. Not a title. Just your name, over and over, like she’s learning it.",
            "She cums with her eyes open, looking right at you, her whole body shuddering under you. You bury yourself in her and follow, filling her with [pc.cum] while she clings to you.",
            firstTime ? "Afterwards she lies curled against you, tracing patterns on your [pc.skinFurScales]. <i>“That’s the one that counts,”</i> she says softly. <i>“Okay? Not the other one. This one.”</i> You agree. She falls asleep smiling."
                : "Afterwards she stays tangled up in you, purring, and doesn’t let go for a long time."
        ]);
        if (firstTime) flags.TN_ROO_FIRST_TIME = 1;
        done({ roo: firstTime ? 1 : 2, cumIn: true, min: 40, max: 60 });
    }

    /* ---------- Use Puss.Pump ---------- */
    function pumpScene() {
        sexScene();
        var first = !flags.TN_ROO_PUMP_USED;
        CTX.first = first;
        say([
            first ? "You hold up the SukMastr 2000. Roo makes a sound that is technically a word but no language you know, and has her clothes off before you can say anything." : "You pick up the SukMastr 2000 from her nightstand. Roo’s ears flatten back and her face goes red. <i>“Again? Yes. Yes please.”</i>",
            STRIP + " " + VIBE,
            "She lies back on her bed and spreads her legs wide, holding them open behind the knees, {taur: and you lower your forequarters until you’re looking right at her, / naga: and you rise up on your coils beside the bed, / else: and you kneel between them,} fitting the pink cup over her pussy. It seals with a soft, wet kiss.",
            "You squeeze the bulb. Once. Twice. Roo’s breath catches. The cup draws tight, and through the clear plastic you watch her lips swell, fill, and flush darker pink, her clit poking up fat and needy. {rooPuffy: She’s bigger than last time already, and it doesn’t take much to get her straining against the cup. / else: } <i>“Oh, stars, it’s pulling, it’s pulling <b>everywhere</b>...”</i>",
            "You keep pumping. Slow. Every squeeze makes her twitch. Roo’s tails lash, her toes curl, and she starts to beg {slave: in a breathless string of <i>“[pc.Master], [pc.Master], please”</i> / else: in a breathless string of curses and your name}. You tap the cup. She screams. You twist it a little. She cums, hard, right there in the cup, her swollen pussy pulsing and dripping inside it.",
            "When you finally break the seal, the cup comes away with a slurp, and what’s underneath is fat and puffy and glistening, so sensitive that a single breath across it makes her jerk. {hasCock: You don’t make her wait. You slide your [pc.cock] into that swollen, oversensitive heat and she clamps down and cums again on the first stroke, wailing. You last just long enough to fill her with [pc.cum]. / hasPussy: You don’t make her wait. You {taur: lower yourself until your [pc.vagina] grinds against / naga: press your own sex against / else: straddle her and grind your [pc.vagina] against} that swollen, oversensitive heat, and she cums again on the first stroke, wailing, dragging you over with her. / else: You lean in and give it one long lick. She cums again just from that, wailing.}",
            "Roo lies there for a long while afterward, legs still spread, gingerly touching her puffy lips and giggling. <i>“{first: It’s <b>bigger</b>! Look at it! / else: Even bigger. I love it. I love it so much.}”</i>"
        ]);
        inc("TN_ROO_PUMP_USED");
        done({ pcCum: hasGenitals(), roo: 2, cumIn: true });
    }

    /* ---------- Shower Sex ---------- */
    function showerSex() {
        sexScene();
        flags.TN_ROO_SHOWER_OK = 1;
        say([
            pcMessy() ? "Roo wrinkles her nose at you, then grins. <i>“You’re filthy. Come on, I’m washing you. No arguments.”</i>" : "<i>“Shower?”</i> Roo asks with a waggle of her eyebrows, already tugging you by the hand. <i>“Wash me and I’ll wash you.”</i>",
            "{taur: Fitting your body into the ship’s shower takes a little negotiating and a lot of laughing, and in the end the door won’t close behind your hindquarters. Roo declares it a design flaw and gets in anyway, squeezing in against your chest. / naga: You coil up in the shower stall until there’s barely room for her, and she squeezes in against you anyway, standing inside the loops of your tail. / else: The ship’s shower is not built for two, and it is <i>definitely</i> not built for two with a chest like hers, but you manage.} " + STRIP,
            "The water comes on hot. Roo lathers up her hands and then, with a wicked look, lathers up her breasts instead, and washes you with them: rubbing them across your chest, your back, {taur: along your flanks and barrel, / naga: down the length of your coils, / else: down your arms and stomach,} soaping every inch of you with those big, slippery tits. " + MILKY + " She’s very thorough. She’s <i>extremely</i> thorough.",
            "{hasCock: By the time she’s soaping your [pc.cock] between them, you can’t take it anymore. You turn her around and press her against the wet wall, and {taur: rear up behind her, forelegs braced against the tiles above her head, / naga: lift her up in your coils, / else: lift one of her thick thighs,} and slide into her slick heat. You take her slow and sweet under the spray, kissing her neck, her ears, her shoulders, while she moans and reaches back to hold onto you. / else: By the time she’s soaping between your legs, you can’t take it anymore. You pull her close and slide your hand between her thighs while hers keeps working on you, and you get each other off right there under the hot water, foreheads together, slippery and gasping.}",
            "{hasCock: She cums with her cheek pressed to the tiles, purring so loud you can hear it over the water, and you follow her, filling her with [pc.cum] that runs straight back out and down the drain. / else: She cums first, shivering against you, and you follow a moment later with her name on your lips.}",
            "You actually do get clean in the end. Roo dries you off with a towel, very carefully, as if you’re a precious object, and then shakes herself like an actual cat and gets water everywhere."
        ]);
        washPC();
        done({ roo: 1, cumIn: true, min: 30, max: 40 });
    }

    /* ---------- Milky Titfuck ---------- */
    function milkyTitfuck() {
        sexScene();
        say([
            "Roo’s tits are huge with milk, round and taut and leaking from both nipples. She lies back on her bed and presses them together with both hands, a little white stream squirting out from the pressure alone. <i>“{slave: They’re so full, [pc.Master]. Please use them. / free: Come on. They’re <b>aching</b>. Fuck them.}”</i>",
            "{taur: You can’t straddle her with your body, so she kneels on the floor and you step over her instead, your barrel above her like a roof, and she leans forward to wrap your [pc.cock] in her breasts from below. / naga: You rise up over her on your coils and she pulls you forward until your [pc.cock] is nestled in her cleavage. / else: You straddle her chest, and she squeezes her tits together around your [pc.cock] with a delighted gasp.}",
            "Her cleavage is already slick with milk. You thrust, and her breasts squirt, milk spraying from both nipples in thin white arcs that splash across her face and your {taur: underbelly / naga: scales / else: thighs}. Roo laughs, then moans, then laughs again. <i>“Harder! Squeeze them harder!”</i>",
            "You fuck her tits until the bed is soaked and she’s glistening with her own milk. Every thrust gives you another spray. Then she goes stiff. Her eyes roll back. With a shriek, she <b>titgasms</b>, both nipples gushing milk all at once, her whole body shuddering.",
            "That does it for you. You cum between her breasts, [pc.cum] mixing with milk across her chest and throat, pooling in her collarbone{bigCum:, spilling down onto the sheets until there’s more of it than milk}.",
            "Roo lies in the sticky mess, panting, licking milk off her lips. <i>“I am <b>so</b> much lighter,”</i> she says. <i>“Thank you.”</i> Then she looks at the bed. <i>“...I am going to need new sheets.”</i>"
        ]);
        try { pc.applyMilkBathed(); } catch (e) {}
        done({ roo: 1, milk: 60 });
    }

    /* ---------- Boob Play ---------- */
    function boobPlay() {
        sexScene(); showRoo();
        say([
            "You eye her chest. Roo notices. <i>“What, these?”</i> she asks, sticking it out. <i>“{slave: They’re yours, [pc.Master]. / free: Go on, you know you want to.}”</i>",
            chestExposed() ? "There’s nothing in your way." : "You help her out of her top. Her breasts spill free and bounce, and you have to take a moment.",
            "{taur: You fold your legs on the deck and she sits on the edge of the bed in front of you, and you have both hands free. / naga: You coil up before her and she leans back on her hands. / else: You pull her into your lap, her back against your chest, and reach around.} You start gently, weighing each breast in your palms, feeling them shift and spill between your fingers. They’re warm and very, very soft.",
            "{milky: Squeeze and she squirts. You find out quickly that she likes that; a lot. Every little spurt of milk makes her gasp, and soon you’re milking her in earnest, white streams arcing out onto the deck while she bucks and moans. / else: You roll her nipples between your fingers, pinch, tug, and she squirms and whines, tails lashing.} You lean in and suck on one nipple, then the other.",
            "She cums from it alone, which surprises you both. Roo’s back arches, her thighs clench together, and a low, shaky moan pours out of her. <i>“{slave: [pc.Master]... my boobs... / free: Oh, wow. Didn’t know I could do that.}”</i>",
            "You keep playing with them a while longer, more gently now, and she melts back into you, purring."
        ]);
        pcLust(15 + rnd(10));
        rooCums(1);
        if (milky()) drainMilk(40);
        inc("TN_ROO_SEXED");
        timePass(15, 25);
        var back = RET || function () { mainGameMenu(); }; RET = null; next(back);
    }
    function drinkMilk() {
        sexScene(); showRoo();
        say([
            "<i>“Thirsty?”</i> Roo asks, cupping one swollen breast and offering it to you with a grin. A bead of milk swells at the nipple and drips.",
            "{taur: You lower your forequarters / naga: You lower yourself on your coils / else: You lean in} and latch on. Warm, sweet milk floods your tongue, rich and creamy with a faint spice to it, and Roo lets out a long, relieved sigh. <i>“Oh, that’s <b>so</b> much better...”</i>",
            "You drink. And drink. Roo strokes your [pc.hair] and purrs while you empty one breast, then guides you to the other. By the time you’re done, your belly is full and warm and she’s much lighter, sagging back on her bed with a dreamy look on her face.",
            "<i>“I could get used to this,”</i> she says. So could you."
        ]);
        pcLust(10); addLust(15);
        try { pc.energy(15); } catch (e) {}
        drainMilk(60);
        timePass(15, 20);
        var back = RET || function () { mainGameMenu(); }; RET = null; next(back);
    }

    /* ---------- Roo Rider (free, high lust) ---------- */
    function rooRider(fromRelief) {
        sexScene();
        inc("TN_ROO_RIDDEN");
        say([
            fromRelief === true ? "Roo doesn’t ask. She grabs you by the wrist and drags you into her room, <i>“You told me to come get you, so I’m getting you,”</i> she says, and shoves you onto the bed."
                : "Before you can say anything, Roo has you by the hand. <i>“My turn,”</i> she says, eyes blazing, and drags you into her room. <i>“You’ve been <b>so</b> good to me. I am going to sit on your face. That’s your reward. Lie down.”</i>",
            "{taur: You fold your legs and roll onto your side on her bed, which barely holds you, and she climbs up your barrel like a jungle gym. / naga: You stretch your coils out across her bed and lie back. / else: You lie back on her bed.} " + STRIP + " " + VIBE,
            "Roo straddles your face, thighs on either side of your head, and looks down at you between her heavy breasts with a fanged grin. <i>“Comfy?”</i> Then she sits. Her soaking pussy settles right over your mouth, and her thick thighs close over your ears, and the world is nothing but warm, wet, sweet kitty.",
            "She rides your face like she owns it. Roo grinds down in hard, rolling circles, grabbing your [pc.hair] to steer you, her tails thrashing behind her. {rooPuffy: Her fat, pumped lips smother you. / else: } {hasGenitals: Somewhere along the way she reaches back {taur: along your barrel / naga: down your coils / else: down your body} and finds {hasCock: your [pc.cock], stroking it hard and fast in time with her grinding / else: your [pc.vagina], plunging two fingers into you in time with her grinding}. / else: }",
            "<i>“That’s it, that’s it, that’s - oh, stars, your <b>tongue</b> -”</i> She cums with a yowl, grinding down so hard you can’t breathe, and then she keeps going, chasing another one, and another, until her thighs are shaking too hard to hold her up. {hasGenitals: Her hand never stops, and you cum with your face buried in her. / else: }",
            "Finally Roo topples over sideways onto the bed and lies there, sticky and grinning, pulling you up into a kiss that tastes like her. <i>“Good,”</i> she pants. <i>“Good [pc.boyGirl]. That’s what you get for being nice to me.”</i>"
        ]);
        done({ roo: 3, min: 30, max: 40 });
    }

    /* ---------- From the Kiss menu: 69s ---------- */
    function sixtyNine(pcOnTop) {
        sexScene();
        say([
            pcOnTop ? "You push her back onto the bed, still kissing her, and kiss your way down. Past her breasts. Past her belly. Roo figures out where you’re going and squirms around underneath you with a laugh. <i>“Not without me, you don’t!”</i>"
                : "Roo shoves you down onto her bed, climbs over you facing the other way, and lowers her soaked pussy toward your face. <i>“My turn to be greedy,”</i> she purrs over her shoulder.",
            STRIP + " " + VIBE,
            "{taur: There’s no way to sixty-nine with a body like yours, so Roo improvises: you lie on your side, she straddles your face first, and then she leans down along your barrel and reaches back for you, her arms and mouth finding your sex while you lick her. / naga: Your coils make it easy. Your tail lifts your sex right up to her mouth while she lies over you, her own sex over your face. / else: You arrange yourselves head to toe, her thick thighs framing your head, her face between your legs.}",
            "{hasCock: She swallows your [pc.cock] down while you bury your tongue in her. / hasPussy: She dives into your [pc.vagina] with her rough tongue while you bury yours in her. / else: She kisses and licks every inch of your groin while you bury your tongue in her.} It’s a contest now. Every time you make her moan, she moans around you; every time she makes you moan, she grins and does it again.",
            "You win. Or she does. It’s hard to say who cums first, but you both do, hard, shaking against each other, {hasCock: her throat working around your [pc.cock] as you spill into it / hasPussy: her face soaked with your [pc.girlCum] / else: tangled up in each other}, her juices running down your chin.",
            "She flops around to lie beside you afterwards, licking her lips. <i>“Tie,”</i> she declares. <i>“Rematch later.”</i>"
        ]);
        done({ roo: 2 });
    }

    /* ---------- From the Kiss ambush: Against the wall ---------- */
    function wallSex(fromRelief) {
        sexScene();
        say([
            fromRelief === true ? "Roo is waiting just inside her door, bent over with both palms flat against the wall, ass out, tails raised, exactly as you told her to wait. She looks back at you with her ears flat and her face red. <i>“{slave: Please, [pc.Master]. Please.”</i> / free: Took you long enough.”</i>}"
                : "You push her up against the nearest wall, kissing her hard, and Roo gasps into your mouth and grabs at you. <i>“Right here?”</i> she breathes. <i>“Right <b>here</b>?”</i> Yes. Right here.",
            "{rooWearingAnyClothes: You don’t bother getting her undressed. You just shove her clothes up and her panties aside. / else: She’s already naked. Convenient.} " + VIBE,
            "{hasCock: {taur: You turn her to face the wall and rear up, forelegs bracing against it above her head, and drive your [pc.cock] into her from behind and below. She cries out and claws at the wall. / naga: Your coils lift her right off her feet and pin her to the wall, legs spread wide, and you sink your [pc.cock] into her. / else: You hike one of her thick thighs up around your hip and drive your [pc.cock] into her, pinning her to the wall.} You fuck her hard, fast and messy, and anyone walking by can hear every slap and every yowl. / else: You pin her to the wall with your thigh between hers and your hand down the front of her, fingers sliding deep, while she grinds against you and reaches into your gear to return the favor. Anyone walking by can hear every wet sound.}",
            "She cums with her face pressed against the wall, shaking. {hasCock: You pin her there and finish inside her, [pc.cum] running down her thighs onto the deck. / else: You follow a moment later, with her fingers buried in you.}",
            "Roo slides down the wall to sit on the deck, laughing breathlessly. <i>“I think someone heard us,”</i> she says. She doesn’t sound sorry."
        ]);
        done({ roo: 1, cumIn: true, min: 15, max: 25 });
    }
    function wallOral() {
        sexScene();
        say([
            "You pin her to the wall with a kiss, and then you sink down. {taur: Your forelegs fold, lowering you until your face is level with her hips. / naga: You lower yourself on your coils. / else: You drop to your knees.} Roo looks down at you, eyes wide. <i>“Here? Out here?”</i>",
            "{rooWearingAnyClothes: You yank her panties down to her ankles. / else: } You hook one of her thick thighs over your shoulder and bury your face between her legs. Roo slaps a hand over her own mouth and her tails shoot straight up.",
            "She doesn’t stay quiet for long. By the time you’ve got your tongue inside her, she’s given up trying, moaning loud enough to echo down the corridor, both hands in your [pc.hair], hips rocking against your face.",
            "She cums standing up, legs shaking so hard you have to hold her up. When you stand, she pulls you into a kiss, tasting herself. <i>“Let them watch,”</i> she whispers. <i>“Let them be jealous.”</i>"
        ]);
        done({ pcCum: false, roo: 1, min: 15, max: 20 });
    }

    /* ---------- dispatcher used by other parts ---------- */
    window.tnRooSex = function (id, back) {
        if (!ready()) return;
        ret(back || function () { mainGameMenu(); });
        switch (id) {
            case "pump": return pumpScene();
            case "milkytitfuck": return milky() && hasCock() ? milkyTitfuck() : boobPlay();
            case "nursing": return nursing();
            case "boobplay": return boobPlay();
            case "drinkmilk": return drinkMilk();
            case "69top": return sixtyNine(true);
            case "69bottom": return sixtyNine(false);
            case "wallsex": return wallSex(false);
            case "walloral": return wallOral();
            case "shower": return showerSex();
            case "quickie": return hasGenitals() ? quickie() : eatOut();
            case "oral": return hasGenitals() ? oral(false) : eatOut();
            case "rider": return rooRider(false);
            case "menu": return sexMenuIntro();
        }
        mainGameMenu();
    };

    /* ---------- Beg for Relief (slave) and Ask for Relief (free) settings ---------- */
    var RELIEF_SLAVE = [
        ["wall", "Bend Over", "Have her bend over against the wall and wait for you to take her."],
        ["kneel", "Kneel 4 Oral", "Have her kneel with her mouth open and wait for you."],
        ["spread", "Spread Legs", "Have her lie back on her bed and spread her legs for you."],
        ["plead", "Plead", "Let her beg, talk dirty and paw at you until you give in."],
        ["any", "You Choose", "Let her pick a different way every time."]
    ];
    var RELIEF_FREE = [
        ["wall", "Bend Over", "Ask her to wait bent over by her door. She’ll give you an attitude about it."],
        ["oral", "Ask 4 Oral", "Ask her to offer her mouth. Knowing Roo, it’ll turn into a sixty-nine."],
        ["bully", "Bully Me", "Tell her to just come get you. She’ll drag you to bed and sit on your face."],
        ["tease", "Tease", "Ask her to dance it out of you. She’ll put on a show first."],
        ["any", "Surprise Me", "Let her pick a different way every time."]
    ];
    function relief(isSlave) {
        ourScene();
        if (flags.TN_ROO_RELIEF_UNLOCK !== 1) {
            say(["Roo hasn’t come to you needing help yet. Give it time; she will, once she’s been worked up long enough."]);
            next(function () { backToRoo(); });
            return;
        }
        var list = slave() ? RELIEF_SLAVE : RELIEF_FREE;
        var cur = flags.TN_ROO_RELIEF || "any";
        say([slave() ? "You tell Roo you want to talk about how she asks you for relief when she’s worked up. She kneels and listens carefully, ears forward. <i>“However you want me, [pc.Master]. Tell me how to present myself.”</i>"
            : "You bring up how Roo asks for help when she’s too wound up. She grins and leans in. <i>“Ohh, you want to put in a <b>request</b>? I’m listening.”</i>",
            "<b>Right now:</b> " + (list.filter(function (o) { return o[0] === cur; })[0] || list[4])[1] + "."]);
        clearMenu();
        list.forEach(function (o, i) {
            btn(i, o[1], function () {
                flags.TN_ROO_RELIEF = o[0];
                ourScene();
                say([slave() ? "<i>“Yes, [pc.Master]. I’ll remember.”</i> Roo bows her head, then peeks up, flushing. <i>“I hope I need it soon.”</i>"
                    : "<i>“Got it,”</i> Roo says, winking. <i>“You won’t know what hit you.”</i>",
                    "<b>(Relief style: " + o[1] + ".)</b>"]);
                next(function () { backToRoo(); });
            }, o[0] !== cur, o[2], "This is already how she does it.");
        });
        addButton(14, "Back", function () { backToRoo(); });
    }

    /* Ship event: first time is William's "Lusty Catgirl Wants Sex"; later ones use the relief style. */
    function reliefPick() {
        var s = flags.TN_ROO_RELIEF || "any";
        if (s === "any") s = pick(slave() ? ["wall", "kneel", "spread", "plead"] : ["wall", "oral", "bully", "tease"]);
        return s;
    }
    function lustyEvent() {
        clearOutput(); showRoo(); byUs(); CTX = {};
        var first = flags.TN_ROO_RELIEF_UNLOCK !== 1;
        flags.TN_ROO_RELIEF_TS = now();
        var back = function () { mainGameMenu(); };
        if (first) {
            flags.TN_ROO_RELIEF_UNLOCK = 1;
            say([
                "You’ve barely made it through the airlock when Roo appears in front of you. She’s flushed from her ears to her collarbone, breathing fast, thighs pressed tightly together. {vibesOn: You can hear the buzz from here. / else: }",
                "<i>“{slave: [pc.Master], I’m sorry, I know I shouldn’t, but I... I can’t... / free: [pc.name], hi, sorry, I know you just got back, but I really, <b>really</b>...}”</i> She swallows, tails twitching. <i>“I need help. I can’t think about anything else. Please?”</i>"
            ]);
            pcLust(10);
            clearMenu();
            addButton(0, "Help Her", function () {
                ret(back);
                if (hasGenitals()) { CTX = {}; oralMasturbate(); }
                else eatOut(true);
            }, "Help Her", "She’s practically vibrating. Help her out.");
            addButton(1, "Not Now", function () {
                ourScene();
                say(["You tell her not right now. Roo’s ears droop, but she nods. <i>“Okay. {canMasturbate: I’ll... take care of it.”</i> She scurries back to her room, and a minute later you hear a muffled moan through the door. / else: Okay. I’ll... wait.”</i> She goes back to her room, walking stiffly.}",
                    "<b>(You can now tell Roo how to ask for relief from her " + (slave() ? "Order" : "Request") + " menu.)</b>"]);
                if (canMasturbate()) setLust(15);
                next(back);
            }, "Not Now", "Not right now.");
            return;
        }
        var s = reliefPick();
        CTX.rStyle = s;
        var intro = {
            wall: "You get back to find Roo waiting just inside her door, bent forward with her palms flat against the wall, {rooWearingAnyClothes: skirt hiked up, / else: bare, } tails raised. She looks back over her shoulder, red-faced. <i>“{slave: I’m ready for you, [pc.Master].”</i> / free: Don’t make me wait, [pc.name].”</i>}",
            kneel: "You get back to find Roo kneeling in the middle of her room, hands on her thighs, mouth open, waiting. Her tails twitch the moment she sees you. <i>“[pc.Master]...”</i>",
            spread: "You get back to find Roo lying back on her bed, legs spread wide, holding herself open. <i>“Please, [pc.Master],”</i> she whispers.",
            plead: "Roo is on you before you’re through the door, rubbing against you, nuzzling your neck, hands wandering. <i>“Please, [pc.Master], please, I’ll be so good, I need it so bad, please...”</i>",
            oral: "Roo meets you in the corridor and drops to her knees right there. <i>“I’m asking for oral,”</i> she says primly. Then, with a grin: <i>“Mutual oral.”</i>",
            bully: "Roo grabs you by the collar the moment you come through the airlock. <i>“You told me to come get you,”</i> she growls, <i>“so I’m getting you.”</i>",
            tease: "There’s music coming from Roo’s room. When you look in, she’s already dancing, slow and filthy, and she crooks a finger at you without missing a beat."
        };
        say([intro[s] || intro.plead]);
        pcLust(10);
        clearMenu();
        var go = {
            wall: function () { hasCock() ? wallSex(true) : eatOut(true); },
            kneel: function () { hasGenitals() ? oral(true) : eatOut(true); },
            spread: function () { hasCock() ? missionary(true) : eatOut(true); },
            plead: function () { hasCock() ? doggy(true) : eatOut(true); },
            oral: function () { sixtyNine(false); },
            bully: function () { rooRider(true); },
            tease: function () { striptease(); }
        }[s];
        addButton(0, "Help Her", function () { ret(back); go(); }, "Help Her", "Give her what she’s asking for.");
        addButton(1, "Not Now", function () {
            ourScene();
            say([slave() ? "You tell her not now. Roo bows her head. <i>“Yes, [pc.Master].”</i> {canMasturbate: She slips away, and soon there are muffled moans from her room. / else: She stays exactly where she is, trembling, until you dismiss her.}"
                : "You tell her not now. Roo pouts, huffs, and flounces off. {canMasturbate: A minute later you hear her toys start up through the wall. / else: }"]);
            if (canMasturbate()) setLust(15);
            next(back);
        }, "Not Now", "Not right now.");
    }
    function oralMasturbate() {
        sexScene();
        say([
            "Roo drops to her knees in front of you right there in the corridor. <i>“Thank you, thank you,”</i> she breathes, and then she’s tugging your gear aside with one hand while the other dives between her own legs.",
            "{hasCock: She takes your [pc.cock] into her mouth like she’s starving, sucking and moaning around it, while her fingers work frantically at her own pussy. / else: She buries her face in your [pc.vagina] like she’s starving, lapping and moaning, while her fingers work frantically at her own pussy.} {taur: She’s had to wedge herself almost under your barrel to reach, and her muffled noises echo off your belly. / naga: Your coils curl around her to keep her steady. / else: }",
            "It doesn’t take long for either of you. She cums first, shuddering against you, still sucking, and that sends you over too, {hasCock: spilling [pc.cum] down her eager throat / else: your [pc.girlCum] slicking her chin}.",
            "Roo sits back on her heels, panting, flushed, and looks up at you. <i>“{slave: Thank you, [pc.Master]. I needed that so bad.”</i> / free: Thank you. Seriously. I needed that.”</i>}",
            "<b>(You can now tell Roo how to ask for relief from her " + (slave() ? "Order" : "Request") + " menu.)</b>"
        ]);
        done({ roo: 1, min: 10, max: 15 });
    }
    H.lustyEvent = lustyEvent;
    H.relief = relief;
