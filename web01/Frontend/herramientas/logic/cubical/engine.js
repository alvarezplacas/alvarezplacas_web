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
 * Calcula las piezas necesarias para un módulo específico.
 * @param {string} type Tipo de módulo (MODULE_TYPES)
 * @param {object} dims {alto, ancho, prof, n_cajones, n_puertas, n_estantes}
 * @param {number} thickness Espesor de la placa (default 18mm)
 */
export function calculateModulePieces(type, dims, thickness = 18) {
    const { alto, ancho, prof } = dims;
    let pieces = [];

    // Lógica base: Cuerpo del mueble (Carcasa)
    if (type !== MODULE_TYPES.BIBLIOTECA) {
        // Laterales (2 unidades)
        pieces.push({ name: 'Lateral', h: alto, w: prof, qty: 2 });
        // Techo y Base (2 unidades) - Van por dentro de los laterales
        pieces.push({ name: 'Techo/Base', h: ancho - (thickness * 2), w: prof, qty: 2 });
        // Fondo (1 unidad) - Suele ser de 3mm o 5.5mm, pero aquí calculamos área
        pieces.push({ name: 'Fondo Trasero', h: alto - thickness, w: ancho - thickness, qty: 1, isBackground: true });
    } else {
        // Biblioteca (Sin fondo a veces, o con estantes fijos)
        pieces.push({ name: 'Lateral', h: alto, w: prof, qty: 2 });
        pieces.push({ name: 'Estante Fijo (Sup/Inf)', h: ancho - (thickness * 2), w: prof, qty: 2 });
    }

    // Lógica específica por tipo
    switch (type) {
        case MODULE_TYPES.CAJONERA:
            const nCajones = dims.n_cajones || 1;
            const hFrente = Math.floor(alto / nCajones) - 4; // 4mm de huelgo entre frentes
            
            for (let i = 0; i < nCajones; i++) {
                // Frente visible
                pieces.push({ name: `Frente Cajón ${i+1}`, h: hFrente, w: ancho - 4, qty: 1, isFront: true });
                // Laterales cajón (2 por cajón) - 50mm menos que la profundidad del mueble
                pieces.push({ name: `Lateral Cajón ${i+1}`, h: 150, w: prof - 50, qty: 2 });
                // Frente/Trasero cajón (2 por cajón)
                pieces.push({ name: `Contra-frente Cajón ${i+1}`, h: 150, w: ancho - (thickness * 2) - 26 - (thickness * 2), qty: 2 });
                // Fondo cajón
                pieces.push({ name: `Fondo Cajón ${i+1}`, h: prof - 50, w: ancho - (thickness * 2) - 26, qty: 1, isBackground: true });
            }
            break;

        case MODULE_TYPES.PLACARD:
        case MODULE_TYPES.BAJO_MESADA:
        case MODULE_TYPES.ALACENA:
            const nPuertas = dims.n_puertas || 1;
            const wPuerta = Math.floor(ancho / nPuertas) - 4;
            pieces.push({ name: 'Puerta', h: alto - 4, w: wPuerta, qty: nPuertas, isFront: true });
            
            if (dims.n_estantes) {
                pieces.push({ name: 'Estante Regulable', h: ancho - (thickness * 2) - 2, w: prof - 20, qty: dims.n_estantes });
            }
            break;
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
