import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const TOKENS = [
    'a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE', // del directus.js
    'sv47_8QErnkx0-EBKFBnAoBw433CJs13'  // del register-client.ts
];

async function testTokens() {
    for (const token of TOKENS) {
        console.log(`\n--- Probando Token: ${token.substring(0, 5)}... ---`);
        try {
            const client = createDirectus(DIRECTUS_URL).with(staticToken(token)).with(rest());
            const res = await client.request(readItems('vendedores', { limit: 5 }));
            console.log(`ÉXITO: ${res.length} vendedores encontrados.`);
            console.log("Campos detectados:", Object.keys(res[0] || {}));
        } catch (e) {
            console.error(`ERROR: ${e.message}`);
        }
    }
}

testTokens();
