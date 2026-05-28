import { createDirectus, rest, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function verifyLoginLive() {
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        console.log("Probando login administrativo en:", DIRECTUS_URL);
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ LOGIN EXITOSO EN PRODUCCIÓN.");
        console.log("Esto demuestra que el password_hash en Directus ha sido corregido.");
    } catch (e) {
        console.error("❌ LOGIN FALLIDO EN PRODUCCIÓN:", e.message);
    }
}

verifyLoginLive();
