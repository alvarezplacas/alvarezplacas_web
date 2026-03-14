import type { APIRoute } from 'astro';
import { query } from '@lib/db.js';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { clientId, fin_status, debt_amount, due_date, financial_notes } = body;

        if (!clientId) {
            return new Response(JSON.stringify({ error: 'Client ID is required' }), { status: 400 });
        }

        await query(`
            UPDATE users 
            SET 
                fin_status = $1, 
                debt_amount = $2, 
                due_date = $3, 
                financial_notes = $4,
                points_updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
        `, [
            fin_status || 'clean',
            debt_amount || 0,
            due_date || null,
            financial_notes || '',
            clientId
        ]);

        return new Response(JSON.stringify({ message: 'Estado financiero actualizado con éxito' }), { status: 200 });
    } catch (error) {
        console.error('Error updating financial status:', error);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
    }
};
