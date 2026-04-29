import { createDirectus, rest, staticToken, readMe } from '@directus/sdk';

const directusUrl = 'https://admin.alvarezplacas.com.ar';
const staticTokenValue = 'a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE';

const client = createDirectus(directusUrl)
    .with(staticToken(staticTokenValue))
    .with(rest());

async function checkAuth() {
    try {
        const me = await client.request(readMe());
        console.log('--- AUTH SUCCESS ---');
        console.log(`User: ${me.email}`);
        console.log(`Role: ${me.role}`);
    } catch (e) {
        console.error('❌ AUTH FAILURE:', e.message || e);
    }
}

checkAuth();
