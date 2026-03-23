import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function checkSpecific() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        const item = await client.request(readItems('productos', {
            filter: { sku: { _eq: 'TAB-BLA-EGG-18-AGL' } },
            fields: ['sku', 'nombre', 'marca_id.nombre', 'categoria_id.nombre']
        }));
        
        console.log(JSON.stringify(item, null, 2));
        
        const brands = await client.request(readItems('Marca'));
        console.log("Existing Brands:", brands.map(b => b.nombre));

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkSpecific();
