import { CommunicationService } from '../../../Backend/dashboard/logic/communication.js';

/**
 * API handler para mensajería interna.
 */
export const POST = async ({ request }) => {
    try {
        const { fromId, toId, content, pedidoId } = await request.json();

        if (!fromId || !toId || !content) {
            return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos' }), { status: 400 });
        }

        const result = await CommunicationService.sendMessage(fromId, toId, content, pedidoId);

        return new Response(JSON.stringify({ success: true, data: result }), { status: 200 });
    } catch (e) {
        console.error("Error en API Messages:", e);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
    }
};
