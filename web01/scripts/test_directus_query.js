import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';

const finalUrl = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'alvarez-api-token-v16-2026';

const directus = createDirectus(finalUrl)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

async function runTest(sellerId, isJefe) {
    console.log(`\n--- TESTING FOR sellerId: ${sellerId} (isJefe: ${isJefe}) ---`);
    const filter = isJefe ? {} : { vendedor_id: { _eq: sellerId } };

    try {
        const pedidos = await directus.request(readItems('pedidos', {
            filter,
            sort: ['-fecha_pedido'],
            limit: 50,
            fields: [
                'id', 
                'status', 
                'total_m2', 
                'fecha_pedido', 
                'datos_optimizacion', 
                { cliente_id: ['name', 'nombre_empresa'] },
                { vendedor_id: ['name'] }
            ]
        }));
        
        console.log(`Successfully fetched ${pedidos.length} orders!`);
        for (const p of pedidos) {
            const cliente = p.cliente_id?.nombre_empresa || p.cliente_id?.name || 'Cliente Particular';
            const vendedor = p.vendedor_id?.name || 'Sin Asignar';
            console.log(`- Order #${p.id}: Cliente: ${cliente}, M2: ${p.total_m2}, Vendedor: ${vendedor}, Status: ${p.status}`);
        }
    } catch (e) {
        console.error("Directus Query Failed:", e.message || e);
    }
}

async function main() {
    // 1. Facundo (isJefe = true, sellerId = 2) should see all orders (including Ariel's and others)
    await runTest('2', true);

    // 2. Ariel (isJefe = false, sellerId = 1) should only see Ariel's orders (all 3)
    await runTest('1', false);

    // 3. Braian (isJefe = false, sellerId = 3) should see 0 orders
    await runTest('3', false);
}

main();
