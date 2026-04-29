import { createDirectus, rest, login, createPermission } from '@directus/sdk';

/**
 * EMERGENCY PERMISSIONS FIX - DIRECTUS 11
 * Utiliza login de administrador para saltar restricciones de tokens limitados.
 */

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL).with(rest());

async function fix() {
    console.log("--- 🔱 Iniciando Fix Maestro de Permisos ---");
    
    try {
        console.log("🔑 Autenticando como Administrador...");
        await client.request(login(ADMIN_EMAIL, ADMIN_PASSWORD));
        console.log("✅ Autenticación exitosa.");

        const collections = ['materiales', 'marcas', 'categorias', 'espesores', 'sucursales', 'site_settings'];
        
        for (const coll of collections) {
            try {
                // Intentamos crear el permiso para el rol Public (role: null)
                await client.request(createPermission({
                    collection: coll,
                    action: 'read',
                    role: null,
                    fields: ['*'],
                    permissions: {}
                }));
                console.log(`✅ Permiso público (read) creado para: ${coll}`);
            } catch (e) {
                console.warn(`⚠️ Nota en ${coll}:`, e.errors?.[0]?.message || e.message);
            }
        }

        console.log("--- ✨ Permisos Alineados ---");
    } catch (e) {
        console.error("❌ Error Maestro:", e.errors?.[0]?.message || e.message);
    }
}

fix();
