import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';
import { createItem, deleteItem } from '@directus/sdk';

export const GET: APIRoute = async ({ url, locals }) => {
    try {
        const { vendedor_id } = locals;
        if (!vendedor_id) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
        }

        const fecha = url.searchParams.get('fecha');
        const fechaDesde = url.searchParams.get('fechaDesde');
        const fechaHasta = url.searchParams.get('fechaHasta');
        const limit = parseInt(url.searchParams.get('limit') || '5000');
        const sort = url.searchParams.get('sort') || '-date_created';

        const filter: any = {};

        if (fecha) {
            filter.fecha = { _eq: fecha };
        } else if (fechaDesde && fechaHasta) {
            filter.fecha = {
                _gte: fechaDesde,
                _lte: fechaHasta
            };
        } else if (fechaDesde) {
            filter.fecha = { _gte: fechaDesde };
        } else if (fechaHasta) {
            filter.fecha = { _lte: fechaHasta };
        }

        const items = await directus.request(readItems('caja_movimientos', {
            filter,
            sort: [sort],
            limit
        }));

        return new Response(JSON.stringify({ data: items }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[API Movimientos GET] Error:', e);
        return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { vendedor_id } = locals;
        if (!vendedor_id) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
        }

        const body = await request.json();
        const { id, fecha, tipo, categoria, monto, detalle, observaciones } = body;

        if (!fecha || !tipo || !categoria || monto === undefined) {
            return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400 });
        }

        const result = await directus.request(createItem('caja_movimientos', {
            id,
            fecha,
            tipo,
            categoria,
            monto: parseFloat(monto),
            detalle: detalle || '',
            observaciones: observaciones || '',
            date_created: new Date().toISOString()
        }));

        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[API Movimientos POST] Error:', e);
        return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ url, locals }) => {
    try {
        const { vendedor_id } = locals;
        if (!vendedor_id) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
        }

        const id = url.searchParams.get('id');
        if (!id) {
            return new Response(JSON.stringify({ error: 'Falta ID' }), { status: 400 });
        }

        await directus.request(deleteItem('caja_movimientos', id));

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[API Movimientos DELETE] Error:', e);
        return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), { status: 500 });
    }
};
