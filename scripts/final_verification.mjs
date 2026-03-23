import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function finalCount() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        const products = await client.request(readItems('productos', { 
            limit: -1,
            fields: ['sku', 'marca_id.nombre', 'linea_id.nombre']
        }));
        console.log(`--- Total en Directus: ${products.length} ---`);
        
        const faplac = products.filter(p => p.marca_id?.nombre === 'FAPLAC');
        console.log(`- FAPLAC: ${faplac.length}`);
        
        const egger = products.filter(p => p.marca_id?.nombre === 'Egger');
        console.log(`- Egger: ${egger.length}`);

        const maderasClasicas = products.filter(p => p.linea_id?.nombre === 'Maderas Clasicas');
        console.log(`- Maderas Clasicas: ${maderasClasicas.length}`);

    } catch (e) {
        console.error("Error:", e.message);
    }
}

finalCount();
