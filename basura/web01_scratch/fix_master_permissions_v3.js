import { createDirectus, rest, authentication, readPermissions, createPermission, updatePermission } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const FRONTEND_POLICY_ID = 'b87f2e1c-e77b-4ddf-8bd9-e74b443b7c01'; // From list_policies name "Frontend"

const COLLECTIONS = [
    'materiales', 'pedidos', 'clientes', 'vendedores', 
    'marcas', 'categorias', 'espesores', 'sucursales', 
    'site_settings', 'mensajes_contacto'
];

async function fixAllPermissionsV3() {
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Admin Login OK.");

        const currentPerms = await client.request(readPermissions({
            filter: { policy: { _eq: FRONTEND_POLICY_ID } },
            limit: -1
        }));

        console.log(`Analizando ${currentPerms.length} permisos en la política Frontend...`);

        for (const collection of COLLECTIONS) {
            const existing = currentPerms.find(p => p.collection === collection && p.action === 'read');

            if (existing) {
                console.log(`[${collection}] - Actualizando permiso...`);
                await client.request(updatePermission(existing.id, {
                    fields: ['*'],
                    permissions: {}
                }));
            } else {
                console.log(`[${collection}] - Creando nuevo permiso...`);
                await client.request(createPermission({
                    policy: FRONTEND_POLICY_ID,
                    collection: collection,
                    action: 'read',
                    fields: ['*'],
                    permissions: {}
                }));
            }
        }

        console.log("\n--- ✨ MONITOREO TOTAL HABILITADO EN POLÍTICA FRONTEND ---");
    } catch (e) {
        console.error("❌ Error:", e.message);
        if (e.errors) console.log(JSON.stringify(e.errors, null, 2));
    }
}

fixAllPermissionsV3();
