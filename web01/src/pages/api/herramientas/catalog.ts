import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';

export const GET: APIRoute = async ({ url }) => {
    const search = url.searchParams.get('search') || '';
    const brand = url.searchParams.get('brand') || '';
    const line = url.searchParams.get('line') || '';
    const type = url.searchParams.get('type') || 'products'; // 'products' or 'lines'
    
    try {
        if (type === 'lines') {
            const response = await directus.request(readItems('Productos', {
                fields: ['modelo'],
                filter: {
                    _and: [
                        { rubro: { letra: { _eq: 'M' } } },
                        { marca: { nombre: { _eq: brand } } }
                    ]
                },
                limit: -1
            }));
            
            const rawProducts = Array.isArray(response) ? response : (response as any).data || [];
            
            // Contamos cuántas veces aparece cada modelo para identificar grupos reales
            const counts: Record<string, number> = {};
            rawProducts.forEach((p: any) => {
                const m = (p.modelo || '').trim();
                counts[m] = (counts[m] || 0) + 1;
            });

            // Lógica Industrial: Una "Línea" solo se considera real si es compartida por más de un producto
            // (Como los grupos "3" o líneas como "HILADOS"). Si es única, es probablemente un nombre de color sucio.
            const lines = [...new Set(rawProducts.map((p: any) => {
                const m = (p.modelo || '').trim();
                if (!m || counts[m] <= 1) return 'GENERAL';
                return m;
            }))].sort();

            return new Response(JSON.stringify(lines), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const filters: any[] = [
            { rubro: { letra: { _eq: 'M' } } },
            { Estado: { _eq: 'published' } }
        ];

        if (brand) filters.push({ marca: { nombre: { _eq: brand } } });
        
        if (line) {
            if (line === 'GENERAL') {
                // Para GENERAL, buscamos productos sin modelo o con modelo único (sucio)
                // Nota: El filtro de modelo único lo haremos en el paso de products para ser exactos
                filters.push({
                    _or: [
                        { modelo: { _null: true } },
                        { modelo: { _eq: '' } }
                    ]
                });
            } else {
                filters.push({ modelo: { _eq: line } });
            }
        }

        if (search) {
            filters.push({
                _or: [
                    { nombre: { _icontains: search } },
                    { modelo: { _icontains: search } },
                    { sku: { _icontains: search } }
                ]
            });
        }

        if (line === 'GENERAL') {
            // Si es GENERAL, necesitamos traer todo de la marca para filtrar por frecuencia en JS
            const allResponse = await directus.request(readItems('Productos', {
                fields: ['id', 'nombre', 'sku', 'modelo', 'espesor', 'soporte', 'marca.nombre', 'foto_principal'],
                filter: { 
                    _and: [
                        { rubro: { letra: { _eq: 'M' } } },
                        { marca: { nombre: { _eq: brand } } },
                        { Estado: { _eq: 'published' } }
                    ]
                },
                limit: -1
            }));
            const allProducts = Array.isArray(allResponse) ? allResponse : (allResponse as any).data || [];
            
            // Contamos frecuencias de modelos en el set completo
            const counts: Record<string, number> = {};
            allProducts.forEach((p: any) => {
                const m = (p.modelo || '').trim();
                counts[m] = (counts[m] || 0) + 1;
            });

            // Filtramos solo los que no tienen modelo o su modelo es UNICO (no es una línea)
            const products = allProducts.filter((p: any) => {
                const m = (p.modelo || '').trim();
                return !m || counts[m] <= 1;
            });

            return new Response(JSON.stringify(products), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const response = await directus.request(readItems('Productos', {
            fields: ['id', 'nombre', 'sku', 'modelo', 'espesor', 'soporte', 'marca.nombre', 'foto_principal'],
            filter: { _and: filters },
            limit: 500 
        }));

        const products = Array.isArray(response) ? response : (response as any).data || [];

        return new Response(JSON.stringify(products), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error("[Catalog API Error]:", e);
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
};
