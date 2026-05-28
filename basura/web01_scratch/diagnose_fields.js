
import { directus, readItems } from '../Backend/conexiones/directus.js';

async function diagnose() {
    try {
        console.log("Fetching EGGER products raw...");
        const response = await directus.request(readItems('Productos', {
            filter: { marca: { nombre: { _eq: 'EGGER' } } },
            fields: ['*'],
            limit: 5
        }));
        
        const products = Array.isArray(response) ? response : (response.data || []);
        if (products.length > 0) {
            console.log("Keys found in first product:", Object.keys(products[0]).join(', '));
            console.log("Full data of first product:", JSON.stringify(products[0], null, 2));
        } else {
            console.log("No products found for EGGER.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

diagnose();
