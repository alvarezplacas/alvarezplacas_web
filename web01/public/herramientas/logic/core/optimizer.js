/**
 * SmartCut Engine v5.7.0 - MULTI-STRATEGY INDUSTRIAL ENGINE
 * Implementa 3 modos de cálculo: Horizontal, Vertical y Mixto (BSSF).
 */
export class SmartCutEngine {
    constructor(config = {}) {
        this.kerf = Number(config.kerf) || 4;
        this.trim = Number(config.trim) || 5;
        this.edgeWaste = (Number(config.edgeWaste) || 18) / 100;
        this.mode = config.mode || 'MIXED'; // 'V', 'H', 'MIXED'
    }

    optimize(w, h, pieces) {
        if (this.mode === 'MIXED') {
            // Ejecutamos las 3 estrategias y nos quedamos con la mejor (Mayor Eficiencia)
            const results = [
                this._optimizeStrip(w, h, pieces, 'H'),
                this._optimizeStrip(w, h, pieces, 'V'),
                this._optimizeRecursive(w, h, pieces) // El nuevo "Cálculo Mixto"
            ];
            
            // Filtrar resultados válidos y buscar el de mejor eficiencia
            return results.reduce((best, current) => {
                if (!best || current.stats.efficiency > best.stats.efficiency) return current;
                return best;
            });
        } else {
            return this._optimizeStrip(w, h, pieces, this.mode);
        }
    }

    // ESTRATEGIA 1 y 2: Basada en Tiras (Vertical u Horizontal)
    _optimizeStrip(w, h, pieces, philosophy) {
        const usableW = Number(w) - (this.trim * 2);
        const usableH = Number(h) - (this.trim * 2);
        
        let flatPieces = this._flatten(pieces);
        if (philosophy === 'H') flatPieces.sort((a, b) => b.h - a.h || b.l - a.l);
        else flatPieces.sort((a, b) => b.l - a.l || b.h - a.h);

        const plates = [];
        let remainingPieces = [...flatPieces];

        while (remainingPieces.length > 0) {
            const plate = { id: plates.length + 1, strips: [] };
            let currentUsed = 0;
            const maxDim = (philosophy === 'H') ? usableH : usableW;
            const secDim = (philosophy === 'H') ? usableW : usableH;

            while (currentUsed < maxDim && remainingPieces.length > 0) {
                let bestIdx = -1;
                for(let i=0; i<remainingPieces.length; i++) {
                    const p = remainingPieces[i];
                    const p1 = (philosophy === 'H') ? p.h : p.l;
                    const p2 = (philosophy === 'H') ? p.l : p.h;
                    if (p1 <= (maxDim - currentUsed) && p2 <= secDim) { bestIdx = i; break; }
                }

                if (bestIdx === -1) break; 

                const stripSize = (philosophy === 'H') ? remainingPieces[bestIdx].h : remainingPieces[bestIdx].l;
                const strip = { 
                    x: (philosophy === 'H') ? 0 : currentUsed, y: (philosophy === 'H') ? currentUsed : 0,
                    w: (philosophy === 'H') ? usableW : stripSize, h: (philosophy === 'H') ? stripSize : usableH,
                    items: [] 
                };
                
                let currentPos = 0;
                for (let i = 0; i < remainingPieces.length; i++) {
                    const p = remainingPieces[i];
                    const p1 = (philosophy === 'H') ? p.h : p.l;
                    const p2 = (philosophy === 'H') ? p.l : p.h;
                    
                    if (p1 <= stripSize && p2 <= (secDim - currentPos)) {
                        strip.items.push({ ...p, x: (philosophy === 'H') ? currentPos : currentUsed, y: (philosophy === 'H') ? currentUsed : currentPos, rotated: false });
                        currentPos += p2 + this.kerf;
                        remainingPieces.splice(i, 1); i--;
                    } else if (p.canRotate && p2 <= stripSize && p1 <= (secDim - currentPos)) {
                        strip.items.push({ ...p, l: p.h, h: p.l, x: (philosophy === 'H') ? currentPos : currentUsed, y: (philosophy === 'H') ? currentUsed : currentPos, rotated: true });
                        currentPos += (philosophy === 'H' ? p.h : p.l) + this.kerf;
                        remainingPieces.splice(i, 1); i--;
                    }
                }
                if (strip.items.length > 0) { plate.strips.push(strip); currentUsed += stripSize + this.kerf; }
                else break;
            }
            if (plate.strips.length > 0) plates.push(plate);
            else remainingPieces.shift(); 
        }
        return { plates, stats: this.calculateStats(plates, w, h) };
    }

