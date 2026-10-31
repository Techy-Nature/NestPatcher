/* Steph Irson. First meeting is the tile east of the Merchant Deck lift.
   Talk menu is her Myrellion camp menu, moved onto Tavros Station.
   Blowjob and doggystyle are filled in when the scene writer finishes. */

window.tnStephBust = function () {
    if (flags.STEPH_DARGONED) return 5;
    if (flags.STEPH_COCKED) return 4;
    if (flags.STEPH_COWGIRL) return 3;
    if (flags.STEPH_GOOED) return 2;
    if (flags.STEPH_NYAN) return 1;
    return 0;
};

window.tnStephSay = function (paragraphs) {
    for (var i = 0; i < paragraphs.length; i++) output("\n\n" + paragraphs[i]);
};

window.tnStephMenu = function () {
    clearMenu();
    if (pc.hasKeyItem("Signed Steph Irson Photo")) addDisabledButton(0, "Autograph", "Autograph", "She already signed one for you.");
    else addButton(0, "Autograph", window.tnStephAutograph, "Autograph", "Ask the Galactic Huntress for her autograph.");
    if (void 0 === flags.STEPH_WORK_CHOICE) addButton(1, "Her Work", window.tnStephWork, "Her Work", "Ask why the Huntress is loitering on a space station.");
    else addDisabledButton(1, "Her Work", "Her Work", "You already had that talk.");
    addButton(2, "Mutations", window.tnStephMutations, "Mutations", "Ask about the ears, the tail, and the rest of it.");
    if (1 === flags.TN_STEPH_CREW) addButton(3, "Sex", window.tnStephSexMenu, "Sex", "Take her back to the ship.");
    else addButton(3, "Recruit", window.tnStephRecruit, "Recruit", "Ask her to come aboard your ship.");
    addButton(14, "Back", mainGameMenu, "Back", "Leave her by the lift.");
};

window.tnStephAuto = function () {
    if (flags.TN_STEPH_MET) return false;
    flags.TN_STEPH_MET = 1;
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    window.tnStephSay([
        "The Merchant Deck is shoulder to shoulder, the lift coughing out another load of station traffic. You step right, out of the doors, and walk straight into a wall of khaki and sun-browned skin.",
        "She bounces off your chest, buttons straining, and one of them gives up. A khaki ranger’s cutoff, short shorts, and a pair of breasts that have no business being on a wildlife host.",
        flags.STEPH_WATCHED ? "You know the face. Half the galaxy does. Steph Irson, off the viewscreen and standing in the foot traffic." : "She looks like she walked out of a nature special and got lost between the shops.",
        "<i>“Oi,”</i> she says, New Brisbane rough under a bubbly slip. Her tail winks its one eye. <i>“So, like, who’re you then?”</i>",
        "<i>“Steele. [pc.name] Steele.”</i>",
        "She nods like she is doing you a favor by introducing the most recognizable host on the extranet. <i>“Stephanie Irson. So, um, what can I do for ya, " + pc.mf("Mr.", "Ms.") + " Steele?”</i> Another button pops when she folds her arms under her rack.",
        "<i>“I’m just, like, frustrated, is all,”</i> she goes on, before you can answer. <i>“Tryin’ to put together a demo reel for a new network. Wankers I’m workin’ for right now are, like, just the worst ever. They don’t want a wildlife show. They want sex, sex, sex, and then the new CEO pulls the episodes anyway. So I’m stuck on Tavros between ships, watchin’ tourists, waitin’ on a berth that isn’t full of their notes.”</i>",
        "The lift opens behind her and spills another crowd past the two of you. She looks back at you, waiting on what you want."
    ]);
    processTime(10);
    window.tnStephMenu();
    return true;
};

window.tnStephDeckButton = function () {
    if (!flags.TN_STEPH_MET || 1 === flags.TN_STEPH_CREW) return;
    addButton(13, "Steph", function () {
        clearOutput();
        author("Savin");
        stephHeader(window.tnStephBust());
        output("\n\nSteph Irson is still parked just off the Merchant Deck lift, khaki shorts and all, tail flicking at anyone who stares. She grins when she spots you.");
        output("\n\n<i>“Back again, " + pc.mf("Mr.", "Ms.") + " Steele? Station’s not much, but it’s better than a cave full of bugs.”</i>");
        window.tnStephMenu();
    }, "Steph Irson", "The Galactic Huntress is waiting by the lift.");
};

