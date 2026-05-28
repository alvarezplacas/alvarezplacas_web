import { createDirectus, rest, authentication, updateItem, readItems, createPermission, updatePermission, readPermissions } from '@directus/sdk';
import bcrypt from 'bcryptjs';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const FRONTEND_ROLE_ID = '7a946998-c9df-42ed-aacc-817028a927f1';

const COLLECTIONS_TO_GRANT = [
    'pedidos', 'clientes', 'vendedores', 'site_settings'
];

async function applyFixAPI() {
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Login Admin en Directus Exitoso.");

        // 1. Permisos
        console.log("\n--- Asegurando Permisos via API ---");
        const currentPermissions = await client.request(readPermissions({
            filter: { role: { _eq: FRONTEND_ROLE_ID } }
        }));

        for (const coll of COLLECTIONS_TO_GRANT) {
            const existing = currentPermissions.find(p => p.collection === coll && p.action === 'read');
            
            if (!existing) {
                console.log(`Creando permiso de lectura para '${coll}'...`);
                await client.request(createPermission({
                    collection: coll,
                    action: 'read',
                    fields: ['*'],
                    permissions: {},
                    role: FRONTEND_ROLE_ID
                }));
                console.log(`✅ Permiso creado.`);
            } else {
                console.log(`Actualizando permiso existente para '${coll}' para asegurar campos '*'...`);
                await client.request(updatePermission(existing.id, {
                    fields: ['*']
                }));
                console.log(`✅ Permiso actualizado.`);
            }
        }

        // 2. Hash de contraseña en 'vendedores'
        console.log("\n--- Asegurando Hash de Administrador en 'vendedores' ---");
        const sellers = await client.request(readItems('vendedores', {
            filter: { email: { _eq: ADMIN_EMAIL } }
        }));

        if (sellers.length > 0) {
            const adminUser = sellers[0];
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);

            await client.request(updateItem('vendedores', adminUser.id, {
                password_hash: hash,
                name: 'Administrador Javier'
            }));
            console.log(`✅ Usuario vendedor '${ADMIN_EMAIL}' actualizado con hash y nombre.`);
        } else {
            console.log(`❌ No se encontró el registro de '${ADMIN_EMAIL}' en la colección 'vendedores'.`);
        }

        console.log("\n--- ✨ FIX APLICADO CORRECTAMENTE ---");

    } catch (e) {
        console.error("❌ Error API:", e.message);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

applyFixAPI();
