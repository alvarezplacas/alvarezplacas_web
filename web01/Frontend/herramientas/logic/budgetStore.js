import { atom, computed } from 'nanostores';

/**
 * Budget Store - Estado global del presupuestador.
 * Propiedad del Agente 5 (Frontend/Herramientas).
 */

export const BRANDS = {
    'EGGER': { width: 2600, height: 1830, netWidth: 2590, netHeight: 1820 },
    'FAPLAC': { width: 2750, height: 1830, netWidth: 2740, netHeight: 1820 },
    'SADEPAN': { width: 2820, height: 1830, netWidth: 2810, netHeight: 1820 },
    'OTRO': { width: 2600, height: 1830, netWidth: 2590, netHeight: 1820 }
};

export const sellers = atom([]);
export const userContext = atom(null); // { id, name, seller: { id, name, phone } }

export const preferredSellerId = atom(null);
export const currentSheetItems = atom([]);

// Persistence logic for allSheets (sessionStorage)
const savedSheets = typeof window !== 'undefined' ? sessionStorage.getItem('alvarez_budget_history') : null;
export const allSheets = atom(savedSheets ? JSON.parse(savedSheets) : []);

if (typeof window !== 'undefined') {
    allSheets.subscribe(sheets => {
        sessionStorage.setItem('alvarez_budget_history', JSON.stringify(sheets));
    });
}

export const sheetConfig = atom({
    brand: 'FAPLAC',
    thickness: 18,
    plateName: '', // Ejemplo: CEDRO
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
    sheetConfig.set({ ...config, plateName: '', isSetup: false });
    return true;
};

/**
 * Genera el string crudo para Leptom
 */
export const getLeptomRaw = (allData) => {
    let exportText = "";
    allData.forEach((s) => {
        const materialName = `${s.config.plateName || s.config.brand} ${s.config.thickness}mm`.substring(0, 30);
        s.items.forEach((item) => {
            const rotaVal = item.canRotate ? 1 : 0;
            const cArr = item.edges?.top || 0;
            const cAbj = item.edges?.bottom || 0;
            const cDer = item.edges?.right || 0;
            const cIzq = item.edges?.left || 0;
            const detalle = (item.label || 'Pieza').substring(0, 30).replace(/;/g, ',');
            exportText += `${item.quantity};${item.length};${item.width};${detalle};${materialName};${rotaVal};${cArr};${cAbj};${cDer};${cIzq}\n`;
        });
    });
    return exportText;
};

/**
 * Genera el mensaje combinado para WhatsApp (Humano + Leptom)
 */
export const getVisualSummary = () => {
    const sheets = allSheets.get();
    const current = currentSheetItems.get();
    const currentConf = sheetConfig.get();
    const user = userContext.get();
    
    let allData = [...sheets];
    if (current.length > 0) allData.push({ config: currentConf, items: current });

    if (allData.length === 0) return 'No hay piezas cargadas.';

    let summary = `*PEDIDO: ${user ? user.name : 'Cliente Web'}*\n`;
    summary += `===================================\n\n`;
    
    allData.forEach((s, idx) => {
        summary += `*PLACA #${idx + 1}: ${s.config.plateName || s.config.brand} (${s.config.thickness}mm)*\n`;
        summary += `_Medida: ${s.config.width}x${s.config.height}mm_\n`;
        s.items.forEach((item) => {
            summary += `• ${item.quantity}un | ${item.length}x${item.width} [${item.label || '-'}]\n`;
        });
        summary += `\n`;
    });
    
    summary += `-----------------------------------\n`;
    summary += `*COPIAR Y PEGAR EN LEPTOM:*\n`;
    summary += `\`\`\`\n`;
    summary += getLeptomRaw(allData);
    summary += `\`\`\`\n`;
    summary += `===================================\n`;
    summary += `_Generado en Alvarezplacas.com.ar_`;
    
    return summary;
};

/**
 * Guarda el pedido en Directus si el usuario está logueado
 */
export const savePedidoToDirectus = async () => {
    const user = userContext.get();
    if (!user) return null;

    const summary = getVisualSummary();
    const leptomData = getLeptomRaw([...allSheets.get(), { config: sheetConfig.get(), items: currentSheetItems.get() }]);

    try {
        const response = await fetch('/api/cliente/save-budget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente_id: user.id,
                vendedor_id: user.vendedor?.id,
                resumen: summary,
                leptom_data: leptomData,
                total_m2: document.getElementById('stat-m2')?.textContent || '0'
            })
        });
        return await response.json();
    } catch (e) {
        console.error("Error al guardar pedido:", e);
        return { success: false };
    }
};

export const fetchSellers = async () => {
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.sellers) sellers.set(data.sellers);
    } catch (e) {
        console.error("Error al cargar vendedores");
    }
};
