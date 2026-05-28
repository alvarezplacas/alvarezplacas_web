import { directus, readItems } from '../Backend/conexiones/directus.js';

async function listAll() {
    try {
        console.log("--- Vendedores ---");
        const sellers = await directus.request(readItems('vendedores', { limit: 10 }));
        sellers.forEach(s => console.log(`- ${s.email} (${s.name})`));

        console.log("\n--- Clientes ---");
        const clients = await directus.request(readItems('clientes', { limit: 10 }));
        if (clients.length === 0) console.log("No hay clientes registrados.");
        clients.forEach(c => console.log(`- ${c.email} (${c.nombre})`));

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

listAll();
