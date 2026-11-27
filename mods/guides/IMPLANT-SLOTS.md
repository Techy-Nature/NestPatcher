# Implant Slots

Sabrae's shop on Dhaal normally fits one combat implant and one utility (sex) implant. With
Implant Slots she can fit **three of each**, and every implant works from any slot.

Files: `TN_ImplantSlots_v1.0.mod` + `TN_ImplantSlots_v1.0.js` (both in `enabled.txt`).

## Using it

1. Go to Sabrae's shop on Dhaal and choose **Install**.
2. Pick an implant. If you have a free slot of its type, it goes in without taking anything out.
3. Do it again for a second and third implant of the same type.
4. An implant is greyed out in her list when:
   - you already have that implant installed,
   - it's Combat Tail or Armored Tail and you already have the other one, or
   - all three slots of its type are full. Have her remove one first.
5. **Uninstall** shows a button for each implant you have (combat on the top row, utility on
   the second row once you use slots 2 or 3), plus **All**.

The stats page lists every implant (Combat, Combat 2, Combat 3, Utility, Utility 2, Utility 3),
and the equipment screen adds a row for slots 2 and 3 when they're used.

## What changes in the game

- Every check the game makes for an implant looks at all six slots.
- Values the game reads off an implant (MedImplants' heal threshold, Busty Bulwark and Medical
  Milkers' breast size, the Ballistic Breast Liners' defense, the Combat Tail's drone, the
  Phallus Tuner's length) come from that implant, wherever it sits.
- Resistances from every combat implant add up.
- **Cybernetic Synchronization** gives its bonus for every implant you have, and the cyborg check
  counts every implant. With six implants that's six times the perk's bonus.

## The switch

Options > **Android Mods** (Android) or **TN Mod Settings** (desktop) > **Implant Slots** >
**Extra slots: On/Off**. The page also lists what's in each slot.

With it off, Sabrae goes back to one of each and swaps out your first implant like the base
game. Implants you already have in slots 2 and 3 keep working until she removes them.

## Removing the mod

The extra slots are saved in your game. If you take the mod out of `enabled.txt`, the game no
longer knows about slots 2 and 3, and the implants in them are lost. Have Sabrae remove them
first, then reinstall the ones you want in slot 1.

## How it was tested

- NestPatcher (Linux 1.13) dry run on 0.9.169: 801 replacements (142 from this mod), no MISS,
  every patched file passed the syntax check.
- Android patcher 1.6 dry run on the same 0.9.169 files: no MISS.
- The install, removal, slot, menu and stats-page code, as patched, run in Node with fake
  implants: three of each install, one comes out of the middle, the rest move down, All empties
  every slot, and the switch brings back the base game's swap.
- **Not tested inside the running game yet.**
