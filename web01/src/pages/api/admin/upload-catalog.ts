import type { APIRoute } from 'astro';
import * as xlsx from 'xlsx';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

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
        
        // Obtener IDs pre-seleccionados del body (opcional)
        const overrideCategoryId = formData.get('category_id');
        const overrideBrandId = formData.get('brand_id');

        let totalProcessed = 0;

        // Iterar por todas las hojas (EGGER, FAPLAC, SADEPAN, etc.)
        for (const sheetName of workbook.SheetNames) {
            console.log(`[Upload] Procesando hoja: ${sheetName}`);
            const sheet = workbook.Sheets[sheetName];
            const rawData = xlsx.utils.sheet_to_json(sheet);
            
            // Procesamiento por Lotes
            for (let i = 0; i < rawData.length; i += 10) {
                const chunk = rawData.slice(i, i + 10);
                
                await Promise.all(chunk.map(async (row: any) => {
                    // Mapeo Dinámico (Soporta formato viejo y nuevo v16)
                    const nombre = row['ARTICULO/COLOR REAL'] || row['Nombre'] || row['nombre'] || '';
                    const linea  = row['LINEA/GRUPO'] || row['linea'] || row['linea/grupo'] || '';
                    const marcaName = row['MARCA'] || row['Marca'] || sheetName;
                    const espesor = row['ESPESOR'] || row['Espesor'] || '';
                    const soporte = row['SOPORTE'] || row['soporte'] || 'AGLOMERADO';
                    const precio_l1 = parseFloat(row['L1'] || row['Precio'] || 0);
                    const precio_l2 = parseFloat(row['L2'] || 0);

                    if (!nombre) return;

                    // 2. Resolución de Entidades
                    let finalCategoryId = overrideCategoryId;
                    let finalBrandId = overrideBrandId;

                    if (!finalCategoryId) {
                        const catRes = await upsertItem('Rubros', { nombre: { _eq: 'Placas' } }, { nombre: 'Placas' }, token);
                        finalCategoryId = catRes.data.id;
                    }

                    if (!finalBrandId) {
                        const marcaRes = await upsertItem('marcas', { nombre: { _eq: marcaName } }, { nombre: marcaName, rubro: finalCategoryId }, token);
                        finalBrandId = marcaRes.data.id;
                    }

                    // 3. Generar SKU Industrial (Si no existe)
                    let sku = row['SKU'] || row['sku'] || '';
                    if (!sku) {
                        const brandRef = marcaName.substring(0,3).toUpperCase();
                        const thickRef = espesor.toString().replace(/\D/g,'');
                        const cleanName = nombre.substring(0,5).toUpperCase().replace(/ /g,'');
                        sku = `M-${brandRef}-${cleanName}-${thickRef}`;
                    }

                    // 4. UPSERT de Producto en 'Productos'
                    await upsertItem('Productos', { sku: { _eq: sku } }, {
                        status: 'published',
                        nombre,
                        sku,
                        linea,
                        espesor,
                        soporte,
                        marca: finalBrandId,
                        rubro: finalCategoryId,
                        precio_l1,
                        precio_l2,
                        activo: true
                    }, token);

                    totalProcessed++;
                }));
            }
        }

        return new Response(JSON.stringify({ success: true, processed: totalProcessed }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Error Directus Upload:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
