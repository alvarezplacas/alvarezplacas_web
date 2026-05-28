/**
 * CubiCal PRO Engine - V1.0
 * Motor de cálculo de piezas y optimización de placas.
 */

export const MODULE_TYPES = {
    CAJONERA: 'CAJONERA',
    PLACARD: 'PLACARD',
    BIBLIOTECA: 'BIBLIOTECA',
    BAJO_MESADA: 'BAJO_MESADA',
    ALACENA: 'ALACENA'
};

/**
 * Calcula las piezas necesarias para un módulo específico de manera dinámica.
 * @param {string} type Tipo de módulo
 * @param {object} dims {alto, ancho, prof, n_cajones, n_puertas, n_estantes}
 * @param {number} thickness Espesor de la placa (default 18mm)
 */
export function calculateModulePieces(type, dims, thickness = 18) {
    const { alto, ancho, prof, n_cajones, n_estantes, n_puertas } = dims;
    let pieces = [];

    // Laterales (2 unidades)
    pieces.push({ name: 'Lateral de Carcasa', h: alto, w: prof, qty: 2 });

    // Techo y Base (o amarres para Bajo Mesada)
    if (type === MODULE_TYPES.BAJO_MESADA) {
        pieces.push({ name: 'Piso de Carcasa', h: ancho - (thickness * 2), w: prof, qty: 1 });
        pieces.push({ name: 'Faja Superior (Amarre)', h: ancho - (thickness * 2), w: 100, qty: 2 });
        pieces.push({ name: 'Zócalo Base Bajo Mesada', h: ancho - (thickness * 2), w: 120, qty: 2 });
    } else {
        pieces.push({ name: 'Techo/Base de Carcasa', h: ancho - (thickness * 2), w: prof, qty: 2 });
        if (type === MODULE_TYPES.CAJONERA) {
            pieces.push({ name: 'Zócalo Base Chifonier', h: ancho - (thickness * 2), w: 80, qty: 2 });
        }
    }

    // Fondo Trasero (MDF 3mm) - Se asume siempre a menos que sea una biblioteca abierta sin nada
    const tieneContenido = n_cajones > 0 || n_estantes > 0 || n_puertas > 0;
    if (type !== MODULE_TYPES.BIBLIOTECA || tieneContenido) {
        pieces.push({ name: 'Fondo MDF 3mm', h: alto - 10, w: ancho - 10, qty: 1, isBackground: true });
    }

    // Estantes Regulables
    if (n_estantes > 0) {
        pieces.push({ name: 'Estante Regulable', h: ancho - (thickness * 2) - 2, w: prof - 20, qty: n_estantes });
    }

    // Cajones (Cajonera interna)
    if (n_cajones > 0) {
        let hDisponible = alto;
        if (type === MODULE_TYPES.CAJONERA) {
            hDisponible = alto - 80 - (thickness * 2); // Descontar zócalo y piso
        } else if (type === MODULE_TYPES.BAJO_MESADA) {
            hDisponible = alto - 120 - (thickness * 2); // Descontar zócalo y piso/fajas
        }
        
        const hFrente = Math.floor((hDisponible - (n_cajones * 4)) / n_cajones);
        
        for (let i = 0; i < n_cajones; i++) {
            // Frente visible
            pieces.push({ name: `Frente Cajón ${i+1}`, h: hFrente, w: ancho - 4, qty: 1, isFront: true });
            // Laterales de cajón (150mm alto estándar)
            const hCajonInterno = Math.min(150, Math.max(100, Math.floor(hFrente - 50)));
            pieces.push({ name: `Lateral Cajón ${i+1}`, h: hCajonInterno, w: prof - 50, qty: 2 });
            // Contra-frente cajón (interior)
            pieces.push({ name: `Contra-frente Cajón ${i+1}`, h: hCajonInterno, w: ancho - (thickness * 2) - 26 - (thickness * 2), qty: 2 });
            // Fondo de cajón (MDF 3mm)
            pieces.push({ name: `Fondo Cajón MDF 3mm ${i+1}`, h: prof - 50, w: ancho - (thickness * 2) - 26, qty: 1, isBackground: true });
        }
    }

    // Puertas
    if (n_puertas > 0) {
        const wPuerta = Math.floor((ancho - (n_puertas * 2)) / n_puertas) - 2;
        const hPuerta = type === MODULE_TYPES.BAJO_MESADA ? (alto - 120) : (alto - 4);
        pieces.push({ name: 'Puerta', h: hPuerta, w: wPuerta, qty: n_puertas, isFront: true });
    }

    return pieces;
}

/**
 * Heurística Greedy Shelf para optimización de placas (Cutting Stock Problem)
 * @param {Array} pieces Array de {h, w, qty}
 * @param {object} board {h, w} Dimensiones de la placa
 * @param {number} kerf Ancho de sierra (default 4mm)
 */
export function optimizeBoards(pieces, board, kerf = 4) {
    // 1. Expandir cantidades a piezas individuales
    let flatPieces = [];
    pieces.forEach(p => {
        for (let i = 0; i < p.qty; i++) {
            flatPieces.push({ ...p, id: `${p.name}-${i}` });
        }
    });

    // 2. Ordenar por altura descendente
    flatPieces.sort((a, b) => b.h - a.h);

    let boardsUsed = [];
    let currentBoard = { id: 1, shelves: [], usedH: 0, usedW: 0 };
    
    function startNewBoard() {
        if (currentBoard.shelves.length > 0) {
            boardsUsed.push(currentBoard);
        }
        currentBoard = { id: boardsUsed.length + 1, shelves: [], usedH: 0, usedW: 0 };
    }

    flatPieces.forEach(p => {
        let placed = false;

        // Intentar colocar en estanterías existentes de la placa actual
        for (let shelf of currentBoard.shelves) {
            if (shelf.h >= p.h && (shelf.usedW + p.w + kerf) <= board.w) {
                shelf.pieces.push(p);
                shelf.usedW += p.w + kerf;
                placed = true;
                break;
            }
        }

        // Si no cabe, intentar abrir nueva estantería en la placa actual
        if (!placed) {
            if ((currentBoard.usedH + p.h + kerf) <= board.h) {
                const newShelf = { h: p.h, usedW: p.w + kerf, pieces: [p] };
                currentBoard.shelves.push(newShelf);
                currentBoard.usedH += p.h + kerf;
                placed = true;
            }
        }

        // Si no cabe en la placa actual, abrir nueva placa
        if (!placed) {
            startNewBoard();
            const newShelf = { h: p.h, usedW: p.w + kerf, pieces: [p] };
            currentBoard.shelves.push(newShelf);
            currentBoard.usedH += p.h + kerf;
        }
    });

    if (currentBoard.shelves.length > 0) {
        boardsUsed.push(currentBoard);
    }

    // Calcular estadísticas
    const boardArea = board.h * board.w;
    const totalPiecesArea = flatPieces.reduce((sum, p) => sum + (p.h * p.w), 0);
    const totalBoardArea = boardsUsed.length * boardArea;
    const efficiency = (totalPiecesArea / totalBoardArea) * 100;

    return {
        boards: boardsUsed,
        stats: {
            count: boardsUsed.length,
            efficiency: efficiency.toFixed(2),
            waste: (100 - efficiency).toFixed(2),
            totalM2: (totalBoardArea / 1000000).toFixed(2)
        }
    };
}
