import { createDirectus, rest, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const directus = createDirectus(DIRECTUS_URL).with(rest());

async function verify() {
    console.log('--- Verifying Directus Collections ---');
    try {
        // Test 'vendedores'
        const sellers = await directus.request(readItems('vendedores', { limit: 1 }));
        console.log('✅ Collection "vendedores" is accessible. Found:', sellers.length);

        // Test 'clientes'
        const clients = await directus.request(readItems('clientes', { limit: 1 }));
        console.log('✅ Collection "clientes" is accessible. Found:', clients.length);

    } catch (e) {
        console.error('❌ Error verifying collections:', e.message);
        console.log('NOTE: This might fail if the schema script hasn\'t been run against the production server yet.');
    }
}

verify();
