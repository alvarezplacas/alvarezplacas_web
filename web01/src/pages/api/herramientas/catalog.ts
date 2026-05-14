import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';

export const GET: APIRoute = async ({ url }) => {
    const search = url.searchParams.get('search') || '';
    const brand = url.searchParams.get('brand') || '';
    const line = url.searchParams.get('line') || '';
    const type = url.searchParams.get('type') || 'products'; // 'products' or 'lines'
    
    try {
        if (type === 'lines') {
            const products = await directus.request(readItems('Productos', {
                fields: ['modelo'],
                filter: {
                    _and: [
                        { rubro: { letra: { _eq: 'M' } } },
                        { marca: { nombre: { _eq: brand } } },
                        { modelo: { _neq: '' } }
                    ]
                },
                limit: -1
            }));
            const lines = [...new Set(products.map(p => p.modelo))].filter(Boolean).sort();
            return new Response(JSON.stringify(lines), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const filters: any[] = [
            { rubro: { letra: { _eq: 'M' } } },
            { Estado: { _eq: 'published' } }
        ];

        if (brand) filters.push({ marca: { nombre: { _eq: brand } } });
        if (line) filters.push({ modelo: { _eq: line } });
        if (search) {
            filters.push({
                _or: [
                    { nombre: { _icontains: search } },
                    { modelo: { _icontains: search } },
                    { sku: { _icontains: search } }
                ]
            });
        }

        const products = await directus.request(readItems('Productos', {
            fields: ['id', 'nombre', 'sku', 'modelo', 'espesor', 'soporte', 'marca.nombre', 'foto_principal'],
            filter: { _and: filters },
            limit: 50
        }));

        return new Response(JSON.stringify(products), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
