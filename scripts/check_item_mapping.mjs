import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function checkItem() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        const items = await client.request(readItems('productos', {
            filter: { sku: { _eq: 'TAB-RAC-FAP-18-AGL' } },
            fields: ['sku', 'nombre', 'marca_id.nombre', 'linea_id.nombre', 'categoria_id.nombre']
        }));
        
        console.log(JSON.stringify(items, null, 2));

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkItem();