window.tnStephAutograph = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    output("\n\n<i>“Could I get your autograph?”</i>");
    output("\n\nHer ears perk. <i>“Anything for, like, an adoring fan!”</i> She digs a glossy out of a thigh pocket, signs it against her chest, and slaps it into your hand. <i>“There ya go, mate.”</i>");
    pc.createKeyItem("Signed Steph Irson Photo");
    output("\n\n(<b>Key Item Gained:</b> Signed Steph Irson Photo)");
    clearMenu();
    addButton(0, "Next", window.tnStephMenu, "Next", "Back to Steph.");
};

window.tnStephWork = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    output("\n\nYou nod at the station around you instead of a cavern camp. <i>“What’s so bad about them?”</i>");
    output("\n\n<i>“I don’t even know what Network wants anymore!”</i> Steph throws a hand up and nearly loses another button. <i>“Half time time I feel like they’re just sending me to go get fucked by ever critter with a cock - and half the ones without - but then the stupid, mean new CEO pulls so many of the episodes I send her. The best ones, too, the cunt. I have to work three times as hard just to make my weekly shows!”</i>");
    output("\n\n<i>“So you’re trying to switch networks?”</i>");
    output("\n\n<i>“Eh, kind of. I’m puttin’ together a demo tape. Gonna shop it around a little. Between you and me, I’m uh, thinking about sending it to a couple of X-rated networks, ya know?”</i> She looks almost embarrassed, then grins. <i>“Ever since New Texas I’ve just felt hornier and hornier. A dirty channel would let me do whatever I want. What director’s gonna turn away something like THAT?”</i>");
    clearMenu();
    addButton(0, "Pornstar", window.tnStephPorn, "Pornstar", "Encourage her to take the X-rated networks.");
    addButton(1, "New Network", window.tnStephNetwork, "New Network", "Tell her to find a network that will let her do the show properly.");
    addButton(2, "Stay", window.tnStephStay, "Stay", "Tell her to stick with the show the way it is.");
    addButton(14, "Back", window.tnStephMenu, "Back", "Drop it.");
};

window.tnStephPorn = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    output("\n\n<i>“X-rated networks? Sounds promising.”</i>");
    output("\n\n<i>“I know, right?”</i> Her tail gives an interested little twitch. <i>“I’d love to do stuff like that all the time! I’ve had enough of snakes and lizards and fish. It’s time for the Huntress to hunt a galaxy full of big, throbbing dicks and huge tits! Right. I’m sending this off to some dirty channels I’ve, um, heard of.”</i>");
    output("\n\nMaybe the next time you catch her show, Naughty Wyvern or somebody like them will be paying for it.");
    flags.STEPH_WORK_CHOICE = GLOBAL.STEPH_WORK_PORNSTAR;
    clearMenu();
    addButton(0, "Next", window.tnStephMenu);
};

window.tnStephNetwork = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    output("\n\n<i>“Maybe you ought to try a new, safe for work network,”</i> you suggest. <i>“They can’t all be that abusive.”</i>");
    output("\n\nSteph sighs, ears drooping. <i>“Yeah, but it’s hard to find a network that’s gonna let me do what I wanna do. I don’t only wanna be a nature gal anymore. I’m really startin’ to love that mix of business and pleasure, ya know? The first couple times was pretty rough, but now... I dunno, it’s exciting!”</i>");
    output("\n\nShe is still shopping the tape. She just wants somebody who won’t cut the good parts and won’t get her killed for a rating.");
    flags.STEPH_WORK_CHOICE = GLOBAL.STEPH_WORK_NEWNETWORK;
    clearMenu();
    if (void 0 === flags.STEPH_STEELE_SPONSOR) addButton(0, "S.T. Sponsor", window.tnStephSponsor, "Steele Tech Sponsor", "Maybe Steele Tech could pay for the show she actually wants to make.");
    addButton(14, "Back", window.tnStephMenu);
};

