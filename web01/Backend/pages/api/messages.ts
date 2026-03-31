import { CommunicationService } from '../../dashboard/logic/communication.js';

export const POST = async ({ request, cookies }: any) => {
    try {
        const body = await request.json();
        const { content, pedidoId } = body;

        let fromId = body.fromId;
        let toId = body.toId;

        // Auto-identify based on cookies if not provided
        const clientSession = cookies.get('client_session')?.value;
        const sellerSession = cookies.get('seller_session')?.value;

        if (clientSession && !fromId) {
            fromId = clientSession;
            // Get assigned seller for this client
            // This is a simplification; in production we'd fetch the seller ID from DB
            // but for now we'll assume the client knows who they are talking to or it's handled by logic.
        } else if (sellerSession && !fromId) {
            fromId = sellerSession;
        }

        if (!fromId || !toId || !content) {
            // If from/to are missing, we might need to fetch them from DB
            // For now, require them or have them in body
            if (!body.fromId || !body.toId) {
                 return new Response(JSON.stringify({ error: 'Faltan destinatarios para el mensaje' }), { status: 400 });
            }
        }

        const result = await CommunicationService.sendMessage(fromId, toId, content, pedidoId);
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
