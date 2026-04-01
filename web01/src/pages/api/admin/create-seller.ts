import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { createItem } from '@directus/sdk';

export const POST: APIRoute = async ({ request, cookies }) => {
    // Basic admin check (could be improved with a real token check)
    const adminSession = cookies.get('admin_session')?.value;
    if (!adminSession) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { nombre, email, whatsapp } = body;

        if (!nombre || !email) {
            return new Response(JSON.stringify({ error: 'Nombre y Email son obligatorios' }), { status: 400 });
        }

        const result = await directus.request(createItem('vendedores', {
            nombre: nombre,
            email: email,
            whatsapp: whatsapp || null
        }));

        return new Response(JSON.stringify({ success: true, data: result }), { status: 200 });
    } catch (e: any) {
        console.error('Error creating seller:', e);
        return new Response(JSON.stringify({ 
            error: 'Error al registrar vendedor: ' + (e.message || 'Error desconocido')
        }), { status: 500 });
    }
};
