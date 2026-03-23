import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function inspectRaw() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        const products = await client.request(readItems('productos', { 
            limit: 10,
            fields: ['sku', 'nombre', 'marca_id', 'linea_id', 'categoria_id']
        }));
        
        console.log("--- Raw IDs in 'productos' ---");
        products.forEach(p => {
            console.log(`SKU: ${p.sku} | MarcaID: ${p.marca_id} | LineaID: ${p.linea_id} | CatID: ${p.categoria_id}`);
        });

    } catch (e) {
        console.error("Error:", e.message);
    }
}

inspectRaw();
