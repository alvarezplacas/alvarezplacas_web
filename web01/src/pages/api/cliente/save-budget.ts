import type { APIRoute } from 'astro';
import { createDirectus, rest, createItem, staticToken, readItem } from '@directus/sdk';

const getEnv = () => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) return (import.meta as any).env;
    return process.env;
};

const env = getEnv();
const DIRECTUS_URL = env.DIRECTUS_URL_INTERNAL || env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const STATIC_TOKEN = env.DIRECTUS_TOKEN || 'sv47_8QErnkx0-EBKFBnAoBw433CJs13';

const directusClient = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const session = cookies.get('client_session')?.value;
        if (!session) {
            return new Response(JSON.stringify({ success: false, message: 'No session' }), { status: 401 });
        }

        const body = await request.json();
        const { cliente_id, vendedor_id, resumen, leptom_data, total_m2 } = body;

        // Validar que el cliente de la sesión sea el mismo que el del body (opcional, por seguridad)
        if (cliente_id !== session) {
             return new Response(JSON.stringify({ success: false, message: 'Invalid session/client mismatch' }), { status: 403 });
        }

        let assignedSellerId = vendedor_id;
        if (!assignedSellerId) {
            try {
                // Fetch the client's assigned seller from Directus
                const client = await directusClient.request(readItem('clientes', cliente_id, {
                    fields: ['vendedor_id']
                })) as any;
                if (client && client.vendedor_id) {
                    assignedSellerId = typeof client.vendedor_id === 'object' ? client.vendedor_id.id : client.vendedor_id;
                }
            } catch (err: any) {
                console.error('[SaveBudget] Error fetching client seller:', err.message);
            }
        }

        console.log(`[SaveBudget] Saving budget for client ${cliente_id} (Seller: ${assignedSellerId})`);

        const newPedido = await directusClient.request(createItem('pedidos', {
            cliente_id,
            vendedor_id: assignedSellerId || null,
            resumen_visible: resumen,
            leptom_raw: leptom_data,
            total_m2: total_m2 || '0',
            status: 'presupuesto',
            fecha_pedido: new Date().toISOString()
        })) as any;

        // --- ENVÍO AUTOMÁTICO DE NOTIFICACIÓN AL VENDEDOR ---
        if (assignedSellerId) {
            try {
                const { CommunicationService } = await import('../../../../Backend/dashboard/logic/communication.js');
                const msgContent = `[Sistema] He guardado un nuevo presupuesto (Pedido #${newPedido.id}) por un total de ${total_m2 || 0} m² para tu revisión.`;
                await CommunicationService.sendMessage(cliente_id.toString(), assignedSellerId.toString(), msgContent, newPedido.id, 'alta');
                console.log(`[SaveBudget] Notificación de chat enviada al vendedor ${assignedSellerId} para pedido ${newPedido.id}`);
            } catch (msgErr: any) {
                console.error('[SaveBudget Notification Error]:', msgErr.message);
            }
        }

        return new Response(JSON.stringify({ success: true, message: 'Presupuesto guardado con éxito', pedidoId: newPedido.id }), { status: 201 });

    } catch (e: any) {
        console.error('[SaveBudget Error]:', e);
        return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
    }
};
