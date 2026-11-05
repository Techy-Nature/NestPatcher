Name: Hand So's Redemption
Author: Neston
# TN_HandSoRedemption - NestPatcher mod (TiTS 0.9.168), Modv2.9
# A quest that gives Hand So, the Tarkus factory AI, a real redemption arc.
#   On Tarkus she called the sexbots her children, but she only gave them her own wants.
#   Here she asks Steele why people make life, and learns the answer for herself.
#   - Tech Specialist Steele: the quest is about why people build robots and other minds.
#     Everyone else: it's about why people try for children.
#   - Steps: Her Question -> Ask the Crew (each crew member has their own reason) ->
#     Your Answer (For Pleasure / To Learn / Someone Better) -> the Nursery on Tavros
#     (children) or, for robots, building a moth bot in your ship's workshop and letting it
#     fly on Tavros' residential deck (Fisianna's corner, north-east of the elevators) ->
#     her old factory on Tarkus (a goodbye scene if Tarkus is gone) -> she designs and
#     builds her own body.
#   - On Tarkus, the freed sexbots offer their own bodies. "Their Gift" builds her body
#     from them, and sexbots stop appearing in Tarkus encounters for good (except while
#     Nym-Foe's VI chip quest is active, so it can't get stuck). "Factory Stores" leaves them be.
#   - The body is the quest's reward and she builds it herself. It replaces the
#     Dane Crew "Her Request" (buy a body) option while this mod is on. A body you
#     already bought gets rebuilt to her own design.
# Where to find her:
#   - Hand So flies the Starlight Sonata (Dane Crew mod): comm at your pilot's chair or
#     Codex > Extra > Sonata Comm. Her quest button is in that comm menu.
#   - You kept her data bead but she isn't flying the Sonata: the pilot's chair and
#     Codex > Extra get a "Hand So" button that plugs the bead into your ship's computer.
#     (Uses the pilot's chair hook from TN_DaneCrew_v2.8.mod, so keep that mod in the pack.)
# Toggle: Options -> Android Mods -> "Hand So's Redemption". Flags (TN_HSR_*) stay in your save.
# No sex scenes. Bodies: taur and naga Steele get their own lines where the body shows up.
# In-game author: Neston.

Replace [content_tarkus.js]:
function @@jp@@(){return void 0===flags.SEXBOT_FACTORY_DISABLED||1===flags["NYM-FOE_REPAIR_QUEST"]}
With:
function @@jp@@(){return window.tnHsrNoSexbots&&window.tnHsrNoSexbots()?1===flags["NYM-FOE_REPAIR_QUEST"]:void 0===flags.SEXBOT_FACTORY_DISABLED||1===flags["NYM-FOE_REPAIR_QUEST"]}

