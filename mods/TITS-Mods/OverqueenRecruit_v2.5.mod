Name: Overqueen Recruit
Author: Kitty
Description: Split Mel’Ysolte’s farewell and let you recruit her to the ship.
# v2.1 (2026-10-25): every sex ending (both Mouth scenes and both Body scenes) now offers Continue + Recruit, so taurs (who only get the Mouth scenes without the gates mod) can recruit her too.
# Crew flag, Crew button, and slot count are real. Ship sex is not: it replays the FIRST-14 victory scenes by putting a temporary, unsaved Overqueen in enemy so loadInCunt and the other combat calls have someone to use. She is not a crew creature like Anno. YSOLTE_ON_SHIP only swaps a few station lines while a scene runs.

Replace [content_first14.js]:
\n\n\t<i>“I will ensure that you have safe passage to your vessel, savior [pc.name],”</i> she says clearly, donning her gear. <i>“It is my wish that we meet again, on a better foot... so to speak.”</i>\n\n\tShe’d see you struggling not to laugh, but she’s already gone, vanished into the guts of the station. Rested and extremely satisfied, you pocket the [silly|macguffin you need|ship component], excitement running through you. [rival.name] can’t have gotten far.\n\n\t(<b>Key Item Gained:</b> Plasma Conduit)\n\t"])),e,e)),processTime(20),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,output("\n\n"),O.V.genericVictory()
With:
"])),e,e)),clearMenu(),1===flags.YSOLTE_CREWMEMBER?addButton(0,"Continue",(function(){flags.YSOLTE_SEXED=(flags.YSOLTE_SEXED||0)+1,1!==flags.YSOLTE_ON_SHIP&&(processTime(20),pc.hasKeyItem("Plasma Conduit")||pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.MET_YSOLTE=1,O.V.genericVictory()),window.tnYsolteCabin()}),"Continue","Back to Mel’Ysolte."):addButton(0,"Continue",(function(){t(!0),output(textify((0,x.Z)(["\n\n\t<i>“I will ensure that you have safe passage to your vessel, savior [pc.name],”</i> she says clearly, donning her gear. <i>“It is my wish that we meet again, on a better foot... so to speak.”</i>\n\n\tShe’d see you struggling not to laugh, but she’s already gone, vanished into the guts of the station. Rested and extremely satisfied, you pocket the [silly|macguffin you need|ship component], excitement running through you. [rival.name] can’t have gotten far.\n\t"]))),processTime(20),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,flags.YSOLTE_RECRUIT_ASK=GetGameTimestamp()+15,output("\n\n"),O.V.genericVictory()}),"Continue","She promises you safe passage, then leaves."),(typeof window.tnYsolteEnabled!=="function"||window.tnYsolteEnabled())&&1!==flags.YSOLTE_CREWMEMBER&&addButton(1,"Recruit",(function(){t(!0),output(textify((0,x.Z)(["\n\n\tYou catch her wrist before the gear goes on. <i>“Come with me. There is room on my ship, and I don’t want this to be a goodbye.”</i>\n\n\tMel’Ysolte goes still. The hood lifts a fraction. <i>“Savior [pc.name]. You would berth an Overqueen?”</i>\n\n\t<i>“I would.”</i>\n\n\tHer smile is slow and very pleased. <i>“Then I will not vanish into the station. I will walk you to your vessel, and I will stay. Safe passage is simpler when I am the one beside you.”</i>\n\n\tShe dresses without letting go of your hand. You pocket the [silly|macguffin you need|ship component], excitement running through you. [rival.name] can’t have gotten far, and the Overqueen is no longer a meeting you have to hope for.\n\n\t(<b>Mel’Ysolte will be aboard your ship.</b>)\n\t"]))),processTime(20),pc.createKeyItem("Plasma Conduit"),flags.YSOLTE_SAVED=1,flags.YSOLTE_SEXED=1,flags.MET_YSOLTE=1,flags.YSOLTE_CREWMEMBER=1,output("\n\n"),O.V.genericVictory()}),"Recruit","Ask Mel’Ysolte to come aboard your ship.")

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

Replace [content_first14.js]:
since landing on this miserable station
With:
since [flags.YSOLTE_ON_SHIP|she came aboard your ship|landing on this miserable station]

Replace [content_first14.js]:
You could say this place technically belongs to me, but that doesn’t matter right now.
With:
You could say [flags.YSOLTE_ON_SHIP|this cabin is ours|this place technically belongs to me], but that doesn’t matter right now.

Replace [content_first14.js]:
Technically, this station belongs to me, but that’s not important right now.
With:
[flags.YSOLTE_ON_SHIP|This cabin is yours, and you have given me the run of it|Technically, this station belongs to me], but that’s not important right now.

Replace [content_first14.js]:
slithers from the room, disappearing into the guts of her territory once again
With:
[flags.YSOLTE_ON_SHIP|settles back into her coils on the bunk|slithers from the room, disappearing into the guts of her territory once again]

Replace [content_first14.js]:
You lift yourself from the floor
With:
You lift yourself from the [flags.YSOLTE_ON_SHIP|bunk|floor]

Replace [content_first14.js]:
roster on the rest of the station
With:
roster [flags.YSOLTE_ON_SHIP|from before she came aboard|on the rest of the station]

Replace [content_first14.js]:
remind you this place is technically mine
With:
remind you this [flags.YSOLTE_ON_SHIP|cabin is yours|place is technically mine]

