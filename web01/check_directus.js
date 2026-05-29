import { createDirectus, rest, readItems } from '@directus/sdk';

const directus = createDirectus('https://admin.alvarezplacas.com.ar').with(rest());

async function check() {
    try {
        console.log('Fetching Productos...');
        const products = await directus.request(readItems('Productos', { limit: 5 }));
        console.log('Success:', products.length, 'products found.');
    } catch (e) {
        console.error('Error fetching Productos:', e);
    }
}

check();
