const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function magicImageLink() {
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.access_token;
        
        console.log("Obteniendo productos...");
        const prodRes = await fetch(`${DIRECTUS_URL}/items/productos?limit=-1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = (await prodRes.json()).data;

        console.log("Obteniendo archivos...");
        const filesRes = await fetch(`${DIRECTUS_URL}/files?limit=-1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const files = (await filesRes.json()).data;

        console.log(`Buscando coincidencias para ${products.length} productos y ${files.length} archivos...`);

        for (const prod of products) {
            // Buscamos un archivo cuyo título o nombre coincida con el nombre del producto (case-insensitive)
            const match = files.find(f => {
                const title = (f.title || '').toLowerCase().trim();
                const filename = (f.filename_download || '').toLowerCase().trim();
                const prodName = (prod.nombre || '').toLowerCase().trim();
                return title === prodName || filename.startsWith(prodName);
            });

            if (match) {
                console.log(`  🔗 Vincular: "${prod.nombre}" -> ${match.id} (${match.title})`);
                await fetch(`${DIRECTUS_URL}/items/productos/${prod.id}`, {
                    method: 'PATCH',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ imagen: match.id })
                });
            }
        }
        console.log("✨ ¡Vinculación mágica finalizada!");

    } catch (e) {
        console.error("Error:", e.message);
    }
}

magicImageLink();
