/**
 * API: Envío de mensajes desde el Workspace del Vendedor.
 * POST /api/mensajes/send
 * Body: { fromId, toId, mensaje, prioridad? }
 */
import type { APIRoute } from 'astro';
import { CommunicationService } from '@dashboard/logic/communication.js';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const body = await request.json();
        const { toId, mensaje, prioridad } = body;

        // Siempre usar la cookie de sesión como fuente de identidad (seguridad)
        const sellerSession = cookies.get('seller_session')?.value;
        const clientSession = cookies.get('client_session')?.value;
        const fromId = sellerSession || clientSession || body.fromId;

        if (!fromId || !toId || !mensaje) {
            return new Response(JSON.stringify({ error: 'Faltan parámetros: toId, mensaje' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await CommunicationService.sendMessage(fromId, toId, mensaje, null, prioridad || 'media');

        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[Mensajes/Send API]:', e);
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
};
