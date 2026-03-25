/**
 * Elon's Bizarre Adventure - Mars Colony
 * A turn-based strategy game where Elon Musk crash-lands on Mars.
 */

(function () {
    "use strict";

    // --------------- Configuration ---------------
    const MAP_COLS = 24;
    const MAP_ROWS = 18;
    const TILE_SIZE = 40;
    const ROCK_CHANCE = 0.10;

    // Tile terrain types
    const TERRAIN = {
        SAND: "sand",
        DUST: "dust",
        CRATER: "crater",
    };

    const TERRAIN_COLORS = {
        [TERRAIN.SAND]: ["#8B4513", "#7A3B10", "#9C5015"],
        [TERRAIN.DUST]: ["#A0522D", "#934920", "#B05A30"],
        [TERRAIN.CRATER]: ["#654321", "#5A3A1C", "#704C26"],
    };

    // --------------- Dust Storm Configuration ---------------
    const DUST_STORM_LENGTH = 5;
    const DUST_STORM_FIRST_MAX_TURN = 10;
    const DUST_STORM_INTERVAL_MIN = 8;
    const DUST_STORM_INTERVAL_MAX = 15;

    // --------------- Unit Registry ---------------
    const UNIT_TYPES = {
        elon: {
            name: "Elon Musk",
            movesPerTurn: 2,
            canHarvest: ["rocks"],
            lifespan: null,
            degradeResource: null,
            buildCost: null,
        },
        rocktimus: {
            name: "Rocktimus Robot",
            movesPerTurn: 5,
            canHarvest: ["rocks"],
            lifespan: 5,
            degradeResource: { type: "rocks", amount: 1 },
            buildCost: { energy: 2, rocks: 1 },
        },
    };

    function createUnit(type, row, col) {
        var def = UNIT_TYPES[type];
        return {
            type: type,
            name: def.name,
            row: row,
            col: col,
            movesLeft: def.movesPerTurn,
            movesMax: def.movesPerTurn,
            turnsRemaining: def.lifespan,
        };
    }

    // --------------- State ---------------
    const state = {
        map: [],
        units: [],
        selectedUnit: 0,
        turn: 1,
        resources: { rocks: 0 },
        structures: [],
        robots: [],
        dustStorms: [],
        nextStormTurn: 0,
        dustStormIdCounter: 0,
        gameOver: false,
        selectedTile: null,
        logs: [],
        hotkeyModalOpen: false,
        contactedEarth: false,
        commDishesUsedThisTurn: [],
        callEarthDialogOpen: false,
    };

    function refreshView() {
        render();
        updateUI();
    }

    function getSelectedUnit() {
        return state.units[state.selectedUnit];
    }

    function isInBounds(row, col) {
        return row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS;
    }

    function canUnitHarvest(unit) {
        var tile = state.map[unit.row][unit.col];
        return tile.resource && UNIT_TYPES[unit.type].canHarvest.includes(tile.resource);
    }

    function getUnitAt(row, col) {
        for (var i = 0; i < state.units.length; i++) {
            if (state.units[i].row === row && state.units[i].col === col) {
                return state.units[i];
            }
        }
        return null;
    }

    // --------------- Map Generation ---------------
    function generateMap() {
        const terrainTypes = Object.values(TERRAIN);
        const map = [];
        for (let row = 0; row < MAP_ROWS; row++) {
            const mapRow = [];
            for (let col = 0; col < MAP_COLS; col++) {
                const terrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
                const hasRocks = Math.random() < ROCK_CHANCE;
                mapRow.push({
                    row,
                    col,
                    terrain,
                    resource: hasRocks ? "rocks" : null,
                    colorVariant: Math.floor(Math.random() * 3),
                });
            }
            map.push(mapRow);
        }
        return map;
    }

    function placeUnit(map) {
        let row, col;
        do {
            row = Math.floor(Math.random() * MAP_ROWS);
            col = Math.floor(Math.random() * MAP_COLS);
        } while (map[row][col].resource !== null);
        return createUnit("elon", row, col);
    }

    // --------------- Canvas Rendering ---------------
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
        canvas.width = MAP_COLS * TILE_SIZE;
        canvas.height = MAP_ROWS * TILE_SIZE;
    }

    function drawTile(tile) {
        const x = tile.col * TILE_SIZE;
        const y = tile.row * TILE_SIZE;
        const colors = TERRAIN_COLORS[tile.terrain];
        ctx.fillStyle = colors[tile.colorVariant];
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Grid line
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

        // Resource: rocks
        if (tile.resource === "rocks") {
            drawRocks(x, y);
        }
    }

    function drawRocks(x, y) {
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2;
        ctx.fillStyle = "#888888";
        // Draw a small cluster of rocks
        drawCircle(cx - 5, cy + 2, 6);
        ctx.fillStyle = "#777777";
        drawCircle(cx + 5, cy - 1, 5);
        ctx.fillStyle = "#999999";
        drawCircle(cx - 1, cy - 5, 4);
    }

    function drawCircle(x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawSubparBattery(structure) {
        var x = structure.col * TILE_SIZE;
        var y = structure.row * TILE_SIZE;

        // Battery body (green)
        ctx.fillStyle = "#2d8a2d";
        ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);

        // Battery body outline
        ctx.strokeStyle = "#1a5c1a";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);

        // Terminal nub (top)
        ctx.fillStyle = "#66ff66";
        ctx.fillRect(x + TILE_SIZE / 2 - 3, y + 4, 6, 5);

        // Terminal nub (bottom)
        ctx.fillRect(x + TILE_SIZE / 2 - 3, y + TILE_SIZE - 9, 6, 5);

        // Inner highlight
        ctx.fillStyle = "#44cc44";
        ctx.fillRect(x + 10, y + 10, TILE_SIZE - 20, TILE_SIZE - 20);

        // Lightning bolt icon
        ctx.fillStyle = "#1a5c1a";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚡", x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);

        // Label
        ctx.fillStyle = "#66ff66";
        ctx.font = "bold 5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("BATTERY", x + TILE_SIZE / 2, y + TILE_SIZE - 1);
    }

    function drawCommDish(structure) {
        var x = structure.col * TILE_SIZE;
        var y = structure.row * TILE_SIZE;

        // Base platform (dark gray)
        ctx.fillStyle = "#3a3a4a";
        ctx.fillRect(x + 10, y + TILE_SIZE - 12, TILE_SIZE - 20, 6);

        // Support pole
        ctx.fillStyle = "#666677";
        ctx.fillRect(x + TILE_SIZE / 2 - 2, y + 10, 4, TILE_SIZE - 22);

        // Dish (arc)
        ctx.fillStyle = "#8899bb";
        ctx.beginPath();
        ctx.ellipse(x + TILE_SIZE / 2, y + 12, 12, 7, 0, Math.PI, 0);
        ctx.fill();

        // Dish inner
        ctx.fillStyle = "#aabbdd";
        ctx.beginPath();
        ctx.ellipse(x + TILE_SIZE / 2, y + 13, 9, 5, 0, Math.PI, 0);
        ctx.fill();

        // Feed horn (small line from dish center upward)
        ctx.strokeStyle = "#ccddff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + TILE_SIZE / 2, y + 12);
        ctx.lineTo(x + TILE_SIZE / 2 + 6, y + 4);
        ctx.stroke();

        // Signal dot
        ctx.fillStyle = "#00ffcc";
        drawCircle(x + TILE_SIZE / 2 + 6, y + 4, 2);

        // Frame outline
        ctx.strokeStyle = "#556688";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 2, TILE_SIZE - 8, TILE_SIZE - 6);

        // Label
        ctx.fillStyle = "#88ccff";
        ctx.font = "bold 6px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("COMM", x + TILE_SIZE / 2, y + TILE_SIZE - 1);
    }

    function drawStructure(structure) {
        if (structure.type === "solar_panel") {
            drawSolarPanel(structure);
            return;
        }
        if (structure.type === "subpar_battery") {
            drawSubparBattery(structure);
            return;
        }
        if (structure.type === "comm_dish") {
            drawCommDish(structure);
            return;
        }
        var x = structure.col * TILE_SIZE;
        var y = structure.row * TILE_SIZE;

        // Stone base
        ctx.fillStyle = "#6b5b4f";
        ctx.beginPath();
        ctx.moveTo(x + 6, y + TILE_SIZE - 6);
        ctx.lineTo(x + TILE_SIZE - 6, y + TILE_SIZE - 6);
        ctx.lineTo(x + TILE_SIZE - 8, y + 14);
        ctx.lineTo(x + 8, y + 14);
        ctx.closePath();
        ctx.fill();

        // Darker stone outline
        ctx.strokeStyle = "#4a3c33";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Roof (triangle)
        ctx.fillStyle = "#8b7355";
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 16);
        ctx.lineTo(x + TILE_SIZE - 4, y + 16);
        ctx.lineTo(x + TILE_SIZE / 2, y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#5a4a3a";
        ctx.stroke();

        // Door
        ctx.fillStyle = "#2a1a0a";
        ctx.fillRect(x + TILE_SIZE / 2 - 3, y + TILE_SIZE - 12, 6, 6);

        // Label
        ctx.fillStyle = "#d4a574";
        ctx.font = "bold 7px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("HOVEL", x + TILE_SIZE / 2, y + TILE_SIZE - 1);
    }

    function drawSolarPanel(structure) {
        var x = structure.col * TILE_SIZE;
        var y = structure.row * TILE_SIZE;

        // Panel base (dark frame)
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(x + 4, y + 8, TILE_SIZE - 8, TILE_SIZE - 16);

        // Solar cells (blue gradient)
        ctx.fillStyle = "#2255aa";
        ctx.fillRect(x + 6, y + 10, TILE_SIZE - 12, TILE_SIZE - 20);

        // Grid lines on panel
        ctx.strokeStyle = "#3366cc";
        ctx.lineWidth = 0.5;
        // Horizontal lines
        var panelTop = y + 10;
        var panelBottom = y + TILE_SIZE - 10;
        var panelLeft = x + 6;
        var panelRight = x + TILE_SIZE - 6;
        var cellHeight = (panelBottom - panelTop) / 3;
        for (var i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(panelLeft, panelTop + cellHeight * i);
            ctx.lineTo(panelRight, panelTop + cellHeight * i);
            ctx.stroke();
        }
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(x + TILE_SIZE / 2, panelTop);
        ctx.lineTo(x + TILE_SIZE / 2, panelBottom);
        ctx.stroke();

        // Shine effect
        ctx.fillStyle = "rgba(100, 180, 255, 0.25)";
        ctx.fillRect(x + 7, y + 11, 8, 5);

        // Support pole
        ctx.fillStyle = "#555555";
        ctx.fillRect(x + TILE_SIZE / 2 - 2, y + TILE_SIZE - 10, 4, 6);

        // Frame outline
        ctx.strokeStyle = "#334466";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 8, TILE_SIZE - 8, TILE_SIZE - 16);

        // Label
        ctx.fillStyle = "#66aaff";
        ctx.font = "bold 6px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SOLAR", x + TILE_SIZE / 2, y + TILE_SIZE - 1);
    }

    function drawElonUnit(unit, isSelected) {
        const x = unit.col * TILE_SIZE;
        const y = unit.row * TILE_SIZE;

        // Highlight the unit tile
        ctx.fillStyle = isSelected ? "rgba(255, 204, 0, 0.25)" : "rgba(255, 204, 0, 0.10)";
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Draw Elon as a simple character
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2;

        if (unit.name === "Elon Bones") {
            // Draw bones (game over state)
            ctx.fillStyle = "#ccccaa";
            // Skull
            drawCircle(cx, cy - 6, 7);
            ctx.fillStyle = "#1a0a0a";
            drawCircle(cx - 3, cy - 7, 2);
            drawCircle(cx + 3, cy - 7, 2);
            // Crossbones
            ctx.strokeStyle = "#ccccaa";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy + 2);
            ctx.lineTo(cx + 10, cy + 14);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + 10, cy + 2);
            ctx.lineTo(cx - 10, cy + 14);
            ctx.stroke();
            // Label
            ctx.fillStyle = "#aa8866";
            ctx.font = "bold 7px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("BONES", cx, y + TILE_SIZE - 2);
            return;
        }

        // Spacesuit body
        ctx.fillStyle = "#dddddd";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 6, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = "#4488cc";
        drawCircle(cx, cy - 6, 8);

        // Visor
        ctx.fillStyle = "#88ccff";
        drawCircle(cx, cy - 6, 5);

        // Face
        ctx.fillStyle = "#ffcc88";
        drawCircle(cx, cy - 6, 4);

        // Label
        ctx.fillStyle = isSelected ? "#ffcc00" : "#aa8800";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ELON", cx, y + TILE_SIZE - 2);
    }

    function drawRocktimusRobot(unit, isSelected) {
        var x = unit.col * TILE_SIZE;
        var y = unit.row * TILE_SIZE;
        var cx = x + TILE_SIZE / 2;

        // Highlight the unit tile
        ctx.fillStyle = isSelected ? "rgba(255, 204, 0, 0.25)" : "rgba(100, 200, 160, 0.10)";
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Metallic gray rectangular body
        ctx.fillStyle = "#888888";
        ctx.fillRect(x + 10, y + 10, TILE_SIZE - 20, TILE_SIZE - 18);

        // Darker outline
        ctx.strokeStyle = "#555555";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 10, y + 10, TILE_SIZE - 20, TILE_SIZE - 18);

        // Head (smaller rect on top)
        ctx.fillStyle = "#999999";
        ctx.fillRect(x + 13, y + 4, TILE_SIZE - 26, 8);
        ctx.strokeStyle = "#666666";
        ctx.strokeRect(x + 13, y + 4, TILE_SIZE - 26, 8);

        // Orange/amber eyes
        ctx.fillStyle = "#ff8800";
        drawCircle(cx - 4, y + 8, 2);
        drawCircle(cx + 4, y + 8, 2);

        // Rocky texture details (small gray circles on body)
        ctx.fillStyle = "#777777";
        drawCircle(cx - 3, y + 18, 2);
        ctx.fillStyle = "#999999";
        drawCircle(cx + 4, y + 22, 2);
        ctx.fillStyle = "#6a6a6a";
        drawCircle(cx, y + 26, 1.5);

        // Label
        ctx.fillStyle = isSelected ? "#44ccaa" : "#338866";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ROBO", cx, y + TILE_SIZE - 2);

        // Lifespan badge (small number in top-right corner)
        if (unit.turnsRemaining !== null) {
            ctx.fillStyle = "#cc3333";
            drawCircle(x + TILE_SIZE - 8, y + 6, 6);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 8px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(String(unit.turnsRemaining), x + TILE_SIZE - 8, y + 9);
        }
    }

    // --------------- Dust Storm Rendering ---------------
    function drawDustStorm(storm) {
        for (var i = 0; i < storm.tiles.length; i++) {
            var tile = storm.tiles[i];
            // Only draw tiles that are on the map
            if (tile.row < 0 || tile.row >= MAP_ROWS || tile.col < 0 || tile.col >= MAP_COLS) continue;

            var x = tile.col * TILE_SIZE;
            var y = tile.row * TILE_SIZE;

            // Dust overlay
            ctx.fillStyle = "rgba(210, 180, 120, 0.45)";
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Swirling dust particles
            ctx.fillStyle = "rgba(180, 150, 90, 0.7)";
            var seed = (storm.id * 7 + i * 13 + state.turn * 3) % 100;
            for (var p = 0; p < 6; p++) {
                var px = x + ((seed + p * 17) % TILE_SIZE);
                var py = y + ((seed + p * 23) % TILE_SIZE);
                var pr = 1.5 + (p % 3);
                drawCircle(px, py, pr);
            }

            // Swirl lines
            ctx.strokeStyle = "rgba(200, 170, 100, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 10, 0, Math.PI * 1.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2 + 4, y + TILE_SIZE / 2 - 4, 6, Math.PI * 0.5, Math.PI * 2);
            ctx.stroke();

            // Storm border
            ctx.strokeStyle = "rgba(210, 160, 80, 0.6)";
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
    }

    function drawHighlight(tile, color) {
        const x = tile.col * TILE_SIZE;
        const y = tile.row * TILE_SIZE;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }

    function drawMoveRange(unit) {
        if (unit.movesLeft <= 0) return;

        // BFS flood fill for reachable tiles within movesLeft steps (8-directional)
        var visited = {};
        var queue = [{ row: unit.row, col: unit.col, dist: 0 }];
        visited[unit.row + "," + unit.col] = true;

        while (queue.length > 0) {
            var current = queue.shift();
            if (current.dist >= unit.movesLeft) continue;

            for (var dr = -1; dr <= 1; dr++) {
                for (var dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    var nr = current.row + dr;
                    var nc = current.col + dc;
                    var key = nr + "," + nc;
                    if (isInBounds(nr, nc) && !visited[key]) {
                        visited[key] = true;
                        queue.push({ row: nr, col: nc, dist: current.dist + 1 });
                    }
                }
            }
        }

        // Draw all reachable tiles (except the unit's own tile)
        for (var tileKey in visited) {
            var parts = tileKey.split(",");
            var r = parseInt(parts[0], 10);
            var c = parseInt(parts[1], 10);
            if (r === unit.row && c === unit.col) continue;
            var tx = c * TILE_SIZE;
            var ty = r * TILE_SIZE;
            ctx.fillStyle = "rgba(100, 180, 255, 0.15)";
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = "rgba(100, 180, 255, 0.4)";
            ctx.lineWidth = 1;
            ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
    }

    function getCommDishRevealedTiles() {
        var revealed = {};
        for (var i = 0; i < state.structures.length; i++) {
            var s = state.structures[i];
            if (s.type !== "comm_dish") continue;
            // BFS from the comm dish up to 5 tiles
            var visited = {};
            var queue = [{ row: s.row, col: s.col, dist: 0 }];
            visited[s.row + "," + s.col] = true;
            while (queue.length > 0) {
                var current = queue.shift();
                // Check if this tile has rocks
                if (isInBounds(current.row, current.col)) {
                    var tile = state.map[current.row][current.col];
                    if (tile.resource === "rocks") {
                        revealed[current.row + "," + current.col] = true;
                    }
                }
                if (current.dist >= 5) continue;
                for (var dr = -1; dr <= 1; dr++) {
                    for (var dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        var nr = current.row + dr;
                        var nc = current.col + dc;
                        var key = nr + "," + nc;
                        if (isInBounds(nr, nc) && !visited[key]) {
                            visited[key] = true;
                            queue.push({ row: nr, col: nc, dist: current.dist + 1 });
                        }
                    }
                }
            }
        }
        return revealed;
    }

    function drawCommDishOverlay(revealedTiles) {
        for (var key in revealedTiles) {
            var parts = key.split(",");
            var r = parseInt(parts[0], 10);
            var c = parseInt(parts[1], 10);
            var tx = c * TILE_SIZE;
            var ty = r * TILE_SIZE;
            // Subtle cyan border overlay
            ctx.strokeStyle = "rgba(0, 255, 220, 0.45)";
            ctx.lineWidth = 2;
            ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            // Faint fill
            ctx.fillStyle = "rgba(0, 255, 220, 0.08)";
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
        }
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw all tiles
        for (let row = 0; row < MAP_ROWS; row++) {
            for (let col = 0; col < MAP_COLS; col++) {
                drawTile(state.map[row][col]);
            }
        }

        // Draw Comm Dish rock reveal overlay
        var revealedTiles = getCommDishRevealedTiles();
        drawCommDishOverlay(revealedTiles);

        // Draw structures
        for (var i = 0; i < state.structures.length; i++) {
            drawStructure(state.structures[i]);
        }

        // Draw dust storms
        for (var s = 0; s < state.dustStorms.length; s++) {
            drawDustStorm(state.dustStorms[s]);
        }

        // Draw movement range for selected unit
        var selected = getSelectedUnit();
        if (selected) {
            drawMoveRange(selected);
        }

        // Draw all units
        for (var u = 0; u < state.units.length; u++) {
            var unit = state.units[u];
            var isSelected = (u === state.selectedUnit);
            if (unit.type === "rocktimus") {
                drawRocktimusRobot(unit, isSelected);
            } else {
                drawElonUnit(unit, isSelected);
            }
        }

        // Draw selected unit border highlight
        if (selected) {
            drawHighlight({ col: selected.col, row: selected.row }, "#ffcc00");
        }

        // Draw selected tile highlight
        if (state.selectedTile) {
            drawHighlight(state.selectedTile, "#ffcc00");
        }
    }

    // --------------- UI Updates ---------------
    function updateUI() {
        var unit = getSelectedUnit();
        document.getElementById("turn-number").textContent = state.turn;
        document.getElementById("unit-name").textContent = unit.name;
        document.getElementById("moves-left").textContent = unit.movesLeft;
        document.getElementById("moves-max").textContent = unit.movesMax;
        document.getElementById("rocks-count").textContent = state.resources.rocks;
        document.getElementById("energy-count").textContent = getTotalHovelEnergy();

        // Lifespan display
        var lifespanEl = document.getElementById("unit-lifespan");
        if (lifespanEl) {
            if (unit.turnsRemaining !== null) {
                lifespanEl.textContent = "Lifespan: " + unit.turnsRemaining + " turns";
                lifespanEl.style.display = "";
            } else {
                lifespanEl.textContent = "";
                lifespanEl.style.display = "none";
            }
        }

        // Gather button
        const gatherBtn = document.getElementById("gather-btn");
        var canGather = canUnitHarvest(unit);
        gatherBtn.disabled = !canGather;
        gatherBtn.style.display = canGather ? "" : "none";

        // Build Rock Hovel button
        var buildBtn = document.getElementById("build-hovel-btn");
        var hasStructureOnTile = getStructureAt(unit.row, unit.col) !== null;
        var canHovel = state.resources.rocks >= 10 && !hasStructureOnTile;
        buildBtn.disabled = !canHovel;
        buildBtn.style.display = canHovel ? "" : "none";

        // Build Solar Panel button
        var solarBtn = document.getElementById("build-solar-btn");
        var canSolar = canBuildSolarPanel();
        solarBtn.disabled = !canSolar;
        solarBtn.style.display = canSolar ? "" : "none";

        // Build Subpar Battery button
        var batteryBtn = document.getElementById("build-battery-btn");
        var canBattery = canBuildSubparBattery();
        batteryBtn.disabled = !canBattery;
        batteryBtn.style.display = canBattery ? "" : "none";

        // Build Rocktimus button
        var rocktimusBtn = document.getElementById("build-rocktimus-btn");
        var canRock = canBuildRocktimus();
        rocktimusBtn.disabled = !canRock;
        rocktimusBtn.style.display = canRock ? "" : "none";

        // Build Comm Dish button
        var commDishBtn = document.getElementById("build-comm-dish-btn");
        var canComm = canBuildCommDish();
        commDishBtn.disabled = !canComm;
        commDishBtn.style.display = canComm ? "" : "none";

        // No actions fallback message
        var noActionsMsg = document.getElementById("no-actions-msg");
        var anyVisible = canGather || canHovel || canSolar || canBattery || canRock || canComm;
        noActionsMsg.style.display = anyVisible ? "none" : "";

        // Call Earth button
        var callEarthBtn = document.getElementById("call-earth-btn");
        callEarthBtn.disabled = !canCallEarth();

        // Tile info
        updateTileInfo();
    }

    function updateTileInfo() {
        const el = document.getElementById("tile-details");
        if (!state.selectedTile) {
            el.innerHTML = "Click a tile to inspect";
            return;
        }
        const tile = state.selectedTile;
        const terrainName = tile.terrain.charAt(0).toUpperCase() + tile.terrain.slice(1);
        const resourceText = tile.resource ? "Rocks" : "None";
        var unitOnTile = getUnitAt(tile.row, tile.col);
        var tileStructure = getStructureAt(tile.row, tile.col);
        var structureText = "None";
        var energyText = "";
        if (tileStructure) {
            if (tileStructure.type === "rock_hovel") {
                structureText = "Rock Hovel";
                energyText = '<div><strong>Energy:</strong> ' + tileStructure.energy + ' / ' + getHovelCapacity(tileStructure) + '</div>';
            } else if (tileStructure.type === "solar_panel") {
                structureText = "Solar Panel";
            } else if (tileStructure.type === "subpar_battery") {
                structureText = "Subpar Battery";
            } else if (tileStructure.type === "comm_dish") {
                structureText = "Comm Dish";
            }
        }
        // Dust storm info
        var stormInfo = getDustStormAt(tile.row, tile.col);
        var stormText = "";
        if (stormInfo) {
            var dirLabel = stormInfo.direction.charAt(0).toUpperCase() + stormInfo.direction.slice(1);
            stormText = '<div><strong>Dust Storm:</strong> Moving ' + dirLabel + '</div>';
        }
        var unitText = unitOnTile ? '<div><strong>Unit:</strong> ' + unitOnTile.name + '</div>' : "";
        el.innerHTML = '<div><strong>Terrain:</strong> ' + terrainName + '</div>' +
            '<div><strong>Position:</strong> (' + tile.col + ', ' + tile.row + ')</div>' +
            '<div><strong>Resource:</strong> ' + resourceText + '</div>' +
            '<div><strong>Structure:</strong> ' + structureText + '</div>' +
            energyText + stormText + unitText;
    }

    function addLog(message, type) {
        state.logs.unshift({ message, type });
        if (state.logs.length > 50) state.logs.pop();
        renderLog();
    }

    function renderLog() {
        const logEl = document.getElementById("game-log");
        logEl.innerHTML = state.logs
            .map((l) => `<div class="log-entry ${l.type}">${l.message}</div>`)
            .join("");
    }

    // --------------- Game Actions ---------------
    function moveUnit(targetRow, targetCol) {
        if (state.gameOver) return;
        const unit = getSelectedUnit();
        if (unit.movesLeft <= 0) return;

        const dr = Math.abs(targetRow - unit.row);
        const dc = Math.abs(targetCol - unit.col);

        // Must be adjacent (including diagonal)
        if (dr > 1 || dc > 1 || (dr === 0 && dc === 0)) return;

        if (!isInBounds(targetRow, targetCol)) return;

        // Cannot move onto a tile occupied by another unit
        if (getUnitAt(targetRow, targetCol)) return;

        unit.row = targetRow;
        unit.col = targetCol;
        unit.movesLeft--;

        addLog(unit.name + " moved to (" + targetCol + ", " + targetRow + ")", "move");

        state.selectedTile = state.map[targetRow][targetCol];
        refreshView();
    }

    function gatherResource() {
        var unit = getSelectedUnit();
        if (!canUnitHarvest(unit)) return;
        var tile = state.map[unit.row][unit.col];
        var resourceType = tile.resource;

        tile.resource = null;
        state.resources[resourceType]++;
        var label = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
        addLog(unit.name + " gathered " + label + "! (Total: " + state.resources[resourceType] + ")", "gather");

        refreshView();
    }

    function getStructureAt(row, col) {
        for (var i = 0; i < state.structures.length; i++) {
            if (state.structures[i].row === row && state.structures[i].col === col) {
                return state.structures[i];
            }
        }
        return null;
    }

    function buildRockHovel() {
        if (state.resources.rocks < 10) return;
        var unit = getSelectedUnit();
        if (getStructureAt(unit.row, unit.col) !== null) return;

        state.resources.rocks -= 10;
        state.structures.push({
            type: "rock_hovel",
            row: unit.row,
            col: unit.col,
            energy: 0,
        });

        addLog(unit.name + " built a Rock Hovel at (" + unit.col + ", " + unit.row + ")", "build");

        refreshView();
    }

    function getAdjacentStructures(row, col, type) {
        var results = [];
        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                var nr = row + dr;
                var nc = col + dc;
                if (!isInBounds(nr, nc)) continue;
                var s = getStructureAt(nr, nc);
                if (s && s.type === type) results.push(s);
            }
        }
        return results;
    }

    function getHovelCapacity(hovel) {
        var base = 2;
        var seen = new Set();
        // Direct adjacent batteries
        var directBatteries = getAdjacentStructures(hovel.row, hovel.col, "subpar_battery");
        for (var i = 0; i < directBatteries.length; i++) {
            seen.add(directBatteries[i].row + "," + directBatteries[i].col);
        }
        // Two-hop: batteries adjacent to Solar Panels that are adjacent to the hovel
        var adjacentPanels = getAdjacentStructures(hovel.row, hovel.col, "solar_panel");
        for (var p = 0; p < adjacentPanels.length; p++) {
            var panelBatteries = getAdjacentStructures(adjacentPanels[p].row, adjacentPanels[p].col, "subpar_battery");
            for (var b = 0; b < panelBatteries.length; b++) {
                seen.add(panelBatteries[b].row + "," + panelBatteries[b].col);
            }
        }
        return base + seen.size * 4;
    }

    function canBuildSolarPanel() {
        var unit = getSelectedUnit();
        if (state.resources.rocks < 2) return false;
        if (getStructureAt(unit.row, unit.col) !== null) return false;
        var hovels = getAdjacentStructures(unit.row, unit.col, "rock_hovel");
        return hovels.length > 0;
    }

    function buildSolarPanel() {
        if (!canBuildSolarPanel()) return;
        var unit = getSelectedUnit();

        state.resources.rocks -= 2;
        state.structures.push({
            type: "solar_panel",
            row: unit.row,
            col: unit.col,
        });

        addLog(unit.name + " built a Solar Panel at (" + unit.col + ", " + unit.row + ")", "build");

        refreshView();
    }

    function canBuildSubparBattery() {
        var unit = getSelectedUnit();
        if (state.resources.rocks < 2) return false;
        // Unit must be standing in a Rock Hovel with enough energy
        var hovel = getStructureAt(unit.row, unit.col);
        if (!hovel || hovel.type !== "rock_hovel") return false;
        if (hovel.energy < 2) return false;
        // Must have at least one adjacent empty tile to place the battery
        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                var nr = unit.row + dr;
                var nc = unit.col + dc;
                if (!isInBounds(nr, nc)) continue;
                if (getStructureAt(nr, nc) === null) return true;
            }
        }
        return false;
    }

    function buildSubparBattery() {
        if (!canBuildSubparBattery()) return;
        var unit = getSelectedUnit();
        var hovel = getStructureAt(unit.row, unit.col);

        // Find an adjacent empty tile to place the battery
        var targetRow = -1, targetCol = -1;
        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                var nr = unit.row + dr;
                var nc = unit.col + dc;
                if (!isInBounds(nr, nc)) continue;
                if (getStructureAt(nr, nc) === null) {
                    targetRow = nr;
                    targetCol = nc;
                    break;
                }
            }
            if (targetRow >= 0) break;
        }
        if (targetRow < 0) return;

        hovel.energy -= 2;
        state.resources.rocks -= 2;
        state.structures.push({
            type: "subpar_battery",
            row: targetRow,
            col: targetCol,
        });

        addLog(unit.name + " built a Subpar Battery at (" + targetCol + ", " + targetRow + ")", "build");

        refreshView();
    }

    // --------------- Rocktimus Construction ---------------
    function findAdjacentOpenTile(row, col) {
        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                var nr = row + dr;
                var nc = col + dc;
                if (!isInBounds(nr, nc)) continue;
                if (getUnitAt(nr, nc)) continue;
                if (getStructureAt(nr, nc)) continue;
                return { row: nr, col: nc };
            }
        }
        return null;
    }

    function canBuildRocktimus() {
        var unit = getSelectedUnit();
        var structure = getStructureAt(unit.row, unit.col);
        if (!structure || structure.type !== "rock_hovel") return false;
        if (structure.energy < 2) return false;
        if (state.resources.rocks < 1) return false;
        if (!findAdjacentOpenTile(unit.row, unit.col)) return false;
        return true;
    }

    function buildRocktimus() {
        if (!canBuildRocktimus()) return;
        var unit = getSelectedUnit();
        var hovel = getStructureAt(unit.row, unit.col);

        hovel.energy -= 2;
        state.resources.rocks -= 1;

        var openTile = findAdjacentOpenTile(unit.row, unit.col);
        var robot = createUnit("rocktimus", openTile.row, openTile.col);
        state.units.push(robot);

        addLog(unit.name + " constructed a Rocktimus Robot at (" + openTile.col + ", " + openTile.row + ")", "construct");

        refreshView();
    }

    // --------------- Call Earth Action ---------------
    function getAdjacentCommDish(unit) {
        // Check if unit is on a comm dish
        var onDish = getStructureAt(unit.row, unit.col);
        if (onDish && onDish.type === "comm_dish") return onDish;
        // Check adjacent tiles
        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                var nr = unit.row + dr;
                var nc = unit.col + dc;
                if (!isInBounds(nr, nc)) continue;
                var s = getStructureAt(nr, nc);
                if (s && s.type === "comm_dish") return s;
            }
        }
        return null;
    }

    function canCallEarth() {
        if (state.gameOver) return false;
        var unit = getSelectedUnit();
        var dish = getAdjacentCommDish(unit);
        if (!dish) return false;
        // Check if this dish has already been used this turn
        var dishKey = dish.row + "," + dish.col;
        return state.commDishesUsedThisTurn.indexOf(dishKey) === -1;
    }

    function callEarth() {
        if (!canCallEarth()) return;
        var unit = getSelectedUnit();
        var dish = getAdjacentCommDish(unit);
        var dishKey = dish.row + "," + dish.col;
        state.commDishesUsedThisTurn.push(dishKey);

        var success = Math.random() < 0.01;
        var dialogEl = document.getElementById("call-earth-dialog");
        var msgEl = document.getElementById("call-earth-message");

        if (success) {
            state.contactedEarth = true;
            msgEl.textContent = "We hope you are enjoying your exile on Mars, Elon. No, we have not changed our minds.";
            addLog(unit.name + " contacted Earth from Comm Dish at (" + dish.col + ", " + dish.row + ")! They responded!", "comm");
        } else {
            msgEl.textContent = "*nothing but static*";
            addLog(unit.name + " tried to call Earth from Comm Dish at (" + dish.col + ", " + dish.row + ")... nothing but static.", "comm");
        }

        state.callEarthDialogOpen = true;
        dialogEl.classList.remove("hidden");
        refreshView();
    }

    function closeCallEarthDialog() {
        state.callEarthDialogOpen = false;
        document.getElementById("call-earth-dialog").classList.add("hidden");
    }

    // --------------- Comm Dish Construction ---------------
    function canBuildCommDish() {
        var unit = getSelectedUnit();
        if (state.resources.rocks < 10) return false;
        if (getTotalHovelEnergy() < 10) return false;
        if (getStructureAt(unit.row, unit.col) !== null) return false;
        return true;
    }

    function buildCommDish() {
        if (!canBuildCommDish()) return;
        var unit = getSelectedUnit();

        state.resources.rocks -= 10;

        // Deduct 10 energy distributed across hovels in order
        var energyToSpend = 10;
        for (var i = 0; i < state.structures.length; i++) {
            if (energyToSpend <= 0) break;
            var s = state.structures[i];
            if (s.type !== "rock_hovel") continue;
            var drain = Math.min(s.energy, energyToSpend);
            s.energy -= drain;
            energyToSpend -= drain;
        }

        state.structures.push({
            type: "comm_dish",
            row: unit.row,
            col: unit.col,
        });

        addLog(unit.name + " built a Comm Dish at (" + unit.col + ", " + unit.row + ")", "build");

        refreshView();
    }

    function getTotalHovelEnergy() {
        var total = 0;
        for (var i = 0; i < state.structures.length; i++) {
            if (state.structures[i].type === "rock_hovel") {
                total += state.structures[i].energy;
            }
        }
        return total;
    }

    // --------------- Solar Panels ---------------
    function processSolarPanels() {
        var totalGenerated = 0;
        for (var i = 0; i < state.structures.length; i++) {
            var panel = state.structures[i];
            if (panel.type !== "solar_panel") continue;

            // 50% chance to generate energy
            if (Math.random() < 0.5) {
                var hovels = getAdjacentStructures(panel.row, panel.col, "rock_hovel");
                for (var j = 0; j < hovels.length; j++) {
                    if (hovels[j].energy < getHovelCapacity(hovels[j])) {
                        hovels[j].energy++;
                        totalGenerated++;
                        break;
                    }
                }
            }
        }
        if (totalGenerated > 0) {
            addLog("Solar Panels generated " + totalGenerated + " Energy! (Total: " + getTotalHovelEnergy() + ")", "energy");
        }
    }

    // --------------- Unit Degradation ---------------
    function processUnitDegradation() {
        for (var i = state.units.length - 1; i >= 0; i--) {
            var unit = state.units[i];
            if (unit.turnsRemaining === null) continue;
            unit.turnsRemaining--;
            if (unit.turnsRemaining <= 0) {
                // Place degrade resource on tile
                var def = UNIT_TYPES[unit.type];
                if (def.degradeResource) {
                    var tile = state.map[unit.row][unit.col];
                    tile.resource = def.degradeResource.type;
                }
                addLog(unit.name + " has degraded at (" + unit.col + ", " + unit.row + ")", "degrade");
                state.units.splice(i, 1);
                // Adjust selectedUnit to track the same unit
                if (i < state.selectedUnit) {
                    state.selectedUnit--;
                } else if (state.selectedUnit >= state.units.length) {
                    state.selectedUnit = 0;
                }
            }
        }
    }

    // --------------- Dust Storm Logic ---------------
    function isUnitInHovel(row, col) {
        var structure = getStructureAt(row, col);
        return structure !== null && structure.type === "rock_hovel";
    }

    function getDustStormAt(row, col) {
        for (var i = 0; i < state.dustStorms.length; i++) {
            var storm = state.dustStorms[i];
            for (var j = 0; j < storm.tiles.length; j++) {
                if (storm.tiles[j].row === row && storm.tiles[j].col === col) {
                    return storm;
                }
            }
        }
        return null;
    }

    function spawnDustStorm() {
        // Pick a random edge and direction
        // 0=north edge moving south, 1=south edge moving north,
        // 2=west edge moving east, 3=east edge moving west
        var edge = Math.floor(Math.random() * 4);
        var storm = {
            id: state.dustStormIdCounter++,
            tiles: [],
            direction: "",
        };

        if (edge === 0) {
            // Spawns on top edge (row 0), moves south
            storm.direction = "south";
            var startCol = Math.floor(Math.random() * (MAP_COLS - DUST_STORM_LENGTH + 1));
            for (var i = 0; i < DUST_STORM_LENGTH; i++) {
                storm.tiles.push({ row: 0, col: startCol + i });
            }
        } else if (edge === 1) {
            // Spawns on bottom edge (last row), moves north
            storm.direction = "north";
            var startCol = Math.floor(Math.random() * (MAP_COLS - DUST_STORM_LENGTH + 1));
            for (var i = 0; i < DUST_STORM_LENGTH; i++) {
                storm.tiles.push({ row: MAP_ROWS - 1, col: startCol + i });
            }
        } else if (edge === 2) {
            // Spawns on left edge (col 0), moves east
            storm.direction = "east";
            var startRow = Math.floor(Math.random() * (MAP_ROWS - DUST_STORM_LENGTH + 1));
            for (var i = 0; i < DUST_STORM_LENGTH; i++) {
                storm.tiles.push({ row: startRow + i, col: 0 });
            }
        } else {
            // Spawns on right edge (last col), moves west
            storm.direction = "west";
            var startRow = Math.floor(Math.random() * (MAP_ROWS - DUST_STORM_LENGTH + 1));
            for (var i = 0; i < DUST_STORM_LENGTH; i++) {
                storm.tiles.push({ row: startRow + i, col: MAP_COLS - 1 });
            }
        }

        state.dustStorms.push(storm);
        addLog("A Dust Storm has appeared on the " + getEdgeName(edge) + " edge, moving " + storm.direction + "!", "storm");
    }

    function getEdgeName(edge) {
        var names = ["northern", "southern", "western", "eastern"];
        return names[edge];
    }

    function moveDustStorms() {
        var stormsToRemove = [];

        for (var i = 0; i < state.dustStorms.length; i++) {
            var storm = state.dustStorms[i];
            // Move each tile in the storm's direction
            for (var j = 0; j < storm.tiles.length; j++) {
                var tile = storm.tiles[j];
                if (storm.direction === "south") tile.row++;
                else if (storm.direction === "north") tile.row--;
                else if (storm.direction === "east") tile.col++;
                else if (storm.direction === "west") tile.col--;
            }

            // Check if entirely off-map
            var allOffMap = true;
            for (var j = 0; j < storm.tiles.length; j++) {
                var t = storm.tiles[j];
                if (t.row >= 0 && t.row < MAP_ROWS && t.col >= 0 && t.col < MAP_COLS) {
                    allOffMap = false;
                    break;
                }
            }
            if (allOffMap) {
                stormsToRemove.push(i);
                addLog("A Dust Storm has left the map.", "storm");
            }
        }

        // Remove storms that left the map (reverse order to keep indices valid)
        for (var i = stormsToRemove.length - 1; i >= 0; i--) {
            state.dustStorms.splice(stormsToRemove[i], 1);
        }
    }

    function checkDustStormCollisions() {
        for (var i = 0; i < state.dustStorms.length; i++) {
            var storm = state.dustStorms[i];
            for (var j = 0; j < storm.tiles.length; j++) {
                var tile = storm.tiles[j];
                if (tile.row < 0 || tile.row >= MAP_ROWS || tile.col < 0 || tile.col >= MAP_COLS) continue;

                // Check all units
                var unitsToRemove = [];
                for (var u = 0; u < state.units.length; u++) {
                    var unit = state.units[u];
                    if (unit.row === tile.row && unit.col === tile.col) {
                        if (!isUnitInHovel(unit.row, unit.col)) {
                            if (unit.type === "elon") {
                                // Elon is destroyed - becomes Elon Bones
                                unit.name = "Elon Bones";
                                unit.movesLeft = 0;
                                unit.movesMax = 0;
                                state.gameOver = true;
                                addLog("Elon Musk was consumed by the Dust Storm! Only bones remain... GAME OVER!", "storm");
                            } else {
                                // Non-elon unit is destroyed, place resource on tile
                                var def = UNIT_TYPES[unit.type];
                                if (def.degradeResource) {
                                    var mapTile = state.map[unit.row][unit.col];
                                    mapTile.resource = def.degradeResource.type;
                                }
                                unitsToRemove.push(u);
                                addLog("A " + unit.name + " was destroyed by the Dust Storm at (" + unit.col + ", " + unit.row + ")!", "storm");
                            }
                        }
                    }
                }
                // Remove destroyed units (reverse order)
                for (var u = unitsToRemove.length - 1; u >= 0; u--) {
                    state.units.splice(unitsToRemove[u], 1);
                }
                // Clamp selectedUnit after removals
                if (state.selectedUnit >= state.units.length) {
                    state.selectedUnit = 0;
                }
            }
        }
    }

    function processSubparBatteryExplosions() {
        var anyExploded = false;
        for (var i = state.structures.length - 1; i >= 0; i--) {
            var s = state.structures[i];
            if (s.type !== "subpar_battery") continue;
            if (Math.random() < 0.02) {
                addLog("A Subpar Battery at (" + s.col + ", " + s.row + ") exploded!", "explosion");
                state.structures.splice(i, 1);
                anyExploded = true;
            }
        }
        // Clamp hovel energy to new capacity after explosions
        if (anyExploded) {
            for (var j = 0; j < state.structures.length; j++) {
                var h = state.structures[j];
                if (h.type !== "rock_hovel") continue;
                var cap = getHovelCapacity(h);
                if (h.energy > cap) {
                    h.energy = cap;
                }
            }
        }
    }

    function scheduleNextStorm() {
        var minTurn = state.turn + DUST_STORM_INTERVAL_MIN;
        var maxTurn = state.turn + DUST_STORM_INTERVAL_MAX;
        state.nextStormTurn = minTurn + Math.floor(Math.random() * (maxTurn - minTurn + 1));
    }

    function processDustStorms() {
        // Check if it's time to spawn a new storm
        if (state.turn >= state.nextStormTurn) {
            spawnDustStorm();
            scheduleNextStorm();
        }

        // Move existing storms
        moveDustStorms();

        // Check collisions after movement
        checkDustStormCollisions();
    }

    // --------------- Turn ---------------
    function endTurn() {
        if (state.gameOver) return;
        state.turn++;

        // Reset moves for all units
        for (var i = 0; i < state.units.length; i++) {
            state.units[i].movesLeft = state.units[i].movesMax;
        }

        // Reset comm dish usage tracking for the new turn
        state.commDishesUsedThisTurn = [];

        addLog("--- Turn " + state.turn + " ---", "turn");

        processSubparBatteryExplosions();
        processUnitDegradation();
        processSolarPanels();
        processDustStorms();

        refreshView();
    }

    function toggleHotkeyModal() {
        state.hotkeyModalOpen = !state.hotkeyModalOpen;
        document.getElementById("hotkey-modal").classList.toggle("hidden", !state.hotkeyModalOpen);
    }

    // --------------- Input Handling ---------------
    function getTileFromClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / TILE_SIZE);
        const row = Math.floor(y / TILE_SIZE);
        if (isInBounds(row, col)) {
            return state.map[row][col];
        }
        return null;
    }

    canvas.addEventListener("click", function (e) {
        const tile = getTileFromClick(e);
        if (!tile) return;

        // Check if clicked tile has a unit — select it
        var clickedUnit = getUnitAt(tile.row, tile.col);
        if (clickedUnit) {
            var idx = state.units.indexOf(clickedUnit);
            if (idx !== -1) {
                state.selectedUnit = idx;
                state.selectedTile = tile;
                refreshView();
                return;
            }
        }

        // Otherwise, try to move the selected unit
        const unit = getSelectedUnit();
        const dr = Math.abs(tile.row - unit.row);
        const dc = Math.abs(tile.col - unit.col);

        if (dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0) && unit.movesLeft > 0) {
            moveUnit(tile.row, tile.col);
        } else {
            // Just select the tile
            state.selectedTile = tile;
            refreshView();
        }
    });

    document.getElementById("end-turn-btn").addEventListener("click", endTurn);
    document.getElementById("gather-btn").addEventListener("click", function () {
        if (state.gameOver) return;
        gatherResource();
    });
    document.getElementById("build-hovel-btn").addEventListener("click", function () {
        if (state.gameOver) return;
        buildRockHovel();
    });
    document.getElementById("build-solar-btn").addEventListener("click", function () {
        if (state.gameOver) return;
        buildSolarPanel();
    });
    document.getElementById("build-battery-btn").addEventListener("click", function () {
        if (state.gameOver) return;
        buildSubparBattery();
    });
    document.getElementById("build-rocktimus-btn").addEventListener("click", function () {
        if (state.gameOver) return;
        buildRocktimus();
    });
    document.getElementById("build-comm-dish-btn").addEventListener("click", function () {
        if (state.gameOver) return;
        buildCommDish();
    });
    document.getElementById("call-earth-btn").addEventListener("click", function () {
        if (state.gameOver) return;
        callEarth();
    });
    document.getElementById("close-call-earth-dialog").addEventListener("click", closeCallEarthDialog);
    document.getElementById("close-hotkey-modal").addEventListener("click", toggleHotkeyModal);

    // Keyboard controls
    document.addEventListener("keydown", function (e) {
        // Handle hotkey modal toggle
        if (e.key === "Escape") {
            e.preventDefault();
            toggleHotkeyModal();
            return;
        }

        // Block all game input while modal/dialog is open or game over
        if (state.hotkeyModalOpen) return;
        if (state.callEarthDialogOpen) return;
        if (state.gameOver) return;

        const unit = getSelectedUnit();
        let dr = 0;
        let dc = 0;

        switch (e.key) {
            case "ArrowUp":
            case "w":
                dr = -1;
                break;
            case "ArrowDown":
            case "s":
                dr = 1;
                break;
            case "ArrowLeft":
            case "a":
                dc = -1;
                break;
            case "ArrowRight":
            case "d":
                dc = 1;
                break;
            case "g":
                gatherResource();
                return;
            case "b":
                buildRockHovel();
                return;
            case "p":
                buildSolarPanel();
                return;
            case "t":
                buildSubparBattery();
                return;
            case "r":
                buildRocktimus();
                return;
            case "c":
                buildCommDish();
                return;
            case "l":
                callEarth();
                return;
            case "Tab":
                e.preventDefault();
                if (state.units.length > 1) {
                    state.selectedUnit = (state.selectedUnit + 1) % state.units.length;
                    var sel = getSelectedUnit();
                    state.selectedTile = state.map[sel.row][sel.col];
                    refreshView();
                }
                return;
            case "Enter":
            case "e":
                endTurn();
                return;
            default:
                return;
        }

        e.preventDefault();
        moveUnit(unit.row + dr, unit.col + dc);
    });

    // --------------- Initialization ---------------
    function init() {
        state.map = generateMap();
        var elonUnit = placeUnit(state.map);
        state.units = [elonUnit];
        state.selectedUnit = 0;
        state.turn = 1;
        state.resources = { rocks: 0 };
        state.structures = [];
        state.robots = [];
        state.dustStorms = [];
        state.dustStormIdCounter = 0;
        state.gameOver = false;
        state.logs = [];
        state.contactedEarth = false;
        state.commDishesUsedThisTurn = [];
        state.callEarthDialogOpen = false;
        state.selectedTile = state.map[elonUnit.row][elonUnit.col];

        // Schedule first dust storm within the first 10 turns
        state.nextStormTurn = 1 + Math.floor(Math.random() * DUST_STORM_FIRST_MAX_TURN);

        resizeCanvas();
        addLog("Elon has crash-landed on Mars!", "turn");
        addLog("--- Turn 1 ---", "turn");
        refreshView();
    }

    init();
})();
