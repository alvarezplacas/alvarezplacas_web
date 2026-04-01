import type { APIRoute } from 'astro';
import { createDirectus, rest, createItem, staticToken } from '@directus/sdk';

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

        console.log(`[SaveBudget] Saving budget for client ${cliente_id}`);

        await directusClient.request(createItem('pedidos', {
            cliente_id,
            vendedor_id: vendedor_id || null,
            resumen_visible: resumen,
            leptom_raw: leptom_data,
            total_m2: total_m2 || '0',
            status: 'presupuesto',
            fecha_pedido: new Date().toISOString()
        }));

        return new Response(JSON.stringify({ success: true, message: 'Presupuesto guardado con éxito' }), { status: 201 });

    } catch (e: any) {
        console.error('[SaveBudget Error]:', e);
        return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
    }
};
