import type { APIRoute } from 'astro';
import * as xlsx from 'xlsx';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

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
        
        let processedCount = 0;

        // Procesamiento por Lotes (Chunks de 10)
        for (let i = 0; i < rawData.length; i += 10) {
            const chunk = rawData.slice(i, i + 10);
            
            await Promise.all(chunk.map(async (row: any) => {
                const nombre = row['Nombre'] || '';
                const descripcion = row['Descripción'] || '';
                const sku = row['SKU'] || '';
                const categoria = row['Categoría'] || 'General';
                const marca = row['Marca'] || 'Varios';
                const linea = row['Línea'] || 'Estándar';
                const espesor = row['Espesor'] || '';
                const color = row['Color'] || '';
                const textura = row['Textura'] || '';
                const medidas = row['Medidas'] || '';
                const precio = parseFloat(row['Precio'] || 0);
                const stock = parseInt(row['Stock'] || 0);

                if (!nombre || !sku) return;

                // Excluir Proveedores
                const lowerMarca = marca.toLowerCase();
                if (lowerMarca.includes('madergold') || lowerMarca.includes('santi')) return;

                // 2. Mapeo de Entidades Relacionales
                const catRes = await upsertItem('categorias', { nombre: { _eq: categoria } }, { nombre: categoria }, token);
                const marcaRes = await upsertItem('marcas', { nombre: { _eq: marca } }, { nombre: marca }, token);
                const lineaRes = await upsertItem('lineas', { 
                    _and: [{ nombre: { _eq: linea } }, { marca_id: { _eq: marcaRes.data.id } }] 
                }, { nombre: linea, marca_id: marcaRes.data.id }, token);

                // 3. Preparar Atributos y Tags
                const atributos = { 
                    Línea: linea, 
                    Espesor: espesor, 
                    Color: color, 
                    Textura: textura, 
                    Medidas: medidas 
                };
                
                const tags = [
                    categoria, marca, linea, color, textura, espesor
                ].filter(Boolean).map(s => s.toLowerCase());

                // 4. UPSERT de Producto (Hierarchical Image logic via route string)
                // Usamos SKU como identificador único para el UPSERT
                await upsertItem('productos', { sku: { _eq: sku } }, {
                    status: 'published',
                    nombre,
                    descripcion,
                    sku,
                    precio,
                    stock,
                    categoria_id: catRes.data.id,
                    marca_id: marcaRes.data.id,
                    linea_id: lineaRes.data.id,
                    atributos,
                    tags,
                    // La imagen se resuelve en el frontend vía /Placas/[Marca]/[Linea]/[Nombre].avif
                    slug: sku.toLowerCase()
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
