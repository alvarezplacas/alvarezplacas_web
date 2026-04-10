import { createDirectus, rest, staticToken, createPermission } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const TOKEN = 'alvarez-api-token-v16-2026';

const client = createDirectus(DIRECTUS_URL)
    .with(staticToken(TOKEN))
    .with(rest());

const collections = [
    'materiales',
    'marcas',
    'categorias',
    'espesores',
    'sucursales',
    'site_settings'
];

async function fixPermissions() {
    console.log("--- 🔓 Otorgando Accesos Públicos (Read) ---");
    
    for (const collection of collections) {
        try {
            await client.request(createPermission({
                collection: collection,
                action: 'read',
                role: null, // Public
                fields: ['*'],
                permissions: {}
            }));
            console.log(`✅ Permisos de lectura otorgados para: ${collection}`);
        } catch (e) {
            const msg = e.errors?.[0]?.message || e.message || "";
            if (msg.includes('already exists') || msg.includes('unique constraint')) {
                console.log(`ℹ️ Los permisos para ${collection} ya existen.`);
            } else {
                console.warn(`⚠️ Error en ${collection}:`, msg);
            }
        }
    }

    console.log("--- ✨ Permisos Configurados ---");
}

fixPermissions();