window.tnStephSponsor = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    output("\n\n<i>“Steele Tech could sponsor you,”</i> you say. <i>“Real wildlife work. You keep the teeth. They keep the lights on.”</i>");
    output("\n\nSteph blinks, then laughs so hard a button finally dies. <i>“You serious? A Steele ship payin’ for the Huntress? Mate, I’d take that. I’d take that yesterday. Thank you. I’m so excited!”</i>");
    output("\n\nHopefully the next time you see her broadcast, Steph Irson will be working for Steele Tech.");
    flags.STEPH_STEELE_SPONSOR = 1;
    clearMenu();
    addButton(0, "Next", window.tnStephMenu);
};

window.tnStephStay = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    output("\n\n<i>“Stay,”</i> you tell her. <i>“The show’s a mess, but it’s your mess. People tune in for you, not for a cleaner network.”</i>");
    output("\n\nShe chews on that, tail coiling. <i>“You’re not wrong. I do love it, even when they’re wankers. Alright. I’ll stick it out a bit longer. Don’t let me regret it, Steele.”</i>");
    flags.STEPH_WORK_CHOICE = GLOBAL.STEPH_WORK_DISCOURAGE;
    clearMenu();
    addButton(0, "Next", window.tnStephMenu);
};

window.tnStephMutations = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    output("\n\nYou gesture at the ears, then at the cock-tipped tail trying to hide behind her calf. On a station promenade she looks like the exhibit.");
    output("\n\n<i>“Occupational hazard,”</i> she says, cheerful about it. <i>“Naleen gave me the ears. Didn’t mean to walk into a mating ball, but that’s the show, isn’t it? Tail’s from a vine on a later shoot. Grows a bit when I’m, um, interested. Rest of it depends which planet the network threw me at.”</i> She plants her hands on her hips. <i>“I used to hate it. Now it’s just me. You get used to bein’ the thing you’re documentin’.”</i>");
    clearMenu();
    addButton(0, "Next", window.tnStephMenu);
};

window.tnStephRecruit = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    window.tnStephSay([
        "You glance down at Steph Irson, Galactic Huntress, who's eyeing you with a mixture of amusement and curiosity. Her blonde hair has a few stray strands to frame her face. Her khaki ranger outfit seems out of place on the Merchant Deck of Tavros Station, but she looks perfectly at home.",
        "<i>“Oi, mate, ya think I’m just some silly huntress?”</i> Steph asks with a grin, trying to sound tough, the bubbly slip peeking through.",
        "<i>“I’m offering you a berth,”</i> you say. <i>“Instead of hopping the next planet alone, come aboard my ship.”</i>",
        "Steph’s eyes light up. <i>“Oh, bloody hell, that sounds like a dream come true! I’m sick of those network wankers treatin’ me like some sort of wild animal in a cage. I want to break free and see what the galaxy’s really got to offer.”</i>",
        "<i>“It comes with risks.”</i>",
        "She takes a breath, ears forward. <i>“Like, um, I was born ready, mate! Just show me the way to the ship and I’m outta here.”</i>",
        "You lead her toward the lift. She follows close, tail curled, already talking about where to stow her camera kit."
    ]);
    flags.TN_STEPH_CREW = 1;
    window.tnStephInstall();
    processTime(20);
    clearMenu();
    addButton(0, "Next", mainGameMenu, "Next", "She’s with you now.");
};

window.tnStephSexMenu = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    output("\n\nSteph jerks her thumb toward the lift. <i>“Ship’s got a bunk, yeah? Better than doin’ this in the foot traffic.”</i>");
    clearMenu();
    if (pc.hasCock()) {
        addButton(0, "Blowjob", window.tnStephBlowjob, "Blowjob", "She takes you back to the ship and uses her mouth.");
        addButton(1, "Doggystyle", window.tnStephDoggy, "Doggystyle", "She takes you back to the ship and gets on the bunk.");
    } else {
        addDisabledButton(0, "Blowjob", "Blowjob", "You need a penis for this.");
        addDisabledButton(1, "Doggystyle", "Doggystyle", "You need a penis for this.");
    }
    addButton(14, "Back", window.tnStephMenu, "Back", "Not now.");
};

