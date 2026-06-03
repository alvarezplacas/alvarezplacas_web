import { directus } from '@conexiones/directus.js';
import { updateItem } from '@directus/sdk';

/**
 * API: Actualizar el vendedor asignado al pedido y al cliente de forma permanente.
 * POST /api/admin/update-order-seller
 */
export const POST = async ({ request, cookies }) => {
    const session = cookies.get('admin_session')?.value || cookies.get('seller_session')?.value;
    if (!session) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    try {
        const { pedidoId, clienteId, vendedorId } = await request.json();

        if (!pedidoId || !vendedorId) {
            return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
        }

        const vId = vendedorId === "" || vendedorId === "null" ? null : parseInt(vendedorId);

        // 1. Actualizar el vendedor en el pedido
        const result = await directus.request(updateItem('pedidos', pedidoId, {
            vendedor_id: vId
        }));

        // 2. Actualizar el vendedor del cliente de forma permanente
        if (clienteId) {
            await directus.request(updateItem('clientes', clienteId, {
                vendedor_id: vId
            }));
            console.log(`[Seller Reassignment] Customer ${clienteId} permanently reassigned to seller ${vId}`);
        }

        return new Response(JSON.stringify({ success: true, data: result }), { status: 200 });
    } catch (e: any) {
        console.error("[Update Seller API Error]:", e);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
    }
};
