import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, cookies }) => {
    // 1. Verify Authentication
    const sellerSession = cookies.get('seller_session')?.value;
    if (!sellerSession) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const results = {
            faplac: { name: 'Empresas Copec (Faplac)', symbol: 'COPEC.SN', price: 0, change: 0, changePercent: 0 },
            dexco: { name: 'Dexco S.A. (MDF Brasil)', symbol: 'DXCO3.SA', price: 0, change: 0, changePercent: 0 },
            suzano: { name: 'Suzano (Celulosa)', symbol: 'SUZB3.SA', price: 0, change: 0, changePercent: 0 },
            lumber: { name: 'Futuros Madera (Lumber)', symbol: 'LBS=F', price: 0, change: 0, changePercent: 0 },
            oil: { name: 'Petróleo Brent (Químicos/Flete)', symbol: 'BZ=F', price: 0, change: 0, changePercent: 0 },
            eurusd: { name: 'Euro / Dólar (Importación)', symbol: 'EURUSD=X', price: 0, change: 0, changePercent: 0 },
            dolar: { blue: 0, mep: 0, ccl: 0 }
        };

        // Helper function to fetch Yahoo Finance Data safely
        const fetchYahoo = async (symbol) => {
            try {
                // We use Yahoo Finance API v8 chart endpoint
                const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                const data = await res.json();
                
                if (data.chart && data.chart.result && data.chart.result.length > 0) {
                    const result = data.chart.result[0];
                    const meta = result.meta;
                    const price = meta.regularMarketPrice;
                    const prevClose = meta.previousClose;
                    const change = price - prevClose;
                    const changePercent = (change / prevClose) * 100;

                    return { price, change, changePercent };
                }
            } catch (e) {
                console.error(`Error fetching ${symbol}:`, e);
            }
            return { price: 0, change: 0, changePercent: 0 };
        };

        // Fetch all symbols in parallel
        const symbols = ['faplac', 'dexco', 'suzano', 'lumber', 'oil', 'eurusd'];
        const promises = symbols.map(async (key) => {
            const data = await fetchYahoo(results[key].symbol);
            results[key].price = data.price;
            results[key].change = data.change;
            results[key].changePercent = data.changePercent;
        });

        // Add DolarAPI fetching
        promises.push(
            fetch('https://dolarapi.com/v1/dolares')
            .then(r => r.json())
            .then(data => {
                if(Array.isArray(data)) {
                    data.forEach(d => {
                        if(d.casa === 'blue') results.dolar.blue = d.venta;
                        if(d.casa === 'mep') results.dolar.mep = d.venta;
                        if(d.casa === 'contadoconliqui') results.dolar.ccl = d.venta;
                    });
                }
            })
            .catch(e => console.error("Error DolarAPI:", e))
        );

        await Promise.all(promises);

        return new Response(JSON.stringify({ success: true, data: results }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
};