window.tnStephBlowjob = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust(), true);
        window.tnStephSay([
        "You lie back on your bunk, watching Steph Irson drop her khaki ranger cutoffs to the floor with a flourish. Her eyes sparkle as she steps out of them, revealing her tan skin and huge breasts in just a pair of short shorts. \"Oi, mate,\" she says with a grin, \"ready for action?\"",
        "She saunters over to you, her hips swaying seductively. \"I'm proper keen on gettin' me hands on that there,\" she says, nodding towards [pc.cock]. She reaches out and wraps her fingers around it, giving a gentle squeeze.",
        "\"Gods, Steph,\" you groan, feeling your cock twitch in response to her touch. She leans down, her lips inches from the tip of your erection. \"You're goin' to love this, mate,\" she whispers, her breath sending shivers down your spine.",
        "And then she's on her knees, her mouth wrapped around [pc.cock], sucking it deep into her throat. Her hands wrap around the base, squeezing gently as she starts to move her head back and forth. \"Mmm, you taste so good,\" she murmurs, her eyes closed in rapture.",
        "You feel yourself growing harder beneath her ministrations, your cock throbbing with pleasure. \"Oi, mate, relax,\" Steph says, seeming to sense your tension. \"Let me show ya how it's done.\" She starts to take it deeper, further into her throat than before, and you can feel the roof of her mouth pressing against the base.",
        "\"Gods, Steph...\" you trail off, unable to finish the sentence as she continues to suck and lick [pc.cock]. Her hands move up and down your shaft, stroking it gently. \"You're so wet,\" she says, her voice husky with desire.",
        "She starts to pick up speed, sucking and licking in quick, sharp motions. You feel yourself building towards a climax, but Steph's not done yet. She pulls back just an inch, her tongue flicking out to tease the tip of your cock. \"Oi, mate, I know ya like that,\" she says with a sly grin.",
        "She dips forward again, taking you deep into her throat once more. You can feel yourself getting closer and closer to the edge, but Steph's not letting up yet. She's on fire, her mouth and hands working in perfect sync as she sucks and strokes your cock.",
        "\"Come on, mate,\" she whispers, her breath hot against your skin. \"Give it to me.\" And with that, you feel yourself explode into a climax of pure, unadulterated pleasure. Steph's sucking you down deep, her throat convulsing around your cock as she swallows every last drop.",
        "The aftermath is almost anticlimactic - you just lie there, panting, as Steph lingers on the tip of your cock, making sure to catch every last drop. She pulls back slowly, a satisfied smile spreading across her face. \"Oi, mate,\" she says, \"best one yet.\" She's so pleased with herself that she can barely contain it.",
        "She reaches up and ruffles your hair, her eyes sparkling with amusement. \"You're a good learner, mate,\" she teases. \"I reckon we make a right proper team.\" She leans forward, her lips brushing against yours in a gentle kiss.",
        "As you break apart for air, Steph's still smiling at you - it's like she's basking in the glow of your pleasure. She leans back on her heels, looking pleased with herself. \"You know,\" she says thoughtfully, \"I reckon I'm gettin' better at this blow job business.\"",
        "She winks at you, a mischievous glint in her eye. \"Oi, mate,\" she says with a grin, \"want to see how good I can get?\"",
        "You nod eagerly, still catching your breath from the intense climax. Steph's eyes sparkle with amusement as she leans forward, her lips inches from yours again.",
        "\"Right, then,\" she says, a sly smile spreading across her face. She reaches up and cups your face in her hands, her thumbs tracing the shape of your cheekbones. \"Let's see how I can make it even better.\"",
        "She takes a deep breath, and you feel her warm breath wash over your skin. Her eyes lock onto yours, and you can see the hunger burning there. \"Oi, mate,\" she says softly, \"let me show ya what I've got.\" She leans in closer, her lips almost brushing against yours.",
        "You feel a shiver run down your spine as she teases you with a gentle kiss on the mouth. Her tongue darts out to taste you, and you can feel the spark of desire ignite between you. Steph's hands move up and down your face, tracing the shape of your jawline and the curve of your cheek.",
        "She pulls back just enough to smile at you, her eyes sparkling with mischief. \"Oi, mate,\" she says, \"you're lookin' a bit done in.\" She reaches out and ruffles your hair again, this time with a softer touch. \"Let me give ya a break.\"",
        "You shake your head, feeling the daze of pleasure start to clear from your mind. Steph's still smiling at you, her eyes crinkled at the corners. You can see the excitement building in her, and you feel yourself responding to it.",
        "\"Oi, mate,\" she says softly, \"I think I'm just gettin' started.\" She leans forward again, her lips inches from yours. You can feel the heat of her breath on your skin, and your cock stirs to life once more.",
        "\"What do ya say?\" she whispers, her eyes locked onto yours. \"Want me to show ya what I've got?\"",
    ]);
    processTime(25);
    pc.orgasm();
    clearMenu();
    addButton(0, "Next", window.tnStephMenu, "Next", "Back to Steph.");
};

