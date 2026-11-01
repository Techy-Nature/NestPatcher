/* Steph Irson. First meeting is the tile east of the Merchant Deck lift.
   Talk menu is her Myrellion camp menu, moved onto Tavros Station.
   Blowjob, doggystyle, and Snake & Vine (needs a cunt tail) scenes included.
   v2.7 (2026-11-01): dialogue pass. Cut the wall of "Oi, mate!" lines; her New Brisbane
   voice now comes through in word choice (reckon, heaps, arvo, knackered) with only the
   odd "mate", and varied speech tags (drawls, purrs, teases). Sex scenes trimmed of repeated paragraphs and use the game's quote style. */

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
        "The Merchant Deck is shoulder to shoulder, the lift coughing out another load of station traffic. You step out of the doors, turn right, and walk straight into a wall of khaki and sun-browned skin.",
        "She bounces off your chest, buttons straining, and one of them gives up. Khaki ranger shirt, cutoff short shorts, and a pair of breasts that have no business on a wildlife host.",
        flags.STEPH_WATCHED ? "You know the face. Half the galaxy does. Steph Irson, off the viewscreen and standing in the foot traffic." : "She looks like she walked out of a nature special and got lost between the shops.",
        "<i>“Oi,”</i> she drawls, New Brisbane vowels stretched long and rough under a bubbly slip. Her tail winks its one eye. <i>“So, like, who’re you then?”</i>",
        "<i>“Steele. [pc.name] Steele.”</i>",
        "She nods as if she’s doing you a favor, introducing herself when she’s the most recognizable host on the extranet. <i>“Stephanie Irson. So, um, what can I do for ya, " + pc.mf("Mr.", "Ms.") + " Steele?”</i> Another button pops when she folds her arms under her rack.",
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
        output("\n\n<i>“Back again, " + pc.mf("Mr.", "Ms.") + " Steele?”</i> she calls, waving you over. <i>“Station’s not much, but it’s better than a cave full of bugs.”</i>");
        window.tnStephMenu();
    }, "Steph Irson", "The Galactic Huntress is waiting by the lift.");
};

window.tnStephAutograph = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    output("\n\n<i>“Could I get your autograph?”</i>");
    output("\n\nHer ears perk. <i>“Anything for, like, an adoring fan!”</i> She digs a glossy out of a thigh pocket, signs it against her chest, and slaps it into your hand. <i>“There ya go. Don’t go floggin’ it on the extranet.”</i>");
    pc.createKeyItem("Signed Steph Irson Photo");
    output("\n\n(<b>Key Item Gained:</b> Signed Steph Irson Photo)");
    clearMenu();
    addButton(0, "Next", window.tnStephMenu, "Next", "Back to Steph.");
};

window.tnStephWork = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    output("\n\nYou think back to her rant about the network. <i>“What’s so bad about them?”</i>");
    output("\n\n<i>“I don’t even know what Network wants anymore!”</i> Steph throws a hand up and nearly loses another button. <i>“Half the time I feel like they’re just sending me to go get fucked by every critter with a cock—and half the ones without—but then the stupid, mean new CEO pulls so many of the episodes I send her. The best ones, too, the cunt. I have to work three times as hard just to make my weekly shows!”</i>");
    output("\n\n<i>“So you’re trying to switch networks?”</i>");
    output("\n\n<i>“Eh, kind of. I’m puttin’ together a demo tape. Gonna shop it around a little. Between you and me, I’m, uh, thinkin’ about sending it to a couple of X-rated networks, ya know?”</i> She looks almost embarrassed, then grins. <i>“Ever since New Texas I’ve just felt hornier and hornier. A dirty channel would let me do whatever I want. What director’s gonna turn away something like THAT?”</i>");
    clearMenu();
    addButton(0, "Pornstar", window.tnStephPorn, "Pornstar", "Encourage her to go with the X-rated networks.");
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
    output("\n\n<i>“Maybe you ought to try a new, safe-for-work network,”</i> you suggest. <i>“They can’t all be that abusive.”</i>");
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
    output("\n\nSteph blinks, then laughs so hard a button finally dies. <i>“You serious? A Steele ship payin’ for the Huntress? Mate, too right I’d take that. I’d take that yesterday. Thank you. I’m so excited!”</i>");
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
    output("\n\nYou gesture at the ears, then at the cock-tipped tail trying to hide behind her calf. Out here on a station deck, she looks more like the exhibit than the host.");
    output("\n\n<i>“Occupational hazard,”</i> she chirps, cheerful about it. <i>“Naleen gave me the ears. Didn’t mean to walk into a mating ball, but that’s the show, isn’t it? Tail’s from a vine on a later shoot. Grows a bit when I’m, um, interested. Rest of it depends which planet the network threw me at.”</i> She plants her hands on her hips. <i>“I used to hate it. Now it’s just me. You get used to bein’ the thing you’re documentin’.”</i>");
    clearMenu();
    addButton(0, "Next", window.tnStephMenu);
};

