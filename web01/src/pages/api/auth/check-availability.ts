import type { APIRoute } from 'astro';
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL_INTERNAL || import.meta.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const STATIC_TOKEN = import.meta.env.DIRECTUS_TOKEN || 'sv47_8QErnkx0-EBKFBnAoBw433CJs13';

const directusClient = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

/**
 * Endpoint para validación asíncrona de disponibilidad de Email o Teléfono.
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const { field, value } = await request.json();

        if (!field || !value) {
            return new Response(JSON.stringify({ available: true }), { status: 200 });
        }

        // Solo validamos email y phone
        if (field !== 'email' && field !== 'phone') {
            return new Response(JSON.stringify({ available: true }), { status: 200 });
        }

        const filter: any = {};
        filter[field] = { _eq: field === 'email' ? value.toLowerCase().trim() : value.replace(/\D/g, '') };

        const existing = await directusClient.request(readItems('clientes', {
            filter,
            limit: 1,
            fields: ['id']
        }));

        return new Response(JSON.stringify({ 
            available: existing.length === 0,
            message: existing.length === 0 ? '' : `Este ${field === 'email' ? 'correo' : 'teléfono'} ya está registrado.`
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (e) {
        return new Response(JSON.stringify({ available: true }), { status: 200 });
    }
};
