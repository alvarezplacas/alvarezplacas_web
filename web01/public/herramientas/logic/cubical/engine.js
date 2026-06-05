/**
 * CubiCal PRO Engine - V1.0
 * Motor de cálculo de piezas y optimización de placas.
 */

export const MODULE_TYPES = {
    CAJONERA: 'CAJONERA',
    PLACARD: 'PLACARD',
    BIBLIOTECA: 'BIBLIOTECA',
    BAJO_MESADA: 'BAJO_MESADA',
    ALACENA: 'ALACENA',
    ESCRITORIO: 'ESCRITORIO'
};

/**
 * Calcula las piezas necesarias para un módulo específico de manera dinámica.
 * @param {string} type Tipo de módulo
 * @param {object} dims {alto, ancho, prof, n_cajones, n_puertas, n_estantes}
 * @param {number} thickness Espesor de la placa (default 18mm)
 */
export function calculateModulePieces(type, dims, thickness = 18, customVars = {}, buildStyle = {}) {
    const { alto, ancho, prof, n_cajones, n_estantes, n_puertas } = dims;
    const overFront = buildStyle.topOverhangFront || 0;
    let pieces = [];

    if (type === MODULE_TYPES.ESCRITORIO) {
        const cajoneraW = customVars.cajoneraWidth || 400;
        // Lógica Especial de Escritorio Juvenil
        pieces.push({ name: 'Techo de Escritorio', h: ancho, w: prof + overFront, qty: 1 });
        pieces.push({ name: 'Lateral Izquierdo', h: alto - thickness, w: prof, qty: 1 });
        
        // Cajonera derecha (ancho dinámico)
        pieces.push({ name: 'Lateral Derecho (Cajonera)', h: alto - thickness, w: prof, qty: 1 });
        pieces.push({ name: 'Divisor Interno (Cajonera)', h: alto - thickness, w: prof, qty: 1 });
        pieces.push({ name: 'Piso Cajonera', h: cajoneraW - (thickness * 2), w: prof, qty: 1 });
        
        pieces.push({ name: 'Faldón (Modesty Panel)', h: 300, w: ancho - cajoneraW - thickness, qty: 1 });
        pieces.push({ name: 'Bandeja Teclado', h: prof - 100, w: ancho - cajoneraW - thickness - 26, qty: 1 });
        
        // Cajones
        if (n_cajones > 0) {
            const hFrente = Math.floor((alto - thickness - 80) / n_cajones);
            for (let i = 0; i < n_cajones; i++) {
                pieces.push({ name: `Frente Cajón ${i+1}`, h: hFrente, w: cajoneraW - 4, qty: 1, isFront: true });
                const hCajonInterno = Math.min(150, Math.max(100, Math.floor(hFrente - 50)));
                pieces.push({ name: `Lateral Cajón ${i+1}`, h: hCajonInterno, w: prof - 50, qty: 2 });
                pieces.push({ name: `Contra-frente Cajón ${i+1}`, h: hCajonInterno, w: cajoneraW - (thickness * 2) - 26 - (thickness * 2), qty: 2 });
                pieces.push({ name: `Fondo Cajón MDF 3mm ${i+1}`, h: prof - 50, w: cajoneraW - (thickness * 2) - 26, qty: 1, isBackground: true });
            }
        }
        return pieces;
    }

    // Laterales (2 unidades)
    pieces.push({ name: 'Lateral de Carcasa', h: alto - thickness, w: prof, qty: 2 });

    // Techo
    pieces.push({ name: 'Techo de Carcasa', h: ancho, w: prof + overFront, qty: 1 });

    // Base (o amarres para Bajo Mesada)
    if (type === MODULE_TYPES.BAJO_MESADA) {
        pieces.push({ name: 'Piso de Carcasa', h: ancho - (thickness * 2), w: prof, qty: 1 });
        pieces.push({ name: 'Faja Superior (Amarre)', h: ancho - (thickness * 2), w: 100, qty: 2 });
        pieces.push({ name: 'Zócalo Base Bajo Mesada', h: ancho - (thickness * 2), w: 120, qty: 2 });
    } else {
        pieces.push({ name: 'Base de Carcasa', h: ancho - (thickness * 2), w: prof, qty: 1 });
        if (type === MODULE_TYPES.CAJONERA) {
            pieces.push({ name: 'Zócalo Base Chifonier', h: ancho - (thickness * 2), w: 80, qty: 2 });
        }
    }

    // Fondo Trasero (MDF 3mm)
    const tieneContenido = n_cajones > 0 || n_estantes > 0 || n_puertas > 0;
    if (type !== MODULE_TYPES.BIBLIOTECA || tieneContenido) {
        pieces.push({ name: 'Fondo MDF 3mm', h: alto - 10, w: ancho - 10, qty: 1, isBackground: true });
    }

    // Estantes Regulables
    if (n_estantes > 0) {
        pieces.push({ name: 'Estante Regulable', h: ancho - (thickness * 2) - 2, w: prof - 20, qty: n_estantes });
    }
    // Lógica Específica Rack TV (3 columnas)
    if (type === MODULE_TYPES.RACK_TV) {
        const centerW = customVars.colCenterWidth || 600;
        const sideW = Math.floor((ancho - (thickness * 4) - centerW) / 2);
        const hUtilTV = alto - (thickness * 2);

        // Carcasa (Laterales, Techo, Piso, Fondo)
        pieces.push({ name: 'Lateral Izquierdo Rack', h: alto - thickness, w: prof, qty: 1 });
        pieces.push({ name: 'Lateral Derecho Rack', h: alto - thickness, w: prof, qty: 1 });
        pieces.push({ name: 'Techo Rack TV', h: ancho, w: prof + overFront, qty: 1 });
        pieces.push({ name: 'Base Rack TV', h: ancho - (thickness * 2), w: prof, qty: 1 });
        pieces.push({ name: 'Fondo MDF 3mm', h: alto - 10, w: ancho - 10, qty: 1, isBackground: true });

        // Divisores verticales
        pieces.push({ name: 'Divisor Vertical Izquierdo', h: hUtilTV, w: prof - 20, qty: 1 });
        pieces.push({ name: 'Divisor Vertical Derecho', h: hUtilTV, w: prof - 20, qty: 1 });

        // Puertas (En columnas laterales)
        if (n_puertas > 0) {
            const hPuerta = hUtilTV - 4; // holgura
            const wPuerta = sideW + thickness - 4; 
            pieces.push({ name: 'Puerta Izquierda', h: hPuerta, w: wPuerta, qty: 1, isFront: true });
            if (n_puertas > 1) {
                pieces.push({ name: 'Puerta Derecha', h: hPuerta, w: wPuerta, qty: 1, isFront: true });
            }
        }

        // Centro (Cajones y estantes)
        let centerH = hUtilTV;
        if (n_cajones > 0) {
            const totalDrawerH = 200 * n_cajones;
            centerH = Math.max(hUtilTV - totalDrawerH, Math.floor(hUtilTV / 2));
            const finalDrawerH = hUtilTV - centerH;
            const hFrente = Math.floor(finalDrawerH / n_cajones);
            for (let i = 0; i < n_cajones; i++) {
                pieces.push({ name: `Frente Cajón Centro ${i+1}`, h: hFrente - 4, w: centerW - 4, qty: 1, isFront: true });
                const hCajonInterno = Math.min(150, Math.max(100, Math.floor(hFrente - 50)));
                pieces.push({ name: `Lateral Cajón Centro ${i+1}`, h: hCajonInterno, w: prof - 50, qty: 2 });
                pieces.push({ name: `Contra-frente Cajón ${i+1}`, h: hCajonInterno, w: centerW - (thickness * 2) - 26 - (thickness * 2), qty: 2 });
                pieces.push({ name: `Fondo Cajón MDF 3mm ${i+1}`, h: prof - 50, w: centerW - (thickness * 2) - 26, qty: 1, isBackground: true });
            }
        }
        
        if (n_estantes > 0) {
            pieces.push({ name: 'Estante Central Rack', h: centerW, w: prof - 20, qty: n_estantes });
        }

        return pieces;
    }

    // Calcular espacio útil y repartirlo para el resto de módulos genéricos
    let hUtil = alto - thickness;
    if (type === MODULE_TYPES.CAJONERA) hUtil -= (80 + thickness);
    else if (type === MODULE_TYPES.BAJO_MESADA) hUtil -= (120 + thickness);

    let drawerSpaceH = 0;
    let doorSpaceH = 0;

    if (n_cajones > 0 && n_puertas > 0) {
        drawerSpaceH = n_cajones * 200; // Asumir 200mm por frente de cajón si hay ambos
        if (drawerSpaceH > hUtil - 300) drawerSpaceH = hUtil - 300; // Garantizar 300mm mínimo para puertas
        doorSpaceH = hUtil - drawerSpaceH;
    } else if (n_cajones > 0) {
        drawerSpaceH = hUtil;
    } else if (n_puertas > 0) {
        doorSpaceH = hUtil;
    }

    // Cajones (Cajonera interna)
    if (n_cajones > 0) {
        const hFrente = Math.floor((drawerSpaceH - (n_cajones * 4)) / n_cajones);
        
        for (let i = 0; i < n_cajones; i++) {
            // Frente visible
            pieces.push({ name: `Frente Cajón ${i+1}`, h: hFrente, w: ancho - 4, qty: 1, isFront: true });
            // Laterales de cajón (150mm alto estándar o adaptado)
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
        const hingeType = buildStyle.hingeType || 'codo_0';
        const doorStyle = buildStyle.doorStyle || 'rasante';
        
        let hPuerta = doorSpaceH;
        if (hingeType === 'codo_18') {
            // Embutida: gap de 6mm en total (3 arriba, 3 abajo)
            hPuerta = doorSpaceH - 6;
        } else {
            // Exterior (Codo 0 / Codo 9): cubre el piso (thickness) y según la cobertura de techo (doorStyle)
            if (doorStyle === 'medio') {
                hPuerta = doorSpaceH + thickness + (thickness / 2) - 3;
            } else if (doorStyle === 'cero') {
                hPuerta = doorSpaceH + thickness + thickness - 6;
            } else {
                // rasante: acaba abajo de la tapa, cubre el piso pero no la tapa
                hPuerta = doorSpaceH + thickness - 6;
            }
        }
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
