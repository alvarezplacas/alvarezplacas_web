import { createDirectus, rest, authentication, readPermissions } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const FRONTEND_POLICY_ID = 'b87f2e1c-e77b-4ddf-8bd9-e74b443b7c01';

async function verifyDirectusLive() {
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Login Admin en Directus LIVE exitoso.");

        const perms = await client.request(readPermissions({
            filter: { policy: { _eq: FRONTEND_POLICY_ID } }
        }));

        console.log(`\n--- Permisos actuales en Directus LIVE para Política Frontend ---`);
        perms.forEach(p => {
            console.log(`- [${p.collection}] Action: ${p.action} - Fields: ${JSON.stringify(p.fields)}`);
        });

        // Verificamos si 'pedidos' está ahí (lo cual antes NO estaba)
        const hasPedidos = perms.some(p => p.collection === 'pedidos' && p.action === 'read');
        console.log(`\n¿Tiene permiso de lectura en 'pedidos'?: ${hasPedidos ? 'SÍ ✅' : 'NO ❌'}`);

    } catch (e) {
        console.error("❌ Error de verificación:", e.message);
    }
}

verifyDirectusLive();
