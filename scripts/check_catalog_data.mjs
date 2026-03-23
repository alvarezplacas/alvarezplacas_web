import { createDirectus, rest, readItems } from '@directus/sdk';
import 'dotenv/config';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const directus = createDirectus(DIRECTUS_URL).with(rest());

async function checkCatalog() {
    console.log('--- Checking Catalog Data in Directus ---');
    try {
        // 1. Check a few products
        const products = await directus.request(readItems('productos', {
            limit: 10,
            fields: ['id', 'status', 'nombre', 'sku', 'marca_id.nombre', 'categoria_id.nombre']
        }));

        console.log(`Found ${products.length} products in the sample.`);
        if (products.length > 0) {
            products.forEach(p => {
                console.log(`- [${p.status}] ${p.nombre} (SKU: ${p.sku}) | Marca: ${p.marca_id?.nombre || 'N/A'} | Cat: ${p.categoria_id?.nombre || 'N/A'}`);
            });
        }

        // 2. Check counts by status
        // Since aggregate might be complex, let's just fetch with different status filters
        const publishedCount = await directus.request(readItems('productos', {
            filter: { status: { _eq: 'published' } },
            fields: ['id'],
            limit: 1000
        }));
        console.log(`\nPublished products: ${publishedCount.length}`);

        const draftCount = await directus.request(readItems('productos', {
            filter: { status: { _eq: 'draft' } },
            fields: ['id'],
            limit: 1000
        }));
        console.log(`Draft products: ${draftCount.length}`);

        const archiveCount = await directus.request(readItems('productos', {
            filter: { status: { _eq: 'archived' } },
            fields: ['id'],
            limit: 1000
        }));
        console.log(`Archived products: ${archiveCount.length}`);

    } catch (e) {
        console.error('Error checking catalog:', e.message);
    }
}

checkCatalog();
