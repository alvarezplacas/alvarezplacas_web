/**
 * Market Logic - Datos Financieros Externos.
 */

export const getMarketData = async () => {
    try {
        // 1. Dólar (API Argentina)
        const resDolar = await fetch('https://dolarapi.com/v1/dolares');
        const dolares = await resDolar.json();
        
        const blue = dolares.find(d => d.casa === 'blue');
        const oficial = dolares.find(d => d.casa === 'oficial');

        // 2. Acciones (Simulado / Placeholder con valores base reales aproximados)
        // Nota: En una versión ERP completa, aquí se consultaría Finnhub o Yahoo Finance con API Key.
        const stocks = [
            { id: 'egger', name: 'Egger Group (EGX)', value: '€ 174.50', trend: 'up' },
            { id: 'arauco', name: 'Arauco / Faplac', value: '$ 42.80', trend: 'down' }
        ];

        return {
            usd: {
                blue: blue?.compra || 0,
                blue_venta: blue?.venta || 0,
                oficial: oficial?.compra || 0,
                oficial_venta: oficial?.venta || 0,
                timestamp: new Date().toLocaleTimeString('es-AR')
            },
            stocks: stocks
        };
    } catch (e) {
        console.error("[Market Logic Error]:", e);
        return {
            usd: { blue: 0, oficial: 0, error: true },
            stocks: []
        };
    }
};
