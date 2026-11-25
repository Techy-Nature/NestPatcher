# Fly (Modv3.0)

`TN_Fly_v3.0.mod` + `TN_Fly_v3.0.js` let Steele fly to any outdoor spot they've already found
on the planet they're on, with wings or any hoverboard. Both files have to be in
`enabled.txt`. It works on desktop and Android.

## Who can fly

- **Wings:** any kind of wings Steele has (not shark fins or tentacle "wings"). 5 energy a flight.
- **Any hoverboard:** the pink hoverboard, Anno's Holoboard (any color, or bare steel) or a board from another mod, carried in your inventory. No energy. The take-off scene names the board you carry. With two or more, each flight picks one at random.
- **Both:** pick how you go under the map (see below).

Without wings or a hoverboard, the Fly button doesn't show.

## Flying somewhere

1. Stand somewhere outdoors on the normal game screen (not in a scene or a fight).
2. Press **Fly** in the left sidebar, above Steele's picture. The map opens, titled **Fly**.
3. Tap an outdoor spot you've found. Indoor rooms, caves and places you haven't found yet
   can't be picked.
4. Press **Fly** at the bottom of the map (where the cheat Teleport button is).
5. Read the take-off scene and press **Next** to land there.

## Wings or hoverboard

With both, the map shows two buttons under it:

| Choice | What happens | Energy |
|---|---|---|
| **Use Wings** (default) | Steele hops on the hoverboard for a running start, springs off it, stows it and flies with their wings. | 5 |
| **Use Hoverboard** | Steele rides the hoverboard the whole way. | 0 |

The choice is saved in the `TN_FLY_WITH` flag (`wings` or `hoverboard`), so the save editor can
change it too.

## When the button is greyed out

Hover over it (desktop) or tap it (Android) to see why:

- You're indoors, in a cave, aboard your ship, in a scene or a fight, or on another screen.
- You're on **Dhaal** (too much air traffic) or **Phaedra** (the Evermind's anti-air guns).
- You don't have 5 energy left for wings.
- You're stuck in a web, or too heavy to get off the ground (the hoverboard still works then).

## Turning it off

Android Mods (Android) or TN Mod Settings (desktop) > **Fly**.
