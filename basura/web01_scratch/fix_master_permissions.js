import { createDirectus, rest, authentication, readPermissions, createPermission, updatePermission } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const FRONTEND_ROLE_ID = '7a946998-c9df-42ed-aacc-817028a927f1';

const COLLECTIONS = [
    'materiales', 'pedidos', 'clientes', 'vendedores', 
    'marcas', 'categorias', 'espesores', 'sucursales', 
    'site_settings', 'mensajes_contacto'
];

async function fixAllPermissions() {
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Admin Login OK.");

        // Obtenemos todos los permisos actuales para NO duplicar
        const currentPerms = await client.request(readPermissions({
            limit: -1
        }));

        console.log(`Analizando ${currentPerms.length} permisos existentes...`);

        for (const collection of COLLECTIONS) {
            // Buscamos si existe permiso de lectura para el Rol Frontend
            const existing = currentPerms.find(p => p.collection === collection && p.action === 'read' && p.role === FRONTEND_ROLE_ID);

            if (existing) {
                console.log(`[${collection}] - Actualizando permiso existente...`);
                await client.request(updatePermission(existing.id, {
                    fields: ['*'],
                    permissions: {} // Sin restricciones de filtrado
                }));
            } else {
                console.log(`[${collection}] - Creando nuevo permiso de lectura...`);
                await client.request(createPermission({
                    role: FRONTEND_ROLE_ID,
                    collection: collection,
                    action: 'read',
                    fields: ['*'],
                    permissions: {}
                }));
            }
        }

        console.log("\n--- ✨ PERMISOS DE MONITOREO TOTAL CONCEDIDOS ---");
    } catch (e) {
        console.error("❌ Error:", e.message);
        if (e.errors) console.log(JSON.stringify(e.errors, null, 2));
    }
}

fixAllPermissions();
