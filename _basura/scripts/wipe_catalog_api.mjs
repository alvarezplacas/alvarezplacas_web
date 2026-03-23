const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function wipeCatalog() {
    console.log('🚀 Iniciando limpieza de catálogo vía API...');

    // 1. Login
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.access_token;
    if (!token) throw new Error('No se pudo autenticar');

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Colecciones a limpiar (Orden de dependencias invertido)
    const collections = ['variantes_sku', 'productos', 'lineas', 'marcas', 'categorias'];

    for (const collection of collections) {
        console.log(`🧹 Limpiando colección: ${collection}...`);
        
        // Obtener todos los IDs (Directus limita a 100 por defecto, usamos limit=-1)
        const itemsRes = await fetch(`${DIRECTUS_URL}/items/${collection}?limit=-1&fields=id`, { headers });
        const items = await itemsRes.json();
        
        if (items.data && items.data.length > 0) {
            const ids = items.data.map(item => item.id);
            console.log(`🗑️ Borrando ${ids.length} elementos de ${collection}...`);
            
            // Borrado masivo (Pasando array de IDs en el body según spec de Directus)
            const deleteRes = await fetch(`${DIRECTUS_URL}/items/${collection}`, {
                method: 'DELETE',
                headers,
                body: JSON.stringify(ids)
            });
            
            if (deleteRes.status === 204 || deleteRes.status === 200) {
                console.log(`✅ ${collection} limpia.`);
            } else {
                console.error(`❌ Error limpiando ${collection}:`, await deleteRes.text());
            }
        } else {
            console.log(`ℹ️ ${collection} ya está vacía.`);
        }
    }

    console.log('🏁 Proceso de limpieza finalizado.');
}

wipeCatalog().catch(console.error);
