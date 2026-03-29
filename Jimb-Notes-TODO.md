TODO
====

monsters should be able to swap positions with dead monsters
add border

make test encounter floor
  5 slimes left me with 5 cards, but close
  second try: 4 slimes nearly killed me

hunter is triggering wander to go through a door
  but, we're doing hunter but not wander, so it's never executing!

Use appropriate font

block tick down if we are standing still, executing block, and a monster is walking towards us
  so, ticks down if at the end of our turn, before the monster moves, we have no adjacent enemy? logic changes if enemies have ranged attacks though
if we move through a door, and there's a monster there that's never seen us, it shouldn't get a move, it should just come alert (or, rather "coming alert" is a move?)


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
