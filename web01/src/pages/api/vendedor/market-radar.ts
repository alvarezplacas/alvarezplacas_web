import type { APIRoute } from 'astro';

// In-memory cache for macro indicators
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const GET: APIRoute = async ({ request, cookies }) => {
    // 1. Verify Authentication
    const sellerSession = cookies.get('seller_session')?.value;
    const adminSession = cookies.get('admin_session')?.value;
    if (!sellerSession && !adminSession) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    // Return cached data if valid and not forced
    if (!force && cachedData && (Date.now() - lastFetchTime < CACHE_DURATION)) {
        return new Response(JSON.stringify({ success: true, data: cachedData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const results: any = {
            faplac: { name: 'Empresas Copec (Faplac)', symbol: 'COPEC.SN', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            dexco: { name: 'Dexco S.A. (MDF Brasil)', symbol: 'DXCO3.SA', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            suzano: { name: 'Suzano (Celulosa)', symbol: 'SUZB3.SA', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            celu: { name: 'Celulosa Argentina (Madera Local)', symbol: 'CELU.BA', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            
            lumber: { name: 'Futuros Madera (Lumber)', symbol: 'LBS=F', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            oil: { name: 'Petróleo Brent (Químicos/Flete)', symbol: 'BZ=F', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            eurusd: { name: 'Euro / Dólar (Importación)', symbol: 'EURUSD=X', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            
            ali: { name: 'Aluminio (Global Futures)', symbol: 'ALI=F', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            hrc: { name: 'Acero (Global Hot Rolled)', symbol: 'HRC=F', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            
            aluar: { name: 'Aluar (Aluminio Argentino)', symbol: 'ALUA.BA', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            ternium: { name: 'Ternium (Acero Argentino)', symbol: 'TXAR.BA', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            ypf: { name: 'YPF S.A. (Flete Nacional/Egger)', symbol: 'YPFD.BA', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            merval: { name: 'S&P Merval (Acciones AR)', symbol: '^MERV', price: 0, change: 0, changePercent: 0, changePercent7d: 0, changePercent30d: 0, streak: 0, streakType: 'flat', positiveDaysRatio: 0, maxSwing30d: 0 },
            
            dolar: { blue: { val: 0, var: 0 }, mep: { val: 0, var: 0 }, ccl: { val: 0, var: 0 } },
            riesgoPais: 0,
            panoramaNota: '',
            riesgoPuntaje: 0,
            riesgoClase: 'risk-low',
            riesgoTexto: ''
        };

        // Helper function to fetch Yahoo Finance Historical Data (30 days)
        const fetchYahooHistorical = async (symbol: string) => {
            try {
                // Request 30d range with 1d interval to calculate trends
                const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=30d&interval=1d`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                const data = await res.json();
                
                if (data.chart && data.chart.result && data.chart.result.length > 0) {
                    const result = data.chart.result[0];
                    const meta = result.meta;
                    
                    // Live/Regular Market Price
                    const price = meta.regularMarketPrice || 0;
                    const prevClose = meta.chartPreviousClose || 0;
                    const change = price - prevClose;
                    const changePercent = prevClose ? (change / prevClose) * 100 : 0;
                    
                    // Parse close array
                    const rawClose = result.indicators?.quote?.[0]?.close || [];
                    const prices = rawClose.filter((p: any): p is number => p !== null && p !== undefined && typeof p === 'number');
                    
                    let changePercent7d = 0;
                    let changePercent30d = 0;
                    let streak = 0;
                    let streakType = 'flat';
                    let positiveDaysRatio = 0;
                    let maxSwing30d = 0;

                    if (prices.length > 0) {
                        const lastVal = prices[prices.length - 1];

                        // Weekly Change (approx 5-6 trading days ago)
                        const idx7d = Math.max(0, prices.length - 6);
                        const price7dAgo = prices[idx7d];
                        if (price7dAgo > 0) {
                            changePercent7d = ((price - price7dAgo) / price7dAgo) * 100;
                        }

                        // Monthly Change (approx 20 trading days ago or first element in array)
                        const idx30d = Math.max(0, prices.length - 21);
                        const price30dAgo = prices[idx30d];
                        if (price30dAgo > 0) {
                            changePercent30d = ((price - price30dAgo) / price30dAgo) * 100;
                        } else if (prices[0] > 0) {
                            changePercent30d = ((price - prices[0]) / prices[0]) * 100;
                        }

                        // Max Swing
                        const maxPrice = Math.max(...prices, price);
                        const minPrice = Math.min(...prices, price);
                        if (minPrice > 0) {
                            maxSwing30d = ((maxPrice - minPrice) / minPrice) * 100;
                        }

                        // Positive days ratio
                        let posCount = 0;
                        let activeDays = 0;
                        for (let i = 1; i < prices.length; i++) {
                            const diff = prices[i] - prices[i - 1];
                            if (diff > 0) posCount++;
                            activeDays++;
                        }
                        if (price > lastVal) { posCount++; activeDays++; }
                        else if (price < lastVal) { activeDays++; }
                        positiveDaysRatio = activeDays > 0 ? (posCount / activeDays) * 100 : 0;

                        // Streak calculation
                        const extendedPrices = [...prices];
                        if (price !== lastVal && price > 0) {
                            extendedPrices.push(price);
                        }
                        
                        let currentStreak = 0;
                        let currentType = '';
                        for (let i = extendedPrices.length - 1; i > 0; i--) {
                            const diff = extendedPrices[i] - extendedPrices[i - 1];
                            if (diff > 0) {
                                if (currentType === 'down') break;
                                currentType = 'up';
                                currentStreak++;
                            } else if (diff < 0) {
                                if (currentType === 'up') break;
                                currentType = 'down';
                                currentStreak++;
                            } else {
                                if (currentStreak > 0) break; // flat breaks if we already had a streak
                                currentType = 'flat';
                                currentStreak = 0;
                            }
                        }
                        streak = currentStreak;
                        streakType = currentType || 'flat';
                    }

                    return {
                        price,
                        change,
                        changePercent,
                        changePercent7d,
                        changePercent30d,
                        streak,
                        streakType,
                        positiveDaysRatio,
                        maxSwing30d
                    };
                }
            } catch (e) {
                console.error(`Error fetching historical for ${symbol}:`, e);
            }
            return {
                price: 0,
                change: 0,
                changePercent: 0,
                changePercent7d: 0,
                changePercent30d: 0,
                streak: 0,
                streakType: 'flat',
                positiveDaysRatio: 0,
                maxSwing30d: 0
            };
        };

        // Fetch all symbols in parallel
        const symbols = ['faplac', 'dexco', 'suzano', 'celu', 'lumber', 'oil', 'eurusd', 'ali', 'hrc', 'aluar', 'ternium', 'ypf', 'merval'] as const;
        const promises = symbols.map(async (key) => {
            const data = await fetchYahooHistorical(results[key].symbol);
            results[key].price = data.price;
            results[key].change = data.change;
            results[key].changePercent = data.changePercent;
            results[key].changePercent7d = data.changePercent7d;
            results[key].changePercent30d = data.changePercent30d;
            results[key].streak = data.streak;
            results[key].streakType = data.streakType;
            results[key].positiveDaysRatio = data.positiveDaysRatio;
            results[key].maxSwing30d = data.maxSwing30d;
        });

        // Add DolarAPI fetching
        promises.push(
            fetch('https://dolarapi.com/v1/dolares')
            .then(r => r.json())
            .then(data => {
                if(Array.isArray(data)) {
                    data.forEach(d => {
                        if(d.casa === 'blue') { results.dolar.blue.val = d.venta; results.dolar.blue.var = d.variacion || 0; }
                        if(d.casa === 'bolsa') { results.dolar.mep.val = d.venta; results.dolar.mep.var = d.variacion || 0; }
                        if(d.casa === 'contadoconliqui') { results.dolar.ccl.val = d.venta; results.dolar.ccl.var = d.variacion || 0; }
                    });
                }
            })
            .catch(e => console.error("Error DolarAPI:", e))
        );

        // Add Riesgo Pais
        promises.push(
            fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo')
            .then(r => r.json())
            .then(data => {
                if(data && data.valor) results.riesgoPais = data.valor;
            })
            .catch(e => console.error("Error Riesgo Pais:", e))
        );

        await Promise.all(promises);

        // 3. Centralized Risk Calculation (Puntaje de Riesgo a 30 días)
        let riskScore = 0;
        
        // Reglas de incremento basadas en variación acumulada a 30 días (cambio mensual en pesos de insumos críticos)
        if (results.oil.changePercent30d > 4) riskScore += 1.5;
        else if (results.oil.changePercent30d > 1.5) riskScore += 0.75;

        if (results.lumber.changePercent30d > 5) riskScore += 1.5;
        else if (results.lumber.changePercent30d > 2) riskScore += 0.75;

        if (results.ypf.changePercent30d > 6) riskScore += 1.5;
        else if (results.ypf.changePercent30d > 2) riskScore += 0.75;

        // Insumos metalúrgicos locales (Aluar y Ternium) son los más críticos para herrajes y perfiles
        if (results.aluar.changePercent30d > 6) riskScore += 2.0;
        else if (results.aluar.changePercent30d > 2) riskScore += 1.0;

        if (results.ternium.changePercent30d > 6) riskScore += 2.0;
        else if (results.ternium.changePercent30d > 2) riskScore += 1.0;

        // Proveedores de madera locales/regionales
        if (results.celu.changePercent30d > 5) riskScore += 1.0;
        else if (results.celu.changePercent30d > 1.5) riskScore += 0.5;

        if (results.faplac.changePercent30d > 5) riskScore += 1.0;
        else if (results.faplac.changePercent30d > 1.5) riskScore += 0.5;

        // Si el dólar blue o financiero MEP suben de forma persistente hoy (> 1.5%)
        if (results.dolar.blue.var > 1.5) riskScore += 1.0;
        if (results.dolar.mep.var > 1.5) riskScore += 1.0;

        results.riesgoPuntaje = Math.min(10, Math.round(riskScore * 10) / 10);

        // Definir clases y textos unificados
        if (results.riesgoPuntaje >= 6.0) {
            results.riesgoClase = 'risk-high';
            results.riesgoTexto = 'ALTO RIESGO. Se detecta una fuerte presión alcista acumulada en insumos clave (Siderurgia, Aluminio y Combustibles) con tendencias mensuales persistentes. Altas probabilidades de actualización inmediata en listas de precios de Egger, Faplac y herrajes (Grupo Euro / Bronzen).';
        } else if (results.riesgoPuntaje >= 3.0) {
            results.riesgoClase = 'risk-med';
            results.riesgoTexto = 'RIESGO MEDIO. Inestabilidad en algunos indicadores logísticos o insumos metalúrgicos locales. Se aconseja monitorear de cerca los precios de perfiles de aluminio y fletes preventivamente.';
        } else {
            results.riesgoClase = 'risk-low';
            results.riesgoTexto = 'RIESGO BAJO. Los mercados proveedores operan con normalidad en el acumulado de 30 días. Las fluctuaciones diarias no muestran una tendencia alcista alarmante en pesos.';
        }

        // 4. Dynamic Executive Outlook Note (Panorama Mensual)
        let alzasText = [];
        if (results.ternium.changePercent30d > 1.5) alzasText.push(`Acero (Ternium) +${results.ternium.changePercent30d.toFixed(1)}%`);
        if (results.aluar.changePercent30d > 1.5) alzasText.push(`Aluminio (Aluar) +${results.aluar.changePercent30d.toFixed(1)}%`);
        if (results.ypf.changePercent30d > 1.5) alzasText.push(`Combustible (YPF) +${results.ypf.changePercent30d.toFixed(1)}%`);
        if (results.celu.changePercent30d > 1.5) alzasText.push(`Madera local (Celulosa) +${results.celu.changePercent30d.toFixed(1)}%`);
        if (results.lumber.changePercent30d > 1.5) alzasText.push(`Madera internacional (Lumber) +${results.lumber.changePercent30d.toFixed(1)}%`);
        
        let note = '';
        if (alzasText.length > 0) {
            note = `El análisis de persistencia a 30 días revela presiones de costos alcistas concentradas en: ${alzasText.join(', ')}. `;
            
            // Analizar consistencia tendencial
            const highConsistency = [results.aluar, results.ternium, results.ypf, results.celu].filter(r => r.positiveDaysRatio > 55);
            if (highConsistency.length > 0) {
                note += `Esta tendencia posee una alta persistencia temporal (más del 55% de las ruedas diarias cerraron al alza en activos locales), lo que consolida un traslado inflacionario inminente a las listas de precios mayoristas. `;
            }
            
            // Recomendación comercial
            if (results.riesgoPuntaje >= 6.0) {
                note += `Recomendación: Alerta crítica. Se aconseja adelantar compras de stock de placas Egger/Faplac y aplicar un recargo preventivo de entre 5% y 8% en herrajes pesados y perfiles metálicos para resguardar el margen neto operativo.`;
            } else {
                note += `Recomendación: Monitorear de cerca. Se sugiere mantener los precios de lista estables pero suspender descuentos comerciales agresivos a plazo en rubros metalúrgicos.`;
            }
        } else {
            note = `El panorama maderero y metalúrgico a 30 días se presenta estable, sin tendencias de alzas significativas detectadas en los insumos cotizados en pesos. Los movimientos diarios representan volatilidad habitual del mercado financiero. No hay presiones críticas para ajustar las tarifas mostrador actuales.`;
        }
        results.panoramaNota = note;

        // Update in-memory cache
        cachedData = results;
        lastFetchTime = Date.now();

        return new Response(JSON.stringify({ success: true, data: results }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
};
