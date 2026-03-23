const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function addImageField() {
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.access_token;
        
        console.log("Creando campo 'imagen' en 'productos'...");
        const res = await fetch(`${DIRECTUS_URL}/fields/productos`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                field: 'imagen',
                type: 'uuid',
                meta: {
                    interface: 'file',
                    display: 'file',
                    readonly: false,
                    hidden: false,
                    width: 'full',
                    note: 'Si se deja vacío, se usará la ruta por convención /Placas/...'
                },
                schema: {
                    foreign_key_column: 'id',
                    foreign_key_table: 'directus_files'
                }
            })
        });
        const body = await res.json();
        if (body.errors) console.log(`  Error: ${JSON.stringify(body.errors[0].message)}`);
        else console.log(`  ✅ Campo 'imagen' creado con éxito.`);

    } catch (e) {
        console.error("Error:", e.message);
    }
}

addImageField();