    // ESTRATEGIA 3: RECURSIVA MIXTA (BSSF - Best Short Side Fit)
    // Esta estrategia permite que las tiras cambien de orientación según convenga (Cálculo Mixto)
    _optimizeRecursive(w, h, pieces) {
        const usableW = Number(w) - (this.trim * 2);
        const usableH = Number(h) - (this.trim * 2);
        let flatPieces = this._flatten(pieces).sort((a, b) => (b.l * b.h) - (a.l * a.h)); // Por área
        
        const plates = [];
        let remainingPieces = [...flatPieces];

        while (remainingPieces.length > 0) {
            const plate = { id: plates.length + 1, strips: [] };
            // En el modo recursivo, simulamos una "tira" gigante que es el tablero entero
            // y usamos particionamiento binario (Guillotina Real)
            const freeRects = [{ x: 0, y: 0, w: usableW, h: usableH }];

            while (freeRects.length > 0 && remainingPieces.length > 0) {
                let bestFit = null;
                let bestRectIdx = -1;
                let bestPieceIdx = -1;
                let minShortSideFit = Infinity;

                // Buscamos el "Mejor Encaje" (BSSF)
                for (let i = 0; i < remainingPieces.length; i++) {
                    const p = remainingPieces[i];
                    for (let j = 0; j < freeRects.length; j++) {
                        const r = freeRects[j];
                        
                        // Probar normal
                        if (p.l <= r.w && p.h <= r.h) {
                            const leftoverW = r.w - p.l;
                            const leftoverH = r.h - p.h;
                            const shortSide = Math.min(leftoverW, leftoverH);
                            if (shortSide < minShortSideFit) {
                                minShortSideFit = shortSide;
                                bestRectIdx = j; bestPieceIdx = i;
                                bestFit = { ...p, x: r.x, y: r.y, rotated: false };
                            }
                        }
                        // Probar rotada
                        if (p.canRotate && p.h <= r.w && p.l <= r.h) {
                            const leftoverW = r.w - p.h;
                            const leftoverH = r.h - p.l;
                            const shortSide = Math.min(leftoverW, leftoverH);
                            if (shortSide < minShortSideFit) {
                                minShortSideFit = shortSide;
                                bestRectIdx = j; bestPieceIdx = i;
                                bestFit = { ...p, l: p.h, h: p.l, x: r.x, y: r.y, rotated: true };
                            }
                        }
                    }
                }

                if (!bestFit) break;

                const r = freeRects.splice(bestRectIdx, 1)[0];
                const piece = remainingPieces.splice(bestPieceIdx, 1)[0];
                
                // Añadir al "strip" virtual (para compatibilidad con visualizador)
                if (plate.strips.length === 0) plate.strips.push({ items: [] });
                plate.strips[0].items.push(bestFit);

                // Particionar el rectángulo sobrante (Guillotina)
                // Decidimos el eje de corte según cuál deja el área más "limpia" (Symmetry)
                if (r.w - bestFit.l > r.h - bestFit.h) {
                    // Corte vertical primero
                    if (r.w - bestFit.l > 0) freeRects.push({ x: r.x + bestFit.l + this.kerf, y: r.y, w: r.w - bestFit.l - this.kerf, h: r.h });
                    if (r.h - bestFit.h > 0) freeRects.push({ x: r.x, y: r.y + bestFit.h + this.kerf, w: bestFit.l, h: r.h - bestFit.h - this.kerf });
                } else {
                    // Corte horizontal primero
                    if (r.h - bestFit.h > 0) freeRects.push({ x: r.x, y: r.y + bestFit.h + this.kerf, w: r.w, h: r.h - bestFit.h - this.kerf });
                    if (r.w - bestFit.l > 0) freeRects.push({ x: r.x + bestFit.l + this.kerf, y: r.y, w: r.w - bestFit.l - this.kerf, h: bestFit.h });
                }
            }
            if (plate.strips[0].items.length > 0) plates.push(plate);
            else remainingPieces.shift();
        }
        return { plates, stats: this.calculateStats(plates, w, h) };
    }

    _flatten(pieces) {
        let flat = [];
        pieces.forEach(p => {
            for (let i = 0; i < (Number(p.q) || 1); i++) {
                flat.push({ ...p, l: Number(p.l), h: Number(p.h), nominalL: Number(p.l), nominalH: Number(p.h), q: 1, originalId: p.id });
            }
        });
        return flat;
    }

    calculateStats(plates, w, h) {
        let usedArea = 0;
        let totalPieces = 0;
        let edgeMeters = { "0.45": 0, "1": 0, "2": 0 };

        plates.forEach(plate => {
            plate.strips.forEach(strip => {
                strip.items.forEach(item => {
                    usedArea += item.l * item.h;
                    totalPieces++;
                    if (item.edges) {
                        const factor = 1 + this.edgeWaste;
                        if (item.edges.t > 0) edgeMeters[item.edges.t] += (item.nominalL / 1000) * factor;
                        if (item.edges.b > 0) edgeMeters[item.edges.b] += (item.nominalL / 1000) * factor;
                        if (item.edges.l > 0) edgeMeters[item.edges.l] += (item.nominalH / 1000) * factor;
                        if (item.edges.r > 0) edgeMeters[item.edges.r] += (item.nominalH / 1000) * factor;
                    }
                });
            });
        });

        return {
            totalPlates: plates.length, totalPieces: totalPieces,
            totalM2: usedArea / 1000000,
            efficiency: (plates.length * w * h) > 0 ? (usedArea / (plates.length * w * h)) * 100 : 0,
            edgeMeters
        };
    }
}