window.tnStephRecruit = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust());
    window.tnStephSay([
        "You glance down at Steph Irson, Galactic Huntress, who’s eyeing you with a mix of amusement and curiosity. A few stray strands of blonde hair frame her face. Her khaki ranger outfit seems out of place on the Merchant Deck of Tavros Station, but she looks perfectly at home.",
        "<i>“So what, ya reckon I’m just some silly huntress?”</i> Steph shoots back with a grin, trying to sound tough while the bubbly slip peeks through.",
        "<i>“I’m offering you a berth,”</i> you say. <i>“Instead of hopping the next planet alone, come aboard my ship.”</i>",
        "Steph’s eyes light up. <i>“Oh, that’d be bloody brilliant! I’m sick of those network wankers treatin’ me like some sort of wild animal in a cage. I want to break free and see what the galaxy’s really got to offer.”</i>",
        "<i>“It comes with risks.”</i>",
        "She takes a breath, ears forward. <i>“Like, um, somethin’ tries to eat me every other episode. Risks are basically the job. Just point me at the ship and I’m outta here.”</i>",
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
    if (pc.hasTailCunt && pc.hasTailCunt()) addButton(2, "Snake & Vine", window.tnStephTails, "Snake & Vine", "Let your cunt tail and her cockvine tail get acquainted.");
    else addDisabledButton(2, "Snake & Vine", "Snake & Vine", "You need a cunt tail for this.");
    addButton(14, "Back", window.tnStephMenu, "Back", "Not now.");
};

window.tnStephBlowjob = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust(), true);
    window.tnStephSay([
        "You lie back on your bunk while Steph Irson kicks her khaki cutoffs across the floor with a flourish, leaving her in a ranger shirt that has already lost its fight with her chest. <i>“Right,”</i> she purrs, grinning. <i>“Ready for the main event?”</i>",
        "She saunters over, hips swaying, eyes fixed below your belt. <i>“Been keen to get my hands on that all arvo,”</i> she drawls, and wraps her fingers around [pc.cock], giving it a slow squeeze.",
        "<i>“Gods, Steph,”</i> you groan, twitching in her grip. She leans down until her lips hover just over your tip. <i>“Oh, you’re gonna love this,”</i> she murmurs, and her breath sends a shiver down your spine.",
        "Then she’s kneeling between your legs, mouth wrapped around [pc.cock], sinking down until you bump the back of her throat. Her hands work the base in time with her bobbing head, and she hums around you, eyes closed, like you’re the best thing she’s tasted all week.",
        "She must feel you tense up, because she pulls off just long enough to pat your thigh. <i>“Relax, yeah? Let me show ya how it’s done.”</i> Then she takes you deeper than before, lips nearly reaching your base.",
        "<i>“Gods, Steph...”</i> You can’t finish the thought. She licks and sucks and strokes all at once, and every time you groan she looks very pleased with herself.",
        "She picks up the pace, quick and sharp, and you start climbing toward the edge, but Steph isn’t done with you yet. She pulls back an inch and flicks her tongue across your tip. <i>“Ha! Knew you’d like that.”</i>",
        "Then she dives back down and swallows you whole again. Mouth and hands move in perfect sync, and she’s relentless about it, like there’s a ratings target riding on this.",
        "<i>“C’mon,”</i> she breathes against your skin. <i>“Give it to me.”</i> You do. Climax tears through you as Steph holds you deep, throat working to swallow every drop.",
        "You’re left limp and panting while she lingers at your tip to catch the last of it. She pulls off slowly, a smug smile spreading across her face. <i>“Not bad, eh? Reckon that’s my best one yet.”</i>",
        "She reaches up and ruffles your hair. <i>“You’re a good sport, Steele. Reckon we make a pretty good team.”</i> She leans in and brushes her lips against yours in a gentle kiss.",
        "When you part for air, she sits back on her heels, still glowing. <i>“Y’know,”</i> she muses, <i>“I’m gettin’ heaps better at this blowjob business.”</i> She winks. <i>“Wanna see how good I can get?”</i>",
        "You nod, still catching your breath. <i>“Right then.”</i> She cups your face in her hands, thumbs tracing your cheekbones, and kisses you properly this time, her tongue darting in to taste you.",
        "She pulls back just enough to look you over. <i>“You’re lookin’ a bit knackered, mate.”</i> She ruffles your hair again, softer now. <i>“I’ll give ya a breather. A short one.”</i>",
        "The haze slowly clears from your head. Steph is still smiling down at you, eyes crinkled at the corners, excitement plain on her face, and you feel yourself stirring again in answer.",
        "<i>“Good,”</i> she coos, noticing. <i>“’Cause I’m only just gettin’ started.”</i>"
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
        "You sit back on your bunk as Steph Irson drops down beside you, wriggling out of her khaki shorts as she goes. Her blonde hair bounces with every move, and her ranger shirt is losing its fight with her chest.",
        "<i>“C’mere, you,”</i> she teases with a sly grin, and starts tugging your gear open. She leans in close, breath warm on your chest, eyes sparkling. <i>“Not bad for someone who sits in a cockpit all day.”</i>",
        "You laugh. <i>“I’m feeling pretty good myself,”</i> you reply, running a hand down her bare side.",
        "Steph shivers and arches into your touch. When your fingers find a soft spot low on her back, her voice jumps half an octave. <i>“Ooh, yeah. Right there.”</i>",
        "You press harder and she squirms, and for a moment there’s something almost primal in her eyes. Her tail curls tight around her thigh, its tip starting to swell.",
        "<i>“Ya look like ya could use a hand gettin’ comfy,”</i> she rumbles low in her throat, palming [pc.cock] through what’s left of your clothes. You throb against her hand.",
        "<i>“Yeah, that’d be great,”</i> you manage, trying to keep your voice steady as she works you free.",
        "Her fingers are quick and sure. Once you’re bare, she wraps a hand around the base of [pc.cock] and gives a low, husky laugh. <i>“Oh, now that’s a fine specimen.”</i>",
        "You harden in her grip, hips rocking up into her hand. <i>“Gotta say, I like the way you move,”</i> she hums, and presses a kiss to your base.",
        "Then she pulls back with a mischievous glint, turns around, and drops onto her hands and knees on the bunk. She looks back over her shoulder, rear up, tail swaying out of the way. <i>“Well? Don’t keep a girl waitin’.”</i>",
        "You don’t. You kneel behind her, grab her hips, and guide [pc.cock] to her entrance. She’s already soaked, and she lets out a breathless giggle when your tip presses against her.",
        "One smooth thrust and you sink into her warm, wet depths. Steph gasps loud enough to rattle the bulkhead, her back arching like a drawn bow.",
        "<i>“Oh, bloody hell, yes!”</i> She shoves back against you hard enough to nearly knock you off balance, and then you’re both moving, finding a rhythm that’s more enthusiasm than finesse.",
        "Sweat beads on your brow as you keep up with her. Every thrust pulls a new noise out of her, each less coherent than the last, and her tail lashes against your side.",
        "<i>“Harder, mate. C’mon!”</i> You oblige, fingers digging into her hips, and she answers with a happy, wordless cry.",
        "Her whole body starts to tense, muscles quivering as she grinds back onto you. Then she lets out a loud, primal scream and clenches around you, shuddering through her climax.",
        "The feel of her pushes you right over the edge. You thrust into her one last time and erupt inside her, filling her with your seed.",
        "You collapse together in a sweaty, panting heap. The tension drains out of her bit by bit until she’s boneless against you.",
        "Steph twists around to look up at you, cheeks flushed. <i>“Well,”</i> she sighs happily, <i>“that’s goin’ in the highlight reel.”</i> She nuzzles into your chest.",
        "You hold her close while you both catch your breath."
    ]);
    processTime(30);
    pc.orgasm();
    clearMenu();
    addButton(0, "Next", window.tnStephMenu, "Next", "Back to Steph.");
};

