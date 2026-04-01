import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js'; // Use our standard client with token
import { updateItem } from '@directus/sdk';

export const POST: APIRoute = async ({ request, cookies }) => {
    // Basic seller session check
    const sellerSession = cookies.get('seller_session')?.value;
    if (!sellerSession) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { clientId, finStatus, debtAmount, fin_status, debt_amount } = body;

        if (!clientId) {
            return new Response(JSON.stringify({ error: 'Client ID is required' }), { status: 400 });
        }

        // Support both naming conventions
        const finalStatus = finStatus || fin_status;
        const finalAmount = debtAmount !== undefined ? debtAmount : debt_amount;

        const updateData: any = {};
        if (finalStatus !== undefined) updateData.fin_status = finalStatus;
        if (finalAmount !== undefined) updateData.debt_amount = finalAmount;
        updateData.points_updated_at = new Date().toISOString();

        await directus.request(updateItem('clientes', clientId, updateData));

        return new Response(JSON.stringify({ message: 'Estado financiero actualizado' }), { status: 200 });
    } catch (error: any) {
        console.error('Error updating financial status:', error);
        return new Response(JSON.stringify({ error: 'Error interno: ' + error.message }), { status: 500 });
    }
};
