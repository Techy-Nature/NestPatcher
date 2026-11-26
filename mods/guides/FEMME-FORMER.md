# Femme Former (Modv3.0)

`TN_FemmeFormer_v3.0.mod` + `TN_FemmeFormer_v3.0.js` add the **Femme Former**, a TamaniCorp
machine in the spirit of the Dong Designer and the Muff Modeler. It reshapes breasts **and**
pussies in one session. Both files have to be in `enabled.txt`. It works on desktop and Android.

The machine looks like a fancier TamaniCorp Egg Trainer: a long, padded pink bench. Steele lies
on it stomach-first, two clear cups seal around their breasts, and a padded saddle with a probe
works below. Taurs get a padded cradle for their lower body, and nagas a tray for their tail.

## Getting one

There are two ways, and either one gives you a boxed Femme Former to carry back to your ship.

**Find it on Tarkus (free)**

1. On Tarkus, go to the **Polluted Beach** (west of where your ship lands).
2. Walk **south three times**, along the Oil Sea Beach.
3. Press **Pink Box**, then **Take It**. If you press **Leave It**, it stays there for later.

**Buy it on Tavros**

1. Go to the **TamaniCorp shop** on Tavros, where Lerris works (off the Merchant's Thoroughfare).
   It's the only TamaniCorp shop in the game.
2. Press **Femme Former** (the booth near the back of the shop).
3. Press **Buy**. It costs **50,500 credits**. If your inventory is full, you get your credits back.

**Install it**

1. Go back aboard your ship.
2. Open your **Inventory**, pick the **Femme Former** (FemmeF.) and **Use** it.
3. It's now installed. To move it, press **Uninstall** in its menu and it goes back in your inventory.

## Using it

1. On your ship, open **Masturbate > Installed** and press **Femme Former**.
2. The first time, a short tutorial plays. Press **Next**.
3. Plan your changes with **Chest**, **Nipples** and **Pussy** (see below). The main screen shows
   everything you've planned so far.
4. Press **Start**. One session does everything you planned, then shows what changed.

Nothing changes until you press **Start**. **Clear Plan** forgets the plan, and **Leave** turns the
machine off (the plan is forgotten too).

## What you can change

| Menu | Options |
|---|---|
| **Chest** | For each breast row: **Cup Size** (from flat up to the game's biggest cup, in steps of 1, 5 or 10) and **Nipple Type** (Normal, Flat, Inverted, Lipples, Fuckable, Dick, Tentacled). **Add Row** grows one more row (up to three rows), starting like your bottom row. |
| **Nipples** | For all rows: **Shorter** / **Longer** (0.5× to 10×), **Fewer** / **More** nipples per breast (1 to 4), and **Color**. |
| **Pussy** | For each pussy: **Type** (25 kinds over three pages, from Human to Nyrea), **Wetness** (Dry to Drooling), **Tightness** (Virgin-Tight to Gaping-Wide), **Clits** (1 to 4) and **Color**. **Add Pussy** grows a new one (up to three); you pick its type and the rest right away. **Remove** (inside a pussy's menu) smooths away an extra pussy; you always keep at least one. **Keep It** changes your mind. **Clit Size** sets the size of all your clits (¼ in to 12 in). |

Changing a pussy's type gives it that type's own color and extras (like the game's own
transformations do), unless you also picked a color.

## Locks

The game's own locks still apply, and their buttons are greyed out with the reason:

- **Goo Crotch:** the Pussy menu is off.
- **Gel Body:** breast sizes, nipple types and nipple counts can't change.
- **The Treatment** (some kinds): breasts can't shrink.
- A synthetic pussy can't change type.
- A pussy the game won't let go of (for example while you're pregnant in it) can't be removed.

## If the box or the booth doesn't show up

1. Make sure both `TN_FemmeFormer_v3.0.mod` and `TN_FemmeFormer_v3.0.js` are in your mods folder
   and in `enabled.txt`, then patch again. The `.js` is the box itself. The `.mod` adds it to the
   beach, and the `.js` has a backup way onto the beach if that part didn't apply.
2. Check that **Femme Former** is on in Android Mods (Android) or TN Mod Settings (desktop).
3. Walk onto the right square: from the **Polluted Beach**, go **south three times**. The beach's
   text mentions a pile of wrecked ships you have to squeeze past. If a fight starts there, win or
   lose, then step off the square and back on.
4. If the box shows up but **Take It** says the Femme Former "won't budge", the mod couldn't add its
   item to the game. Nothing is taken or spent.
5. Either way, the mod writes what it sees to the log. On Android, turn on Debug Mode in Android Mods
   and open **TN DEBUG**; on desktop, open the console (Ctrl+Shift+I). Look for lines that start with
   `[Femme Former]`: `loaded`, `item ready`, `beach hook ready`, and `at the beach: ...` when you step
   onto the square. If there are no `[Femme Former]` lines at all, the `.js` file isn't loading.

## Flags (for the save editor)

| Flag | Meaning |
|---|---|
| `TN_FEMME_FORMER` | `2` while it's installed on your ship. |
| `TN_FEMME_FORMER_FOUND` | `0` once you've found the one on Tarkus, `1` once you've taken it. |
| `TN_FEMME_FORMER_BOUGHT` | How many you've bought on Tavros. |
| `TN_FEMME_FORMER_USES` | How many sessions you've had. Also shown in **Stats > Miscellaneous**. |
| `TN_FEMME_FORMER_BOOTH` | You've seen the booth's sales pitch. |
| `TN_FEMME_FORMER_TUTORIAL` | You've heard the tutorial. |

## Turning it off

Android Mods (Android) or TN Mod Settings (desktop) > **Femme Former**. The Tarkus box, the booth
and the Installed button go away until you turn it back on. To remove it completely, put `#` in front
of both lines in `enabled.txt` and patch again.
