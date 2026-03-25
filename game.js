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
    const MOVES_PER_TURN = 2;

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

    // --------------- State ---------------
    const state = {
        map: [],
        unit: null,
        turn: 1,
        resources: { rocks: 0, energy: 0 },
        structures: [],
        robots: [],
        dustStorms: [],
        nextStormTurn: 0,
        dustStormIdCounter: 0,
        gameOver: false,
        selectedTile: null,
        logs: [],
        hotkeyModalOpen: false,
    };

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
        return {
            name: "Elon Musk",
            row,
            col,
            movesLeft: MOVES_PER_TURN,
            movesMax: MOVES_PER_TURN,
        };
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

    function drawStructure(structure) {
        if (structure.type === "solar_panel") {
            drawSolarPanel(structure);
            return;
        }
        if (structure.type === "subpar_battery") {
            drawSubparBattery(structure);
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

    function drawUnit(unit) {
        const x = unit.col * TILE_SIZE;
        const y = unit.row * TILE_SIZE;

        // Highlight the unit tile
        ctx.fillStyle = "rgba(255, 204, 0, 0.25)";
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
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ELON", cx, y + TILE_SIZE - 2);
    }

    function drawRobot(robot) {
        var x = robot.col * TILE_SIZE;
        var y = robot.row * TILE_SIZE;
        var cx = x + TILE_SIZE / 2;
        var cy = y + TILE_SIZE / 2;

        // Robot body
        ctx.fillStyle = "#8888aa";
        ctx.fillRect(cx - 8, cy - 2, 16, 14);

        // Robot head
        ctx.fillStyle = "#9999bb";
        ctx.fillRect(cx - 6, cy - 10, 12, 10);

        // Eyes
        ctx.fillStyle = "#ff3333";
        drawCircle(cx - 3, cy - 6, 2);
        drawCircle(cx + 3, cy - 6, 2);

        // Label
        ctx.fillStyle = "#aaaacc";
        ctx.font = "bold 6px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ROBO", cx, y + TILE_SIZE - 2);
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
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = unit.row + dr;
                const nc = unit.col + dc;
                if (nr >= 0 && nr < MAP_ROWS && nc >= 0 && nc < MAP_COLS) {
                    const x = nc * TILE_SIZE;
                    const y = nr * TILE_SIZE;
                    ctx.fillStyle = "rgba(100, 180, 255, 0.15)";
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = "rgba(100, 180, 255, 0.4)";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                }
            }
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

        // Draw structures
        for (var i = 0; i < state.structures.length; i++) {
            drawStructure(state.structures[i]);
        }

        // Draw dust storms
        for (var s = 0; s < state.dustStorms.length; s++) {
            drawDustStorm(state.dustStorms[s]);
        }

        // Draw robots
        for (var r = 0; r < state.robots.length; r++) {
            drawRobot(state.robots[r]);
        }

        // Draw movement range
        if (!state.gameOver) {
            drawMoveRange(state.unit);
        }

        // Draw unit
        drawUnit(state.unit);

        // Draw selected tile highlight
        if (state.selectedTile) {
            drawHighlight(state.selectedTile, "#ffcc00");
        }
    }

    // --------------- UI Updates ---------------
    function updateUI() {
        document.getElementById("turn-number").textContent = state.turn;
        document.getElementById("moves-left").textContent = state.unit.movesLeft;
        document.getElementById("moves-max").textContent = state.unit.movesMax;
        document.getElementById("rocks-count").textContent = state.resources.rocks;
        document.getElementById("energy-count").textContent = state.resources.energy;

        // Gather button
        const gatherBtn = document.getElementById("gather-btn");
        const unitTile = state.map[state.unit.row][state.unit.col];
        gatherBtn.disabled = !(unitTile.resource === "rocks");

        // Build Rock Hovel button
        var buildBtn = document.getElementById("build-hovel-btn");
        var hasStructureOnTile = getStructureAt(state.unit.row, state.unit.col) !== null;
        buildBtn.disabled = state.resources.rocks < 10 || hasStructureOnTile;

        // Build Solar Panel button
        var solarBtn = document.getElementById("build-solar-btn");
        solarBtn.disabled = !canBuildSolarPanel();

        // Build Subpar Battery button
        var batteryBtn = document.getElementById("build-battery-btn");
        batteryBtn.disabled = !canBuildSubparBattery();

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
        const hasUnit = tile.row === state.unit.row && tile.col === state.unit.col;
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
            }
        }
        // Dust storm info
        var stormInfo = getDustStormAt(tile.row, tile.col);
        var stormText = "";
        if (stormInfo) {
            var dirLabel = stormInfo.direction.charAt(0).toUpperCase() + stormInfo.direction.slice(1);
            stormText = '<div><strong>Dust Storm:</strong> Moving ' + dirLabel + '</div>';
        }
        // Robot on tile
        var robotOnTile = getRobotAt(tile.row, tile.col);
        var robotText = robotOnTile ? '<div><strong>Unit:</strong> Rocktimus Robot</div>' : "";
        el.innerHTML = `
            <div><strong>Terrain:</strong> ${terrainName}</div>
            <div><strong>Position:</strong> (${tile.col}, ${tile.row})</div>
            <div><strong>Resource:</strong> ${resourceText}</div>
            <div><strong>Structure:</strong> ${structureText}</div>
            ${energyText}
            ${stormText}
            ${hasUnit ? '<div><strong>Unit:</strong> ' + state.unit.name + '</div>' : ""}
            ${robotText}
        `;
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
        const unit = state.unit;
        if (unit.movesLeft <= 0) return;

        const dr = Math.abs(targetRow - unit.row);
        const dc = Math.abs(targetCol - unit.col);

        // Must be adjacent (including diagonal)
        if (dr > 1 || dc > 1 || (dr === 0 && dc === 0)) return;

        // Bounds check
        if (targetRow < 0 || targetRow >= MAP_ROWS || targetCol < 0 || targetCol >= MAP_COLS) return;

        unit.row = targetRow;
        unit.col = targetCol;
        unit.movesLeft--;

        addLog(`Elon moved to (${targetCol}, ${targetRow})`, "move");

        state.selectedTile = state.map[targetRow][targetCol];
        render();
        updateUI();
    }

    function gatherResource() {
        const tile = state.map[state.unit.row][state.unit.col];
        if (tile.resource !== "rocks") return;

        tile.resource = null;
        state.resources.rocks++;

        addLog(`Elon gathered Rocks! (Total: ${state.resources.rocks})`, "gather");

        render();
        updateUI();
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
        var unit = state.unit;
        if (getStructureAt(unit.row, unit.col) !== null) return;

        state.resources.rocks -= 10;
        state.structures.push({
            type: "rock_hovel",
            row: unit.row,
            col: unit.col,
            energy: 0,
        });

        addLog("Elon built a Rock Hovel at (" + unit.col + ", " + unit.row + ")", "build");

        render();
        updateUI();
    }

    function getAdjacentStructures(row, col, type) {
        var results = [];
        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                var nr = row + dr;
                var nc = col + dc;
                if (nr < 0 || nr >= MAP_ROWS || nc < 0 || nc >= MAP_COLS) continue;
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
        var unit = state.unit;
        if (state.resources.rocks < 2) return false;
        if (getStructureAt(unit.row, unit.col) !== null) return false;
        var hovels = getAdjacentStructures(unit.row, unit.col, "rock_hovel");
        return hovels.length > 0;
    }

    function buildSolarPanel() {
        if (!canBuildSolarPanel()) return;
        var unit = state.unit;

        state.resources.rocks -= 2;
        state.structures.push({
            type: "solar_panel",
            row: unit.row,
            col: unit.col,
        });

        addLog("Elon built a Solar Panel at (" + unit.col + ", " + unit.row + ")", "build");

        render();
        updateUI();
    }

    function canBuildSubparBattery() {
        var unit = state.unit;
        if (state.resources.energy < 2 || state.resources.rocks < 2) return false;
        if (getStructureAt(unit.row, unit.col) !== null) return false;
        var adjPanels = getAdjacentStructures(unit.row, unit.col, "solar_panel");
        var adjHovels = getAdjacentStructures(unit.row, unit.col, "rock_hovel");
        return adjPanels.length > 0 || adjHovels.length > 0;
    }

    function buildSubparBattery() {
        if (!canBuildSubparBattery()) return;
        var unit = state.unit;

        state.resources.energy -= 2;
        state.resources.rocks -= 2;
        state.structures.push({
            type: "subpar_battery",
            row: unit.row,
            col: unit.col,
        });

        addLog("Elon built a Subpar Battery at (" + unit.col + ", " + unit.row + ")", "build");

        render();
        updateUI();
    }

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
                        state.resources.energy++;
                        totalGenerated++;
                        break;
                    }
                }
            }
        }
        if (totalGenerated > 0) {
            addLog("Solar Panels generated " + totalGenerated + " Energy! (Total: " + state.resources.energy + ")", "energy");
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

    function getRobotAt(row, col) {
        for (var i = 0; i < state.robots.length; i++) {
            if (state.robots[i].row === row && state.robots[i].col === col) {
                return state.robots[i];
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

                // Check Elon Musk
                if (!state.gameOver && state.unit.row === tile.row && state.unit.col === tile.col) {
                    if (!isUnitInHovel(state.unit.row, state.unit.col)) {
                        // Elon is destroyed - becomes Elon Bones
                        state.unit.name = "Elon Bones";
                        state.unit.movesLeft = 0;
                        state.unit.movesMax = 0;
                        state.gameOver = true;
                        addLog("Elon Musk was consumed by the Dust Storm! Only bones remain... GAME OVER!", "storm");
                    }
                }

                // Check Rocktimus Robots
                var robotsToRemove = [];
                for (var r = 0; r < state.robots.length; r++) {
                    var robot = state.robots[r];
                    if (robot.row === tile.row && robot.col === tile.col) {
                        if (!isUnitInHovel(robot.row, robot.col)) {
                            // Robot is destroyed, place Rock resource on tile
                            var mapTile = state.map[robot.row][robot.col];
                            mapTile.resource = "rocks";
                            robotsToRemove.push(r);
                            addLog("A Rocktimus Robot was destroyed by the Dust Storm at (" + robot.col + ", " + robot.row + ")! It crumbled back into rocks.", "storm");
                        }
                    }
                }
                // Remove destroyed robots (reverse order)
                for (var r = robotsToRemove.length - 1; r >= 0; r--) {
                    state.robots.splice(robotsToRemove[r], 1);
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
                    state.resources.energy -= (h.energy - cap);
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

    function endTurn() {
        if (state.gameOver) return;
        state.turn++;
        state.unit.movesLeft = state.unit.movesMax;

        addLog(`--- Turn ${state.turn} ---`, "turn");

        processSubparBatteryExplosions();
        processSolarPanels();
        processDustStorms();

        render();
        updateUI();
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
        if (row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS) {
            return state.map[row][col];
        }
        return null;
    }

    canvas.addEventListener("click", function (e) {
        const tile = getTileFromClick(e);
        if (!tile) return;

        const unit = state.unit;
        const dr = Math.abs(tile.row - unit.row);
        const dc = Math.abs(tile.col - unit.col);

        // If clicking an adjacent tile and have moves, move there
        if (dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0) && unit.movesLeft > 0) {
            moveUnit(tile.row, tile.col);
        } else {
            // Just select the tile
            state.selectedTile = tile;
            render();
            updateUI();
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
    document.getElementById("close-hotkey-modal").addEventListener("click", toggleHotkeyModal);

    // Keyboard controls
    document.addEventListener("keydown", function (e) {
        // Handle hotkey modal toggle
        if (e.key === "Escape") {
            e.preventDefault();
            toggleHotkeyModal();
            return;
        }

        // Block all game input while modal is open or game over
        if (state.hotkeyModalOpen) return;
        if (state.gameOver) return;

        const unit = state.unit;
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
        state.unit = placeUnit(state.map);
        state.turn = 1;
        state.resources = { rocks: 0, energy: 0 };
        state.structures = [];
        state.robots = [];
        state.dustStorms = [];
        state.dustStormIdCounter = 0;
        state.gameOver = false;
        state.logs = [];
        state.selectedTile = state.map[state.unit.row][state.unit.col];

        // Schedule first dust storm within the first 10 turns
        state.nextStormTurn = 1 + Math.floor(Math.random() * DUST_STORM_FIRST_MAX_TURN);

        resizeCanvas();
        addLog("Elon has crash-landed on Mars!", "turn");
        addLog("--- Turn 1 ---", "turn");
        render();
        updateUI();
    }

    init();
})();
