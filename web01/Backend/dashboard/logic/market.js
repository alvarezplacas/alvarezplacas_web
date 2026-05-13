/**
 * Market Logic - Datos Financieros Externos.
 */

export const getMarketData = async () => {
    try {
        // 1. Dólar (API Argentina) - Datos automáticos en tiempo real
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const resDolar = await fetch('https://dolarapi.com/v1/dolares', { signal: controller.signal });
        const dolares = await resDolar.json();
        clearTimeout(timeoutId);
        
        const blue = dolares.find(d => d.casa === 'blue');
        const oficial = dolares.find(d => d.casa === 'oficial');

        return {
            usd: {
                blue: blue?.compra || 0,
                blue_venta: blue?.venta || 0,
                oficial: oficial?.compra || 0,
                oficial_venta: oficial?.venta || 0,
                timestamp: new Date().toLocaleTimeString('es-AR')
            }
        };
    } catch (e) {
        console.error("[Market Logic Error]:", e);
        return {
            usd: { blue: 0, oficial: 0, error: true }
        };
    }
};
