import { directus, readItems } from '../Backend/conexiones/directus.js';
import { aggregate } from '@directus/sdk';

async function testPermissions() {
    console.log("--- 🕵️ Verificando Permisos del Token Frontend ---");
    
    const collections = ['materiales', 'pedidos', 'clientes', 'vendedores'];
    
    for (const col of collections) {
        try {
            const res = await directus.request(aggregate(col, { aggregate: { count: '*' } }));
            console.log(`✅ [${col}] - Count: ${res[0]?.count}`);
        } catch (e) {
            console.error(`❌ [${col}] - Acceso Denegado o Error:`, e.message);
        }
    }
}

testPermissions();
