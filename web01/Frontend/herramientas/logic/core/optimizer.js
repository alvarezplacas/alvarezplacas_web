/**
 * SmartCut Engine - Optimization Core (v1.0)
 * Lógica de Guillotina de 3 Niveles con ASH (Adaptive Sequence-Based Heuristic)
 */

export class SmartCutEngine {
    constructor(config = {}) {
        this.kerf = config.kerf || 4;
        this.trim = config.trim || 5;
        this.optimizationLevel = config.optimizationLevel || 1000;
    }

    optimize(plateW, plateH, pieces) {
        const netW = plateW - (this.trim * 2);
        const netH = plateH - (this.trim * 2);
        
        let bestResult = null;

        // ASH: Probamos múltiples secuencias basadas en heurísticas y aleatoriedad
        const heuristics = [
            (a, b) => (b.l * b.h) - (a.l * a.h), // Área descendente
            (a, b) => Math.max(b.l, b.h) - Math.max(a.l, a.h), // Lado largo
            (a, b) => b.l - a.l, // Largo
            (a, b) => b.h - a.h  // Alto
        ];

        heuristics.forEach(hFn => {
            const result = this.runGuillotineSimulation(netW, netH, [...pieces].sort(hFn));
            if (!bestResult || this.isBetter(result, bestResult)) bestResult = result;
        });

        if (this.optimizationLevel > 10) {
            for (let i = 0; i < 20; i++) {
                const result = this.runGuillotineSimulation(netW, netH, this.shuffle([...pieces]));
                if (this.isBetter(result, bestResult)) bestResult = result;
            }
        }

        // Calcular estadísticas globales finales
        bestResult.stats = {
            totalPieces: pieces.reduce((sum, p) => sum + p.q, 0),
            totalPlates: bestResult.plates.length,
            totalM2: pieces.reduce((sum, p) => sum + (p.l * p.h * p.q), 0) / 1000000,
            edgeMeters: { '0.45': 0, '1': 0, '2': 0 }
        };

        // Calcular metros de tapacanto
        pieces.forEach(p => {
            if (p.edges) {
                const sides = [
                    { type: String(p.edges.t), len: p.l },
                    { type: String(p.edges.b), len: p.l },
                    { type: String(p.edges.l), len: p.h },
                    { type: String(p.edges.r), len: p.h }
                ];
                sides.forEach(s => {
                    if (s.type !== "0" && bestResult.stats.edgeMeters[s.type] !== undefined) {
                        bestResult.stats.edgeMeters[s.type] += (s.len * p.q) / 1000;
                    }
                });
            }
        });

        return bestResult;
    }

    isBetter(resA, resB) {
        if (resA.plates.length < resB.plates.length) return true;
        if (resA.plates.length > resB.plates.length) return false;
        // Si tienen las mismas placas, preferimos el que tenga mayor área libre contigua
        return resA.totalWaste < resB.totalWaste;
    }

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Simulación de Guillotina en 2 Etapas (Tiras + Piezas)
     * Optimizada para ser amigable con el operario.
     */
    runGuillotineSimulation(w, h, piecesToPack) {
        let plates = [];
        let remainingPieces = [];
        
        // Expandir cantidades (desglosar piezas)
        piecesToPack.forEach(p => {
            for(let i = 0; i < p.q; i++) remainingPieces.push({...p, q: 1});
        });

        while (remainingPieces.length > 0) {
            let plate = {
                w, h,
                strips: [],
                freeHeight: h
            };

            let currentY = 0;

            // Intentamos llenar la placa por tiras (Nivel 1)
            while (remainingPieces.length > 0) {
                // Buscamos la mejor pieza para empezar una tira (la más alta que quepa)
                let bestIdx = -1;
                let isBestRotated = false;

                for (let i = 0; i < remainingPieces.length; i++) {
                    const p = remainingPieces[i];
                    const canFitNormal = p.l <= w && p.h <= (h - currentY);
                    const canFitRotated = p.canRotate && p.h <= w && p.l <= (h - currentY);

                    if (canFitNormal || canFitRotated) {
                        bestIdx = i;
                        // Preferimos la orientación que deje más altura libre en el tablero
                        if (canFitNormal && canFitRotated) {
                            isBestRotated = p.l > p.h; // Si es más larga que alta, la rotamos para ahorrar altura
                        } else {
                            isBestRotated = canFitRotated && !canFitNormal;
                        }
                        break; 
                    }
                }

                if (bestIdx === -1) break; // Ya no caben más piezas en esta placa

                const firstPiece = remainingPieces.splice(bestIdx, 1)[0];
                const stripH = isBestRotated ? firstPiece.l : firstPiece.h;
                const stripW = isBestRotated ? firstPiece.h : firstPiece.l;

                let strip = {
                    x: 0, y: currentY,
                    w: w, h: stripH,
                    items: [{ ...firstPiece, x: 0, y: currentY, rotated: isBestRotated }],
                };

                let currentX = stripW + this.kerf;

                // Llenamos la tira (Nivel 2)
                for (let i = 0; i < remainingPieces.length; i++) {
                    const p = remainingPieces[i];
                    if (p.l <= (w - currentX) && p.h <= stripH) {
                        strip.items.push({ ...p, x: currentX, y: currentY, rotated: false });
                        currentX += p.l + this.kerf;
                        remainingPieces.splice(i, 1);
                        i--;
                    } else if (p.canRotate && p.h <= (w - currentX) && p.l <= stripH) {
                        strip.items.push({ ...p, x: currentX, y: currentY, rotated: true });
                        currentX += p.h + this.kerf;
                        remainingPieces.splice(i, 1);
                        i--;
                    }
                }

                plate.strips.push(strip);
                currentY += stripH + this.kerf;
            }

            if (plate.strips.length > 0) plates.push(plate);
            else {
                // Pieza imposible (demasiado grande)
                remainingPieces.shift(); 
            }
        }

        return {
            plates,
            totalWaste: this.calculateWaste(plates, w, h)
        };
    }

    calculateWaste(plates, w, h) {
        let usedArea = 0;
        plates.forEach(plate => {
            plate.strips.forEach(strip => {
                strip.items.forEach(item => {
                    usedArea += item.l * item.h;
                });
            });
        });
        const totalArea = plates.length * w * h;
        return totalArea - usedArea;
    }
}
