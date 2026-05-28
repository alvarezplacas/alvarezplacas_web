
import { directus, readItems } from './Backend/conexiones/directus.js';

async function checkData() {
    try {
        console.log("Fetching EGGER products...");
        const response = await directus.request(readItems('Productos', {
            filter: { marca: { nombre: { _eq: 'EGGER' } } },
            fields: ['nombre', 'modelo'],
            limit: 50
        }));
        
        const products = Array.isArray(response) ? response : (response as any).data || [];
        console.log("Total found:", products.length);
        
        const modeloCounts = {};
        products.forEach(p => {
            const m = p.modelo || 'EMPTY';
            modeloCounts[m] = (modeloCounts[m] || 0) + 1;
            if (m !== 'EMPTY' && m.length > 5) {
                console.log(`Potential dirty model: "${m}" in product "${p.nombre}"`);
            }
        });
        
        console.log("Model counts:", JSON.stringify(modeloCounts, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

checkData();