window.tnStephDoggy = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust(), true);
        window.tnStephSay([
        "You lie back on your bunk, watching as Steph Irson drops down beside you, her khaki ranger shorts slipping off her toned legs as she moves. Her blonde hair bobs with each bounce of her movement, the curves of her breasts straining against her tight shirt.",
        "\"Oi, mate,\" she says, a sly grin spreading across her face as she reaches out to grab the hem of your shirt and pull it open.",
        "You feel a rush of anticipation as she leans in close, her breath tickling the skin on your chest. Her eyes meet yours, sparkling with excitement.",
        "\"You're lookin' pretty good for an old guy,\" she says, her voice husky from being in the outdoors too long.",
        "You can't help but chuckle at that. \"I think I'm feeling pretty good myself,\" you reply, running a hand over her exposed skin.",
        "Steph shivers at your touch, her body language screaming for more contact. You take it as a sign and let your hands roam across her skin, sending shivers down her spine.",
        "\"Ooh, like that,\" she says, her voice rising in pitch as you find the soft spot on her back.",
        "You press harder, feeling a surge of power at being able to make her squirm like this. Steph's eyes meet yours again, and for a moment, you see a flash of something almost primal in their depths.",
        "\"Oi, mate,\" she says once more, before pushing herself up onto her elbows and letting her shorts slide off completely.",
        "You follow her movement with your eyes, taking in the view of her toned legs, strong calves and muscular thighs. Your [pc.cock] stirs beneath you, reacting to the sight of her bare skin.",
        "Steph seems to notice it too, a sly smile spreading across her face as she moves closer, her eyes locked on yours.",
        "\"You look like you could use some help getting comfortable,\" she says, before reaching out and gently stroking your erection through your pants.",
        "You feel a jolt of electricity at the touch, and your [pc.cock] throbs in response. You can't help but feel drawn to her, sensing an almost instinctual attraction between you.",
        "\"Yeah, that'd be great,\" you reply, trying to keep your voice steady as she works on undoing your pants.",
        "Steph's hands move deftly, her fingers brushing against your skin as she exposes more of you. Her eyes meet yours again, and for a moment, you see something almost... hungry in their depths.",
        "\"Oi, mate,\" she says once more, before letting out a low, husky laugh as she wraps her hand around the base of your [pc.cock].",
        "You feel yourself getting harder by the second under her touch. Your body responds instinctively to her closeness, and you can't help but thrust into her hand, seeking more contact.",
        "Steph's eyes light up with a spark of amusement as she looks up at you. \"Gotta say, mate,\" she says, before leaning in close, \"I like the way you move.\"",
        "You feel yourself getting lost in her words, the husky tone sending shivers down your spine. Your [pc.cock] twitches with anticipation as she starts to stroke it more firmly.",
        "\"Yeah?\" you reply, feeling your voice rise in pitch as your body reacts to her touch.",
        "Steph nods, a sly smile spreading across her face. \"Yeah,\" she says, before leaning in closer and pressing her lips against the base of your [pc.cock].",
        "You feel a jolt of electricity at the contact, and your body responds instinctively. Your [pc.cock] throbs in response to her touch, seeking more of what she's offering.",
        "\"Yeah?\" you reply again, feeling your voice rise higher still as you try to contain yourself.",
        "Steph pulls back, looking up at you with a mischievous glint in her eye. \"Oi, mate,\" she says once more, before rolling onto her elbows and spreading her legs wide open for you.",
        "You feel a surge of anticipation at the sight of her exposed skin. Your [pc.cock] throbs with desire as you reach out to touch her.",
        "Steph's eyes light up with excitement as you wrap your hand around the back of your [pc.cock], guiding it towards her. You can see the tension building in her body, her skin tightening in anticipation of what's about to happen.",
        "\"Oi, mate,\" she says once more, before letting out a low, husky laugh as you press the tip of your [pc.cock] against her entrance.",
        "You feel a rush of power at being able to make her feel this way. Your body responds instinctively to her closeness, and you thrust forward with one smooth motion, sinking into her warm, wet depths.",
        "Steph lets out a loud gasp as you enter her, her body arching in response to the invasion. You can see the tension building in her muscles, her skin tensed up like a bowstring.",
        "\"Oi, mate!\" she says again, before thrusting back against you with a force that sends you tumbling into her.",
        "Your [pc.cock] throbs with desire as you try to keep up with her movements. You can feel the sweat building on your forehead, the tension in your body rising higher and higher with each passing moment.",
        "\"Oi, mate!\" she says once more, before shoving back against you with a force that sends you flying forward into her warm, wet depths.",
        "You feel a rush of power at being able to make her feel this way. Your [pc.cock] throbs in response to her touch, seeking more contact and friction.",
        "Steph's body starts to tense up again, her muscles straining with anticipation as she moves herself against you. You can see the tension building in her skin, her body preparing for what's about to happen.",
        "\"Oi, mate!\" she says once more, before letting out a loud, primal scream as her body convulses in your arms.",
        "You feel yourself getting lost in the moment, your [pc.cock] throbbing with desire as you try to keep up with her movements. You can see the tension building in her skin, her body preparing for what's about to happen.",
        "Steph's eyes lock onto yours, a look of raw emotion flashing across their surface as she reaches her climax. You feel a rush of power at being able to make her feel this way, your [pc.cock] throbbing with desire as you try to keep up with her movements.",
        "As Steph's body convulses in your arms, you can't help but follow suit, your own orgasm building in intensity as you thrust into her one last time.",
        "You feel a rush of release as your [pc.cock] erupts inside her, filling her warm, wet depths with its seed. Steph's body relaxes against yours, her muscles going limp as she catches her breath.",
        "For a moment, you both just lie there, your bodies locked together in a sweaty, pulsing mass. You can feel the tension slowly draining out of her skin, her body relaxing into the afterglow of what's just happened.",
        "Steph lets out a soft sigh as she looks up at you, a look of raw emotion flashing across her face. \"Oi, mate,\" she says once more, before nuzzling her head into your chest.",
        "You feel yourself getting lost in the moment, your body wrapped tightly around hers as you both catch your breath.",
    ]);
    processTime(30);
    pc.orgasm();
    clearMenu();
    addButton(0, "Next", window.tnStephMenu, "Next", "Back to Steph.");
};

