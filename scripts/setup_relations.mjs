const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function setupRelations() {
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.access_token;
        
        async function createRel(collection, field, related_collection) {
            console.log(`Creando relación: ${collection}.${field} -> ${related_collection}`);
            const res = await fetch(`${DIRECTUS_URL}/relations`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    collection: collection,
                    field: field,
                    related_collection: related_collection,
                    schema: {},
                    meta: {
                        one_field: null,
                        junction_field: null,
                        sort_field: null,
                        one_deselect_action: 'nullify'
                    }
                })
            });
            const body = await res.json();
            if (body.errors) console.log(`  Error: ${JSON.stringify(body.errors[0].message)}`);
            else console.log(`  ✅ Relación creada.`);
        }

        await createRel('productos', 'marca_id', 'Marca');
        await createRel('productos', 'linea_id', 'lineas');
        await createRel('productos', 'categoria_id', 'categorias');
        await createRel('lineas', 'marca_id', 'Marca');

    } catch (e) {
        console.error("Error:", e.message);
    }
}

setupRelations();
