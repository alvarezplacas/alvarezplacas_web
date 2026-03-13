import { atom, computed } from 'nanostores';

export const BRANDS = {
    'EGGER': { width: 2600, height: 1830, netWidth: 2595, netHeight: 1825 },
    'FAPLAC': { width: 2750, height: 1830, netWidth: 2745, netHeight: 1825 },
    'SADEPAN': { width: 2820, height: 1830, netWidth: 2815, netHeight: 1825 },
    'OTRO': { width: 2600, height: 1830, netWidth: 2595, netHeight: 1825 }
};

// Vendedores configurables (Ventanillas)
export const sellers = atom([
    { id: 1, name: 'Ventanilla 1', phone: '123456789', orders: 0 },
    { id: 2, name: 'Ventanilla 2', phone: '987654321', orders: 0 },
    { id: 3, name: 'Ventanilla 3', phone: '555555555', orders: 0 }
]);

export const currentSheetItems = atom([]); // Piezas de la placa actual
export const allSheets = atom([]); // Lista de placas finalizadas [{ config, items }]
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
    // Reseteamos config para la siguiente placa pero mantenemos esSetup en false para volver a configurar
    sheetConfig.set({ ...config, isSetup: false });
    return true;
};

export const getLeptonExport = () => {
    const sheets = allSheets.get();
    const current = currentSheetItems.get();
    // Combinamos todo para el vendedor
    const totalItems = [...sheets.flatMap(s => s.items), ...current];
    if (totalItems.length === 0) return '';
    
    let exportText = "";
    totalItems.forEach((item) => {
        exportText += `${item.quantity}, ${item.length}, ${item.width}, ${item.thickness || 18}, ${item.label || '(sin nombre)'}\r\n`;
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
    // Asignación simple por menos pedidos o round robin
    const sorted = [...currentSellers].sort((a, b) => a.orders - b.orders);
    const assigned = sorted[0];
    
    // Actualizamos contador local (en un sistema real esto iría a DB)
    sellers.set(currentSellers.map(s => s.id === assigned.id ? { ...s, orders: s.orders + 1 } : s));
    return assigned;
};
