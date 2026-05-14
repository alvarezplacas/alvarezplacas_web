import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';

export const GET: APIRoute = async ({ url }) => {
    const search = url.searchParams.get('search') || '';
    const brand = url.searchParams.get('brand') || '';
    const line = url.searchParams.get('line') || '';
    const type = url.searchParams.get('type') || 'products'; // 'products' or 'lines'
    
    try {
        // Resolvemos el ID de la marca primero para un filtrado 100% exacto y sin fugas
        const marcasRes = await directus.request(readItems('marcas', {
            filter: { nombre: { _eq: brand } },
            fields: ['id']
        }));
        const brandObj = (Array.isArray(marcasRes) ? marcasRes[0] : (marcasRes as any).data?.[0]);
        const brandId = brandObj?.id;

        if (type === 'lines') {
            console.log(`[Catalog API] Fetching lines for brand: "${brand}" (ID: ${brandId})`);
            
            const response = await directus.request(readItems('Productos', {
                fields: ['linea', 'marca.nombre'],
                filter: {
                    _and: [
                        { rubro: { letra: { _eq: 'M' } } },
                        { marca: { _eq: brandId } },
                        { Estado: { _neq: 'archived' } }
                    ]
                },
                limit: -1
            }));
            
            let rawProducts = Array.isArray(response) ? response : (response as any).data || [];
            
            // Usamos el campo literal 'linea' de Directus para la agrupación.
            const lines = [...new Set(rawProducts.map((p: any) => (p.linea || '').toString().trim() || 'GENERAL'))].sort();

            return new Response(JSON.stringify(lines), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const filters: any[] = [
            { rubro: { letra: { _eq: 'M' } } },
            { marca: { _eq: brandId } },
            { Estado: { _neq: 'archived' } }
        ];
        
        if (line) {
            if (line === 'GENERAL') {
                const allResponse = await directus.request(readItems('Productos', {
                    fields: ['id', 'nombre', 'sku', 'modelo', 'linea', 'espesor', 'soporte', 'marca.nombre', 'foto_principal'],
                    filter: { 
                        _and: [
                            { rubro: { letra: { _eq: 'M' } } },
                            { marca: { _eq: brandId } },
                            { Estado: { _neq: 'archived' } }
                        ]
                    },
                    limit: -1
                }));
                const allProducts = Array.isArray(allResponse) ? allResponse : (allResponse as any).data || [];
                
                const products = allProducts.filter((p: any) => {
                    const l = (p.linea || '').toString().trim();
                    return !l;
                });

                const mappedProducts = products.map((p: any) => ({
                    ...p,
                    nombre_corto: p.modelo || p.nombre
                }));

                return new Response(JSON.stringify(mappedProducts), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
            fields: ['id', 'nombre', 'sku', 'modelo', 'linea', 'espesor', 'soporte', 'marca.id', 'marca.nombre', 'foto_principal'],
            filter: { _and: filters },
            limit: 500 
        }));

        let products = (Array.isArray(response) ? response : (response as any).data || []).filter((p: any) => {
            if (!brandId) return true;
            return (p.marca?.id === brandId || p.marca === brandId);
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
