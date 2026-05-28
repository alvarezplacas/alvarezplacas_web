import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';
import { createItem, updateItem, deleteItem } from '@directus/sdk';

export const GET: APIRoute = async ({ url, locals }) => {
    try {
        const { vendedor_id } = locals;
        if (!vendedor_id) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
        }

        const limit = parseInt(url.searchParams.get('limit') || '100');
        const sort = url.searchParams.get('sort') || '-date_created';

        const items = await directus.request(readItems('caja_proyecciones', {
            limit,
            sort: [sort]
        }));

        return new Response(JSON.stringify({ data: items }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[API Proyecciones GET] Error:', e);
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
        const {
            id,
            vendedor_email,
            fecha,
            ventas_blanco,
            ventas_negro,
            gastos_totales,
            utilidad_acumulada,
            detalles_simulacion
        } = body;

        const result = await directus.request(createItem('caja_proyecciones', {
            vendedor_email: vendedor_email || 'fernando@alvarezplacas.com.ar',
            fecha: fecha || new Date().toISOString().split('T')[0],
            ventas_blanco: parseFloat(ventas_blanco || 0),
            ventas_negro: parseFloat(ventas_negro || 0),
            gastos_totales: parseFloat(gastos_totales || 0),
            utilidad_acumulada: parseFloat(utilidad_acumulada || 0),
            detalles_simulacion: typeof detalles_simulacion === 'object' ? JSON.stringify(detalles_simulacion) : detalles_simulacion,
            date_created: new Date().toISOString()
        }));

        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[API Proyecciones POST] Error:', e);
        return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), { status: 500 });
    }
};

export const PATCH: APIRoute = async ({ request, locals, url }) => {
    try {
        const { vendedor_id } = locals;
        if (!vendedor_id) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
        }

        let id = url.searchParams.get('id');
        if (!id) {
            const popped = url.pathname.split('/').pop();
            if (popped && popped !== 'proyecciones') {
                id = popped;
            }
        }

        if (!id) {
            return new Response(JSON.stringify({ error: 'Falta ID' }), { status: 400 });
        }

        const body = await request.json();
        const {
            vendedor_email,
            fecha,
            ventas_blanco,
            ventas_negro,
            gastos_totales,
            utilidad_acumulada,
            detalles_simulacion
        } = body;

        const updateData: any = {};
        if (vendedor_email !== undefined) updateData.vendedor_email = vendedor_email;
        if (fecha !== undefined) updateData.fecha = fecha;
        if (ventas_blanco !== undefined) updateData.ventas_blanco = parseFloat(ventas_blanco);
        if (ventas_negro !== undefined) updateData.ventas_negro = parseFloat(ventas_negro);
        if (gastos_totales !== undefined) updateData.gastos_totales = parseFloat(gastos_totales);
        if (utilidad_acumulada !== undefined) updateData.utilidad_acumulada = parseFloat(utilidad_acumulada);
        if (detalles_simulacion !== undefined) {
            updateData.detalles_simulacion = typeof detalles_simulacion === 'object' ? JSON.stringify(detalles_simulacion) : detalles_simulacion;
        }

        const result = await directus.request(updateItem('caja_proyecciones', id, updateData));

        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[API Proyecciones PATCH] Error:', e);
        return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ url, locals }) => {
    try {
        const { vendedor_id } = locals;
        if (!vendedor_id) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
        }

        let id = url.searchParams.get('id');
        if (!id) {
            const popped = url.pathname.split('/').pop();
            if (popped && popped !== 'proyecciones') {
                id = popped;
            }
        }

        if (!id) {
            return new Response(JSON.stringify({ error: 'Falta ID' }), { status: 400 });
        }

        await directus.request(deleteItem('caja_proyecciones', id));

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[API Proyecciones DELETE] Error:', e);
        return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), { status: 500 });
    }
};
