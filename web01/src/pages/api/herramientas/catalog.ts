import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';

export const GET: APIRoute = async ({ url }) => {
    const search = url.searchParams.get('search') || '';
    const brand = url.searchParams.get('brand') || '';
    const line = url.searchParams.get('line') || '';
    const type = url.searchParams.get('type') || 'products'; // 'products' or 'lines'
    
    try {
        if (type === 'lines') {
            console.log(`[Catalog API] Fetching lines for brand: "${brand}"`);
            const response = await directus.request(readItems('Productos', {
                fields: ['linea', 'marca.nombre'],
                filter: {
                    _and: [
                        { rubro: { letra: { _eq: 'M' } } },
                        { marca: { nombre: { _eq: brand } } }
                    ]
                },
                limit: -1
            }));
            
            let rawProducts = Array.isArray(response) ? response : (response as any).data || [];
            
            // Filtro de seguridad extra en JS por si el join de Directus falla o trae de más
            const filteredProducts = rawProducts.filter((p: any) => {
                const b = p.marca?.nombre || '';
                return b === brand;
            });

            if (rawProducts.length !== filteredProducts.length) {
                console.warn(`[Catalog API] FILTERED OUT ${rawProducts.length - filteredProducts.length} leaked products from other brands.`);
            }

            // Usamos el campo literal 'linea' de Directus para la agrupación.
            const lines = [...new Set(filteredProducts.map((p: any) => (p.linea || '').toString().trim() || 'GENERAL'))].sort();

            return new Response(JSON.stringify(lines), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const filters: any[] = [
            { rubro: { letra: { _eq: 'M' } } },
            { Estado: { _neq: 'archived' } } // Permitimos Stock, published, etc.
        ];

        if (brand) filters.push({ marca: { nombre: { _eq: brand } } });
        
        if (line) {
            if (line === 'GENERAL') {
                filters.push({
                    _or: [
                        { linea: { _null: true } },
                        { linea: { _eq: '' } }
                    ]
                });
            } else {
                filters.push({ linea: { _eq: line } });
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

        const response = await directus.request(readItems('Productos', {
            fields: ['id', 'nombre', 'sku', 'modelo', 'linea', 'espesor', 'soporte', 'marca.nombre', 'foto_principal'],
            filter: { _and: filters },
            limit: 500 
        }));

        let products = (Array.isArray(response) ? response : (response as any).data || []).filter((p: any) => {
            if (!brand) return true;
            return p.marca?.nombre === brand;
        });

        const mappedProducts = products.map((p: any) => ({
            ...p,
            nombre_corto: p.modelo || p.nombre
        }));

        return new Response(JSON.stringify(mappedProducts), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error("[Catalog API Error]:", e);
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
};
