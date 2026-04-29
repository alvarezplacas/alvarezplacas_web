// scripts/create_catalog_schema_es.mjs
const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function createSchema() {
    console.log("--- 🏗️ Creando Esquema del Catálogo en Español ---");

    // 1. Login
    const loginResp = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const loginData = await loginResp.json();
    if (!loginResp.ok) return console.error("Login Failed:", loginData);
    const token = loginData.data.access_token;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const collections = [
        { name: 'marcas', icon: 'sell', fields: [{ name: 'nombre', type: 'string' }] },
        { name: 'categorias', icon: 'category', fields: [{ name: 'nombre', type: 'string' }, { name: 'slug', type: 'string' }] },
        { name: 'espesores', icon: 'straighten', fields: [{ name: 'valor', type: 'float' }] },
        { 
            name: 'materiales', 
            icon: 'inventory_2', 
            fields: [
                { name: 'nombre', type: 'string' },
                { name: 'id_marca', type: 'integer', is_relation: true, related: 'marcas' },
                { name: 'id_categoria', type: 'integer', is_relation: true, related: 'categorias' },
                { name: 'id_espesor', type: 'integer', is_relation: true, related: 'espesores' },
                { name: 'precio_m2', type: 'float' },
                { name: 'stock', type: 'integer' },
                { name: 'activo', type: 'boolean' },
                { name: 'imagen', type: 'uuid' }
            ] 
        }
    ];

    for (const coll of collections) {
        console.log(`Creando colección: ${coll.name}...`);
        
        // Create Collection
        const collResp = await fetch(`${DIRECTUS_URL}/collections`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                collection: coll.name,
                meta: { icon: coll.icon, display_template: '{{nombre}}' },
                schema: { name: coll.name }
            })
        });
        const collData = await collResp.json();
        if (!collResp.ok && collData.errors?.[0]?.extensions?.code !== 'RECORD_NOT_UNIQUE') {
            console.error(`Error al crear ${coll.name}:`, collData);
            continue;
        }

        // Create Fields
        for (const field of coll.fields) {
            console.log(`  Creando campo: ${field.name}...`);
            const fieldResp = await fetch(`${DIRECTUS_URL}/fields/${coll.name}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    field: field.name,
                    type: field.type,
                    schema: field.is_relation ? {
                        name: field.name,
                        foreign_key_column: 'id',
                        foreign_key_table: field.related
                    } : {}
                })
            });
            const fieldData = await fieldResp.json();
            if (!fieldResp.ok) console.warn(`  Nota: El campo ${field.name} ya existe o falló:`, fieldData.errors?.[0]?.message);
        }
    }

    console.log("\n--- ✅ Esquema en Español creado con éxito ---");
}

createSchema();
