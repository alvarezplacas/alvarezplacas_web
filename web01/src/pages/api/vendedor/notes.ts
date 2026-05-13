import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';
import { createItem, updateItem } from '@directus/sdk';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { vendedor_id } = locals;
        if (!vendedor_id) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
        }

        const body = await request.json();
        const { contenido, relacion_tipo, relacion_id, es_recordatorio, fecha_vencimiento, urgencia } = body;

        const result = await directus.request(createItem('vendedor_notas', {
            vendedor_id,
            contenido,
            relacion_tipo: relacion_tipo || 'general',
            relacion_id,
            es_recordatorio: es_recordatorio || false,
            fecha_vencimiento,
            urgencia: urgencia || 'baja',
            completada: false
        }));

        return new Response(JSON.stringify(result), { status: 201 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};

export const PATCH: APIRoute = async ({ request, locals, url }) => {
    try {
        const { vendedor_id } = locals;
        if (!vendedor_id) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
        }

        const id = url.searchParams.get('id');
        if (!id) {
            return new Response(JSON.stringify({ error: 'Falta ID' }), { status: 400 });
        }

        // Primero verificamos que la nota pertenezca al vendedor
        const existing = await directus.request(readItems('vendedor_notas', {
            filter: {
                id: { _eq: id },
                vendedor_id: { _eq: vendedor_id }
            }
        }));

        if (existing.length === 0) {
            return new Response(JSON.stringify({ error: 'Nota no encontrada o no autorizada' }), { status: 404 });
        }

        const result = await directus.request(updateItem('vendedor_notas', id, {
            completada: true
        }));

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ locals, url }) => {
    try {
        const { vendedor_id } = locals;
        if (!vendedor_id) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
        }

        const id = url.searchParams.get('id');
        if (!id) {
            return new Response(JSON.stringify({ error: 'Falta ID' }), { status: 400 });
        }

        // Verificamos pertenencia
        const existing = await directus.request(readItems('vendedor_notas', {
            filter: {
                id: { _eq: id },
                vendedor_id: { _eq: vendedor_id }
            }
        }));

        if (existing.length === 0) {
            return new Response(JSON.stringify({ error: 'Nota no encontrada o no autorizada' }), { status: 404 });
        }

        // Importación dinámica para evitar conflictos si no está en el top-level
        const { deleteItem } = await import('@directus/sdk');
        await directus.request(deleteItem('vendedor_notas', id));

        return new Response(null, { status: 204 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
