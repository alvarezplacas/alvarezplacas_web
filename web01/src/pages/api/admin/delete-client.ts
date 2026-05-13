import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { deleteItem } from '@directus/sdk';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        // Verificar sesión admin
        const session = cookies.get('admin_session');
        if (!session || session.value !== 'authenticated_javier') {
            return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), { status: 401 });
        }

        const { id } = await request.json();

        if (!id) {
            return new Response(JSON.stringify({ success: false, message: 'ID de cliente requerido' }), { status: 400 });
        }

        await directus.request(deleteItem('clientes', id));

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Cliente eliminado correctamente' 
        }), { status: 200 });

    } catch (e: any) {
        console.error('[Admin Delete Client Error]:', e);
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Error al eliminar cliente. Puede que tenga pedidos asociados.' 
        }), { status: 500 });
    }
};
