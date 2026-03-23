import { createDirectus, rest, createPermission, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function forcePermissions() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("Sesión iniciada. Creando permisos públicos...");

        const collections = ['Marca', 'lineas', 'categorias', 'productos', 'directus_files', 'site_settings'];
        
        for (const col of collections) {
            try {
                await client.request(createPermission({
                    role: null, // Public
                    collection: col,
                    action: 'read',
                    fields: ['*']
                }));
                console.log(`  ✅ Permiso creado para ${col}`);
            } catch (e) {
                console.log(`  ℹ️ ${col}: ${e.message}`);
            }
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

forcePermissions();