Replace [content_first14.js]:
this place is technically mine but nevermind that
With:
[flags.YSOLTE_ON_SHIP|this cabin is where I stay now|this place is technically mine] but nevermind that

Replace [content_first14.js]:
I sort of own this station
With:
I [flags.YSOLTE_ON_SHIP|have made a nest of this cabin|sort of own this station]

Replace [content_first14.js]:
this room, and this station, belong to me
With:
[flags.YSOLTE_ON_SHIP|this cabin, and this ship, are where I stay|this room, and this station, belong to me]

Replace [content_first14.js]:
in this room there is only you and I
With:
in this [flags.YSOLTE_ON_SHIP|cabin|room] there is only you and I

Replace [content_first14.js]:
journey through the station will be much safer
With:
journey [flags.YSOLTE_ON_SHIP|aboard this ship will be much warmer|through the station will be much safer]

Replace [content_first14.js]:
slithering back into the station’s walls
With:
[flags.YSOLTE_ON_SHIP|coiling up in her nest aboard the ship|slithering back into the station’s walls]

Replace [content_first14.js]:
forced you to land on this station
With:
forced you to [flags.YSOLTE_ON_SHIP|keep her aboard|land on this station]

Replace [content_first14.js]:
The Overqueen departs like a cloth drifting in the wind, the wonder and satisfaction of being awarded such a perfect blowjob still shimmering in your body.
With:
[flags.YSOLTE_ON_SHIP|The Overqueen stays coiled against you on the bunk, the wonder of that blowjob still shimmering in your body.|The Overqueen departs like a cloth drifting in the wind, the wonder and satisfaction of being awarded such a perfect blowjob still shimmering in your body.]

Replace [content_first14.js]:
you will be able to return to your vessel, untouched. Perhaps we will meet again
With:
[flags.YSOLTE_ON_SHIP|you can stay right here. We do not have to stop|you will be able to return to your vessel, untouched. Perhaps we will meet again]

Replace [content_first14.js]:
Sure: moments ago she was trying to clobber you into submission, but look what a little understanding can do for a relationship. 
With:
[flags.YSOLTE_ON_SHIP||Sure: moments ago she was trying to clobber you into submission, but look what a little understanding can do for a relationship. ]

Replace [content_first14.js]:
 And, perhaps, you can think of this as preparation for the future. It doesn’t do well for a champion to be so easily defeated.
With:
[flags.YSOLTE_ON_SHIP|| And, perhaps, you can think of this as preparation for the future. It doesn’t do well for a champion to be so easily defeated.]

Replace [content_first14.js]:
your once-foe’s tongue
With:
your [flags.YSOLTE_ON_SHIP|lover’s|once-foe’s] tongue

Replace [content_first14.js]:
A little, but I fought you off, didn’t I?
With:
[flags.YSOLTE_ON_SHIP|A little.|A little, but I fought you off, didn’t I?]

Replace [content_first14.js]:
 or that she was your enemy...
With:
[flags.YSOLTE_ON_SHIP|| or that she was your enemy...]

Replace [content_first14.js]:
perfect blowjob still shimmering in your body.]\n\n\t(<b>Key Item Gained:</b> Plasma Conduit)\n\t
With:
perfect blowjob still shimmering in your body.]\n\t

Replace [content_first14.js]:
That tongue was wild!\n\n\t(<b>Key Item Gained:</b> Plasma Conduit)\n\n\t
With:
That tongue was wild!\n\n\t

Replace [content_first14.js]:
This detour wasn’t a complete waste of time.\n\n\t(<b>Key Item Gained:</b> Plasma Conduit)\n\t
With:
This detour wasn’t a complete waste of time.\n\t

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
        return;
    }
    if (pc.hasCock()) addButton(0, "Mouth(Cock)", function () { window.tnYsolteRun(window.tnYsolteMouthCock, false); }, "Her Mouth (Cock)", "Her tongue, on your cock, in her cabin.");
    else addDisabledButton(0, "Mouth(Cock)", "Her Mouth (Cock)", "You need a penis for this.");
    if (pc.hasVagina()) addButton(1, "Mouth(Cunt)", function () { window.tnYsolteRun(window.tnYsolteMouthCunt, true); }, "Her Mouth (Cunt)", "Her tongue, on your cunt, in her cabin.");
    else addDisabledButton(1, "Mouth(Cunt)", "Her Mouth (Cunt)", "You need a vagina for this.");
    if (pc.hasCock() && !pc.isTaur()) addButton(2, "Body(Cock)", function () { window.tnYsolteRun(window.tnYsolteBodyCock, false); }, "Her Body (Cock)", "Take her on the bunk.");
    else addDisabledButton(2, "Body(Cock)", "Her Body (Cock)", pc.isTaur() ? "Your body configuration makes this impossible." : "You need a penis for this.");
    if (pc.hasVagina() && !pc.isTaur()) addButton(3, "Body(Cunt)", function () { window.tnYsolteRun(window.tnYsolteBodyCunt, true); }, "Her Body (Cunt)", "Tribadism, in her cabin.");
    else addDisabledButton(3, "Body(Cunt)", "Her Body (Cunt)", pc.isTaur() ? "Your body configuration makes this impossible." : "You need a vagina for this.");
    addButton(4, "Unrecruit", window.tnYsolteUnrecruit, "Unrecruit", "Send her back to the maintenance storage where you met her.");
    addButton(14, "Back", mainGameMenu, "Back", "Leave her to her coils.");
};

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


