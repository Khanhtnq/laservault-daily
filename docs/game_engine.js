// LaserVault Daily Engine - Deterministic Optics Tactical Puzzle
// Standalone pure ES module / browser script

export class SeededPRNG {
    constructor(seedStr) {
        let h = 1779033703 ^ seedStr.length;
        for (let i = 0; i < seedStr.length; i++) {
            h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        this.s = h >>> 0;
    }

    next() {
        this.s ^= this.s << 13;
        this.s ^= this.s >>> 17;
        this.s ^= this.s << 5;
        return (this.s >>> 0) / 4294967296;
    }

    range(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

export const DIRS = {
    NORTH: { dx: 0, dy: -1, name: 'NORTH', bit: 1 },
    EAST:  { dx: 1, dy: 0,  name: 'EAST',  bit: 2 },
    SOUTH: { dx: 0, dy: 1,  name: 'SOUTH', bit: 3 },
    WEST:  { dx: -1, dy: 0, name: 'WEST',  bit: 4 }
};

export const DIR_LIST = [DIRS.NORTH, DIRS.EAST, DIRS.SOUTH, DIRS.WEST];

export function getOppositeDir(dir) {
    if (dir === DIRS.NORTH) return DIRS.SOUTH;
    if (dir === DIRS.SOUTH) return DIRS.NORTH;
    if (dir === DIRS.EAST)  return DIRS.WEST;
    if (dir === DIRS.WEST)  return DIRS.EAST;
    return null;
}

export const CELL_TYPES = {
    EMPTY: 'EMPTY',
    EMITTER: 'EMITTER',
    TARGET: 'TARGET',
    MIRROR: 'MIRROR',        // rotatable 0 (/) or 1 (\)
    SPLITTER: 'SPLITTER',    // splits beam in 2 perp directions, rotatable 0-3
    PHASE_GATE: 'PHASE_GATE',// passes beam only if color matches or rotates phase
    BLOCK: 'BLOCK'           // solid vault barrier
};

export class LaserVaultPuzzle {
    constructor(dateStr, width = 6, height = 6) {
        this.dateStr = dateStr;
        this.width = width;
        this.height = height;
        this.prng = new SeededPRNG(dateStr);
        this.grid = [];
        this.emitters = [];
        this.targets = [];
        this.rotatables = [];
        this.solutionStates = []; // target rotations for rotatables
        this.parMoves = 0;
        this.generateDeterministicPuzzle();
    }

    generateDeterministicPuzzle() {
        let attempts = 0;
        while (attempts < 50) {
            attempts++;
            if (this._buildAndVerifySolvable()) {
                return;
            }
        }
        // Fallback robust template if random walk didn't converge within 50
        this._buildFallbackPuzzle();
    }

    _buildAndVerifySolvable() {
        this.grid = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(null).map(() => ({
                type: CELL_TYPES.EMPTY,
                rotation: 0, // 0, 1, 2, 3
                color: 'cyan',
                lit: false,
                requiredHit: false
            }))
        );
        this.emitters = [];
        this.targets = [];
        this.rotatables = [];
        this.solutionStates = [];

        // 1. Place 1-2 emitters on edges
        const edgeX = this.prng.range(1, this.width - 2);
        const emitter = { x: edgeX, y: 0, dir: DIRS.SOUTH, color: '#00ffff' };
        this.emitters.push(emitter);
        this.grid[0][edgeX] = {
            type: CELL_TYPES.EMITTER,
            dir: DIRS.SOUTH,
            color: '#00ffff',
            rotation: 0
        };

        // 2. Synthesize a guaranteed ray path via random walk
        let curX = emitter.x;
        let curY = emitter.y + 1;
        let curDir = emitter.dir;
        let pathLength = 0;
        const maxPath = 14;
        const visitedCells = new Set();
        visitedCells.add(`${emitter.x},${emitter.y}`);

        while (curX >= 0 && curX < this.width && curY >= 0 && curY < this.height && pathLength < maxPath) {
            visitedCells.add(`${curX},${curY}`);
            pathLength++;

            // Decision: turn mirror, splitter, or continue
            const roll = this.prng.next();
            if (pathLength >= 4 && (curX === 0 || curX === this.width - 1 || curY === this.height - 1 || roll > 0.75)) {
                // Place target here and end ray
                this.targets.push({ x: curX, y: curY, hit: false, requiredColor: '#00ffff' });
                this.grid[curY][curX] = {
                    type: CELL_TYPES.TARGET,
                    requiredColor: '#00ffff',
                    rotation: 0,
                    hit: false
                };
                break;
            } else if (roll > 0.35 && pathLength < maxPath - 1) {
                // Place a Mirror at curX, curY
                // If coming SOUTH (dy=1), mirror can turn EAST (dx=1, / mirror rotation 0) or WEST (dx=-1, \ mirror rotation 1)
                let nextDir = null;
                let mirrorRot = 0;

                if (curDir === DIRS.SOUTH) {
                    if (curX < this.width - 2 && (this.prng.next() > 0.5 || curX <= 1)) {
                        nextDir = DIRS.EAST;
                        mirrorRot = 0; // '/' reflects SOUTH to WEST, wait: SOUTH enters downwards, hitting '/' (bottom-left to top-right) reflects to WEST. 
                        // Let's explicitly define mirror rotation:
                        // rot 0: '/'  (NORTH <-> EAST, SOUTH <-> WEST)
                        // rot 1: '\'  (NORTH <-> WEST, SOUTH <-> EAST)
                        mirrorRot = 1; // SOUTH -> EAST
                    } else if (curX > 1) {
                        nextDir = DIRS.WEST;
                        mirrorRot = 0; // SOUTH -> WEST
                    }
                } else if (curDir === DIRS.NORTH) {
                    if (curX < this.width - 2 && this.prng.next() > 0.5) {
                        nextDir = DIRS.EAST;
                        mirrorRot = 0; // NORTH -> EAST
                    } else if (curX > 1) {
                        nextDir = DIRS.WEST;
                        mirrorRot = 1; // NORTH -> WEST
                    }
                } else if (curDir === DIRS.EAST) {
                    if (curY < this.height - 2 && this.prng.next() > 0.5) {
                        nextDir = DIRS.SOUTH;
                        mirrorRot = 1; // EAST -> SOUTH
                    } else if (curY > 1) {
                        nextDir = DIRS.NORTH;
                        mirrorRot = 0; // EAST -> NORTH
                    }
                } else if (curDir === DIRS.WEST) {
                    if (curY < this.height - 2 && this.prng.next() > 0.5) {
                        nextDir = DIRS.SOUTH;
                        mirrorRot = 0; // WEST -> SOUTH
                    } else if (curY > 1) {
                        nextDir = DIRS.NORTH;
                        mirrorRot = 1; // WEST -> NORTH
                    }
                }

                if (nextDir) {
                    this.grid[curY][curX] = {
                        type: CELL_TYPES.MIRROR,
                        rotation: mirrorRot,
                        solutionRot: mirrorRot
                    };
                    this.rotatables.push({ x: curX, y: curY, sol: mirrorRot });
                    curDir = nextDir;
                }
            }

            curX += curDir.dx;
            curY += curDir.dy;
        }

        // If target was not placed, abort attempt
        if (this.targets.length === 0) return false;

        // 3. Sprinkle 2-3 distractor rotatable mirrors/blocks in empty spaces
        let distractors = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x].type === CELL_TYPES.EMPTY && this.prng.next() < 0.20 && distractors < 4) {
                    const rRot = this.prng.range(0, 3);
                    if (this.prng.next() > 0.5) {
                        this.grid[y][x] = {
                            type: CELL_TYPES.MIRROR,
                            rotation: rRot % 2,
                            solutionRot: rRot % 2
                        };
                        this.rotatables.push({ x, y, sol: rRot % 2 });
                        distractors++;
                    } else {
                        this.grid[y][x] = {
                            type: CELL_TYPES.BLOCK,
                            rotation: 0
                        };
                    }
                }
            }
        }

        // 4. Verify initial state solves target
        const solvedInitial = this.simulateBeams();
        const allTargetsHitSol = this.targets.every(t => t.hit);
        if (!allTargetsHitSol) return false;

        // 5. Scramble rotatables to create the actual game puzzle!
        let movesAway = 0;
        for (const rotItem of this.rotatables) {
            const cell = this.grid[rotItem.y][rotItem.x];
            if (cell.type === CELL_TYPES.MIRROR) {
                // toggle rotation: 0 -> 1 or 1 -> 0
                cell.rotation = (cell.solutionRot === 0) ? 1 : 0;
                movesAway++;
            }
        }

        this.parMoves = movesAway;
        this.simulateBeams(); // Reset beam calculation for starting player state
        return (this.rotatables.length >= 2);
    }

    _buildFallbackPuzzle() {
        this.grid = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(null).map(() => ({ type: CELL_TYPES.EMPTY, rotation: 0 }))
        );
        this.emitters = [{ x: 1, y: 0, dir: DIRS.SOUTH, color: '#00ffff' }];
        this.grid[0][1] = { type: CELL_TYPES.EMITTER, dir: DIRS.SOUTH, color: '#00ffff', rotation: 0 };

        // (1,2) Mirror / -> WEST -> Wait (1,2) with rot 1: SOUTH -> EAST -> (4,2)
        this.grid[2][1] = { type: CELL_TYPES.MIRROR, rotation: 0, solutionRot: 1 };
        // (4,2) Mirror \ -> EAST -> SOUTH -> (4,4)
        this.grid[2][4] = { type: CELL_TYPES.MIRROR, rotation: 0, solutionRot: 1 };
        // (4,4) Mirror / -> SOUTH -> WEST -> (2,4)
        this.grid[4][4] = { type: CELL_TYPES.MIRROR, rotation: 1, solutionRot: 0 };
        // (2,4) Target
        this.grid[4][2] = { type: CELL_TYPES.TARGET, requiredColor: '#00ffff', rotation: 0, hit: false };
        this.targets = [{ x: 2, y: 4, hit: false, requiredColor: '#00ffff' }];

        this.rotatables = [
            { x: 1, y: 2, sol: 1 },
            { x: 4, y: 2, sol: 1 },
            { x: 4, y: 4, sol: 0 }
        ];
        this.parMoves = 3;
        this.simulateBeams();
    }

    // Interactive Rotate Cell
    rotateCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        const cell = this.grid[y][x];
        if (cell.type === CELL_TYPES.MIRROR) {
            cell.rotation = (cell.rotation + 1) % 2; // 0 (/) <-> 1 (\)
            this.simulateBeams();
            return true;
        } else if (cell.type === CELL_TYPES.SPLITTER || cell.type === CELL_TYPES.PHASE_GATE) {
            cell.rotation = (cell.rotation + 1) % 4;
            this.simulateBeams();
            return true;
        }
        return false;
    }

    // Ray Tracer Simulation
    simulateBeams() {
        // Clear previous target hits
        for (const t of this.targets) {
            t.hit = false;
            this.grid[t.y][t.x].hit = false;
        }

        const beamSegments = [];
        const queue = [];

        for (const em of this.emitters) {
            queue.push({
                x: em.x,
                y: em.y,
                dir: em.dir,
                color: em.color,
                depth: 0
            });
        }

        const visitedBeams = new Set();
        const maxSegments = 64;

        while (queue.length > 0 && beamSegments.length < maxSegments) {
            const ray = queue.shift();
            const beamKey = `${ray.x},${ray.y},${ray.dir.name},${ray.color}`;
            if (visitedBeams.has(beamKey)) continue;
            visitedBeams.add(beamKey);

            let nextX = ray.x + ray.dir.dx;
            let nextY = ray.y + ray.dir.dy;

            if (nextX < 0 || nextX >= this.width || nextY < 0 || nextY >= this.height) {
                // Ray exits grid boundary
                beamSegments.push({
                    x1: ray.x, y1: ray.y,
                    x2: ray.x + ray.dir.dx * 0.6,
                    y2: ray.y + ray.dir.dy * 0.6,
                    color: ray.color
                });
                continue;
            }

            beamSegments.push({
                x1: ray.x, y1: ray.y,
                x2: nextX, y2: nextY,
                color: ray.color
            });

            const targetCell = this.grid[nextY][nextX];

            if (targetCell.type === CELL_TYPES.BLOCK) {
                // Absorbed by vault barrier
                continue;
            } else if (targetCell.type === CELL_TYPES.TARGET) {
                targetCell.hit = true;
                const matchTarget = this.targets.find(t => t.x === nextX && t.y === nextY);
                if (matchTarget) matchTarget.hit = true;
                continue;
            } else if (targetCell.type === CELL_TYPES.MIRROR) {
                // rot 0: '/'  (NORTH -> EAST, EAST -> NORTH, SOUTH -> WEST, WEST -> SOUTH)
                // rot 1: '\'  (NORTH -> WEST, WEST -> NORTH, SOUTH -> EAST, EAST -> SOUTH)
                let reflectDir = null;
                if (targetCell.rotation === 0) { // '/'
                    if (ray.dir === DIRS.NORTH) reflectDir = DIRS.EAST;
                    else if (ray.dir === DIRS.EAST) reflectDir = DIRS.NORTH;
                    else if (ray.dir === DIRS.SOUTH) reflectDir = DIRS.WEST;
                    else if (ray.dir === DIRS.WEST) reflectDir = DIRS.SOUTH;
                } else { // '\'
                    if (ray.dir === DIRS.NORTH) reflectDir = DIRS.WEST;
                    else if (ray.dir === DIRS.WEST) reflectDir = DIRS.NORTH;
                    else if (ray.dir === DIRS.SOUTH) reflectDir = DIRS.EAST;
                    else if (ray.dir === DIRS.EAST) reflectDir = DIRS.SOUTH;
                }

                if (reflectDir && ray.depth < 30) {
                    queue.push({
                        x: nextX,
                        y: nextY,
                        dir: reflectDir,
                        color: ray.color,
                        depth: ray.depth + 1
                    });
                }
            } else if (targetCell.type === CELL_TYPES.SPLITTER) {
                // Splitter sends ray straight and 90 degree reflection
                queue.push({
                    x: nextX,
                    y: nextY,
                    dir: ray.dir,
                    color: ray.color,
                    depth: ray.depth + 1
                });
                let sideDir = (targetCell.rotation % 2 === 0) ? DIRS.EAST : DIRS.WEST;
                queue.push({
                    x: nextX,
                    y: nextY,
                    dir: sideDir,
                    color: ray.color,
                    depth: ray.depth + 1
                });
            } else {
                // Empty cell: laser continues straight
                queue.push({
                    x: nextX,
                    y: nextY,
                    dir: ray.dir,
                    color: ray.color,
                    depth: ray.depth + 1
                });
            }
        }

        this.beamSegments = beamSegments;
        return this.isVaultUnlocked();
    }

    isVaultUnlocked() {
        return this.targets.length > 0 && this.targets.every(t => t.hit);
    }

    // BFS Auto-Solver to guarantee solvability and compute minimum moves
    solveBFS() {
        if (this.rotatables.length === 0) return { solvable: true, moves: 0, solution: [] };
        
        const initialRotations = this.rotatables.map(r => this.grid[r.y][r.x].rotation);
        const totalStates = Math.pow(2, this.rotatables.length);

        // Exhaustive bitmask exploration (typically 2^3 to 2^6 = 8 to 64 states, < 2ms)
        for (let mask = 0; mask < totalStates; mask++) {
            for (let i = 0; i < this.rotatables.length; i++) {
                const rot = (mask >> i) & 1;
                this.grid[this.rotatables[i].y][this.rotatables[i].x].rotation = rot;
            }

            if (this.simulateBeams()) {
                const solutionRotations = this.rotatables.map(r => this.grid[r.y][r.x].rotation);
                // Restore original state
                for (let i = 0; i < this.rotatables.length; i++) {
                    this.grid[this.rotatables[i].y][this.rotatables[i].x].rotation = initialRotations[i];
                }
                this.simulateBeams();
                return {
                    solvable: true,
                    solution: solutionRotations
                };
            }
        }

        // Restore original
        for (let i = 0; i < this.rotatables.length; i++) {
            this.grid[this.rotatables[i].y][this.rotatables[i].x].rotation = initialRotations[i];
        }
        this.simulateBeams();
        return { solvable: false, moves: -1, solution: [] };
    }
}
