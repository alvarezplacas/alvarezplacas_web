import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { deleteItem } from '@directus/sdk';

export const POST: APIRoute = async ({ cookies }) => {
    const clientId = cookies.get('client_session')?.value;
    
    if (!clientId) {
        return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 401 });
    }
    
    try {
        console.log(`[DeleteAccount] Deleting client account: ${clientId}`);
        
        // Eliminar físicamente el cliente de Directus
        await directus.request(deleteItem('clientes', clientId));

        // Limpiar la cookie de sesión del cliente
        cookies.delete('client_session', { path: '/' });

        return new Response(JSON.stringify({ success: true }));
    } catch (e: any) {
        console.error("Error al eliminar cuenta de cliente en Directus:", e);
        return new Response(JSON.stringify({ error: 'Error del servidor: ' + e.message }), { status: 500 });
    }
};
