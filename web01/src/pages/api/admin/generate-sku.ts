import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';

export const GET: APIRoute = async ({ url }) => {
    const rubroId = url.searchParams.get('rubro');
    const marcaId = url.searchParams.get('marca');

    if (!rubroId || !marcaId) {
        return new Response(JSON.stringify({ error: "Rubro and Marca are required" }), { status: 400 });
    }

    try {
        // 1. Obtener Letra del Rubro
        const rubro = await directus.request(readItems('Rubros', {
            fields: ['letra'],
            filter: { id: { _eq: rubroId } }
        }));
        const letra = rubro[0]?.letra || 'X';

        // 2. Obtener Código de la Marca
        const marca = await directus.request(readItems('marcas', {
            fields: ['codigo'],
            filter: { id: { _eq: marcaId } }
        }));
        const codigo = marca[0]?.codigo || '00';

        // 3. Buscar el último SKU con ese prefijo
        const prefix = `${letra}-${codigo}-`;
        const lastProducts = await directus.request(readItems('Productos', {
            fields: ['sku'],
            filter: {
                sku: { _starts_with: prefix }
            },
            sort: ['-sku'],
            limit: 1
        }));

        let nextNumber = 1;
        if (lastProducts.length > 0 && lastProducts[0].sku) {
            const lastSku = lastProducts[0].sku;
            const parts = lastSku.split('-');
            const lastNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastNum)) {
                nextNumber = lastNum + 1;
            }
        }

        const newSku = `${prefix}${nextNumber.toString().padStart(4, '0')}`;

        return new Response(JSON.stringify({ sku: newSku }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
