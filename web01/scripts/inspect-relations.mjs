import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const DIRECTUS_URL = 'http://alvarezplacas_directus_v16:8055';
const STATIC_TOKEN = 'alvarez-api-token-v16-2026';

const client = createDirectus(DIRECTUS_URL).with(staticToken(STATIC_TOKEN)).with(rest());

async function run() {
    console.log("--- DIANÓSTICO DE RELACIONES CLIENTE - VENDEDOR - PEDIDOS ---");
    
    // 1. Obtener vendedores
    console.log("\n--- VENDEDORES ---");
    const vendedores = await client.request(readItems('vendedores', {
        fields: ['id', 'name', 'email']
    }));
    console.table(vendedores);

    // 2. Obtener clientes
    console.log("\n--- CLIENTES ---");
    const clientes = await client.request(readItems('clientes', {
        fields: ['id', 'name', 'email', 'client_number', 'vendedor_id']
    }));
    console.table(clientes.map(c => ({
        id: c.id,
        nombre: c.name,
        email: c.email,
        numero: c.client_number,
        vendedor_id: c.vendedor_id ? (typeof c.vendedor_id === 'object' ? c.vendedor_id.id : c.vendedor_id) : 'NINGUNO'
    })));

    // 3. Obtener pedidos
    console.log("\n--- PEDIDOS / PRESUPUESTOS ---");
    const pedidos = await client.request(readItems('pedidos', {
        fields: ['id', 'cliente_id', 'vendedor_id', 'status', 'total_m2', 'fecha_pedido']
    }));
    console.table(pedidos.map(p => ({
        id: p.id,
        cliente_id: p.cliente_id ? (typeof p.cliente_id === 'object' ? p.cliente_id.id : p.cliente_id) : 'NINGUNO',
        vendedor_id: p.vendedor_id ? (typeof p.vendedor_id === 'object' ? p.vendedor_id.id : p.vendedor_id) : 'NINGUNO',
        status: p.status,
        m2: p.total_m2,
        fecha: p.fecha_pedido
    })));
}

run().catch(console.error);
