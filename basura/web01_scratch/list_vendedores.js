import { directus, readItems } from '../Backend/conexiones/directus.js';

async function listVendedores() {
    try {
        console.log("Listando todos los vendedores...");
        const all = await directus.request(readItems('vendedores', { 
            fields: ['*'],
            limit: 10 
        }));
        console.log(JSON.stringify(all, null, 2));
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

listVendedores();