window.tnStephInstall = function () {
    if (typeof chars === "undefined" || typeof flags === "undefined") return;
    if (flags.TN_STEPH_CREW !== 1) return;
    if (chars.STEPH && typeof chars.STEPH.isCrew === "function") return;
    var no = function () { return false; };
    chars.STEPH = {
        a: "Steph",
        short: "Steph",
        nameDisplay: function () { return "Steph Irson"; },
        getClassName: function () { return "StephIrson"; },
        isCrew: function () { return flags.TN_STEPH_CREW === 1; },
        isRecruited: function () { return flags.TN_STEPH_CREW === 1; },
        freeRent: false,
        processTime: function () {},
        hasPerk: no,
        hasVagina: function () { return true; },
        isPregnant: no,
        hasWombPregnancy: no,
        fertility: function () { return 0; },
        crewBlurb: function (slot) {
            if (!this.isCrew()) return "";
            addButton(slot, "Steph", function () {
                clearOutput();
                author("Savin");
                stephHeader(window.tnStephBust());
                output("\n\nSteph has claimed a corner of the ship for her kit. She looks up from a half-packed camera and grins. <i>“There ya are. Ship’s not a bad hide, Steele.”</i>");
                window.tnStephMenu();
            }, "Steph Irson", "The Galactic Huntress is aboard.");
            return "\n\nSteph Irson is aboard, taking up a crew slot and most of a bench with her gear.";
        }
    };
};

(function tnStephBoot() {
    if (typeof flags === "undefined" || typeof addButton !== "function") {
        setTimeout(tnStephBoot, 400);
        return;
    }
    window.tnStephInstall();
    if (!window.tnStephWatch) window.tnStephWatch = setInterval(window.tnStephInstall, 1000);
})();