window.tnStephTails = function () {
    clearOutput();
    author("Savin");
    stephHeader(window.tnStephBust(), true);
    window.tnStephSay([
        "Back aboard, Steph barely makes it through your cabin door before she stops dead. Her eyes fix on your [pc.tailCunt], which has slipped out from behind you and is weaving through the air, lips glistening.",
        "<i>“Hang on. Is that a cunt snake?”</i> She drops into a crouch for a closer look, ears straight up. <i>“Oh, that’s a beauty. Ya don’t see a healthy one that size off Mhen’ga. Look at the sheen on it!”</i> For a second she isn’t a horny ranger at all; she’s the Galactic Huntress, narrating to a camera that isn’t there.",
        "Behind her, something else has noticed too. Her cockvine tail rises over her shoulder like a curious eel, its swollen tip turning toward your tail. A bead of sap wells at the slit.",
        "<i>“Oh, no ya don’t,”</i> Steph scolds it, then breaks into a giggle as it strains forward anyway. <i>“Sorry. It’s got a mind of its own. Bit of a one-track mind, honestly.”</i>",
        "Your [pc.tailCunt] answers before you do. It curls toward her, lips parting, and the two tails circle each other in the middle of the cabin, slow and wary, like a pair of courting critters on one of her old shows.",
        "Steph stares, enthralled. <i>“Oh, this is <b>so</b> goin’ in the special,”</i> she breathes. <i>“A wild cunt snake and a cockvine, meetin’ in their natural habitat.”</i> She glances at you and lowers her voice to her best documentary hush. <i>“The male approaches with caution...”</i>",
        "The male does not approach with caution. Her vine lunges, and the head of it slams into your [pc.tailCunt] in one hungry thrust. You both yelp at once: you at the sudden fullness rippling all the way up into your hips, Steph at the hot, wet grip clamping around the most sensitive thing she owns.",
        "<i>“Oh, fuck,”</i> she gasps, knees buckling. She grabs your shoulder to stay upright. <i>“Oh, that’s... that’s not fair, that’s so tight...”</i>",
        "You drag her down onto the bunk with you, and neither of you bothers with anything else. There’s no need; the tails are doing the work. Her vine pumps in long, rolling strokes, and your [pc.tailCunt] milks back at it, wringing every inch with muscles you didn’t know you could flex this way.",
        "Steph ends up sprawled across your chest, face flushed, hips twitching in time with her tail. <i>“Can ya feel that?”</i> she pants. <i>“When it squeezes? Gods. It’s like gettin’ sucked off by a whole ecosystem.”</i>",
        "You can feel all of it. Every pulse of her vine echoes up your tail and down your spine, and the deeper it pushes, the more your tail clutches at it. The two of them knot together over the bunk, coiling around each other so tight you can’t tell where hers ends and yours begins.",
        "<i>“Don’t stop, don’t you dare stop,”</i> Steph whimpers, though it’s hard to say which of you or which tail she means. Her vine swells, the ridges along it fattening inside you.",
        "It goes first. Her tail locks up mid-thrust, and a hot flood of sap pumps into your [pc.tailCunt], so much that it squelches out around the seam. Steph throws her head back and howls, her own climax hitting her a heartbeat behind her tail’s.",
        "Your tail drinks it down greedily, clenching to keep every drop, and that’s what tips you over. Pleasure rolls back up its length and crashes through you, leaving you shaking under her on the bunk.",
        "For a long while, the only sound is the two of you panting. The tails don’t untangle. They stay wrapped around each other, the vine twitching every so often, your [pc.tailCunt] giving a lazy, contented squeeze in answer.",
        "<i>“Well,”</i> Steph mumbles into your chest. <i>“Pretty sure that’s what scientists call a symbiotic relationship.”</i> She lifts her head, grinning and dazed. <i>“Reckon they wanna do that again sometime. Reckon I do too.”</i>",
        "Your tail gives her vine one more squeeze, as if to agree."
    ]);
    processTime(35);
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
