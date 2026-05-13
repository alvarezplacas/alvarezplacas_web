/**
 * API: get-cubical.ts
 * Obtiene los proyectos guardados de un cliente.
 */
import { directus } from '@conexiones/directus.js';
import { readItems } from '@directus/sdk';

export const GET = async ({ url }) => {
    try {
        const clientId = url.searchParams.get('clientId');
        
        if (!clientId) {
            return new Response(JSON.stringify({ success: false, message: 'Missing clientId' }), { status: 400 });
        }

        const projects = await directus.request(readItems('cubical_proyectos', {
            filter: { cliente_id: { _eq: parseInt(clientId) } },
            sort: ['-id'],
            limit: 10
        }));

        return new Response(JSON.stringify({ success: true, projects }), { status: 200 });

    } catch (e) {
        console.error("Error fetching CubiCal projects:", e);
        return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
    }
};
