// Native fetch used (Node 18+)

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function configureDirectus() {
    console.log("--- Configuring Directus Roles & Permissions ---");
    
    // 1. Login
    const loginResp = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    const loginData = await loginResp.json();
    if (!loginResp.ok) {
        console.error("Login Failed:", loginData);
        return;
    }
    const token = loginData.data.access_token;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Get Roles
    const rolesResp = await fetch(`${DIRECTUS_URL}/roles`, { headers });
    const rolesData = await rolesResp.json();
    console.log("Current Roles:", rolesData.data.map(r => r.name));

    // 3. Ensure 'Vendedor' role exists
    let vendedorRole = rolesData.data.find(r => r.name === 'Vendedor');
    if (!vendedorRole) {
        console.log("Creating 'Vendedor' role...");
        const createRoleResp = await fetch(`${DIRECTUS_URL}/roles`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Vendedor', icon: 'badge', description: 'Internal Sales Team' })
        });
        const createRoleData = await createRoleResp.json();
        vendedorRole = createRoleData.data;
    }
    console.log("Vendedor Role ID:", vendedorRole.id);

    // 4. Configure Permissions for 'Vendedor'
    const collections = [
        'materials', 'material_brands', 'material_categories', 'material_thicknesses',
        'orders', 'budget_items', 'budgets', 'branches', 
        'loyalty_points_ledger', 'financial_transactions', 'order_status_history', 'users'
    ];

    console.log("Setting Permissions for Vendedor...");
    for (const collection of collections) {
        const perms = ['create', 'read', 'update', 'delete'];
        for (const action of perms) {
            await fetch(`${DIRECTUS_URL}/permissions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    role: vendedorRole.id,
                    collection: collection,
                    action: action,
                    permissions: {},
                    validation: {},
                    fields: ['*']
                })
            });
        }
    }

    // 5. Configure Public Permissions (Read Only for catalog)
    const publicRolesResp = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Public`, { headers });
    const publicRolesData = await publicRolesResp.json();
    // Directus uses a special 'null' role or a public role depending on version. 
    // In Directus 11, we usually set permissions for the NULL role for public access.
    
    const publicCollections = ['materials', 'material_brands', 'material_categories', 'material_thicknesses'];
    console.log("Setting Public Permissions...");
    for (const collection of publicCollections) {
        await fetch(`${DIRECTUS_URL}/permissions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                role: null, // Public
                collection: collection,
                action: 'read',
                permissions: {},
                validation: {},
                fields: ['*']
            })
        });
    }

    console.log("--- Done ---");
}

configureDirectus();
