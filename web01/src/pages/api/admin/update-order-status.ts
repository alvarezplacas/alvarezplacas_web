import { directus } from '@conexiones/directus.js';
import { updateItem, readItem } from '@directus/sdk';

/**
 * API: Actualizar estado de pedido + Lógica de Lealtad.
 */
export const POST = async ({ request, cookies }) => {
    const session = cookies.get('admin_session')?.value || cookies.get('seller_session')?.value;
    if (!session) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    try {
        const { pedidoId, status } = await request.json();

        if (!pedidoId || !status) {
            return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
        }

        // 1. Obtener datos actuales del pedido para la lógica de puntos
        const order = await directus.request(readItem('pedidos', pedidoId, {
            fields: ['total', 'status', 'cliente_id']
        }));

        const oldStatus = order.status;

        // 2. Actualizar estado del pedido
        const result = await directus.request(updateItem('pedidos', pedidoId, { status }));

        // 3. Lógica de PUNTOS: Si pasa a 'entregado' y no lo estaba antes
        if (status === 'entregado' && oldStatus !== 'entregado' && order.cliente_id) {
            const total = parseFloat(order.total || '0');
            const pointsToAdd = Math.floor(total / 10000);

            if (pointsToAdd > 0) {
                // Obtener puntaje actual del cliente
                const client = await directus.request(readItem('clientes', order.cliente_id, {
                    fields: ['scoring']
                }));

                const newScoring = (client.scoring || 0) + pointsToAdd;

                // Actualizar puntos y fecha del último pedido (vigencia 3 meses)
                await directus.request(updateItem('clientes', order.cliente_id, {
                    scoring: newScoring,
                    last_order_date: new Date().toISOString()
                }));

                console.log(`[Loyalty] Added ${pointsToAdd} points to client ${order.cliente_id}`);
            }
        }

        return new Response(JSON.stringify({ success: true, data: result }), { status: 200 });
    } catch (e: any) {
        console.error("[Update Status API Error]:", e);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
    }
};
