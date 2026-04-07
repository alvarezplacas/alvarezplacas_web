const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function fixRelations() {
    console.log("--- 🏗️ Estableciendo Relaciones en Directus ---");

    const loginResp = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const { data: { access_token: token } } = await loginResp.json();
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const relations = [
        {
            collection: 'materiales',
            field: 'id_marca',
            related_collection: 'marcas',
            schema: { table: 'materiales', column: 'id_marca', foreign_key_table: 'marcas', foreign_key_column: 'id' },
            meta: { junction_field: null, many_collection: 'materiales', many_field: 'id_marca', one_allowed_collections: null, one_collection: 'marcas', one_collection_field: null, one_deselect_action: 'nullify', one_field: null, sort_field: null }
        },
        {
            collection: 'materiales',
            field: 'id_categoria',
            related_collection: 'categorias',
            schema: { table: 'materiales', column: 'id_categoria', foreign_key_table: 'categorias', foreign_key_column: 'id' },
            meta: { junction_field: null, many_collection: 'materiales', many_field: 'id_categoria', one_allowed_collections: null, one_collection: 'categorias', one_collection_field: null, one_deselect_action: 'nullify', one_field: null, sort_field: null }
        },
        {
            collection: 'materiales',
            field: 'id_espesor',
            related_collection: 'espesores',
            schema: { table: 'materiales', column: 'id_espesor', foreign_key_table: 'espesores', foreign_key_column: 'id' },
            meta: { junction_field: null, many_collection: 'materiales', many_field: 'id_espesor', one_allowed_collections: null, one_collection: 'espesores', one_collection_field: null, one_deselect_action: 'nullify', one_field: null, sort_field: null }
        }
    ];

    for (const rel of relations) {
        console.log(`Estableciendo relación: ${rel.collection}.${rel.field} -> ${rel.related_collection}...`);
        const resp = await fetch(`${DIRECTUS_URL}/relations`, {
            method: 'POST',
            headers,
            body: JSON.stringify(rel)
        });
        const data = await resp.json();
        if (resp.ok || data.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
            console.log(`  ✅ ${rel.collection}.${rel.field} lista.`);
        } else {
            console.warn(`  ⚠️ Error en ${rel.field}:`, data.errors?.[0]?.message);
        }
    }

    console.log("\n--- ✅ Relaciones configuradas ---");
}

fixRelations().catch(console.error);
