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

    // --------------- State ---------------
    const state = {
        map: [],
        unit: null,
        turn: 1,
        resources: { rocks: 0 },
        selectedTile: null,
        logs: [],
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

    function drawUnit(unit) {
        const x = unit.col * TILE_SIZE;
        const y = unit.row * TILE_SIZE;

        // Highlight the unit tile
        ctx.fillStyle = "rgba(255, 204, 0, 0.25)";
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Draw Elon as a simple character
        const cx = x + TILE_SIZE / 2;
        const cy = y + TILE_SIZE / 2;

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

        // Draw movement range
        drawMoveRange(state.unit);

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

        // Gather button
        const gatherBtn = document.getElementById("gather-btn");
        const unitTile = state.map[state.unit.row][state.unit.col];
        gatherBtn.disabled = !(unitTile.resource === "rocks");

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
        el.innerHTML = `
            <div><strong>Terrain:</strong> ${terrainName}</div>
            <div><strong>Position:</strong> (${tile.col}, ${tile.row})</div>
            <div><strong>Resource:</strong> ${resourceText}</div>
            ${hasUnit ? '<div><strong>Unit:</strong> Elon Musk</div>' : ""}
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

    function endTurn() {
        state.turn++;
        state.unit.movesLeft = state.unit.movesMax;

        addLog(`--- Turn ${state.turn} ---`, "turn");

        render();
        updateUI();
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
    document.getElementById("gather-btn").addEventListener("click", gatherResource);

    // Keyboard controls
    document.addEventListener("keydown", function (e) {
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
        state.resources = { rocks: 0 };
        state.logs = [];
        state.selectedTile = state.map[state.unit.row][state.unit.col];

        resizeCanvas();
        addLog("Elon has crash-landed on Mars!", "turn");
        addLog("--- Turn 1 ---", "turn");
        render();
        updateUI();
    }

    init();
})();
