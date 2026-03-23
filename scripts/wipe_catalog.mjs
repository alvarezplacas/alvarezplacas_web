const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function login() {
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const body = await loginRes.json();
  return body.data.access_token;
}

async function wipe() {
    console.log('🗑️ Limpiando catálogo actual...');
    const token = await login();
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Clear variant SKU
    const vRes = await fetch(`${DIRECTUS_URL}/items/variantes_sku?limit=-1&fields=id`, { headers });
    const vBody = await vRes.json();
    if (vBody.data?.length) {
        console.log(`- Eliminando ${vBody.data.length} variantes...`);
        await fetch(`${DIRECTUS_URL}/items/variantes_sku`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify(vBody.data.map(v => v.id))
        });
    }

    // Clear Productos
    const pRes = await fetch(`${DIRECTUS_URL}/items/productos?limit=-1&fields=id`, { headers });
    const pBody = await pRes.json();
    if (pBody.data?.length) {
        console.log(`- Eliminando ${pBody.data.length} productos...`);
        await fetch(`${DIRECTUS_URL}/items/productos`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify(pBody.data.map(p => p.id))
        });
    }

    // Clear Lineas (Except ID 1 if it's protected, but we can delete all)
    const lRes = await fetch(`${DIRECTUS_URL}/items/lineas?limit=-1&fields=id`, { headers });
    const lBody = await lRes.json();
    if (lBody.data?.length) {
        console.log(`- Eliminando ${lBody.data.length} líneas...`);
        await fetch(`${DIRECTUS_URL}/items/lineas`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify(lBody.data.map(l => l.id))
        });
    }

    console.log('✅ Catálogo limpiado.');
}

wipe().catch(console.error);
