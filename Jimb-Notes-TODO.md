TODO - The Adventures of Rasa and the Chromatic Dragons
====

reduce odds of getting the same cards
mute music when at respawn dialog (change to UIAction?)

Additional card abilities (not implemented)
==============
"heal" by moving from discard to draw
pierce
remove armor
buff next attack (good for enemies - cancel upon kiting!)
clear debuffs (self)
1 damage + 1 per time it was played this floor
"charge" - gains one damage for each step while in hand

Elemental Plan
==============
Earth - dirt/trees/nature/lightning
Ice - ice/water
Fire - fire/hell

Discarded ideas
===============
didn't get to: animate: upon taking the orb, flip cards over, change element, probably a dialog
in-world monologues for Rasa to say randomly?
one-turn combat log in upper left? 50% alpha, solid on hover?
stretch: undo (to beginning of previous turn)
different text color for all of Rasa's speech?

Notes / Brainstorming
=====================

Combat and cards and exploration:
* Option 1: cards always visible, can maybe use/discard between combats (but not redraw until combat starts), some cards might be useful while exploring?  Then, can have combat that involves moving in the world, multiple enemies, fleeing, etc
  * maybe more interesting, and more dungeon crawler-y
  * maybe harder to balance
  * Spell Tower does something similar to this - game is turn based, can play one card, or redraw your hand, for one turn, then monsters go - don't get interesting deck-builder-y combos going though this way
  * Option 1a: no AP, simply 1 card or 1 move or redraw hand is 1 turn
    * hard to do things like precise kills, interesting combos; enemy behavior is simple (probably just: do damage each turn, though could alternate between shield self, then do damage, etc)
    * need a "reshuffles" limit of some kind so that you don't endlessly redraw your hand between each fight for the perfect hand - if no self-healing, reshuffling can take HP?
  * Option 1b: toggle in and out of combat/move mode? AP-based and movement takes a full AP bar? Don't want kiting to let you redraw your hand over and over though.
* Option 2: modal combat, no showing any cards/gear/equipment outside of combat, except perhaps on inventory screen that's the same as the "received new gear choice" screen; combat is always finished win or lose, before returning to the map
  * mostly simpler to implement, can mostly balance in a vacuum

* Combo solution: consider a dungeon floor an encounter
  * reshuffling has an HP cost - run out of cards and HP and fail the floor
  * fail the floor, lose a life, retry the floor, resetting loot/etc
  * lose all lives, restart the dungeon
  * 1 card, 1 move, or hand redraw is 1 turn
  * how to differentiate from Spell Tower? just cards/meta?

How does medic-ing "combat" work?
* find the corpses on the floor where you killed them
* need to heal a sufficient amount of HP to get them back up, maybe can't heal everyone
  * no reshuffles, no manual redraw, just keep hand at 5 cards
    * some cards can have effects which burn self (for the floor) to move discarded back to draw (or, are "once per floor", and just do nothing if redrawn)
* maybe just talk to anyone left alive that you skipped


UI Layout
* Hand of cards - overlaid on viewport, or separate area?
  * Draw pile (size indicator, and is a button to redraw hand); Discard pile size
* Movement and Status Screen button
* HP / Block / status effects
* Number of enemies alive on floor count
* Minimap? Not if floors are tiny
Cards
* Name
* Big icon
* Target: Self/Melee/Ranged
* Effect (text)

Level sizes
  ~4 enemies per level
  gain 1-2 cards per level on way in, 1 total on way out (but potentially lots of upgrade points)
  Dungeon #1: 3 floors@4 - 12
  Dungeon #2: 4 floors@4-5 - 18
  Dungeon #3: 5 floors@5 - 25
  deck size goes up by 2 per dungeon, therefore, want more enemies per floor in later dungeons?
  Dungeon #1: 3 floors@4 - 12
  Dungeon #2: 3 floors@5 - 15
  Dungeon #3: 3 floors@6 - 18
  or, more extreme:
  Dungeon #1: 3 floors@4 - 12
  Dungeon #2: 4 floors@5 - 20
  Dungeon #3: 5 floors@6 - 30 - with a deck size of 14, need to get at least 16 yields!
