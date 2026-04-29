import { createDirectus, rest, staticToken, readCollections } from '@directus/sdk';

const directusUrl = 'https://admin.alvarezplacas.com.ar';
const staticTokenValue = 'a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE';

const client = createDirectus(directusUrl)
    .with(staticToken(staticTokenValue))
    .with(rest());

async function inspectSchema() {
    try {
        const collections = await client.request(readCollections());
        console.log('--- ACTUAL COLLECTIONS ---');
        collections.forEach(c => {
            if (!c.collection.startsWith('directus_')) {
                console.log(`- ${c.collection}`);
            }
        });
    } catch (e) {
        console.error('❌ Error inspecting schema:', e);
    }
}

inspectSchema();
