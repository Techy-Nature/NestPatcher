# Modv3.1: TiTS 0.9.169

The pack now works on **TiTS 0.9.169**, and still works on 0.9.168. The game update renamed its
hidden internal names, so 23 patches in nine mods couldn't find their spot (MISS). They now find
those names by themselves.

## What changed

| File | Why |
|---|---|
| `Drakongarune_Lessau_v2.4.mod`, `DrakoHornitol_v2.4.mod`, `DragoHornitol_v2.5.mod` | Lessau's shop on Uveto was renamed. |
| `ShellyCabinReturns_v2.9.mod` | The egg reward scene was renamed. |
| `Stella_v2.7.mod` | Her beach and menu were renamed. |
| `StephIrson_v2.7.mod` | The Merchant Deck scene was renamed. |
| `Zheniya_v2.7.mod` | Her call-girl hall scenes were renamed. |
| `TN_TattooParlor_v2.6.mod` | The Tavros tattoo parlor was renamed. |
| `TN_HoloChastity_v2.6.mod` | The game's penis router was renamed. |
| `TN_TeaseRestore_v1.0.mod`, `TN_TeaseRestore_v1.0.js` | New: Tease Restore gives your teases back their old Flash-game strength. |
| `TN_SnakeCollars_v1.0.mod`, `TN_SnakeCollars_v1.0.js` | New: Snake Collars lets you collar the Blue Viper with Urbolg's slave collar, buy her as crew, and breed her or your slavebreaker for eggs that go to the Tavros nursery. |
| `TN_Changelog_v3.1.js` | Shows Modv3.1. Replaces `TN_Changelog_v3.0.js` (delete the old one). |

Every other file is the same as Modv3.0. `TN_GameFixes_v1.0.mod` stays: all six bugs it fixes are
still in 0.9.169.

## Updating

1. Back up your `nestmods` folder.
2. Install the 0.9.169 game (desktop: unzip it over a fresh folder, as with any update).
3. Delete every `.mod` and `.js` file and `enabled.txt` in `nestmods`. Keep `logs`. Delete
   `backup` too, because it holds the 0.9.168 files. (NestPatcher CLI 1.12, GUI 0.14, Mac 1.9,
   Android patcher 1.6 and Android app 0.10 or newer set an old `backup` aside by themselves.)
4. Copy everything from `TITS-Mods/` into `nestmods`.
5. **Windows, Linux and Mac only:** remove the `#` at the start of the
   `TN_LauncherFixes_v1.1.mod` line in `enabled.txt` if you want the launcher fixes.
6. Run NestPatcher: **Test my mods**, then **Patch the game**. The test should end with
   `669 replacements` and no `MISS` lines (679 on desktop with the launcher fixes on).
7. Restart TiTS. The in-game **Changelog** should say `Installed: Modv3.1`.

On Android you can update the pack before you have the 0.9.169 APK: these files work on
0.9.168 too.

## What the game update changed (for modders)

- The penis router now sorts a hardlight strap-on (`-1`) apart from other strap-ons (`-2`), and
  has a new `hermRouterSyntax` option. Holo-Lock Chastity's hook still runs before it.
- Aliss's shop on Tavros builds its stock in a list and adds new maebari items. Holo-Lock
  Chastity still adds its belt and cage to that list.
- New: a lockpicking minigame, Dulcie, and a new image manifest. The desktop launcher's
  `main.js` is the same as 0.9.168's.

## How it was tested

- NestPatcher (Linux 1.13) dry run: 656 replacements, no MISS, on both 0.9.169 and 0.9.168.
  With Tease Restore added: 659 replacements, no MISS, on 0.9.169.
  With Snake Collars added: 669 replacements, no MISS, on 0.9.169 (Linux 1.13 and Android 1.6 dry runs).
- A real desktop patch of 0.9.169 with the launcher fixes on: 666 replacements, every patched
  file passed the syntax check, and each renamed spot was checked by hand in the patched files.
- Android patcher 1.6 dry run on the 0.9.169 game files: 656 replacements, no MISS.
- `tests/smoke_test.py`: all passed.
- **Not tested inside the running game.** Check Lessau's shop, Shelly's egg gift, Stella,
  Steph Irson, Zheniya, the tattoo parlor and the Holo-Lock Chastity once.
