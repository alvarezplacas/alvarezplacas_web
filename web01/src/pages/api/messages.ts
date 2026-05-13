import { CommunicationService } from '../../../Backend/dashboard/logic/communication.js';

/**
 * API handler para mensajería interna.
 * fromId se extrae automáticamente de la cookie de sesión (más seguro).
 * Requiere: toId y content en el body.
 */
export const POST = async ({ request, cookies }: any) => {
    try {
        const body = await request.json();
        const { content, toId, pedidoId, prioridad } = body;

        // fromId SIEMPRE desde la cookie (seguridad: el cliente no puede suplantar a otro)
        const clientSession = cookies.get('client_session')?.value;
        const sellerSession = cookies.get('seller_session')?.value;
        const fromId = clientSession || sellerSession || body.fromId;

        if (!fromId || !toId || !content) {
            console.error('[Messages API] Faltan parámetros:', { fromId: !!fromId, toId: !!toId, content: !!content });
            return new Response(JSON.stringify({ 
                error: 'Faltan parámetros requeridos',
                details: { fromId: !fromId ? 'falta (no hay sesión activa)' : 'OK', toId: !toId ? 'falta' : 'OK', content: !content ? 'falta' : 'OK' }
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const result = await CommunicationService.sendMessage(fromId, toId, content, pedidoId, prioridad || 'media');

        return new Response(JSON.stringify({ success: true, data: result }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });
    } catch (e: any) {
        console.error("[Error en API Messages]:", e);
        return new Response(JSON.stringify({ error: e.message || 'Error interno del servidor' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
