/**
 * SmartCut Engine v11.2.0 "TREE LOOK-AHEAD" - INDUSTRIAL ELITE
 * Arquitectura BSP con Búsqueda Exhaustiva BSSF y Look-Ahead de 1 paso.
 */

class GuillotineNode {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.used = false;
        this.left = null; this.right = null;
    }
    clone() {
        const n = new GuillotineNode(this.x, this.y, this.w, this.h);
        n.used = this.used;
        if (this.left) n.left = this.left.clone();
        if (this.right) n.right = this.right.clone();
        return n;
    }
}

export class SmartCutEngine {
    constructor(config = {}) {
        this.kerf = Number(config.kerf) || 4;
        this.trim = Number(config.trim) || 5;
        this.edgeWaste = (Number(config.edgeWaste) || 18) / 100;
        this.profile = config.profile || 'MAX_EFF';
        this.iterations = (this.profile === 'MAX_EFF') ? 15000 : 1500;
        this.mode = config.mode || 'MIXED'; // 'MIXED', 'H', 'V'
        console.log(`%c TREE LOOK-AHEAD v11.2 %c Buscando Placa Única (95%+)`, "background: #000; color: #00ff00; font-weight: bold; border: 1px solid #00ff00;", "background: #00ff00; color: #000;");
    }

    optimize(w, h, pieces) {
        console.time("Optimización");
        const flatPieces = this._flatten(pieces);
        const usableW = Number(w) - (this.trim * 2);
        const usableH = Number(h) - (this.trim * 2);
        let bestResult = null, bestScore = -1, stagnated = 0;

        let populations = [
            [...flatPieces].sort((a, b) => (b.l * b.h) - (a.l * a.h)),
            [...flatPieces].sort((a, b) => Math.max(b.l, b.h) - Math.max(a.l, a.h)),
            [...flatPieces].sort((a, b) => b.h - a.h || b.l - a.l)
        ];

        for (let i = 0; i < this.iterations; i++) {
            const intensity = (stagnated > 400) ? 0.5 : 0.02;
            let currentPieces = (i < populations.length) ? populations[i] : this._thermalMutate([...(bestResult?.originalOrder || flatPieces)], intensity);

            const result = this._packBinaryTree(usableW, usableH, currentPieces, w, h);
            result.originalOrder = [...currentPieces];
            const score = result.stats.efficiency + (result.stats.maxOffcutArea / (w * h) * 10);

            if (score > bestScore) { bestScore = score; bestResult = result; stagnated = 0; }
            else { stagnated++; }
            if (bestScore > 99.8) break;
        }
        console.timeEnd("Optimización");
        return bestResult;
    }

    _packBinaryTree(usableW, usableH, pieces, fullW, fullH) {
        const plates = [];
        let remaining = [...pieces];

        while (remaining.length > 0) {
            const root = new GuillotineNode(this.trim, this.trim, usableW, usableH);
            const plate = { id: plates.length + 1, items: [], root: root };
            let placedInPlate = 0;

            while (remaining.length > 0) {
                let bestFitInfo = { node: null, orient: null, score: Infinity, longScore: Infinity };
                const p = remaining[0]; // Evaluar la primera pieza del orden actual
                
                const orients = [{ w: p.l, h: p.h, rot: false }];
                if (p.canRotate) orients.push({ w: p.h, h: p.l, rot: true });

                for (const o of orients) {
                    this._findBestNode(root, o.w, o.h, o, bestFitInfo);
                }

                if (bestFitInfo.node) {
                    const placedPiece = remaining.shift();
                    const nextPiece = remaining[0] || null;
                    
                    // SPLIT CON LOOK-AHEAD
                    this._splitNodeLookAhead(bestFitInfo.node, bestFitInfo.orient.w, bestFitInfo.orient.h, nextPiece);
                    
                    plate.items.push({
                        ...placedPiece, x: bestFitInfo.node.x, y: bestFitInfo.node.y,
                        l: bestFitInfo.orient.w, h: bestFitInfo.orient.h,
                        rotated: bestFitInfo.orient.rot, nominalL: placedPiece.l, nominalH: placedPiece.h
                    });
                    placedInPlate++;
                } else {
                    break; 
                }
            }

            if (placedInPlate === 0 && remaining.length > 0) break; 
            plates.push(plate);
        }

        const compatiblePlates = plates.map(p => ({ id: p.id, eff: 0, strips: [{ items: p.items }] }));
        return { plates: compatiblePlates, stats: this.calculateStats(compatiblePlates, fullW, fullH, plates) };
    }

    _findBestNode(node, w, h, orient, bestFitInfo) {
        if (node.left || node.right) {
            if (node.left) this._findBestNode(node.left, w, h, orient, bestFitInfo);
            if (node.right) this._findBestNode(node.right, w, h, orient, bestFitInfo);
            return;
        }
        if (!node.used && w <= node.w && h <= node.h) {
            const ssFit = Math.min(node.w - w, node.h - h);
            const lsFit = Math.max(node.w - w, node.h - h);
            if (ssFit < bestFitInfo.score || (ssFit === bestFitInfo.score && lsFit < bestFitInfo.longScore)) {
                bestFitInfo.node = node; bestFitInfo.orient = orient;
                bestFitInfo.score = ssFit; bestFitInfo.longScore = lsFit;
            }
        }
    }

