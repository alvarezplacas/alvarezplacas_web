const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function repairPublicPermissions() {
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.access_token;
        
        // 1. Encontrar el ID del rol Public
        const rolesRes = await fetch(`${DIRECTUS_URL}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const rolesData = await rolesRes.json();
        const publicRole = rolesData.data.find(r => r.name === 'Public');
        if (!publicRole) {
            console.error("No se encontró el rol Público");
            return;
        }
        const publicId = publicRole.id;
        console.log(`Reparando permisos para el rol Público (ID: ${publicId})...`);

        const collections = ['Marca', 'lineas', 'categorias', 'productos', 'directus_files', 'site_settings'];
        
        // Primero borramos los permisos existentes (opcional, pero asegura limpieza)
        // No, mejor solo creamos o actualizamos.
        
        for (const col of collections) {
            console.log(`  Configurando ${col}...`);
            const res = await fetch(`${DIRECTUS_URL}/permissions`, {
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
            const body = await res.json();
            if (body.errors) {
                console.log(`    Nota: ${body.errors[0].message}`);
            } else {
                console.log(`    ✅ Éxito.`);
            }
        }

        console.log("🚀 Permisos reparados. Verifica ahora la URL de la imagen.");

    } catch (e) {
        console.error("Error:", e.message);
    }
}

repairPublicPermissions();
