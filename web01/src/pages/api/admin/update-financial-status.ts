import type { APIRoute } from 'astro';
import { createDirectus, rest, updateItem } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const directus = createDirectus(DIRECTUS_URL).with(rest());

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { clientId, fin_status, debt_amount, due_date, financial_notes } = body;

        if (!clientId) {
            return new Response(JSON.stringify({ error: 'Client ID is required' }), { status: 400 });
        }

        // Actualizar en Directus (colección 'clientes')
        await directus.request(updateItem('clientes', clientId, {
            fin_status: fin_status || 'clean',
            debt_amount: debt_amount || 0,
            due_date: due_date || null,
            financial_notes: financial_notes || '',
            points_updated_at: new Date().toISOString()
        }));

        return new Response(JSON.stringify({ message: 'Estado financiero actualizado con éxito' }), { status: 200 });
    } catch (error: any) {
        console.error('Error updating financial status:', error);
        return new Response(JSON.stringify({ error: 'Error interno del servidor: ' + error.message }), { status: 500 });
    }
};
