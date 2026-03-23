const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function grantPolicyPermissions() {
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.access_token;
        
        const PUBLIC_POLICY = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';
        const collections = ['directus_files', 'Marca', 'lineas', 'categorias', 'site_settings'];

        console.log(`Otorgando permisos via Policy: ${PUBLIC_POLICY}`);

        for (const col of collections) {
            const res = await fetch(`${DIRECTUS_URL}/permissions`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    policy: PUBLIC_POLICY,
                    collection: col,
                    action: 'read',
                    permissions: {},
                    fields: ['*']
                })
            });
            const body = await res.json();
            if (body.errors) {
                console.log(`  - ${col}: ${body.errors[0].message}`);
            } else {
                console.log(`  - ${col}: ✅ Creado`);
            }
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

grantPolicyPermissions();
