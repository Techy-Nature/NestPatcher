# Sex Gallery: full scene text add-on (Modv3.0)

The pack comes in two versions:

| Version | What you get | Extra size |
|---|---|---|
| **Full text** | Every unlocked scene in the Sex Gallery gets a **Read scene** button with the whole scene. The Flashback Visor's **Older** memories show the whole scene too. | about 13 MB |
| **Lite** | The gallery as before: titles, summaries, how each scene starts, achievements. | none |

The only difference is one file: `TN_SexGalleryText_v3.0.js`.

## Switching versions

1. Open `enabled.txt` in your mods folder (`nestmods`).
2. For **Full text**, make sure this line is there, right after `TN_SexGallery_v2.9.js`:
   `TN_SexGalleryText_v3.0.js`
3. For **Lite**, delete that line or put `#` in front of it.
4. Patch again with NestPatcher.

## Using it

1. Load a save, open the game's main menu, and tap **Sex Gallery** (it sits next to Credits whenever a save is loaded, in both versions).
2. Tap **Read scene** on any scene you've unlocked.
3. The scene is written out for your Steele as they are now. Where the game picks between versions in a way the gallery can't work out (for example, it depends on a choice you made earlier on that page), you'll see the choices marked like ⟨this | that⟩, or longer ones in a dashed box.
4. If the Flashback Visor recorded that scene, **As you lived it (visor)** shows the exact text you saw.
5. Want to read scenes you haven't unlocked? Turn on **reading locked scenes** in the Sex Scene Gallery mod menu.

Reading a scene never changes your save.

## After a game update

Run both scanners from `mods/tools`, in this order, then patch:

```
node sex_scene_scan_v2.9.js
node sex_scene_text_scan_v3.0.js
```

The second one uses the folders the first one saved. Both must come from the same game version.

## Tested (TiTS 0.9.168, headless Chromium, real game files + a real save)

- All 3,042 scenes unpack and render with no errors; the save is byte-for-byte the same after reading all of them.
- Start-up time: the same as lite (within noise), on a normal PC and with the CPU slowed 6x to act like a low-end tablet.
- Memory: about 13 MB more for the packed text, plus about 12 MB while you read (two chunks of about 60 scenes are kept unpacked).
- Opening a scene: 20-50 ms on a PC, 0.1-0.3 s with the CPU slowed 6x.
- Not yet tried on a real phone or tablet.