    _splitNodeLookAhead(node, pW, pH, nextPiece) {
        node.used = true;
        const fullW = pW + this.kerf;
        const fullH = pH + this.kerf;

        let verticalFirst;
        if (this.mode === 'V') {
            verticalFirst = true;
        } else if (this.mode === 'H') {
            verticalFirst = false;
        } else {
            // MIXED - Simular ambos cortes y elegir el mejor look-ahead
            const scoreV = this._evaluateSplit(node, fullW, fullH, pW, pH, true, nextPiece);
            const scoreH = this._evaluateSplit(node, fullW, fullH, pW, pH, false, nextPiece);
            verticalFirst = (scoreV <= scoreH);
        }

        if (verticalFirst) {
            node.left = new GuillotineNode(node.x + fullW, node.y, node.w - fullW, node.h);
            node.right = new GuillotineNode(node.x, node.y + fullH, pW, node.h - fullH);
        } else {
            node.left = new GuillotineNode(node.x, node.y + fullH, node.w, node.h - fullH);
            node.right = new GuillotineNode(node.x + fullW, node.y, node.w - fullW, pH);
        }
    }

    _evaluateSplit(node, fullW, fullH, pW, pH, verticalFirst, nextPiece) {
        if (!nextPiece) return (node.w - pW) * (node.h - pH); // Si no hay siguiente, modo greedy simple

        let tempLeft, tempRight;
        if (verticalFirst) {
            tempLeft = new GuillotineNode(node.x + fullW, node.y, node.w - fullW, node.h);
            tempRight = new GuillotineNode(node.x, node.y + fullH, pW, node.h - fullH);
        } else {
            tempLeft = new GuillotineNode(node.x, node.y + fullH, node.w, node.h - fullH);
            tempRight = new GuillotineNode(node.x + fullW, node.y, node.w - fullW, pH);
        }

        // ¿Qué tan bien entra la siguiente pieza en estos nuevos nodos?
        let bestFit = { score: Infinity };
        const orients = [{ w: nextPiece.l, h: nextPiece.h }];
        if (nextPiece.canRotate) orients.push({ w: nextPiece.h, h: nextPiece.l });

        for (const o of orients) {
            [tempLeft, tempRight].forEach(n => {
                if (o.w <= n.w && o.h <= n.h) {
                    const score = Math.min(n.w - o.w, n.h - o.h);
                    if (score < bestFit.score) bestFit.score = score;
                }
            });
        }
        return bestFit.score;
    }

    _thermalMutate(pieces, intensity) {
        const mutated = [...pieces];
        const swaps = Math.max(1, Math.floor(mutated.length * intensity));
        for (let i = 0; i < swaps; i++) {
            const idx1 = Math.floor(Math.random() * mutated.length);
            const idx2 = Math.floor(Math.random() * mutated.length);
            [mutated[idx1], mutated[idx2]] = [mutated[idx2], mutated[idx1]];
        }
        return mutated;
    }

    _flatten(pieces) {
        let flat = [];
        pieces.forEach(p => {
            const qty = Number(p.q) || 0;
            for (let i = 0; i < qty; i++) {
                flat.push({ 
                    id: p.id, l: Number(p.l), h: Number(p.h), 
                    nominalL: Number(p.l), nominalH: Number(p.h), 
                    label: p.label || 'Pieza',
                    canRotate: p.canRotate !== false,
                    edges: p.edges || null, refId: p.refId || '?'
                });
            }
        });
        return flat;
    }

    calculateStats(compatiblePlates, w, h, originalPlates) {
        let usedArea = 0, totalPieces = 0, maxOffcutArea = 0;
        let edgeMeters = { "0.45": 0, "1": 0, "2": 0 };
        compatiblePlates.forEach((plate, idx) => {
            let plateUsed = 0;
            plate.strips[0].items.forEach(item => {
                usedArea += item.l * item.h; plateUsed += item.l * item.h; totalPieces++;
                if (item.edges) {
                    const factor = 1.18;
                    const calc = (len) => (len / 1000) * factor;
                    if (item.edges.t) edgeMeters[item.edges.t] += calc(item.nominalL);
                    if (item.edges.b) edgeMeters[item.edges.b] += calc(item.nominalL);
                    if (item.edges.l) edgeMeters[item.edges.l] += calc(item.nominalH);
                    if (item.edges.r) edgeMeters[item.edges.r] += calc(item.nominalH);
                }
            });
            plate.eff = (plateUsed / (w * h)) * 100;
            const getMaxFree = (node) => {
                if (!node) return 0;
                if (!node.left && !node.right && !node.used) return node.w * node.h;
                return Math.max(getMaxFree(node.left), getMaxFree(node.right));
            };
            maxOffcutArea = Math.max(maxOffcutArea, getMaxFree(originalPlates[idx].root));
        });
        const totalArea = compatiblePlates.length * w * h;
        return { totalPlates: compatiblePlates.length, totalPieces: totalPieces, totalM2: usedArea / 1000000, efficiency: totalArea > 0 ? (usedArea / totalArea) * 100 : 0, edgeMeters, maxOffcutArea };
    }
}
