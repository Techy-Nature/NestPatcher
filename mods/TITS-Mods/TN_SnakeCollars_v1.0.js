/* TN Snake Collars for Trials in Tainted Space (v1.0, Modv3.1, checked against 0.9.169).
   Collar the Blue Viper with Urbolg's slave collar, and keep the slavebreaker's own collar
   scene working when the Blue Viper got the collar first.

   - Urbolg (Zheng Shi hangar), once you've met the Blue Viper:
       "Viper Collar"   buys the one-of-a-kind slave collar on his workstation, the same one
                        the game lets you put on yourself. He only moves its registration from
                        him to your codex. 100,000 credits. Once only.
       "Another Collar" once that collar is gone and someone still needs one (the Blue Viper,
                        or the slavebreaker when you haven't started the game's own order for
                        her): he builds another slave collar just like it. Ready 10 hours later,
                        150,000 credits when you fetch it.
     His workstation stays empty for three days after he hands the collar over, so the game's
     own "Collar" / "Slave Collar" buttons wait until he's built himself a new one.
   - The Blue Viper (Cherry's Tap-Hall): "Collar Her" shows whenever you carry one of
     Urbolg's slave collars. The collar does to her what it does to anyone: she cums her brains
     out and calls you Master from then on. She stays in Cherry's wall, but her hypnosis can't
     reach you any more (her obedience count goes back to 0) and she serves you for free:
     "Suck Me" (needs a cock) and "Tongue" (your pussy, or your ass if you have none). Same
     3-hour rest as the game's scenes.
   - The slavebreaker: her "Collar Her" scene is the game's own. It counts Urbolg's slave
     collars as well as the one the game sells you for her, so if the Blue Viper took the
     workstation collar, the next one Urbolg makes works on her.
   - Buy Her (Blue Viper's booth, once she's collared): Cherry sells you her contract for
     50,000 credits and she joins your crew (needs a free crew slot). On the ship she has a
     crew button with Talk, Suck Me, Tongue, Breed Her and Send Away (she waits for you at
     Cherry's, where "Come Aboard" brings her back). She counts toward your crew capacity.
   - Breed Her (needs a cock): on the ship, in the Blue Viper's crew menu and in your
     slavebreaker's (obedience 33+). Each time there's a chance she catches (50% at normal
     fertility, up to 90%; none while you're sterile or on Sterilex). She shows after 3 days, lays one egg at 14 days ("Laying!" in her
     menu, or on her own a day later), and the egg goes to the Tavros nursery. It hatches 14
     days later as a slyveren (naga) child, with emails from Briget. A week's rest after
     laying before she can carry another.
   - Collars carried: the game's slavebreaker collar (bought, not used) plus TN_SNAKE_COLLARS.
     The Blue Viper only takes Urbolg's slave collars, never the slavebreaker's.
   - Flags: TN_SNAKE_COLLARS (slave collars carried), TN_VIPER_COLLARED (1),
     TN_VIPER_COLLARED_TS, TN_VIPER_OLD_OBEDIENCE, TN_VIPER_VISITS, TN_URBY_COLLAR_GIVEN (+ _TS),
     TN_SNAKE_COLLAR_ORDER_TS, TN_SNAKE_COLLARS_MADE, TN_VIPER_BOUGHT (1),
     TN_VIPER_CREW (1 = aboard, 0 = waiting at Cherry's). Eggs, with TN_BV_ for the Blue Viper
     and TN_SB_ for the slavebreaker: PREG_TS, LAID, LAY_TS, EGGS (lay times of eggs still in
     the nursery), HATCHED, SEX_n, BRED.

   Needs TN_SnakeCollars_v1.0.mod (the buttons in the game's menus, the crew list, the
   slavebreaker's Breed Her button and the Stats line).
   Toggle: Android Mods / TN Mod Settings > "Snake Collars". Turned off, the game acts as it
   was written (the Blue Viper's booth is the game's again); every flag is kept for later. */
