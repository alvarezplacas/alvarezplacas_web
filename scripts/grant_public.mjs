const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function grantPublicPermissions() {
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.access_token;
        
        async function setPerm(collection) {
            console.log(`Otorgando permisos lectura pública a: ${collection}`);
            const res = await fetch(`${DIRECTUS_URL}/permissions`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: null, // Public role is null in internal API frequently or has a specific ID. Usually 'null' works for Public.
                    collection: collection,
                    action: 'read',
                    permissions: {},
                    validation: null,
                    fields: ['*']
                })
            });
            const body = await res.json();
            if (body.errors) {
                // Si ya existe, intentamos UPDATE
                console.log(`  Ya existe o error: ${body.errors[0].message}. Intentando actualizar...`);
            } else {
                console.log(`  ✅ Permiso creado.`);
            }
        }

        // En Directus la API de permisos a veces requiere el ID del rol Public.
        // Vamos a buscar el ID del rol Public primero.
        const rolesRes = await fetch(`${DIRECTUS_URL}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const rolesData = await rolesRes.json();
        const publicRole = rolesData.data.find(r => r.name === 'Public');
        const publicId = publicRole ? publicRole.id : null;

        console.log(`ID Rol Público: ${publicId}`);

        const collections = ['Marca', 'lineas', 'categorias', 'productos', 'directus_files', 'site_settings'];
        for (const col of collections) {
            await fetch(`${DIRECTUS_URL}/permissions`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: publicId,
                    collection: col,
                    action: 'read',
                    permissions: {},
                    fields: ['*']
                })
            });
            console.log(`  ✅ Permiso enviado para ${col}`);
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

grantPublicPermissions();
