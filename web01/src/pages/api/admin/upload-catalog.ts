import type { APIRoute } from 'astro';
import * as xlsx from 'xlsx';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || 'JavierMix2026!';

// Helper: Corregida para Directus (Según sugerencia del usuario)
async function upsertItem(collection: string, filter: any, data: any, token: string) {
    const query = encodeURIComponent(JSON.stringify(filter));
    const existingReq = await fetch(`${DIRECTUS_URL}/items/${collection}?filter=${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const existingRes = await existingReq.json();
    
    const fetchOptions: any = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    };
    
    if (existingRes.data && existingRes.data.length > 0) {
        fetchOptions.method = 'PATCH';
        const res = await fetch(`${DIRECTUS_URL}/items/${collection}/${existingRes.data[0].id}`, fetchOptions);
        return await res.json();
    } else {
        fetchOptions.method = 'POST';
        const res = await fetch(`${DIRECTUS_URL}/items/${collection}`, fetchOptions);
        return await res.json();
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) return new Response(JSON.stringify({ error: 'No se envió ningún archivo' }), { status: 400 });

        // 1. Login Directus
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data?.access_token;
        if (!token) throw new Error('No se pudo autenticar con Directus');

        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = xlsx.utils.sheet_to_json(sheet);
        
        // Obtener IDs pre-seleccionados del body
        const overrideCategoryId = formData.get('category_id');
        const overrideBrandId = formData.get('brand_id');

        let processedCount = 0;

        // Procesamiento por Lotes (Chunks de 10)
        for (let i = 0; i < rawData.length; i += 10) {
            const chunk = rawData.slice(i, i + 10);
            
            await Promise.all(chunk.map(async (row: any) => {
                const nombre = row['Nombre'] || '';
                const descripcion = row['Descripción'] || '';
                let sku = row['SKU'] || '';
                const categoria = row['Categoría'] || row['Rubro'] || 'General';
                const marca = row['Marca'] || 'Varios';
                const espesor = row['Espesor'] || '';
                const precio = parseFloat(row['Precio'] || 0);

                if (!nombre) return;

                // 2. Resolución de Entidades Relacionales (Priorizando Overrides)
                let finalCategoryId = overrideCategoryId;
                let finalBrandId = overrideBrandId;

                if (!finalCategoryId) {
                    const catRes = await upsertItem('Rubros', { nombre: { _eq: categoria } }, { nombre: categoria }, token);
                    finalCategoryId = catRes.data.id;
                }

                if (!finalBrandId) {
                    const marcaRes = await upsertItem('marcas', { nombre: { _eq: marca } }, { nombre: marca, rubro: finalCategoryId }, token);
                    finalBrandId = marcaRes.data.id;
                }

                // 3. Generación Automática de SKU si falta
                if (!sku) {
                    try {
                        const skuReq = await fetch(`${request.url.split('/api')[0]}/api/admin/generate-sku?rubro=${finalCategoryId}&marca=${finalBrandId}`);
                        const skuData = await skuReq.json();
                        sku = skuData.sku;
                    } catch (e) {
                        sku = `GEN-${Math.random().toString(36).substring(7).toUpperCase()}`;
                    }
                }

                // 4. UPSERT de Producto
                await upsertItem('Productos', { sku: { _eq: sku } }, {
                    status: 'published',
                    nombre,
                    descripcion,
                    sku,
                    precio_L1: precio,
                    rubro: finalCategoryId,
                    marca: finalBrandId,
                    espesor: espesor
                }, token);

                processedCount++;
            }));

            // Pequeño delay para Rate Limiting
            await new Promise(r => setTimeout(r, 100));
        }

        return new Response(JSON.stringify({ success: true, processed: processedCount }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Error Directus Upload:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