(function () {
    "use strict";
    if (window.tnSnakeCollar) return;

    var MOD_ID = "TN_SnakeCollars";
    var NAME = "Snake Collars";
    var WORKBENCH_PRICE = 100000;
    var REMAKE_PRICE = 150000;
    var REMAKE_MINUTES = 600;            // the game's slavebreaker collar takes 10 hours too
    var WORKBENCH_BACK_MINUTES = 3 * 24 * 60;
    var REST_MINUTES = 180;              // the game's own BlueViperDisable time
    var BUY_PRICE = 50000;
    var DAY = 1440;
    var GESTATION = 14 * DAY;    // she carries the egg two weeks
    var KNOWN = 3 * DAY;         // when it starts to show
    var LATE = DAY;              // she lays on her own a day after she's due if you're not there
    var INCUBATION = 14 * DAY;   // in the nursery, until it hatches
    var EGG_COOLDOWN = 7 * DAY;  // after laying, before she can carry another

    function P(fn, dflt) { try { var v = fn(); return v === undefined ? dflt : v; } catch (err) { return dflt; } }
    function dbg(msg) {
        try { console.info("[TN] [Snake Collars] " + msg); } catch (e) {}
        try { if (window.tnModMenuActive === true && typeof window.tnDebugLog === "function") window.tnDebugLog("[Snake Collars] " + msg); } catch (e) {}
    }
    function on() {
        return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") ||
            window.isTnModEnabled(MOD_ID);
    }
    function F() { return window.flags; }
    function PC() { return window.pc; }
    function now() { return P(function () { return window.GetGameTimestamp(); }, 0); }
    function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
    function credits(text) { return Number(text).toLocaleString(); }
    function out(text) { window.output(text); }
    function para(text) { window.output("\n\n" + text); }
    function bumpFlag(key) {
        try { window.IncrementFlag(key); } catch (err) { F()[key] = num(F()[key]) + 1; }
    }

    // -----------------------------------------------------------------------------
    // The collar count
    // -----------------------------------------------------------------------------
    function sbGameCollarHeld() {
        var f = F();
        return !!f.SLAVEBREAKER_COLLAR_BOUGHT && !f.SLYV_COLLAR_TS;
    }
    function extra() { return Math.max(0, Math.floor(num(F().TN_SNAKE_COLLARS))); }
    function held() { return (sbGameCollarHeld() ? 1 : 0) + extra(); }
    function viperMet() { return F().BLUE_VIPER_MET !== undefined; }
    function viperIsCollared() { return F().TN_VIPER_COLLARED === 1; }
    function viperNeeds() { return viperMet() && !viperIsCollared(); }
    // The slavebreaker can take one of Urbolg's slave collars once the game has pointed you
    // at Urbolg for her, as long as you haven't started the game's own order for her collar.
    function sbNeeds() {
        var f = F();
        return !!f.SLAVEBREAKER_COLLAR_INTRO && !f.SLYV_COLLAR_TS &&
            !f.SLAVEBREAKER_COLLAR_REQUEST_TS && !f.SLAVEBREAKER_COLLAR_BOUGHT;
    }
    function bought() { return F().TN_VIPER_BOUGHT === 1; }
    function aboard() { return on() && viperIsCollared() && bought() && F().TN_VIPER_CREW === 1; }
    function shipFull() { return P(function () { return window.fullCrew(); }, false); }
    function spot(booth, ship) { return aboard() ? ship : booth; }
    function workbenchGiven() { return F().TN_URBY_COLLAR_GIVEN === 1; }
    function orderTs() { return F().TN_SNAKE_COLLAR_ORDER_TS; }

    // -----------------------------------------------------------------------------
    // Urbolg
    // -----------------------------------------------------------------------------
    function urbolgShow() { P(function () { window.urbolg.showAll(); }); }
    function urbolgBack() {
        P(function () { window.clearMenu(); });
        window.addButton(0, "Next", window.mainGameMenu);
    }

    function urbolgButton(slot) {
        if (!on()) return;
        var pc = PC();
        if (P(function () { return pc.hasSlaveCollar(); }, false)) return;
        var ts = orderTs();
        if (ts !== undefined) {
            if (now() - num(ts) < REMAKE_MINUTES) {
                window.addDisabledButton(slot, "Fetch Collar", "Fetch the Collar", "Urbolg said ten hours. It’s probably not ready yet.");
            } else if (num(pc.credits) >= REMAKE_PRICE) {
                window.addButton(slot, "Fetch Collar", urbolgFetch, "Fetch the Collar", "Pick up the collar Urbolg made you.\n\n<b>Price:</b> " + credits(REMAKE_PRICE) + " Credits");
            } else {
                window.addDisabledButton(slot, "Fetch Collar", "Fetch the Collar", "You can’t afford his asking price for the collar.\n\n<b>Price:</b> " + credits(REMAKE_PRICE) + " Credits");
            }
            return;
        }
        if (!workbenchGiven()) {
            if (viperNeeds()) window.addButton(slot, "Viper Collar", urbolgWorkbench, "Viper Collar", "Ask Urbolg about the slave collar on his workstation. It might be just the thing for a certain blue snake at Cherry’s.");
            return;
        }
        if (held() === 0 && (viperNeeds() || sbNeeds())) {
            window.addButton(slot, "Another Collar", urbolgOrder, "Another Collar", "His workstation collar is spoken for. Ask Urbolg to build you another slave collar just like it.");
        }
    }

    function urbolgWorkbench() {
        window.clearOutput(); urbolgShow(); window.author("Neston");
        var f = F(), pc = PC();
        out("You nod at the oddly mechanical piece of jewelry sitting on his workstation. <i>“That collar of yours. Ever think about putting it on someone who deserves it?”</i>");
        para("Urbolg doesn’t even look up from his work. <i>“Every day. Who’d ye have in mind?”</i>");
        para("You tell him about the blue snake stuck in the wall at Cherry’s, the one with the silver tattoos who talks right into people’s heads.");
        para("<i>That</i> gets him to look up. He barks out a laugh. <i>“Her? Half this station’s been on its knees in front of that snake at one point or another, and the other half’s too scared to walk past her booth. Every one of ’em walks out calling her Mistress.”</i> He scratches his chin with a metal finger. <i>“Nobody tells her no. She won’t like it.”</i>");
        if (f.URBY_COLLAR_FUN !== undefined) para("He squints at you. <i>“And after what it did to ye last time, ye want to snap it on somebody else for a change. Smart. Didn’t think ye had it in ye.”</i>");
        para("<i>“Here’s the thing,”</i> he goes on, picking the collar up and turning it over. <i>“It’s registered t’me. Whoever wears it goes all doe-eyed for ol’ Urbolg, and I don’t need a snake wedged in a wall calling me master. I’ll put it in yer name instead. Same collar, same kick: she’ll be cumming her brains out and calling ye master before she can blink, and she’ll never want to go back. It’s one of a kind, mind. Ye want it, it’ll cost ye.”</i>");
        para("<i>“How much?”</i>");
        para("<i>“" + credits(WORKBENCH_PRICE) + " credits,”</i> he says, setting it back down. <i>“And that’s me being nice.”</i>");
        window.processTime(5);
        window.clearMenu();
        if (num(pc.credits) >= WORKBENCH_PRICE) window.addButton(0, "Pay", urbolgWorkbenchPay, "Pay", "Pay " + credits(WORKBENCH_PRICE) + " credits for the collar.");
        else window.addDisabledButton(0, "Pay", "Pay", "You don’t have " + credits(WORKBENCH_PRICE) + " credits.");
        window.addButton(1, "Not Now", urbolgNotNow, "Not Now", "Maybe later.");
    }
    function urbolgNotNow() {
        window.clearOutput(); urbolgShow(); window.author("Neston");
        out("<i>“Maybe later,”</i> you tell him.");
        para("<i>“It’s not going anywhere,”</i> Urbolg grunts, already turning back to his work. <i>“Unless some idiot puts it on, anyway.”</i>");
        urbolgBack();
    }
    function urbolgWorkbenchPay() {
        window.clearOutput(); urbolgShow(); window.author("Neston");
        var f = F(), pc = PC();
        pc.credits = num(pc.credits) - WORKBENCH_PRICE;
        f.TN_URBY_COLLAR_GIVEN = 1;
        f.TN_URBY_COLLAR_GIVEN_TS = now();
        f.TN_SNAKE_COLLARS = extra() + 1;
        out("You set a credit chit to " + credits(WORKBENCH_PRICE) + " and drop it into his open palm. It vanishes into his apron.");
        para("Urbolg pulls a hand-sized computer out of another pocket, taps at it, and plugs a thin cable into the collar. Your codex chirps. A new device is asking to pair with it, and its name is just a string of numbers. <i>“Say yes,”</i> he tells you, and you do. The collar’s little readout flickers from his name to yours.");
        para("He doesn’t touch anything else on it. <i>“There. Same collar it always was, just answers to you now.”</i> He presses it into your hands. <i>“It’ll size itself once it’s on her, hood and all. Snap it shut and don’t let go till it clicks. And ye break it, don’t come crying to me.”</i>");
        para("You stow the collar away with the rest of your gear. <b>You have Urbolg’s slave collar.</b>");
        window.processTime(15);
        dbg("workbench collar bought");
        urbolgBack();
    }
    function urbolgOrder() {
        window.clearOutput(); urbolgShow(); window.author("Neston");
        var f = F();
        var forViper = viperNeeds();
        out("<i>“I need another collar,”</i> you tell Urbolg.");
        para("He sets his wrench down very slowly. <i>“Another one.”</i>");
        if (forViper && f.SLYV_COLLAR_TS) para("<i>“The slavebreaker’s got hers. Now I need one for the snake at Cherry’s.”</i>");
        else if (forViper) para("<i>“For the snake at Cherry’s.”</i>");
        else para("<i>“The last one went around the snake at Cherry’s. The slavebreaker still needs hers.”</i>");
        para("<i>“Building yerself a little zoo, are ye?”</i> He snorts and drags a box of parts across his workstation. <i>“Fine. I’ll build ye another slave collar, same as the one ye took off me. Proper materials, me time, and insurance that I’m not catching heat for whatever ye’re doing with ’em. I’ve got the pattern now, so call it a hundred fifty thousand. Come back in ten hours.”</i> He waves you off and starts sorting links.");
        f.TN_SNAKE_COLLAR_ORDER_TS = now();
        window.processTime(5);
        dbg("collar ordered");
        urbolgBack();
    }
    function urbolgFetch() {
        window.clearOutput(); urbolgShow(); window.author("Neston");
        var f = F(), pc = PC();
        pc.credits = num(pc.credits) - REMAKE_PRICE;
        delete f.TN_SNAKE_COLLAR_ORDER_TS;
        f.TN_SNAKE_COLLARS = extra() + 1;
        bumpFlag("TN_SNAKE_COLLARS_MADE");
        out("<i>“Is it ready?”</i>");
        para("Urbolg drops a new collar on the workstation in front of you. It’s a perfect twin of the slave collar that used to sit there: the same oddly mechanical band, the same little readout. <i>“Registered t’yer codex already. Money first.”</i>");
        para("You pay him " + credits(REMAKE_PRICE) + " credits and he lets you take it. <b>You have a new slave collar.</b>");
        window.processTime(3);
        dbg("collar fetched");
        urbolgBack();
    }

    function workbenchGone() {
        if (!on() || !workbenchGiven()) return false;
        return now() - num(F().TN_URBY_COLLAR_GIVEN_TS) < WORKBENCH_BACK_MINUTES;
    }
    function workbenchGoneButton(slot) {
        window.addDisabledButton(slot, "Collar", "Collar", "The collar that used to sit on his workstation is yours now. Urbolg grumbles that he’s building himself a new one.");
    }

    // -----------------------------------------------------------------------------
    // The Blue Viper
    // -----------------------------------------------------------------------------
    function viperShow() {
        P(function () { window.showBust("WALL_SLYVEREN"); });
        P(function () { window.showName("Blue Viper"); });
        window.author("Neston");
    }
    function viperCollared() { return on() && viperIsCollared(); }

    function viperButton(slot) {
        if (!on() || viperIsCollared() || extra() < 1) return;
        window.addButton(slot, "Collar Her", viperCollarScene, "Collar Her", "Snap one of Urbolg’s slave collars around her neck. She stays in Cherry’s wall, but she’d be yours. <b>This is a hard-hearted thing to do.</b>");
    }

    function takeCollarForViper() {
        var f = F();
        if (extra() > 0) { f.TN_SNAKE_COLLARS = extra() - 1; return true; }
        return false;
    }

    function viperCollarScene() {
        window.clearOutput(); viperShow();
        var f = F(), pc = PC();
        var thrall = num(f.BLUE_VIPER_OBEDIENCE) >= 3;
        if (!takeCollarForViper()) { window.mainGameMenu(); return; }
        out("You take out the collar and let her see it.");
        para("The slyveren’s hood flares wide. For a heartbeat those sapphire eyes are only curious, then they narrow to slits. <i>“And what,”</i> she asks, sweet as syrup, <i>“is that?”</i>");
        para("She doesn’t wait for an answer. Pressure slides into the back of your skull, warm and heavy, the same gentle willpower that’s pulled you into this booth before. <i>Put that down, dear. You don’t want to do that.</i>");
        if (thrall) {
            para("Your fingers twitch open. Of course you don’t want to do this. She’s your Mistress. She’s always been your Mistress, and a good slave doesn’t... a good slave doesn’t...");
            para("You bite the inside of your cheek hard enough to taste copper. The sting cuts through the honey in your head for one second, and one second is all you need. You lunge before she can pull you back under.");
        } else {
            para("You grit your teeth. The pull is strong, but you’ve felt it before, and you know what it feels like now. That helps. You step in close before she can push harder.");
        }
        para("She’s wedged into Cherry’s wall from the waist down, so there’s nowhere for her to go. She jerks her head back and you follow it, sliding the band under the flare of her hood and around her throat. It clicks shut. The collar sizes itself to the thick column of her neck, settles against her scales, and its little readout lights up with your name.");
        para("The pressure in your head shuts off like a cut wire.");
        para("The slyveren’s eyes go wide. Her whole body locks up, from the flare of her hood down to wherever her tail ends inside the wall, and a long, broken moan spills out of her, the first sound you’ve ever heard her make out loud that wasn’t a purr. She shudders, then shudders again, heavy breasts heaving and claws scraping at the padding, while the collar does exactly what Urbolg said it would. She cums, and keeps cumming, until she’s slumped forward in her alcove, panting, with her hood folded flat.");
        para("When she lifts her head, the haughty glitter in those sapphire eyes is gone. What’s left looks at you like you’re the only thing in the Tap-Hall. <i>“Oh,”</i> she breathes. <i>“Oh, Master. Forgive me. I didn’t know it was you.”</i>");
        para("Your codex has a new entry. The collar’s owner reads <i>Steele</i>. She stays right where she is; Cherry owns the wall, after all, and the Tap-Hall’s other customers still pay. You don’t. Her mouth is yours whenever you want it, and she wouldn’t dream of pushing on your mind again.");
        para("<b>The Blue Viper wears your collar.</b>");
        f.TN_VIPER_COLLARED = 1;
        f.TN_VIPER_COLLARED_TS = now();
        if (f.BLUE_VIPER_OBEDIENCE !== undefined) f.TN_VIPER_OLD_OBEDIENCE = f.BLUE_VIPER_OBEDIENCE;
        f.BLUE_VIPER_OBEDIENCE = 0;
        P(function () { pc.addHard(10); });
        window.processTime(10);
        dbg("Blue Viper collared");
        window.clearMenu();
        window.addButton(0, "Next", window.mainGameMenu);
    }

    function viperBooth() {
        if (bought()) return viperBoothBought();
        window.clearOutput(); viperShow();
        var f = F(), pc = PC();
        var first = f.TN_VIPER_VISITS === undefined;
        bumpFlag("TN_VIPER_VISITS");
        out("Domiciled in her clean, cozy alcove is the blue and silver slyveren, and around her throat, right below the flare of her hood, sits your collar. Its little readout pulses whenever your codex comes near. The argent patterns on her scales still glow, the red light of the Tap-Hall still slides right off her, and she’s still one of the most beautiful things on Zhèng Shi. But when she sees you now, nothing tugs at the back of your mind. Her hood lifts and her whole face lights up.");
        if (first) {
            para("<i>“Master.”</i> Her voice comes only from her lips now, low and rich and a little breathless. <i>“Do you know how many people have stood where you’re standing? Hundreds. And every one of them left calling me Mistress.”</i> She touches the collar with one claw, almost reverently. <i>“And now I have one of my own. I should be furious. I can’t remember how.”</i>");
            para("<i>“Are you all right?”</i>");
            para("<i>“I have never been better.”</i> A forked tongue flicks out over her plush lips. <i>“I am also hungry, and I would very much like my master to feed me. What will it be?”</i>");
        } else {
            para(pick([
                "<i>“Master,”</i> she purrs, and it’s only a purr. <i>“Have you come to feed me, or only to let me look at you?”</i>",
                "Her hood flares in greeting. <i>“Master. I was beginning to think you’d forgotten me.”</i> She strokes the collar with one claw. <i>“I think about you every time it warms up.”</i>",
                "<i>“Ah, there you are.”</i> She stretches as far as the wall allows, heavy breasts swaying. <i>“The other customers are so dreadfully boring now. None of them are you. Use me, Master, please.”</i>"
            ]));
        }
        window.processTime(2);
        viperMenu();
    }
    function viperMenu() {
        var pc = PC();
        window.clearMenu();
        if (P(function () { return pc.hasCock(); }, false)) window.addButton(0, "Suck Me", viperSuck, "Suck Me", "Have her take your cock. She does it your way now.");
        else window.addDisabledButton(0, "Suck Me", "Suck Me", "You need a cock for this.");
        var tongueTip = P(function () { return pc.hasVagina(); }, false) ? "Have that long, grooved tongue on your [pc.pussiesLight]." : "Have that long, grooved tongue on your [pc.asshole].";
        window.addButton(1, "Tongue", viperTongue, "Tongue", tongueTip);
        if (!bought()) {
            if (shipFull()) window.addDisabledButton(2, "Buy Her", "Buy Her", "You don’t have room for another crew member on your ship.");
            else if (num(pc.credits) < BUY_PRICE) window.addDisabledButton(2, "Buy Her", "Buy Her", "Cherry won’t let her go for less than " + credits(BUY_PRICE) + " credits.\n\n<b>Price:</b> " + credits(BUY_PRICE) + " Credits");
            else window.addButton(2, "Buy Her", buyHer, "Buy Her", "Ask Cherry what it would take to bring the Blue Viper aboard your ship as crew.\n\n<b>Price:</b> " + credits(BUY_PRICE) + " Credits");
        } else {
            if (shipFull()) window.addDisabledButton(2, "Come Aboard", "Come Aboard", "You don’t have room for her on your ship right now.");
            else window.addButton(2, "Come Aboard", comeAboard, "Come Aboard", "Take her back to your ship.");
        }
        window.addButton(14, "Leave", viperLeave, "Leave", bought() ? "Leave her to wait for you." : "Leave her to the other customers.");
    }
    function viperLeave() {
        window.clearOutput(); viperShow();
        out("You give her collar a little tap and turn to go.");
        para("<i>“Leaving so soon?”</i> she calls after you, and the disappointment in it is real. <i>“Come back soon, Master. I’ll be right here.”</i>");
        window.processTime(1);
        window.clearMenu();
        window.addButton(0, "Next", window.mainGameMenu);
    }
    function rest() {
        var pc = PC();
        P(function () {
            if (!pc.hasStatusEffect("BlueViperDisable")) pc.createStatusEffect("BlueViperDisable");
            pc.setStatusMinutes("BlueViperDisable", REST_MINUTES);
        });
    }

    function viperSuck() {
        window.clearOutput(); viperShow();
        var pc = PC();
        var c = P(function () { return pc.smallestCockIndex(); }, 0);
        out(P(function () { return pc.isCrotchExposed(); }, false) ? "Your [pc.cock " + c + "] is already out" : "You free your [pc.cock " + c + "]");
        out(", and her nostrils flare the moment it’s in the open air. She doesn’t say a word, but her tongue slides out, long and grooved and glistening, and curls in a slow, hungry question.");
        para("<i>“Slowly,”</i> you tell her.");
        para("<i>“Slowly,”</i> she agrees, eager as a puppy.");
        para("She takes you in one plush-lipped inch at a time, sapphire eyes on yours the whole way down. Her mouth is hot and wet and almost unbearably soft, her tongue wrapping around your shaft like a living sleeve. When she gets greedy and tries to swallow you all at once, you rest two fingers on her collar and she stops dead, then goes back to that maddening, careful pace with a muffled huff through her nose.");
        para("It’s a different woman sucking you off. No voice in your head telling you what you want, no warm pull dragging your hips forward. Just the sounds she makes, the wet sway of her heavy breasts against " + spot("the edge of the alcove", "your thighs") + ", and a throat that ripples and pulls around your [pc.cockHead " + c + "] while she hums. She’s very, very good at this, and she wants nothing more than to make you feel it.");
        para("When you’re close you tell her so, and she sinks down to the root and stays there, her hood fanned wide and her throat milking you in long, slow waves. You cum with a groan, " + (P(function () { return pc.cumQ(); }, 0) >= 1000 ? "a flood of [pc.cum] that swells her belly " + spot("against the wall’s padding", "out over her coils") + " while she gulps it down without spilling a drop" : "and she drinks every pulse of [pc.cum] like it’s the best thing she’s tasted all week") + ".");
        para("She pulls off with a soft pop and licks her lips clean, very slowly, while you watch. <i>“There,”</i> she says, glowing. <i>“Was that slow enough for you, Master?”</i>");
        bumpFlag("BLUE_VIPER_SUCKED");
        bumpFlag("TN_VIPER_SUCKED");
        window.processTime(25);
        P(function () { pc.orgasm(); });
        if (!aboard()) rest();
        window.clearMenu();
        window.addButton(0, "Next", window.mainGameMenu);
    }

    function viperTongue() {
        window.clearOutput(); viperShow();
        var pc = PC();
        var pussy = P(function () { return pc.hasVagina(); }, false);
        out("<i>“Not your mouth today,”</i> you tell her. <i>“Your tongue.”</i>");
        para("Her hood twitches. <i>“My tongue is for cocks, Master. It always has been.”</i>");
        para("You reach out and touch her collar. She shivers from hood to hips.");
        para("<i>“...My tongue is for whatever my master likes,”</i> she breathes, already leaning in.");
        if (pussy) {
            para("You " + (P(function () { return pc.isCrotchExposed(); }, false) ? "step" : "strip and step") + " in close and brace a hand " + spot("on the wall above her head", "on top of her hood") + ". That long, grooved tongue slides out and drags up the length of your [pc.pussy] in one slow lick, and you have to grab " + spot("the edge of the alcove", "the nearest bulkhead") + ". It’s longer than you thought, longer than you’d think possible, and when she slides it inside, it just keeps going, curling and flicking against places nobody ever reaches.");
            para("For someone who claims she only likes cocks, she learns fast. She finds your [pc.clit] with the tip and circles it while the rest of her tongue works deep inside you, and when your knees start to shake she makes a pleased little noise against your folds. You cum hard, [pc.girlCum] slicking her chin while she laps at you right through it, and you don’t stop her until your legs won’t hold you up any more.");
        } else {
            para("You " + (P(function () { return pc.isCrotchExposed(); }, false) ? "turn" : "strip and turn") + " around and brace your hands on your knees. Her breath is warm on your [pc.butt] for a moment, then that long, grooved tongue slides between your cheeks and laps slowly across your [pc.asshole]. You shiver. She does it again, and again, then presses the tip in and keeps going, and going, until she’s curling and flicking deep inside you in a way no tongue has any right to.");
            if (P(function () { return pc.hasCock(); }, false)) para("When she finds your prostate she makes a pleased little noise and presses right on it, over and over, until you’re leaking all over " + spot("the floor of the booth", "the deck") + ". You cum without anyone touching your [pc.cocksLight], [pc.cum] spattering " + spot("the padding below her", "her coils") + " while she laps at you right through it.");
            else para("She works you open with slow, patient strokes, curling and pressing until you’re shaking, and when you finally cum it’s with a gasp " + spot("that turns heads three booths down", "that echoes down the corridor") + ". She keeps licking right through it until you have to pull away.");
        }
        para("When you finally straighten up, she’s licking her lips and gazing up at you like you hung the stars. <i>“Come back soon, Master,”</i> she says, and she means every word.");
        bumpFlag("TN_VIPER_TONGUED");
        window.processTime(25);
        P(function () { pc.orgasm(); });
        if (!aboard()) rest();
        window.clearMenu();
        window.addButton(0, "Next", window.mainGameMenu);
    }

    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

    // -----------------------------------------------------------------------------
    // Buying her, and the Blue Viper as crew
    // -----------------------------------------------------------------------------
    function cherryShow() {
        P(function () { window.cherry.showAll(); });
        P(function () { window.showName("Cherry"); });
        window.author("Neston");
    }
    function buyHer() {
        window.clearOutput(); cherryShow();
        out("You catch Cherry’s eye across the Tap-Hall and nod at the blue slyveren’s alcove. She takes her time coming over.");
        para("<i>“Something wrong with my snake?”</i> she asks, then looks at the collar, then at you. <i>“Ah. You’re the one. Half my regulars have been crying into their drinks since she stopped taking their heads apart.”</i>");
        para("<i>“I want to take her off your hands,”</i> you tell her. <i>“Aboard my ship. As crew.”</i>");
        para("Cherry snorts. <i>“She was the best earner on that wall, you know. Then you put a leash on her and now she’s just a very pretty snake who gives very good head.”</i> She taps a long nail against her chin. <i>“" + credits(BUY_PRICE) + " credits and she’s yours, contract and all. I’ll even throw in the cushion.”</i>");
        window.processTime(5);
        window.clearMenu();
        window.addButton(0, "Pay", buyHerPay, "Pay", "Pay Cherry " + credits(BUY_PRICE) + " credits for the Blue Viper’s contract.");
        window.addButton(1, "Not Now", function () {
            window.clearOutput(); cherryShow();
            out("<i>“Maybe later.”</i>");
            para("<i>“She’s not going anywhere,”</i> Cherry says, already heading back to the bar. <i>“Literally.”</i>");
            window.clearMenu();
            window.addButton(0, "Next", window.mainGameMenu);
        }, "Not Now", "Maybe later.");
    }
    function buyHerPay() {
        window.clearOutput(); cherryShow();
        var f = F(), pc = PC();
        pc.credits = num(pc.credits) - BUY_PRICE;
        f.TN_VIPER_BOUGHT = 1;
        f.TN_VIPER_BOUGHT_TS = now();
        f.TN_VIPER_CREW = 1;
        out("You transfer the credits. Cherry checks her codex, smiles, and raps twice on the wall beside the alcove. Somewhere on the other side, a latch clanks open.");
        viperShow();
        para("The Blue Viper comes out of the wall a coil at a time. There’s a lot more of her than you ever saw from the front: sapphire scales and silver patterns, long and thick and glistening under the red lights, until she’s pooled in front of you and rising up to look you in the eye. Her hood flares, then folds, and she bows her head until your collar is right under your hand.");
        para("<i>“Master,”</i> she says softly. <i>“You bought me.”</i>");
        para("<i>“I did.”</i>");
        para("She doesn’t say anything else. She doesn’t need to. She just follows you out of the Tap-Hall, her tail never more than a few inches from your heels, all the way back to your ship. By the time you’ve shown her the spare bunk she’s already wrapped herself around it like she’s lived there for years.");
        para("<b>The Blue Viper has joined your crew.</b>");
        window.processTime(30);
        dbg("Blue Viper bought and aboard");
        window.clearMenu();
        window.addButton(0, "Next", window.mainGameMenu);
    }
    function viperBoothBought() {
        window.clearOutput(); viperShow();
        if (aboard()) {
            out("The Blue Viper’s old alcove is empty, the padding wiped clean. She’s on your ship.");
            window.clearMenu();
            window.addButton(0, "Next", window.mainGameMenu);
            return;
        }
        out("The Blue Viper is curled up on a cushioned bench beside her old alcove, coils piled high and collar glinting in the red light. Cherry’s regulars give her a wide berth. The moment she sees you, her hood lifts and she sits up straight.");
        para("<i>“Master! Have you come to take me home?”</i>");
        window.processTime(2);
        viperMenu();
    }
    function comeAboard() {
        window.clearOutput(); viperShow();
        F().TN_VIPER_CREW = 1;
        out("<i>“Come on,”</i> you tell her. <i>“We’re going back to the ship.”</i>");
        para("She’s off the bench before you finish the sentence, sliding along beside you with her tail curled around your ankle. <i>“I missed you, Master. Cherry’s customers are so terribly dull.”</i>");
        window.processTime(15);
        dbg("Blue Viper back aboard");
        window.clearMenu();
        window.addButton(0, "Next", window.mainGameMenu);
    }

    function crewCount() { return aboard() ? 1 : 0; }
    function crewBlurb(slot) {
        if (!aboard()) return "";
        window.addButton(slot, "Blue Viper", crewApproach, "Blue Viper", "Visit your collared slyveren.");
        return "\n\n" + pick([
            "The Blue Viper has claimed the warmest corner of the ship. She’s coiled up in a nest of cushions with your collar glinting at her throat, watching the door for you.",
            "Every so often you catch a flash of sapphire scales in a doorway. The Blue Viper likes to know where her master is.",
            "The Blue Viper is sunning herself under a heat lamp she talked someone into installing, coils draped over half the room."
        ]);
    }
    function crewApproach() {
        window.clearOutput(); viperShow();
        out(pick([
            "You find the Blue Viper wrapped around her bunk, coils stacked three high and her chin resting on the top one. The moment she sees you, her hood flares and she uncoils in a long, glittering rush. <i>“Master.”</i>",
            "The Blue Viper is reading something on a borrowed datapad, her tail tip flicking idly. She drops it the second you step in. <i>“Master! I was just thinking about you.”</i>",
            "The Blue Viper slides up to meet you before you’re halfway through the door, curling a loop of tail around your waist. <i>“What does my master need?”</i>"
        ]));
        if (due("bv")) para("Her middle is round and heavy, and she keeps curling her tail protectively around it. <i>“It’s coming, Master. Today, I think. Stay with me?”</i>");
        else if (showing("bv")) para("There’s a soft, rounded swell low on her belly now, and she keeps one hand resting on it like she’s afraid it might wander off.");
        window.processTime(1);
        crewMenu();
    }
    function crewMenu() {
        var pc = PC();
        window.clearMenu();
        window.addButton(0, "Talk", crewTalk, "Talk", "Chat with her.");
        if (P(function () { return pc.hasCock(); }, false)) window.addButton(1, "Suck Me", viperSuck, "Suck Me", "Have her take your cock.");
        else window.addDisabledButton(1, "Suck Me", "Suck Me", "You need a cock for this.");
        window.addButton(2, "Tongue", viperTongue, "Tongue", P(function () { return pc.hasVagina(); }, false) ? "Have that long, grooved tongue on your [pc.pussiesLight]." : "Have that long, grooved tongue on your [pc.asshole].");
        breedButton("bv", 3, function () { window.mainGameMenu(); });
        window.addButton(10, "Send Away", sendAway, "Send Away", "Tell her to wait for you at Cherry’s Tap-Hall on Zhèng Shi. You can pick her up there later.");
        window.addButton(14, "Back", window.mainGameMenu);
    }
    function crewTalk() {
        window.clearOutput(); viperShow();
        var talks = [
            ["<i>“Do you miss the wall?”</i> you ask.",
             "She considers it, tongue flicking. <i>“I miss being worshipped,”</i> she admits. <i>“Hundreds of them, all on their knees. But they only worshipped me because I made them.”</i> She touches her collar. <i>“You came back after I couldn’t make you do anything at all. That’s worth more.”</i>"],
            ["<i>“How are you finding the ship?”</i>",
             "<i>“Cramped,”</i> she says at once. <i>“There is nowhere to stretch out properly, the floors are cold, and your crew keeps stepping on my tail.”</i> Her hood lifts. <i>“I love it. Don’t you dare sell me back.”</i>"],
            ["<i>“What did you do before Cherry’s?”</i>",
             "<i>“This and that,”</i> she says airily. <i>“Mostly that.”</i> When you keep looking at her she sighs. <i>“A slyveren with a voice like mine doesn’t need a job, Master. People simply gave me things. Cherry was the first one clever enough to put me somewhere I couldn’t walk away from.”</i> A forked tongue flicks out. <i>“And now you’ve done the same. I seem to have a type.”</i>"]
        ];
        var t = pick(talks);
        out(t[0]);
        para(t[1]);
        window.processTime(10);
        crewMenu();
    }
    function sendAway() {
        window.clearOutput(); viperShow();
        F().TN_VIPER_CREW = 0;
        out("<i>“I need the room aboard for a while,”</i> you tell her. <i>“Wait for me at Cherry’s.”</i>");
        para("Her hood droops, but she doesn’t argue. <i>“Yes, Master. Don’t leave me there too long. The customers will think I’m available.”</i> She gathers up her cushions and slithers off the ship.");
        window.processTime(5);
        dbg("Blue Viper sent to Cherry's");
        window.clearMenu();
        window.addButton(0, "Next", window.mainGameMenu);
    }

    // -----------------------------------------------------------------------------
    // Eggs: breeding both vipers, eggs to the Tavros nursery
    // -----------------------------------------------------------------------------
    // Webpack modules in main.js (0.9.169): 36956 = ChildManager (kd), 66376 = Child (U),
    // 31317 = StatTracking (s). Same ones TN_ShekkaEggs uses.
    var gameModules = {};
    function gameModule(id) {
        if (gameModules[id]) return gameModules[id];
        var chunks = window.webpackChunktits_html || self.webpackChunktits_html;
        if (!chunks || typeof chunks.push !== "function") return null;
        var req = null;
        chunks.push([["tn-snake-eggs-" + id + "-" + Date.now()], {}, function (r) { req = r; }]);
        if (typeof req !== "function") return null;
        try { gameModules[id] = req(id); } catch (err) { return null; }
        return gameModules[id];
    }
    var MOTHERS = {
        bv: { key: "TN_BV_", name: "the Blue Viper", Name: "The Blue Viper", short: "Blue Viper", tag: "blue viper" },
        sb: { key: "TN_SB_", name: "your slavebreaker", Name: "Your slavebreaker", short: "slavebreaker", tag: "slavebreaker" }
    };
    function fk(m, k) { return MOTHERS[m].key + k; }
    function fnum(m, k) { return num(F()[fk(m, k)]); }
    function pregnant(m) { return F()[fk(m, "PREG_TS")] !== undefined; }
    function pregDays(m) { return pregnant(m) ? Math.floor((now() - fnum(m, "PREG_TS")) / DAY) : 0; }
    function due(m) { return pregnant(m) && now() - fnum(m, "PREG_TS") >= GESTATION; }
    function showing(m) { return pregnant(m) && now() - fnum(m, "PREG_TS") >= KNOWN; }
    function cooling(m) { return fnum(m, "LAID") > 0 && now() - fnum(m, "LAY_TS") < EGG_COOLDOWN; }
    function eggs(m) {
        var s = F()[fk(m, "EGGS")];
        if (!s) return [];
        return String(s).split(",").map(Number).filter(function (n) { return isFinite(n) && n > 0; });
    }
    function setEggs(m, list) { F()[fk(m, "EGGS")] = list.length ? list.join(",") : undefined; }
    // The game's own fertility: 0 when Steele is sterile, on Sterilex (Infertile), has the
    // Firing Blanks perk or a cock sock that blocks it. pc.virility() is deprecated in 0.9.169.
    function fertility() {
        return P(function () {
            if (typeof pc.cumQuality !== "function") return 1;
            var v = Number(pc.cumQuality());
            return isFinite(v) ? v : 1;
        }, 1);
    }
    function catchChance() { return Math.min(0.9, 0.5 * Math.max(0, fertility())); }
    function sbCrew() { return P(function () { return window.slyv.isCrew(); }, false); }
    function sbObedience() { return P(function () { return window.slyv.obedience(); }, 0); }
    function hasCock() { return P(function () { return pc.hasCock(); }, false); }
    function breedCock(m) {
        return P(function () {
            if (m === "sb") {
                var i = pc.cockThatFits(window.slyv.vaginalCapacity(0));
                if (typeof i === "number" && i >= 0) return i;
            }
            return pc.biggestCockIndex();
        }, 0);
    }
    function tryCatch(m) {
        if (pregnant(m) || cooling(m)) return false;
        if (Math.random() >= catchChance()) return false;
        F()[fk(m, "PREG_TS")] = now();
        dbg(MOTHERS[m].short + " carrying an egg");
        return true;
    }
    // She lays: the egg goes to the nursery to incubate.
    function sendToNursery(m) {
        if (!pregnant(m)) return;
        var f = F();
        var list = eggs(m);
        list.push(now());
        setEggs(m, list);
        f[fk(m, "LAID")] = fnum(m, "LAID") + 1;
        f[fk(m, "LAY_TS")] = now();
        f[fk(m, "PREG_TS")] = undefined;
        dbg(MOTHERS[m].short + " egg sent to the nursery");
        ensureMail();
    }
    function hatchOne(m, laidTs) {
        var n = fnum(m, "HATCHED") + 1;
        var sex = 3;
        try {
            var cm = gameModule(36956), cl = gameModule(66376);
            if (cm && cm.kd && cl && cl.U && typeof cl.U.NewChild === "function") {
                var race = (window.GLOBAL && window.GLOBAL.TYPE_NAGA !== undefined) ? window.GLOBAL.TYPE_NAGA : 0;
                var c = cl.U.NewChild(race, 1, 1, 45, 45, 10, 0);
                c.BornTimestamp = Math.min(laidTs + INCUBATION, now());
                cm.kd.addChild(c);
                sex = c.NumIntersex > 0 ? 3 : c.NumMale > 0 ? 1 : c.NumFemale > 0 ? 2 : 3;
            }
        } catch (err) { try { console.warn("[Snake Collars] could not add the child to the nursery", err); } catch (e2) {} }
        try {
            var st = gameModule(31317);
            if (st && st.s && typeof st.s.track === "function") {
                st.s.track("pregnancy/" + MOTHERS[m].tag + " sired", 1);
                st.s.track("pregnancy/total sired", 1);
                st.s.track("pregnancy/total day care", 1);
            }
        } catch (err) {}
        F()[fk(m, "SEX_" + n)] = sex;
        F()[fk(m, "HATCHED")] = n;
        dbg(MOTHERS[m].short + " egg hatched (" + n + ")");
    }
    function hatchDue(m) {
        var list = eggs(m), keep = [];
        for (var i = 0; i < list.length; i++) {
            if (now() - list[i] >= INCUBATION) hatchOne(m, list[i]);
            else keep.push(list[i]);
        }
        if (keep.length !== list.length) { setEggs(m, keep); ensureMail(); }
    }
    function eggTick() {
        try {
            if (!on() || typeof window.flags === "undefined" || !window.flags) return;
            ["bv", "sb"].forEach(function (m) {
                // Not there when she's due: she lays on her own and the egg still goes to the nursery.
                if (pregnant(m) && now() - fnum(m, "PREG_TS") >= GESTATION + LATE) sendToNursery(m);
                hatchDue(m);
            });
            ensureMail();
        } catch (err) {}
    }
    setInterval(eggTick, 3000);

    // The "Breed Her" / "Laying!" button, shared by both vipers.
    function breedButton(m, slot, back) {
        if (!on()) return;
        var who = MOTHERS[m];
        if (due(m)) { window.addButton(slot, "Laying!", function () { layScene(m, back); }, "Laying!", who.Name + "’s egg is coming. Be there with her."); return; }
        if (showing(m)) { window.addDisabledButton(slot, "Breed Her", "Breed Her", "She’s carrying your egg. Day " + (pregDays(m) + 1) + " of " + (GESTATION / DAY) + "."); return; }
        if (cooling(m)) { window.addDisabledButton(slot, "Breed Her", "Breed Her", "She laid not long ago. Give her a week before you try again."); return; }
        if (!hasCock()) { window.addDisabledButton(slot, "Breed Her", "Breed Her", "You need a cock to breed her."); return; }
        if (m === "sb" && sbObedience() < 33) { window.addDisabledButton(slot, "Breed Her", "Breed Her", "She isn’t obedient enough to carry your eggs yet."); return; }
        var tip = "Fuck " + who.name + " with every intention of putting an egg in her. Her eggs go to the nursery on Tavros.";
        if (catchChance() <= 0) tip += "\n\n<b>You can’t father anything right now</b> (Sterilex, or you’re sterile), so she won’t catch.";
        window.addButton(slot, "Breed Her", function () { breedScene(m, back); }, "Breed Her", tip);
    }
    function sbShow() { P(function () { window.slyv.header(false); }); }
    function sbBreedButton(slot) {
        if (!on() || !sbCrew()) return;
        breedButton("sb", slot, function () { P(function () { window.slyv.showAll(); }); window.mainGameMenu(); });
    }
    function breedScene(m, back) {
        window.clearOutput();
        var c = breedCock(m);
        if (m === "bv") {
            viperShow();
            out("<i>“I want to breed you,”</i> you tell her.");
            para("The Blue Viper goes very still. Then her hood flares out wider than you’ve ever seen it, and her tail tip starts to tremble. <i>“Master. You want my eggs?”</i> She doesn’t wait for an answer. She’s already uncoiling across her bunk, rolling onto her back and baring the soft blue scales of her belly, her slit already slick and parted. <i>“Then take what’s yours.”</i>");
            para((P(function () { return pc.isCrotchExposed(); }, false) ? "Your [pc.cock " + c + "] is already out and" : "You strip, and your [pc.cock " + c + "] is") + " already hard. You settle between her coils and push in slowly. She’s hot and tight and so wet it’s almost obscene, and her whole length shivers from her hood to her tail as you bottom out. Loops of sapphire scales close around your [pc.legOrLegs] and your waist, not tight, just holding you there where she wants you.");
            para("She whispers to you the whole time. Not the hypnotic croon she used on Cherry’s customers; your collar put an end to that. Just a soft, steady stream of <i>“yes, Master”</i> and <i>“deeper, Master”</i> and <i>“fill me, please, fill me”</i> that gets more ragged with every thrust. When she cums her coils clench all at once and her pussy milks you hard enough to drag you right over the edge with her.");
            para("You bury yourself to the hilt and unload deep inside her. She holds you there through every pulse of [pc.cum], her tail stroking your back, and keeps holding you long after you’re spent. <i>“Stay,”</i> she murmurs. <i>“Just a little longer. Let it take.”</i>");
        } else {
            sbShow();
            out("<i>“Present yourself,”</i> you tell her. <i>“I’m going to breed you.”</i>");
            para("Your slavebreaker’s eyes go wide. " + (sbObedience() < 66 ? "For a moment you see the pirate she used to be behind them, weighing it up, and then she lowers her gaze and sinks to the deck, raising her black-scaled hips for you. <i>“Yes, [slyv.pcTitle].”</i>" : "Her tail lashes once, and she’s already sinking to the deck, coils spread and her black-scaled hips raised for you. <i>“Yes, [slyv.pcTitle]. Please. I want to carry your eggs.”</i>"));
            para((P(function () { return pc.isCrotchExposed(); }, false) ? "Your [pc.cock " + c + "] is already out and" : "You free your [pc.cock " + c + "]") + " hard, and you take her by the hips and sink in to the root in one long push. She hisses through her teeth and clamps down around you, her slit hot and slick and greedy. You take your time with her, long, deep strokes that make her claws scrape across the deck, until she’s panting and begging and her tail is curled tight around your thigh.");
            para("<i>“Cum, [slyv.pcTitle],”</i> she gasps. <i>“Please, in me, all of it.”</i> You give her exactly that. You hilt yourself inside her and empty your [pc.balls] into her womb, and she shudders through her own climax underneath you, milking every last drop of [pc.cum] out of you.");
            para("Afterwards she lies curled on the deck with one hand pressed to her belly and a look on her face you’ve never seen before. Somewhere between proud and nervous.");
        }
        var caught = tryCatch(m);
        P(function () { pc.orgasm(); });
        if (m === "sb") P(function () { window.slyv.orgasm(); });
        window.processTime(45 + Math.floor(Math.random() * 15));
        bumpFlag(fk(m, "BRED"));
        dbg(MOTHERS[m].short + " bred, caught: " + caught);
        window.clearMenu();
        window.addButton(0, "Next", back || window.mainGameMenu);
    }
    function layScene(m, back) {
        window.clearOutput();
        if (m === "bv") {
            viperShow();
            out("You find the Blue Viper coiled tight in a nest she’s built out of every cushion and blanket on the ship, her tail wrapped around something smooth and pale. Her hood lifts the moment she sees you. <i>“Master. You came.”</i>");
            para("You sit with her through the last of it, her head in your lap and her coils squeezing your hand every time her body clenches. It doesn’t take long. When it’s over she uncurls just enough to show you: one big, leathery egg, faintly blue, warm to the touch. <i>“Ours,”</i> she says, sounding astonished.");
        } else {
            sbShow();
            out("Your slavebreaker is curled on her bunk with the blankets dragged into a ring around her, hissing at anyone who comes near. Anyone but you. When you sit down beside her she grabs your hand and doesn’t let go.");
            para("<i>“Don’t look at me like that,”</i> she growls between breaths. <i>“I’m fine. I’m— hhh.”</i> She’s fine. It’s quick and it’s hard and she curses like the pirate she was the whole way through, and at the end of it there’s one big, black-flecked egg lying in the blankets between you. She stares at it for a long time. <i>“Huh,”</i> she says quietly. <i>“[slyv.pcTitle]. Look what we made.”</i>");
        }
        para("The egg goes into a padded transport case from the ship’s stores and off to the nursery on Tavros, where Briget will take care of it until it hatches.");
        sendToNursery(m);
        window.processTime(60);
        window.clearMenu();
        window.addButton(0, "Next", back || window.mainGameMenu);
    }

    // Briget's emails
    function parseText(t) { return typeof window.ParseText === "function" ? window.ParseText(t) : t; }
    function kidWord(m, n) { var s = fnum(m, "SEX_" + n); return s === 1 ? "son" : s === 2 ? "daughter" : "child"; }
    function arriveMail(m, n) {
        var who = MOTHERS[m];
        return {
            content: function () {
                return parseText("Dear [pc.name],\n\n" + (n === 1
                    ? "An egg has arrived at the nursery from " + who.name + ". It is large, warm and very healthy, and it came with no instructions at all, so I looked up everything I could find about slyveren nests and set the incubator to match. It is turned by hand every four hours and I sing to it while I do it.\n\nI will write again the moment it hatches. Expect about two weeks."
                    : "Another egg from " + who.name + " has arrived safely. The incubator was already warm. I will write again when it hatches.") + "\n\nWith love,\n\nBriget");
            },
            subject: n === 1 ? "An egg from " + who.short.replace(/^./, function (c) { return c.toUpperCase(); }) : "Another egg has arrived",
            from: "Briget",
            fromAddress: "Briget@SteeleTech.corp",
            test: function () { return on() && fnum(m, "LAID") >= n; }
        };
    }
    function hatchMail(m, n) {
        var who = MOTHERS[m];
        return {
            content: function () {
                var k = kidWord(m, n);
                var pro = k === "son" ? ["He", "his"] : k === "daughter" ? ["She", "her"] : ["They", "their"];
                return parseText("Dear [pc.name],\n\nThe egg from " + who.name + " has hatched! You have a beautiful, healthy baby " + (k === "son" ? "boy" : k === "daughter" ? "girl" : "child") + ". " + pro[0] + " " + (k === "child" ? "have" : "has") + " " + pro[1] + " mother’s " + (m === "bv" ? "sapphire scales" : "black scales") + " and, I am told, " + pro[1] + " [pc.daddyMommy]’s stubborn streak.\n\nHologram technology was used to emulate you and " + who.name + " so the little one knows their parents’ faces, but please do visit when you can.\n\nWith love,\n\nBriget");
            },
            subject: n === 1 ? who.short.replace(/^./, function (c) { return c.toUpperCase(); }) + "’s egg has hatched!" : "Another hatchling!",
            from: "Briget",
            fromAddress: "Briget@SteeleTech.corp",
            test: function () { return on() && fnum(m, "HATCHED") >= n; }
        };
    }
    function addMail(id, entry) {
        if (window.tnMailHx[id]) return;
        window.tnMailHx[id] = entry;
        if (!window.tnMailMgr.hasEntry || !window.tnMailMgr.hasEntry(id)) window.tnMailMgr.addMailEntry(id, entry);
    }
    function ensureMail() {
        try {
            if (!window.tnMailHx || !window.tnMailMgr) return false;
            var hasF = typeof window.flags !== "undefined" && !!window.flags;
            ["bv", "sb"].forEach(function (m) {
                var laid = hasF ? fnum(m, "LAID") : 0, hatched = hasF ? fnum(m, "HATCHED") : 0;
                for (var i = 1; i <= Math.max(1, laid); i++) addMail("tn_snake_eggs_" + m + "_arrive_" + i, arriveMail(m, i));
                for (var j = 1; j <= Math.max(1, hatched); j++) addMail("tn_snake_eggs_" + m + "_hatch_" + j, hatchMail(m, j));
            });
            return true;
        } catch (err) { return true; }
    }
    if (!ensureMail()) {
        var mailTries = 0;
        var mailTimer = setInterval(function () { if (ensureMail() || ++mailTries >= 300) clearInterval(mailTimer); }, 200);
    }

    // -----------------------------------------------------------------------------
    // The slavebreaker
    // -----------------------------------------------------------------------------
    function slavebreakerHas() { return held() > 0; }
    function slavebreakerUse() {
        if (!on()) return;
        var f = F();
        if (sbGameCollarHeld()) return; // her own collar, the game's normal path
        if (extra() < 1) return;
        f.TN_SNAKE_COLLARS = extra() - 1;
        // Close the game's own "Buy a Collar" path at Urbolg; she has a collar now.
        f.SLAVEBREAKER_COLLAR_BOUGHT = 1;
        f.SLAVEBREAKER_COLLAR_FETCH = 1;
        if (!f.SLAVEBREAKER_COLLAR_REQUEST_TS) f.SLAVEBREAKER_COLLAR_REQUEST_TS = now();
        dbg("slavebreaker collared with a TN collar");
    }

    // -----------------------------------------------------------------------------
    // Stats
    // -----------------------------------------------------------------------------
    function statsLine(text) {
        if (!on() || !viperIsCollared()) return text;
        return String(text).replace(/^Met her/, "Met her, wears your collar" + (bought() ? (F().TN_VIPER_CREW === 1 ? ", on your crew" : ", waiting at Cherry’s") : ""));
    }

    // -----------------------------------------------------------------------------
    // Mod menu
    // -----------------------------------------------------------------------------
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: NAME,
            author: "TN",
            description: "Collar the Blue Viper at Cherry’s Tap-Hall on Zhèng Shi with Urbolg’s slave collar. Buy the one on his workstation (Viper Collar, " + credits(WORKBENCH_PRICE) + " credits) or have him build another just like it (Another Collar, " + credits(REMAKE_PRICE) + " credits, ready in 10 hours), then use Collar Her in her booth. Once she’s collared, Buy Her gets her contract from Cherry (" + credits(BUY_PRICE) + " credits) and she joins your crew. On the ship, Breed Her can give either viper (the Blue Viper or your slavebreaker) an egg, which goes to the nursery on Tavros. The slavebreaker’s own collar scene also takes Urbolg’s slave collars, so she can have the next one if the Blue Viper got the first. Turned off, the game acts as written and your collars are remembered.",
            supportsToggle: true,
            onEnabledChange: function () { return true; }
        });
        return true;
    }
    (function waitForModMenu(tries) {
        if (register()) return;
        if (window.tnModMenuActive === false && tries >= 6) return;
        if (tries < 240) setTimeout(function () { waitForModMenu(tries + 1); }, 500);
    })(0);

    window.tnSnakeCollar = {
        version: "1.0",
        on: on,
        held: held,
        viperCollared: viperCollared,
        viperBooth: viperBooth,
        crewCount: crewCount,
        crewBlurb: crewBlurb,
        viperButton: viperButton,
        urbolgButton: urbolgButton,
        workbenchGone: workbenchGone,
        workbenchGoneButton: workbenchGoneButton,
        slavebreakerHas: slavebreakerHas,
        slavebreakerUse: slavebreakerUse,
        sbBreedButton: sbBreedButton,
        eggTick: eggTick,
        pregnant: pregnant,
        statsLine: statsLine
    };
    dbg("loaded");
})();
