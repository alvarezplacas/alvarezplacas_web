import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { updateItem } from '@directus/sdk';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        // Verificar sesión admin
        const session = cookies.get('admin_session');
        if (!session || session.value !== 'authenticated_javier') {
            return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), { status: 401 });
        }

        const body = await request.json();
        const { id, name, email, phone, address, vendedor_id, status } = body;

        if (!id || !name || !email) {
            return new Response(JSON.stringify({ success: false, message: 'ID, Nombre y Email son obligatorios' }), { status: 400 });
        }

        await directus.request(updateItem('clientes', id, {
            name,
            email: email.toLowerCase(),
            phone,
            address,
            vendedor_id: vendedor_id || null,
            status: status || 'active'
        }));

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Cliente actualizado correctamente' 
        }), { status: 200 });

    } catch (e: any) {
        console.error('[Admin Update Client Error]:', e);
        return new Response(JSON.stringify({ success: false, message: 'Error interno al actualizar' }), { status: 500 });
    }
};
