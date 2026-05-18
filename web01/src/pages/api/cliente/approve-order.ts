import { directus, readItem } from '@conexiones/directus.js';
import { updateItem } from '@directus/sdk';

export const POST = async ({ request, cookies }: any) => {
    try {
        const body = await request.json();
        const { pedidoId } = body;
        const clientId = cookies.get('client_session')?.value;

        if (!clientId || !pedidoId) {
            return new Response(JSON.stringify({ error: 'Acceso denegado o ID faltante' }), { status: 400 });
        }

        // 1. Validar que el pedido pertenezca al cliente
        const pedido = await directus.request(readItem('pedidos', pedidoId, {
            fields: ['cliente_id']
        })) as any;

        if (!pedido) {
            return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), { status: 404 });
        }

        const pedidoClientId = typeof pedido.cliente_id === 'object' ? pedido.cliente_id.id : pedido.cliente_id;

        if (String(pedidoClientId) !== String(clientId)) {
            return new Response(JSON.stringify({ error: 'Pedido no pertenece a tu cuenta' }), { status: 403 });
        }
        
        await directus.request(updateItem('pedidos', pedidoId, {
            status: 'en_produccion',
            date_updated: new Date().toISOString()
        }));

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        console.error("Error al aprobar pedido:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
