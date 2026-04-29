// scripts/fix_public_permissions_es.mjs
const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const PUBLIC_POLICY_ID = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17'; // Politica Pública en v11

async function fixPermissions() {
    console.log("--- 🛠️ Habilitando Permisos Públicos (v11 + Policy) ---");

    const loginResp = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const { data: { access_token: token } } = await loginResp.json();
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const collections = ['materiales', 'marcas', 'categorias', 'espesores', 'directus_files', 'site_settings'];

    for (const coll of collections) {
        console.log(`Configurando READ para: ${coll}...`);
        
        // 1. Verificar si ya existe
        const check = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=${coll}&filter[policy][_eq]=${PUBLIC_POLICY_ID}&filter[action][_eq]=read`, { headers });
        const { data: existing } = await check.json();

        if (existing && existing.length > 0) {
            console.log(`  ✅ ${coll} ya tiene permiso.`);
            continue;
        }

        // 2. Crear permiso vinculado a la Política Pública
        const resp = await fetch(`${DIRECTUS_URL}/permissions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                policy: PUBLIC_POLICY_ID,
                collection: coll,
                action: 'read',
                permissions: {},
                validation: {},
                fields: ['*']
            })
        });
        
        if (resp.ok) {
            console.log(`  🚀 ${coll} configurado con éxito.`);
        } else {
            console.warn(`  ⚠️ Error en ${coll}:`, await resp.text());
        }
    }

    console.log("--- ✅ Permisos v11 Listos ---");
}

fixPermissions().catch(console.error);


