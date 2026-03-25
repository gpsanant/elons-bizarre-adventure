# Plan: Add Health Stat to All Units

## Summary

Add `maxHealth` to the `UNIT_TYPES` registry, propagate `health` and `maxHealth` through the `createUnit()` factory, and display health in the sidebar unit info panel.

## Codebase Overview

- **Stack**: Vanilla HTML/CSS/JS (no build system, no framework, no package.json)
- **Files**: `game.js` (single ~1400-line game engine), `index.html` (layout), `style.css` (Mars theme)
- **Deployment**: Static files served via nginx Docker container
- **Tests**: None exist

## Technical Approach

### 1. Add `maxHealth` to `UNIT_TYPES` (game.js:35–52)

Add a `maxHealth` field to each unit type definition in the existing registry object:

```js
elon: {
    name: "Elon Musk",
    movesPerTurn: 2,
    canHarvest: ["rocks"],
    lifespan: null,
    degradeResource: null,
    buildCost: null,
    maxHealth: 100,
},
rocktimus: {
    name: "Rocktimus Robot",
    movesPerTurn: 5,
    canHarvest: ["rocks"],
    lifespan: 5,
    degradeResource: { type: "rocks", amount: 1 },
    buildCost: { energy: 2, rocks: 1 },
    maxHealth: 50,
},
```

### 2. Propagate through `createUnit()` (game.js:54–65)

Add two properties to the returned unit object:

```js
health: def.maxHealth,
maxHealth: def.maxHealth,
```

Both start equal — `health` will be decremented by future combat mechanics; `maxHealth` stays constant.

### 3. Display in unit info panel

**HTML** (`index.html:24–25`): Add a `#unit-health` div between `#unit-moves` and `#unit-lifespan`:

```html
<div id="unit-health">Health: <span id="health-current">100</span> / <span id="health-max">100</span></div>
```

**JS** (`game.js`, `updateUI()` around line 763): Update the health spans from the selected unit:

```js
document.getElementById("health-current").textContent = unit.health;
document.getElementById("health-max").textContent = unit.maxHealth;
```

**CSS** (`style.css`): Add a style for `#unit-health` matching the existing `#unit-moves` pattern:

```css
#unit-health {
    color: #cc4444;
    font-size: 0.85rem;
    margin-top: 2px;
}
```

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Field name `maxHealth` in registry (not `health`) | Distinguishes the blueprint value from the mutable runtime value |
| Both `health` and `maxHealth` on unit instances | Follows the same pattern as `movesLeft`/`movesMax` |
| Red color `#cc4444` for health display | Fits the Mars theme palette and clearly signals a health stat |
| Single task | All changes span 3 files, ~15 lines total — no parallelism benefit |

## Scope Exclusions

- No combat or damage mechanics
- No health bars on the canvas (out of scope)
- No CI/CD workflow changes (constraint: `.github/workflows/` is off-limits)

## Tech Debt Note

This project is vanilla HTML/CSS/JS with no build system, no TypeScript, no package manager, and no test suite. All changes follow existing conventions (var declarations, imperative DOM manipulation, inline styles toggling).
