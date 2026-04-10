// fix_public_permissions.mjs
const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function fixPermissions() {
    console.log("--- 🛠️ Fixing Public Permissions for Directus v16 ---");

    // 1. Login to get Admin Token
    const loginResp = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    const loginData = await loginResp.json();
    if (!loginResp.ok) {
        console.error("❌ Login Failed:", loginData);
        return;
    }
    const token = loginData.data.access_token;
    const headers = { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
    };

    // 2. Define collections that need Public READ access (Spanish Schema v16)
    const publicCollections = [
        'materiales', 
        'marcas', 
        'categorias', 
        'espesores',
        'directus_files'
    ];

    const PUBLIC_POLICY_ID = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';

    console.log(`Checking and setting Read permissions for Public Policy (${PUBLIC_POLICY_ID})...`);

    for (const collection of publicCollections) {
        console.log(`- Updating: ${collection}`);
        try {
            // Find if permission already exists for this policy
            const checkResp = await fetch(`${DIRECTUS_URL}/permissions?filter[policy][_eq]=${PUBLIC_POLICY_ID}&filter[collection][_eq]=${collection}&filter[action][_eq]=read`, { headers });
            const checkData = await checkResp.json();

            if (checkData.data && checkData.data.length > 0) {
                console.log(`  ℹ️ Permission already exists (ID: ${checkData.data[0].id}). Updating fields...`);
                await fetch(`${DIRECTUS_URL}/permissions/${checkData.data[0].id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ fields: ['*'] })
                });
            } else {
                console.log("  ➕ Creating new Read permission...");
                const createResp = await fetch(`${DIRECTUS_URL}/permissions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        policy: PUBLIC_POLICY_ID,
                        collection: collection,
                        action: 'read',
                        permissions: {},
                        validation: {},
                        fields: ['*']
                    })
                });
                if (!createResp.ok) {
                    const errorData = await createResp.json();
                    console.error(`  ❌ Failed for ${collection}:`, errorData);
                }
            }
        } catch (err) {
            console.error(`  ❌ Error processing ${collection}:`, err.message);
        }
    }

    console.log("--- ✅ Done. Verifying Catalog... ---");
}

fixPermissions();
