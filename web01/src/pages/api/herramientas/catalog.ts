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
                fields: ['modelo', 'nombre'],
                filter: {
                    _and: [
                        { rubro: { letra: { _eq: 'M' } } },
                        { marca: { nombre: { _eq: brand } } }
                    ]
                },
                limit: -1
            }));
            
            const rawProducts = Array.isArray(response) ? response : (response as any).data || [];
            
            // Lógica Industrial: Una "Línea" solo es válida si es distinta al nombre del producto.
            // Si el modelo está vacío o es igual al nombre, lo mandamos a "GENERAL".
            const lines = [...new Set(rawProducts.map((p: any) => {
                const mod = (p.modelo || '').trim();
                const nom = (p.nombre || '').trim();
                if (!mod || mod === nom) return 'GENERAL';
                return mod;
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

        const response = await directus.request(readItems('Productos', {
            fields: ['id', 'nombre', 'sku', 'modelo', 'espesor', 'soporte', 'marca.nombre', 'foto_principal'],
            filter: { _and: filters },
            limit: 250 // Aumentamos límite para búsquedas generales
        }));

        let products = Array.isArray(response) ? response : (response as any).data || [];

        // Filtro adicional en JS para el caso GENERAL (modelo === nombre)
        if (line === 'GENERAL') {
            products = products.filter((p: any) => {
                const mod = (p.modelo || '').trim();
                const nom = (p.nombre || '').trim();
                return !mod || mod === nom;
            });
        }

        return new Response(JSON.stringify(products), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error("[Catalog API Error]:", e);
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
};
