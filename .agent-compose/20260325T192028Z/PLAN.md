# Plan: Mars Throne Structure

## Overview

Add a "Mars Throne" structure as the narrative capstone / win condition for the game. The Mars Throne becomes available only after the player contacts Earth via a new "Call Earth" action on the Comm Dish. Building it consumes ALL remaining rocks and energy and triggers a victory state.

## Prerequisites / Dependencies

**Critical**: The `contactedEarth` state and "Call Earth" action do not yet exist in the codebase. The Comm Dish structure is implemented (built for 10 rocks + 10 energy, reveals rocks within 5 tiles), but has no "Call Earth" interaction. This feature must be added as part of this task.

## Architecture

This is a single-file vanilla JS game (`game.js`) with companion `index.html` and `style.css`. All game logic, state, rendering, and input handling live in a single IIFE in `game.js`. There are no build tools, no frameworks, no tests, and no package.json.

### Key Patterns to Follow

1. **State**: All state lives in the `state` object (line ~68). New flags go here.
2. **Structure placement**: Structures are placed on empty adjacent tiles via `findAdjacentOpenTile()` (line ~980), or on the unit's current tile if `getStructureAt()` returns null.
3. **canBuild* / build* pattern**: Each structure has a `canBuildX()` predicate and a `buildX()` function. The predicate is used to enable/disable the button in `updateUI()`.
4. **Drawing**: Each structure type has a dedicated `drawX(structure)` function called from `drawStructure()` (line ~273).
5. **Buttons**: Added in `index.html` `#action-panel`, wired in JS with `addEventListener`.
6. **Hotkeys**: Added to the `keydown` switch statement and to the hotkey table in `index.html`.
7. **Logging**: Via `addLog(message, type)` — types include "build", "construct", "turn", etc.
8. **Game over**: `state.gameOver = true` prevents further actions. Currently only triggered by dust storm killing Elon.

## Changes Required

### 1. Add "Call Earth" Action on Comm Dish

- Add `state.contactedEarth = false` to the state object
- Add `state.contactedEarth = false` to `init()` reset
- Add `canCallEarth()`: selected unit must be standing on a comm_dish tile, `state.contactedEarth` must be false
- Add `callEarth()`: sets `state.contactedEarth = true`, logs "Elon contacted Earth! A new blueprint has been received..."
- Add button `#call-earth-btn` in `index.html` action panel
- Wire button in JS, add hotkey `L` (for "caLl"), add to hotkey table
- Update `updateUI()` to enable/disable the button

### 2. Add Mars Throne Structure

- Add `state.marsThronePlaced = false` to state object and `init()` reset
- Add `canBuildMarsThrone()`:
  - `state.contactedEarth` must be true
  - `state.marsThronePlaced` must be false
  - `state.resources.rocks >= 1` and `getTotalHovelEnergy() >= 1`
  - Must have an adjacent empty tile (no structure, no unit) — use `findAdjacentOpenTile()`
- Add `buildMarsThrone()`:
  - Consume ALL rocks: `state.resources.rocks = 0`
  - Consume ALL hovel energy: drain every hovel to 0
  - Place structure on adjacent empty tile via `findAdjacentOpenTile()`
  - Set `state.marsThronePlaced = true`
  - Log victory message
  - Set `state.gameOver = true` (prevents further actions, same as death)
  - Optionally set a `state.victory = true` flag to distinguish win from loss

### 3. Add Mars Throne Visual

- Add `drawMarsThrone(structure)` function following the pattern of `drawCommDish`, `drawSolarPanel`, etc.
- Design: A grand throne shape — stone base, tall back, golden crown/orb on top, label "THRONE"
- Add case to `drawStructure()` dispatch

### 4. Add Victory Message

- Distinguish game over from victory using `state.victory` flag
- Display a prominent victory message: "Elon has claimed Mars. Long live the King of Mars."
- Log the victory message

### 5. UI Integration

- Add button `#build-throne-btn` in `index.html`: "Build Mars Throne (All Resources)"
  - Only visible/enabled when `canBuildMarsThrone()` returns true
- Wire button click handler
- Add hotkey `M` (for "Mars Throne"), add to hotkey table
- Update `updateUI()` to enable/disable
- Add "victory" log entry CSS class in `style.css`

### 6. Tile Info

- Add "Mars Throne" case to `updateTileInfo()` structure text

## Files Modified

- `game.js` — all game logic, state, rendering, input
- `index.html` — two new buttons (Call Earth, Build Mars Throne), hotkey table entries
- `style.css` — victory log class, optional victory overlay styles

## Hotkey Assignments

- `L` — Call Earth (unused, mnemonic: "caLl")
- `M` — Build Mars Throne (unused, mnemonic: "Mars")

## Tech Debt Note

This is a vanilla HTML/CSS/JS project with all logic in a single 1500-line IIFE. No build system, no module system, no TypeScript. Working within these constraints as-is.

## Sources

- Existing codebase patterns (game.js lines 273-377 for structure drawing, 899-1057 for structure building, 1406-1476 for hotkeys)
