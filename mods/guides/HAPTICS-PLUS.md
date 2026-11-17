# Haptics Plus (Modv3.0)

`TN_HapticsPlus_v3.0.js` adds more control over the game's own buttplug.io haptics
(Options > **Haptics**): intensity caps, a smooth ramp-up, and a choice of which game
events start the buzz in Auto mode.

It sends nothing anywhere. The game still talks only to your own buttplug.io server
(Intiface Central), at the address in Options > Haptics. This mod just changes the levels
the game sends it.

## Setting up

1. Make sure `TN_HapticsPlus_v3.0.js` is in your `nestmods` folder and in `enabled.txt`, then patch.
2. In the game, set up haptics as usual: Options > **Haptics**, Haptic Devices **On**,
   start Intiface Central, pick **Manual** or **Auto**.
3. Open the settings page:
   - **Android:** Options > **Android Mods** > **Haptics Plus**.
   - **Windows, Linux, Mac:** Options > **TN Mod Settings** > **Haptics Plus** > Settings.
4. Before anything else, set **Auto max** and **Manual max** to a level you're comfortable
   with, then press **Test Auto (5 s)** to feel it. **Stop now** stops every device at once.

## What each setting does

| Setting | What it does | Default |
|---|---|---|
| Manual max | Highest level the header vibrate button can reach. The game's own Vibration Intensity still picks the level, below this cap. | 100% |
| Auto max | Highest level Auto mode can reach, whatever the trigger asks for. | 100% |
| Manual ramp | Seconds to climb to the level after you press the vibrate button (0 = jump straight there). | 3 s |
| Auto ramp | Seconds to climb to each new Auto level. | 3 s |
| Orgasm | How long Auto mode's orgasm buzz lasts. **scene** = until you get back to the room menu (the game's way). 5 to 30 s = the orgasm level for that long, then back to the level from before. | scene |

Going down is always instant. Lowering a cap while the device is buzzing takes effect at once.

## Triggers (Auto mode)

Open **Triggers** on the settings page. Each one has its own level (5% steps), still held under Auto max.

| Trigger | When | Game level |
|---|---|---|
| 1. Nude bust shown | A nude bust appears. Choose **Any nude bust**, **NPC nude busts only** (skips your own nude bust, for example on the appearance screen), or **Off**. | 50% |
| 2. Orgasm in a sex scene | You orgasm after a nude NPC bust was shown, since the last room menu. | 100% |
| 3. Orgasm outside a scene | You orgasm with no nude NPC bust shown since the last room menu: items, transformatives, and so on. | 100% |
| 4. Orgasm in a fight | You orgasm on the fight screen. | 100% |

The game only starts the device for these events, so those are the triggers there are.
Returning to the room menu still stops Auto mode, as in the base game.

The "sex scene" check goes by busts: a scene that never shows a nude bust counts as
"outside a scene". If a trigger fires when you don't expect it, the settings page shows
**Last Auto event**, which names what the mod saw.

## Turning it off

- **Android:** the **Disable Mod** button on its page. The game's own haptics then work as before.
- **Desktop:** put `#` in front of `TN_HapticsPlus_v3.0.js` in `enabled.txt` and patch again.

Settings are saved on this device only, like the game's own haptics options.
