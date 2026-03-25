# Plan: Subpar Battery Structure

## Overview

Add a new constructible structure — the **Subpar Battery** — to the game. It costs 2 Energy + 2 Rock, must be placed adjacent to a Solar Panel or Rock Hovel, increases Rock Hovel energy storage capacity by 4 per battery (with two-hop adjacency via Solar Panels), and has a 2% per-turn explosion chance.

## Codebase Context

- **Stack**: Vanilla HTML/CSS/JS (no framework, no build system, no dependencies)
- **Files**: `index.html`, `style.css`, `game.js` (single IIFE, ~640 lines)
- **Existing patterns**: Structures stored in `state.structures[]` as `{ type, row, col, ...props }`. Build functions follow: check preconditions → deduct resources → push structure → add log → re-render. Canvas drawing dispatches in `drawStructure()` by `type`. Hotkeys handled in a `keydown` switch block.
- **Energy system**: `processSolarPanels()` generates energy into adjacent Rock Hovels with a hardcoded cap of `2`. The cap must become dynamic based on adjacent Subpar Batteries.

## Technical Approach

### 1. Dynamic Energy Capacity for Rock Hovels

Replace the hardcoded `energy < 2` cap in `processSolarPanels()` with a computed `getHovelCapacity(hovel)` function that:
- Base capacity: 2
- For each adjacent Subpar Battery (direct adjacency): +4
- For each Subpar Battery adjacent to a Solar Panel that is adjacent to the Rock Hovel (two-hop via Solar Panel): +4
- Deduplicate batteries that are both directly adjacent and reachable via a Solar Panel

**Helper functions needed:**
- `getAdjacentStructures(row, col, type)` — returns all structures of a given type adjacent to a position
- `getHovelCapacity(hovel)` — computes dynamic capacity using adjacency rules above

### 2. Build Subpar Battery

Following the existing `buildSolarPanel()` / `canBuildSolarPanel()` pattern:
- `canBuildSubparBattery()` — checks: >=2 Energy, >=2 Rock, empty tile, adjacent to at least one Solar Panel or Rock Hovel
- `buildSubparBattery()` — deducts 2 Energy + 2 Rock, pushes `{ type: "subpar_battery", row, col }`, adds log

### 3. Explosion Mechanic

New function `processSubparBatteryExplosions()` called at the start of `endTurn()`:
- Iterates all structures in reverse (for safe splice removal)
- For each `subpar_battery`: 2% chance to explode
- On explosion: remove from `state.structures`, add log with "explosion" type
- No need to explicitly recalculate hovel capacities — they are computed dynamically

### 4. Canvas Rendering

New `drawSubparBattery(structure)` function in the same style as `drawSolarPanel()`:
- Green/lime battery body with terminal nubs
- "BATTERY" label below
- Added to the `drawStructure()` dispatcher

### 5. UI Integration

- **Button**: `<button id="build-battery-btn">` in `#action-panel` after the Solar Panel button
- **Enable logic**: in `updateUI()`, enable when `canBuildSubparBattery()` returns true
- **Tile info**: in `updateTileInfo()`, show "Subpar Battery" for the structure name
- **Tile info for Rock Hovel**: change hardcoded `/ 2` to use `getHovelCapacity()`
- **Hotkey**: `T` key (for baTTery — `B` is taken by Rock Hovel)
- **Hotkey modal**: add row for `T` → "Build Subpar Battery"
- **Log styling**: new `.log-entry.explosion` CSS class (red/orange color)

### 6. Game Log Entries

- On build: `"Elon built a Subpar Battery at (X, Y)"` with type `"build"`
- On explosion: `"A Subpar Battery at (X, Y) exploded!"` with type `"explosion"`

## Key Decisions

1. **Dynamic capacity computation** (not stored on the hovel) — avoids stale state when batteries are added/removed/explode. Computed each time via `getHovelCapacity()`.
2. **Single task** — all changes are in 3 files (`game.js`, `index.html`, `style.css`), tightly coupled, no benefit to parallelization.
3. **Hotkey `T`** — available letter that doesn't conflict with existing bindings (WASD movement, G gather, B hovel, P solar, E end turn).
4. **Two-hop adjacency** — Battery → Solar Panel → Rock Hovel chain. Implemented by: for each adjacent Solar Panel to the hovel, find batteries adjacent to that Solar Panel.

## Files Modified

| File | Changes |
|------|---------|
| `game.js` | Add `getAdjacentStructures()`, `getHovelCapacity()`, `canBuildSubparBattery()`, `buildSubparBattery()`, `drawSubparBattery()`, `processSubparBatteryExplosions()`. Modify `drawStructure()`, `processSolarPanels()`, `endTurn()`, `updateUI()`, `updateTileInfo()`, keyboard handler. |
| `index.html` | Add build battery button in action panel, add hotkey row in modal table. |
| `style.css` | Add `.log-entry.explosion` style. |

## Constraints

- No `.github/workflows/` modifications
- No new dependencies
- No build system — plain vanilla JS
