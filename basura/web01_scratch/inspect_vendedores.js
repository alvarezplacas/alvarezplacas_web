import { directus, readItems } from '../Backend/conexiones/directus.js';

async function run() {
    try {
        const list = await directus.request(readItems('vendedores', { limit: 1 }));
        if (list && list.length > 0) {
            console.log('FIELDS:', Object.keys(list[0]));
            console.log('RECORD:', list[0]);
        } else {
            console.log('No sellers found.');
        }
    } catch(e) {
        console.error('Error inspect:', e.message);
    }
}
run();
