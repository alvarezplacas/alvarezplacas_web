import { atom, computed } from 'nanostores';

/**
 * Budget Store - Estado global del presupuestador.
 * Propiedad del Agente 5 (Frontend/Herramientas).
 */

export const BRANDS = {
    'EGGER': { width: 2600, height: 1830, netWidth: 2595, netHeight: 1825 },
    'FAPLAC': { width: 2750, height: 1830, netWidth: 2745, netHeight: 1825 },
    'SADEPAN': { width: 2820, height: 1830, netWidth: 2815, netHeight: 1825 },
    'OTRO': { width: 2600, height: 1830, netWidth: 2595, netHeight: 1825 }
};

export const sellers = atom([
    { id: 1, name: 'Ventanilla 1', phone: '123456789', orders: 0, email: 'vendedor1@alvarezplacas.com' },
    { id: 2, name: 'Ventanilla 2', phone: '987654321', orders: 0, email: 'vendedor2@alvarezplacas.com' },
    { id: 3, name: 'Ventanilla 3', phone: '555555555', orders: 0, email: 'vendedor3@alvarezplacas.com' }
]);

export const preferredSellerId = atom(null);
export const currentSheetItems = atom([]);
export const allSheets = atom([]);
export const sheetConfig = atom({
    brand: 'FAPLAC',
    thickness: 18,
    width: 2750,
    height: 1830,
    netWidth: 2745,
    netHeight: 1825,
    isSetup: false
});

export const updateSheetConfig = (updates) => {
    const current = sheetConfig.get();
    const newConfig = { ...current, ...updates };
    if (updates.brand && updates.brand !== 'OTRO') {
        const info = BRANDS[updates.brand];
        newConfig.width = info.width;
        newConfig.height = info.height;
        newConfig.netWidth = info.netWidth;
        newConfig.netHeight = info.netHeight;
    } else if (updates.width || updates.height) {
        newConfig.netWidth = (newConfig.width || 0) - 5;
        newConfig.netHeight = (newConfig.height || 0) - 5;
    }
    sheetConfig.set(newConfig);
};

export const addPiece = (piece) => {
    currentSheetItems.set([...currentSheetItems.get(), {
        id: crypto.randomUUID(),
        ...piece
    }]);
};

export const removePiece = (id) => {
    currentSheetItems.set(currentSheetItems.get().filter(item => item.id !== id));
};

export const finalizeSheet = () => {
    const config = sheetConfig.get();
    const items = currentSheetItems.get();
    if (items.length === 0) return false;
    
    allSheets.set([...allSheets.get(), { config: { ...config }, items: [...items] }]);
    currentSheetItems.set([]);
    sheetConfig.set({ ...config, isSetup: false });
    return true;
};

/**
 * Genera el formato listo para copiar en Leptom Optimizer
 * Formato: Cant;Base;Altura;Detalle;Material;Rota;CArr;CAbj;CDer;CIzq
 */
export const getLeptomExport = () => {
    const sheets = allSheets.get();
    const current = currentSheetItems.get();
    const allData = [...sheets];
    if (current.length > 0) {
        allData.push({ config: sheetConfig.get(), items: current });
    }

    if (allData.length === 0) return '';
    
    let exportText = "(copia esto en tu leptom)\r\n";
    
    allData.forEach((s) => {
        const materialName = `${s.config.brand} ${s.config.thickness}mm`.substring(0, 30);
        
        s.items.forEach((item) => {
            const rotaVal = item.canRotate ? 1 : 0;
            // Mapeo de tapacantos (0, 0.45, 1, 2)
            const cArr = item.edges?.top || 0;
            const cAbj = item.edges?.bottom || 0;
            const cDer = item.edges?.right || 0;
            const cIzq = item.edges?.left || 0;
            const detalle = (item.label || 'Pieza').substring(0, 30).replace(/;/g, ',');

            // Formato: Cant;Base;Altura;Detalle;Material;Rota;CArr;CAbj;CDer;CIzq
            exportText += `${item.quantity};${item.length};${item.width};${detalle};${materialName};${rotaVal};${cArr};${cAbj};${cDer};${cIzq}\r\n`;
        });
    });
    
    return exportText;
};

export const getVisualSummary = () => {
    const sheets = allSheets.get();
    const current = currentSheetItems.get();
    const currentConf = sheetConfig.get();
    
    let summary = `*RESUMEN DE PEDIDO - ALVAREZ PLACAS*\n`;
    summary += `===================================\n\n`;
    
    const renderSheet = (config, items, idx) => {
        let s = `*PLACA #${idx + 1}: ${config.brand} ${config.thickness}mm*\n`;
        s += `_Medida: ${config.width}x${config.height}mm_\n`;
        items.forEach((item, i) => {
            s += `• ${item.quantity}un | ${item.length}x${item.width} [${item.label || '-'}]\n`;
        });
        s += `\n`;
        return s;
    };

    sheets.forEach((s, i) => summary += renderSheet(s.config, s.items, i));
    if (current.length > 0) summary += renderSheet(currentConf, current, sheets.length);
    
    summary += `===================================\n`;
    summary += `_Generado en Alvarezplacas_`;
    return summary;
};

export const assignSeller = () => {
    const currentSellers = sellers.get();
    const prefId = preferredSellerId.get();
    let assigned;
    if (prefId) assigned = currentSellers.find(s => s.id === prefId);
    if (!assigned) {
        const sorted = [...currentSellers].sort((a, b) => a.orders - b.orders);
        assigned = sorted[0];
    }
    sellers.set(currentSellers.map(s => s.id === assigned.id ? { ...s, orders: s.orders + 1 } : s));
    return assigned;
};
