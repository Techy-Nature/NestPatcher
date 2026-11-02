# TN mod pack (Modv2.8)

Neston's mods for **Trials in Tainted Space 0.9.168**, ready to use with NestPatcher 1.4 (PC), the Android patcher 1.3, GUI 0.5 or the Android app 0.3, or newer. Older patchers can't read the `@@name@@` wildcards in `TN_TattooParlor_v2.6.mod` and `TN_HoloChastity_v2.6.mod`.

| Folder | What's in it |
|---|---|
| [`TITS-Mods/`](TITS-Mods/) | Every mod in the pack, plus `enabled.txt` (the load list). Copy everything in this folder into your `nestmods` folder. |
| [`guides/`](guides/) | Install guides and notes. Start with [`INSTALL-Modv2.8.md`](guides/INSTALL-Modv2.8.md). |
| [`tools/`](tools/) | `taur_gate_scan.js`, which writes `TN_taur-naga_gates.mod` for the Taur/Naga Scene Bypass mod. Only needed after a game update. |

The notes for every version are in [`changelog.md`](../changelog.md) at the top of the repo. That's also the file the in-game Changelog downloads.

## Quick install

1. Back up your `nestmods` folder.
2. Delete every `.mod` and `.js` file and `enabled.txt` in it. Keep the `logs` folder. Keep `backup` too, unless the game was updated (for example 0.9.167 to 0.9.168): then delete it.
3. Copy everything from `TITS-Mods/` into `nestmods`.
4. Patch with NestPatcher: run Test my mods, then Patch the game.

The full steps for Android and desktop are in [`guides/INSTALL-Modv2.5.md`](guides/INSTALL-Modv2.5.md).

## Which menu do I get?

- **Android:** Options > **Android Mods** (`AndroidModMenu_v2.5.js`), with on/off switches and every mod's settings.
- **Windows, Linux, Mac:** Options > **TN Mod Settings** (`TN_Desktop_Menu_v2.5.js`), with the same settings and no switches. To turn a mod off on desktop, put `#` in front of it in `enabled.txt` and patch again.

Both files can stay in `enabled.txt`. Each one only starts on its own system.

## File names

A file's name ends in the pack version from the last time it changed. For example, `Stella_v2.5.js` last changed in Modv2.5. Files with no version haven't changed since the pack started using version numbers.