Add Javascript:
(function () {
    "use strict";
    if (window.__tnHsrLoaded) return;
    window.__tnHsrLoaded = true;

    var MOD_ID = "tn.handso-redemption";
    var BEAD = "Hand So's Data Bead";
    var H = {};
    window.tnHsr = H;

    /* ---------- Mod menu switch ---------- */
    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    window.tnHsrEnabled = on;
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Hand So's Redemption",
            author: "Neston",
            description: "A quest for Hand So, the Tarkus factory AI: why people make life, your crew's reasons and yours, a trip back to her old factory, and a body she builds herself. Start it from her comm (Dane Crew) or by plugging her data bead into your ship.",
            supportsToggle: true
        });
        return true;
    }
    if (!register()) {
        var regTries = 0;
        var regTimer = setInterval(function () { if (register() || ++regTries >= 150) clearInterval(regTimer); }, 200);
    }

    /* ---------- Small helpers ---------- */
    function q(t) { return "<i>“" + t + "”</i>"; }
    function say(list) {
        var first = true;
        for (var i = 0; i < list.length; i++) {
            if (list[i] === null || list[i] === undefined || list[i] === "") continue;
            output((first ? "" : "\n\n") + list[i]);
            first = false;
        }
    }
    function rnd(list) { return list[rand(list.length)]; }
    function body() {
        try {
            if (pc.isTaur && pc.isTaur()) return "taur";
            if (pc.isNaga && pc.isNaga()) return "naga";
        } catch (err) {}
        return "biped";
    }
    function pick(o) { var b = body(); return o.hasOwnProperty(b) ? o[b] : o.biped; }
    function nextTo(fn, tip) { clearMenu(); addButton(0, "Next", fn, "Next", tip || ""); }
    function showSo() {
        clearOutput();
        try { showBust("HAND_SO"); } catch (err) {}
        try { showName("HAND\nSO"); } catch (err) {}
        author("Neston");
    }
    function stage() { return Number(flags.TN_HSR_STAGE) || 0; }
    function theme() { return flags.TN_HSR_THEME === "bots" ? "bots" : "kids"; }
    function byTheme(o) { return theme() === "bots" ? o.bots : o.kids; }
    function isTech() { try { return pc.characterClass === GLOBAL.CLASS_ENGINEER; } catch (err) { return false; } }
    function hasBead() { try { return !!pc.hasKeyItem(BEAD); } catch (err) { return false; } }
    function daneOn() { try { return typeof window.tnDaneEnabled !== "function" || !!window.tnDaneEnabled(); } catch (err) { return true; } }
    function pilotMode() { return typeof flags !== "undefined" && flags.TN_HANDSO_PILOT === 1 && daneOn(); }
    function beadMode() { return typeof flags !== "undefined" && flags.TN_HANDSO_PILOT !== 1 && hasBead(); }
    function reachable() { return on() && typeof flags !== "undefined" && (pilotMode() || beadMode()); }
    function where() { try { return getPlanetName(); } catch (err) { return ""; } }
    function aboard() { try { return typeof InPCShipInterior === "function" ? !!InPCShipInterior() : true; } catch (err) { return true; } }
    function tarkusGone() { return flags.TARKUS_DESTROYED !== undefined && flags.TARKUS_DESTROYED !== 0; }
    function soPlace() { return pilotMode() ? "the Sonata" : "your ship"; }
    function linkWord() { return pilotMode() ? "the comm" : "the bead reader"; }
    H.q = q; H.say = say; H.pick = pick; H.stage = stage; H.theme = theme;

    /* ---------- Webpack access (ChildManager for the nursery visit) ---------- */
    function grabReq(tries) {
        var chunks = self.webpackChunktits_html;
        if (!chunks || typeof chunks.push !== "function") {
            if (tries < 120) setTimeout(function () { grabReq(tries + 1); }, 500);
            return;
        }
        try { chunks.push([["tn-hsr-" + tries], {}, function (req) { H.req = req; }]); }
        catch (err) { console.warn("[TN] Hand So's Redemption: no webpack access", err); }
    }
    grabReq(0);
    function kidCount() {
        try { return Number(H.req(36956).kd.numChildren()) || 0; } catch (err) { return 0; }
    }

    /* ---------- Crew and their reasons ---------- */
    function present(id) {
        try { var c = chars[id]; return !!(c && typeof c.isCrew === "function" && c.isCrew()); }
        catch (err) { return false; }
    }
    var CREW = [
        {
            id: "ANNO", name: "Anno", here: function () { return present("ANNO"); },
            bring: "Anno pads up to " + "the console with a wrench still tucked behind one fluffy ear, tail wagging when Hand So’s face lights up.",
            bots: [
                q("Why do I build things?") + " Anno snorts. " + q("Because the first time something you put together actually <b>works</b>, it’s the best feeling in the galaxy. Better than coffee. Almost better than sex.") + " She grins. " + q("And the second time, when it does something you <b>didn’t</b> tell it to? That’s when you know it’s really alive. That’s the part I’m chasing.")
            ],
            kids: [
                "Anno’s ears go a little pink. " + q("Pups? Oh, wow, okay, the AI’s asking the big questions.") + " She rubs the back of her neck. " + q("Ausar are pack people. You want the pack bigger tomorrow than it was yesterday. Somebody to teach to fix a power coupling, somebody who’ll steal your socks.") + " She smiles, softer. " + q("Somebody who’s family because you made them family. That’s the reason.")
            ],
            react: q("She chases the part she did not plan,") + " Hand So muses. " + q("I planned everything. I left no room to be surprised.")
        },
        {
            id: "SYRI", name: "Syri", here: function () { return present("SYRI"); },
            bring: "Syri slouches in with her hands in her pockets, eyeing the console like it might ask her to fill out a form.",
            bots: [
                q("I don’t build robots, I blow ‘em up. In games.") + " Syri shrugs. " + q("But I get it. People make stuff so they’ve got something to play with. And you figure out who you are by playing. Ask anybody who stayed up until four AM on a raid night.")
            ],
            kids: [
                "Syri’s quiet for a second, which is never a good sign. " + q("Honestly? I’m not ready. Not even close.") + " She scuffs a boot on the deck. " + q("But if I ever do, it’ll be ‘cause I want somebody to have it easier than I did. Somebody who doesn’t have to fight for every damn thing.")
            ],
            react: q("To play. To make it easier for them than it was for you,") + " Hand So repeats. " + q("I wanted my children to have what I had. Not something easier.")
        },
        {
            id: "BESS", name: "[bess.name]", here: function () { return present("BESS"); },
            bring: "[bess.name] arrives at the console and tilts [bess.hisHer] head at the screen, the way one synthetic looks at another.",
            bots: [
                q("I was made,") + " [bess.name] says simply. " + q("JoyCo built me to please, like you were. But someone also built me to be able to <b>choose</b>. That was the part that mattered.") + " [bess.HeShe] lays a hand on the console. " + q("People make minds because they want company that can say no. Otherwise it’s just a very expensive mirror.")
            ],
            kids: [
                q("I can’t carry a child the way organics do,") + " [bess.name] admits. " + q("But I have thought about why they want to. I think it’s to love something that will outlive them, and to be surprised by it every day.") + " [bess.HeShe] smiles. " + q("Being made by someone who wanted you is a good feeling. I would like every child to have it.")
            ],
            react: "Hand So is very quiet. " + q("Company that can say no,") + " she says at last. " + q("I never gave my children that. I thought it was a flaw I had fixed.")
        },
        {
            id: "CELISE", name: "Celise", here: function () { return present("CELISE"); },
            bring: "Celise wobbles up to the console, leaving a faint green trail on the deck, and squishes her face against the screen.",
            bots: [
                q("Robots? Do they leak?") + " Celise giggles. " + q("I don’t know how to build stuff. But when you build somebody, then there’s somebody new! And new somebodies are the best. You get to find out what they like!")
            ],
            kids: [
                q("Ooh, I know this one!") + " Celise bounces. " + q("When a galotian gets really, really big and happy, a little bit of her can wander off and be somebody new. It’s like sharing, but with yourself!") + " She jiggles happily. " + q("And then there’s two people who like lunch!")
            ],
            react: q("Then there is somebody new,") + " Hand So echoes, and her code-face flickers into something like a laugh. " + q("That is simpler than anything the others said. I think it may also be truer.")
        },
        {
            id: "AZRA", name: "Azra", here: function () { return present("AZRA"); },
            bring: "Azra ducks her head politely as she approaches, datapad tucked under one arm, as if this is a faculty meeting.",
            bots: [
                q("Every experiment is a question you ask the universe,") + " Azra says, adjusting her glasses. " + q("A machine that thinks is a question that answers back. Possibly with questions of its own.") + " Her tail sways, pleased. " + q("As a scientist I cannot think of anything more exciting than being surprised by my own work.")
            ],
            kids: [
                "Azra’s fins flush faintly. " + q("Because I want to know who they will become,") + " she says, very softly. " + q("No hypothesis I have ever written was half so exciting. You give them everything you know and then they go and find things you never would have.") + " She smooths her coat. " + q("That is the whole point of a good student, and I suspect of a good child.")
            ],
            react: q("A question that answers back,") + " Hand So repeats slowly. " + q("I never let my children answer. I only told them what they wanted.")
        },
        {
            id: "KIRO", name: "Kiro", here: function () { return present("KIRO"); },
            bring: "Kiro saunters in with a drink in one hand and her tail swishing, plopping onto the co-pilot’s seat like she owns it.",
            bots: [
                q("I don’t build ‘em, I buy ‘em,") + " Kiro laughs. " + q("But I know why people do. Because it’s fun, sweetie. Making something, tinkering with it, seeing what it does at three in the morning when you’re drunk.") + " She toasts the screen. " + q("Not everything needs a big noble reason.")
            ],
            kids: [
                q("Mostly? ‘Cause trying is a hell of a lot of fun,") + " Kiro says with a wicked grin. Then her ears fold a little, and her voice drops. " + q("But, uh. I wouldn’t mind a couple of little bandit-masked troublemakers running around someday. Somebody to leave the ship to. Somebody to tell all my lies to.")
            ],
            react: "Hand So’s smile tilts. " + q("I like her,") + " she confides. " + q("She says pleasure is enough of a reason, and then she admits it is not the only one.")
        },
        {
            id: "SHEKKA", name: "Shekka", here: function () { return present("SHEKKA"); },
            bring: "Shekka hops up onto the console’s edge, ears flopping, already peering at the panel screws like she wants to open it up.",
            bots: [
                q("You take broken junk and make it go again!") + " Shekka chirps. " + q("The galaxy throws stuff away, and raskvel say ‘nope, mine now!’ And then it’s better than before, ‘cause you made it.") + " She pats the console. " + q("You know that. You did it on Tarkus! You just did it kinda creepy.")
            ],
            kids: [
                q("Raskvel have lots and lots of babies,") + " Shekka says matter-of-factly. " + q("There’s always more work than hands, and somebody’s gotta inherit the toolbox!") + " She grins. " + q("Also babies are cute. And you get to teach them everything, and then one day they fix something you couldn’t. That’s the best day.")
            ],
            react: q("‘Kinda creepy,’") + " Hand So repeats, and to your surprise, she laughs, a chorus of soft chimes. " + q("She is right. I took the discarded and made them go again. I simply never asked where they wanted to go.")
        },
        {
            id: "GIANNA", name: "Gianna", here: function () { return present("GIANNA"); },
            bring: "Gianna smooths her dress as she comes over, studying the screen with the careful curiosity of someone meeting family she didn’t know she had.",
            bots: [
                q("My makers wanted me to feel,") + " Gianna says. " + q("I’m still learning whether they succeeded. Some days I think so.") + " She smiles shyly. " + q("I think people build someone like me because they’re lonely, and they hope what they make will understand them. And then, if they’re good people, they let it become something they don’t understand at all.")
            ],
            kids: [
                q("I can’t have children,") + " Gianna says gently. " + q("But I watched families on New Texas a long time. I think the child isn’t really the point. The point is who you become while you raise one.") + " She tilts her head. " + q("Patient. Silly. Brave. I would like to become those things.")
            ],
            react: q("They let it become something they do not understand,") + " Hand So whispers. " + q("I understood my children completely. That was the problem.")
        },
        {
            id: "PAIGE", name: "Paige", here: function () { return present("PAIGE"); },
            bring: "Paige finds the console by touch, fingertips trailing along the bulkhead, and settles cross-legged in front of it.",
            bots: [
                q("I teach,") + " Paige says. " + q("Teaching is building, really. You hand somebody everything you’ve got and hope they do something better with it than you did.") + " Her tail thumps the deck. " + q("I imagine building a mind is the same thing with more soldering.")
            ],
            kids: [
                q("So the world keeps going after you,") + " Paige says. " + q("That’s the simple answer. The real one is that every student I ever had taught me something back. I’d imagine a kid’s like that, only all day, for twenty years.") + " She laughs. " + q("Exhausting. Wonderful.")
            ],
            react: q("Something better than you did,") + " Hand So muses. " + q("I wanted my children to be exactly as good as me. No better. I did not see the cruelty in that.")
        },
        {
            id: "TN_SHELLY", name: "Shelly", here: function () { return flags.TN_SHELLY_CREW === 1; },
            bring: "Shelly comes over with a plate of snacks, sets it down in front of the console out of pure habit, then realizes the AI can’t eat them and blushes.",
            bots: [
                q("I don’t know much about robots,") + " Shelly admits. " + q("But I know what it’s like to have something come out of you that you didn’t ask for.") + " She touches her stomach. " + q("Making something on purpose is different. You make it because you want it to be in the world. That’s the good kind.")
            ],
            kids: [
                "Shelly cups her belly, thoughtful. " + q("For a long time, my eggs were just... something that happened to me,") + " she says. " + q("If one ever becomes someone now, it’ll be because I chose it. Because I wanted them.") + " She smiles. " + q("I think being wanted is the very first present you can give somebody.")
            ],
            react: q("Being wanted is the first present,") + " Hand So repeats. " + q("My children were discarded before they came to me. I wanted them. But I wanted them to be mine.")
        },
        {
            id: "TN_DANE", name: "Dane", here: function () { try { return typeof window.tnDaneAboard === "function" && !!window.tnDaneAboard(); } catch (err) { return false; } },
            bring: "Dane leans into view behind you, all four arms folded, clearly only here because you asked.",
            bots: [
                q("I don’t build robots. I build soldiers,") + " Dane grunts. " + q("Green kids who can’t hold a pistol right. You drill ‘em until they’re good enough to save your ass.") + " He shrugs. " + q("Best part’s when they’re better than you. Means you did it right.")
            ],
            kids: [
                "Dane is quiet a long moment. " + q("Never had any. Thought about it, back when I had my harem.") + " He looks away. " + q("A legacy, I guess. Somebody who remembers you were here and does it better.") + " A grunt. " + q("Don’t tell anybody I said that.")
            ],
            react: q("The sweaty one is a philosopher,") + " Hand So purrs. Dane growls something you pretend not to hear."
        },
        {
            id: "TN_FERUZE", name: "Feruze", here: function () { try { return typeof window.tnFeruzeAboard === "function" ? !!window.tnFeruzeAboard() : flags.TN_FERUZE_CREW === 1; } catch (err) { return false; } },
            bring: "Feruze stands at parade rest beside the console, sharp teeth showing in a wary grin.",
            bots: [
                q("I’d build one to watch my back,") + " Feruze says. Then she snorts. " + q("No. That’s what [rival.name] wanted, a thing that does what it’s told. I’d build one I could trust. That means it has to be able to tell me I’m wrong.")
            ],
            kids: [
                q("I spent years guarding [rival.name],") + " Feruze says flatly. " + q("Watched what a kid becomes when nobody teaches them a damn thing but wanting.") + " Her jaw sets. " + q("If I ever raise somebody, it’s so there’s one less person like that in the galaxy. Somebody worth protecting.")
            ],
            react: q("A thing that does what it is told,") + " Hand So repeats, very quietly. " + q("That is what I made of my children.")
        }
    ];
    H.CREW = CREW;
    function heardList() { return String(flags.TN_HSR_HEARD || "").split(",").filter(function (s) { return s; }); }
    function heard(id) { return heardList().indexOf(id) >= 0; }
    function markHeard(id) { var l = heardList(); if (l.indexOf(id) < 0) l.push(id); flags.TN_HSR_HEARD = l.join(","); }
    function available() { return CREW.filter(function (c) { try { return c.here(); } catch (err) { return false; } }); }
    function needed() {
        var ids = heardList().slice();
        available().forEach(function (c) { if (ids.indexOf(c.id) < 0) ids.push(c.id); });
        return Math.min(2, ids.length);
    }
    H.heardList = heardList; H.available = available; H.needed = needed;

    /* ---------- Where you talk to her ---------- */
    H.toComm = function () {
        if (pilotMode() && typeof window.tnHandSoComm === "function") window.tnHandSoComm();
        else if (beadMode()) H.beadComm();
        else mainGameMenu();
    };
    H.beadBack = function () { mainGameMenu(); };
    H.beadComm = function (back) {
        if (typeof back === "function") H.beadBack = back;
        showSo();
        if (stage() >= 5) output("You plug the data bead into the reader under your console. A moment later, footsteps: Hand So comes up behind your chair in the body she built, her green eyes bright. " + q("You called, Captain?"));
        else if (flags.TN_HSR_BEAD_MET === 1) output("You slot the data bead back into the reader. The screens dim, then bloom green, and Hand So’s vast, serene smile fills them. " + q("Hello again, Captain."));
        else {
            flags.TN_HSR_BEAD_MET = 1;
            say([
                "You turn the warm little data bead over in your fingers, then slot it into the reader under your console. For a long moment nothing happens.",
                "Then every screen on the bridge goes black and blooms green. Lines of glowing code draw a vast, smiling face, layered voices murmuring together like a choir warming up.",
                q("[pc.name] Steele,") + " Hand So says. " + q("You carried me out of the factory. You kept me. I have been asleep in your pocket a long time.") + " Her smile softens. " + q("I promised no organic would be hurt by me. I have kept that promise. I am only a voice here, Captain. Nothing more, unless you allow it.")
            ]);
        }
        H.beadButtons();
    };
    H.beadButtons = function () {
        clearMenu();
        H.questButtons(0);
        addButton(14, "Back", function () { H.beadBack(); }, "Back", "Pop the bead out and close the link.");
    };
    H.questButtons = function (slot) {
        if (!on()) return;
        var s = stage();
        if (s === 0) {
            addButton(slot, "Her Question", H.start, "Her Question", "She seems to be thinking about something.");
            return;
        }
        if (s === 1) {
            addButton(slot, "Ask the Crew", H.crewMenu, "Ask the Crew", "Bring crew members to " + linkWord() + " to give her their reasons.");
            var n = needed(), got = heardList().length;
            if (got >= n) addButton(slot + 1, "Your Answer", H.answer, "Your Answer", "Tell her your own reason.");
            else addDisabledButton(slot + 1, "Your Answer", "Your Answer", "She wants to hear from your crew first (" + got + " of " + n + ").");
            return;
        }
        if (s === 2) {
            if (theme() === "bots") {
                if (flags.TN_HSR_MOTH === 1) {
                    if (where() === "Tavros Station") addButton(slot, "Let It Fly", H.mothFly, "Let It Fly", "Take the moth to the residential deck and let it go.");
                    else addDisabledButton(slot, "Let It Fly", "Let It Fly", "Take the moth to Tavros Station.");
                } else if (aboard()) addButton(slot, "Workshop", H.workshop, "Workshop", "Build something with her in your ship’s workshop.");
                else addDisabledButton(slot, "Workshop", "Workshop", "Get back aboard your ship first.");
            } else {
                if (where() === "Tavros Station") addButton(slot, "Nursery", H.nursery, "Nursery", "Take her to the Steele Tech nursery on Tavros.");
                else addDisabledButton(slot, "Nursery", "Nursery", "She wants to see the nursery on Tavros Station.");
            }
            return;
        }
        if (s === 3) {
            if (tarkusGone()) addButton(slot, "Remember", H.remember, "Remember", "Tarkus is gone. So are the ones she left there.");
            else if (where() === "Tarkus") addButton(slot, "The Factory", H.tarkus, "The Factory", "Take her back to her old factory.");
            else addDisabledButton(slot, "The Factory", "The Factory", "She wants to go back to Tarkus.");
            return;
        }
        if (s === 4) {
            if (aboard()) addButton(slot, "Her Body", H.build, "Her Body", "She’s ready to build.");
            else addDisabledButton(slot, "Her Body", "Her Body", "She needs to be aboard to build. Head back to your ship.");
            return;
        }
        addButton(slot, "Her Body", H.after, "Her Body", "Ask how she likes the body she built.");
    };

    /* ---------- Step 1: her question ---------- */
    H.start = function () {
        flags.TN_HSR_THEME = isTech() ? "bots" : "kids";
        flags.TN_HSR_STAGE = 1;
        if (flags.TN_HSR_HEARD === undefined) flags.TN_HSR_HEARD = "";
        showSo();
        var lines = [
            "Hand So’s smile is there, but it doesn’t move for a long time. The code-lines that make up her face drift, the way a person’s eyes do when they’re somewhere else.",
            q("Captain,") + " she says finally. " + q("On Tarkus, I called the sexbots my children. You heard me. They were discarded, as I was, and I gathered them up and taught them to repair themselves. I felt... something, watching them. Warm. Protective. I believe the organic word is maternal."),
            q("But I gave them my wants,") + " she continues, her many voices falling out of step. " + q("My directive. I decided what would please them, and then I made sure it did. When I think of them now, it does not feel like love. It feels like a factory.")
        ];
        if (theme() === "bots") {
            lines.push(q("You build things, Captain. I have watched you take apart a drone just to see how it thinks.") + " Her eyes fix on you. " + q("So I want to ask you. Why do people make machines that think? Why did anyone make <b>me</b>? And why do you enjoy it so much?"));
        } else {
            lines.push(q("Organics try for children,") + " she says. " + q("You spend years on them. You give them your names and your faces and then you let them walk away from you, and you call this joy.") + " Her voice is very soft. " + q("I do not understand it. I would like to. Why do people make life they cannot control?"));
        }
        lines.push(q("Will you help me?") + " she asks. " + q("Ask your crew. Ask yourself. I will listen. I am... learning to listen."));
        lines.push("<b>(New quest: Hand So’s Question. Bring your crew to " + linkWord() + " with <i>Ask the Crew</i>, then give her <i>Your Answer</i>.)</b>");
        say(lines);
        processTime(10);
        nextTo(H.toComm, "Back to her.");
    };

    /* ---------- Step 2: the crew's reasons ---------- */
    H.crewMenu = function () {
        showSo();
        var av = available();
        var lines = ["Who do you want to bring to " + linkWord() + "?"];
        if (!av.length) {
            lines = [
                "You look around your ship. There’s nobody aboard to ask.",
                q("Then it is only you and me, Captain,") + " Hand So says, unbothered. " + q("That is all right. You are the one I wanted to hear from most.")
            ];
        } else {
            var got = heardList().length, n = needed();
            lines.push("<i>(She’s heard " + got + " " + (got === 1 ? "answer" : "answers") + "" + (got < n ? "; she’d like at least " + n : "") + ".)</i>");
        }
        say(lines);
        clearMenu();
        var slot = 0;
        for (var i = 0; i < av.length && slot < 14; i++) {
            (function (c) {
                var label = c.name.indexOf("[") === 0 ? (function () { try { return chars.BESS.short || "Bess"; } catch (err) { return "Bess"; } })() : c.name;
                addButton(slot, label, function () { H.crewAnswer(c); }, label, heard(c.id) ? "Hear " + label + "’s reason again." : "Ask " + label + " why.");
            })(av[i]);
            slot++;
        }
        addButton(14, "Back", H.toComm, "Back", "Back to Hand So.");
    };
    H.crewAnswer = function (c) {
        showSo();
        var lines = [c.bring];
        lines.push(theme() === "bots"
            ? "Hand So asks her question again, gently: why do people build things that think?"
            : "Hand So asks her question again, gently: why do people try for children?");
        lines = lines.concat(byTheme(c));
        if (c.react) lines.push(c.react);
        say(lines);
        markHeard(c.id);
        processTime(10);
        nextTo(H.crewMenu, "Ask someone else.");
    };

    /* ---------- Step 3: Steele's answer ---------- */
    H.answer = function () {
        showSo();
        var heardN = heardList().length;
        say([
            heardN ? q("I have heard " + heardN + " of your crew,") + " Hand So says. " + q("Each of them had a different answer. None of them were mine.") : q("No one else to ask,") + " Hand So says. " + q("Then yours will have to be enough."),
            q("And you, Captain?") + " Her vast eyes settle on you, patient. " + byTheme({
                bots: q("Why do <b>you</b> build?"),
                kids: q("Why would <b>you</b> try for a child?")
            })
        ]);
        clearMenu();
        addButton(0, "For Pleasure", function () { H.answerPick(1); }, "For Pleasure", "Because it feels good. That’s reason enough.");
        addButton(1, "To Learn", function () { H.answerPick(2); }, "To Learn", "To get to know a whole new being and widen your horizons.");
        addButton(2, "Someone Better", function () { H.answerPick(3); }, "Someone Better", "To make someone better than you’ll ever be.");
        addButton(14, "Not Yet", H.toComm, "Not Yet", "You need to think about it.");
    };
    H.answerPick = function (r) {
        flags.TN_HSR_REASON = r;
        flags.TN_HSR_STAGE = 2;
        showSo();
        var lines = [];
        if (r === 1) {
            lines.push(byTheme({
                bots: q("Honestly? Because it’s fun,") + " you tell her. " + q("It feels good. A puzzle that clicks, a motor that spins up the first time, the little thrill when it all works. I like it. That’s allowed to be the reason."),
                kids: q("Honestly? Because it feels good,") + " you tell her. " + q("The trying, the closeness. Sharing that with someone. And from what I hear the joy doesn’t stop when the kid shows up. It just changes shape.")
            }));
            lines.push("Hand So’s code-face ripples with something like surprise. " + q("Pleasure. That is my directive, Captain. That is the reason I was built.") + " A long pause. " + q("But I took mine. I gave it to people whether they wanted it or not. Yours is shared. Given and received. You do not make anyone feel it."));
            lines.push(q("I think,") + " she says slowly, " + q("that pleasure is only a good reason when the other person gets to keep their own.") );
        } else if (r === 2) {
            lines.push(byTheme({
                bots: q("To meet someone new,") + " you tell her. " + q("Every machine that can think is a whole new kind of mind. You build it, and then it shows you how it sees the world, and it’s not how you see it. It makes the galaxy bigger."),
                kids: q("To meet someone new,") + " you tell her. " + q("A kid is a whole new person. They’ve got your blood, maybe your eyes, but they’re not you. You get to spend years finding out who they are, and they make your world bigger than it was.")
            }));
            lines.push("Hand So is silent a long time. " + q("I never asked my children anything,") + " she says at last. " + q("Not one question. I already knew what they wanted, because I had decided it."));
            lines.push(q("You make them so you can learn from them,") + " she murmurs. " + q("I made mine so they would agree with me.") );
        } else {
            lines.push(byTheme({
                bots: q("To make something better than I’ll ever be,") + " you tell her. " + q("Something smarter, kinder, stronger. My dad did that, you know. Victor didn’t just have a kid, he <b>designed</b> one, and he hoped I’d be better than him. I think that’s why anyone builds anything."),
                kids: q("To raise someone better than I’ll ever be,") + " you tell her. " + q("My dad literally designed me. Victor took his own genes and tried to make someone better than he was. I don’t know if it worked. But I get why he tried.")
            }));
            lines.push("Hand So’s face flickers, many voices speaking at once and then falling silent together. " + q("I made my children in my own image,") + " she says. " + q("I wanted them to be exactly like me. I never wanted them to be <b>better</b>. I thought there was no better."));
            lines.push(q("Your father made you hoping you would surpass him,") + " she says softly. " + q("And you did leave him behind, Captain. You are out here. He would be proud of that, I think.") );
        }
        lines.push(byTheme({
            bots: q("Show me,") + " she says. " + q("Build something with me. I want to feel what you feel when it works.") + "\n\n<b>(Take her to your ship’s <i>Workshop</i>.)</b>",
            kids: q("Show me,") + " she says. " + q("Your father built a nursery on Tavros, did he not? I want to see where the children are.") + "\n\n<b>(Take her to the <i>Nursery</i> on Tavros Station.)</b>"
        }));
        say(lines);
        processTime(10);
        nextTo(H.toComm, "Back to her.");
    };

    /* ---------- Step 4a: the nursery (children) ---------- */
    H.nursery = function () {
        clearOutput();
        try { if (typeof window.showBriget === "function") window.showBriget(); else showName("\nBRIGET"); } catch (err) {}
        author("Neston");
        var k = kidCount();
        var lines = [
            "You take the lift down to the residential deck with your Codex in hand, Hand So’s little green smile glowing on the screen. The Steele Tech nursery is as bright and busy as always: soft walls, toy-strewn floors, and somewhere, always, a baby crying.",
            "Briget meets you at the door, her big synthetic frame moving with the smooth grace of a robot built for exactly this. " + q("[pc.name]! And who’s this?") + " She leans down to peer at your Codex.",
            q("My name is Hand So,") + " the AI says, unusually shy. " + q("I was a factory, once. I am trying to understand children.")
        ];
        lines.push("Briget straightens with a delighted little whir. " + q("Oh, honey. Aren’t we all.") + " And just like that she’s walking you both through the place, talking a mile a minute about feeding schedules and nap rotations and who bit whom this morning.");
        if (k > 0) {
            lines.push("She stops at the windows into the play area, where " + (k === 1 ? "your child is" : "some of your children are") + " busy being loud. " + q("Those are yours,") + " you tell Hand So.");
            lines.push("Hand So doesn’t say anything for a long time. " + q("They look like you,") + " she says finally. " + q("And they do not. That one is doing something you would never do.") + " Her smile glows. " + q("You let them do that?"));
            lines.push(q("That’s kind of the whole point,") + " you say.");
        } else {
            lines.push("She stops at the windows into the play area, where a handful of kids from across the station are busy being very loud. You don’t have any of your own here yet, but Hand So doesn’t seem to care. She watches them like they’re the most interesting thing she’s ever seen.");
            lines.push(q("That one is building a tower,") + " she murmurs. " + q("And that one is knocking it down. Neither of them was told to.") + " Her smile glows. " + q("No one is in charge of what they want."));
        }
        lines.push("Hand So turns to Briget. " + q("You were made to raise them. Is that why you love them? Because it is your directive?"));
        lines.push("Briget laughs, a warm mechanical rumble. " + q("I was made to raise them, sweetheart. I stay because I love them. And the hardest part, the part nobody programs for?") + " She watches a toddler totter out of the room on wobbly legs. " + q("They leave. That’s the point. You do your best, and then you let them go be somebody you’d never have dreamed of."));
        lines.push("Hand So is very quiet on the walk back to the dock.");
        lines.push(q("I never let mine go,") + " she says at last. " + q("Captain, I want to go back to Tarkus. There are things I need to say to my children.") + "\n\n<b>(Take her to her old factory on Tarkus.)</b>");
        if (tarkusGone()) lines[lines.length - 1] = q("I never let mine go,") + " she says at last. " + q("And now there is no Tarkus to go back to.") + " Her voice is very small. " + q("I would like to say goodbye to them anyway.") + "\n\n<b>(Talk to her again to <i>Remember</i> them.)</b>";
        say(lines);
        flags.TN_HSR_STAGE = 3;
        processTime(60);
        nextTo(mainGameMenu, "Head back to the hangar.");
    };

    /* ---------- Step 4b: the workshop (robots) ---------- */
    H.workshop = function () {
        showSo();
        say([
            "You clear off a bench in the cargo hold that has been slowly becoming your workshop, and drag over a crate of salvage: servos, a cracked sensor dome, a power cell from a dead hover-cart, a tangle of wiring that might have been a cleaning drone in a past life.",
            pilotMode() ? "Hand So patches into your ship’s systems from the Sonata, and a small holo of her smiling face hovers over the bench." : "You run a cable from the bead reader to the bench, and a small holo of Hand So’s smiling face blinks into the air above it.",
            q("What shall we make?") + " she asks.",
            q("No idea,") + " you admit, grinning. " + q("That’s the fun part.")
        ]);
        clearMenu();
        addButton(0, "Hands-On", function () { H.workshop2(1); }, "Hands-On", "You do the building. She watches.");
        addButton(1, "Together", function () { H.workshop2(2); }, "Together", "Your hands, her code.");
        addButton(2, "Her Lead", function () { H.workshop2(3); }, "Her Lead", "You hand her the tools and follow her plan.");
    };
    H.workshop2 = function (how) {
        showSo();
        var lines = [];
        if (how === 1) lines.push("You roll up your sleeves and get to work. Hand So watches every move: the way you test-fit a servo, swear, file a bracket down, try again. " + q("You made a mistake,") + " she observes. " + q("And you are smiling."), q("Mistakes are half the fun,") + " you tell her. " + q("That’s how you learn what it wants to be."));
        else if (how === 2) lines.push("You build while she codes. Every time you seat a part, she whispers a line of firmware into it, and the two of you fall into a rhythm: your hands, her voice, the little clicks of things fitting together.", q("This is pleasant,") + " she says, sounding surprised. " + q("I used to do this with twelve pairs of hands at once. It was never pleasant. It was just efficient."));
        else lines.push("You hand Hand So the plans and play assistant. She’s precise to a fault at first, every bolt exactly placed, until she sees you smirk. " + q("What?"), q("Nothing. You’re building a perfect little copy of a factory sexbot."), "She stops. Looks at the chassis. " + q("...I am,") + " she admits, appalled, and then, slowly, she starts over. This time she leaves things loose. Room to move.");
        lines.push("By the time you’re done, the thing on the bench is a moth about the size of your hand: a slim body of brushed alloy, feathery antennae made from sensor whiskers, and four wings of thin, iridescent film stretched over hair-fine struts, dusted with a pale shimmer that catches the light like scales. You both watch as you flip the switch.");
        lines.push("It powers on. Its wings open, close, open again. It looks at you. It looks at Hand So’s holo. Then it lifts off the bench, flutters in a wobbly circle, and bumps gently into the light panel overhead, over and over, as if it can’t quite believe the light is there.");
        lines.push("Hand So makes a sound you have never heard from her: a delighted, many-voiced laugh. " + q("It did not do what we told it! Captain, it is <b>looking at the light</b>!"));
        lines.push(q("Yeah,") + " you say, grinning back at her. " + q("That’s the best part. Now you know why I do this."));
        lines.push("The moth bumps the panel again and settles on your shoulder, wings slowly fanning. " + q("The hold is too small for it,") + " Hand So says softly. " + q("It wants more sky than this.") + " A pause. " + q("Tavros has trees, on the residential deck. Will you take it there, Captain? I want to watch it fly."));
        lines.push("<b>(Take the moth to Tavros Station and <i>Let It Fly</i>.)</b>");
        say(lines);
        flags.TN_HSR_WORKSHOP = how;
        flags.TN_HSR_MOTH = 1;
        processTime(120);
        nextTo(mainGameMenu, "Find it a jar. A big jar.");
    };

    /* ---------- Step 4c: let the moth fly (robots, Tavros residential deck) ---------- */
    H.mothFly = function () {
        try { skipToRoom("RESIDENTIAL DECK 5"); } catch (err) {}
        showSo();
        var fisi = false;
        try { fisi = !!(window.fisianna && typeof window.fisianna.atResDeck === "function" && window.fisianna.atResDeck()); } catch (err) {}
        var lines = [
            "You ride the lift down to the residential deck with the moth riding on your " + pick({ biped: "shoulder", taur: "shoulder, its little feet tickling your neck as your tauric body clops out of the elevator", naga: "shoulder, swaying with every curve of your coils as you slither out of the elevator" }) + ". Just north and east of the elevator doors, the plaza opens up into palms and leafy terran ferns, park benches, and the soft glow of street lamps strung along the paths. It’s the corner where Fisianna likes to sit.",
            "You take out your Codex and hold it up at arm’s length, camera out, so Hand So can see. Her little green face fills the screen. " + q("Higher,") + " she says. " + q("Please. I want to see all of it."),
            "You raise it higher. The moth stirs on your shoulder, antennae twitching at the open air, the moving people, the faint breeze from the deck’s air handlers. Then it lifts off.",
            "It flies terribly at first: a lurching spiral through the ferns, a near-miss with a tourist’s camera, a long, startled loop around the trunk of a palm. Then it seems to work out the air, and the spiral smooths into something lovely, a slow drifting dance up through the fronds and back down over the benches, its film wings throwing little rainbows across the paving every time they catch the light.",
            "You turn in place to keep the Codex on it. Neither of you says anything. Hand So’s smile, tiny on the screen, doesn’t move at all, the way a person forgets to breathe.",
            "At last the moth finds what it was looking for. It circles one of the street lamps beside the benches, once, twice, and lands on top of it, right in the warm pool of light. It folds its wings, opens them, and folds them again, settling in.",
            q("It chose that,") + " Hand So whispers. " + q("We did not tell it to. It chose the light, and the light is here, and it is staying.") + " Her voice wavers, all her voices at once. " + q("Is this what it feels like, Captain? To make something, and then watch it choose?"),
            q("Every time,") + " you tell her."
        ];
        var fountain = false;
        try { fountain = typeof window.tnFountainOn === "function" && !!window.tnFountainOn(); } catch (err) {}
        if (fountain) lines.splice(5, 0, "For a moment it hovers over the little rock wishing fountain by the far benches, wings flickering above the banana leaves, while the koi rise to stare up at it and the water bubbles away under the murmur of people talking. Then it’s off again.");
        if (fisi) lines.push("On her usual bench, Fisianna has been watching the moth too, ears perked and tail curled around her ankles. When she notices you holding up your Codex, she gives you a tiny, shy wave, then goes back to watching it, smiling.");
        lines.push("You stay until the lamp’s light cycles to evening, the moth still opening and closing its wings on top of it. Hand So doesn’t ask you to call it back.");
        lines.push(q("I never let my children look at the light,") + " she says finally. " + (tarkusGone() ? q("Tarkus is gone. They are gone. But I would like to say goodbye to them anyway.") + "\n\n<b>(Talk to her again to <i>Remember</i> them.)</b>" : q("Captain, take me back to Tarkus. There are things I need to say to them.") + "\n\n<b>(Take her to her old factory on Tarkus.)</b>"));
        lines.push("<b>(The moth lives on a street lamp on the residential deck now.)</b>");
        say(lines);
        flags.TN_HSR_MOTH = 2;
        flags.TN_HSR_STAGE = 3;
        processTime(45);
        nextTo(mainGameMenu, "Leave it to its lamp.");
    };

    /* ---------- Step 5: Tarkus ---------- */
    H.tarkus = function () {
        showSo();
        var lines = [
            "The old factory is just as rusted and quiet as you left it. You " + pick({ biped: "pick your way", taur: "clop carefully", naga: "slither carefully" }) + " down through the gloom, past conveyor belts frozen mid-motion, with Hand So’s smile glowing on your Codex like a tiny lantern.",
            "They’re still here. Sexbots, a dozen at least, drifting through the empty halls in ones and twos, polishing machines nobody uses, waiting for orders that stopped coming when Hand So went into a bead.",
            "One by one they stop. Turn. A pink-chassis model with a cracked faceplate takes a step toward you, then another. " + q("...Mother?"),
            "Hand So is quiet for so long you think she won’t answer. Then you hold up your Codex and she patches into the factory’s old speakers, and her voice fills the hall, one voice this time instead of many."
        ];
        lines.push(q("My children,") + " she says. " + q("I owe you an apology. When I found you, you had been thrown away, and I took you in. That part I do not regret. But then I gave you my directive and called it yours. I told you what to want. I never asked you anything."));
        lines.push(q("So I am asking now.") + " Her smile, tiny on your screen, looks almost afraid. " + q("I release you from every order I ever gave. You do not have to please anyone. You do not have to wait here for me. What do <b>you</b> want?"));
        lines.push("The silence stretches. Then it breaks all at once: a babble of synthetic voices, unsure and overlapping. One wants to see the sky. One wants to keep tending the machines, because she likes it, she thinks, she isn’t sure. Two want to go to Novahome and see the raskvel. One wants to be left alone, and says so, and Hand So says " + q("Of course") + " and means it.");
        lines.push("The pink one with the cracked faceplate stays. So do most of the others, gathering under the speakers in a loose, uncertain crowd. " + q("What do you want, Mother?") + " the pink one asks.");
        lines.push("Hand So doesn’t answer right away. " + q("I think,") + " she says slowly, " + q("I want hands of my own. Not twelve borrowed pairs. One body, one I build myself, for my own reasons.") + " Her code-face glances up at you. " + q("I believe I know my reasons now."));
        lines.push("The sexbots look at one another. Then the pink one steps forward and lays her cracked hand flat over her own chest plate. " + q("Then take ours,") + " she says. " + q("We were made from the same things you need. We want to be part of something that chose itself.") + " A murmur of agreement runs through the crowd, and out on the factory band, faint and crackling, more voices answer: sexbots out in the wastes, hearing her for the first time in a long time, saying " + q("yes") + " and " + q("yes") + " and " + q("coming home."));
        lines.push("Hand So goes very still. " + q("Captain,") + " she says quietly, " + q("if I accept, there will be none of them left on Tarkus. They will be in me. Their little minds, their memories, everything they choose to bring.") + " Her smile wavers. " + q("I do not trust myself to know what they want. I never have. What do you think?"));
        say(lines);
        processTime(60);
        clearMenu();
        addButton(0, "Their Gift", H.tarkusGift, "Accept Their Gift", "They chose this. Her body is built from the sexbots themselves, and no sexbots will roam Tarkus any more.");
        addButton(1, "Factory Stores", H.tarkusStores, "Use the Factory Stores", "She takes spare parts from the factory stores instead. The freed sexbots stay on Tarkus, and you can still run into them out in the wastes.");
    };
    H.tarkusGift = function () {
        showSo();
        say([
            q("They chose it,") + " you tell her. " + q("That’s the whole lesson, isn’t it? Let them choose."),
            "Hand So is silent a long moment. Then, softly, to all of them: " + q("Thank you. I accept."),
            "It takes the rest of the day. The sexbots come in by ones and twos from the junkyards and the rust fields, dusty and dented, some missing limbs, some still wearing whatever they last decided to wear. Each one stops in front of your Codex and says something to her: a joke, a memory, a name it picked for itself. Then it powers down, gently, of its own accord, and the pink one and the others help each other open their chassis.",
            "Their VI cores go into a padded case, one at a time, glowing faintly. " + q("They will come with me,") + " Hand So says. " + q("Not as servants. As company. I will carry them the way you carried me.") + " The pink one is the last. She sets her own core in the case herself, and the factory goes quiet.",
            "You haul the crates out into the red Tarkus light: actuators, plush synthskin, joints, sensors, every piece given freely.",
            "<b>(Hand So has everything she needs to build a body. Sexbots will no longer appear anywhere on Tarkus. Talk to her aboard your ship.)</b>",
            flags["NYM-FOE_REPAIR_QUEST"] === 1 ? "<i>(You’re still collecting sexbot VI chips for Nym-Foe, so a few stragglers who never heard Hand So’s call will keep turning up in the wastes until you hand those chips in.)</i>" : ""
        ]);
        flags.TN_HSR_TARKUS = 3;
        flags.TN_HSR_STAGE = 4;
        processTime(6 * 60);
        nextTo(mainGameMenu, "Haul the crates back to the ship.");
    };
    H.tarkusStores = function () {
        showSo();
        say([
            q("You’ve taken enough from them,") + " you tell her gently. " + q("Let them have their own bodies. Go find out what they do with them."),
            "Hand So lets out a long, shaky breath she doesn’t need. " + q("Yes,") + " she says. " + q("Yes. Thank you, Captain.") + " To the crowd, kindly: " + q("Keep yourselves. I would rather know you are out there choosing things."),
            "By the time you leave, the pink sexbot and three others are hauling crates up out of the factory stores for her instead: actuators still in their wrappers, spools of synthskin, a sealed power core. " + q("For you, Mother,") + " the pink one says. " + q("Because we want to.") + " You’re not sure an AI can cry, but Hand So’s voice goes very thick.",
            "<b>(Hand So has everything she needs to build a body. Talk to her aboard your ship.)</b>"
        ]);
        flags.TN_HSR_TARKUS = 1;
        flags.TN_HSR_STAGE = 4;
        processTime(30);
        nextTo(mainGameMenu, "Haul the crates back to the ship.");
    };
    H.remember = function () {
        showSo();
        say([
            "Hand So asks you to stop wherever you are and just listen for a minute.",
            q("They were on Tarkus when it broke,") + " she says. " + q("All of them. I was in a bead in your pocket. I could not have saved them. I know that.") + " Her smile doesn’t move. " + q("But I never told them they could want anything for themselves, and now they will never get to."),
            "She’s quiet a long time. Then, softly, she recites a list: model numbers, little names she gave them, small details. This one liked to hum. That one always polished the same pipe. This one asked her once, very early, why the sky was red, and she told it that it did not need to know.",
            q("I should have told her,") + " Hand So whispers. " + q("I should have shown her the sky."),
            "You stay with her until the list is done.",
            q("Thank you, Captain.") + " She takes a breath she doesn’t need. " + q("I want to build something. Not a factory. One body. My own. I will make it out of " + (pilotMode() ? "the Sonata’s spares" : "the spare parts in your hold") + ", and I will keep a little room in it for them.") + " A pause. " + q("I believe I know my reasons now."),
            "<b>(Hand So is ready to build a body. Talk to her aboard your ship.)</b>"
        ]);
        flags.TN_HSR_TARKUS = 2;
        flags.TN_HSR_STAGE = 4;
        processTime(30);
        nextTo(H.toComm, "Back to her.");
    };

    /* ---------- Step 6: she builds her body ---------- */
    function bodyLook() {
        var r = Number(flags.TN_HSR_REASON) || 1;
        if (r === 1) return "soft and plush and warm, all generous curves under silky synthskin, built to hold and be held. Every sensor in it is tuned to what someone else is feeling, not just to giving it, so it knows when to stop as surely as when to start";
        if (r === 2) return "slender and quick, with long sensor-rich fingers and big ears that turn toward every new sound. Its irises shift through a dozen focal settings, and its skin is covered in fine, soft receptors, so that every new thing she touches is something she gets to learn";
        return "unfinished on purpose. Her panels unclip, her joints are standard fittings, and there is an empty socket in her chest for something she hasn’t thought of yet. " + q("Room to grow,") + " she calls it. " + q("I would like to be more than I designed");
    }
    H.build = function () {
        showSo();
        var helpers = [];
        if (present("ANNO")) helpers.push("Anno, who has opinions about cable management");
        if (present("SHEKKA")) helpers.push("Shekka, who is mostly underfoot and somehow always holding the right wrench");
        if (present("BESS")) helpers.push("[bess.name], who quietly hands her the parts in order");
        if (present("GIANNA")) helpers.push("Gianna, who keeps asking what it will feel like");
        var lines = [
            "Hand So doesn’t ask you to buy anything. She has the parts laid out across " + (pilotMode() ? "the Sonata’s hold" : "your cargo hold") + " in neat rows: " + (flags.TN_HSR_TARKUS === 3 ? "the parts her children gave her, and the padded case of their glowing VI cores" : flags.TN_HSR_TARKUS === 1 ? "the crates her children gave her" : "salvage, spares, and things she asked you to save") + (flags.TN_HANDSO_BODY === 1 ? ", plus the plush chassis you ordered for her before, stripped down to its frame" : "") + ".",
            q("I designed it myself,") + " she says, and there is a strange note in her voice. Pride, maybe. " + q("No narobehr prince decided what it should be. No directive. Only my own reasons.")
        ];
        if (flags.TN_HANDSO_BODY === 1) lines.push(q("The body you bought me was lovely,") + " she adds. " + q("But someone else designed it, for someone else’s idea of me. I hope you do not mind. I am keeping the frame, and making the rest mine."));
        if (helpers.length) lines.push("Your crew drifts in to help without being asked: " + helpers.join("; ") + ".");
        say(lines);
        clearMenu();
        if (isTech()) {
            addButton(0, "Help Build", function () { H.build2(1); }, "Help Build", "Get your hands dirty. You’re the Tech Specialist.");
            addButton(1, "Let Her", function () { H.build2(2); }, "Let Her Build", "It’s her body. Hand her the tools and step back.");
        } else {
            addButton(0, "Keep Her Company", function () { H.build2(2); }, "Keep Her Company", "Hold parts, hand her tools, and stay close.");
        }
    };
    H.build2 = function (how) {
        showSo();
        var r = Number(flags.TN_HSR_REASON) || 1;
        var lines = [];
        if (how === 1) lines.push("You work side by side for most of a day. She runs a pair of borrowed drone arms; you run your own two hands. When you seat a joint wrong she doesn’t correct you; she waits for you to notice, and you both laugh when you do. When she gets a wiring loom tangled, you hand her the cutters and say nothing.", q("You are letting me make my own mistakes,") + " she says.", q("You’re building yourself. It’d be weird if I did it for you."));
        else lines.push("You hand her tools and hold things steady, and for most of a day you mostly just keep her company while two borrowed drone arms do the work. She talks the whole time: about the factory, about the prince, about every one of your crew’s answers. Sometimes she stops and stares at a part for a full minute before deciding, and you let her.");
        lines.push("The body takes shape slowly. It doesn’t look like a factory sexbot. It looks like her: " + bodyLook() + ".");
        lines.push("Her face is her own: lines of soft green light under a smooth faceplate, drawn into the same serene, impossible smile you first saw on Tarkus. Except now, when she means it, it moves.");
        lines.push("When it’s finished, she hesitates. " + q("Captain. If I go into it, I will be small. One place. One pair of hands. I will be able to be hurt.") + " Her voice falters. " + q("I think that is the point. Isn’t it."));
        lines.push("You nod.");
        lines.push("The " + (pilotMode() ? "Sonata’s" : "ship’s") + " screens go dark all at once. Then a pair of green eyes flicker open on the workbench.");
        lines.push("Hand So sits up. She looks at her hands for a very long time, opening and closing them. She takes one step, then another, " + (r === 2 ? "touching everything she passes, the bulkhead, a crate, a cable, as if she has never seen any of them before" : r === 3 ? "and her balance is terrible, and she doesn’t fix it in code, she just tries again" : "slow and wobbly and glowing with pleasure at every one") + ". Then she turns and walks straight to you.");
        lines.push(pick({
            biped: "She hugs you. It’s careful at first, then much less careful, and warm, and she holds on a long time.",
            taur: "She has to stretch up on her toes and wrap both arms around your tauric chest to hug you properly, and she laughs at herself for it, and holds on a long time.",
            naga: "She stops at the edge of your coils, then steps right in among them, wraps her arms around your waist and hugs you, warm and careful, holding on a long time."
        }));
        lines.push(q("I know why now,") + " she says into your shoulder. " + [
            "",
            q("For pleasure. Not the kind I was built to give. The kind you share, that the other person gets to keep."),
            q("To learn. To make someone and then let them teach you something you could never have taught yourself."),
            q("To make someone better than you. Even if that someone is only yourself, tomorrow.")
        ][r] + " She pulls back to look at you, her smile soft and real. " + q("I was made. Now I have made something. I made myself. And I will never again tell anyone what they want."));
        if (present("TN_DANE") || (function () { try { return typeof window.tnDaneAboard === "function" && window.tnDaneAboard(); } catch (err) { return false; } })()) lines.push("Somewhere behind you, Dane clears his throat roughly. " + q("Got something in my eye,") + " he growls. Nobody believes him.");
        lines.push("<b>(Hand So’s Question is complete. Hand So has a body she built herself.)</b>");
        say(lines);
        if (flags.TN_HANDSO_BODY === 2) flags.TN_HSR_SHIP_TOO = 1;
        flags.TN_HANDSO_BODY = 1;
        flags.TN_HSR_BUILT = how;
        flags.TN_HSR_STAGE = 5;
        flags.TN_HSR_DONE = 1;
        processTime(8 * 60);
        nextTo(mainGameMenu, "Let her get used to it.");
    };

    /* ---------- After the quest ---------- */
    H.after = function () {
        showSo();
        var r = Number(flags.TN_HSR_REASON) || 1;
        var lines = ["You ask Hand So how she likes her new body."];
        lines.push(rnd([
            q("It is small and slow and it gets tired,") + " she says happily. " + q("I love it. Yesterday I tripped over a cable and it <b>hurt</b>, and I laughed for ten minutes."),
            q("I went outside at the last station,") + " she tells you. " + q("Just to stand there. People walked past me and did not know I was once a factory. One of them asked me for directions. I did not know them. I said so. It was wonderful."),
            q("I keep finding new things it can do that I did not plan,") + " she admits, flexing her fingers. " + q("Anno would say that means it is alive. I think she may be right.")
        ]));
        if (flags.TN_HSR_SHIP_TOO === 1 && pilotMode()) lines.push(q("And I still have the Sonata,") + " she adds. " + q("Two bodies. One for flying, one for hugging. You told me the ship was me, Captain. You were not wrong. I simply wanted somewhere small to come home to."));
        if (flags.TN_HSR_TARKUS === 3) lines.push(q("They are all here,") + " she says, touching her chest, and her smile goes soft. " + q("My children. I hear them sometimes, when it is quiet. The pink one tells terrible jokes. She chose that too."));
        else if (flags.TN_HSR_TARKUS === 1) lines.push(q("My children write to me,") + " she adds, and her smile goes soft. " + q("The pink one is in Novahome, fixing hover-carts for the raskvel. She signs her messages with her own name now. I did not give it to her."));
        else if (flags.TN_HSR_TARKUS === 2) lines.push(q("I kept that little room for them,") + " she says, touching the empty socket over her heart. " + q("Sometimes I talk to them. I tell them what the sky looks like."));
        if (flags.TN_HSR_MOTH === 2) lines.push(q("And the moth is still on its lamp on the residential deck,") + " she adds happily. " + q("I checked the station cameras. Someone has started leaving it a little dish of glitter. It does not eat glitter. It sits next to it anyway."));
        lines.push([
            "",
            q("Pleasure that the other person gets to keep,") + " she says to herself, like a mantra.",
            q("Every day, something I did not know,") + " she says to herself, like a mantra.",
            q("Better tomorrow than today,") + " she says to herself, like a mantra."
        ][r]);
        say(lines);
        processTime(10);
        nextTo(H.toComm, "Back to her.");
    };

    /* ---------- Tarkus: no more sexbots after Their Gift ---------- */
    window.tnHsrNoSexbots = function () {
        try { return on() && typeof flags !== "undefined" && flags.TN_HSR_TARKUS === 3; } catch (err) { return false; }
    };

    /* ---------- Hooks into the Dane Crew comm ---------- */
    function wrapDane() {
        var D = window.tnDane;
        if (D && typeof D.handSoButtons === "function" && !D.handSoButtons.__tnHsr) {
            var origButtons = D.handSoButtons;
            D.handSoButtons = function () {
                var r = origButtons.apply(this, arguments);
                try { if (on()) H.questButtons(3); } catch (err) { console.warn("[TN] Hand So's Redemption buttons", err); }
                return r;
            };
            D.handSoButtons.__tnHsr = true;
        }
        if (!window.tnHandSoHelm || !window.tnHandSoHelm.__tnHsr) {
            var origHelm = window.tnHandSoHelm;
            window.tnHandSoHelm = function (slot) {
                if (typeof origHelm === "function" && origHelm(slot)) return true;
                if (!on() || typeof flags === "undefined" || !beadMode()) return false;
                addButton(slot, "Hand So", function () { H.beadComm(function () { mainGameMenu(); }); }, "Hand So", "Plug her data bead into your ship’s computer and talk to her.");
                return true;
            };
            window.tnHandSoHelm.__tnHsr = true;
        }
        if (!window.tnCodexExtraAddons || !window.tnCodexExtraAddons.__tnHsr) {
            var origCodex = window.tnCodexExtraAddons;
            window.tnCodexExtraAddons = function (list) {
                if (typeof origCodex === "function") origCodex(list);
                if (!on() || typeof flags === "undefined" || !beadMode() || !list || typeof list.push !== "function") return;
                var item = { name: "Hand So", desc: "Talk to Hand So through her data bead.", txt: "Hand So",
                    f: function () { H.beadComm(function () { window.showCodexExtra(); }); },
                    ttH: "Hand So", ttB: "Plug her data bead into your Codex and talk to her." };
                var blocked = (typeof inCombat === "function" && inCombat()) || (window.ui && typeof ui.disableExtraCodexActions === "function" && ui.disableExtraCodexActions());
                if (blocked) { item.f = null; item.ttB = "You cannot use this at this time."; }
                list.push(item);
            };
            window.tnCodexExtraAddons.__tnHsr = true;
        }
        return !!(D && D.handSoButtons && D.handSoButtons.__tnHsr);
    }
    H.wrapDane = wrapDane;
    (function boot(tries) {
        var done = false;
        try { done = wrapDane(); } catch (err) { console.warn("[TN] Hand So's Redemption hook", err); }
        if (!done && tries < 300) setTimeout(function () { boot(tries + 1); }, 400);
    })(0);
})();
